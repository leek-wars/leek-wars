<template>
	<div class="ai" ref="editor">
		<!-- Editeur -->
		<div class="compilation">
			<div v-if="saving" class="compiling">
				<loader :size="15" /> {{ t('main.saving') }}
			</div>
			<div class="results">
				<div v-for="(good, g) in goods" :key="g" class="good">
					✓ <template v-if="good.ai !== ai && ai">{{ ai.name }} ➞ </template>
					<i18n-t keypath="main.valid_ai" tag="span">
						<template #name><b>{{ good.ai.name }}</b></template>
					</i18n-t>
				</div>
				<div v-if="serverError" class="error" @click="serverError = false">× <i>{{ t('main.server_error') }}</i></div>
				<!-- <div v-for="(error, e) in errors" :key="e" class="error" @click="errors.splice(e, 1)">
					× <span v-html="$t('ai_error', [error.ai, error.line])"></span> ▶ {{ error.message }}
				</div> -->
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { fileSystem } from '@/model/filesystem'
import { LeekWars } from '@/model/leekwars'
import './monaco'
import { AI } from '@/model/ai'
import { analyzer } from './analyzer'
import { getLanguageForPath } from './file-types'
import { code, dochash, createSubApp, emitter } from '@/model/vue'
import DocumentationConstant from '../documentation/documentation-constant.vue'
import DocumentationFunction from '../documentation/documentation-function.vue'
import Javadoc from './javadoc.vue'
import { FUNCTIONS } from '@/model/functions'
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import Code from '@/component/app/code.vue'
import { parseConflicts, hasConflictMarkers, buildConflictDecorations, registerConflictCodeLens, type MergeConflict } from './merge-conflicts'

defineOptions({ name: 'ai-view-monaco' })

const props = defineProps<{
	ai: AI
	theme: string
	fontSize?: number
	lineHeight?: number
	t?: any
	console?: boolean
	lineNumbers?: boolean
}>()

const emit = defineEmits<{
	focus: []
	enter: []
	up: []
	down: []
}>()

const editorEl = useTemplateRef<HTMLElement>('editor')

let editor: monaco.editor.IStandaloneCodeEditor
let jumpToLine: number | null = 0
let jumpToColumn: number | null = 0
let scrollListener: monaco.IDisposable
let analyzerTimeout: any
let viewStateSaveTimeout: any
let currentAiPath: string | null = null
const analyzing = ref(false)
const saving = ref(false)
const serverError = ref(false)
const goods = ref<any[]>([])
const position = ref<monaco.Position>({ lineNumber: 1, column: 1 } as monaco.Position)
const selected = ref('')
let currentVersionId = 0
let conflictDecorations: monaco.editor.IEditorDecorationsCollection | null = null
let conflictLenses: monaco.IDisposable | null = null
let conflicts: MergeConflict[] = []

onMounted(() => {
	editor = markRaw(monaco.editor.create(editorEl.value as HTMLElement, {
		language: "leekscript",
		automaticLayout: true,
		wordWrap: "on",
		fontSize: props.fontSize,
		fontFamily: LeekWars.xpTheme ? "'Perfect DOS VGA 437 Win', monospace" : undefined,
		lineHeight: props.lineHeight,
		theme: props.theme,
		lineNumbers: props.lineNumbers ? 'on' : 'off',
		glyphMargin: props.lineNumbers,
		folding: props.lineNumbers,
		scrollbar: {
			vertical: props.lineNumbers ? 'visible' : 'hidden',
			useShadows: props.lineNumbers,
		},
		overviewRulerBorder: props.lineNumbers,
		overviewRulerLanes: props.lineNumbers ? 3 : 0,
		lineDecorationsWidth: props.lineNumbers ? 10 : 0,
		scrollBeyondLastLine: props.lineNumbers,
		scrollPredominantAxis: props.lineNumbers,
		minimap: {
			enabled: props.lineNumbers,
		},
		fixedOverflowWidgets: true,
		accessibilitySupport: 'off',
	}, {
		storageService: {
			get() {},
			getBoolean(key: any) {
				if (key === "expandSuggestionDocs") return true
				return false
			},
			remove() {},
			store() {},
			onWillSaveState() {},
			onDidChangeStorage() {}
		}
	} as any))
	scrollListener = editor.onDidScrollChange((e) => {
		if (!props.ai) return
		localStorage.setItem('editor/scroll/' + props.ai.path, '' + e.scrollTop)
		debouncedSaveViewState()
	})
	editor.onMouseUp((e) => {
		if (e.event.rightButton) return
		requestAnimationFrame(() => {
			if (!editor.hasWidgetFocus()) {
				editor.focus()
			}
		})
	})
	editor.onDidFocusEditorWidget(() => {
		emit('focus')
	})
	const isKey = (e: any, key: string) => e.code === key || e.browserEvent?.key === key
	editor.onKeyDown((e) => {
		if (props.console && isKey(e, 'Enter')) {
			e.preventDefault()
		}
	})
	editor.onKeyUp((e) => {
		if (e.code === 'Delete') {
			e.stopPropagation()
		}
		if (!props.console) return
		if (isKey(e, 'Enter')) {
			emit('enter')
			e.preventDefault()
		} else if (isKey(e, 'ArrowDown')) {
			emit('down')
			e.preventDefault()
		} else if (isKey(e, 'ArrowUp')) {
			emit('up')
			e.preventDefault()
		}
	})

	editor.onDidChangeCursorPosition(() => {
		position.value = editor.getPosition()!
		selected.value = editor.getModel()!.getValueInRange(editor.getSelection()!)
	})
	editor.onDidChangeModelContent(() => {
		props.ai.modified = currentVersionId !== props.ai.model.getAlternativeVersionId()
		setAnalyzerTimeout()
		updateConflictDecorations()
	})

	const suggestionWidget = (editor.getContribution('editor.contrib.suggestController') as any).widget
	suggestionWidget.value.onDidShow(() => {
		const widget = suggestionWidget.value._details.widget
		widget.onDidChangeContents(() => {
			const body = widget._body as HTMLElement
			const docs = widget._docs
			docs.style.display = 'none'
			body.querySelectorAll('.lw').forEach((e: any) => { e.remove() })
			const element = document.createElement('div')
			element.classList.add('lw')
			body.appendChild(element)
			const fun = FUNCTIONS.find((f: any) => f.name === docs.innerText)
			if (fun) {
				const doc = createSubApp(DocumentationFunction, { fun }, 'suggest-function')
					.directive('code', code)
					.directive('dochash', dochash)
					.mount(element)
				setTimeout(() => {
					suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
				})
			}
			const constant = LeekWars.constants.find((c: any) => c.name === docs.innerText)
			if (constant) {
				const doc = createSubApp(DocumentationConstant, { constant }, 'suggest-constant')
					.component('lw-code', Code)
					.directive('code', code)
					.directive('dochash', dochash)
					.mount(element)
				setTimeout(() => {
					suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
				})
			}
			const symbol = fileSystem.symbols[docs.innerText]
			if (symbol && symbol.javadoc) {
				const doc = createSubApp(Javadoc, { javadoc: symbol.javadoc, keyword: symbol }, 'suggest-javadoc')
					.directive('code', code)
					.directive('dochash', dochash)
					.mount(element)
				setTimeout(() => {
					suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
				})
			}
		})
	})

	const hoverController = (editor.getContribution('editor.contrib.contentHover') as any)
	hoverController._getOrCreateContentWidget()
	hoverController._contentWidget.onContentsChanged(() => {
		const widget = hoverController._contentWidget.widget._resizableNode
		const body = widget.domNode.querySelector('.hover-row-contents')
		if (!body) return
		body.querySelectorAll('.lw').forEach((e: any) => { e.remove() })
		const firstRow = body.querySelector('.markdown-hover')
		if (!firstRow) return

		const element = document.createElement('div')
		element.classList.add('lw')
		body.prepend(element)

		const fun = FUNCTIONS.find((f: any) => f.name === firstRow.innerText)
		if (fun) {
			firstRow.style.display = 'none'
			const doc = createSubApp(DocumentationFunction, { fun }, 'hover-function')
				.directive('code', code)
				.directive('dochash', dochash)
				.mount(element)
			setTimeout(() => {
				hoverController._contentWidget.widget._resize({ width: 500, height: doc.$el.clientHeight + 40 })
			})
		}
		const constant = LeekWars.constants.find((c: any) => c.name === firstRow.innerText)
		if (constant) {
			firstRow.style.display = 'none'
			const doc = createSubApp(DocumentationConstant, { constant }, 'hover-constant')
				.component('lw-code', Code)
				.directive('code', code)
				.directive('dochash', dochash)
				.mount(element)
			setTimeout(() => {
				hoverController._contentWidget.widget._resize({ width: 350, height: doc.$el.clientHeight + 40 })
			})
		}
		const symbol = fileSystem.symbols[firstRow.innerText]
		if (symbol && symbol.javadoc) {
			firstRow.style.display = 'none'
			const doc = createSubApp(Javadoc, { javadoc: symbol.javadoc, keyword: symbol }, 'hover-javadoc')
				.directive('code', code)
				.directive('dochash', dochash)
				.mount(element)
			setTimeout(() => {
				hoverController._contentWidget.widget._resize({ width: 500, height: doc.$el.clientHeight + 80 })
			})
		}
	})

	update()
	emitter.on('file-reloaded', onFileReloaded)
})

onBeforeUnmount(() => {
	emitter.off('file-reloaded', onFileReloaded)
	saveViewState()
	scrollListener?.dispose()
	conflictLenses?.dispose()
	if (editor) {
		editor.dispose()
	}
})

watch([() => props.theme, () => props.lineHeight, () => props.fontSize], () => {
	if (!editor) return
	editor.updateOptions({
		theme: props.theme,
		lineHeight: props.lineHeight,
		fontSize: props.fontSize,
	})
})

watch(() => props.ai?.path, () => update(), { immediate: true })

function update() {
	if (!props.ai) return
	if (currentAiPath !== null && currentAiPath !== props.ai.path) {
		saveViewState()
	}
	currentAiPath = props.ai.path
	syncModel()
}

function onFileReloaded(path: string) {
	if (!props.ai || props.ai.path !== path || !props.ai.model || !editor) return
	if (props.ai.model.getValue() !== props.ai.code) {
		editor.executeEdits('git', [{
			range: props.ai.model.getFullModelRange(),
			text: props.ai.code,
		}])
		currentVersionId = props.ai.model.getAlternativeVersionId()
		props.ai.modified = false
		updateConflictDecorations()
	}
}

function syncModel() {
	const uri = monaco.Uri.parse('file:///' + props.ai.path)
	const model = monaco.editor.getModel(uri) || markRaw(monaco.editor.createModel(props.ai.code, getLanguageForPath(props.ai.path), uri))
	props.ai.model = model

	if (!editor) return
	editor.setModel(model)
	currentVersionId = model.getAlternativeVersionId()

	updateConflictDecorations()
	setAnalyzerTimeout()
	editor.focus()

	nextTick(() => {
		if (jumpToLine) {
			nextTick(() => {
				scrollToLine(props.ai, jumpToLine!, jumpToColumn!)
			})
		} else {
			restoreViewState()
		}
	})
}

function scrollToLine(ai: AI, line: number, column: number = 0) {
	if (ai.model && editor.getModel()?.id === ai.model.id) {
		editor.revealLineInCenterIfOutsideViewport(line, monaco.editor.ScrollType.Immediate)
		const pos = { lineNumber: line, column: column + 1 }
		editor.setPosition(pos, 'jump')
		editor.focus()
		jumpToLine = null
		jumpToColumn = null
	} else {
		jumpToLine = line
		jumpToColumn = column
	}
}

function setAnalyzerTimeout() {
	clearTimeout(analyzerTimeout)
	analyzerTimeout = setTimeout(() => {
		const ai = props.ai
		analyzing.value = true
		ai.code = editor.getValue()
		ai.analyze()

		analyzer.updateTodos(ai)

		analyzer.analyze(ai, ai.code).then((result) => {
			analyzing.value = false
			if (!result) return
			analyzer.applyAnalyzeResult(result)
			analyzer.updateTodos(ai)
			analyzer.updateCount()
		}).catch(() => {
			analyzing.value = false
		})
	}, 500)
}

function updateConflictDecorations() {
	if (!editor) return
	const model = editor.getModel()
	if (!model) return

	const content = model.getValue()
	const hadConflicts = conflicts.length > 0

	if (!hasConflictMarkers(content)) {
		conflicts = []
		if (conflictDecorations) { conflictDecorations.set([]) }
		conflictLenses?.dispose()
		conflictLenses = null
		if (props.ai) props.ai.hasConflict = false
		return
	}

	conflicts = parseConflicts(content)
	if (props.ai) props.ai.hasConflict = true

	if (conflictDecorations) {
		conflictDecorations.set(buildConflictDecorations(model, conflicts))
	} else {
		conflictDecorations = editor.createDecorationsCollection(buildConflictDecorations(model, conflicts))
	}

	conflictLenses?.dispose()
	conflictLenses = registerConflictCodeLens(editor, model, conflicts, () => {
		updateConflictDecorations()
		setAnalyzerTimeout()
	})

	if (!hadConflicts && conflicts.length > 0) {
		editor.revealLineInCenter(conflicts[0].startLine + 1, monaco.editor.ScrollType.Smooth)
	}
}

function save() {
	props.ai.modified = false
	currentVersionId = props.ai.model.getAlternativeVersionId()
}

function saveViewState(aiId?: number) {
	const id = aiId ?? currentAiPath
	if (!id) return
	const viewState = editor.saveViewState()
	if (viewState) {
		localStorage.setItem('editor/viewstate/' + id, JSON.stringify(viewState))
	}
}

function restoreViewState() {
	const viewStateStr = localStorage.getItem('editor/viewstate/' + props.ai.path)
	if (viewStateStr) {
		try {
			const viewState = JSON.parse(viewStateStr)
			editor.restoreViewState(viewState)
			return
		} catch (e) {}
	}
	const scrollPosition = parseInt(localStorage.getItem('editor/scroll/' + props.ai.path) || '0')
	editor.setScrollTop(scrollPosition)
}

function debouncedSaveViewState() {
	clearTimeout(viewStateSaveTimeout)
	viewStateSaveTimeout = setTimeout(() => {
		saveViewState()
	}, 1000)
}

defineExpose({ scrollToLine, save, get editor() { return editor }, get analyzing() { return analyzing.value }, get position() { return position.value }, get selected() { return selected.value } })
</script>

<style lang="scss" scoped>
.ai {
	min-width: 0;
	height: 100%;
	position: relative;
	& :deep(code) {
		display: inline-flex !important;
	}
	& :deep(.mtk17) {
		text-decoration: line-through;
	}
	& :deep(.lw) {
		padding: 4px 10px;
	}
	& :deep(.hover-row-contents .lw:has(.doc-constant.item)) {
		padding: 0;
	}
	& :deep(.doc-constant.item) {
		padding: 0;
		width: 350px;
		h4 {
			margin-left: 6px;
			margin-right: 6px
		}
		ul {
			margin: 10px
		}
	}
}
.compilation {
	position: absolute;
	bottom: 100px;
	right: 50%;
	left: 50%;
	width: 500px;
	margin-left: -250px;
	text-align: center;
	z-index: 1000;
	pointer-events: none;
}
.compiling {
	padding: 5px 10px;
	border-radius: 2px;
	background: var(--pure-white);
	margin: 4px;
	display: inline-block;
	pointer-events: auto;
}
.compiling .loader {
	display: inline-block;
	padding: 0;
	padding-right: 5px;
}
.results {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}
.results .good, .results .error {
	padding: 5px 10px;
	border-radius: 2px;
	margin: 4px;
	pointer-events: auto;
}
.results {
	cursor: pointer;
}
.results .good {
	color: white;
	background: #2cdc20;
}
.results .error {
	color: white;
	background: #ff0008;
}
.compiling img {
	vertical-align: middle;
}
</style>