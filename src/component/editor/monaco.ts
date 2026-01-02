import * as monaco from 'monaco-editor'

// @ts-ignore
import leekscript from './leekscript-monarch.js'

import { i18n } from '@/model/i18n';
import { fileSystem } from '@/model/filesystem';
import { analyzer } from './analyzer';
import { emitter, vueMain } from '@/model/vue';
import { AI } from '@/model/ai.js';
import { keywords } from './keywords';
import { Keyword, KeywordKind } from '@/model/keyword';
import { LeekWars } from '@/model/leekwars';

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
monaco.languages.registerDocumentSemanticTokensProvider('leekscript', leekscript)

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
	// console.log("Command jump", args)
	emitter.emit('jump', fileSystem.aiByFullPath[args.ai], args.line, args.column)
})

// monaco.languages.registerDocumentSymbolProvider("leekscript", {
// 	provideDocumentSymbols: function (model, token) {
// 		return [
// 			{
// 				range: {
// 					startLineNumber: 1,
// 					startColumn: 1,
// 					endLineNumber: 2,
// 					endColumn: 1,
// 				},
// 				name: "File",
// 				kind: 0,
// 				detail: "",
// 				tags: [],
// 				selectionRange: {
// 					startLineNumber: 1,
// 					startColumn: 1,
// 					endLineNumber: 2,
// 					endColumn: 1,
// 				},
// 			},
// 		]
// 	}
// })

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
		const uri = monaco.Uri.parse('file:///' + ai.path)
		const model = monaco.editor.getModel(resource) || monaco.editor.createModel(ai.code, 'leekscript', uri)
		ai.model = model
		const range = selectionOrPosition as monaco.IRange
		emitter.emit('jump', ai, range.startLineNumber, range.startColumn - 1)
		return true
	},
})

monaco.languages.registerHoverProvider("leekscript", {
	provideHover: async (model, position, token, context) => {
		// console.log("hover", model.uri.path)

		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]

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
				const ai = fileSystem.ais[hover.defined[0]]
				const line = hover.defined[1]
				const column = hover.defined[2]
				const args = encodeURIComponent(JSON.stringify({ ai: ai.path, line, column }))
				details += "[" + i18n.t('leekscript.defined_in', [ '`' + ai.path + '`', line ]) + "](command:jump?" + args + ' "' + ai.path + ':' + line + ':' + column + '")'
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
			const uri = monaco.Uri.parse('file:///' + targetAi.path)
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
		formattedCode = formatted;
	})
	return formattedCode;

}

LeekWars.completionsProvider = monaco.languages.registerCompletionItemProvider("leekscript", {
	triggerCharacters: ["."],

	provideCompletionItems: async function (model, position) {

		// console.log("provideCompletionItems", model)

		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]

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

		const visited = new Set<number>()
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
			const visited = new Set<number>()
			addDotCompletionsFromAI(tokenBeforeDot, word.word, suggestions, visited, ai, range)

			for (const entrypoint_id of ai.entrypoints) {
				const entrypoint = fileSystem.ais[entrypoint_id]
				if (entrypoint) {
					addDotCompletionsFromAI(tokenBeforeDot, word.word, suggestions, visited, entrypoint, range)
				}
			}
		} else {
			addCompletionsFromAI(word.word, suggestions, visited, ai, range)
			keywords.forEach(maybeAdd)
		}

		return {
			suggestions
		}
	}
})

function addCompletionsFromAI(start: string, completions: monaco.languages.CompletionItem[], visited: Set<number>, ai: AI, range: monaco.IRange) {
	if (visited.has(ai.id)) { return }
	visited.add(ai.id)
	// console.log("add completions from ai", ai.id)
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

function addDotCompletionsFromAI(tokenBeforeDot: string, start: string, completions: monaco.languages.CompletionItem[], visited: Set<number>, ai: AI, range: monaco.IRange) {

	// console.log("dot completions", ai)

	if (visited.has(ai.id)) { return }
	visited.add(ai.id)

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
