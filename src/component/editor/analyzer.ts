import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'

import { AIItem, Folder } from './editor-item'
import { getLanguageForPath } from './file-types'
import { Problem } from './problem'
import { i18n } from '@/model/i18n'
import * as monaco from 'monaco-editor'
import { markRaw, reactive } from 'vue'

const ERROR_UNUSED_VARIABLE = 148
const ERROR_UNUSED_FUNCTION = 152

/** Shape of a hover response from the analyzer server */
export interface HoverResult {
	type?: string
	location: [unknown, number, number, number, number]
	defined?: [string, number, number, number, number]
}

/** Shape of a completion response from the analyzer server */
export interface CompletionResult {
	items: Array<{ name: string }>
}

/** Une analyse envoyée au daemon dont on attend encore la réponse */
interface PendingAnalyze {
	path: string
	version: number
	resolve: (value: unknown) => void
	timer: number
}

// Analyses en vol, indexées par identifiant de requête (le daemon le renvoie dans sa réponse).
// Volontairement hors de l'objet reactive() plus bas : ce sont des resolveurs de promesse et des
// identifiants de timer, que Vue n'a aucune raison de proxyfier ni de suivre.
const pendingAnalyzes = new Map<number, PendingAnalyze>()

// Au-delà, on considère la réponse perdue (socket coupé en plein vol) et on libère la requête,
// sinon la promesse ne se résoudrait jamais et l'indicateur d'analyse resterait allumé.
const ANALYZE_TIMEOUT = 30_000

export class AnalyzerPromise {
	// eslint-disable-next-line unicorn/no-thenable
	public then!: (data: unknown) => void
	public abort!: () => void
}

class Analyzer {

	public enabled: boolean = false
	public running: number = 0
	public problems: {[key: string]: {[key: string]: Problem[]}} = {}
	public error_count: number = 0
	public warning_count: number = 0
	public todo_count: number = 0
	public promise!: Promise<unknown>
	public requestID: number = 0
	private analyzeVersions: {[path: string]: number} = {}
	public hoverResolve!: (value: unknown) => void
	public lastHover: unknown
	public completeResolve: {[key: number]: (value: unknown) => void} = {}
	public referencesResolve: {[key: number]: (value: unknown) => void} = {}

	private initialized: boolean = false
	// private GeneratorAnalyze!: Function
	// private GeneratorComplete!: Function
	// private GeneratorHover!: Function
	// private GeneratorRegister!: Function
	// private GeneratorAddEntrypoint!: Function
	// private getExceptionMessage!: Function
	// private GeneratorDelete!: Function

	public init() {
		this.enabled = true
		if (this.initialized) { return Promise.resolve() }
		this.initialized = true

		this.promise = new Promise((resolve) => {
			const Module: { onRuntimeInitialized?: () => void; ccall?: (name: string) => void } = {
				onRuntimeInitialized: () => {
					// console.log("Module initialized", Module)
					Module.ccall!('init')
					// this.GeneratorAnalyze = Module.cwrap('analyze', 'string', ['boolean', 'string', 'string', 'boolean'])
					// this.GeneratorComplete = Module.cwrap('complete', 'string', ['boolean', 'string', 'number'])
					// this.GeneratorHover = Module.cwrap('hover', 'string', ['boolean', 'string', 'number', 'boolean'])
					// this.GeneratorRegister = Module.cwrap('register_', 'void', ['boolean', 'string'])
					// this.GeneratorAddEntrypoint = Module.cwrap('addEntrypoint', 'void', ['boolean', 'string', 'boolean', 'string'])
					// this.getExceptionMessage = Module.cwrap('getExceptionMessage', 'string', ['number'])
					// this.GeneratorDelete = Module.cwrap('delete_', 'string', ['string'])

					// console.log(this.GeneratorAnalyze(false, "Fight.toto"))
					// console.log(this.GeneratorComplete(false, "Fight.getEntity().name", 18))

					resolve(null)
				}
			}
			window.Module = Module
			this.loadJs('/analyzer.js')
		})
	}

	public updateCount() {
		let errors = 0
		let warnings = 0
		let todos = 0
		for (const entrypoint in this.problems) {
			for (const ai in this.problems[entrypoint]) {
				const problems = this.problems[entrypoint][ai]
				// console.log(this.problems[ai])
				for (const problem of problems) {
					if (problem.level === 0) { errors++ }
					else if (problem.level === 1) { warnings++ }
					else if (problem.level === 2) { todos++ }
				}
			}
		}
		this.error_count = errors
		this.warning_count = warnings
		this.todo_count = todos
	}

	// Pont : reporte les diagnostics du language service TypeScript de Monaco (type ET syntaxe, en
	// direct) dans le panneau d'erreur LW + les compteurs, pour les IA polyglot .ts/.js. Sans ça les
	// erreurs TS ne s'affichaient qu'en soulignement inline (markers Monaco), pas dans le panneau.
	// L'entrypoint = le fichier lui-même (le service TS analyse chaque modèle isolément).
	public updatePolyglotProblems(ai: AI, markers: monaco.editor.IMarker[]) {
		const problems = markers.map(m => new Problem(
			m.startLineNumber,
			Math.max(0, m.startColumn - 1), // Problem = colonne 0-based (l'analyzer rajoute +1 pour les markers)
			m.endLineNumber,
			Math.max(0, m.endColumn - 1),
			m.severity === monaco.MarkerSeverity.Error ? 0 : (m.severity === monaco.MarkerSeverity.Warning ? 1 : 2),
			m.message,
		))
		this.setProblems(ai.path, ai, problems)
		// Recalcule ai.valid (croix rouge "invalide" de la carte d'IA) : sinon il restait figé sur
		// l'état serveur, périmé tant qu'on n'avait pas sauvegardé. Mêmes règles qu'applyAnalyzeResult
		// (un problème de niveau 0 = erreur = invalide). Couvre .ts/.js (service TS) ET .py (Pyright).
		ai.valid = !problems.some(p => p.level === 0)
		this.updateCount()
	}

	public analyze(ai: AI, code: string) {
		// console.log("🔥 Analyze", ai.path)
		// console.time('hover')

		// Seul LeekScript passe par le daemon. Les polyglot sont validés CÔTÉ CLIENT et remontés via le
		// pont de markers (updatePolyglotProblems) : service TypeScript de Monaco pour .ts/.js, worker
		// Pyright pour .py. On ne les envoie PAS au daemon -> pas de double analyse ni de double-report
		// (le daemon faisait aussi une passe de syntaxe sur les .py, désormais couverte par Pyright).
		const language = getLanguageForPath(ai.path)
		if (language !== 'leekscript') {
			return Promise.resolve(null)
		}
		if (code.length > 60_000) {
			return Promise.reject()
		}

		// Deux analyses peuvent se chevaucher (le debounce de frappe est de 500 ms, une analyse de
		// grosse IA avec includes dure plus longtemps). Chaque requête porte donc un identifiant, que
		// le daemon renvoie dans sa réponse, comme le font déjà EDITOR_COMPLETE et EDITOR_REFERENCES.
		// L'identifiant est en FIN de paquet, pas en position 1 : un daemon antérieur l'ignore
		// simplement au lieu de décaler ai.path et le code.
		const requestID = this.requestID++

		// Version PAR CHEMIN : une réponse n'est périmée que si une analyse plus récente du MÊME
		// fichier a été lancée depuis. Un compteur global jetterait le résultat valide d'un fichier dès
		// qu'un autre est analysé (vue splittée, changement d'onglet), et l'avertissement corrigé
		// resterait affiché.
		const version = (this.analyzeVersions[ai.path] = (this.analyzeVersions[ai.path] ?? 0) + 1)

		LeekWars.socket.send([SocketMessage.EDITOR_ANALYZE, ai.path, code, requestID])

		return new Promise<unknown>((resolve) => {
			pendingAnalyzes.set(requestID, {
				path: ai.path,
				version,
				resolve,
				timer: window.setTimeout(() => {
					pendingAnalyzes.delete(requestID)
					resolve(null)
				}, ANALYZE_TIMEOUT)
			})
		})
	}

	/**
	 * Résout la requête d'analyse à laquelle répond le daemon.
	 * @param requestID identifiant renvoyé par le daemon : absent s'il précède la corrélation,
	 * négatif si la requête n'est pas passée par analyze() (restoreDaemonCache envoie des
	 * EDITOR_ANALYZE bruts, dont la réponse ne doit résoudre aucune promesse).
	 */
	private resolveAnalyze(requestID: number | undefined, data: unknown) {
		let key = requestID
		if (key === undefined) {
			// Daemon antérieur à la corrélation : il répond dans l'ordre des requêtes, on retombe donc
			// sur la plus ancienne en attente (Map = ordre d'insertion). Dégradé mais fonctionnel.
			key = pendingAnalyzes.keys().next().value
		} else if (key < 0) {
			return
		}
		if (key === undefined) { return }
		const entry = pendingAnalyzes.get(key)
		if (!entry) { return }
		pendingAnalyzes.delete(key)
		clearTimeout(entry.timer)
		// Analyse dépassée par une plus récente du même fichier : ne rien appliquer, la réponse à jour
		// arrive juste après.
		entry.resolve(entry.version === this.analyzeVersions[entry.path] ? data : null)
	}

	public analyzeResult(data: unknown[], requestID?: number) {
		// console.timeEnd('hover')
		this.resolveAnalyze(requestID, data)
	}

	public analyzeError(requestID?: number) {
		this.resolveAnalyze(requestID, null)
	}

	public applyAnalyzeResult(
		result: {[path: string]: {problems?: unknown[][], valid?: boolean, total_lines?: number, total_chars?: number}},
		onValid?: (ai: AI) => void
	) {
		for (const epPath in result) {
			const ai = fileSystem.ais[epPath]
			const entry = result[epPath]
			if (!ai) {
				// Entrypoint non chargé côté client (IA absente de fileSystem.ais). On nettoie tout de même
				// son bucket périmé s'il revient en stats-only, sinon un doublon subsisterait sans qu'aucune
				// IA locale ne permette de l'effacer via removeProblems.
				if (entry.problems === undefined) this.removeProblemsByPath(epPath)
				continue
			}
			if (typeof entry.total_lines === 'number') ai.total_lines = entry.total_lines
			if (typeof entry.total_chars === 'number') ai.total_chars = entry.total_chars
			// Polyglot (.js/.ts/.py) : la validité et les problèmes sont pilotés CÔTÉ CLIENT (service TS de
			// Monaco / worker Pyright) via updatePolyglotProblems. Le verdict serveur — pour Python, un simple
			// parse de syntaxe qui ignore les noms indéfinis — ne doit ni l'écraser ni afficher un faux
			// "IA valide" au save. On reflète juste l'état client courant pour le retour positif.
			const lang = getLanguageForPath(ai.path)
			if (lang === 'javascript' || lang === 'typescript' || lang === 'python') {
				if (ai.valid && onValid) onValid(ai)
				continue
			}
			if (entry.problems !== undefined) {
				// Entrée avec problèmes dédupliqués
				const valid = !entry.problems.some(p => p[0] === 0)
				ai.valid = valid
				if (valid && onValid) onValid(ai)
				this.handleProblems(ai, entry.problems)
			} else {
				// Entrée stats-only (entrypoint parent) : nettoyage + mise à jour valid
				this.removeProblems(ai)
				if (typeof entry.valid === 'boolean') ai.valid = entry.valid
				if (ai.valid && onValid) onValid(ai)
			}
		}

		this.purgeStaleBuckets(result)
	}

	// Un fichier analysé comme entrypoint (clé du résultat avec une liste de problèmes) fait autorité
	// sous SON propre bucket. S'il traîne encore dans le bucket d'un AUTRE entrypoint que cette analyse
	// n'a pas rafraîchi, c'est un doublon périmé : typiquement après un redémarrage du daemon, qui perd
	// son graphe d'includes et recompile alors le fichier en standalone sans renvoyer ses includers (donc
	// sans ordre de nettoyage). On retire le fichier de ces buckets, sans toucher aux problèmes PROPRES
	// de ces entrypoints (leurs autres fichiers restent intacts).
	private purgeStaleBuckets(result: {[path: string]: {problems?: unknown[][]}}) {
		const analyzedFiles = Object.keys(result).filter(p => result[p].problems !== undefined)
		if (!analyzedFiles.length) return
		for (const epPath in this.problems) {
			// Bucket rafraîchi par cette analyse (y compris le bucket propre du fichier) : déjà à jour.
			if (epPath in result) continue
			// Les TODO sont gérés à part par updateTodos, qui tourne juste après : ne pas y toucher.
			if (epPath === '_todos') continue
			let changed = false
			for (const filePath of analyzedFiles) {
				if (this.problems[epPath][filePath]) {
					delete this.problems[epPath][filePath]
					const file = fileSystem.ais[filePath]
					if (file && file.problems[epPath]) {
						delete file.problems[epPath]
						this.updateAiErrors(file)
					}
					changed = true
				}
			}
			if (changed && Object.keys(this.problems[epPath]).length === 0) delete this.problems[epPath]
		}
	}

	public hover(ai: AI, line: number, column: number) {
		// console.log("🔥 Hover", ai.path, line, column)
		// console.time('hover')
		LeekWars.socket.send([SocketMessage.EDITOR_HOVER, ai.path, line, column])

		return new Promise<HoverResult | null>((resolve) => {
			this.hoverResolve = resolve as (value: unknown) => void
		})
	}

	public hoverResult(data: HoverResult | null) {
		if (this.hoverResolve) {
			// console.timeEnd('hover')
			this.lastHover = data
			this.hoverResolve(data)
		}
	}

	public complete(ai: AI, code: string, line: number, column: number): Promise<CompletionResult | null> {

		if (code.length > 60_000) {
			// return { ...Promise.reject(), abort: () => null }
			return Promise.reject()
		}

		const requestID = this.requestID++
		// console.log("Complete request", requestID)
		LeekWars.socket.send([SocketMessage.EDITOR_COMPLETE, requestID, ai.path, code, line, column])

		const promise = new Promise<CompletionResult | null>((resolve) => {
			this.completeResolve[requestID] = resolve as (value: unknown) => void
		})
		// return { then: promise.then.bind(promise), abort: () => {
		// 	// console.log("Abort request", requestID)
		// 	delete this.completeResolve[requestID]
		// }} as AnalyzerPromise
		return promise
	}

	public references(ai: AI, line: number, column: number, ctorParamCount: number = -1) {
		const requestID = this.requestID++
		const msg: (string | number)[] = [SocketMessage.EDITOR_REFERENCES, requestID, ai.path, line, column]
		if (ctorParamCount >= 0) msg.push(ctorParamCount)
		LeekWars.socket.send(msg)

		return new Promise<[string, number, number, number, number][]>((resolve) => {
			this.referencesResolve[requestID] = resolve as (value: unknown) => void
		})
	}

	public referencesResult(message: {id: number, data: unknown}) {
		if (this.referencesResolve[message.id]) {
			this.referencesResolve[message.id](message.data)
			delete this.referencesResolve[message.id]
		}
	}

	public completeResult(message: {type: number, id: number, data: unknown}) {
		// console.log("complete result", message)
		if (this.completeResolve[message.id]) {
			// console.log("resolve complete", message)
			// console.timeEnd('hover')
			this.completeResolve[message.id](message.data)
			delete this.completeResolve[message.id]
		}
	}

	/*
	public delete(ai: AI) {

		if (!this.enabled) { return Promise.reject() }

		return this.promise.then(() => {

			console.log("🔥 Delete", ai.path)

			this.running = 1
			return new Promise((resolve, reject) => setTimeout(() => {
				try {
					console.time("delete")
					const result = JSON.parse(this.GeneratorDelete(ai.path))
					console.log(result)
					for (const path in result) {
						const problems = result[path]
						problems.sort((a: any, b: any) => {
							return a[0] - b[0]
						})
						// this.setAIProblems(path, problems)
					}
					return resolve(result)
				} catch (e) {
					const problems = [ [0, 0, 0, 0, 1, "ANALYZER_CRASHED"] ]
					// this.setAIProblems(ai.path, problems)
					try {
						// console.error(this.getExceptionMessage(e))
					} catch (e2) {
						// nothing
					}
					return reject()
				} finally {
					this.running = 0
					this.updateCount()
					console.timeEnd("delete")
				}
			}))
		})
	}
	*/

	/*
	public registerEntrypoints(ai: AI) {
		for (const entrypoint_id of ai.entrypoints) {
			const entrypoint = fileSystem.ais[entrypoint_id]
			if (entrypoint) {
				// console.log("Add entrypoint", ai.path, "==>", entrypoint.path)
				this.GeneratorAddEntrypoint(ai.version, ai.path, entrypoint.version, entrypoint.path)
			}
		}
	}
	*/



	handleProblems(entrypoint: AI, problems: unknown[][]) {

		const previousAIs = this.problems[entrypoint.path] ? Object.keys(this.problems[entrypoint.path]) : []

		analyzer.removeProblems(entrypoint)

		// Résoudre les paths des fichiers dans les erreurs
		// Le daemon peut retourner des noms courts (ex: "util.leek") au lieu de paths complets
		const entrypointDir = entrypoint.path.includes('/') ? entrypoint.path.substring(0, entrypoint.path.lastIndexOf('/')) : ''

		// Group problems by ai path
		const problemsByAI = {} as {[key: string]: Problem[]}
		const markersByAI = {} as {[key: string]: monaco.editor.IMarkerData[]}
		for (const problem of problems) {
			const level = problem[0] as number
			let aiPath = problem[1] as string
			// Si le path n'est pas trouvé directement, essayer avec le dossier de l'entrypoint
			if (!fileSystem.ais[aiPath] && entrypointDir) {
				const resolved = entrypointDir + '/' + aiPath
				if (fileSystem.ais[resolved]) aiPath = resolved
			}
			const info = problem.length === 8
				? i18n.t('leekscript.error_' + problem[6], problem[7] as unknown[], { escapeParameter: false }) as string
				: i18n.t('leekscript.error_' + problem[6]) as string
			if (!problemsByAI[aiPath]) {
				problemsByAI[aiPath] = []
				markersByAI[aiPath] = []
			}
			problemsByAI[aiPath].push(new Problem(problem[2] as number, problem[3] as number, problem[4] as number, problem[5] as number, level, info))
			const errorCode = problem[6] as number
			markersByAI[aiPath].push({
				message: info,
				severity: level === 0 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
				startLineNumber: problem[2] as number,
				startColumn: (problem[3] as number) + 1,
				endLineNumber: problem[4] as number,
				endColumn: (problem[5] as number) + 2,
				tags: errorCode === ERROR_UNUSED_VARIABLE || errorCode === ERROR_UNUSED_FUNCTION ? [monaco.MarkerTag.Unnecessary] : [],
			})
		}
		for (const aiPath in problemsByAI) {
			const ai = fileSystem.ais[aiPath]
			if (!ai) continue
			analyzer.setProblems(entrypoint.path, ai, problemsByAI[aiPath])
			const model = this.getModelIfReady(ai)
			if (model) monaco.editor.setModelMarkers(model, "owner", markersByAI[aiPath])
		}
		// Efface les marqueurs des fichiers (inclus ou entrypoint) qui n'ont plus de problèmes
		for (const aiPath of previousAIs) {
			if (markersByAI[aiPath]) continue
			const ai = fileSystem.ais[aiPath]
			if (!ai) continue
			const model = this.getModelIfReady(ai)
			if (model) monaco.editor.setModelMarkers(model, "owner", [])
		}
	}

	private getModelIfReady(ai: AI): monaco.editor.ITextModel | null {
		if (ai.model) return ai.model
		if (ai.code === undefined) return null
		const uri = monaco.Uri.file(ai.path)
		const model = monaco.editor.getModel(uri) || markRaw(monaco.editor.createModel(ai.code, getLanguageForPath(ai.path), uri))
		ai.model = model
		return model
	}

	public setProblems(entrypoint: string, ai: AI, problems: Problem[]) {
		// console.log("[Analyzer] set ai problems", entrypoint, ai, problems)
		if (!(entrypoint in this.problems)) {
			this.problems[entrypoint] = {}
		}
		this.problems[entrypoint][ai.path] = problems
		ai.problems[entrypoint] = problems
		this.updateAiErrors(ai)
	}

	public removeProblems(entrypoint: AI) {
		this.removeProblemsByPath(entrypoint.path)
	}

	// Efface le bucket d'un entrypoint par son CHEMIN (sans exiger l'IA en mémoire) : nécessaire quand le
	// daemon renvoie un entrypoint absent de fileSystem.ais (cf. applyAnalyzeResult).
	public removeProblemsByPath(entrypointPath: string) {
		for (const aiPath in fileSystem.ais) {
			const ai = fileSystem.ais[aiPath]
			if (ai.problems && ai.problems[entrypointPath]) {
				delete ai.problems[entrypointPath]
				this.updateAiErrors(ai)
			}
		}
		delete this.problems[entrypointPath]
	}

	public updateAiErrors(ai: AI) {
		let errors = 0
		let warnings = 0
		let todos = 0
		for (const entrypoint in ai.problems) {
			errors += ai.problems[entrypoint].filter(p => p.level === 0).length
			warnings += ai.problems[entrypoint].filter(p => p.level === 1).length
			todos += ai.problems[entrypoint].filter(p => p.level === 2).length
		}
		ai.errors = errors
		ai.warnings = warnings
		ai.todos = todos

		// Update parent folders
		let current = fileSystem.folderById[ai.folder] as Folder | null
		while (current) {
			current.errors = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).errors : (i as AIItem).ai.errors), 0)
			current.warnings = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).warnings : (i as AIItem).ai.warnings), 0)
			current.todos = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).todos : (i as AIItem).ai.todos), 0)
			current = current.id === 0 ? null : fileSystem.folderById[current.parent]
		}
	}

	public async updateTodos(ai: AI) {
		const language = getLanguageForPath(ai.path)
		const isPython = language === 'python'
		// LeekScript ET polyglot (.js/.ts/.py) : on scanne les TODO. Les docs (.md/.json...) sont exclus.
		if (language !== 'leekscript' && language !== 'javascript' && language !== 'typescript' && !isPython) return
		// LeekScript : arbre d'includes (les TODO d'un include comptent). Polyglot : fichier seul (les
		// imports ES/Python ne sont pas modélisés côté éditeur).
		const ais = new Set<AI>([ai])
		if (language === 'leekscript') {
			const collectIncludes = async (a: AI) => {
				if (a.code === undefined) {
					await fileSystem.load(a)
				}
				if (!a.includes.length) a.updateIncludes()
				for (const inc of a.includes) {
					if (!ais.has(inc)) {
						ais.add(inc)
						await collectIncludes(inc)
					}
				}
			}
			await collectIncludes(ai)
		} else if (ai.code === undefined) {
			await fileSystem.load(ai)
		}

		// Scan all involved AIs for TODOs
		const ids = new Set(Array.from(ais).map(a => a.path))
		const todos = Array.from(ais).flatMap(a => {
			return a.code ? this.scanTodos(a, a.code, isPython) : []
		})

		// Build problems + Monaco markers in one pass
		const byAI: {[key: string]: Problem[]} = {}
		const markers: {[key: string]: monaco.editor.IMarkerData[]} = {}
		for (const id of ids) markers[id] = []
		for (const t of todos) {
			if (!byAI[t[1]]) byAI[t[1]] = []
			byAI[t[1]].push(new Problem(t[2], t[3], t[4], t[5], 2, t[6]))
			markers[t[1]]?.push({
				message: t[6],
				severity: monaco.MarkerSeverity.Info,
				startLineNumber: t[2],
				startColumn: t[3] + 1,
				endLineNumber: t[4],
				endColumn: t[5] + 2,
			})
		}

		// Merge TODOs into existing entrypoints (alongside errors/warnings)
		for (const id of ids) {
			const a = fileSystem.ais[id]
			if (!a) continue

			// Find a real entrypoint that already has problems for this AI
			let ep: string | null = null
			for (const e in a.problems) {
				if (e !== '_todos' && a.problems[e].length > 0) { ep = e; break }
			}

			// Remove old TODOs from all entrypoints for this AI
			for (const e in a.problems) {
				const before = a.problems[e].length
				a.problems[e] = a.problems[e].filter((p: Problem) => p.level !== 2)
				if (this.problems[e]?.[a.path]) this.problems[e][a.path] = a.problems[e]
				if (a.problems[e].length === 0 && before > 0) {
					delete a.problems[e]
					if (this.problems[e]) delete this.problems[e][a.path]
				}
			}

			// Append new TODOs
			if (byAI[id]) {
				if (ep && a.problems[ep]) {
					a.problems[ep].push(...byAI[id])
					this.problems[ep][a.path] = a.problems[ep]
				} else {
					if (!this.problems['_todos']) this.problems['_todos'] = {}
					this.setProblems('_todos', a, byAI[id])
				}
			}
			this.updateAiErrors(a)

			// Monaco markers (separate "todos" owner)
			if (a.model) monaco.editor.setModelMarkers(a.model, 'todos', markers[id] || [])
		}
		this.updateCount()
	}

	// hash=true (Python) : commentaire de ligne `#` (pas de bloc /* */). Sinon (LeekScript/JS/TS) :
	// commentaires `//` et `/* */`. Dans les deux cas on saute les chaînes pour ne pas prendre un
	// "TODO" à l'intérieur d'un littéral.
	private scanTodos(ai: AI, code: string, hash = false) {
		const todos: [number, string, number, number, number, number, string][] = []
		const lines = code.split('\n')
		let inBlockComment = false

		for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
			const line = lines[lineIdx]
			const lineNum = lineIdx + 1

			if (inBlockComment) {
				const closeIdx = line.indexOf('*/')
				const commentText = closeIdx !== -1 ? line.substring(0, closeIdx) : line
				this.findTodoInText(ai, todos, lineNum, 0, commentText)
				if (closeIdx !== -1) inBlockComment = false
				continue
			}

			let i = 0
			let inString: string | null = null
			while (i < line.length) {
				const c = line[i]
				if (inString) {
					if (c === '\\') i++ // skip escape
					else if (c === inString) inString = null
				} else if (c === '"' || c === "'") {
					inString = c
				} else if (hash && c === '#') {
					this.findTodoInText(ai, todos, lineNum, i + 1, line.substring(i + 1))
					break
				} else if (!hash && c === '/' && i + 1 < line.length) {
					if (line[i + 1] === '/') {
						this.findTodoInText(ai, todos, lineNum, i + 2, line.substring(i + 2))
						break
					} else if (line[i + 1] === '*') {
						i += 2
						const closeIdx = line.indexOf('*/', i)
						if (closeIdx !== -1) {
							this.findTodoInText(ai, todos, lineNum, i, line.substring(i, closeIdx))
							i = closeIdx + 1
						} else {
							this.findTodoInText(ai, todos, lineNum, i, line.substring(i))
							inBlockComment = true
							break
						}
					}
				}
				i++
			}
		}
		return todos
	}

	private findTodoInText(ai: AI, todos: [number, string, number, number, number, number, string][], lineNum: number, colOffset: number, text: string) {
		const upperText = text.toUpperCase()
		const todoIdx = upperText.indexOf('TODO')
		if (todoIdx === -1) return
		const before = upperText[todoIdx - 1]
		if (before && /\w/.test(before)) return
		const after = upperText[todoIdx + 4]
		if (after && /\w/.test(after)) return
		const comment = text.trim()
		const startCol = colOffset + text.length - text.trimStart().length
		todos.push([2, ai.path, lineNum, startCol, lineNum, startCol + comment.length - 1, comment])
	}

	private loadJs(url: string) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`head > script[ src = "${url}" ]`) !== null) {
				console.warn(`script already loaded: ${url}`)
				resolve(null)
			}
			const script = document.createElement("script")
			script.src = url
			script.onload = resolve
			script.onerror = (reason) => {
				reject(reason)
			}
			document.head.appendChild(script)
		})
	}
}

const analyzer = reactive(new Analyzer()) as Analyzer

export { analyzer, Analyzer }