import { ref } from 'vue'

/**
 * Langage sélectionné dans la documentation et l'encyclopédie.
 *
 * Un seul état pour toute l'appli : la page de doc, les blocs de code de l'encyclopédie et
 * les fiches de survol de l'éditeur affichent tous le même langage, et en changer à un
 * endroit le change partout. Le choix est persisté en local.
 *
 * Un lien portant `?lang=python` ouvre la page dans ce langage — utile pour pointer
 * quelqu'un vers un exemple précis sur le forum. En revanche changer de langage NE réécrit
 * PAS l'URL : les pages d'encyclopédie sont pré-rendues pour les crawlers, et on ne veut ni
 * polluer l'historique de navigation ni multiplier les URLs canoniques d'une même page.
 *
 * À ne pas confondre avec le langage d'une IA (`getLanguageForPath`) : ici on choisit
 * comment LIRE la doc, pas dans quoi on écrit.
 */

export const DOC_LANGUAGES = ['leekscript', 'javascript', 'typescript', 'python'] as const
export type DocLanguage = typeof DOC_LANGUAGES[number]

const STORAGE_KEY = 'doc/language'
const DEFAULT: DocLanguage = 'leekscript'

/**
 * Alias acceptés dans les fences markdown (```js, ```py...) et dans `?lang=`. Les pages
 * existantes utilisent déjà `js`/`python`, on ne va pas réécrire 4 000 pages pour ça.
 */
const ALIASES: { [alias: string]: DocLanguage } = {
	leekscript: 'leekscript', leek: 'leekscript', ls: 'leekscript',
	javascript: 'javascript', js: 'javascript', mjs: 'javascript',
	typescript: 'typescript', ts: 'typescript', mts: 'typescript',
	python: 'python', py: 'python',
}

/**
 * Langages PROPOSÉS dans le sélecteur. JavaScript en est absent volontairement : il partage
 * l'API objet, les types et le runtime de TypeScript (le TS est transpilé au build), donc
 * l'offrir en quatrième choix ferait doubler une entrée sans rien apporter au lecteur. Un
 * bloc ```js reste évidemment reconnu et affiché — cf. `matchesDocLanguage`.
 */
export const SELECTABLE_DOC_LANGUAGES = ['leekscript', 'typescript', 'python'] as const

/**
 * Ramène un langage au choix équivalent proposé dans le sélecteur : `javascript` -> `typescript`.
 * Appliqué aux ENTRÉES (préférence stockée, `?lang=js`, langage d'IA du joueur), pour qu'un
 * joueur qui code en JavaScript arrive sur TypeScript plutôt que sur un choix inexistant.
 */
export function toSelectableDocLanguage(language: DocLanguage): DocLanguage {
	return language === 'javascript' ? 'typescript' : language
}

/** Normalise un identifiant de langage, ou null s'il ne désigne pas un langage d'IA. */
export function normalizeDocLanguage(language: string | undefined | null): DocLanguage | null {
	if (!language) return null
	return ALIASES[language.toLowerCase()] ?? null
}

export const docLanguage = ref<DocLanguage>(DEFAULT)

let initialized = false

/**
 * Initialise depuis l'URL, puis le stockage local, puis le langage d'IA du joueur.
 *
 * `farmerLanguage` est passé par l'appelant plutôt que lu depuis le store : importer le
 * store ici tirerait `leekwars.ts` et ses effets de bord au simple chargement du module.
 */
export function initDocLanguage(farmerLanguage?: string | null) {
	if (initialized) return
	initialized = true
	// L'URL gagne : un lien partagé doit s'ouvrir dans le langage de celui qui l'a envoyé,
	// pas dans la préférence de celui qui le reçoit.
	const fromUrl = normalizeDocLanguage(new URLSearchParams(window.location.search).get('lang'))
	if (fromUrl) { docLanguage.value = toSelectableDocLanguage(fromUrl); return }
	const stored = normalizeDocLanguage(localStorage.getItem(STORAGE_KEY))
	if (stored) { docLanguage.value = toSelectableDocLanguage(stored); return }
	// Sinon le langage dans lequel le joueur écrit ses IA : c'est presque toujours celui
	// dans lequel il veut lire la doc.
	const fromFarmer = normalizeDocLanguage(farmerLanguage)
	docLanguage.value = fromFarmer ? toSelectableDocLanguage(fromFarmer) : DEFAULT
}

export function setDocLanguage(language: DocLanguage) {
	const selectable = toSelectableDocLanguage(language)
	if (docLanguage.value === selectable) return
	docLanguage.value = selectable
	localStorage.setItem(STORAGE_KEY, selectable)
}

/**
 * TypeScript et JavaScript partagent la même API objet et, à l'exécution, le même runtime
 * (le TS est transpilé au build). Un bloc d'exemple marqué `js` vaut donc pour les deux, et
 * réciproquement — sans quoi il faudrait dupliquer chaque exemple polyglot en trois.
 */
export function matchesDocLanguage(blockLanguage: string | undefined | null, selected: DocLanguage): boolean {
	const normalized = normalizeDocLanguage(blockLanguage)
	if (!normalized) return false
	if (normalized === selected) return true
	return (normalized === 'javascript' && selected === 'typescript')
		|| (normalized === 'typescript' && selected === 'javascript')
}

/** Un exemple d'un groupe multi-langage : le langage de la fence et son code. */
export interface CodeBlock { language: DocLanguage, code: string }

/**
 * Repère les suites de fences CONSÉCUTIVES déclinant le même exemple en plusieurs langages
 * (```leekscript puis ```js puis ```python), pour les présenter en onglets.
 *
 * Aucune syntaxe nouvelle : les contributeurs écrivent des blocs de code normaux, et les
 * pages existantes — un seul bloc — ne forment aucun groupe et restent rendues à l'identique.
 * Un groupe s'arrête au premier frère qui n'est pas un `<pre>`, qui n'est pas taggé d'un
 * langage d'IA, ou dont le langage est DÉJÀ dans le groupe : deux exemples LeekScript qui se
 * suivent sont deux exemples distincts, pas deux onglets du même.
 */
export function findCodeBlockGroups(root: Element): { elements: Element[], blocks: CodeBlock[] }[] {
	const languageOf = (pre: Element): DocLanguage | null => {
		const code = pre.querySelector('code')
		if (!code) return null
		const langClass = Array.from(code.classList).find(c => c.startsWith('language-'))
		return normalizeDocLanguage(langClass ? langClass.slice('language-'.length) : null)
	}
	const groups: { elements: Element[], blocks: CodeBlock[] }[] = []
	const grouped = new Set<Element>()
	for (const pre of Array.from(root.querySelectorAll('pre'))) {
		if (grouped.has(pre) || !languageOf(pre)) continue
		const elements: Element[] = [pre]
		const languages = new Set<DocLanguage>([languageOf(pre)!])
		for (;;) {
			const next = elements[elements.length - 1].nextElementSibling
			if (!next || next.tagName !== 'PRE') break
			const language = languageOf(next)
			if (!language || languages.has(language)) break
			languages.add(language)
			elements.push(next)
		}
		if (elements.length < 2) continue
		elements.forEach(e => grouped.add(e))
		groups.push({
			elements,
			blocks: elements.map(e => ({ language: languageOf(e)!, code: ('' + e.textContent).trim() })),
		})
	}
	return groups
}

/** Les 3 langages polyglot partagent l'API OBJET ; LeekScript (v4) a l'API plate. */
export function usesObjectApi(language: DocLanguage): boolean {
	return language !== 'leekscript'
}
