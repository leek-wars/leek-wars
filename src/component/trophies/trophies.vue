<template>
	<div class="page">
		<div class="page-bar page-header">
			<div class="page-title">
				<v-icon class="page-icon">mdi-trophy</v-icon>
				<div class="page-title-text">
					<h1>
						<breadcrumb :items="breadcrumb_items" :raw="true" />
					</h1>
				</div>
			</div>
			<div class="tabs">
				<v-menu bottom offset-y :max-width="600">
					<template #activator="{ props }">
						<div class="tab" v-bind="props">
							<v-icon>{{ sort_icon }}</v-icon> {{ $t('sort_by', [$t('sort_' + sort_by).toLowerCase()]) }}
						</div>
					</template>
					<v-list :dense="true" class="version-menu">
						<v-list-item v-ripple @click="sort_by = 'index'">
							<v-icon class="list-icon">mdi-sort-variant</v-icon>
							{{ $t('sort_index') }}
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'rarity'">
							<v-icon class="list-icon">mdi-star-outline</v-icon>
							{{ $t('sort_rarity') }}
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'points'">
							<v-icon class="list-icon">mdi-trophy-outline</v-icon>
							{{ $t('sort_points') }}
						</v-list-item>
						<v-list-item v-ripple @click="sort_by = 'date'">
							<v-icon class="list-icon">mdi-calendar</v-icon>
							{{ $t('sort_date') }}
						</v-list-item>
					</v-list>
				</v-menu>
				<div class="tab" @click="group_by_categories = !group_by_categories">
					<span>{{ $t('group_by_categories') }}</span>
					<lw-switch :model-value="group_by_categories" />
				</div>
				<div class="tab" @click="hide_unlocked = !hide_unlocked">
					<span>{{ $t('hide_unlocked') }}</span>
					<lw-switch :model-value="hide_unlocked" />
				</div>
			</div>
		</div>
		<panel class="first global">
			<template #content>
				<loader v-show="!loaded" />
				<div v-if="loaded && farmer" class="content">
					<div class="stats">
						<router-link :to="'/farmer/' + farmer.id">
							<avatar :farmer="farmer" />
						</router-link>
						<div class="right">
							<div class="header">
								<div>
									<span class="points">{{ $filters.number(point) }}</span> <span class="total">/ {{ $filters.number(totalPoint) }} — {{ Math.floor(100 * point / totalPoint) }}%</span>
								</div>
								<div class="counters">
									<div class="counter">
										<img :src="'/image/icon/trophy/' + 0 + '.svg'">
										{{ count }} / {{ total }}
									</div>
									<div v-if="!LeekWars.mobile"> — </div>
									<div class="difficulties">
										<v-tooltip v-for="(c, i) in count_by_difficulty_filter" :key="i">
											<template #activator="{ props }">
												<span class="counter" v-bind="props">
													<img :src="'/image/icon/trophy/' + i + '.svg'">
													<span>{{ c }}</span>
												</span>
											</template>
											{{ $t('main.difficulty_' + i) }}
										</v-tooltip>
									</div>
								</div>
							</div>
							<div class="global-bar">
								<div :class="{ blue: blue_bar }" :style="{width: (loaded ? Math.floor(100 * point / totalPoint) : 0) + '%'}" class="bar striked"></div>
							</div>
						</div>
					</div>
					<div ref="closet" class="closet">
						<div>
							<h4><v-icon>mdi-trophy-outline</v-icon> {{ $t('best_trophies') }}</h4>
							<div class="trophies">
								<rich-tooltip-trophy v-for="(trophy, t) in best_trophies" :key="t" :trophy="trophy" :bottom="true" :instant="true" @update:model-value="$emit('update:modelValue', $event)">
									<router-link :to="'/trophy/' + trophy.code">
										<trophy-icon :code="trophy.code" class="trophy" />
									</router-link>
								</rich-tooltip-trophy>
							</div>
						</div>
						<div>
							<h4><v-icon>mdi-star-outline</v-icon> {{ $t('rarest_trophies') }}</h4>
							<div class="trophies">
								<rich-tooltip-trophy v-for="(trophy, t) in rarest_trophies" :key="t" v-slot="{ props }" :trophy="trophy" :bottom="true" :instant="true" @update:model-value="$emit('update:modelValue', $event)">
									<router-link :to="'/trophy/' + trophy.code">
										<trophy-icon :code="trophy.code" class="trophy" v-bind="props" />
									</router-link>
								</rich-tooltip-trophy>
							</div>
						</div>
						<div>
							<h4><v-icon>mdi-history</v-icon> {{ $t('latest_trophies') }}</h4>
							<div class="trophies">
								<rich-tooltip-trophy v-for="(trophy, t) in latest_trophies" :key="t" v-slot="{ props }" :trophy="trophy" :bottom="true" :instant="true" @update:model-value="$emit('update:modelValue', $event)">
									<router-link :to="'/trophy/' + trophy.code">
										<trophy-icon :code="trophy.code" class="trophy" v-bind="props" />
									</router-link>
								</rich-tooltip-trophy>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>
		<panel v-if="!group_by_categories" :icon="LeekWars.trophyCategoriesIcons[0]">
			<template #title>{{ $t('trophies') }}</template>
			<template #content>
				<loader v-show="!loaded" />
				<div v-if="loaded" class="trophies">
					<trophy v-for="trophy in sorted_trophies" :key="trophy.id" :trophy="trophy" />
				</div>
			</template>
		</panel>
		<template v-else>
			<panel v-for="category in categories" :key="category.id" :icon="LeekWars.trophyCategoriesIcons[category.id - 1]" :toggle="'trophies/toggle-' + category.id">
				<template #title>{{ $t('trophy.category_' + category.name) }}</template>
				<template #actions>
					<div v-if="category.id !== 6" class="category-bar-wrapper">
						<div class="stats">{{ $filters.number(points[category.id] || 0) }} / {{ $filters.number(totalPoints[category.id] || 0) }}</div>
						<div class="category-bar">
							<div :style="{width: (loaded && totals[category.id] ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0) + '%'}" class="bar striked"></div>
						</div>
						<div class="stats">{{ loaded && totals[category.id] ? Math.floor(100 * progressions[category.id] / totals[category.id]) : 0 }}%</div>
					</div>
				</template>
				<template #content>
					<loader v-show="!loaded" />
					<div v-if="loaded" class="trophies">
						<trophy v-for="trophy in trophies[category.id]" :key="trophy.id" :trophy="trophy" />
					</div>
				</template>
			</panel>
		</template>
		<panel icon="mdi-chart-line" class="last">
			<template #title>{{ $t('stats') }}</template>
			<template #content>
				<loader v-show="!loaded" />
				<div v-if="loaded" class="statistics">
					<div v-for="(variable, v) in variables" :key="v" class="stat">
						<i class="key">{{ String(v).split('.')[1] }}</i>
						<span class="value">{{ $filters.number(variable) }}</span>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Breadcrumb from '../forum/breadcrumb.vue'
import Trophy from './trophy.vue'
import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'
import { emitter } from '@/model/emitter'

defineOptions({ name: 'Trophies', i18n: {}, mixins: [...mixins] })

type TrophyData = (typeof LeekWars.trophies)[number]

interface TrophyCategory {
	id: number
	name: string
}

const { locale } = useI18n()
const t = useNamespacedT('trophies')
const route = useRoute()

const all_trophies = ref<TrophyData[]>([])
const raw_trophies = ref<{[key: number]: TrophyData[]}>({})
const progressions = ref<{[key: number]: number}>({})
const point = ref(0)
const totalPoint = ref(0)
const points = ref<{[key: number]: number}>({})
const totals = ref<{[key: number]: number}>({})
const totalPoints = ref<{[key: number]: number}>({})
const raw_categories = LeekWars.trophyCategories as unknown as TrophyCategory[]
const count = ref(0)
const total = ref(0)
const title = ref<string | null>(null)
const loaded = ref(false)
const hide_unlocked = ref(localStorage.getItem('options/trophies/hide-unlocked') === 'true')
const group_by_categories = ref(localStorage.getItem('options/trophies/group-by-category') !== null
	? localStorage.getItem('options/trophies/group-by-category') === 'true'
	: true)
const sort_by = ref<string>(localStorage.getItem('options/trophies/sort') || 'index')
const count_by_difficulty = ref<number[]>([0, 0, 0, 0, 0, 0])
const farmer = ref<{id: number, name: string} | null>(null)
const variables = ref<Record<string, number>>({})

const id = computed(() => route.params.id || (store.state.farmer ? store.state.farmer.id : null))

const trophies = computed(() => {
	const result: {[key: number]: TrophyData[]} = {}
	for (const category in raw_trophies.value) {
		result[category] = raw_trophies.value[category].filter(tr => (category !== '6' || tr.unlocked) && (!hide_unlocked.value || !tr.unlocked))
		if (sort_by.value === 'rarity') result[category].sort((a, b) => a.rarity - b.rarity)
		else if (sort_by.value === 'points') result[category].sort((a, b) => b.points - a.points)
		else if (sort_by.value === 'date') result[category].sort((a, b) => b.date - a.date)
	}
	return result
})

const categories = computed(() => raw_categories.filter(c => c.id !== 0 && (c.id !== 6 || progressions.value[6] !== 0) && (!loaded.value || !trophies.value[c.id] || trophies.value[c.id].length)))

const sorted_trophies = computed(() => {
	const result = all_trophies.value.filter(tr => tr.category !== 0 && (tr.category !== 6 || tr.unlocked) && (!hide_unlocked.value || !tr.unlocked))
	if (sort_by.value === 'rarity') result.sort((a, b) => a.rarity - b.rarity)
	else if (sort_by.value === 'points') result.sort((a, b) => b.points - a.points)
	else if (sort_by.value === 'date') result.sort((a, b) => b.date - a.date)
	return result
})

// Nombre de trophées mis en avant par colonne : autant qu'il en tient, jusqu'à
// 10. La mesure porte sur la COLONNE (`flex: 1`, donc un tiers de la vitrine
// quoi qu'elle contienne) et non sur la rangée d'icônes, dont la largeur
// dépendrait du compte qu'on cherche à calculer — le compte se mordrait la
// queue et ne remonterait jamais quand la fenêtre s'élargit.
const MAX_HIGHLIGHTED = 10
const TROPHY_SIZE = 43
const TROPHIES_PADDING = 20
const closet = ref<HTMLElement | null>(null)
const highlight_count = ref(7)
let closet_observer: ResizeObserver | null = null

function updateHighlightCount() {
	const column = closet.value?.firstElementChild as HTMLElement | undefined
	if (!column) return
	const inner = column.clientWidth - TROPHIES_PADDING
	if (inner <= 0) return
	highlight_count.value = Math.min(MAX_HIGHLIGHTED, Math.max(3, Math.floor(inner / TROPHY_SIZE)))
}

// La vitrine n'existe qu'une fois les trophées chargés : on s'accroche au ref
// plutôt qu'à onMounted, qui passerait avant elle.
watch(closet, el => {
	if (closet_observer) { closet_observer.disconnect(); closet_observer = null }
	if (el) {
		closet_observer = new ResizeObserver(() => updateHighlightCount())
		closet_observer.observe(el)
		nextTick(() => updateHighlightCount())
	}
}, { immediate: true })

onBeforeUnmount(() => {
	if (closet_observer) { closet_observer.disconnect(); closet_observer = null }
})

const best_trophies = computed(() => all_trophies.value.filter(tr => tr.unlocked && tr.category !== 0).sort((a, b) => b.points - a.points).slice(0, highlight_count.value))
const rarest_trophies = computed(() => all_trophies.value.filter(tr => tr.unlocked && tr.category !== 0).sort((a, b) => a.rarity - b.rarity).slice(0, highlight_count.value))
const latest_trophies = computed(() => all_trophies.value.filter(tr => tr.unlocked && tr.category !== 0).sort((a, b) => b.date - a.date).slice(0, highlight_count.value))

const breadcrumb_items = computed(() => [
	{ name: farmer.value ? farmer.value.name : '...', link: '/farmer/' + id.value },
	{ name: t('trophies'), link: '/trophies/' + id.value },
])
const count_by_difficulty_filter = computed(() => count_by_difficulty.value.filter(d => d > 0))
const blue_bar = computed(() => count.value === total.value)
const sort_icon = computed(() => ({
	index: 'mdi-sort-variant',
	points: 'mdi-trophy-outline',
	rarity: 'mdi-star-outline',
	date: 'mdi-calendar',
} as {[key: string]: string})[sort_by.value])

function initCategory(category: number) {
	raw_trophies.value[category] = []
	progressions.value[category] = 0
	points.value[category] = 0
	totals.value[category] = 0
	totalPoints.value[category] = 0
}

function update() {
	const requestedId = id.value
	loaded.value = false
	count.value = 0
	total.value = 0
	point.value = 0
	totalPoint.value = 0
	title.value = null
	all_trophies.value = []
	if (!requestedId) return
	(LeekWars.trophyCategories as unknown as TrophyCategory[]).forEach((c: TrophyCategory) => initCategory(c.id))
	LeekWars.get('trophy/get-farmer-trophies/' + requestedId + '/' + locale.value).then(data => {
		if (requestedId !== id.value) return
		for (const tk in data.trophies) {
			farmer.value = data.farmer
			variables.value = data.variables
			delete variables.value['trophy.farmer']
			const trophy = data.trophies[tk]
			all_trophies.value = data.trophies
			if (trophy.category === 0) continue
			// Catégorie inconnue des game data (cache pas encore rafraîchi après l'ajout
			// d'une catégorie) : sans ce garde-fou toute la page reste sur ses loaders.
			if (!raw_trophies.value[trophy.category]) initCategory(trophy.category)
			raw_trophies.value[trophy.category].push(trophy)
			totals.value[trophy.category]++
			totalPoints.value[trophy.category] += trophy.points
			totalPoint.value += trophy.points
			if (trophy.unlocked) {
				progressions.value[trophy.category]++
				points.value[trophy.category] += trophy.points
				point.value += trophy.points
				count_by_difficulty.value[trophy.difficulty]++
			}
		}
		for (const category in raw_trophies.value) {
			raw_trophies.value[category].sort((a, b) => a.index - b.index)
		}
		count.value = data.count
		total.value = data.total
		if (store.state.farmer && id.value === store.state.farmer.id) {
			title.value = t('title_me')
		} else {
			title.value = t('title', [data.farmer.name])
		}
		const subtitle = count.value + ' / ' + total.value + ' - ' + Math.floor(100 * count.value / total.value) + '%'
		if (store.state.farmer && id.value === store.state.farmer.id) {
			LeekWars.setTitle(t('title_me'), subtitle)
		} else {
			LeekWars.setTitle(t('title', [data.farmer.name]), subtitle)
		}
		emitter.emit('loaded')
		loaded.value = true
	})
}

watch(id, update, { immediate: true })

watch(hide_unlocked, () => {
	localStorage.setItem('options/trophies/hide-unlocked', hide_unlocked.value ? 'true' : 'false')
})
watch(group_by_categories, () => {
	localStorage.setItem('options/trophies/group-by-category', group_by_categories.value ? 'true' : 'false')
})
watch(sort_by, () => {
	localStorage.setItem('options/trophies/sort', sort_by.value)
})
</script>

<style lang="scss" scoped>
	.content:not(.first) {
		padding: 8px;
	}
	.v-input--switch {
		margin-right: -12px;
	}
	.global {
		h4 {
			margin-left: 15px;
			margin-right: 15px;
			margin-top: 5px;
			font-size: 17px;
			display: flex;
			align-items: center;
			i {
				margin-right: 4px;
			}
		}
		:deep(.content) {
			padding: 0;
		}
		.stats {
			padding: 15px;
			font-weight: 500;
			display: flex;
			align-items: center;
			.right {
				flex: 1;
			}
			.avatar {
				margin-right: 15px;
				width: 100px;
				height: 100px;
			}
			.header {
				display: flex;
				justify-content: space-between;
			}
			.total {
				font-size: 18px;
				color: var(--text-color-secondary);
			}
			.points {
				font-size: 36px;
				font-weight: bold;
			}
			.percent {
				font-size: 18px;
				color: var(--text-color-secondary);
				float: right;
				margin-left: 10px;
			}
		}
		.counters {
			display: flex;
			align-items: center;
			.counter {
				display: flex;
				align-items: center;
				font-weight: 500;
				padding: 8px;
				font-size: 19px;
				img {
					width: 20px;
					margin-right: 6px;
				}
			}
			.difficulties {
				display: flex;
				align-items: center;
			}
		}
		.closet {
			display: flex;
			justify-content: space-between;
			gap: 8px;
			// Colonnes de largeur egale : c'est sur elle que se mesure le
			// nombre de trophees affiches, et elle ne doit donc pas dependre
			// de ce qu'elles contiennent. `min-width: 0` pour qu'une rangee
			// d'icones ne puisse pas imposer un plancher.
			> div {
				flex: 1;
				min-width: 0;
			}
		}
		.trophies {
			display: flex;
			gap: 0px;
			padding: 10px;
			.trophy {
				width: 43px;
				height: 43px;
				object-fit: contain;
				vertical-align: bottom;
			}
		}
	}
	#app.app .stats {
		flex-direction: column;
		.avatar {
			margin-right: 0;
			margin-bottom: 5px;
		}
		.right {
			align-self: stretch;
			.header {
				flex-direction: column;
				text-align: center;
			}
		}
		.counters {
			flex-direction: column;
		}
	}
	#app.app .closet {
		flex-direction: column;
	}
	.global-bar {
		height: 14px;
		position: relative;
		background: var(--pure-white);
		border-radius: var(--radius-medium);
		margin: 5px 0;
		border: 1px solid var(--border);
		.bar {
			height: 12px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: var(--radius-medium);
		}
		.bar.blue {
			background: #008fbb;
		}
	}
	.panel :deep(.actions) {
		flex: 1;
	}
	.category-bar-wrapper {
		text-align: right;
		white-space: nowrap;
		display: flex;
		width: 100%;
		.stats {
			display: inline-block;
			color: var(--white);
			font-size: 16px;
			margin: 9px 10px;
		}
	}
	.category-bar {
		height: 12px;
		position: relative;
		background: var(--pure-white);
		border-radius: var(--radius-medium);
		flex: 1;
		margin-top: 12px;
		border: 1px solid var(--border);
		.bar {
			height: 10px;
			width: 0;
			background: #30bb00;
			position: absolute;
			border-radius: 5px;
		}
	}
	.bar {
		transition: all ease 0.3s;
	}
	.trophies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		grid-gap: 8px;
		padding: 8px;
	}
	#app.app .trophies {
		grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
	}
	.trophy {
		padding: 6px;
		.image {
			width: 50px;
			height: 50px;
			float: left;
			margin-right: 7px;
			margin-bottom: 2px;
		}
		.info {
			flex: 1;
		}
		.header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 5px;
		}
		.points {
			border: 1px solid var(--grey-9);
			padding: 1px 4px;
			border-radius: var(--radius);
			margin-left: 5px;
			font-weight: 500;
		}
		.name {
			font-size: 16px;
		}
		.fight-icon {
			width: 16px;
			height: 16px;
			opacity: 0.7;
			margin-right: 2px;
		}
		.trophy-bar {
			height: 10px;
			position: relative;
			background: var(--white);
			border-radius: var(--radius-medium);
			margin-top: 6px;
			border: 1px solid var(--grey-12);
			.bar {
				height: 8px;
				border-radius: var(--radius-medium);
				position: absolute;
				background: #30bb00;
			}
			&.full .bar {
				background: var(--grey-12);
			}
		}
		.unlock {
			display: flex-wrap;
			align-items: center;
			margin-top: 4px;
		}
		.date, .rarity {
			color: var(--grey-7);
			font-size: 13px;
			font-style: italic;
			.fight {
				color: var(--black);
			}
		}
	}
	#app.app .trophy {
		.image {
			width: 38px;
			height: 38px;
		}
		.trophy-bar {
			margin-left: 0;
			width: 100%;
		}
	}
	.trophy.locked {
		.image {
			opacity: 0.8;
		}
	}
	.list-icon {
		margin-right: 10px;
	}
	.statistics {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		grid-gap: 6px 20px;
		padding: 15px;
		.stat {
			display: flex;
			justify-content: space-between;
			.value {
				font-weight: 500;
			}
		}
	}
</style>