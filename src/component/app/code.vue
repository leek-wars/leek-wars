<template>
	<div :class="{single, [finalTheme]: true}">
		<code v-show="expanded" ref="code"></code>
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

defineOptions({ name: 'LwCode' })

const props = defineProps<{
	code: string
	single?: boolean
	expandable?: boolean
	theme?: string
}>()

const expanded = ref(true)
const code = useTemplateRef<HTMLElement>('code')

const finalTheme = computed(() => props.theme ? props.theme : (LeekWars.darkMode ? 'theme-monokai' : ''))
const lines = computed(() => props.code.split('\n').length)

watch([() => props.code, () => props.single], () => {
	nextTick(() => {
		if (!code.value) return
		if (props.single) LeekWars.createCodeAreaSimple(props.code, code.value)
		else LeekWars.createCodeArea(props.code, code.value)
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
		color: #777;
		user-select: none;
		padding-right: 10px;
	}
	.label {
		color: #777;
	}
</style>