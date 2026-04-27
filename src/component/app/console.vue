<template lang="html">
	<div class="console" :class="'theme-' + cssTheme">
		<div ref="scroll" class="scroll" v-autostopscroll >
			<div class="lines">
				<div v-for="(line, l) in lines" :key="l" class="line">
					<template v-if="line.type === 'code'">
						<!-- <span class="arrow">›</span> -->
						<v-icon class="arrow">mdi-chevron-right</v-icon>
						<span v-single-code><code>{{ line.code }}</code></span>
					</template>
					<template v-else-if="line.type === 'result'">
						<div class="line result">
							<span v-single-code><code>{{ line.result }}</code></span>
							<span class="ops">{{ line.ops }} ops</span>
						</div>
					</template>
					<template v-else-if="line.type === 'log'">
						<div :class="LeekWars.logClass(line.log)" :style="{color: LeekWars.logColor(line.log)}">{{ LeekWars.logText(line.log) }}</div>
					</template>
					<template v-else-if="line.type === 'error'">
						<div class="error">
							<div v-if="line.location" class="zigzag">{{ line.zigzags }}</div>
							<div>{{ $t('leekscript.error_' + line.error, line.params) }}</div>
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
				<ai-view-monaco class="editor" ref="editor" :ai="ai" :ais="{}" :visible="true" :line-numbers="false" :font-size="17" :line-height="20" @enter="enter" :autocomplete-option="true" :popups="true" :console="true" :theme="theme" @down="down" @up="up" />
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

defineOptions({ name: 'console', components: { 'ai-view-monaco': AIViewMonaco } })

const editorRef = useTemplateRef<any>('editor')
const scrollRef = useTemplateRef<HTMLElement>('scroll')

const lines = ref<any[]>([])
const history = ref<string[]>([])
const historyPos = ref(0)
const ai = ref<any>(new AI({ id: 0, code: '', path: FileSystem.CONSOLE_MAGIC_KEY + Math.random() + '.leek' }))
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

function clear() {
	lines.value = []
	history.value = []
	historyPos.value = 0
	if (editorRef.value) {
		editorRef.value.editor.setValue('')
	}
	LeekWars.socket.send([SocketMessage.CONSOLE_NEW, leekscript.version, leekscript.strict])
}

function up() {
	if (history.value.length === 0) return
	historyPos.value--
	if (historyPos.value < 0) historyPos.value = 0
	editorRef.value!.editor.setValue(history.value[historyPos.value])
}

function down() {
	historyPos.value++
	if (historyPos.value >= history.value.length) {
		historyPos.value = history.value.length
		editorRef.value!.editor.setValue('')
	} else {
		editorRef.value!.editor.setValue(history.value[historyPos.value])
	}
}

onMounted(() => {
	emitter.on('console', (data: any) => {
		console.log("on console", data)
		lines.value.push({ type: 'result', ...data })
		scrollDown()
	})
	emitter.on('console-error', (data: any) => {
		console.log("on console-error", data)
		let zigzags = ""
		if (data.location) {
			for (var i = 0; i < data.location[2]; ++i) zigzags += ' '
			for (var i = 0; i <= data.location[4] - data.location[2]; ++i) zigzags += '~'
		}
		lines.value.push({ type: 'error', ...data, zigzags })
		scrollDown()
	})
	emitter.on('console-log', (data: any) => {
		console.log("on console-log", data)
		lines.value.push({ type: 'log', log: data })
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
	const code = editorRef.value!.editor.getValue()
	history.value.push(code)
	historyPos.value = history.value.length
	lines.value.push({ type: 'code', code })
	LeekWars.socket.send([SocketMessage.CONSOLE_EXECUTE, code])
	scrollDown()
	editorRef.value!.editor.setValue('')
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

defineExpose({ isEmpty, clear, focus, saveTheme, theme, leekscript })
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
}
</style>