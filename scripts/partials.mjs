// Gedeelde stukken HTML (header en footer) die Vite in elke pagina invoegt.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { root } from './content.mjs'

const logoPath = readFileSync(path.join(root, 'public', 'favicon.svg'), 'utf8').match(/d="([^"]*)"/)?.[1] ?? ''

const FLAG_NL = `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="flag-nl"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#flag-nl)"><rect width="24" height="8" fill="#ae1c28"/><rect y="8" width="24" height="8" fill="#fff"/><rect y="16" width="24" height="8" fill="#21468b"/></g></svg>`
const FLAG_EN = `<svg viewBox="0 0 24 24" aria-hidden="true"><clipPath id="flag-en"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#flag-en)"><rect width="24" height="24" fill="#012169"/><path d="M0 0 24 24M24 0 0 24" stroke="#fff" stroke-width="4"/><path d="M0 0 24 24M24 0 0 24" stroke="#c8102e" stroke-width="1.6"/><path d="M12 0v24M0 12h24" stroke="#fff" stroke-width="7"/><path d="M12 0v24M0 12h24" stroke="#c8102e" stroke-width="4"/></g></svg>`

const LINKS = [
  ['home', '/', 'nav.showreel', 'Showreel'],
  ['work', '/work/', 'nav.work', 'Werk'],
  ['about', '/about/', 'nav.about', 'Ken je mij?'],
  ['contact', '/contact/', 'nav.contact', 'Contact'],
]

export function header(page) {
  const links = LINKS.map(([id, href, key, label]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}><span data-i18n="${key}">${label}</span></a>`).join('\n          ')
  const reel =
    page === 'home'
      ? `\n          <button id="sound" type="button" aria-pressed="false"><span data-i18n="home.soundOn">Geluid aan</span></button>\n          <button id="play" type="button" hidden><span data-i18n="home.play">Afspelen</span></button>`
      : ''
  return `<header class="bar${page === 'home' ? '' : ' solid'}">
      <a class="brand" href="/" aria-label="CVisser Design"><svg viewBox="0 0 360 220" aria-hidden="true"><path d="${logoPath}" /></svg><span>CVisser</span></a>
      <div class="bar-right">
        <nav id="menu" aria-label="Menu" data-i18n-attr="aria-label:nav.menu">
          ${links}${reel}
        </nav>
        <div class="lang" role="group" aria-label="Taal" data-i18n-attr="aria-label:lang.label">
          <button type="button" data-lang="nl" aria-pressed="true" aria-label="Nederlands" title="Nederlands">${FLAG_NL}</button>
          <button type="button" data-lang="en" aria-pressed="false" aria-label="English" title="English">${FLAG_EN}</button>
        </div>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu" data-i18n-attr="aria-label:nav.menu"><span></span><span></span></button>
      </div>
    </header>`
}

export function footer() {
  return `<footer class="foot">
      <div>
        <p class="foot-title" data-i18n="foot.title">Samenwerken?</p>
        <p class="foot-links">
          <a href="mailto:christiaanv2004@gmail.com">christiaanv2004@gmail.com</a>
          <a href="tel:+31624432753">+31 6 24432753</a>
        </p>
      </div>
      <p class="foot-small" data-i18n="foot.rights">© 2026 CVisser Design</p>
    </footer>`
}

// Laadscherm: schuine lijnen die voorbijkomen. Staat in de HTML zodat het direct zichtbaar is.
// De bijbehorende logica staat in src/loader.js.
const LOADER_LINES = [
  // [positie y, dikte, lengte, kleur, duur (s), vertraging (s), gloed]
  [-380, 1, 700, '#a7c818', 2.1, -0.3],
  [-250, 2, 1100, '#f4f4f6', 1.5, -1.1],
  [-120, 1, 800, '#a7c818', 2.6, -2.0],
  [10, 6, 900, '#a7c818', 1.7, -0.6, true],
  [120, 1, 1200, '#f4f4f6', 1.3, -0.9],
  [230, 2, 600, '#a7c818', 2.3, -1.6],
  [340, 1, 1000, '#a7c818', 1.9, -0.1],
  [450, 12, 1300, '#a7c818', 1.4, -1.0, true],
  [560, 1, 700, '#f4f4f6', 2.4, -2.2],
  [670, 3, 900, '#a7c818', 1.6, -0.4],
  [780, 1, 1100, '#a7c818', 2.0, -1.4],
  [890, 2, 800, '#f4f4f6', 1.2, -0.8],
  [1000, 1, 1000, '#a7c818', 2.5, -1.9],
  [1110, 5, 700, '#a7c818', 1.8, -0.2, true],
  [1230, 1, 1200, '#f4f4f6', 1.45, -1.25],
  [1340, 2, 900, '#a7c818', 2.2, -0.7],
]

export function loader() {
  const lines = LOADER_LINES.map(
    ([y, h, len, color, t, d, glow]) => `<rect class="l${glow ? ' glow' : ''}" x="0" y="${y}" width="${len}" height="${h}" fill="${color}" style="--t:${t}s;--d:${d}s" />`,
  ).join('')
  return `<style>
#loader{position:fixed;inset:0;z-index:100;background:#000;overflow:hidden;clip-path:polygon(0 0,130% 0,100% 100%,0 100%);transition:clip-path .9s cubic-bezier(.77,0,.18,1)}
#loader.done{clip-path:polygon(130% 0,130% 0,100% 100%,100% 100%)}
#loader svg.lines{position:absolute;inset:0;width:100%;height:100%}
#loader .l{transform-box:fill-box;animation:ld-pass var(--t) linear infinite;animation-delay:var(--d)}
#loader.leaving .l{animation-duration:.55s}
#loader .glow{filter:drop-shadow(0 0 14px #a7c818)}
#loader .ld-mark{position:absolute;left:clamp(1.25rem,3.2vw,2.75rem);bottom:clamp(1.25rem,3.2vw,2.75rem);width:2.6rem;height:auto;fill:#a7c818}
#loader .ld-n{position:absolute;right:clamp(1.25rem,3.2vw,2.75rem);bottom:clamp(1.1rem,3vw,2.6rem);color:#fff;font:700 clamp(1.6rem,4vw,3rem)/1 'Archivo Variable',system-ui,sans-serif;font-stretch:125%;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
/* Vangnet zonder JavaScript: het laadscherm verdwijnt altijd, ook als een script niet laadt */
#loader{animation:ld-failsafe .01s 7s forwards}
@keyframes ld-failsafe{to{visibility:hidden;opacity:0;pointer-events:none}}
@keyframes ld-pass{from{transform:translateX(-1100px)}to{transform:translateX(2100px)}}
@media (prefers-reduced-motion:reduce){#loader{clip-path:none;transition:opacity .25s}#loader.done{clip-path:none;opacity:0}#loader .l{animation:none;transform:translateX(300px)}}
</style>
<noscript><style>#loader{display:none}</style></noscript>
<div id="loader" role="status" aria-label="Laden" data-i18n-attr="aria-label:loader.label">
  <svg class="lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g transform="rotate(-35 800 450)">${lines}</g></svg>
  <svg class="ld-mark" viewBox="0 0 360 220" aria-hidden="true"><path d="${logoPath}" /></svg>
  <span class="ld-n" id="ld-n" aria-hidden="true">00</span>
</div>`
}

export function applyPartials(html) {
  return html.replaceAll('{{loader}}', loader()).replace(/\{\{header:(\w+)\}\}/g, (_, page) => header(page)).replaceAll('{{footer}}', footer())
}
