<template>
	<a :xlink:href="link" @click="click">
		<rect :x="x" :y="y" :class="{'no-fight': !fight}" class="fight" width="30" height="30" />
	</a>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'tournament-fight' })
	export default class TournamentFight extends Vue {
		@Prop({ required: true }) fight: any
		@Prop({ required: true }) x!: number
		@Prop({ required: true }) y!: number
		get link() { return this.fight ? this.fight : null }

		click(e: Event) {
			if (this.fight) {
				this.$router.push(this.fight)
			}
			e.preventDefault()
		}
	}
</script>

<style lang="scss" scoped>
	.entry {
		fill: white;
		stroke: #bbb;
		stroke-width: 2;
	}
	.entry[me="true"] {
		stroke: #5fad1b;
		fill: #c8ffc7;
	}
	image[win="false"] {
		opacity: 0.4;
		fill: #f5f5f5;
	}
	.fight {
		stroke: #bbb;
		stroke-width: 2;
	}
	.no-fight {
		fill: rgb(242, 242, 242);
		stroke-dasharray: 5.5;
	}
	.fight:not(.no-fight) {
		fill: #666;
	}
</style>