import './common.js'
import { getLang, t } from './i18n.js'

const titleEl = document.getElementById('about-title')
const textEl = document.getElementById('about-text')
const portraitEl = document.getElementById('portrait')

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else node.setAttribute(key, value)
  }
  node.append(...kids.flat(Infinity).filter(Boolean))
  return node
}

let data = null

function render() {
  if (!data) return
  const c = data[getLang()] ?? data.nl
  if (!c) return

  // Laatste leesteken (bijv. het vraagteken) in het accentgroen
  const m = c.title.match(/^(.*?)([?!.]+)$/)
  titleEl.replaceChildren(...(m ? [el('span', { text: m[1] }), el('span', { class: 'dot', text: m[2] })] : [c.title]))

  const sections = (c.sections ?? []).map((s) =>
    el(
      'section',
      { class: `about-section${s.highlight ? ' highlight' : ''}` },
      s.heading && el('h2', { text: s.heading }),
      String(s.text ?? '')
        .split(/\n\s*\n/)
        .map((p) => el('p', { text: p })),
    ),
  )
  textEl.replaceChildren(...[c.lead && el('p', { class: 'about-lead', text: c.lead }), ...sections].filter(Boolean))

  if (data.portrait) {
    portraitEl.replaceChildren(
      el('img', { src: data.portrait.src, srcset: data.portrait.srcset, sizes: '(min-width: 900px) 40vw, 100vw', width: data.portrait.w, height: data.portrait.h, alt: t('about.portrait'), decoding: 'async' }),
    )
  }
}

async function start() {
  try {
    data = await (await fetch('/about.json', { cache: 'no-cache' })).json()
  } catch {
    data = null
  }
  render()
  addEventListener('langchange', render)
}

start()
