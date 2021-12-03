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
					<th width="50">Diffi.</th>
					<th width="70">Points</th>
					<th width="120">Habs</th>
					<th width="80">Nom/Adj.</th>
					<th>Nom FR</th>
					<th>Nom EN</th>
					<th width="80">Genres du nom</th>
					<th width="80">Genres possibles du nom</th>
					<th width="80">Genres de l'adjectif</th>
					<th width="80">Genres possibles de l'adjectif</th>
					<th>Description fr</th>
					<th>Description en</th>
					<th>Desc. publique</th>
					<th>Nombre</th>
					<th>%</th>
					<th>Dernier</th>
				</tr>
				<tr v-for="(trophy, t) in trophies" :key="t">
					<td>{{ trophy.id }}</td>
					<td>{{ trophy.index }}</td>
					<td><img :src="'/image/trophy/' + trophy.code + '.svg'"></td>
					<td><i>{{ trophy.code }}</i></td>
					<td :style="{'background-color': difficulties[trophy.difficulty].color}">
						<select v-model="trophy.difficulty" @change="difficultyChange(trophy)">
							<option v-for="difficulty in difficulties" :key="difficulty.id" :value="difficulty.id" :style="{'background-color': difficulty.color}">{{ difficulty.id }}</option>
						</select>
					</td>
					<td :contenteditable="trophy.category != 6" @focusout="pointsFocusout(trophy, $event)">{{ trophy.category == 6 ? '' : trophy.points }}</td>
					<td><span v-if="trophy.points">{{ 100 * Math.pow(trophy.points, 2) | number }} <span class="hab"></span></span></td>
					<td>
						<input type="checkbox" :checked="trophy.title & 1" @change="updateTitle(trophy, 1, $event)"> N
						<input type="checkbox" :checked="trophy.title & 2" @change="updateTitle(trophy, 2, $event)"> A
					</td>
					<td contenteditable @focusout="nameFocusout(trophy, 'fr', $event)"><div>{{ trophy.name_fr }}</div></td>
					<td contenteditable @focusout="nameFocusout(trophy, 'en', $event)"><div>{{ trophy.name_en }}</div></td>
					<td>
						<span v-if="trophy.title & 1">
							<input type="checkbox" :checked="trophy.noun_gender & 1" @change="updateNounGender(trophy, 1, $event)"> M
							<input type="checkbox" :checked="trophy.noun_gender & 2" @change="updateNounGender(trophy, 2, $event)"> F
						</span>
					</td>
					<td>
						<span v-if="trophy.title & 1">
							<span v-if="!(trophy.noun_gender & 1)">
								<input type="checkbox" :checked="trophy.noun_translation & 1" @change="updateNounTranslation(trophy, 1, $event)"> M
							</span>
							<span v-if="!(trophy.noun_gender & 2)">
								<input type="checkbox" :checked="trophy.noun_translation & 2" @change="updateNounTranslation(trophy, 2, $event)"> F
							</span>
						</span>
					</td>
					<td>
						<span v-if="trophy.title & 2">
							<input v-if="trophy.title & 2" type="checkbox" :checked="trophy.adj_gender & 1" @change="updateAdjectiveGender(trophy, 1, $event)"> M
							<input v-if="trophy.title & 2" type="checkbox" :checked="trophy.adj_gender & 2" @change="updateAdjectiveGender(trophy, 2, $event)"> F
						</span>
					</td>
					<td>
						<span v-if="trophy.title & 2">
							<span v-if="!(trophy.adj_gender & 1)">
								<input type="checkbox" :checked="trophy.adj_translation & 1" @change="updateAdjectiveTranslation(trophy, 1, $event)"> M
							</span>
							<span v-if="!(trophy.adj_gender & 2)">
								<input type="checkbox" :checked="trophy.adj_translation & 2" @change="updateAdjectiveTranslation(trophy, 2, $event)"> F
							</span>
						</span>
					</td>
					<td class="description" contenteditable @focusout="descriptionFocusout(trophy, 'fr', $event)"><div>{{ trophy.description_fr }}</div></td>
					<td class="description" contenteditable @focusout="descriptionFocusout(trophy, 'en', $event)"><div>{{ trophy.description_en }}</div></td>
					<td>
						<input v-model="trophy.public_description" type="checkbox" @change="publicDescUpdate(trophy)">
					</td>
					<td>{{ trophy.unlocked | number }}</td>
					<td>{{ trophy.unlocked_percent }}%</td>
					<td width="130">{{ LeekWars.formatDuration(trophy.last) }}</td>
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
		difficulties = [
			{id: 0, color: '#444'},
			{id: 1, color: '#00aa00'},
			{id: 2, color: '#0090ff'},
			{id: 3, color: '#c21aff'},
			{id: 4, color: '#f8ac00'},
			{id: 5, color: 'red'}
		]
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
				LeekWars.put('trophy-template/name', {id: trophy.id, locale, name: value})
			}
		}
		descriptionFocusout(trophy: any, locale: string, e: Event) {
			const value = (e.target as HTMLElement).textContent || ''
			if (trophy['description_' + locale] !== value) {
				trophy['description_' + locale] = value
				LeekWars.put('trophy-template/description', {id: trophy.id, locale, description: value})
			}
		}

		pointsFocusout(trophy: any, e: Event) {
			trophy.points = parseInt((e.target as HTMLElement).innerText, 10)
			LeekWars.put('trophy-template/points', {id: trophy.id, points: trophy.points})
		}
		difficultyChange(trophy: any) {
			LeekWars.put('trophy-template/difficulty', {id: trophy.id, difficulty: trophy.difficulty})
		}

		publicDescUpdate(trophy: any) {
			LeekWars.put('trophy-template/public-description', {id: trophy.id, is_public: trophy.public_description})
		}

		updateTitle(trophy: any, part: number, e: any) {
			if (e.target.checked) { trophy.title += part } else { trophy.title -= part }
			LeekWars.put('trophy-template/title', {id: trophy.id, title: trophy.title})
		}

		updateNounGender(trophy: any, part: number, e: any) {
			if (e.target.checked) { trophy.noun_gender += part } else { trophy.noun_gender -= part }
			LeekWars.put('trophy-template/noun-gender', {id: trophy.id, gender: trophy.noun_gender})
		}
		updateNounTranslation(trophy: any, part: number, e: any) {
			if (e.target.checked) { trophy.noun_translation += part } else { trophy.noun_translation -= part }
			LeekWars.put('trophy-template/noun-translation', {id: trophy.id, gender: trophy.noun_translation})
		}
		updateAdjectiveGender(trophy: any, part: number, e: any) {
			if (e.target.checked) { trophy.adj_gender += part } else { trophy.adj_gender -= part }
			LeekWars.put('trophy-template/adjective-gender', {id: trophy.id, gender: trophy.adj_gender})
		}
		updateAdjectiveTranslation(trophy: any, part: number, e: any) {
			if (e.target.checked) { trophy.adj_translation += part } else { trophy.adj_translation -= part }
			LeekWars.put('trophy-template/adjective-translation', {id: trophy.id, gender: trophy.adj_translation})
		}
	}
</script>

<style lang="scss" scoped>
	.trophies {
		background: white;
		width: 100%;
	}
	tr:not(:first-child):hover {
		background: #eee;
	}
	td, th {
		padding: 0 10px;
		text-align: center;
		border: 1px solid #ddd;
		height: 25px;
		vertical-align: middle;
	}
	th {
		padding: 5px;
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