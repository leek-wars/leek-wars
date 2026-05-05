<template lang="html">
	<div draggable="true" class="ai" :class="{[ai.color || '']: true, small, locked}">
		<div class="name" :style="{ fontSize: nameSize + 'px' }">
			{{ ai.bot ? $t('leekscript.' + ai.name) : ai.name }}
			<v-icon v-if="!ai.valid">mdi-close-circle</v-icon>
		</div>
		<div v-if="show_lines" class="lines">{{ $t('main.n_lines', ai.total_lines) }}</div>
		<div v-if="ai.version" class="version">LS {{ ai.version }}</div>
	</div>
</template>

<script setup lang="ts">
import { AI } from '@/model/ai'
import { fileSystem } from '@/model/filesystem'
import { store } from '@/model/store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: "ai" })

const props = defineProps<{
	ai: AI
	library: boolean
	small: boolean
	locked?: boolean
}>()

const { t } = useI18n()

const my_ai = computed(() => props.ai.path && props.ai.path in fileSystem.ais)

const displayName = computed(() => props.ai.bot ? t('leekscript.' + props.ai.name) as string : props.ai.name)

const nameSize = computed(() => {
	const base = props.small ? 12 : 16
	const length = displayName.value.length
	if (length <= 16) return base
	return Math.max(base * 0.75, base * 16 / length)
})

const show_lines = computed(() => {
	if (props.small) { return false }
	if (props.library) { return true }
	if (my_ai.value) {
		return store.state.farmer!.show_ai_lines
	}
	return props.ai.total_lines !== undefined
})
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
    	padding-top: 20px;
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