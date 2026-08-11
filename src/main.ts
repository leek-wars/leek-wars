import './polyfills'
import '@/model/vue'
import './global.scss'
// Marqueur visuel du dev local (leekwars.local) : fond extérieur bleuté
if (window.location.hostname === 'leekwars.local') { document.body.classList.add('local') }
import './sfw.scss'
if (localStorage.getItem('theme') === 'xp') import('./xp.scss')