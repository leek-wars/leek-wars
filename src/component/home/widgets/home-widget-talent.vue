<template>
	<div class="talent-widget">
		<div v-if="farmer" class="talent-header">
			<talent :id="farmer.id" :talent="farmer.talent" :max_talent="farmer.max_talent" :label="t('breeder_talent')" category="farmer" />
			<div class="ratio">
				<span class="win">{{ farmer.victories }}</span> /
				<span class="draw">{{ farmer.draws }}</span> /
				<span class="lose">{{ farmer.defeats }}</span>
			</div>
		</div>
		<h4 class="fights-title"><v-icon>mdi-history</v-icon> {{ t('latest_fights') }}</h4>
		<fights-history v-if="fights.length" :fights="fights" />
		<div v-else class="none">{{ t('no_fight') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({
		name: 'HomeWidgetTalent',
		components: { 'fights-history': defineAsyncComponent(() => import('@/component/history/fights-history.vue')) }
	})

	const t = useNamespacedT('home')

	const farmer = computed(() => store.state.farmer)
	const fights = computed(() => (store.state.farmer?.fight_history ?? []).slice(0, 6))
</script>

<style lang="scss" scoped>
	.talent-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.talent-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
	}
	.ratio {
		font-weight: bold;
		.win { color: var(--primary); }
		.draw { color: var(--text-color-secondary); }
		.lose { color: #c0392b; }
	}
	.fights-title {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-color-secondary);
		margin-top: 4px;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px 0;
	}
</style>
