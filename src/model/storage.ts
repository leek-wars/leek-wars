/**
 * Écriture localStorage tolérante au quota.
 *
 * L'éditeur met en cache des données régénérables en localStorage (view-state
 * Monaco, position de scroll, onglets ouverts, historique). Le code des IA, de loin
 * le plus lourd, vit désormais dans IndexedDB (cf. ai-code-cache.ts) et ne pèse plus
 * sur ce quota. Les caches restants peuvent malgré tout, en cumul, saturer le quota
 * (~5-10 Mo) ; une fois plein, le moindre setItem lève QuotaExceededError et remontait
 * jusqu'au handler global d'erreurs (#admin/errors), alors qu'il s'agit de caches
 * best-effort.
 *
 * Ce helper attrape le dépassement de quota, purge les caches régénérables, puis
 * réessaie. En dernier recours il abandonne silencieusement : perdre une position de
 * scroll ou un view-state n'a aucun impact fonctionnel.
 */

// Préfixes des caches régénérables, du plus lourd au plus léger.
const EVICTABLE_PREFIXES = ['editor/viewstate/', 'editor/scroll/']

function isQuotaError(e: unknown): boolean {
	// Selon les navigateurs : name QuotaExceededError, ou code 22 / 1014 (Firefox).
	return e instanceof DOMException && (
		e.name === 'QuotaExceededError' ||
		e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
		e.code === 22 ||
		e.code === 1014
	)
}

function evict(exceptKey: string): boolean {
	const toRemove: string[] = []
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key === null || key === exceptKey) continue
		if (EVICTABLE_PREFIXES.some(p => key.startsWith(p))) {
			toRemove.push(key)
		}
	}
	for (const key of toRemove) {
		localStorage.removeItem(key)
	}
	return toRemove.length > 0
}

export function setLocalStorageSafe(key: string, value: string): void {
	try {
		localStorage.setItem(key, value)
	} catch (e) {
		if (!isQuotaError(e)) throw e
		// Quota plein : on purge les caches régénérables et on réessaie une fois.
		if (evict(key)) {
			try {
				localStorage.setItem(key, value)
			} catch (e2) {
				if (!isQuotaError(e2)) throw e2
				// Toujours plein : on abandonne (cache best-effort).
			}
		}
	}
}
