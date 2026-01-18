<template lang="html">
	<v-tooltip bottom>
		<template #activator="{ props }">
			<span v-bind="props">
				<slot></slot>
			</span>
		</template>
		<div class="tooltip">
			<b>{{ $t('characteristic.' + characteristic) }}</b>
			<br>
			{{ $t('characteristic.' + characteristic + '_desc') }}
			<template v-if="total > 0 && (characteristic != 'frequency' || total > 100)">
				<br>
				<div v-if="base"><b class="effect">{{ $t('characteristic.base') }} : <span class="amount">{{ base }}</span></b></div>
				<div v-if="capitalSpent"><b class="effect">{{ $t('characteristic.invested') }} : <span class="amount">{{ invested }}</span></b></div>
				<div v-if="value != total"><b class="effect">{{ $t('main.components') }} : <span class="amount">{{ total - value }}</span></b></div>
				<div v-if="!test && capitalSpent">
					<b class="capital">{{ $t('characteristic.invested_capital') }} : <span class="amount">{{ capitalSpent }}</span></b>
				</div>
				<template v-if="characteristic == 'strength'">
					<b class="effect">{{ $t('characteristic.damage') }} : × <span class="damage">{{ (1 + total / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'agility'">
					<b class="effect">{{ $t('characteristic.damage_return') }} : × <span class="damage-return">{{ (1 + total / 100).toFixed(2) }}</span></b>
					<br>
					<b class="effect">{{ $t('characteristic.critical') }} : <span class="critical">{{ (total / 10).toFixed(2) }}%</span></b>
				</template>
				<template v-else-if="characteristic == 'science'">
					<b class="effect">{{ $t('characteristic.boost') }} : × <span class="damage">{{ (1 + total / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'wisdom'">
					<b class="effect">{{ $t('characteristic.heal') }} : × <span class="heal">{{ (1 + total / 100).toFixed(2) }}</span></b>
					<br>
					<b class="effect">{{ $t('characteristic.life_steal') }} : <span class="life-steal">{{ Math.round(total / 10) }}%</span></b>
				</template>
				<template v-else-if="characteristic == 'magic'">
					<b class="effect">{{ $t('characteristic.shackle_poison') }} : × <span class="damage">{{ (1 + total / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'resistance'">
					<b class="effect">{{ $t('characteristic.shield') }} : × <span class="damage">{{ (1 + total / 100).toFixed(2) }}</span></b>
				</template>
				<template v-else-if="characteristic == 'cores'">
					<b class="effect">{{ $t('characteristic.operations') }} : <span class="damage">{{ total }}M</span></b>
				</template>
				<template v-else-if="characteristic == 'ram'">
					<b class="effect">{{ $t('characteristic.chips') }} : {{ total }}</b>
					<br>
					<b class="effect">{{ $t('characteristic.variables') }} : {{ total }}M ({{ total * 8 }}Mo)</b>
				</template>
			</template>
		</div>
	</v-tooltip>
</template>

<script lang="ts">
	import { COSTS } from '@/model/leek'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: "characteristic-tooltip" })
	export default class CharacteristicTooltip extends Vue {
		@Prop({ required: true }) characteristic!: string
		@Prop({ required: true }) value!: number
		@Prop({ required: true }) total!: number
		@Prop({ required: true }) leek!: any
		@Prop({ required: true }) test!: boolean

		get base() {
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
				mp: 3,
			} as any
			return base[this.characteristic]
		}

		get invested() {
			return this.value - this.base
		}

		get capitalSpent() {
			
			let characLeft = this.invested
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