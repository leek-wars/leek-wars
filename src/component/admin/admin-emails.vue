<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Mails</h1>
		</div>
		<panel class="first">
			<loader v-if="!farmers" />
			<div v-else>
				<h4>Désinscrire totalement une email</h4>
				<input type="email" placeholder="Désinscrire totalement une email" v-model="email"> <v-btn @click="unsubscribe">Désinscrire</v-btn>
				<br><br>
				<h4>Mails d'activation</h4>
				<table>
					<tr class="header">
						<th>#</th>
						<th>Nom</th>
						<th>Nom du poireau</th>
						<th>Email</th>
						<th>Code</th>
						<th></th>
					</tr>
					<tr v-for="farmer in farmers" :key="farmer.id" class="farmer">
						<td>{{ farmer.id }}</td>
						<td>{{ farmer.name }}</td>
						<td>{{ farmer.leek_name }}</td>
						<td>{{ farmer.email }}</td>
						<td>{{ farmer.code }}</td>
						<td><v-btn :disabled="farmer.disabled" @click="send(farmer)">Renvoyer mail</v-btn></td>
					</tr>
				</table>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminEmails extends Vue {
		farmers: any = null
		email: string = ''

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.get('farmer/get-waiting-farmers').then(data => this.farmers = data.farmers)
			LeekWars.setTitle("Admin activation mails")
		}

		send(farmer: any) {
			if (!farmer.disabled) {
				LeekWars.post('farmer/resend-activation-mail', {farmer_id: farmer.id})
				Vue.set(farmer, 'disabled', true)
			}
		}

		unsubscribe() {
			LeekWars.post('farmer/unregister-email', { email: this.email })
				.then(() => {
					LeekWars.toast('Désinscription réussie')
					this.email = ''
				})
				.error((error) => LeekWars.toast('Erreur : ' + error.error))
		}
	}
</script>

<style lang="scss" scoped>
	h4 {
		margin-bottom: 20px;
	}
	table {
		width: 100%;
	}
	table .header {
		background: var(--background-header);
		height: 38px;
		text-align: center;
	}
	table td {
		border-bottom: 1px solid var(--border);
		border-right: 1px solid var(--border);
		text-align: center;
		padding: 0px 8px;
		background: var(--pure-white);
	}
	table th {
		padding: 0 5px;
		font-weight: normal;
		// color: #222;
		font-size: 18px;
		border-bottom: 1px solid var(--border);
		border-right: 1px solid var(--border);
	}
	input {
		width: 400px;
		height: 36px;
	}
</style>