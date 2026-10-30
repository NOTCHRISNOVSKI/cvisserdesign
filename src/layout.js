import { apply, setLang } from './i18n.js'

// Taalwissel (vlaggetjes)
document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-lang]')
  if (button) setLang(button.dataset.lang)
})

// Menu op kleine schermen
const menuButton = document.querySelector('.menu-btn')
function setMenu(open) {
  document.body.classList.toggle('menu-open', open)
  menuButton?.setAttribute('aria-expanded', String(open))
}
menuButton?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')))
document.querySelector('.bar nav')?.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false)
})
addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false))

apply()
