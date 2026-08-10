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
		<div v-if="fights.length" ref="fightsEl" class="fights">
			<fights-history :fights="visibleFights" />
		</div>
		<div v-else class="none">{{ t('no_fight') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, defineAsyncComponent, ref } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'

	defineOptions({
		name: 'HomeWidgetTalent',
		components: { 'fights-history': defineAsyncComponent(() => import('@/component/history/fights-history.vue')) }
	})

	const t = useNamespacedT('home')

	const farmer = computed(() => store.state.farmer)
	const fights = computed(() => (store.state.farmer?.fight_history ?? []).slice(0, 12))
	// Autant de combats que la hauteur du panel le permet, jamais coupés.
	const fightsEl = ref<HTMLElement | null>(null)
	const fightCount = useFitCount(fightsEl, '.wrapper', 12)
	const visibleFights = computed(() => fights.value.slice(0, fightCount.value))
</script>

<style lang="scss" scoped>
	.talent-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	// La liste occupe la hauteur restante ; overflow hidden en filet de sécurité,
	// le nombre de combats affichés est calculé pour tenir sans couper.
	.fights {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.fights :deep(.history) {
		padding: 0;
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
		.win { color: var(--result-win-text); }
		.draw { color: var(--result-draw); }
		.lose { color: var(--result-defeat-text); }
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
