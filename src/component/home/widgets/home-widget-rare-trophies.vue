<template>
	<div class="rare-trophies-widget">
		<loader v-if="!loaded" />
		<template v-else-if="rarest.length">
			<rich-tooltip-trophy v-for="trophy in rarest" :key="trophy.code" :trophy="trophy" :bottom="true" :instant="true" v-slot="{ props }">
				<router-link :to="'/trophies/' + farmerId" class="trophy-line" v-bind="props">
					<trophy-icon :code="trophy.code" class="trophy" />
					<div class="info">
						<span class="name">{{ trophy.name }}</span>
						<span class="rarity">{{ trophy.rarity }}%</span>
					</div>
				</router-link>
			</rich-tooltip-trophy>
		</template>
		<div v-else class="none">{{ t('no_trophy') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'

	defineOptions({ name: 'HomeWidgetRareTrophies' })

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const farmerId = computed(() => store.state.farmer?.id ?? 0)
	const loaded = ref(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rarest = ref<any[]>([])

	if (store.state.farmer) {
		LeekWars.get('trophy/get-farmer-trophies/' + store.state.farmer.id + '/' + locale.value).then(data => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const all: any[] = Object.values(data.trophies)
			rarest.value = all
				.filter(tr => tr.unlocked && tr.category !== 0)
				.sort((a, b) => a.rarity - b.rarity)
				.slice(0, 6)
			loaded.value = true
		}).error(() => { loaded.value = true })
	} else {
		loaded.value = true
	}
</script>

<style lang="scss" scoped>
	.rare-trophies-widget {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.trophy-line {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 6px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.trophy-line:hover {
		background: var(--background-secondary);
	}
	.trophy {
		width: 36px;
		height: 36px;
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rarity {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
