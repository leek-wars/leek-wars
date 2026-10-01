import { Commands } from './commands'
import { formatEmojis } from './emojis'
import { LeekWars } from './leekwars'
import { CODE_MARK, IMAGE_MARK, LATEX_MARK, LINK_MARK, stripSentinels } from './chat-sentinels'
import { isBannedImageUrl, isUserImageUrl, userImageScanner, userImageTag } from './user-image'
import { i18n } from './i18n'

function format(content: string, authorName: string, images: 'render' | 'label', farmerByName?: {[name: string]: unknown}): string {
	let result = LeekWars.protect(content)
	// Masque les URLs d'images uploadées AVANT linkify, qui en ferait sinon des <a>.
	// Elles sont restaurées tout à la fin, en <img> ou en pictogramme selon le
	// contexte d'affichage.
	const imageUrls: string[] = []
	result = result.replace(userImageScanner(), (url) => {
		imageUrls.push(url)
		return IMAGE_MARK + (imageUrls.length - 1) + IMAGE_MARK
	})
	// Masque les segments LaTeX $...$ AVANT linkify : sinon le scanner d'URL de
	// linkify avale le `$` de fermeture (ex: `$https://.../report/123$`) et casse
	// le délimiteur, rendant le LaTeX invalide (#11553). On restaure le segment
	// brut ensuite, pour que la directive v-chat-code-latex le rende via KaTeX.
	const latexSpans: string[] = []
	result = result.replace(LATEX_SPAN_RE, (span) => {
		latexSpans.push(span)
		return LATEX_MARK + (latexSpans.length - 1) + LATEX_MARK
	})
	// Les liens posés par linkify restent masqués jusqu'à la toute fin : les étapes
	// suivantes réécrivent le texte par regex et ne doivent pas toucher à leurs
	// attributs (un @pseudo ou un smiley écrit dans une URL).
	const links: string[] = []
	result = LeekWars.linkify(result, (link) => {
		links.push(link)
		return LINK_MARK + (links.length - 1) + LINK_MARK
	})
	result = formatEmojis(result)
	result = Commands.execute(result, authorName)
	result = result.replace(LATEX_MARK_RE, (_, i) => latexSpans[+i])
	result = result.replace(IMAGE_MARK_RE, (_, i) => renderChatImage(imageUrls[+i], images))
	if (farmerByName) {
		result = result.replace(MENTION_RE, (a, run: string) => {
			const name = mentionedName(run, (n) => !!farmerByName[n])
			return name ? "<span class='pseudo'>" + name + '</span>' + run.slice(name.length) : a
		})
	}
	return result.replace(LINK_MARK_RE, (_, i) => links[+i])
}

const IMAGE_MARK_RE = new RegExp(IMAGE_MARK + '(\\d+)' + IMAGE_MARK, 'g')
const LINK_MARK_RE = new RegExp(LINK_MARK + '(\\d+)' + LINK_MARK, 'g')

/**
 * Rend une image uploadée telle que le CHAT l'affiche. La classe `chat-image` est
 * propre à cette surface : ses contraintes de taille (colonne étroite, hauteur bornée)
 * n'ont rien à voir avec celles qu'aura le forum. La règle de validité de l'URL, elle,
 * est commune et vit dans model/user-image.ts.
 *
 * En mode `label`, un simple pictogramme : les aperçus (liste de conversations,
 * toasts) sont des lignes uniques, une image y casserait la mise en page.
 *
 * Le marqueur de bannissement devient la mention « Image bannie », et pas le vide :
 * un message amputé sans explication se lit comme un bug, et le lecteur qui avait vu
 * l'image se demanderait ce qu'il a raté. Le texte est traduit et échappé, aucune
 * partie du marqueur n'atteint le HTML.
 */
function renderChatImage(url: string, mode: 'render' | 'label'): string {
	if (isBannedImageUrl(url)) {
		const label = LeekWars.protect(i18n.t('main.image_banned') as string)
		return mode === 'label' ? label : '<span class="chat-image-banned">' + label + '</span>'
	}
	if (!isUserImageUrl(url)) { return url }
	return mode === 'label' ? '🖼️' : userImageTag(url, 'chat-image')
}

// Escape only &, < and > (not quotes): the v-chat-code-latex directive reverses
// exactly these via LeekWars.decodehtmlentities, so quotes stay verbatim in code.
function escapeCode(content: string): string {
	return content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Private-use sentinel used to mask code spans during text formatting. It is left
// untouched by emoji/mention/link/command formatting and never reaches the DOM.
const CODE_MARK_RE = new RegExp(CODE_MARK + '(\\d+)' + CODE_MARK, 'g')
const CODE_SPAN_RE = /```[\s\S]*?```|`[^`]*?`/g

// Sentinelle distincte (0xE001) pour masquer les segments LaTeX $...$ pendant le
// formatage du texte (linkify/emojis/commandes), afin que leur contenu reste opaque.
// Code masqué EN PREMIER (callers), donc un `$` dans du code ne peut pas être capté ici,
// et un segment $...$ n'enjambe jamais un bloc de code masqué : le `$` d'un
// snippet PHP ne s'apparie pas avec un `$` du texte autour.
const LATEX_MARK_RE = new RegExp(LATEX_MARK + '(\\d+)' + LATEX_MARK, 'g')
const LATEX_SPAN_RE = new RegExp('\\$([^$\\n' + CODE_MARK + ']+)\\$', 'g')

// Un caractère de pseudo : lettre de toute écriture, signe combinant, chiffre (et `_`, que
// portent d'anciens pseudos). Avec \w, « @Benoît » s'arrêtait à « Beno ». Les regex qui
// l'emploient prennent le drapeau `u`.
export const PSEUDO_CHAR = '[\\p{L}\\p{M}\\p{Nd}_]'
const MENTION_RE = new RegExp('@(' + PSEUDO_CHAR + '+)', 'gu')
// En chinois, en japonais ou en thaï, rien ne sépare les mots, et en coréen les particules
// se collent au nom (« @Pilow你好 », « @김철수님 ») : le pseudo peut s'arrêter juste avant une
// lettre de ces écritures, jamais avant un signe combinant ni une marque d'allongement (ー).
// Ailleurs, rien ne coupe : « @Pilowtest » ne mentionne pas Pilow.
const MENTION_CUT = /^(?![\p{M}\u{30FC}\u{FF70}\u{FF9E}\u{FF9F}])[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}\p{sc=Hangul}\p{sc=Thai}\p{sc=Lao}\p{sc=Khmer}\p{sc=Myanmar}]/u
const MAX_PSEUDO = 30

// Le pseudo connu que désigne une suite de lettres écrite après @ : la suite entière,
// sinon son plus long préfixe coupé avant une lettre de MENTION_CUT.
function mentionedName(run: string, known: (name: string) => boolean): string | null {
	const chars = [...run]
	if (chars.length <= MAX_PSEUDO && known(run)) { return run }
	for (let i = Math.min(chars.length - 1, MAX_PSEUDO); i > 0; i--) {
		if (MENTION_CUT.test(chars[i])) {
			const name = chars.slice(0, i).join('')
			if (known(name)) { return name }
		}
	}
	return null
}

// Contenu d'un span de code sans ses délimiteurs ``` ou `.
function codeSpanInner(span: string): string {
	return span.startsWith('```') ? span.slice(3, -3) : span.slice(1, -1)
}

// Replace every code span (```...``` and `...`) with a sentinel placeholder and
// push the raw span into `codeSpans`. Keeps code content opaque to text formatting
// (emojis, @mentions, links, commands) so it is shown verbatim. #3945 / #2712
function maskCodeSpans(content: string, codeSpans: string[]): string {
	return content.replace(CODE_SPAN_RE, (span) => {
		codeSpans.push(span)
		return CODE_MARK + (codeSpans.length - 1) + CODE_MARK
	})
}

export function formatChatMessage(
	content: string,
	authorName: string,
	farmerByName: {[name: string]: unknown}
): string {
	if (!content) { return '' }
	// Les sentinelles de masquage sont réservées au formatage : on retire celles du
	// contenu AVANT de poser les nôtres.
	content = stripSentinels(content)
	// Protect code spans (```...``` and `...`) before text formatting so their
	// content is shown verbatim: without this, emojis, @mentions, links and
	// commands inside code got transformed (e.g. @p -> pseudo, :) -> emoji). #3945
	const codeSpans: string[] = []
	const masked = maskCodeSpans(content, codeSpans)
	let result = format(masked, authorName, 'render', farmerByName)
	result = result.replace(/\n/g, '<br>')
	// Restore code spans with escaped content, keeping the ``` / ` delimiters so
	// the v-chat-code-latex directive still renders them as code.
	result = result.replace(CODE_MARK_RE, (_, i) => {
		const span = codeSpans[+i]
		const inner = escapeCode(codeSpanInner(span))
		return span.startsWith('```') ? '```' + inner.replace(/\n/g, '<br>') + '```' : '`' + inner + '`'
	})
	return result
}

// Balisage HTML d'un message déjà formaté (directive v-chat-code-latex) : les blocs
// ```...``` et `...` deviennent des <code>, les segments $...$ des <latex>. Même
// scanner et même ordre que formatChatMessage (code masqué d'abord), pour qu'un `$`
// dans un snippet PHP ou shell ne fasse jamais apparaître de <latex> dans le code.
export function markupChatCodeLatex(html: string): string {
	const codeSpans: string[] = []
	let result = maskCodeSpans(html, codeSpans)
	result = result.replace(LATEX_SPAN_RE, (span, content: string) => {
		// Pas de LaTeX autour d'une balise (URL linkifiée).
		return /<\w/.test(content) ? span : '<latex>' + span + '</latex>'
	})
	return result.replace(CODE_MARK_RE, (_, i) => '<code>' + codeSpanInner(codeSpans[+i]) + '</code>')
}

export function formatChatPreview(content: string, authorName: string): string {
	if (!content) { return '' }
	content = stripSentinels(content)
	// Comme formatChatMessage, on masque les spans de code avant formatage pour que
	// leur contenu ne soit pas transformé (ex: ":)" -> emoji dans du code). #2712
	// L'aperçu est une ligne unique sans directive de code : on restitue le code en
	// texte échappé, délimiteurs ` conservés, sauts de ligne aplatis en espaces.
	const codeSpans: string[] = []
	const masked = maskCodeSpans(content, codeSpans)
	let result = format(masked, authorName, 'label').replace(/\n/g, ' ')
	result = result.replace(CODE_MARK_RE, (_, i) => {
		const span = codeSpans[+i]
		const delim = span.startsWith('```') ? '```' : '`'
		return delim + escapeCode(codeSpanInner(span)).replace(/\n/g, ' ') + delim
	})
	return result
}
