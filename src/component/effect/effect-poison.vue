
<template>
	<i18n-t keypath="fight.leek_receives_x" tag="div" :a="a">
		<leek slot="leek" :leek="leek" />
		<template v-slot:value>
			<b class="color-poison">{{ $t('fight.n_poison', [value]) }}</b>
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
	export default class EffectPoison extends Vue {
		@Prop() leek!: FightLeek
		@Prop() value!: number
		@Prop() turns!: number
		@Prop() a!: number
	}
</script>
