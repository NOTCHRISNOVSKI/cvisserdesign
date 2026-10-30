import './common.js'

const reel = document.getElementById('reel')
const sound = document.getElementById('sound')
const play = document.getElementById('play')

if (!reel.getAttribute('src')) {
  // Nog geen showreel geüpload: toon alleen een zwart vlak
  reel.hidden = true
  sound.hidden = true
}

sound.addEventListener('click', () => {
  reel.muted = !reel.muted
  sound.textContent = reel.muted ? 'Geluid aan' : 'Geluid uit'
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
      play.textContent = 'Pauzeren'
    } else {
      reel.pause()
      play.textContent = 'Afspelen'
    }
  })
}
