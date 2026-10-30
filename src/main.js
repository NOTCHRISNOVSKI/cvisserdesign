import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/dm-sans'
import './style.css'

const NAVY = '27, 24, 56'
const LIME = '167, 200, 24'
const VIOLET = '110, 98, 224'

const canvas = document.getElementById('art')
const ctx = canvas.getContext('2d')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

let w = 0
let h = 0
let particles = []
let t = 0
const pointer = { x: -9999, y: -9999, active: false }

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  w = innerWidth
  h = innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = `rgb(${NAVY})`
  ctx.fillRect(0, 0, w, h)
  const count = Math.min(Math.round((w * h) / 4500), 380)
  particles = Array.from({ length: count }, () => spawn())
}

function spawn() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    life: 120 + Math.random() * 260,
    speed: 0.7 + Math.random() * 1.4,
    color: Math.random() < 0.22 ? VIOLET : LIME,
  }
}

function angleAt(x, y) {
  const s = 0.0017
  return (Math.sin(x * s + t) * Math.cos(y * s * 1.3 - t * 0.7) + Math.sin((x + y) * s * 0.6 + t * 0.4)) * Math.PI
}

function step() {
  t += 0.0035
  ctx.fillStyle = `rgba(${NAVY}, 0.045)`
  ctx.fillRect(0, 0, w, h)
  ctx.lineWidth = 1.9
  ctx.lineCap = 'round'

  for (const p of particles) {
    let a = angleAt(p.x, p.y)
    let vx = Math.cos(a) * p.speed
    let vy = Math.sin(a) * p.speed

    if (pointer.active) {
      const dx = p.x - pointer.x
      const dy = p.y - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 < 40000) {
        const f = 1 - Math.sqrt(d2) / 200
        vx += (-dy / 200) * f * 9 + (dx / 200) * f * 2
        vy += (dx / 200) * f * 9 + (dy / 200) * f * 2
      }
    }

    const nx = p.x + vx
    const ny = p.y + vy
    ctx.strokeStyle = `rgba(${p.color}, 0.95)`
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(nx, ny)
    ctx.stroke()
    p.x = nx
    p.y = ny
    p.life -= 1

    if (p.life <= 0 || nx < -20 || nx > w + 20 || ny < -20 || ny > h + 20) {
      Object.assign(p, spawn())
    }
  }
}

function loop() {
  step()
  requestAnimationFrame(loop)
}

addEventListener('resize', resize)
addEventListener('pointermove', (e) => {
  pointer.x = e.clientX
  pointer.y = e.clientY
  pointer.active = true
})
addEventListener('pointerleave', () => { pointer.active = false })

resize()

if (reduceMotion) {
  for (let i = 0; i < 500; i++) step()
} else {
  loop()
}
