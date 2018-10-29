<template>
	<div v-show="visible" class="ai">
		<div v-show="!loading" ref="codemirror" :style="{'font-size': fontSize + 'px', 'line-height': lineHeight + 'px'}" class="codemirror"></div>
		<div v-show="hintDialog" ref="hintDialog" :style="{left: hintDialogLeft + 'px', top: hintDialogTop + 'px'}" class="hint-dialog">
			<div ref="hints" class="hints">
				<div v-for="(hint, index) of hints" :key="hint.name" :class="{active: selectedCompletion === index}" class="hint" @click="clickHint($event, index)">{{ hint.name }}</div>
			</div>
			<div v-if="selectedCompletion in hints" class="details">
				<span v-if="typeof(hints[selectedCompletion].details) === 'string'" v-html="hints[selectedCompletion].details"></span>
				<weapon-preview v-else-if="hints[selectedCompletion].details.type === 'weapon'" :weapon="hints[selectedCompletion].details.weapon" />
				<chip-preview v-else-if="hints[selectedCompletion].details.type === 'chip'" :chip="hints[selectedCompletion].details.chip" />
			</div>
		</div>
		<div ref="detailDialog" class="detail-dialog"></div>
		<loader v-if="loading" />
	</div>
</template>

<script lang="ts">
	import ChipPreview from '@/component/market/chip-preview.vue'
	import WeaponPreview from '@/component/market/weapon-preview.vue'
	import { AI } from '@/model/ai'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import CodeMirror from 'codemirror'
	import 'codemirror/lib/codemirror.css'
	import js_beautify from 'js-beautify'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import './codemirror/leekscript-mode'
	import './codemirror/match-highlighter'
	import './codemirror/matchbrackets'

	const AUTO_SHORTCUTS = [
		["lama", "#LamaSwag", "", "Le pouvoir du lama"],
		["for", "for (var i = 0; i < ", "; i++) {\n\t\n}", "<h3>Boucle for</h3><br>for (var i = 0; i < ... ; i++) { ... }"],
		["while", "while (", ") {\n\t\n}", "<h3>Boucle while</h3><br>while ( ... ) { ... }"],
		["do", "do {\n\t\n} while (", ");", "<h3>Boucle do while</h3><br>do { ... } while( ... );"],
		["if", 'if (', ') {\n\t\n}', "<h3>Condition if</h3><br>if ( ... ) { ... }"]
	]

	@Component({ name: 'ai-view', components: {
		'weapon-preview': WeaponPreview,
		'chip-preview': ChipPreview
	}})
	export default class AIView extends Vue {
		@Prop({required: true}) ai!: AI
		@Prop() visible!: boolean
		@Prop() fontSize!: number
		@Prop() lineHeight!: number

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
		public hoverToken: any
		public detailTimer: any
		public functions: any[] = []
		public serverError: boolean = false
		public autoClosing: boolean = true
		public includes: any
		public selectedCompletion: number = 0
		public completions: any[] = []
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
		public hints: string[] = []
		public details: string[] = []
		public detailDialog: boolean = false
		public overlay: any = null

		created() {
			this.id = this.ai.id
			this.error = !this.ai.valid
		}
			
		mounted() {
			const codeMirrorElement = this.$refs.codemirror as any
			this.editor = CodeMirror(codeMirrorElement, {
				value: "",
				mode: "leekscript",
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
				extraKeys: {
					"Shift-Tab": () => this.unindentCode(),
					"Ctrl-D": () => this.duplicateLine(),
					"Ctrl-E": () => this.commentCode(),
					"Shift-/": () => this.commentCode(),
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
				codeMirrorScroll.addEventListener('mousewheel', (e) => {
					if (e.deltaY > 0 && Math.abs(codeMirrorScroll.scrollTop - (codeMirrorScroll.scrollHeight - codeMirrorScroll.offsetHeight + 15)) < 1) {
						e.preventDefault()
					}
				})
			}

			// this.editor.on("mousedown", function(cm, e) {
			// 	
			// })
		}

		@Watch('visible')
		visibilityChanged() {
			if (this.visible) {
				setTimeout(() => this.editor.refresh())
			}
		}

		public editorMousedown(e: MouseEvent) {
			if (e.ctrlKey) {
				const pos = {left: e.pageX, top: e.pageY }
				const editorPos = this.editor.coordsChar(pos, "page")
				// var token = this.document.getTokenAtString(editorPos)
				// var information = this.getTokenInformation(token, editorPos)
				// if (information && information[3] === 'user-function') {
				// 	this.detailDialog = false
					// LW.pages.editor.jumpTo(information[6], information[7])
				// }
				e.preventDefault()
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
				LeekWars.get('ai/get/' + this.id + '/' + store.state.token).then((data: any) => {
					this.ai.code = data.data.ai.code
					this.editor.setValue(this.ai.code)
					this.editor.getDoc().clearHistory()
					this.editor.refresh()
					this.loaded = true
					this.loading = false
					setTimeout(() => this.editor.refresh())
					this.lines = this.editor.getDoc().lineCount()
					this.characters = this.editor.getDoc().getValue().length
					// 	LW.setSubTitle(_.lang.get('editor', 'n_lines', lines))
				})
			}

			// 	if (!this.loaded && this.id > 0) {

			// 		this.load(true);
			// 		$('#select-msg').hide()
			// 		LW.loader.show()
			// 		$('#top').hide()

			// 	} else {

			// 		LW.loader.hide()
			// 		$('#top').show()
			// 		$('#ai-name').text(this.name)
			// 		$('#select-msg').hide()

			// 		$('#editors .editor').hide()
			// 		$('#editors .folder-content').hide()
			// 		this.editorDiv.show()

			// 		// if (!_BASIC) {
			// 			//this.editor.focus();
			// 			this.editor.refresh()
			// 		// }
			// 		if (this.error) {
			// 			this.showErrors()
			// 		}
			// 		localStorage["editor/last_code"] = this.id
			// 	}
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

		public test() {
			// Save before
			if (this.ai.modified) {
				this.needTest = true
				// this.save()
				return
			}
			// Sauvegardé et erreur, on teste pas ça !
			if (this.error && !this.ai.v2) {
				return
			}
			// LeekWars.pages.editor.test(_testEvent)
		}

		public cursorChange() {
			const cursor = this.document.getCursor()
			if (!this.pos) {
				this.pos = cursor
			} else if (this.pos.line !== cursor.line) {
				// this.close()
				this.pos = cursor
			}
			if (this.activeLine) { this.editor.removeLineClass(this.activeLine, "background", "activeline") }
			this.activeLine = this.editor.addLineClass(cursor.line, "background", "activeline")
		}

		public addErrorOverlay(errors: any) {
			const lines: any = []
			for (const error of errors) {
				lines.push(error[0] - 1)
			}
			let start = 0
			const overlay = {token: (stream: any) => {
				const lineNo = stream.lineOracle.line
				let i = lines.indexOf(lineNo, start)
				if (i === -1) {
					stream.skipToEnd()
				} else {
					while (i < errors.length - 1 && stream.start > errors[i][1]) {
						i++
					}
					start = i
					if (stream.start === errors[i][1]) {
						let len = Math.max(1, errors[i][3] - errors[i][1] - 1)
						stream.eatWhile(() => len-- > 0)
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

		// // Not used
		// this.mergeLastTwoOperations = function() {
		// 	var history = this.editor.getDoc().getHistory()
		// 	var last = history.done.pop()
		// 	history.done[history.done.length - 1].changes.push(last.changes[0])
		// 	this.editor.getDoc().setHistory(history)
		// }

		public change(changes: CodeMirror.EditorChange) {

			const userChange = changes.origin === "+input" || changes.origin === "+delete"

			if (changes.origin !== "setValue") {
				this.hasBeenModified()
			}

			if (changes.origin === "+input" || (/*this.hintDialog.is(":visible") &&*/ changes.origin === "+delete")) {
				this.autocomplete()
			}

			this.lines = this.editor.getDoc().lineCount()
			this.characters = this.editor.getDoc().getValue().length
			// LW.setSubTitle(_.lang.get('editor', 'n_lines', lines))

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
						// this.mergeLastTwoOperations();
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
						// this.editor.matchBrackets()
						// this.mergeLastTwoOperations()
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
						// editor.matchBrackets()
					}
					// editor.matchBrackets()
				}
			}
		}

		formatCode() {
			this.editor.setValue(js_beautify(this.editor.getValue(), {indent_size: 1, indent_char: '\t'}))
			// this.editor.matchBrackets()
		}

		commentCode() {
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
			// this.editor.matchBrackets()
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
			// this.document.matchBrackets()
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
			// this.editor.matchBrackets()
		}

		getTokenInformation(token: string, pos: CodeMirror.Position) {
			for (const keyword of LeekWars.keywords) {
				if (keyword[0] === token) {
					if (keyword[3] === 'function') {
						const line = this.document.getLine(pos.line)
						let start = 0
						let par = 0
						let j = pos.ch
						for (; j < line.length; ++j) {
							const c = line[j]
							if (c === '(') { if (par++ === 0) { start = j + 1 } }
							if (c === ')') { if (--par === 0) { break } }
						}
						const capture = line.substring(start, j)
						const argCount = capture.trim() === '' ? 0 : (capture.match(/\,/g) || []).length + 1
						if (argCount === keyword[4]) {
							return keyword
						}
					} else {
						return keyword
					}
				}
			}
			for (const fun of this.functions) {
				if (token === fun[0]) {
					return fun
				}
			}
			// TODO access other editors
			// for (var i in this.includes) {
			// 	var functions = editors[this.includes[i]].functions
			// 	for (var f in functions) {
			// 		if (token === functions[f][0]) {
			// 			return functions[f]
			// 		}
			// 	}
			// }
		}

		// this.mousemove = function(e) {

		// 	if (!_popups) return null

		// 	if (this.hintDialog.is(':visible')) return null

		// 	var pos = {left: e.pageX, top: e.pageY }

		// 	if (pos.left < editor.editorDiv.offset().left || pos.top < editor.editorDiv.offset().top) {
		// 		clearTimeout(editor.detailTimer)
		// 		editor.detailDialog.hide()
		// 		return
		// 	}

		// 	var editorPos = editor.editor.coordsChar(pos, "page")

		// 	// Display error?
		// 	var tooltip = $('#error-tooltip')
		// 	var shown = false
		// 	for (var er in this.errors) {
		// 		var error = this.errors[er]
		// 		if (error[0] === editorPos.line + 1 && error[1] <= editorPos.ch && error[3] > editorPos.ch) {
		// 			var pos = editor.editor.cursorCoords({line: editorPos.line, ch: error[1]})
		// 			tooltip.text(error[4])
		// 			tooltip.css('top', pos.bottom)
		// 			tooltip.css('left', pos.left)
		// 			tooltip.show()
		// 			shown = true
		// 			break;
		// 		}
		// 	}
		// 	if (!shown) tooltip.hide()

		// 	var tokenString = editor.editor.getTokenAtString(editorPos)

		// 	if (tokenString != this.hoverToken) {

		// 		this.hoverToken = tokenString

		// 		var information = this.getTokenInformation(tokenString, editorPos)

		// 		if (information != null) {

		// 			clearTimeout(editor.detailTimer)
		// 			this.detailTimer = setTimeout(function() {

		// 				if (current != id) {
		// 					editor.detailDialog.hide()
		// 					return
		// 				}

		// 				editor.detailDialog.html(information[2])

		// 				var pos = editor.editor.cursorCoords(editorPos)
		// 				var top = pos.bottom

		// 				editor.detailDialog.css('top', top)
		// 				editor.detailDialog.css('left', e.pageX)
		// 				editor.detailDialog.show()

		// 			}, 400)

		// 		} else {
		// 			clearTimeout(editor.detailTimer)
		// 			editor.detailDialog.hide()
		// 		}
		// 	}
		// }

		// this.mouseleave = function() {
		// 	clearTimeout(editor.detailTimer)
		// 	editor.detailDialog.hide()
		// }

		autocomplete(force: boolean = false) {

			// Mise à jour des includes avant
			this.updateIncludes()

			const cur = this.document.getCursor()
			const token = this.editor.getTokenAt(cur)
			let startPos = token.start

			// Trim token
			const previousLength = token.string.length
			token.string = token.string.trim()
			startPos += previousLength - token.string.length

			if (!force && token.string.length === 0) {
				this.close()
				return
			}
			// TODO
			// token.state = CodeMirror.innerMode(this.editor.getMode(), token.state).state

			const completions = new Array()
			const start = token.string

			function maybeAdd(data: string | any[]) {
				if (typeof data === 'string') {
					if (data.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push({text: data, details: i18n.t('editor.keyword', [data]), type: 'keyword'})
					}
				} else {
					if (data[0].toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push({text: data[0], name: data[1], details: data[2], type: data[3]})
					}
				}
			}
			// Ajout des variables locales du code
			for (let v = token.state.localVars; v; v = v.next) {
				if (v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push({text: v.name, name: v.name, details: i18n.t('editor.variable', [v.name]), type: 'keyword'})
				}
			}
			// Variables globales
			const vars = []
			vars[this.id] = token.state.globalVars
			const globalVars = this.getGlobalVars(vars)
			for (const i in globalVars) {
				const file = vars[parseInt(i, 10)]
				for (let v = file; v; v = v.next) {
					if (v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						// var information = this.getTokenInformation(v.name)
						// if (!information) {
						// 	var text = "Variable <b>" + v.name + "</b>"
						// 	if (i != this.id) text += "<br><br>" + _.lang.get('editor', 'variable_defined_in_ai', editors[i].name)
						// 	completions.push({text: v.name, name: v.name, details: text, type: 'keyword'})
						// }
					}
				}
			}
			// File functions
			for (const fun of this.functions) {
				if (fun[0].toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push({text: fun[0], name: fun[1], details: fun[2], type: fun[3]})
				}
			}
			// Include functions
			// for (const i in this.includes) {
				// var functions = editors[this.includes[i]].functions
				// for (var f in functions) {
				// 	if (functions[f][0].toLowerCase().indexOf(start.toLowerCase()) === 0) {
				// 		completions.push({text: functions[f][0], name: functions[f][1], details: functions[f][2], type: functions[f][3]})
				// 	}
				// }
			// }
			// Ajout des fonctions
			LeekWars.keywords.forEach(maybeAdd)
			// Raccourcis
			for (const r in AUTO_SHORTCUTS) {
				if (AUTO_SHORTCUTS[r][0].indexOf(start.toLowerCase()) === 0) {
					completions.push({text: AUTO_SHORTCUTS[r][0], name: AUTO_SHORTCUTS[r][0], details: AUTO_SHORTCUTS[r][3], type: 'shortcut', shortcut: r})
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
		clickHint(e: Event, index: number) {
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
		up() {
			this.selectHint(this.selectedCompletion === 0 ? (this.hints.length - 1) : this.selectedCompletion - 1)
		}
		down() {
			this.selectHint((this.selectedCompletion + 1) % this.hints.length)
		}
		top() {
			this.selectHint(0)
		}
		bottom() {
			this.selectHint(this.hints.length - 1)
		}
		selectHint(index: number) {
			this.selectedCompletion = index
			Vue.nextTick(() => {
				const hints = this.$refs.hints as HTMLElement
				const hintList = (this.$refs.hintDialog as HTMLElement).querySelectorAll('.hint') as any
				const posIndex = Math.max(0, Math.round(index - (hints.offsetHeight / hintList[index].offsetHeight) / 2 + 1))
				if (hintList[posIndex]) {
					hints.scrollTo(0, -2 + hintList[posIndex].offsetTop)
				}
			})
		}
		pick() {
			const completion = this.completions[this.selectedCompletion]

			if (completion.type === 'function' || completion.type === 'user-function') {

				let name = completion.name
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
					this.document.setSelection({line: pos.line, ch: this.completionFrom.ch + completion.text.length + 1}, {line: pos.line, ch: this.completionFrom.ch + completion.text.length + 1 + firstArgLength})
				} else {
					this.document.setCursor({line: pos.line, ch: this.completionFrom.ch + name.length})
				}

			} else if (completion.type === 'shortcut') {

				// Dirty : modify the history to avoid having the word selected after an undo.
				// Set head.ch = anchor.ch (no selection)
				const history = this.document.getHistory()
				history.done[history.done.length - 1].ranges[0].head.ch = history.done[history.done.length - 1].ranges[0].anchor.ch
				this.document.setHistory(history)

				const shortcut = AUTO_SHORTCUTS[completion.shortcut]
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
				this.document.replaceRange(completion.text, this.completionFrom, this.completionTo)
			}
			this.close()
		}
		close() {
			this.hintDialog = false
			this.editor.removeKeyMap(this.dialogKeyMap)
		}

		public updateIncludes() {

			this.includes = []

			// this.div.querySelectorAll('.cm-lsfunc').forEach((item: any) => {

				// if (item.innerText === 'include' && item.next().attr('class') === "cm-string") {

				// 	var string = $(this).next().text();
				// 	var ai = string.substring(1, string.length-1);

				// 	$('#ai-list .ai').each(function() {
				// 		if ($(this).text() === ai && ai != editor.name) {
				// 			var id = parseInt($(this).attr('id'))
				// 			editor.includes.push(id)
				// 			if (!editors[id].loaded) editors[id].load()
				// 		}
				// 	})
				// }
			// })
		}

		public updateFunctions() {
			const code = this.editor.getValue()
			this.functions = []
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

				this.functions.push([match[1], fullName, description, 'user-function', args.length, args, this.id, line])
			}
		}

		public getGlobalVars(vars: any) {
			vars = vars || []
			if (!(this.id in vars)) {
				const lines = this.editor.getDoc().lineCount()
				const pos = {line: lines - 1, ch: this.document.getLine(lines - 1).length}
				const token = this.editor.getTokenAt(pos)
				vars[this.id] = token.state.globalVars // variables du code lui-même
			}
			// variables des includes
			this.updateIncludes()

			for (const include of this.includes) {
				if (!(include in vars)) {
					// var vars2 = editors[include].getGlobalVars(vars)
					// for (var v in vars2) {
					// vars[v] = vars2[v]
					// }
				}
			}
			return vars
		}
	}
</script>


<style lang="scss" scoped>
	.ai {
		position: relative;
		height: 100%;
	}
	.codemirror {
		height: 100%;
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
		display: none;
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
</style>
