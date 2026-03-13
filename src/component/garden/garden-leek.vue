<template lang="html">
	<rich-tooltip-leek v-if="leek" :id="leek.id" v-slot="{ props }" :bottom="!(leek.id in $store.state.farmer.leeks)" :instant="true">
		<div v-if="leek" class="leek" v-bind="props">
			<div class="image">
				<leek-image :leek="leek" :scale="LeekWars.mobile ? 0.5 : 0.70" />
			</div>
			<div class="name">{{ leek.name }}</div>
			<talent :id="leek.id" :talent="leek.talent" category="leek" />
			<div class="level">
				{{ $t('main.level_n', [leek.level]) }}
				<flag v-if="leek.country" :code="leek.country" />
			</div>
		</div>
	</rich-tooltip-leek>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'

	@Options({ name: 'garden-leek', components: { RichTooltipLeek } })
	export default class GardenLeek extends Vue {
		@Prop() leek!: Leek
	}
</script>

<style lang="scss" scoped>
	.leek {
		width: 100%;
		height: 100%;
		padding: 10px 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
	}
	.image svg {
		vertical-align: bottom;
		height: 100%;
	}
	.name {
		font-size: 17px;
		font-weight: 500;
		padding: 8px 3px;
		padding-bottom: 3px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
	}
	.talent {
		margin: 5px 0;
	}
	.level {
		padding-top: 3px;
		font-size: 14px;
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