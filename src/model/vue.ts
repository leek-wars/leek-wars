import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Error from '@/component/app/error.vue'
import LWLoader from '@/component/app/loader.vue'
import Panel from '@/component/app/panel.vue'
import Avatar from '@/component/avatar.vue'
import Flag from '@/component/flag.vue'
import '@/component/editor/leekscript.scss'
import '@/component/editor/leekscript-monokai.scss'
import Emblem from '@/component/emblem.vue'
import LeekImage from '@/component/leek-image.vue'
import NotificationElement from '@/component/notifications/notification.vue'
import Popup from '@/component/popup.vue'
import RankingBadge from '@/component/ranking-badge.vue'
import Talent from '@/component/talent.vue'
import { env } from '@/env'
import { i18n, loadLanguageAsync } from '@/model/i18n'
import { LeekWars, setRouter, loadGameData } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router, { getRedirectAfterLogin } from '@/router'
import { createApp, defineAsyncComponent, h, nextTick } from 'vue'
import type { App as VueApp, ComponentPublicInstance } from 'vue'
import { Latex } from './latex'
import { scroll_to_hash } from '@/router-functions'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { aliases as mdiSvgAliases } from 'vuetify/iconsets/mdi-svg'
import { mdiIconSet } from './icon-set'
import { formatEmojis } from './emojis'
import { displayWarningMessage, emitter, setVueMain } from './emitter'
import '@/chart'

const Console = defineAsyncComponent(() => import('@/component/app/console.vue'))

const vuetify = createVuetify({
	icons: {
		defaultSet: 'mdi',
		aliases: mdiSvgAliases,
		sets: { mdi: mdiIconSet },
	},
	theme: {
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

window.addEventListener('vite:preloadError', reloadWithCacheBust)

// Suppress Monaco internal error when hovering markers on a disposed editor
window.addEventListener('error', (event) => {
	if (event.error?.message?.includes('InstantiationService has been disposed')) {
		event.preventDefault()
	}
})

let lastErrorSent = 0

interface NavSnapshot {
	fullPath: string
	name: string | null
	at: number
}
let previousNav: NavSnapshot | null = null
let currentNav: NavSnapshot | null = null

function describeRouteSubtree(instance: any): string | null {
	try {
		let node = instance?.subTree
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
	} catch {}
	return null
}

export function reportVueError(err: any, vm: any, info: any, origin: string = 'main') {

	if (LeekWars.DEV) return

	if (err?.message?.includes('Failed to fetch dynamically imported module') ||
		err?.message?.includes('Loading chunk') ||
		err?.message?.includes('Loading CSS chunk') ||
		err?.message?.includes('Unable to preload CSS')) {
		return
	}

	if (info?.includes?.('runtime-13')) {
		reloadWithCacheBust()
		return
	}

	if (Date.now() - lastErrorSent < 1000) return
	lastErrorSent = Date.now()

	const error = (err?.name || 'Error') + ": " + (err?.message || String(err))
	const file = document.location.href
	const locale = i18n.global.locale
	const user_agent = navigator.userAgent

	let componentTrace = ''
	let routeSubtree: string | null = null
	try {
		if (vm) {
			const components: string[] = []
			// errorCaptured passes a public proxy (.$ → internal instance); app.config.errorHandler
			// passes the internal instance directly. Handle both.
			let instance = vm.$ || vm
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
			}
		}
	} catch (e) {
		componentTrace = '\n\n[Component trace failed: ' + (e as Error).message + ']'
	}

	let navTrace = ''
	try {
		const lines: string[] = []
		if (currentNav) lines.push('Route: ' + currentNav.fullPath + (currentNav.name ? ' [' + currentNav.name + ']' : ''))
		if (previousNav) lines.push('Previous route: ' + previousNav.fullPath + (previousNav.name ? ' [' + previousNav.name + ']' : ''))
		if (currentNav) lines.push('Since last navigation: ' + (Date.now() - currentNav.at) + 'ms')
		if (routeSubtree) lines.push('Route subtree: <' + routeSubtree + '>')
		if (lines.length) navTrace = '\n\n' + lines.join('\n')
	} catch {}

	const stack = (err?.stack || '(no stack)') + '\n\nOrigin: ' + origin + '\nVue info: ' + info + componentTrace + navTrace
	const build_date = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : null
	const build_commit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : null
	LeekWars.post('error/report', { error, stack, file, locale, user_agent, build_date, build_commit })
}

export function createSubApp(component: any, props?: any, origin: string = 'sub-app'): VueApp {
	const subApp = createApp(component, props)
	subApp.config.errorHandler = (err, vm, info) => reportVueError(err, vm, info, origin)
	subApp.use(vuetify)
	subApp.use(i18n)
	subApp.use(store)
	subApp.use(router)
	subApp.mixin({ data() { return { LeekWars } } })
	return subApp
}

let secondInterval: any = null, minuteInterval: any = null

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
				emitter.emit('ctrlP', event)
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

setRouter(router)
app.use(router)
app.use(i18n)
app.use(store)
app.use(vuetify)

app.mixin({
	data() {
		return { LeekWars }
	},
	created() {
		this.env = env
	}
})

app.component('leek-image', LeekImage)
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
				const code = LeekWars.decodehtmlentities(c.innerHTML).replace(/<br>/gi, "\n").replace(/^\n+|\n+$/g, '')
				props = { code, expandable: true }
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

// Charger les données de jeu AVANT le mount Vue
await loadGameData().catch(e => console.warn('[GameData] Init failed:', e))

const vm = app.mount('#app2') as ComponentPublicInstance & {
	$once: (event: string, callback: () => void) => void
	$emit: (event: string, ...args: any[]) => void
}
setVueMain(vm)

// Restore saved locale in dev/local mode
if (LeekWars.DEV || LeekWars.LOCAL) {
	const savedLocale = localStorage.getItem('locale')
	if (savedLocale && savedLocale !== i18n.global.locale) {
		loadLanguageAsync(vm, savedLocale)
	}
}

router.afterEach((to: any) => {
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

export { vueMain } from './emitter'
export { vuetify, displayWarningMessage, app, emitter, dochash, code }