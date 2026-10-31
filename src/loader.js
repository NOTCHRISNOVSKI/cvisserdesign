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

  // Minimale duur, geteld vanaf het openen van de pagina (niet vanaf het laden van dit script)
  const minimum = reduce ? 150 : seen ? 250 : 800
  const counter = document.getElementById('ld-n')
  let frame = 0

  // Teller loopt soepel op tot 99 en springt bij klaar naar 100
  const tick = () => {
    const p = Math.min(performance.now() / minimum, 1)
    counter.textContent = String(Math.floor(p * p * (3 - 2 * p) * 99)).padStart(2, '0')
    frame = requestAnimationFrame(tick)
  }
  tick()

  const loaded = new Promise((resolve) => (document.readyState === 'complete' ? resolve() : addEventListener('load', resolve, { once: true })))
  const waits = [document.fonts?.ready, loaded, new Promise((r) => setTimeout(r, Math.max(0, minimum - performance.now())))]

  const reel = document.getElementById('reel')
  // De video mag het laadscherm niet langer dan 2 seconden ophouden
  if (reel?.getAttribute('src') && reel.readyState < 2) waits.push(Promise.race([new Promise((r) => reel.addEventListener('loadeddata', r, { once: true })), new Promise((r) => setTimeout(r, 2000))]))

  const finish = () => {
    cancelAnimationFrame(frame)
    counter.textContent = '100'
    loader.classList.add('leaving')
    if (seen) loader.classList.add('fast')
    setTimeout(() => {
      loader.classList.add('done')
      loader.addEventListener('transitionend', () => loader.remove(), { once: true })
      setTimeout(() => loader.remove(), 2000) // vangnet
    }, 50)
  }

  // Nooit langer dan 2,5 seconde wachten
  Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 2500))]).then(finish)
}
