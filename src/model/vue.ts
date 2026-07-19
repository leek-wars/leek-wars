import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Error from '@/component/app/error.vue'
import LWLoader from '@/component/app/loader.vue'
import Panel from '@/component/app/panel.vue'
import Avatar from '@/component/avatar.vue'
import Flag from '@/component/flag.vue'
import '@/component/editor/monaco-highlight.scss'
import Emblem from '@/component/emblem.vue'
import LeekImage from '@/component/leek-image.vue'
import TrophyIcon from '@/component/trophy-icon.vue'
import NotificationElement from '@/component/notifications/notification.vue'
import Popup from '@/component/popup.vue'
import RankingBadge from '@/component/ranking-badge.vue'
import Talent from '@/component/talent.vue'
import { env } from '@/env'
import { i18n, loadLanguageAsync, normalizeComponentName } from '@/model/i18n'
import { LeekWars, loadGameData } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router, { getRedirectAfterLogin } from '@/router'
import { createApp, defineAsyncComponent, defineComponent, getCurrentInstance, h, nextTick } from 'vue'
import type { App as VueApp, Component, ComponentPublicInstance } from 'vue'
import { Translation } from 'vue-i18n'
import { Latex } from './latex'
import { scroll_to_hash } from '@/router-functions'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { da, de, en, es, fi, fr, id, it, ja, ko, nl, no, pl, pt, ru, sv, zhHans } from 'vuetify/locale'
import { locale as initialLocale } from '@/locale'
import { watch } from 'vue'
import { aliases as mdiSvgAliases } from 'vuetify/iconsets/mdi-svg'
import { mdiIconSet } from './icon-set'
import { formatEmojis } from './emojis'
import { displayWarningMessage, emitter, setVueMain } from './emitter'
import '@/chart'

const Console = defineAsyncComponent(() => import('@/component/app/console.vue'))

const cspNonce = (document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null)?.content || undefined

// Vuetify nomme le chinois 'zhHans'.
const toVuetifyLocale = (lang: string) => lang === 'zh' ? 'zhHans' : lang

const vuetify = createVuetify({
	locale: {
		locale: toVuetifyLocale(initialLocale),
		fallback: 'en',
		messages: { da, de, en, es, fi, fr, id, it, ja, ko, nl, no, pl, pt, ru, sv, zhHans },
	},
	icons: {
		defaultSet: 'mdi',
		aliases: mdiSvgAliases,
		sets: { mdi: mdiIconSet },
	},
	theme: {
		cspNonce,
		themes: {
			dark: {
				colors: {
					primary: '#5fad1b',
				},
			},
			light: {
				colors: {
					primary: '#5fad1b',

				},
			},
		},
	},
	defaults: {
		VSwitch: {
			color: 'primary',
		},
		VRadio: {
			color: 'primary',
		},
		VRadioGroup: {
			color: 'primary',
		},
		VCheckbox: {
			color: 'primary',
		},
		VTooltip: {
			location: 'bottom',
		},
		VList: {
			density: 'compact'
		},
		VListItem: {
			density: 'compact',
		},
	},
})

// Garde la locale des composants Vuetify (footer v-data-table, etc.) synchronisée
// quand la langue change à chaud, sans rechargement de page.
watch(() => i18n.locale, (lang) => {
	vuetify.locale.current.value = toVuetifyLocale(lang)
})

// Cache-busted reload on Vite asset errors, with a cooldown to break out of
// refresh-on-every-click loops when the new bundle still errors.
const PRELOAD_RELOAD_KEY = 'vite-preload-reload-at'
const RELOAD_COOLDOWN = 60_000

function reloadWithCacheBust() {
	const now = Date.now()
	const last = parseInt(sessionStorage.getItem(PRELOAD_RELOAD_KEY) || '0', 10)
	if (now - last < RELOAD_COOLDOWN) return
	sessionStorage.setItem(PRELOAD_RELOAD_KEY, now.toString())
	const url = new URL(window.location.href)
	url.searchParams.set('_r', now.toString())
	window.location.replace(url.toString())
}

window.addEventListener('vite:preloadError', (event) => {
	// Un preloadError pendant une navigation = chunk dynamique annulé par le navigateur
	// (surtout Firefox), PAS forcément un déploiement périmé : l'asset existe souvent
	// encore (HTTP 200). On ne recharge donc toute la page (#_r=) QUE si l'asset a vraiment
	// disparu (404 = vrai chunk périmé) ; sinon on laisse Vite/le routeur réessayer.
	// Le marqueur ":suppressed" mesure les rechargements intempestifs ainsi évités.
	// Le message est soit "...module: https://.../assets/x.js" (URL absolue, erreurs JS),
	// soit "Unable to preload CSS for /assets/x.css" (chemin relatif, erreurs CSS) : capter les deux.
	const message = (event as { payload?: { message?: string } })?.payload?.message || ''
	const assetUrl = message.match(/https?:\/\/\S+|\/[^\s'"]+\.(?:css|m?js)/)?.[0]
	if (!assetUrl) { reloadWithCacheBust(); return }
	fetch(assetUrl, { method: 'HEAD', cache: 'no-store' })
		.then(r => {
			if (r.ok) reportHidden('vite:preloadError:suppressed', message) // asset 200 → reload évité
			else reloadWithCacheBust()                                      // 404 → vrai stale → reload
		})
		.catch(() => reportHidden('vite:preloadError:suppressed', message + ' (head error)'))
})

// Enregistre une erreur normalement avalée (bruit navigateur/cache, chunk périmé,
// annulation Monaco) en "masquée" côté serveur : loggée pour mesurer son volume mais
// sans issue GitHub ni notification admin, et exclue de la vue par défaut de #admin/errors.
// Throttle 1s indépendant des vraies erreurs pour ne pas s'auto-étouffer mutuellement.
let lastHiddenSent = 0
function reportHidden(message: string, stack?: string) {
	if (LeekWars.DEV) return
	const now = Date.now()
	if (now - lastHiddenSent < 1000) return
	lastHiddenSent = now
	try {
		LeekWars.post('error/report', {
			error: message,
			stack: (stack || '(no stack)') + '\n\nOrigin: hidden',
			file: document.location.href,
			locale: i18n.locale,
			user_agent: navigator.userAgent,
			hidden: true,
			build_date: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null,
			build_commit: typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null,
		})
	} catch { /* best effort */ }
}

// Suppress Monaco internal error when hovering markers on a disposed editor
window.addEventListener('error', (event) => {
	if (event.error?.message?.includes('InstantiationService has been disposed')) {
		reportHidden(event.error.message, event.error.stack)
		event.preventDefault()
	}
})

let lastErrorSent = 0

// Instrumentation #4163 : tracer la SÉQUENCE d'erreurs (chunk/async-loader → cascade parentNode)
// et l'écart depuis le dernier bump routerViewKey (rustine), pour distinguer un PREMIER crash
// organique d'une cascade auto-induite par la rustine. Read-only, aucun changement de comportement.
let droppedSinceLastReport = 0
const recentEvents: { t: number, kind: string, msg: string }[] = []
function recordEvent(kind: string, msg: unknown) {
	recentEvents.push({ t: Date.now(), kind, msg: String(msg ?? '').slice(0, 80) })
	if (recentEvents.length > 14) recentEvents.shift()
}

interface NavSnapshot {
	fullPath: string
	name: string | null
	at: number
}
let previousNav: NavSnapshot | null = null
let currentNav: NavSnapshot | null = null

function describeRouteSubtree(instance: unknown): string | null {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let node = (instance as any)?.subTree
		let depth = 0
		while (node && depth < 20) {
			const child = node.component
			if (child) {
				const t = child.type
				const name = t?.name || t?.__name || t?.__file || 'Anonymous'
				return name
			}
			node = node.children?.[0]
			depth++
		}
	} catch { /* empty */ }
	return null
}

// Pour les erreurs "parentNode is null" pendant un patch in-place de <RouterView>
// (ex. navigation /leek/A → /leek/B, cluster #4050-#4056) : la stack ne contient
// que des frames vendor (flush async du scheduler), donc Vue n'attribue que
// <RouterView> et le composant fautif reste invisible. On parcourt le sous-arbre
// de vnodes APRÈS l'erreur (lecture seule, aucun effet sur le rendu) pour nommer
// le chemin jusqu'au vnode dont `el` est null — le nœud réellement cassé.
function findNullElVnodePath(instance: unknown): string | null {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const label = (vn: any): string => {
		const t = vn?.type
		if (t == null) return 'vnode'
		if (typeof t === 'symbol') return t.description || 'Fragment'
		if (typeof t === 'string') return t
		return t.name || t.__name || t.__file || 'Component'
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const visit = (vn: any, depth: number): string[] | null => {
		if (!vn || typeof vn !== 'object' || depth > 50) return null
		// Descendre dans le sous-arbre rendu d'un composant
		if (vn.component?.subTree) {
			const r = visit(vn.component.subTree, depth + 1)
			if (r) return [label(vn), ...r]
		}
		if (Array.isArray(vn.children)) {
			for (const c of vn.children) {
				if (c && typeof c === 'object' && 'type' in c) {
					const r = visit(c, depth + 1)
					if (r) return [label(vn), ...r]
				}
			}
		}
		// Un vnode élément/composant monté doit porter un `el`. On ignore les
		// Fragment/Text/Comment (type = symbol) qui peuvent légitimement avoir un
		// el null/anchor.
		if (vn.el == null && typeof vn.type !== 'symbol') return [label(vn) + '(el=null)']
		return null
	}
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const root = (instance as any)?.subTree
		const path = root ? visit(root, 0) : null
		return path ? path.join(' › ') : null
	} catch { return null }
}

// Famille de crashs = corruption de l'arbre de vnodes de Vue (el/anchor/instance devenus
// null pendant le patch, cause probable moteur de traduction/extension qui mute le DOM).
// Une seule définition, partagée par le diagnostic ET la récupération par hard reload, pour
// éviter que les deux listes de motifs divergent.
function isDomCorruptionCrash(m: string): boolean {
	return m.includes('parentNode') || m.includes('nextSibling') ||
		m.includes("reading 'style'") || m.includes('property "style"') || m.includes("reading 'el'") ||
		m.includes("reading 'insertBefore'") || m.includes('"insertBefore"') || m.includes('emitsOptions')
}

// Empreintes DOM d'interférence externe (moteurs de traduction, extensions), collées aux
// rapports de crash de la famille corruption-DOM (nextSibling/parentNode/insertBefore null).
// Les navigateurs interdisent d'énumérer les extensions : on détecte donc leurs artefacts
// injectés. Le but est de CONFIRMER en prod que ce cluster corrèle avec la traduction et de
// quantifier sa part. On dumpe tous les attributs de <html> (capture les marqueurs inconnus,
// ex. Firefox natif) plutôt que de hardcoder une liste.
// `translation` = un moteur de traduction (Google Translate, Firefox Translations…) est
// actif : marqueur qui prouve que le crash de patch est induit de l'extérieur, donc
// irréparable côté app. On s'en sert pour masquer ces rapports (voir reportVueError).
function detectDOMInterference(): { text: string, translation: boolean } {
	try {
		const signals: string[] = []
		let translation = false
		const html = document.documentElement
		// Google Translate : classe translated-ltr/rtl + DOM du widget.
		if (/\btranslated-(ltr|rtl)\b/.test(html.className || '')) { signals.push('google-translate'); translation = true }
		if (document.querySelector('.goog-te-banner-frame, #goog-gt-tt, ins.skiptranslate')) { signals.push('goog-te-dom'); translation = true }
		// <font> dans #app : signature d'un moteur de traduction (l'app n'en rend jamais).
		const app = document.getElementById('app')
		const fonts = app ? app.getElementsByTagName('font').length : 0
		if (fonts) { signals.push('font-nodes=' + fonts); translation = true }
		// Extensions invasives connues qui muteraient le DOM.
		if (document.querySelector('grammarly-extension, grammarly-desktop-integration')) signals.push('grammarly')
		if (document.querySelector('style.darkreader, style#dark-reader-style')) signals.push('darkreader')
		// Attributs bruts de <html> : capte les marqueurs non anticipés (translate, lang forcé, etc.).
		const attrs = Array.from(html.attributes)
			.map(a => a.name + (a.value ? '="' + a.value.substring(0, 60) + '"' : ''))
			.join(' ')
		const text = '\n\nDOM interference: ' + (signals.length ? signals.join(' ') : 'no known marker') + '\nhtml attrs: ' + attrs
		return { text, translation }
	} catch (ex) {
		return { text: '\n\nDOM interference: [detection failed: ' + (ex as Error).message + ']', translation: false }
	}
}

export function reportVueError(err: unknown, vm: unknown, info: unknown, origin: string = 'main') {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const e = err as any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const vmAny = vm as any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const infoAny = info as any

	if (LeekWars.DEV) return

	// Instrumentation v2 (#4163) : mémoriser LA première erreur de la session (corrupteur
	// racine d'un el null) en sessionStorage — le buffer roule et la perd. Capturée pour TOUT
	// type d'erreur (y compris chunk/async-loader) et réinjectée dans chaque rapport complet.
	let firstCrashTrace = ''
	try {
		const stored = sessionStorage.getItem('lw_first_crash')
		if (!stored) {
			sessionStorage.setItem('lw_first_crash', JSON.stringify({
				m: (e?.message || String(e) || '').slice(0, 100), info: String(infoAny),
				route: currentNav?.fullPath || null, prev: previousNav?.fullPath || null,
				sinceNav: currentNav ? Date.now() - currentNav.at : null, at: Date.now(),
			}))
		} else {
			const f = JSON.parse(stored)
			firstCrashTrace = '\n\nFirst crash this session (' + (Date.now() - f.at) + 'ms ago): ' + f.m +
				' | info=' + f.info + ' | route=' + f.route + ' prev=' + f.prev + ' sinceNav=' + f.sinceNav + 'ms'
		}
	} catch { /* empty */ }

	// Échecs de chargement de chunk/CSS (Chrome: "Failed to fetch...", Firefox: "error loading...").
	// On les logge en masqué SANS recharger : la récupération après déploiement est gérée par le
	// handler `vite:preloadError` (HEAD-checké) qui fire pour le même échec et ne recharge que sur un vrai 404.
	if (e?.message?.includes('Failed to fetch dynamically imported module') ||
		e?.message?.includes('error loading dynamically imported module') ||
		e?.message?.includes('Loading chunk') ||
		e?.message?.includes('Loading CSS chunk') ||
		e?.message?.includes('Unable to preload CSS')) {
		recordEvent('chunk', e?.message)
		reportHidden(e?.message || String(e), e?.stack)
		return
	}

	// runtime-13 = ASYNC_COMPONENT_LOADER : sur un échec de chunk, le handler vite:preloadError
	// gère déjà la récup ; sur un vrai throw de composant, recharger ne sert à rien (boucle). On logge.
	if (infoAny?.includes?.('runtime-13')) {
		recordEvent('async-loader', e?.message)
		reportHidden((e?.message || String(e)) + ' [' + infoAny + ']', e?.stack)
		return
	}

	if (Date.now() - lastErrorSent < 1000) {
		droppedSinceLastReport++
		recordEvent('dropped', e?.message)
		return
	}
	lastErrorSent = Date.now()
	recordEvent('crash', e?.message)

	let errorBody: string
	try {
		errorBody = e?.message || (e && typeof e === 'object' ? JSON.stringify(e) : String(e))
	} catch {
		errorBody = String(e)
	}
	const error = (e?.name || 'Error') + ": " + errorBody
	const file = document.location.href
	const locale = i18n.locale
	const user_agent = navigator.userAgent

	let componentTrace = ''
	let routeSubtree: string | null = null
	let nullElPath: string | null = null
	try {
		if (vmAny) {
			const components: string[] = []
			// errorCaptured passes a public proxy (.$ → internal instance); app.config.errorHandler
			// passes the internal instance directly. Handle both.
			let instance = vmAny.$ || vmAny
			const leafInstance = instance
			while (instance && components.length < 100) {
				const name = instance.type?.name || instance.type?.__name || 'Anonymous'
				const propsDef = instance.type?.props
				let propsStr = ''
				if (propsDef && instance.props) {
					const parts: string[] = []
					const keys = Array.isArray(propsDef) ? propsDef : Object.keys(propsDef)
					for (const key of keys) {
						const val = instance.props[key]
						if (val !== undefined && val !== null && val !== false) {
							let s: string
							if (typeof val === 'object') {
								s = Array.isArray(val) ? '[Array(' + val.length + ')]' : '[Object]'
							} else {
								s = String(val).substring(0, 50)
							}
							parts.push(key + '=' + s)
						}
					}
					if (parts.length) propsStr = ' ' + parts.join(' ')
				}
				components.push('<' + name + propsStr + '>')
				instance = instance.parent
			}
			componentTrace = '\n\nComponent: ' + components[0] + '\nHierarchy: ' + components.join(' → ')
			// For RouterView/Anonymous-rooted errors, expose the actual route component being patched.
			const leafName = leafInstance?.type?.name || leafInstance?.type?.__name
			if (leafName === 'RouterView' || !leafName) {
				routeSubtree = describeRouteSubtree(leafInstance)
				// Erreurs de patch sur un el null (cluster #4050-#4056) : pointer le vnode cassé
				if (e?.message?.includes('parentNode') || e?.message?.includes("reading 'el'")) {
					nullElPath = findNullElVnodePath(leafInstance)
				}
			}
		}
	} catch (ex) {
		componentTrace = '\n\n[Component trace failed: ' + (ex as Error).message + ']'
	}

	let navTrace = ''
	try {
		const lines: string[] = []
		if (currentNav) lines.push('Route: ' + currentNav.fullPath + (currentNav.name ? ' [' + currentNav.name + ']' : ''))
		if (previousNav) lines.push('Previous route: ' + previousNav.fullPath + (previousNav.name ? ' [' + previousNav.name + ']' : ''))
		if (currentNav) lines.push('Since last navigation: ' + (Date.now() - currentNav.at) + 'ms')
		// Écart entre les 2 dernières navs : un gap minuscule = double-nav rapprochée
		// (interruption probable de la nav précédente pendant son démontage).
		if (currentNav && previousNav) lines.push('Gap prev→current nav: ' + (currentNav.at - previousNav.at) + 'ms')
		if (routeSubtree) lines.push('Route subtree: <' + routeSubtree + '>')
		if (nullElPath) lines.push('Null-el path: ' + nullElPath)
		if (lines.length) navTrace = '\n\n' + lines.join('\n')
	} catch { /* empty */ }

	let instrTrace = ''
	try {
		const now = Date.now()
		const lastReload = parseInt(sessionStorage.getItem('parentNode-reload-at') || '0', 10)
		const reloadAge = lastReload ? (now - lastReload) + 'ms' : 'never'
		const seq = recentEvents.map(ev => ev.kind + ' +' + (now - ev.t) + 'ms' + (ev.msg ? ' ' + ev.msg : '')).join('\n  ')
		instrTrace = '\n\nSince last auto-reload: ' + reloadAge +
			'\nDropped since last report: ' + droppedSinceLastReport +
			'\nRecent events (oldest→newest):\n  ' + seq
		droppedSinceLastReport = 0
	} catch { /* empty */ }

	// Signaux d'interférence DOM externe, seulement pour la famille corruption-DOM
	// (crashs de patch sur un el null : cause probable = moteur de traduction/extension).
	const isCorruption = isDomCorruptionCrash(e?.message || '')
	const interference = isCorruption ? detectDOMInterference() : { text: '', translation: false }
	const domInterference = interference.text

	const stack = (e?.stack || '(no stack)') + '\n\nOrigin: ' + origin + '\nVue info: ' + infoAny + componentTrace + navTrace + instrTrace + domInterference + firstCrashTrace
	const build_date = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null
	const build_commit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null
	// Crash de patch Vue AVEC un moteur de traduction actif (goog-te-dom, <font> injectés…) :
	// induit de l'extérieur, irréparable côté app et déjà couvert par le hard reload de
	// récupération ci-dessous. On le logge en MASQUÉ (hidden) pour mesurer son volume sans
	// créer d'issue GitHub ni noyer #admin/errors. Sans marqueur de traduction, on garde le
	// rapport complet : un nextSibling/parentNode null « nu » peut être un vrai bug applicatif.
	const hidden = isCorruption && interference.translation
	LeekWars.post('error/report', { error, stack, file, locale, user_agent, build_date, build_commit, hidden })

	// Récupération après corruption de l'arbre de vnodes (un el devenu null : Vue re-render
	// fait alors parentNode/nextSibling/style(null) → crash, et la session crashe en BOUCLE).
	// Le reset par routerViewKey++ (essayé 06/2026) NE RÉCUPÈRE PAS : observé en prod via
	// l'instrumentation #4163, la session crashe en boucle 4+ min malgré les bumps. On revient
	// au HARD RELOAD (le comportement d'avant le 11/06), qui repart d'un arbre Vue sain. Délai
	// court pour laisser le POST error/report partir ; cooldown 30s anti-boucle de reload.
	if (isCorruption) {
		const RELOAD_KEY = 'parentNode-reload-at'
		const last = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10)
		if (Date.now() - last > 30_000) {
			recordEvent('reload', '')
			sessionStorage.setItem(RELOAD_KEY, Date.now().toString())
			setTimeout(() => location.reload(), 400)
		}
	}
}

export function createSubApp(component: Component, props?: Record<string, unknown>, origin: string = 'sub-app'): VueApp {
	const subApp = createApp(component, props)
	subApp.config.errorHandler = (err, vm, info) => reportVueError(err, vm, info, origin)
	subApp.use(vuetify)
	subApp.use(i18n)
	subApp.use(store)
	subApp.use(router)
	subApp.mixin({ data() { return { LeekWars } } })
	return subApp
}

let secondInterval: ReturnType<typeof setInterval> | null = null, minuteInterval: ReturnType<typeof setInterval> | null = null

const app = createApp({
	data() {
		return { savedPosition: 0 }
	},
	render() {
		if (location.pathname === '/full-console') {
			return h(Console)
		}
		return h(App)
	},
	created() {
		window.addEventListener('keydown', (event) => {
			emitter.emit('keydown', event)
			if (event.ctrlKey && event.shiftKey && event.keyCode === 83) {
				emitter.emit('ctrlShiftS')
			} else if (event.ctrlKey && event.keyCode === 83) {
				emitter.emit('ctrlS')
				event.preventDefault()
			} else if (event.ctrlKey && event.keyCode === 81) {
				emitter.emit('ctrlQ')
			} else if (event.ctrlKey && event.keyCode === 70 && !event.shiftKey) {
				emitter.emit('ctrlF', event)
			} else if (event.keyCode === 27) {
				emitter.emit('escape')
			} else if (event.altKey && event.which === 37) {
				emitter.emit('previous', event)
			} else if (event.altKey && event.which === 39) {
				emitter.emit('next', event)
			} else if (event.ctrlKey && event.keyCode === 80) {
				if (event.shiftKey) {
					emitter.emit('ctrlShiftP', event)
				} else {
					emitter.emit('ctrlP', event)
				}
			}
		})
		window.addEventListener('keyup', (event) => {
			emitter.emit('keyup', event)
		})
		window.addEventListener('mousemove', (event) => {
			emitter.emit('mousemove', event)
		})
		window.addEventListener('mouseup', (event) => {
			emitter.emit('mouseup', event)
		})
		LeekWars.mobile = LeekWars.isMobile()
		window.addEventListener('resize', () => {
			emitter.emit('resize')
			LeekWars.mobile = LeekWars.isMobile()
		})
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			// console.log("Change dark mode", event.matches)
			if (LeekWars.themeSetting === 'auto') {
				LeekWars.darkMode = event.matches
			}
		});

		LeekWars.xpCursorsInit()

		const startIntervals = () => {
			secondInterval = setInterval(() => {
				LeekWars.timeSeconds = (Date.now() / 1000) | 0 - LeekWars.timeDelta
			}, 1000)
			minuteInterval = setInterval(() => {
				LeekWars.time = (Date.now() / 1000) | 0 - LeekWars.timeDelta
			}, 1000 * 60)
		}
		startIntervals()

		window.addEventListener('blur', () => {
			// console.log("onblur")
			if (secondInterval) clearInterval(secondInterval)
			if (minuteInterval) clearInterval(minuteInterval)
			LeekWars.clearIntervals()
		})
		window.addEventListener('focus', () => {
			// console.log("onfocus")
			emitter.emit('focus')
			startIntervals()
			LeekWars.startIntervals()
		})
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				LeekWars.socket.checkAlive()
			}
		})
		window.addEventListener('click', () => {
			emitter.emit('htmlclick')
		})

		// Ignore Monaco "Canceled" errors (normal behavior when switching files/canceling operations)
		window.addEventListener('unhandledrejection', (event) => {
			if (event.reason?.message === 'Canceled' || event.reason?.message === 'Model not found') {
				reportHidden(event.reason.message, event.reason.stack)
				event.preventDefault()
			}
		})

		emitter.on('loaded', () => {
			nextTick(() => {
				// console.log("loaded", this.$data.savedPosition)
				if (router.currentRoute?.value.hash) {
					scroll_to_hash(router.currentRoute?.value.hash, router.currentRoute.value)
				} else if (this.$data.savedPosition > 0) {
					// window.scrollTo(0, this.$data.savedPosition)
					setTimeout(() => {
						window.scrollTo(0, this.$data.savedPosition)
						this.$data.savedPosition = 0
					})
				}
			})
		})
		emitter.on('connected', () => {
			LeekWars.socket.reconnect()
		})
		
		window.onbeforeunload = () => {
			const matched = router.currentRoute.value?.matched[0]
			if (matched) {
				const component = matched.instances?.default
				if (!component) return
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const beforeRouteLeave = (component.$options as any).beforeRouteLeave
				if (beforeRouteLeave) {
					if (!beforeRouteLeave[0].bind(component)()) { return "Confirm" }
				}
			}
			LeekWars.unload()
		}

		LeekWars.sfwInit()
		LeekWars.setFavicon()
		LeekWars.initChats()

		if (!LeekWars.LOCAL) {
			displayWarningMessage()
		}
	}
})

app.config.errorHandler = (err, vm, info) => reportVueError(err, vm, info, 'main')

app.use(router)
app.use(i18n)
app.use(store)
app.use(vuetify)

// vue-i18n composition mode: $t injecté via globalInjection est lié au composer
// global. Les messages des composants sont mergés dans le global de deux façons:
// (a) un-namespaced — fait fonctionner $t / <i18n-t> tels quels mais collisions
//     possibles entre composants (ex: 40 composants ont une clé `title`)
// (b) sous {namespace} — résolu par les wrappers ci-dessous, qui privilégient
//     toujours la version du composant courant pour éviter les collisions.
const composer = i18n.global as unknown as {
	t: (...args: unknown[]) => string
	te: (key: string, locale?: string) => boolean
}
const tFn = composer.t.bind(composer)
const teFn = composer.te.bind(composer)

function namespaceFor(rawName: string | undefined): string | null {
	return rawName ? normalizeComponentName(rawName) : null
}

function resolveKey(vm: unknown, key: string): string {
	const ns = namespaceFor((vm as { $options?: { name?: string } } | undefined)?.$options?.name)
	if (ns) {
		const namespaced = ns + '.' + key
		if (teFn(namespaced)) return namespaced
	}
	return key
}

const props = app.config.globalProperties as Record<string, unknown>
props.$t = function(this: unknown, key: string, ...args: unknown[]): string {
	return tFn(resolveKey(this, key), ...args)
}
props.$te = function(this: unknown, key: string): boolean {
	const ns = namespaceFor((this as { $options?: { name?: string } } | undefined)?.$options?.name)
	if (ns && teFn(ns + '.' + key)) return true
	return teFn(key)
}
props.$tc = function(this: unknown, key: string, choice?: number, values?: unknown): string {
	const resolved = resolveKey(this, key)
	if (choice === undefined) return tFn(resolved)
	if (values === undefined) return tFn(resolved, choice)
	return tFn(resolved, values, choice)
}

// <i18n-t> de vue-i18n appelle directement le composer global (bypass notre $t).
// Wrapper qui tente chaque ancêtre nommé jusqu'à trouver la clé (évite les faux
// positifs quand un composant layout comme <panel> est entre <i18n-t> et la page).
const I18nTWrapper = defineComponent({
	name: 'i18n-t',
	inheritAttrs: false,
	setup(_props, { attrs, slots }) {
		const namespaces: string[] = []
		let cur = getCurrentInstance()?.parent
		while (cur) {
			const rawName = (cur.type as { name?: string } | undefined)?.name
			if (rawName) namespaces.push(normalizeComponentName(rawName))
			cur = cur.parent
		}
		return () => {
			const keypath = attrs.keypath as string | undefined
			let finalAttrs = attrs
			if (keypath) {
				for (const ns of namespaces) {
					const namespaced = ns + '.' + keypath
					if (teFn(namespaced)) { finalAttrs = { ...attrs, keypath: namespaced }; break }
				}
			}
			return h(Translation as unknown as Component, { scope: 'global', ...finalAttrs }, slots)
		}
	}
})
// Override vue-i18n's built-in i18n-t with our namespace-aware wrapper.
// Delete first to avoid Vue's "already registered" dev warning.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (app as any)._context.components['i18n-t']
app.component('i18n-t', I18nTWrapper)

app.mixin({
	data() {
		return { LeekWars }
	},
	created() {
		this.env = env
	}
})

app.component('leek-image', LeekImage)
app.component('trophy-icon', TrophyIcon)
app.component('avatar', Avatar)
app.component('emblem', Emblem)
app.component('talent', Talent)
app.component('ranking-badge', RankingBadge)
app.component('notification', NotificationElement)
app.component('lw-code', Code)
app.component('error', Error)
app.component('panel', Panel)
app.component('popup', Popup)
app.component('loader', LWLoader)
app.component('flag', Flag)

app.directive('autostopscroll', {
	mounted: (el, binding) => {
		const top = binding.value === 'top' || !binding.value
		const bottom = binding.value === 'bottom' || !binding.value
		el.addEventListener("wheel", (e: WheelEvent) => {
			if ((top && e.deltaY < 0 && el.scrollTop === 0) || (bottom && e.deltaY > 0 && Math.abs(el.scrollTop - (el.scrollHeight - el.offsetHeight)) < 1)) {
				e.preventDefault()
			}
		})
	}
})

const code = {
	mounted: (el: HTMLElement) => {
		el.querySelectorAll('code').forEach((c: Element) => {
			createSubApp(Code, { code: (c as HTMLElement).innerText }, 'v-code').mount(c)
		})
	}
}

app.directive('code', code)

app.directive('single-code', {
	mounted: (el: HTMLElement) => {
		el.querySelectorAll('code').forEach((c: Element) => {
			createSubApp(Code, { code: (c as HTMLElement).innerText, single: true, theme: 'auto' }, 'v-single-code').mount(c)
		})
	}
})

app.directive('latex', {
	mounted: (el: HTMLElement) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/, (str: string) => {
			return "<latex>" + str + "</latex>"
		})
		el.querySelectorAll('latex').forEach((c: Element) => {
			Latex.latexify(c.innerHTML).then(result => {
				c.innerHTML = result
			})
		})
	}
})

app.directive('chat-code-latex', {
	mounted: (el: HTMLElement) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/g, (str: string, content: string) => {
			// Skip if the captured content already contains HTML tags (e.g. linkified URL)
			if (/<\w/.test(content)) return str
			return "<latex>" + str.replace(/`/g, "") + "</latex>"
		})
		el.innerHTML = el.innerHTML.replace(/```(.*?)```/g, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.innerHTML = el.innerHTML.replace(/`(.*?)`/g, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.querySelectorAll('code').forEach((c: Element) => {
			let props
			if (c.innerHTML.indexOf("<br>") !== -1) {
				let code = LeekWars.decodehtmlentities(c.innerHTML).replace(/<br>/gi, "\n").replace(/^\n+|\n+$/g, '')
				// Langage optionnel sur la 1re ligne (```js, ```python, ...), à la Markdown :
				// on ne retire la ligne que si le jeton correspond à un langage connu.
				let language: string | undefined
				const firstBreak = code.indexOf("\n")
				if (firstBreak > 0) {
					const firstLine = code.slice(0, firstBreak).trim()
					if (LeekWars.codeLanguageMode(firstLine)) {
						language = firstLine
						code = code.slice(firstBreak + 1)
					}
				}
				props = { code, expandable: true, language }
			} else {
				props = { code: c.textContent || '', single: true }
			}
			const vm = createSubApp(Code, props, 'v-chat-code-latex').mount(c)
			c.replaceWith(vm.$el)
		})
		el.querySelectorAll('latex').forEach((c: Element) => {
			Latex.latexify(c.innerHTML).then(result => {
				c.innerHTML = result
			})
		})
		el.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
			const href = a.getAttribute('href')
			if (href && href.startsWith('/') ) {
				a.onclick = (e: Event) => {
					e.stopPropagation()
					e.preventDefault()
					if (a.innerText === a.getAttribute('href')) {
						router.push(a.innerText)
					} else {
						router.push(a.getAttribute('href')!)
					}
					return false
				}
			}
		})
	}
})

const dochash = {
	mounted: (el: HTMLElement) => {
		el.innerHTML = el.innerHTML.replace(/#(\w+)/g, (a: string, b: string) => {
			return "<a href='/help/documentation/" + b + "'>" + b + "</a>"
		})
		el.querySelectorAll('a').forEach((a: HTMLAnchorElement) => {
			a.onclick = (e: Event) => {
				e.stopPropagation()
				e.preventDefault()
				emitter.emit('doc-navigate', a.innerText)
				return false
			}
		})
	}
}

app.directive('dochash', dochash)

// ⚠️ N'utiliser v-emojis QUE sur un élément en v-html (contenu opaque pour Vue).
// Sur des enfants trackés par Vue (interpolation {{ }} ou v-text), le replaceChild
// ci-dessous désynchronise vnode.el → crash "parentNode of null" (#4163).
// Pour du texte brut tracké, utiliser formatEmojisText(...) en v-html à la place.
app.directive('emojis', (el: HTMLElement) => {
	el.childNodes.forEach((child: ChildNode) => {
		if (child.nodeType === Node.TEXT_NODE) {
			const html = formatEmojis(LeekWars.protect((child as Text).wholeText))
			const template = document.createElement('span')
			template.innerHTML = html
			el.replaceChild(template, child)
		}
	})
})

app.config.globalProperties.$filters = {
	number: LeekWars.formatNumber,
	date: LeekWars.formatDate,
	datetime: LeekWars.formatDateTime,
	timeseconds: LeekWars.formatTimeSeconds,
	time: LeekWars.formatTime,
	duration: LeekWars.formatDuration,
}

// Charger les données de jeu AVANT le mount Vue. Si on monte avec un dataset
// vide/incomplet, l'app crashe à des endroits aléatoires (ex: signup avec
// LeekWars.hats vide). Mieux vaut afficher un écran d'erreur explicite.
try {
	await loadGameData()
} catch (e) {
	const root = document.getElementById('app2')
	const tpl = document.getElementById('app-data-error') as HTMLTemplateElement | null
	if (root && tpl) {
		root.replaceChildren(tpl.content.cloneNode(true))
	}
	// Re-throw : indispensable pour stopper la suite (sinon app.mount('#app2') écraserait l'UI d'erreur).
	throw e
}

const vm = app.mount('#app2') as ComponentPublicInstance & {
	$once: (event: string, callback: () => void) => void
	$emit: (event: string, ...args: unknown[]) => void
}
setVueMain(vm)

// Firefox : le chargement natif loading="lazy" est peu fiable sur les pages à
// forte densité d'images (trophées d'éleveur, marché). Les images restent non
// chargées, même dans le viewport (plaintes joueurs 06/2026). On force eager en
// passant l'attribut lazy à eager dès qu'une image entre dans le DOM (couvre les
// trophées rendus en asynchrone). Firefox uniquement : Chrome gère bien le lazy
// natif et conserve le gain de bande passante.
if (LeekWars.firefox) {
	const eagerify = (root: ParentNode) => {
		(root as Element).querySelectorAll?.('img[loading="lazy"]').forEach((img) => img.setAttribute('loading', 'eager'))
	}
	eagerify(document)
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) continue
				const el = node as Element
				if (el.tagName === 'IMG') {
					if (el.getAttribute('loading') === 'lazy') el.setAttribute('loading', 'eager')
				} else {
					eagerify(el)
				}
			}
		}
	}).observe(document.body, { childList: true, subtree: true })
}

// Restore saved locale in dev/local mode
if (LeekWars.DEV || LeekWars.LOCAL) {
	const savedLocale = localStorage.getItem('locale')
	if (savedLocale && savedLocale !== i18n.locale) {
		loadLanguageAsync(vm, savedLocale)
	}
}

// Instrumentation #4163 : tracer le DÉPART de chaque navigation dans le buffer, pour révéler
// les navigations rapprochées/interrompues (hypothèse : RouterView met à jour pendant le
// démontage de la page précédente → oldSubTree.el null → crash). beforeEach = capture aussi
// les navs qui n'aboutissent pas (redirect, annulation), invisibles dans afterEach.
router.beforeEach((to) => {
	recordEvent('nav-start', to.fullPath)
	return true
})

router.afterEach((to, _from, failure) => {
	// failure.type : 4=duplicated (push vers la route courante), 2=aborted, 8/16=redirect.
	// Un nav-done SANS nav-start = nav qui a sauté beforeEach → ce type le caractérise (#4163).
	recordEvent('nav-done' + (failure ? '✗' + ((failure as { type?: number }).type ?? '?') : ''), to.fullPath)
	previousNav = currentNav
	currentNav = {
		fullPath: to.fullPath,
		name: typeof to.name === 'string' ? to.name : (to.name ? String(to.name) : null),
		at: Date.now(),
	}

	if (to.hash) {
		setTimeout(() => {
			scroll_to_hash(to.hash, to)
		}, 100)
	}

	app.config.globalProperties.$root?.$emit?.('navigate')
})

if (window.__FARMER__) {
	store.commit('connect', {...window.__FARMER__, token: '$'})
} else {
	const token = LeekWars.DEV ? localStorage.getItem('token') : '$'
	if (localStorage.getItem('connected') === 'true') {
		store.commit('connected', token)
		const initialPath = window.location.pathname + window.location.search + window.location.hash
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {...data, token})
		}).error(() => {
			store.commit('disconnect')
			if (initialPath !== '/') {
				sessionStorage.setItem('redirect_after_login', initialPath)
			}
			router.push('/login')
		})
	} else if (localStorage.getItem('login-attempt') === 'true') {
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {...data, token})
			const redirect = getRedirectAfterLogin()
			if (redirect !== '/') {
				router.push(redirect)
			}
		})
	}
}

export { emitter, dochash, code }