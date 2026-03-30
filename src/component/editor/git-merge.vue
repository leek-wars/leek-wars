<template lang="html">
	<div class="git-merge-viewer" :class="{ready: editorReady}" ref="container"></div>
</template>

<script lang="ts">
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import * as monaco from 'monaco-editor'
	import { markRaw } from 'vue'
	import { parseConflicts, buildConflictDecorations, registerConflictCodeLens, applyConflictResolution, type MergeConflict } from './merge-conflicts'

	@Options({ name: 'git-merge', emits: ['resolve'], i18n: {} })
	export default class GitMerge extends Vue {
		@Prop({ default: '' }) content!: string
		@Prop({ default: '' }) file!: string
		@Prop({ default: 'leek-wars' }) theme!: string
		@Prop({ default: 13 }) fontSize!: number
		@Prop({ default: 20 }) lineHeight!: number

		editor: monaco.editor.IStandaloneCodeEditor | null = null
		model: monaco.editor.ITextModel | null = null
		editorReady: boolean = false
		conflicts: MergeConflict[] = []
		decorations: monaco.editor.IEditorDecorationsCollection | null = null
		lenses: monaco.IDisposable | null = null

		mounted() {
			this.createEditor()
		}

		beforeUnmount() {
			this.dispose()
		}

		dispose() {
			this.lenses?.dispose()
			this.lenses = null
			this.decorations = null
			if (this.editor) {
				this.editor.dispose()
				this.editor = null
			}
			this.model?.dispose()
			this.model = null
		}

		@Watch('theme')
		onThemeChange() {
			monaco.editor.setTheme(this.theme)
		}

		@Watch('fontSize')
		onFontSizeChange() {
			this.editor?.updateOptions({ fontSize: this.fontSize })
		}

		@Watch('lineHeight')
		onLineHeightChange() {
			this.editor?.updateOptions({ lineHeight: this.lineHeight })
		}

		@Watch('content')
		onContentChange() {
			if (this.model && this.content !== this.model.getValue()) {
				this.model.setValue(this.content)
				this.parseAndDecorate()
			}
		}

		createEditor() {
			const container = this.$refs.container as HTMLElement
			if (!container) return

			this.model = markRaw(monaco.editor.createModel(this.content || '', 'leekscript'))

			this.editor = markRaw(monaco.editor.create(container, {
				model: this.model,
				automaticLayout: true,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				theme: this.theme,
				fontSize: this.fontSize,
				lineHeight: this.lineHeight,
				folding: false,
				glyphMargin: true,
				lineNumbersMinChars: 3,
				wordWrap: 'on',
			}))

			this.parseAndDecorate()
			this.editorReady = true
		}

		/** Parse les marqueurs de conflit et crée les décorations */
		parseAndDecorate() {
			if (!this.model || !this.editor) return
			this.conflicts = parseConflicts(this.model.getValue())

			if (this.decorations) {
				this.decorations.set(buildConflictDecorations(this.model, this.conflicts))
			} else {
				this.decorations = this.editor.createDecorationsCollection(buildConflictDecorations(this.model, this.conflicts))
			}

			this.lenses?.dispose()
			this.lenses = registerConflictCodeLens(this.editor, this.model, this.conflicts, () => {
				this.parseAndDecorate()
				this.$emit('resolve', this.model?.getValue() || '', this.conflicts.length)
			})
		}

		goToConflict(index: number) {
			if (!this.editor || index >= this.conflicts.length) return
			const line = this.conflicts[index].startLine + 1
			this.editor.revealLineInCenter(line)
			this.editor.setPosition({ lineNumber: line, column: 1 })
		}
	}
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
