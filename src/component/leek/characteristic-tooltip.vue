<template lang="html">
	<tooltip bottom>
		<template v-slot:activator="{ on }">
			<slot :on="on"></slot>
		</template>
		<div class="tooltip">
			<b>{{ $t('characteristic.' + characteristic) }}</b>
			<br>
			{{ $t('characteristic.' + characteristic + '_desc') }}
			<template v-if="value > 0 && (characteristic != 'frequency' || value > 100)">
				<br>
				<template v-if="!test && characteristic == 'life'">
					<b v-if="characteristic === 'life'" class="effect">{{ $t('characteristic.base_life') }} : <span class="amount">{{ leek.baseLife }}</span></b>
					<br>
					<b v-if="characteristic === 'life'" class="effect">{{ $t('characteristic.added_life') }} : <span class="amount">{{ base - leek.baseLife }}</span></b>
					<br>
				</template>
				<div v-if="characteristic !== 'life' && capitalSpent"><b class="effect">{{ $t('characteristic.base') }} : <span class="amount">{{ base }}</span></b></div>
				<div v-if="value != base"><b class="effect">{{ $t('main.components') }} : <span class="amount">{{ value - base }}</span></b></div>
				<div v-if="!test && capitalSpent">
					<b class="capital">{{ $t('characteristic.invested_capital') }} : <span class="amount">{{ capitalSpent }}</span></b>
				</div>
				<template v-if="characteristic == 'strength'">
					<b class="effect">{{ $t('characteristic.damage') }} : × <span class="damage">{{ (1 + value / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'agility'">
					<b class="effect">{{ $t('characteristic.damage_return') }} : × <span class="damage-return">{{ (1 + value / 100).toFixed(2) }}</span></b>
					<br>
					<b class="effect">{{ $t('characteristic.critical') }} : <span class="critical">{{ (value / 10).toFixed(2) }}%</span></b>
				</template>
				<template v-else-if="characteristic == 'science'">
					<b class="effect">{{ $t('characteristic.boost') }} : × <span class="damage">{{ (1 + value / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'wisdom'">
					<b class="effect">{{ $t('characteristic.heal') }} : × <span class="heal">{{ (1 + value / 100).toFixed(2) }}</span></b>
					<br>
					<b class="effect">{{ $t('characteristic.life_steal') }} : <span class="life-steal">{{ Math.round(value / 10) }}%</span></b>
				</template>
				<template v-else-if="characteristic == 'magic'">
					<b class="effect">{{ $t('characteristic.shackle_poison') }} : × <span class="damage">{{ (1 + value / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'resistance'">
					<b class="effect">{{ $t('characteristic.shield') }} : × <span class="damage">{{ (1 + value / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'cores'">
					<b class="effect">{{ $t('characteristic.operations') }} : <span class="damage">{{ value }}M</span></b>
				</template>
				<template v-else-if="characteristic == 'ram'">
					<b class="effect">{{ $t('characteristic.chips') }} : {{ value }}</b>
					<br>
					<b class="effect">{{ $t('characteristic.variables') }} : {{ value }}M ({{ value * 8 }}Mo)</b>
				</template>
			</template>
		</div>
	</tooltip>
</template>

<script lang="ts">
	import { COSTS } from '@/model/leek'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: "characteristic-tooltip" })
	export default class CharacteristicTooltip extends Vue {
		@Prop() characteristic!: string
		@Prop() base!: number
		@Prop() value!: number
		@Prop() leek!: any
		@Prop() test!: boolean

		get capitalSpent() {
			const base = {
				life: 100 + (this.leek.level - 1) * 3,
				strength: 0,
				wisdom: 0,
				agility: 0,
				resistance: 0,
				science: 0,
				magic: 0,
				frequency: 100,
				cores: 1,
				ram: 6,
				tp: 10,
				mp: 3
			} as any
			let characLeft = this.base - base[this.characteristic]
			let characAdded = 0
			let step = 0
			let usedCapital = 0
			while (characAdded < characLeft) {
				if (step < COSTS[this.characteristic].length - 1 && characAdded >= COSTS[this.characteristic][step + 1].step) {
					step++
				}
				const cost = COSTS[this.characteristic][step]
				characAdded += cost.sup
				usedCapital += cost.capital
			}
			return usedCapital
		}
	}
</script>

<style lang="scss" scoped>

</style>