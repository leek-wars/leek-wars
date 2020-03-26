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
					<b v-if="characteristic == 'life'" class="effect">{{ $t('leek.base_life') }} : <span class="amount">{{ leek.baseLife }}</span></b>
					<br>
					<b v-if="characteristic == 'life'" class="effect">{{ $t('leek.added_life') }} : <span class="amount">{{ value - leek.baseLife }}</span></b>
					<br>
				</template>
				<div v-if="!test">
					<b class="capital">{{ $t('leek.invested_capital') }} : <span class="amount">{{ capitalSpent(characteristic, value, leek.level) }}</span></b>
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
			</template>
		</div>
	</tooltip>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	@Component({ name: "characteristic-tooltip" })
	export default class CharacteristicTooltip extends Vue {
		@Prop() characteristic!: string
		@Prop() value!: number
		@Prop() leek!: any
		@Prop() test!: boolean

		capitalSpent(characteristic: string, amount: number, level: number) {
			switch (characteristic) {
			case 'life':
				return Math.min(amount - (100 + (level - 1) * 3), 1000) * 1 / 4 + Math.min(Math.max(0, amount - (1100 + (level - 1) * 3)), 999) * 1 / 3 + Math.max(0, amount - (2100 + (level - 1) * 3)) * 1 / 2
			case 'tp': {
				const added = amount - 10
				const progression = added <= 14 ? added : 14
				const leftover = added > 14 ? added - 14 : 0
				return added > 0 ? 25 * progression + progression * (progression + 1) * 5 / 2 + leftover * 100 : 0
			}
			case 'mp': {
				const added = amount - 3
				const progression = added <= 8 ? added : 8
				const leftover = added > 8 ? added - 8 : 0
				return added > 0 ? 10 * progression + progression * (progression + 1) * 10 / 2 + leftover * 100 : 0
			}
			case 'frequency':
				return amount - 100
			default:
				return Math.min(amount, 200) / 2 + Math.min(Math.max(0, amount - 200), 200) + Math.min(Math.max(0, amount - 400), 200) * 2 + Math.max(0, amount - 600) * 3
			}
		}
	}
</script>

<style lang="scss" scoped>

</style>