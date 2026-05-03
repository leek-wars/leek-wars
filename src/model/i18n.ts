import { locale as initialLocale, messages } from '@/locale'
import { Component, ComponentInstance } from 'vue'
import { createI18n } from 'vue-i18n'

// Pre-declare dynamic imports for Vite to bundle them
const localeModules = import.meta.glob('/src/lang/locale/*.ts') as Record<string, () => Promise<{ translations: Record<string, unknown> }>>
const i18nModules = import.meta.glob('/src/component/**/*.i18n', {
	import: 'messages',
}) as Record<string, () => Promise<Record<string, unknown>>>

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
	escapeParameter: false,
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

// Normalise un nom de composant en clé i18n: lowercase, underscores → dashes,
// bank-* → bank (toutes les pages bank partagent le même fichier .i18n).
function normalizeComponentName(rawName: string): string {
	const name = rawName.toLowerCase().replace(/_/g, '-')
	if (name.startsWith('bank-') || name === 'bankbuy' || name === 'bankvalidate') return 'bank'
	return name
}

function mergeNamespaced(locale: string, name: string, messages: unknown) {
	i18n.global.mergeLocaleMessage(locale, { [name]: messages as Record<string, unknown> })
}

const MERGED_FLAG = '__i18nMerged'

const mixins = [{
	beforeCreate() {
		// Reload translations because in case of hot reloading, they are lost
		// Missing messages or messages for the current locale
		const opts = (this as any).$options
		const locale = currentLocale()
		if (!opts?.i18n?.messages?.[locale]) {
			loadInstanceTranslations(locale, this)
		} else if (opts.name && opts[MERGED_FLAG] !== locale) {
			// Messages déjà attachés à Component.i18n par le i18nPlugin Vite mais
			// pas encore mergés dans le composer global pour cette locale.
			mergeNamespaced(locale, normalizeComponentName(opts.name), opts.i18n.messages[locale])
			opts[MERGED_FLAG] = locale
		}
	},
	watch: {
		'$i18n.locale'() {
			const rawName = (this as any).$options?.name
			if (!rawName) return
			const newLocale = currentLocale()
			const name = normalizeComponentName(rawName)
			const folder = name.startsWith('signup-') ? 'signup' : name
			const modulePath = `/src/component/${folder}/${name}.${newLocale}.i18n`
			const loader = i18nModules[modulePath]
			if (!loader) return
			return loader().then((messages) => {
				mergeNamespaced(newLocale, name, messages)
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
	if (!instance.$options?.name) {
		return
	}
	if (!instance.$options.i18n) {
		instance.$options.i18n = {}
	}
	const name = normalizeComponentName(instance.$options.name)
	let folder = name
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
	return loader().then((messages) => {
		mergeNamespaced(newLocale, name, messages)
		instance.$options[MERGED_FLAG] = newLocale
	})
}

function loadComponentLanguage(newLocale: string, component: ComponentInstance<Component>, instance: Component | undefined) {
	let name = component.name ? normalizeComponentName(component.name) : undefined
	if (name === "home" || !name) { name = "signup" }

	if (instance && (instance as any).$i18n && (instance as any).$i18n.messages[newLocale]) {
		return
	}
	if (component && component.i18n && component.i18n.messages && component.i18n.messages[newLocale]) {
		return
	}
	const modulePath = `/src/component/${name}/${name}.${newLocale}.i18n`
	const loader = i18nModules[modulePath]
	if (!loader) return
	return loader().then((messages) => {
		mergeNamespaced(newLocale, name!, messages)
	})
}

// Helpers for <script setup> components (avoids i18n.global boilerplate)
function t(key: string, ...args: unknown[]): string {
	return String((i18n.global.t as (...a: unknown[]) => unknown).call(i18n.global, key, ...args))
}
const locale = currentLocale()

// For sub-pages sharing a parent's .i18n without their own component-local i18n scope.
function useNamespacedT(name: string) {
	const prefix = normalizeComponentName(name) + '.'
	return (key: string, ...args: unknown[]): string => {
		const namespaced = prefix + key
		if ((i18n.global.te as (key: string) => boolean)(namespaced)) {
			return String((i18n.global.t as (...a: unknown[]) => unknown)(namespaced, ...args))
		}
		return String((i18n.global.t as (...a: unknown[]) => unknown)(key, ...args))
	}
}

export { i18n, mixins, loadComponentLanguage, loadLanguageAsync, loadInstanceTranslations, t, locale, currentLocale, normalizeComponentName, useNamespacedT }
