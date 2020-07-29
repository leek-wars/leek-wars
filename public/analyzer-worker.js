var GeneratorAnalyze
var GeneratorComplete
var GeneratorHover

onmessage = function(e) {
    // console.log("message received", e)
    const id = e.data.id
    const type = e.data.type
    try {
        if (type === 1) {
            console.time("analyze")
            const result = GeneratorAnalyze(e.data.legacy, e.data.path, e.data.code)
            console.timeEnd("analyze")
            self.postMessage(JSON.stringify({ id, type, ai: e.data.ai, result }))
        } else if (type === 2) {
			// console.time("hover")
            const result = GeneratorHover(e.data.legacy, e.data.path, e.data.position)
            // console.timeEnd("hover")
            self.postMessage(JSON.stringify({ id, type, result }))
        } else if (type === 3) {
            const result = GeneratorComplete(e.data.legacy, e.data.code, e.data.position)
            self.postMessage(JSON.stringify({ id, type, result }))
        } else {
            self.postMessage(JSON.stringify({ id, type, result: null }))
        }
    } catch (e) {
        self.postMessage(JSON.stringify({ id, type, result: null }))
    }
}

Module = {
    onRuntimeInitialized: function() {
        // console.log("Module initialized", Module)
        Module.ccall('init')
        GeneratorAnalyze = Module.cwrap('analyze', 'string', ['boolean', 'string', 'string'])
        GeneratorComplete = Module.cwrap('complete', 'string', ['boolean', 'string', 'number'])
        GeneratorHover = Module.cwrap('hover', 'string', ['boolean', 'string', 'number'])

        console.log(GeneratorAnalyze(false, "Fight.toto"))
        console.log(GeneratorComplete(false, "Fight.getEntity().name", 18))
    }
}

// self.importScripts('analyzer.js')