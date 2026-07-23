<template lang="html">
	<div class="console" :class="'theme-' + cssTheme">
		<div ref="scroll" v-autostopscroll class="scroll" >
			<div class="lines">
				<div v-for="(line, l) in lines" :key="l" class="line">
					<template v-if="line.type === 'code'">
						<!-- <span class="arrow">›</span> -->
						<v-icon class="arrow">mdi-chevron-right</v-icon>
						<lw-code :code="line.code ?? ''" single :theme="codeThemeClass" :language="language" />
					</template>
					<template v-else-if="line.type === 'result'">
						<div class="line result">
							<lw-code :code="String(line.result ?? '')" single :theme="codeThemeClass" :language="language" />
							<span class="ops">{{ line.ops }} ops</span>
						</div>
					</template>
					<template v-else-if="line.type === 'log' && line.log">
						<div :class="LeekWars.logClass(line.log)" :style="{color: LeekWars.logColor(line.log)}">{{ LeekWars.logText(line.log) }}</div>
					</template>
					<template v-else-if="line.type === 'error'">
						<div class="error">
							<div v-if="line.location" class="zigzag">{{ line.zigzags }}</div>
							<div v-if="line.message">{{ line.message }}</div>
							<div v-else>{{ $t('leekscript.error_' + line.error, line.params ?? [], { escapeParameter: false }) }}</div>
						</div>
						<span v-if="line.ops" class="ops">{{ line.ops }} ops</span>
					</template>
					<template v-else>
						<div class="result error">error</div>
					</template>
				</div>
			</div>
			<div class="input" @click="focus()">
				<v-icon class="arrow">mdi-chevron-right</v-icon>
				<ai-view-monaco ref="editor" class="editor" :ai="ai" :ais="{}" :visible="true" :line-numbers="false" :font-size="17" :line-height="20" :autocomplete-option="true" :popups="true" :console="true" :theme="theme" @enter="enter" @down="down" @up="up" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { locale } from '@/locale'
import { AI } from '@/model/ai'
import { FileSystem, fileSystem } from '@/model/filesystem'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import { emitter } from '@/model/vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import AIViewMonaco from '../editor/ai-view-monaco.vue'
import { getLanguageVersions } from '../editor/file-types'
import LwCode from './code.vue'

defineOptions({ name: 'Console', components: { 'ai-view-monaco': AIViewMonaco, 'lw-code': LwCode } })

interface EditorRef {
	editor: {
		getModel(): unknown
		getValue(): string
		setValue(v: string): void
		focus(): void
	}
}

interface ConsoleLine {
	type: string
	code?: string
	result?: unknown
	ops?: number
	log?: unknown[]
	error?: string
	message?: string
	params?: (string | number)[]
	location?: number[]
	zigzags?: string
}

// Extension de path par langage : pilote la coloration/autocomplétion Monaco (getLanguageForPath)
// et le langage envoyé au serveur. LeekScript garde la convention historique `.leek`.
const LANGUAGE_EXT: { [lang: string]: string } = {
	leekscript: '.leek',
	javascript: '.js',
	typescript: '.ts',
	python: '.py',
}
// Jeton de langage attendu par le serveur (PolyglotConsole) : js / ts / python, ou leekscript.
const SERVER_LANGUAGE: { [lang: string]: string } = {
	leekscript: 'leekscript',
	javascript: 'js',
	typescript: 'ts',
	python: 'python',
}

const editorRef = useTemplateRef<EditorRef>('editor')
const scrollRef = useTemplateRef<HTMLElement>('scroll')

const lines = ref<ConsoleLine[]>([])
const history = ref<string[]>([])
const historyPos = ref(0)
const language = ref<string>(localStorage.getItem('console/language') || 'leekscript')
// Un identifiant stable par session : chaque langage a son propre path (donc son modèle Monaco),
// réutilisé au fil des bascules de langage plutôt que d'accumuler des modèles orphelins.
const consoleId = Math.random()
function consolePath(lang: string) {
	return FileSystem.CONSOLE_MAGIC_KEY + consoleId + (LANGUAGE_EXT[lang] ?? '.leek')
}
const ai = ref<AI>(new AI({ id: 0, code: '', path: consolePath(language.value) }))
// Version sélectionnée pour le langage polyglot courant (pragma). Une seule version par langage
// aujourd'hui (le runtime l'impose) : purement indicatif, mais mémorisé par langage pour le jour où
// plusieurs versions coexisteront. Vide pour LeekScript (qui a son propre sélecteur version/strict).
function defaultVersion(lang: string) {
	return getLanguageVersions(lang)[0]?.pragma ?? ''
}
const languageVersion = ref<string>(localStorage.getItem('console/version/' + language.value) || defaultVersion(language.value))
const theme = ref<string>(localStorage.getItem('editor/theme') || (LeekWars.darkMode ? 'monokai' : 'leek-wars'))
const leekscript = reactive({
	version: 4,
	strict: false,
})

;(async () => {
	LeekWars.loadEncyclopedia(locale)

	const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
	i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })
	leekscript.version = parseInt(localStorage.getItem('console/version') || '4')
	leekscript.strict = localStorage.getItem('console/strict') === 'true'
	fileSystem.consoleAI = ai.value

	clear()
})()

function isEmpty() {
	return lines.value.length === 0
}

function setEditorValue(v: string) {
	if (editorRef.value?.editor?.getModel()) {
		editorRef.value.editor.setValue(v)
	}
}

function clear() {
	lines.value = []
	history.value = []
	historyPos.value = 0
	setEditorValue('')
	LeekWars.socket.send([SocketMessage.CONSOLE_NEW, leekscript.version, leekscript.strict, SERVER_LANGUAGE[language.value] ?? 'leekscript'])
}

function up() {
	if (history.value.length === 0) return
	historyPos.value--
	if (historyPos.value < 0) historyPos.value = 0
	setEditorValue(history.value[historyPos.value])
}

function down() {
	historyPos.value++
	if (historyPos.value >= history.value.length) {
		historyPos.value = history.value.length
		setEditorValue('')
	} else {
		setEditorValue(history.value[historyPos.value])
	}
}

onMounted(() => {
	emitter.on('console', (raw: unknown) => {
		const data = raw as Omit<ConsoleLine, 'type'>
		console.log("on console", data)
		lines.value.push({ type: 'result', ...data })
		scrollDown()
	})
	emitter.on('console-error', (raw: unknown) => {
		const data = raw as Omit<ConsoleLine, 'type'>
		console.log("on console-error", data)
		let zigzags = ""
		if (data.location) {
			for (let i = 0; i < data.location[2]; ++i) zigzags += ' '
			for (let i = 0; i <= data.location[4] - data.location[2]; ++i) zigzags += '~'
		}
		lines.value.push({ type: 'error', ...data, zigzags })
		scrollDown()
	})
	emitter.on('console-log', (data: unknown) => {
		console.log("on console-log", data)
		lines.value.push({ type: 'log', log: data as unknown[] })
		scrollDown()
	})
	emitter.on("wsconnected", () => {
		clear()
	})
})

onBeforeUnmount(() => {
	emitter.off('console')
	emitter.off('console-error')
	emitter.off('console-log')
	LeekWars.socket.send([SocketMessage.CONSOLE_CLOSE])
})

function enter() {
	if (!editorRef.value?.editor?.getModel()) return
	const code = editorRef.value.editor.getValue()
	history.value.push(code)
	historyPos.value = history.value.length
	lines.value.push({ type: 'code', code })
	LeekWars.socket.send([SocketMessage.CONSOLE_EXECUTE, code])
	scrollDown()
	setEditorValue('')
}

function scrollDown() {
	setTimeout(() => {
		if (scrollRef.value) {
			scrollRef.value.scrollTop = scrollRef.value.scrollHeight
		}
	}, 50)
}

function focus() {
	editorRef.value?.editor.focus()
}

const cssTheme = computed(() => ['monokai', 'vs-dark', 'hc-black'].includes(theme.value) ? 'monokai' : 'leekwars')
// Les aperçus des lignes passées suivent le thème PROPRE de la console (pas celui du site,
// qui peut être clair alors que la console est sombre, et inversement).
const codeThemeClass = computed(() => 'code-theme-' + theme.value)

function saveTheme() {
	localStorage.setItem('editor/theme', theme.value)
}

watch(() => leekscript.version, () => {
	localStorage.setItem('console/version', '' + leekscript.version)
	clear()
})

watch(() => leekscript.strict, () => {
	localStorage.setItem('console/strict', '' + leekscript.strict)
	clear()
})

// Bascule de langage : nouveau path (donc bascule de la coloration/autocomplétion Monaco via le
// watcher de props.ai.path dans l'éditeur), puis on repart sur une session REPL neuve.
watch(language, (lang) => {
	localStorage.setItem('console/language', lang)
	languageVersion.value = localStorage.getItem('console/version/' + lang) || defaultVersion(lang)
	ai.value = new AI({ id: 0, code: '', path: consolePath(lang) })
	fileSystem.consoleAI = ai.value
	clear()
})

watch(languageVersion, (v) => {
	if (v) localStorage.setItem('console/version/' + language.value, v)
})

defineExpose({ isEmpty, clear, focus, saveTheme, theme, leekscript, language, languageVersion })
</script>

<style lang="scss" scoped>
	.console {
		background: var(--background);
		color: var(--text-color);
		font-size: 17px;
		height: 100vh;
		&.window {
			height: 400px;
		}
		position: relative;

		--pure-white: #fff;
		--background: #f2f2f2;
		--background-secondary: #eee;
		--background-disabled: #bbb;
		--background-header: #e5e5e5;
		--border: #ddd;
		--text-color: #111;
		--text-color-secondary: #777;
		--type-color: #0000D0;
	}
	.theme-monokai {
		--pure-white: #000;
		--background: #1f1f1f;
		--background-secondary: #171717;
		--background-disabled: #555;
		--background-header: #2f2f2f;
		--border: #444;
		--text-color: #f7f7f7;
		--text-color-secondary: #aaa;
		--type-color: #0099d0;
	}
	.scroll {
		// position: relative;
		display: flex;
		flex-direction: column;
		padding: 10px;
		overflow-y: auto;
		height: 100%;
	}
	.console.fullscreen {
		width: calc(100% - 10px);
		height: calc(100% - 10px);
	}
	.line {
		padding: 2px 0;
		word-wrap: break-word;
		display: flex;
		align-items: center;
		gap: 5px;
		font-family: monospace;
		span, .error {
			white-space: pre-wrap;
		}
		.error {
			color: red;
		}
		.zigzag {
			padding-left: 27px;
			margin-top: -10px;
		}
	}
	.line.result {
		font-weight: bold;
		font-size: 16px;
		margin-bottom: 2px;
		.ops {
			font-size: 13px;
			font-weight: normal;
			color: #888;
			margin-left: 10px;
		}
	}
	.input {
		flex: 1;
		display: flex;
		gap: 5px;
		align-items: flex-start;
		padding: 2px 0;
		.arrow {
			opacity: 1;
		}
		input {
			border: none;
			background: transparent;
			// color: white;
			font-family: monospace;
			margin: 0;
			padding: 0;
			font-size: 16px;
			min-height: 0;
			width: calc(100% - 18px);
		}
	}
	.arrow {
		font-size: 22px;
		color: var(--text-color);
		opacity: 0.4;
	}

.editor {
	width: 100%;
	height: 20px;
	// height: 280px;
	background: transparent !important;
	position: initial;
	&:deep(.monaco-editor),
	&:deep(.monaco-editor .overflow-guard),
	&:deep(.monaco-editor .monaco-scrollable-element),
	&:deep(.monaco-editor .inputarea.ime-input),
	&:deep(.monaco-editor .margin),
	&:deep(.monaco-editor .lines-content) {
		background: transparent !important;
	}
	&:deep(.monaco-editor),
	&:deep(.monaco-editor .overflow-guard),
	&:deep(.monaco-editor .monaco-editor-background),
	&:deep(.monaco-editor .view-overlays),
	&:deep(.monaco-editor .current-line),
	&:deep(.monaco-editor .view-line) {
		border: none !important;
		outline: none !important;
		box-shadow: none !important;
	}
	&:deep(.CodeMirror) {
		.CodeMirror-lines {
			padding: 0;
		}
		height: 100%;
		background: transparent !important;
		.CodeMirror-lines .activeline {
			background: transparent !important;
		}
	}
}
.console:deep(code) {
	border: none;
	padding: 0;
	// Les thèmes sombres posent leur propre fond sur le <pre> : inutile ici, la console
	// a déjà le fond assorti au thème.
	pre {
		background: transparent;
	}
}
</style>