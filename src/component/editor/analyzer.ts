import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import Vue from 'vue'
import { AIItem, Folder } from './editor-item'
import { Problem } from './problem'
import { i18n } from '@/model/i18n'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export class AnalyzerPromise {
	public then!: (data: any) => void
	public abort!: () => void
}

class Analyzer {

	public enabled: boolean = false
	public running: number = 0
	public problems: {[key: number]: {[key: string]: Problem[]}} = {}
	public error_count: number = 0
	public warning_count: number = 0
	public todo_count: number = 0
	public promise!: Promise<any>
	public requestID: number = 0
	public analyzeResolve!: (value: unknown) => any
	public hoverResolve!: (value: unknown) => any
	public lastHover: any
	public completeResolve: {[key: number]: (value: unknown) => any} = {}

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

		this.promise = new Promise((resolve, reject) => {
			const Module: any = {
				onRuntimeInitialized: () => {
					// console.log("Module initialized", Module)
					Module.ccall('init')
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

	public analyze(ai: AI, code: string) {
		// console.log("🔥 Analyze", ai.path)
		// console.time('hover')

		if (code.length > 60_000) {
			return Promise.reject()
		}

		LeekWars.socket.send([SocketMessage.EDITOR_ANALYZE, ai.id, code])

		return new Promise<any>((resolve, reject) => {
			this.analyzeResolve = resolve
		})
	}

	public analyzeResult(data: any[]) {
		if (this.analyzeResolve) {
			// console.timeEnd('hover')
			this.analyzeResolve(data)
		}
	}

	public hover(ai: AI, line: number, column: number) {
		// console.log("🔥 Hover", ai.path, line, column)
		// console.time('hover')
		LeekWars.socket.send([SocketMessage.EDITOR_HOVER, ai.id, line, column])

		return new Promise<any>((resolve, reject) => {
			this.hoverResolve = resolve
		})
	}

	public hoverResult(data: any[]) {
		if (this.hoverResolve) {
			// console.timeEnd('hover')
			this.lastHover = data
			this.hoverResolve(data)
		}
	}

	public complete(ai: AI, code: string, line: number, column: number): Promise<any> {

		console.log("🔥 Complete", ai.path, line, column)

		if (code.length > 60_000) {
			// return { ...Promise.reject(), abort: () => null }
			return Promise.reject()
		}

		const requestID = this.requestID++
		// console.log("Complete request", requestID)
		LeekWars.socket.send([SocketMessage.EDITOR_COMPLETE, requestID, ai.id, code, line, column])

		const promise = new Promise<any>((resolve, reject) => {
			this.completeResolve[requestID] = resolve
		})
		// return { then: promise.then.bind(promise), abort: () => {
		// 	// console.log("Abort request", requestID)
		// 	delete this.completeResolve[requestID]
		// }} as AnalyzerPromise
		return promise
	}

	public completeResult(message: {type: number, id: number, data: any}) {
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



	handleProblems(entrypoint: AI, problems: any[][]) {
		// console.log("handleProblems", entrypoint, problems)

		analyzer.removeProblems(entrypoint)

		// Group problems by ai
		const problemsByAI = {} as {[key: number]: Problem[]}
		const markersByAI = {} as {[key: number]: any}
		for (const problem of problems) {
			const level = problem[0]
			const ai_id = problem[1]
			const line = problem[2]
			let info
			if (problem.length === 8) {
				info = i18n.t('leekscript.error_' + problem[6], problem[7])
			} else {
				info = i18n.t('leekscript.error_' + problem[6])
			}
			const problemObject = new Problem(line, problem[3], problem[4], problem[5], level, info as string)
			if (!problemsByAI[ai_id]) {
				problemsByAI[ai_id] = []
				markersByAI[ai_id] = []
			}
			problemsByAI[ai_id].push(problemObject)
			markersByAI[ai_id].push({
				message: problem.length === 8 ? i18n.t('leekscript.error_' + problem[6], problem[7]) as string : i18n.t('leekscript.error_' + problem[6]) as string,
				severity: problem[0] === 0 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
				startLineNumber: problem[2],
				startColumn: problem[3] + 1,
				endLineNumber: problem[4],
				endColumn: problem[5] + 2,
			})
		}
		for (const ai_id in problemsByAI) {
			const ai = fileSystem.ais[ai_id]
			const ai_problems = problemsByAI[ai_id]
			// console.log("ai", ai.path, "problems", ai_problems)
			analyzer.setProblems(entrypoint.id, ai, ai_problems)

			monaco.editor.setModelMarkers(ai.model, "owner", markersByAI[ai_id])
		}
		// No problems, clear markers
		if (problems.length === 0) {
			monaco.editor.setModelMarkers(entrypoint.model, "owner", [])
		}
	}

	public setProblems(entrypoint: number, ai: AI, problems: any) {
		// console.log("[Analyzer] set ai problems", entrypoint, ai, problems)
		if (!(entrypoint in this.problems)) {
			Vue.set(this.problems, entrypoint, {})
		}
		Vue.set(this.problems[entrypoint], ai.path, problems)
		Vue.set(ai.problems, entrypoint, problems)
		this.updateAiErrors(ai)
	}

	public removeProblems(entrypoint: AI) {
		for (const ai_id in fileSystem.ais) {
			const ai = fileSystem.ais[ai_id]
			if (ai.problems && Object.values(ai.problems).length) {
				Vue.delete(ai.problems, entrypoint.id)
				this.updateAiErrors(ai)
			}
		}
		Vue.delete(this.problems, entrypoint.id)
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
		Vue.set(ai, "errors", errors)
		Vue.set(ai, "warnings", warnings)
		Vue.set(ai, "todos", todos)

		// Update parent folders
		let current = fileSystem.folderById[ai.folder] as Folder | null
		while (current) {
			current.errors = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).errors : (i as AIItem).ai.errors), 0)
			current.warnings = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).warnings : (i as AIItem).ai.warnings), 0)
			current.todos = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).todos : (i as AIItem).ai.todos), 0)
			current = current.id === 0 ? null : fileSystem.folderById[current.parent]
		}
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

const analyzer = new Analyzer()

export { analyzer, Analyzer }