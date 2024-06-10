<template>
	<div v-show="visible" ref="ai" class="ai" @mousemove="mousemove" @mouseleave="mouseleave">
		<div class="codemirror-wrapper">
			<div ref="codemirror" :style="{'font-size': fontSize + 'px', 'line-height': lineHeight + 'px'}" :class="{search: searchEnabled}" class="codemirror"></div>
			<template v-for="(problems, entrypoint) of ai.problems">
				<tooltip v-for="(error, p) of problems" :key="entrypoint + p">
					<template v-slot:activator="{ on }">
						<div :style="{top: (100 * error.start_line / lines) + '%'}" :class="{warning: error.level === 1, todo: error.level === 2}" class="error-band" v-on="on" @click="$emit('jump', ai, error.start_line)"></div>
					</template>
					<v-icon v-if="error.level === 0" class="tooltip error">mdi-close-circle-outline</v-icon>
					<v-icon v-else-if="error.level === 1" class="tooltip warning">mdi-alert-circle-outline</v-icon>
					<v-icon v-else class="tooltip todo">mdi-format-list-checks</v-icon>
					{{ error.info }}
				</tooltip>
			</template>
		</div>
		<div v-show="searchEnabled" class="search-panel">
			<div class="inputs">
				<input ref="searchInput" v-model="searchQuery" type="text" autocomplete="off" :placeholder="$t('main.search')" @keyup.stop @keyup.enter="$event.shiftKey ? searchPrevious() : searchNext()">
				<input ref="replaceInput" v-model="replaceQuery" type="text" autocomplete="off" :placeholder="$t('main.replace')" @keyup.stop @keyup.enter="replaceOne">
			</div>
			<div class="buttons">
				<div>
					<div v-if="searchLines.length" class="results">{{ searchCurrent + 1 }} / {{ searchLines.length }}</div>
					<div v-else class="results">∅</div>
					<v-icon class="arrow" @click="searchPrevious">mdi-chevron-left</v-icon>
					<v-icon class="arrow" @click="searchNext">mdi-chevron-right</v-icon>
					<v-icon class="arrow" @click="closeSearch">mdi-close</v-icon>
				</div>
				<div>
					<tooltip>
						<template v-slot:activator="{ on }">
							<v-icon class="arrow" v-on="on" @click="replaceOne">mdi-file-replace-outline</v-icon>
						</template>
						{{ $t('main.replace') }}
					</tooltip>
					<tooltip>
						<template v-slot:activator="{ on }">
							<v-icon class="arrow" v-on="on" @click="replaceAll">mdi-file-replace</v-icon>
						</template>
						{{ $t('main.replace_all') }}
					</tooltip>
				</div>
			</div>
		</div>
		<div v-show="hintDialog" ref="hintDialog" :style="{left: hintDialogLeft + 'px', top: hintDialogTop + 'px'}" class="hint-dialog">
			<div v-if="completionType" class="type">
				<lw-type :type="completionType" />
			</div>
			<div ref="hints" class="hints">
				<div v-for="(hint, index) of hints" :key="index" :class="{active: selectedCompletion === index}" class="hint" @click="clickHint($event, index)">
					<v-icon v-if="hint.category === 0" class="method">mdi-alpha-m-circle-outline</v-icon>
					<v-icon v-else-if="hint.category === 1" class="field">mdi-cube-outline</v-icon>
					<v-icon v-else-if="hint.category === 2" class="function">mdi-function</v-icon>
					<v-icon v-else-if="hint.category === 3" class="constant">mdi-pi</v-icon>
					<v-icon v-else-if="hint.category === 4" class="user-function">mdi-function-variant</v-icon>
					<v-icon v-else-if="hint.category === 5" class="shortcut">mdi-flash-outline</v-icon>
					<v-icon v-else-if="hint.category === 6" class="variable">mdi-variable</v-icon>
					<v-icon v-else-if="hint.category === 7" class="argument">mdi-alpha</v-icon>
					<v-icon v-else-if="hint.category === 8" class="global">mdi-google</v-icon>
					<v-icon v-else-if="hint.category === 9" class="class">mdi-copyright</v-icon>
					<!-- <v-icon v-else class="variable">mdi-function</v-icon> -->
					{{ hint.fullName }}
					<div class="spacer"></div>
					<lw-type v-if="hint.lstype" :type="hint.lstype" />
				</div>
			</div>
			<div v-if="selectedHint" class="details">
				<documentation-function v-if="selectedHint.type === 'function'" :fun="selectedHint.function" />
				<documentation-constant v-else-if="selectedHint.type === 'constant'" :constant="selectedHint.constant" />
				<item-preview v-else-if="selectedHint.details.type === 'weapon'" :item="selectedHint.details.weapon" />
				<item-preview v-else-if="selectedHint.details.type === 'chip'" :chip="selectedHint.details.chip" />
				<javadoc v-else-if="selectedHint.javadoc" :javadoc="selectedHint.javadoc" :keyword="selectedHint" class="main" />
				<div v-else v-html="selectedHint.details"></div>
				<div v-if="selectedHint.ai" class="definition">
					<v-icon>mdi-file-outline</v-icon>
					<span @click="$emit('jump', selectedHint.ai, selectedHint.line)">
						<i18n class="defined" path="leekscript.defined_in">
							<b slot="0">{{ selectedHint.ai.name }}</b>
							<b slot="1">{{ selectedHint.line }}</b>
						</i18n>
					</span>
				</div>
			</div>
		</div>
		<div v-show="detailDialog" v-if="detailDialogContent" ref="detailDialog" :style="{left: detailDialogLeft + 'px', bottom: (!detailDialogAtBottom ? detailDialogTop + 'px' : 'auto'), top: (detailDialogAtBottom ? detailDialogTop + 'px' : 'auto'), 'max-height': detailDialogMaxHeight + 'px'}" class="detail-dialog" :class="{active: detailsDialogActive}" @mousemove="detailsDialogEnter" @mouseleave="detailsDialogLeave">
			<template v-if="detailDialogContent.keyword">
				<documentation-function v-if="detailDialogContent.keyword.type === 'function'" :fun="detailDialogContent.keyword.function" class="main" />
				<documentation-constant v-else-if="detailDialogContent.keyword.type === 'constant'" :constant="detailDialogContent.keyword.constant" class="main" />
				<item-preview v-else-if="detailDialogContent.keyword.details.type === 'weapon'" :weapon="detailDialogContent.keyword.details.weapon" class="main" />
				<item-preview v-else-if="detailDialogContent.keyword.details.type === 'chip'" :chip="detailDialogContent.keyword.details.chip" class="main" />
				<javadoc v-if="detailDialogContent.keyword.javadoc" :javadoc="detailDialogContent.keyword.javadoc" :keyword="detailDialogContent.keyword" class="main" />
			</template>

			<div v-if="detailDialogContent.details.alias && !detailDialogContent.details.op" class="alias">
				<lw-code :code="detailDialogContent.details.alias" :single="true" />
				<span v-if="detailDialogContent.details.size">{{ $t('leekscript.size') }} : {{ detailDialogContent.details.size }}</span>
			</div>
			<div v-if="detailDialogContent.details.defined && ais[detailDialogContent.details.defined[0]]" class="definition">
				<v-icon>mdi-file-outline</v-icon>
				<span @click="goToDefinition">
					<i18n class="defined" path="leekscript.defined_in">
						<b slot="0">{{ ais[detailDialogContent.details.defined[0]].name }}</b>
						<b slot="1">{{ detailDialogContent.details.defined[1] }}</b>
					</i18n>
				</span>
			</div>
			<div v-if="detailDialogContent.details.type">
				<div v-if="detailDialogContent.details.op && detailDialogContent.details.type.args">
					<lw-type :type="detailDialogContent.details.type.args[0]" />
					{{ detailDialogContent.details.alias }}
					<lw-type :type="detailDialogContent.details.type.args[1]" />
					=
					<lw-type :type="detailDialogContent.details.type.return" />
				</div>
				<lw-type v-else :type="detailDialogContent.details.type" />
			</div>

			<template v-if="errorTooltip">
				<div v-if="errorLevel === 0" class="error"><v-icon class="error">mdi-close-circle-outline</v-icon> {{ errorTooltipText }}</div>
				<div v-else class="warning"><v-icon class="warning">mdi-alert-circle-outline</v-icon> {{ errorTooltipText }}</div>
			</template>
		</div>
		<loader v-if="loading" />
	</div>
</template>

<script lang="ts">
	import { keywords, keywordsLSOnly } from '@/component/editor/keywords'
	import { AI } from '@/model/ai'
	import { fileSystem } from '@/model/filesystem'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import CodeMirror, { Token } from 'codemirror'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import DocumentationConstant from '../documentation/documentation-constant.vue'
	import DocumentationFunction from '../documentation/documentation-function.vue'
	import ItemPreview from '../market/item-preview.vue'
	import Javadoc from './javadoc.vue'
	import { Problem } from './problem'
	import Type from '@/component/type.vue'
	import { analyzer } from './analyzer'
	import { Keyword } from '@/model/keyword'

	const AUTO_SHORTCUTS = [
		["lama", "#LamaSwag", "", "Le pouvoir du lama"],
		["for", "for (var i = 0; i < ", "; i++) {\n\t\n}", "<h4>Boucle for</h4><br>for (var i = 0; i < ... ; i++) { ... }"],
		["while", "while (", ") {\n\t\n}", "<h4>Boucle while</h4><br>while ( ... ) { ... }"],
		["do", "do {\n\t\n} while (", ");", "<h4>Boucle do while</h4><br>do { ... } while( ... );"],
		["if", 'if (', ') {\n\t\n}', "<h4>Condition if</h4><br>if ( ... ) { ... }"]
	]

	@Component({ name: 'ai-view', components: {
		'item-preview': ItemPreview,
		'documentation-function': DocumentationFunction,
		'documentation-constant': DocumentationConstant,
		'javadoc': Javadoc,
		'lw-type': Type
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
		@Prop() lineNumbers!: boolean
		@Prop() editors!: AIView[]
		@Prop() console!: boolean

		public id!: number
		public editor!: CodeMirror.Editor
		public document!: CodeMirror.Doc
		public lines: number = 0
		public totalLines: number = 0
		public characters: number = 0
		public saving: boolean = false
		public hovering: boolean = false
		public loading: boolean = false
		public error!: boolean
		public needTest = false
		public activeLine: CodeMirror.LineHandle | null = null
		public pos: any
		public completionSelected: any
		public completionFrom: any
		public completionTo: any
		public hoverToken: Token | null = null
		public detailTimer: any
		public serverError: boolean = false
		public selectedCompletion: number = 0
		public completions: Keyword[] = []
		public initialGeneration: number = 0
		public dialogKeyMap: CodeMirror.KeyMap = {
			// Up: this.up,
			// Down: this.down,
			// PageUp: this.up,
			// PageDown: this.down,
			Home: this.top,
			End: this.bottom,
			// Enter: this.pick,
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
		public errorOverlays: {[key: number]: any} = {}
		public errorTooltip: boolean = false
		public errorTooltipText: string = ''
		public errorLevel: number = 0
		public searchEnabled: boolean = false
		public searchCurrent: number = 0
		public searchQuery: string = ''
		public replaceQuery: string = ''
		public searchLines: any = []
		public underlineMarker: CodeMirror.TextMarker | null = null
		public mouseX: number = -1
		public mouseY: number = -1
		private analyzerTimeout: any
		private hoverPosition: number = -1
		private hoverLine: number = -1
		private hoverLineWidth: number = 0
		private hoverEditorOrigin: number = 0
		private hoverData: any = null
		private hoverLocation: any = null
		private ctrl: boolean = false
		private CodeMirrorLines!: HTMLElement
		private jumpToLine: number | null = null
		public loaded: boolean = false
		private completeTimeout: any
		private completing: boolean = false
		private completePromise: Promise<any> | null = null

		created() {
			this.id = this.ai.id
			this.error = !this.ai.valid
		}

		mounted() {
			this.loading = true
			Promise.all([
				import(/* webpackChunkName: "codemirror" */ "@/codemirror-wrapper"), // Load the editor
				fileSystem.load(this.ai), // Load the AI
			]).then(([wrapper]) => {
				this.loaded = true
				const codeMirrorElement = this.$refs.codemirror as any
				this.editor = wrapper.CodeMirror(codeMirrorElement, {
					value: this.ai.code,
					ai: this.ai,
					mode: "leekscript",
					theme: "leekwars",
					tabSize: 4,
					indentUnit: 4,
					indentWithTabs: true,
					highlightSelectionMatches: true,
					matchBrackets: true,
					lineNumbers: this.lineNumbers,
					lineWrapping: true,
					continueComments: true,
					autofocus: true,
					smartIndent: true,
					cursorHeight: 1,
					foldGutter: this.lineNumbers,
					undoDepth: 500,
					gutters: this.lineNumbers ? ["CodeMirror-linenumbers", "CodeMirror-foldgutter"] : [],
					extraKeys: {
						"Shift-Tab": () => this.unindentCode(),
						"Ctrl-D": () => this.duplicateLine(),
						"Ctrl-E": () => this.commentCode(),
						"Shift-Ctrl-/": () => this.commentCode(),
						"Ctrl-K": () => this.removeLine(),
						"Ctrl-Space": () => this.autocomplete(wrapper.CodeMirror, true),
						"Shift-Ctrl-F": () => this.formatCode(),
						"Alt-Left": () => null,
						"Alt-Right": () => null,
						"Alt-Up": () => this.invert(true),
						"Alt-Down": () => this.invert(false),
						"Ctrl-U": () => this.editor.execCommand('toggleFold'),
						"Ctrl-J": () => this.editor.execCommand('foldAll'),
						"Ctrl-I": () => this.editor.execCommand('unfoldAll'),
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

				this.updateProblems()
				this.editor.addOverlay(overlay_javadoc)
				this.editor.addOverlay(overlay_ref)
				this.editor.addOverlay(overlay_todo)

				this.document = this.editor.getDoc()

				this.editor.on('change', (_, changes) => this.change(wrapper.CodeMirror, changes))
				this.editor.on('cursorActivity', (_) => this.cursorChange())
				this.editor.on('keydown', (i: any, e: KeyboardEvent) => {
					if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
						// console.log("keydown Enter", this.hintDialog)
						// On bloquer Enter si dialogue de complétion ou console
						if (this.hintDialog || this.console) {
							e.preventDefault()
						}
					}
				})
				this.editor.on('keyup', (i: any, e: KeyboardEvent) => {
					if (e.key === 'Delete') {
						e.stopPropagation()
					}
					if (e.key === 'Enter') {
						// console.log("keyup Enter", this.hintDialog, this.console)
						if (this.hintDialog) {
							this.pick()
							e.stopPropagation()
						} else if (this.console) {
							this.$emit('enter')
							e.preventDefault()
						}
					}
					if (e.key === 'ArrowDown') {
						if (this.hintDialog) {
							this.down()
							e.stopPropagation()
						} else if (this.console) {
							this.$emit('down')
							e.preventDefault()
						}
					}
					if (e.key === 'ArrowUp') {
						if (this.hintDialog) {
							this.up()
							e.stopPropagation()
						} else if (this.console) {
							this.$emit('up')
							e.preventDefault()
						}
					}
				})
				this.editor.on('scroll', (e) => {
					// console.log('scroll', e.getScrollInfo())
					localStorage.setItem('editor/scroll/' + this.ai.id, e.getScrollInfo().top)
					// Hide autocomplete
					this.close()
				})

				this.loading = false

				this.lines = this.editor.getDoc().lineCount()
				this.characters = this.editor.getDoc().getValue().length
				Vue.set(this.ai, 'included_lines', this.ai.total_lines - this.lines)
				Vue.set(this.ai, 'included_chars', this.ai.total_chars - this.ai.code.length)
				if (this.$route.path.startsWith('/editor/')) {
					LeekWars.setSubTitle(this.$i18n.tc('main.n_lines', this.lines))
				}

				// Jump to specific line
				if (this.jumpToLine) {
					this.scrollToLine(this.jumpToLine!)
					this.jumpToLine = null
				} else {
					// Jump to the last line
					const scrollPosition = parseInt(localStorage.getItem('editor/scroll/' + this.ai.id) || '0')
					this.editor.scrollTo(0, scrollPosition)
				}

				this.CodeMirrorLines = codeMirrorElement.querySelector('.CodeMirror-lines') as HTMLElement

				// Lock scroll down
				const codeMirrorScroll = codeMirrorElement.querySelector('.CodeMirror-scroll') as HTMLElement
				if (codeMirrorScroll) {
					codeMirrorScroll.addEventListener('wheel', (e: WheelEvent) => {
						if (e.deltaY > 0 && Math.abs(codeMirrorScroll.scrollTop - (codeMirrorScroll.scrollHeight - codeMirrorScroll.offsetHeight + 15)) <= 1) {
							e.preventDefault()
						}
						// Clear details hover / popup
						this.detailDialog = false
						this.hoverData = null
						this.removeUnderlineMarker()
						if (this.hoverOverlay) {
							this.editor.removeOverlay(this.hoverOverlay)
							this.hoverOverlay = null
							this.hoverLocation = null
							this.hoverToken = null
						}
					})
				}
				this.editor.on("mousedown", this.editorMousedown as any)
			})

			this.$root.$on('keydown', this.keydown)
			this.$root.$on('keyup', this.keyup)
		}

		beforeDestroy() {
			this.$root.$off('keydown', this.keydown)
			this.$root.$off('keyup', this.keyup)
		}

		public editorMousedown(editor: CodeMirror.Editor, e: MouseEvent) {
			if (e.ctrlKey && this.hoverData && this.hoverData.defined) {
				this.detailDialog = false
				const ai = fileSystem.ais[this.hoverData.defined[0]]
				this.$emit('jump', ai, this.hoverData.defined[1])
				this.removeUnderlineMarker()
				this.mouseleave()
				this.ctrl = false
				e.preventDefault()
			}
		}

		public keydown(e: KeyboardEvent) {
			// console.log("keydown", e.ctrlKey, e.key)
			if (e.ctrlKey) {
				this.ctrl = true
				this.updateMouseAndCtrl()
			}
		}

		public keyup(e: KeyboardEvent) {
			// console.log("keyup", e.ctrlKey, e.key)
			if (e.key === "Control") {
				this.ctrl = false
				this.updateMouseAndCtrl()
			}
		}

		public ctrlUp() {
			this.ctrl = false
			this.updateMouseAndCtrl()
		}

		public cursorChange() {
			// console.log("cursorChange")
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

		public setCode(code: string) {
			this.editor.setValue(code)
			// Set cursor at the end
			this.editor.setCursor(this.editor.posFromIndex(code.length))
		}

		@Watch('ai.problems')
		public updateProblems() {
			// console.log("[ai-view] updateProblems problems=", this.ai.problems)

			// Delete old overlays
			for (const entrypoint in this.errorOverlays) {
				if (!this.ai.problems[entrypoint]) {
					this.editor.removeOverlay(this.errorOverlays[entrypoint])
					Vue.delete(this.errorOverlays, entrypoint)
				}
			}

			for (const entrypoint in this.ai.problems) {
				const problems = this.ai.problems[entrypoint]

				if (this.errorOverlays[entrypoint]) {
					this.editor.removeOverlay(this.errorOverlays[entrypoint])
					Vue.delete(this.errorOverlays, entrypoint)
				}
				const error_by_line = {} as {[key: number]: Problem[]}
				for (const error of problems) {
					if (error.level >= 2) {
						continue
					}
					for (let l = error.start_line; l <= error.end_line; ++l) {
						if (!(l in error_by_line)) {
							error_by_line[l] = []
						}
						error_by_line[l].push(error)
					}
				}
				// Sort errors on each line
				for (const line in error_by_line) {
					if (error_by_line[line].length > 1) {
						error_by_line[line].sort(function(a, b) { return a.start_column - b.start_column })
					}
				}
				const overlay = { token: (stream: any) => {
					const line = stream.lineOracle.line + 1
					const pos = stream.pos
					if (line in error_by_line) {
						for (const error of error_by_line[line]) {
							if (line === error.start_line) {
								if (pos < error.start_column) {
									stream.next()
									return
								} else if (line !== error.end_line || pos <= error.end_column) {
									stream.next()
									return error.level === 0 ? "error" : "warning"
								}
							} else if (line === error.end_line && pos <= error.end_column) {
								stream.next()
								return error.level === 0 ? "error" : "warning"
							} else if (line > error.start_line && line < error.end_line) {
								stream.skipToEnd()
								return error.level === 0 ? "error" : "warning"
							}
						}
						stream.skipToEnd()
					} else {
						stream.skipToEnd()
					}
				}}
				this.errorOverlays[entrypoint] = overlay
				this.editor.addOverlay(overlay, {priority: 12})
				this.error = true
			}
		}

		setAnalyzerTimeout() {
			clearTimeout(this.analyzerTimeout)
			this.analyzerTimeout = setTimeout(() => {

				this.ai.code = this.document.getValue()
				this.ai.analyze()

				// DISABLE AUTO ANALYZE
				// if (true) return;

				analyzer.analyze(this.ai, this.ai.code).then((result) => {
					// console.log("analyze", result)

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
			this.initialGeneration = (this.editor as any).doc.history.generation
		}

		public change(CodeMirror: any, changes: CodeMirror.EditorChange) {
			const userChange = changes.origin === "+input" || changes.origin === "+delete"

			if (changes.origin === "setValue") {
				this.initialGeneration = (this.editor as any).doc.history.generation
			} else {
				const generation = (this.editor.getDoc() as any).history.generation
				this.ai.modified = generation !== this.initialGeneration
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
			this.mouseleave()

			if (changes.origin === "setValue") {
				this.ai.code = this.document.getValue()
				// this.ai.analyze()
			} else {
				this.setAnalyzerTimeout()
			}

			if (userChange && this.autoClosing) {

				const chars = '{([\'"'
				const add = '})]\'"'
				let cursor = this.document.getCursor()
				let nextChar = this.document.getLine(cursor.line)[cursor.ch]

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

				const hex_literals = this.editor.getValue().matchAll(/0(?:x[\dA-Fa-f_\.p]+|o[0-7_]+|b[01_]+)/g)
				let formatted = js_beautify.default.js_beautify(this.editor.getValue(), {indent_size: 1, indent_char: '\t'})

				// js-beautify doesn't recognize hexadecimal floating point, and will split them as:
				// 0x1 .0 p53
				// this code restore the correct litteral after the formatting:
				for (const lit of hex_literals) {
					let fLit = lit[0].replace(/\./, ' .').replace(/p/, ' p')
					formatted = formatted.replace(fLit, lit[0])
				}
				this.editor.setValue(formatted)
			})
		}

		public commentCode() {
			const start = this.document.getCursor('from').line
			const end = this.document.getCursor('to').line

			let fullComments = true
			for (let i = 0; i < end - start + 1; i++) {
				const line = this.document.getLine(start + i).trim()
				if (line.length && !line.trim().startsWith('//')) {
					fullComments = false
					break
				}
			}
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
					if (fullComments) {
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

		public invert(up: boolean) {
			const cursor = this.document.getCursor("start")
			const offset = up ? (-1) : 1
			const line1 = this.document.getLine(cursor.line)
			const line2 = this.document.getLine(cursor.line + offset)
			this.editor.replaceRange(line2, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line1.length})
			this.editor.replaceRange(line1, {line: cursor.line + offset, ch: 0}, {line: cursor.line + offset, ch: line2.length})
			this.document.setCursor(cursor.line + offset, cursor.ch)
		}

		public getTokenInformation(token: string, pos: CodeMirror.Position | null = null, previousToken: CodeMirror.Token) {
			if (token.startsWith('@')) { token = token.substring(1) }
			let wrong_arguments = false
			for (const keyword of keywords) {
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
						} else {
							wrong_arguments = true
						}
					} else {
						return keyword
					}
				}
			}
			if (wrong_arguments) {
				for (const keyword of keywords) {
					if (keyword.name === token) {
						return keyword
					}
				}
			}
			return this.searchSymbolInAI(this.ai, token, previousToken)
		}

		public searchSymbolInAI(startAI: AI, symbol: string, previousToken: CodeMirror.Token): Keyword | null {

			// console.log("searchSymbolInAI", symbol)

			const visited = new Set<number>()

			const aux = (ai: AI): Keyword | null => {
				if (visited.has(ai.id)) { return null }
				visited.add(ai.id)
				// console.log("aux", ai.path)
				if (ai.functions) {
					for (const fun of ai.functions) {
						if (symbol === fun.name) {
							return fun
						}
					}
				}
				for (const g in ai.globals) {
					if (symbol === g) {
						return ai.globals[g]
					}
				}
				for (const s in ai.classes) {
					const clazz = ai.classes[s]
					if (symbol === s) {
						return clazz
					}
					if (previousToken.string === s && clazz.static_methods) {
						for (const method of clazz.static_methods) {
							if (symbol === method.name) {
								return method
							}
						}
					}
					if (previousToken.string === s && clazz.static_fields) {
						for (const field of clazz.static_fields) {
							if (symbol === field.name) {
								return field
							}
						}
					}
				}
				if (ai.includes) {
					for (const include of ai.includes) {
						if (visited.has(include.id)) { continue }
						const found = aux(include)
						if (found) {
							return found
						}
					}
				}
				return null
			}

			const result = aux(startAI)
			if (result) { return result }

			// console.log("entrypoints", startAI.entrypoints)
			for (const entrypoint_id of startAI.entrypoints) {
				const entrypoint = fileSystem.ais[entrypoint_id]
				if (entrypoint) {
					// console.log("entrypoints", entrypoint.path, entrypoint.includes)
					const result = aux(entrypoint)
					if (result) { return result }
				}
			}

			return null
		}

		public mousemove(e: any) {
			this.mouseX = e.pageX
			this.mouseY = e.pageY
			this.updateMouseAndCtrl()
		}

		public stringRealSize(str: string) {
			let s = 0
			for (const c of str) {
				if (c === '\t') { s += 4 }
				else { s++ }
			}
			return s
		}

		public updateMouseAndCtrl() {
			// console.log("updateMouseAndCtrl", {ctrl : this.ctrl })
			if (!this.popups || !this.editor) { return null }
			// if (this.hintDialog) { return null }

			if (!this.ctrl && this.underlineMarker) {
				this.removeUnderlineMarker()
			}

			if (this.detailsDialogActive) { return }

			const pos = {left: this.mouseX - 4, top: this.mouseY}
			const editorPos = this.editor.coordsChar(pos, "window")
			const editorPos2 = {line: editorPos.line, ch: editorPos.ch + 1}
			const token = this.editor.getTokenAt(editorPos2, true)
			// console.log("pos", editorPos, "token", token)
			// console.log(token ? token.type : null, token.string)
			if (token && token.string === ';') {
				this.mouseleave()
				return
			}

			// Underline
			if (token && token.string.trim().length > 0 && this.ctrl && this.hoverData && this.hoverData.defined) {
				if (this.underlineMarker) { this.underlineMarker.clear() }
				this.underlineMarker = this.editor.getDoc().markText({line: editorPos.line, ch: token.start}, {line: editorPos.line, ch: token.end}, {className: 'cm-underlined'})
				this.togglePointerCursor(true)
			} else {
				this.removeUnderlineMarker()
			}

			// The cursor leaves the current token?
			const coords = this.editor.charCoords(editorPos2, "window")
			if (this.hoverToken && token.string !== this.hoverToken.string || this.mouseX > coords.left) { // Hack to detect if we are passed the line
				this.mouseleave()
				return
			}

			// Same token, no need to hover again
			if (this.hoverToken && this.hoverToken.string === token.string && this.hoverToken.start === token.start && this.hoverToken.end === token.end) {
				return
			}

			this.hoverLocation = null
			this.hoverData = null

			const previousToken = this.editor.getTokenAt({line: editorPos.line, ch: token.start - 1})

			clearTimeout(this.detailTimer)
			this.detailTimer = setTimeout(() => {

				if (!token) { return }

				// console.log("getTokenInformation", token, previousToken)
				const keyword = this.getTokenInformation(token.string, editorPos2, previousToken)

				this.hoverToken = token
				this.hovering = true

				// console.log("hover at", editorPos.line + 1, editorPos.ch)
				analyzer.hover(this.ai, editorPos.line + 1, editorPos.ch).then((raw_data) => {

					// console.log("Hover result", JSON.stringify(raw_data))
					// console.log(raw_data.location[0], raw_data.location[1])
					// console.log("Hover result", raw_data)

					this.hovering = false
					this.showHoverDetails(keyword, raw_data)
					this.showErrorDetails(editorPos)
				})
				.catch(() => {
					// console.log("cannot hover", token, editorPos)

					const error = this.showErrorDetails(editorPos)
					if (keyword || error) {
						const index = this.document.indexFromPos({line: editorPos.line, ch: token.start})
						const data = {
							location: [
								[editorPos2.line + 1, token.start, index],
								[editorPos2.line + 1, token.end - 1, index + token.string.length - 1]
							],
						} as any
						if (keyword && keyword.ai) {
							data.defined = [
								keyword.ai ? keyword.ai.path : '',
								keyword.line
							]
						}
						this.showHoverDetails(keyword, data)
					}
				})
			}, this.ctrl ? 0 : 600)
		}

		public showErrorDetails(editorPos: CodeMirror.Position) {
			// console.log("showErrorDetails", this.errors, editorPos)
			// Display error?
			// const tooltip = this.$refs.tooltip
			let shown = false
			for (const entrypoint in this.ai.problems) {
				for (const error of this.ai.problems[entrypoint]) {
					if (error.contains(editorPos)) {
						this.errorTooltipText = error.info
						this.errorTooltip = true
						this.errorLevel = error.level
						shown = true
						return true
					}
				}
			}
			if (!shown) { this.errorTooltip = false }
			return false
		}

		public showHoverDetails(keyword: any, raw_data: any) {

			// console.log("showHoverDetails", keyword, raw_data)

			if (raw_data === null) return

			if (this.hoverLocation &&
				raw_data.location[1] === this.hoverLocation[1] &&
				raw_data.location[2] === this.hoverLocation[2] &&
				raw_data.location[3] === this.hoverLocation[3] &&
				raw_data.location[4] === this.hoverLocation[4]) {
				// console.log("showHoverDetails same location")
				return // Same position
			}

			this.hoverLocation = raw_data.location

			const startPos = { ch: raw_data.location[2], line: raw_data.location[1] - 1 }

			this.hoverData = raw_data
			this.detailDialogContent = { details: raw_data, keyword }
			const offset = (this.$refs.ai as HTMLElement).getBoundingClientRect()
			const p = this.editor.cursorCoords(startPos, "page")
			const left = p.left - offset.left
			this.detailDialogTop = - p.top + offset.bottom - (this.lineHeight - this.fontSize * 1.2) / 2 + 2
			this.detailDialogLeft = left
			this.detailDialogAtBottom = false
			this.detailDialogMaxHeight = 999999
			this.detailDialog = true

			const fixPosition = () => {
				const detailDialog = this.$refs.detailDialog as HTMLElement
				if (!detailDialog) { return }
				const height = detailDialog.scrollHeight
				const top = window.innerHeight - this.detailDialogTop
				this.detailDialogMaxHeight = window.innerHeight - this.detailDialogTop - (window.innerHeight - offset.bottom)
				if (top - height - (window.innerHeight - offset.bottom) < 0 && top + this.fontSize + height <= window.innerHeight) { // Y'a moyen de positionner le dialogue en bas
					this.detailDialogAtBottom = true
					this.detailDialogTop = p.top - offset.top + this.lineHeight - (this.lineHeight - this.fontSize * 1.2) / 2 + 2
					this.detailDialogMaxHeight = window.innerHeight - top
				}
				const width = detailDialog.clientWidth
				if (left + width + offset.left > window.innerWidth - 20) {
					this.detailDialogLeft = window.innerWidth - width - offset.left - 20
				}
			}
			Vue.nextTick(fixPosition)

			const start_line = raw_data.location[1] - 1
			const start_char = raw_data.location[2]
			const end_line = raw_data.location[3] - 1
			const end_char = raw_data.location[4]

			// console.log("[ai-view] hover ", {start_line, start_char, end_line, end_char})

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
					} else if (lineNo > start_line && lineNo < end_line) {
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
			if (this.hoverOverlay) {
				this.editor.removeOverlay(this.hoverOverlay)
			}
			this.hoverData = null
			this.hoverToken = null
			this.hoverOverlay = null
			this.hoverLocation = null
		}

		public autocomplete(CodeMirror: any, force: boolean = false) {
			// console.log("autocomplete", this.autocompleteOption)
			if (!this.autocompleteOption) { return }

			const cursor = this.document.getCursor()
			const position = this.document.indexFromPos(cursor)

			// return
			const cur = this.document.getCursor()
			const token = this.editor.getTokenAt(cur)
			let startPos = token.start

			const previousLength = token.string.length
			token.string = token.string.trim()
			startPos += previousLength - token.string.length

			if (!force && token.string.length === 0) {
				this.close()
				// console.log("close")
				return
			}
			token.state = CodeMirror.innerMode(this.document.getMode(), token.state).state
			const completions: Keyword[] = []
			const previousToken = this.editor.getTokenAt({ ch: token.start, line: cur.line })
			const tokenBeforeDot = token.string === '.' ? this.editor.getTokenAt({ ch: token.start, line: cur.line }) : this.editor.getTokenAt({ ch: token.start - 1, line: cur.line })
			const isDot = token.string === '.' || previousToken.string === '.'
			const start = token.string === '.' ? '' : token.string.toLowerCase()
			// console.log({isDot, start})

			const maybeAdd = (data: string | Keyword) => {
				if (typeof data === 'string') {
					if (data.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push({ name: data, fullName: data, details: i18n.t('leekscript.keyword', [data]) as string, type: 'keyword', category: 3 })
					}
				} else {
					if (data.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push(data)
					}
				}
			}

			let currentClass = null
			for (const clazz of Object.values(this.ai.classes)) {
				if (clazz.line! > cursor.line) break
				currentClass = clazz
			}

			// console.log("autocomplete 2", { token, previousToken, tokenBeforeDot, start, isDot, cursor, currentClass, ai: this.ai })

			if (isDot) {

				// ClassName.<field>
				const visited = new Set<number>()
				this.addDotCompletionsFromAI(tokenBeforeDot, start, completions, visited, this.ai)

				for (const entrypoint_id of this.ai.entrypoints) {
					const entrypoint = fileSystem.ais[entrypoint_id]
					if (entrypoint) {
						this.addDotCompletionsFromAI(tokenBeforeDot, start, completions, visited, entrypoint)
					}
				}
				/*
				if (currentClass) {
					// class.<field>
					if (tokenBeforeDot.string === 'class') {
						for (const static_field of currentClass.static_fields) {
							if (static_field.name.toLowerCase().indexOf(start) === 0) {
								completions.push(static_field)
							}
						}
						for (const staticMethod of currentClass.static_methods) {
							if (staticMethod.name.toLowerCase().indexOf(start) === 0) {
								completions.push(staticMethod)
							}
						}
					}
					// this.<field>
					if (tokenBeforeDot.string === 'this') {
						for (const method of currentClass.methods) {
							if (method.name.toLowerCase().indexOf(start) === 0) {
								completions.push(method)
							}
						}
					}
				}
				*/

			} else {

				// Ajout des variables locales du code
				for (let v = token.state.localVars; v; v = v.next) {
					if (v.name !== "arguments" && v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
						completions.push({name: v.name, fullName: v.name, details: i18n.t('leekscript.variable', [v.name]) as string, type: 'keyword', category: 6})
					}
				}
				if (token.state.context) {
					for (let context = token.state.context.prev; context; context = context.prev) {
						for (let v = context.vars; v; v = v.next) {
							if (v.name !== "arguments" && v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
								completions.push({name: v.name, fullName: v.name, details: i18n.t('leekscript.variable', [v.name]) as string, type: 'keyword', category: 6})
							}
						}
					}
					for (let v = token.state.context.vars; v; v = v.next) {
						if (v.name !== "arguments" && v.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
							completions.push({name: v.name, fullName: v.name, details: i18n.t('leekscript.argument', [v.name]) as string, type: 'keyword', category: 7})
						}
					}
				}

				// Méthodes dans la classe actuelle
				if (currentClass) {
					for (const staticField of currentClass.static_fields) {
						if (staticField.name.toLowerCase().indexOf(start) === 0) {
							completions.push(staticField)
						}
					}
					for (const staticMethod of currentClass.static_methods) {
						if (staticMethod.name.toLowerCase().indexOf(start) === 0) {
							completions.push(staticMethod)
						}
					}
					for (const method of currentClass.methods) {
						if (method.name.toLowerCase().indexOf(start) === 0) {
							completions.push(method)
						}
					}
				}

				// Symbols from current AI
				const visited = new Set<number>()
				this.addCompletionsFromAI(start, completions, visited, this.ai)

				// Symbols from included files (from all entrypoints)
				for (const entrypoint_id of this.ai.entrypoints) {
					const entrypoint = fileSystem.ais[entrypoint_id]
					if (entrypoint) {
						this.addCompletionsFromAI(start, completions, visited, entrypoint)
					}
				}

				// Ajout des fonctions
				if (this.console) {
					keywordsLSOnly.forEach(maybeAdd)
				} else {
					keywords.forEach(maybeAdd)
				}

				// Raccourcis
				for (const r in AUTO_SHORTCUTS) {
					if (AUTO_SHORTCUTS[r][0].indexOf(start.toLowerCase()) === 0) {
						completions.push({ name: AUTO_SHORTCUTS[r][0], fullName: AUTO_SHORTCUTS[r][0], details: AUTO_SHORTCUTS[r][3], type: 'shortcut', shortcut: parseInt(r, 10), category: 5 })
					}
				}
			}

			this.completions = completions
			this.completionFrom = {line: cur.line, ch: startPos}
			this.completionTo = {line: cur.line, ch: token.end}
			if (token.string === '.') {
				this.completionFrom.ch++
			}

			if (completions.length === 0) {
				this.close()
			} else {
				this.hintDialog = true
				this.detailDialog = false
			}

			if (!this.completing) {
				this.completing = true
				analyzer.complete(this.ai, this.document.getValue(), cursor.line + 1, cursor.ch - 1).then(raw_data => {
					// Dialog de complétion fermé entre temps
					if (this.hintDialog === false) return

					this.completing = false
					// console.log("Completions", raw_data)
					if (raw_data) {
						const raw_completions = raw_data.items as any[]
						this.completionType = raw_data.type

						const new_completions = raw_completions
							.filter(item => {
								return item.name.toLowerCase().startsWith(start)
							})
							// .sort((a, b) => {
							// 	return a.name.localeCompare(b.name)
							// })
							.map(data => { return {
								name: data.name,
								fullName: data.name,
								details: '', // i18n.t('leekscript.keyword', [data.name]) as string,
								category: data.category,
								type: '',
								lstype: data.type,
								location: data.location
							}
						})
						this.completions.push(...new_completions)
					}

					this.openCompletions(this.completions, cursor)
				})
			}
		}

		public addCompletionsFromAI(start: string, completions: any[], visited: Set<number>, ai: AI) {
			if (visited.has(ai.id)) { return }
			visited.add(ai.id)
			// console.log("add completions from ai", ai.id)
			// Globales
			for (const variable in ai.globals) {
				if (variable.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push(ai.globals[variable])
				}
			}
			// Fonctions
			for (const fun of ai.functions) {
				if (fun.name.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push(fun)
				}
			}
			// Classes
			for (const variable in ai.classes) {
				if (variable.toLowerCase().indexOf(start.toLowerCase()) === 0) {
					completions.push(ai.classes[variable])
				}
			}
			// Includes of ai
			for (const include of ai.includes) {
				this.addCompletionsFromAI(start, completions, visited, include)
			}
		}

		public addDotCompletionsFromAI(tokenBeforeDot: CodeMirror.Token, start: string, completions: any[], visited: Set<number>, ai: AI) {

			if (visited.has(ai.id)) { return }
			visited.add(ai.id)

			if (tokenBeforeDot.string in ai.classes) {
				const clazz = ai.classes[tokenBeforeDot.string]
				for (const staticMethod of clazz.static_methods) {
					if (staticMethod.name.toLowerCase().indexOf(start) === 0) {
						completions.push(staticMethod)
					}
				}
				for (const static_field of clazz.static_fields) {
					if (static_field.name.toLowerCase().indexOf(start) === 0) {
						completions.push(static_field)
					}
				}
			}
			// Includes of ai
			for (const include of ai.includes) {
				this.addDotCompletionsFromAI(tokenBeforeDot, start, completions, visited, include)
			}
		}

		public openCompletions(completions: any[], cursor: any) {
			// console.log("openCompletions", completions)
			if (completions.length === 0) {
				this.close()
			} else {
				this.hintDialog = true
				this.detailDialog = false

				const pos = this.editor.cursorCoords({line: cursor.line, ch: cursor.ch }, this.console ? "local" : "page")
				const left = pos.left
				const top = pos.bottom
				const editorElement = (this.$refs.ai as HTMLElement)
				const offset = (this.$refs.ai as HTMLElement).getBoundingClientRect()
				// console.log("pos", pos)
				// console.log("ai offset", offset, "scroll", editorElement.parentElement!.parentElement!.scrollTop!)

				if (this.console) {
					this.hintDialogTop = top + editorElement.offsetTop - editorElement.parentElement!.parentElement!.scrollTop!
					this.hintDialogLeft = left + editorElement.offsetLeft
				} else {
					this.hintDialogTop = top - offset.top
					this.hintDialogLeft = left - offset.left
				}

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
			// console.log("pick")

			const completion = this.completions[this.selectedCompletion]
			const cursor = this.document.getCursor()

			const range = this.document.getRange(cursor, {line: cursor.line, ch: cursor.ch + 1})
			const addParameters = range !== '(' && !/\w/i.test(range)

			// console.log("pick", completion)

			if (completion.type === 'user-method' || completion.type === 'user-static-method' || completion.type === 'user-function') {

				const pos = this.document.getCursor()
				let name = completion.fullName
				if (name.includes(':')) {
					name = name.split(':')[0].trim()
				}
				this.document.replaceRange(name, {line: this.completionFrom.line, ch: this.completionFrom.ch}, this.completionTo)
				const argCount = name.includes('()') ? 0 : name.split(',').length
				if (addParameters && argCount > 0) {
					const firstArgLength = (argCount > 1 ? name.indexOf(',') : name.indexOf(')')) - name.indexOf('(') - 1
					this.document.setSelection(
						{line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1},
						{line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1 + firstArgLength}
					)
				}

			} else if (completion.type === 'function') {
				let name = completion.name
				if (addParameters) {
					name += "("
					let a = 0, i = 0
					for (const argument of completion.function!.arguments_names) {
						if (completion.function!.optional[i++]) continue
						if (a++ > 0) name += ", "
						name += argument
					}
					name += ")"
				}
				this.document.replaceRange(name, this.completionFrom, this.completionTo)
				// this.document.replaceRange(name, {line: completion_start[0] - 1, ch: completion_start[1]}, {line: completion_end[0] - 1, ch: completion_end[1]})
				const pos = this.document.getCursor()

				let argCount = name.split(',').length
				if (argCount === 1) {
					if (name.indexOf(')') - name.indexOf('(') === 1) { argCount = 0 }
				}
				if (completion.lstype && completion.lstype.args) {
					argCount = completion.lstype.args.length
				}

				if (addParameters && argCount > 0) {
					const firstArgLength = (argCount > 1 ? name.indexOf(',') : name.indexOf(')')) - name.indexOf('(') - 1
					this.document.setSelection({line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1}, {line: pos.line, ch: this.completionFrom.ch + completion.name.length + 1 + firstArgLength})
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
			if (this.editor) {
				this.editor.removeKeyMap(this.dialogKeyMap)
			}
		}

		public scrollToLine(line: number) {
			// console.log("scrollToLine", line, this.document, this.editor)
			if (this.document) {
				this.document.setCursor({line, ch: 0})
				const height = this.editor.getScrollInfo().clientHeight
				const coords = this.editor.charCoords({line, ch: 0}, "local")
				this.editor.scrollTo(null, (coords.top + coords.bottom - height) / 2)
			} else {
				this.jumpToLine = line
			}
		}

		public search() {
			const selection = this.document.getSelection()
			this.searchEnabled = true
			this.searchQuery = selection
			this.searchUpdate()
			Vue.nextTick(() => {
				if (this.$refs.searchInput) {
					(this.$refs.searchInput as HTMLElement).focus()
				}
			})
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

		public replaceOne() {
			if (this.searchLines.length) {
				const index = this.searchCurrent
				const position = this.searchLines[this.searchCurrent]
				this.document.replaceRange(this.replaceQuery, { line: position[0], ch: position[1] }, { line: position[0], ch: position[1] + this.searchQuery.length })
				this.searchUpdate()
				this.searchCurrent = index
				if (this.searchLines.length) {
					this.searchCurrent = this.searchCurrent % this.searchLines.length
				}
				this.searchRefresh()
			}
		}
		public replaceAll() {
			for (const occurence of this.searchLines) {
				this.document.replaceRange(this.replaceQuery, { line: occurence[0], ch: occurence[1] }, { line: occurence[0], ch: occurence[1] + this.searchQuery.length }, "+input")
			}
			this.searchUpdate()
		}

		public goToDefinition() {
			this.$emit('jump', this.ais[this.detailDialogContent.details.defined[0]], this.detailDialogContent.details.defined[1])
			this.mouseleave()
		}
	}
</script>

<style lang="scss" scoped>
	.ai {
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}
	.codemirror-wrapper {
		flex: 1;
		min-height: 0;
		position: relative;
	}
	.codemirror {
		height: 100%;
	}
	.loader {
		position: absolute;
		top: calc(50% - 35px);
		left: calc(50% - 35px);
	}
	.hint-dialog {
		position: absolute;
		z-index: 100;
		margin: 0;
		display: flex;
		align-items: flex-start;
		> .type {
			position: absolute;
			top: 0;
			left: 0;
			transform: translateX(-100%);
			font-family: monospace;
			font-size: 14px;
			line-height: 20px;
			padding: 2px 5px;
			background: var(--background);
			border: 1px solid var(--border);
			border-right: none;
		}
	}
	.hint-dialog .hints {
		min-width: 400px;
		max-width: 600px;
		font-family: monospace;
		overflow-y: auto;
		overflow-x: hidden;
		vertical-align: top;
		max-height: 260px;
		background: var(--background);
		border: 1px solid var(--border);
	}
	.hint-dialog .hint {
		margin: 0;
		padding: 2px 4px;
		white-space: pre;
		cursor: pointer;
		user-select: none;
		font-size: 14px;
		line-height: 20px;
		display: flex;
		align-items: center;
		.v-icon {
			transition: none;
			font-size: 20px;
			color: var(--text-color);
			&.field {
				color: #074f86;
			}
			&.variable {
				color: #b12f2f;
			}
			&.function {
				color: #b12fa0;
			}
			&.constant {
				color: #cc7b2f;
			}
			&.user-function {
				color: #074f86;
			}
			&.shortcut {
				color: #1a8607;
			}
			&.argument {
				color: #078675;
			}
		}
		&.active {
			background: var(--background-header);
		}
	}
	.hint-dialog .details {
		width: 500px;
		overflow-y: auto;
		background: var(--background);
		border: 1px solid var(--border);
		margin-left: -1px;
		max-height: 600px;
		& > * {
			padding: 5px 8px;
		}
		.definition {
			border-top: 1px solid var(--border);
		}
	}
	.detail-dialog {
		position: absolute;
		max-width: 600px;
		width: fit-content;
		z-index: 100;
		background: var(--background);
		border: 1px solid var(--border);
		overflow-y: auto;
		&.active {
			box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
		}
		> * {
			display: block;
			min-height: 0;
			padding: 5px 8px;
			&:not(:last-child) {
				border-bottom: 1px solid var(--border);
			}
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
		::v-deep .deprecated {
			opacity: 0.6;
		}
		::v-deep .deprecated-message {
			color: #ff7f00;
			font-weight: bold;
			margin: 10px 0;
		}
		> .error, > .warning {
			display: flex;
			align-items: center;
			padding: 5px 8px;
			overflow-y: auto;
			.v-icon {
				margin-right: 4px;
				font-size: 20px;
				background: none;
			}
		}
		.error {
			background: rgba(255, 0, 0, 0.1);
			.v-icon {
				color: red;
			}
		}
		> .warning {
			background: rgba(255, 145, 0, 0.1);
			.v-icon {
				color: #ff9100;
			}
		}
		code.single {
			border: none;
		}
		.alias {
			display: flex;
			align-items: center;
			min-height: 0;
			flex-wrap: wrap;
			span {
				white-space: nowrap;
			}
		}
	}
	.definition {
		cursor: pointer;
		span {
			// color: #5fad1b;
			color: var(--type-color);
			// font-weight: 500;
		}
		span:hover {
			text-decoration: underline;
		}
		.v-icon {
			font-size: 16px;
			vertical-align: top;
			margin-right: 4px;
			color: var(--text-color);
		}
	}
	.search-panel {
		// background: ;
		display: flex;
		.bar {
			display: flex;
			flex: 1;
			margin-right: 10px;
		}
		.inputs {
			flex: 1;
			margin-right: 10px;
		}
		.buttons {
			display: flex;
			flex-direction: column;
		}
	}
	.search-panel .v-icon {
		width: 40px;
		height: 40px;
		padding: 8px;
		color: var(--text-color);
	}
	.search-panel .arrow {
		opacity: 0.5;
		cursor: pointer;
	}
	.search-panel .arrow:hover {
		opacity: 1;
		background: rgba(127,127,127,0.5);
	}
	.search-panel input {
		width: 100%;
		height: 32px;
		margin: 5px 0;
		padding: 0 6px;
		border: none;
		background: var(--pure-white);
		border: 2px solid var(--border);
		&:focus {
			border: 2px solid #0861a5;
		}
	}
	.search-panel .results {
		color: #777;
		width: 120px;
		line-height: 40px;
		white-space: nowrap;
		display: inline-block;
	}
	.error-band {
		width: 10px;
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		background: red;
		height: 10px;
		position: absolute;
		z-index: 6;
		cursor: pointer;
		&.warning {
			background: #ff9100;
		}
		&.todo {
			background: #0099ff;
		}
	}
	.tooltip {
		&.error {
			color: red;
		}
		&.warning {
			color: #ff9100;
		}
		&.todo {
			color: #0099ff;
		}
	}
</style>
