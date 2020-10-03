<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>Administration</h1>
		</div>
		<panel class="first last">
			<div slot="content" class="admin">
				<router-link to="/admin/servers">
					<div v-ripple class="section card">
						<img src="/image/admin/server.png">
						<h2>État des serveurs</h2>
					</div>
				</router-link>
				<router-link to="/admin/errors">
					<div v-ripple class="section card">
						<img src="/image/admin/error_manager.png">
						<h2>Erreurs ({{ $store.state.farmer.errors }})</h2>
					</div>
				</router-link>
				<a href="http://admin.leekwars.com/memcached/index.php" target="_blank" rel="noopener">
					<div v-ripple class="section card">
						<img src="/image/admin/cache.png">
						<h2>Memcached <v-icon>mdi-open-in-new</v-icon></h2>
					</div>
				</a>
				<router-link to="/admin/services">
					<div v-ripple class="section card">
						<img src="/image/admin/services.png">
						<h2>Services</h2>
					</div>
				</router-link>
				<router-link to="/admin/emails">
					<div v-ripple class="section card">
						<img src="/image/admin/mails.png">
						<h2>Mails d'activation</h2>
					</div>
				</router-link>
				<router-link to="/admin/trophies">
					<div v-ripple class="section card">
						<img src="/image/admin/trophies.png">
						<h2>Trophées</h2>
					</div>
				</router-link>
				<a target="_blank" rel="noopener" href="http://mx.leekwars.com/mail">
					<div v-ripple class="section card">
						<img src="/image/admin/webmail.png">
						<h2>Webmail <v-icon>mdi-open-in-new</v-icon></h2>
					</div>
				</a>
				<a target="_blank" rel="noopener" href="https://www.paypal.com/webapps/business/">
					<div v-ripple class="section card">
						<img src="/image/admin/paypal.png">
						<h2>PayPal <v-icon>mdi-open-in-new</v-icon></h2>
					</div>
				</a>
				<a target="_blank" rel="noopener" href="https://membres.starpass.fr/">
					<div v-ripple class="section card">
						<img src="/image/admin/starpass.png">
						<h2>StarPass <v-icon>mdi-open-in-new</v-icon></h2>
					</div>
				</a>
				<v-btn @click="square">Square notif image</v-btn>
				<v-btn @click="squareIcon">Square notif icon</v-btn>
				<v-btn @click="squareMP">Square MP</v-btn>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
import { Conversation } from '@/model/conversation'
	import { i18n } from '@/model/i18n'
import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class Admin extends Vue {
		created() {
			LeekWars.setTitle('Admin')
		}

		square() {
			const data = { id: 51568168, type:2, parameters: ["192","32139522","Mimi25","-1"], date: 1599731275 }
			const notification = Notification.build(data, true)
			LeekWars.squares.addFromNotification(notification)
		}

		squareIcon() {
			const data = { date: 1599731298, id: 51568182, parameters: ["Magestik25", "32139522"], read: true, type: 12 }
			const notification = Notification.build(data, true)
			LeekWars.squares.addFromNotification(notification)
		}

		squareMP() {
			const conversation = { id: 1212, farmers: [{}, {}], last_farmer_id: 48, last_farmer_name: "Skouarniek", last_message: "Salut ça va ?" } as Conversation
			LeekWars.squares.addFromConversation(conversation, 123456789)
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
	}
	.section img {
		margin: 10px 0;
		max-height: 70px;
	}
	.section h2 {
		font-size: 16px;
		margin: 0;
		display: flex;
		justify-content: center;
		align-items: flex-end;
	}
	.section h2 i {
		margin-left: 5px;
		font-size: 20px;
	}
</style>