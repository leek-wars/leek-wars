export let defaultLocale: string = ''
export let defaultMessages = {}
export let defaultWiki: any = {}

export function setTranslations(locale: string, dict: any, wiki: any) {
	defaultLocale = locale
	defaultMessages = dict
	defaultWiki = wiki
}