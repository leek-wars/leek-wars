import { beforeEach, describe, expect, it, vi } from 'vitest'

// Le module tire tout l'éditeur (Monaco, filesystem, i18n, socket) : on ne garde que ce dont la
// corrélation requête/réponse a besoin, à savoir l'envoi sur le socket.
const sent: unknown[][] = []
vi.mock('@/model/leekwars', () => ({
	LeekWars: { socket: { send: (message: unknown[]) => { sent.push(message) } } }
}))
vi.mock('@/model/ai', () => ({ AI: class {} }))
const fileSystem = {
	ais: {} as Record<string, any>,
	folderById: {} as Record<number, unknown>,
	load: async () => undefined,
}
vi.mock('@/model/filesystem', () => ({ fileSystem }))
vi.mock('@/model/i18n', () => ({ i18n: { t: (key: string) => key } }))
vi.mock('monaco-editor', () => ({
	MarkerSeverity: { Error: 8, Warning: 4, Info: 2 },
	MarkerTag: { Unnecessary: 1 },
	Uri: { file: (path: string) => ({ path }) },
	editor: { setModelMarkers: () => undefined, getModel: () => null, createModel: () => ({ uri: 'fake' }) },
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

describe('application des résultats dans le panneau', () => {

	beforeEach(() => {
		sent.length = 0
		for (const k in fileSystem.ais) delete fileSystem.ais[k]
	})

	// Un fichier tel que le voit handleProblems/updateTodos : chemin, sac de problèmes par entrypoint,
	// compteurs, plus le minimum pour le scan de TODO (code, includes, updateIncludes).
	function fileInFS(path: string, code = '') {
		const file = { path, folder: -1, problems: {} as Record<string, unknown[]>, warnings: 0, errors: 0, todos: 0, valid: true, code, includes: [] as unknown[], updateIncludes() { /* pas d'include en test */ }, model: null }
		fileSystem.ais[path] = file
		return file
	}

	// Invariant de rendu : le badge du panneau lit ai.problems, la liste lit analyzer.problems. Les deux
	// DOIVENT pointer le même tableau pour chaque (entrypoint, fichier), sinon le badge bouge sans la liste.
	function expectPanelConsistent(analyzer: { problems: Record<string, Record<string, unknown[]>> }) {
		for (const ep in analyzer.problems) {
			for (const path in analyzer.problems[ep]) {
				const file = fileSystem.ais[path]
				expect(file, `fichier ${path} du bucket ${ep} absent du FS`).toBeTruthy()
				// Comparaison par CONTENU : analyzer est reactive() (proxy du tableau), ai.problems est brut
				// dans le test -> jamais la même référence, mais le contenu doit coïncider.
				expect(file.problems[ep], `ai.problems[${ep}] désynchronisé de analyzer.problems[${ep}][${path}]`).toEqual(analyzer.problems[ep][path])
			}
		}
	}

	// Un problème au format daemon : [level, path, sl, sc, el, ec, errorCode]. level 1 = warning.
	const warn = (path: string, line: number, code: number) => [1, path, line, 0, line, 5, code]

	it('retire de la liste le warning corrigé (panneau ET compteur restent synchrones)', async () => {
		const analyzer = await freshAnalyzer()
		const a = fileInFS('a.leek')

		// État initial : deux warnings sur a.leek (l'entrypoint est le fichier lui-même).
		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 3, 148), warn('a.leek', 7, 148)] } })
		expect(analyzer.problems['a.leek']['a.leek']).toHaveLength(2)
		expect(a.warnings).toBe(2)

		// On corrige celui de la ligne 3 : le daemon ne renvoie plus que celui de la ligne 7.
		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 7, 148)] } })

		// La LISTE (analyzer.problems) et le COMPTEUR (ai.warnings) doivent tomber à 1 tous les deux.
		expect(a.warnings).toBe(1)
		expect(analyzer.problems['a.leek']['a.leek']).toHaveLength(1)
		expect((analyzer.problems['a.leek']['a.leek'][0] as {start_line: number}).start_line).toBe(7)
	})

	it('vide la liste quand le dernier warning est corrigé', async () => {
		const analyzer = await freshAnalyzer()
		const a = fileInFS('a.leek')

		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 3, 148)] } })
		expect(analyzer.problems['a.leek']['a.leek']).toHaveLength(1)

		// Plus aucun problème : entrée stats-only (problems absent) => nettoyage complet.
		analyzer.applyAnalyzeResult({ 'a.leek': { valid: true } })
		expect(a.warnings).toBe(0)
		expect(analyzer.problems['a.leek']).toBeUndefined()
	})

	// Reproduit ce que fait le panneau : un effet Vue qui itère analyzer.problems exactement comme le
	// v-for du template. On vérifie qu'une correction de warning le RE-DÉCLENCHE (sinon le DOM du
	// panneau reste figé alors que la donnée, elle, est à jour).
	it('la correction re-déclenche un effet Vue qui observe analyzer.problems', async () => {
		const { watchEffect, nextTick } = await import('vue')
		const analyzer = await freshAnalyzer()
		fileInFS('a.leek')
		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 3, 148), warn('a.leek', 7, 148)] } })

		const snapshots: number[] = []
		const stop = watchEffect(() => {
			// Même parcours que le template : entrypoint -> fichier -> problèmes.
			let count = 0
			for (const ep in analyzer.problems) {
				for (const path in analyzer.problems[ep]) count += analyzer.problems[ep][path].length
			}
			snapshots.push(count)
		})
		expect(snapshots).toEqual([2])

		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 7, 148)] } })
		await nextTick()
		stop()
		// L'effet doit avoir été relancé et voir 1 problème, pas rester bloqué à 2.
		expect(snapshots[snapshots.length - 1]).toBe(1)
	})

	// Rejoue la séquence EXACTE de setAnalyzerTimeout : updateTodos AVANT, puis le résultat daemon, puis
	// updateTodos APRÈS. updateTodos est la seule fonction qui réassigne ai.problems[e] et resynchronise
	// analyzer.problems de façon conditionnelle : si la resync saute, le badge (ai.problems) descend sans
	// la liste (analyzer.problems). Fichier avec un warning + un TODO, puis correction du warning.
	it('badge et liste restent synchrones à travers updateTodos (warning + TODO)', async () => {
		const analyzer = await freshAnalyzer()
		const a = fileInFS('a.leek', 'var x = 1 // TODO ranger ça\nvar y = 2\n')

		// 1) updateTodos avant : pose le TODO (aucun problème serveur encore).
		await analyzer.updateTodos(a)
		// 2) résultat daemon : deux warnings.
		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 1, 148), warn('a.leek', 2, 148)] } })
		// 3) updateTodos après : refusionne le TODO à côté des warnings.
		await analyzer.updateTodos(a)
		expectPanelConsistent(analyzer)

		// Correction d'un warning : nouveau cycle complet.
		await analyzer.updateTodos(a)
		analyzer.applyAnalyzeResult({ 'a.leek': { problems: [warn('a.leek', 2, 148)] } })
		await analyzer.updateTodos(a)

		expectPanelConsistent(analyzer)
		// Le warning corrigé (ligne 1) doit avoir disparu de la LISTE, pas seulement du compteur.
		const rows = Object.values(analyzer.problems).flatMap(b => b['a.leek'] ?? [])
		const warnRows = rows.filter((p) => (p as {level: number}).level === 1)
		expect(warnRows).toHaveLength(1)
		expect((warnRows[0] as {start_line: number}).start_line).toBe(2)
		expect(a.warnings).toBe(1)
	})
})
