<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>Administration</h1>
		</div>
		<panel class="first" icon="mdi-chart-line" title="Statistiques & monitoring">
			<template #content>
				<div class="admin-grid">
					<router-link to="/admin/servers">
						<div v-ripple class="section card">
							<v-icon>mdi-server</v-icon>
							<h2>Générateurs</h2>
						</div>
					</router-link>
					<router-link to="/admin/errors">
						<div v-ripple class="section card">
							<v-icon>mdi-emoticon-dead</v-icon>
							<h2 v-if="$store.state.farmer">Erreurs ({{ $store.state.farmer.errors }})</h2>
						</div>
					</router-link>
					<router-link to="/admin/sources">
						<div v-ripple class="section card">
							<v-icon>mdi-merge</v-icon>
							<h2>Sources</h2>
						</div>
					</router-link>
					<router-link to="/admin/security">
						<div v-ripple class="section card">
							<v-icon>mdi-shield-alert</v-icon>
							<h2>Sécurité</h2>
						</div>
					</router-link>
					<router-link to="/admin/api-stats">
						<div v-ripple class="section card">
							<v-icon>mdi-speedometer</v-icon>
							<h2>Stats API</h2>
						</div>
					</router-link>
					<router-link to="/admin/funnels">
						<div v-ripple class="section card">
							<v-icon>mdi-filter-variant</v-icon>
							<h2>Funnels</h2>
						</div>
					</router-link>
					<router-link to="/admin/dashboards">
						<div v-ripple class="section card">
							<v-icon>mdi-view-dashboard</v-icon>
							<h2>Dashboards</h2>
						</div>
					</router-link>
					<router-link to="/admin/tournaments">
						<div v-ripple class="section card">
							<v-icon>mdi-sword-cross</v-icon>
							<h2>Tournois & BR</h2>
						</div>
					</router-link>
					<router-link to="/admin/groups">
						<div v-ripple class="section card">
							<v-icon>mdi-account-group</v-icon>
							<h2>Groupes</h2>
						</div>
					</router-link>
					<a target="_blank" rel="noopener" href="https://grafana.leekwars.com/d/JfN9Xkh4z/leek-wars?orgId=1&amp;from=now-24h&amp;to=now&amp;timezone=browser&amp;refresh=5s">
						<div v-ripple class="section card">
							<v-icon>mdi-chart-line</v-icon>
							<h2>Grafana <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
					<a target="_blank" rel="noopener" href="https://umami.leekwars.com/websites/493ffc4a-c7bd-45b1-b2f2-d61af7310749">
						<div v-ripple class="section card">
							<v-icon>mdi-chart-bar</v-icon>
							<h2>Umami <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
				</div>
			</template>
		</panel>
		<panel icon="mdi-puzzle" title="Contenu du jeu">
			<template #content>
				<div class="admin-grid">
					<router-link to="/admin/trophies">
						<div v-ripple class="section card">
							<v-icon>mdi-trophy-outline</v-icon>
							<h2>Trophées</h2>
						</div>
					</router-link>
					<router-link to="/admin/hats">
						<div v-ripple class="section card">
							<v-icon>mdi-hat-fedora</v-icon>
							<h2>Chapeaux</h2>
						</div>
					</router-link>
					<router-link to="/admin/skins">
						<div v-ripple class="section card">
							<v-icon>mdi-palette</v-icon>
							<h2>Skins</h2>
						</div>
					</router-link>
					<router-link to="/help/items">
						<div v-ripple class="section card">
							<v-icon>mdi-chart-timeline-variant</v-icon>
							<h2>Items</h2>
						</div>
					</router-link>
					<router-link to="/admin/components">
						<div v-ripple class="section card">
							<v-icon>mdi-food-apple-outline</v-icon>
							<h2>Composants</h2>
						</div>
					</router-link>
					<router-link to="/admin/schemes">
						<div v-ripple class="section card">
							<v-icon>mdi-map-outline</v-icon>
							<h2>Schémas</h2>
						</div>
					</router-link>
					<router-link to="/admin/services">
						<div v-ripple class="section card">
							<v-icon>mdi-api</v-icon>
							<h2>Services</h2>
						</div>
					</router-link>
				</div>
			</template>
		</panel>
		<panel icon="mdi-email-multiple-outline" title="Communauté & communication">
			<template #content>
				<div class="admin-grid">
					<router-link to="/admin/emails">
						<div v-ripple class="section card">
							<v-icon>mdi-email-multiple-outline</v-icon>
							<h2>Gestion emails</h2>
						</div>
					</router-link>
					<router-link to="/admin/newsletters">
						<div v-ripple class="section card">
							<v-icon>mdi-email-newsletter</v-icon>
							<h2>Lettres d'informations</h2>
						</div>
					</router-link>
					<a target="_blank" rel="noopener" href="https://roundcube.leekwars.com">
						<div v-ripple class="section card">
							<v-icon>mdi-email-outline</v-icon>
							<h2>Webmail <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
				</div>
			</template>
		</panel>
		<panel icon="mdi-cog" title="Système & infrastructure">
			<template #content>
				<div class="admin-grid">
					<router-link to="/admin/matchmaking">
						<div v-ripple class="section card">
							<v-icon>mdi-target-account</v-icon>
							<h2>Debug matchmaking</h2>
						</div>
					</router-link>
					<a href="/apcu.php" target="_blank" rel="noopener">
						<div v-ripple class="section card">
							<v-icon>mdi-memory</v-icon>
							<h2>APCu <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
					<a href="https://rediscommander.leekwars.com" target="_blank" rel="noopener">
						<div v-ripple class="section card">
							<v-icon>mdi-memory</v-icon>
							<h2>Redis <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
					<div v-ripple class="section card" @click="refreshGameData">
						<v-icon>mdi-database-refresh</v-icon>
						<h2>Refresh game data</h2>
					</div>
					<div v-ripple class="section card" @click="refreshEncycloLinks">
						<v-icon :class="{ 'mdi-spin': encycloLinksLoading }">{{ encycloLinksLoading ? 'mdi-loading' : 'mdi-book-sync' }}</v-icon>
						<h2>Refresh encyclo links</h2>
					</div>
					<a target="_blank" rel="noopener" href="https://www.paypal.com/webapps/business/">
						<div v-ripple class="section card">
							<v-icon>mdi-currency-eur</v-icon>
							<h2>PayPal <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
				</div>
			</template>
		</panel>
		<panel class="last" icon="mdi-flask-outline" title="Outils de test">
			<template #content>
				<div class="admin-grid">
					<v-btn prepend-icon="mdi-image" @click="square">Square notif image</v-btn>
					<v-btn prepend-icon="mdi-star" @click="squareIcon">Square notif icon</v-btn>
					<v-btn prepend-icon="mdi-trophy" @click="squareTrophy">Square notif trophy</v-btn>
					<v-btn prepend-icon="mdi-sword-cross" @click="squareTournament">Notif tournament</v-btn>
					<v-btn prepend-icon="mdi-message" @click="squareMP">Square MP</v-btn>
					<v-btn prepend-icon="mdi-school" @click="show_didactitiel">Didactitiel</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(2)">Level 2</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(20)">Level 20</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(50)">Level 50</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(97)">Level 97</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(200)">Level 200</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(211)">Level 211</v-btn>
					<v-btn prepend-icon="mdi-arrow-up-bold" @click="showLevelDialog(301)">Level 301</v-btn>
					<v-btn prepend-icon="mdi-bug" @click="sendError()">Send JS error</v-btn>
					<v-btn prepend-icon="mdi-bell-ring" @click="testPush()">Test push notif</v-btn>
					<v-btn prepend-icon="mdi-email-fast" @click="testMailSend()">Test email</v-btn>
					<v-btn prepend-icon="mdi-sword-cross" @click="arenaRegisterRandom()">Random en Arène</v-btn>
				</div>
			</template>
		</panel>
		<didactitiel v-if="didactitiel_enabled" v-model="didactitiel" />
		<level-dialog v-if="levelPopupData" v-model="levelPopup" :leek="leek" :level-data="levelPopupData" />
	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import { ChatMessage } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { NotificationBuilder } from '@/model/notification-builder'
	import { store } from '@/model/store'
	import { defineAsyncComponent, nextTick, ref } from 'vue'
	import { useRouter } from 'vue-router'
	const Didactitiel = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`))
	const LevelDialog = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/leek/level-dialog.${locale}.i18n`))

	const router = useRouter()

	const didactitiel = ref(false)
	const didactitiel_enabled = ref(false)
	const leek = ref<any>(null)
	const levelPopup = ref(false)
	const levelPopupData = ref<any>(null)
	const encycloLinksLoading = ref(false)

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Admin')

	function refreshGameData() {
		LeekWars.post('data/refresh').then(() => {
			LeekWars.toast("Game data refreshed!")
		}).error(() => {
			LeekWars.toast("Failed to refresh game data")
		})
	}

	function square() {
		const result = Math.random() < 0.33 ? 0 : (Math.random() < 0.5 ? 1 : -1)
		const data = { id: 51568168, type: 2, parameters: ["192", "32139522", "Mimi25", '' + result], date: 1599731275 }
		const notification = NotificationBuilder.build(data)
		LeekWars.squares.addFromNotification(notification)
	}

	function squareIcon() {
		const data = { date: 1599731298, id: 51568182, parameters: ["Magestik25", "32139522"], read: true, type: 12 }
		const notification = NotificationBuilder.build(data)
		LeekWars.squares.addFromNotification(notification)
	}

	function squareTrophy() {
		const trophy = LeekWars.trophies[Math.random() * LeekWars.trophies.length | 0]
		const data = { date: 1482046364, id: 32098724, parameters: [trophy.id], read: true, type: 11 }
		const notification = NotificationBuilder.build(data)
		LeekWars.squares.addFromNotification(notification)
	}
	function squareTournament() {
		const data = { date: 1584795604, id: 49519956, parameters: ["59339","Gorglucks"], read: true, type: 9 }
		const notification = NotificationBuilder.build(data)
		LeekWars.squares.addFromNotification(notification)
	}

	function squareMP() {
		const message = {
			chat: 1,
			id: 1212, farmer: { name: "Skouarniek", id: 48 } as Farmer,
			content: "Salut ça va ?",
			contents: [],
			date: Date.now() / 1000,
			censored: 0,
			censored_by: null,
			day: 0,
			subMessages: [],
			read: false,
			reactions: {},
			my_reaction: null,
			only_emojis: false,
			mentions: [],
			formatted: false
		} as ChatMessage
		LeekWars.squares.addFromMessage(message)
	}

	function show_didactitiel() {
		didactitiel_enabled.value = true
		nextTick(() => {
			didactitiel.value = true
		})
	}

	function showLevelDialog(level: number) {
		LeekWars.get('leek/random-by-level/' + level).then(l => {
			leek.value = l
			LeekWars.get('leek/get-level-popup/' + leek.value.id).then(data => {
				levelPopup.value = true
				levelPopupData.value = data.popup
			})
		})
	}

	function testPush() {
		LeekWars.post('notification/test-push').then((data: any) => {
			LeekWars.toast("Push envoyé à " + data.endpoints + " endpoint(s)")
		}).error((error: any) => {
			LeekWars.toast("Erreur : " + error.error)
		})
	}

	function testMailSend() {
		LeekWars.post('notification/test-mail-send').then((data: any) => {
			LeekWars.toast("Email envoyé à " + data.email)
		}).error((error: any) => {
			LeekWars.toast("Erreur : " + error.error)
		})
	}

	function arenaRegisterRandom() {
		LeekWars.post('admin/arena-register-random').then((data: any) => {
			const modes = ['BR', 'Guerre', 'Chasse', 'Colosse']
			const pref = data.preference === -1 ? 'Aucune' : modes[data.preference]
			LeekWars.toast(`${data.farmer} / ${data.leek} inscrit (pref: ${pref})`)
		}).error((error: any) => {
			LeekWars.toast("Erreur : " + error.error)
		})
	}

	function refreshEncycloLinks() {
		if (encycloLinksLoading.value) return
		encycloLinksLoading.value = true
		LeekWars.post('encyclopedia/refresh-links').then((data: any) => {
			encycloLinksLoading.value = false
			LeekWars.toast("Links refreshed: " + data.updated + " pages updated")
		}).error((error: any) => {
			encycloLinksLoading.value = false
			LeekWars.toast("Erreur : " + error.error)
		})
	}

	function sendError() {
		const err = new Error()
		const info = "test"

		const error = err.name + ": " + err.message
		const file = document.location.href
		const stack = err.stack + '\n' + info
		const errLocale = i18n.locale

		LeekWars.post('error/report', { error, stack, file, locale: errLocale })
	}
</script>

<style lang="scss" scoped>
	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		@media (max-width: 599px) {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}
		grid-gap: 8px;
		padding: 10px;
	}
	.section {
		padding: 8px 5px;
		text-align: center;
		height: 100%;
		cursor: pointer;
		& > .v-icon {
			font-size: 50px;
			margin: 6px 0;
		}
		h2 {
			font-size: 14px;
			margin: 0;
			display: flex;
			justify-content: center;
			align-items: flex-end;
			i {
				margin-left: 5px;
				font-size: 16px;
			}
		}
	}
	.section img {
		margin: 6px 0;
		max-height: 45px;
	}
</style>
