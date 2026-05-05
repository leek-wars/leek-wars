import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// @ts-ignore
import leekscript from './leekscript-monarch.js'

const cspNonce = (document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null)?.content || undefined

self.MonacoEnvironment = {
	getWorker(_: any, label: string) {
		return new editorWorker()
	},
	// Not in monaco's Environment type but consumed at runtime (CSP nonce).
	nonce: cspNonce,
} as monaco.Environment

// Monaco injects <style> elements dynamically without a nonce, which violates
// CSP style-src when a nonce is used. Patch each new <style> with the nonce.
if (cspNonce) {
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof HTMLStyleElement && !node.nonce) {
					node.nonce = cspNonce
				}
			}
		}
	}).observe(document.head, { childList: true })
}

import { i18n } from '@/model/i18n';
import { fileSystem } from '@/model/filesystem';
import { analyzer } from './analyzer';
import { emitter } from '@/model/vue';
import { markRaw } from 'vue';
import { AI } from '@/model/ai.js';
import { LeekWars } from '@/model/leekwars';
import { getKeywords } from './keywords';
import { Keyword, KeywordKind } from '@/model/keyword';
import { getLanguageForPath } from './file-types';

monaco.languages.register({ id: 'leekscript' })
monaco.languages.setLanguageConfiguration('leekscript', {
	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/'],
	},
	surroundingPairs: [
		{ open: "(", close: ")" },
		{ open: "{", close: "}" },
		{ open: "[", close: "]" },
		// { open: "<", close: ">" },
	],
	autoClosingPairs: [
		{ open: "(", close: ")" },
		{ open: "{", close: "}" },
		{ open: "[", close: "]" },
		// { open: "<", close: ">" },
	],
	brackets:[
		["(", ")"],
		["{", "}"],
		["[", "]"],
		// ["<", ">"],
	],
	indentationRules: {
		decreaseIndentPattern: new RegExp("^\\s*[\\}\\]\\)].*$"),
		increaseIndentPattern: new RegExp("^.*(\\{[^}]*|\\([^)]*|\\[[^\\]]*)$"),
		unIndentedLinePattern: new RegExp("^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$|^(\\t|[ ])*[ ]\\*/\\s*$|^(\\t|[ ])*[ ]\\*([ ]([^\\*]|\\*(?!/))*)?$"),
		indentNextLinePattern: new RegExp("^((.*=>\\s*)|((.*[^\\w]+|\\s*)(if|while|for)\\s*\\(.*\\)\\s*))$")
	},
})
monaco.languages.setMonarchTokensProvider('leekscript', leekscript)

monaco.editor.addKeybindingRules([
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
		command: "editor.action.commentLine",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash,
		command: "editor.action.commentLine",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE,
		command: "editor.action.commentLine",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
		command: "editor.action.duplicateSelection",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
		command: "editor.action.deleteLines",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Shift | monaco.KeyCode.KeyF,
		command: "editor.action.formatDocument",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
		command: "editor.foldAll",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
		command: "editor.unfoldAll",
		when: "textInputFocus",
	},
	{
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU,
		command: "editor.toggleFold",
		when: "textInputFocus",
	}
]);

monaco.editor.registerCommand('jump', (accessor, args) => {
	emitter.emit('jump', { ai: fileSystem.aiByFullPath[args.ai], line: args.line, column: args.column })
})

monaco.editor.registerCommand('findReferencesAtPosition', (accessor, uri: monaco.Uri, position: monaco.IPosition) => {
	const editor = monaco.editor.getEditors().find(e => e.getModel()?.uri.toString() === uri.toString())
	if (editor) {
		editor.setPosition(position)
		editor.trigger('codelens', 'editor.action.referenceSearch.trigger', null)
	}
})

const METHOD_REGEX = /^[ \t]+(?:(?:(?:public\s+)?(?:static\s+)?(?:[\w<>,?[\]]+\s+)+(\w+))|(constructor))\s*\(/
const NON_METHOD_KEYWORDS = new Set(['function', 'for', 'while', 'if', 'class', 'var', 'return', 'new', 'else', 'switch', 'catch'])
const RESERVED_SYMBOLS = new Set(['true', 'false', 'null', 'this', 'super'])


monaco.editor.defineTheme("leek-wars", {
	base: "vs", // can also be vs-dark or hc-black
	inherit: true, // can also be false to completely replace the builtin rules
	rules: [
		{ token: "comment", foreground: "999999" },
		{ token: "string", foreground: "ff781e" },
		{ token: "keyword", foreground: "00007f", fontStyle: 'bold' },
		{ token: "type", foreground: "0000D0", fontStyle: 'bold' },
		{ token: "lsconstant", fontStyle: 'bold' },
		{ token: "lsfunction", fontStyle: 'italic' },
		{ token: "lsfunction-deprecated", foreground: '777777', fontStyle: 'italic' },
		{ token: "atom", foreground: '0086bc', fontStyle: 'bold' },
		{ token: "number", foreground: '007f00' },
	],
	colors: {
		"editor.foreground": "#000000",
		"editor.background": "#ffffff",
		"editor.hoverHighlightBackground": "#00aeff33"
	},
})

monaco.editor.defineTheme("monokai", {
	base: "vs-dark", // can also be vs-dark or hc-black
	inherit: true, // can also be false to completely replace the builtin rules
	rules: [
		{ token: "comment", foreground: "75715e" },
		{ token: "string", foreground: "e6db74" },
		{ token: "keyword", foreground: "f92672" },
		{ token: "type", foreground: "86d7ff" },
		{ token: "lsconstant", fontStyle: 'bold' },
		{ token: "lsfunction", fontStyle: 'italic' },
		{ token: "lsfunction-deprecated", foreground: '777777', fontStyle: 'italic' },
		{ token: "atom", foreground: 'ae81ff' },
		{ token: "number", foreground: 'ae81ff' },
	],
	colors: {
		"editor.foreground": "#f8f8f2",
		"editor.background": "#272822",
		"editor.hoverHighlightBackground": "#00aeff33"
	},
})

monaco.editor.registerEditorOpener({
	openCodeEditor: async (source, resource, selectionOrPosition) => {
		const ai = fileSystem.aiByFullPath[resource.path.substring(1)]
		await fileSystem.load(ai)
		const uri = monaco.Uri.file(ai.path)
		const model = monaco.editor.getModel(resource) || markRaw(monaco.editor.createModel(ai.code, getLanguageForPath(ai.path), uri))
		ai.model = model
		const range = selectionOrPosition as monaco.IRange
		emitter.emit('jump', { ai, line: range.startLineNumber, column: range.startColumn - 1 })
		return true
	},
})

monaco.languages.registerHoverProvider("leekscript", {
	provideHover: async (model, position, token, context) => {
		// console.log("hover", model.uri.path)

		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai) { return null }

		const hover = await analyzer.hover(ai, position.lineNumber, position.column - 1)
		// console.log(hover)
		// this.hover = hover
		if (hover && hover.type) {
			const range = new monaco.Range(
				hover.location[1],
				hover.location[2] + 1,
				hover.location[3],
				hover.location[4] + 2,
			)
			let details = ''
			const text = model.getValueInRange(range)
			const previousToken = text.includes('.') ? text.split('.')[0] : undefined
			const mainToken = text.includes('.') ? text.split('.')[1] : text

			const symbol = ai.searchSymbol(mainToken, previousToken)
			if (hover.defined) {
				const defAi = fileSystem.ais[hover.defined[0]]
				if (defAi) {
					const line = hover.defined[1]
					const column = hover.defined[2]
					const args = encodeURIComponent(JSON.stringify({ ai: defAi.path, line, column }))
					details += "[" + i18n.t('leekscript.defined_in', [ '`' + defAi.path + '`', line ]) + "](command:jump?" + args + ' "' + defAi.path + ':' + line + ':' + column + '")'
				}
				if (symbol) {
					fileSystem.symbols[text] = symbol
				}
			}
			return {
				range: range,
				contents: [
					{ value: "```leekscript\n" + text + "\n```" },
					{ value: details, isTrusted: true },
					{ value: "```leekscript\n" + hover.type + "\n```" },
				],
			}
		}
		return {
			range: new monaco.Range(
				position.lineNumber,
				position.column,
				position.lineNumber,
				position.column,
			),
			contents: [

			],
		}
	},
})

monaco.languages.registerDefinitionProvider("leekscript", {
	provideDefinition: async (model, position, token) => {
		// console.log("provideDefinition", model.uri.path, position.lineNumber, position.column)

		// Make a fresh hover request instead of using potentially stale lastHover
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		const hover = await analyzer.hover(ai, position.lineNumber, position.column - 1)

		if (hover?.defined) {
			// console.log("provideDefinition defined", hover.defined)
			const range = new monaco.Range(
				hover.defined[1],
				hover.defined[2] + 1,
				hover.defined[3],
				hover.defined[4],
			)
			const targetAi = fileSystem.ais[hover.defined[0]]
			if (!targetAi) return null
			const uri = monaco.Uri.file(targetAi.path)
			return {
				range,
				uri
			}
		}
		return {
			range: new monaco.Range(
				position.lineNumber,
				position.column,
				position.lineNumber,
				position.column,
			),
			uri: model.uri
		}
	},
})

function findEnclosingClassName(ai: AI, line: number): string {
	let className = ''
	for (const cn in ai.classes) {
		if (ai.classes[cn].line! <= line) className = cn
	}
	return className
}

function countConstructorParams(lineContent: string): number {
	const m = lineContent.match(/\(([^)]*)\)/)
	return m && m[1].trim() ? m[1].split(',').length : 0
}

monaco.languages.registerReferenceProvider("leekscript", {
	provideReferences: async (model, position, context, token) => {
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai) { return [] }

		const word = model.getWordAtPosition(position)
		let locations: any[]
		if (word && word.word === 'constructor') {
			const className = findEnclosingClassName(ai, position.lineNumber)
			if (!className) { return [] }
			const cls = ai.classes[className]
			const clsContent = model.getLineContent(cls.line!)
			const clsCol = clsContent.indexOf(className)
			if (clsCol < 0) { return [] }
			const paramCount = countConstructorParams(model.getLineContent(position.lineNumber))
			locations = await analyzer.references(ai, cls.line!, clsCol, paramCount)
		} else {
			locations = await analyzer.references(ai, position.lineNumber, position.column - 1)
		}
		if (!locations || !locations.length) { return [] }

		// Load all referenced files in parallel
		const uniqueAis = new Map<string, any>()
		for (const loc of locations) {
			const targetAi = fileSystem.ais[loc[0]]
			if (targetAi && !uniqueAis.has(loc[0])) { uniqueAis.set(loc[0], targetAi) }
		}
		await Promise.all([...uniqueAis.values()].map((a: any) => fileSystem.load(a)))

		const results: monaco.languages.Location[] = []
		for (const loc of locations) {
			const targetAi = fileSystem.ais[loc[0]]
			if (!targetAi) { continue }
			const uri = monaco.Uri.file(targetAi.path)
			if (!monaco.editor.getModel(uri) && targetAi.code !== undefined) {
				targetAi.model = markRaw(monaco.editor.createModel(targetAi.code, getLanguageForPath(targetAi.path), uri))
			}
			results.push({
				uri,
				range: new monaco.Range(loc[1], loc[2] + 1, loc[3], loc[4] + 2),
			})
		}
		return results
	},
})

monaco.languages.registerCodeLensProvider("leekscript", {
	provideCodeLenses: (model, token) => {
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai) { return { lenses: [], dispose: () => {} } }

		const lenses: monaco.languages.CodeLens[] = []
		const addLens = (lineHint: number, label: string, isMethod: boolean) => {
			const pattern = isMethod ? label + '(' : label
			for (let offset = 0; offset <= 3; offset++) {
				for (const line of [lineHint + offset, lineHint - offset]) {
					if (line < 1 || line > model.getLineCount()) continue
					const content = model.getLineContent(line)
					const col = content.indexOf(pattern)
					if (col < 0) continue
					const indent = content.search(/\S/) + 1
					lenses.push({
						range: new monaco.Range(line, indent, line, indent),
						id: 'ref:' + line + ':' + col,
					})
					return
				}
			}
		}
		for (const fun of ai.functions) {
			if (fun.line) addLens(fun.line, fun.label, true)
		}
		for (const name in ai.classes) {
			const cls = ai.classes[name]
			if (cls.line) addLens(cls.line, name, false)
		}
		// Scan methods directly from code (line-by-line to avoid multi-line regex issues in ai.ts)
		for (let i = 0; i < model.getLineCount(); i++) {
			const m = METHOD_REGEX.exec(model.getLineContent(i + 1))
			if (!m) continue
			const name = m[1] || m[2]
			if (NON_METHOD_KEYWORDS.has(name)) continue
			if (name === 'constructor') {
				const className = findEnclosingClassName(ai, i + 1)
				if (className) {
					const content = model.getLineContent(i + 1)
					const indent = content.search(/\S/) + 1
					lenses.push({
						range: new monaco.Range(i + 1, indent, i + 1, indent),
						id: 'ctor:' + className + ':' + countConstructorParams(content),
					})
				}
				continue
			}
			addLens(i + 1, name, true)
		}
		return { lenses, dispose: () => {} }
	},
	resolveCodeLens: async (model, codeLens, token) => {
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai || !codeLens.id) { return codeLens }

		if (codeLens.id.startsWith('ctor:')) {
			const parts = codeLens.id.split(':')
			const className = parts[1]
			const paramCount = parseInt(parts[2])
			const cls = ai.classes[className]
			if (!cls || !cls.line) { return codeLens }
			const clsContent = model.getLineContent(cls.line)
			const clsCol = clsContent.indexOf(className)
			if (clsCol < 0) { return codeLens }

			const locations = await analyzer.references(ai, cls.line, clsCol, paramCount)
			const count = locations?.length || 0

			const ctorLine = codeLens.range.startLineNumber
			const ctorContent = model.getLineContent(ctorLine)
			const ctorCol = ctorContent.indexOf('constructor') + 1
			codeLens.command = {
				id: 'findReferencesAtPosition',
				title: count === 0 ? 'no usages' : count === 1 ? '1 usage' : count + ' usages',
				arguments: [model.uri, new monaco.Position(ctorLine, ctorCol)],
			}
			return codeLens
		}

		const [, lineStr, colStr] = codeLens.id.split(':')
		const line = parseInt(lineStr)
		const column = parseInt(colStr)

		const locations = await analyzer.references(ai, line, column)
		const count = locations?.length || 0

		codeLens.command = {
			id: 'findReferencesAtPosition',
			title: count === 0 ? 'no references' : count === 1 ? '1 reference' : count + ' references',
			arguments: [model.uri, new monaco.Position(line, column + 1)],
		}
		return codeLens
	},
})

monaco.languages.registerDocumentSymbolProvider("leekscript", {
	provideDocumentSymbols(model) {
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai) { return [] }
		const lineCount = model.getLineCount()

		const symbols: monaco.languages.DocumentSymbol[] = []

		// Functions
		for (const fun of ai.functions) {
			if (!fun.line || fun.line < 1 || fun.line > lineCount) continue
			const endLine = findBlockEnd(model, fun.line)
			symbols.push({
				name: fun.label + '(' + (fun.arguments || []).join(', ') + ')',
				detail: '',
				kind: monaco.languages.SymbolKind.Function,
				range: new monaco.Range(fun.line, 1, endLine, model.getLineContent(endLine).length + 1),
				selectionRange: new monaco.Range(fun.line, 1, fun.line, model.getLineContent(fun.line).length + 1),
				tags: [],
			})
		}

		// Classes with their members
		for (const name in ai.classes) {
			const cls = ai.classes[name]
			if (!cls.line || cls.line < 1 || cls.line > lineCount) continue
			const classEndLine = findBlockEnd(model, cls.line)
			const children: monaco.languages.DocumentSymbol[] = []

			// Methods (scan code like CodeLens does)
			for (let i = cls.line; i <= classEndLine; i++) {
				const m = METHOD_REGEX.exec(model.getLineContent(i))
				if (!m) continue
				const methodName = m[1] || m[2]
				if (NON_METHOD_KEYWORDS.has(methodName)) continue
				const methodEndLine = findBlockEnd(model, i)
				children.push({
					name: methodName,
					detail: '',
					kind: methodName === 'constructor' ? monaco.languages.SymbolKind.Constructor : monaco.languages.SymbolKind.Method,
					range: new monaco.Range(i, 1, methodEndLine, model.getLineContent(methodEndLine).length + 1),
					selectionRange: new monaco.Range(i, 1, i, model.getLineContent(i).length + 1),
					tags: [],
				})
			}

			// Fields
			for (const field of [...cls.fields, ...cls.static_fields]) {
				if (!field.line || field.line < cls.line || field.line > classEndLine) continue
				if (!field.ai || RESERVED_SYMBOLS.has(field.label)) continue
				children.push({
					name: field.label,
					detail: '',
					kind: monaco.languages.SymbolKind.Field,
					range: new monaco.Range(field.line, 1, field.line, model.getLineContent(field.line).length + 1),
					selectionRange: new monaco.Range(field.line, 1, field.line, model.getLineContent(field.line).length + 1),
					tags: [],
				})
			}

			symbols.push({
				name,
				detail: '',
				kind: monaco.languages.SymbolKind.Class,
				range: new monaco.Range(cls.line, 1, classEndLine, model.getLineContent(classEndLine).length + 1),
				selectionRange: new monaco.Range(cls.line, 1, cls.line, model.getLineContent(cls.line).length + 1),
				tags: [],
				children,
			})
		}

		// Global variables
		for (const name in ai.globals) {
			if (RESERVED_SYMBOLS.has(name)) continue
			const g = ai.globals[name]
			if (!g.line) continue
			symbols.push({
				name,
				detail: '',
				kind: monaco.languages.SymbolKind.Variable,
				range: new monaco.Range(g.line, 1, g.line, model.getLineContent(g.line).length + 1),
				selectionRange: new monaco.Range(g.line, 1, g.line, model.getLineContent(g.line).length + 1),
				tags: [],
			})
		}

		return symbols
	},
})

function findBlockEnd(model: monaco.editor.ITextModel, startLine: number): number {
	let depth = 0
	let found = false
	for (let i = startLine; i <= model.getLineCount(); i++) {
		const line = model.getLineContent(i)
		for (const ch of line) {
			if (ch === '{') { depth++; found = true }
			else if (ch === '}') { depth-- }
			if (found && depth === 0) return i
		}
	}
	return startLine
}

monaco.languages.registerDocumentFormattingEditProvider("leekscript", {
	async provideDocumentFormattingEdits(model) {
		const formattedText = await formatLeekScript(model.getValue());
		return [
			{
				range: model.getFullModelRange(),
				text: formattedText,
			},
		];
	},
});

async function formatLeekScript(code:string): Promise<string> {
	let formattedCode:string = code;

	await import(/* webpackChunkName: "js-beautify" */ "js-beautify").then(js_beautify => {

		const hex_literals = code.matchAll(/0(?:x[\dA-Fa-f_.p]+|o[0-7_]+|b[01_]+)/g)
		let formatted = js_beautify.default.js_beautify(code, {indent_size: 1, indent_char: '\t'})

		// js-beautify doesn't recognize hexadecimal floating point, and will split them as:
		// 0x1 .0 p53
		// this code restore the correct litteral after the formatting:
		for (const lit of hex_literals) {
			const fLit = lit[0].replace(/\./, ' .').replace(/p/, ' p')
			formatted = formatted.replace(fLit, lit[0])
		}
		// js-beautify doesn't recognize the \= operator and will split it as: \ =
		formatted = formatted.replace(/\\ =/g, ' \\=')
		// js-beautify doesn't recognize the .. operator and will split it as: \ =
		formatted = formatted.replace(/\. \./g, '..')
		formattedCode = formatted;
	})
	return formattedCode;

}

LeekWars.completionsProvider = monaco.languages.registerCompletionItemProvider("leekscript", {
	triggerCharacters: ["."],

	provideCompletionItems: async function (model, position) {

		// console.log("provideCompletionItems", model)

		const path = model.uri.path.substring(1)
		const ai = fileSystem.getAIByPath(path)

		const completions = await analyzer.complete(ai, model.getValue(), position.lineNumber, position.column - 2)

		const word = model.getWordUntilPosition(position)
		const line = model.getLineContent(position.lineNumber)
		const isDot = line.charAt(word.startColumn - 2) === '.'
		const tokenBeforeDot = model.getWordAtPosition({ column: word.startColumn - 1, lineNumber: position.lineNumber })?.word || ''
		// console.log("word", word, "isDot", isDot, "tokenBeforeDot", tokenBeforeDot)
		const range = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: word.startColumn,
			endColumn: word.endColumn,
		}
		const suggestions = (completions ? completions.items.map((i: any) => ({
			label: i.name,
			kind: monaco.languages.CompletionItemKind.Function,
			documentation: "Describe your library here",
			insertText: i.name,
			range,
		})) : []) as monaco.languages.CompletionItem[]

		const visited = new Set<string>()
		const maybeAdd = (data: string | Keyword) => {
			// console.log("keyword", data)
			if (typeof data === 'string') {
				if (data.toLowerCase().indexOf(word.word.toLowerCase()) === 0) {
					suggestions.push({
						label: data,
						detail: i18n.t('leekscript.keyword', [data]) as string,
						kind: KeywordKind.Keyword as number as monaco.languages.CompletionItemKind,
						range,
						insertText: data,
					})
				}
			} else {
				if (data.label.toLowerCase().indexOf(word.word.toLowerCase()) === 0) {
					suggestions.push({
						...data,
						kind: data.kind as number as monaco.languages.CompletionItemKind,
						label: data.fullName,
						documentation: data.label,
						// detail: data.details,
						range,
						insertText: data.insertText || data.label,
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					})
				}
			}
		}
		if (isDot) {
			// ClassName.<field>
			const visited = new Set<string>()
			addDotCompletionsFromAI(tokenBeforeDot, word.word, suggestions, visited, ai, range)

			for (const entrypoint_id of ai.entrypoints) {
				const entrypoint = fileSystem.ais[entrypoint_id]
				if (entrypoint) {
					addDotCompletionsFromAI(tokenBeforeDot, word.word, suggestions, visited, entrypoint, range)
				}
			}
		} else {
			addCompletionsFromAI(word.word, suggestions, visited, ai, range)
			getKeywords().forEach(maybeAdd)
		}

		return {
			suggestions
		}
	}
})

function addCompletionsFromAI(start: string, completions: monaco.languages.CompletionItem[], visited: Set<string>, ai: AI, range: monaco.IRange) {
	if (visited.has(ai.path)) { return }
	visited.add(ai.path)
	// Globales
	for (const variable in ai.globals) {
		if (variable.toLowerCase().indexOf(start.toLowerCase()) === 0) {
			const g = ai.globals[variable]
			completions.push({ ...g, kind: g.kind as number as monaco.languages.CompletionItemKind, insertText: g.label, range })
		}
	}
	// Fonctions
	for (const fun of ai.functions) {
		if (fun.label.toLowerCase().indexOf(start.toLowerCase()) === 0) {
			completions.push({
				...fun,
				kind: fun.kind as number as monaco.languages.CompletionItemKind,
				label: fun.fullName,
				insertText: fun.insertText || fun.label,
				range,
				insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
				documentation: fun.label,
			})
			fileSystem.symbols[fun.label] = fun
		}
	}
	// Classes
	for (const variable in ai.classes) {
		if (variable.toLowerCase().indexOf(start.toLowerCase()) === 0) {
			const c = ai.classes[variable]
			completions.push({ ...c, kind: c.kind as number as monaco.languages.CompletionItemKind, insertText: c.label, range })
		}
	}
	// Includes of ai
	for (const include of ai.includes) {
		addCompletionsFromAI(start, completions, visited, include, range)
	}
}

function addDotCompletionsFromAI(tokenBeforeDot: string, start: string, completions: monaco.languages.CompletionItem[], visited: Set<string>, ai: AI, range: monaco.IRange) {

	if (visited.has(ai.path)) { return }
	visited.add(ai.path)

	if (tokenBeforeDot in ai.classes) {
		const clazz = ai.classes[tokenBeforeDot]
		for (const staticMethod of clazz.static_methods) {
			if (staticMethod.label.toLowerCase().indexOf(start) === 0) {
				completions.push({
					...staticMethod,
					kind: staticMethod.kind as number as monaco.languages.CompletionItemKind,
					label: staticMethod.fullName,
					insertText: staticMethod.insertText || staticMethod.label,
					range,
					// detail: clazz.fullName + '.' + staticMethod.label,
					documentation: clazz.fullName + '.' + staticMethod.label,
					insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
				})
				fileSystem.symbols[clazz.fullName + '.' + staticMethod.label] = staticMethod
			}
		}
		for (const static_field of clazz.static_fields) {
			if (static_field.label.toLowerCase().indexOf(start) === 0) {
				completions.push({
					...static_field,
					kind: static_field.kind as number as monaco.languages.CompletionItemKind,
					insertText: static_field.label,
					range,
					documentation: clazz.fullName + '.' + static_field.label,
				})
				fileSystem.symbols[clazz.fullName + '.' + static_field.label] = static_field
			}
		}
	}
	// Includes of ai
	for (const include of ai.includes) {
		addDotCompletionsFromAI(tokenBeforeDot, start, completions, visited, include, range)
	}
}
