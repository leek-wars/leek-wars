import { ref, watch, type Ref } from 'vue'
import { setLocalStorageSafe } from '@/model/storage'

/**
 * Repli des catégories d'une liste de documentation (fonctions LeekScript, API HTTP) :
 * préférence persistée hors recherche ; pendant une recherche, tout est ouvert pour montrer
 * les résultats mais reste repliable (#4661), et ce repli repart de zéro à chaque frappe.
 */
export function useCategoryState(storagePrefix: string, query: Ref<string>) {
	const openedPreference = ref<Record<string, boolean>>({})
	const collapsedDuringSearch = ref<Record<string, boolean>>({})
	watch(query, () => { collapsedDuringSearch.value = {} })

	function isCategoryOpen(c: string | number): boolean {
		if (query.value.length) return !collapsedDuringSearch.value[c]
		return openedPreference.value[c] ?? localStorage.getItem(storagePrefix + c) === 'true'
	}

	function toggleCategory(c: string | number) {
		if (query.value.length) {
			collapsedDuringSearch.value[c] = !collapsedDuringSearch.value[c]
			return
		}
		openedPreference.value[c] = !isCategoryOpen(c)
		setLocalStorageSafe(storagePrefix + c, '' + openedPreference.value[c])
	}

	return { isCategoryOpen, toggleCategory }
}
