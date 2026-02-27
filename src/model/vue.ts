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
import { LeekWars } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router, { getRedirectAfterLogin } from '@/router'
import { createApp, defineAsyncComponent, h, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { Latex } from './latex'
import { scroll_to_hash } from '@/router-functions'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { formatEmojis } from './emojis'
import mitt from 'mitt'
import { Farmer } from './farmer'
import '@/chart'

const Console = defineAsyncComponent(() => import('@/component/app/console.vue'))

const vuetify = createVuetify({
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

function displayWarningMessage() {
	const style = "color: black; font-size: 13px; font-weight: bold;"
	const styleRed = "color: red; font-size: 14px; font-weight: bold;"
	console.log("%c" + i18n.global.t('main.console_alert_1'), style)
	console.log("%c" + i18n.global.t('main.console_alert_2'), styleRed)
	console.log("%c" + i18n.global.t('main.console_alert_3'), style)
	console.log("")
	console.log("%c✔️ " + i18n.global.t('main.console_github'), style)
	console.log("")
}

// Handle Vite CSS/JS preload errors after deployment (stale hashed assets)
// The guard flag prevents infinite reload loops if the error persists after reload.
// It is cleared on successful page load so that future deploys can trigger a reload again.
const PRELOAD_RELOAD_KEY = 'vite-preload-reload'
window.addEventListener('vite:preloadError', () => {
	if (!sessionStorage.getItem(PRELOAD_RELOAD_KEY)) {
		sessionStorage.setItem(PRELOAD_RELOAD_KEY, '1')
		window.location.reload()
	}
})
// Clear the guard once the page has loaded successfully (assets are fresh)
window.addEventListener('load', () => {
	sessionStorage.removeItem(PRELOAD_RELOAD_KEY)
})

let lastErrorSent = 0

let secondInterval: any = null, minuteInterval: any = null

type Events = {
	keydown: KeyboardEvent
	ctrlShiftS: void
	ctrlS: void
	ctrlQ: void
	ctrlF: KeyboardEvent
	escape: void
	previous: KeyboardEvent
	next: KeyboardEvent
	ctrlP: KeyboardEvent
	keyup: KeyboardEvent
	resize: void
	focus: void
	htmlclick: void
	loaded: void
	connected: Farmer
	back: void
	chat: any
	'chat-history': any
	wsconnected: void
	tooltip: { x: number, y: number, content: string }
	'tooltip-close': void
	'editor-drag': any
	'tournament-update': any
	trophy: any
	fight_notification: any
	wsmessage: { type: number, data: any, id: number | null },
	mousemove: any,
	mouseup: any,
	jump: { ai: AI, line: number, column: number },
	navigate: void,
}

const emitter = mitt<Events>()

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
				LeekWars.socket.connect()
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
					scroll_to_hash(router.currentRoute?.value.hash, router.currentRoute)
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
			const component = router.currentRoute.matched[0].instances.default
			const beforeRouteLeave = (component.$options as any).beforeRouteLeave
			if (beforeRouteLeave) {
				if (!beforeRouteLeave[0].bind(component)()) { return "Confirm" }
			}
			LeekWars.unload()
		}

		LeekWars.sfwInit()
		LeekWars.setFavicon()
		LeekWars.initChats()

		if (!LeekWars.LOCAL) {
			displayWarningMessage()
		}
	},

	errorCaptured(err: any, vm: any, info: any) {

		if (LeekWars.DEV) return

		// Ignore chunk loading errors (handled by router.onError / vite:preloadError with page reload)
		if (err.message?.includes('Failed to fetch dynamically imported module') ||
			err.message?.includes('Loading chunk') ||
			err.message?.includes('Loading CSS chunk') ||
			err.message?.includes('Unable to preload CSS')) {
			return
		}

		if (Date.now() - lastErrorSent < 1000) return
		lastErrorSent = Date.now()

		const error = err.name + ": " + err.message
		const file = document.location.href
		const stack = err.stack + '\n' + info
		const locale = i18n.global.locale

		LeekWars.post('error/report', { error, stack, file, locale })
	}
})

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
	mounted: (el) => {
		el.querySelectorAll('code').forEach((c) => {
			const codeApp = createApp(Code, { code: (c as HTMLElement).innerText })
			codeApp.use(vuetify)
			codeApp.use(i18n)
			codeApp.use(store)
			codeApp.mount(c)
		})
	}
}

app.directive('code', code)

app.directive('single-code', {
	mounted: (el) => {
		el.querySelectorAll('code').forEach((c) => {
			const codeApp = createApp(Code, { code: (c as HTMLElement).innerText, single: true, theme: 'auto' })
			codeApp.use(vuetify)
			codeApp.use(i18n)
			codeApp.use(store)
			codeApp.mount(c)
		})
	}
})

app.directive('latex', {
	mounted: (el) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/, (str: string) => {
			return "<latex>" + str + "</latex>"
		})
		el.querySelectorAll('latex').forEach((c) => {
			Latex.latexify(c.innerHTML).then(result => {
				c.innerHTML = result
			})
		})
	}
})

app.directive('chat-code-latex', {
	mounted: (el) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/g, (str: string) => {
			return "<latex>" + str.replace(/`/g, "") + "</latex>"
		})
		el.innerHTML = el.innerHTML.replace(/```(.*?)```/g, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.innerHTML = el.innerHTML.replace(/`(.*?)`/g, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.querySelectorAll('code').forEach((c) => {
			if (c.innerHTML.indexOf("<br>") !== -1) {
				const code = LeekWars.decodehtmlentities(c.innerHTML).replace(/<br>/gi, "\n").trim()
				const codeApp = createApp(Code, { code, expandable: true })
				codeApp.use(vuetify)
				codeApp.use(i18n)
				codeApp.use(store)
				codeApp.mount(c)
			} else {
				const codeApp = createApp(Code, { code: c.textContent || '', single: true })
				codeApp.use(vuetify)
				codeApp.use(i18n)
				codeApp.use(store)
				codeApp.mount(c)
			}
		})
		el.querySelectorAll('latex').forEach((c) => {
			Latex.latexify(c.innerHTML).then(result => {
				c.innerHTML = result
			})
		})
		el.querySelectorAll('a').forEach(a => {
			if (a.getAttribute('href')!.startsWith('/') ) {
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
	mounted: (el) => {
		el.innerHTML = el.innerHTML.replace(/#(\w+)/g, (a, b) => {
			return "<a href='/help/documentation/" + b + "'>" + b + "</a>"
		})
		el.querySelectorAll('a').forEach(a => {
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

app.directive('emojis', (el) => {
	el.childNodes.forEach((child) => {
		if (child.nodeType === Node.TEXT_NODE) {
			const html = formatEmojis(LeekWars.protect((child as Text).wholeText))
			const template = document.createElement('span')
			template.innerHTML = html
			el.replaceChild(template, child)
		}
	})
})

const vueMain = app.mount('#app2') as ComponentPublicInstance & {
	$once: (event: string, callback: () => void) => void
	$emit: (event: string, ...args: any[]) => void
}

// Restore saved locale in dev/local mode
if (LeekWars.DEV || LeekWars.LOCAL) {
	const savedLocale = localStorage.getItem('locale')
	if (savedLocale && savedLocale !== i18n.global.locale) {
		loadLanguageAsync(vueMain, savedLocale)
	}
}

router.afterEach((to: any) => {
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
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {...data, token})
		}).error(() => {
			store.commit('disconnect')
			router.push('/')
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

// Register Vue filters after LeekWars is fully initialized
app.config.globalProperties.$filters = {
	number: LeekWars.formatNumber,
	date: LeekWars.formatDate,
	datetime: LeekWars.formatDateTime,
	timeseconds: LeekWars.formatTimeSeconds,
	time: LeekWars.formatTime,
	duration: LeekWars.formatDuration,
}

export { vueMain, vuetify, displayWarningMessage, app, emitter, dochash, code }