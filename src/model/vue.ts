import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Console from '@/component/app/console.vue'
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
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router from '@/router'
import Vue from 'vue'
import { Latex } from './latex'
import { Route } from 'vue-router'
import { scroll_to_hash } from '@/router-functions'

import Vuetify from 'vuetify/lib'
import Ripple from 'vuetify/lib/directives/ripple'
Vue.use(Vuetify, {
	theme: { dark: true },
	directives: {
		Ripple
	}
})

import tooltip from '@/vtooltip-fast'
Vue.component('tooltip', tooltip)

import { createSimpleTransition } from 'vuetify/lib/components/transitions/createTransition'
import '../fade-transition.sass'
const myTransition = createSimpleTransition('my-transition')
Vue.component('my-transition', myTransition)

Vue.config.productionTip = false

Vue.mixin({
	data() {
		return { LeekWars }
	},
	created() {
		this.env = env
	}
})

Vue.filter('number', LeekWars.formatNumber)
Vue.filter('date', LeekWars.formatDate)
Vue.filter('datetime', LeekWars.formatDateTime)
Vue.filter('timeseconds', LeekWars.formatTimeSeconds)
Vue.filter('time', LeekWars.formatTime)
Vue.filter('duration', LeekWars.formatDuration)

Vue.component('leek-image', LeekImage)
Vue.component('avatar', Avatar)
Vue.component('emblem', Emblem)
Vue.component('talent', Talent)
Vue.component('ranking-badge', RankingBadge)
Vue.component('notification', NotificationElement)
Vue.component('lw-code', Code)
Vue.component('error', Error)
Vue.component('panel', Panel)
Vue.component('popup', Popup)
Vue.component('loader', LWLoader)
Vue.component('flag', Flag)

Vue.directive('autostopscroll', {
	inserted: (el, binding) => {
		const top = binding.value === 'top' || !binding.value
		const bottom = binding.value === 'bottom' || !binding.value
		el.addEventListener("wheel", (e: WheelEvent) => {
			if ((top && e.deltaY < 0 && el.scrollTop === 0) || (bottom && e.deltaY > 0 && Math.abs(el.scrollTop - (el.scrollHeight - el.offsetHeight)) < 1)) {
				e.preventDefault()
			}
		})
	}
})


Vue.directive('code', {
	inserted: (el) => {
		el.querySelectorAll('code').forEach((c) => {
			new Code({ propsData: { code: (c as HTMLElement).innerText }, parent: vueMain }).$mount(c)
		})
	}
})

Vue.directive('latex', {
	inserted: (el) => {
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

Vue.directive('chat-code-latex', {
	inserted: (el) => {
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
				new Code({ propsData: { code, expandable: true }, parent: vueMain }).$mount(c)
			} else {
				new Code({ propsData: { code: c.innerText, single: true }, parent: vueMain }).$mount(c)
			}
		})
		el.querySelectorAll('latex').forEach((c) => {
			Latex.latexify(c.innerHTML).then(result => {
				c.innerHTML = result
			})
		})
	}
})

Vue.directive('dochash', (el) => {
	el.innerHTML = el.innerHTML.replace(/#(\w+)/g, (a, b) => {
		return "<a href='/help/documentation/" + b + "'>" + b + "</a>"
	})
	el.querySelectorAll('a').forEach(a => {
		a.onclick = (e: Event) => {
			e.stopPropagation()
			e.preventDefault()
			vueMain.$emit('doc-navigate', a.innerText)
			return false
		}
	})
})

function displayWarningMessage() {
	const style = "color: black; font-size: 13px; font-weight: bold;"
	const styleRed = "color: red; font-size: 14px; font-weight: bold;"
	console.log("%c" + i18n.t('main.console_alert_1'), style)
	console.log("%c" + i18n.t('main.console_alert_2'), styleRed)
	console.log("%c" + i18n.t('main.console_alert_3'), style)
	console.log("")
	console.log("%c✔️ " + i18n.t('main.console_github'), style)
	console.log("")
}

let lastErrorSent = 0

let secondInterval: any = null, minuteInterval: any = null

const vuetify = new Vuetify()

const vueMain = new Vue({
	router, i18n, store,
	data: { savedPosition: 0 },
	vuetify,
	render: (h) => {
		if (location.pathname === '/console') {
			return h(Console)
		}
		return h(App)
	},
	created() {
		window.addEventListener('keydown', (event) => {
			this.$emit('keydown', event)
			if (event.ctrlKey && event.shiftKey && event.keyCode === 83) {
				this.$emit('ctrlShiftS')
			} else if (event.ctrlKey && event.keyCode === 83) {
				this.$emit('ctrlS')
				event.preventDefault()
			} else if (event.ctrlKey && event.keyCode === 81) {
				this.$emit('ctrlQ')
			} else if (event.ctrlKey && event.keyCode === 70 && !event.shiftKey) {
				this.$emit('ctrlF', event)
			} else if (event.keyCode === 27) {
				this.$emit('escape')
			} else if (event.altKey && event.which === 37) {
				this.$emit('previous', event)
			} else if (event.altKey && event.which === 39) {
				this.$emit('next', event)
			} else if (event.ctrlKey && event.keyCode === 80) {
				this.$emit('ctrlP', event)
			}
		})
		window.addEventListener('keyup', (event) => {
			this.$emit('keyup', event)
		})
		LeekWars.mobile = LeekWars.isMobile()
		window.addEventListener('resize', () => {
			this.$emit('resize')
			LeekWars.mobile = LeekWars.isMobile()
		})

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
			if (secondInterval) clearInterval(secondInterval)
			if (minuteInterval) clearInterval(minuteInterval)
			LeekWars.clearIntervals()
		})
		window.addEventListener('focus', () => {
			this.$emit('focus')
			startIntervals()
			LeekWars.startIntervals()
		})
		window.addEventListener('click', () => {
			this.$emit('htmlclick')
		})

		this.$on('loaded', () => {
			Vue.nextTick(() => {
				// console.log("loaded", this.$data.savedPosition)
				if (this.$data.savedPosition > 0) {
					// window.scrollTo(0, this.$data.savedPosition)
					setTimeout(() => {
						window.scrollTo(0, this.$data.savedPosition)
						this.$data.savedPosition = 0
					})
				}
			})
		})
		this.$on('connected', () => {
			LeekWars.socket.connect()
		})
		window.onbeforeunload = () => {
			const component = router.currentRoute.matched[0].instances.default
			const beforeRouteLeave = (component.$options as any).beforeRouteLeave
			if (beforeRouteLeave) {
				if (!beforeRouteLeave[0].bind(component)()) { return "Confirm" }
			}
		}

		LeekWars.sfwInit()
		LeekWars.setFavicon()
		LeekWars.initChats()

		displayWarningMessage()
	},

	errorCaptured(err, vm, info) {

		if (LeekWars.DEV) return

		if (Date.now() - lastErrorSent < 1000) return
		lastErrorSent = Date.now()

		const error = err.name + ": " + err.message
		const file = document.location.href
		const stack = err.stack + '\n' + info
		const locale = i18n.locale

		LeekWars.post('error/report', { error, stack, file, locale })
	}
}).$mount('#app')

router.afterEach((to: Route) => {
	if (to.hash) {
		vueMain.$once('loaded', () => {
			setTimeout(() => {
				scroll_to_hash(to.hash, to)
			}, 100)
		})
	}

	vueMain.$emit('navigate')
})

if (window.__FARMER__) {
	store.commit('connect', {...window.__FARMER__, token: '$'})
} else {
	const token = LeekWars.DEV ? localStorage.getItem('token') : '$'
	if (localStorage.getItem('connected') === 'true') {
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {...data, token})
		}).error(() => {
			store.commit('disconnect')
			router.push('/')
		})
	} else if (localStorage.getItem('login-attempt') === 'true') {
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {...data, token})
		})
	}
}

export { vueMain, vuetify, displayWarningMessage }