import * as monaco from 'monaco-editor'

// @ts-expect-error no types for leekscript-monarch.js
import leekscript from './leekscript-monarch.js'

import { i18n } from '@/model/i18n';
import { fileSystem } from '@/model/filesystem';
import { analyzer } from './analyzer';
import { emitter } from '@/model/vue';
import { markRaw, watch } from 'vue';
import { AI } from '@/model/ai.js';
import { LeekWars } from '@/model/leekwars';
import { getKeywords } from './keywords';
import { Keyword, KeywordKind } from '@/model/keyword';
import { getLanguageForPath } from './file-types';
import { buildLeekwarsDeclarations, buildConstantPathMap, buildMemberToLs, buildObjectApiModel, buildConstantMembersByPath, type ApiMember } from './leekwars-dts'
import { buildLeekwarsPyi } from './leekwars-pyi'
import { pySetStub } from './pyright';
// monaco-stripped importe la contribution TS pour ses effets de bord (enregistrement du langage), mais
// n'assemble PAS le namespace `monaco.languages.typescript` (fait uniquement par `editor.main` complet,
// non importé ici) -> `monaco.languages.typescript` est TOUJOURS undefined dans ce build. On récupère
// donc les défauts TS/JS via les exports nommés DIRECTS de la contribution (même module singleton),
// sinon le d.ts de l'API n'est jamais posé et les IA .ts/.js perdent le typecheck + l'autocomplétion API.
import * as typescriptContribution from 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';

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
	},
	{
		// Palette de commandes façon VSCode (#4317). F1 reste le raccourci natif Monaco.
		keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
		command: "editor.action.quickCommand",
		when: "textInputFocus",
	}
]);

monaco.editor.registerCommand('jump', (_accessor, args) => {
	emitter.emit('jump', { ai: fileSystem.aiByFullPath[args.ai], line: args.line, column: args.column })
})

monaco.editor.registerCommand('findReferencesAtPosition', (_accessor, uri: monaco.Uri, position: monaco.IPosition) => {
	const editor = monaco.editor.getEditors().find(e => e.getModel()?.uri.toString() === uri.toString())
	if (editor) {
		editor.setPosition(position)
		editor.trigger('codelens', 'editor.action.referenceSearch.trigger', null)
	}
})

const METHOD_REGEX = /^[ \t]+(?:(?:(?:public\s+)?(?:static\s+)?(?:[\w<>,?[\]]+\s+)+(\w+))|(constructor))\s*\(/
const NON_METHOD_KEYWORDS = new Set(['function', 'for', 'while', 'if', 'class', 'var', 'return', 'new', 'else', 'switch', 'catch'])
const RESERVED_SYMBOLS = new Set(['true', 'false', 'null', 'this', 'super'])

// Extrait le nom d'une méthode déclarée sur une ligne indentée, ou null si la
// ligne n'est pas une déclaration. METHOD_REGEX est permissif : son préfixe de
// type de retour avale n'importe quel mot, donc une instruction comme
// `return maFonction()` serait lue comme une méthode `maFonction` de type
// `return` et recevrait un CodeLens « no references » parasite (#4257). On
// rejette à la fois le nom capturé et le premier mot de la ligne s'ils sont des
// mots-clés d'instruction.
function methodNameFromLine(lineContent: string): string | null {
	const m = METHOD_REGEX.exec(lineContent)
	if (!m) return null
	const name = m[1] || m[2]
	if (NON_METHOD_KEYWORDS.has(name)) return null
	const firstWord = lineContent.trim().match(/^\w+/)
	if (firstWord && NON_METHOD_KEYWORDS.has(firstWord[0])) return null
	return name
}


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
		{ token: "annotation", foreground: 'aa5500', fontStyle: 'bold' },
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
		{ token: "annotation", foreground: 'ffaa44', fontStyle: 'bold' },
	],
	colors: {
		"editor.foreground": "#f8f8f2",
		"editor.background": "#272822",
		"editor.hoverHighlightBackground": "#00aeff33"
	},
})

monaco.editor.registerEditorOpener({
	openCodeEditor: async (_source, resource, selectionOrPosition) => {
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

const ANNOTATION_NAMES = new Set(['unused', 'deprecated', 'pure', 'nodiscard', 'override', 'tailrec', 'todo'])

monaco.languages.registerHoverProvider("leekscript", {
	provideHover: async (model, position, _token, _context) => {
		// Annotations hover — resolved locally, no server round-trip
		const lineText = model.getLineContent(position.lineNumber)
		const word = model.getWordAtPosition(position)
		if (word && lineText[word.startColumn - 2] === '@' && ANNOTATION_NAMES.has(word.word)) {
			const name = word.word
			const doc = i18n.t('leekscript.annotation_' + name) as string
			return {
				range: new monaco.Range(position.lineNumber, word.startColumn - 1, position.lineNumber, word.endColumn),
				contents: [
					{ value: '**@' + name + '**' },
					{ value: doc },
				],
			}
		}

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
					details += "[" + i18n.t('leekscript.defined_in', [ '`' + defAi.path + '`', line ], { escapeParameter: false }) + "](command:jump?" + args + ' "' + defAi.path + ':' + line + ':' + column + '")'
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

// --- Survol des IA polyglot Python ---
// Les .py utilisent le langage Monaco `python` (pas de language service TS, donc aucun hover natif).
// On résout le symbole sous le curseur (fonction plate, constante objet Weapon.pistol, membre me./
// Fight....) vers son nom plat d'API : le hover renvoie ce nom, et le hook de carte de ai-view-monaco
// enrichit alors avec la vraie fiche (DocumentationConstant / DocumentationFunction), comme en JS/TS.
let _pyConstPaths: Map<string, string> | null = null
let _pyMemberToLs: Record<string, string> | null = null
function resolvePolyglotSymbol(path: string): string | undefined {
	_pyConstPaths ||= buildConstantPathMap(LeekWars.constants ?? [])
	_pyMemberToLs ||= buildMemberToLs()
	// `me` est l'instance de Me : on normalise vers le nom de classe pour la table des membres.
	const p = path.startsWith('me.') ? 'Me.' + path.slice(3) : path
	const constName = p.includes('.') ? _pyConstPaths.get(p) : p
	if (constName && (LeekWars.constants ?? []).some((c) => c.name === constName)) return constName
	const funName = _pyMemberToLs[p] ?? (p.includes('.') ? p.split('.').pop()! : p)
	if ((LeekWars.functions ?? []).some((f) => f.name === funName)) return funName
	return undefined
}

monaco.languages.registerHoverProvider('python', {
	provideHover: (model, position) => {
		const word = model.getWordAtPosition(position)
		if (!word) return null
		// Préfixe `Ident.` éventuel juste avant le mot (accès membre : Weapon.pistol, me.setWeapon...).
		const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1)
		const prefix = before.match(/([A-Za-z_$][\w$]*)\.\s*$/)
		const path = prefix ? `${prefix[1]}.${word.word}` : word.word
		const flat = resolvePolyglotSymbol(path)
		if (!flat) return null
		return {
			range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
			// 1re ligne = nom plat du symbole : le hook de carte (ai-view-monaco) le résout et monte la fiche.
			contents: [{ value: flat }],
		}
	},
})

// --- Autocomplétion des IA polyglot Python ---
// Monaco n'a pas de language service Python (juste la coloration) : on fournit un CompletionItemProvider
// alimenté par le modèle de l'API objet (buildObjectApiModel, même source que le leekwars.d.ts) + les
// constantes des game data. Sans inférence de types : après `Conteneur.` on liste ses membres/constantes,
// après `me.` les membres de Me/Entity, après une autre variable l'union des membres d'instance, et sans
// point les points d'entrée (conteneurs de l'API objet + fonctions plates). JS/TS ont, eux, le service TS.
let _pyConstMembers: { src: unknown, val: Record<string, { name: string, isNamespace: boolean, full?: string }[]> } | null = null
function pyConstMembers() {
	const src = LeekWars.constants ?? []
	if (!_pyConstMembers || _pyConstMembers.src !== src) _pyConstMembers = { src, val: buildConstantMembersByPath(src) }
	return _pyConstMembers.val
}
function pyItemDoc(path: string): monaco.IMarkdownString | undefined {
	const flat = resolvePolyglotSymbol(path)
	return flat ? { value: `📖 [Documentation](https://leekwars.com/help/documentation/${flat})`, isTrusted: true } : undefined
}

monaco.languages.registerCompletionItemProvider('python', {
	triggerCharacters: ['.'],
	provideCompletionItems: (model, position) => {
		const K = monaco.languages.CompletionItemKind
		const word = model.getWordUntilPosition(position)
		const range = {
			startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
			startColumn: word.startColumn, endColumn: word.endColumn,
		}
		const before = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1)
		const dot = before.match(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.\s*$/)
		const apiModel = buildObjectApiModel()
		const constByPath = pyConstMembers()
		const suggestions: monaco.languages.CompletionItem[] = []

		const pushApiMember = (m: ApiMember, ownerPath: string) => {
			suggestions.push({
				label: m.name,
				kind: m.kind === 'method' ? K.Method : K.Property,
				detail: m.detail, insertText: m.name, range,
				documentation: pyItemDoc(ownerPath === 'me' ? 'me.' + m.name : m.container + '.' + m.name),
			})
		}
		const pushConst = (c: { name: string, isNamespace: boolean, full?: string }, path: string) => {
			suggestions.push({
				label: c.name,
				kind: c.isNamespace ? K.Module : K.EnumMember,
				detail: c.isNamespace ? `${path}.${c.name}` : (c.full ?? c.name),
				insertText: c.name, range,
				documentation: c.full ? pyItemDoc(`${path}.${c.name}`) : undefined,
			})
		}

		if (dot) {
			const path = dot[1]
			if (apiModel.singletons.includes(path)) {
				for (const m of apiModel.members[path] ?? []) pushApiMember(m, path)
				for (const c of constByPath[path] ?? []) pushConst(c, path)
			} else if (apiModel.classes.includes(path)) {
				// Nom de CLASSE : membres statiques (Weapon.getAll...) + constantes (Weapon.pistol...).
				for (const m of apiModel.statics[path] ?? []) pushApiMember(m, path)
				for (const c of constByPath[path] ?? []) pushConst(c, path)
			} else if (constByPath[path]) {
				// Sous-conteneur de constantes (Entity.Stat, Fight.Type...).
				for (const c of constByPath[path]) pushConst(c, path)
			} else {
				// variable non typée : `me` -> membres de Me+Entity ; sinon union des membres d'instance.
				const union = path === 'me' ? apiModel.meMembers : apiModel.instanceUnion
				for (const m of union) pushApiMember(m, path)
			}
		} else {
			// Points d'entrée globaux : les conteneurs de l'API objet (Fight, Weapon, Entity, System...).
			// Plus AUCUNE fonction plate : l'API est 100% objet.
			const containers = new Set<string>([
				...apiModel.singletons, ...apiModel.classes,
				...Object.keys(constByPath).filter((k) => !k.includes('.')),
			])
			for (const name of containers) {
				suggestions.push({ label: name, kind: K.Class, detail: 'API de combat', insertText: name, range })
			}
		}
		return { suggestions }
	},
})

monaco.languages.registerDefinitionProvider("leekscript", {
	provideDefinition: async (model, position, _token) => {
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
	provideReferences: async (model, position, _context, _token) => {
		const ai = fileSystem.aiByFullPath[model.uri.path.substring(1)]
		if (!ai) { return [] }

		const word = model.getWordAtPosition(position)
		let locations: [string, number, number, number, number][]
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
		const uniqueAis = new Map<string, AI>()
		for (const loc of locations) {
			const targetAi = fileSystem.ais[loc[0]]
			if (targetAi && !uniqueAis.has(loc[0])) { uniqueAis.set(loc[0], targetAi) }
		}
		await Promise.all([...uniqueAis.values()].map((a) => fileSystem.load(a)))

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
	provideCodeLenses: (model, _token) => {
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
		for (const name in ai.globals) {
			const glob = ai.globals[name]
			if (glob.line) addLens(glob.line, name, false)
		}
		for (const name in ai.classes) {
			const cls = ai.classes[name]
			if (cls.line) addLens(cls.line, name, false)
		}
		// Scan methods directly from code (line-by-line to avoid multi-line regex issues in ai.ts)
		for (let i = 0; i < model.getLineCount(); i++) {
			const name = methodNameFromLine(model.getLineContent(i + 1))
			if (!name) continue
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
	resolveCodeLens: async (model, codeLens, _token) => {
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
				const methodName = methodNameFromLine(model.getLineContent(i))
				if (!methodName) continue
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
		// js-beautify doesn't recognize the -> arrow operator and will split it as: - >
		formatted = formatted.replace(/- >/g, '->')
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
		const suggestions = (completions ? completions.items.map((i) => ({
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

// Locale active (le namespace i18n `doc` en dépend). i18n.global.locale est un WritableComputedRef
// en mode composition -> on déballe .value ; lu dans un watch pour régénérer le .d.ts au switch de langue.
function polyglotLocale(): string {
	const loc = i18n.global.locale as unknown as { value?: string } | string
	return typeof loc === 'object' && loc !== null && 'value' in loc ? (loc.value as string) : (loc as string)
}

// Fiche texte d'une arme/puce, pour le survol de Weapon.bazooka / Chip.acceleration dans l'éditeur
// (les constantes WEAPON_*/CHIP_* n'ont pas de doc `const_*`). Reproduit l'essentiel de la fiche
// visuelle de la page de doc (item-preview) : nom localisé, portée, coût, récupération (puces) et
// effets, à partir des game data (LeekWars.weaponByName / LeekWars.chips) + i18n. Le rendu markdown
// est fait par le survol Monaco (le générateur nettoie le HTML des libellés d'effets).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildItemFiche(constName: string): string | undefined {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const t = (k: string, p?: any) => String(i18n.t(k, p))
	const te = i18n.global.te as (k: string) => boolean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let tpl: any
	let category: string
	if (constName.startsWith('WEAPON_')) {
		category = 'weapon'
		tpl = (LeekWars.weaponByName as Record<string, unknown>)?.[constName.slice(7).toLowerCase()]
	} else if (constName.startsWith('CHIP_')) {
		category = 'chip'
		const short = constName.slice(5).toLowerCase()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		tpl = Object.values((LeekWars.chips ?? {}) as Record<string, any>).find((c) => c.name === short)
	} else {
		return undefined
	}
	if (!tpl) return undefined

	const parts: string[] = []
	parts.push(tpl.min_range === tpl.max_range ? t('effect.range_fixed', [tpl.min_range]) : t('effect.range', [tpl.min_range, tpl.max_range]))
	if (te('characteristic.tp')) parts.push(`${tpl.cost} ${t('characteristic.tp')}`)
	if (category === 'chip' && tpl.cooldown) parts.push(t('effect.cooldown', { turns: tpl.cooldown }))
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	for (const e of ((tpl.effects ?? []) as any[])) {
		const key = 'effect.type_' + e.id + (e.value2 === 0 ? '_fixed' : '')
		if (te(key)) parts.push(t(key, e.value2 === 0 ? [e.value1] : [e.value1, e.value1 + e.value2]))
	}
	const name = te(category + '.' + tpl.name) ? t(category + '.' + tpl.name) : constName
	return `**${name}** — ${parts.join(' · ')}`
}

// DocLookup pour le .d.ts : résout `doc.<subkey>` si la clé existe. À défaut, pour une constante
// d'arme/puce, génère une fiche à la volée. Sinon undefined (pas de JSDoc).
function leekwarsDoc(subkey: string): string | undefined {
	const key = 'doc.' + subkey
	if ((i18n.global.te as (k: string) => boolean)(key)) return String(i18n.t(key))
	if (subkey.startsWith('const_WEAPON_') || subkey.startsWith('const_CHIP_')) return buildItemFiche(subkey.slice('const_'.length))
	return undefined
}

// --- Language service TypeScript pour les IA polyglot (.ts / .js) ---
// Configure le service TS de Monaco : builtins JS sans DOM + l'API de combat LeekScript exposée en
// .d.ts ambiant (généré depuis les game data), pour l'autocomplétion + le typecheck navigateur.
// Appelé au chargement de l'éditeur ; les game data (LeekWars.functions/constants) sont déjà chargées
// à ce stade (l'éditeur est un chunk lazy ouvert après le boot de l'app).
function configurePolyglotTypeScript() {
	// Défauts TS/JS de la contribution (cf import en tête) : le namespace `monaco.languages.typescript`
	// n'existe pas dans le build stripped, donc on passe par les exports directs de la contribution.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ts: any = typescriptContribution
	if (!ts || !ts.typescriptDefaults) return // garde-fou (ne devrait pas arriver)

	const compilerOptions = {
		target: ts.ScriptTarget.ESNext,
		lib: ['esnext'], // builtins JS modernes, PAS 'dom' (pas de window/document dans l'autocomplétion)
		allowNonTsExtensions: true,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.NodeJs,
		noEmit: true,
		allowJs: true,
		checkJs: true, // les IA .js profitent aussi du typecheck via l'API typée
	}
	ts.typescriptDefaults.setCompilerOptions(compilerOptions)
	ts.javascriptDefaults.setCompilerOptions(compilerOptions)

	// 2307 = "Cannot find module" : les IA multi-fichiers importent des voisins du joueur que l'éditeur
	// ne modélise pas (résolus seulement au build moteur) -> on ne pollue pas l'éditeur avec ça.
	ts.typescriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [2307] })
	ts.javascriptDefaults.setDiagnosticsOptions({ diagnosticCodesToIgnore: [2307] })

	// Le d.ts est bâti depuis les game data (LeekWars.functions/constants) + les descriptions localisées
	// (namespace i18n `doc`, passées via leekwarsDoc pour le JSDoc au survol). Si l'éditeur est ouvert en
	// accès direct (URL /editor, refetch) avant la fin de leur chargement, on régénère le d.ts dès leur
	// arrivée (sinon il resterait vide -> API en "Cannot find name").
	let tsLib: { dispose(): void } | null = null
	let jsLib: { dispose(): void } | null = null
	const refreshDeclarations = () => {
		const declarations = buildLeekwarsDeclarations(LeekWars.functions ?? [], LeekWars.constants ?? [], leekwarsDoc)
		tsLib?.dispose()
		jsLib?.dispose()
		tsLib = ts.typescriptDefaults.addExtraLib(declarations, 'file:///leekwars.d.ts')
		jsLib = ts.javascriptDefaults.addExtraLib(declarations, 'file:///leekwars.d.ts')
		// Même source pour le stub Python (.pyi) fourni à Pyright (validation des IA .py). La façade est
		// paresseuse : ceci ne fait que mémoriser le stub (le worker ne démarre qu'à l'ouverture d'un .py).
		pySetStub(buildLeekwarsPyi(LeekWars.constants ?? []))
	}
	refreshDeclarations()
	if (!LeekWars.functions || LeekWars.functions.length === 0) {
		const started = Date.now()
		const poll = setInterval(() => {
			if (LeekWars.functions && LeekWars.functions.length > 0) {
				clearInterval(poll)
				refreshDeclarations()
			} else if (Date.now() - started > 20000) {
				clearInterval(poll)
			}
		}, 150)
	}

	// La doc de l'API (namespace i18n `doc`) est chargée à la demande et dépend de la langue. On la
	// charge puis on régénère le d.ts pour peupler le JSDoc au survol, et on refait à chaque changement
	// de langue (avant ça, refreshDeclarations a déjà fourni les types, sans description).
	const loadDocsAndRefresh = async () => {
		const loc = polyglotLocale()
		try {
			const mod = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${loc}.lang`)
			i18n.global.mergeLocaleMessage(loc, { doc: (mod as { default: Record<string, unknown> }).default })
		} catch { /* pas de doc pour cette langue : d.ts sans JSDoc */ }
		refreshDeclarations()
	}
	loadDocsAndRefresh()
	watch(polyglotLocale, loadDocsAndRefresh)
}
configurePolyglotTypeScript()

// Pont diagnostics client -> panneau d'erreur LW : à chaque changement de markers d'un fichier polyglot,
// on reporte les diagnostics dans l'analyzer (panneau d'erreur + compteurs + croix "invalide"), comme le
// LeekScript. Source des markers selon le langage : service TypeScript de Monaco (.ts/.js), worker
// Pyright (.py). Les .py ne passent plus par le daemon (cf analyzer.analyze) -> pas de double-report.
const POLYGLOT_MARKER_OWNERS: Record<string, string[]> = {
	typescript: ['typescript', 'javascript'],
	javascript: ['typescript', 'javascript'],
	python: ['pyright'],
}
monaco.editor.onDidChangeMarkers((uris) => {
	for (const uri of uris) {
		const path = uri.path.replace(/^\//, '') // monaco.Uri.file('main.ts') -> '/main.ts'
		const ai = fileSystem.ais[path]
		if (!ai) continue
		const owners = POLYGLOT_MARKER_OWNERS[getLanguageForPath(ai.path)]
		if (!owners) continue
		const markers = monaco.editor.getModelMarkers({ resource: uri }).filter(m => owners.includes(m.owner))
		analyzer.updatePolyglotProblems(ai, markers)
	}
})
