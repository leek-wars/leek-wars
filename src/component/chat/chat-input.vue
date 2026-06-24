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

defineOptions({ name: 'ChatInput', components: { 'emoji-picker': EmojiPicker, ChatCommands, ChatPseudos } })

defineProps<{
	chat: number
}>()

const emit = defineEmits(['message'])

const inputRef = useTemplateRef<HTMLElement>('input')
const commandsRef = useTemplateRef<InstanceType<typeof ChatCommands>>('commands')
const pseudosRef = useTemplateRef<InstanceType<typeof ChatPseudos>>('pseudos')

const message = ref('')
// Caret mémorisé dans l'input. On garde le Range (références nœud + offset) plutôt
// qu'un simple offset entier : en multi-lignes, un offset est local à la ligne et ne
// permet pas de retrouver la bonne position (forum #11627).
let savedRange: Range | null = null
const commandsEnabled = ref(false)
const commandFilter = ref('')
const pseudosEnabled = ref(false)
const pseudosFilter = ref('')
let rootEl: HTMLElement
let cleanupPasteProtect: (() => void) | null = null
// Anti-flood client : sans ça, vider l'input avant que le serveur ne rejette
// (HTTP 429 chat_flood) ferait perdre la saisie. On bloque l'envoi en amont
// et on garde le texte tant que le délai n'est pas écoulé. Le check serveur
// reste en place (sécurité, le client peut être bypassé).
const FLOOD_DELAY_MS = 350
let lastSendTime = 0

onMounted(() => {
	cleanupPasteProtect = LeekWars.contenteditable_paste_protect(inputRef.value!)
	rootEl = inputRef.value!.parentElement as HTMLElement
	document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
	cleanupPasteProtect?.()
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
	const sel = window.getSelection()
	if (sel && sel.rangeCount) {
		const range = sel.getRangeAt(0)
		// On ne mémorise le caret que s'il est bien dans l'input.
		if (input.contains(range.commonAncestorContainer)) {
			savedRange = range.cloneRange()
		}
	}
}

function keyDown(e: KeyboardEvent) {
	if (e.which === 9) { // tab
		if (commandsEnabled.value) {
			const selectedCommand = commandsRef.value!.getSelected()
			const selectedOption = commandsRef.value!.getSelectedOption() as { name: string } | null
			const filterOptions = (commandsRef.value as unknown as { filterOptions?: string }).filterOptions || ''
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
		if (commandsEnabled.value && commandsRef.value?.getSelected()) {
			commandsRef.value.selectFirst()
			return
		}
		if (pseudosEnabled.value && pseudosRef.value && pseudosRef.value.getSelected() !== null) {
			pseudosRef.value.selectFirst()
			return
		}
	}
	if (e.which === 13 && !e.shiftKey) { // enter
		if (message.value.length === 0) {
			return
		}
		if (message.value.length > 2000) {
			LeekWars.toast(i18n.t('main.chat_too_long') as string)
			return
		}
		const now = Date.now()
		if (now - lastSendTime < FLOOD_DELAY_MS) {
			LeekWars.toast(i18n.t('main.error_chat_flood') as string)
			return
		}
		lastSendTime = now
		if (message.value === '/ping') {
			// LW.chat.last_ping = Date.now()
		}
		emit('message', message.value.trim())
		input.textContent = ''
		savedRange = null
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
	input.focus()
	const sel = window.getSelection()
	if (!sel) return
	// Insertion au caret mémorisé via le DOM : préserve la structure multi-lignes
	// (les retours à la ligne ne sont plus aplatis comme avec textContent) et place
	// l'emoji à la bonne ligne (forum #11627). Le sélecteur d'emoji ayant fait perdre
	// le focus à l'input, on restaure la position mémorisée plutôt que la sélection
	// courante.
	let range: Range
	if (savedRange && input.contains(savedRange.commonAncestorContainer)) {
		range = savedRange.cloneRange()
	} else {
		// Pas de position mémorisée : on insère en fin de message.
		range = document.createRange()
		range.selectNodeContents(input)
		range.collapse(false)
	}
	range.deleteContents()
	const node = document.createTextNode(emoji)
	range.insertNode(node)
	// Caret juste après l'emoji inséré.
	range.setStartAfter(node)
	range.collapse(true)
	sel.removeAllRanges()
	sel.addRange(range)
	savedRange = range.cloneRange()
	message.value = input.innerText
	updateCommands()
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

// Remplace les tokenLength caracteres avant le caret memorise (savedRange) via le DOM
// (Range) au lieu de reconstruire input.textContent : reconstruire aplatissait la
// structure multi-lignes du contenteditable (les \n ne redevenaient pas des sauts de
// ligne) et faisait sauter le curseur (forum #11627, meme cause que celle corrigee pour
// addEmoji). Retourne false si le caret memorise n'est pas exploitable, pour laisser
// l'appelant retomber sur l'ancien comportement.
function replaceToken(input: HTMLElement, token: string, replacement: string): boolean {
	const sel = window.getSelection()
	const saved = savedRange
	if (!sel || !saved || !input.contains(saved.commonAncestorContainer)) { return false }
	if (saved.startContainer.nodeType !== Node.TEXT_NODE || saved.startOffset < token.length) { return false }
	// On ne remplace via le DOM que si les caractères juste avant le caret sont bien le
	// token attendu (caret au bout du /commande ou @pseudo). Sinon (caret déplacé), on
	// rend false pour laisser l'appelant retomber sur l'ancien remplacement textContent :
	// le chemin DOM reste alors strictement équivalent, sans risque de régression.
	const before = (saved.startContainer.textContent || '').slice(saved.startOffset - token.length, saved.startOffset)
	if (before !== token) { return false }
	input.focus()
	const range = saved.cloneRange()
	range.setStart(saved.startContainer, saved.startOffset - token.length)
	range.deleteContents()
	const node = document.createTextNode(replacement)
	range.insertNode(node)
	range.setStartAfter(node)
	range.collapse(true)
	sel.removeAllRanges()
	sel.addRange(range)
	savedRange = range.cloneRange()
	message.value = input.innerText
	return true
}

function selectCommand(command: string, finished: boolean = true) {
	const input = inputRef.value!
	const text = input.innerText
	const regex = /\/(\w*(!|(:\w*))?)$/gi
	const match = regex.exec(text)
	if (match) {
		const replacement = "/" + command + (finished ? " " : "")
		// DOM d'abord (preserve le multi-lignes) ; repli sur la reconstruction textContent
		// si le caret memorise n'est pas exploitable.
		if (!replaceToken(input, match[0], replacement)) {
			input.textContent = text.replace(regex, replacement)
			input.focus()
			LeekWars.set_cursor_position(input, match.index + command.length + (finished ? 2 : 1))
		}
	}
	if (finished) {
		commandsEnabled.value = false
		commandFilter.value = ''
	}
}

function selectPseudo(pseudo: string | null) {
	if (pseudo) {
		const input = inputRef.value!
		const text = input.innerText
		const regex = /@\w*$/gi
		const match = regex.exec(text)
		if (match) {
			const replacement = "@" + pseudo + " "
			if (!replaceToken(input, match[0], replacement)) {
				input.textContent = text.replace(regex, replacement)
				input.focus()
				LeekWars.set_cursor_position(input, match.index + pseudo.length + 2)
			}
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
		white-space: pre-wrap;
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
