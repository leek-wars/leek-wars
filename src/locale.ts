export let locale: string = ''
export let messages: any = {}

export function setTranslations(locale_: string, dict: any) {
	locale = locale_
	messages = dict
}