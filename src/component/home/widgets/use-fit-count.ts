import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

/*
 * Nombre d'éléments d'une liste qui tiennent entièrement dans leur conteneur
 * (widgets sans défilement de la page d'accueil) : mesure la hauteur disponible
 * et celle de la première rangée, et recalcule à chaque redimensionnement ou
 * changement de contenu. Gère les grilles multi-colonnes en comptant les
 * éléments alignés sur la première rangée. Suppose des rangées de hauteur
 * homogène ; le conteneur doit être en overflow: hidden (filet de sécurité si
 * la mesure tombe entre deux rangées).
 */
export function useFitCount(container: Ref<HTMLElement | null>, itemSelector: string, max: number, gap = 0) {
	const count = ref(max)
	let resizeObserver: ResizeObserver | null = null
	let mutationObserver: MutationObserver | null = null

	function update(chained = false) {
		const el = container.value
		if (!el) return
		const items = el.querySelectorAll(itemSelector)
		if (!items.length) return
		const firstRect = (items[0] as HTMLElement).getBoundingClientRect()
		if (firstRect.height <= 0) return
		// Éléments par rangée : ceux alignés avec le premier (grilles multi-colonnes).
		let perRow = 0
		for (const item of items) {
			if (Math.abs((item as HTMLElement).getBoundingClientRect().top - firstRect.top) < 1) perRow++
			else break
		}
		const rows = Math.max(1, Math.floor((el.clientHeight + gap) / (firstRect.height + gap)))
		const fit = Math.min(max, rows * Math.max(1, perRow))
		if (fit !== count.value) {
			count.value = fit
			// Une seule re-mesure après re-rendu : le nombre de colonnes peut avoir changé.
			if (!chained) nextTick(() => update(true))
		}
	}

	watch(container, el => {
		if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
		if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null }
		if (el) {
			resizeObserver = new ResizeObserver(() => update())
			resizeObserver.observe(el)
			// Le contenu arrive souvent après coup (requête API, composant async) :
			// la taille du conteneur ne bouge pas, il faut aussi observer le DOM.
			mutationObserver = new MutationObserver(() => update())
			mutationObserver.observe(el, { childList: true, subtree: true })
			nextTick(() => update())
		}
	}, { immediate: true })

	onBeforeUnmount(() => {
		if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
		if (mutationObserver) { mutationObserver.disconnect(); mutationObserver = null }
	})

	return count
}
