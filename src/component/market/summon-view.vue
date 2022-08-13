<template lang="html">
	<div class="summon">
		<h4>{{ $t('characteristic.characteristics') }}</h4>
		<div class="characteristics">
			<div class="summon-image">
				<img :src="'/image/bulb/' + summon.name + '_front.png'" width="width">
			</div>
			<div>
				<characteristic-tooltip v-for="c of LeekWars.characteristics_table" :key="c" v-slot="{ on }" :characteristic="c" :value="c === 'frequency' ? 0 : summon.characteristics[c][1]" :leek="summon.characteristics" :test="true">
					<div class="characteristic" v-on="on">
						<img :src="'/image/charac/' + c + '.png'" v-on="on">
						<span :class="'color-' + c">
							<span v-if="c == 'frequency'">0</span>
							<span v-else-if="summon.characteristics[c][0] == summon.characteristics[c][1]">
								{{ summon.characteristics[c][0] }}
							</span>
							<span v-else>
								{{ summon.characteristics[c][0] + " à " + summon.characteristics[c][1] }}
							</span>
						</span>
					</div>
				</characteristic-tooltip>
			</div>
		</div>
		<h4>{{ $t('main.chips') }}</h4>
		<div class="chips">
			<rich-tooltip-item v-for="chip of summon.chips" :key="chip.id" v-slot="{ on }" :item="LeekWars.items[chip]" :bottom="true" :instant="true" @input="$emit('input', $event)">
				<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" class="chip" v-on="on">
			</rich-tooltip-item>
		</div>
	</div>
</template>

<script lang="ts">

import { CHIPS } from '@/model/chips'
import { Component, Prop, Vue } from 'vue-property-decorator'
import CharacteristicTooltip from '../leek/characteristic-tooltip.vue'
const RichTooltipItem = () => import('@/component/rich-tooltip/rich-tooltip-item.vue')

@Component({ name: 'summon-view', components: {
	'characteristic-tooltip': CharacteristicTooltip,
	'rich-tooltip-item': RichTooltipItem
}})
export default class SummonView extends Vue {
	@Prop() summon!: any

	CHIPS = CHIPS
}

</script>

<style lang="scss" scoped>
	.summon {
		background: #f2f2f2;
		display: block;
	}
	.characteristics {
		display: flex;
		align-items: center;
	}
	.characteristic {
		display: inline-block;
		width: 50%;
		padding: 2px 0;
	}
	.summon h4 {
		padding: 8px;
		text-align: left;
		font-size: 15px;
	}
	.summon-image {
		flex: 1 0 90px;
		// margin-right: 10px;
		// margin-left: 10px;
		text-align: center;
		max-height: 120px;
	}
	.summon-image img {
		max-height: 110px;
	}
	.summon .characteristics {
		text-align: left;
	}
	.summon .characteristic span {
		display: inline-block;
		margin-top: 2px;
		vertical-align: top;
		margin-left: 2px;
		font-weight: bold;
	}
	.summon .characteristic img {
		width: 20px;
		vertical-align: bottom;
	}
	.summon .chips .chip {
		width: 50px;
		margin: 3px;
	}
</style>