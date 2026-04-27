<template lang="html">
	<div class="title-picker">
		<lw-title v-if="noun" class="preview" :title="[icon, noun, gender, adjective]" />
		<div class="selection">
			<div class="select-icon select">
				<v-select v-model="icon" :items="icons" item-value="id" item-title="id" hide-details density="comfortable" variant="solo">
					<template #selection>
						<img v-if="icon" :src="'/image/trophy/' + LeekWars.trophies[icon - 1].code + '.svg'">
					</template>
					<template #item="{ props: itemProps, item }">
						<v-list-item v-bind="itemProps">
							<template v-if="item.raw.id" #title>
								<img class="icon" :src="'/image/trophy/' + item.raw.code + '.svg'">
							</template>
							<template v-else #title>{{ $t('main.none') }}</template>
							<template #append v-if="item.raw.id">
								<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
							</template>
						</v-list-item>
					</template>
				</v-select>
			</div>
			<div class="select-words" :class="$i18n.locale">
				<div class="select-word select">
					<v-select v-model="noun" :items="nouns" item-value="id" item-title="t" hide-details density="comfortable" variant="solo" @change="changeNoun">
						<template #selection="{ item }">
							{{ item.props.title }}
						</template>
						<template #item="{ props: itemProps, item }">
							<v-list-item v-bind="itemProps">
								<template v-if="item.value" #prepend>
									<img class="icon" :src="'/image/trophy/' + item.raw.code + '.svg'">
								</template>
								<template #append v-if="item.value" class="word">
									<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
								</template>
								<template #title v-else>{{ $t('main.none') }}</template>
							</v-list-item>
						</template>
					</v-select>
				</div>
				<div v-if="$i18n.locale === 'fr' && (noun && LeekWars.trophies[noun - 1].noun_translation === 3) || (adjective && LeekWars.trophies[adjective - 1].adj_translation === 3)" class="select select-gender">
					<v-select v-model="gender" :items="genders" item-value="id" item-title="code" hide-details density="comfortable" variant="solo">
						<template #selection>
							<v-icon v-if="gender" :class="genders[gender - 1].code">mdi-gender-{{ genders[gender - 1].code }}</v-icon>
						</template>
						<template #item="{ props: itemProps, item }">
							<v-list-item v-bind="itemProps">
								<template #title>
									<v-icon :class="item.raw.code">mdi-gender-{{ item.raw.code }}</v-icon>
								</template>
							</v-list-item>
						</template>
					</v-select>
				</div>
				<div class="select-word select">
					<v-select v-model="adjective" :items="adjectives" item-value="id" item-title="t" hide-details :eager="true" density="comfortable" variant="solo">
						<template #selection="{ item }">
							{{ item.props.title }}
						</template>
						<template #item="{ props: itemProps, item }">
							<v-list-item v-bind="itemProps">
								<template v-if="item.value" #prepend>
									<img class="icon" :src="'/image/trophy/' + item.raw.code + '.svg'">
								</template>
								<template #append v-if="item.value" class="word">
									<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
								</template>
								<template #title v-else>{{ $t('main.none') }}</template>
							</v-list-item>
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeekWars } from '@/model/leekwars'
import LwTitle from '@/component/title/title.vue'

defineOptions({ name: 'title-picker' })

const props = defineProps<{
	title: number[]
}>()

const { t } = useI18n()

const TROPHIES = LeekWars.trophies
const icon = ref<any>(props.title[0] || 0)
const noun = ref(props.title[1] || 0)
const adjective = ref(props.title[3] || 0)
const allNouns = ref<any[]>([])
const allAdjectives = ref<any[]>([])
const icons = ref<any[]>([])
const gender = ref(props.title[2] || 1)
const genders = [
	{ id: 1, code: 'male' },
	{ id: 2, code: 'female' }
]

const nouns = computed(() => [{ code: '', id: 0, t: '', rarity: 0 }].concat(allNouns.value.filter((w: any) => w.id !== adjective.value).map((w: any) => {
	const trophy = LeekWars.trophies[w.id - 1]
	const gender_code = gender.value === 2 && (trophy.noun_translation & 2) && ((trophy.noun_gender & 2) === 0) ? '_f' : ''
	return { code: w.code, id: w.id, t: t('trophy.' + w.code + gender_code) as string, rarity: w.rarity }
}).sort((a: any, b: any) => a.t.localeCompare(b.t))))

const adjectives = computed(() => [{ code: '', id: 0, t: '', rarity: 0 }].concat(allAdjectives.value.filter((w: any) => w.id !== noun.value).map((w: any) => {
	const trophy = LeekWars.trophies[w.id - 1]
	const gender_code = gender.value === 2 && (trophy.adj_translation & 2) && ((trophy.adj_gender & 2) === 0) ? '_f' : ''
	return { code: w.code, id: w.id, t: t('trophy.' + w.code + gender_code) as string, rarity: w.rarity }
}).sort((a: any, b: any) => a.t.localeCompare(b.t))))

LeekWars.loadTrophyWords().then(words => {
	allNouns.value = words.filter((w: any) => w.title & 1)
	allAdjectives.value = words.filter((w: any) => w.title & 2)
	icons.value = [{ id: 0, code: '', t: '', rarity: 0 }].concat(words).sort((a: any, b: any) => a.rarity - b.rarity)
})

function changeNoun() {
	if (noun.value) {
		const trophy = LeekWars.trophies[noun.value - 1]
		if (gender.value === 0) {
			gender.value = (trophy.noun_translation & 1) ? 1 : 2
		} else if ((trophy.noun_translation & gender.value) === 0) {
			gender.value = trophy.noun_translation
		}
	}
}

function getTitle() {
	if (icon.value || noun.value) return [icon.value, noun.value, gender.value, adjective.value]
	return []
}

function formatRarity(rarity: number) {
	return (rarity * 100).toPrecision(2)
}

function clear() {
	icon.value = 0
	noun.value = 0
	adjective.value = 0
	gender.value = 0
}

defineExpose({ getTitle })
</script>

<style lang="scss" scoped>
.selection {
	display: flex;
}
.select {
	margin: 0 4px;
	:deep(input) {
		border: none;
	}
}
.select-words {
	display: flex;
	flex: 1;
	&.en {
		flex-direction: row-reverse;
	}
}
.select-icon {
	width: 80px;
	img {
		height: 25px;
	}
	:deep(input) {
		display: none;
	}
}
.select-gender {
	width: 70px;
	:deep(input) {
		display: none;
	}
}
.v-icon.male {
	color: rgb(0, 110, 255);
}
.v-icon.female {
	color: rgb(242, 97, 255);
}
.rarity {
	color: #999;
	font-size: 13px;
	padding-left: 20px;
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