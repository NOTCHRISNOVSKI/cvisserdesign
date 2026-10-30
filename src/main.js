import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/dm-sans'
import './style.css'

const INK = '#0f0d22'
const LIME = '#a7c818'
const TAU = Math.PI * 2

const canvas = document.getElementById('art')
const ctx = canvas.getContext('2d')
const scoreEl = document.getElementById('score')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

const IDLE_SPEED = reduceMotion ? 0 : 0.3 // rad/s
const IMPULSE = reduceMotion ? 9 : 18 // rad/s per klik
const MAX_SPEED = 30
const FRICTION = 2.2

let w = 0
let h = 0
let L = 0 // lengte van de lens in px
let R = 0 // straal in px
let tilt = -0.38
let theta = 0.4
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
  scoreEl.textContent = spins ? `${spins.toLocaleString('nl-NL')} ${spins === 1 ? 'spin' : 'spins'}` : 'Klik op de lens'
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  w = innerWidth
  h = innerHeight
  const portrait = h > w
  tilt = portrait ? -1.15 : -0.38
  L = Math.hypot(w, h) * 0.78
  R = L * (portrait ? 0.105 : 0.105)
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(0)
}

function cylinder(x0, x1, r, stops) {
  const g = ctx.createLinearGradient(0, -r, 0, r)
  for (const [o, c] of stops) g.addColorStop(o, c)
  ctx.globalAlpha = 1
  ctx.fillStyle = g
  ctx.fillRect(x0, -r, x1 - x0, r * 2)
  ctx.fillStyle = '#000'
  ctx.globalAlpha = 0.55
  ctx.fillRect(x0 - 1, -r, 2, r * 2)
  ctx.globalAlpha = 1
}

const DARK = [[0, '#05040d'], [0.2, '#2b2848'], [0.3, '#6e6a9e'], [0.38, '#37345c'], [0.7, '#14122a'], [1, '#04030b']]
const METAL = [[0, '#4a4a58'], [0.2, '#b9bbc9'], [0.3, '#ffffff'], [0.45, '#8d8fa0'], [0.75, '#3b3b48'], [1, '#1c1c26']]
const GREEN = [[0, '#4a5c06'], [0.25, '#c8ea2c'], [0.32, '#f2ffa8'], [0.55, '#a7c818'], [1, '#2c3803']]

// Lijnen langs de as, op hoek phi rond de cilinder: zichtbaar aan de voorkant (cos > 0)
function ribs(x0, x1, r, n, th, a) {
  for (let k = 0; k < n; k++) {
    const phi = (k / n) * TAU + th
    const c = Math.cos(phi)
    if (c <= 0) continue
    const y = r * Math.sin(phi)
    const bw = Math.max(1, ((TAU * r) / n) * 0.34 * c)
    ctx.fillStyle = '#000'
    ctx.globalAlpha = 0.55 * c * a
    ctx.fillRect(x0, y - bw / 2, x1 - x0, bw)
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = 0.09 * c * a
    ctx.fillRect(x0, y + bw / 2, x1 - x0, Math.max(1, bw * 0.5))
  }
}

function marks(xc, len, r, n, th, a, color, thick, offset) {
  for (let k = 0; k < n; k++) {
    const phi = (k / n) * TAU + th + offset
    const c = Math.cos(phi)
    if (c <= 0) continue
    ctx.fillStyle = color
    ctx.globalAlpha = 0.9 * c * a
    ctx.fillRect(xc - len / 2, r * Math.sin(phi) - (thick * c) / 2, len, Math.max(1, thick * c))
  }
}

function lens(th, a) {
  const x = (f) => f * L

  // Vaste delen (niet afhankelijk van de rotatie)
  cylinder(x(-0.5), x(-0.44), R * 0.62, METAL)
  cylinder(x(-0.44), x(-0.3), R * 0.9, DARK)
  cylinder(x(-0.3), x(-0.05), R, DARK)
  cylinder(x(-0.05), x(-0.032), R * 1.03, GREEN)
  cylinder(x(-0.032), x(0.18), R * 0.97, DARK)
  cylinder(x(0.18), x(0.36), R * 0.93, DARK)

  // Draaiende details
  ribs(x(-0.29), x(-0.06), R, 40, th, a)
  ribs(x(-0.022), x(0.17), R * 0.97, 30, th * 1.0, a)
  marks(x(0.075), x(0.03), R * 0.97, 24, th, a, '#f4f4f6', 3, 0.1)
  marks(x(0.27), x(0.15), R * 0.93, 1, th, a, LIME, 6, 0.9)
  marks(x(0.27), x(0.04), R * 0.93, 12, th, a, '#f4f4f6', 2, 0.2)
  marks(x(-0.37), x(0.08), R * 0.9, 1, th, a, LIME, 4, 2.2)
  ctx.globalAlpha = 1

  // Zonnekap
  const g = ctx.createLinearGradient(0, -R * 1.3, 0, R * 1.3)
  for (const [o, c] of DARK) g.addColorStop(o, c)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x(0.36), -R * 0.95)
  ctx.lineTo(x(0.5), -R * 1.3)
  ctx.lineTo(x(0.5), R * 1.3)
  ctx.lineTo(x(0.36), R * 0.95)
  ctx.closePath()
  ctx.fill()

  // Voorkant met glas (de lens staat licht naar ons toe gedraaid)
  const rx = R * 0.28
  const ry = R * 1.3
  ctx.fillStyle = '#0a0919'
  ctx.beginPath()
  ctx.ellipse(x(0.5), 0, rx, ry, 0, 0, TAU)
  ctx.fill()
  const glass = ctx.createRadialGradient(x(0.5) - rx * 0.3, -ry * 0.3, 2, x(0.5), 0, ry)
  glass.addColorStop(0, '#3a3d7a')
  glass.addColorStop(0.35, '#0e0d26')
  glass.addColorStop(1, '#02010a')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.ellipse(x(0.5), 0, rx * 0.82, ry * 0.86, 0, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = LIME
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.ellipse(x(0.5), 0, rx * 0.9, ry * 0.93, 0, 0, TAU)
  ctx.stroke()
  for (let k = 0; k < 3; k++) {
    const phi = (k / 3) * TAU + th * 0.5
    ctx.globalAlpha = 0.55 * a
    ctx.fillStyle = k === 0 ? LIME : '#f4f4f6'
    ctx.beginPath()
    ctx.ellipse(x(0.5) + rx * 0.45 * Math.cos(phi), ry * 0.5 * Math.sin(phi), 3, 9, 0, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function draw(dTheta) {
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2, h / 2 + floatY)
  ctx.rotate(tilt)
  const s = 1 + 0.035 * pulse
  ctx.scale(s, s)

  // Schaduw/gloed onder de lens
  ctx.shadowColor = 'rgba(167, 200, 24, 0.35)'
  ctx.shadowBlur = 60

  // Bewegingsonscherpte bij hoge snelheid: meerdere deelbeelden
  const samples = Math.min(8, Math.max(1, Math.ceil(Math.abs(dTheta) / 0.06)))
  for (let i = 0; i < samples; i++) {
    lens(theta - (dTheta * i) / samples, 1 / samples)
    ctx.shadowBlur = 0
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

function hit(px, py) {
  const dx = px - w / 2
  const dy = py - (h / 2 + floatY)
  const c = Math.cos(-tilt)
  const s = Math.sin(-tilt)
  const lx = dx * c - dy * s
  const ly = dx * s + dy * c
  return Math.abs(lx) < L / 2 + R * 0.3 && Math.abs(ly) < R * 1.35
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
