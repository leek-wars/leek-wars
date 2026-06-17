import { Commands } from './commands'
import { formatEmojis } from './emojis'
import { LeekWars } from './leekwars'

function format(content: string, authorName: string): string {
	let result = LeekWars.protect(content)
	result = LeekWars.linkify(result)
	result = formatEmojis(result)
	result = Commands.execute(result, authorName)
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
	const masked = content.replace(/```[\s\S]*?```|`[^`]*?`/g, (span) => {
		codeSpans.push(span)
		return CODE_MARK + (codeSpans.length - 1) + CODE_MARK
	})
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
	return format(content, authorName).replace(/\n/g, ' ')
}
