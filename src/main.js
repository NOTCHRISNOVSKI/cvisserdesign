import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/dm-sans'
import './style.css'

const INK = '#0f0d22'
const LIME = '#a7c818'
const WHITE = '#f4f4f6'

// Positie (0-1 over de breedte), dikte in px en kleur van elke lijn
const LINES = [
  [0.04, 1, LIME],
  [0.13, 1, WHITE],
  [0.2, 3, LIME],
  [0.31, 1, LIME],
  [0.4, 1, WHITE],
  [0.52, 9, LIME],
  [0.58, 1, LIME],
  [0.69, 2, WHITE],
  [0.78, 1, LIME],
  [0.87, 4, LIME],
  [0.95, 1, WHITE],
]

const BASE_ANGLE = -0.62 // radialen, ca. -35 graden
const DRIFT = 7 // px per seconde

const canvas = document.getElementById('art')
const ctx = canvas.getContext('2d')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

let w = 0
let h = 0
let diag = 0
let angle = BASE_ANGLE
let targetAngle = BASE_ANGLE
let shift = 0
let targetShift = 0
let drift = 0
let last = performance.now()

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  w = innerWidth
  h = innerHeight
  diag = Math.hypot(w, h)
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw()
}

function draw() {
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(angle)

  for (const [pos, width, color] of LINES) {
    let y = ((pos * diag + drift + shift) % diag + diag) % diag - diag / 2
    ctx.fillStyle = color
    ctx.globalAlpha = width > 5 ? 0.95 : 0.9
    if (width > 5) {
      ctx.shadowColor = LIME
      ctx.shadowBlur = 36
    } else {
      ctx.shadowBlur = 0
    }
    ctx.fillRect(-diag, y - width / 2, diag * 2, width)
  }

  ctx.restore()
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  drift += DRIFT * dt
  angle += (targetAngle - angle) * Math.min(dt * 2.5, 1)
  shift += (targetShift - shift) * Math.min(dt * 2.5, 1)
  draw()
  requestAnimationFrame(frame)
}

addEventListener('resize', resize)
addEventListener('pointermove', (e) => {
  targetAngle = BASE_ANGLE + (e.clientX / w - 0.5) * 0.18
  targetShift = (e.clientY / h - 0.5) * 120
})

resize()
if (!reduceMotion) requestAnimationFrame(frame)
