<template lang="html">
	<div class="chat-input">
		<div ref="input" :placeholder="$t('main.chat_placeholder')" class="chat-input-content" contenteditable="true" @keyup="keyUp" @keydown="keyDown" @click="updateCursor"></div>
		<emoji-picker @pick="addEmoji" />
		<chat-commands v-if="commandsEnabled" ref="commands" v-autostopscroll :filter="commandFilter" class="commands v-menu__content" @command="selectCommand" />
	</div>
</template>

<script lang="ts">
	import { Commands } from '@/model/commands'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ChatCommands from './chat-commands.vue'
	import EmojiPicker from './emoji-picker.vue'

	@Component({ components: { 'emoji-picker': EmojiPicker, ChatCommands } })
	export default class ChatInput extends Vue {
		message: string = ''
		emojis: boolean = false
		cursor: number = 0
		commandsEnabled: boolean = false
		commandFilter: string = ''
		commandsX: number = 0
		commandsY: number = 0
		commandsHeight: number = 0

		mounted() {
			LeekWars.contenteditable_paste_protect(this.$refs.input as HTMLElement)
		}
		updateCursor() {
			const input = this.$refs.input as HTMLElement
			this.cursor = LeekWars.get_cursor_position(input)
		}
		keyDown(e: KeyboardEvent) {
			if (e.which === 9) {
				if (this.commandsEnabled) {
					const selectedCommand = (this.$refs.commands as ChatCommands).getSelected()
					const selectedOption = (this.$refs.commands as ChatCommands).getSelectedOption()
					const isSimple = !selectedCommand.options
					this.selectCommand(selectedCommand.name + (isSimple ? '' : ':') + (selectedOption ? selectedOption.name : ''), isSimple || !!selectedOption)
					e.preventDefault()
				}
			} else if (e.which === 13 && !e.shiftKey) {
				e.preventDefault()
			}
			e.stopPropagation()
		}
		keyUp(e: KeyboardEvent) {
			this.updateCursor()
			const input = this.$refs.input as HTMLElement
			this.message = input.innerText
			this.updateCommands()

			if (e.which === 13 && this.commandsEnabled) {
				(this.$refs.commands as ChatCommands).selectFirst()
				return
			}
			if (e.which === 13 && !e.shiftKey) {
				if (this.message.length === 0) {
					return
				}
				if (this.message.length > 1000) {
					LeekWars.toast(i18n.t('main.chat_too_long') as string)
					return
				}
				if (this.message === '/ping') {
					// LW.chat.last_ping = Date.now()
				}
				this.$emit('message', this.message)
				input.textContent = ''
				this.commandsEnabled = false
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
			} else {
				this.commandsEnabled = true
				this.commandFilter = result
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
			}
		}
	}
</script>

<style lang="scss" scoped>
	.chat-input {
		width: 100%;
		position: relative;
	}
	.chat-input .chat-input-content {
		background: white;
		padding: 10px;
		border: 1px solid #eee;
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
</style>