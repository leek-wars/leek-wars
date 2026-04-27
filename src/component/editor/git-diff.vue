<template lang="html">
	<div class="git-diff-viewer" :class="{ready: editorReady}" ref="container"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

defineOptions({ name: 'git-diff', i18n: {} })

const props = withDefaults(defineProps<{
	originalContent?: string
	modifiedContent?: string
	file?: string
	theme?: string
	fontSize?: number
	lineHeight?: number
	inline?: boolean
	collapseUnchanged?: boolean
}>(), {
	originalContent: '',
	modifiedContent: '',
	theme: 'leek-wars',
	fontSize: 13,
	lineHeight: 20,
	inline: false,
	collapseUnchanged: true,
})

defineEmits<{
	'close': []
	'open-file': [file: string]
}>()

const containerRef = useTemplateRef<HTMLElement>('container')

let diffEditor: monaco.editor.IDiffEditor | null = null
let originalModel: monaco.editor.ITextModel | null = null
let modifiedModel: monaco.editor.ITextModel | null = null
const editorReady = ref(false)

onMounted(() => {
	createEditor()
})

onBeforeUnmount(() => {
	dispose()
})

function dispose() {
	if (diffEditor) {
		diffEditor.setModel(null as any)
		diffEditor.dispose()
		diffEditor = null
	}
	originalModel?.dispose()
	modifiedModel?.dispose()
	originalModel = null
	modifiedModel = null
}

watch(() => props.theme, () => {
	monaco.editor.setTheme(props.theme)
})

watch(() => props.fontSize, () => {
	diffEditor?.updateOptions({ fontSize: props.fontSize })
})

watch(() => props.lineHeight, () => {
	diffEditor?.updateOptions({ lineHeight: props.lineHeight })
})

watch(() => props.inline, () => {
	diffEditor?.updateOptions({ renderSideBySide: !props.inline })
})

watch(() => props.collapseUnchanged, () => {
	editorReady.value = false
	dispose()
	nextTick(() => createEditor())
})

watch(() => [props.originalContent, props.modifiedContent], () => {
	if (!diffEditor) return
	if (originalModel) {
		originalModel.setValue(normalize(props.originalContent))
	}
	if (modifiedModel) {
		modifiedModel.setValue(normalize(props.modifiedContent))
	}
})

function normalize(content: string): string {
	return (content || '').replace(/[\r\n]+$/, '')
}

function createEditor() {
	const container = containerRef.value
	if (!container) return
	originalModel = markRaw(monaco.editor.createModel(normalize(props.originalContent), 'leekscript'))
	modifiedModel = markRaw(monaco.editor.createModel(normalize(props.modifiedContent), 'leekscript'))

	diffEditor = markRaw(monaco.editor.createDiffEditor(container, {
		readOnly: true,
		renderSideBySide: !props.inline,
		automaticLayout: true,
		minimap: { enabled: false },
		scrollBeyondLastLine: false,
		theme: props.theme,
		fontSize: props.fontSize,
		lineHeight: props.lineHeight,
		folding: false,
		glyphMargin: false,
		lineNumbersMinChars: 3,
		hideUnchangedRegions: { enabled: props.collapseUnchanged },
		wordWrap: "on",
	}))

	diffEditor.setModel({
		original: originalModel,
		modified: modifiedModel,
	})

	layout()

	editorReady.value = false
	setTimeout(() => { editorReady.value = true }, 100)
}

function layout() {
	if (!diffEditor) return
	const container = containerRef.value
	if (!container) return
	const { width, height } = container.getBoundingClientRect()
	if (width > 0 && height > 0) {
		diffEditor.layout({ width, height })
	}
}

defineExpose({ layout })
</script>

<style lang="scss" scoped>
.git-diff-viewer {
	flex: 1;
	width: 100%;
	height: 100%;
	overflow: hidden;
	opacity: 0;
	&.ready {
		opacity: 1;
	}
}
</style>
