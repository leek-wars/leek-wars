<template>
	<span :style="{color: TEAM_COLORS[leek.team - 1]}">{{ leek.name }}</span>
</template>

<script lang="ts">
	import { FightLeek, TEAM_COLORS } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ActionLeekElement extends Vue {
		@Prop({required: true}) leek!: FightLeek
		TEAM_COLORS = TEAM_COLORS
	}
</script>