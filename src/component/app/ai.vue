<template lang="html">
	<div draggable="true" class="ai">
		<div>{{ ai.name }}</div>
		<div v-if="show_lines" class="lines">{{ $tc('editor.n_lines', ai.total_lines) }}</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "ai" })
	export default class AIElement extends Vue {
		@Prop({required: true}) ai!: AI

		get show_lines() {
			const my_ai = this.$store.state.farmer && this.$store.state.farmer.ais.some((ai: AI) => ai.id === this.ai.id)
			return this.ai.total_lines !== undefined && (!my_ai || this.$store.state.farmer.show_ai_lines)
		}
	}
</script>

<style lang="scss" scoped>
	.ai {
		display: inline-block;
		vertical-align: bottom;
		background-image: url("/image/ai.png");
		background-size: 100% 100%;
		padding: 0 14px;
		padding-top: 45px;
		width: 103px;
		height: 135px;
		position: relative;
		word-wrap: break-word;
		color: #888;
		font-size: 17px;
		font-weight: bold;
		text-align: center;
		.lines {
			font-size: 13px;
			margin-top: 5px;
			font-weight: normal;
		}
	}
</style>