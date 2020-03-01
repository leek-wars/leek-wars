<template lang="html">
	<span class="title">
		<span class="quote">«</span>
		<img v-if="icon" :src="'/image/trophy/' + TROPHIES[icon - 1].code + '.png'" :class="{notext: !noun}">
		<span v-if="$i18n.locale === 'fr'">{{ word1 }} {{ word2 }}</span>
		<span v-else>{{ word2 }} {{ word1 }}</span>
		<span class="quote">»</span>
	</span>
</template>

<script lang="ts">
	import { env } from '@/env'
	import { TROPHIES } from '@/model/data'
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "lw-title" })
	export default class LWTitle extends Vue {
		TROPHIES = TROPHIES
		@Prop() title!: any

		get icon() {
			return this.title[0]
		}
		get noun() {
			return this.title[1]
		}
		get gender() {
			return this.title[2]
		}
		get adjective() {
			return this.title[3]
		}

		get word1() {
			if (!this.noun) { return '' }
			const trophy = TROPHIES[this.noun - 1]
			const gender_code = this.gender === 1 || ((trophy.noun_gender & 2) !== 0) ? '' : '_f'
			let word = this.$t('trophy.' + trophy.code + gender_code) as string
			if (i18n.locale === 'en') {
				word = word.toLowerCase()
			}
			return word
		}
		get word2() {
			if (!this.adjective) { return '' }
			const trophy = TROPHIES[this.adjective - 1]
			const gender_code = this.gender === 1 || ((trophy.adj_gender & 2) !== 0) ? '' : '_f'
			let word = this.$t('trophy.' + trophy.code + gender_code) as string
			if (i18n.locale === 'fr') {
				word = word.toLowerCase()
			}
			return word
		}
	}
</script>

<style lang="scss" scoped>
img {
	width: 20px;
	margin-right: 4px;
	margin-bottom: 1px;
	&.notext {
		margin-right: 0;
	}
}
.title {
	font-weight: 500;
	font-size: 16px;
	color: #555;
	display: flex;
	align-items: center;
	justify-content: center;
}
.quote {
	padding: 0 4px;
	font-size: 22px;
}
</style>