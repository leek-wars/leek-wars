import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DATA_TYPES } from './gamedata'

// Safari et tous les navigateurs iOS peuvent n'avoir AUCUN `indexedDB` (WebView in-app, mode
// Lockdown, navigation privée d'anciennes versions) : sur JSC, la variable nue lève une
// ReferenceError au lieu de valoir `undefined`. idb-keyval n'ouvre la base qu'au PREMIER usage
// du store, donc ce throw partait de `setMany()` de façon synchrone, avant que le `.catch()`
// de saveToIdb soit attaché — la promesse de loadGameData partait en rejet et le boot affichait
// l'écran « données indisponibles ».
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

// Fenêtre de déploiement : le joueur charge le nouveau build, son cache ne couvre pas le nouveau
// catalogue, et `data/get-all` tombe pendant les quelques secondes où l'API redémarre. Sans
// reprise, le boot part en rejet (`TypeError: Failed to fetch`) et l'écran « données
// indisponibles » s'affiche.
describe('reprise de data/get-all', () => {

	beforeEach(() => { vi.useFakeTimers() })
	afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

	// Chaque tentative attend un timer : on laisse tourner l'horloge pendant que la promesse vit.
	// Seule l'issue du boot compte ici, le catalogue rendu est couvert plus haut.
	async function bootSucceeds(fetchMock: ReturnType<typeof vi.fn>) {
		vi.stubGlobal('fetch', fetchMock)
		// Pas d'inline, pas de cache (localStorage vidé par le beforeEach global) → fetchAll.
		const { loadGameData } = await import('./gamedata')
		const settled = loadGameData().then(() => true, () => false)
		await vi.runAllTimersAsync()
		return await settled
	}

	function okResponse() {
		return { ok: true, status: 200, json: async () => inlineData() }
	}

	it('traverse une coupure réseau passagère', async () => {
		const fetchMock = vi.fn()
			.mockRejectedValueOnce(new TypeError('Failed to fetch'))
			.mockResolvedValueOnce(okResponse())
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(booted).toBe(true)
	})

	// L'API qui redémarre répond 502/503 avant de répondre tout court.
	it('réessaie sur 5xx', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce({ ok: false, status: 503 })
			.mockResolvedValueOnce(okResponse())
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(booted).toBe(true)
	})

	// Le 429 est repris comme partout ailleurs dans le client (cf. RETRY_CONFIG) : un
	// déploiement fait repartir toute la cohorte d'un coup, et c'est exactement là que la
	// limitation de débit frappe.
	it('réessaie sur 429', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce({ ok: false, status: 429 })
			.mockResolvedValueOnce(okResponse())
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(booted).toBe(true)
	})

	// Les autres 4xx ne guériront pas en attendant : on abandonne tout de suite.
	it('ne réessaie pas sur les autres 4xx', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 })
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(booted).toBe(false)
	})

	// Le cas que la reprise vise vraiment : l'API redémarre, le proxy accepte la connexion et
	// la laisse PENDRE. Sans délai de garde, `fetch` ne rejetterait qu'au bout du délai réseau
	// du navigateur — des minutes — et aucune reprise ne partirait jamais.
	it('abandonne une tentative qui pend et reprend', async () => {
		// `AbortSignal.timeout` s'arme sur une horloge native que vi.useFakeTimers n'atteint
		// pas : on le rejoue sur un setTimeout, lui bien simulé.
		vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
			const controller = new AbortController()
			setTimeout(() => controller.abort(new DOMException('TimeoutError', 'TimeoutError')), ms)
			return controller.signal
		})
		const fetchMock = vi.fn()
			.mockImplementationOnce((_url: string, init: { signal: AbortSignal }) =>
				new Promise((_resolve, reject) => {
					init.signal.addEventListener('abort', () => reject(init.signal.reason))
				}))
			.mockResolvedValueOnce(okResponse())
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(booted).toBe(true)
	})

	// Hors ligne pour de bon : le rejet finit par remonter, vue.ts affiche son écran d'erreur.
	it('abandonne après les reprises', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
		const booted = await bootSucceeds(fetchMock)
		expect(fetchMock).toHaveBeenCalledTimes(3)
		expect(booted).toBe(false)
	})
})
