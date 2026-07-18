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
			<h4 v-if="latest.length" class="section"><v-icon>mdi-history</v-icon> {{ t('latest_trophies') }}</h4>
			<div v-if="latest.length" class="trophy-row">
				<router-link v-for="trophy in latest" :key="trophy.code" :to="'/trophies/' + farmerId" :title="trophy.name">
					<trophy-icon :code="trophy.code" class="trophy" />
				</router-link>
			</div>
			<div v-else class="none">{{ t('no_trophy') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetTrophies' })

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const farmerId = computed(() => store.state.farmer?.id ?? 0)
	const loaded = ref(false)
	const count = ref(0)
	const total = ref(0)
	const points = ref(0)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const latest = ref<any[]>([])

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
			latest.value = all
				.filter(tr => tr.unlocked && tr.category !== 0)
				.sort((a, b) => b.date - a.date)
				.slice(0, 8)
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
