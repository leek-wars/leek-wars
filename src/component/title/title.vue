<template lang="html">
	<span class="title">
		<span class="quote">«</span>
		<img v-if="icon && TROPHIES[icon - 1]" :src="'/image/trophy/' + TROPHIES[icon - 1].code + '.svg'" :class="{notext: !noun && !adjective}">
		<span v-if="$i18n.locale === 'fr'">{{ word1 }} {{ word2 }}</span>
		<span v-else>{{ word2 }} {{ word1 }}</span>
		<span class="quote">»</span>
	</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'

defineOptions({ name: 'lw-title' })

const TROPHIES = LeekWars.trophies

const props = defineProps<{
	title: any
}>()

const { t } = useI18n()

const icon = computed(() => props.title[0])
const noun = computed(() => props.title[1])
const gender = computed(() => props.title[2])
const adjective = computed(() => props.title[3])

const word1 = computed(() => {
	if (!noun.value) return ''
	const trophy = LeekWars.trophies[noun.value - 1]
	if (!trophy) return ''
	const gender_code = gender.value === 1 || ((trophy.noun_gender & 2) !== 0) ? '' : '_f'
	let word = t('trophy.' + trophy.code + gender_code) as string
	if (i18n.global.locale === 'en' && adjective.value && word !== word.toUpperCase()) {
		word = word.toLowerCase()
	}
	return word
})

const word2 = computed(() => {
	if (!adjective.value) return ''
	const trophy = LeekWars.trophies[adjective.value - 1]
	const gender_code = gender.value === 1 || ((trophy.adj_gender & 2) !== 0) ? '' : '_f'
	let word = t('trophy.' + trophy.code + gender_code) as string
	if (i18n.global.locale === 'fr' && noun.value && word !== word.toUpperCase()) {
		word = word.toLowerCase()
	}
	return word
})
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
	color: var(--text-color-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
}
.quote {
	padding: 0 4px;
	font-size: 22px;
}
</style>
