// Génère `src/model/emoji-list.ts` : les catégories du panneau emoji, à partir de
// la liste officielle Unicode (`emoji-test.txt`).
//
// Usage : `node scripts/generate-emojis.mjs [chemin/vers/emoji-test.txt]`
// Sans argument, le fichier est téléchargé depuis unicode.org (version épinglée
// ci-dessous). Pour monter d'une version d'Unicode, changer EMOJI_VERSION,
// relancer, et committer le fichier produit.
//
// Règles de sélection (le panneau doit rester utilisable : Unicode 16 compte
// ~3800 séquences, on en garde ~1900) :
//  - uniquement les séquences `fully-qualified` (celles qui portent leurs
//    U+FE0F) : une entrée non qualifiée s'affiche en noir et blanc « texte »
//    sur une partie des plateformes ;
//  - pas de teintes de peau (5 variantes par emoji de personne) ;
//  - pas de variante genrée quand la forme neutre existe (🙅 sans 🙅‍♂️/🙅‍♀️,
//    🧑‍⚕️ sans 👨‍⚕️/👩‍⚕️) : les familles et couples, qui n'ont pas de forme
//    neutre équivalente, sont conservés ;
//  - MAIS on ne retire jamais un emoji déjà proposé : la liste précédente
//    (`emoji-list.ts`, ou `emojis.ts` avant la première génération) est réunie
//    au résultat. Un joueur qui a mis 🕵️‍♂️ en favori le retrouve dans sa
//    catégorie.
//
// L'ordre est celui d'Unicode (celui de tous les autres claviers emoji), et les
// catégories sont ses 9 groupes. Les smileys maison de Leek Wars (:D, (lama),
// (hab)…) sont ajoutés en tête du premier groupe par `emojis.ts` lui-même.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const EMOJI_VERSION = '16.0'
const SOURCE = `https://unicode.org/Public/emoji/${EMOJI_VERSION}/emoji-test.txt`

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = join(root, 'src/model/emoji-list.ts')
// Listes à réunir au résultat pour ne jamais retirer un emoji déjà proposé.
const PREVIOUS = [OUTPUT, join(root, 'src/model/emojis.ts')]

// Icône d'onglet par groupe Unicode, dans l'ordre d'affichage du panneau.
const GROUPS = [
	['Smileys & Emotion', '😃'],
	['People & Body', '🧑'],
	['Animals & Nature', '🐳'],
	['Food & Drink', '🍎'],
	['Travel & Places', '🚗'],
	['Activities', '⚽'],
	['Objects', '📱'],
	['Symbols', '🔢'],
	['Flags', '🇫🇷'],
]

const ZWJ = '‍'
const VS16 = '️'
const SKIN_TONES = /[\u{1F3FB}-\u{1F3FF}]/u
const MALE = ZWJ + '♂' + VS16
const FEMALE = ZWJ + '♀' + VS16
const MAN = '\u{1F468}'
const WOMAN = '\u{1F469}'
const PERSON = '\u{1F9D1}'

async function readSource(path) {
	if (path) { return readFileSync(path, 'utf8') }
	const response = await fetch(SOURCE)
	if (!response.ok) { throw new Error(`${SOURCE} : HTTP ${response.status}`) }
	return response.text()
}

// emoji-test.txt : « 1F600 ; fully-qualified # 😀 E1.0 grinning face », précédé de
// lignes « # group: … » / « # subgroup: … ».
function parse(text) {
	const entries = []
	let group = null
	for (const line of text.split('\n')) {
		if (line.startsWith('# group:')) { group = line.slice(8).trim() ; continue }
		if (line.startsWith('#') || !line.includes(';')) { continue }
		const [codes, rest] = line.split(';')
		if (rest.split('#')[0].trim() !== 'fully-qualified') { continue }
		const emoji = codes.trim().split(/\s+/).map(c => String.fromCodePoint(parseInt(c, 16))).join('')
		entries.push({ emoji, group })
	}
	return entries
}

// Emojis déjà proposés par la liste précédente, sous leur forme qualifiée.
// On ratisse large (toute chaîne littérale non-ASCII du fichier), ce qui attrape
// aussi les icônes de catégorie — sans conséquence, elles sont dans la liste.
function previousEmojis(qualified) {
	const previous = new Set()
	for (const path of PREVIOUS) {
		if (!existsSync(path)) { continue }
		for (const [, literal] of readFileSync(path, 'utf8').matchAll(/"([^"\\\n]*)"/g)) {
			if ([...literal].every(c => c.charCodeAt(0) < 128)) { continue } // shortcodes maison, code TS
			// Les anciennes entrées étaient souvent écrites sans U+FE0F (❤ pour ❤️).
			const key = qualified.get(literal) ?? qualified.get(literal + VS16)
			if (key) { previous.add(key) }
		}
		break // la liste la plus récente suffit, elle contient déjà les précédentes
	}
	return previous
}

function keep(emoji, all) {
	if (SKIN_TONES.test(emoji)) { return false }
	// Variante genrée d'une forme neutre existante : 🙅‍♂️ face à 🙅.
	for (const gender of [MALE, FEMALE]) {
		if (emoji.includes(gender) && all.has(emoji.replace(gender, ''))) { return false }
	}
	// Variante « homme »/« femme » d'une séquence dont la forme « personne »
	// existe : 👨‍⚕️ face à 🧑‍⚕️. Réservé aux séquences ZWJ, sinon 👨 lui-même
	// disparaîtrait au profit de 🧑. Les familles (👨‍👩‍👦) n'ont pas
	// d'équivalent neutre et sont donc conservées.
	const first = [...emoji][0]
	if (emoji.includes(ZWJ) && (first === MAN || first === WOMAN) && all.has(PERSON + emoji.slice(first.length))) {
		return false
	}
	return true
}

const entries = parse(await readSource(process.argv[2]))
const all = new Set(entries.map(e => e.emoji))
const qualified = new Map(entries.map(e => [e.emoji, e.emoji]))
const previous = previousEmojis(qualified)

const categories = GROUPS.map(([group, icon]) => ({
	icon,
	emojis: entries.filter(e => e.group === group && (keep(e.emoji, all) || previous.has(e.emoji))).map(e => e.emoji),
}))

const kept = categories.reduce((n, c) => n + c.emojis.length, 0)
const lost = [...previous].filter(e => !categories.some(c => c.emojis.includes(e)))

const content = `// Fichier généré par \`node scripts/generate-emojis.mjs\` — ne pas éditer à la main.
// Source : Unicode Emoji ${EMOJI_VERSION} (emoji-test.txt), séquences fully-qualified,
// dans l'ordre d'Unicode et groupées par ses catégories. Les smileys maison de
// Leek Wars sont ajoutés en tête du premier groupe par \`emojis.ts\`.
//
// ${kept} emojis. Voir l'en-tête du script pour les règles de sélection.

const EmojiGroups: { icon: string, emojis: string[] }[] = [
${categories.map(c => `\t{ icon: "${c.icon}", emojis: [${c.emojis.map(e => `"${e}"`).join(', ')}] },`).join('\n')}
]

export { EmojiGroups }
`
writeFileSync(OUTPUT, content)

console.log(`${entries.length} séquences Unicode ${EMOJI_VERSION} → ${kept} emojis retenus`)
for (const [i, [group]] of GROUPS.entries()) { console.log(`  ${group.padEnd(18)} ${categories[i].emojis.length}`) }
if (lost.length) { console.log(`⚠️ ${lost.length} emojis de la liste précédente absents du résultat : ${lost.join(' ')}`) }
