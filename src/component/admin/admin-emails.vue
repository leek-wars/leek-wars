<template>
	<div>
		<h1><router-link to="/admin">Administration</router-link> > Mails d'activation</h1>
		<div class="panel">
			<div class="content">
				<loader v-if="!farmers" />
				<table v-else>
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
						<td><div :class="{disabled: farmer.disabled}" class="button send" @click="send(farmer)">Renvoyer mail</div></td>
					</tr>
				</table>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminEmails extends Vue {
		farmers: any = null
		created() {
			LeekWars.get<any>('farmer/get-waiting-farmers/' + this.$store.state.token + '/' + encodeURI(this.$store.state.supertoken)).then((data) => {
				this.farmers = data.data.farmers
			})
			LeekWars.setTitle("Admin activation mails")
		}
		send(farmer: any) {
			if (!farmer.disabled) {
				LeekWars.post('farmer/resend-activation-mail', {farmer_id: farmer.id, supertoken: this.$store.state.supertoken})
				Vue.set(farmer, 'disabled', true)
			}
		}
	}
</script>

<style lang="scss" scoped>
	table {
		width: 100%;
	}
	table .header {
		background: #e5e5e5;
		height: 38px;
		text-align: center;
	}
	table td {
		border-bottom: 1px solid #ddd;
		border-right: 1px solid #ddd;
		text-align: center;
		padding: 0px 8px;
		background: white;
	}
	table th {
		padding: 0 5px;
		font-weight: normal;
		color: #222;
		font-size: 18px;
		border-bottom: 1px solid #fff;
		border-right: 1px solid #fff;
	}
</style>