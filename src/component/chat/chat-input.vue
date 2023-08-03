<template lang="html">
	<div class="chat-input">
		<avatar :farmer="$store.state.farmer" />
		<div ref="input" :placeholder="$t('main.chat_placeholder')" class="chat-input-content" contenteditable="true" @keyup="keyUp" @keydown="keyDown" @click="updateCursor"></div>
		<emoji-picker @pick="addEmoji">😀</emoji-picker>
		<chat-commands v-if="commandsEnabled" ref="commands" v-autostopscroll :filter="commandFilter" class="commands v-menu__content" @command="selectCommand" />
		<chat-pseudos v-if="pseudosEnabled" ref="pseudos" v-autostopscroll :chat="chat" :filter="pseudosFilter" class="commands v-menu__content" @pseudo="selectPseudo" />
	</div>
</template>

<script lang="ts">
	import { Commands } from '@/model/commands'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ChatCommands from './chat-commands.vue'
	import ChatPseudos from './chat-pseudos.vue'
	import EmojiPicker from './emoji-picker.vue'

	@Component({ components: { 'emoji-picker': EmojiPicker, ChatCommands, ChatPseudos } })
	export default class ChatInput extends Vue {

		@Prop({ required: true }) chat!: number

		message: string = ''
		emojis: boolean = false
		cursor: number = 0
		commandsEnabled: boolean = false
		commandFilter: string = ''
		commandsX: number = 0
		commandsY: number = 0
		commandsHeight: number = 0

		pseudosEnabled: boolean = false
		pseudosFilter: string = ''

		mounted() {
			LeekWars.contenteditable_paste_protect(this.$refs.input as HTMLElement)
		}
		updateCursor() {
			const input = this.$refs.input as HTMLElement
			this.cursor = LeekWars.get_cursor_position(input)
		}

		keyDown(e: KeyboardEvent) {
			if (e.which === 9) { // tab
				if (this.commandsEnabled) {
					const selectedCommand = (this.$refs.commands as ChatCommands).getSelected()
					const selectedOption = (this.$refs.commands as ChatCommands).getSelectedOption()
					const filterOptions = (this.$refs.commands as ChatCommands).filterOptions || ''
					const isSimple = !selectedCommand.options
					this.selectCommand(selectedCommand.name + (isSimple ? '' : ':') + (selectedOption ? selectedOption.name : filterOptions), isSimple || !!selectedOption)
					e.preventDefault()
				} else if (this.pseudosEnabled) {
					const selectedPseudo = (this.$refs.pseudos as ChatPseudos).getSelected()
					this.selectPseudo(selectedPseudo)
					e.preventDefault()
				}
			} else if (e.which === 13 && !e.shiftKey) { // enter
				e.preventDefault()
			}
			if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
				if (this.commandsEnabled || this.pseudosEnabled) {
					e.preventDefault()
				}
			}
			e.stopPropagation()
		}

		keyUp(e: KeyboardEvent) {
			this.updateCursor()
			const input = this.$refs.input as HTMLElement
			this.message = input.innerText
			this.updateCommands()

			if (e.which === 13) { // enter
				if (this.commandsEnabled && (this.$refs.commands as ChatCommands).getSelected() !== null) {
					(this.$refs.commands as ChatCommands).selectFirst()
					return
				}
				if (this.pseudosEnabled && (this.$refs.pseudos as ChatPseudos).getSelected() !== null) {
					(this.$refs.pseudos as ChatPseudos).selectFirst()
					return
				}
			}
			if (e.which === 13 && !e.shiftKey) { // enter
				if (this.message.length === 0) {
					return
				}
				if (this.message.length > 2000) {
					LeekWars.toast(i18n.t('main.chat_too_long') as string)
					return
				}
				if (this.message === '/ping') {
					// LW.chat.last_ping = Date.now()
				}
				this.$emit('message', this.message.trim())
				input.textContent = ''
				this.cursor = 0
				this.commandsEnabled = false
			}
			if (e.code === 'ArrowDown') {
				if (this.commandsEnabled) {
					(this.$refs.commands as ChatCommands).down()
					e.stopPropagation()
					e.preventDefault()
					return
				}
				if (this.pseudosEnabled) {
					(this.$refs.pseudos as ChatPseudos).down()
					e.stopPropagation()
					e.preventDefault()
					return
				}
			} else if (e.code === 'ArrowUp') {
				if (this.commandsEnabled) {
					(this.$refs.commands as ChatCommands).up()
					e.stopPropagation()
					e.preventDefault()
					return
				}
				if (this.pseudosEnabled) {
					(this.$refs.pseudos as ChatPseudos).up()
					e.stopPropagation()
					e.preventDefault()
					return
				}
			}
			e.stopPropagation()
		}

		addEmoji(emoji: string) {
			const input = this.$refs.input as HTMLElement
			let cursor_position = this.cursor
			const text = input.innerText
			input.textContent = text.substring(0, cursor_position) + emoji + text.substring(cursor_position)
			input.focus()
			cursor_position += emoji.length
			LeekWars.set_cursor_position(input, cursor_position)
			this.cursor = cursor_position
		}

		updateCommands() {
			const result = Commands.isCommand(this.message)
			if (result === false) {
				this.commandsEnabled = false
				this.commandFilter = ''
			} else {
				this.commandsEnabled = true
				this.commandFilter = result
			}
			const match = /@(\w*)$/gi.exec(this.message)
			if (match) {
				this.pseudosEnabled = true
				this.pseudosFilter = match[1].toLowerCase()
			} else {
				this.pseudosEnabled = false
			}
		}
		selectCommand(command: string, finished: boolean = true) {
			const input = this.$refs.input as HTMLElement
			let text = input.innerText
			const regex = /\/(\w*(!|(:\w*))?)$/gi
			const match = regex.exec(text)
			text = text.replace(regex, "/" + command + (finished ? " " : ""))
			input.textContent = text
			input.focus()
			if (match) {
				LeekWars.set_cursor_position(input, match.index + command.length + (finished ? 2 : 1))
			}
			if (finished) {
				this.commandsEnabled = false
				this.commandFilter = ''
			}
		}

		selectPseudo(pseudo: string | null) {
			if (pseudo) {
				const input = this.$refs.input as HTMLElement
				let text = input.innerText
				const regex = /@\w*$/gi
				const match = regex.exec(text)
				text = text.replace(regex, "@" + pseudo + " ")
				input.textContent = text
				input.focus()
				if (match) {
					LeekWars.set_cursor_position(input, match.index + pseudo.length + 2)
				}
			}
			this.pseudosEnabled = false
			this.pseudosFilter = ''
		}
	}
</script>

<style lang="scss" scoped>
	.chat-input {
		width: 100%;
		position: relative;
	}
	.chat-input .chat-input-content {
		background: var(--pure-white);
		padding: 10px;
		border: 1px solid var(--border);
		padding-left: 56px;
		padding-right: 36px;
		cursor: text;
		word-wrap: break-word;
	}
	.chat-input .chat-input-content:empty:before {
		content: attr(placeholder);
		display: block;
		color: #aaa;
	}
	.chat-input .chat-input-content:focus {
		outline: 0px solid transparent;
		border: 1px solid #ccc;
	}
	.commands {
		z-index: 8;
		width: 400px;
		max-height: 250px;
		background: white;
		bottom: 39px;
		position: absolute;
	}
	.avatar {
		position: absolute;
		top: 4px;
		left: 13px;
		width: 32px;
		height: 32px;
	}
</style>