<template lang="html">
	<div class="chat-input">
		<!-- Les images envoyées attendent ici, pas dans la zone de texte : y coller
		     l'URL brute (64 caractères hexadécimaux) n'apprenait rien au joueur et
		     l'invitait à la modifier à la main. -->
		<div v-if="pendingImages.length" class="pending-images">
			<div v-for="(image, i) in pendingImages" :key="image.preview" :class="{uploading: image.uploading}" class="pending-image">
				<!-- L'aperçu vient du fichier LOCAL, affiché dès le collage : on sait
				     déjà à quoi ressemble l'image, inutile d'attendre le serveur pour
				     la montrer. Le chargement se signale par-dessus, pas à la place. -->
				<img :src="image.preview" :alt="''">
				<loader v-if="image.uploading" class="overlay-loader" />
				<div v-else v-ripple class="remove" :title="$t('main.image_remove')" @click="removeImage(i)">
					<v-icon>mdi-close</v-icon>
				</div>
			</div>
		</div>
		<avatar :farmer="$store.state.farmer" />
		<div ref="input" :placeholder="$t('main.chat_placeholder')" class="chat-input-content" contenteditable="true" @keyup="keyUp" @keydown="keyDown" @click="updateCursor"></div>
		<!-- Coller et glisser marchent déjà, mais ne se devinent pas : un bouton est le
		     seul moyen d'apprendre que la fonction existe. `accept` filtre le sélecteur
		     de fichiers, par confort. -->
		<div v-ripple class="attach" :title="$t('main.image_attach')" @click="fileInput?.click()">
			<v-icon>mdi-plus</v-icon>
		</div>
		<input ref="file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="file-input" @change="onPickFile">
		<emoji-picker @pick="addEmoji">😀</emoji-picker>
		<chat-commands v-if="commandsEnabled" ref="commands" v-autostopscroll :filter="commandFilter" class="commands v-menu__content" @command="selectCommand" />
		<chat-pseudos v-if="pseudosEnabled" ref="pseudos" v-autostopscroll :chat="chat" :filter="pseudosFilter" class="commands v-menu__content" @pseudo="selectPseudo" />
	</div>
</template>

<script setup lang="ts">
import { Commands } from '@/model/commands'
import { trackEmojiUsage } from '@/model/emoji-usage'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import type { ApiError } from '@/model/api-error'
import { PSEUDO_CHAR } from '@/model/chat-format'
import { uploadUserImage, userImageErrorMessage } from '@/model/user-image-upload'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import ChatCommands from './chat-commands.vue'
import ChatPseudos from './chat-pseudos.vue'
import EmojiPicker from './emoji-picker.vue'

defineOptions({ name: 'ChatInput', components: { 'emoji-picker': EmojiPicker, ChatCommands, ChatPseudos } })

defineProps<{
	chat: number
}>()

const emit = defineEmits(['message'])

// @pseudo en cours de frappe, juste avant le caret.
const PSEUDO_AT_END = new RegExp('@(' + PSEUDO_CHAR + '*)$', 'u')

const inputRef = useTemplateRef<HTMLElement>('input')
const commandsRef = useTemplateRef<InstanceType<typeof ChatCommands>>('commands')
const pseudosRef = useTemplateRef<InstanceType<typeof ChatPseudos>>('pseudos')
const fileInput = useTemplateRef<HTMLInputElement>('file')

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
// Images jointes au prochain message. Elles rejoignent le texte à l'envoi : une
// image est une pièce jointe, pas un morceau de phrase — on ne l'intercale pas, et
// on peut la retirer sans toucher au texte.
//
// `preview` est une URL d'objet locale, donc disponible AVANT la réponse du serveur ;
// `url` n'arrive qu'avec elle. Tant que `uploading` est vrai, l'entrée existe déjà et
// s'affiche : le joueur voit son image, pas un indicateur abstrait.
interface PendingImage { preview: string, url: string | null, uploading: boolean }
const pendingImages = ref<PendingImage[]>([])
// Un seul envoi à la fois.
const uploading = computed(() => pendingImages.value.some(i => i.uploading))

onMounted(() => {
	// AVANT contenteditable_paste_protect : celui-ci appelle preventDefault() sur tout
	// collage pour ne garder que le texte. Nos écouteurs passent donc en premier et
	// coupent la propagation quand ils ont trouvé une image.
	inputRef.value!.addEventListener('paste', onPasteImage)
	inputRef.value!.addEventListener('drop', onDropImage)
	cleanupPasteProtect = LeekWars.contenteditable_paste_protect(inputRef.value!)
	rootEl = inputRef.value!.parentElement as HTMLElement
	document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
	inputRef.value?.removeEventListener('paste', onPasteImage)
	inputRef.value?.removeEventListener('drop', onDropImage)
	cleanupPasteProtect?.()
	document.removeEventListener('mousedown', onClickOutside)
})

function onPasteImage(e: ClipboardEvent) {
	const file = firstImage(e.clipboardData?.files)
	if (!file) { return }
	e.preventDefault()
	e.stopImmediatePropagation()
	uploadImage(file)
}

function onDropImage(e: DragEvent) {
	const file = firstImage(e.dataTransfer?.files)
	if (!file) { return }
	e.preventDefault()
	e.stopImmediatePropagation()
	uploadImage(file)
}

function onPickFile(e: Event) {
	const input = e.target as HTMLInputElement
	const file = firstImage(input.files)
	// Remis à zéro dans tous les cas : sans ça, rechoisir LE MÊME fichier n'émet
	// aucun `change` et le bouton semble mort.
	input.value = ''
	if (file) { uploadImage(file) }
}

function firstImage(files: FileList | undefined | null): File | null {
	if (!files) { return null }
	for (const file of files) {
		if (file.type.startsWith('image/')) { return file }
	}
	return null
}

/**
 * Envoie l'image, puis insère l'URL rendue par le serveur dans la saisie : le message
 * reste du texte, et c'est le rendu qui en fait une <img>. L'envoi du message est un
 * geste séparé, donc on peut encore écrire autour ou renoncer.
 *
 * Aucune vérification de format ici : ce qui est fait ici l'est pour le confort —
 * dire tout de suite qu'un envoi est parti, et rendre l'erreur du serveur lisible.
 */
function uploadImage(file: File) {
	if (uploading.value) {
		// Message distinct : dire « Envoi de l'image… » alors qu'on vient de jeter
		// celle-ci laisserait croire qu'elle part.
		LeekWars.toast(i18n.t('main.user_image_busy') as string)
		return
	}

	// La vignette apparaît AVANT la requête : le retour visuel ne dépend pas du réseau.
	const pending: PendingImage = { preview: URL.createObjectURL(file), url: null, uploading: true }
	pendingImages.value.push(pending)

	uploadUserImage(file, 'chat').then((url) => {
		pending.url = url
		pending.uploading = false
	}).catch((error: ApiError) => {
		// L'envoi a échoué : la vignette disparaît, sinon elle promettrait une image
		// que le message ne portera pas.
		dropPending(pending)
		LeekWars.toast(userImageErrorMessage(error))
	})
}

function removeImage(index: number) {
	const [removed] = pendingImages.value.splice(index, 1)
	if (removed) { URL.revokeObjectURL(removed.preview) }
}

/** Retire une entrée par identité : son index a pu bouger pendant la requête. */
function dropPending(pending: PendingImage) {
	const index = pendingImages.value.indexOf(pending)
	if (index !== -1) { removeImage(index) }
}

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
		// Une image seule est un message valable : ne pas exiger de texte.
		if (message.value.length === 0 && !pendingImages.value.length) {
			return
		}
		// Envoi BLOQUÉ tant qu'une image monte. Sans ça, taper un texte et valider
		// pendant l'upload envoyait le message SANS l'image : celle-ci arrivait après
		// et restait en attente pour le message suivant, sans que rien ne le dise.
		if (uploading.value) {
			LeekWars.toast(i18n.t('main.user_image_busy') as string)
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
		// Les images en fin de message : la surface qui les rend décide de leur place,
		// et à l'envoi on ne sait pas où le joueur les voudrait dans sa phrase.
		const urls = pendingImages.value.map(image => image.url).filter((url): url is string => url !== null)
		emit('message', [message.value.trim(), ...urls].filter(part => part.length).join(' '))
		// Les aperçus locaux ne servent plus : les libérer évite de retenir les fichiers
		// en mémoire pour toute la durée de la session.
		for (const image of pendingImages.value) { URL.revokeObjectURL(image.preview) }
		pendingImages.value = []
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
	trackEmojiUsage(emoji)
	insertAtCaret(emoji)
}

/**
 * Insère du texte au caret mémorisé, via le DOM : ça préserve la structure
 * multi-lignes (les retours à la ligne ne sont plus aplatis comme avec textContent)
 * et place l'insertion à la bonne ligne (forum #11627). Le sélecteur d'emoji comme
 * l'upload d'image ayant fait perdre le focus à l'input, on restaure la position
 * mémorisée plutôt que la sélection courante.
 */
function insertAtCaret(text: string) {
	const input = inputRef.value!
	input.focus()
	const sel = window.getSelection()
	if (!sel) return
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
	const node = document.createTextNode(text)
	range.insertNode(node)
	// Caret juste après le texte inséré.
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
	const match = PSEUDO_AT_END.exec(message.value)
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
		const match = PSEUDO_AT_END.exec(text)
		if (match) {
			const replacement = "@" + pseudo + " "
			if (!replaceToken(input, match[0], replacement)) {
				input.textContent = text.replace(PSEUDO_AT_END, replacement)
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
		// Distance du bas du champ à sa ligne de texte : trait du bas + marge
		// intérieure. L'avatar et les deux boutons, posés en absolu depuis le bas,
		// s'en servent pour se centrer sur la ligne. La bande du v3, sans trait en
		// bas, la ramène à 10 px (leekwars-shell-v3.scss).
		--line-inset: 11px;
	}
	.pending-images {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 6px 6px 0 6px;
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-bottom: none;
	}
	.pending-image {
		position: relative;
		width: 56px;
		height: 56px;
		display: flex;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--background-secondary);
		img {
			width: 100%;
			height: 100%;
			// `contain` et non `cover` : le contenu le plus fréquent est une capture
			// large et courte, dont un recadrage carré ne montrerait qu'une bande
			// illisible. La vignette sert à reconnaître ce qu'on joint, pas à décorer.
			object-fit: contain;
		}
		.remove {
			position: absolute;
			top: 0;
			right: 0;
			background: rgba(0, 0, 0, 0.55);
			border-bottom-left-radius: var(--radius);
			cursor: pointer;
			display: flex;
			i {
				font-size: 16px;
				color: #fff;
			}
		}
	}
	// Pendant l'envoi : l'image est grisée et le loader se pose DESSUS, à sa taille.
	// Un loader seul, à la place de l'image, ne disait pas de quelle image il parlait
	// et prenait toute la hauteur de la rangée.
	.pending-image.uploading img {
		opacity: 0.4;
	}
	.overlay-loader {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		:deep(svg), :deep(img), :deep(div) {
			width: 24px;
			height: 24px;
		}
	}
	.chat-input .chat-input-content {
		background: var(--pure-white);
		padding: 10px;
		border: 1px solid var(--border);
		padding-left: 56px;
		// Gouttière réservée aux deux boutons posés en absolu à droite : ils sont
		// ancrés en bas, donc c'est la ligne en cours d'écriture qui passait dessous
		// 36 px ne dégageaient que le glyphe du sélecteur d'emojis, seul
		// bouton de l'époque ; le « + » occupe 48 à 78 px du bord, soit en plein
		// dans le texte. 84 = ces 78 px + le trait, et 5 px d'air.
		padding-right: 84px;
		// Interligne FIXE : `normal` suit les métriques de la police, que le
		// navigateur arrondit ou non selon l'échelle d'affichage — 19 px à 100 %,
		// 18 px à 150 % —, et l'avatar et les boutons, posés en px depuis le bas, se
		// décentraient d'autant. 20 px donnent 10 + 20 + 10 = 40 px de hauteur
		// utile : les 32 px de l'avatar s'y centrent au pixel près.
		line-height: 20px;
		cursor: text;
		word-wrap: break-word;
		white-space: pre-wrap;
	}
	.chat-input .chat-input-content:empty:before {
		content: attr(placeholder);
		display: block;
		color: var(--grey-9);
	}
	.chat-input .chat-input-content:focus {
		outline: 0px solid transparent;
		border: 1px solid var(--grey-11);
	}
	.commands {
		z-index: 8;
		width: 400px;
		max-height: 250px;
		overflow-y: auto;
		background: var(--pure-white);
		// Posée sur le trait du haut du champ : 40 px de hauteur utile sous ce trait.
		bottom: 40px;
		position: absolute;
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
	}
	.avatar {
		position: absolute;
		// Ancré en BAS et non en haut : la rangée de pastilles s'insère au-dessus de
		// la zone de saisie, dans le même conteneur positionné — un ancrage haut
		// faisait recouvrir les vignettes par l'avatar dès la première image jointe.
		// Centré sur la ligne de texte : (32 − 20) / 2 = 6 px sous le bas de celle-ci.
		bottom: calc(var(--line-inset) - 6px);
		left: 13px;
		width: 32px;
		height: 32px;
	}
	:deep(.chat-input-emoji) {
		position: absolute;
		right: 0;
		// Même correction que .attach : il était ancré en haut et partait lui aussi
		// dans la rangée de pastilles. Le décalage ne se voyait pas avant, la rangée
		// n'existant pas. Centré sur la ligne : (40 − 20) / 2 = 10 px sous son bas.
		bottom: calc(var(--line-inset) - 10px);
	}
	// À gauche du sélecteur d'emojis, aligné sur lui. Le champ de fichier natif est
	// masqué mais présent dans le DOM : c'est lui qui ouvre le sélecteur du système.
	//
	// 48 px = les 40 px du sélecteur d'emojis + 8 d'écart.
	.attach {
		position: absolute;
		right: 48px;
		// Ancré en BAS, comme l'avatar : la rangée de pastilles s'insère AU-DESSUS de
		// la zone de saisie, dans le même conteneur positionné. Avec `top: 0`, le
		// bouton sautait de 62 px dès la première image jointe et se retrouvait dans
		// la rangée de vignettes — mesuré. Centré sur la ligne : (30 − 20) / 2.
		bottom: calc(var(--line-inset) - 5px);
		// Carré : le fond de survol dessine la zone cliquable, un 30x40 donnait un
		// rectangle qui débordait visuellement de la ligne.
		width: 30px;
		height: 30px;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-color-secondary);
		transition: color 0.12s, background 0.12s;
		&:hover {
			color: var(--primary);
			background: var(--background-secondary);
		}
		&:active {
			// Le retour d'appui : sans lui, le clic sur le bouton ne se distingue pas
			// d'un clic à côté, puisque le sélecteur de fichiers met un instant à
			// s'ouvrir.
			color: var(--primary);
			background: var(--background-disabled);
		}
		i {
			font-size: 20px;
		}
	}
	.file-input {
		display: none;
	}
</style>
