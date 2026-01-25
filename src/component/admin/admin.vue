<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>Administration</h1>
		</div>
		<panel class="first">
			<template #content>
				<div class="admin">
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
					<a href="/memcached.php" target="_blank" rel="noopener">
						<div v-ripple class="section card">
							<v-icon>mdi-memory</v-icon>
							<h2>Memcached <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
					<router-link to="/admin/services">
						<div v-ripple class="section card">
							<v-icon>mdi-api</v-icon>
							<h2>Services</h2>
						</div>
					</router-link>
					<router-link to="/admin/emails">
						<div v-ripple class="section card">
							<v-icon>mdi-email-multiple-outline</v-icon>
							<h2>Gestion emails</h2>
						</div>
					</router-link>
					<router-link to="/admin/trophies">
						<div v-ripple class="section card">
							<v-icon>mdi-trophy-outline</v-icon>
							<h2>Trophées</h2>
						</div>
					</router-link>
					<router-link to="/admin/groups">
						<div v-ripple class="section card">
							<v-icon>mdi-account-group</v-icon>
							<h2>Groupes</h2>
						</div>
					</router-link>
					<router-link to="/admin/sources">
						<div v-ripple class="section card">
							<v-icon>mdi-merge</v-icon>
							<h2>Sources</h2>
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
					<a target="_blank" rel="noopener" href="https://www.paypal.com/webapps/business/">
						<div v-ripple class="section card">
							<v-icon>mdi-currency-eur</v-icon>
							<h2>PayPal <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
					<a target="_blank" rel="noopener" href="https://membres.starpass.fr/">
						<div v-ripple class="section card">
							<v-icon>mdi-message-text-outline</v-icon>
							<h2>StarPass <v-icon>mdi-open-in-new</v-icon></h2>
						</div>
					</a>
				</div>
			</template>
		</panel>
		<panel class="last">
			<template #content>
				<div class="admin">
					<v-btn @click="square">Square notif image</v-btn>
					<v-btn @click="squareIcon">Square notif icon</v-btn>
					<v-btn @click="squareTrophy">Square notif trophy</v-btn>
					<v-btn @click="squareTournament">Notif tournament</v-btn>
					<v-btn @click="squareMP">Square MP</v-btn>
					<v-btn @click="show_didactitiel">Didactitiel</v-btn>
					<v-btn @click="showLevelDialog(2)">Level Dialog 2</v-btn>
					<v-btn @click="showLevelDialog(20)">Level Dialog 20</v-btn>
					<v-btn @click="showLevelDialog(50)">Level Dialog 50</v-btn>
					<v-btn @click="showLevelDialog(97)">Level Dialog 97</v-btn>
					<v-btn @click="showLevelDialog(200)">Level Dialog 200</v-btn>
					<v-btn @click="showLevelDialog(211)">Level Dialog 211</v-btn>
					<v-btn @click="showLevelDialog(301)">Level Dialog 301</v-btn>
					<v-btn @click="sendError()">Send JS error</v-btn>
				</div>
			</template>
		</panel>
		<didactitiel v-if="didactitiel_enabled" v-model="didactitiel" />
		<level-dialog v-if="levelPopupData" v-model="levelPopup" :leek="leek" :level-data="levelPopupData" />
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { ChatMessage } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { NotificationBuilder } from '@/model/notification-builder'
	import { TROPHIES } from '@/model/trophies'
	import { defineAsyncComponent, nextTick } from 'vue'
	import { Options, Vue } from 'vue-property-decorator'
	const Didactitiel = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/didactitiel/didactitiel.${locale}.i18n`))
	const LevelDialog = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/leek/level-dialog.${locale}.i18n`))

	@Options({ components: { Didactitiel, LevelDialog } })
	export default class Admin extends Vue {
		didactitiel: boolean = false
		didactitiel_enabled: boolean = false
		leek: any = null
		levelPopup: boolean = false
		levelPopupData: any = null

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle('Admin')
		}

		square() {
			const result = Math.random() < 0.33 ? 0 : (Math.random() < 0.5 ? 1 : -1)
			const data = { id: 51568168, type: 2, parameters: ["192", "32139522", "Mimi25", '' + result], date: 1599731275 }
			const notification = NotificationBuilder.build(data)
			LeekWars.squares.addFromNotification(notification)
		}

		squareIcon() {
			const data = { date: 1599731298, id: 51568182, parameters: ["Magestik25", "32139522"], read: true, type: 12 }
			const notification = NotificationBuilder.build(data)
			LeekWars.squares.addFromNotification(notification)
		}

		squareTrophy() {
			const trophy = TROPHIES[Math.random() * TROPHIES.length | 0]
			const data = { date: 1482046364, id: 32098724, parameters: [trophy.id], read: true, type: 11 }
			const notification = NotificationBuilder.build(data)
			LeekWars.squares.addFromNotification(notification)
		}
		squareTournament() {
			const data = { date: 1584795604, id: 49519956, parameters: ["59339","Gorglucks"], read: true, type: 9 }
			const notification = NotificationBuilder.build(data)
			LeekWars.squares.addFromNotification(notification)
		}

		squareMP() {
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

		show_didactitiel() {
			this.didactitiel_enabled = true
			nextTick(() => {
				this.didactitiel = true
			})
		}

		showLevelDialog(level: number) {
			LeekWars.get('leek/random-by-level/' + level).then(leek => {
				this.leek = leek
				LeekWars.get('leek/get-level-popup/' + this.leek.id).then(data => {
					this.levelPopup = true
					this.levelPopupData = data.popup
				})
			})
		}

		sendError() {
			const err = new Error()
			const info = "test"
			
			const error = err.name + ": " + err.message
			const file = document.location.href
			const stack = err.stack + '\n' + info
			const locale = i18n.locale

			LeekWars.post('error/report', { error, stack, file, locale })
		}
	}
</script>

<style lang="scss" scoped>
	.admin {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		grid-gap: 10px;
		padding: 10px;
	}
	.section {
		padding: 10px 5px;
		text-align: center;
		height: 100%;
		& > .v-icon {
			font-size: 80px;
			margin: 10px 0;
		}
		h2 {
			font-size: 16px;
			margin: 0;
			display: flex;
			justify-content: center;
			align-items: flex-end;
			i {
				margin-left: 5px;
				font-size: 20px;
			}
		}
	}
	.section img {
		margin: 10px 0;
		max-height: 70px;
	}
</style>