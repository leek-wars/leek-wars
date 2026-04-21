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

export function formatChatMessage(
	content: string,
	authorName: string,
	farmerByName: {[name: string]: unknown}
): string {
	if (!content) { return '' }
	let result = format(content, authorName)
	result = result.replace(/@(\w+)/g, (a, b) => {
		return farmerByName[b] ? "<span class='pseudo'>" + b + "</span>" : a
	})
	return result.replace(/\n/g, '<br>')
}

export function formatChatPreview(content: string, authorName: string): string {
	if (!content) { return '' }
	return format(content, authorName).replace(/\n/g, ' ')
}
