// Recherche dans le changelog. Tout le texte des versions vit dans les fichiers
// `changelog.<lang>.yaml` chargés par la page : la recherche est donc entièrement
// locale, sans aller-retour serveur.

export interface ChangelogYamlVersion {
	title?: string
	[section: string]: unknown
}

// Une section de version (nouveautés, améliorations, corrections). `index` est
// celui du fichier : il sert de clé de traduction et ne doit pas bouger quand une
// section vide est écartée par la recherche.
export interface ChangelogSection {
	index: number
	changes: string[]
}

// La grammaire d'une ligne de changelog, lue au même endroit par le rendu et par
// la recherche : marqueur d'image, marqueur « touche à l'IA », code entre accents
// graves. Un marqueur de plus n'a ainsi qu'un seul point d'édition.
const IMAGE_REGEX = /#img_(\w+)/g
const AI_REGEX = /#ai/
const CODE_REGEX = /`([^`]+)`/g
const TAG_REGEX = /<[^>]*>/g
const DIACRITICS_REGEX = /[\u0300-\u036f]/g

// Le HTML d'une ligne, tel qu'il s'affiche. `aiTitle` est l'infobulle du marqueur.
export function changeHtml(raw: string, aiTitle: string): string {
	return raw
		.replace('# ', '')
		.replace(AI_REGEX, '<span class="ai" title="' + aiTitle + '">AI</span>')
		.replace(IMAGE_REGEX, '')
		.replace(CODE_REGEX, '<code>$1</code>')
}

// Les captures d'écran attachées à une ligne.
export function changeImages(raw: string): string[] {
	return Array.from(raw.matchAll(IMAGE_REGEX), (m: RegExpMatchArray) => m[1])
}

// Le texte nu d'une ligne : ni marqueurs, ni balises — ce que le lecteur voit.
function plainText(raw: string): string {
	return raw
		.replace(IMAGE_REGEX, '')
		.replace(AI_REGEX, '')
		.replace(TAG_REGEX, ' ')
		.replace(/`/g, '')
		.replace(/^#\s+/, '')
}

// Minuscules et sans accent des deux côtés de la comparaison : « ameliore »
// trouve « amélioré ».
function foldText(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '')
}

// Même repli, mais caractère par caractère, en gardant pour chacun l'index de son
// caractère d'origine : le surlignage retrouve ainsi le texte à encadrer. Plus
// coûteux, donc réservé aux lignes réellement affichées.
function fold(text: string): { folded: string, map: number[] } {
	let folded = ''
	const map: number[] = []
	for (let i = 0; i < text.length; i++) {
		const character = text[i].normalize('NFD').replace(DIACRITICS_REGEX, '').toLowerCase()
		for (let c = 0; c < character.length; c++) {
			folded += character[c]
			map.push(i)
		}
	}
	map.push(text.length) // Sentinelle : fin d'une occurrence qui va jusqu'au bout.
	return { folded, map }
}

// Une requête = plusieurs termes, tous exigés, dans n'importe quel ordre.
export function searchTerms(query: string): string[] {
	return foldText(query.trim()).split(/\s+/).filter(term => term.length > 0)
}

export function matches(text: string, terms: string[]): boolean {
	if (!terms.length) { return false }
	const folded = foldText(text)
	return terms.every(term => folded.includes(term))
}

// Le changelog replié une fois pour toutes : sans cet index, chaque lettre tapée
// re-normaliserait les ~3000 lignes du fichier. La clé est l'objet de la version
// lui-même, partagé par la page et par le composant qui l'affiche.
const INDEX = new WeakMap<object, { index: number, changes: { raw: string, folded: string }[] }[]>()

function indexVersion(version: ChangelogYamlVersion | string[] | null | undefined) {
	if (!version) { return [] }
	let indexed = INDEX.get(version)
	if (!indexed) {
		indexed = collectSections(version).map(section => ({
			index: section.index,
			changes: section.changes.map(raw => ({ raw, folded: foldText(plainText(raw)) }))
		}))
		INDEX.set(version, indexed)
	}
	return indexed
}

function collectSections(version: ChangelogYamlVersion | string[]): ChangelogSection[] {
	if (Array.isArray(version)) {
		return [{ index: 0, changes: version }]
	}
	const sections: ChangelogSection[] = []
	for (const key in version) {
		if (key === 'title') { continue }
		const changes = version[key]
		if (Array.isArray(changes)) {
			sections.push({ index: sections.length, changes: changes as string[] })
		}
	}
	return sections
}

// Toutes les sections d'une version.
export function versionSections(version: ChangelogYamlVersion | string[] | null | undefined): ChangelogSection[] {
	return indexVersion(version).map(section => ({ index: section.index, changes: section.changes.map(change => change.raw) }))
}

// Les sections réduites aux lignes qui contiennent tous les termes, ou `null` si
// aucune ne répond — la version n'est alors retenue que par son en-tête, et
// s'affiche entière. Une seule règle, que la page et le composant partagent.
export function searchVersion(version: ChangelogYamlVersion | string[] | null | undefined, terms: string[]): ChangelogSection[] | null {
	if (!terms.length) { return null }
	const found: ChangelogSection[] = []
	for (const section of indexVersion(version)) {
		const changes = section.changes.filter(change => terms.every(term => change.folded.includes(term)))
		if (changes.length) {
			found.push({ index: section.index, changes: changes.map(change => change.raw) })
		}
	}
	return found.length ? found : null
}

// Surligne les termes dans du texte déjà transformé en HTML. Les balises et les
// entités sont sautées : surligner à l'intérieur les casserait.
export function highlight(html: string, terms: string[]): string {
	if (!terms.length) { return html }
	return html
		.split(/(<[^>]*>|&[a-zA-Z0-9#]+;)/)
		.map((part, index) => index % 2 === 1 ? part : highlightText(part, terms))
		.join('')
}

function highlightText(text: string, terms: string[]): string {
	const { folded, map } = fold(text)
	const ranges: [number, number][] = []
	for (const term of terms) {
		let from = folded.indexOf(term)
		while (from !== -1) {
			ranges.push([map[from], map[from + term.length]])
			from = folded.indexOf(term, from + term.length)
		}
	}
	if (!ranges.length) { return text }
	ranges.sort((a, b) => a[0] - b[0])
	let result = ''
	let cursor = 0
	for (const [start, end] of ranges) {
		if (end <= cursor) { continue } // Occurrence déjà couverte par la précédente.
		const from = Math.max(start, cursor)
		result += text.substring(cursor, from) + '<mark>' + text.substring(from, end) + '</mark>'
		cursor = end
	}
	return result + text.substring(cursor)
}
