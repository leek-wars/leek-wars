<template>
	<i18n path="fight.leek_take_weapon_cost" tag="div" :a="props.a">
		<leek slot="leek" :leek="props.action.entity" />
		<template v-slot:weapon>
			<b>{{ parent.$t('weapon.' + parent.LeekWars.weapons[props.action.params[1]].name) }}</b>
		</template>
		<template v-slot:cost>
			<b class="color-tp">{{ parent.$t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionSetWeapon extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>