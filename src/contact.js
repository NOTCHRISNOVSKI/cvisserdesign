import './common.js'
import { t } from './i18n.js'

for (const button of document.querySelectorAll('[data-copy]')) {
  const label = button.querySelector('span')
  let timer
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy)
    } catch {
      // Geen toegang tot het klembord (bijv. geen https): selecteer de tekst niet, laat het label ongewijzigd
      return
    }
    clearTimeout(timer)
    label.textContent = t('contact.copied')
    button.classList.add('done')
    timer = setTimeout(() => {
      label.textContent = t('contact.copy')
      button.classList.remove('done')
    }, 1600)
  })
}
