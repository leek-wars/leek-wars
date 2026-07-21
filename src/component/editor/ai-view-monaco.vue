<template>
	<div ref="editorEl" class="ai">
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
import { setLocalStorageSafe } from '@/model/storage'
import { LeekWars } from '@/model/leekwars'
import { farmerId } from '@/model/store'
import './monaco'
import { AI } from '@/model/ai'
import { analyzer } from './analyzer'
import { getLanguageForPath } from './file-types'
import { pyOpen, pyChange, pyClose } from './pyright'
import { code, dochash, createSubApp, emitter } from '@/model/vue'
import { useNamespacedT } from '@/model/i18n'
import DocumentationConstant from '../documentation/documentation-constant.vue'
import DocumentationFunction from '../documentation/documentation-function.vue'
import Javadoc from './javadoc.vue'
import { FUNCTIONS } from '@/model/functions'
import { buildConstantPathMap, buildMemberToLs } from './leekwars-dts'
import { markRaw, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import Code from '@/component/app/code.vue'
import { parseConflicts, hasConflictMarkers, buildConflictDecorations, registerConflictCodeLens, type MergeConflict } from './merge-conflicts'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'AiViewMonaco' })

const { t } = useI18n()
const editorT = useNamespacedT('editor')

// Résolution du symbole survolé vers une fiche de doc (constante / fonction). En LeekScript le texte
// de survol est le nom nu (ex "WEAPON_BAZOOKA") ; en polyglot (JS/TS) c'est un quick-info TS (ex
// "const Weapon.bazooka: Weapon") qu'on ramène au nom plat via la map notation-objet -> constante.
let _constPathMap: Map<string, string> | null = null
function constPathMap(): Map<string, string> {
	if (!_constPathMap || _constPathMap.size === 0) _constPathMap = buildConstantPathMap(LeekWars.constants ?? [])
	return _constPathMap
}
// Membre de l'API objet -> nom de fonction LS (ex "Me.weaponCells" -> "getCellsToUseWeapon",
// "Weapon.cost" -> "getWeaponCost"). Statique -> calculé une fois.
let _memberToLs: Record<string, string> | null = null
function memberToLsMap(): Record<string, string> {
	if (!_memberToLs) _memberToLs = buildMemberToLs()
	return _memberToLs
}
function extractHoverSymbol(text: string): string | null {
	const t2 = text.trim()
	const kw = t2.match(/^(?:\(\w+\)\s*)?(?:const|let|var|function|readonly|namespace)\s+([\w.$]+)/)
	if (kw) return kw[1]
	const bare = t2.match(/^(?:\(\w+\)\s*)?([\w.$]+)/)
	return bare ? bare[1] : null
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveHoverDoc(text: string): { fun?: any, constant?: any } {
	let fun = FUNCTIONS.find((f) => f.name === text)
	let constant = LeekWars.constants.find((c) => c.name === text)
	if (fun || constant) return { fun, constant }
	const sym = extractHoverSymbol(text)
	if (!sym) return {}
	// Constante (Weapon.bazooka -> WEAPON_BAZOOKA, Effect.DAMAGE, MAX_TURNS...) : priorité à la fiche constante.
	const constName = sym.includes('.') ? constPathMap().get(sym) : sym
	if (constName) constant = LeekWars.constants.find((c) => c.name === constName)
	if (constant) return { constant }
	// Fonction : membre objet mappé vers sa fonction LS (Me.weaponCells -> getCellsToUseWeapon),
	// sinon dernier segment tel quel (Fight.getAliveEnemies -> getAliveEnemies, ou fonction plate).
	const funName = memberToLsMap()[sym] ?? (sym.includes('.') ? sym.split('.').pop()! : sym)
	fun = FUNCTIONS.find((f) => f.name === funName)
	return { fun }
}

const scrollKey = (path: string) => 'editor/scroll/' + farmerId() + '/' + path
const viewStateKey = (path: string) => 'editor/viewstate/' + farmerId() + '/' + path

const props = defineProps<{
	ai: AI
	theme: string
	fontSize?: number
	lineHeight?: number
	t?: (key: string, values?: unknown[]) => string
	console?: boolean
	lineNumbers?: boolean
}>()

const emit = defineEmits<{
	focus: []
	enter: []
	up: []
	down: []
}>()

const editorEl = useTemplateRef<HTMLElement>('editorEl')

let editor: monaco.editor.IStandaloneCodeEditor
let jumpToLine: number | null = 0
let jumpToColumn: number | null = 0
let scrollListener: monaco.IDisposable
let analyzerTimeout: ReturnType<typeof setTimeout> | null = null
// Numéro de la dernière analyse lancée par cet éditeur (l'indicateur ne suit qu'elle)
let analyzeSeq = 0
let viewStateSaveTimeout: ReturnType<typeof setTimeout> | null = null
let currentAiPath: string | null = null
const analyzing = ref(false)
const saving = ref(false)
const serverError = ref(false)
const goods = ref<{ ai: AI }[]>([])
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
			getBoolean(key: string) {
				if (key === "expandSuggestionDocs") return true
				return false
			},
			remove() {},
			store() {},
			onWillSaveState() {},
			onDidChangeStorage() {}
		}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any))
	scrollListener = editor.onDidScrollChange((e) => {
		if (!props.ai) return
		setLocalStorageSafe(scrollKey(props.ai.path), '' + e.scrollTop)
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
	const isKey = (e: monaco.IKeyboardEvent, key: string) => e.code === key || e.browserEvent?.key === key
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
		// eslint-disable-next-line vue/no-mutating-props
		props.ai.modified = currentVersionId !== props.ai.model.getAlternativeVersionId()
		setAnalyzerTimeout()
		updateConflictDecorations()
	})

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const suggestionWidget = (editor.getContribution('editor.contrib.suggestController') as any).widget
	suggestionWidget.value.onDidShow(() => {
		const widget = suggestionWidget.value._details.widget
		widget.onDidChangeContents(() => {
			const body = widget._body as HTMLElement
			const docs = widget._docs
			docs.style.display = 'none'
			body.querySelectorAll('.lw').forEach((e: Element) => { e.remove() })
			const element = document.createElement('div')
			element.classList.add('lw')
			body.appendChild(element)
			const fun = FUNCTIONS.find((f) => f.name === docs.innerText)
			if (fun) {
				const doc = createSubApp(DocumentationFunction, { fun }, 'suggest-function')
					.directive('code', code)
					.directive('dochash', dochash)
					.mount(element)
				setTimeout(() => {
					suggestionWidget.value._details._placeAtAnchor(suggestionWidget.value._details._anchorBox, { width: 500, height: doc.$el.clientHeight + 10 }, true)
				})
			}
			const constant = LeekWars.constants.find((c) => c.name === docs.innerText)
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const hoverController = (editor.getContribution('editor.contrib.contentHover') as any)
	hoverController._getOrCreateContentWidget()
	hoverController._contentWidget.onContentsChanged(() => {
		const widget = hoverController._contentWidget.widget._resizableNode
		const body = widget.domNode.querySelector('.hover-row-contents')
		if (!body) return
		body.querySelectorAll('.lw').forEach((e: Element) => { e.remove() })
		const firstRow = body.querySelector('.markdown-hover') as HTMLElement | null
		if (!firstRow) return

		const element = document.createElement('div')
		element.classList.add('lw')
		body.prepend(element)

		const { fun, constant } = resolveHoverDoc(firstRow.innerText.trim())
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

	registerPaletteActions()

	update()
	emitter.on('file-reloaded', onFileReloaded)
})

// Palette de commandes (Ctrl+Shift+P / F1) : expose les actions Leek Wars comme commandes
// nommées et traduites, listées par le widget natif Monaco editor.action.quickCommand (#4317).
function registerPaletteActions() {
	const add = (id: string, key: string, run: () => void) => {
		editor.addAction({
			id,
			label: 'Leek Wars: ' + editorT(key),
			run: () => run(),
		})
	}
	add('leekwars.testFight', 'palette_test', () => emitter.emit('palette-test'))
	add('leekwars.save', 'palette_save', () => emitter.emit('ctrlS'))
	add('leekwars.format', 'palette_format', () => { editor.getAction('editor.action.formatDocument')?.run() })
	add('leekwars.documentation', 'palette_documentation', () => { editor.getAction('editor.action.showHover')?.run() })
	add('leekwars.toggleTheme', 'palette_toggle_theme', () => emitter.emit('palette-toggle-theme'))
}

onBeforeUnmount(() => {
	emitter.off('file-reloaded', onFileReloaded)
	if (analyzerTimeout) clearTimeout(analyzerTimeout)
	if (viewStateSaveTimeout) clearTimeout(viewStateSaveTimeout)
	saveViewState()
	if (currentAiPath !== null && getLanguageForPath(currentAiPath) === 'python') pyClose(monaco.Uri.file(currentAiPath).toString())
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
		// On quitte l'onglet précédent : ferme son document Pyright (efface ses marqueurs).
		if (getLanguageForPath(currentAiPath) === 'python') pyClose(monaco.Uri.file(currentAiPath).toString())
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
		// eslint-disable-next-line vue/no-mutating-props
		props.ai.modified = false
		updateConflictDecorations()
	}
}

function syncModel() {
	const uri = monaco.Uri.file(props.ai.path)
	const existing = monaco.editor.getModel(uri)
	const model = existing || markRaw(monaco.editor.createModel(props.ai.code, getLanguageForPath(props.ai.path), uri))
	// Garde-fou #4318 : un modèle déjà présent pour ce path peut être un orphelin laissé par
	// un fichier précédent (rename/déplacement/suppression réutilisant le path). Si l'IA n'a pas
	// d'édition locale en cours et que son contenu diffère du vrai code, on réaligne le modèle
	// plutôt que d'afficher (et risquer de sauvegarder) le contenu de l'ancien fichier.
	// On ne touche QUE les modèles détachés : un modèle attaché est la vue live d'un autre
	// éditeur (split), un setValue y déclencherait un faux "modifié" et écraserait son contenu.
	if (existing && !existing.isAttachedToEditor() && !props.ai.modified && props.ai.code !== undefined && existing.getValue() !== props.ai.code) {
		existing.setValue(props.ai.code)
	}
	// eslint-disable-next-line vue/no-mutating-props
	props.ai.model = model

	if (!editor) return
	editor.setModel(model)
	currentVersionId = model.getAlternativeVersionId()

	// Validation Python (Pyright, worker client) : ouvre le document. Démarre le worker au 1er .py.
	if (model.getLanguageId() === 'python') pyOpen(model)

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
	if (analyzerTimeout) clearTimeout(analyzerTimeout)
	analyzerTimeout = setTimeout(() => {
		const ai = props.ai
		analyzing.value = true
		ai.code = editor.getValue()
		ai.analyze()

		// Pyright : notifie le changement de contenu (worker client) pour les IA .py.
		const model = editor.getModel()
		if (model && model.getLanguageId() === 'python') pyChange(model)

		analyzer.updateTodos(ai)

		// Une analyse dépassée par une plus récente se résout sans résultat : elle ne doit pas
		// éteindre l'indicateur, l'analyse en cours n'a pas encore répondu.
		const seq = ++analyzeSeq
		analyzer.analyze(ai, ai.code).then((result) => {
			if (seq === analyzeSeq) analyzing.value = false
			if (!result) return
			analyzer.applyAnalyzeResult(result as Parameters<typeof analyzer.applyAnalyzeResult>[0])
			analyzer.updateTodos(ai)
			analyzer.updateCount()
		}).catch(() => {
			if (seq === analyzeSeq) analyzing.value = false
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
		// eslint-disable-next-line vue/no-mutating-props
		if (props.ai) props.ai.hasConflict = false
		return
	}

	conflicts = parseConflicts(content)
	// eslint-disable-next-line vue/no-mutating-props
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
	// eslint-disable-next-line vue/no-mutating-props
	props.ai.modified = false
	currentVersionId = props.ai.model.getAlternativeVersionId()
}

function saveViewState(aiPath?: string) {
	if (!editor) return
	const path = aiPath ?? currentAiPath
	if (!path) return
	const viewState = editor.saveViewState()
	if (viewState) {
		setLocalStorageSafe(viewStateKey(path), JSON.stringify(viewState))
	}
}

function restoreViewState() {
	const viewStateStr = localStorage.getItem(viewStateKey(props.ai.path))
	if (viewStateStr) {
		try {
			const viewState = JSON.parse(viewStateStr)
			editor.restoreViewState(viewState)
			return
		} catch { /* empty */ }
	}
	const scrollPosition = parseInt(localStorage.getItem(scrollKey(props.ai.path)) || '0')
	editor.setScrollTop(scrollPosition)
}

function debouncedSaveViewState() {
	if (viewStateSaveTimeout) clearTimeout(viewStateSaveTimeout)
	viewStateSaveTimeout = setTimeout(() => {
		saveViewState()
	}, 1000)
}

defineExpose({
	scrollToLine,
	save,
	setAnalyzerTimeout,
	get editor() { return editor },
	get ai() { return props.ai },
	get analyzing() { return analyzing.value },
	get saving() { return saving.value }, set saving(v: boolean) { saving.value = v },
	get serverError() { return serverError.value }, set serverError(v: boolean) { serverError.value = v },
	get goods() { return goods.value }, set goods(v: { ai: AI }[]) { goods.value = v },
	get position() { return position.value },
	get selected() { return selected.value },
})
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