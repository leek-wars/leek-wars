/**
 * Écriture localStorage tolérante au quota.
 *
 * L'éditeur met en cache des données régénérables (code des IA, mtime, view-state
 * Monaco, position de scroll, onglets ouverts, historique). Sur une grosse IA
 * multi-fichiers, ces caches peuvent saturer le quota (~5-10 Mo). Une fois plein,
 * le moindre setItem lève QuotaExceededError et remontait jusqu'au handler global
 * d'erreurs (#admin/errors), alors qu'il s'agit de caches best-effort.
 *
 * Ce helper attrape le dépassement de quota, purge en priorité les caches de code
 * (les plus lourds, re-téléchargés depuis le serveur au chargement), puis réessaie.
 * En dernier recours il abandonne silencieusement : perdre une position de scroll
 * ou un view-state n'a aucun impact fonctionnel.
 */

// Préfixes des caches régénérables, du plus lourd au plus léger.
const EVICTABLE_PREFIXES = ['ai/code/', 'ai/mtime/', 'editor/viewstate/', 'editor/scroll/']

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
