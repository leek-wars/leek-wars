<template>
	<span :style="{color: TEAM_COLORS[leek.team - 1]}">{{ leek.name }}</span>
</template>

<script lang="ts">
	import { FightLeek } from '@/component/player/game/fight'
	import { TEAM_COLORS } from '@/component/player/game/game'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ActionLeekElement extends Vue {
		@Prop({required: true}) leek!: FightLeek
		TEAM_COLORS = TEAM_COLORS
	}
</script>