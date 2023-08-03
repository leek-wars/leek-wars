<template lang="html">
	<rich-tooltip-leek v-if="leek" :id="leek.id" v-slot="{ on }" :bottom="!(leek.id in $store.state.farmer.leeks)" :instant="true">
		<div v-if="leek" class="leek" v-on="on">
			<div class="image">
				<leek-image :leek="leek" :scale="0.70" />
			</div>
			<div class="name">{{ leek.name }}</div>
			<talent :id="leek.id" :talent="leek.talent" category="leek" />
			<br>
			<div class="level">
				{{ $t('main.level_n', [leek.level]) }}
				<flag v-if="leek.country" :code="leek.country" />
			</div>
		</div>
	</rich-tooltip-leek>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	@Component({ name: 'garden-leek', components: { RichTooltipLeek } })
	export default class GardenLeek extends Vue {
		@Prop() leek!: Leek
	}
</script>

<style lang="scss" scoped>
	.leek {
		width: 100%;
		padding: 10px 0;
	}
	.image svg {
		vertical-align: bottom;
	}
	.name {
		font-size: 18px;
		font-weight: 500;
		padding: 5px;
		padding-bottom: 3px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.talent {
		margin: 5px 0;
	}
	.level {
		padding-top: 3px;
		font-size: 16px;
		color: var(--text-color-secondary);
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		.flag {
			max-width: 18px;
			max-height: 18px;
		}
	}
</style>