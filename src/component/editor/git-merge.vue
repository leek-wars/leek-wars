<template lang="html">
	<div class="git-merge-viewer" :class="{ready: editorReady}" ref="container"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { markRaw, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { getLanguageForPath } from './file-types'
import { buildConflictDecorations, parseConflicts, registerConflictCodeLens, type MergeConflict } from './merge-conflicts'

defineOptions({ name: 'git-merge', i18n: {} })

const props = withDefaults(defineProps<{
	content?: string
	file?: string
	theme?: string
	fontSize?: number
	lineHeight?: number
}>(), {
	content: '',
	file: '',
	theme: 'leek-wars',
	fontSize: 13,
	lineHeight: 20,
})

const emit = defineEmits<{
	'resolve': [content: string, count: number]
}>()

const containerRef = useTemplateRef<HTMLElement>('container')

let editor: monaco.editor.IStandaloneCodeEditor | null = null
let model: monaco.editor.ITextModel | null = null
const editorReady = ref(false)
let conflicts: MergeConflict[] = []
let decorations: monaco.editor.IEditorDecorationsCollection | null = null
let lenses: monaco.IDisposable | null = null

onMounted(() => {
	createEditor()
})

onBeforeUnmount(() => {
	dispose()
})

function dispose() {
	lenses?.dispose()
	lenses = null
	decorations = null
	if (editor) {
		editor.dispose()
		editor = null
	}
	model?.dispose()
	model = null
}

watch(() => props.theme, () => {
	monaco.editor.setTheme(props.theme)
})

watch(() => props.fontSize, () => {
	editor?.updateOptions({ fontSize: props.fontSize })
})

watch(() => props.lineHeight, () => {
	editor?.updateOptions({ lineHeight: props.lineHeight })
})

watch(() => props.content, () => {
	if (model && props.content !== model.getValue()) {
		model.setValue(props.content)
		parseAndDecorate()
	}
})

function createEditor() {
	const container = containerRef.value
	if (!container) return

	model = markRaw(monaco.editor.createModel(props.content || '', getLanguageForPath(props.file || '')))

	editor = markRaw(monaco.editor.create(container, {
		model,
		automaticLayout: true,
		minimap: { enabled: false },
		scrollBeyondLastLine: false,
		theme: props.theme,
		fontSize: props.fontSize,
		lineHeight: props.lineHeight,
		folding: false,
		glyphMargin: true,
		lineNumbersMinChars: 3,
		wordWrap: 'on',
	}))

	parseAndDecorate()
	editorReady.value = true
}

function parseAndDecorate() {
	if (!model || !editor) return
	conflicts = parseConflicts(model.getValue())

	if (decorations) {
		decorations.set(buildConflictDecorations(model, conflicts))
	} else {
		decorations = editor.createDecorationsCollection(buildConflictDecorations(model, conflicts))
	}

	lenses?.dispose()
	lenses = registerConflictCodeLens(editor, model, conflicts, () => {
		parseAndDecorate()
		emit('resolve', model?.getValue() || '', conflicts.length)
	})
}

function goToConflict(index: number) {
	if (!editor || index >= conflicts.length) return
	const line = conflicts[index].startLine + 1
	editor.revealLineInCenter(line)
	editor.setPosition({ lineNumber: line, column: 1 })
}

defineExpose({ goToConflict })
</script>

<style lang="scss" scoped>
.git-merge-viewer {
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

<style lang="scss">
/* Global styles for Monaco merge conflict decorations & labels */
.merge-label-current::after {
	content: '  (Current Change)';
	color: rgba(76, 175, 80, 0.7);
	font-style: italic;
}
.merge-label-incoming::after {
	content: '  (Incoming Change)';
	color: rgba(33, 150, 243, 0.7);
	font-style: italic;
}

.merge-marker-current {
	background: rgba(76, 175, 80, 0.25) !important;
}
.merge-current-zone {
	background: rgba(76, 175, 80, 0.12) !important;
	border-left: 3px solid #4caf50 !important;
}
.merge-marker-incoming {
	background: rgba(33, 150, 243, 0.25) !important;
}
.merge-incoming-zone {
	background: rgba(33, 150, 243, 0.12) !important;
	border-left: 3px solid #2196f3 !important;
}

/* Dark theme adjustments */
.theme-monokai, .theme-vs-dark, .theme-hc-black {
	.merge-marker-current {
		background: rgba(76, 175, 80, 0.3) !important;
	}
	.merge-current-zone {
		background: rgba(76, 175, 80, 0.15) !important;
	}
	.merge-marker-incoming {
		background: rgba(33, 150, 243, 0.3) !important;
	}
	.merge-incoming-zone {
		background: rgba(33, 150, 243, 0.15) !important;
	}
}
</style>
