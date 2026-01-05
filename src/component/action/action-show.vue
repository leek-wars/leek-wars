
<template>
	<i18n-t tag="div" keypath="fight.leek_show_cell" :a="a">
		<template #leek>
			<leek :leek="action.entity" />
		</template>
		<template #cell>
			<b>{{ action.params[1] }}</b>
		</template>
		<template #cost>
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
	export default class ActionShow extends Vue {
		@Prop() action!: Action
		@Prop() a!: number
		@Prop() leeks!: {[key: number]: Leek}
	}
</script>
