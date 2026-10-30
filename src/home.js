import './common.js'
import { t } from './i18n.js'

const reel = document.getElementById('reel')
const sound = document.getElementById('sound')
const play = document.getElementById('play')
const soundLabel = sound.querySelector('span')
const playLabel = play.querySelector('span')

const setLabel = (span, key) => {
  span.dataset.i18n = key
  span.textContent = t(key)
}

if (!reel.getAttribute('src')) {
  // Nog geen showreel geüpload: toon alleen een zwart vlak
  reel.hidden = true
  sound.hidden = true
}

sound.addEventListener('click', () => {
  reel.muted = !reel.muted
  setLabel(soundLabel, reel.muted ? 'home.soundOn' : 'home.soundOff')
  sound.setAttribute('aria-pressed', String(!reel.muted))
  if (!reel.muted) reel.play().catch(() => {})
})

// Respecteer "verminderde beweging": niet automatisch afspelen
if (matchMedia('(prefers-reduced-motion: reduce)').matches && reel.getAttribute('src')) {
  reel.pause()
  reel.removeAttribute('autoplay')
  play.hidden = false
  play.addEventListener('click', () => {
    if (reel.paused) {
      reel.play().catch(() => {})
      setLabel(playLabel, 'home.pause')
    } else {
      reel.pause()
      setLabel(playLabel, 'home.play')
    }
  })
}
