// Tweetalig: Nederlands en Engels. De keuze wordt onthouden; zonder keuze bepaalt de browsertaal.
const dict = {
  nl: {
    'nav.showreel': 'Showreel',
    'nav.work': 'Werk',
    'nav.about': 'Ken je mij?',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'lang.label': 'Taal',

    'home.title': 'CVisser Design | Showreel',
    'home.desc': 'Christiaan Visser, designer en videograaf. Bekijk het showreel en het werk.',
    'home.role': 'Designer & videograaf',
    'home.cta': 'Bekijk mijn werk',
    'home.soundOn': 'Geluid aan',
    'home.soundOff': 'Geluid uit',
    'home.play': 'Afspelen',
    'home.pause': 'Pauzeren',
    'home.reel': 'Showreel van Christiaan Visser',

    'work.title': 'Werk | CVisser Design',
    'work.desc': 'Een selectie van mijn werk: design, video en fotografie.',
    'work.h1': 'Werk',
    'work.one': 'project',
    'work.many': 'projecten',
    'work.all': 'Alles',
    'work.empty': 'Nog geen werk in deze categorie.',
    'work.filter': 'Filter op categorie',
    'cat.design': 'Design',
    'cat.video': 'Video',
    'cat.foto': 'Foto',

    'viewer.close': 'Sluiten ✕',
    'viewer.prev': '← Vorige',
    'viewer.next': 'Volgende →',
    'viewer.others': 'Ander werk',
    'viewer.year': 'Jaar',
    'viewer.client': 'Klant',
    'viewer.role': 'Rol',
    'viewer.category': 'Categorie',

    'about.title': 'Ken je mij nog niet? | CVisser Design',
    'about.desc': 'Christiaan Visser: creative content specialist, filmmaker en designer.',
    'about.portrait': 'Portret van Christiaan',

    'contact.title': 'Contact | CVisser Design',
    'contact.desc': 'Neem contact op met Christiaan Visser via e-mail of telefoon.',
    'contact.h1': 'Laten we praten',
    'contact.lead': 'Heb je een idee, een project of gewoon een vraag? Stuur een mail of bel me. Ik hoor het graag.',
    'contact.mail': 'E-mail',
    'contact.phone': 'Telefoon',
    'contact.copy': 'Kopieer',
    'contact.copied': 'Gekopieerd!',

    'foot.title': 'Samenwerken?',
    'foot.rights': '© 2026 CVisser Design',
  },
  en: {
    'nav.showreel': 'Showreel',
    'nav.work': 'Work',
    'nav.about': 'Meet me',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'lang.label': 'Language',

    'home.title': 'CVisser Design | Showreel',
    'home.desc': 'Christiaan Visser, designer and videographer. Watch the showreel and browse the work.',
    'home.role': 'Designer & videographer',
    'home.cta': 'View my work',
    'home.soundOn': 'Sound on',
    'home.soundOff': 'Sound off',
    'home.play': 'Play',
    'home.pause': 'Pause',
    'home.reel': 'Showreel by Christiaan Visser',

    'work.title': 'Work | CVisser Design',
    'work.desc': 'A selection of my work: design, video and photography.',
    'work.h1': 'Work',
    'work.one': 'project',
    'work.many': 'projects',
    'work.all': 'All',
    'work.empty': 'No work in this category yet.',
    'work.filter': 'Filter by category',
    'cat.design': 'Design',
    'cat.video': 'Video',
    'cat.foto': 'Photo',

    'viewer.close': 'Close ✕',
    'viewer.prev': '← Previous',
    'viewer.next': 'Next →',
    'viewer.others': 'More work',
    'viewer.year': 'Year',
    'viewer.client': 'Client',
    'viewer.role': 'Role',
    'viewer.category': 'Category',

    'about.title': "Haven't met yet? | CVisser Design",
    'about.desc': 'Christiaan Visser: creative content specialist, filmmaker and designer.',
    'about.portrait': 'Portrait of Christiaan',

    'contact.title': 'Contact | CVisser Design',
    'contact.desc': 'Get in touch with Christiaan Visser by email or phone.',
    'contact.h1': "Let's talk",
    'contact.lead': 'Got an idea, a project or just a question? Send me an email or give me a call. I would love to hear it.',
    'contact.mail': 'Email',
    'contact.phone': 'Phone',
    'contact.copy': 'Copy',
    'contact.copied': 'Copied!',

    'foot.title': 'Work together?',
    'foot.rights': '© 2026 CVisser Design',
  },
}

const KEY = 'lang'

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'nl' || saved === 'en') return saved
  } catch {}
  const browser = (navigator.languages?.[0] || navigator.language || 'nl').toLowerCase()
  return browser.startsWith('nl') ? 'nl' : 'en'
}

let lang = detect()

export const getLang = () => lang
export const t = (key) => dict[lang][key] ?? dict.nl[key] ?? key

// Tekst uit content (info.json / about.json): de Engelse variant als die er is, anders de Nederlandse
export const loc = (item, field) => (lang === 'en' && item.en?.[field]) || item[field]

export function apply(root = document) {
  const html = document.documentElement
  html.lang = lang
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n)
  for (const node of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of node.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':')
      node.setAttribute(attr.trim(), t(key.trim()))
    }
  }
  if (html.dataset.title) document.title = t(html.dataset.title)
  if (html.dataset.desc) document.querySelector('meta[name="description"]')?.setAttribute('content', t(html.dataset.desc))
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang))
  html.classList.remove('pending')
}

export function setLang(next) {
  if (next === lang) return
  lang = next
  try {
    localStorage.setItem(KEY, next)
  } catch {}
  apply()
  dispatchEvent(new CustomEvent('langchange', { detail: next }))
}
