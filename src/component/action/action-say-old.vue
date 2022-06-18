
<template functional>
	<i18n tag="div" path="fight.leek_speak">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:text>
			<i slot="text">{{ (parent.leeks[props.action.params[1]].farmer && parent.leeks[props.action.params[1]].farmer.muted) ? "@*%#$€" : props.action.params[2] }}</i>
		</template>
	</i18n>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionSayOld extends Vue {
		@Prop() action!: Action
	}
</script>
