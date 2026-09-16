import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DATA_TYPES } from './gamedata'

// Safari et tous les navigateurs iOS peuvent n'avoir AUCUN `indexedDB` (WebView in-app, mode
// Lockdown, navigation privée d'anciennes versions) : sur JSC, la variable nue lève une
// ReferenceError au lieu de valoir `undefined`. idb-keyval n'ouvre la base qu'au PREMIER usage
// du store, donc ce throw partait de `setMany()` de façon synchrone, avant que le `.catch()`
// de saveToIdb soit attaché — la promesse de loadGameData partait en rejet et le boot affichait
// l'écran « données indisponibles » (3 rapports en 6 jours, tous iOS).
//
// Le module lit `indexedDB` une fois à l'import : chaque test le réimporte donc à neuf, avec ou
// sans la variable globale.
function inlineData() {
	const hashes: Record<string, string> = {}
	const data: Record<string, unknown> = {}
	for (const type of DATA_TYPES) {
		hashes[type] = 'h'
		data[type] = [type]
	}
	return { master_version: 'v1', hashes, data }
}

const globals = globalThis as { indexedDB?: unknown }
let savedIndexedDB: unknown
let hadIndexedDB = false

beforeEach(() => {
	hadIndexedDB = 'indexedDB' in globals
	savedIndexedDB = globals.indexedDB
	vi.resetModules()
	localStorage.clear()
})

afterEach(() => {
	if (hadIndexedDB) globals.indexedDB = savedIndexedDB
	else delete globals.indexedDB
	delete (window as unknown as { __DATA__?: unknown }).__DATA__
})

describe('chargement des données de jeu sans IndexedDB', () => {
	it('retombe sur localStorage au lieu de faire échouer le boot', async () => {
		delete globals.indexedDB
		expect(typeof indexedDB).toBe('undefined')

		;(window as unknown as { __DATA__?: unknown }).__DATA__ = inlineData()
		const { loadGameData } = await import('./gamedata')

		// Avant le correctif : rejet ReferenceError « Can't find variable: indexedDB ».
		const loaded = await loadGameData()
		expect(loaded).not.toBeNull()
		expect(Object.keys(loaded!).sort()).toEqual([...DATA_TYPES].sort())

		// Le cache a bien été écrit dans le repli localStorage, sinon ces clients
		// refetcheraient tout le catalogue à chaque chargement.
		expect(localStorage.getItem('gd:meta')).toContain('v1')
		expect(localStorage.getItem('gd:chips')).toBe(JSON.stringify(['chips']))
	})
})
