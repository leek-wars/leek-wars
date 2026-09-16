// Moteur de coloration statique léger pour les aperçus de code (chat, encyclopédie, etc.).
//
// Réutilise le tokenizer Monarch de Monaco — donc EXACTEMENT la même grammaire que
// l'éditeur — mais SANS le language service TypeScript ni les workers (le gros du poids
// de l'éditeur). La tokenisation est synchrone et ne dépend d'aucun thème : on émet des
// classes sémantiques `t-<type>` colorées en CSS (monaco-highlight.scss), ce qui rend les
// aperçus réactifs au thème clair/sombre sans re-coloration, et n'altère jamais le thème
// de l'éditeur (contrairement à editor.colorize qui passe par un setTheme global).
// Active l'observateur qui pose le nonce CSP sur les <style> injectés par Monaco
// (le cœur éditeur en injecte au chargement). Sans ça, un aperçu affiché AVANT
// l'ouverture de l'éditeur (ex: chat) déclencherait une violation CSP style-src.
import './monaco-csp'
import 'monaco-editor/esm/vs/editor/edcore.main.js'
import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api.js'
// Grammaires Monarch importées en DIRECT (et non via les *.contribution.js paresseux) puis
// posées de façon synchrone : garantit que le tout premier tokenize() colore déjà, sans
// attendre le chargement asynchrone déclenché par onLanguage.
// @ts-expect-error pas de déclaration de types pour les grammaires Monarch basic-languages
import { conf as jsConf, language as jsLang } from 'monaco-editor/esm/vs/basic-languages/javascript/javascript.js'
// @ts-expect-error pas de déclaration de types pour les grammaires Monarch basic-languages
import { conf as tsConf, language as tsLang } from 'monaco-editor/esm/vs/basic-languages/typescript/typescript.js'
import { config as jsonConfig, tokens as jsonTokens } from './json-monarch'
import { registerLeekScriptLanguage, type LeekScriptData } from './monaco-leekscript-language'
import { registerPythonLanguage } from './monaco-python-language'

function ensure(id: string, extensions: string[], conf: languages.LanguageConfiguration, monarch: languages.IMonarchLanguage) {
	if (!languages.getLanguages().some(l => l.id === id)) {
		languages.register({ id, extensions })
	}
	languages.setLanguageConfiguration(id, conf)
	languages.setMonarchTokensProvider(id, monarch)
}

ensure('javascript', ['.js', '.mjs', '.cjs'], jsConf, jsLang)
ensure('typescript', ['.ts', '.mts', '.cts'], tsConf, tsLang)
// Python via le module partagé (grammaire étendue, noms de classes injectés au runtime par leekwars.ts).
registerPythonLanguage(languages)
ensure('json', ['.json'], jsonConfig, jsonTokens)
// LeekScript enregistré sans données ici (ce module n'importe AUCUN module applicatif, pour
// rester hors du graphe/cycle d'import du boot). Les listes de constantes/fonctions sont
// injectées au runtime par leekwars.ts via setLeekScriptData() avant la première coloration.
registerLeekScriptLanguage(languages)

// Fournit au tokenizer LeekScript les noms de constantes/fonctions (game data). Appelé par
// leekwars.ts (qui possède ces données) juste avant highlightToHtml : évite tout import
// statique de @/model/leekwars dans ce chunk. Idempotent.
export function setLeekScriptData(data: LeekScriptData): void {
	registerLeekScriptLanguage(languages, data)
}

// Fournit au tokenizer Python les noms de classes de l'API (Field, Debug, Color…) pour les colorer
// en `type`. Appelé par leekwars.ts (qui possède le modèle d'API) avant highlightToHtml. Idempotent.
export function setPythonClasses(classNames: string[]): void {
	registerPythonLanguage(languages, classNames)
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
// Type de token Monarch = `<base>.<sous-type>.<suffixe-langage>` (ex: `keyword.js`,
// `delimiter.parenthesis.js`). On ne garde que le segment de base pour la classe CSS.
function baseType(type: string): string {
	const dot = type.indexOf('.')
	return dot < 0 ? type : type.slice(0, dot)
}

// Tokenise `code` dans `languageId` (id Monaco : leekscript / javascript / typescript /
// python / json) et renvoie le HTML des tokens, sans <pre> ni numéros de ligne (le wrapper
// et la gouttière sont ajoutés par l'appelant). Les sauts de ligne restent des '\n'.
export function highlightToHtml(code: string, languageId: string): string {
	const lines = code.split('\n')
	const tokens = editor.tokenize(code, languageId)
	let html = ''
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const lineTokens = tokens[i] || []
		for (let j = 0; j < lineTokens.length; j++) {
			const start = lineTokens[j].offset
			const end = j + 1 < lineTokens.length ? lineTokens[j + 1].offset : line.length
			const text = line.slice(start, end)
			const base = baseType(lineTokens[j].type)
			html += base ? '<span class="t-' + base + '">' + escapeHtml(text) + '</span>' : escapeHtml(text)
		}
		if (i < lines.length - 1) { html += '\n' }
	}
	return html
}
