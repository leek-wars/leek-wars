<template lang="html">
	<div class="chat-input">
		<avatar :farmer="$store.state.farmer" />
		<div ref="input" :placeholder="$t('main.chat_placeholder')" class="chat-input-content" contenteditable="true" @keyup="keyUp" @keydown="keyDown" @click="updateCursor"></div>
		<emoji-picker @pick="addEmoji">😀</emoji-picker>
		<chat-commands v-if="commandsEnabled" ref="commands" v-autostopscroll :filter="commandFilter" class="commands v-menu__content" @command="selectCommand" />
		<chat-pseudos v-if="pseudosEnabled" ref="pseudos" v-autostopscroll :chat="chat" :filter="pseudosFilter" class="commands v-menu__content" @pseudo="selectPseudo" />
	</div>
</template>

<script setup lang="ts">
import { Commands } from '@/model/commands'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import ChatCommands from './chat-commands.vue'
import ChatPseudos from './chat-pseudos.vue'
import EmojiPicker from './emoji-picker.vue'

defineOptions({ name: 'chat-input', components: { 'emoji-picker': EmojiPicker, ChatCommands, ChatPseudos } })

defineProps<{
	chat: number
}>()

const emit = defineEmits<{
	'message': [text: string]
}>()

const inputRef = useTemplateRef<HTMLElement>('input')
const commandsRef = useTemplateRef<any>('commands')
const pseudosRef = useTemplateRef<any>('pseudos')

const message = ref('')
const cursor = ref(0)
const commandsEnabled = ref(false)
const commandFilter = ref('')
const pseudosEnabled = ref(false)
const pseudosFilter = ref('')
let rootEl: HTMLElement

onMounted(() => {
	LeekWars.contenteditable_paste_protect(inputRef.value!)
	rootEl = inputRef.value!.parentElement as HTMLElement
	document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onClickOutside)
})

function onClickOutside(e: MouseEvent) {
	if (!rootEl.contains(e.target as Node)) {
		pseudosEnabled.value = false
		commandsEnabled.value = false
	}
}

function updateCursor() {
	const input = inputRef.value!
	cursor.value = LeekWars.get_cursor_position(input)
}

function keyDown(e: KeyboardEvent) {
	if (e.which === 9) { // tab
		if (commandsEnabled.value) {
			const selectedCommand = commandsRef.value!.getSelected()
			const selectedOption = commandsRef.value!.getSelectedOption()
			const filterOptions = commandsRef.value!.filterOptions || ''
			const isSimple = !selectedCommand.options
			selectCommand(selectedCommand.name + (isSimple ? '' : ':') + (selectedOption ? selectedOption.name : filterOptions), isSimple || !!selectedOption)
			e.preventDefault()
		} else if (pseudosEnabled.value) {
			const selectedPseudo = pseudosRef.value!.getSelected()
			selectPseudo(selectedPseudo)
			e.preventDefault()
		}
	} else if (e.which === 13 && !e.shiftKey) { // enter
		e.preventDefault()
	}
	if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
		if (commandsEnabled.value || pseudosEnabled.value) {
			e.preventDefault()
		}
	}
	e.stopPropagation()
}

function keyUp(e: KeyboardEvent) {
	updateCursor()
	const input = inputRef.value!
	message.value = input.innerText
	updateCommands()

	if (e.which === 13) { // enter
		if (commandsEnabled.value && commandsRef.value!.getSelected()) {
			commandsRef.value!.selectFirst()
			return
		}
		if (pseudosEnabled.value && pseudosRef.value!.getSelected() !== null) {
			pseudosRef.value!.selectFirst()
			return
		}
	}
	if (e.which === 13 && !e.shiftKey) { // enter
		if (message.value.length === 0) {
			return
		}
		if (message.value.length > 2000) {
			LeekWars.toast(i18n.global.t('main.chat_too_long') as string)
			return
		}
		if (message.value === '/ping') {
			// LW.chat.last_ping = Date.now()
		}
		emit('message', message.value.trim())
		input.textContent = ''
		cursor.value = 0
		commandsEnabled.value = false
	}
	if (e.code === 'ArrowDown') {
		if (commandsEnabled.value) {
			commandsRef.value!.down()
			e.stopPropagation()
			e.preventDefault()
			return
		}
		if (pseudosEnabled.value) {
			pseudosRef.value!.down()
			e.stopPropagation()
			e.preventDefault()
			return
		}
	} else if (e.code === 'ArrowUp') {
		if (commandsEnabled.value) {
			commandsRef.value!.up()
			e.stopPropagation()
			e.preventDefault()
			return
		}
		if (pseudosEnabled.value) {
			pseudosRef.value!.up()
			e.stopPropagation()
			e.preventDefault()
			return
		}
	}
	e.stopPropagation()
}

function addEmoji(emoji: string) {
	const input = inputRef.value!
	let cursor_position = cursor.value
	const text = input.innerText
	input.textContent = text.substring(0, cursor_position) + emoji + text.substring(cursor_position)
	input.focus()
	cursor_position += emoji.length
	LeekWars.set_cursor_position(input, cursor_position)
	cursor.value = cursor_position
}

function updateCommands() {
	const result = Commands.isCommand(message.value)
	if (result === false) {
		commandsEnabled.value = false
		commandFilter.value = ''
	} else {
		commandsEnabled.value = true
		commandFilter.value = result
	}
	const match = /@(\w*)$/gi.exec(message.value)
	if (match) {
		pseudosEnabled.value = true
		pseudosFilter.value = match[1].toLowerCase()
	} else {
		pseudosEnabled.value = false
	}
}

function selectCommand(command: string, finished: boolean = true) {
	const input = inputRef.value!
	let text = input.innerText
	const regex = /\/(\w*(!|(:\w*))?)$/gi
	const match = regex.exec(text)
	text = text.replace(regex, "/" + command + (finished ? " " : ""))
	input.textContent = text
	input.focus()
	if (match) {
		LeekWars.set_cursor_position(input, match.index + command.length + (finished ? 2 : 1))
	}
	if (finished) {
		commandsEnabled.value = false
		commandFilter.value = ''
	}
}

function selectPseudo(pseudo: string | null) {
	if (pseudo) {
		const input = inputRef.value!
		let text = input.innerText
		const regex = /@\w*$/gi
		const match = regex.exec(text)
		text = text.replace(regex, "@" + pseudo + " ")
		input.textContent = text
		input.focus()
		if (match) {
			LeekWars.set_cursor_position(input, match.index + pseudo.length + 2)
		}
	}
	pseudosEnabled.value = false
	pseudosFilter.value = ''
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
		overflow-y: auto;
		background: var(--pure-white);
		bottom: 39px;
		position: absolute;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
	}
	.avatar {
		position: absolute;
		top: 4px;
		left: 13px;
		width: 32px;
		height: 32px;
	}
	:deep(.chat-input-emoji) {
		position: absolute;
		right: 0;
		top: 0;
	}
</style>
