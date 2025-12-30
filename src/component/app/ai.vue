<template lang="html">
	<div draggable="true" class="ai" :class="{[ai.color]: true, small, locked}">
		<div class="name">
			{{ ai.bot ? $t('leekscript.' + ai.name) : ai.name }}
			<v-icon v-if="!ai.valid">mdi-close-circle</v-icon>
		</div>
		<div v-if="show_lines" class="lines">{{ $tc('main.n_lines', ai.total_lines) }}</div>
		<div v-if="ai.version" class="version">LS {{ ai.version }}</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "ai" })
	export default class AIElement extends Vue {
		@Prop({required: true}) ai!: AI
		@Prop({required: true}) library!: boolean
		@Prop({required: true}) small!: boolean
		@Prop() locked!: boolean

		get my_ai() {
			return this.$store.state.farmer && this.$store.state.farmer.ais.some((ai: AI) => ai.id === this.ai.id)
		}

		get show_lines() {
			if (this.small) { return false }
			if (this.library) { return true }
			if (this.my_ai) {
				return this.$store.state.farmer.show_ai_lines
			}
			return this.ai.total_lines !== undefined
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
		height: 120px;
		position: relative;
		word-wrap: break-word;
		text-align: center;
		margin: 0 auto;
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
			color: var(--text-color-secondary);
		}
		.version {
			font-size: 10px;
			border-radius: 5px;
			padding: 1px 3px;
			font-weight: 500;
			position: absolute;
			border: 1px solid var(--border);
			color: var(--text-color-secondary);
			bottom: 10px;
			right: 10px;
		}
		&.locked {
			filter: brightness(85%);
		}
	}
	body.dark .ai:not(.blue):not(.red):not(.green) {
		background-image: url("/image/ai/ai_black.png");
		&.black {
			background-image: url("/image/ai/ai.png");
			color: black;
		}
	}
</style>