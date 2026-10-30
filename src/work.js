import './common.js'

const grid = document.getElementById('grid')
const filtersEl = document.getElementById('filters')
const countEl = document.getElementById('count')
const emptyEl = document.getElementById('empty')

const LABELS = { design: 'Design', video: 'Video', foto: 'Foto' }
const ROW = 8 // moet gelijk zijn aan grid-auto-rows in de CSS
const GAP = 16 // ruimte tussen de tegels
const CAPTION = 60 // hoogte van het bijschrift onder een tegel
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

let items = []
let tiles = []
let active = 'all'
let viewer = null
let lastFocus = null

// Kleine helper om elementen te maken zonder innerHTML (veilig voor tekst uit info.json)
function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value === true ? '' : value)
  }
  node.append(...kids.flat(Infinity).filter(Boolean))
  return node
}

const matches = (item) => active === 'all' || item.categories.includes(active)
const labelOf = (item) => item.categories.map((c) => LABELS[c] ?? c).join(' · ')

/* ---------- Raster ---------- */
function buildTile(item, index) {
  const ratio = item.featured ? 16 / 9 : clamp(item.cover ? item.cover.w / item.cover.h : 16 / 9, 0.75, 1.78)
  const frame = el('div', { class: 'frame', style: `aspect-ratio:${ratio}` })

  if (item.cover) {
    if (item.cover.lqip) frame.style.backgroundImage = `url("${item.cover.lqip}")`
    frame.append(
      el('img', {
        src: item.cover.src,
        srcset: item.cover.srcset,
        sizes: item.featured ? '(min-width: 900px) 66vw, 100vw' : '(min-width: 900px) 34vw, (min-width: 560px) 50vw, 100vw',
        width: item.cover.w,
        height: item.cover.h,
        alt: item.title,
        loading: index < 6 ? 'eager' : 'lazy',
        decoding: 'async',
      }),
    )
  }

  const firstVideo = item.media.find((m) => m.type === 'video')
  if (item.categories.includes('video')) frame.append(el('span', { class: 'badge', 'aria-hidden': 'true', text: '▶' }))

  // Bij hoveren: stille preview van de video (alleen met een muis)
  if (firstVideo && matchMedia('(hover: hover)').matches) {
    let preview = null
    const start = () => {
      if (preview) return
      preview = el('video', { class: 'preview', src: firstVideo.src, muted: true, loop: true, playsinline: true, preload: 'auto' })
      preview.muted = true
      frame.append(preview)
      preview.play().catch(() => {})
    }
    const stop = () => {
      preview?.remove()
      preview = null
    }
    frame.addEventListener('mouseenter', start)
    frame.addEventListener('mouseleave', stop)
  }

  const meta = [labelOf(item), item.year].filter(Boolean).join(' · ')
  const node = el(
    'a',
    { class: `tile${item.featured ? ' wide' : ''}`, href: `#${item.slug}`, 'data-ratio': ratio },
    frame,
    el('div', { class: 'caption' }, el('h2', { text: item.title }), el('p', { text: item.caption ? `${meta} — ${item.caption}` : meta })),
  )
  return node
}

function layout() {
  for (const tile of tiles) {
    if (tile.hidden) continue
    const width = tile.getBoundingClientRect().width
    const height = width / Number(tile.dataset.ratio) + CAPTION
    tile.style.gridRowEnd = `span ${Math.ceil((height + GAP) / ROW)}`
  }
}

function apply() {
  const visible = items.filter(matches)
  let n = 0
  tiles.forEach((tile, i) => {
    const show = matches(items[i])
    tile.hidden = !show
    if (show) {
      tile.style.setProperty('--i', String(Math.min(n++, 12)))
      tile.style.animation = 'none'
      void tile.offsetWidth
      tile.style.animation = ''
    }
  })
  layout()
  emptyEl.hidden = visible.length > 0
  countEl.textContent = `${visible.length} ${visible.length === 1 ? 'project' : 'projecten'}`
  for (const b of filtersEl.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.filter === active))
}

function setFilter(name, push = true) {
  active = name
  if (push) {
    const url = new URL(location.href)
    if (name === 'all') url.searchParams.delete('filter')
    else url.searchParams.set('filter', name)
    history.replaceState(null, '', url)
  }
  apply()
}

function buildFilters() {
  const present = ['design', 'video', 'foto'].filter((c) => items.some((i) => i.categories.includes(c)))
  filtersEl.replaceChildren()
  if (present.length < 2) {
    filtersEl.hidden = true
    return
  }
  for (const name of ['all', ...present]) {
    const n = name === 'all' ? items.length : items.filter((i) => i.categories.includes(name)).length
    filtersEl.append(
      el('button', { type: 'button', 'data-filter': name, 'aria-pressed': 'false', onclick: () => setFilter(name) }, name === 'all' ? 'Alles' : LABELS[name], el('sup', { text: String(n) })),
    )
  }
}

/* ---------- Detailweergave ---------- */
function renderMedia(m, title) {
  if (m.type === 'image') {
    return el('img', { src: m.src, srcset: m.srcset, sizes: '(min-width: 900px) 70vw, 100vw', width: m.w, height: m.h, alt: title, loading: 'lazy', decoding: 'async', style: `aspect-ratio:${m.w}/${m.h}` })
  }
  if (m.type === 'video') {
    return el('video', { src: m.src, poster: m.poster?.src, controls: true, playsinline: true, preload: 'metadata', style: `aspect-ratio:${m.w}/${m.h}` })
  }
  return el('iframe', { src: m.url, title, loading: 'lazy', allow: 'fullscreen; picture-in-picture; encrypted-media', allowfullscreen: true })
}

function closeViewer() {
  if (!viewer) return
  viewer.remove()
  viewer = null
  document.body.classList.remove('locked')
  if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  lastFocus?.focus?.()
}

function openViewer(slug) {
  const item = items.find((i) => i.slug === slug)
  if (!item) return closeViewer()
  if (!matches(item)) setFilter('all')

  const list = items.filter(matches)
  const at = list.indexOf(item)
  const prev = list[(at - 1 + list.length) % list.length]
  const next = list[(at + 1) % list.length]

  const meta = [
    ['Jaar', item.year],
    ['Klant', item.client],
    ['Rol', item.role],
    ['Categorie', labelOf(item)],
  ].filter(([, v]) => v)

  const info = el(
    'aside',
    { class: 'viewer-info' },
    el('h2', { text: item.title }),
    item.caption && el('p', { class: 'lead', text: item.caption }),
    el('dl', { class: 'meta' }, meta.map(([k, v]) => [el('dt', { text: k }), el('dd', { class: k === 'Categorie' ? 'cat' : '', text: v })])),
    item.description && el('div', { class: 'desc' }, item.description.split(/\n\s*\n/).map((p) => el('p', { text: p }))),
    list.length > 1 && el('nav', { class: 'viewer-nav', 'aria-label': 'Ander werk' }, el('a', { href: `#${prev.slug}`, text: '← Vorige' }), el('a', { href: `#${next.slug}`, text: 'Volgende →' })),
  )
  const closeBtn = el('button', { class: 'viewer-close', type: 'button', onclick: closeViewer }, 'Sluiten ✕')
  const fresh = el(
    'div',
    { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': item.title },
    closeBtn,
    el('div', { class: 'viewer-body' }, el('div', { class: 'viewer-media' }, item.media.map((m) => renderMedia(m, item.title))), info),
  )

  const wasOpen = Boolean(viewer)
  viewer?.remove()
  viewer = fresh
  if (!wasOpen) lastFocus = document.activeElement
  document.body.append(fresh)
  document.body.classList.add('locked')
  if (wasOpen) fresh.classList.add('open')
  else requestAnimationFrame(() => fresh.classList.add('open'))
  closeBtn.focus({ preventScroll: true })
  document.title = `${item.title} | CVisser Design`
}

function route() {
  const slug = decodeURIComponent(location.hash.slice(1))
  if (slug) openViewer(slug)
  else {
    closeViewerSilently()
  }
}

function closeViewerSilently() {
  if (!viewer) return
  viewer.remove()
  viewer = null
  document.body.classList.remove('locked')
  document.title = 'Werk | CVisser Design'
  lastFocus?.focus?.()
}

addEventListener('hashchange', route)
addEventListener('keydown', (e) => {
  if (!viewer) return
  if (e.key === 'Escape') closeViewer()
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const links = viewer.querySelectorAll('.viewer-nav a')
    if (links.length === 2) location.hash = links[e.key === 'ArrowRight' ? 1 : 0].getAttribute('href')
  }
})

/* ---------- Start ---------- */
async function start() {
  try {
    const res = await fetch('/work.json', { cache: 'no-cache' })
    items = await res.json()
  } catch {
    items = []
  }

  const wanted = new URLSearchParams(location.search).get('filter')
  tiles = items.map(buildTile)
  grid.replaceChildren(...tiles)
  buildFilters()
  if (wanted && items.some((i) => i.categories.includes(wanted))) active = wanted
  apply()

  let lastWidth = grid.clientWidth
  new ResizeObserver(() => {
    if (grid.clientWidth !== lastWidth) {
      lastWidth = grid.clientWidth
      layout()
    }
  }).observe(grid)

  route()
}

start()
