import { AI } from '@/model/ai';
import Vue from 'vue';

enum AnalyzerMessage {
	ANALYZE = 1,
	HOVER = 2,
	COMPLETE = 3
}

class Analyzer {

    private initialized: boolean = false
	private worker!: Worker
	private id: number = 0
	private promises: {[key: number]: any} = {};
	private GeneratorAnalyze
	private GeneratorComplete
	private GeneratorHover
	private GeneratorRegister
	private getExceptionMessage

	running: number = 0
	problems: {[key: string]: any[]} = {}
	error_count: number = 0
	warning_count: number = 0
	promise!: Promise<any>
	resolve: any

    public init() {
        if (this.initialized) { return Promise.resolve() }
		this.initialized = true

        // this.worker = new Worker("/analyzer-worker.js")
        // this.worker.onmessage = (message) => {
		// 	const data = JSON.parse(message.data)
		// 	console.log(message.data)
		// 	if (data) {

		// 		const type = data.type
		// 		const result = JSON.parse(data.result)

		// 		if (type === AnalyzerMessage.ANALYZE) {
		// 			const ai = data.ai
		// 			console.log("analyze ai", ai, "done", result)

		// 			if (ai in this.problems) {
		// 				this.error_count -= this.problems[ai].length
		// 			}
		// 			this.problems[ai] = result
		// 			this.error_count += result.errors.length
		// 		}

		// 		this.promises[data.id].resolve(result)
		// 	} else {
		// 		this.promises[data.id].reject()
		// 	}
		// 	this.running--
		// }

		this.promise = new Promise((resolve, reject) => {
			const Module = {
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

		// console.log("Hover", ai.path)

		// console.time("hover")
		return this.promise.then(() => {
			try {
				const data = this.GeneratorHover(!ai.v2, ai.path, position);
				const result = JSON.parse(data)
				// console.log(result)
				return Promise.resolve(result)
			} catch (e) {
				console.error(this.getExceptionMessage(e));
				return Promise.reject()
			}
		})
		// console.timeEnd("hover")
		// console.log(data)
		// console.log(result)
		// this.problems[ai] = result
		// this.error_count += result.errors.length
		// console.log(this.error_count)


		const id = this.id++
		const promise = new Promise<any>((resolve, reject) => {
			this.worker.postMessage({ id, type: AnalyzerMessage.HOVER, legacy: !ai.v2, path: ai.path, position })
			this.promises[id] = { resolve, reject }
			this.running++
		})
		return promise
    }

    public analyze(ai: AI, code: string) {
		console.log("Analyze", ai.path)

		// console.log("Chain promise")
		return this.promise.then(() => {
			this.running = 1
			return new Promise((resolve, reject) => setTimeout(() => {
				try {
					console.time("analyze")
					const result = JSON.parse(this.GeneratorAnalyze(!ai.v2, ai.path, code))
					// console.log(result)
					for (const ai in result) {
						const problems = result[ai]
						problems.sort((a: any, b: any) => {
							return a[0] - b[0]
						})
						Vue.set(this.problems, ai, problems)
					}
					return resolve(result)
				} catch (e) {
					Vue.set(this.problems, ai.path, [ [0, 0, 0, 0, 1, "ANALYZER_CRASHED"] ])
					try {
						console.error(this.getExceptionMessage(e));
					} catch (e2) {}
					return reject()
				} finally {
					this.running = 0
					this.updateCount()
					console.timeEnd("analyze")
				}
			}))
		})

		const id = this.id++
		const promise = new Promise<any>((resolve, reject) => {
			this.worker.postMessage({ id, type: AnalyzerMessage.ANALYZE, legacy: !ai.v2, ai: ai.id, path: ai.path, code: ai.code })
			this.promises[id] = { resolve, reject }
			this.running++
		})
		return promise
	}

	public register(ai: AI) {
		console.log("Register", ai.path)

		return this.promise.then(() => {
			this.GeneratorRegister(!ai.v2, ai.path)
			return Promise.resolve()
		})
    }

    public complete(ai: AI, position: number) {

		// console.log("Complete", ai.path)

		console.time("complete")
		const data = this.GeneratorComplete(!ai.v2, ai.path, position);
		console.timeEnd("complete")
		// console.log("complete", data)
		const result = JSON.parse(data)
		// console.log(result)
		// this.problems[ai] = result
		// this.error_count += result.errors.length
		// console.log(this.error_count)

		return Promise.resolve(result)

		const id = this.id++
		const promise = new Promise<any>((resolve, reject) => {
			this.worker.postMessage({ id, type: AnalyzerMessage.COMPLETE, legacy, code, position })
			this.promises[id] = { resolve, reject }
			this.running++
		})
		return promise
	}

	loadJs(url: string) {
		return new Promise(( resolve, reject ) => {
		  if (document.querySelector( `head > script[ src = "${url}" ]`) !== null ){
			  console.warn( `script already loaded: ${url}` );
			  resolve();
		  }
		  const script = document.createElement( "script" );
		  script.src = url;
		  script.onload = resolve;
		  script.onerror = function( reason ){
			  // this can be useful for your error-handling code
			  reason.message = `error trying to load script ${url}`;
			  reject( reason );
		  };
		  document.head.appendChild( script );
		});
	  }
}

export default Analyzer