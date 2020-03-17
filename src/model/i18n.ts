import { locale, messages } from '@/locale'
import Vue, { Component } from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)
const i18n = new VueI18n({
	locale,
	messages: {[locale]: messages},
	silentTranslationWarn: true,
})
const loadedLanguages: string[] = [locale]

function setI18nLanguage(lang: string) {
	i18n.locale = lang
	const html = document.querySelector('html')
	if (html) {
		html.setAttribute('lang', lang)
	}
	return lang
}

function loadLanguageAsync(vue: any, newLocale: string) {
	const currentRoute = (vue.$router as any).history.current.matched[0]
	if (currentRoute) {
		loadComponentLanguage(newLocale, currentRoute.components.default, currentRoute.instances.default)
	}
	if (!loadedLanguages.includes(newLocale)) {
		return import(/* webpackChunkName: "locale-[request]" */ `@/lang/locale/${newLocale}`).then(module => {
			console.log("loadLanguageAsync merge", module.translations)
			i18n.mergeLocaleMessage(newLocale, module.translations)
			loadedLanguages.push(newLocale)
			vue.onLanguageLoaded()
			return setI18nLanguage(newLocale)
		})
	}
	return Promise.resolve(setI18nLanguage(newLocale))
}

function loadInstanceTranslations(newLocale: string, instance: any) {
	if (!instance.$options.name || !instance.$options.i18n) {
		return
	}
	let name = instance.$options.name.toLowerCase().replace(/_/g, '-')
	if (name.indexOf("bank-") === 0) { name = "bank" }

	console.log("Load", `@/lang/${newLocale}/${name}.json`)
	return import(/* webpackChunkName: "locale-[request]" */ `json-loader!@/lang/${newLocale}/${name}.i18n`).then((module: any) => {
		console.log(module)
		const instanceI18n = (instance as any)._i18n
		instanceI18n.setLocaleMessage(newLocale, module)
	})
}

function loadComponentLanguage(newLocale: string, component: any, instance: Component | undefined) {
	if (!component.options) { return }
	let name = (component as any).options.name.toLowerCase().replace(/_/g, '-')
	if (name === "bankbuy" || name === "bankvalidate") { name = "bank" }
	console.log("Load translation of:", name)
	if (component === undefined) {
		return
	}
	if (instance && (instance as any).$i18n && (instance as any).$i18n.messages[newLocale]) {
		// console.log("i18n already loaded on instance!")
		return 
	}
	if (component && component.options.i18n && component.options.i18n.messages && component.options.i18n.messages[newLocale]) {
		// console.log("i18n already set on component!")
		return 
	}
	return import(/* webpackChunkName: "locale-[request]" */ `!json-loader!@/component/${name}/${name}.${newLocale}.i18n`).then((module: any) => {
		console.log(module)
		// if (!(name in module.translations)) {
			// console.log("No messages for '" + name + "' in '" + locale + "'!")
			// return
		// }
		console.log("loadComponentLanguage merge", { [name]: module })
		i18n.mergeLocaleMessage(newLocale, { [name]: module })
		if (instance && (instance as any).$i18n) {
			const instanceI18n = (instance as any).$i18n
			instanceI18n.setLocaleMessage(newLocale, module)
			// console.log("installed '" + locale + "' messages on instance '" + name + "'")
		} else {
			(component as any).options.i18n = {messages: {[newLocale]: module}}
			// console.log("set '" + locale + "' messages on component '" + name + "'")
		}
	})
}

export { i18n, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations }
