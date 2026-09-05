import { EmojiGroups } from "./emoji-list"
import { LeekWars } from "./leekwars"

// Smileys maison, rendus par une image de `public/image/emoji/`. Ils ouvrent la
// première catégorie du panneau, avant les emojis unicode.
const custom = {
	":O": "open_mouth",
	":D": "grinning",
	"&lt;3": "heart",
	":)": "smile",
	":/": "confused",
	";)": "wink",
	":(": "frowning",
	":P": "stuck_out_tongue",
	"(lama)": "lama",
	":B": "grimacing",
	"(lucky)": "clover",
	"(grim)": "grimace",
	"(peach)": "peach",
	"(hab)": "hab",
	"(crystal)": "crystal",
	"(woodchest)": "woodchest",
	"(ironchest)": "ironchest",
	"(diamondchest)": "diamondchest",
	"(life)": "life",
	"(strength)": "strength",
	"(wisdom)": "wisdom",
	"(agility)": "agility",
	"(resistance)": "resistance",
	"(science)": "science",
	"(magic)": "magic",
	"(frequency)": "frequency",
	"(cores)": "cores",
	"(ram)": "ram",
	"(mp)": "mp",
	"(tp)": "tp",
} as { [key: string]: string }

const Emojis = {
	custom,
	// Catégories du panneau : les 9 groupes d'Unicode, fichier généré par
	// `node scripts/generate-emojis.mjs`. Les smileys maison ouvrent le premier.
	categories: EmojiGroups.map((group, g) => g === 0
		? { icon: group.icon, emojis: [...Object.keys(custom), ...group.emojis] }
		: group),
}

function escapeRegExp(str: string) {
	return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")
}

// Un maillon de séquence emoji : un drapeau (deux indicateurs régionaux), un
// keycap (1️⃣), ou un pictogramme suivi de sa variante (U+FE0F ou une teinte de
// peau) et de ses balises (les drapeaux régionaux, 🏴󠁧󠁢󠁥󠁮󠁧󠁿).
const EMOJI_PART = '(?:\\p{RI}\\p{RI}|[0-9#*]\\uFE0F?\\u20E3|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?[\\u{E0020}-\\u{E007F}]*)'
// La séquence entière, maillons ZWJ compris (👨‍👩‍👧, 🏳️‍🌈, 🐦‍🔥), pour l'envelopper
// d'un SEUL <span>. L'ancienne version prenait les caractères un par un : chaque
// maillon partait dans son propre span, ce qui cassait la ligature (👨‍👩‍👧
// s'affichait en trois personnes) et laissait le U+FE0F hors du span, donc ❤️
// retombait en rendu texte. Elle enveloppait aussi tout U+2000 à U+3300, c'est-
// à-dire les tirets cadratins, les guillemets et les points de suspension d'un
// message ordinaire, qui se retrouvaient peints avec la police d'emojis.
const EMOJI_REGEX = new RegExp(EMOJI_PART + '(?:\\u200D' + EMOJI_PART + ')*', 'gu')

function formatEmojis(rawData: unknown): string {
	if (!rawData || typeof(rawData) !== 'string') { return String(rawData ?? '') }
	let data: string = rawData
	// Custom smileys
	for (const i in Emojis.custom) {
		const smiley = Emojis.custom[i]
		// console.log("(^|\\s|>|\\))" + escapeRegExp(i))
		data = data.replace(new RegExp(escapeRegExp(i), "gi"), (a: string, pos: number) => {
			const previous = data.charAt(pos - 1)
			if (pos === 0 || previous === ')' || previous === '>' || previous === ' ' || previous === '\xa0') {
				return '<img class="emoji" image="' + smiley + '" alt="' + i + '" title="' + i + '" src="/image/emoji/' + smiley + '.png">'
			}
			return a
		})
	}
	if (LeekWars.nativeEmojis) {
		return data // nothing more to do
	} else {
		// Parse emojis
		return data.replace(EMOJI_REGEX, "<span class='emoji emoji-font'>$&</span>")
	}
}

// Variante sûre pour les liaisons v-html : échappe le texte (protect) puis
// applique les emojis, exactement comme la directive v-emojis le faisait sur un
// noeud texte. À utiliser quand le contenu est du texte brut tracké par Vue
// (interpolation, v-text) : binder le résultat en v-html évite que la directive
// remplace un noeud que Vue suit encore (desync vnode.el -> crash parentNode, #4163).
function formatEmojisText(rawData: unknown): string {
	if (rawData === null || rawData === undefined) { return '' }
	return formatEmojis(LeekWars.protect(String(rawData)))
}

// Balises dont le contenu texte ne doit JAMAIS être transformé en emoji :
// - CODE / PRE : blocs de code (un ":)" ou "://" y est du code, pas un smiley) ;
//   en plus, le rendu markdown lit leur textContent brut ensuite (coloration).
// - LATEX : expressions maths déjà rendues.
// - A : liens ; une URL contient "://" (la règle de frontière de formatEmojis le
//   protège déjà, mais on saute les <a> par double prudence).
const EMOJI_SKIP_TAGS = new Set(['CODE', 'PRE', 'LATEX', 'A'])

// Applique les smileys/emojis sur tous les nœuds texte d'un sous-arbre DOM DÉJÀ
// rendu (ex : sortie markdown du forum), en réutilisant formatEmojis (même moteur
// que le chat) pour rester cohérent. On n'opère que sur les nœuds texte hors
// EMOJI_SKIP_TAGS. Un nœud sans emoji est laissé strictement intact (aucun <span>
// parasite créé), donc l'appel est sûr à répéter et ne modifie pas le texte
// contenant des caractères spéciaux (<, >, &) mais aucun smiley.
function applyEmojis(root: HTMLElement): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode(node) {
			let p = node.parentElement
			while (p && p !== root) {
				if (EMOJI_SKIP_TAGS.has(p.tagName)) { return NodeFilter.FILTER_REJECT }
				p = p.parentElement
			}
			return NodeFilter.FILTER_ACCEPT
		},
	})
	// On matérialise la liste AVANT de muter le DOM : remplacer un nœud pendant
	// que le walker le parcourt invaliderait l'itération.
	const targets: Text[] = []
	let n: Node | null
	while ((n = walker.nextNode())) { targets.push(n as Text) }

	for (const textNode of targets) {
		const escaped = LeekWars.protect(textNode.nodeValue ?? '')
		const formatted = formatEmojis(escaped)
		if (formatted === escaped) { continue } // aucun emoji : nœud intact
		const template = document.createElement('template')
		template.innerHTML = formatted
		textNode.parentNode?.replaceChild(template.content, textNode)
	}
}

export { Emojis, formatEmojis, formatEmojisText, applyEmojis }
