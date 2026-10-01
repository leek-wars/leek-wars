/**
 * Recherche texte de l'éditeur (Ctrl+Shift+F) : la partie pure, sans accès au
 * système de fichiers. Même sémantique que le Ctrl+F de Monaco : ligne par ligne,
 * sensible à la casse / mot entier / expression régulière en options.
 */

export interface SearchOptions {
	query: string
	caseSensitive: boolean
	wholeWord: boolean
	regex: boolean
}

export interface SearchMatch {
	// Ligne 1-based, colonne 0-based : la convention de `jump` dans l'éditeur.
	line: number
	column: number
	length: number
	// Extrait affiché : `before` + la correspondance + `after`, coupés autour d'elle.
	before: string
	match: string
	after: string
}

// Contexte gardé avant la correspondance dans l'extrait : court, pour que le mot trouvé
// reste visible dans un panneau de 200 px.
const PREVIEW_BEFORE = 16
const PREVIEW_AFTER = 120

function escapeRegExp(text: string) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Construit l'expression à chercher. Renvoie null pour une recherche vide, et lève
 * une SyntaxError pour une expression régulière invalide (affichée dans le panneau).
 */
export function buildSearchRegExp(options: SearchOptions): RegExp | null {
	if (options.query === '') { return null }
	let source = options.regex ? options.query : escapeRegExp(options.query)
	if (options.wholeWord) {
		source = '\\b(?:' + source + ')\\b'
	}
	return new RegExp(source, options.caseSensitive ? 'g' : 'gi')
}

/**
 * Cherche dans un texte. `limit` borne le nombre de correspondances renvoyées : une
 * recherche d'une seule lettre sur 2000 fichiers ne doit pas geler l'onglet.
 */
export function searchText(code: string, re: RegExp, limit: number): SearchMatch[] {
	const matches: SearchMatch[] = []
	if (limit <= 0) { return matches }
	const lines = code.split(/\r\n|\r|\n/)
	for (let l = 0; l < lines.length; l++) {
		const text = lines[l]
		re.lastIndex = 0
		let m: RegExpExecArray | null
		while ((m = re.exec(text)) !== null) {
			// Une correspondance vide (`^`, `a*`) ne s'affiche pas, et sans avancer à la
			// main la boucle ne terminerait jamais.
			if (m[0].length === 0) {
				re.lastIndex++
				if (re.lastIndex > text.length) { break }
				continue
			}
			const column = m.index
			const end = column + m[0].length
			const start = Math.max(0, column - PREVIEW_BEFORE)
			let before = text.substring(start, column)
			if (start === 0) {
				before = before.trimStart()
			} else {
				before = '…' + before
			}
			matches.push({
				line: l + 1,
				column,
				length: m[0].length,
				before,
				match: m[0],
				after: text.substring(end, end + PREVIEW_AFTER),
			})
			if (matches.length >= limit) { return matches }
		}
	}
	return matches
}
