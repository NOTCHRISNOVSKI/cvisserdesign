import './common.js'
import { t } from './i18n.js'

const reel = document.getElementById('reel')
const play = document.getElementById('play')
const playLabel = play.querySelector('span')

if (!reel.getAttribute('src')) {
  // Nog geen showreel geüpload: toon alleen een zwart vlak
  reel.hidden = true
}

// Respecteer "verminderde beweging": niet automatisch afspelen
if (matchMedia('(prefers-reduced-motion: reduce)').matches && reel.getAttribute('src')) {
  reel.pause()
  reel.removeAttribute('autoplay')
  play.hidden = false
  play.addEventListener('click', () => {
    const key = reel.paused ? 'home.pause' : 'home.play'
    if (reel.paused) reel.play().catch(() => {})
    else reel.pause()
    playLabel.dataset.i18n = key
    playLabel.textContent = t(key)
  })
}
