export let locale: string = ''
export let messages: any = {}
export let defaultWiki: any = {}

export function setTranslations(locale_: string, dict: any, wiki: any) {
	locale = locale_
	messages = dict
	defaultWiki = wiki
}