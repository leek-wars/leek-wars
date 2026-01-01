
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="a">
		<leek slot="leek" :leek="leeks[action.params[1]]" />
		<template v-slot:text>
			<i slot="text">{{ (leeks[action.params[1]].farmer && leeks[action.params[1]].farmer.muted) ? "@*%#$€" : action.params[2] }}</i>
		</template>
		<template v-slot:cost>
			<b class="color-tp">{{ $t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'
	import { Leek } from '@/model/leek'

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionSayOld extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
