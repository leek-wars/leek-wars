
<template>
	<i18n-t keypath="fight.leek_state_x_turns" tag="div" :a="a">
		<template #leek>
			<leek :leek="leek" />
		</template>
		<template v-slot:state>
			<b>{{ $t('effect.state_' + value) }}</b>
		</template>
		<template v-slot:turns>
			<b>{{ LeekWars.formatTurns(turns) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class EffectAddState extends Vue {
		@Prop() leek!: FightLeek
		@Prop() value!: number
		@Prop() turns!: number
		@Prop() a!: number
	}
</script>
