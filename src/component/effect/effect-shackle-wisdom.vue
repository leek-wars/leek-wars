
<template>
	<i18n-t keypath="fight.leek_loose_x_turns" tag="div" :a="a">
		<template #leek>
			<leek :leek="leek" />
		</template>
		<template #value>
			<b class="color-wisdom">{{ $t('fight.n_wisdom', [value]) }}</b>
		</template>
		<template #turns>
			<b>{{ LeekWars.formatTurns(turns) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class EffectShackleWisdom extends Vue {
		@Prop() leek!: FightLeek
		@Prop() value!: number
		@Prop() turns!: number
		@Prop() a!: number
	}
</script>
