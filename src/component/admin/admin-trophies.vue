<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Trophées</h1>
		</div>
		<panel class="first last">
			<loader v-if="!trophies" />
			<table v-else class="trophies">
				<tr>
					<th>ID</th>
					<th>Icône</th>
					<th>Nom</th>
					<th>Description</th>
					<th>Nombre</th>
					<th>%</th>
					<th>Dernier</th>
				</tr>
				<tr v-for="(trophy, t) in trophies" :key="t">
					<td>{{ trophy.id }}</td>
					<td><img :src="'/image/trophy/' + trophy.code + '.png'"></td>
					<td>{{ trophy.name }}</td>
					<td class="description">{{ trophy.description }}</td>
					<td>{{ trophy.unlocked | number }}</td>
					<td>{{ trophy.unlocked_percent }}%</td>
					<td>{{ LeekWars.formatDuration(trophy.last) }}</td>
				</tr>
			</table>
		</panel>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({})
	export default class AdminTrophies extends Vue {
		trophies: any = null
		created() {
			LeekWars.setTitle("Admin Trophies")
			LeekWars.get<any>('trophy/get-admin/' + i18n.locale).then((data) => {
				this.trophies = data.trophies
			})
		}
	}
</script>

<style lang="scss" scoped>
	.trophies {
		background: white;
		width: 100%;
	}
	td, th {
		padding: 0 10px;
		text-align: center;
		border: 1px solid #ddd;
		height: 25px;
	}
	th {
		padding: 5px 10px;
	}
	img {
		width: 25px;
	}
	.desc {
		text-align: left;
	}
	.description {
		text-align: left;
	}
</style>