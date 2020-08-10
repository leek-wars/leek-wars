import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import Vue from 'vue'
import { AIItem, Folder } from './editor-item'

class Analyzer {

	public enabled: boolean = false
	public running: number = 0
	public problems: {[key: string]: any[]} = {}
	public error_count: number = 0
	public warning_count: number = 0
	public promise!: Promise<any>

	private initialized: boolean = false
	private GeneratorAnalyze!: Function
	private GeneratorComplete!: Function
	private GeneratorHover!: Function
	private GeneratorRegister!: Function
	private getExceptionMessage!: Function

	public init() {
		this.enabled = true
		if (this.initialized) { return Promise.resolve() }
		this.initialized = true

		this.promise = new Promise((resolve, reject) => {
			const Module: any = {
				onRuntimeInitialized: () => {
					// console.log("Module initialized", Module)
					Module.ccall('init')
					this.GeneratorAnalyze = Module.cwrap('analyze', 'string', ['boolean', 'string', 'string'])
					this.GeneratorComplete = Module.cwrap('complete', 'string', ['boolean', 'string', 'number'])
					this.GeneratorHover = Module.cwrap('hover', 'string', ['boolean', 'string', 'number'])
					this.GeneratorRegister = Module.cwrap('register_', 'void', ['boolean', 'string'])
					this.getExceptionMessage = Module.cwrap('getExceptionMessage', 'string', ['number'])

					// console.log(this.GeneratorAnalyze(false, "Fight.toto"))
					// console.log(this.GeneratorComplete(false, "Fight.getEntity().name", 18))

					resolve()
				}
			}
			window.Module = Module
			this.loadJs('/analyzer.js')
		})
	}

	public updateCount() {
		let errors = 0
		let warnings = 0
		for (const ai in this.problems) {
			// console.log(this.problems[ai])
			for (const problem of this.problems[ai]) {
				if (problem[4] === 0) { errors++ }
				else if (problem[4] === 1) { warnings++ }
			}
		}
		this.error_count = errors
		this.warning_count = warnings
	}

	public hover(ai: AI, position: number) {

		if (!this.enabled) { return Promise.reject() }

		// console.log("Hover", ai.path)

		// console.time("hover")
		return this.promise.then(() => {
			try {
				const data = this.GeneratorHover(!ai.v2, ai.path, position)
				const result = JSON.parse(data)
				// console.log(result)
				return Promise.resolve(result)
			} catch (e) {
				console.error(this.getExceptionMessage(e))
				return Promise.reject()
			}
		})
	}

	public analyze(ai: AI, code: string) {

		if (!this.enabled) { return Promise.reject() }

		console.log("Analyze", ai.path)

		// console.log("Chain promise")
		return this.promise.then(() => {
			this.running = 1
			return new Promise((resolve, reject) => setTimeout(() => {
				try {
					console.time("analyze")
					const result = JSON.parse(this.GeneratorAnalyze(!ai.v2, ai.path, code))
					// console.log(result)
					for (const path in result) {
						const problems = result[path]
						problems.sort((a: any, b: any) => {
							return a[0] - b[0]
						})
						this.setAIProblems(path, problems)
					}
					return resolve(result)
				} catch (e) {
					const problems = [ [0, 0, 0, 0, 1, "ANALYZER_CRASHED"] ]
					this.setAIProblems(ai.path, problems)
					try {
						console.error(this.getExceptionMessage(e))
					} catch (e2) {
						// nothing
					}
					return reject()
				} finally {
					this.running = 0
					this.updateCount()
					console.timeEnd("analyze")
				}
			}))
		})
	}

	public register(ai: AI) {

		if (!this.enabled) { return Promise.reject() }

		console.log("Register", ai.path)

		return this.promise.then(() => {
			this.GeneratorRegister(!ai.v2, ai.path)
			return Promise.resolve()
		})
	}

	public complete(ai: AI, position: number) {

		if (!this.enabled) { return Promise.reject() }

		// console.log("Complete", ai.path)

		console.time("complete")
		const data = this.GeneratorComplete(!ai.v2, ai.path, position)
		console.timeEnd("complete")
		// console.log("complete", data)
		const result = JSON.parse(data)
		// console.log(result)
		// this.problems[ai] = result
		// this.error_count += result.errors.length
		// console.log(this.error_count)

		return Promise.resolve(result)
	}

	private setAIProblems(ai: string, problems: any) {

		Vue.set(this.problems, ai, problems)
		const aiObject = fileSystem.aiByFullPath[ai]
		Vue.set(aiObject, "errors", problems.filter((p: any) => p[4] === 0).length)
		Vue.set(aiObject, "warnings", problems.filter((p: any) => p[4] === 1).length)

		// Update parent folders
		let current = fileSystem.folderById[aiObject.folder] as Folder | null
		while (current) {
			current.errors = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).errors : (i as AIItem).ai.errors), 0)
			current.warnings = current.items.reduce((s, i) => s + (i.folder ? (i as Folder).warnings : (i as AIItem).ai.warnings), 0)
			current = current.id === 0 ? null : fileSystem.folderById[current.parent]
		}
	}

	private loadJs(url: string) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`head > script[ src = "${url}" ]`) !== null) {
				console.warn(`script already loaded: ${url}`)
				resolve()
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

export default Analyzer