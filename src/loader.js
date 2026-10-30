// Laadscherm: toont de lijnen tot lettertypen, pagina en (op de home) de video klaar zijn,
// en veegt het daarna diagonaal weg. Voor terugkerende bezoekers is het korter.
const loader = document.getElementById('loader')

if (loader) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let seen = false
  try {
    seen = sessionStorage.getItem('loader-seen') === '1'
    sessionStorage.setItem('loader-seen', '1')
  } catch {}

  const minimum = reduce ? 300 : seen ? 450 : 1700
  const counter = document.getElementById('ld-n')
  const start = performance.now()
  let frame = 0

  // Teller loopt soepel op tot 99 en springt bij klaar naar 100
  const tick = () => {
    const p = Math.min((performance.now() - start) / minimum, 1)
    counter.textContent = String(Math.floor(p * p * (3 - 2 * p) * 99)).padStart(2, '0')
    frame = requestAnimationFrame(tick)
  }
  tick()

  const loaded = new Promise((resolve) => (document.readyState === 'complete' ? resolve() : addEventListener('load', resolve, { once: true })))
  const waits = [document.fonts?.ready, loaded, new Promise((r) => setTimeout(r, minimum))]

  const reel = document.getElementById('reel')
  if (reel?.getAttribute('src') && reel.readyState < 2) waits.push(new Promise((r) => reel.addEventListener('loadeddata', r, { once: true })))

  const finish = () => {
    cancelAnimationFrame(frame)
    counter.textContent = '100'
    loader.classList.add('leaving')
    setTimeout(() => {
      loader.classList.add('done')
      loader.addEventListener('transitionend', () => loader.remove(), { once: true })
      setTimeout(() => loader.remove(), 2000) // vangnet
    }, 200)
  }

  // Nooit langer dan 4,5 seconden wachten
  Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 4500))]).then(finish)
}
