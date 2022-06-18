<template functional>
	<i18n path="fight.leek_take_weapon" tag="div">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:weapon>
			<b>{{ parent.$t('weapon.' + parent.LeekWars.weapons[props.action.params[2]].name) }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionSetWeaponOld extends Vue {
		@Prop() action!: Action
	}
</script>