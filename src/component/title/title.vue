<template lang="html">
	<span class="title">
		<span class="quote">«</span>
		<trophy-icon v-if="icon && TROPHIES[icon - 1]" :code="TROPHIES[icon - 1].code" :class="{notext: !noun && !adjective}" />
		<span v-if="nounFirst">{{ nounWord }} {{ adjectiveWord }}</span>
		<span v-else>{{ adjectiveWord }} {{ nounWord }}</span>
		<span class="quote">»</span>
	</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeekWars } from '@/model/leekwars'
import { NOUN_FIRST_LOCALES, LOWERCASE_SECOND_LOCALES, titleAgreementGender, agreedTrophyKey } from '@/component/title/title-agreement'

defineOptions({ name: 'LwTitle' })

const TROPHIES = LeekWars.trophies

const props = defineProps<{
	title: number[]
}>()

const { t, locale } = useI18n()

const icon = computed(() => props.title[0])
const noun = computed(() => props.title[1])
const gender = computed(() => props.title[2])
const adjective = computed(() => props.title[3])

const nounFirst = computed(() => NOUN_FIRST_LOCALES.has(locale.value))
const lowercaseSecond = computed(() => LOWERCASE_SECOND_LOCALES.has(locale.value))

const agreementGender = computed(() => titleAgreementGender(noun.value ? LeekWars.trophies[noun.value - 1] : null, gender.value, locale.value))

function agreedWord(code: string): string {
	return t(agreedTrophyKey(code, agreementGender.value)) as string
}

// Met le mot en minuscule s'il occupe la seconde position du titre (et n'est pas
// un sigle tout en majuscules), reproduisant « Bourrasque bizarre » / « Weird gust ».
function lowercaseIfSecond(word: string, isSecond: boolean): string {
	if (isSecond && lowercaseSecond.value && word !== word.toUpperCase()) {
		return word.toLowerCase()
	}
	return word
}

const nounWord = computed(() => {
	if (!noun.value) return ''
	const trophy = LeekWars.trophies[noun.value - 1]
	if (!trophy) return ''
	return lowercaseIfSecond(agreedWord(trophy.code), !nounFirst.value && !!adjective.value)
})

const adjectiveWord = computed(() => {
	if (!adjective.value) return ''
	const trophy = LeekWars.trophies[adjective.value - 1]
	if (!trophy) return ''
	return lowercaseIfSecond(agreedWord(trophy.code), nounFirst.value && !!noun.value)
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
