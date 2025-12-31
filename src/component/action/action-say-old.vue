
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="props.a">
		<leek slot="leek" :leek="parent.leeks[props.action.params[1]]" />
		<template v-slot:text>
			<i slot="text">{{ (parent.leeks[props.action.params[1]].farmer && parent.leeks[props.action.params[1]].farmer.muted) ? "@*%#$€" : props.action.params[2] }}</i>
		</template>
		<template v-slot:cost>
			<b class="color-tp">{{ parent.$t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionSayOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
