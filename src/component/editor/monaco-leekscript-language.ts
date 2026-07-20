// Enregistrement du langage LeekScript (config + grammaire Monarch) pour Monaco,
// partagé entre l'éditeur complet (monaco.ts) et le moteur de coloration léger des
// aperçus de code (monaco-highlight.ts). Idempotent : sûr à appeler plusieurs fois
// même si l'éditeur et les aperçus cohabitent sur la même page.
//
// Les listes de constantes/fonctions ne sont PAS importées ici (ni dans leekscript-monarch) :
// elles sont injectées par l'appelant (`data`). Ainsi le chunk d'aperçu n'importe aucun module
// applicatif et évite le cycle d'import qui plantait la coloration (cf. leekscript-monarch.js).

// @ts-expect-error no types for leekscript-monarch.js
import { buildLeekScriptMonarch } from './leekscript-monarch.js'
import type * as Monaco from 'monaco-editor'

export interface LeekScriptData {
	constants?: string[]
	functions?: string[]
	deprecatedFunctions?: string[]
}

let languageRegistered = false
let dataApplied = false

function hasData(data?: LeekScriptData): boolean {
	return !!data && ((data.constants?.length ?? 0) > 0 || (data.functions?.length ?? 0) > 0)
}

// `data` est optionnel : l'aperçu enregistre d'abord le langage sans données (grammaire aux
// listes vides), puis les fournit au runtime dès qu'elles sont chargées. On (re)pose le
// provider de tokens une seule fois avec des données réelles (les game data ne changent pas
// en cours de session) pour éviter de reconstruire la grammaire à chaque rendu d'aperçu.
export function registerLeekScriptLanguage(languages: typeof Monaco.languages, data?: LeekScriptData) {
	if (!languageRegistered) {
		languageRegistered = true
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
		languages.setMonarchTokensProvider('leekscript', buildLeekScriptMonarch(data))
		dataApplied = hasData(data)
	} else if (!dataApplied && hasData(data)) {
		languages.setMonarchTokensProvider('leekscript', buildLeekScriptMonarch(data))
		dataApplied = true
	}
}
