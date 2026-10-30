// Verwerkt de map content/ tot alles wat de site nodig heeft:
//   public/work.json         de lijst met werk (titels, captions, media)
//   public/media/<slug>/...  webp-formaten, posters en video's
// Wordt automatisch gedraaid door Vite (dev en build) en met `npm run content`.
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'

const run = promisify(execFile)

export const root = path.resolve(import.meta.dirname, '..')
export const contentDir = path.join(root, 'content')
const workDir = path.join(contentDir, 'work')
const showreelDir = path.join(contentDir, 'showreel')
const outDir = path.join(root, 'public', 'media')
const workJson = path.join(root, 'public', 'work.json')

export const CATEGORIES = ['design', 'video', 'foto']
const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const VIDEO = new Set(['.mp4', '.webm', '.m4v', '.mov'])
const WIDTHS = [640, 1280, 2000]

const warn = (msg) => console.warn(`\x1b[33m[content] ${msg}\x1b[0m`)
const ext = (file) => path.extname(file).toLowerCase()
const natural = (a, b) => a.localeCompare(b, 'nl', { numeric: true })

async function mtime(file) {
  try {
    return (await stat(file)).mtimeMs
  } catch {
    return 0
  }
}

// Gebruik het bewaarde resultaat als het nieuwer is dan het bronbestand
async function cached(source, cacheFile, build) {
  if ((await mtime(cacheFile)) >= (await mtime(source)) && existsSync(cacheFile)) {
    try {
      return JSON.parse(await readFile(cacheFile, 'utf8'))
    } catch {}
  }
  const result = await build()
  await writeFile(cacheFile, JSON.stringify(result))
  return result
}

async function processImage(file, folder, urlBase, base) {
  return cached(file, path.join(folder, `${base}.json`), async () => {
    const meta = await sharp(file, { failOn: 'none' }).metadata()
    const swap = (meta.orientation || 1) >= 5
    const ow = swap ? meta.height : meta.width
    const oh = swap ? meta.width : meta.height

    const sizes = WIDTHS.filter((w) => w < ow)
    sizes.push(Math.min(ow, WIDTHS.at(-1)))
    const widths = [...new Set(sizes)]

    for (const w of widths) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(folder, `${base}-${w}.webp`))
    }
    const tiny = await sharp(file, { failOn: 'none' }).rotate().resize({ width: 16 }).webp({ quality: 40 }).toBuffer()

    const url = (w) => `${urlBase}/${base}-${w}.webp`
    return {
      src: url(widths.at(-1)),
      srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
      w: ow,
      h: oh,
      lqip: `data:image/webp;base64,${tiny.toString('base64')}`,
    }
  })
}

async function probe(file) {
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', file])
    const [w, h] = stdout.trim().split('x').map(Number)
    return w && h ? { w, h } : { w: 1920, h: 1080 }
  } catch {
    return { w: 1920, h: 1080 }
  }
}

async function posterFrom(video, folder, urlBase, base) {
  const tmp = path.join(folder, `${base}-frame.jpg`)
  for (const at of ['1', '0']) {
    try {
      await run('ffmpeg', ['-y', '-v', 'error', '-ss', at, '-i', video, '-frames:v', '1', '-q:v', '2', tmp])
    } catch {}
    if (existsSync(tmp)) break
  }
  if (!existsSync(tmp)) return null
  const poster = await processImage(tmp, folder, urlBase, `${base}-poster`)
  await rm(tmp, { force: true })
  return poster
}

async function processVideo(file, folder, urlBase, base) {
  const name = `${base}${ext(file)}`
  const target = path.join(folder, name)
  const [a, b] = await Promise.all([stat(file), stat(target).catch(() => null)])
  if (!b || b.size !== a.size) await copyFile(file, target)

  const info = await cached(file, path.join(folder, `${base}.json`), async () => {
    const { w, h } = await probe(file)
    return { w, h, poster: await posterFrom(file, folder, urlBase, base) }
  })
  if (ext(file) === '.mov') warn(`${path.basename(file)} is een .mov; dat speelt niet overal. Zet hem om naar .mp4 (npm run nieuw doet dat automatisch).`)
  return { type: 'video', src: `${urlBase}/${name}`, ...info }
}

function parseEmbed(raw) {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (host.endsWith('youtube.com')) id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1]
    if (id) return { type: 'embed', provider: 'youtube', url: `https://www.youtube-nocookie.com/embed/${id}` }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const m = u.pathname.match(/(\d{6,})(?:\/([a-z0-9]+))?/i)
      const hash = m?.[2] || u.searchParams.get('h')
      if (m) return { type: 'embed', provider: 'vimeo', url: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ''}` }
    }
  } catch {}
  return null
}

function cleanCategories(info) {
  const raw = [].concat(info.categories ?? info.category ?? [])
  const mapped = raw.map((c) => String(c).trim().toLowerCase()).map((c) => (c === 'photo' || c === 'foto’s' ? 'foto' : c))
  return [...new Set(mapped.filter((c) => CATEGORIES.includes(c)))]
}

async function loadWork(slugs) {
  if (!existsSync(workDir)) return []
  const dirs = (await readdir(workDir, { withFileTypes: true })).filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  const items = []

  for (const d of dirs) {
    const dir = path.join(workDir, d.name)
    const infoPath = path.join(dir, 'info.json')
    if (!existsSync(infoPath)) {
      warn(`${d.name}: info.json ontbreekt, overgeslagen.`)
      continue
    }
    let info
    try {
      info = JSON.parse(await readFile(infoPath, 'utf8'))
    } catch (err) {
      warn(`${d.name}: info.json is geen geldige JSON (${err.message}), overgeslagen.`)
      continue
    }
    if (!info.title) {
      warn(`${d.name}: "title" ontbreekt, overgeslagen.`)
      continue
    }
    const categories = cleanCategories(info)
    if (!categories.length) {
      warn(`${d.name}: kies minstens één categorie (${CATEGORIES.join(', ')}), overgeslagen.`)
      continue
    }

    const outFolder = path.join(outDir, d.name)
    await mkdir(outFolder, { recursive: true })
    const urlBase = `/media/${d.name}`
    slugs.add(d.name)

    const files = (await readdir(dir)).filter((f) => !f.startsWith('.') && f !== 'info.json')
    const wanted = Array.isArray(info.media) ? info.media : files.filter((f) => IMAGE.has(ext(f)) || VIDEO.has(ext(f))).sort(natural)
    const media = []
    const byFile = new Map()

    for (const f of wanted) {
      const full = path.join(dir, f)
      if (!existsSync(full)) {
        warn(`${d.name}: bestand "${f}" uit info.json bestaat niet.`)
        continue
      }
      const base = path.basename(f, ext(f)).replace(/[^\w-]+/g, '_')
      if (IMAGE.has(ext(f))) {
        const img = await processImage(full, outFolder, urlBase, base)
        const m = { type: 'image', ...img }
        media.push(m)
        byFile.set(f, img)
      } else if (VIDEO.has(ext(f))) {
        const vid = await processVideo(full, outFolder, urlBase, base)
        media.push(vid)
        byFile.set(f, vid.poster)
      } else {
        warn(`${d.name}: "${f}" heeft een niet-ondersteund formaat.`)
      }
    }

    const embeds = [].concat(info.videoUrl ?? []).map((u) => {
      const e = parseEmbed(u)
      if (!e) warn(`${d.name}: video-link niet herkend (alleen YouTube en Vimeo): ${u}`)
      return e
    })
    media.unshift(...embeds.filter(Boolean))

    let cover = info.cover ? byFile.get(info.cover) : null
    if (info.cover && !cover) warn(`${d.name}: cover "${info.cover}" niet gevonden, automatische cover gebruikt.`)
    cover ??= media.find((m) => m.type === 'image') ?? media.find((m) => m.type === 'video')?.poster ?? null
    if (cover) cover = { src: cover.src, srcset: cover.srcset, w: cover.w, h: cover.h, lqip: cover.lqip }
    if (!media.length) {
      warn(`${d.name}: geen media gevonden, overgeslagen.`)
      continue
    }

    items.push({
      slug: d.name,
      title: String(info.title),
      categories,
      caption: info.caption ? String(info.caption) : '',
      year: info.year ? String(info.year) : d.name.match(/^(\d{4})/)?.[1] || '',
      client: info.client ? String(info.client) : '',
      role: info.role ? String(info.role) : '',
      description: info.description ? String(info.description) : '',
      featured: Boolean(info.featured),
      order: Number.isFinite(info.order) ? info.order : null,
      cover,
      media,
    })
  }

  // Eerst handmatige volgorde (order), anders nieuwste map bovenaan
  return items.sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order
    if (a.order != null) return -1
    if (b.order != null) return 1
    return b.slug.localeCompare(a.slug, 'nl', { numeric: true })
  })
}

async function loadShowreel(slugs) {
  if (!existsSync(showreelDir)) return null
  const files = (await readdir(showreelDir)).filter((f) => !f.startsWith('.'))
  const video = files.filter((f) => VIDEO.has(ext(f))).sort(natural)[0]
  if (!video) return null

  const folder = path.join(outDir, 'showreel')
  await mkdir(folder, { recursive: true })
  slugs.add('showreel')
  const src = path.join(showreelDir, video)
  const reel = await processVideo(src, folder, '/media/showreel', 'showreel')

  const posterFile = files.find((f) => /^poster\.(jpe?g|png|webp)$/i.test(f))
  const poster = posterFile ? await processImage(path.join(showreelDir, posterFile), folder, '/media/showreel', 'poster') : reel.poster
  return { src: reel.src, poster: poster?.src ?? '', w: reel.w, h: reel.h }
}

export async function generate() {
  await mkdir(outDir, { recursive: true })
  const slugs = new Set()
  const work = await loadWork(slugs)
  const showreel = await loadShowreel(slugs)

  // Ruim gegenereerde mappen op van werk dat niet meer bestaat
  for (const d of await readdir(outDir, { withFileTypes: true })) {
    if (d.isDirectory() && !slugs.has(d.name)) await rm(path.join(outDir, d.name), { recursive: true, force: true })
  }

  const json = JSON.stringify(work)
  if ((await readFile(workJson, 'utf8').catch(() => '')) !== json) await writeFile(workJson, json)

  console.log(`[content] ${work.length} werk${work.length === 1 ? '' : 'en'}, showreel: ${showreel ? 'ja' : 'nee'}`)
  return { work, showreel }
}

// `node scripts/content.mjs` (of npm run content)
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  generate().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
