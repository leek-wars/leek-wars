export let locale: string = ''
export let messages: Record<string, unknown> = {}

export function setTranslations(locale_: string, dict: Record<string, unknown>) {
	locale = locale_
	messages = dict
}