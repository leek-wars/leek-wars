import { locale as initialLocale, messages } from '@/locale'
import { Component, ComponentInstance } from 'vue'
import { createI18n } from 'vue-i18n'

// Pre-declare dynamic imports for Vite to bundle them
const localeModules = import.meta.glob('/src/lang/locale/*.ts') as Record<string, () => Promise<{ translations: Record<string, unknown> }>>
const i18nModules = import.meta.glob('/src/component/**/*.i18n', {
	query: '?raw',
	import: 'default',
}) as Record<string, () => Promise<string>>

type I18nWithCompat = ReturnType<typeof createI18n> & {
	t: (key: string, ...args: any[]) => string
	tc: (key: string, choice?: number, ...args: any[]) => string
	locale: string
}

const i18n = createI18n({
	legacy: false,
	globalInjection: true, // expose $t, $tc, $te, $i18n on all components
	locale: initialLocale,
	messages: {[initialLocale]: messages},
	silentTranslationWarn: true,
	silentFallbackWarn: true,
	missingWarn: false,
	fallbackWarn: false,
	warnHtmlMessage: false,
	warnHtmlInMessage: 'off',
	escapeParameter: true,
}) as unknown as I18nWithCompat

// Compat wrappers: en mode composition, i18n.global.locale est un WritableComputedRef
// et t/tc nécessitent un binding correct. On garde i18n.t() / i18n.tc() / i18n.locale
// pour le code historique (pages chargées hors composant Vue, services, etc.)
Object.defineProperty(i18n, 't', {
	get() {
		return (i18n.global.t as any).bind(i18n.global)
	}
})
Object.defineProperty(i18n, 'tc', {
	get() {
		return (i18n.global as any).rt
			? (i18n.global.t as any).bind(i18n.global)
			: ((i18n.global as any).tc as Function).bind(i18n.global)
	}
})
Object.defineProperty(i18n, 'locale', {
	get() {
		return (i18n.global.locale as any).value ?? i18n.global.locale
	},
	set(value: string) {
		const loc = i18n.global.locale as any
		if (loc && typeof loc === 'object' && 'value' in loc) {
			loc.value = value
		} else {
			(i18n.global as any).locale = value
		}
	}
})

const loadedLanguages: string[] = [initialLocale]

function currentLocale(): string {
	const loc = i18n.global.locale as unknown as { value?: string } | string
	return typeof loc === 'object' && loc !== null && 'value' in loc ? (loc.value as string) : (loc as string)
}

const mixins = [{
	beforeCreate() {
		// Reload translations because in case of hot reloading, they are lost
		// Missing messages or messages for the current locale
		const opts = (this as any).$options
		const locale = currentLocale()
		if (!opts?.i18n?.messages?.[locale]) {
			// console.log("reload translations...")
			loadInstanceTranslations(locale, this)
		}
	},
	watch: {
		'$i18n.locale'() {
			let name = (this as any).$options?.name
			if (!name) return
			// console.log("Reload translations of component", name)
			const newLocale = currentLocale()
			if (name.startsWith('bank-')) { name = 'bank' }
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
	const loc = i18n.global.locale as unknown as { value?: string } | string
	if (typeof loc === 'object' && loc !== null && 'value' in loc) {
		(loc as { value: string }).value = lang
	} else {
		(i18n.global as { locale: string }).locale = lang
	}
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
	if (!instance.$options?.name) {
		return
	}
	if (!instance.$options.i18n) {
		instance.$options.i18n = {}
	}
	let name = instance.$options.name.toLowerCase().replace(/_/g, '-')
	let folder = name
	if (name.startsWith("bank-")) { name = "bank"; folder = "bank" }
	if (name.startsWith("editor-")) { folder = "editor" }
	if (name.startsWith("git-")) { folder = "editor" }
	if (name.startsWith("signup-")) { folder = "signup" }
	if (name.startsWith("encyclopedia-")) { folder = "encyclopedia" }
	if (name.startsWith("level-dialog")) { folder = "leek" }
	if (name.startsWith("forum-")) { folder = "forum" }
	if (name.startsWith("inventory-")) { folder = "inventory" }
	if (name === "fights-history-table") { folder = "history" }

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
	if (name?.startsWith("bank-") || name === "bankbuy" || name === "bankvalidate") { name = "bank" }
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

// Helpers for <script setup> components (avoids i18n.global boilerplate)
function t(key: string, ...args: unknown[]): string {
	return String((i18n.global.t as (...a: unknown[]) => unknown).call(i18n.global, key, ...args))
}
const locale = currentLocale()

export { i18n, mixins, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations, t, locale, currentLocale }
