<template lang="html">
	<div>
		<div class="stats">
			<div>
				<range-view :min="chip.min_range" :max="chip.max_range" :type="chip.launch_type" />
				<span>
					<span v-if="chip.min_range == chip.max_range">{{ $t('effect.range_fixed', [chip.min_range]) }}</span>
					<span v-else>{{ $t('effect.range', [chip.min_range, chip.max_range]) }}</span>&nbsp;<span v-if="chip.launch_type !== 7">{{ $t('effect.launch_' + chip.launch_type) }}</span>
					<div v-if="!chip.los">
						[<b>{{ $t('effect.through_obstacles') }}</b>]
					</div>
				</span>
			</div>
			<div>
				<img src="/image/charac/small/tp.png">{{ chip.cost }}
			</div>
			<area-view v-if="chip.area != Area.SINGLE_CELL" :area="chip.area" />
			<div v-if="chip.cooldown != 0">
				<i18n path="effect.cooldown">
					<span slot="turns" v-html="$tc('effect.n_turns', chip.cooldown >= 0 ? chip.cooldown : '∞')"></span>
				</i18n>
				<b v-if="chip.team_cooldown" v-html="'&nbsp;' + $t('effect.team_cooldown')"></b>
			</div>
			<i18n v-if="chip.initial_cooldown > 0" tag="div" path="effect.initial_cooldown">
				<span slot="turns" v-html="$tc('effect.n_turns', chip.initial_cooldown)"></span>
			</i18n>
			<i18n v-if="chip.max_uses != -1" path="effect.max_uses" tag="div">
				<span slot="uses" v-html="$tc('effect.n_uses', chip.max_uses)"></span>
			</i18n>
			<effect-view v-for="(effect, e) in chip.effects" :key="chip.id + '_' + e" :effect="effect" :leek="leek" />
		</div>
		<summon-view v-if="summon" :summon="summon" @input="$emit('input', $event)" />
	</div>
</template>

<script lang="ts">
	import AreaView from '@/component/market/area-view.vue'
	import EffectView from '@/component/market/effect.vue'
	import RangeView from '@/component/market/range-view.vue'
	import SummonView from '@/component/market/summon-view.vue'
	import { Area } from '@/model/area'
	import { ChipTemplate } from '@/model/chip'
	import { EffectType } from '@/model/effect'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({
		name: 'chip-preview',
		components: {
			'range-view': RangeView,
			'effect-view': EffectView,
			'area-view': AreaView,
			'summon-view': SummonView
		}
	})
	export default class ChipPreview extends Vue {
		@Prop() chip!: ChipTemplate
		@Prop() leek!: Leek
		Area = Area
		get summon() {
			for (const effect of this.chip.effects) {
				if (effect.id === EffectType.SUMMON) {
					return LeekWars.summonTemplates[effect.value1]
				}
			}
			return null
		}
	}
</script>

<style src='./item-preview.scss' lang='scss'></style>