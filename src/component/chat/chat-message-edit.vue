<template lang="html">
	<div class="chat-message-edit">
		<!-- Pas de `maxlength` : il TRONQUE en silence. On mesure donc comme
		     chat-input, à l'envoi, et on le dit. -->
		<textarea
			ref="input"
			v-model="text"
			rows="1"
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			@input="onInput"
			@click="saveCaret"
			@keyup="saveCaret"
			@keydown.enter.exact.prevent="submit"
			@keydown.esc.prevent="emit('close')"
		></textarea>
		<!-- Le sélecteur d'emojis de la zone de saisie, mais visant le message en cours
		     d'édition : pendant qu'on corrige une phrase, un emoji n'a aucune raison
		     d'atterrir dans le message SUIVANT (celui de la barre du bas), qui n'est
		     même pas visible sous l'éditeur. Pas de bouton d'image ici : on corrige un
		     texte, les pièces jointes restent le geste de l'envoi. -->
		<div class="actions">
			<emoji-picker close-on-selected @pick="addEmoji">
				<v-icon>mdi-emoticon-outline</v-icon>
			</emoji-picker>
			<div class="spacer"></div>
			<!-- Annuler et enregistrer en glyphes : le geste est le même que partout
			     ailleurs (croix / coche), et la légende « Entrée pour enregistrer »
			     disait à la souris ce qui ne concernait que le clavier. -->
			<div v-ripple class="action" :title="$t('main.cancel')" @click="emit('close')">
				<v-icon>mdi-close</v-icon>
			</div>
			<div v-ripple class="action save" :title="$t('main.save')" @click="submit">
				<v-icon>mdi-check</v-icon>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '@/model/chat'
import { trackEmojiUsage } from '@/model/emoji-usage'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import EmojiPicker from './emoji-picker.vue'

defineOptions({ name: 'ChatMessageEdit', components: { 'emoji-picker': EmojiPicker } })

const props = defineProps<{
	message: ChatMessage
	conversation: number
}>()

// `resize` : la zone de saisie s'ouvre, grandit à la frappe et se referme — donc la
// bulle change de hauteur. Sans le prévenir, éditer le dernier message le poussait
// hors de l'écran. Même chaîne que chat-message-text (→ chat-message → chat.vue), qui
// ne fait défiler que si le lecteur était déjà en bas.
const emit = defineEmits<{ close: [], resize: [] }>()

const { t } = useI18n()
const input = useTemplateRef<HTMLTextAreaElement>('input')
// Le texte d'ORIGINE, pas le rendu : `content` a déjà été transformé en HTML par
// formatMessage (liens, emojis, images), et c'est le texte tapé qu'on ré-édite.
const text = ref(props.message.raw_content ?? props.message.content)
let sending = false
// Position du curseur au dernier moment où il était à nous. Le sélecteur d'emojis
// prend le focus : sans l'avoir mémorisée, l'insertion repartirait du début du texte.
let caret = { start: 0, end: 0 }

onMounted(() => {
	nextTick(() => {
		const el = input.value
		if (!el) { return }
		resize()
		el.focus()
		// Curseur à la FIN : on vient rattraper une faute, pas recommencer la phrase.
		el.setSelectionRange(el.value.length, el.value.length)
		saveCaret()
	})
})

function resize() {
	const el = input.value
	if (!el) { return }
	el.style.height = 'auto'
	el.style.height = el.scrollHeight + 'px'
	emit('resize')
}

function onInput() {
	resize()
	saveCaret()
}

function saveCaret() {
	const el = input.value
	if (!el) { return }
	caret = { start: el.selectionStart, end: el.selectionEnd }
}

function addEmoji(emoji: string) {
	trackEmojiUsage(emoji)
	insertAtCaret(emoji)
}

/** Insère au curseur mémorisé, puis rend le focus et la position à la saisie. */
function insertAtCaret(insert: string) {
	const start = Math.min(caret.start, text.value.length)
	const end = Math.min(Math.max(caret.end, start), text.value.length)
	text.value = text.value.slice(0, start) + insert + text.value.slice(end)
	const position = start + insert.length
	caret = { start: position, end: position }
	nextTick(() => {
		const el = input.value
		if (!el) { return }
		el.focus()
		el.setSelectionRange(position, position)
		resize()
	})
}

function submit() {
	if (sending) { return }
	const content = text.value.trim()
	// Même mesure et même message que chat-input à l'envoi : le cas courant est dit
	// ici, sans aller-retour.
	if (content.length > 2000) {
		LeekWars.toast(t('main.chat_too_long') as string)
		return
	}
	// Vidé puis validé : ce n'est pas une suppression déguisée, le message reste. On
	// referme sans rien envoyer plutôt que de laisser le serveur répondre empty_message.
	if (content === '' || content === (props.message.raw_content ?? props.message.content)) {
		emit('close')
		return
	}
	sending = true
	LeekWars.post('message/edit-message', { message_id: props.message.id, message: content }).then(data => {
		// La socket enverra le même CHAT_EDIT à tout le salon, nous compris ; on
		// n'attend pas notre propre écho pour que l'édition se voie tout de suite.
		store.commit('chat-edit', { chat: props.conversation, message: props.message.id, content: data.content, date: data.edited })
		emit('close')
	}).catch((data: unknown) => {
		sending = false
		const d = data as { error: string, params?: (string | number)[] }
		LeekWars.toast(t('main.error_' + d.error, d.params ?? []) as string)
	})
}
</script>

<style lang="scss" scoped>
	.chat-message-edit {
		padding: 2px 0 4px 0;
	}
	textarea {
		display: block;
		width: 100%;
		min-width: 260px;
		box-sizing: border-box;
		padding: 4px 6px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background);
		color: var(--text-color);
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		resize: none;
		overflow: hidden;
		&:focus {
			outline: none;
			border-color: var(--primary);
		}
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-top: 2px;
		color: var(--text-color-secondary);
	}
	// Pousse annuler/enregistrer à droite : à gauche ce qui ajoute au message, à
	// droite ce qui en sort — deux gestes de nature différente, donc séparés.
	.spacer {
		flex: 1;
	}
	.action {
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius);
		cursor: pointer;
		i {
			font-size: 18px;
			color: inherit;
		}
		&:hover {
			color: var(--primary);
			background: var(--background-secondary);
		}
		&.save {
			color: var(--primary);
		}
	}
	// Le sélecteur d'emojis est dimensionné pour la barre de saisie (40 px) : ici il
	// doit tenir dans la même rangée de 26 que les autres boutons.
	:deep(.chat-input-emoji) {
		width: 26px;
		height: 26px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius);
		i {
			font-size: 18px;
			color: inherit;
		}
		&:hover {
			color: var(--primary);
			background: var(--background-secondary);
		}
	}
</style>
