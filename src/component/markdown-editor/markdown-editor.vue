<template>
	<div
		ref="root"
		class="markdown-editor card"
		:class="{focused, dragging, fill}"
		@dragover.capture="onDragOver"
		@dragleave="onDragLeave"
		@drop.capture="onDrop"
		@paste.capture="onPaste"
	>
		<div class="toolbar">
			<div class="modes">
				<div v-ripple class="mode" :class="{active: mode === 'text'}" :title="$t('text_mode_title')" @click="setMode('text')">
					<v-icon>mdi-format-text</v-icon><span class="label">{{ $t('text_mode') }}</span>
				</div>
				<div v-ripple class="mode" :class="{active: mode === 'code'}" :title="$t('code_mode_title')" @click="setMode('code')">
					<v-icon>mdi-code-braces</v-icon><span class="label">{{ $t('code_mode') }}</span>
				</div>
			</div>
			<!-- mousedown.prevent : un clic sur un outil ne retire pas le focus du champ,
			     la sélection sur laquelle il agit reste visible. -->
			<div class="tools" @mousedown.prevent>
				<div v-for="tool in inlineTools" :key="tool.icon" v-ripple class="tool" :title="tool.title" @click="tool.action">
					<v-icon>{{ tool.icon }}</v-icon>
				</div>
				<v-menu location="bottom">
					<template #activator="{ props: menuProps }">
						<div v-ripple class="tool" :title="$t('heading')" v-bind="menuProps"><v-icon>mdi-format-header-pound</v-icon></div>
					</template>
					<v-list :density="'compact'">
						<v-list-item v-for="level in [1, 2, 3]" :key="level" @click="heading(level)">
							<span :class="'heading-' + level">{{ $t('heading_' + level) }}</span>
						</v-list-item>
					</v-list>
				</v-menu>
				<span class="separator"></span>
				<div v-for="tool in blockTools" :key="tool.icon" v-ripple class="tool" :title="tool.title" @click="tool.action">
					<v-icon>{{ tool.icon }}</v-icon>
				</div>
				<span class="separator"></span>
				<div v-if="uploadContext" v-ripple class="tool" :class="{busy: uploading}" :title="$t('main.image_attach')" @click="uploading || imageInput?.click()">
					<v-icon>mdi-image-plus-outline</v-icon>
				</div>
				<!-- Enveloppé : la racine du picker est un <v-menu>, qui passerait une classe
				     posée sur lui à son calque et non au bouton. -->
				<div class="tool emoji" :title="$t('emoji')">
					<emoji-picker @pick="insertEmoji"><v-icon>mdi-emoticon-outline</v-icon></emoji-picker>
				</div>
				<div v-ripple class="tool" :class="{active: help}" :title="$t('help')" @click="help = !help">
					<v-icon>mdi-help-circle-outline</v-icon>
				</div>
			</div>
			<div class="spacer"></div>
			<div v-if="livePreview" v-ripple class="mode preview-toggle" :class="{active: preview}" :title="$t('preview_title')" @click="togglePreview">
				<v-icon>mdi-eye-outline</v-icon><span class="label">{{ $t('preview') }}</span>
			</div>
			<input v-if="uploadContext" ref="imageInput" type="file" accept="image/*" multiple class="image-input" @change="onPickImage">
		</div>
		<div class="body" :class="{split: preview}">
			<div class="pane">
				<!-- Le champ reste affiché le temps que Monaco se charge : on peut écrire sans attendre. -->
				<textarea
					v-show="!editor"
					ref="textarea"
					:value="modelValue ?? ''"
					:placeholder="placeholder"
					:style="fill ? undefined : {minHeight: minHeight + 'px'}"
					class="input"
					autocomplete="off"
					@input="onInput"
					@keydown="onKeydown"
					@scroll="onTextareaScroll"
					@focus="focused = true"
					@blur="focused = false"
				></textarea>
				<div v-if="mode === 'code'" v-show="editor" ref="monacoContainer" class="monaco"></div>
			</div>
			<div v-if="preview" class="pane preview-pane">
				<div ref="previewScroller" class="preview">
					<markdown v-if="previewContent.trim()" :content="previewContent" :mode="previewMode" @rendered="followCaret" />
					<div v-else class="empty">{{ $t('preview_empty') }}</div>
				</div>
			</div>
		</div>
		<div v-if="uploading || loadingMonaco" class="status">
			{{ uploading ? $t('main.user_image_uploading') : $t('loading_code_editor') }}
		</div>
		<formatting-rules v-if="help" class="rules" />
	</div>
</template>

<script setup lang="ts">
	import type * as Monaco from 'monaco-editor'
	import { locale } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { trackEmojiUsage } from '@/model/emoji-usage'
	import { uploadUserImage, userImageErrorMessage } from '@/model/user-image-upload'
	import type { ApiError } from '@/model/api-error'
	import { createMarkdownEditor, loadMonaco, markdownTheme, type MonacoLifecycle, type MonacoModule } from '@/component/editor/monaco-markdown'
	import EmojiPicker from '../chat/emoji-picker.vue'
	import { computed, defineAsyncComponent, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

	defineOptions({ name: 'MarkdownEditor', i18n: {}, mixins: [...mixins] })

	const Markdown = defineAsyncComponent(() => import('@/component/encyclopedia/markdown.vue'))
	const FormattingRules = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/forum/forum-formatting-rules.${locale}.i18n`))

	const props = withDefaults(defineProps<{
		modelValue: string | null
		placeholder?: string
		minHeight?: number
		autofocus?: boolean
		/** Surface d'envoi des images ; sans elle, pas de bouton image. */
		uploadContext?: string
		/** Mode de rendu de l'aperçu, celui du <markdown> qui affichera le texte publié. */
		previewMode?: string
		/** Propose l'aperçu en direct. Inutile quand la page elle-même montre le rendu (encyclopédie). */
		livePreview?: boolean
		/**
		 * Occupe toute la hauteur du parent et défile à l'intérieur, au lieu de grandir
		 * avec le texte : pour une page entière, pas pour un message.
		 */
		fill?: boolean
		defaultMode?: 'text' | 'code'
		/** Préfixe des préférences mémorisées (mode, aperçu) : une surface, un choix. */
		storageKey?: string
		/** Options de Monaco propres à la surface. Par défaut, celles d'un texte en prose. */
		monacoOptions?: Monaco.editor.IStandaloneEditorConstructionOptions
	}>(), {
		placeholder: '',
		minHeight: 170,
		autofocus: false,
		uploadContext: undefined,
		previewMode: 'forum',
		livePreview: true,
		fill: false,
		defaultMode: 'text',
		storageKey: 'markdown-editor',
		// De la prose : pas de suggestions de mots à chaque frappe.
		monacoOptions: () => ({ quickSuggestions: false, wordBasedSuggestions: 'off', suggestOnTriggerCharacters: false }),
	})

	const emit = defineEmits<{
		'update:modelValue': [value: string]
		/** Ctrl+Entrée */
		submit: []
		/** Défilement par le joueur, de 0 (haut) à 1 (bas) : pour synchroniser un rendu voisin. */
		scroll: [ratio: number]
	}>()

	type Mode = 'text' | 'code'
	const MODE_KEY = props.storageKey + '/mode'
	const PREVIEW_KEY = props.storageKey + '/preview'
	const MAX_HEIGHT_RATIO = 0.7

	const t = useNamespacedT('markdown_editor')
	const root = useTemplateRef<HTMLElement>('root')
	const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')
	const monacoContainer = useTemplateRef<HTMLElement>('monacoContainer')
	const imageInput = useTemplateRef<HTMLInputElement>('imageInput')
	const previewScroller = useTemplateRef<HTMLElement>('previewScroller')

	// Le choix du mode et de l'aperçu suit le joueur d'un message à l'autre.
	const storedMode = localStorage.getItem(MODE_KEY)
	const mode = ref<Mode>(storedMode === 'code' || storedMode === 'text' ? storedMode : props.defaultMode)
	const preview = ref(props.livePreview && localStorage.getItem(PREVIEW_KEY) === '1')
	const help = ref(false)
	const focused = ref(false)
	const dragging = ref(false)
	const uploading = ref(false)
	const loadingMonaco = ref(false)
	const previewContent = ref(props.modelValue ?? '')

	const editor = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
	let monaco: MonacoModule | null = null
	let lifecycle: MonacoLifecycle | null = null
	let destroyed = false

	const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
	const shortcut = (label: string, key: string) => t(label) + ' (' + mod + key + ')'

	const inlineTools = computed(() => [
		{ icon: 'mdi-format-bold', title: shortcut('bold', 'B'), action: () => wrap('**', '**') },
		{ icon: 'mdi-format-italic', title: shortcut('italic', 'I'), action: () => wrap('*', '*') },
		{ icon: 'mdi-format-underline', title: shortcut('underline', 'U'), action: () => wrap('<u>', '</u>') },
		{ icon: 'mdi-format-strikethrough', title: t('strike'), action: () => wrap('~~', '~~') },
	])
	const blockTools = computed(() => [
		{ icon: 'mdi-link-variant', title: shortcut('link', 'K'), action: link },
		{ icon: 'mdi-format-quote-close', title: t('quote'), action: () => prefixLines(() => '> ', /^> ?/) },
		{ icon: 'mdi-code-tags', title: t('code'), action: code },
		{ icon: 'mdi-format-list-bulleted', title: t('bullet_list'), action: () => prefixLines(() => '- ', /^[-*+] /, /^\d+\. /) },
		{ icon: 'mdi-format-list-numbered', title: t('numbered_list'), action: () => prefixLines(i => (i + 1) + '. ', /^\d+\. /, /^[-*+] /) },
	])

	/* ------------------------------------------------------------------ */
	/* Surface d'édition : le même jeu d'outils agit sur le champ texte    */
	/* et sur Monaco, à travers des positions en caractères dans le texte. */
	/* ------------------------------------------------------------------ */

	interface Surface {
		value(): string
		selection(): [number, number]
		/** Remplace [start, end[ par `text`, puis sélectionne [selStart, selEnd[. */
		replace(start: number, end: number, text: string, selStart: number, selEnd: number): void
		focus(): void
	}

	const textSurface: Surface = {
		value: () => textarea.value?.value ?? '',
		selection: () => [textarea.value?.selectionStart ?? 0, textarea.value?.selectionEnd ?? 0],
		replace(start, end, text, selStart, selEnd) {
			const el = textarea.value
			if (!el) { return }
			el.focus()
			el.setSelectionRange(start, end)
			// `insertText` fait entrer la modification dans l'historique natif : Ctrl+Z
			// l'annule comme une frappe. Repli sur une affectation s'il est refusé.
			let done = false
			try {
				done = document.execCommand('insertText', false, text)
			} catch { /* execCommand indisponible */ }
			if (!done || el.value.slice(start, start + text.length) !== text) {
				el.value = el.value.slice(0, start) + text + el.value.slice(end)
				emit('update:modelValue', el.value)
			}
			el.setSelectionRange(selStart, selEnd)
			resizeTextarea()
		},
		focus: () => textarea.value?.focus(),
	}

	const monacoSurface: Surface = {
		value: () => editor.value?.getValue() ?? '',
		selection() {
			const model = editor.value?.getModel()
			const selection = editor.value?.getSelection()
			if (!model || !selection) { return [0, 0] }
			return [model.getOffsetAt(selection.getStartPosition()), model.getOffsetAt(selection.getEndPosition())]
		},
		replace(start, end, text, selStart, selEnd) {
			const ed = editor.value
			const model = ed?.getModel()
			if (!ed || !model || !monaco) { return }
			ed.pushUndoStop()
			ed.executeEdits('markdown-editor', [{ range: rangeOf(model, start, end), text, forceMoveMarkers: true }])
			ed.pushUndoStop()
			const selection = rangeOf(model, selStart, selEnd)
			ed.setSelection(selection)
			ed.revealRangeInCenterIfOutsideViewport(selection)
			ed.focus()
		},
		focus: () => editor.value?.focus(),
	}

	function rangeOf(model: Monaco.editor.ITextModel, start: number, end: number) {
		const a = model.getPositionAt(start)
		const b = model.getPositionAt(end)
		return new monaco!.Range(a.lineNumber, a.column, b.lineNumber, b.column)
	}

	function surface(): Surface {
		return editor.value ? monacoSurface : textSurface
	}

	/* ------------------------------------------------------------------ */
	/* Outils                                                              */
	/* ------------------------------------------------------------------ */

	/** Insère au curseur (ou à la place de la sélection) et place le curseur derrière. */
	function insert(text: string) {
		const s = surface()
		const [start, end] = s.selection()
		s.replace(start, end, text, start + text.length, start + text.length)
	}

	/**
	 * `stars` étoiles d'affilée portent-elles la marque `before` ? `**gras**` n'est pas
	 * de l'italique : 1 ou 3 étoiles = italique posé, 2 ou 3 = gras posé.
	 */
	function hasMark(stars: number, before: string) {
		return before === '*' ? stars % 2 === 1 : stars >= 2
	}

	function countStars(value: string, from: number, step: 1 | -1) {
		let n = 0
		while (value[from + n * step] === '*') { n++ }
		return n
	}

	/** Entoure la sélection ; sur un texte déjà entouré, retire les marques. */
	function wrap(before: string, after: string, placeholder = t('text')) {
		const s = surface()
		const value = s.value()
		const [start, end] = s.selection()
		const stars = before[0] === '*'
		// Marques autour de la sélection : `**|gras|**`.
		if (value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after
			&& (!stars || hasMark(countStars(value, start - 1, -1), before))) {
			s.replace(start - before.length, end + after.length, value.slice(start, end), start - before.length, end - before.length)
			return
		}
		// Marques dans la sélection : `|**gras**|`.
		const selected = value.slice(start, end)
		if (selected.length >= before.length + after.length && selected.startsWith(before) && selected.endsWith(after)
			&& (!stars || hasMark(countStars(selected, 0, 1), before))) {
			const inner = selected.slice(before.length, selected.length - after.length)
			s.replace(start, end, inner, start, start + inner.length)
			return
		}
		const inner = selected || placeholder
		s.replace(start, end, before + inner + after, start + before.length, start + before.length + inner.length)
	}

	/** Bornes des lignes touchées par la sélection. */
	function selectedLines(s: Surface) {
		const value = s.value()
		const [start, end] = s.selection()
		const lineStart = value.lastIndexOf('\n', start - 1) + 1
		// Une sélection qui finit juste après un retour à la ligne ne prend pas la ligne suivante.
		const last = end > start && value[end - 1] === '\n' ? end - 1 : end
		const nl = value.indexOf('\n', last)
		const lineEnd = nl === -1 ? value.length : nl
		return { start, end, lineStart, lineEnd, lines: value.slice(lineStart, lineEnd).split('\n') }
	}

	/**
	 * Préfixe les lignes sélectionnées (citation, listes). Si elles l'ont déjà toutes, le
	 * retire. `other` : préfixe concurrent remplacé au passage (liste à puces ↔ numérotée).
	 */
	function prefixLines(prefix: (i: number) => string, pattern: RegExp, other?: RegExp) {
		const s = surface()
		const { start, end, lineStart, lineEnd, lines } = selectedLines(s)
		const filled = lines.filter(l => l.trim())
		const remove = filled.length > 0 && filled.every(l => pattern.test(l))
		let n = 0
		const text = lines.map(l => {
			if (remove) { return l.replace(pattern, '') }
			// Les lignes vides d'une sélection de plusieurs lignes restent des séparateurs.
			if (!l.trim() && lines.length > 1) { return l }
			return prefix(n++) + (other ? l.replace(other, '') : l)
		}).join('\n')
		if (start === end && lines.length === 1) {
			// Curseur seul : il reste à sa place dans le texte de la ligne.
			const caret = Math.max(lineStart, start + text.length - lines[0].length)
			s.replace(lineStart, lineEnd, text, caret, caret)
		} else {
			s.replace(lineStart, lineEnd, text, lineStart, lineStart + text.length)
		}
	}

	function heading(level: number) {
		const s = surface()
		const { lineStart, lineEnd, lines } = selectedLines(s)
		const marks = '#'.repeat(level) + ' '
		// Même niveau déjà posé : on le retire ; autre niveau : on le remplace.
		const same = lines[0].match(/^#{1,6} /)?.[0] === marks
		const text = lines.map(l => (same ? '' : marks) + l.replace(/^#{1,6} /, '')).join('\n')
		s.replace(lineStart, lineEnd, text, lineStart + text.length, lineStart + text.length)
	}

	function link() {
		const s = surface()
		const value = s.value()
		const [start, end] = s.selection()
		const selected = value.slice(start, end)
		if (/^https?:\/\/\S+$/.test(selected)) {
			// Une URL sélectionnée devient la cible : on sélectionne le texte à écrire.
			const label = t('text')
			s.replace(start, end, '[' + label + '](' + selected + ')', start + 1, start + 1 + label.length)
			return
		}
		const label = selected || t('text')
		const url = 'https://'
		const urlStart = start + label.length + 3
		s.replace(start, end, '[' + label + '](' + url + ')', urlStart, urlStart + url.length)
	}

	/** Code en ligne pour une sélection d'une seule ligne, bloc ``` sinon. */
	function code() {
		const s = surface()
		const value = s.value()
		const [start, end] = s.selection()
		const selected = value.slice(start, end)
		if (selected && !selected.includes('\n')) {
			wrap('`', '`')
			return
		}
		const before = (start === 0 || value[start - 1] === '\n' ? '' : '\n') + '```\n'
		const after = '\n```' + (end < value.length && value[end] !== '\n' ? '\n' : '')
		const body = selected || t('code_placeholder')
		s.replace(start, end, before + body + after, start + before.length, start + before.length + body.length)
	}

	const LIST_ITEM = /^(\s*)(?:([-*+] )|(\d+)\. |(> ?))/

	/** Entrée dans une liste ou une citation : la suite reprend le même préfixe. */
	function continueList(): boolean {
		const s = surface()
		const [start, end] = s.selection()
		if (start !== end) { return false }
		const value = s.value()
		const lineStart = value.lastIndexOf('\n', start - 1) + 1
		const nl = value.indexOf('\n', start)
		const lineEnd = nl === -1 ? value.length : nl
		const line = value.slice(lineStart, lineEnd)
		const m = line.match(LIST_ITEM)
		if (!m || start - lineStart < m[0].length) { return false }
		if (!line.slice(m[0].length).trim()) {
			// Élément vide : Entrée termine la liste, comme dans les éditeurs courants.
			s.replace(lineStart, lineEnd, '', lineStart, lineStart)
			return true
		}
		const marker = m[3] ? (parseInt(m[3], 10) + 1) + '. ' : (m[2] ?? '> ')
		const text = '\n' + m[1] + marker
		s.replace(start, start, text, start + text.length, start + text.length)
		return true
	}

	function insertEmoji(emoji: string) {
		trackEmojiUsage(emoji)
		insert(emoji)
	}

	/* ------------------------------------------------------------------ */
	/* Champ texte                                                         */
	/* ------------------------------------------------------------------ */

	/** Le champ grandit avec le texte : pas d'ascenseur interne jusqu'à 70 % de l'écran. */
	function resizeTextarea() {
		const el = textarea.value
		if (!el || editor.value || props.fill) { return }
		// `height: auto` rétrécit le champ un instant, ce qui ferait remonter la page
		// quand il est en bas : on garde la position de défilement.
		const scroller = document.scrollingElement
		const scroll = scroller?.scrollTop ?? 0
		el.style.height = 'auto'
		el.style.height = Math.min(el.scrollHeight + 2, window.innerHeight * MAX_HEIGHT_RATIO) + 'px'
		if (scroller) { scroller.scrollTop = scroll }
	}

	function onInput(e: Event) {
		emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
		resizeTextarea()
	}

	function onTextareaScroll(e: Event) {
		const el = e.target as HTMLTextAreaElement
		if (el.scrollHeight > el.clientHeight) {
			emit('scroll', el.scrollTop / (el.scrollHeight - el.clientHeight))
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.isComposing) { return }
		const ctrl = e.ctrlKey || e.metaKey
		if (e.key === 'Enter' && !ctrl && !e.shiftKey && !e.altKey) {
			if (continueList()) { e.preventDefault() }
			return
		}
		if (!ctrl || e.altKey) { return }
		if (e.key === 'Enter') {
			e.preventDefault()
			emit('submit')
			return
		}
		if (e.shiftKey) { return }
		const action = shortcuts[e.key.toLowerCase()]
		if (action) {
			e.preventDefault()
			action()
		}
	}

	const shortcuts: Record<string, () => void> = {
		b: () => wrap('**', '**'),
		i: () => wrap('*', '*'),
		u: () => wrap('<u>', '</u>'),
		k: link,
	}

	/* ------------------------------------------------------------------ */
	/* Mode code (Monaco)                                                  */
	/* ------------------------------------------------------------------ */

	function setMode(m: Mode) {
		if (mode.value === m) { return }
		mode.value = m
		localStorage.setItem(MODE_KEY, m)
		if (m === 'code') {
			createMonaco(true)
		} else {
			// Le texte est déjà dans modelValue : on reprend la sélection de Monaco.
			const [start, end] = monacoSurface.selection()
			destroyMonaco()
			nextTick(() => {
				resizeTextarea()
				textarea.value?.focus()
				textarea.value?.setSelectionRange(start, end)
			})
		}
	}

	/**
	 * `focus` : seulement quand le joueur vient de choisir le mode, ou sur `autofocus`.
	 * Au chargement d'une page, prendre le focus la ferait défiler jusqu'au champ.
	 */
	function createMonaco(focus: boolean) {
		if (editor.value || loadingMonaco.value) { return }
		loadingMonaco.value = true
		const [selStart, selEnd] = textSurface.selection()
		loadMonaco().then((loaded) => {
			loadingMonaco.value = false
			const container = monacoContainer.value
			if (destroyed || mode.value !== 'code' || !container) { return }
			monaco = loaded.monaco
			lifecycle = loaded.lifecycle
			const ed = markRaw(createMarkdownEditor(monaco, container, props.modelValue ?? '', {
				lineNumbers: 'on',
				lineNumbersMinChars: 3,
				folding: false,
				glyphMargin: false,
				lineDecorationsWidth: 6,
				padding: { top: 8, bottom: 8 },
				// Les menus sortent du cadre (popup, carte du message).
				fixedOverflowWidgets: true,
				// Un champ qui grandit avec le texte n'a pas d'ascenseur à lui : la molette
				// y fait défiler la page.
				...(props.fill ? {} : { scrollbar: { alwaysConsumeMouseWheel: false } }),
				...props.monacoOptions,
			}))
			const model = ed.getModel()!
			// Positions en caractères identiques à celles du champ texte.
			model.setEOL(monaco.editor.EndOfLineSequence.LF)
			editor.value = ed

			ed.onDidChangeModelContent(() => {
				const value = ed.getValue()
				if (value !== props.modelValue) { emit('update:modelValue', value) }
			})
			ed.onDidFocusEditorText(() => { focused.value = true })
			ed.onDidBlurEditorText(() => { focused.value = false })
			ed.onDidContentSizeChange(resizeMonaco)
			ed.onDidChangeCursorPosition(() => followCaret())
			ed.onDidScrollChange((e) => {
				// Monaco signale aussi les changements de hauteur du contenu : seul un
				// déplacement compte.
				const height = ed.getLayoutInfo().height
				if (e.scrollTopChanged && e.scrollHeight > height) {
					emit('scroll', e.scrollTop / (e.scrollHeight - height))
				}
			})
			ed.onKeyDown((e) => {
				if (e.keyCode === monaco!.KeyCode.Enter && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && continueList()) {
					e.preventDefault()
					e.stopPropagation()
				}
			})
			const { KeyMod, KeyCode } = monaco
			const bind = (id: string, keybinding: number, run: () => void) => ed.addAction({ id: 'markdown-editor.' + id, label: id, keybindings: [keybinding], run })
			bind('bold', KeyMod.CtrlCmd | KeyCode.KeyB, shortcuts.b)
			bind('italic', KeyMod.CtrlCmd | KeyCode.KeyI, shortcuts.i)
			bind('underline', KeyMod.CtrlCmd | KeyCode.KeyU, shortcuts.u)
			bind('link', KeyMod.CtrlCmd | KeyCode.KeyK, shortcuts.k)
			bind('submit', KeyMod.CtrlCmd | KeyCode.Enter, () => emit('submit'))

			// Le conteneur est encore masqué (v-show) jusqu'au prochain rendu : un focus
			// posé maintenant se perd sans bruit, et la hauteur se mesurerait à vide.
			nextTick(() => {
				if (editor.value !== ed) { return }
				resizeMonaco()
				ed.setSelection(rangeOf(model, selStart, selEnd))
				if (focus) { ed.focus() }
			})
		}).catch(() => {
			loadingMonaco.value = false
			mode.value = 'text'
		})
	}

	function resizeMonaco() {
		const ed = editor.value
		const container = monacoContainer.value
		if (!ed || !container || props.fill) { return }
		const height = Math.max(props.minHeight, Math.min(ed.getContentHeight(), window.innerHeight * MAX_HEIGHT_RATIO))
		container.style.height = height + 'px'
		ed.layout()
	}

	function destroyMonaco() {
		const ed = editor.value
		if (!ed) { return }
		const model = ed.getModel()
		editor.value = null
		lifecycle?.disposeEditor(ed)
		model?.dispose()
	}

	watch(() => LeekWars.darkMode, () => { if (editor.value && monaco) { monaco.editor.setTheme(markdownTheme()) } })

	/* ------------------------------------------------------------------ */
	/* Aperçu en direct                                                    */
	/* ------------------------------------------------------------------ */

	function togglePreview() {
		preview.value = !preview.value
		localStorage.setItem(PREVIEW_KEY, preview.value ? '1' : '0')
		previewContent.value = props.modelValue ?? ''
		surface().focus()
	}

	// Rendu différé d'un souffle : le <markdown> retraite tout le DOM (code, emojis,
	// LaTeX) à chaque version du texte, inutile de le faire à chaque touche.
	let previewTimer: ReturnType<typeof setTimeout> | null = null
	watch(() => props.modelValue, (value) => {
		// Le texte change aussi de l'extérieur (brouillon rechargé, envoi qui vide le champ).
		if (editor.value && editor.value.getValue() !== (value ?? '')) {
			editor.value.setValue(value ?? '')
		}
		nextTick(resizeTextarea)
		if (!preview.value) { return }
		if (previewTimer) { clearTimeout(previewTimer) }
		previewTimer = setTimeout(() => { previewContent.value = value ?? '' }, 150)
	})

	/** Garde sous les yeux, dans l'aperçu, l'endroit du texte où l'on écrit. */
	function followCaret() {
		const scroller = previewScroller.value
		if (!scroller || scroller.scrollHeight <= scroller.clientHeight) { return }
		const s = surface()
		const length = s.value().length
		if (!length) { return }
		scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * (s.selection()[1] / length)
	}

	/* ------------------------------------------------------------------ */
	/* Images : bouton, collage, glisser-déposer                           */
	/* ------------------------------------------------------------------ */

	function hasFiles(e: DragEvent) {
		return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')
	}

	function imagesOf(files: FileList | null | undefined) {
		return Array.from(files ?? []).filter(f => f.type.startsWith('image/'))
	}

	function onDragOver(e: DragEvent) {
		if (!props.uploadContext || !hasFiles(e)) { return }
		// Sans ça, lâcher un fichier ferait ouvrir l'image par le navigateur, à la place de la page.
		e.preventDefault()
		e.stopPropagation()
		dragging.value = true
	}

	function onDragLeave(e: DragEvent) {
		if (!root.value?.contains(e.relatedTarget as Node | null)) { dragging.value = false }
	}

	function onDrop(e: DragEvent) {
		dragging.value = false
		if (!props.uploadContext || !hasFiles(e)) { return }
		e.preventDefault()
		e.stopPropagation()
		// Dans Monaco, l'image arrive là où on la lâche.
		const position = editor.value?.getTargetAtClientPoint(e.clientX, e.clientY)?.position
		if (position) { editor.value!.setPosition(position) }
		upload(imagesOf(e.dataTransfer?.files))
	}

	function onPaste(e: ClipboardEvent) {
		if (!props.uploadContext) { return }
		const images = imagesOf(e.clipboardData?.files)
		if (!images.length) { return }
		e.preventDefault()
		e.stopPropagation()
		upload(images)
	}

	function onPickImage(e: Event) {
		const input = e.target as HTMLInputElement
		const images = imagesOf(input.files)
		// Remis à zéro dans tous les cas : sans ça, rechoisir LE MÊME fichier n'émet
		// aucun `change` et le bouton semble mort.
		input.value = ''
		upload(images)
	}

	/** Une image après l'autre. */
	async function upload(files: File[]) {
		if (!props.uploadContext || !files.length || uploading.value) { return }
		uploading.value = true
		try {
			for (const file of files) {
				const url = await uploadUserImage(file, props.uploadContext)
				if (destroyed) { return }
				// Écrit en markdown et non en URL nue : c'est déjà la syntaxe qui affiche une
				// image dans un message, et elle reste modifiable — on peut déplacer l'image
				// dans le texte, lui donner une légende, ou la retirer avant d'envoyer.
				insert('![](' + url + ')')
			}
		} catch (error) {
			LeekWars.toast(userImageErrorMessage(error as ApiError))
		} finally {
			uploading.value = false
		}
	}

	/* ------------------------------------------------------------------ */

	onMounted(() => {
		resizeTextarea()
		const el = textarea.value
		if (props.autofocus && el) {
			// Curseur en fin de texte, repris par Monaco s'il prend la place du champ.
			el.selectionStart = el.selectionEnd = el.value.length
		}
		if (mode.value === 'code') {
			createMonaco(props.autofocus)
		} else if (props.autofocus && el) {
			el.focus()
		}
	})

	onBeforeUnmount(() => {
		destroyed = true
		if (previewTimer) { clearTimeout(previewTimer) }
		destroyMonaco()
	})

	/** Amène le texte à la position `ratio` (0 = haut, 1 = bas), pour suivre un rendu voisin. */
	function scrollTo(ratio: number) {
		const ed = editor.value
		if (ed) {
			ed.setScrollTop(Math.ceil((ed.getScrollHeight() - ed.getLayoutInfo().height) * ratio))
			return
		}
		const el = textarea.value
		if (el) { el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio }
	}

	defineExpose({ insert, scrollTo, focus: () => surface().focus() })
</script>

<style lang="scss" scoped>
	.markdown-editor {
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		transition: border-color 0.15s;
		&.focused {
			border-color: var(--primary);
		}
		&.dragging {
			border-color: var(--primary);
			border-style: dashed;
		}
	}
	// Pleine hauteur (page de l'encyclopédie) : le cadre est celui de la page, et le
	// texte défile à l'intérieur au lieu d'allonger le champ.
	.markdown-editor.fill {
		height: 100%;
		border: none;
		border-radius: 0;
		.body {
			flex: 1;
			min-height: 0;
			grid-template-rows: minmax(0, 1fr);
		}
		.pane, .input, .monaco {
			height: 100%;
		}
		.input {
			resize: none;
		}
		.rules {
			max-height: 40%;
			overflow-y: auto;
		}
	}
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 2px 6px;
		padding: 3px 4px;
		border-bottom: 1px solid var(--border);
		background: var(--background-secondary);
	}
	.modes {
		display: flex;
		gap: 2px;
	}
	.mode {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 30px;
		padding: 0 10px;
		font-size: 14px;
		border-radius: var(--radius);
		color: var(--text-color-secondary);
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		.v-icon {
			font-size: 18px;
			color: inherit;
		}
		&:hover {
			color: var(--text-color);
		}
		&.active {
			color: var(--text-color);
			font-weight: 500;
			background: var(--background);
		}
	}
	.spacer {
		flex: 1;
	}
	.tools {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1px;
	}
	.separator {
		width: 1px;
		height: 18px;
		margin: 0 4px;
		background: var(--border);
	}
	.tool {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: var(--radius);
		cursor: pointer;
		user-select: none;
		.v-icon {
			font-size: 20px;
			color: var(--text-color-secondary);
		}
		&:hover, &.active {
			background: var(--background);
			.v-icon { color: var(--text-color); }
		}
		&.busy {
			opacity: 0.4;
			cursor: default;
		}
	}
	// Le picker d'emojis est taillé pour la barre de saisie du chat (40 px) :
	// ramené au gabarit des autres outils.
	.emoji :deep(.chat-input-emoji) {
		width: 30px;
		height: 30px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius);
		// Le slot est posé dans un <div> de texte à 20 px : l'icône s'y assoit sur la
		// ligne de base, 1,5 px plus bas que ses voisines. En flex, plus de ligne de texte.
		> div {
			display: flex;
		}
	}
	.image-input {
		display: none;
	}
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		&.split {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
	.pane {
		min-width: 0;
	}
	.input {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 10px;
		border: none;
		border-radius: 0;
		outline: none;
		resize: vertical;
		font-size: 15px;
		font-family: var(--font-body);
		background: transparent;
		color: var(--text-color);
	}
	.monaco {
		width: 100%;
	}
	// En côte à côte, l'aperçu prend la hauteur de l'éditeur et défile à l'intérieur :
	// sans cette sortie du flux, un long aperçu allongerait la ligne et laisserait un
	// vide sous le champ.
	.preview-pane {
		position: relative;
		border-left: 1px solid var(--border);
	}
	.preview {
		position: absolute;
		inset: 0;
		overflow: auto;
		padding: 10px;
		overflow-wrap: anywhere;
		// Rendu comme le message publié : le <markdown> porte d'office une marge
		// intérieure de page d'encyclopédie, que le forum retire aussi.
		.md {
			padding: 0;
			font-size: 15px;
		}
		.empty {
			color: var(--text-color-secondary);
			font-style: italic;
		}
	}
	.status {
		padding: 4px 10px;
		font-size: 13px;
		color: var(--text-color-secondary);
		border-top: 1px solid var(--border);
	}
	.rules {
		padding: 8px 10px;
		border-top: 1px solid var(--border);
		font-size: 14px;
	}
	.heading-1 { font-size: 20px; font-weight: bold; }
	.heading-2 { font-size: 17px; font-weight: bold; }
	.heading-3 { font-size: 15px; font-weight: bold; }
	// Étroit (mobile) : l'aperçu passe sous le champ, les modes perdent leur libellé, et
	// tous les boutons s'écoulent ensemble — le groupe d'outils ne part plus seul à la
	// ligne, ce qui faisait une barre de quatre lignes.
	@container (max-width: 600px) {
		.toolbar {
			gap: 2px;
		}
		.tools {
			display: contents;
		}
		.separator, .spacer {
			display: none;
		}
		.modes {
			order: -2;
		}
		.preview-toggle {
			order: -1;
			margin-right: 6px;
		}
		.body.split {
			grid-template-columns: minmax(0, 1fr);
		}
		.preview-pane {
			border-left: none;
			border-top: 1px solid var(--border);
		}
		.preview {
			position: static;
			max-height: 50vh;
		}
		.mode .label {
			display: none;
		}
	}
</style>
