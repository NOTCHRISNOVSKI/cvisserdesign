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

export function applyPartials(html) {
  return html.replace(/\{\{header:(\w+)\}\}/g, (_, page) => header(page)).replaceAll('{{footer}}', footer())
}
