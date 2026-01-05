<template>
	<i18n-t keypath="fight.leek_take_weapon" tag="div" :a="a">
		<template #leek>
			<leek :leek="leeks[action.params[1]]" />
		</template>
		<template v-slot:weapon>
			<b>{{ $t('weapon.' + LeekWars.weapons[action.params[2]].name) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionSetWeaponOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>