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

function scroll_to_hash(hash: string, route: RouteLocationNormalized) {
	const id = decodeURIComponent(hash).replace(/'/g, '~').substring(1)
	const element = document.getElementById(id)
	// console.log("scroll element", id, element, route)
	if (element) {
		setTimeout(() => {
			const offset = fixed_top_offset() + ((route.meta?.scrollOffset as number) || 0)
			window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - offset)
		})
	}
}

export { scroll_to_hash }
