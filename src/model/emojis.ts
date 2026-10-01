import { LINK_MARK } from "./chat-sentinels"
import { EmojiGroups, RecentEmojis } from "./emoji-list"
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

// Taille du canevas de sondage : assez pour qu'un glyphe emoji ait de la matière
// colorée, assez petit pour que `getImageData` reste à ~17 µs par emoji.
const PROBE_SIZE = 24

// Les emojis que la police emoji du SYSTÈME ne sait pas dessiner, et qu'il faut
// donc peindre avec la nôtre même quand `LeekWars.nativeEmojis` est vrai.
//
// Pourquoi c'est nécessaire : `detectNativeEmojis` sonde 😗, qui date de 2015.
// Un Windows dont le Segoe UI Emoji est figé à Emoji 15 répond donc « j'ai des
// emojis natifs », n'hérite jamais de `.emoji-font`… et affiche un tofu pour tout
// ce qui est plus récent. C'est le cas de chaque montée du catalogue (🫟 en
// Emoji 16, 🫪 et 🫫 en 17/18).
//
// Pourquoi seulement ceux-là : mettre « Noto Color Emoji » dans `--font-body`
// réglerait le tofu, mais la fonte gagnerait alors sur la police du système pour
// TOUS les emojis — exit les emojis Apple sur Mac et iOS — et téléchargerait ses
// 2 Mo chez des joueurs qui n'en avaient aucun besoin. Une `unicode-range` dit ce
// qu'une fonte COUVRE, pas ce qui manque ailleurs.
//
// Le test : un glyphe emoji couleur est peint en couleur, là où un tofu est peint
// dans la couleur de remplissage, donc en gris. On ne compare pas à un tofu de
// référence : Chrome dessine en dernier recours une boîte contenant les chiffres
// hexadécimaux du codepoint, différente pour chaque caractère.
//
// Les versions d'Unicode étant cumulatives, on part de la plus récente et on
// s'arrête au premier groupe entièrement dessiné — sur une plateforme à jour,
// cela fait 9 sondages, soit ~0,2 ms, une seule fois.
let unsupported: Set<string> | null = null

function paintsInColor(ctx: CanvasRenderingContext2D, emoji: string): boolean {
	ctx.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE)
	ctx.fillText(emoji, 0, 0)
	const pixels = ctx.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data
	for (let i = 0; i < pixels.length; i += 4) {
		if (pixels[i + 3] > 0 && (pixels[i] !== pixels[i + 1] || pixels[i + 1] !== pixels[i + 2])) { return true }
	}
	return false
}

function unsupportedEmojis(): Set<string> {
	return unsupported ??= probeUnsupported()
}

function probeUnsupported(): Set<string> {
	const missing = new Set<string>()
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = PROBE_SIZE
	// jsdom (tests) et les contextes sans canevas renvoient null : on retombe sur
	// un ensemble vide, donc sur le comportement d'avant, sans rien casser.
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) { return missing }
	ctx.textBaseline = 'top'
	ctx.font = (PROBE_SIZE - 6) + 'px sans-serif'
	ctx.fillStyle = '#000'
	for (const { emojis } of RecentEmojis) {
		const absent = emojis.filter(emoji => !paintsInColor(ctx, emoji))
		if (!absent.length) { break }
		for (const emoji of absent) { missing.add(emoji) }
	}
	// Si TOUS les groupes échouent, la plateforme n'a pas de police emoji du tout —
	// mais elle rate alors aussi 😗 (2015), donc `nativeEmojis` est déjà faux et
	// `formatEmojis` n'arrive jamais ici. Pas de cas terminal à écrire.
	return missing
}

// Le seul point d'entrée de la règle « cet emoji doit-il être peint avec la police
// livrée ? » : soit la plateforme n'a aucun emoji natif, soit elle rate celui-ci.
// `formatEmojis` et le panneau passent tous les deux par ici — l'écrire deux fois
// serait le meilleur moyen de les voir diverger.
function needsEmojiFont(emoji: string): boolean {
	return !LeekWars.nativeEmojis || unsupportedEmojis().has(emoji)
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

/**
 * `caseSensitive` : seuls les codes écrits exactement comme dans le panneau d'emojis
 * deviennent des smileys. Là où le texte est rédigé plutôt que tapé à la volée
 * (encyclopédie), « (TP) » est une abréviation et non le smiley (tp).
 */
function formatEmojis(rawData: unknown, caseSensitive = false): string {
	if (!rawData || typeof(rawData) !== 'string') { return String(rawData ?? '') }
	let data: string = rawData
	// Custom smileys
	for (const i in Emojis.custom) {
		const smiley = Emojis.custom[i]
		data = data.replace(new RegExp(escapeRegExp(i), caseSensitive ? "g" : "gi"), (a: string, pos: number) => {
			const previous = data.charAt(pos - 1)
			// Un lien masqué par le chat se termine par LINK_MARK : il vaut le </a> qu'il remplace.
			if (pos === 0 || previous === ')' || previous === '>' || previous === LINK_MARK || previous === ' ' || previous === '\xa0') {
				return '<img class="emoji" image="' + smiley + '" alt="' + i + '" title="' + i + '" src="/image/emoji/' + smiley + '.png">'
			}
			return a
		})
	}
	if (LeekWars.nativeEmojis) {
		// Emojis natifs : on ne touche à rien, SAUF à ceux que la police du système
		// ne sait pas dessiner (cf. `unsupportedEmojis`). Sur une plateforme à jour
		// l'ensemble est vide et la chaîne ressort telle quelle.
		const missing = unsupportedEmojis()
		if (!missing.size) { return data }
		// `in-context` : ici l'emoji est habillé SEUL, au milieu d'emojis natifs. La
		// normalisation à 16px de `.emoji-font` le ferait rétrécir par rapport à ses
		// voisins (flagrant dans un contexte à 28px), d'où la taille héritée.
		return data.replace(EMOJI_REGEX, match => missing.has(match) ? "<span class='emoji emoji-font in-context'>" + match + "</span>" : match)
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
function applyEmojis(root: HTMLElement, caseSensitive = false): void {
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
		const formatted = formatEmojis(escaped, caseSensitive)
		if (formatted === escaped) { continue } // aucun emoji : nœud intact
		const template = document.createElement('template')
		template.innerHTML = formatted
		textNode.parentNode?.replaceChild(template.content, textNode)
	}
}

export { Emojis, formatEmojis, formatEmojisText, applyEmojis, needsEmojiFont }
