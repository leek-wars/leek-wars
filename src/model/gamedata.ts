import { getMany, setMany, createStore } from 'idb-keyval'
import { retryDelay } from '@/model/retry-delay'

const idbStore = createStore('leek-wars-data', 'game-data')
const LS_PREFIX = 'gd:'

export const DATA_TYPES = [
	'items', 'chips', 'weapons', 'hats', 'pomps', 'potions', 'schemes',
	'components', 'trophies', 'constants', 'functions',
	'hat_templates', 'chip_templates', 'summon_templates',
	'trophy_categories', 'complexities', 'alterations',
] as const

interface Meta {
	master_version: string
	hashes: { [key: string]: string }
	// Types que le serveur connait reellement, deduits des hashes qu'il envoie.
	// Sans ca, un client plus recent que l'API invalide son cache a chaque
	// chargement, puisqu'un type de DATA_TYPES ne sera jamais rempli.
	types?: string[]
}

type GameDataMap = { [key: string]: unknown }

interface InlineData {
	master_version: string
	hashes: { [key: string]: string }
	data: GameDataMap
}

// Client de développement (Vite) : la page vient de Vite et non du serveur, qui
// est donc hors jeu pour tout ce qui passe par le HTML (cf. checkVersion).
const DEV = window.location.port === '8080'

function getApiUrl(): string {
	const port = window.location.port
	const LOCAL = port === '8500' || port === '5100' || window.location.hostname === 'leekwars.local' || window.location.hostname === 'leekwars-beta.local'
	if (LOCAL) return window.location.origin + '/api/'
	if (DEV) return 'https://leekwars.com/api/'
	return 'https://' + window.location.host + '/api/'
}

// --- Cache abstraction : IndexedDB avec fallback localStorage ---

// Safari et TOUS les navigateurs iOS (Chrome/CriOS, l'app Google, les WebView in-app) peuvent
// n'avoir AUCUN `indexedDB` : WebView sans stockage, mode Lockdown, navigation privée d'anciennes
// versions. Sur JSC, lire la variable nue lève une ReferenceError au lieu de valoir `undefined`,
// d'où la sonde par `typeof`. Sans elle, le premier `cacheSave()` du boot jetait cette
// ReferenceError de façon SYNCHRONE — idb-keyval n'ouvre la base qu'au premier usage du store,
// donc AVANT que le `.catch()` de saveToIdb soit attaché — et l'app démarrait sur l'écran
// « données indisponibles » au lieu de retomber sur localStorage.
const HAS_IDB = (() => {
	try { return typeof indexedDB !== 'undefined' && indexedDB !== null } catch { return false }
})()

let idbFailed = !HAS_IDB

async function cacheLoad(skipVersionCheck = false): Promise<GameDataMap | null> {
	if (!idbFailed) {
		const result = await loadFromIdb(skipVersionCheck)
		if (result) return result
	}
	return loadFromLs(skipVersionCheck)
}

function cacheSave(masterVersion: string, hashes: { [key: string]: string }, data: GameDataMap) {
	if (!idbFailed) {
		saveToIdb(masterVersion, hashes, data)
	} else {
		saveToLs(masterVersion, hashes, data)
	}
}

// --- IndexedDB ---

async function loadFromIdb(skipVersionCheck = false): Promise<GameDataMap | null> {
	try {
		const keys = ['meta', ...DATA_TYPES.map(t => 'data:' + t)]
		const values = await getMany(keys, idbStore)
		const meta = values[0] as Meta | undefined
		if (!meta) return null

		if (!skipVersionCheck) {
			const cookieVersion = getCookieMasterVersion()
			if (cookieVersion && meta.master_version !== cookieVersion) {
				console.warn(`[GameData] Version mismatch: IDB=${meta.master_version}, cookie=${cookieVersion} → invalidating cache`)
				return null
			}
		}

		const expected: readonly string[] = meta.types && meta.types.length ? meta.types : DATA_TYPES
		const result: GameDataMap = {}
		for (let i = 0; i < DATA_TYPES.length; i++) {
			const type = DATA_TYPES[i]
			if (values[i + 1] == null) {
				// Type absent du cache : anormal seulement si le serveur le sert.
				if (expected.includes(type)) {
					console.warn(`[GameData] Missing type '${type}' in IndexedDB → invalidating cache`)
					return null
				}
				continue
			}
			result[type] = values[i + 1]
		}
		return result
	} catch (e) {
		// Base illisible (quota, base corrompue, IndexedDB absent) : on n'y retouche plus de la
		// session. Un cache simplement VIDE, lui, ne condamne pas IndexedDB — sinon une première
		// visite basculait tout le monde sur localStorage, dont les 5 Mo ne tiennent pas le
		// catalogue, et le client refetchait tout à chaque chargement.
		idbFailed = true
		console.warn('[GameData] IndexedDB read failed, falling back to localStorage:', e)
		return null
	}
}

function saveToIdb(masterVersion: string, hashes: { [key: string]: string }, data: GameDataMap) {
	const entries: [string, unknown][] = [['meta', { master_version: masterVersion, hashes, types: Object.keys(hashes) } as Meta]]
	for (const type of Object.keys(data)) {
		entries.push(['data:' + type, data[type]])
	}
	const fallback = (e: unknown) => {
		idbFailed = true
		console.warn('[GameData] IndexedDB save failed, falling back to localStorage:', e)
		saveToLs(masterVersion, hashes, data)
	}
	// try/catch ET .catch() : idb-keyval ouvre la base au premier usage du store, donc un
	// environnement sans IndexedDB throw ICI, synchroniquement, avant qu'aucune promesse
	// n'existe — le .catch() seul ne le verrait jamais.
	try {
		setMany(entries, idbStore)
			.then(() => console.log(`[GameData] Saved to IndexedDB`))
			.catch(fallback)
	} catch (e) {
		fallback(e)
	}
}

// --- localStorage fallback ---

function loadFromLs(skipVersionCheck = false): GameDataMap | null {
	try {
		const raw = localStorage.getItem(LS_PREFIX + 'meta')
		if (!raw) return null
		const meta = JSON.parse(raw) as Meta

		if (!skipVersionCheck) {
			const cookieVersion = getCookieMasterVersion()
			if (cookieVersion && meta.master_version !== cookieVersion) return null
		}

		const expected: readonly string[] = meta.types && meta.types.length ? meta.types : DATA_TYPES
		const result: GameDataMap = {}
		for (const type of DATA_TYPES) {
			const item = localStorage.getItem(LS_PREFIX + type)
			if (item == null) {
				if (expected.includes(type)) return null
				continue
			}
			result[type] = JSON.parse(item)
		}
		console.log('[GameData] Loaded from localStorage (fallback)')
		return result
	} catch {
		return null
	}
}

function saveToLs(masterVersion: string, hashes: { [key: string]: string }, data: GameDataMap) {
	try {
		localStorage.setItem(LS_PREFIX + 'meta', JSON.stringify({ master_version: masterVersion, hashes, types: Object.keys(hashes) }))
		for (const type of Object.keys(data)) {
			localStorage.setItem(LS_PREFIX + type, JSON.stringify(data[type]))
		}
	} catch { /* quota exceeded — tant pis, on a IndexedDB ou le fetch */ }
}

// --- Chargement principal ---

/**
 * Charge les données de jeu. Sync si __DATA__ présent, async (IndexedDB/localStorage) sinon.
 * À appeler AVANT le mount Vue.
 */
export async function loadGameData(): Promise<GameDataMap | null> {
	// `!= null` pour catcher aussi `undefined` : si le script inline `var __DATA__=...`
	// ne s'exécute pas (CSP nonce mismatch, parse error, extension qui réécrit le DOM),
	// `window.__DATA__` reste `undefined` au lieu de `null`.
	const inline: InlineData | null | undefined = (window as unknown as { __DATA__?: InlineData | null }).__DATA__

	if (inline != null) {
		const changedTypes = Object.keys(inline.data)
		console.log(`[GameData] Inline: ${changedTypes.length} types changed, master_version=${inline.master_version}`)

		cacheSave(inline.master_version, inline.hashes, inline.data)
		updateCookie(inline.master_version, inline.hashes)

		if (changedTypes.length < DATA_TYPES.length) {
			const cached = await cacheLoad(true)
			if (cached) {
				for (const type of changedTypes) {
					cached[type] = inline.data[type]
				}
				return cached
			}
			// Aucun cache disponible → fetch complet (laisse l'erreur remonter si fetchAll échoue,
			// retourner inline.data partiel laisserait LeekWars.hats/etc. vides → crash render).
			console.warn('[GameData] No cache for unchanged types, fetching all from API...')
			const full = await fetchAll()
			for (const type of changedTypes) {
				full[type] = inline.data[type]
			}
			return full
		}
		return inline.data
	}

	// __DATA__ null → tout est à jour, charger depuis le cache.
	//
	// Sauf en dev : la page vient de Vite, jamais du serveur. Or c'est le serveur
	// qui pose le cookie `data_hashes` quand il sert le HTML ; ici, le seul à
	// l'écrire est le client lui-même, juste après avoir écrit le cache. Cookie
	// et cache ne peuvent donc plus diverger, la comparaison de version ne
	// déclenche jamais rien et le catalogue reste FIGÉ sur son premier
	// chargement : tout ce qui a été ajouté côté serveur depuis manque pour
	// toujours (un composant équipé dont l'item est introuvable, et l'écran du
	// poireau qui avertit en boucle). On demande donc la version au serveur —
	// une requête légère — et on recharge tout si elle a bougé.
	if (DEV) {
		const serverVersion = await fetchMasterVersion()
		const cachedVersion = getCookieMasterVersion()
		if (serverVersion !== null && serverVersion !== cachedVersion) {
			console.log(`[GameData] Dev: server version ${serverVersion} != cached ${cachedVersion} → full reload`)
			return await fetchAll()
		}
	}

	console.log('[GameData] __DATA__ null, loading from cache...')
	const t0 = performance.now()
	const cached = await cacheLoad()
	const dt = (performance.now() - t0).toFixed(1)

	if (cached) {
		console.log(`[GameData] Loaded from cache in ${dt}ms, master_version=${getCookieMasterVersion()}`)
		return cached
	}

	console.log('[GameData] No cache → fetching from API...')
	return await fetchAll()
}

// Version du dataset côté serveur. null si l'appel échoue : hors ligne, on garde
// le cache — un catalogue peut-être périmé vaut mieux qu'une app qui ne démarre pas.
async function fetchMasterVersion(): Promise<string | null> {
	try {
		const response = await fetch(getApiUrl() + 'data/version')
		if (!response.ok) return null
		const json = await response.json()
		return json.master_version ?? null
	} catch (e) {
		console.warn('[GameData] Version check failed, keeping cache', e)
		return null
	}
}

// Échouer cette requête empêche l'app de démarrer : sans catalogue, tout rendu qui lit
// LeekWars.chips/hats casse, et vue.ts affiche l'écran « données indisponibles ». Or elle
// échoue surtout peu APRÈS un déploiement, le temps que l'API reparte — une coupure de
// quelques secondes. On réessaie donc avant d'abandonner.
//
// Deux reprises et non les trois de RETRY_CONFIG : ici le joueur attend devant l'écran de
// chargement, et la troisième coûterait quatre secondes de plus avant l'écran d'erreur.
// Le DÉLAI, lui, est celui de tout le monde — c'est-à-dire avec son aléa. Un déploiement
// fait justement repartir toute la cohorte en même temps, chaque cache manque le nouveau
// catalogue, et un backoff exact rejouerait le troupeau entier dans la même seconde : le
// cas précis que l'aléa de retryDelay existe pour casser.
const FETCH_RETRIES = 2

// Sans délai de garde, la reprise ne sert à rien dans le cas même qu'elle vise : quand l'API
// redémarre, le proxy accepte souvent la connexion et la laisse PENDRE — `fetch` ne rejette
// alors qu'au bout du délai réseau du navigateur, plusieurs minutes plus tard, et aucune
// reprise ne part. Dix secondes : la réponse fait ~400 ko (~80 ko compressés), soit ~3 s sur
// un lien mobile lent — on garde trois fois la marge pour ne pas couper une connexion qui
// avance vraiment.
const FETCH_TIMEOUT = 10000

// Transitoire, donc à reprendre : coupure réseau (fetch lève), API qui redémarre (5xx), et
// limitation de débit (429) — que toute autre requête du client reprend déjà. Le reste des
// 4xx ne guérira pas en attendant.
function isTransient(status: number): boolean {
	return status >= 500 || status === 429
}

async function fetchRetrying(url: string): Promise<Response> {
	for (let attempt = 0; ; attempt++) {
		const last = attempt === FETCH_RETRIES
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
			// Sur la dernière tentative on rend la réponse telle quelle : c'est à l'appelant
			// d'en faire une erreur.
			if (last || response.ok || !isTransient(response.status)) return response
		} catch (e) {
			if (last) throw e
		}
		const delay = retryDelay(attempt)
		console.warn(`[GameData] ${url} failed — retry ${attempt + 1}/${FETCH_RETRIES} in ${delay}ms`)
		await new Promise(resolve => setTimeout(resolve, delay))
	}
}

async function fetchAll(): Promise<GameDataMap> {
	const api = getApiUrl()
	const response = await fetchRetrying(api + 'data/get-all')
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	const json = await response.json()

	const data = json.data
	console.log(`[GameData] Fetched ${Object.keys(data).length} types from API, master_version=${json.master_version}`)

	cacheSave(json.master_version, json.hashes, data)
	updateCookie(json.master_version, json.hashes)

	return data
}

function getCookieMasterVersion(): string | null {
	const match = document.cookie.match(/(?:^|;\s*)data_hashes=([^:;]+)/)
	return match ? match[1] : null
}

function updateCookie(masterVersion: string, hashes: { [key: string]: string }) {
	const pairs = DATA_TYPES
		.filter(t => hashes[t])
		.map(t => t + '=' + hashes[t])
	const value = masterVersion + ':' + pairs.join(',')
	document.cookie = 'data_hashes=' + value + ';path=/;max-age=31536000;samesite=lax'
}
