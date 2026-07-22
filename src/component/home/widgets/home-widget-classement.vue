<template>
	<div class="classement-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<router-link v-for="row in rows" :key="row.id" v-ripple :to="linkFor(row)" class="row" :class="{ me: isMe(row) }">
				<span class="rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
				<span class="name">{{ row.name }}</span>
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

	defineOptions({ name: 'HomeWidgetClassement' })

	const props = defineProps<{ params?: { category?: string } }>()

	const t = useNamespacedT('home')

	const category = computed(() => props.params?.category || 'leek')
	const loaded = ref(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rows = ref<any[]>([])

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
	.row:deep(.flag) {
		height: 13px;
		flex-shrink: 0;
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
