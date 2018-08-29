<template lang="html">
	<div class="item-preview">
		<div class="header">
			<h2 class="name">{{ $t('chip.' + chip.name) }}</h2>
			<div class="level">{{ $t('effect.level_n', [chip.level]) }}</div>
		</div>
		<div class="constant">{{ "CHIP_" + chip.name.toUpperCase() }}</div>
		<div class="image sound">
			<img :src="'/image/chip/small/' + chip.name + '.png'" @click="LeekWars.playSound(chip, 'chip')">
		</div>
		<div v-if="$te('chip.' + chip.name + '_desc')" class="desc">{{ $t('chip.' + chip.name + "_desc") }}</div>
		<div class="stats">
			<div>
				<range-view :min="chip.min_range" :max="chip.max_range" :type="chip.launch_type" />
				<span>
					{{ $t('effect.range', [chip.min_range, chip.max_range]) }}
					<span v-if="chip.launch_type == 0">{{ $t('effect.in_lign') }}</span>
					<template v-if="!chip.los">
						<br>
						[<b>{{ $t('effect.through_obstacles') }}</b>]
					</template>
				</span>
			</div>
			<div>
				<img src="/image/charac/small/tp.png"> {{ chip.cost }}
			</div>
			<area-view v-if="chip.area != Area.SINGLE_CELL" :area="chip.area" />		
			<div v-if="chip.cooldown != 0">
				<span v-html="$t('effect.cooldown', [chip.cooldown >= 0 ? chip.cooldown : '∞'])"></span>
				<b v-if="chip.team_cooldown" v-html="'&nbsp;' + $t('effect.team_cooldown')"></b>
			</div>
			<div v-if="chip.initial_cooldown > 0" v-html="$t('effect.initial_cooldown', [chip.initial_cooldown])"></div>
			<effect-view v-for="(effect, e) in chip.effects" :key="e" :effect="effect" />
		</div>
		<summon-view v-if="summon" :summon="summon" />
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
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({
		components: {
			'range-view': RangeView,
			'effect-view': EffectView,
			'area-view': AreaView,
			'summon-view': SummonView
		}
	})
	export default class ChipPreview extends Vue {
		@Prop() chip!: ChipTemplate
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