<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Mails', link: '/admin/emails'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<loader v-if="!farmers" />
			<div v-else>
				<h4>Supprimer un compte par email</h4>
				<div class="delete-account">
					<input type="email" placeholder="Email du compte à supprimer" v-model="deleteEmail">
					<v-btn @click="searchAccount" :disabled="!deleteEmail">Rechercher</v-btn>
				</div>
				<div v-if="deleteTarget" class="delete-confirm">
					<p>Compte trouvé : <b>{{ deleteTarget.name }}</b> (id: {{ deleteTarget.id }})</p>
					<p>Pour confirmer la suppression, tapez le nom du joueur :</p>
					<input type="text" v-model="deleteConfirm" :placeholder="deleteTarget.name">
					<v-btn color="red" @click="deleteAccount" :disabled="deleteConfirm !== deleteTarget.name">Supprimer définitivement</v-btn>
				</div>
				<div v-if="deleteSuccess" class="delete-success">{{ deleteSuccess }}</div>
				<div v-if="deleteError" class="delete-error">{{ deleteError }}</div>
				<br>
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

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ref } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	const router = useRouter()
	const farmers = ref<any>(null)
	const email = ref('')
	const deleteEmail = ref('')
	const deleteTarget = ref<any>(null)
	const deleteConfirm = ref('')
	const deleteError = ref('')
	const deleteSuccess = ref('')

	if (!store.getters.admin) router.replace('/')
	LeekWars.get('farmer/get-waiting-farmers').then(data => farmers.value = data.farmers)
	LeekWars.setTitle("Admin activation mails")

	function send(farmer: any) {
		if (!farmer.disabled) {
			LeekWars.post('farmer/resend-activation-mail', {farmer_id: farmer.id})
			farmer.disabled = true
		}
	}

	function searchAccount() {
		deleteTarget.value = null
		deleteConfirm.value = ''
		deleteError.value = ''
		deleteSuccess.value = ''
		LeekWars.get('admin/search-by-email/' + encodeURIComponent(deleteEmail.value))
			.then(data => {
				deleteTarget.value = data.farmer
			})
			.error((error) => {
				deleteError.value = 'Compte non trouvé'
			})
	}

	function deleteAccount() {
		if (!deleteTarget.value || deleteConfirm.value !== deleteTarget.value.name) return
		const name = deleteTarget.value.name
		LeekWars.delete('admin/delete-by-email', { email: deleteEmail.value })
			.then(() => {
				deleteSuccess.value = 'Le compte « ' + name + ' » a été supprimé avec succès.'
				deleteTarget.value = null
				deleteConfirm.value = ''
				deleteEmail.value = ''
				deleteError.value = ''
			})
			.error((error) => {
				deleteError.value = 'Erreur : ' + error.error
			})
	}

	function unsubscribe() {
		LeekWars.post('farmer/unregister-email', { email: email.value })
			.then(() => {
				LeekWars.toast('Désinscription réussie')
				email.value = ''
			})
			.error((error) => LeekWars.toast('Erreur : ' + error.error))
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
	.delete-account {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	.delete-confirm {
		margin: 10px 0;
		padding: 10px;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		p { margin: 0; }
	}
	.delete-success {
		margin-top: 10px;
		color: green;
	}
	.delete-error {
		margin-top: 10px;
		color: red;
	}
</style>