<template>
	<div class="ai" ref="editor">
		<!-- Editeur -->
		<div class="compilation">
			<div v-if="saving" class="compiling">
				<loader :size="15" /> {{ t('main.saving') }}
			</div>
			<div class="results">
				<div v-for="(good, g) in goods" :key="g" class="good" v-html="'✓ ' + (good.ai !== ai && ai ? ai.name + ' ➞ ' : '') + t('main.valid_ai', [good.ai.name])"></div>
				<div v-if="serverError" class="error" @click="serverError = false">× <i>{{ t('main.server_error') }}</i></div>
				<!-- <div v-for="(error, e) in errors" :key="e" class="error" @click="errors.splice(e, 1)">
					× <span v-html="$t('ai_error', [error.ai, error.line])"></span> ▶ {{ error.message }}
				</div> -->
			</div>
		</div>
	</div>
</template>


<script lang="ts">

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { fileSystem } from '@/model/filesystem'
import './monaco'
import { AI } from '@/model/ai'
import { analyzer, AnalyzerPromise } from './analyzer'
import { vueMain, vuetify } from '@/model/vue'
import DocumentationConstant from '../documentation/documentation-constant.vue'
import DocumentationFunction from '../documentation/documentation-function.vue'
import Javadoc from './javadoc.vue'
import { FUNCTIONS } from '@/model/functions';
import { CONSTANTS } from '@/model/constants';

@Component({ name: 'ai-view-monaco', components: {

}})
export default class AIViewMonaco extends Vue {

	@Prop({required: true}) ai!: AI
	@Prop({required: true}) theme!: string
	@Prop() fontSize!: number
	@Prop() lineHeight!: number
	@Prop() t!: any

	hover: any
	editor!: monaco.editor.IStandaloneCodeEditor
	jumpToLine: number | null = 0
	scrollListener!: monaco.IDisposable
	private analyzerTimeout: any
	public analyzing: boolean = false
	public saving: boolean = false
	public serverError: boolean = false
	public goods: any[] = []
	public position: monaco.Position = { lineNumber: 1, column: 1 } as monaco.Position
	public selected: string = ''
	public currentVersionId: number = 0

	mounted() {
		// https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IEditorOptions.html
		this.editor = monaco.editor.create(this.$refs.editor as HTMLElement, {
			language: "leekscript",
			automaticLayout: true,
			wordWrap: "on",
			fontSize: this.fontSize,
			lineHeight: this.lineHeight,
			theme: this.theme,
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
		})
		this.scrollListener = this.editor.onDidScrollChange((e) => {
			if (!this.ai) return
			// console.log('scroll', this.ai.id, e.scrollTop, e.scrollHeight, e.scrollWidth)
			localStorage.setItem('editor/scroll/' + this.ai.id, '' + e.scrollTop)
		})
		this.editor.onDidFocusEditorWidget((e) => {
			// Verify the correct model is active when focusing
			if (this.ai && this.ai.model && this.editor.getModel() !== this.ai.model) {
				this.editor.setModel(this.ai.model)
			}
			this.$emit('focus')
		})
		this.editor.onKeyUp((e) => {
			if (e.code === 'Delete') {
				e.stopPropagation()
			}
		})
		this.editor.onDidChangeCursorPosition((e) => {
			this.position = this.editor.getPosition()!
			this.selected = this.editor.getModel()!.getValueInRange(this.editor.getSelection()!)
		})
		this.editor.onDidChangeModelContent((e) => {
			this.ai.modified = this.currentVersionId !== this.ai.model.getAlternativeVersionId()
			this.setAnalyzerTimeout()
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
					const doc = new DocumentationFunction({ propsData: { fun }, parent: vueMain }).$mount(element)
					setTimeout(() => {
						suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
					})
				}
				const constant = CONSTANTS.find(c => c.name === docs.innerText)
				if (constant) {
					const doc = new DocumentationConstant({ propsData: { constant }, parent: vueMain }).$mount(element)
					setTimeout(() => {
						suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
					})
				}
				// console.log("suggestion", docs.innerText)
				const symbol = fileSystem.symbols[docs.innerText]
				if (symbol) {
					const doc = new Javadoc({ propsData: { javadoc: symbol.javadoc, keyword: symbol }, parent: vueMain }).$mount(element)
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
				const doc = new DocumentationFunction({ propsData: { fun }, parent: vueMain }).$mount(element)
				setTimeout(() => {
					hoverController._contentWidget.widget._resize({ width: 500, height: doc.$el.clientHeight + 40 })
				})
			}
			const constant = CONSTANTS.find(c => c.name === firstRow.innerText)
			if (constant) {
				firstRow.style.display = 'none'
				const doc = new DocumentationConstant({ propsData: { constant }, parent: vueMain }).$mount(element)
				setTimeout(() => {
					hoverController._contentWidget.widget._resize({ width: 350, height: doc.$el.clientHeight + 40 })
				})
			}
			const symbol = fileSystem.symbols[firstRow.innerText]
			if (symbol) {
				firstRow.style.display = 'none'
				const doc = new Javadoc({ propsData: { javadoc: symbol.javadoc, keyword: symbol }, parent: vueMain }).$mount(element)
				setTimeout(() => {
					hoverController._contentWidget.widget._resize({ width: 500, height: doc.$el.clientHeight + 80 })
				})
			}
		})
	}

	beforeDestroy() {
		// console.log("beforeDestroy")
		this.scrollListener.dispose()
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

	@Watch('ai.id', { immediate: true })
	update() {
		if (!this.ai) return
		// console.log("update ai", this.ai.id)

		fileSystem.load(this.ai).then(() => {

			const uri = monaco.Uri.parse('file:///' + this.ai.path)
			let model = monaco.editor.getModel(uri) || monaco.editor.createModel(this.ai.code, 'leekscript', uri)
			this.ai.model = model
			this.editor.setModel(model)
			this.currentVersionId = model.getAlternativeVersionId()

			// Force focus to ensure model is properly bound
			Vue.nextTick(() => {
				// console.log("Focus editor")
				this.editor.focus()

				this.setAnalyzerTimeout()

				if (this.jumpToLine) {
					Vue.nextTick(() => {
						this.scrollToLine(this.jumpToLine as number)
						this.jumpToLine = null
					})
				} else {
					const scrollPosition = parseInt(localStorage.getItem('editor/scroll/' + this.ai.id) || '0')
					// console.log("scroll to", scrollPosition)
					this.editor.setScrollTop(scrollPosition)
				}
			})
		})
	}

	public scrollToLine(line: number, column: number = 0) {
		if (this.editor) {
			requestAnimationFrame(() => {
				this.editor.revealLineInCenterIfOutsideViewport(line, monaco.editor.ScrollType.Immediate)
				const pos = { lineNumber: line, column: column + 1 }
				// Set position immediately after reveal
				this.editor.setPosition(pos, 'jump')
				// Focus the editor to ensure the cursor is visible
				this.editor.focus()
			})
		} else {
			this.jumpToLine = line
		}
	}

	setAnalyzerTimeout() {
		clearTimeout(this.analyzerTimeout)
		this.analyzerTimeout = setTimeout(() => {

			this.analyzing = true
			this.ai.code = this.editor.getValue()
			this.ai.analyze()

			// DISABLE AUTO ANALYZE
			// if (true) return;

			analyzer.analyze(this.ai, this.ai.code).then((result) => {
				// console.log("analyze", result)
				this.analyzing = false

				for (const entrypoint in result) {
					const entrypoint_id = parseInt(entrypoint, 10)
					const ai = fileSystem.ais[entrypoint_id]

					// Valid?
					let valid = true
					for (const problem of result[entrypoint]) {
						if (problem[0] === 0) { valid = false; break }
					}
					Vue.set(ai, 'valid', valid)
					analyzer.handleProblems(ai, result[entrypoint])
				}
				analyzer.updateCount()
			})
		}, 1000)
	}

	public save() {
		this.ai.modified = false
		this.currentVersionId = this.ai.model.getAlternativeVersionId()
		// console.log("save", this.currentVersionId)
		// console.log(this.editor.getModel())
	}
}

</script>

<style lang="scss" scoped>
.ai {
	min-width: 0;
	height: 100%;
	//position: relative;
	& ::v-deep code {
		display: inline-flex !important;
	}
	& ::v-deep .mtk17 {
		text-decoration: line-through;
	}
	& ::v-deep .lw {
		padding: 4px 10px;
	}
	& ::v-deep .doc-constant.item {
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
}
.compiling {
	padding: 5px 10px;
	border-radius: 2px;
	background: var(--pure-white);
	margin: 4px;
	display: inline-block;
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