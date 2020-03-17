import AIElement from '@/component/app/ai.vue'
import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Console from '@/component/app/console.vue'
import LWLoader from '@/component/app/loader.vue'
import NotFound from '@/component/app/not-found.vue'
import Panel from '@/component/app/panel.vue'
import Avatar from '@/component/avatar.vue'
import ChatElement from '@/component/chat/chat.vue'
import Comments from '@/component/comment/comments.vue'
import Emblem from '@/component/emblem.vue'
import FormattingRules from '@/component/forum/formatting-rules.vue'
import FightHistory from '@/component/history/fight-history.vue'
import FightsHistory from '@/component/history/fights-history.vue'
import TournamentHistory from '@/component/history/tournament-history.vue'
import TournamentsHistory from '@/component/history/tournaments-history.vue'
import LeekImage from '@/component/leek-image.vue'
import ConversationElement from '@/component/messages/conversation.vue'
import ReportDialog from '@/component/moderation/report-dialog.vue'
import NotificationElement from '@/component/notification/notification.vue'
import Pagination from '@/component/pagination.vue'
import Popup from '@/component/popup.vue'
import RichTooltipChip from '@/component/rich-tooltip/rich-tooltip-chip.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipWeapon from '@/component/rich-tooltip/rich-tooltip-weapon.vue'
import Talent from '@/component/talent.vue'
import TitlePicker from '@/component/title/title-picker.vue'
import LWTitle from '@/component/title/title.vue'
import TurretImage from '@/component/turret-image.vue'
import { env } from '@/env'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router from '@/router'
import Vue from 'vue'
import { Latex } from './latex'

import Vuetify from 'vuetify/lib/framework'
Vue.use(Vuetify)

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
Vue.filter('emojis', LeekWars.formatEmojis)
Vue.filter('duration', LeekWars.formatDuration)

Vue.component('leek-image', LeekImage)
Vue.component('turret-image', TurretImage)
Vue.component('avatar', Avatar)
Vue.component('emblem', Emblem)
Vue.component('talent', Talent)
Vue.component('chat', ChatElement)
Vue.component('player', () => import(/* webpackChunkName: "player" */ "@/component/player/player.vue"))
Vue.component('comments', Comments)
Vue.component('report-dialog', ReportDialog)
Vue.component('pagination', Pagination)
if (process.env.VUE_APP_SOCIAL === 'true') {
	Vue.component('formatting-rules', FormattingRules)
}
Vue.component('fight-history', FightHistory)
Vue.component('fights-history', FightsHistory)
Vue.component('tournament-history', TournamentHistory)
Vue.component('tournaments-history', TournamentsHistory)
Vue.component('notification', NotificationElement)
Vue.component('lw-code', Code)
Vue.component('conversation', ConversationElement)
Vue.component('ai', AIElement)
Vue.component('not-found', NotFound)
Vue.component('panel', Panel)
Vue.component('popup', Popup)
Vue.component('rich-tooltip-farmer', RichTooltipFarmer)
Vue.component('rich-tooltip-leek', RichTooltipLeek)
Vue.component('rich-tooltip-weapon', RichTooltipWeapon)
Vue.component('rich-tooltip-chip', RichTooltipChip)
Vue.component('loader', LWLoader)
Vue.component('lw-title', LWTitle)
Vue.component('title-picker', TitlePicker)

Vue.directive('autostopscroll', {
	inserted: (el, binding) => {
		const top = binding.value === 'top' || !binding.value 
		const bottom = binding.value === 'bottom' || !binding.value
		el.addEventListener("wheel", (e: MouseWheelEvent) => {
			if ((top && e.deltaY < 0 && el.scrollTop === 0) || (bottom && e.deltaY > 0 && Math.abs(el.scrollTop - (el.scrollHeight - el.offsetHeight)) < 1)) {
				e.preventDefault()
			}
		})
	}
})
Vue.directive('emojis', (el, binding, vnode) => {
	if (LeekWars.nativeEmojis) { return }
	const text = vnode.data && vnode.data.domProps && vnode.data.domProps.textContent ? vnode.data.domProps.textContent : el.innerHTML
	el.innerHTML = LeekWars.formatEmojis(text)
})
Vue.directive('code', {
	inserted: (el) => {
		el.querySelectorAll('code .smiley').forEach((smiley) => {
			smiley.outerHTML = smiley.getAttribute('title') || ''
		})
		el.querySelectorAll('code').forEach((c) => {
			LeekWars.createCodeArea(c.innerText, c)
		})
	}
})
Vue.directive('large-emojis', {
	inserted: (el) => {
		if (!el.classList.contains('large-emojis')) {
			if (el.querySelectorAll('.emoji').length === 1) {
				el.classList.add('large-emojis')
			}
		}
	}
})
Vue.directive('latex', {
	inserted: (el) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/, (str: string) => {
			return "<latex>" + str + "</latex>"
		})
		el.querySelectorAll('latex').forEach((c) => {
			Latex.latexify(c.innerHTML).then((result: any) => {
				c.innerHTML = result
			})
		})
	}
})
Vue.directive('chat-code-latex', {
	inserted: (el) => {
		el.innerHTML = el.innerHTML.replace(/\$(.*?)\$/, (str: string) => {
			return "<latex>" + str.replace(/`/g, "") + "</latex>"
		})
		el.innerHTML = el.innerHTML.replace(/```(.*?)```/, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.innerHTML = el.innerHTML.replace(/`(.*?)`/, (str: string, code: string) => {
			return "<code>" + code + "</code>"
		})
		el.querySelectorAll('code').forEach((c) => {
			if (c.innerHTML.indexOf("<br>") !== -1) {
				LeekWars.createCodeArea(c.innerText.trim(), c)
			} else {
				c.classList.add('single')
				LeekWars.createCodeAreaSimple(c.innerText, c)
			}
		})
		el.querySelectorAll('latex').forEach((c) => {
			Latex.latexify(c.innerHTML).then((result: any) => {
				c.innerHTML = result
			})
		})
	}
})
Vue.directive('dochash', {
	inserted: (el) => {
		el.innerHTML = el.innerHTML.replace(/#(\w+)/g, (a, b) => {
			return "<a href='/help/documentation/" + b + "'>" + b + "</a>"
		})
		el.querySelectorAll('a').forEach((a: any) => {
			a.onclick = (e: Event) => {
				e.stopPropagation()
				e.preventDefault()
				router.push('/help/documentation/' + a.innerText)
				return false
			}
		})
	}
})

const vueMain = new Vue({
	router, i18n, store,
	data: { savedPosition: 0 },
	vuetify: new Vuetify(),
	methods: {
		onLanguageLoaded: () => {
			if (!env.DEV) {
				const style = "color: black; font-size: 13px; font-weight: bold;"
				const styleRed = "color: red; font-size: 14px; font-weight: bold;"
				console.log("%c" + i18n.t('main.console_alert_1'), style)
				console.log("%c" + i18n.t('main.console_alert_2'), styleRed)
				console.log("%c" + i18n.t('main.console_alert_3'), style)
				console.log("")
				console.log("%c✔️ " + i18n.t('main.console_github'), style)
				console.log("")
			}
		}
	},
	render: (h) => {
		if (location.pathname === '/console') {
			return h(Console)
		}
		return h(App)
	},
	created() {
		window.addEventListener('keydown', (event) => {
			this.$emit('keydown', event)
			if (event.ctrlKey && event.keyCode === 83) {
				this.$emit('ctrlS')
				event.preventDefault()
			} else if (event.ctrlKey && event.keyCode === 81) {
				this.$emit('ctrlQ')
			} else if (event.ctrlKey && event.keyCode === 70 && !event.shiftKey) {
				this.$emit('ctrlF', event)
			} else if (event.keyCode === 27) {
				this.$emit('escape')
			}
		})
		window.addEventListener('keyup', (event) => {
			this.$emit('keyup', event)
		})
		LeekWars.mobile = window.innerWidth < 850
		window.addEventListener('resize', () => {
			this.$emit('resize')
			LeekWars.mobile = window.innerWidth < 850
		})
		window.addEventListener('focus', () => {
			this.$emit('focus')
		})
		window.addEventListener('click', () => {
			this.$emit('htmlclick')
		})
		setInterval(() => {
			LeekWars.timeSeconds = (Date.now() / 1000) | 0 - LeekWars.timeDelta
		}, 1000)
		setInterval(() => {
			LeekWars.time = (Date.now() / 1000) | 0 - LeekWars.timeDelta
		}, 1000 * 60)

		this.$on('loaded', () => {
			if (this.$data.savedPosition > 0) {
				setTimeout(() => {
					window.scrollTo(0, this.$data.savedPosition)
					this.$data.savedPosition = 0
				}, 100)
			}
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
		
		// Keep connected
		setInterval(() => {
			store.commit('last-connection', LeekWars.time)
			LeekWars.post('farmer/update')
		}, 59 * 1000)
	}
}).$mount('#app')

export { vueMain }