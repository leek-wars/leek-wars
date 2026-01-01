
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="a">
		<leek slot="leek" :leek="action.entity" />
		<template v-slot:text>
			<i slot="text">{{ (action.entity.farmer && action.entity.farmer.muted) ? "@*%#$€" : action.params[1] }}</i>
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

	@Options({ components: { leek: ActionLeekElement } })
	export default class ActionSay extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
