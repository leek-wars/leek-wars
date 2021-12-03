import AIElement from '@/component/app/ai.vue'
import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Console from '@/component/app/console.vue'
import Error from '@/component/app/error.vue'
import LWLoader from '@/component/app/loader.vue'
import Panel from '@/component/app/panel.vue'
import Avatar from '@/component/avatar.vue'
import ChatElement from '@/component/chat/chat.vue'
import Comments from '@/component/comment/comments.vue'
import '@/component/editor/leekscript.scss'
import Emblem from '@/component/emblem.vue'
import FightHistory from '@/component/history/fight-history.vue'
import FightsHistory from '@/component/history/fights-history.vue'
import TournamentHistory from '@/component/history/tournament-history.vue'
import TournamentsHistory from '@/component/history/tournaments-history.vue'
import ItemElement from '@/component/item.vue'
import LeekImage from '@/component/leek-image.vue'
import ConversationElement from '@/component/messages/conversation.vue'
import ReportDialog from '@/component/moderation/report-dialog.vue'
import NotificationElement from '@/component/notifications/notification.vue'
import Pagination from '@/component/pagination.vue'
import Popup from '@/component/popup.vue'
import RankingBadge from '@/component/ranking-badge.vue'
import RichTooltipChip from '@/component/rich-tooltip/rich-tooltip-chip.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'
import RichTooltipWeapon from '@/component/rich-tooltip/rich-tooltip-weapon.vue'
import Talent from '@/component/talent.vue'
import TitlePicker from '@/component/title/title-picker.vue'
import LWTitle from '@/component/title/title.vue'
import TurretImage from '@/component/turret-image.vue'
import Type from '@/component/type.vue'
import { env } from '@/env'
import { i18n, loadInstanceTranslations } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router from '@/router'
import Vue from 'vue'
import { Latex } from './latex'

import Vuetify from 'vuetify/lib'
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
Vue.filter('datetime', LeekWars.formatDateTime)
Vue.filter('emojis', LeekWars.formatEmojis)
Vue.filter('duration', LeekWars.formatDuration)

Vue.component('leek-image', LeekImage)
Vue.component('turret-image', TurretImage)
Vue.component('avatar', Avatar)
Vue.component('emblem', Emblem)
Vue.component('talent', Talent)
Vue.component('ranking-badge', RankingBadge)
Vue.component('chat', ChatElement)
Vue.component('comments', Comments)
Vue.component('report-dialog', ReportDialog)
Vue.component('pagination', Pagination)
Vue.component('fight-history', FightHistory)
Vue.component('fights-history', FightsHistory)
Vue.component('tournament-history', TournamentHistory)
Vue.component('tournaments-history', TournamentsHistory)
Vue.component('notification', NotificationElement)
Vue.component('lw-code', Code)
Vue.component('conversation', ConversationElement)
Vue.component('ai', AIElement)
Vue.component('error', Error)
Vue.component('panel', Panel)
Vue.component('popup', Popup)
Vue.component('rich-tooltip-farmer', RichTooltipFarmer)
Vue.component('rich-tooltip-leek', RichTooltipLeek)
Vue.component('rich-tooltip-composition', RichTooltipComposition)
Vue.component('rich-tooltip-weapon', RichTooltipWeapon)
Vue.component('rich-tooltip-chip', RichTooltipChip)
Vue.component('rich-tooltip-trophy', RichTooltipTrophy)
Vue.component('rich-tooltip-team', RichTooltipTeam)
Vue.component('loader', LWLoader)
Vue.component('lw-title', LWTitle)
Vue.component('title-picker', TitlePicker)
Vue.component('lw-type', Type)
Vue.component('item', ItemElement)

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
Vue.directive('emojis', (el) => {
	el.childNodes.forEach((child) => {
		if (child.nodeType === Node.TEXT_NODE) {
			const html = LeekWars.formatEmojis(LeekWars.protect((child as Text).wholeText))
			const template = document.createElement('span')
			template.innerHTML = html
			el.replaceChild(template, child)
		}
	})
})
Vue.directive('code', (el) => {
	el.querySelectorAll('code:not(.formatted)').forEach((c) => {
		LeekWars.createCodeArea((c as HTMLElement).innerText, c as HTMLElement)
	})
})
Vue.directive('large-emojis', {
	inserted: (el) => {
		if (!el.classList.contains('large-emojis')) {
			let onlyEmojis = true
			el.childNodes.forEach((child) => {
				if (child.nodeType === Node.TEXT_NODE) {
					onlyEmojis = onlyEmojis && child.textContent!.length === 0
				}
			})
			if (onlyEmojis) {
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
				LeekWars.createCodeArea(code, c)
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
Vue.directive('dochash', (el) => {
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
})

const vueMain = new Vue({
	router, i18n, store,
	data: { savedPosition: 0 },
	vuetify: new Vuetify(),
	methods: {
		onLanguageLoaded: () => {
			if (!LeekWars.DEV) {
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
			Vue.nextTick(() => {
				// console.log("loaded", this.$data.savedPosition)
				if (this.$data.savedPosition > 0) {
					window.scrollTo(0, this.$data.savedPosition)
					setTimeout(() => {
						window.scrollTo(0, this.$data.savedPosition)
						this.$data.savedPosition = 0
					}, 100)
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

		// Keep connected
		setInterval(() => {
			store.commit('last-connection', LeekWars.time)
			LeekWars.post('farmer/update').then(data => {
				store.commit('connected-count', data.farmers)
			})
		}, 59 * 1000)

		// Message ?
		LeekWars.get('farmer/get-message').then(data => {
			LeekWars.displayMessage(data.message)
		})
	}
}).$mount('#app')

export { vueMain }