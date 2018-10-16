import AIElement from '@/component/app/ai.vue'
import App from '@/component/app/app.vue'
import Code from '@/component/app/code.vue'
import Console from '@/component/app/console.vue'
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
import Loader from '@/component/loader.vue'
import ConversationElement from '@/component/messages/conversation.vue'
import ReportDialog from '@/component/moderation/report-dialog.vue'
import NotificationElement from '@/component/notification/notification.vue'
import Pagination from '@/component/pagination.vue'
import Talent from '@/component/talent.vue'
import { i18n, loadInstanceTranslations, loadLanguageAsync } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import '@/model/serviceworker'
import { store } from "@/model/store"
import router from '@/router'
import Vue from 'vue'
import Chartist from 'vue-chartist'
import VueGitHubButtons from 'vue-github-buttons'
import 'vue-github-buttons/dist/vue-github-buttons.css'
import transitions from 'vuetify/es5/components/transitions'
import VApp from 'vuetify/es5/components/VApp'
import VBtn from 'vuetify/es5/components/VBtn'
import VCheckbox from 'vuetify/es5/components/VCheckbox'
import VDialog from 'vuetify/es5/components/VDialog'
import VIcon from 'vuetify/es5/components/VIcon'
import VList from 'vuetify/es5/components/VList'
import VMenu from 'vuetify/es5/components/VMenu'
import VProgressCircular from 'vuetify/es5/components/VProgressCircular'
import VRadioGroup from 'vuetify/es5/components/VRadioGroup'
import VSnackbar from 'vuetify/es5/components/VSnackbar'
import VSwitch from 'vuetify/es5/components/VSwitch'
import VTabs from 'vuetify/es5/components/VTabs'
import VTooltip from 'vuetify/es5/components/VTooltip'
import Vuetify from 'vuetify/es5/components/Vuetify'
import * as directives from 'vuetify/es5/directives'

Vue.use(VueGitHubButtons)
Vue.use(Chartist)
import 'chartist/dist/scss/chartist.scss'
Vue.use(Vuetify, {
	components: { VApp, VBtn, VTooltip, VMenu, VList, VIcon, VTabs, VRadioGroup,
		VSnackbar, VCheckbox, VSwitch, VProgressCircular, VDialog, transitions },
	directives,
})
// import 'vuetify/src/stylus/app.styl'

Vue.config.productionTip = false

Vue.mixin({
	data() {
		return { LeekWars }
	},
	beforeCreate() {
		// console.log("Before create", this)
		loadInstanceTranslations(i18n.locale, this as any)
	}
})

Vue.filter('number', LeekWars.formatNumber)
Vue.filter('date', LeekWars.formatDate)
Vue.filter('emojis', LeekWars.formatEmojis)
Vue.filter('duration', LeekWars.formatDuration)

Vue.component('leek-image', LeekImage)
Vue.component('avatar', Avatar)
Vue.component('emblem', Emblem)
Vue.component('talent', Talent)
Vue.component('chat', ChatElement)
Vue.component('loader', Loader)
Vue.component('player', () => import(/* webpackChunkName: "player" */ "@/component/player/player.vue"))
Vue.component('comments', Comments)
Vue.component('report-dialog', ReportDialog)
Vue.component('pagination', Pagination)
Vue.component('formatting-rules', FormattingRules)
Vue.component('fight-history', FightHistory)
Vue.component('fights-history', FightsHistory)
Vue.component('tournament-history', TournamentHistory)
Vue.component('tournaments-history', TournamentsHistory)
Vue.component('notification', NotificationElement)
Vue.component('lw-code', Code)
Vue.component('conversation', ConversationElement)
Vue.component('ai', AIElement)

Vue.directive('autostopscroll', {
	inserted: (el, binding) => {
		const top = binding.value === 'top' || !binding.value 
		const bottom = binding.value === 'bottom' || !binding.value
		el.addEventListener('mousewheel', (e) => {
			if ((top && e.deltaY < 0 && el.scrollTop === 0) || (bottom && e.deltaY > 0 && Math.abs(el.scrollTop - (el.scrollHeight - el.offsetHeight)) < 1)) {
				e.preventDefault()
			}
		})
	}
})
Vue.directive('emojis', {
	inserted: (el) => {
		el.innerHTML = LeekWars.formatEmojis(el.innerHTML)
	}
})
Vue.directive('code', {
	inserted: (el) => {
		el.querySelectorAll('code .smiley').forEach((smiley) => {
			smiley.outerHTML = smiley.getAttribute('title') || ''
		})
		el.querySelectorAll('code').forEach((c) => {
			LeekWars.createCodeArea(c.innerHTML, c)
		})
	}
})
Vue.directive('large-emojis', {
	inserted: (el) => {
		if (!el.classList.contains('large-emojis')) {
			if (el.textContent === '' && el.querySelectorAll('.smiley').length === 1) {
				el.classList.add('large-emojis')
			}
		}
	}
})

const vueMain = new Vue({
	router, i18n, store,
	render: (h) => {
		if (location.pathname === '/console') {
			return h(Console)
		}
		return h(App)
	},
	created() {
		loadLanguageAsync(this, 'fr')
		LeekWars.socket.init()

		window.addEventListener('keydown', (event) => {
			if (event.ctrlKey && event.keyCode === 83) {
				this.$emit('ctrlS')
				event.preventDefault()
			}
		})
		LeekWars.mobile = window.innerWidth < 1000
		window.addEventListener('resize', () => {
			this.$emit('resize')
			LeekWars.mobile = window.innerWidth < 1000
		})
		window.addEventListener('focus', () => {
			this.$emit('focus')
		})
		setInterval(() => {
			LeekWars.time = (Date.now() / 1000) | 0 - LeekWars.timeDelta
		}, 1000)

		LeekWars.sfwInit()
		LeekWars.setFavicon()

		// TODO
		if (false) {
			const style = "color: black; font-size: 13px; font-weight: bold;"
			const styleRed = "color: red; font-size: 14px; font-weight: bold;"
			// var styleBlue = "color: blue; font-size: 14px;"
			console.log("%c" + i18n.t('main.console_alert_1'), style)
			console.log("%c" + i18n.t('main.console_alert_2'), styleRed)
			console.log("%c" + i18n.t('main.console_alert_3'), style)
			console.log("")
			console.log("%c✔️ " + i18n.t('main.console_github'), style)
			console.log("")
		}
		// Konami code
		// $(window).keyup(function(e) {
		// 	if (e.keyCode == 37) LW.konami += "l"
		// 	else if (e.keyCode == 38) LW.konami += "u"
		// 	else if (e.keyCode == 39) LW.konami += "r"
		// 	else if (e.keyCode == 40) LW.konami += "d"
		// 	else if (e.keyCode == 65) LW.konami += "a"
		// 	else if (e.keyCode == 66) LW.konami += "b"
		// 	if (/uuddlrlrba$/.test(LW.konami)) {
		// 		_.post('trophy/unlock', {trophy_id: 113})
		// 		LW.konami = ""
		// 	}
		// 	if (LW.konami.length > 12) LW.konami = LW.konami.substring(1)
		// })
		
		// Keep connected
		// setInterval(function() {
		// 	LW.farmer.last_connection = LW.time
		// 	_.post('farmer/update')
		// }, 59 * 1000)

		// var message = LW.trigger('leave')
		// if (message) {
		// 	var popup = new _.popup.new('main.quit_confirm_popup', {message: message}, 600, true)
		// 	popup.setDismissable(false)
		// 	popup.show()
		// 	popup.find('.stay').click(function() {
		// 		popup.dismiss()
		// 		// next page is not loaded
		// 	})
		// 	popup.find('.leave').click(function() {
		// 		popup.dismiss()
		// 		// load next page
		// 		next()
		// 	})
	}
}).$mount('#app')

export { vueMain }