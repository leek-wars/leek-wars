<template>
	<div v-show="visible" class="ai" @mousemove="mousemove" @mouseleave="mouseleave" @keyup="editorKeyUp" @keydown="editorKeyDown">
		<div v-show="!loading" ref="codemirror" :style="{'font-size': fontSize + 'px', 'line-height': lineHeight + 'px'}" :class="{search: searchEnabled}" class="codemirror"></div>
		<div v-show="searchEnabled" class="search-panel">
			<i class="material-icons">search</i>
			<input ref="searchInput" v-model="searchQuery" type="text" class="query" autocomplete="off" @keyup.enter="$event.shiftKey ? searchPrevious() : searchNext()">
			<span v-if="searchLines.length" class="results">{{ searchCurrent + 1 }} / {{ searchLines.length }}</span>
			<i class="material-icons arrow" @click="searchPrevious">expand_less</i>
			<i class="material-icons arrow" @click="searchNext">expand_more</i>
		</div>
		<div v-show="hintDialog" ref="hintDialog" :style="{left: hintDialogLeft + 'px', top: hintDialogTop + 'px'}" class="hint-dialog">
			<div ref="hints" class="hints">
				<div v-for="(hint, index) of hints" :key="hint.fullName" :class="{active: selectedCompletion === index}" class="hint" @click="clickHint($event, index)">{{ hint.fullName }}</div>
			</div>
			<div v-if="selectedHint" class="details">
				<span v-if="typeof(selectedHint.details) === 'string'" v-html="selectedHint.details"></span>
				<weapon-preview v-if="selectedHint.details.type === 'weapon'" :weapon="selectedHint.details.weapon" />
				<chip-preview v-else-if="selectedHint.details.type === 'chip'" :chip="selectedHint.details.chip" />
			</div>
		</div>
		<div v-show="detailDialog" v-if="detailDialogContent" ref="detailDialog" :style="{left: detailDialogLeft + 'px', top: detailDialogTop + 'px'}" class="detail-dialog">
			<span v-if="typeof(detailDialogContent.details) === 'string'" v-html="detailDialogContent.details"></span>
			<weapon-preview v-if="detailDialogContent.details.type === 'weapon'" :weapon="detailDialogContent.details.weapon" />
			<chip-preview v-else-if="detailDialogContent.details.type === 'chip'" :chip="detailDialogContent.details.chip" />
		</div>
		<div v-show="errorTooltip" ref="tooltip" :style="{left: errorTooltipLeft + 'px', top: errorTooltipTop + 'px'}" class="error-tooltip">{{ errorTooltipText }}</div>
		<loader v-if="loading" />
	</div>
</template>

<script lang="ts">
	import { Keyword } from '@/component/editor/keywords'
	import ChipPreview from '@/component/market/chip-preview.vue'
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { AI } from '@/model/ai'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import CodeMirror from 'codemirror'
	import 'codemirror/lib/codemirror.css'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import './codemirror/bracefold'
	import './codemirror/commentfold'
	import './codemirror/foldcode'
	import './codemirror/foldgutter'
	import './codemirror/leekscript-mode'
	import './codemirror/leekscript-v2-mode'
	import './codemirror/match-highlighter'
	import './codemirror/matchbrackets'

	const AUTO_SHORTCUTS = [
		["lama", "#LamaSwag", "", "Le pouvoir du lama"],
		["for", "for (var i = 0; i < ", "; i++) {\n\t\n}", "<h4>Boucle for</h4><br>for (var i = 0; i < ... ; i++) { ... }"],
		["while", "while (", ") {\n\t\n}", "<h4>Boucle while</h4><br>while ( ... ) { ... }"],
		["do", "do {\n\t\n} while (", ");", "<h4>Boucle do while</h4><br>do { ... } while( ... );"],
		["if", 'if (', ') {\n\t\n}', "<h4>Condition if</h4><br>if ( ... ) { ... }"]
	]

	@Component({ name: 'ai-view', components: {
		'weapon-preview': WeaponPreview,
		'chip-preview': ChipPreview
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
		public details: string[] = []
		public detailDialog: boolean = false
		public detailDialogContent: any = null
		public detailDialogTop: number = 0
		public detailDialogLeft: number = 0
		public overlay: any = null
		public errors!: any[]
		public errorTooltip: boolean = false
		public errorTooltipText: string = ''
		public errorTooltipTop: number = 0
		public errorTooltipLeft: number = 0
		public searchEnabled: boolean = false
		public searchCurrent: number = 0
		public searchQuery: string = ''
		public searchLines: any = []
		public underlineMarker: CodeMirror.TextMarker | null = null
		public mouseX: number = -1
		public mouseY: number = -1
		public ctrl: boolean = false

		created() {
			this.id = this.ai.id
			this.error = !this.ai.valid
		}
		mounted() {
			const codeMirrorElement = this.$refs.codemirror as any
			this.editor = CodeMirror(codeMirrorElement, {
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
					"Ctrl-Space": () => this.autocomplete(true),
					"Shift-Ctrl-F": () => this.formatCode()
				},
			} as any)
			this.document = this.editor.getDoc()

			this.editor.on('change', (_, changes) => this.change(changes))
			this.editor.on('cursorActivity', (_) => this.cursorChange())

			this.show()
			
			// Lock scroll down
			const codeMirrorScroll = codeMirrorElement.querySelector('.CodeMirror-scroll') as HTMLElement
			if (codeMirrorScroll) {
				codeMirrorScroll.addEventListener('wheel', (e: WheelEvent) => {
					if (e.deltaY > 0 && Math.abs(codeMirrorScroll.scrollTop - (codeMirrorScroll.scrollHeight - codeMirrorScroll.offsetHeight + 15)) < 1) {
						e.preventDefault()
					}
				})
			}
			this.editor.on("mousedown", this.editorMousedown as any)
		}
		@Watch('visible')
		visibilityChanged() {
			if (this.visible) {
				setTimeout(() => this.editor.refresh())
			}
		}
		public editorMousedown(editor: CodeMirror.Editor, e: MouseEvent) {
			if (e.ctrlKey) {
				const pos = this.editor.coordsChar({left: e.pageX, top: e.pageY }, "page")
				const token = this.editor.getTokenAt(pos)
				const keyword = this.getTokenInformation(token.string, pos)
				if (keyword && keyword.type === 'user-function') {
					this.detailDialog = false
					this.$emit('jump', keyword.ai, keyword.line)
				}
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
					this.editor.setValue(this.ai.code)
					this.editor.getDoc().clearHistory()
					this.editor.refresh()
					this.updateIncludes()
					this.updateFunctions()
					this.loaded = true
					this.loading = false
					setTimeout(() => this.editor.refresh())
					this.lines = this.editor.getDoc().lineCount()
					this.characters = this.editor.getDoc().getValue().length
					LeekWars.setSubTitle(this.$i18n.t('editor.n_lines', [this.lines]))
				})
			}
		}
		public showError(line: number) {
			const codemirror = this.$refs.codemirror as HTMLElement
			const l = codemirror.querySelectorAll('.CodeMirror-lines .CodeMirror-code > div')[line - 1].querySelector('pre')
			if (l) { l.classList.add('line-error') }
		}
		public removeErrors() {
			const codemirror = this.$refs.codemirror as HTMLElement
			codemirror.querySelectorAll('.line-error').forEach((line: any) => {
				line.classList.remove('line-error')
			})
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
			this.errors = errors
			let current = 0
			let error = errors[0]
			const overlay = {token: (stream: any) => {
				const lineNo = stream.lineOracle.line + 1
				while (error[0] < lineNo && current < this.errors.length - 1) {
					error = this.errors[++current]
				}
				if (error[0] !== lineNo) {
					stream.skipToEnd()
				} else {
					if (stream.start === error[1]) {
						let len = Math.max(1, error[3] - error[1] - 1)
						stream.eatWhile(() => len-- > 0)
						while (error[0] === lineNo && error[1] <= stream.start && current < this.errors.length - 1) {
							error = this.errors[++current]
						}
						return "highlight-error"
					} else {
						stream.next()
					}
				}
			}}
			this.overlay = overlay
			this.editor.addOverlay(overlay)
			this.error = true
		}
		public change(changes: CodeMirror.EditorChange) {
			const userChange = changes.origin === "+input" || changes.origin === "+delete"
			if (changes.origin !== "setValue") {
				this.hasBeenModified()
			}
			if (changes.origin === "+input" || (this.hintDialog && changes.origin === "+delete")) {
				this.autocomplete()
			}
			this.lines = this.editor.getDoc().lineCount()
			this.characters = this.editor.getDoc().getValue().length
			LeekWars.setSubTitle(this.$i18n.t('editor.n_lines', [this.lines]))

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
			import(/* webpackChunkName: "editor" */ "js-beautify").then(js_beautify => {
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
			if (!this.popups) { return null }
			if (this.hintDialog) { return null }

			if (!this.ctrl && this.underlineMarker) {
				this.removeUnderlineMarker()
			}

			const pos = {left: this.mouseX, top: this.mouseY}
			const codemirror = this.$refs.codemirror as HTMLElement
			if (pos.left < codemirror.getBoundingClientRect().left || pos.top < codemirror.getBoundingClientRect().top) {
				clearTimeout(this.detailTimer)
				this.detailDialog = false
				return
			}
			const editorPos = this.editor.coordsChar(pos, "page")

			// Display error?
			const tooltip = this.$refs.tooltip
			let shown = false
			for (const er in this.errors) {
				const error = this.errors[er]
				if (error[0] === editorPos.line + 1 && error[1] <= editorPos.ch && error[3] > editorPos.ch) {
					const p = this.editor.cursorCoords({line: editorPos.line, ch: error[1]})
					this.errorTooltipText = error[4]
					this.errorTooltipTop = p.bottom - codemirror.getBoundingClientRect().top - 3
					this.errorTooltipLeft = p.left - codemirror.getBoundingClientRect().left - 2
					this.errorTooltip = true
					shown = true
					break
				}
			}
			if (!shown) { this.errorTooltip = false }
			const token = this.editor.getTokenAt(editorPos)
			const tokenString = token.string

			if (tokenString !== this.hoverToken || this.ctrl !== !!this.underlineMarker) {
				this.hoverToken = tokenString
				const keyword = this.getTokenInformation(tokenString, editorPos)
				if (keyword) {
					if (this.ctrl) {
						if (this.underlineMarker) { this.underlineMarker.clear() }
						this.underlineMarker = this.editor.getDoc().markText({line: editorPos.line, ch: token.start}, {line: editorPos.line, ch: token.end}, {className: 'cm-underlined'})
						this.togglePointerCursor(true)
					}
					clearTimeout(this.detailTimer)
					this.detailTimer = setTimeout(() => {
						this.detailDialogContent = keyword
						const p = this.editor.cursorCoords(editorPos)
						this.detailDialogTop = p.bottom - codemirror.getBoundingClientRect().top
						this.detailDialogLeft = this.mouseX - codemirror.getBoundingClientRect().left
						this.detailDialog = true
					}, 400)
				} else {
					this.removeUnderlineMarker()
					clearTimeout(this.detailTimer)
					this.detailDialog = false
				}
			}
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
			this.detailDialog = false
		}
		public autocomplete(force: boolean = false) {
			if (!this.autocompleteOption) { return }

			this.updateIncludes()

			const cur = this.document.getCursor()
			const token = this.editor.getTokenAt(cur)
			let startPos = token.start

			const previousLength = token.string.length
			token.string = token.string.trim()
			startPos += previousLength - token.string.length

			if (!force && token.string.length === 0) {
				this.close()
				return
			}
			token.state = CodeMirror.innerMode(this.document.getMode(), token.state).state
			const completions: Keyword[] = []
			const start = token.string

			const maybeAdd = (data: string | Keyword) => {
				if (typeof data === 'string') {
					if (data.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push({name: data, fullName: data, details: i18n.t('editor.keyword', [data]) as string, type: 'keyword'})
					}
				} else {
					if (data.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push(data)
					}
				}
			}
			// Ajout des variables locales du code
			for (let v = token.state.localVars; v; v = v.next) {
				if (v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push({name: v.name, fullName: v.name, details: i18n.t('editor.variable', [v.name]) as string, type: 'keyword'})
				}
			}
			// Variables globales
			const vars = {[this.id]: token.state.globalVars}
			const globalVars = this.getGlobalVars(vars)
			for (const i in globalVars) {
				const file = vars[parseInt(i, 10)]
				for (let v = file; v; v = v.next) {
					if (v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						const keyword = this.getTokenInformation(v.name)
						if (!keyword) {
							let text = "Variable <b>" + v.name + "</b>"
							if (parseInt(i, 10) !== this.id) { text += "<br><br>" + this.$i18n.t('editor.variable_defined_in_ai', [this.ais[parseInt(i, 10)].name]) }
							completions.push({name: v.name, fullName: v.name, details: text, type: 'variable'})
						}
					}
				}
			}
			// File functions
			for (const fun of this.ai.functions) {
				if (fun.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push(fun)
				}
			}
			// Include functions
			for (const include of this.ai.includes) {
				const functions = this.ais[include.id].functions
				if (functions) {
					for (const fun of functions) {
						if (fun.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
							completions.push(fun)
						}
					}
				}
			}
			// Ajout des fonctions
			LeekWars.keywords.forEach(maybeAdd)
			// Raccourcis
			for (const r in AUTO_SHORTCUTS) {
				if (AUTO_SHORTCUTS[r][0].indexOf(start.toLowerCase()) === 0) {
					completions.push({name: AUTO_SHORTCUTS[r][0], fullName: AUTO_SHORTCUTS[r][0], details: AUTO_SHORTCUTS[r][3], type: 'shortcut', shortcut: parseInt(r, 10)})
				}
			}
			this.completions = completions
			this.completionFrom = {line: cur.line, ch: startPos}
			this.completionTo = {line: cur.line, ch: token.end}

			if (completions.length === 0) {
				this.close()
			} else {
				this.hintDialog = true
				this.detailDialog = false

				const pos = this.editor.cursorCoords({line: cur.line, ch: cur.ch - token.string.length})
				const left = pos.left, top = pos.bottom
				const offset = (this.$refs.codemirror as HTMLElement).getBoundingClientRect()

				this.hintDialogTop = top - offset.top
				this.hintDialogLeft = left - offset.left

				this.hints = completions
				this.selectHint(0)

				this.editor.removeKeyMap(this.dialogKeyMap)
				this.editor.addKeyMap(this.dialogKeyMap)
			}
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

			if (completion.type === 'function' || completion.type === 'user-function') {
				let name = completion.fullName
				if (name.indexOf(':') > -1) {
					name = name.substring(0, name.indexOf(':') - 1)
				}
				this.document.replaceRange(name, this.completionFrom, this.completionTo)
				const pos = this.document.getCursor()
				let argCount = name.split(',').length
				if (argCount === 1) {
					if (name.indexOf(')') - name.indexOf('(') === 1) { argCount = 0 }
				}
				if (argCount > 0) {
					const firstArgLength = (argCount > 1 ? name.indexOf(',') : name.indexOf(')')) - name.indexOf('(') - 1
					this.document.setSelection({line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1}, {line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1 + firstArgLength})
				} else {
					this.document.setCursor({line: pos.line, ch: this.completionFrom.ch + name.length})
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
			this.ai.includes = []
			const code = this.document.getValue()
			const regex = /include\s*\(\s*"(.*?)"\s*\)/gm
			let m
			while (m = regex.exec(code)) {
				for (const id in this.ais) {
					// TODO Search the AI correctly : by name, full path, relative path etc. from the including AI
					if (this.ais[id].name === m[1]) {
						this.ai.includes.push(this.ais[id])
						this.$emit("load", this.ais[id])
						break
					}
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
				let description = "<h4>" + i18n.t('editor.function_f', [fullName]) + "</h4><br>"
				description += i18n.t('editor.defined_in', [this.ai.name, line])

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
			if (this.overlay) {
				this.editor.removeOverlay(this.overlay)
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
				if (this.overlay) {
					this.editor.removeOverlay(this.overlay)
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
			if (this.overlay) {
				this.editor.removeOverlay(this.overlay)
			}
			this.overlay = overlay
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
		position: relative;
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
	.codemirror /deep/ .line-error {
		position: relative;
	}
	.codemirror /deep/ .line-error:after {
		position: absolute;
		top: 6px;
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
	}
	.hint-dialog .hints {
		width: 400px;
		background: white;
		font-family: monospace;
		overflow-y: auto;
		overflow-x: hidden;
		vertical-align: top;
		height: 260px;
		padding: 2px;
		box-shadow: 2px 3px 5px rgba(0,0,0,.2);
		border: 1px solid silver;
	}
	.hint-dialog .hint.active {
		background: #5fad1b;
		color: white;
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
	}
	.hint-dialog .details {
		width: 400px;
		overflow-y: auto;
		background: #f2f2f2;
		max-height: 600px;
		padding: 5px;
		border: 1px solid silver;
		box-shadow: 2px 3px 5px rgba(0,0,0,.2);
	}
	.detail-dialog {
		position: absolute;
		padding: 8px;
		background: #f2f2f2;
		width: 350px;
		box-shadow: 2px 3px 5px rgba(0,0,0,.2);
		border: 1px solid silver;
		z-index: 100;
	}
	.details /deep/ .deprecated-message {
		color: #ff7f00;
		font-weight: bold;
		margin: 10px 0;
	}
	.error-tooltip {
		position: absolute;
		color: #ab0000;
		background: white;
		border: 1px solid #ff6c71;
		z-index: 10;
		padding: 4px 6px;
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
		border-bottom-left-radius: 3px;
		font-size: 16px;
	}
	.search-panel {
		height: 40px;
		background: #eee;
		display: flex;
	}
	.search-panel i {
		width: 24px;
		height: 24px;
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
