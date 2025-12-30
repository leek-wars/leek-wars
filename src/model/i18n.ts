import { locale, messages } from '@/locale'
import { Component } from 'vue'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
	legacy: true, // Use legacy mode for compatibility
	locale,
	messages: {[locale]: messages},
	silentTranslationWarn: true,
})
const loadedLanguages: string[] = [locale]

const mixins = [{
	beforeCreate() {
		// Reload translations because in case of hot reloading, they are lost
		// Missing messages or messages for the current locale
		if (!(this as any).$options.i18n.messages || !(this as any).$options.i18n.messages[i18n.global.locale]) {
			// console.log("reload translations...")
			loadInstanceTranslations(i18n.global.locale, this)
		}
	},
	watch: {
		'$i18n.locale'() {
			const name = (this as any).$options.name!
			// console.log("Reload translations of component", name)
			const newLocale = i18n.global.locale
			const folder = name.startsWith('signup-') ? 'signup' : name
			return import(/* webpackChunkName: "locale-[request]" */ `!json-loader!@/component/${folder}/${name}.${newLocale}.i18n`).then((module: any) => {
				i18n.global.mergeLocaleMessage(newLocale, { [name]: module.default })
				const instanceI18n = (this as any).$i18n
				instanceI18n.setLocaleMessage(newLocale, module.default)
			})
		}
	}
}]

function setI18nLanguage(lang: string) {
	i18n.global.locale = lang
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
			i18n.global.mergeLocaleMessage(newLocale, module.translations)
			loadedLanguages.push(newLocale)
			// vue.onLanguageLoaded()
			return setI18nLanguage(newLocale)
		})
	}
	return Promise.resolve(setI18nLanguage(newLocale))
}

function loadInstanceTranslations(newLocale: string, instance: any) {
	// console.log("load instance translations", instance)
	if (!instance.$options.name) {
		return
	}
	if (!instance.$options.i18n) {
		instance.$options.i18n = {}
	}
	let name = instance.$options.name.toLowerCase().replace(/_/g, '-')
	let folder = name
	if (name.indexOf("bank-") === 0) { name = "bank" }
	if (name.indexOf("editor-") === 0) { folder = "editor" }
	if (name.indexOf("signup-") === 0) { folder = "signup" }
	if (name.indexOf("encyclopedia-") === 0) { folder = "encyclopedia" }
	if (name.indexOf("level-dialog") === 0) { folder = "leek" }
	if (name.indexOf("forum-") === 0) { folder = "forum" }
	if (name.indexOf("inventory-") === 0) { folder = "inventory" }

	return import(/* webpackChunkName: "locale-[request]" */ `!json-loader!@/component/${folder}/${name}.${newLocale}.i18n`).then((module: any) => {
		const instanceI18n = (instance as any)._i18n
		instanceI18n.setLocaleMessage(newLocale, module)
	})
}

function loadComponentLanguage(newLocale: string, component: any, instance: Component | undefined) {

	if (!component.options) { return }
	let name = (component as any).options.name.toLowerCase().replace(/_/g, '-')
	if (name === "bankbuy" || name === "bankvalidate") { name = "bank" }
	if (name === "home") { name = "signup" }

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
		// if (!(name in module.translations)) {
			// console.log("No messages for '" + name + "' in '" + locale + "'!")
			// return
		// }
		// console.log("loadComponentLanguage merge", { [name]: module })
		i18n.global.mergeLocaleMessage(newLocale, { [name]: module })
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

export { i18n, mixins, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations }
