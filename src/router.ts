import About from '@/component/about/about.vue'
import AcceptConditions from '@/component/accept-conditions/accept-conditions.vue'
import Activate from '@/component/activate/activate.vue'
import AdminEmails from '@/component/admin/admin-emails.vue'
import AdminErrors from '@/component/admin/admin-errors.vue'
import AdminServers from '@/component/admin/admin-servers.vue'
import AdminServices from '@/component/admin/admin-services.vue'
import AdminTrophies from '@/component/admin/admin-trophies.vue'
import Admin from '@/component/admin/admin.vue'
import Api from '@/component/api/api.vue'
import NotFound from '@/component/app/not-found.vue'
import BankBuy from '@/component/bank/bank-buy.vue'
import BankValidate from '@/component/bank/bank-validate.vue'
import Bank from '@/component/bank/bank.vue'
import ChangeEmail from '@/component/change-email/change-email.vue'
import Changelog from '@/component/changelog/changelog.vue'
import ChatPage from '@/component/chat/chat-page.vue'
import Conditions from '@/component/conditions/conditions.vue'
import Documentation from '@/component/documentation/documentation.vue'
import EditorPage from '@/component/editor/editor-page.vue'
import Encyclopedia from '@/component/encyclopedia/encyclopedia.vue'
import FarmerPage from '@/component/farmer/farmer.vue'
import FightPage from '@/component/fight/fight.vue'
import ForgotPassword from '@/component/forgot-password/forgot-password.vue'
import ForumCategoryPage from '@/component/forum/forum-category.vue'
import Search from '@/component/forum/forum-search.vue'
import ForumTopicPage from '@/component/forum/forum-topic.vue'
import Forum from '@/component/forum/forum.vue'
import Garden from '@/component/garden/garden.vue'
import GeneralHelp from '@/component/general-help/general-help.vue'
import Help from '@/component/help/help.vue'
import LineOfSight from '@/component/help/line-of-sight.vue'
import History from '@/component/history/history.vue'
import LeekPage from '@/component/leek/leek.vue'
import Legal from '@/component/legal/legal.vue'
import Login from '@/component/login/login.vue'
import Market from '@/component/market/market.vue'
import Messages from '@/component/messages/messages.vue'
import AppPage from '@/component/mobile-app/mobile-app.vue'
import Moderation from '@/component/moderation/moderation.vue'
import NewLeek from '@/component/new-leek/new-leek.vue'
import Notifications from '@/component/notification/notifications.vue'
import RankingPage from '@/component/ranking/ranking.vue'
import ReportPage from '@/component/report/report.vue'
import Settings from '@/component/settings/settings.vue'
import Signup from '@/component/signup/signup.vue'
import Statistics from '@/component/statistics/statistics.vue'
import TeamPage from '@/component/team/team.vue'
import TournamentPage from '@/component/tournament/tournament.vue'
import Trophies from '@/component/trophies/trophies.vue'
import Tutorial from '@/component/tutorial/tutorial.vue'
import { env } from '@/env'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { vueMain } from '@/model/vue'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import Router, { Route, RouteConfig } from 'vue-router'

@Component({
	components: { signup: Signup, leek: LeekPage, chat: ChatPage },
})
class Home extends Vue {
	public functional = true
	get chatFirst() {
		return LeekWars.mobile && localStorage.getItem('options/chat-first') === 'true'
	}
	public render(h: any) {
		return this.$store.state.connected ? (this.chatFirst ? h('chat') : h('leek')) : h('signup')
	}
}

const connected = (to: Route, from: Route, next: any) => {
	if (!store.state.connected) {
		next('/')
	} else {
		next()
	}
}
const disconnected = (to: Route, from: Route, next: any) => {
	if (store.state.connected) {
		next('/')
	} else {
		next()
	}
}

Vue.use(Router)

const routes = [
	{ path: '/', component: Home },
	{ path: '/godfather', component: Home },
	{ path: '/godfather/:godfather', component: Home },
	{ path: '/accept-conditions', component: AcceptConditions, beforeEnter: connected },
	{ path: '/activate/:id/:code', component: Activate },
	{ path: '/admin', component: Admin, beforeEnter: connected },
	{ path: '/admin/services', component: AdminServices, beforeEnter: connected },
	{ path: '/admin/emails', component: AdminEmails, beforeEnter: connected },
	{ path: '/admin/errors', component: AdminErrors, beforeEnter: connected },
	{ path: '/admin/servers', component: AdminServers, beforeEnter: connected },
	{ path: '/admin/trophies', component: AdminTrophies, beforeEnter: connected },
	{ path: '/about', component: About },
	{ path: '/app', component: AppPage },
	{ path: '/bank', component: Bank, beforeEnter: connected },
	{ path: '/bank/buy/:pack/:offer', component: BankBuy, beforeEnter: connected },
	{ path: '/bank/validate/', component: BankValidate, beforeEnter: connected },
	{ path: '/bank/validate/success/:crystals/:vendor', component: BankValidate, props: {success: true}, beforeEnter: connected },
	{ path: '/bank/validate/failed/:vendor/:reason', component: BankValidate, props: {success: false}, beforeEnter: connected },
	{ path: '/conditions', component: Conditions },
	{ path: '/changelog', component: Changelog },
	{ path: '/change-email/:state/:token', component: ChangeEmail },
	{ path: '/encyclopedia/:page', component: Encyclopedia },
	{ path: '/editor', component: EditorPage, beforeEnter: connected },
	{ path: '/editor/:id', component: EditorPage, beforeEnter: connected },
	{ path: '/farmer', component: FarmerPage, beforeEnter: connected },
	{ path: '/farmer/:id', component: FarmerPage },
	{ path: '/farmer/:id/history', component: History, props: {type: 'farmer'} },
	{ path: '/fight/:id', component: FightPage },
	{ path: '/forgot-password', component: ForgotPassword },
	{ path: '/forgot-password/email-sent/:email', component: ForgotPassword, props: {state: 'email_sent'} },
	{ path: '/forgot-password/:id/:code', component: ForgotPassword, props: {state: 'change_password'} },
	{ path: '/garden', component: Garden, beforeEnter: connected },
	{ path: '/garden/:category', component: Garden, beforeEnter: connected },
	{ path: '/garden/:category/:item', component: Garden, beforeEnter: connected },
	{ path: '/garden/:category/:type/:target', component: Garden, beforeEnter: connected },
	{ path: '/garden/:category/:type/:target/:item', component: Garden, beforeEnter: connected },
	{ path: '/help', component: Help },
	{ path: '/help/api', component: Api },
	{ path: '/help/documentation', component: Documentation },
	{ path: '/help/documentation/:item', component: Documentation },
	{ path: '/help/line-of-sight', component: LineOfSight },
	{ path: '/help/general', component: GeneralHelp },
	{ path: '/help/tutorial', component: Tutorial },
	{ path: '/legal', component: Legal },
	{ path: '/login', component: Login, beforeEnter: disconnected },
	{ path: '/leek/:id', name: 'leek', component: LeekPage },
	{ path: '/leek/:id/history', component: History, props: {type: 'leek'} },
	{ path: '/market', name: 'market', component: Market, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/market/:item', component: Market, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/messages', component: Messages, beforeEnter: connected },
	{ path: '/messages/conversation/:id', component: Messages, beforeEnter: connected },
	{ path: '/messages/new/:id/:name/:avatar_changed', component: Messages, beforeEnter: connected },
	{ path: '/moderation', component: Moderation, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/moderation/fault/:id', component: Moderation, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/new-leek', component: NewLeek, beforeEnter: connected },
	{ path: '/notifications', component: Notifications, beforeEnter: connected },
	{ path: '/ranking', component: RankingPage },
	{ path: '/ranking/active', component: RankingPage, props: {active: true} },
	{ path: '/ranking/page-:page', component: RankingPage },
	{ path: '/ranking/active/page-:page', component: RankingPage, props: {active: true} },
	{ path: '/ranking/:category', component: RankingPage },
	{ path: '/ranking/:category/active', component: RankingPage, props: {active: true} },
	{ path: '/ranking/:category/page-:page', component: RankingPage },
	{ path: '/ranking/:category/active/page-:page', component: RankingPage, props: {active: true} },
	{ path: '/ranking/:category/:order', component: RankingPage },
	{ path: '/ranking/:category/:order/active', component: RankingPage, props: {active: true} },
	{ path: '/ranking/:category/:order/page-:page', component: RankingPage },
	{ path: '/ranking/:category/:order/active/page-:page', component: RankingPage, props: {active: true} },
	{ path: '/report/:id', component: ReportPage },
	{ path: '/settings', component: Settings, beforeEnter: connected },
	{ path: '/statistics', component: Statistics },
	{ path: '/team', component: TeamPage, beforeEnter: connected },
	{ path: '/team/:id', component: TeamPage },
	{ path: '/tournament/:id', component: TournamentPage },
	{ path: '/trophies', component: Trophies, beforeEnter: connected },
	{ path: '/trophies/:id', component: Trophies },
	{ path: '*', component: NotFound },
] as RouteConfig[]

if (process.env.VUE_APP_SOCIAL === 'true') {
	routes.push(
		{ path: '/forum', component: Forum, beforeEnter: connected },
		{ path: '/forum/category-:category', component: ForumCategoryPage, beforeEnter: connected },
		{ path: '/forum/category-:category/page-:page', component: ForumCategoryPage, beforeEnter: connected },
		{ path: '/forum/category-:category/topic-:topic', component: ForumTopicPage, beforeEnter: connected },
		{ path: '/forum/category-:category/topic-:topic/page-:page', component: ForumTopicPage, beforeEnter: connected },
		{ path: '/search', component: Search, beforeEnter: connected },
		{ path: '/chat', component: ChatPage, beforeEnter: connected },
	)
}

const router = new Router({
	mode: 'history',
	base: process.env.BASE_URL,
	routes,
	scrollBehavior(to, from, savedPosition) {
		vueMain.$data.savedPosition = 0
		if (savedPosition && !from.hash) {
			vueMain.$data.savedPosition = savedPosition.y
		} else if (!to.meta.noscroll) {
			return { x: 0, y: 0 }
		}
	},
})

router.afterEach((to: Route) => {
	ga('set', 'page', to.path)
	ga('send', 'pageview')
	if (to.hash) {
		vueMain.$once('loaded', () => {
			setTimeout(() => {
				const element = document.querySelector(to.hash)
				if (element) {
					const offset = LeekWars.mobile ? 56 : 0
					window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - offset)
				}
			})
		})
	}
})

router.beforeEach((to: Route, from: Route, next: any) => {

	LeekWars.splitShowList()
	LeekWars.actions = []

	if (!store.state.connected && localStorage.getItem('connected') === 'true') {
		const token = env.DEV ? localStorage.getItem('token') : '$'
		store.commit('connected', token)
		LeekWars.get('farmer/get-from-token').then(data => {
			store.commit('connect', {farmer: data.farmer, token})
		}).error(() => {
			store.commit('disconnect')
			router.push('/')
		})
	}
	next()
})

export default router
