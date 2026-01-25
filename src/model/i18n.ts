import { locale, messages } from '@/locale'
import { Component, ComponentInstance } from 'vue'
import { createI18n } from 'vue-i18n'

// Pre-declare dynamic imports for Vite to bundle them
const localeModules = import.meta.glob('/src/lang/locale/*.ts') as Record<string, () => Promise<{ translations: Record<string, unknown> }>>
const i18nModules = import.meta.glob('/src/component/**/*.i18n', {
	query: '?raw',
	import: 'default',
}) as Record<string, () => Promise<string>>

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
Object.defineProperty(i18n, 't', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global as any).t
	}
})
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
			const loader = i18nModules[modulePath]
			if (!loader) return
			return loader().then((raw) => {
				const messages = JSON.parse(raw)
				i18n.global.mergeLocaleMessage(newLocale, { [name]: messages })
				// console.log("i18n watch set instance messages", newLocale, messages, module)
				const instanceI18n = (this as any).$i18n
				instanceI18n.setLocaleMessage(newLocale, messages)
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
	// console.log("loadLanguageAsync", newLocale)
	const currentRoute = vue.$router.currentRoute.value?.matched[0]
	if (currentRoute) {
		// console.log("loadLanguageAsync", currentRoute)
		loadComponentLanguage(newLocale, currentRoute.components?.default, currentRoute.instances?.default)
	}
	if (!loadedLanguages.includes(newLocale)) {
		const modulePath = `/src/lang/locale/${newLocale}.ts`
		const loader = localeModules[modulePath]
		if (!loader) {
			console.error(`Locale module not found: ${modulePath}`)
			return Promise.resolve(setI18nLanguage(newLocale))
		}
		return loader().then((module) => {
			i18n.global.mergeLocaleMessage(newLocale, module.translations)
			loadedLanguages.push(newLocale)
			return setI18nLanguage(newLocale)
		})
	}
	return Promise.resolve(setI18nLanguage(newLocale))
}

function loadInstanceTranslations(newLocale: string, instance: any) {
	// console.log("load instance translations", "instance", instance, newLocale)
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
	const loader = i18nModules[modulePath]
	if (!loader) return
	return loader().then((raw) => {
		const messages = JSON.parse(raw)
		const instanceI18n = (instance as any).$i18n
		// console.log("instance i18n", instanceI18n, instance, "messages", messages)
		if (instanceI18n) {
			instanceI18n.setLocaleMessage(newLocale, messages)
		}
	})
}

function loadComponentLanguage(newLocale: string, component: ComponentInstance<Component>, instance: Component | undefined) {

	// console.log("loadComponentLanguage", newLocale, "component", component, "instance", instance)

	let name = component.name?.toLowerCase().replace(/_/g, '-')
	if (name === "bankbuy" || name === "bankvalidate") { name = "bank" }
	if (name === "home" || !name) { name = "signup" }

	if (instance && (instance as any).$i18n && (instance as any).$i18n.messages[newLocale]) {
		// console.log("i18n already loaded on instance!")
		return
	}
	if (component && component.i18n && component.i18n.messages && component.i18n.messages[newLocale]) {
		// console.log("i18n already set on component!")
		return
	}
	const modulePath = `/src/component/${name}/${name}.${newLocale}.i18n`
	const loader = i18nModules[modulePath]
	// console.log("loader", loader, modulePath, i18nModules)
	if (!loader) return
	return loader().then((raw) => {
		const messages = JSON.parse(raw)
		// if (!(name in module.translations)) {
			// console.log("No messages for '" + name + "' in '" + locale + "'!")
			// return
		// }
		// console.log("messages", messages)
		i18n.global.mergeLocaleMessage(newLocale, { [name]: messages })
		if (instance && (instance as any).$i18n) {
			const instanceI18n = (instance as any).$i18n
			instanceI18n.setLocaleMessage(newLocale, messages)
			// console.log("installed '" + newLocale + "' messages on instance '" + name + "'")
		} else {
			if (component.i18n) {
				(component as any).i18n = {messages: {[newLocale]: messages}}
			}
			// console.log("set '" + newLocale + "' messages on component '" + name + "'")
		}	
	})
}

export { i18n, mixins, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations }
