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
import BankBuy from '@/component/bank/bank-buy.vue'
import BankValidate from '@/component/bank/bank-validate.vue'
import Bank from '@/component/bank/bank.vue'
import Changelog from '@/component/changelog/changelog.vue'
import ChatPage from '@/component/chat/chat-page.vue'
import Conditions from '@/component/conditions/conditions.vue'
import Documentation from '@/component/documentation/documentation.vue'
import EditorPage from '@/component/editor/editor-page.vue'
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
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
import Router from 'vue-router'

@Component({
	components: { signup: Signup, leek: LeekPage, chat: ChatPage },
})
class Home extends Vue {
	public functional = true
	get chatFirst() {
		return LeekWars.mobile && localStorage.getItem('options/chat-first') === 'true'
	}
	public render(h: any) {
		return this.$store.getters.connected ? (this.chatFirst ? h('chat') : h('leek')) : h('signup')
	}
}

Vue.use(Router)

const router = new Router({
	mode: 'history',
	base: process.env.BASE_URL,
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return new Promise((resolve, reject) => {
				setTimeout(() => resolve(savedPosition), 500)
			})
		} else {
			return { x: 0, y: 0 }
		}
	},
	routes: [
		{ path: '/', component: Home },
		{ path: '/godfather', component: Home },
		{ path: '/godfather/:godfather', component: Home },
		{ path: '/accept-conditions', component: AcceptConditions },
		{ path: '/activate', component: Activate },
		{ path: '/admin', component: Admin },
		{ path: '/admin/services', component: AdminServices },
		{ path: '/admin/emails', component: AdminEmails },
		{ path: '/admin/errors', component: AdminErrors },
		{ path: '/admin/servers', component: AdminServers },
		{ path: '/admin/trophies', component: AdminTrophies },
		{ path: '/about', component: About },
		{ path: '/app', component: AppPage },
		{ path: '/bank', component: Bank },
		{ path: '/bank/buy/:pack/:offer', component: BankBuy },
		{ path: '/bank/validate/', component: BankValidate },
		{ path: '/bank/validate/success/:crystals/:vendor', component: BankValidate, props: {success: true} },
		{ path: '/bank/validate/failed/:vendor/:reason', component: BankValidate, props: {success: false} },
		{ path: '/conditions', component: Conditions },
		{ path: '/changelog', component: Changelog },
		{ path: '/chat', component: ChatPage },
		{ path: '/editor', component: EditorPage },
		{ path: '/editor/:id', component: EditorPage },
		{ path: '/farmer', component: FarmerPage },
		{ path: '/farmer/:id', component: FarmerPage },
		{ path: '/farmer/:id/history', component: History, props: {type: 'farmer'} },
		{ path: '/fight/:id', component: FightPage },
		{ path: '/forgot-password', component: ForgotPassword },
		{ path: '/forgot-password/email-sent/:email', component: ForgotPassword, props: {state: 'email_sent'} },
		{ path: '/forgot-password/:id/:code', component: ForgotPassword, props: {state: 'change_password'} },
		{ path: '/forum', component: Forum },
		{ path: '/forum/category-:category', component: ForumCategoryPage },
		{ path: '/forum/category-:category/page-:page', component: ForumCategoryPage },
		{ path: '/forum/category-:category/topic-:topic', component: ForumTopicPage },
		{ path: '/forum/category-:category/topic-:topic/page-:page', component: ForumTopicPage },
		{ path: '/garden', component: Garden },
		{ path: '/garden/:category', component: Garden },
		{ path: '/garden/:category/:item', component: Garden },
		{ path: '/garden/:category/:type/:target', component: Garden },
		{ path: '/garden/:category/:type/:target/:item', component: Garden },
		{ path: '/help', component: Help },
		{ path: '/help/api', component: Api },
		{ path: '/help/documentation', component: Documentation },
		{ path: '/help/documentation/:item', component: Documentation },
		{ path: '/help/line-of-sight', component: LineOfSight },
		{ path: '/help/general', component: GeneralHelp },
		{ path: '/help/tutorial', component: Tutorial },
		{ path: '/legal', component: Legal },
		{ path: '/login', component: Login },
		{ path: '/leek/:id', name: 'leek', component: LeekPage },
		{ path: '/leek/:id/history', component: History, props: {type: 'leek'} },
		{ path: '/market', name: 'market', component: Market },
		{ path: '/market/:item', component: Market },
		{ path: '/messages', component: Messages },
		{ path: '/messages/conversation/:id', component: Messages },
		{ path: '/messages/new/:id/:name/:avatar_changed', component: Messages },
		{ path: '/moderation', component: Moderation },
		{ path: '/moderation/fault/:id', component: Moderation },
		{ path: '/new-leek', component: NewLeek },
		{ path: '/notifications', component: Notifications },
		{ path: '/ranking', component: RankingPage },
		{ path: '/ranking', component: RankingPage },
		{ path: '/ranking/:category', component: RankingPage },
		{ path: '/ranking/:category/page-:page', component: RankingPage },
		{ path: '/ranking/:category/:order', component: RankingPage },
		{ path: '/ranking/:category/:order/page-:page', component: RankingPage },
		{ path: '/report/:id', component: ReportPage },
		{ path: '/settings', component: Settings },
		{ path: '/search', component: Search },
		{ path: '/search/:query', component: Search },
		{ path: '/search/:query/page-:page', component: Search },
		{ path: '/search/:query/:farmer', component: Search },
		{ path: '/search/:query/:farmer/page-:page', component: Search },
		{ path: '/search/:query/:farmer/:category', component: Search },
		{ path: '/search/:query/:farmer/:category/page-:page', component: Search },
		{ path: '/statistics', component: Statistics },
		{ path: '/team', component: TeamPage },
		{ path: '/team/:id', component: TeamPage },
		{ path: '/tournament/:id', component: TournamentPage },
		{ path: '/trophies', component: Trophies },
		{ path: '/trophies/:id', component: Trophies },
	],
})

router.afterEach((to) => {
	ga('set', 'page', to.path)
	ga('send', 'pageview')
})

router.beforeEach((to, from, next) => {

	LeekWars.splitShowList()
	LeekWars.actions = []

	if (!store.getters.connected && localStorage.getItem('connected') === 'true') {
		const token = localStorage.getItem('token')
		LeekWars.get('farmer/get-from-token/' + token).then((data: any) => {
			if (data.data.success) {
				store.commit('connect', {farmer: data.data.farmer, token})
				next()
			} else {
				store.commit('disconnect')
				router.push('/')
			}
		})
	} else {
		next()
	}
})

export default router
