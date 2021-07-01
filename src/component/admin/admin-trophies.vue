<template>
	<div>
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Trophées</h1>
		</div>
		<panel class="first">
			<loader v-if="!trophies" />
			<table v-else class="trophies">
				<tr>
					<th>ID</th>
					<th>Ordre</th>
					<th>Icône</th>
					<th>Code</th>
					<th>Nom fr</th>
					<th>Nom en</th>
					<th>Description fr</th>
					<th>Description en</th>
					<th>Nombre</th>
					<th>%</th>
					<th>Dernier</th>
				</tr>
				<tr v-for="(trophy, t) in trophies" :key="t">
					<td>{{ trophy.id }}</td>
					<td>{{ trophy.index }}</td>
					<td><img :src="'/image/trophy/' + trophy.code + '.svg'"></td>
					<td><i>{{ trophy.code }}</i></td>
					<td contenteditable @focusout="nameFocusout(trophy, 'fr', $event)"><div>{{ trophy.name_fr }}</div></td>
					<td contenteditable @focusout="nameFocusout(trophy, 'en', $event)"><div>{{ trophy.name_en }}</div></td>
					<td class="description" contenteditable @focusout="descriptionFocusout(trophy, 'fr', $event)"><div>{{ trophy.description_fr }}</div></td>
					<td class="description" contenteditable @focusout="descriptionFocusout(trophy, 'en', $event)"><div>{{ trophy.description_en }}</div></td>
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
			LeekWars.get('trophy/get-admin').then(data => {
				this.trophies = data.trophies
			})
		}
		mounted() {
			LeekWars.large = true
		}
		beforeDestroy() {
			LeekWars.large = false
		}

		nameFocusout(trophy: any, locale: string, e: Event) {
			const value = (e.target as HTMLElement).textContent || ''
			if (trophy['name_' + locale] !== value) {
				trophy['name_' + locale] = value
				LeekWars.put('trophy-template/name', {id: trophy.id, locale, name: value}).then(data => {
					LeekWars.toast("Trophée " + trophy.code + " sauvegardé !")
				})
			}
		}
		descriptionFocusout(trophy: any, locale: string, e: Event) {
			const value = (e.target as HTMLElement).textContent || ''
			if (trophy['description_' + locale] !== value) {
				trophy['description_' + locale] = value
				LeekWars.put('trophy-template/description', {id: trophy.id, locale, description: value}).then(data => {
					LeekWars.toast("Trophée " + trophy.code + " sauvegardé !")
				})
			}
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
		width: 28px;
		padding: 2px;
		vertical-align: bottom;
	}
	.desc {
		text-align: left;
	}
	.description {
		text-align: left;
	}
</style>