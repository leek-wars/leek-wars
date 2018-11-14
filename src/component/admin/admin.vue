<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>Administration</h1>
		</div>
		<panel class="first last">
			<div slot="content" class="admin">
				<router-link to="/admin/services">
					<div v-ripple class="section card">
						<img src="/image/admin/services.png">
						<h2>Services</h2>
					</div>
				</router-link>
				<router-link to="/admin/errors">
					<div v-ripple class="section card">
						<img src="/image/admin/error_manager.png">
						<h2>Gestionnaire d'erreur</h2>
					</div>
				</router-link>
				<router-link to="/admin/emails">
					<div v-ripple class="section card">
						<img src="/image/admin/mails.png">
						<h2>Mails d'activation</h2>
					</div>
				</router-link>
				<router-link to="/admin/servers">
					<div v-ripple class="section card">
						<img src="/image/admin/server.png">
						<h2>État des serveurs</h2>
					</div>
				</router-link>
				<router-link to="/admin/trophies">
					<div v-ripple class="section card">
						<img src="/image/admin/trophies.png">
						<h2>Trophées</h2>
					</div>
				</router-link>
				<a href="http://admin.leekwars.com/memcached/index.php" target="_blank">
					<div v-ripple class="section card">
						<img src="/image/admin/cache.png">
						<h2>Memcached <i class="material-icons">launch</i></h2>
					</div>
				</a>
				<a target="_blank" href="http://mx.leekwars.com/mail">
					<div v-ripple class="section card">
						<img src="/image/admin/webmail.png">
						<h2>Webmail <i class="material-icons">launch</i></h2>
					</div>
				</a>
				<a target="_blank" href="https://www.paypal.com/webapps/business/">
					<div v-ripple class="section card">
						<img src="/image/admin/paypal.png">
						<h2>PayPal <i class="material-icons">launch</i></h2>
					</div>
				</a>
				<a target="_blank" href="https://membres.starpass.fr/">
					<div v-ripple class="section card">
						<img src="/image/admin/starpass.png">
						<h2>StarPass <i class="material-icons">launch</i></h2>
					</div>
				</a>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class Admin extends Vue {
		created() {
			LeekWars.setTitle('Admin')
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
		height: calc(100% - 20px);
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