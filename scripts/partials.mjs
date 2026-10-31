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
      ? `\n          <button id="play" type="button" hidden><span data-i18n="home.play">Afspelen</span></button>`
      : ''
  return `<header class="bar${page === 'home' ? '' : ' solid'}">
      <a class="brand" href="/" aria-label="CVisser Design"><svg viewBox="0 0 360 220" aria-hidden="true"><path d="${logoPath}" /></svg><span>CVisserDesign</span></a>
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

// Laadscherm: een camera-diafragma dat sluit en daarna opent om de pagina te onthullen.
// Zeven bladen, helemaal in donkere tinten. De bijbehorende logica staat in src/loader.js.
const BLADES = 7

export function loader() {
  const blades = Array.from({ length: BLADES }, (_, k) => `<rect class="b" x="0" y="-3000" width="3000" height="6000" fill="url(#ld-g)" style="--k:${k}" />`).join('')
  return `<style>
#loader{position:fixed;inset:0;z-index:100;overflow:hidden;animation:ld-failsafe .01s 5s forwards}
#loader .back{position:absolute;inset:0;background:#000}
#loader.opening .back{opacity:0;transition:opacity .05s linear}
#loader svg{position:absolute;inset:0;width:100%;height:100%}
#loader .b{stroke:#262626;stroke-width:1.2;vector-effect:non-scaling-stroke;transform:rotate(calc(var(--k)*51.4286deg + 40deg)) translateX(5px);animation:ld-close .7s cubic-bezier(.65,0,.35,1) both}
#loader.opening .b{animation:ld-open .6s cubic-bezier(.4,0,.2,1) both}
#loader.fast .b{animation-duration:.35s}
#loader.fast.opening .b{animation-duration:.4s}
@keyframes ld-close{from{transform:rotate(calc(var(--k)*51.4286deg)) translateX(1000px)}to{transform:rotate(calc(var(--k)*51.4286deg + 40deg)) translateX(5px)}}
@keyframes ld-open{from{transform:rotate(calc(var(--k)*51.4286deg + 40deg)) translateX(5px)}to{transform:rotate(calc(var(--k)*51.4286deg)) translateX(1000px)}}
/* Vangnet zonder JavaScript: het laadscherm verdwijnt altijd, ook als een script niet laadt */
@keyframes ld-failsafe{to{visibility:hidden;opacity:0;pointer-events:none}}
@media (prefers-reduced-motion:reduce){#loader .b,#loader.opening .b{animation:none}#loader.opening{opacity:0;transition:opacity .25s}}
</style>
<noscript><style>#loader{display:none}</style></noscript>
<div id="loader" role="status" aria-label="Laden" data-i18n-attr="aria-label:loader.label">
  <div class="back"></div>
  <svg viewBox="-800 -450 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="ld-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e1e1e"/><stop offset=".004" stop-color="#131313"/><stop offset=".05" stop-color="#0a0a0a"/><stop offset="1" stop-color="#050505"/></linearGradient></defs>
    ${blades}
  </svg>
</div>
<script>try{if(sessionStorage.getItem('loader-seen')==='1')document.getElementById('loader').classList.add('fast')}catch(e){}</script>`
}

export function applyPartials(html) {
  return html.replaceAll('{{loader}}', loader()).replace(/\{\{header:(\w+)\}\}/g, (_, page) => header(page)).replaceAll('{{footer}}', footer())
}
