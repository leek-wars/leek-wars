import { getMany, setMany, createStore } from 'idb-keyval'

const idbStore = createStore('leek-wars-data', 'game-data')
const LS_PREFIX = 'gd:'

const DATA_TYPES = [
	'items', 'chips', 'weapons', 'hats', 'pomps', 'potions', 'schemes',
	'components', 'trophies', 'constants', 'functions',
	'hat_templates', 'chip_templates', 'summon_templates',
	'trophy_categories', 'complexities',
] as const

interface Meta {
	master_version: string
	hashes: { [key: string]: string }
}

interface InlineData {
	master_version: string
	hashes: { [key: string]: string }
	data: { [key: string]: any }
}

function getApiUrl(): string {
	const port = window.location.port
	const LOCAL = port === '8500' || port === '5100'
	const DEV = port === '8080'
	if (LOCAL) return window.location.origin + '/api/'
	if (DEV) return 'https://leekwars.com/api/'
	return 'https://' + window.location.host + '/api/'
}

// --- Cache abstraction : IndexedDB avec fallback localStorage ---

let idbFailed = false

async function cacheLoad(skipVersionCheck = false): Promise<{ [key: string]: any } | null> {
	if (!idbFailed) {
		const result = await loadFromIdb(skipVersionCheck)
		if (result) return result
		idbFailed = true
	}
	return loadFromLs(skipVersionCheck)
}

function cacheSave(masterVersion: string, hashes: { [key: string]: string }, data: { [key: string]: any }) {
	if (!idbFailed) {
		saveToIdb(masterVersion, hashes, data)
	} else {
		saveToLs(masterVersion, hashes, data)
	}
}

// --- IndexedDB ---

async function loadFromIdb(skipVersionCheck = false): Promise<{ [key: string]: any } | null> {
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

		const result: { [key: string]: any } = {}
		for (let i = 0; i < DATA_TYPES.length; i++) {
			if (values[i + 1] == null) {
				console.warn(`[GameData] Missing type '${DATA_TYPES[i]}' in IndexedDB → invalidating cache`)
				return null
			}
			result[DATA_TYPES[i]] = values[i + 1]
		}
		return result
	} catch {
		return null
	}
}

function saveToIdb(masterVersion: string, hashes: { [key: string]: string }, data: { [key: string]: any }) {
	const entries: [string, any][] = [['meta', { master_version: masterVersion, hashes } as Meta]]
	for (const type of Object.keys(data)) {
		entries.push(['data:' + type, data[type]])
	}
	setMany(entries, idbStore)
		.then(() => console.log(`[GameData] Saved to IndexedDB`))
		.catch(e => console.warn('[GameData] IndexedDB save failed:', e))
}

// --- localStorage fallback ---

function loadFromLs(skipVersionCheck = false): { [key: string]: any } | null {
	try {
		const raw = localStorage.getItem(LS_PREFIX + 'meta')
		if (!raw) return null
		const meta = JSON.parse(raw) as Meta

		if (!skipVersionCheck) {
			const cookieVersion = getCookieMasterVersion()
			if (cookieVersion && meta.master_version !== cookieVersion) return null
		}

		const result: { [key: string]: any } = {}
		for (const type of DATA_TYPES) {
			const item = localStorage.getItem(LS_PREFIX + type)
			if (item == null) return null
			result[type] = JSON.parse(item)
		}
		console.log('[GameData] Loaded from localStorage (fallback)')
		return result
	} catch {
		return null
	}
}

function saveToLs(masterVersion: string, hashes: { [key: string]: string }, data: { [key: string]: any }) {
	try {
		localStorage.setItem(LS_PREFIX + 'meta', JSON.stringify({ master_version: masterVersion, hashes }))
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
export async function loadGameData(): Promise<{ [key: string]: any } | null> {
	const inline: InlineData | null = (window as any).__DATA__

	if (inline !== null) {
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
			// Aucun cache disponible → fetch complet
			console.warn('[GameData] No cache for unchanged types, fetching all from API...')
			try {
				const full = await fetchAll()
				for (const type of changedTypes) {
					full[type] = inline.data[type]
				}
				return full
			} catch (e) {
				console.warn('[GameData] API fetch also failed, using partial inline data:', e)
				return inline.data
			}
		}
		return inline.data
	}

	// __DATA__ null → tout est à jour, charger depuis le cache
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

async function fetchAll(): Promise<{ [key: string]: any }> {
	const api = getApiUrl()
	const response = await fetch(api + 'data/get-all')
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
