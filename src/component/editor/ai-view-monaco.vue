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


<script lang="ts">

import * as monaco from 'monaco-editor'
import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
import { fileSystem } from '@/model/filesystem'
import { LeekWars } from '@/model/leekwars';
import './monaco'
import { AI } from '@/model/ai'
import { analyzer, AnalyzerPromise } from './analyzer'
import { code, dochash, vueMain, createSubApp, emitter } from '@/model/vue'
import DocumentationConstant from '../documentation/documentation-constant.vue'
import DocumentationFunction from '../documentation/documentation-function.vue'
import Javadoc from './javadoc.vue'
import { FUNCTIONS } from '@/model/functions';
import { markRaw, nextTick } from 'vue';
import Code from '@/component/app/code.vue'
import { parseConflicts, hasConflictMarkers, buildConflictDecorations, registerConflictCodeLens, type MergeConflict } from './merge-conflicts'

@Options({ name: 'ai-view-monaco', emits: ['focus'], components: {

}})
export default class AIViewMonaco extends Vue {

	@Prop({required: true}) ai!: AI
	@Prop({required: true}) theme!: string
	@Prop() fontSize!: number
	@Prop() lineHeight!: number
	@Prop() t!: any
	@Prop() console!: boolean
	@Prop() lineNumbers!: boolean

	hover: any
	editor!: monaco.editor.IStandaloneCodeEditor
	jumpToLine: number | null = 0
	jumpToColumn: number | null = 0
	scrollListener!: monaco.IDisposable
	private analyzerTimeout: any
	private viewStateSaveTimeout: any
	private currentAiPath: string | null = null
	public analyzing: boolean = false
	public saving: boolean = false
	public serverError: boolean = false
	public goods: any[] = []
	public position: monaco.Position = { lineNumber: 1, column: 1 } as monaco.Position
	public selected: string = ''
	public currentVersionId: number = 0
	private conflictDecorations: monaco.editor.IEditorDecorationsCollection | null = null
	private conflictLenses: monaco.IDisposable | null = null
	private conflicts: MergeConflict[] = []

	mounted() {
		// https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IEditorOptions.html
		this.editor = markRaw(monaco.editor.create(this.$refs.editor as HTMLElement, {
			language: "leekscript",
			automaticLayout: true,
			wordWrap: "on",
			fontSize: this.fontSize,
			fontFamily: LeekWars.xpTheme ? "'Perfect DOS VGA 437 Win', monospace" : undefined,
			lineHeight: this.lineHeight,
			theme: this.theme,
			lineNumbers: this.lineNumbers ? 'on' : 'off',
			glyphMargin: this.lineNumbers,
			folding: this.lineNumbers,
			scrollbar: {
				vertical: this.lineNumbers ? 'visible' : 'hidden',
				useShadows: this.lineNumbers,
			},
			overviewRulerBorder: this.lineNumbers,
			overviewRulerLanes: this.lineNumbers ? 3 : 0,
			lineDecorationsWidth: this.lineNumbers ? 10 : 0,
			scrollBeyondLastLine: this.lineNumbers,
			scrollPredominantAxis: this.lineNumbers,
			minimap: {
				enabled: this.lineNumbers,
			},
			fixedOverflowWidgets: true,
			accessibilitySupport: 'off', // Workaround Firefox : sélection backward + remplacement (#2802)
		}, {
			storageService: {
				get() {},
				getBoolean(key: any) {
					if (key === "expandSuggestionDocs")
						return true
					return false
				},
				remove() {},
				store() {},
				onWillSaveState() {},
				onDidChangeStorage() {}
			}
		}))
		this.scrollListener = this.editor.onDidScrollChange((e) => {
			if (!this.ai) return
			// console.log('scroll', this.ai.path, e.scrollTop, e.scrollHeight, e.scrollWidth)
			localStorage.setItem('editor/scroll/' + this.ai.path, '' + e.scrollTop)
			this.debouncedSaveViewState()
		})
		// Restore focus after mouse drag-select to prevent first keystroke
		// from being lost (#817)
		this.editor.onMouseUp((e) => {
			if (e.event.rightButton) return
			requestAnimationFrame(() => {
				if (!this.editor.hasWidgetFocus()) {
					this.editor.focus()
				}
			})
		})
		this.editor.onDidFocusEditorWidget(() => {
			this.$emit('focus')
		})
		// e.code is empty on mobile virtual keyboards (notably Firefox Android),
		// so we also check e.browserEvent.key as a fallback.
		const isKey = (e: any, key: string) => e.code === key || e.browserEvent?.key === key
		this.editor.onKeyDown((e) => {
			if (this.console && isKey(e, 'Enter')) {
				e.preventDefault()
			}
		})
		this.editor.onKeyUp((e) => {
			if (e.code === 'Delete') {
				e.stopPropagation()
			}
			if (!this.console) return
			if (isKey(e, 'Enter')) {
				this.$emit('enter')
				e.preventDefault()
			} else if (isKey(e, 'ArrowDown')) {
				this.$emit('down')
				e.preventDefault()
			} else if (isKey(e, 'ArrowUp')) {
				this.$emit('up')
				e.preventDefault()
			}
		})

		this.editor.onDidChangeCursorPosition((e) => {
			this.position = this.editor.getPosition()!
			this.selected = this.editor.getModel()!.getValueInRange(this.editor.getSelection()!)
		})
		this.editor.onDidChangeModelContent((e) => {
			this.ai.modified = this.currentVersionId !== this.ai.model.getAlternativeVersionId()
			this.setAnalyzerTimeout()
			this.updateConflictDecorations()
		})

		const suggestionWidget = (this.editor.getContribution('editor.contrib.suggestController') as any).widget
		suggestionWidget.value.onDidShow(() => {
			// console.log("Show suggestions", suggestionWidget)
			// suggestionWidget.value.selectFirst()
			// suggestionWidget.value.showDetails()
			const widget = suggestionWidget.value._details.widget
			widget.onDidChangeContents((e: any) => {
				// console.log("widget", widget)
				var body = widget._body as HTMLElement
				const docs = widget._docs
				docs.style.display = 'none'
				body.querySelectorAll('.lw').forEach((e: any) => {
					e.remove()
				})
				var element = document.createElement('div')
				element.classList.add('lw')
				body.appendChild(element)
				const fun = FUNCTIONS.find(f => f.name === docs.innerText)
				if (fun) {
					const doc = createSubApp(DocumentationFunction, { fun }, 'suggest-function')
						.directive('code', code)
						.directive('dochash', dochash)
						.mount(element)
					setTimeout(() => {
						suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
					})
				}
				const constant = LeekWars.constants.find(c => c.name === docs.innerText)
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
				// console.log("suggestion", docs.innerText)
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

		const hoverController = (this.editor.getContribution('editor.contrib.contentHover') as any)
		// console.log("hoverController", hoverController)
		hoverController._getOrCreateContentWidget()
		hoverController._contentWidget.onContentsChanged(() => {
			// console.log("Show hover", hoverController)
			const widget = hoverController._contentWidget.widget._resizableNode
			const body = widget.domNode.querySelector('.hover-row-contents')
			if (!body) return
			body.querySelectorAll('.lw').forEach((e: any) => {
				e.remove()
			})
			const firstRow = body.querySelector('.markdown-hover')
			// console.log("hover symbol", firstRow.innerText)

			var element = document.createElement('div')
			element.classList.add('lw')
			body.prepend(element)

			const fun = FUNCTIONS.find(f => f.name === firstRow.innerText)
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
			const constant = LeekWars.constants.find(c => c.name === firstRow.innerText)
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

		this.update()
		emitter.on('file-reloaded', this.onFileReloaded)
	}

	beforeUnmount() {
		emitter.off('file-reloaded', this.onFileReloaded)
		this.saveViewState()
		this.scrollListener.dispose()
		this.conflictLenses?.dispose()
		if (this.editor) {
			this.editor.dispose()
		}
	}

	@Watch('theme')
	@Watch('lineHeight')
	@Watch('fontSize')
	updateSettings() {
		this.editor.updateOptions({
			theme: this.theme,
			lineHeight: this.lineHeight,
			fontSize: this.fontSize,
		})
	}

	@Watch('ai.path', { immediate: true })
	update() {
		if (!this.ai) return

		if (this.currentAiPath !== null && this.currentAiPath !== this.ai.path) {
			this.saveViewState()
		}
		this.currentAiPath = this.ai.path

		this.syncModel()
	}

	onFileReloaded(path: string) {
		if (!this.ai || this.ai.path !== path || !this.ai.model || !this.editor) return
		if (this.ai.model.getValue() !== this.ai.code) {
			this.editor.executeEdits('git', [{
				range: this.ai.model.getFullModelRange(),
				text: this.ai.code,
			}])
			this.currentVersionId = this.ai.model.getAlternativeVersionId()
			this.ai.modified = false
			this.updateConflictDecorations()
		}
	}

	syncModel() {
		const uri = monaco.Uri.parse('file:///' + this.ai.path)
		const model = monaco.editor.getModel(uri) || markRaw(monaco.editor.createModel(this.ai.code, 'leekscript', uri))
		this.ai.model = model

		if (!this.editor) return
		this.editor.setModel(model)
		this.currentVersionId = model.getAlternativeVersionId()

		this.updateConflictDecorations()
		this.setAnalyzerTimeout()
		this.editor.focus()

		nextTick(() => {
			if (this.jumpToLine) {
				nextTick(() => {
					this.scrollToLine(this.ai, this.jumpToLine!, this.jumpToColumn!)
				})
			} else {
				this.restoreViewState()
			}
		})
	}

	public scrollToLine(ai: AI, line: number, column: number = 0) {
		// console.log("scrollToLine", ai, line, column)
		if (ai.model && this.editor.getModel()?.id === ai.model.id) {
			this.editor.revealLineInCenterIfOutsideViewport(line, monaco.editor.ScrollType.Immediate)
			const pos = { lineNumber: line, column: column + 1 }
			// Set position immediately after reveal
			this.editor.setPosition(pos, 'jump')
			// Focus the editor to ensure the cursor is visible
			this.editor.focus()
			this.jumpToLine = null
			this.jumpToColumn = null
		} else {
			this.jumpToLine = line
			this.jumpToColumn = column
		}
	}

	setAnalyzerTimeout() {
		clearTimeout(this.analyzerTimeout)
		this.analyzerTimeout = setTimeout(() => {
			const ai = this.ai  // Capture before any async/navigation

			this.analyzing = true
			ai.code = this.editor.getValue()
			ai.analyze()

			// Scan TODOs immediately (client-side, no server needed)
			analyzer.updateTodos(ai)

			analyzer.analyze(ai, ai.code).then((result) => {
				// console.log("analyze", result)
				this.analyzing = false
				if (!result) return

				for (const epPath in result) {
					const entrypointAi = fileSystem.ais[epPath]
					if (!entrypointAi) continue

					let valid = true
					for (const problem of result[epPath]) {
						if (problem[0] === 0) { valid = false; break }
					}
					entrypointAi.valid = valid
					analyzer.handleProblems(entrypointAi, result[epPath])
				}
				analyzer.updateTodos(ai)
				analyzer.updateCount()
			}).catch(() => {
				this.analyzing = false
			})
		}, 500)
	}

	updateConflictDecorations() {
		if (!this.editor) return
		const model = this.editor.getModel()
		if (!model) return

		const content = model.getValue()
		const hadConflicts = this.conflicts.length > 0

		// Fast-path : pas de marqueurs → pas de parsing
		if (!hasConflictMarkers(content)) {
			this.conflicts = []
			if (this.conflictDecorations) { this.conflictDecorations.set([]) }
			this.conflictLenses?.dispose()
			this.conflictLenses = null
			if (this.ai) this.ai.hasConflict = false
			return
		}

		this.conflicts = parseConflicts(content)
		if (this.ai) this.ai.hasConflict = true

		if (this.conflictDecorations) {
			this.conflictDecorations.set(buildConflictDecorations(model, this.conflicts))
		} else {
			this.conflictDecorations = this.editor.createDecorationsCollection(buildConflictDecorations(model, this.conflicts))
		}

		this.conflictLenses?.dispose()
		this.conflictLenses = registerConflictCodeLens(this.editor, model, this.conflicts, () => {
			this.updateConflictDecorations()
			this.setAnalyzerTimeout()
		})

		// Scroller au premier conflit uniquement sur la transition
		if (!hadConflicts && this.conflicts.length > 0) {
			this.editor.revealLineInCenter(this.conflicts[0].startLine + 1, monaco.editor.ScrollType.Smooth)
		}
	}

	public save() {
		this.ai.modified = false
		this.currentVersionId = this.ai.model.getAlternativeVersionId()
		// console.log("save", this.currentVersionId)
		// console.log(this.editor.getModel())
	}

	private saveViewState(aiId?: number) {
		const id = aiId ?? this.currentAiPath
		if (!id) return
		const viewState = this.editor.saveViewState()
		if (viewState) {
			localStorage.setItem('editor/viewstate/' + id, JSON.stringify(viewState))
		}
	}

	private restoreViewState() {
		const viewStateStr = localStorage.getItem('editor/viewstate/' + this.ai.path)
		if (viewStateStr) {
			try {
				const viewState = JSON.parse(viewStateStr)
				this.editor.restoreViewState(viewState)
				return
			} catch (e) {
				// Fall through to scroll-only restore
			}
		}
		// Fallback: restore scroll position only (backward compatibility)
		const scrollPosition = parseInt(localStorage.getItem('editor/scroll/' + this.ai.path) || '0')
		this.editor.setScrollTop(scrollPosition)
	}

	private debouncedSaveViewState() {
		clearTimeout(this.viewStateSaveTimeout)
		this.viewStateSaveTimeout = setTimeout(() => {
			this.saveViewState()
		}, 1000)
	}
}

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