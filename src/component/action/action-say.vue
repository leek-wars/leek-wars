
<template>
	<i18n-t tag="div" keypath="fight.leek_speak" :a="props.a">
		<leek slot="leek" :leek="props.action.entity" />
		<template v-slot:text>
			<i slot="text">{{ (props.action.entity.farmer && props.action.entity.farmer.muted) ? "@*%#$€" : props.action.params[1] }}</i>
		</template>
		<template v-slot:cost>
			<b class="color-tp">{{ parent.$t('fight.n_tp', [1]) }}</b>
		</template>
	</i18n-t>
</template>

<script lang="ts">
	import { Action } from '@/model/action'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ActionLeekElement from '../report/action-leek.vue'

	@Component({ components: { leek: ActionLeekElement } })
	export default class ActionSay extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
	}
</script>
