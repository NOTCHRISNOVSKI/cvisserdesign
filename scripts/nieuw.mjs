// Vragenlijst om content toe te voegen.
//   npm run nieuw                       interactief (stelt vragen)
//   npm run nieuw -- --from antw.json   zonder vragen, antwoorden uit een JSON-bestand
//
// Leg je foto's en video's eerst in content/inbox/ (bijvoorbeeld via de bestandsboom van CloudCLI).
import { copyFile, mkdir, readdir, rename, rm, stat, unlink, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { CATEGORIES, contentDir, generate } from './content.mjs'

const run = promisify(execFile)
const inbox = path.join(contentDir, 'inbox')
const workDir = path.join(contentDir, 'work')
const showreelDir = path.join(contentDir, 'showreel')

const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const VIDEO = new Set(['.mp4', '.webm', '.m4v', '.mov'])
const MAX_FILE_MB = 90 // GitHub weigert bestanden boven 100 MB
const ext = (f) => path.extname(f).toLowerCase()
const mb = (bytes) => Math.round(bytes / 1024 / 1024)

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

async function inboxFiles() {
  if (!existsSync(inbox)) return []
  const names = (await readdir(inbox)).filter((f) => !f.startsWith('.'))
  const files = []
  for (const name of names.sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }))) {
    const s = await stat(path.join(inbox, name))
    if (s.isFile() && (IMAGE.has(ext(name)) || VIDEO.has(ext(name)))) files.push({ name, size: s.size })
  }
  return files
}

async function move(from, to) {
  try {
    await rename(from, to)
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    await copyFile(from, to)
    await unlink(from)
  }
}

// Zet een video om naar een webvriendelijke mp4 als hij te groot is of geen mp4 is
async function webVideo(file, { force = false, crf = 23 } = {}) {
  const size = (await stat(file)).size
  if (!force && ext(file) === '.mp4' && size < 40 * 1024 * 1024) return file
  const dir = path.dirname(file)
  const tmp = path.join(dir, `.tmp-${Date.now()}.mp4`)
  const final = path.join(dir, `${path.basename(file, ext(file))}.mp4`)
  console.log(`  ${path.basename(file)} (${mb(size)} MB) wordt omgezet naar een webvriendelijke mp4, even geduld...`)
  await run('ffmpeg', ['-y', '-v', 'error', '-i', file, '-vf', "scale='min(1920,iw)':-2", '-c:v', 'libx264', '-crf', String(crf), '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', tmp], { maxBuffer: 1024 * 1024 * 50 })
  await rm(file)
  await rename(tmp, final)
  console.log(`  klaar: ${path.basename(final)} (${mb((await stat(final)).size)} MB)`)
  return final
}

function parseCategories(input) {
  const wanted = String(input)
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map((t) => (/^\d$/.test(t) ? CATEGORIES[Number(t) - 1] : t.toLowerCase()))
    .map((t) => (t === 'photo' || t === 'foto’s' || t === 'fotos' ? 'foto' : t))
  return [...new Set(wanted.filter((t) => CATEGORIES.includes(t)))]
}

// Optionele Engelse variant van de teksten
function cleanEnglish(en) {
  if (!en || typeof en !== 'object') return undefined
  const out = {}
  for (const key of ['title', 'caption', 'role', 'client', 'description']) if (typeof en[key] === 'string' && en[key].trim()) out[key] = en[key].trim()
  return Object.keys(out).length ? out : undefined
}

async function createWork(data) {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('Een titel is verplicht.')
  const categories = parseCategories([].concat(data.categories ?? []).join(','))
  if (!categories.length) throw new Error(`Kies minstens één categorie: ${CATEGORIES.join(', ')}.`)

  const files = [].concat(data.files ?? [])
  const links = [].concat(data.videoUrl ?? []).filter(Boolean)
  if (!files.length && !links.length) throw new Error('Voeg minstens één bestand uit content/inbox/ of een YouTube/Vimeo-link toe.')
  for (const f of files) if (!existsSync(path.join(inbox, f))) throw new Error(`Bestand niet gevonden in content/inbox/: ${f}`)

  const year = String(data.year || new Date().getFullYear())
  let slug = `${year}-${slugify(title) || 'werk'}`
  for (let n = 2; existsSync(path.join(workDir, slug)); n++) slug = `${year}-${slugify(title)}-${n}`
  const dir = path.join(workDir, slug)
  await mkdir(dir, { recursive: true })

  const placed = []
  for (const f of files) {
    const target = path.join(dir, f)
    await move(path.join(inbox, f), target)
    placed.push(VIDEO.has(ext(f)) ? path.basename(await webVideo(target)) : f)
  }
  for (const f of placed) {
    const size = (await stat(path.join(dir, f))).size
    if (size > MAX_FILE_MB * 1024 * 1024) console.warn(`\x1b[33mLet op: ${f} is ${mb(size)} MB. GitHub accepteert geen bestanden boven 100 MB; gebruik liever een YouTube/Vimeo-link.\x1b[0m`)
  }

  const info = {
    title,
    categories,
    caption: String(data.caption || '').trim(),
    year,
    client: String(data.client || '').trim(),
    role: String(data.role || '').trim(),
    description: String(data.description || '').trim(),
    featured: Boolean(data.featured),
    videoUrl: links.length ? links : undefined,
    cover: data.cover && placed.includes(data.cover) ? data.cover : undefined,
    en: cleanEnglish(data.en),
  }
  for (const key of Object.keys(info)) if (info[key] === '' || info[key] === false || info[key] === undefined) delete info[key]
  await writeFile(path.join(dir, 'info.json'), `${JSON.stringify(info, null, 2)}\n`)
  return slug
}

// variant 'mobiel' = verticale versie voor telefoons (content/showreel/mobiel/)
async function replaceShowreel(file, variant = '') {
  if (!file || !existsSync(path.join(inbox, file))) throw new Error(`Bestand niet gevonden in content/inbox/: ${file}`)
  const dir = variant === 'mobiel' ? path.join(showreelDir, 'mobiel') : showreelDir
  await mkdir(dir, { recursive: true })
  // Alleen losse bestanden opruimen; de map "mobiel" blijft staan
  for (const old of await readdir(dir, { withFileTypes: true })) {
    if (old.isFile() && !old.name.startsWith('.') && !/^LEESMIJ/i.test(old.name)) await rm(path.join(dir, old.name), { force: true })
  }
  const target = path.join(dir, `showreel${ext(file)}`)
  await move(path.join(inbox, file), target)
  const final = await webVideo(target, { force: ext(file) !== '.mp4' || (await stat(target)).size > 60 * 1024 * 1024, crf: 22 })
  if (path.basename(final) !== 'showreel.mp4') await rename(final, path.join(dir, 'showreel.mp4'))
}

/* ---------- Interactief ---------- */
async function interactive() {
  const rl = createInterface({ input: stdin, output: stdout })
  const lines = rl[Symbol.asyncIterator]() // werkt ook als meerdere regels tegelijk binnenkomen
  const ask = async (q, def = '') => {
    stdout.write(def ? `${q} [${def}]: ` : `${q}: `)
    const { value, done } = await lines.next()
    if (done) throw new Error('Geen invoer meer ontvangen.')
    return String(value).trim() || def
  }
  const yes = async (q, def = false) => /^(j|ja|y|yes)$/i.test(await ask(`${q} (j/n)`, def ? 'j' : 'n'))

  try {
    console.log('\nWat wil je doen?\n  1) Nieuw werk toevoegen\n  2) Showreel vervangen\n  3) Showreel voor telefoon vervangen (verticaal)\n')
    const action = await ask('Kies 1 of 2', '1')

    const files = await inboxFiles()
    if (files.length) {
      console.log('\nBestanden in content/inbox/:')
      files.forEach((f, i) => console.log(`  ${i + 1}) ${f.name} (${mb(f.size)} MB)`))
    } else {
      console.log('\ncontent/inbox/ is leeg. Je kunt ook een YouTube/Vimeo-link gebruiken.')
    }

    if (action === '2' || action === '3') {
      const n = Number(await ask('Nummer van het showreel-bestand', files.length === 1 ? '1' : ''))
      await replaceShowreel(files[n - 1]?.name, action === '3' ? 'mobiel' : '')
      console.log(action === '3' ? '\nShowreel voor telefoon vervangen.' : '\nShowreel vervangen.')
    } else {
      const pick = files.length ? await ask('\nWelke bestanden horen bij dit werk? (nummers, bijv. 1,2,3; Enter = alle)', files.map((_, i) => i + 1).join(',')) : ''
      const chosen = pick
        .split(/[,\s]+/)
        .map((n) => files[Number(n) - 1]?.name)
        .filter(Boolean)

      console.log('\nCategorieën: 1) design  2) video  3) foto  (meerdere mag, bijv. 1,3)')
      const data = {
        files: chosen,
        title: await ask('Titel van het werk'),
        categories: parseCategories(await ask('Categorie')),
        caption: await ask('Korte caption (één zin die onder het werk staat)'),
        year: await ask('Jaar', String(new Date().getFullYear())),
        client: await ask('Klant of opdrachtgever (Enter = overslaan)'),
        role: await ask('Jouw rol, bijv. "Regie, montage" (Enter = overslaan)'),
        description: await ask('Beschrijving, optioneel (Enter = overslaan)'),
        videoUrl: await ask('YouTube- of Vimeo-link, optioneel (Enter = overslaan)'),
      }
      if (await yes('Ook een Engelse versie van de teksten invullen?')) {
        data.en = {
          title: await ask('English title (Enter = zelfde als Nederlands)'),
          caption: await ask('English caption'),
          role: await ask('English role'),
          description: await ask('English description (optioneel)'),
        }
      }
      const images = chosen.filter((f) => IMAGE.has(ext(f)))
      if (images.length > 1) data.cover = (await ask(`Cover-afbeelding (Enter = ${images[0]})`, images[0])) || images[0]
      data.featured = await yes('Uitgelicht tonen (grote tegel op de werkpagina)?')

      const slug = await createWork(data)
      console.log(`\nToegevoegd: content/work/${slug}/`)
    }
  } finally {
    rl.close()
  }
}

async function main() {
  const i = process.argv.indexOf('--from')
  if (i > -1) {
    const data = JSON.parse(await readFile(process.argv[i + 1], 'utf8'))
    if (data.action === 'showreel' || data.action === 'showreel-mobiel') {
      await replaceShowreel(data.file, data.action === 'showreel-mobiel' ? 'mobiel' : '')
      console.log(data.action === 'showreel-mobiel' ? 'Showreel voor telefoon vervangen.' : 'Showreel vervangen.')
    } else {
      console.log(`Toegevoegd: content/work/${await createWork(data)}/`)
    }
  } else {
    await interactive()
  }
  await generate()
  console.log('\nKijk het resultaat op https://preview.cvisserdesign.nl/work/ (verversen gaat vanzelf).')
}

main().catch((err) => {
  console.error(`\nFout: ${err.message}`)
  process.exit(1)
})
