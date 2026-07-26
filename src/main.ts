import './polyfills'
import '@/model/vue'
import './global.scss'
// Marqueur visuel du dev local (leekwars.local) : fond extérieur bleuté
if (window.location.hostname === 'leekwars.local') { document.body.classList.add('local') }
// Marqueur visuel de la version beta locale (leekwars-beta.local) : fond violet
if (window.location.hostname === 'leekwars-beta.local') { document.body.classList.add('beta-local') }
import './sfw.scss'
if (localStorage.getItem('theme') === 'xp') import('./xp.scss')