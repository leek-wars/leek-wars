import { ref, watch, type Ref } from 'vue'

/**
 * Repli des catégories d'une liste de documentation (fonctions LeekScript, API HTTP).
 *
 * Hors recherche, l'état ouvert/replié est une préférence persistée dans localStorage.
 * Pendant une recherche, toutes les catégories s'ouvrent pour montrer les résultats mais
 * restent repliables (#4661) : cet état replié est distinct de la préférence et repart
 * ouvert à chaque changement de la recherche.
 */
export function useCategoryState(storagePrefix: string, query: Ref<string>) {
	const categoryState = ref<Record<string | number, boolean>>({})
	const searchCollapsed = ref<Record<string | number, boolean>>({})
	watch(query, () => { searchCollapsed.value = {} })

	function loadCategoryState(categories: Iterable<string | number>) {
		for (const c of categories) {
			categoryState.value[c] = localStorage.getItem(storagePrefix + c) === 'true'
		}
	}

	function isCategoryOpen(c: string | number): boolean {
		return query.value.length ? !searchCollapsed.value[c] : !!categoryState.value[c]
	}

	function toggleCategory(c: string | number) {
		if (query.value.length) {
			searchCollapsed.value[c] = !searchCollapsed.value[c]
			return
		}
		categoryState.value[c] = !categoryState.value[c]
		localStorage.setItem(storagePrefix + c, '' + categoryState.value[c])
	}

	return { loadCategoryState, isCategoryOpen, toggleCategory }
}
