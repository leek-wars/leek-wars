<template lang="html">
	<div class="item-preview">
		<div class="stats">
			<div>
				<range-view :min="weapon.min_range" :max="weapon.max_range" :type="weapon.launch_type" />
				<span>
					<span v-if="weapon.min_range == weapon.max_range">{{ $t('effect.range_fixed', [weapon.min_range]) }}</span>
					<span v-else>{{ $t('effect.range', [weapon.min_range, weapon.max_range]) }}</span>&nbsp;<span v-if="weapon.launch_type !== 7">{{ $t('effect.launch_' + weapon.launch_type) }}</span>
					<template v-if="!weapon.los">
						<br>
						[<b>{{ $t('effect.through_obstacles') }}</b>]
					</template>
				</span>
			</div>

			<div>
				<img src="/image/charac/small/tp.png">{{ weapon.cost }}
			</div>

			<i18n v-if="weapon.max_uses != -1" path="effect.max_uses" tag="div">
				<span slot="uses" v-html="$tc('effect.n_uses', weapon.max_uses)"></span>
			</i18n>

			<area-view v-if="weapon.area != Area.SINGLE_CELL" :area="weapon.area" />

			<effect-view v-for="(effect, e) in weapon.effects" :key="e" :effect="effect" :leek="leek" />

			<effect-view v-for="(effect, e) in weapon.passive_effects" :key="'_' + e" :effect="effect" :passive="true" :leek="leek" />
		</div>
	</div>
</template>

<script lang="ts">
	import AreaView from '@/component/market/area-view.vue'
	import EffectView from '@/component/market/effect.vue'
	import RangeView from '@/component/market/range-view.vue'
	import { Area } from '@/model/area'
	import { Leek } from '@/model/leek'
	import { WeaponTemplate } from '@/model/weapon'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({
		components: { 'range-view': RangeView, 'effect-view': EffectView, 'area-view': AreaView }
	})
	export default class WeaponPreview extends Vue {
		@Prop() weapon!: WeaponTemplate
		@Prop() leek!: Leek
		Area = Area
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>