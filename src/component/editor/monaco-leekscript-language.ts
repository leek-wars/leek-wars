// Enregistrement du langage LeekScript (config + grammaire Monarch) pour Monaco,
// partagé entre l'éditeur complet (monaco.ts) et le moteur de coloration léger des
// aperçus de code (monaco-highlight.ts). Idempotent : sûr à appeler plusieurs fois
// même si l'éditeur et les aperçus cohabitent sur la même page.

// @ts-expect-error no types for leekscript-monarch.js
import leekscript from './leekscript-monarch.js'
import type * as Monaco from 'monaco-editor'

let registered = false

export function registerLeekScriptLanguage(languages: typeof Monaco.languages) {
	if (registered) { return }
	registered = true
	languages.register({ id: 'leekscript' })
	languages.setLanguageConfiguration('leekscript', {
		comments: {
			lineComment: '//',
			blockComment: ['/*', '*/'],
		},
		surroundingPairs: [
			{ open: "(", close: ")" },
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
		],
		autoClosingPairs: [
			{ open: "(", close: ")" },
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
		],
		brackets: [
			["(", ")"],
			["{", "}"],
			["[", "]"],
		],
		indentationRules: {
			decreaseIndentPattern: new RegExp("^\\s*[\\}\\]\\)].*$"),
			increaseIndentPattern: new RegExp("^.*(\\{[^}]*|\\([^)]*|\\[[^\\]]*)$"),
			unIndentedLinePattern: new RegExp("^(\\t|[ ])*[ ]\\*[^/]*\\*/\\s*$|^(\\t|[ ])*[ ]\\*/\\s*$|^(\\t|[ ])*[ ]\\*([ ]([^\\*]|\\*(?!/))*)?$"),
			indentNextLinePattern: new RegExp("^((.*=>\\s*)|((.*[^\\w]+|\\s*)(if|while|for)\\s*\\(.*\\)\\s*))$")
		},
	})
	languages.setMonarchTokensProvider('leekscript', leekscript)
}
