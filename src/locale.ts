export let locale: string = ''
export let messages: any = {}
export let defaultWiki: any = {}
export const test: string = 'leek.tvue'

export function setTranslations(locale_: string, dict: any, wiki: any) {
	locale = locale_
	messages = dict
	defaultWiki = wiki
}