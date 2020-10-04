<template lang="html">
	<div draggable="true" class="ai">
		<div class="name">
			{{ ai.name }}
			<v-icon v-if="!ai.valid">mdi-close-circle</v-icon>
		</div>
		<div v-if="show_lines" class="lines">{{ $tc('main.n_lines', ai.total_lines) }}</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "ai" })
	export default class AIElement extends Vue {
		@Prop({required: true}) ai!: AI
		@Prop({required: true}) library!: boolean

		get show_lines() {
			if (this.library) { return true }
			const my_ai = this.$store.state.farmer && this.$store.state.farmer.ais.some((ai: AI) => ai.id === this.ai.id)
			return this.ai.total_lines !== undefined && (!my_ai || this.$store.state.farmer.show_ai_lines)
		}
	}
</script>

<style lang="scss" scoped>
	.ai {
		vertical-align: bottom;
		background-image: url("/image/ai.png");
		background-size: 100% 100%;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px;
		width: 103px;
		height: 135px;
		position: relative;
		word-wrap: break-word;
		color: #888;
		text-align: center;
		.name {
			font-size: 17px;
			font-weight: bold;
			width: 100%;
		}
		.v-icon {
			font-size: 15px;
			color: red;
		}
		.lines {
			font-size: 13px;
			margin-top: 5px;
			font-weight: normal;
		}
	}
</style>