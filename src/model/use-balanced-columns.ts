import { onBeforeUnmount, ref, unref, watch, type Ref } from 'vue'

/**
 * Nombre de colonnes d'une grille pour que ses rangées soient ÉQUILIBRÉES.
 *
 * `repeat(auto-fill, minmax(X, 1fr))` remplit chaque rangée au maximum et laisse
 * la dernière en plan : dix récompenses de parrainage dans neuf colonnes donnent
 * 9 + 1, quatre poireaux dans trois colonnes donnent 3 + 1. On garde le nombre de
 * RANGÉES que la largeur impose — c'est lui qui dit combien de place il y a — puis
 * on répartit les éléments dessus : 5 + 5, 2 + 2.
 *
 * Les colonnes restent de largeur égale (`1fr`) : quand le compte n'est pas
 * divisible par le nombre de rangées, c'est la dernière qui est incomplète
 * (9 éléments sur 2 rangées → 5 + 4), jamais les largeurs qui se déforment.
 *
 * `minWidth` et `gap` doivent valoir ce que la feuille de style applique, sinon
 * le calcul de rangées et le rendu divergent d'une colonne.
 */
export function useBalancedColumns(container: Ref<HTMLElement | null>, count: Ref<number> | number, minWidth: number, gap = 0) {
	const columns = ref(Math.max(1, unref(count)))
	let observer: ResizeObserver | null = null

	function update() {
		const el = container.value
		const n = unref(count)
		if (!el || n < 1) return
		const width = el.clientWidth
		// Conteneur pas encore mesurable (onglet caché, panneau replié) : on garde
		// la valeur précédente plutôt que de retomber à une colonne.
		if (width <= 0) return
		// Le dernier élément n'a pas de gouttière après lui, d'où le `+ gap` des deux côtés.
		const max = Math.max(1, Math.floor((width + gap) / (minWidth + gap)))
		const rows = Math.ceil(n / max)
		columns.value = Math.min(n, Math.ceil(n / rows))
	}

	watch(container, el => {
		if (observer) { observer.disconnect(); observer = null }
		if (el) {
			observer = new ResizeObserver(() => update())
			observer.observe(el)
			update()
		}
	}, { immediate: true })

	// Le contenu peut arriver après le conteneur (requête API) : le nombre change
	// sans que la largeur bouge, l'observateur de taille ne se déclencherait pas.
	if (typeof count !== 'number') watch(count, () => update())

	onBeforeUnmount(() => {
		if (observer) { observer.disconnect(); observer = null }
	})

	return columns
}
