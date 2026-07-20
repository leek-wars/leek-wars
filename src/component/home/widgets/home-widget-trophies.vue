<template>
	<div class="trophies-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<div class="summary">
				<div class="stat">
					<div class="value">{{ count }} <span class="total">/ {{ total }}</span></div>
					<div class="label">{{ t('trophies_unlocked') }}</div>
				</div>
				<div class="stat">
					<div class="value">{{ points }}</div>
					<div class="label">{{ t('points') }}</div>
				</div>
			</div>
			<template v-for="s in sections" :key="s.key">
				<template v-if="s.list.length">
					<h4 class="section"><v-icon>{{ s.icon }}</v-icon> {{ t(s.key) }}</h4>
					<div class="trophy-row">
						<rich-tooltip-trophy v-for="trophy in s.list" :key="trophy.code" :trophy="trophy" :bottom="true" :instant="true" v-slot="{ props }">
							<router-link :to="'/trophies/' + farmerId" v-bind="props">
								<trophy-icon :code="trophy.code" class="trophy" />
							</router-link>
						</rich-tooltip-trophy>
					</div>
				</template>
			</template>
			<div v-if="!anyTrophies" class="none">{{ t('no_trophy') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'

	defineOptions({ name: 'HomeWidgetTrophies' })

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const farmerId = computed(() => store.state.farmer?.id ?? 0)
	const loaded = ref(false)
	const count = ref(0)
	const total = ref(0)
	const points = ref(0)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const best = ref<any[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rarest = ref<any[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const latest = ref<any[]>([])

	const sections = computed(() => [
		{ key: 'best_trophies', icon: 'mdi-trophy-outline', list: best.value },
		{ key: 'rarest_trophies', icon: 'mdi-star-outline', list: rarest.value },
		{ key: 'latest_trophies', icon: 'mdi-history', list: latest.value },
	])
	const anyTrophies = computed(() => best.value.length > 0)

	if (store.state.farmer) {
		LeekWars.get('trophy/get-farmer-trophies/' + store.state.farmer.id + '/' + locale.value).then(data => {
			count.value = data.count
			total.value = data.total
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const all: any[] = Object.values(data.trophies)
			let pts = 0
			for (const trophy of all) {
				if (trophy.unlocked && trophy.category !== 0) pts += trophy.points
			}
			points.value = pts
			const unlocked = all.filter(tr => tr.unlocked && tr.category !== 0)
			best.value = [...unlocked].sort((a, b) => b.points - a.points).slice(0, 8)
			rarest.value = [...unlocked].sort((a, b) => a.rarity - b.rarity).slice(0, 8)
			latest.value = [...unlocked].sort((a, b) => b.date - a.date).slice(0, 8)
			loaded.value = true
		})
	}
</script>

<style lang="scss" scoped>
	.trophies-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.summary {
		display: flex;
		gap: 12px;
	}
	.stat {
		flex: 1;
		text-align: center;
		background: var(--background-secondary);
		border-radius: 4px;
		padding: 10px;
	}
	.stat .value {
		font-size: 24px;
		font-weight: bold;
		color: var(--primary);
	}
	.stat .value .total {
		font-size: 15px;
		color: var(--text-color-secondary);
		font-weight: normal;
	}
	.stat .label {
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.section {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-color-secondary);
		margin-top: 4px;
	}
	.trophy-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.trophy-row .trophy {
		width: 40px;
		height: 40px;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
	}
</style>
