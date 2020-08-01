<template lang="html">
	<div class="title-picker">
		<lw-title v-if="noun" class="preview" :title="[icon, noun, gender, adjective]" />
		<div class="selection">
			<div class="select-icon select">
				<v-select v-model="icon" :items="icons" item-value="id" hide-details dense solo light>
					<template v-slot:selection>
						<img v-if="icon" slot="prepend" :src="'/image/trophy/' + TROPHIES[icon - 1].code + '.png'">
					</template>
					<template slot="item" slot-scope="data">
						<img v-if="data.item.id" class="icon" :src="'/image/trophy/' + data.item.code + '.png'">
						<span v-else>{{ $t('main.none') }}</span>
						<v-list-item-content>
							<v-list-item-title class="word">
								<div class="name"></div>
								<div v-if="data.item.id" class="rarity">{{ formatRarity(data.item.rarity) }}%</div>
							</v-list-item-title>
						</v-list-item-content>
					</template>
				</v-select>
			</div>
			<div class="select-words" :class="$i18n.locale">
				<div class="select-word select">
					<v-select v-model="noun" :items="nouns" :label="$t('select_noun')" item-value="id" item-text="t" hide-details dense solo @change="changeNoun">
						<template slot="item" slot-scope="data">
							<img class="icon" :src="'/image/trophy/' + data.item.code + '.png'">
							<v-list-item-content>
								<v-list-item-title class="word">
									<div class="name">{{ data.item.t }}</div>
									<div class="rarity">{{ formatRarity(data.item.rarity) }}%</div>
								</v-list-item-title>
							</v-list-item-content>
						</template>
					</v-select>
				</div>
				<div v-if="$i18n.locale === 'fr' && noun && TROPHIES[noun - 1].noun_translation === 3" class="select select-gender">
					<v-select v-model="gender" :items="genders" :label="$t('select_noun')" item-value="id" item-text="t" hide-details dense solo>
						<template v-slot:selection>
							<v-icon :class="genders[gender - 1].code">mdi-gender-{{ genders[gender - 1].code }}</v-icon>
						</template>
						<template slot="item" slot-scope="data">
							<v-icon :class="data.item.code">mdi-gender-{{ data.item.code }}</v-icon>
						</template>
					</v-select>
				</div>
				<div class="select-word select">
					<v-select v-model="adjective" :items="adjectives" :label="$t('select_adjective')" item-value="id" item-text="t" hide-details :eager="true" dense solo>
						<template slot="item" slot-scope="data">
							<template v-if="data.item.id">
								<img class="icon" :src="'/image/trophy/' + data.item.code + '.png'">
								<v-list-item-content>
									<v-list-item-title class="word">
										<div class="name">{{ data.item.t }}</div>
										<div class="rarity">{{ formatRarity(data.item.rarity) }}%</div>
									</v-list-item-title>
								</v-list-item-content>
							</template>
							<span v-else>{{ $t('main.none') }}</span>
						</template>
					</v-select>
				</div>
				<v-btn v-if="noun !== 0 || icon !== 0" text icon @click="clear">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { env } from '@/env'
	import { TROPHIES } from '@/model/data'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "title-picker" })
	export default class TitlePicker extends Vue {
		@Prop() title!: number[]
		TROPHIES = TROPHIES
		icon: any = null
		noun: number = 0
		adjective: number = 0
		allNouns: any[] = []
		allAdjectives: any[] = []
		icons: any[] = []
		gender: number = 1
		genders = [
			{id: 1, code: 'male'},
			{id: 2, code: 'female'}
		]

		get nouns() {
			return this.allNouns.filter((w: any) => {
				return w.id !== this.adjective
			}).map((w: any) => {
				const trophy = TROPHIES[w.id - 1]
				const gender_code = this.gender === 2 && (trophy.noun_translation & 2) && ((trophy.noun_gender & 2) === 0) && this.$te('trophy.' + w.code + '_f') ? '_f' : ''
				return {code: w.code, id: w.id, t: this.$t('trophy.' + w.code + gender_code) as string, rarity: w.rarity}
			}).sort((a: any, b: any) => a.t.localeCompare(b.t))
		}
		get adjectives() {
			return [{code: '', id: 0, t: '', rarity: 0}].concat(this.allAdjectives.filter((w: any) => {
				return w.id !== this.noun
			}).map((w: any) => {
				const trophy = TROPHIES[w.id - 1]
				const gender_code = this.gender === 2 && (trophy.adj_translation & 2) && ((trophy.adj_gender & 2) === 0) && this.$te('trophy.' + w.code + '_f') ? '_f' : ''
				return {code: w.code, id: w.id, t: this.$t('trophy.' + w.code + gender_code) as string, rarity: w.rarity}
			}).sort((a: any, b: any) => a.t.localeCompare(b.t)))
		}

		created() {
			this.icon = this.title[0] || 0
			this.noun = this.title[1] || 0
			this.gender = this.title[2] || 1
			this.adjective = this.title[3] || 0
			LeekWars.get('trophy/get-trophy-words').then(words => {
				this.allNouns = words.nouns
				this.allAdjectives = words.adjectives
				this.icons = [{id: 0, code: '', t: '', rarity: 0}].concat(this.nouns.concat(this.adjectives)
					.sort((a: any, b: any) => a.id - b.id))
			})
		}

		changeNoun() {
			const trophy = TROPHIES[this.noun - 1]
			if (this.gender === 0) {
				this.gender = (trophy.noun_translation & 1) ? 1 : 2
			} else if ((trophy.noun_translation & this.gender) === 0) {
				this.gender = trophy.noun_translation
			}
		}
		getTitle() {
			if (this.icon || this.noun) {
				return [this.icon, this.noun, this.gender, this.adjective]
			} else {
				return []
			}
		}
		formatRarity(rarity: number) {
			return (rarity * 100).toPrecision(2)
		}
		clear() {
			this.icon = 0
			this.noun = 0
			this.adjective = 0
			this.gender = 0
		}
	}
</script>

<style lang="scss" scoped>
.selection {
	display: flex;
}
.select {
	margin: 0 4px;
	::v-deep input {
		border: none;
	}
}
.select-words {
	display: flex;
	&.en {
		flex-direction: row-reverse;
	}
}
.select-icon {
	width: 80px;
	img {
		height: 30px;
	}
	::v-deep input {
		display: none;
	}
}
.select-gender {
	width: 70px;
	::v-deep input {
		display: none;
	}
}
.v-icon.male {
	color: rgb(0, 110, 255);
}
.v-icon.female {
	color: rgb(242, 97, 255);
}
.word {
	display: flex;
	.name {
		flex: 1;
		padding-right: 20px;
	}
	.rarity {
		color: #999;
	}
}
.select-word {
	flex: 1;
}
.icon {
	width: 24px;
	height: 24px;
	margin-right: 8px;
}
.preview {
	text-align: center;
	padding-bottom: 20px;
	justify-content: center;
}
</style>