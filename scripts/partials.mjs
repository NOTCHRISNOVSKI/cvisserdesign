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
// Negen bladen met drie tinten, een vaste ring met scharnierpunten, alles in donkere tinten.
// De bijbehorende logica staat in src/loader.js.
const BLADES = 9
const STEP = 360 / BLADES

export function loader() {
  // Elk blad is het vlak tussen zijn eigen rand en de rand van het volgende blad. Zo sluiten ze rondom
  // naadloos op elkaar aan (niets bedekt de rest) en is het diafragma overal gelijk. Getekend voor
  // een gat met straal 1; de animatie schaalt het naar de echte grootte.
  const d = (STEP * Math.PI) / 180
  const far = 300
  const vy = Math.tan(d / 2)
  const fx = (1 + far * Math.sin(d)) / Math.cos(d)
  const face = `1,${vy.toFixed(4)} 1,${-far} ${fx.toFixed(2)},${-far}`
  const blades = Array.from({ length: BLADES }, (_, k) => `<polygon class="b" points="${face}" fill="url(#ld-g${k % 3})" style="--k:${k}" />`).join('')
  const pins = Array.from({ length: BLADES }, (_, k) => {
    const a = (k * STEP * Math.PI) / 180
    return `<circle cx="${(Math.cos(a) * 372).toFixed(1)}" cy="${(Math.sin(a) * 372).toFixed(1)}" r="7" />`
  }).join('')
  return `<style>
#loader{position:fixed;inset:0;z-index:100;overflow:hidden;animation:ld-failsafe .01s 5s forwards}
#loader .back{position:absolute;inset:0;background:#000}
#loader.opening .back{opacity:0;transition:opacity .05s linear}
#loader svg{position:absolute;inset:0;width:100%;height:100%}
#loader .b{stroke:#242424;stroke-width:1.2;vector-effect:non-scaling-stroke;transform:rotate(calc(var(--k)*${STEP}deg + 40deg)) scale(5);animation:ld-close .7s cubic-bezier(.65,0,.35,1) both}deg + 40deg)) translateX(5px);animation:ld-close .7s cubic-bezier(.65,0,.35,1) both}
#loader.opening .b{animation:ld-open .6s cubic-bezier(.4,0,.2,1) both}
#loader .ring{fill:none;stroke:#1f1f1f;stroke-width:1.5}
#loader .ring,#loader .housing{transition:opacity .25s}
#loader .ring circle:first-child+circle{stroke:#171717}
#loader .pins circle{fill:#101010;stroke:#2c2c2c;stroke-width:1}
#loader.opening .ring,#loader.opening .housing{opacity:0}
#loader.fast .b{animation-duration:.35s}
#loader.fast.opening .b{animation-duration:.4s}
@keyframes ld-close{from{transform:rotate(calc(var(--k)*${STEP}deg)) scale(1000)}to{transform:rotate(calc(var(--k)*${STEP}deg + 40deg)) scale(5)}}
@keyframes ld-open{from{transform:rotate(calc(var(--k)*${STEP}deg + 40deg)) scale(5)}to{transform:rotate(calc(var(--k)*${STEP}deg)) scale(1000)}}
/* Vangnet zonder JavaScript: het laadscherm verdwijnt altijd, ook als een script niet laadt */
@keyframes ld-failsafe{to{visibility:hidden;opacity:0;pointer-events:none}}
@media (prefers-reduced-motion:reduce){#loader .b,#loader.opening .b{animation:none}#loader.opening{opacity:0;transition:opacity .25s}}
</style>
<noscript><style>#loader{display:none}</style></noscript>
<div id="loader" role="status" aria-label="Laden" data-i18n-attr="aria-label:loader.label">
  <div class="back"></div>
  <svg viewBox="-800 -450 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="ld-g0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#171717"/><stop offset=".08" stop-color="#101010"/><stop offset="1" stop-color="#080808"/></linearGradient>
      <linearGradient id="ld-g1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101010"/><stop offset=".08" stop-color="#0b0b0b"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <linearGradient id="ld-g2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1c1c"/><stop offset=".08" stop-color="#141414"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient>
    </defs>
    <g class="housing"><path fill="#090909" fill-rule="evenodd" d="M-1000 0a1000 1000 0 1 0 2000 0a1000 1000 0 1 0-2000 0M-300 0a300 300 0 1 0 600 0a300 300 0 1 0-600 0z" /><path fill="#0c0c0c" fill-rule="evenodd" d="M-720 0a720 720 0 1 0 1440 0a720 720 0 1 0-1440 0M-440 0a440 440 0 1 0 880 0a440 440 0 1 0-880 0z" /></g>
    ${blades}
    <g class="ring"><circle r="300" /><circle r="440" /><g class="pins">${pins}</g></g>
  </svg>
</div>
<script>try{if(sessionStorage.getItem('loader-seen')==='1')document.getElementById('loader').classList.add('fast')}catch(e){}</script>`
}

export function applyPartials(html) {
  return html.replaceAll('{{loader}}', loader()).replace(/\{\{header:(\w+)\}\}/g, (_, page) => header(page)).replaceAll('{{footer}}', footer())
}
