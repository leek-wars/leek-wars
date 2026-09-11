<template lang="html">
	<div class="title-picker">
		<lw-title v-if="noun" class="preview" :title="[icon, noun, gender, adjective, gold ? 1 : 0]" />
		<div class="selection">
			<div class="select-icon select">
				<lw-select v-model="icon" :items="icons" item-value="id" item-title="id">
					<template #selection>
						<trophy-icon v-if="icon" :code="LeekWars.trophies[icon - 1].code" />
					</template>
					<!-- La ligne redevient un élément ordinaire : ce que v-list-item tirait
					     de #title et #append s'écrit ici, la rareté poussée à droite. -->
					<template #item="{ props: itemProps, item }">
						<div v-bind="itemProps">
							<template v-if="item.raw.id">
								<trophy-icon class="icon" :code="item.raw.code" />
								<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
							</template>
							<template v-else>{{ $t('main.none') }}</template>
						</div>
					</template>
				</lw-select>
			</div>
			<div class="select-words" :class="$i18n.locale">
				<div class="select-word select">
					<lw-select v-model="noun" :items="nouns" item-value="id" item-title="t" @update:model-value="changeNoun">
						<template #selection="{ item }">
							{{ item ? item.props.title : '' }}
						</template>
						<template #item="{ props: itemProps, item }">
							<div v-bind="itemProps">
								<template v-if="item.value">
									<trophy-icon class="icon" :code="item.raw.code" />
									<span>{{ item.title }}</span>
									<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
								</template>
								<template v-else>{{ $t('main.none') }}</template>
							</div>
						</template>
					</lw-select>
				</div>
				<div v-if="$i18n.locale === 'fr' && ((noun && LeekWars.trophies[noun - 1].noun_translation === 3) || (adjective && (LeekWars.trophies[adjective - 1].adj_translation & 2)))" class="select select-gender">
					<lw-select v-model="gender" :items="genders" item-value="id" item-title="code">
						<template #selection>
							<v-icon v-if="gender" :class="genders[gender - 1].code">mdi-gender-{{ genders[gender - 1].code }}</v-icon>
						</template>
						<template #item="{ props: itemProps, item }">
							<div v-bind="itemProps">
								<v-icon :class="item.raw.code">mdi-gender-{{ item.raw.code }}</v-icon>
							</div>
						</template>
					</lw-select>
				</div>
				<div class="select-word select">
					<lw-select v-model="adjective" :items="adjectives" item-value="id" item-title="t">
						<template #selection="{ item }">
							{{ item ? item.props.title : '' }}
						</template>
						<template #item="{ props: itemProps, item }">
							<div v-bind="itemProps">
								<template v-if="item.value">
									<trophy-icon class="icon" :code="item.raw.code" />
									<span>{{ item.title }}</span>
									<div class="rarity">{{ formatRarity(item.raw.rarity) }}%</div>
								</template>
								<template v-else>{{ $t('main.none') }}</template>
							</div>
						</template>
					</lw-select>
				</div>
				<v-btn v-if="noun !== 0 || icon !== 0" text icon @click="clear">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</div>
		</div>
		<!-- L'or est un apparat de fidélité LW+ (9 mois d'abonnement cumulé) : sans lui, la
		     ligne mène à la page LW+, où la frise des récompenses le montre. -->
		<div v-ripple class="gold-option" :class="{on: gold, locked: !goldPomp}" :title="goldPomp ? undefined : $t('pomp.golden_title_locked')" @click="toggleGold">
			<img src="/image/pomp/golden_title.png">
			<span class="label">{{ $t('pomp.golden_title') }}</span>
			<v-icon v-if="!goldPomp" size="20">mdi-lock</v-icon>
			<!-- La case ne se clique pas elle-même : c'est la ligne entière qui bascule. -->
			<lw-checkbox v-else :model-value="gold" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import LwTitle from '@/component/title/title.vue'
import { titleAgreementGender, agreedTrophyKey } from '@/component/title/title-agreement'

defineOptions({ name: 'TitlePicker' })

const props = defineProps<{
	title: number[]
}>()

const { t, locale } = useI18n()
const router = useRouter()

// Apparat « Titre doré » (item 566), comme les autres apparats de la page d'un poireau.
// Récompense de fidélité LW+ (palier des 9 mois) depuis le 11/09/2026 : il n'est plus
// au marché, et le trophée Doré ne le verrouille plus.
const POMP_GOLDEN_TITLE = 566

interface TrophyWord {
	id: number
	code: string
	title: number
	rarity: number
	noun_translation?: number
	noun_gender?: number
	adj_translation?: number
	adj_gender?: number
}

const TROPHIES = LeekWars.trophies
const icon = ref<number>(props.title[0] || 0)
const noun = ref(props.title[1] || 0)
const adjective = ref(props.title[3] || 0)
const allNouns = ref<TrophyWord[]>([])
const allAdjectives = ref<TrophyWord[]>([])
const icons = ref<(TrophyWord | { id: 0, code: '', t: '', rarity: 0 })[]>([])
const gender = ref(props.title[2] || 1)
const gold = ref(!!props.title[4])
const goldPomp = computed(() => !!(store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', POMP_GOLDEN_TITLE) !== null))
const genders = [
	{ id: 1, code: 'male' },
	{ id: 2, code: 'female' }
]

// Libellés des menus accordés comme le rendu (title.vue) : chaque nom s'accorde
// avec son propre genre, chaque adjectif avec le genre imposé par le nom sélectionné.
const nouns = computed(() => [{ code: '', id: 0, t: '', rarity: 0 }].concat(allNouns.value.filter((w: TrophyWord) => w.id !== adjective.value).map((w: TrophyWord) => {
	const ag = titleAgreementGender(LeekWars.trophies[w.id - 1], gender.value, locale.value)
	return { code: w.code, id: w.id, t: t(agreedTrophyKey(w.code, ag)) as string, rarity: w.rarity }
}).sort((a, b) => a.t.localeCompare(b.t))))

const adjectives = computed(() => {
	const nounTrophy = noun.value ? LeekWars.trophies[noun.value - 1] : null
	const ag = titleAgreementGender(nounTrophy, gender.value, locale.value)
	return [{ code: '', id: 0, t: '', rarity: 0 }].concat(allAdjectives.value.filter((w: TrophyWord) => w.id !== noun.value).map((w: TrophyWord) => {
		return { code: w.code, id: w.id, t: t(agreedTrophyKey(w.code, ag)) as string, rarity: w.rarity }
	}).sort((a, b) => a.t.localeCompare(b.t)))
})

LeekWars.loadTrophyWords().then(words => {
	allNouns.value = (words as TrophyWord[]).filter((w: TrophyWord) => w.title & 1)
	allAdjectives.value = (words as TrophyWord[]).filter((w: TrophyWord) => w.title & 2)
	icons.value = ([{ id: 0, code: '', t: '', rarity: 0 } as (TrophyWord | { id: 0, code: '', t: '', rarity: 0 })]).concat(words as TrophyWord[]).sort((a, b) => a.rarity - b.rarity)
})

function changeNoun() {
	if (noun.value) {
		const trophy = LeekWars.trophies[noun.value - 1]
		if (gender.value === 0) {
			gender.value = (trophy.noun_translation & 1) ? 1 : 2
		} else if ((trophy.noun_translation & gender.value) === 0) {
			gender.value = trophy.noun_translation
		}
	} else {
		const adjTrophy = adjective.value ? LeekWars.trophies[adjective.value - 1] : null
		if (!adjTrophy || !(adjTrophy.adj_translation & 2)) {
			gender.value = 1
		}
	}
}

function getTitle() {
	if (icon.value || noun.value) return [icon.value, noun.value, gender.value, adjective.value, gold.value ? 1 : 0]
	return []
}

function toggleGold() {
	if (!goldPomp.value) {
		// L'apparat n'est plus au marché : il se gagne avec 9 mois de LW+. La page LW+
		// montre la frise des récompenses, le Titre doré compris.
		router.push('/lwplus')
		return
	}
	gold.value = !gold.value
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
	// Tout sur la même ligne d'axe : les champs n'ont pas la même hauteur (celui de
	// l'icône porte une image de 25 px), ils se centrent au lieu de s'étirer.
	align-items: center;
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
	align-items: center;
	&.en {
		flex-direction: row-reverse;
	}
}
// Le bouton d'effacement à la hauteur des champs : le v-btn par défaut fait 43 px et
// dépassait la ligne des deux côtés.
.v-btn {
	width: 32px;
	min-width: 32px;
	height: 32px;
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
	// --grey-8 est un gris de l'échelle claire, que le bloc sombre ne redéfinit
	// pas. Et la ligne étant devenue un flex, la rareté se pousse à droite
	// elle-même, là où le #append de v-list-item la plaçait.
	color: var(--text-color-secondary);
	font-size: 13px;
	padding-left: 20px;
	margin-left: auto;
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
// Une pastille juste assez large pour son contenu, centrée sous les champs : une bande
// pleine largeur donnait plus de poids à l'option qu'au titre lui-même.
.gold-option {
	display: flex;
	align-items: center;
	gap: 8px;
	width: fit-content;
	margin: 16px auto 0;
	padding: 3px 10px;
	border: 1px solid var(--border);
	border-radius: var(--radius);
	cursor: pointer;
	color: var(--text-color-secondary);
	img {
		width: 24px;
		height: 24px;
	}
	&.on {
		color: var(--rank-first);
		border-color: color-mix(in srgb, var(--rank-first) 50%, var(--border));
	}
	// Verrouillé : l'image reste, en retrait, et le cadenas dit que ça s'achète.
	&.locked img {
		filter: grayscale(1);
		opacity: 0.6;
	}
	:deep(.lw-checkbox) {
		pointer-events: none;
	}
}
</style>