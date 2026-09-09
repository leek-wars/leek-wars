import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

/*
 * Nombre d'éléments d'une liste qui tiennent entièrement dans leur conteneur
 * (widgets sans défilement de la page d'accueil) : mesure la hauteur disponible
 * et celle de la première rangée, et recalcule à chaque redimensionnement ou
 * changement de contenu. Gère les grilles multi-colonnes en comptant les
 * éléments alignés sur la première rangée. Suppose des rangées de hauteur
 * homogène ; le conteneur doit être en overflow: hidden (filet de sécurité si
 * la mesure tombe entre deux rangées).
 *
 * `rowHeight` : à fournir quand les rangées s'étirent pour remplir le conteneur.
 * Leur hauteur mesurée dépend alors du nombre affiché, donc de la mesure
 * elle-même — le compte se figerait et n'augmenterait plus jamais quand le
 * widget grandit. On part dans ce cas de leur hauteur naturelle, connue de
 * l'appelant (une seule colonne, pas de mesure du DOM).
 */
export function useFitCount(container: Ref<HTMLElement | null>, itemSelector: string, max: number, gap = 0, rowHeight = 0) {
	const count = ref(max)
	let resizeObserver: ResizeObserver | null = null
	let mutationObserver: MutationObserver | null = null
	// Pas de rangée mesuré entre DEUX rangées réelles, gardé pour les mesures où
	// une seule est rendue : l'estimation « hauteur + marges + gap » diffère du
	// vrai pas dès que le gap CSS n'est pas celui passé en paramètre (le widget
	// trophées passe 8, le v3 pose 14), et le compte oscillait alors entre 1 et 2
	// à chaque mutation — une boucle de rendu qui gelait l'accueil mobile de
	// Pierre (2026-09-09). Deuxième filet : deux comptes qui se répondent
	// (a → b → a) dans la foulée sont figés au plus petit — dans la foulée
	// seulement, un vrai va-et-vient de redimensionnement doit suivre.
	let knownPitch = 0
	let previous = 0
	let changedAt = 0

	function update(chained = false) {
		const el = container.value
		if (!el) return
		if (rowHeight > 0) {
			if (el.clientHeight <= 0) return
			setCount(Math.min(max, Math.max(1, Math.floor((el.clientHeight + gap) / (rowHeight + gap)))), chained)
			return
		}
		const items = el.querySelectorAll(itemSelector)
		if (!items.length) return
		const firstRect = (items[0] as HTMLElement).getBoundingClientRect()
		if (firstRect.height <= 0) return
		// Éléments par rangée : ceux alignés avec le premier (grilles multi-colonnes).
		// Pas de rangée : distance réelle entre les deux premières rangées si possible
		// (marges internes et gaps compris), sinon hauteur + marges + gap.
		let perRow = 0
		let pitch = 0
		for (const item of items) {
			const top = (item as HTMLElement).getBoundingClientRect().top
			if (Math.abs(top - firstRect.top) < 1) perRow++
			else { pitch = top - firstRect.top; break }
		}
		if (pitch > 0) {
			knownPitch = pitch
		} else if (knownPitch > 0) {
			pitch = knownPitch
		} else {
			const style = getComputedStyle(items[0] as HTMLElement)
			pitch = firstRect.height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0) + gap
		}
		const rows = Math.max(1, Math.floor((el.clientHeight + gap) / pitch))
		setCount(Math.min(max, rows * Math.max(1, perRow)), chained)
	}

	function setCount(fit: number, chained: boolean) {
		if (fit === count.value) return
		// Oscillation a → b → a : on retient le plus petit des deux, celui qui tient
		// à coup sûr, et on ne relance pas la mesure.
		const now = performance.now()
		if (fit === previous && now - changedAt < 250) {
			const settled = Math.min(fit, count.value)
			previous = count.value
			count.value = settled
			changedAt = now
			return
		}
		previous = count.value
		count.value = fit
		changedAt = now
		// Une seule re-mesure après re-rendu : le nombre de colonnes peut avoir changé.
		if (!chained) nextTick(() => update(true))
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
