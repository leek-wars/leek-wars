import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le module tire tout l'éditeur (Monaco, filesystem, i18n, socket) : on ne garde que ce dont la
// corrélation requête/réponse a besoin, à savoir l'envoi sur le socket.
const sent: unknown[][] = []
vi.mock('@/model/leekwars', () => ({
	LeekWars: { socket: { send: (message: unknown[]) => { sent.push(message) } } }
}))
vi.mock('@/model/ai', () => ({ AI: class {} }))
vi.mock('@/model/filesystem', () => ({ fileSystem: { ais: {} } }))
vi.mock('@/model/i18n', () => ({ i18n: { t: (key: string) => key } }))
vi.mock('monaco-editor', () => ({
	MarkerSeverity: { Error: 8, Warning: 4, Info: 2 },
	MarkerTag: { Unnecessary: 1 },
	Uri: { file: (path: string) => ({ path }) },
	editor: { setModelMarkers: () => undefined, getModel: () => null, createModel: () => null },
}))

// L'analyzer est un singleton dont la table des requêtes en vol vit à l'échelle du module : on le
// recharge à chaque test pour qu'une requête laissée en attente n'en contamine pas un autre.
async function freshAnalyzer() {
	vi.resetModules()
	return (await import('./analyzer')).analyzer
}

// analyze() n'utilise de l'AI que son chemin.
const ai = (path: string) => ({ path }) as never

/** Identifiant de requête envoyé au daemon, en fin de paquet : [op, path, code, requestID] */
const lastRequestID = () => sent[sent.length - 1][3] as number

describe('corrélation des analyses', () => {

	beforeEach(() => { sent.length = 0 })

	it('résout chaque requête avec SA réponse, pas avec la dernière arrivée', async () => {
		const analyzer = await freshAnalyzer()
		const first = analyzer.analyze(ai('a.leek'), 'code 1')
		const firstID = lastRequestID()
		const second = analyzer.analyze(ai('a.leek'), 'code 2')
		const secondID = lastRequestID()
		expect(secondID).not.toBe(firstID)

		// La réponse de la requête dépassée ne doit rien appliquer...
		analyzer.analyzeResult(['périmé'] as never, firstID)
		expect(await first).toBe(null)

		// ...et la réponse à jour doit bien arriver sur sa propre promesse.
		analyzer.analyzeResult(['à jour'] as never, secondID)
		expect(await second).toEqual(['à jour'])
	})

	it('applique le résultat d\'un fichier même si un AUTRE a été analysé depuis (vue splittée)', async () => {
		const analyzer = await freshAnalyzer()
		const a = analyzer.analyze(ai('a.leek'), 'code a')
		const aID = lastRequestID()
		analyzer.analyze(ai('b.leek'), 'code b')

		analyzer.analyzeResult(['résultat a'] as never, aID)
		expect(await a).toEqual(['résultat a'])
	})

	it('ignore une réponse non corrélée (EDITOR_ANALYZE envoyé hors analyze())', async () => {
		const analyzer = await freshAnalyzer()
		const pending = analyzer.analyze(ai('a.leek'), 'code')
		const id = lastRequestID()

		// restoreDaemonCache() envoie des EDITOR_ANALYZE bruts : le daemon répond -1.
		analyzer.analyzeResult(['cache daemon'] as never, -1)

		let resolved = false
		void pending.then(() => { resolved = true })
		await Promise.resolve()
		expect(resolved).toBe(false)

		analyzer.analyzeResult(['résultat'] as never, id)
		expect(await pending).toEqual(['résultat'])
	})

	it('retombe sur la plus ancienne requête si le daemon ne renvoie pas d\'identifiant', async () => {
		const analyzer = await freshAnalyzer()
		const first = analyzer.analyze(ai('a.leek'), 'code 1')
		analyzer.analyze(ai('b.leek'), 'code 2')

		analyzer.analyzeResult(['daemon sans corrélation'] as never, undefined)
		expect(await first).toEqual(['daemon sans corrélation'])
	})

	it('libère la requête sur erreur du daemon', async () => {
		const analyzer = await freshAnalyzer()
		const pending = analyzer.analyze(ai('a.leek'), 'code')
		analyzer.analyzeError(lastRequestID())
		expect(await pending).toBe(null)
	})

	it('n\'envoie pas les fichiers polyglot au daemon', async () => {
		const analyzer = await freshAnalyzer()
		expect(await analyzer.analyze(ai('script.py'), 'code')).toBe(null)
		expect(sent).toHaveLength(0)
	})
})
