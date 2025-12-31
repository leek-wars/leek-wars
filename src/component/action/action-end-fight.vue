<template>
	<div :a="a">{{ $t('fight.end_of_fight') }}</div>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class ActionEndFight extends Vue {
		@Prop() a!: number
	}
</script>
