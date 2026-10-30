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
  L = Math.hypot(w, h) * (portrait ? 0.64 : 0.5)
  R = L * 0.2
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw(0)
}

const DARK = [[0, '#04030b'], [0.12, '#16142c'], [0.24, '#3a3763'], [0.3, '#8f8bc2'], [0.35, '#46427a'], [0.55, '#1b1936'], [0.8, '#0d0b1d'], [0.9, '#0b0a19'], [0.965, '#46570a'], [1, '#141b02']]
const RUBBER = [[0, '#030309'], [0.15, '#12102a'], [0.27, '#2c2a52'], [0.31, '#55518a'], [0.38, '#2a2850'], [0.6, '#14122b'], [0.85, '#0a091a'], [0.965, '#3d4d09'], [1, '#101601']]
const METAL = [[0, '#3c3c4a'], [0.14, '#8a8c9c'], [0.26, '#e9ebf5'], [0.31, '#ffffff'], [0.4, '#9a9cae'], [0.62, '#4a4b5a'], [0.88, '#2a2a36'], [0.965, '#5c7208'], [1, '#1c2203']]
const GREEN = [[0, '#3d4d05'], [0.22, '#bcdc22'], [0.31, '#f4ffb0'], [0.55, '#a7c818'], [0.9, '#5a6e0a'], [1, '#2c3803']]

function cylinder(x0, x1, r, stops) {
  const g = ctx.createLinearGradient(0, -r, 0, r)
  for (const [o, c] of stops) g.addColorStop(o, c)
  ctx.globalAlpha = 1
  ctx.fillStyle = g
  ctx.fillRect(x0, -r, x1 - x0, r * 2)
  // Schaduw (ambient occlusion) bij de naden
  const ao = Math.min(r * 0.14, (x1 - x0) * 0.5)
  let a = ctx.createLinearGradient(x0, 0, x0 + ao, 0)
  a.addColorStop(0, 'rgba(0,0,0,0.7)')
  a.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = a
  ctx.fillRect(x0, -r, ao, r * 2)
  a = ctx.createLinearGradient(x1 - ao, 0, x1, 0)
  a.addColorStop(0, 'rgba(0,0,0,0)')
  a.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = a
  ctx.fillRect(x1 - ao, -r, ao, r * 2)
}

// Hoeveel licht een punt op hoogte yn (-1 boven .. 1 onder) ontvangt: licht komt van linksboven
const lit = (yn) => Math.exp(-(((yn + 0.45) / 0.3) ** 2))

// Rubberen ribbels langs de as, op hoek phi rond de cilinder (zichtbaar als cos > 0)
function ribs(x0, x1, r, n, th, a) {
  const pitch = (TAU * r) / n
  for (let k = 0; k < n; k++) {
    const phi = (k / n) * TAU + th
    const c = Math.cos(phi)
    if (c <= 0.02) continue
    const yn = Math.sin(phi)
    const y = r * yn
    const bw = Math.max(1, pitch * 0.42 * c)
    ctx.fillStyle = '#000'
    ctx.globalAlpha = 0.6 * c * a
    ctx.fillRect(x0, y - bw / 2, x1 - x0, bw)
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = (0.04 + 0.5 * lit(yn)) * c * a * 0.5
    ctx.fillRect(x0, y + bw / 2, x1 - x0, Math.max(1, pitch * 0.18 * c))
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

// Gegraveerde tekst op de cilinder: wordt platgedrukt naarmate hij wegdraait
function engrave(items, r, th, a, offset, size, color = '#f4f4f6') {
  const phi = th + offset
  const c = Math.cos(phi)
  if (c < 0.08) return
  ctx.save()
  ctx.translate(0, r * Math.sin(phi))
  ctx.scale(1, c)
  ctx.font = `700 ${size}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85 * c * a
  for (const [xx, t] of items) ctx.fillText(t, xx, 0)
  ctx.restore()
}

// AF/MF-schakelpaneel
function switchPanel(x0, wd, r, th, a, offset) {
  const phi = th + offset
  const c = Math.cos(phi)
  if (c < 0.1) return
  const y1 = r * Math.sin(phi - 0.24)
  const y2 = r * Math.sin(phi + 0.24)
  ctx.globalAlpha = 0.95 * a
  ctx.fillStyle = '#02020a'
  ctx.fillRect(x0, y1, wd, y2 - y1)
  ctx.globalAlpha = 0.25 * c * a
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.strokeRect(x0, y1, wd, y2 - y1)
  const ym = (y1 + y2) / 2
  const hh = (y2 - y1) * 0.22
  ctx.globalAlpha = 0.95 * c * a
  ctx.fillStyle = LIME
  ctx.fillRect(x0 + wd * 0.12, ym - hh * 1.7, wd * 0.36, hh)
  ctx.fillStyle = '#f4f4f6'
  ctx.fillRect(x0 + wd * 0.52, ym + hh * 0.7, wd * 0.36, hh)
}

// Voorkant: gezien onder een lichte hoek, met meerdere glaselementen die dieper liggen
function frontFace(th, a) {
  const cx = L * 0.5
  const rx = R * 0.42
  const ry = R * 1.28
  ctx.globalAlpha = 1

  // Rand van de zonnekap met vilt aan de binnenkant
  ctx.fillStyle = '#0c0b1c'
  ctx.beginPath()
  ctx.ellipse(cx, 0, rx, ry, 0, 0, TAU)
  ctx.fill()
  ctx.strokeStyle = '#6e6aa6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(cx, 0, rx, ry, 0, 0, TAU)
  ctx.stroke()
  const felt = ctx.createRadialGradient(cx - rx * 0.3, 0, ry * 0.2, cx, 0, ry)
  felt.addColorStop(0, '#05040d')
  felt.addColorStop(1, '#14122a')
  ctx.fillStyle = felt
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.06, 0, rx * 0.92, ry * 0.94, 0, 0, TAU)
  ctx.fill()

  // Glaselementen: elk dieper element ligt iets naar links en is kleiner
  const tints = ['#2a2f8a', '#1f6a5e', '#5a2a86', '#16204f']
  for (let i = 0; i < 4; i++) {
    const ex = cx - rx * (0.2 + i * 0.2)
    const erx = rx * (0.78 - i * 0.09)
    const ery = ry * (0.82 - i * 0.07)
    const g = ctx.createRadialGradient(ex - erx * 0.3, -ery * 0.3, 2, ex, 0, ery)
    g.addColorStop(0, tints[i])
    g.addColorStop(0.55, '#07061a')
    g.addColorStop(1, '#010108')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(ex, 0, erx, ery, 0, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = i % 2 ? 'rgba(120,255,200,0.55)' : 'rgba(167,140,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // Diafragma: zes bladen in het diepste element
  const ax = cx - rx * 1.0
  ctx.strokeStyle = 'rgba(244,244,246,0.35)'
  ctx.lineWidth = 1.2
  for (let k = 0; k < 6; k++) {
    const phi = (k / 6) * TAU + th * 0.08
    ctx.beginPath()
    ctx.moveTo(ax + rx * 0.16 * Math.cos(phi), ry * 0.2 * Math.sin(phi))
    ctx.lineTo(ax + rx * 0.5 * Math.cos(phi + 0.9), ry * 0.56 * Math.sin(phi + 0.9))
    ctx.stroke()
  }

  // Reflecties op het frontglas
  ctx.globalAlpha = 0.55
  const sh = ctx.createLinearGradient(cx - rx, -ry * 0.8, cx, ry * 0.2)
  sh.addColorStop(0, 'rgba(255,255,255,0.7)')
  sh.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sh
  ctx.beginPath()
  ctx.ellipse(cx - rx * 0.3, -ry * 0.38, rx * 0.34, ry * 0.4, -0.1, 0, TAU)
  ctx.fill()
  for (let k = 0; k < 3; k++) {
    const phi = (k / 3) * TAU + th * 0.4
    ctx.globalAlpha = 0.6 * a
    ctx.fillStyle = k === 0 ? LIME : '#f4f4f6'
    ctx.beginPath()
    ctx.ellipse(cx - rx * 0.1 + rx * 0.4 * Math.cos(phi), ry * 0.55 * Math.sin(phi), 2.5, 8, 0, 0, TAU)
    ctx.fill()
  }

  // Limoenrand rond het front
  ctx.globalAlpha = 0.85
  ctx.strokeStyle = LIME
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.ellipse(cx, 0, rx * 0.97, ry * 0.97, 0, 0, TAU)
  ctx.stroke()
  ctx.globalAlpha = 1
}

function lens(th, a) {
  const x = (f) => f * L

  // Vaste onderdelen (achter -> voor)
  cylinder(x(-0.5), x(-0.465), R * 0.64, METAL) // bajonet
  cylinder(x(-0.465), x(-0.4), R * 0.88, DARK)
  cylinder(x(-0.4), x(-0.1), R, RUBBER) // zoomring
  cylinder(x(-0.1), x(-0.085), R * 1.035, GREEN) // limoenband
  cylinder(x(-0.085), x(-0.02), R * 0.98, DARK) // schakelaarbehuizing
  cylinder(x(-0.02), x(0.17), R * 0.99, RUBBER) // focusring
  cylinder(x(0.17), x(0.33), R * 0.96, DARK) // voorloop
  cylinder(x(0.33), x(0.36), R * 0.945, METAL) // filterring

  // Draaiende details
  marks(x(-0.482), x(0.02), R * 0.64, 3, th, a, '#000', 14, 0.5) // bajonetuitsparingen
  marks(x(-0.43), 12, R * 0.88, 1, th, a, '#fff', 12, 1.1) // uitlijnpunt
  ribs(x(-0.395), x(-0.105), R, 56, th, a)
  engrave([[x(-0.34), '24'], [x(-0.28), '35'], [x(-0.22), '50'], [x(-0.16), '70']], R, th, a, 0.55, R * 0.17)
  switchPanel(x(-0.075), x(0.045), R * 0.98, th, a, 2.1)
  ribs(x(-0.015), x(0.165), R * 0.99, 34, th, a)
  marks(x(0.075), x(0.02), R * 0.99, 20, th, a, '#f4f4f6', 3, 0.0)
  engrave([[x(0.25), '24–70mm  1:2.8']], R * 0.96, th, a, 0.25, R * 0.15)
  engrave([[x(0.25), 'ø 82']], R * 0.96, th, a, 1.55, R * 0.12, '#bcbad3')
  marks(x(0.25), x(0.15), R * 0.96, 1, th, a, LIME, 5, 2.4)
  ctx.globalAlpha = 1

  // Zonnekap
  const g = ctx.createLinearGradient(0, -R * 1.28, 0, R * 1.28)
  for (const [o, c] of RUBBER) g.addColorStop(o, c)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x(0.36), -R * 0.95)
  ctx.lineTo(x(0.5), -R * 1.28)
  ctx.lineTo(x(0.5), R * 1.28)
  ctx.lineTo(x(0.36), R * 0.95)
  ctx.closePath()
  ctx.fill()
  marks(x(0.46), x(0.04), R * 1.18, 1, th, a, '#fff', 6, 0.9)

  frontFace(th, a)
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
