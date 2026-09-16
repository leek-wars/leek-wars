<template>
	<div :class="{single, [finalTheme]: true}">
		<code v-show="expanded" ref="codeEl"></code>
		<span v-if="expandable && !single" v-ripple class="button" @click="expanded = !expanded">
			<v-icon>{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
			<span v-if="expanded" class="label">{{ $t('main.close') }}</span>
			<span v-else class="label">{{ $t('main.open') }} ({{ $t('main.n_lines', lines) }})</span>
		</span>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { resolveCodeThemeClass } from '@/component/editor/code-theme'

defineOptions({ name: 'LwCode' })

const props = defineProps<{
	code: string
	single?: boolean
	expandable?: boolean
	theme?: string
	language?: string
}>()

const expanded = ref(true)
const codeEl = useTemplateRef<HTMLElement>('codeEl')

// 'auto' (single-code) et absence de theme => on suit le thème d'éditeur préféré du joueur
// (réactif au mode sombre). Une valeur explicite non-'auto' reste une classe passée telle quelle.
const finalTheme = computed(() => (props.theme && props.theme !== 'auto') ? props.theme : resolveCodeThemeClass())
const lines = computed(() => props.code.split('\n').length)

watch([() => props.code, () => props.single, () => props.language], () => {
	nextTick(() => {
		if (!codeEl.value) return
		if (props.single) LeekWars.createCodeAreaSimple(props.code, codeEl.value, props.language)
		else LeekWars.createCodeArea(props.code, codeEl.value, props.language)
	})
}, { immediate: true })
</script>


<style lang="scss" scoped>
	div {
		&.single {
			display: inline-block;
		}
		max-width: 100%;
	}
	.button {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		cursor: pointer;
		color: var(--text-color-secondary);
		user-select: none;
		padding-right: 10px;
	}
	.label {
		color: var(--text-color-secondary);
	}
</style>