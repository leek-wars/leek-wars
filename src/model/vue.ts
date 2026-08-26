// BOOTSTRAP de l'application : ce module s'exécute pour ses effets de bord (app.use(router),
// router.beforeEach, store.commit…). Il doit rester une RACINE du graphe d'imports, importé
// par le seul main.ts — c'est vérifié par model/vue.test.ts, qui explique pourquoi.
// ⚠️ Ne rien exporter d'ici : ce qui doit être importable par un composant vit dans son propre
// module (emitter, sub-app, directives, error-report, vuetify).
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
import type { Component, ComponentPublicInstance } from 'vue'
import { Translation } from 'vue-i18n'
import { Latex } from './latex'
import { scroll_to_hash } from '@/router-functions'

import { vuetify } from './vuetify'
import { code, dochash, splitCodeLanguage } from './directives'
import { installGlobalErrorHandlers, recordEvent, recordNavigation, reportVueError } from './error-report'
import { createSubApp } from './sub-app'
import { formatEmojis } from './emojis'
import { displayWarningMessage, emitter, setVueMain } from './emitter'
import '@/chart'

const Console = defineAsyncComponent(() => import('@/component/app/console.vue'))

installGlobalErrorHandlers()

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
				// Avant checkAlive() : celui-ci rebranche la socket sur le compte du
				// cookie, qui peut avoir changé pendant que l'onglet était en veille.
				emitter.emit('visible')
				LeekWars.socket.checkAlive()
			}
		})
		window.addEventListener('click', () => {
			emitter.emit('htmlclick')
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
				const raw = LeekWars.decodehtmlentities(c.innerHTML).replace(/<br>/gi, "\n").replace(/^\n+|\n+$/g, '')
				// Langage optionnel sur la 1re ligne (```js, ```python, ...) : cf. splitCodeLanguage.
				const { code, language } = splitCodeLanguage(raw, c)
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
	recordNavigation(to.fullPath, typeof to.name === 'string' ? to.name : (to.name ? String(to.name) : null))

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
