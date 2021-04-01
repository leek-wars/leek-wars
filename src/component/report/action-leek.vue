<template>
	<span :style="{color}">{{ leek.name }}</span>
</template>

<script lang="ts">
	import { FightLeek } from '@/model/fight'
	import { TEAM_COLORS, TEAM_COLORS_DARK } from '@/model/team'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ActionLeekElement extends Vue {
		@Prop({required: true}) leek!: FightLeek
		@Prop() dark!: boolean
		get color() {
			return this.dark ? TEAM_COLORS_DARK[this.leek.team - 1] : TEAM_COLORS[this.leek.team - 1]
		}
	}
</script>