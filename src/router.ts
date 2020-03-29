import { locale } from '@/locale'

const About = () => import(/* webpackChunkName: "[request]" */ `@/component/about/about.${locale}.i18n`)
const AcceptConditions = () => import(/* webpackChunkName: "[request]" */ `@/component/accept-conditions/accept-conditions.${locale}.i18n`)
const Activate = () => import(/* webpackChunkName: "[request]" */ `@/component/activate/activate.${locale}.i18n`)
const AdminEmails = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin-emails.vue`)
const AdminErrors = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin-errors.vue`)
const AdminServers = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin-servers.vue`)
const AdminServices = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin-services.vue`)
const AdminTrophies = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin-trophies.vue`)
const Admin = () => import(/* webpackChunkName: "admin" */ `@/component/admin/admin.vue`)
const Api = () => import(/* webpackChunkName: "[request]" */ `@/component/api/api.${locale}.i18n`)
import NotFound from '@/component/app/not-found.vue'
const BankBuy = () => import(/* webpackChunkName: "[request]" */ `@/component/bank/bank-buy.${locale}.i18n`)
const BankValidate = () => import(/* webpackChunkName: "[request]" */ `@/component/bank/bank-validate.${locale}.i18n`)
const Bank = () => import(/* webpackChunkName: "[request]" */ `@/component/bank/bank.${locale}.i18n`)
const ChangeEmail = () => import(/* webpackChunkName: "[request]" */ `@/component/change-email/change-email.${locale}.i18n`)
const Changelog = () => import(/* webpackChunkName: "[request]" */ `@/component/changelog/changelog.${locale}.i18n`)
const Chat = () => import(/* webpackChunkName: "[request]" */ `@/component/chat/chat-page.${locale}.i18n`)
const Conditions = () => import(/* webpackChunkName: "[request]" */ `@/component/conditions/conditions.${locale}.i18n`)
const Documentation = () => import(/* webpackChunkName: "[request]" */ `@/component/documentation/documentation.${locale}.i18n`)
const Editor = () => import(/* webpackChunkName: "[request]" */ `@/component/editor/editor.${locale}.i18n`)
const Encyclopedia = () => import(/* webpackChunkName: "encyclopedia" */ '@/component/encyclopedia/encyclopedia.vue')
const Farmer = () => import(/* webpackChunkName: "[request]" */ `@/component/farmer/farmer.${locale}.i18n`)
const Fight = () => import(/* webpackChunkName: "[request]" */ `@/component/fight/fight.${locale}.i18n`)
const ForgotPassword = () => import(/* webpackChunkName: "[request]" */ `@/component/forgot-password/forgot-password.${locale}.i18n`)
const ForumCategory = () => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-category.${locale}.i18n`)
const ForumSearch = () => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-search.${locale}.i18n`)
const ForumTopic = () => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-topic.${locale}.i18n`)
const Forum = () => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum.${locale}.i18n`)
const Garden = () => import(/* webpackChunkName: "[request]" */ `@/component/garden/garden.${locale}.i18n`)
const GeneralHelp = () => import(/* webpackChunkName: "[request]" */ `@/component/general-help/general-help.${locale}.i18n`)
const Help = () => import(/* webpackChunkName: "[request]" */ `@/component/help/help.${locale}.i18n`)
const LineOfSight = () => import(/* webpackChunkName: "[request]" */ `@/component/line-of-sight/line-of-sight.${locale}.i18n`)
const History = () => import(/* webpackChunkName: "[request]" */ `@/component/history/history.${locale}.i18n`)
const Leek = () => import(/* webpackChunkName: "[request]" */ `@/component/leek/leek.${locale}.i18n`)
const Legal = () => import(/* webpackChunkName: "[request]" */ `@/component/legal/legal.${locale}.i18n`)
const Login = () => import(/* webpackChunkName: "[request]" */ `@/component/login/login.${locale}.i18n`)
const Market = () => import(/* webpackChunkName: "[request]" */ `@/component/market/market.${locale}.i18n`)
const Messages = () => import(/* webpackChunkName: "[request]" */ `@/component/messages/messages.${locale}.i18n`)
const MobileApp = () => import(/* webpackChunkName: "[request]" */ `@/component/mobile-app/mobile-app.${locale}.i18n`)
const Moderation = () => import(/* webpackChunkName: "[request]" */ `@/component/moderation/moderation.${locale}.i18n`)
const ModerationThugs = () => import(/* webpackChunkName: "[request]" */ `@/component/moderation/moderation-thugs.${locale}.i18n`)
const NewLeek = () => import(/* webpackChunkName: "[request]" */ `@/component/new-leek/new-leek.${locale}.i18n`)
const Notifications = () => import(/* webpackChunkName: "[request]" */ `@/component/notifications/notifications.${locale}.i18n`)
const Ranking = () => import(/* webpackChunkName: "[request]" */ `@/component/ranking/ranking.${locale}.i18n`)
const Report = () => import(/* webpackChunkName: "[request]" */ `@/component/report/report.${locale}.i18n`)
const Settings = () => import(/* webpackChunkName: "[request]" */ `@/component/settings/settings.${locale}.i18n`)
const Signup = () => import(/* webpackChunkName: "[request]" */ `@/component/signup/signup.${locale}.i18n`)
const Statistics = () => import(/* webpackChunkName: "[request]" */ `@/component/statistics/statistics.${locale}.i18n`)
const Team = () => import(/* webpackChunkName: "[request]" */ `@/component/team/team.${locale}.i18n`)
const Tournament = () => import(/* webpackChunkName: "[request]" */ `@/component/tournament/tournament.${locale}.i18n`)
const Trophies = () => import(/* webpackChunkName: "[request]" */ `@/component/trophies/trophies.${locale}.i18n`)
const Tutorial = () => import(/* webpackChunkName: "[request]" */ `@/component/tutorial/tutorial.${locale}.i18n`)
import { env } from '@/env'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { vueMain } from '@/model/vue'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import Router, { Route, RouteConfig } from 'vue-router'

@Component({
	components: { signup: Signup, leek: Leek, chat: Chat },
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
	{ path: '/app', component: MobileApp },
	{ path: '/conditions', component: Conditions },
	{ path: '/changelog', component: Changelog },
	{ path: '/change-email/:state/:token', component: ChangeEmail },
	{ path: '/encyclopedia/:page', component: Encyclopedia },
	{ path: '/editor', component: Editor, beforeEnter: connected },
	{ path: '/editor/:id', component: Editor, beforeEnter: connected },
	{ path: '/farmer', component: Farmer, beforeEnter: connected },
	{ path: '/farmer/:id', component: Farmer },
	{ path: '/farmer/:id/history', component: History, props: {type: 'farmer'} },
	{ path: '/fight/:id', component: Fight },
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
	{ path: '/leek/:id', name: 'leek', component: Leek },
	{ path: '/leek/:id/history', component: History, props: {type: 'leek'} },
	{ path: '/market', name: 'market', component: Market, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/market/:item', component: Market, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/messages', component: Messages, beforeEnter: connected },
	{ path: '/messages/conversation/:id', component: Messages, beforeEnter: connected },
	{ path: '/messages/new/:id/:name/:avatar_changed', component: Messages, beforeEnter: connected },
	{ path: '/moderation', component: Moderation, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/moderation/fault/:id', component: Moderation, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/moderation/thugs', component: ModerationThugs, meta: {noscroll: true}, beforeEnter: connected },
	{ path: '/new-leek', component: NewLeek, beforeEnter: connected },
	{ path: '/notifications', component: Notifications, beforeEnter: connected },
	{ path: '/ranking', component: Ranking },
	{ path: '/ranking/active', component: Ranking, props: {active: true} },
	{ path: '/ranking/page-:page', component: Ranking },
	{ path: '/ranking/active/page-:page', component: Ranking, props: {active: true} },
	{ path: '/ranking/:category', component: Ranking },
	{ path: '/ranking/:category/active', component: Ranking, props: {active: true} },
	{ path: '/ranking/:category/page-:page', component: Ranking },
	{ path: '/ranking/:category/active/page-:page', component: Ranking, props: {active: true} },
	{ path: '/ranking/:category/:order', component: Ranking },
	{ path: '/ranking/:category/:order/active', component: Ranking, props: {active: true} },
	{ path: '/ranking/:category/:order/page-:page', component: Ranking },
	{ path: '/ranking/:category/:order/active/page-:page', component: Ranking, props: {active: true} },
	{ path: '/report/:id', component: Report },
	{ path: '/settings', component: Settings, beforeEnter: connected },
	{ path: '/statistics', component: Statistics },
	{ path: '/team', component: Team, beforeEnter: connected },
	{ path: '/team/:id', component: Team },
	{ path: '/tournament/:id', component: Tournament },
	{ path: '/trophies', component: Trophies, beforeEnter: connected },
	{ path: '/trophies/:id', component: Trophies },
	{ path: '*', component: NotFound },
] as RouteConfig[]

if (process.env.VUE_APP_SOCIAL === 'true') {
	routes.push(
		{ path: '/forum', component: Forum, beforeEnter: connected },
		{ path: '/forum/category-:category', component: ForumCategory, beforeEnter: connected },
		{ path: '/forum/category-:category/page-:page', component: ForumCategory, beforeEnter: connected },
		{ path: '/forum/category-:category/topic-:topic', component: ForumTopic, beforeEnter: connected },
		{ path: '/forum/category-:category/topic-:topic/page-:page', component: ForumTopic, beforeEnter: connected },
		{ path: '/search', component: ForumSearch, beforeEnter: connected },
		{ path: '/chat', component: Chat, beforeEnter: connected },
	)
}
if (process.env.VUE_APP_BANK === 'true') {
	routes.push(
		{ path: '/bank', component: Bank, beforeEnter: connected },
		{ path: '/bank/buy/:pack/:offer', component: BankBuy, beforeEnter: connected },
		{ path: '/bank/validate/', component: BankValidate, beforeEnter: connected },
		{ path: '/bank/validate/success/:crystals/:vendor', component: BankValidate, props: {success: true}, beforeEnter: connected },
		{ path: '/bank/validate/failed/:vendor/:reason', component: BankValidate, props: {success: false}, beforeEnter: connected },
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
