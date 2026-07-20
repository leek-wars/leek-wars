// Enregistrement du langage Python pour Monaco, partagé entre l'éditeur (monaco-stripped.ts +
// monaco.ts) et le moteur de coloration léger des aperçus (monaco-highlight.ts).
//
// On N'utilise PAS `python.contribution.js` (loader paresseux) : il (re)pose sa grammaire standard
// sur `onLanguage('python')`, ce qui écraserait notre grammaire étendue de façon non déterministe.
// On enregistre donc Python explicitement (comme JSON/LeekScript) avec une grammaire Monarch DÉRIVÉE
// de celle de Monaco, augmentée d'une liste de noms de CLASSES de l'API (Field, Debug, Color, Fight…)
// colorées en `type` — la grammaire Python standard laisse tout identifiant en couleur par défaut
// (contrairement à LeekScript où `[A-Z]…` -> type). Les noms de classes sont injectés au runtime
// (buildObjectApiModel) : ce module reste sans import applicatif pour ne pas recréer de cycle.

// @ts-expect-error pas de déclaration de types pour les grammaires Monarch basic-languages
import { conf as pythonConf, language as pythonLang } from 'monaco-editor/esm/vs/basic-languages/python/python.js'
import type * as Monaco from 'monaco-editor'

// Dérive la grammaire Python standard en ajoutant un cas `@typeIdentifiers` -> `type.identifier`
// sur LA règle d'identifiant (`[/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default':
// 'identifier' }}]`). On repère cette règle par sa forme (pas par un numéro de ligne) pour rester
// robuste aux montées de version de Monaco.
export function buildPythonMonarch(classNames: string[]): Monaco.languages.IMonarchLanguage {
	const tokenizer: Record<string, unknown[]> = {}
	for (const [state, rules] of Object.entries(pythonLang.tokenizer as Record<string, unknown[]>)) {
		tokenizer[state] = rules.map((rule) => {
			const r = rule as [unknown, { cases?: Record<string, string> }]
			if (Array.isArray(rule) && r[1] && r[1].cases && r[1].cases['@keywords'] && r[1].cases['@default'] === 'identifier') {
				return [r[0], { cases: { '@keywords': 'keyword', '@typeIdentifiers': 'type.identifier', '@default': 'identifier' } }]
			}
			return rule
		})
	}
	return { ...(pythonLang as object), typeIdentifiers: classNames, tokenizer } as Monaco.languages.IMonarchLanguage
}

let languageRegistered = false
let classesApplied = false

// `classNames` optionnel : l'appelant "socle" (monaco-stripped / monaco-highlight) enregistre Python
// sans données (grammaire standard) ; monaco.ts (éditeur) et leekwars.ts (aperçus) injectent ensuite
// la liste des classes. On ne (re)pose la grammaire étendue qu'une fois avec une liste non vide (les
// classes de l'API ne changent pas en session) pour éviter de la reconstruire à chaque rendu.
export function registerPythonLanguage(languages: typeof Monaco.languages, classNames?: string[]) {
	if (!languageRegistered) {
		languageRegistered = true
		languages.register({ id: 'python', extensions: ['.py', '.rpy', '.pyw', '.cpy', '.gyp', '.gypi'], aliases: ['Python', 'py'] })
		languages.setLanguageConfiguration('python', pythonConf)
		languages.setMonarchTokensProvider('python', buildPythonMonarch(classNames ?? []))
		classesApplied = (classNames?.length ?? 0) > 0
	} else if (!classesApplied && (classNames?.length ?? 0) > 0) {
		languages.setMonarchTokensProvider('python', buildPythonMonarch(classNames as string[]))
		classesApplied = true
	}
}
