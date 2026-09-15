import { RouteLocationNormalized } from "vue-router"
import { LeekWars } from "./model/leekwars"

// Hauteur des barres fixes en haut de la fenêtre : le bandeau v3
// (`header.header`, fixe depuis le redesign 3.0) et la barre du mode
// application (`.app-bar`). `window.scrollTo` cale l'ancre au ras du haut de la
// fenêtre, donc SOUS ces barres : un lien vers un message du forum scrollait
// d'une hauteur de bandeau trop bas. On mesure plutôt que de coder la hauteur
// en dur, qui dépend du thème (v2 : barre dans le flux, rien à retrancher), de
// la largeur (130 px sous 600 px déconnecté) et du mode application.
const SCROLL_GAP = 10
function fixed_top_offset(): number {
	let offset = 0
	for (const selector of ['header.header', '.app-bar']) {
		const bar = document.querySelector(selector)
		if (!bar) { continue }
		const style = getComputedStyle(bar)
		if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') { continue }
		const bottom = bar.getBoundingClientRect().bottom
		if (bottom > offset) { offset = bottom }
	}
	// Repli sur l'ancienne valeur en dur si aucune barre fixe n'a été trouvée
	// (thème v2, barre pas encore montée) : sur mobile il y en a toujours une.
	if (offset === 0 && LeekWars.mobile) { return 56 }
	return offset === 0 ? 0 : offset + SCROLL_GAP
}

// Le scroll part dès que l'élément existe, donc avant que les images au-dessus
// de lui (celles d'un message du forum, sans dimensions connues du HTML) aient
// leur hauteur : la cible redescend APRÈS coup, d'autant plus qu'on arrive avec
// un cache froid — le cas de quelqu'un qui suit un lien. On réaligne pendant
// deux secondes, et on lâche à la première intention de l'utilisateur.
const SCROLL_SETTLE_DURATION = 2000
const SCROLL_CANCEL_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown']
let scroll_request = 0

function scroll_to_hash(hash: string, route: RouteLocationNormalized) {
	const id = decodeURIComponent(hash).replace(/'/g, '~').substring(1)
	const element = document.getElementById(id)
	// console.log("scroll element", id, element, route)
	if (!element) { return }
	// Un nouveau saut d'ancre (le « # » d'un message, un lien du sommaire)
	// périme le précédent, sinon les deux réalignements se disputent la page.
	const request = ++scroll_request
	let cancelled = false
	const cancel = () => { cancelled = true }
	for (const event of SCROLL_CANCEL_EVENTS) {
		window.addEventListener(event, cancel, { passive: true })
	}
	const stop = () => {
		for (const event of SCROLL_CANCEL_EVENTS) {
			window.removeEventListener(event, cancel)
		}
	}
	const start = Date.now()
	const align = () => {
		if (cancelled || request !== scroll_request) { stop() ; return }
		const offset = fixed_top_offset() + ((route.meta?.scrollOffset as number) || 0)
		const top = element.getBoundingClientRect().top + window.scrollY - offset
		if (Math.abs(top - window.scrollY) > 1) { window.scrollTo(0, top) }
		if (Date.now() - start < SCROLL_SETTLE_DURATION) { requestAnimationFrame(align) } else { stop() }
	}
	setTimeout(align)
}

export { scroll_to_hash }
