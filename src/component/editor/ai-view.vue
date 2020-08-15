<template>
	<div v-show="visible" class="ai" @mousemove="mousemove" @mouseleave="mouseleave">
		<div v-show="!loading" ref="codemirror" :style="{'font-size': fontSize + 'px', 'line-height': lineHeight + 'px'}" :class="{search: searchEnabled}" class="codemirror"></div>
		<div v-show="searchEnabled" class="search-panel">
			<v-icon>mdi-magnify</v-icon>
			<input ref="searchInput" v-model="searchQuery" type="text" class="query" autocomplete="off" @keyup.enter="$event.shiftKey ? searchPrevious() : searchNext()">
			<span v-if="searchLines.length" class="results">{{ searchCurrent + 1 }} / {{ searchLines.length }}</span>
			<v-icon class="arrow" @click="searchPrevious">mdi-chevron-left</v-icon>
			<v-icon class="arrow" @click="searchNext">mdi-chevron-right</v-icon>
		</div>
		<div v-show="hintDialog" ref="hintDialog" :style="{left: hintDialogLeft + 'px', top: hintDialogTop + 'px'}" class="hint-dialog">
			<div v-if="completionType" class="type">
				<lw-type :type="completionType" />
			</div>
			<div ref="hints" class="hints">
				<div v-for="(hint, index) of hints" :key="index" :class="{active: selectedCompletion === index}" class="hint" @click="clickHint($event, index)">
					<v-icon v-if="hint.category === 0" class="function">mdi-alpha-m-circle-outline</v-icon>
					<v-icon v-else-if="hint.category === 1" class="field">mdi-cube-outline</v-icon>
					<v-icon v-else class="variable">mdi-variable-box</v-icon>
					<!-- <v-icon v-else class="variable">mdi-function</v-icon> -->
					{{ hint.fullName }}
					<lw-type :type="hint.lstype" />
				</div>
			</div>
			<div v-if="selectedHint" class="details">
				<documentation-function v-if="selectedHint.type === 'function'" :fun="selectedHint.function" />
				<documentation-constant v-else-if="selectedHint.type === 'constant'" :constant="selectedHint.constant" />
				<weapon-preview v-else-if="selectedHint.details.type === 'weapon'" :weapon="selectedHint.details.weapon" />
				<chip-preview v-else-if="selectedHint.details.type === 'chip'" :chip="selectedHint.details.chip" />
				<span v-else v-html="selectedHint.details"></span>
			</div>
		</div>
		<div v-show="detailDialog" v-if="detailDialogContent" ref="detailDialog" :style="{left: detailDialogLeft + 'px', bottom: (!detailDialogAtBottom ? detailDialogTop + 'px' : 'auto'), top: (detailDialogAtBottom ? detailDialogTop + 'px' : 'auto'), 'max-height': detailDialogMaxHeight + 'px'}" class="detail-dialog" :class="{active: detailsDialogActive}" @mousemove="detailsDialogEnter" @mouseleave="detailsDialogLeave">
			<template v-if="detailDialogContent.keyword">
				<documentation-function v-if="detailDialogContent.keyword.type === 'function'" :fun="detailDialogContent.keyword.function" />
				<documentation-constant v-else-if="detailDialogContent.keyword.type === 'constant'" :constant="detailDialogContent.keyword.constant" />
				<weapon-preview v-else-if="detailDialogContent.keyword.details.type === 'weapon'" :weapon="detailDialogContent.keyword.details.weapon" />
				<chip-preview v-else-if="detailDialogContent.keyword.details.type === 'chip'" :chip="detailDialogContent.keyword.details.chip" />
				<div class="divider"></div>
			</template>
			<template v-if="detailDialogContent.details.defined">
				<i18n class="defined" path="leekscript.defined_in">
					<b slot="0">{{ detailDialogContent.details.defined[0] }}</b>
					<b slot="1">{{ detailDialogContent.details.defined[1] }}</b>
				</i18n>
				<div class="divider"></div>
			</template>
			<lw-type v-if="detailDialogContent.details.type" :type="detailDialogContent.details.type" />
			<template v-if="errorTooltip">
				<div class="divider"></div>
				<div class="error"><v-icon class="error">mdi-close-circle-outline</v-icon> {{ errorTooltipText }}</div>
			</template>
		</div>
		<loader v-if="loading" />
	</div>
</template>

<script lang="ts">
	import { Keyword } from '@/component/editor/keywords'
	import ChipPreview from '@/component/market/chip-preview.vue'
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { AI } from '@/model/ai'
	import { fileSystem } from '@/model/filesystem'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import DocumentationConstant from '../documentation/documentation-constant.vue'
	import DocumentationFunction from '../documentation/documentation-function.vue'

	const AUTO_SHORTCUTS = [
		["lama", "#LamaSwag", "", "Le pouvoir du lama"],
		["for", "for (var i = 0; i < ", "; i++) {\n\t\n}", "<h4>Boucle for</h4><br>for (var i = 0; i < ... ; i++) { ... }"],
		["while", "while (", ") {\n\t\n}", "<h4>Boucle while</h4><br>while ( ... ) { ... }"],
		["do", "do {\n\t\n} while (", ");", "<h4>Boucle do while</h4><br>do { ... } while( ... );"],
		["if", 'if (', ') {\n\t\n}', "<h4>Condition if</h4><br>if ( ... ) { ... }"]
	]

	@Component({ name: 'ai-view', components: {
		'weapon-preview': WeaponPreview,
		'chip-preview': ChipPreview,
		'documentation-function': DocumentationFunction,
		'documentation-constant': DocumentationConstant
	}})
	export default class AIView extends Vue {
		@Prop({required: true}) ai!: AI
		@Prop({required: true}) ais!: AI[]
		@Prop() visible!: boolean
		@Prop() fontSize!: number
		@Prop() lineHeight!: number
		@Prop() autoClosing!: boolean
		@Prop() autocompleteOption!: boolean
		@Prop() popups!: boolean
		@Prop() editors!: AIView[]

		public id!: number
		public editor!: CodeMirror.Editor
		public document!: CodeMirror.Doc
		public lines: number = 0
		public totalLines: number = 0
		public characters: number = 0
		public saving: boolean = false
		public loaded = false
		public loading: boolean = false
		public error!: boolean
		public needTest = false
		public activeLine: CodeMirror.LineHandle | null = null
		public pos: any
		public completionSelected: any
		public completionFrom: any
		public completionTo: any
		public hoverToken!: string
		public detailTimer: any
		public serverError: boolean = false
		public selectedCompletion: number = 0
		public completions: Keyword[] = []
		public dialogKeyMap: CodeMirror.KeyMap = {
			Up: this.up,
			Down: this.down,
			PageUp: this.up,
			PageDown: this.down,
			Home: this.top,
			End: this.bottom,
			Enter: this.pick,
			Tab: this.pick,
			Esc: this.close
		}
		public hintDialog: boolean = false
		public hintDialogTop: number = 0
		public hintDialogLeft: number = 0
		public hints: Keyword[] = []
		public selectedHint: Keyword | null = null
		public completionType: any = null
		public details: string[] = []
		public detailDialog: boolean = false
		public detailDialogContent: any = null
		public detailDialogTop: number = 0
		public detailDialogLeft: number = 0
		public detailDialogAtBottom: boolean = false
		public detailDialogMaxHeight: number = 0
		public detailsDialogActive: boolean = false
		public detailStart: number = 0
		public detailEnd: number = 0
		public searchOverlay: any = null
		public hoverOverlay: any = null
		public errorOverlay: any = null
		public errors!: any[]
		public errorTooltip: boolean = false
		public errorTooltipText: string = ''
		public searchEnabled: boolean = false
		public searchCurrent: number = 0
		public searchQuery: string = ''
		public searchLines: any = []
		public underlineMarker: CodeMirror.TextMarker | null = null
		public mouseX: number = -1
		public mouseY: number = -1
		private analyzerTimeout: any
		private hoverPosition: number = -1
		private codemirror!: any
		private hoverData!: any
		private ctrl: boolean = false

		created() {
			this.id = this.ai.id
			this.error = !this.ai.valid
		}
		mounted() {
			const codeMirrorElement = this.$refs.codemirror as any
			import(/* webpackChunkName: "codemirror" */ "@/codemirror-wrapper").then(wrapper => {
				this.codemirror = wrapper.CodeMirror
				this.editor = wrapper.CodeMirror(codeMirrorElement, {
					value: "",
					mode: this.ai.v2 ? "leekscript-v2" : "leekscript",
					theme: "leekwars",
					tabSize: 4,
					indentUnit: 4,
					indentWithTabs: true,
					highlightSelectionMatches: true,
					matchBrackets: true,
					lineNumbers: true,
					lineWrapping: true,
					continueComments: true,
					undoDepth: 200,
					autofocus: true,
					smartIndent: false,
					cursorHeight: 1,
					foldGutter: true,
					gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
					extraKeys: {
						"Shift-Tab": () => this.unindentCode(),
						"Ctrl-D": () => this.duplicateLine(),
						"Ctrl-E": () => this.commentCode(),
						"Shift-Ctrl-/": () => this.commentCode(),
						"Ctrl-K": () => this.removeLine(),
						"Ctrl-Space": () => this.autocomplete(wrapper.CodeMirror, true),
						"Shift-Ctrl-F": () => this.formatCode(),
						"Alt-Left": () => {},
						"Alt-Right": () => {}
					},
				} as any)

				const overlay_javadoc = { token: (stream: any) => {
					if (stream.match("@")) {
						stream.eatWhile(/\w/)
						return "at"
					}
					if (!stream.skipTo("@")) {
						stream.skipToEnd()
					}
					return null
				}}
				const overlay_ref = { token: (stream: any) => {
					if (stream.match("#")) {
						stream.eatWhile(/\w/)
						return "ref"
					}
					if (!stream.skipTo("#")) {
						stream.skipToEnd()
					}
					return null
				}}
				const overlay_todo = { token: (stream: any) => {
					if (stream.match(/TODO/, false)) {
						if (stream.match(/TODO([^\w]|$)/)) {
							return "todo"
						} else {
							stream.next()
						}
					}
					if (!stream.skipTo("TODO")) {
						stream.skipToEnd()
					}
					return null
				}}
				this.editor.addOverlay(overlay_javadoc)
				this.editor.addOverlay(overlay_ref)
				this.editor.addOverlay(overlay_todo)

				this.document = this.editor.getDoc()

				this.editor.on('change', (_, changes) => this.change(wrapper.CodeMirror, changes))
				this.editor.on('cursorActivity', (_) => this.cursorChange())

				this.show()

				// Lock scroll down
				const codeMirrorScroll = codeMirrorElement.querySelector('.CodeMirror-scroll') as HTMLElement
				if (codeMirrorScroll) {
					codeMirrorScroll.addEventListener('wheel', (e: WheelEvent) => {
						if (e.deltaY > 0 && Math.abs(codeMirrorScroll.scrollTop - (codeMirrorScroll.scrollHeight - codeMirrorScroll.offsetHeight + 15)) <= 1) {
							e.preventDefault()
						}
					})
				}
				this.editor.on("mousedown", this.editorMousedown as any)
			})
		}
		@Watch('visible')
		visibilityChanged() {
			if (this.visible) {
				setTimeout(() => this.editor.refresh())
			}
		}
		public editorMousedown(editor: CodeMirror.Editor, e: MouseEvent) {
			if (e.ctrlKey && this.hoverData && this.hoverData.defined) {
				this.detailDialog = false
				const ai = fileSystem.aiByFullPath[this.hoverData.defined[0]]
				this.$emit('jump', ai, this.hoverData.defined[1])
				this.ctrl = false
				e.preventDefault()
			}
		}
		public editorKeyDown(e: KeyboardEvent) {
			if (e.keyCode === 17) {
				this.ctrl = true
				this.updateMouseAndCtrl()
			}
		}
		public editorKeyUp(e: KeyboardEvent) {
			if (e.keyCode === 17) {
				this.ctrl = false
				this.updateMouseAndCtrl()
			}
		}
		public hasBeenModified() {
			this.ai.modified = true
			this.removeErrors()
		}
		public show() {
			if (this.loaded) {
				this.editor.refresh()
			} else {
				this.loading = true
				LeekWars.get('ai/get/' + this.id).then(data => {
					this.ai.code = data.ai.code
					this.updateIncludes()
					this.editor.setValue(this.ai.code)
					this.editor.getDoc().clearHistory()
					this.editor.refresh()
					this.updateFunctions()
					this.loaded = true
					this.loading = false
					setTimeout(() => this.editor.refresh())
					this.lines = this.editor.getDoc().lineCount()
					this.characters = this.editor.getDoc().getValue().length
					Vue.set(this.ai, 'included_lines', this.ai.total_lines - this.lines)
					Vue.set(this.ai, 'included_chars', this.ai.total_chars - this.ai.code.length)
					LeekWars.setSubTitle(this.$i18n.tc('main.n_lines', this.lines))
				})
			}
		}
		public showError(line: number) {
			// const codemirror = this.$refs.codemirror as HTMLElement
			// const l = codemirror.querySelectorAll('.CodeMirror-lines .CodeMirror-code > div')[line - 1].querySelector('pre')
			// if (l) { l.classList.add('line-error') }
		}
		public removeErrors() {
			// const codemirror = this.$refs.codemirror as HTMLElement
			// codemirror.querySelectorAll('.line-error').forEach((line: any) => {
			// 	line.classList.remove('line-error')
			// })
		}
		public cursorChange() {
			const cursor = this.document.getCursor()
			if (!this.pos) {
				this.pos = cursor
			} else if (this.pos.line !== cursor.line) {
				this.close()
				this.pos = cursor
			}
			if (this.activeLine) { this.editor.removeLineClass(this.activeLine, "background", "activeline") }
			this.activeLine = this.editor.addLineClass(cursor.line, "background", "activeline")
		}

		public addErrorOverlay(errors: any) {
			if (this.errorOverlay) {
				this.editor.removeOverlay(this.errorOverlay)
				this.errorOverlay = null
			}
			this.errors = errors
			if (this.errors.length === 0) { return }
			const error_by_line = {} as any
			for (const error of errors) {
				if (error[4] >= 2) { continue }
				if (!(error[0] in error_by_line)) { error_by_line[error[0]] = [] }
				error_by_line[error[0]].push([error[1], error[3]])
			}
			// console.log(error_by_line)
			const overlay = { token: (stream: any) => {
				const line = stream.lineOracle.line + 1
				const pos = stream.pos
				if (line in error_by_line) {
					// console.log("line", line, pos, error_by_line[line])
					for (const error of error_by_line[line]) {
						if (pos === error[0]) {
							let len = Math.max(1, error[1] - error[0])
							stream.eatWhile(() => len-- >= 0)
							return "highlight-error"
						}
						if (pos <= error[1]) {
							let len = error[0] - pos
							stream.eatWhile(() => len-- > 0)
							return null
						}
					}
					stream.skipToEnd()
				} else {
					stream.skipToEnd()
				}
			}}
			this.errorOverlay = overlay
			this.editor.addOverlay(overlay, {priority: 12})
			this.error = true
		}

		setAnalyzerTimeout() {
			// this.analyze()
			clearTimeout(this.analyzerTimeout)
			this.analyzerTimeout = setTimeout(() => {
				this.analyze()
			}, 40)
		}

		analyze() {
			const content = this.editor.getValue()
			return LeekWars.analyzer.analyze(this.ai, this.editor.getDoc().getValue()).then((problems) => {
				this.$emit('problems', problems)
			})
			.catch(() => {
				if (this.errorOverlay) {
					this.editor.removeOverlay(this.errorOverlay)
					this.errorOverlay = null
				}
			})
		}

		public change(CodeMirror: any, changes: CodeMirror.EditorChange) {
			const userChange = changes.origin === "+input" || changes.origin === "+delete"
			if (changes.origin !== "setValue") {
				this.hasBeenModified()
			}
			if (changes.origin === "+input" || (this.hintDialog && changes.origin === "+delete")) {
				// console.log(changes)
				if (changes.text.length === 1) { // One line of changes (no enter)
					this.autocomplete(CodeMirror)
				}
			}
			this.lines = this.editor.getDoc().lineCount()
			this.characters = this.editor.getDoc().getValue().length
			LeekWars.setSubTitle(this.$i18n.tc('main.n_lines', this.lines))

			if (changes.origin === "setValue") {
				this.analyze()
			} else {
				this.setAnalyzerTimeout()
			}

			if (userChange && this.autoClosing) {

				const chars = '{([\'"'
				const add = '})]\'"'
				let cursor = this.document.getCursor()
				let nextChar = this.document.getLine(cursor.line)[cursor.ch]

				// Enter
				if (changes.from.ch === changes.to.ch && changes.from.line === changes.to.line && changes.text.length === 2 && changes.text[0] === '' && changes.text[1] === '') {

					const prevLine = this.document.getLine(cursor.line - 1)
					const prevChar = prevLine[prevLine.length - 1]

					if (prevChar === '{' && nextChar === '}') {
						const indent = this.getLineIndentation(cursor.line)
						this.document.replaceSelection("\t\n" + indent)
						this.document.setCursor({line: cursor.line, ch: cursor.ch + 1})
					}
				}

				// Peut etre une insertion d'un délimiteur
				if (changes.from.ch === changes.to.ch) {

					const pos = chars.indexOf(changes.text[0])
					const pos2 = add.indexOf(changes.text[0])

					if (pos2 > -1 && nextChar === changes.text[0]) {

						this.document.setSelection(cursor, {line: cursor.line, ch: cursor.ch + 1})
						this.document.replaceSelection("")

					} else if (changes.text[0].length > 0 && pos > -1) { // Délimiteur ouvrant

						const start = this.document.getCursor("from")
						const end = this.document.getCursor("to")

						this.document.replaceRange(add[pos], start, end)
						this.document.setSelection(end, end)
					}
				} else if (changes.text[0] === "" && changes.from.ch - changes.to.ch === -1 && changes.removed) { // Delete

					const pos = chars.indexOf(changes.removed[0])

					cursor = this.document.getCursor()
					nextChar = this.document.getLine(cursor.line)[cursor.ch]

					if (pos > -1 && add.indexOf(nextChar) === pos) { // Delete closing delimitor
						const start = this.document.getCursor("from")
						const end = this.document.getCursor("to")
						end.ch++
						this.document.setSelection(start, end)
						this.document.replaceSelection("")
						this.document.setSelection(start, start)
					}
				}
			}
		}
		public formatCode() {
			import(/* webpackChunkName: "js-beautify" */ "js-beautify").then(js_beautify => {
				console.log(js_beautify)
				this.editor.setValue(js_beautify.js_beautify(this.editor.getValue(), {indent_size: 1, indent_char: '\t'}))
			})
		}
		public commentCode() {
			const start = this.document.getCursor('from').line
			const end = this.document.getCursor('to').line
			for (let i = 0; i < end - start + 1; i++) {
				const line = this.document.getLine(start + i)
				let pos = 0
				for (let j = 0; j < line.length; j++) {
					if (line.charAt(j) === ' ' || line.charAt(j) === '\t') {
						pos++
					} else {
						break
					}
				}
				const cuttedLine = line.slice(pos)
				if (cuttedLine.length > 0) {
					const from = {line: start + i, ch: 0}
					const to = {line: start + i, ch: line.length}
					if (line.charAt(pos) === "/" && line.charAt(pos + 1) === "/") {
						this.document.replaceRange(line.slice(0, pos) + line.slice(pos + 2), from, to) // Dé-Comment
					} else {
						this.document.replaceRange(line.slice(0, pos) + "//" + cuttedLine, from, to) // Comment
					}
				}
			}
		}
		public getLineIndentation(lineNo: number) {
			const line = this.document.getLine(lineNo)
			let indent = ""
			for (const l of line) {
				if (l === ' ' || l === '\t') {
					indent += l
				} else {
					break
				}
			}
			return indent
		}
		public unindentCode() {
			const start = this.document.getCursor("start").line
			const end = this.document.getCursor("end").line
			for (let i = 0; i < end - start + 1; i++) {
				const line = this.document.getLine(start + i)
				if (line.length > 0) {
					this.editor.indentLine(start + i, "subtract")
				}
			}
		}
		public removeLine() {
			const line = this.document.getCursor("start").line
			if (this.document.somethingSelected()) {
				this.document.replaceSelection("")
			} else {
				this.document.replaceRange("", {line, ch: 0}, {line: line + 1, ch: 0})
			}
			this.document.setCursor(line)
		}
		public duplicateLine() {
			if (this.document.somethingSelected()) {
				const start = this.document.getCursor("start")
				const end = this.document.getCursor("end")
				const selection = this.document.getSelection()
				this.document.replaceSelection(selection + selection)
				this.document.setSelection(start, end)
			} else {
				const start = this.document.getCursor("start").line
				const line = this.document.getLine(start)
				this.document.replaceRange(line + "\n" + line, {line: start, ch: 0}, {line: start, ch: line.length})
			}
		}
		public getTokenInformation(token: string, pos: CodeMirror.Position | null = null) {
			if (token.startsWith('@')) { token = token.substring(1) }
			for (const keyword of LeekWars.keywords) {
				if (keyword.name === token) {
					if (keyword.type === 'function' && pos) {
						const line = this.document.getLine(pos.line)
						let start = 0
						let par = 0
						let j = pos.ch
						let argCount = 0
						for (; j < line.length; ++j) {
							const c = line[j]
							if (c === '(') { if (par++ === 0) { start = j + 1 } }
							if (c === ')') { if (--par === 0) { break } }
							if (c === ',' && par === 1) { argCount++ }
						}
						const capture = line.substring(start, j)
						argCount = capture.trim() === '' ? 0 : argCount + 1
						if (argCount === keyword.argumentCount) {
							return keyword
						}
					} else {
						return keyword
					}
				}
			}
			if (this.ai.functions) {
				for (const fun of this.ai.functions) {
					if (token === fun.name) {
						return fun
					}
				}
			}
			if (this.ai.includes) {
				for (const include of this.ai.includes) {
					if (include.functions) {
						return include.functions.find(f => token === f.name)
					}
				}
			}
		}
		public mousemove(e: any) {
			this.mouseX = e.pageX
			this.mouseY = e.pageY
			this.updateMouseAndCtrl()
		}

		public updateMouseAndCtrl() {
			if (!this.popups || !this.editor) { return null }
			if (this.hintDialog) { return null }

			if (!this.ctrl && this.underlineMarker) {
				this.removeUnderlineMarker()
			}

			if (this.detailsDialogActive) { return }

			const pos = {left: this.mouseX - 4, top: this.mouseY}
			const editorPos = this.editor.coordsChar(pos, "window")
			const editorPos2 = {line: editorPos.line, ch: editorPos.ch + 1}
			const token = this.editor.getTokenAt(editorPos2, true)
			// console.log("token", token)

			// Underline
			if (this.ctrl && this.hoverData && this.hoverData.defined) {
				if (this.underlineMarker) { this.underlineMarker.clear() }
				this.underlineMarker = this.editor.getDoc().markText({line: editorPos.line, ch: token.start}, {line: editorPos.line, ch: token.end}, {className: 'cm-underlined'})
				this.togglePointerCursor(true)
			} else {
				this.removeUnderlineMarker()
			}

			const position = this.document.indexFromPos(editorPos)

			// Leave the hover area?
			if (this.hoverData) {
				if (this.hoverPosition < this.hoverData.location[0][2] || this.hoverPosition > this.hoverData.location[1][2]) {
					this.hoverData = null
					this.removeUnderlineMarker()
					if (this.hoverOverlay) {
						this.editor.removeOverlay(this.hoverOverlay)
						this.hoverOverlay = null
					}
					this.detailDialog = false
				}
			}
			if (this.hoverPosition === position) {
				return
			}
			this.hoverPosition = position

			clearTimeout(this.detailTimer)
			this.detailTimer = setTimeout(() => {

				// console.log("hover at", position)
				LeekWars.analyzer.hover(this.ai, position).then((raw_data) => {

					// console.log(JSON.stringify(raw_data))
					// console.log(raw_data.location[0], raw_data.location[1])
					// console.log(raw_data)
					const startPos = { ch: raw_data.location[0][1], line: raw_data.location[0][0] - 1 }

					if (raw_data.location[0][2] !== 0 || raw_data.location[1][2] !== 0) { // Not position [0:0]
						this.hoverData = raw_data
						const keyword = this.getTokenInformation(token.string, editorPos)
						this.detailDialogContent = { details: raw_data, keyword }
						const p = this.editor.cursorCoords(startPos, "page")
						const left = p.left
						this.detailDialogTop = window.innerHeight - p.top
						this.detailDialogLeft = left
						this.detailDialogAtBottom = false
						this.detailDialogMaxHeight = 999999
						this.detailDialog = true

						const fixPosition = () => {
							const detailDialog = this.$refs.detailDialog as HTMLElement
							const height = detailDialog.scrollHeight
							const top = window.innerHeight - this.detailDialogTop
							this.detailDialogMaxHeight = window.innerHeight - this.detailDialogTop
							if (top - height < 0 && top + this.lineHeight + height <= window.innerHeight) { // Y'a moyen de positionner le dialogue en bas
								this.detailDialogAtBottom = true
								this.detailDialogTop = top + this.lineHeight
								this.detailDialogMaxHeight = window.innerHeight - top - this.lineHeight
							}

							const width = detailDialog.clientWidth
							if (left + width > window.innerWidth - 20) {
								this.detailDialogLeft = window.innerWidth - width - 20
							}
						}
						Vue.nextTick(fixPosition)

						const start_line = raw_data.location[0][0] - 1
						const start_char = raw_data.location[0][1]
						const end_line = raw_data.location[1][0] - 1
						const end_char = raw_data.location[1][1]

						const overlay = {token: (stream: any) => {
							const lineNo = stream.lineOracle.line
							if (lineNo >= start_line && lineNo <= end_line) {
								if (lineNo === start_line) {
									if (stream.pos < start_char) {
										stream.next()
										return
									} else if (lineNo !== end_line || stream.pos <= end_char) {
										stream.next()
										return "hover"
									}
								} else if (lineNo === end_line && stream.pos <= end_char) {
									stream.next()
									return "hover"
								} else {
									stream.skipToEnd()
									return "hover"
								}
							}
							stream.skipToEnd()
						}}
						if (this.hoverOverlay) {
							this.editor.removeOverlay(this.hoverOverlay)
						}
						this.hoverOverlay = overlay
						this.editor.addOverlay(overlay)

						// Display error?
						const tooltip = this.$refs.tooltip
						let shown = false
						for (const er in this.errors) {
							const error = this.errors[er]
							if (error[0] === editorPos.line + 1 && error[1] <= editorPos.ch && error[3] > editorPos.ch) {
								this.errorTooltipText = i18n.t('ls_error.' + error[5], error[6]) as string
								this.errorTooltip = true
								shown = true
								break
							}
						}
						if (!shown) { this.errorTooltip = false }
					} else {
						this.hoverData = null
						this.removeUnderlineMarker()
						if (this.hoverOverlay) {
							this.editor.removeOverlay(this.hoverOverlay)
							this.hoverOverlay = null
						}
						// clearTimeout(this.detailTimer)
						this.detailDialog = false
					}
				})
				.catch(() => {
					// console.log("cannot hover")
				})
			}, this.ctrl ? 0 : 200)
		}

		public detailsDialogEnter() {
			this.detailsDialogActive = true
			clearTimeout(this.detailTimer)
		}

		public detailsDialogLeave() {
			this.detailsDialogActive = false
		}

		public removeUnderlineMarker() {
			if (this.underlineMarker) {
				this.underlineMarker.clear()
				this.underlineMarker = null
				this.togglePointerCursor(false)
			}
		}

		public togglePointerCursor(enabled: boolean) {
			const lines = (this.$refs.codemirror as HTMLElement).querySelector('.CodeMirror-lines') as HTMLElement
			if (lines) { lines.style.cursor = enabled ? "pointer" : "text" }
		}

		public mouseleave() {
			clearTimeout(this.detailTimer)
			if (!this.detailsDialogActive) {
				this.detailDialog = false
			}
			this.editor.removeOverlay(this.hoverOverlay)
			this.hoverOverlay = null
		}

		public autocomplete(CodeMirror: any, force: boolean = false) {
			if (!this.autocompleteOption) { return }

			const cursor = this.document.getCursor()
			const position = this.document.indexFromPos(cursor)

			return

			LeekWars.analyzer.complete(this.ai, position).then(raw_data => {

				const raw_completions = raw_data.items
				this.completionType = raw_data.type
				console.log(raw_data)

				const completions = raw_completions.sort().map((data: any) => {
					return {
						name: data.name,
						fullName: data.name,
						details: i18n.t('leekscript.keyword', [data.name]) as string,
						category: data.type,
						type: 'function',
						lstype: data.lstype,
						location: data.location
					}
				})

				// if (!force && token.string.length === 0) {
				// 	this.close()
				// 	return
				// }

				this.completions = completions
				// this.completionFrom = {line: cursor.line, ch: startPos}
				// this.completionTo = {line: cur.line, ch: token.end}

				if (completions.length === 0) {
					this.close()
				} else {
					this.hintDialog = true
					this.detailDialog = false

					const pos = this.editor.cursorCoords({line: cursor.line, ch: cursor.ch })
					const left = pos.left, top = pos.bottom
					const offset = (this.$refs.codemirror as HTMLElement).getBoundingClientRect()

					this.hintDialogTop = top
					this.hintDialogLeft = left

					this.hints = completions
					this.selectHint(0)

					this.editor.removeKeyMap(this.dialogKeyMap)
					this.editor.addKeyMap(this.dialogKeyMap)
				}
			})
		}

		public clickHint(e: Event, index: number) {
			if (index === this.selectedCompletion) {
				this.pick()
			} else {
				this.selectHint(index)
			}
			this.editor.focus()
			e.stopPropagation()
			e.preventDefault()
			return false
		}
		public up() {
			this.selectHint(this.selectedCompletion === 0 ? (this.hints.length - 1) : this.selectedCompletion - 1)
		}
		public down() {
			this.selectHint((this.selectedCompletion + 1) % this.hints.length)
		}
		public top() {
			this.selectHint(0)
		}
		public bottom() {
			this.selectHint(this.hints.length - 1)
		}
		public selectHint(index: number) {
			this.selectedCompletion = index
			this.selectedHint = this.hints[index]
			Vue.nextTick(() => {
				const hints = this.$refs.hints as HTMLElement
				const hintList = (this.$refs.hintDialog as HTMLElement).querySelectorAll('.hint') as any
				const posIndex = Math.max(0, Math.round(index - (hints.offsetHeight / hintList[index].offsetHeight) / 2 + 1))
				if (hintList[posIndex]) {
					hints.scrollTo(0, -2 + hintList[posIndex].offsetTop)
				}
			})
		}
		public pick() {
			const completion = this.completions[this.selectedCompletion]
			console.log("Pick completion", completion)

			const completion_start = completion.location[0]
			const completion_end = completion.location[1]

			if (completion.type === 'function' || completion.type === 'user-function') {
				let name = completion.fullName + "()"
				if (name.indexOf(':') > -1) {
					name = name.substring(0, name.indexOf(':') - 1)
				}
				this.document.replaceRange(name, {line: completion_start[0] - 1, ch: completion_start[1]}, {line: completion_end[0] - 1, ch: completion_end[1]})
				const pos = this.document.getCursor()
				const argCount = completion.lstype.args ? completion.lstype.args.length : 0
				if (argCount > 0) {
					this.document.setCursor({line: pos.line, ch: completion_start[1] + name.length - 1})
					setTimeout(() => {
						this.autocomplete(this.codemirror)
					})
					// const firstArgLength = (argCount > 1 ? name.indexOf(',') : name.indexOf(')')) - name.indexOf('(') - 1
					// this.document.setSelection({line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1}, {line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1 + firstArgLength})
				}
			} else if (completion.type === 'shortcut') {

				// Dirty : modify the history to avoid having the word selected after an undo.
				// Set head.ch = anchor.ch (no selection)
				const history = this.document.getHistory()
				history.done[history.done.length - 1].ranges[0].head.ch = history.done[history.done.length - 1].ranges[0].anchor.ch
				this.document.setHistory(history)
				const shortcut = AUTO_SHORTCUTS[completion.shortcut!]
				let pos = this.document.getCursor()
				const iniLine = pos.line
				const indent = this.getLineIndentation(iniLine)

				pos.ch = this.completionFrom.ch
				this.document.replaceRange(shortcut[1].replace(/\n/g, '\n' + indent) + shortcut[2].replace(/\n/g, '\n' + indent),this.completionFrom, this.completionTo)

				pos = this.document.getCursor()
				pos.line = iniLine + (shortcut[1].split("\n").length - 1)
				pos.ch = shortcut[1].length - shortcut[1].lastIndexOf("\n") - 1 + indent.length
				this.document.setCursor(pos)
			} else {
				this.document.replaceRange(completion.name, this.completionFrom, this.completionTo)
			}
			this.close()
		}
		public close() {
			this.hintDialog = false
			this.editor.removeKeyMap(this.dialogKeyMap)
		}
		public scrollToLine(line: number) {
			this.document.setCursor({line, ch: 0})
			const height = this.editor.getScrollInfo().clientHeight
			const coords = this.editor.charCoords({line, ch: 0}, "local")
			this.editor.scrollTo(null, (coords.top + coords.bottom - height) / 2)
		}

		public updateIncludes() {
			// console.log("Update includes", this.ai.name)
			this.ai.includes = []
			const code = this.ai.code
			const regex = /include\s*\(\s*"(.*?)"\s*\)/gm
			let m
			while (m = regex.exec(code)) {
				const path = m[1]
				const included = fileSystem.find(path, this.ai.folder)
				if (included) {
					// console.log("Found included", path, this.ai.folder, included)
					this.ai.includes.push(included)
					this.$emit("load", included)
					LeekWars.analyzer.register(included).catch(e => {
						// nothing
					})
				} else {
					console.warn("Included not found", path, this.ai.folder, included)
				}
			}
		}

		public updateFunctions() {
			const code = this.editor.getValue()
			this.ai.functions = []
			let match
			const regex = /function\s+(\w+)\s*\(\s*([\s\S]*?)\s*\)/g

			while ((match = regex.exec(code)) != null) {

				const line = code.substring(0, match.index).split("\n").length
				let args = match[2].split(",")
				if (args.length === 1 && args[0].trim() === '') { args = [] }
				for (let arg of args) {
					arg = arg.trim()
				}
				const fullName = match[1] + "(" + args.join(", ") + ")"
				let description = "<h4>" + i18n.t('leekscript.function_f', [fullName]) + "</h4><br>"
				description += i18n.t('leekscript.defined_in', [this.ai.name, line])

				this.ai.functions.push({name: match[1], fullName, details: description, type: 'user-function', argumentCount: args.length, arguments: args, ai: this.ai, line})
			}
		}
		public getGlobalVars(vars: any) {
			vars = vars || []
			if (!(this.id in vars)) {
				const lines = this.editor.getDoc().lineCount()
				const pos = {line: lines - 1, ch: this.document.getLine(lines - 1).length}
				const token = this.editor.getTokenAt(pos)
				vars[this.id] = token.state.globalVars
			}
			this.updateIncludes()
			for (const include of this.ai.includes) {
				if (!(include.id in vars)) {
					const editor = this.editors.find(e => e.id === include.id)
					if (editor) {
						const vars2 = editor.getGlobalVars(vars)
						for (const v in vars2) {
							vars[v] = vars2[v]
						}
					}
				}
			}
			return vars
		}
		public search() {
			const selection = this.document.getSelection()
			if (!this.searchEnabled || selection) {
				this.searchEnabled = true
				this.searchQuery = selection
				this.searchUpdate()
				Vue.nextTick(() => {
					(this.$refs.searchInput as HTMLElement).focus()
				})
			} else {
				this.closeSearch()
			}
		}
		public closeSearch() {
			this.searchEnabled = false
			if (this.searchOverlay) {
				this.editor.removeOverlay(this.searchOverlay)
				this.searchOverlay = null
			}
		}
		@Watch('searchQuery')
		public searchUpdate() {
			const query = this.searchQuery.toLowerCase()
			this.searchCurrent = 0
			this.searchLines = []
			if (query.length > 0) {
				for (let l = 0; l < this.document.lineCount(); ++l) {
					const line = this.document.getLine(l)
					let index = -1
					while ((index = line.toLowerCase().indexOf(query, index + 1)) > -1) {
						this.searchLines.push([l, index])
					}
				}
				this.searchRefresh()
			} else {
				if (this.searchOverlay) {
					this.editor.removeOverlay(this.searchOverlay)
					this.searchOverlay = null
				}
			}
		}
		public searchRefresh() {
			const query = this.searchQuery.toLowerCase()
			// TODO improve this overlay speed
			const overlay = {token: (stream: any) => {
				const lineNo = stream.lineOracle.line
				if (stream.match(query, true, true)) {
					let index: any = -1
					for (let l = 0; l < this.searchLines.length; ++l) {
						if (this.searchLines[l][0] === lineNo && this.searchLines[l][1] === stream.start) {
							index = l
							break
						}
					}
					if (index === this.searchCurrent) {
						return "matchhighlight-green"
					}
					return "matchhighlight"
				}
				stream.next()
				const il = stream.string.indexOf(query.charAt(0), stream.pos)
				const iu = stream.string.indexOf(query.charAt(0).toUpperCase(), stream.pos)
				if (il === -1 && iu === -1) { stream.skipToEnd() }
				else if (iu === -1 || il < iu) { stream.skipTo(query.charAt(0)) }
				else { stream.skipTo(query.charAt(0).toUpperCase()) }
			}}
			if (this.searchOverlay) {
				this.editor.removeOverlay(this.searchOverlay)
			}
			this.searchOverlay = overlay
			this.editor.addOverlay(overlay)
			if (this.searchLines.length > 0) {
				const line = this.searchLines[this.searchCurrent][0]
				const t = this.editor.charCoords({line, ch: 0}, "local").top
				const middleHeight = this.editor.getScrollerElement().offsetHeight / 2
				this.editor.scrollTo(0, t - middleHeight - 5)
			}
		}
		public searchPrevious() {
			this.searchCurrent--
			if (this.searchCurrent < 0) { this.searchCurrent = this.searchLines.length - 1 }
			this.searchRefresh()
		}
		public searchNext() {
			this.searchCurrent = (this.searchCurrent + 1) % this.searchLines.length
			this.searchRefresh()
		}
	}
</script>

<style lang="scss" scoped>
	.ai {
		// position: relative;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.codemirror {
		height: 100%;
	}
	.codemirror.search {
		height: calc(100% - 40px);
	}
	.loader {
		position: absolute;
		top: calc(50% - 35px);
		left: calc(50% - 35px);
	}
	.codemirror ::v-deep .line-error {
		position: relative;
	}
	.codemirror ::v-deep .line-error:after {
		position: absolute;
		bottom: -3px;
		left: 0;
		content: "";
		height: 20px;
		width: 100%;
		background-image: url("/image/squiggle.gif");
		background-repeat: repeat-x;
		background-position: left bottom;
		vertical-align: text-top;
	}
	.hint-dialog {
		position: absolute;
		z-index: 100;
		margin: 0;
		display: flex;
		align-items: flex-end;
		> .type {
			position: absolute;
			top: 0;
			left: 0;
			transform: translateX(-100%);
			font-family: monospace;
			font-size: 14px;
			line-height: 20px;
			padding: 2px 5px;
			background: #f7f7f7;
			border: 1px solid #ccc;
			border-right: none;
		}
	}
	.hint-dialog .hints {
		min-width: 400px;
		background: white;
		font-family: monospace;
		overflow-y: auto;
		overflow-x: hidden;
		vertical-align: top;
		max-height: 260px;
		background: #f7f7f7;
		border: 1px solid #ccc;
	}
	.hint-dialog .hint {
		margin: 0;
		padding: 2px 4px;
		white-space: pre;
		color: black;
		cursor: pointer;
		user-select: none;
		font-size: 14px;
		line-height: 20px;
		.v-icon {
			transition: none;
			font-size: 18px;
			margin-top: -2px;
			&.field {
				color: #074f86;
			}
			&.function {
				color: #b12f83;
			}
		}
		&.active {
			background: #d2e9ff;
		}
	}
	.hint-dialog .details {
		width: 500px;
		overflow-y: auto;
		background: #f7f7f7;
		border: 1px solid #ccc;
		border-left: none;
		max-height: 600px;
		padding: 8px;
	}
	.detail-dialog {
		position: absolute;
		max-width: 600px;
		width: fit-content;
		z-index: 100;
		background: #f7f7f7;
		border: 1px solid #ccc;
		overflow-y: auto;
		&.active {
			box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
		}
		> * {
			display: block;
			padding: 5px 8px;
		}
		::v-deep .doc-constant.item {
			padding: 0 !important;
			min-width: 280px;
			max-width: 320px;
			h4 {
				margin-left: 6px;
				margin-right: 6px;
			}
			ul {
				margin: 10px;
			}
		}
		.divider {
			padding: 0;
			height: 1px;
			background: #ccc;
		}
		> .error {
			display: flex;
			align-items: center;
			background: rgba(255, 0, 0, 0.1);
			padding: 5px 8px;
			.v-icon {
				color: red;
				margin-right: 4px;
				font-size: 20px;
				background: none;
			}
		}
	}
	.details ::v-deep .deprecated-message {
		color: #ff7f00;
		font-weight: bold;
		margin: 10px 0;
	}
	.search-panel {
		height: 40px;
		background: #eee;
		display: flex;
	}
	.search-panel .v-icon {
		width: 40px;
		height: 40px;
		padding: 8px;
	}
	.search-panel .arrow {
		opacity: 0.3;
		cursor: pointer;
	}
	.search-panel .arrow:hover {
		opacity: 1;
		background: rgba(127,127,127,0.5);
	}
	.search-panel input {
		width: 100%;
		height: 26px;
		margin: 7px 0;
		margin-right: 7px;
		border: none;
		background: #eee;
	}
	.search-panel .results {
		color: #777;
		margin-right: 13px;
		line-height: 40px;
		white-space: nowrap;
	}
</style>
