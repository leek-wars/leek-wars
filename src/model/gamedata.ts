import { get as idbGet, set as idbSet, createStore } from 'idb-keyval'

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

export async function loadGameData(): Promise<{ [key: string]: any }> {
	const inline: InlineData | null = (window as any).__DATA__

	console.log('[GameData] __DATA__', inline === null ? 'null' : `present (${Object.keys(inline.data).length} types)`)

	// Charger les métadonnées du cache
	let meta: Meta | undefined
	try {
		meta = await idbGet<Meta>('meta', store)
		console.log('[GameData] IndexedDB:', meta ? `found (master=${meta.master_version})` : 'empty')
	} catch (e) {
		console.warn('[GameData] IndexedDB read failed:', e)
	}

	if (inline === null) {
		if (meta) {
			// Cache hit : charger chaque type depuis IndexedDB
			console.log('[GameData] Cache hit, no changes')
			return await loadAllFromIdb()
		}
		console.log('[GameData] No cache, no inline → fetching from API...')
		return await fetchAll()
	}

	// Données inline : merge avec le cache
	const changedTypes = Object.keys(inline.data)
	console.log(`[GameData] Changed:`, changedTypes)

	// Sauvegarder les types changés dans IndexedDB
	const savePromises: Promise<void>[] = []
	for (const type of changedTypes) {
		savePromises.push(idbSet('data:' + type, inline.data[type], store))
	}
	savePromises.push(idbSet('meta', { master_version: inline.master_version, hashes: inline.hashes } as Meta, store))
	Promise.all(savePromises)
		.then(() => console.log(`[GameData] Saved ${changedTypes.length} types to IndexedDB`))
		.catch(e => console.warn('[GameData] IndexedDB save failed:', e))

	updateCookie(inline.master_version, inline.hashes)

	// Charger tous les types (changés depuis inline, le reste depuis IndexedDB)
	const result: { [key: string]: any } = {}
	for (const type of DATA_TYPES) {
		if (inline.data[type] !== undefined) {
			result[type] = inline.data[type]
		} else {
			try {
				result[type] = await idbGet('data:' + type, store)
			} catch { /* type pas encore en cache */ }
		}
	}
	return result
}

async function fetchAll(): Promise<{ [key: string]: any }> {
	const api = getApiUrl()
	const response = await fetch(api + 'data/get-all')
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	const json = await response.json()

	const data = json.data
	console.log(`[GameData] Fetched ${Object.keys(data).length} types from API`)

	// Sauvegarder chaque type séparément
	const savePromises: Promise<void>[] = []
	for (const type of Object.keys(data)) {
		savePromises.push(idbSet('data:' + type, data[type], store))
	}
	savePromises.push(idbSet('meta', { master_version: json.master_version, hashes: json.hashes } as Meta, store))
	Promise.all(savePromises)
		.then(() => console.log('[GameData] Saved to IndexedDB'))
		.catch(e => console.warn('[GameData] IndexedDB save failed:', e))

	updateCookie(json.master_version, json.hashes)

	return data
}

async function loadAllFromIdb(): Promise<{ [key: string]: any }> {
	const result: { [key: string]: any } = {}
	for (const type of DATA_TYPES) {
		try {
			result[type] = await idbGet('data:' + type, store)
		} catch { /* pas en cache */ }
	}
	return result
}

function updateCookie(masterVersion: string, hashes: { [key: string]: string }) {
	const pairs = DATA_TYPES
		.filter(t => hashes[t])
		.map(t => t + '=' + hashes[t])
	const value = masterVersion + ':' + pairs.join(',')
	document.cookie = 'data_hashes=' + value + ';path=/;max-age=31536000;samesite=lax'
	console.log('[GameData] Cookie updated')
}
