<template lang="html">
	<div class="console" :class="'theme-' + theme">
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
				<!-- <span class="arrow">›</span> -->
				<v-icon class="arrow">mdi-chevron-right</v-icon>
				<!-- <input ref="input" v-model="code" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" @keydown.enter="enter"> -->
				<ai-view class="editor" ref="editor" :ai="ai" :ais="{}" :visible="true" :line-numbers="false" :font-size="17" @enter="enter" :autocomplete-option="true" :popups="true" :console="true" @down="down" @up="up" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { LeekWars } from '@/model/leekwars'
	import { SocketMessage } from '@/model/socket'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import AIView from '../editor/ai-view.vue'
	import { AI } from '@/model/ai'
	import { emitter } from '@/model/vue'

	@Options({ components: { 'ai-view': AIView } })
	export default class Console extends Vue {

		editor!: AIView
		lines: any[] = []
		history: string[] = []
		historyPos: number = 0
		ai: any = new AI({ id: 0, code: '' })
		theme: string = 'leekwars'
		leekscript = {
			version: 4,
			strict: false,
		}

		async created() {
			LeekWars.loadEncyclopedia(locale)

			const docMessages = await import(/* webpackChunkName: "[request]" */ /* webpackMode: "eager" */ `@/lang/doc.${locale}.lang`)
			i18n.global.mergeLocaleMessage(locale, { doc: docMessages.default })

			const defaultTheme = LeekWars.darkMode ? 'monokai' : 'leekwars'
			this.theme = localStorage.getItem('console/theme') || defaultTheme
			this.leekscript.version = parseInt(localStorage.getItem('console/version') || '4')
			this.leekscript.strict = localStorage.getItem('console/strict') === 'true'

			this.clear()
		}

		isEmpty() {
			return this.lines.length === 0
		}

		clear() {
			this.lines = []
			this.history = []
			this.historyPos = 0
			if (this.editor) {
				this.editor.editor.setValue('')
			}
			LeekWars.socket.send([SocketMessage.CONSOLE_NEW, this.leekscript.version, this.leekscript.strict])
		}

		up() {
			this.historyPos--
			if (this.historyPos < 0) this.historyPos = 0
			this.editor.setCode(this.history[this.historyPos])
		}

		down() {
			this.historyPos++
			if (this.historyPos >= this.history.length) {
				this.historyPos = this.history.length
				this.editor.editor.setValue('')
			} else {
				this.editor.setCode(this.history[this.historyPos])
			}
		}

		mounted() {
			this.editor = this.$refs.editor as AIView
			emitter.on('console', (data: any) => {
				console.log("on console", data)
				this.lines.push({ type: 'result', ...data })
				this.scrollDown()
			})
			emitter.on('console-error', (data: any) => {
				console.log("on console-error", data)
				let zigzags = ""
				if (data.location) {
					for (var i = 0; i < data.location[2]; ++i) zigzags += ' '
					for (var i = 0; i <= data.location[4] - data.location[2]; ++i) zigzags += '~'
				}
				this.lines.push({ type: 'error', ...data, zigzags })
				this.scrollDown()
			})
			emitter.on('console-log', (data: any) => {
				console.log("on console-log", data)
				this.lines.push({ type: 'log', log: data })
				this.scrollDown()
			})
			emitter.on("wsconnected", () => {
				this.clear()
			})
		}

		beforeUnmount() {
			emitter.off('console')
			emitter.off('console-error')
			emitter.off('console-log')
			LeekWars.socket.send([SocketMessage.CONSOLE_CLOSE])
		}

		enter() {
			console.log("Console enter")
			const code = this.editor.editor.getValue()
			this.history.push(code)
			this.historyPos = this.history.length
			this.lines.push({ type: 'code', code })
			LeekWars.socket.send([SocketMessage.CONSOLE_EXECUTE, code])
			this.scrollDown()
			this.editor.editor.setValue('')
		}
		scrollDown() {
			setTimeout(() => {
				(this.$refs.scroll as HTMLElement).scrollTop = (this.$refs.scroll as HTMLElement).scrollHeight
			}, 50)
		}

		focus() {
			// (this.$refs.input as HTMLElement).focus()
			this.editor.editor.focus()
		}

		random() {
			LeekWars.get('leekscript/random').then(data => {
				// this.code = data.code
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		toggleTheme() {
			console.log("toggle theme")
			this.theme = this.theme === 'leekwars' ? 'monokai' : 'leekwars'
			localStorage.setItem('console/theme', this.theme)
		}

		@Watch('leekscript.version')
		updateVersion(version: number) {
			localStorage.setItem('console/version', '' + this.leekscript.version)
			this.clear()
		}

		@Watch('leekscript.strict')
		updateStrictMode() {
			localStorage.setItem('console/strict', '' + this.leekscript.strict)
			this.clear()
		}
	}
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
		align-items: flex-start;
		gap: 5px;
		font-family: monospace;
		span, .error {
			white-space: pre-wrap;
		}
		.error {
			color: red;
		}
		.zigzag {
			padding-left: 31px;
			margin-top: -10px;
		}
	}
	.line.result {
		// color: white;
		font-weight: bold;
		font-size: 16px;
		margin-bottom: 2px;
		.ops {
			font-size: 13px;
			font-weight: normal;
			color: #888;
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
	&::v-deep .CodeMirror {
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
.console::v-deep code {
	border: none;
	padding: 0 4px;
}
</style>