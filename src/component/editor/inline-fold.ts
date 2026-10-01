// Repli « en ligne » des longs tableaux et dictionnaires écrits sur une seule ligne : repérage des
// paires repliables et recalage des retours à la ligne. Logique pure, sans Monaco : le branchement
// dans l'éditeur est dans monaco-inline-fold.ts.

/** Paire [ ] ou { } repliable, en index (base 0) dans le texte de la ligne. */
export interface InlineFoldRegion {
	open: number
	close: number
	/** Éléments de premier niveau, séparés par des virgules (1 pour un bloc sans virgule). */
	count: number
}

/** Longueur minimale de l'intérieur d'une paire pour qu'elle soit repliable. */
export const INLINE_FOLD_MIN_LENGTH = 60

const PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' }

/**
 * Condition nécessaire, sans analyse : un [ ou { suivi assez loin d'un ] ou }. Écarte d'emblée les
 * longues lignes qui n'ont que des parenthèses ou du texte.
 */
export function mayHaveInlineFold(text: string): boolean {
	const open = text.search(/[[{]/)
	if (open < 0) return false
	return Math.max(text.lastIndexOf(']'), text.lastIndexOf('}')) - open - 1 >= INLINE_FOLD_MIN_LENGTH
}

/**
 * Caractères de code de la ligne (1), par opposition aux chaînes et aux commentaires (0). La ligne
 * est lue seule : prise dans un commentaire ou une chaîne sur plusieurs lignes, elle passe pour du code.
 */
export function codeMask(text: string, language: string): Uint8Array {
	const python = language === 'python'
	const quotes = language === 'json' ? '"' : language === 'javascript' || language === 'typescript' ? '"\'`' : '"\''
	const code = new Uint8Array(text.length).fill(1)
	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		if (quotes.includes(c)) {
			let end = i + 1
			while (end < text.length && text[end] !== c) end += text[end] === '\\' ? 2 : 1
			code.fill(0, i, end + 1)
			i = end
		} else if (python ? c === '#' : c === '/' && text[i + 1] === '/') {
			code.fill(0, i)
			break
		} else if (!python && c === '/' && text[i + 1] === '*') {
			const end = text.indexOf('*/', i + 2)
			if (end < 0) {
				code.fill(0, i)
				break
			}
			code.fill(0, i, end + 2)
			i = end + 1
		}
	}
	return code
}

/**
 * Paires [ ] et { } de la ligne dont l'intérieur fait au moins INLINE_FOLD_MIN_LENGTH caractères,
 * les plus extérieures seulement : dans `f([...], {...})`, le tableau et le dictionnaire, jamais les
 * parenthèses. `code` vient de codeMask. Une ligne aux parenthèses incohérentes ne rend rien.
 */
export function findInlineFoldRegions(text: string, code: Uint8Array): InlineFoldRegion[] {
	const stack: number[] = []
	const found: { open: number, close: number }[] = []
	for (let i = 0; i < text.length; i++) {
		switch (text[i]) {
			case '(': case '[': case '{':
				if (code[i]) stack.push(i)
				break
			case ')': case ']': case '}': {
				if (!code[i]) break
				const open = stack.pop()
				// Referme une paire ouverte sur une ligne précédente
				if (open === undefined) break
				if (text[open] !== PAIRS[text[i]]) return []
				if (text[i] !== ')' && i - open - 1 >= INLINE_FOLD_MIN_LENGTH) {
					// Les paires qu'elle contient viennent de se refermer : elles sont en fin de liste.
					while (found.length && found[found.length - 1].open > open) found.pop()
					found.push({ open, close: i })
				}
			}
		}
	}
	return found.map(({ open, close }) => ({ open, close, count: countElements(text, open, close, code) }))
}

function countElements(text: string, open: number, close: number, code: Uint8Array): number {
	let depth = 0
	let commas = 0
	let last = ''
	for (let i = open + 1; i < close; i++) {
		const c = text[i]
		if (c === ' ' || c === '\t') continue
		if (!code[i]) {
			last = '"'
			continue
		}
		if (c === '(' || c === '[' || c === '{') depth++
		else if (c === ')' || c === ']' || c === '}') depth--
		else if (c === ',' && depth === 0) commas++
		last = c
	}
	if (!last) return 0
	// Virgule finale : `[1, 2, 3,]` compte 3 éléments
	return commas + (last === ',' ? 0 : 1)
}

/** Caractères [start, start + length[ d'une ligne (index base 0). */
export interface HiddenRange {
	start: number
	length: number
}

/** Texte injecté par Monaco dans la ligne : position (index base 0 dans la ligne) et longueur. */
export interface Injection {
	offset: number
	length: number
}

export interface FoldedLine {
	/** Texte de la ligne privé de ses plages masquées. */
	text: string
	/** Indices des injections conservées : celles qui tombent dans une plage masquée disparaissent. */
	kept: number[]
	/** Position de chaque injection conservée dans `text`. */
	offsets: number[]
	/** Où réinsérer chaque plage masquée dans le texte visible augmenté des injections. */
	insertions: HiddenRange[]
}

/**
 * Prépare une ligne repliée pour le calcul des retours à la ligne, qui compte chaque caractère :
 * on lui donne le texte sans les plages masquées, puisqu'elles ne prennent aucune place à l'écran.
 * Une injection placée au début d'une plage (le « ⋯ ») la précède ; à sa fin, elle la suit.
 */
export function foldLine(text: string, injections: readonly Injection[], hidden: readonly HiddenRange[]): FoldedLine {
	const ranges: HiddenRange[] = []
	for (const range of [...hidden].sort((a, b) => a.start - b.start)) {
		const previous = ranges[ranges.length - 1]
		const start = Math.max(range.start, previous ? previous.start + previous.length : 0)
		const end = Math.min(range.start + range.length, text.length)
		if (end > start) ranges.push({ start, length: end - start })
	}
	const visible = (offset: number) => {
		let result = offset
		for (const range of ranges) {
			if (range.start < offset) result -= Math.min(range.length, offset - range.start)
		}
		return result
	}
	let folded = ''
	let from = 0
	for (const range of ranges) {
		folded += text.slice(from, range.start)
		from = range.start + range.length
	}
	folded += text.slice(from)
	const kept: number[] = []
	const offsets: number[] = []
	injections.forEach((injection, index) => {
		if (ranges.some((range) => injection.offset > range.start && injection.offset < range.start + range.length)) return
		kept.push(index)
		offsets.push(visible(injection.offset))
	})
	const insertions = ranges.map((range) => {
		let start = visible(range.start)
		for (const index of kept) {
			if (injections[index].offset <= range.start) start += injections[index].length
		}
		return { start, length: range.length }
	})
	return { text: folded, kept, offsets, insertions }
}

/**
 * Reporte des coupures calculées sur le texte replié dans le texte complet. Une plage masquée qui
 * tombe pile sur une coupure finit la ligne d'écran : elle ne prend pas de place.
 */
export function unfoldBreakOffsets(breakOffsets: readonly number[], insertions: readonly HiddenRange[]): number[] {
	return breakOffsets.map((offset) => {
		let result = offset
		for (const insertion of insertions) {
			if (insertion.start <= offset) result += insertion.length
		}
		return result
	})
}
