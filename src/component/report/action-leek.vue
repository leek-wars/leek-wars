<template>
	<span :class="'team' + props.leek.team">{{ props.leek.translatedName }}</span>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ActionLeekElement extends Vue {
		@Prop({required: true}) leek!: FightLeek
	}
</script>