// Laadscherm (camera-diafragma): het diafragma sluit tijdens het laden en opent daarna om de
// pagina te onthullen. Wacht op lettertypen, de pagina en (op de home) de video.
// Voor terugkerende bezoekers is het korter.
const loader = document.getElementById('loader')

if (loader) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let seen = false
  try {
    seen = sessionStorage.getItem('loader-seen') === '1'
    sessionStorage.setItem('loader-seen', '1')
  } catch {}
  if (seen) loader.classList.add('fast')

  // Het diafragma moet eerst dicht zijn voordat het opent: minimum geteld vanaf het openen van de pagina
  const minimum = reduce ? 100 : seen ? 380 : 750

  const loaded = new Promise((resolve) => (document.readyState === 'complete' ? resolve() : addEventListener('load', resolve, { once: true })))
  const waits = [document.fonts?.ready, loaded, new Promise((r) => setTimeout(r, Math.max(0, minimum - performance.now())))]

  // De video mag het laadscherm niet langer dan 2 seconden ophouden
  const reel = document.getElementById('reel')
  if (reel?.getAttribute('src') && reel.readyState < 2) {
    waits.push(Promise.race([new Promise((r) => reel.addEventListener('loadeddata', r, { once: true })), new Promise((r) => setTimeout(r, 2000))]))
  }

  const finish = () => {
    loader.classList.add('opening')
    const remove = () => loader.remove()
    loader.querySelector('.b')?.addEventListener('animationend', remove, { once: true })
    setTimeout(remove, reduce ? 300 : 1200) // vangnet
  }

  // Nooit langer dan 2,5 seconde wachten
  Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 2500))]).then(finish)
}
