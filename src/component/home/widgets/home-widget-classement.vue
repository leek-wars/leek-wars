<template>
	<div class="classement-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<div class="head">
				<span class="rank">{{ t('main.place') }}</span>
				<span class="name">{{ nameColumn }}</span>
				<span class="talent">{{ t('main.talent') }}</span>
			</div>
			<router-link v-for="row in rows" :key="row.id" v-ripple :to="linkFor(row)" class="row" :class="{ me: isMe(row) }">
				<span class="rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
				<!-- La classe va sur l'activateur, pas sur le rich-tooltip : sa racine
					est un v-menu, qui avale les attributs de l'appelant. -->
				<span class="name">
					<component :is="tooltipComponent" :id="row.id" v-slot="{ props }" :bottom="true">
						<span v-bind="props" :class="rankClass(row.rank)">{{ row.name }}</span>
					</component>
				</span>
				<flag v-if="row.country" :code="row.country" :clickable="false" class="flag" />
				<span class="talent">{{ $filters.number(row.talent) }}</span>
			</router-link>
			<div v-if="!rows.length" class="none">{{ t('nobody') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'

	defineOptions({ name: 'HomeWidgetClassement' })

	const props = defineProps<{ params?: { category?: string } }>()

	const t = useNamespacedT('home')

	const category = computed(() => props.params?.category || 'leek')
	const loaded = ref(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows = ref<any[]>([])

	// La colonne des noms dit de qui parle le classement, comme sur /ranking.
	const nameColumn = computed(() => t('main.' + category.value))
	const tooltipComponent = computed(() => {
		if (category.value === 'team') return RichTooltipTeam
		if (category.value === 'farmer') return RichTooltipFarmer
		return RichTooltipLeek
	})

	function linkFor(row: { id: number }): string {
		if (category.value === 'team') return '/team/' + row.id
		if (category.value === 'farmer') return '/farmer/' + row.id
		return '/leek/' + row.id
	}
	function rankClass(rank: number): string {
		return rank === 1 ? 'first' : rank === 2 ? 'second' : rank === 3 ? 'third' : ''
	}
	function isMe(row: { id: number }): boolean {
		const farmer = store.state.farmer
		if (!farmer) return false
		if (category.value === 'farmer') return row.id === farmer.id
		if (category.value === 'leek') return row.id in farmer.leeks
		return false
	}

	function load() {
		loaded.value = false
		LeekWars.get<{ ranking: unknown[] }>('ranking/get-active/' + category.value + '/talent/1/null').then((data) => {
			rows.value = (data.ranking ?? []).slice(0, 10)
			loaded.value = true
		}).error(() => { rows.value = []; loaded.value = true })
	}
	watch(category, load, { immediate: true })
</script>

<style lang="scss" scoped>
	.classement-widget {
		display: flex;
		flex-direction: column;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 8px 5px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 3px;
		font-size: 12px;
		text-transform: uppercase;
		color: var(--text-color-secondary);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.row:hover {
		background: var(--background-secondary);
	}
	// Le vert du thème, pas le vert du v2 écrit en dur (invisible en v3 sombre).
	.row.me {
		background: color-mix(in srgb, var(--primary-surface) 12%, transparent);
	}
	// Assez large pour l'intitulé de colonne, pas seulement pour deux chiffres :
	// « Place » y tient dans la plupart des langues, les plus longues (Placering,
	// Peringkat) s'y coupent proprement au lieu de mordre sur la colonne des noms.
	.rank {
		width: 46px;
		flex-shrink: 0;
		text-align: center;
		font-weight: bold;
		color: var(--text-color-secondary);
	}
	.head .rank {
		font-weight: normal;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.name {
		flex: 1;
		min-width: 0;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	// Podium : les jetons du thème (le v2 avait ces couleurs en dur, elles
	// tombaient sous le seuil de contraste sur le parchemin du v3 clair).
	.first { color: var(--rank-first); }
	.second { color: var(--rank-second); }
	.third { color: var(--rank-third); }
	.row:deep(.flag) {
		height: 13px;
		flex-shrink: 0;
	}
	// Largeur commune à l'en-tête et aux valeurs, sinon l'intitulé, plus large
	// qu'un talent à 4 chiffres, ne tombe pas au-dessus de sa colonne.
	.talent {
		min-width: 54px;
		text-align: right;
		font-weight: bold;
		color: var(--primary);
	}
	.head .talent {
		font-weight: normal;
		color: var(--text-color-secondary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
