import { getMany, setMany, createStore } from 'idb-keyval'

const store = createStore('leek-wars-data', 'game-data')

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

/**
 * Charge les données de jeu. Sync si __DATA__ présent, async (IndexedDB) sinon.
 * À appeler AVANT le mount Vue.
 */
export async function loadGameData(): Promise<{ [key: string]: any } | null> {
	const inline: InlineData | null = (window as any).__DATA__

	if (inline !== null) {
		// Données inline (premier chargement ou données changées) → sync
		const changedTypes = Object.keys(inline.data)
		console.log(`[GameData] Inline: ${changedTypes.length} types changed`)

		// Sauvegarder en IndexedDB en background (fire & forget)
		saveToIdb(inline.master_version, inline.hashes, inline.data)
		updateCookie(inline.master_version, inline.hashes)

		// Charger les types non-changés depuis IndexedDB
		if (changedTypes.length < DATA_TYPES.length) {
			const cached = await loadFromIdb()
			if (cached) {
				// Merge : inline écrase le cache
				for (const type of changedTypes) {
					cached[type] = inline.data[type]
				}
				return cached
			}
		}
		return inline.data
	}

	// __DATA__ null → tout est à jour, charger depuis IndexedDB
	console.log('[GameData] __DATA__ null, loading from IndexedDB...')
	const t0 = performance.now()
	const cached = await loadFromIdb()
	const dt = (performance.now() - t0).toFixed(1)

	if (cached) {
		console.log(`[GameData] Loaded from IndexedDB in ${dt}ms`)
		return cached
	}

	// Pas de cache → fetch API (premier chargement dev mode)
	console.log('[GameData] No cache → fetching from API...')
	return await fetchAll()
}

async function loadFromIdb(): Promise<{ [key: string]: any } | null> {
	try {
		const keys = ['meta', ...DATA_TYPES.map(t => 'data:' + t)]
		const values = await getMany(keys, store)
		const meta = values[0] as Meta | undefined
		if (!meta) return null
		const result: { [key: string]: any } = {}
		for (let i = 0; i < DATA_TYPES.length; i++) {
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
	setMany(entries, store)
		.then(() => console.log(`[GameData] Saved to IndexedDB`))
		.catch(e => console.warn('[GameData] IndexedDB save failed:', e))
}

async function fetchAll(): Promise<{ [key: string]: any }> {
	const api = getApiUrl()
	const response = await fetch(api + 'data/get-all')
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	const json = await response.json()

	const data = json.data
	console.log(`[GameData] Fetched ${Object.keys(data).length} types from API`)

	saveToIdb(json.master_version, json.hashes, data)
	updateCookie(json.master_version, json.hashes)

	return data
}

function updateCookie(masterVersion: string, hashes: { [key: string]: string }) {
	const pairs = DATA_TYPES
		.filter(t => hashes[t])
		.map(t => t + '=' + hashes[t])
	const value = masterVersion + ':' + pairs.join(',')
	document.cookie = 'data_hashes=' + value + ';path=/;max-age=31536000;samesite=lax'
}
