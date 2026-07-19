<template>
	<div class="ranking-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<router-link v-for="row in rows" :key="row.id" v-ripple :to="'/farmer/' + row.id" class="row" :class="{ me: row.me }">
				<span class="rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
				<span class="name">{{ row.name }}</span>
				<flag v-if="row.country" :code="row.country" :clickable="false" />
				<span class="talent">{{ $filters.number(row.talent) }}</span>
			</router-link>
			<div v-if="!rows.length" class="none">{{ t('nobody') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import type { RankingFarmerRow } from '@/model/ranking'

	defineOptions({ name: 'HomeWidgetRanking' })

	const t = useNamespacedT('home')

	const loaded = ref(false)
	const rows = ref<RankingFarmerRow[]>([])

	function rankClass(rank: number): string {
		return rank === 1 ? 'first' : rank === 2 ? 'second' : rank === 3 ? 'third' : ''
	}

	LeekWars.get<{ ranking: RankingFarmerRow[] }>('ranking/get-active/farmer/talent/1/all').then((data) => {
		const list = (data.ranking ?? []).slice(0, 8)
		const me = store.state.farmer?.id
		for (const row of list) {
			if (me && row.id === me) row.me = 'me'
		}
		rows.value = list
		loaded.value = true
	}).error(() => { loaded.value = true })
</script>

<style lang="scss" scoped>
	.ranking-widget {
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: 4px;
		text-decoration: none;
		color: var(--text-color);
	}
	.row:hover {
		background: var(--background-secondary);
	}
	.row.me {
		background: rgba(95, 173, 27, 0.12);
	}
	.rank {
		width: 26px;
		text-align: center;
		font-weight: bold;
		color: var(--text-color-secondary);
	}
	.rank.first { color: #f1c40f; }
	.rank.second { color: #bdc3c7; }
	.rank.third { color: #cd7f32; }
	.name {
		flex: 1;
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.talent {
		font-weight: bold;
		color: var(--primary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
