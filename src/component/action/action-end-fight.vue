<template>
	<div :a="props.a">{{ parent.$t('fight.end_of_fight') }}</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ActionEndFight extends Vue {
		@Prop() a!: number
	}
</script>
