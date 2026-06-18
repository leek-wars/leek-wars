/**
 * Cache du code des IA dans IndexedDB.
 *
 * Historiquement stocké dans localStorage (clés `ai/code/...` et `ai/mtime/...`),
 * ce cache pouvait saturer le quota ~5-10 Mo de localStorage sur une grosse IA
 * multi-fichiers et faire échouer la moindre écriture (QuotaExceededError, jusque
 * dans des écritures sans rapport comme la sauvegarde des onglets). IndexedDB offre
 * un quota bien plus large et isole ces données lourdes des métadonnées légères qui
 * restent en localStorage.
 *
 * API best-effort : toute erreur (mode privé, IndexedDB indisponible, quota) dégrade
 * silencieusement vers "pas de cache" — le code est alors re-téléchargé depuis le
 * serveur. La clé est namespacée par farmer ID, comme l'ancien schéma (cf. #2678).
 */
import { clear, del, get, set, setMany, createStore } from 'idb-keyval'
import { farmerId } from '@/model/store'

const store = createStore('leekwars', 'ai-code')

const LEGACY_CODE_PREFIX = 'ai/code/'
const LEGACY_MTIME_PREFIX = 'ai/mtime/'

interface AICacheEntry {
	code: string
	mtime: number
}

// La clé cache mirroite l'ancien suffixe localStorage : `<farmerId>/<path>`.
const cacheKey = (path: string) => farmerId() + '/' + path

/**
 * Déplace les anciennes entrées localStorage vers IndexedDB (one-shot, tous comptes
 * confondus), puis les supprime pour libérer le quota localStorage historique.
 * Mémoïsée : ne s'exécute qu'une fois, awaitée avant toute lecture.
 */
let migration: Promise<void> | null = null
function migrateLegacy(): Promise<void> {
	if (migration) { return migration }
	migration = (async () => {
		const entries: [string, AICacheEntry][] = []
		const obsolete: string[] = []
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i)
			if (!k || !k.startsWith(LEGACY_CODE_PREFIX)) { continue }
			const code = localStorage.getItem(k)
			if (code === null) { continue }
			// k = 'ai/code/<farmerId>/<path>' → suffixe = '<farmerId>/<path>'
			const id = k.slice(LEGACY_CODE_PREFIX.length)
			const mtime = parseInt(localStorage.getItem(LEGACY_MTIME_PREFIX + id) || '0', 10)
			entries.push([id, { code, mtime }])
			obsolete.push(k, LEGACY_MTIME_PREFIX + id)
		}
		if (entries.length) {
			await setMany(entries, store)
			for (const k of obsolete) { localStorage.removeItem(k) }
		}
	})().catch(() => { /* best-effort */ })
	return migration
}

export async function getAICache(path: string): Promise<AICacheEntry | null> {
	try {
		await migrateLegacy()
		return (await get<AICacheEntry>(cacheKey(path), store)) ?? null
	} catch {
		return null
	}
}

export async function setAICache(path: string, code: string, mtime: number): Promise<void> {
	try {
		await set(cacheKey(path), { code, mtime }, store)
	} catch { /* best-effort */ }
}

export async function removeAICache(path: string): Promise<void> {
	try {
		await del(cacheKey(path), store)
	} catch { /* best-effort */ }
}

/** Vide tout le cache (toutes IA, tous comptes). Appelé à la déconnexion (confidentialité). */
export async function clearAICache(): Promise<void> {
	try {
		await clear(store)
	} catch { /* best-effort */ }
}
