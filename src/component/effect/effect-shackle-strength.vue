
<template>
	<i18n-t keypath="fight.leek_loose_x_turns" tag="div" :a="props.a">
		<leek slot="leek" :leek="props.leek" />
		<template v-slot:value>
			<b class="color-strength">{{ parent.$t('fight.n_strength', [props.value]) }}</b>
		</template>
		<template v-slot:turns>
			<b>{{ parent.formatTurns(props.turns) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class EffectShackleStrength extends Vue {
		@Prop() leek!: FightLeek
		@Prop() value!: number
		@Prop() turns!: number
		@Prop() a!: number
	}
</script>
