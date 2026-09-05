import { locale } from '@/locale'
import { EmojiGroups } from './emoji-list'
import { Emojis } from './emojis'

// Recherche du panneau emoji (issue #4269). Les noms et mots-clés viennent des
// annotations CLDR d'Unicode, générées par scripts/generate-emoji-keywords.mjs
// dans emoji-keywords/<langue>.json — un tableau aligné sur l'ordre du
// catalogue, chaque entrée valant "nom|mot-clé|mot-clé…".
//
// Le fichier de la langue du joueur (~100 Ko, ~30 Ko sur le fil) est chargé en
// import dynamique, donc seulement à la première recherche : ouvrir le panneau
// pour cliquer un smiley ne télécharge rien.

// Les emojis unicode, dans l'ordre exact des fichiers de mots-clés. Surtout pas
// `Emojis.categories`, qui met les smileys maison en tête de la première
// catégorie et décalerait tout l'alignement.
const CATALOGUE = EmojiGroups.flatMap(group => group.emojis)

const keywordFiles = import.meta.glob<string[]>('./emoji-keywords/*.json', { import: 'default' })

// Minuscules et sans accent des deux côtés de la comparaison : « coeur » ne
// trouverait pas « cœur », mais « ecran » trouve « écran ».
function normalize(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Les smileys maison n'ont pas d'annotation CLDR : on les indexe sur leur
// raccourci et sur le nom de leur image, "(lama)" → « lama », "&lt;3" → « heart ».
const CUSTOM: { emoji: string, terms: string[] }[] = Object.entries(Emojis.custom).map(([shortcode, image]) => ({
	emoji: shortcode,
	terms: [normalize(image.replace(/_/g, ' ')), normalize(shortcode.replace(/[^\p{L}\p{N}]+/gu, ' ').trim())].filter(t => t),
}))

let terms: string[][] | null = null
let loading: Promise<void> | null = null

// Charge les mots-clés de la langue courante, l'anglais à défaut. Idempotent :
// les appels suivants réutilisent la même promesse.
function loadEmojiKeywords(): Promise<void> {
	if (!loading) {
		const file = keywordFiles[`./emoji-keywords/${locale}.json`] ?? keywordFiles['./emoji-keywords/en.json']
		loading = file().then(entries => {
			terms = entries.map(entry => normalize(entry).split('|'))
		})
	}
	return loading
}

// Plus le score est bas, meilleure est la correspondance. Le nom (premier terme)
// passe devant ses mots-clés : « chat » doit sortir 🐱 avant 💬.
const NO_MATCH = 9
function score(emojiTerms: string[], query: string): number {
	let best = NO_MATCH
	for (let i = 0; i < emojiTerms.length; i++) {
		const term = emojiTerms[i]
		if (!term) { continue }
		const name = i === 0
		if (term === query) { return name ? 0 : 2 }
		if (term.startsWith(query)) { best = Math.min(best, name ? 1 : 3) }
		// Un mot au milieu du terme : « rieur » pour « visage rieur ».
		else if (term.includes(' ' + query)) { best = Math.min(best, name ? 4 : 5) }
		else if (term.includes(query)) { best = Math.min(best, name ? 6 : 7) }
	}
	return best
}

// Les emojis correspondant à la requête, du plus pertinent au moins pertinent.
// Renvoie une liste vide tant que `loadEmojiKeywords` n'a pas abouti (les
// smileys maison, eux, répondent tout de suite).
function searchEmojis(query: string, limit = 120): string[] {
	const normalized = normalize(query).trim()
	if (!normalized) { return [] }
	const found: { emoji: string, score: number }[] = []
	for (const custom of CUSTOM) {
		const s = score(custom.terms, normalized)
		if (s < NO_MATCH) { found.push({ emoji: custom.emoji, score: s }) }
	}
	if (terms) {
		for (let i = 0; i < CATALOGUE.length; i++) {
			const s = score(terms[i], normalized)
			if (s < NO_MATCH) { found.push({ emoji: CATALOGUE[i], score: s }) }
		}
	}
	// Tri stable : à score égal, l'ordre du catalogue (celui d'Unicode) tranche.
	return found.sort((a, b) => a.score - b.score).slice(0, limit).map(f => f.emoji)
}

export { loadEmojiKeywords, searchEmojis }
