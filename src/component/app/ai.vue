<template lang="html">
	<div draggable="true" class="ai" :class="{[ai.color]: true, small}">
		<div class="name">
			{{ ai.bot ? $t('leekscript.' + ai.name) : ai.name }}
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
		@Prop() library!: boolean
		@Prop() small!: boolean

		get show_lines() {
			if (this.small) { return false }
			if (this.library) { return true }
			const my_ai = this.$store.state.farmer && this.$store.state.farmer.ais.some((ai: AI) => ai.id === this.ai.id)
			return this.ai.total_lines !== undefined && (!my_ai || this.$store.state.farmer.show_ai_lines)
		}
	}
</script>

<style lang="scss" scoped>
	.ai {
		vertical-align: bottom;
		background-image: url("/image/ai/ai.png");
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
		&.blue {
			background-image: url("/image/ai/ai_blue.png");
			color: white;
		}
		&.green {
			background-image: url("/image/ai/ai_green.png");
			color: white;
		}
		&.black {
			background-image: url("/image/ai/ai_black.png");
			color: white;
		}
		&.red {
			background-image: url("/image/ai/ai_red.png");
			color: white;
		}
		.name {
			font-size: 16px;
			font-weight: bold;
			width: 100%;
		}
		&.small {
			vertical-align: top;
			width: 65px;
			height: 87px;
			margin-top: 10px;
			margin-left: -30px;
			padding: 6px;
			.name {
				font-size: 12px;
			}
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