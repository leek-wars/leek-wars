import { locale as initialLocale, messages } from '@/locale'
import type { Component, ComponentInstance } from 'vue'
import { watch } from 'vue'
import { createI18n } from 'vue-i18n'

// Pre-declare dynamic imports for Vite to bundle them
const localeModules = import.meta.glob('/src/lang/locale/*.ts') as Record<string, () => Promise<{ translations: Record<string, unknown> }>>
const i18nModules = import.meta.glob('/src/component/**/*.i18n', {
	import: 'messages',
}) as Record<string, () => Promise<Record<string, unknown>>>

type I18nWithCompat = ReturnType<typeof createI18n> & {
	t: (key: string, ...args: unknown[]) => string
	tc: (key: string, choice?: number, ...args: unknown[]) => string
	locale: string
}

const i18n = createI18n({
	legacy: false,
	globalInjection: true, // expose $t, $tc, $te, $i18n on all components
	locale: initialLocale,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	messages: {[initialLocale]: messages} as any,
	silentTranslationWarn: true,
	silentFallbackWarn: true,
	missingWarn: false,
	fallbackWarn: false,
	warnHtmlMessage: false,
	warnHtmlInMessage: 'off',
	escapeParameter: true, // échappe les params interpolés dans v-html="$t(k,[userData])" (défense XSS) — #4007
}) as unknown as I18nWithCompat

// vue-i18n lève un SyntaxError (INVALID_ARGUMENT) dès que la clé n'est pas une string non vide, et
// beaucoup de clés sont calculées à partir de données serveur. Dans un .catch() ce throw devient une
// unhandledrejection non rattrapée qui casse la page, dans un render il casse le composant. Le reste
// de la config traite déjà tout échec de lookup comme non fatal (missingWarn / fallbackWarn /
// silentTranslationWarn) : on étend la même règle aux clés inexploitables. Emballé ici sur le
// composer plutôt que sur chaque helper, donc avant le app.use(i18n) de vue.ts qui recopie ce
// descripteur : t(), useNamespacedT(), i18n.t et le $t global en héritent d'un coup.
const rawTranslate = (i18n.global.t as (...a: unknown[]) => unknown).bind(i18n.global)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(i18n.global as any).t = (key: unknown, ...args: unknown[]) => typeof key === 'string' && key ? rawTranslate(key, ...args) : ''

// Compat wrappers: en mode composition, i18n.global.locale est un WritableComputedRef
// et t/tc nécessitent un binding correct. On garde i18n.t() / i18n.tc() / i18n.locale
// pour le code historique (pages chargées hors composant Vue, services, etc.)
Object.defineProperty(i18n, 't', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global.t as any).bind(i18n.global)
	}
})
Object.defineProperty(i18n, 'tc', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global as any).rt
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			? (i18n.global.t as any).bind(i18n.global)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
			: ((i18n.global as any).tc as Function).bind(i18n.global)
	}
})
Object.defineProperty(i18n, 'locale', {
	get() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (i18n.global.locale as any).value ?? i18n.global.locale
	},
	set(value: string) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const loc = i18n.global.locale as any
		if (loc && typeof loc === 'object' && 'value' in loc) {
			loc.value = value
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(i18n.global as any).locale = value
		}
	}
})

const loadedLanguages: string[] = [initialLocale]

function currentLocale(): string {
	const loc = i18n.global.locale as unknown as { value?: string } | string
	return typeof loc === 'object' && loc !== null && 'value' in loc ? (loc.value as string) : (loc as string)
}

// Normalise un nom de composant en clé i18n: PascalCase → kebab-case,
// underscores → dashes, lowercase ; bank-* → bank (toutes les pages bank
// partagent le même fichier .i18n).
function normalizeComponentName(rawName: string): string {
	const name = rawName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-')
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const opts = (this as any).$options
		const locale = currentLocale()
		if (opts?.[MERGED_FLAG] === locale) {
			// Déjà chargé par la garde du routeur (loadRouteTranslations) ou une instance précédente.
		} else if (!opts?.i18n?.messages?.[locale]) {
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Bascule de langue une fois TOUT prêt (dictionnaire général + ceux de la page affichée) : basculer
// avant faisait rendre la page en clés brutes le temps que ses dictionnaires arrivent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLanguageAsync(vue: any, newLocale: string) {
	const route = vue.$router.currentRoute.value
	const home = route?.matched[0]
	const pending: Promise<unknown>[] = [loadRouteTranslations(route, newLocale)]
	if (home) {
		pending.push(Promise.resolve(loadComponentLanguage(newLocale, home.components?.default, home.instances?.default)).catch(() => {}))
	}
	if (!loadedLanguages.includes(newLocale)) {
		const loader = localeModules[`/src/lang/locale/${newLocale}.ts`]
		if (!loader) {
			console.error(`Locale module not found: /src/lang/locale/${newLocale}.ts`)
		} else {
			pending.push(loader().then((module) => {
				i18n.global.mergeLocaleMessage(newLocale, module.translations)
				loadedLanguages.push(newLocale)
			}))
		}
	}
	return Promise.all(pending).then(() => setI18nLanguage(newLocale))
}

// Le dictionnaire d'un composant : le même que le composant, sauf pour les satellites qui
// partagent celui d'un autre. `file` est aussi le NAMESPACE des clés fusionnées, les deux ne
// peuvent pas diverger.
function componentDictionary(rawName: string): { folder: string, file: string } {
	const name = normalizeComponentName(rawName)
	let folder = name
	let file = name
	if (name.startsWith("editor-")) { folder = "editor" }
	if (name.startsWith("git-")) { folder = "editor" }
	if (name.startsWith("signup-")) { folder = "signup" }
	if (name.startsWith("encyclopedia-")) { folder = "encyclopedia" }
	if (name.startsWith("level-dialog")) { folder = "leek" }
	if (name.startsWith("forum-")) { folder = "forum" }
	if (name.startsWith("inventory-")) { folder = "inventory" }
	if (name === "fights-history-table") { folder = "history" }
	// Les satellites du panneau « En direct » (son menu de filtre, posé par la page
	// et non par le panneau) partagent SON dictionnaire : le nom est réécrit, pas
	// seulement le dossier, sinon on chercherait un live/live-filter-menu.*.i18n qui
	// n'existe pas — et le menu rendrait ses clés en brut partout où il est affiché
	// sans que <live> soit monté (panneau d'équipe replié).
	if (name.startsWith("live-")) { folder = "live"; file = "live" }
	return { folder, file }
}

// Charge et fusionne le dictionnaire d'un composant pour une locale. Résout quand les clés sont
// disponibles, ce qui permet de l'attendre AVANT de monter une page ou de basculer de langue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadComponentTranslations(options: any, newLocale: string): Promise<void> {
	if (!options?.name) { return Promise.resolve() }
	if (options[MERGED_FLAG] === newLocale) { return Promise.resolve() }
	const { folder, file } = componentDictionary(options.name)
	const attached = options.i18n?.messages?.[newLocale]
	if (attached) {
		mergeNamespaced(newLocale, file, attached)
		options[MERGED_FLAG] = newLocale
		return Promise.resolve()
	}
	const loader = i18nModules[`/src/component/${folder}/${file}.${newLocale}.i18n`]
	if (!loader) { return Promise.resolve() }
	return loader().then((messages) => {
		mergeNamespaced(newLocale, file, messages)
		options[MERGED_FLAG] = newLocale
	})
}

// Les pages sont importées par le routeur dans la langue du démarrage (`page.<locale>.i18n`) :
// après un changement de langue, leur dictionnaire n'arrivait qu'en asynchrone depuis le
// beforeCreate, et tout texte calculé une seule fois pendant ce temps (titre de la barre, etc.)
// restait figé sur la clé brute. Attendu par la garde beforeResolve et par loadLanguageAsync.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadRouteTranslations(route: { matched: { components?: Record<string, any> | null }[] } | undefined, newLocale: string = currentLocale()): Promise<unknown> {
	if (!route) { return Promise.resolve() }
	const components = route.matched.flatMap(record => Object.values(record.components ?? {}))
	return Promise.all(components.map(component => loadComponentTranslations(component, newLocale).catch(() => {})))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadInstanceTranslations(newLocale: string, instance: any) {
	if (!instance.$options?.name) {
		return
	}
	if (!instance.$options.i18n) {
		instance.$options.i18n = {}
	}
	return loadComponentTranslations(instance.$options, newLocale)
}

function loadComponentLanguage(newLocale: string, component: ComponentInstance<Component>, instance: Component | undefined) {
	let name = component.name ? normalizeComponentName(component.name) : undefined
	if (name === "home" || !name) { name = "signup" }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ((instance as any)?.$i18n?.messages?.[newLocale]) {
		return
	}
	if (component?.i18n?.messages?.[newLocale]) {
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

// Charge un dictionnaire .lang chargé à la demande (fight, doc...) pour la locale ACTIVE et le
// recharge à chaque changement de langue. Sans ça, le dico chargé au boot reste figé et les clés
// du namespace s'affichent en brut après un switch de langue (pas de fallbackLocale) — #11926.
// À appeler dans le setup d'un composant : le watch est nettoyé à sa destruction. L'import est
// mis en cache par le bundler, donc recharger une locale déjà vue est quasi gratuit.
function loadLocalizedMessages(namespace: string, loader: (locale: string) => Promise<{ default: unknown }>) {
	const load = (loc: string) => {
		if (!loc) { return }
		loader(loc).then((module) => i18n.global.mergeLocaleMessage(loc, { [namespace]: module.default }))
	}
	load(currentLocale())
	watch(currentLocale, load)
}

export { i18n, mixins, loadLanguageAsync, loadLocalizedMessages, loadRouteTranslations, t, locale, normalizeComponentName, useNamespacedT }
