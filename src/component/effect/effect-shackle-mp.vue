
<template>
	<i18n-t keypath="fight.leek_loose_x_turns" tag="div" :a="a">
		<leek slot="leek" :leek="leek" />
		<template v-slot:value>
			<b class="color-mp">{{ $t('fight.n_mp', [value]) }}</b>
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
	export default class EffectShackleMP extends Vue {
		@Prop() leek!: FightLeek
		@Prop() value!: number
		@Prop() turns!: number
		@Prop() a!: number
	}
</script>
