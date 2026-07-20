<template>
	<div class="leeks-widget">
		<rich-tooltip-leek v-for="leek in leeks" :id="leek.id" :key="leek.id" v-slot="{ props }">
			<router-link v-ripple :to="'/leek/' + leek.id" class="leek" v-bind="props">
				<leek-image :leek="leek" :scale="0.75" />
				<div class="name">{{ leek.name }}</div>
				<div class="talent-ranking">
					<talent :id="leek.id" :talent="leek.talent" :max_talent="leek.max_talent" category="leek" />
					<ranking-badge v-if="leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
				</div>
				<span class="level">{{ t('main.level_n', [leek.level]) }}</span>
			</router-link>
		</rich-tooltip-leek>
		<router-link v-if="canCreate" v-ripple to="/new-leek" class="leek new">
			<v-icon>mdi-plus</v-icon>
			<span>{{ t('main.new_leek') }}</span>
		</router-link>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	defineOptions({ name: 'HomeWidgetLeeks' })

	const t = useNamespacedT('home')

	const leeks = computed(() => store.state.farmer ? Object.values(store.state.farmer.leeks) : [])
	const canCreate = computed(() => !!store.state.farmer?.can_create_leek && leeks.value.length < 4)
</script>

<style lang="scss" scoped>
	.leeks-widget {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}
	.leek {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 130px;
		padding: 10px;
		text-decoration: none;
		color: var(--text-color);
	}
	.leek:hover {
		background: var(--background-secondary);
	}
	.name {
		font-weight: bold;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.talent-ranking {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 2px 0;
	}
	.level {
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.leek.new {
		justify-content: center;
		color: var(--text-color-secondary);
		border: 2px dashed var(--border);
		background: transparent;
		.v-icon {
			font-size: 32px;
		}
	}
</style>
