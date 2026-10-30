import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/dm-sans'
import './style.css'

const INK = '#000'
const LIME = '#a7c818'

const canvas = document.getElementById('art')
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score')
const mount = new Image()
mount.onload = () => {
  ready = true
  draw(0)
}
mount.src = '/mount.webp'
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

const IDLE_SPEED = reduceMotion ? 0 : 0.12 // rad/s
const IMPULSE = reduceMotion ? 9 : 18 // rad/s per klik
const MAX_SPEED = 30
const FRICTION = 2.2

let w = 0
let h = 0
let size = 0 // doorsnede van de bajonet in px
let ready = false
let theta = 0
let omega = IDLE_SPEED
let pulse = 0
let floatY = 0
let last = performance.now()
let spins = 0

try {
  spins = Number(localStorage.getItem('lens-spins')) || 0
} catch {}
renderScore()

function renderScore() {
  scoreEl.textContent = spins ? `${spins.toLocaleString('nl-NL')} ${spins === 1 ? 'spin' : 'spins'}` : 'Klik en draai'
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  w = innerWidth
  h = innerHeight
  size = Math.min(Math.max(h * 0.98, w * 0.5), w * 1.05, 980)
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(0)
}

function draw(dTheta) {
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, w, h)
  if (!ready) return

  const s = size * (1 + 0.04 * pulse)
  // Bewegingsonscherpte bij hoge snelheid: gemiddelde van meerdere deelbeelden
  const samples = Math.min(10, Math.max(1, Math.ceil(Math.abs(dTheta) / 0.05)))
  for (let i = 0; i < samples; i++) {
    ctx.save()
    ctx.translate(w / 2, h / 2 + floatY)
    ctx.rotate(theta - (dTheta * i) / samples)
    ctx.globalAlpha = 1 / (i + 1)
    ctx.drawImage(mount, -s / 2, -s / 2, s, s)
    ctx.restore()
  }
  ctx.globalAlpha = 1
}

function hit(px, py) {
  const dx = px - w / 2
  const dy = py - (h / 2 + floatY)
  return Math.hypot(dx, dy) < size * 0.46
}

function spin(px, py) {
  omega = Math.min(omega + IMPULSE, MAX_SPEED)
  pulse = 1
  spins += 1
  renderScore()
  try {
    localStorage.setItem('lens-spins', String(spins))
  } catch {}
  const pop = document.createElement('span')
  pop.className = 'pop'
  pop.textContent = '+1'
  pop.style.left = `${px}px`
  pop.style.top = `${py}px`
  pop.addEventListener('animationend', () => pop.remove())
  document.body.append(pop)
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  omega += (IDLE_SPEED - omega) * (1 - Math.exp(-FRICTION * dt))
  const dTheta = omega * dt
  theta += dTheta
  pulse = Math.max(0, pulse - dt * 5)
  floatY = reduceMotion ? 0 : Math.sin(now / 1800) * 6
  draw(dTheta)
  requestAnimationFrame(frame)
}

addEventListener('resize', resize)
addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button')) return
  if (hit(e.clientX, e.clientY)) spin(e.clientX, e.clientY)
})
addEventListener('pointermove', (e) => {
  const overUi = e.target.closest && e.target.closest('a, button')
  document.body.style.cursor = !overUi && hit(e.clientX, e.clientY) ? 'pointer' : ''
})
scoreEl.addEventListener('click', () => {
  const r = scoreEl.getBoundingClientRect()
  spin(r.left + r.width / 2, r.bottom)
})

resize()
requestAnimationFrame(frame)
