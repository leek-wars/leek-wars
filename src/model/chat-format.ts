import { Commands } from './commands'
import { formatEmojis } from './emojis'
import { LeekWars } from './leekwars'

function format(content: string, authorName: string): string {
	let result = LeekWars.protect(content)
	// Masque les segments LaTeX $...$ AVANT linkify : sinon le scanner d'URL de
	// linkify avale le `$` de fermeture (ex: `$https://.../report/123$`) et casse
	// le délimiteur, rendant le LaTeX invalide (#11553). On restaure le segment
	// brut ensuite, pour que la directive v-chat-code-latex le rende via KaTeX.
	const latexSpans: string[] = []
	result = result.replace(LATEX_SPAN_RE, (span) => {
		latexSpans.push(span)
		return LATEX_MARK + (latexSpans.length - 1) + LATEX_MARK
	})
	result = LeekWars.linkify(result)
	result = formatEmojis(result)
	result = Commands.execute(result, authorName)
	result = result.replace(LATEX_MARK_RE, (_, i) => latexSpans[+i])
	return result
}

// Escape only &, < and > (not quotes): the v-chat-code-latex directive reverses
// exactly these via LeekWars.decodehtmlentities, so quotes stay verbatim in code.
function escapeCode(content: string): string {
	return content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Private-use sentinel used to mask code spans during text formatting. It is left
// untouched by emoji/mention/link/command formatting and never reaches the DOM.
const CODE_MARK = String.fromCharCode(0xE000)
const CODE_MARK_RE = new RegExp(CODE_MARK + '(\\d+)' + CODE_MARK, 'g')
const CODE_SPAN_RE = /```[\s\S]*?```|`[^`]*?`/g

// Sentinelle distincte (0xE001) pour masquer les segments LaTeX $...$ pendant le
// formatage du texte (linkify/emojis/commandes), afin que leur contenu reste opaque.
// Code masqué EN PREMIER (callers), donc un `$` dans du code ne peut pas être capté ici.
const LATEX_MARK = String.fromCharCode(0xE001)
const LATEX_MARK_RE = new RegExp(LATEX_MARK + '(\\d+)' + LATEX_MARK, 'g')
const LATEX_SPAN_RE = /\$[^$\n]+\$/g

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
	// Protect code spans (```...``` and `...`) before text formatting so their
	// content is shown verbatim: without this, emojis, @mentions, links and
	// commands inside code got transformed (e.g. @p -> pseudo, :) -> emoji). #3945
	const codeSpans: string[] = []
	const masked = maskCodeSpans(content, codeSpans)
	let result = format(masked, authorName)
	result = result.replace(/@(\w+)/g, (a, b) => {
		return farmerByName[b] ? "<span class='pseudo'>" + b + "</span>" : a
	})
	result = result.replace(/\n/g, '<br>')
	// Restore code spans with escaped content, keeping the ``` / ` delimiters so
	// the v-chat-code-latex directive still renders them as code.
	result = result.replace(CODE_MARK_RE, (_, i) => {
		const span = codeSpans[+i]
		if (span.startsWith('```')) {
			return '```' + escapeCode(span.slice(3, -3)).replace(/\n/g, '<br>') + '```'
		}
		return '`' + escapeCode(span.slice(1, -1)) + '`'
	})
	return result
}

export function formatChatPreview(content: string, authorName: string): string {
	if (!content) { return '' }
	// Comme formatChatMessage, on masque les spans de code avant formatage pour que
	// leur contenu ne soit pas transformé (ex: ":)" -> emoji dans du code). #2712
	// L'aperçu est une ligne unique sans directive de code : on restitue le code en
	// texte échappé, délimiteurs ` conservés, sauts de ligne aplatis en espaces.
	const codeSpans: string[] = []
	const masked = maskCodeSpans(content, codeSpans)
	let result = format(masked, authorName).replace(/\n/g, ' ')
	result = result.replace(CODE_MARK_RE, (_, i) => {
		const span = codeSpans[+i]
		const delim = span.startsWith('```') ? '```' : '`'
		const inner = span.startsWith('```') ? span.slice(3, -3) : span.slice(1, -1)
		return delim + escapeCode(inner).replace(/\n/g, ' ') + delim
	})
	return result
}
