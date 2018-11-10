export let defaultLocale: string = ''
export let defaultMessages = {}

export function setTranslations(locale: string, dict: any) {
	defaultLocale = locale
	defaultMessages = dict
}