<template>
	<a :xlink:href="link" @click="click">
		<rect :x="x" :y="y" :class="{'no-fight': !fight}" class="fight" :width="30" :height="30" />
		<image v-if="fight" :x="x + 6" :y="y + 6" :width="18" :height="18" xlink:href="/image/icon/garden.png" />
	</a>
</template>

<script lang="ts">
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({ name: 'tournament-fight' })
	export default class TournamentFight extends Vue {
		@Prop({ required: true }) fight: any
		@Prop({ required: true }) x!: number
		@Prop({ required: true }) y!: number
		get link() { return this.fight ? this.fight : null }

		click(e: Event) {
			if (this.fight && this.fight) {
				this.$router.push(this.fight)
			}
			e.preventDefault()
		}
	}
</script>

<style lang="scss" scoped>
	.fight {
		stroke: var(--background-disabled);
		stroke-width: 2;
	}
	.no-fight {
		fill: var(--background);
		stroke-dasharray: 5.5;
	}
	.fight:not(.no-fight) {
		fill: #777;
	}
</style>