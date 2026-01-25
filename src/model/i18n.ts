import { locale, messages } from '@/locale'
import { Options } from 'vue'
import { createI18n } from 'vue-i18n'

// Pre-load all locale modules for dynamic import with Vite
const localeModules = import.meta.glob('@/lang/locale/*.ts')
const componentI18nModules = import.meta.glob('@/component/**/*.i18n')

const i18n = createI18n({
	legacy: true, // Use legacy mode for compatibility
	locale,
	messages: {[locale]: messages},
	silentTranslationWarn: true,
	silentFallbackWarn: true,
	missingWarn: false,
	fallbackWarn: false,
	warnHtmlMessage: false,
	warnHtmlInMessage: 'off',
})

// Add backward compatibility helpers for Vue 2 -> Vue 3 migration
// This allows code to use i18n.t() instead of i18n.global.t()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.defineProperty(i18n, 't', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global as any).t
	}
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.defineProperty(i18n, 'tc', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global as any).tc
	}
})
Object.defineProperty(i18n, 'locale', {
	get() {
		return i18n.global.locale
	},
	set(value: string) {
		i18n.global.locale = value
	}
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
			const modulePath = `/src/component/${folder}/${name}.${newLocale}.i18n`
			const loader = componentI18nModules[modulePath]
			if (!loader) return
			return loader().then((module: any) => {
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
	const currentRoute = vue.$router.currentRoute.value?.matched[0]
	if (currentRoute) {
		loadComponentLanguage(newLocale, currentRoute.components?.default, currentRoute.instances?.default)
	}
	if (!loadedLanguages.includes(newLocale)) {
		const modulePath = `/src/lang/locale/${newLocale}.ts`
		const loader = localeModules[modulePath]
		if (!loader) {
			console.error(`Locale module not found: ${modulePath}`)
			return Promise.resolve(setI18nLanguage(newLocale))
		}
		return loader().then((module: any) => {
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

	const modulePath = `/src/component/${folder}/${name}.${newLocale}.i18n`
	const loader = componentI18nModules[modulePath]
	if (!loader) return
	return loader().then((module: any) => {
		const instanceI18n = (instance as any)._i18n
		if (instanceI18n) {
			instanceI18n.setLocaleMessage(newLocale, module.default)
		}
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
	const modulePath = `/src/component/${name}/${name}.${newLocale}.i18n`
	const loader = componentI18nModules[modulePath]
	if (!loader) return
	return loader().then((module: any) => {
		// if (!(name in module.translations)) {
			// console.log("No messages for '" + name + "' in '" + locale + "'!")
			// return
		// }
		// console.log("loadComponentLanguage merge", { [name]: module })
		i18n.global.mergeLocaleMessage(newLocale, { [name]: module.default })
		if (instance && (instance as any).$i18n) {
			const instanceI18n = (instance as any).$i18n
			instanceI18n.setLocaleMessage(newLocale, module.default)
			// console.log("installed '" + locale + "' messages on instance '" + name + "'")
		} else {
			(component as any).options.i18n = {messages: {[newLocale]: module.default}}
			// console.log("set '" + locale + "' messages on component '" + name + "'")
		}
	})
}

export { i18n, mixins, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations }
