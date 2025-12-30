<template lang="html">
	<rich-tooltip-composition :id="compo.id" v-slot="{ props }" :bottom="true" :instant="true" class="rich">
		<div class="composition" v-bind="props">
			<emblem :team="{id: compo.team_id, emblem_changed: compo.emblem_changed}" />
			<div class="name">
				{{ compo.team_name }}
			</div>
			<span class="level">
				{{ $t('main.level_n', [compo.level]) }}
			</span>
			<div class="name">
				{{ compo.name }}
			</div>
			<talent :id="compo.team_id" :talent="compo.talent" category="team" />
			<br>
			<div class="level">
				{{ compo.leek_count }} <img class="icon" src="/image/icon/black/leek.png"> • {{ $t('main.level_n', [compo.total_level]) }}
			</div>
		</div>
	</rich-tooltip-composition>
</template>

<script lang="ts">
	import { Composition } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'

	@Component({ components: { RichTooltipComposition } })
	export default class GardenCompo extends Vue {
		@Prop() compo!: Composition
	}
</script>

<style lang="scss" scoped>
	.composition {
		padding: 10px 0;
	}
	.emblem {
		width: 120px;
		height: 120px;
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
		font-size: 15px;
		padding-top: 3px;
		color: var(--text-color-secondary);
		font-weight: 500;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		img {
			width: 16px;
			opacity: 0.5;
			margin: 0 3px;
		}
	}
#app.dark .icon {
	filter: invert(1);
}
</style>