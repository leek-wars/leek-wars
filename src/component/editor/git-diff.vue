<template lang="html">
	<div class="git-diff-viewer" ref="container"></div>
</template>

<script lang="ts">
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import * as monaco from 'monaco-editor'
	import { markRaw } from 'vue'

	@Options({ name: 'git-diff' })
	export default class GitDiff extends Vue {
		@Prop({ default: '' }) originalContent!: string
		@Prop({ default: '' }) modifiedContent!: string
		@Prop() file!: string
		@Prop({ default: 'leek-wars' }) theme!: string
		@Prop({ default: 13 }) fontSize!: number
		@Prop({ default: 20 }) lineHeight!: number
		@Prop({ default: false }) inline!: boolean
		@Prop({ default: true }) collapseUnchanged!: boolean

		diffEditor: monaco.editor.IDiffEditor | null = null
		originalModel: monaco.editor.ITextModel | null = null
		modifiedModel: monaco.editor.ITextModel | null = null

		mounted() {
			// Attendre que le conteneur soit layouté
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.createEditor()
				})
			})
		}

		beforeUnmount() {
			this.dispose()
		}

		dispose() {
			if (this.diffEditor) {
				this.diffEditor.setModel(null as any)
				this.diffEditor.dispose()
				this.diffEditor = null
			}
			this.originalModel?.dispose()
			this.modifiedModel?.dispose()
			this.originalModel = null
			this.modifiedModel = null
		}

		@Watch('theme')
		onThemeChange() {
			monaco.editor.setTheme(this.theme)
		}

		@Watch('fontSize')
		onFontSizeChange() {
			this.diffEditor?.updateOptions({ fontSize: this.fontSize })
		}

		@Watch('lineHeight')
		onLineHeightChange() {
			this.diffEditor?.updateOptions({ lineHeight: this.lineHeight })
		}

		@Watch('inline')
		onInlineChange() {
			this.diffEditor?.updateOptions({ renderSideBySide: !this.inline })
		}

		@Watch('collapseUnchanged')
		onCollapseUnchangedChange() {
			this.diffEditor?.updateOptions({ hideUnchangedRegions: { enabled: this.collapseUnchanged } })
		}

		@Watch('originalContent')
		@Watch('modifiedContent')
		onContentChange() {
			if (this.originalModel) {
				this.originalModel.setValue(this.normalize(this.originalContent))
			}
			if (this.modifiedModel) {
				this.modifiedModel.setValue(this.normalize(this.modifiedContent))
			}
		}

		normalize(content: string): string {
			return (content || '').replace(/[\r\n]+$/, '')
		}

		createEditor() {
			const container = this.$refs.container as HTMLElement
			if (!container) return
			this.originalModel = markRaw(monaco.editor.createModel(this.normalize(this.originalContent), 'leekscript'))
			this.modifiedModel = markRaw(monaco.editor.createModel(this.normalize(this.modifiedContent), 'leekscript'))

			this.diffEditor = markRaw(monaco.editor.createDiffEditor(container, {
				readOnly: true,
				renderSideBySide: !this.inline,
				automaticLayout: true,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				theme: this.theme,
				fontSize: this.fontSize,
				lineHeight: this.lineHeight,
				folding: false,
				glyphMargin: false,
				lineNumbersMinChars: 3,
				hideUnchangedRegions: { enabled: this.collapseUnchanged },
				wordWrap: "on",
			}))

			this.diffEditor.setModel({
				original: this.originalModel,
				modified: this.modifiedModel,
			})

			// Layout initial
			this.layout()
		}

		layout() {
			if (!this.diffEditor) return
			const container = this.$refs.container as HTMLElement
			if (!container) return
			const { width, height } = container.getBoundingClientRect()
			if (width > 0 && height > 0) {
				this.diffEditor.layout({ width, height })
			}
		}
	}
</script>

<style lang="scss" scoped>
.git-diff-viewer {
	flex: 1;
	width: 100%;
	height: 100%;
	overflow: hidden;
}
</style>
