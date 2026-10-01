<template lang="html">
	<div class="message" :class="{ me: chat.type === 2 && $store.state.farmer && message.farmer.id === $store.state.farmer.id, reactions: !LeekWars.isEmptyObj(lastLine.reactions), 'can-react': $store.state.farmer?.verified }" @pointerenter.once="armed = true">
		<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="avatar-wrapper">
			<rich-tooltip-farmer :id="message.farmer.id">
				<avatar :farmer="message.farmer" />
			</rich-tooltip-farmer>
		</router-link>
		<div v-else class="avatar-wrapper">
			<img class="avatar" src="/image/favicon.png">
		</div>
		<div class="bubble" :class="{large: large}">

			<router-link v-if="message.farmer.id !== 0" :to="'/farmer/' + message.farmer.id" class="author">
				<rich-tooltip-farmer :id="message.farmer.id" v-slot="{ props }">
					<span :class="message.farmer.color" v-bind="props">{{ message.farmer.name }}</span>
				</rich-tooltip-farmer>
				<!-- Le « + » doré des abonnés. Image statique et légère
				     (2,6 ko) — le rendu animé serait hors de propos à 15 px, et le
				     chat en affiche autant qu'il y a de messages. -->
				<img v-if="message.farmer.lwplus" class="lwplus-badge" src="/image/lwplus/plus_badge.webp" alt="LW+" width="128" height="128">
			</router-link>
			<div v-else class="author"><span class="bot">Leek Wars 🤖</span></div>

			<!-- Une ligne par message de la bulle : le message lui-même et ceux que le
			     groupement a rangés dessous (même auteur, moins de 2 min). Chacun est un
			     message à part entière côté serveur, donc chacun s'édite pour lui-même —
			     d'où le crayon par ligne et non un seul pour la bulle. -->
			<template v-for="line in lines" :key="line.id">
				<div class="line" :class="{ target: line.id === target }" @pointerenter="target = line.id">
					<chat-message-edit v-if="editing === line.id" :message="line" :conversation="chat.id" class="line-body" @resize="emit('scroll')" @close="editing = 0" />
					<template v-else>
						<div class="line-body">
							<!-- `key` sur le CONTENU : chat-message-text enrichit son HTML au montage
							     (@pseudo, images, invitations). Remplacer le v-html sans remonter le
							     composant laisserait le texte réécrit sans rien de tout ça. Sur la
							     date d'édition, à la seconde, deux corrections dans la même seconde
							     rendaient la même clé — donc pas de remontage, donc un texte neuf
							     sans ses mentions. Le contenu, lui, est exactement ce dont dépend
							     l'enrichissement. -->
							<chat-message-text :key="line.content" :message="line" @resize="emit('scroll')" />
							<!-- Résultat d'un `/exec`, sous le code qui l'a demandé. Rendu ICI et pas dans
							     chat-message-text : ce dernier doit garder une racine unique, son onMounted cherche
							     les @pseudo et les invitations dans son $el. Masqué avec le message censuré. -->
							<chat-exec-result v-if="line.exec && !line.censored" :exec="line.exec" />
						</div>
						<!-- Trace de l'édition, visible de tous : sans elle, un message réécrit
						     ferait passer pour fou celui qui l'a lu avant. -->
						<v-icon v-if="line.edited && !line.censored" class="line-edited" :title="$t('main.edited_the', [LeekWars.formatDateTime(line.edited)])">mdi-pencil</v-icon>
						<v-icon v-if="canEdit(line)" v-ripple class="line-edit" :title="$t('main.edit')" @click="editing = line.id">mdi-pencil</v-icon>
					</template>
					<!-- Un bouton par ligne, sorti de la bulle à sa hauteur : seul celui de la
					     dernière ligne survolée se montre, et c'est à ce message qu'on réagit.
					     Montés au premier survol de la bulle, puis gardés : le menu d'emojis
					     reste ancré sur celui qu'on a cliqué. -->
					<div v-if="$store.state.farmer?.verified && armed" v-ripple class="add" @click="emit('emoji', $event, line)">
						<v-icon>mdi-emoticon-outline</v-icon> +
					</div>
				</div>
				<!-- Les réactions d'un message, sous sa ligne. Celles de la dernière
				     chevauchent le bas de la bulle. -->
				<div v-if="!LeekWars.isEmptyObj(line.reactions)" class="reactions" :class="{ last: line === lastLine }" @pointerenter="target = line.id">
					<v-tooltip v-for="(reaction, emoji) in line.reactions" :key="emoji" :open-delay="500" :close-delay="0" bottom>
						<template #activator="{ props }">
							<div v-ripple v-bind="props" class="reaction" :class="{me: emoji === line.my_reaction}" @click="toggleReaction(line, emoji)">
								<span v-html="reactionsHtml[emoji]"></span><span v-if="reaction.count > 1" class="count">{{ reaction.count }}</span>
							</div>
						</template>
						{{ reaction.farmers.join(', ') }}
					</v-tooltip>
				</div>
			</template>

			<div class="right">
				<span :title="LeekWars.formatDateTime(message.date)" class="time">{{ LeekWars.formatTime(message.date) }}</span>

				<v-btn v-if="!privateMessages && (message.farmer.color !== 'admin' || $store.getters.admin) && message.farmer.id !== 0" size="x-small" variant="text" icon="mdi-dots-vertical" color="grey" @click="$emit('menu', $event)"></v-btn>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import { canEditChatMessage, Chat, ChatMessage, ChatType } from '@/model/chat'
import { trackEmojiUsage } from '@/model/emoji-usage'
import { formatEmojisText } from '@/model/emojis'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { computed, ref, watch } from 'vue'
import ChatExecResult from './chat-exec-result.vue'
import ChatMessageEdit from './chat-message-edit.vue'
import ChatMessageText from './chat-message-text.vue'

defineOptions({ name: 'ChatMessage', components: { RichTooltipFarmer, ChatMessageText, ChatMessageEdit, ChatExecResult } })

const props = defineProps<{
	message: ChatMessage
	chat: Chat
	large?: boolean
}>()

const emit = defineEmits<{
	'scroll': []
	'emoji': [event: MouseEvent, message: ChatMessage]
	'menu': [event: MouseEvent]
}>()

const privateMessages = computed(() => props.chat && props.chat.type === ChatType.PM)

// Id du message en cours d'édition dans cette bulle, 0 = aucun (forum #12141). Un
// seul à la fois : deux brouillons ouverts sur la même bulle n'auraient aucun sens.
const editing = ref(0)
const lines = computed(() => [props.message, ...props.message.subMessages])
const lastLine = computed(() => lines.value[lines.value.length - 1])
// Ligne qui porte le bouton de réaction : la dernière survolée (ou touchée), pas celle
// sous le pointeur, pour que le bouton ne disparaisse pas pendant qu'on va le chercher.
const target = ref(props.message.id)
// La plupart des bulles ne sont jamais survolées : pas de boutons de réaction avant.
const armed = ref(false)

// `LeekWars.time` est réactif et remis à l'heure chaque minute : le crayon disparaît
// donc tout seul à l'expiration du délai, sans minuterie propre à ce composant.
function canEdit(message: ChatMessage) {
	return canEditChatMessage(message, store.state.farmer?.id, LeekWars.time)
}

// Précalculé : éviter de relancer formatEmojisText (30+ regex) par réaction à
// chaque rendu. Ne se recalcule que si les réactions changent.
const reactionsHtml = computed(() => {
	const html: Record<string, string> = {}
	for (const line of lines.value) {
		for (const emoji in line.reactions) {
			html[emoji] ??= formatEmojisText(emoji)
		}
	}
	return html
})

// La hauteur de la bulle ne bouge qu'avec les réactions affichées et leurs compteurs. Un
// `watch` profond sur `lines` rappellerait à chaque regroupement de la conversation, soit
// à chaque message reçu une fois le chat plein.
const reactionsKey = computed(() => lines.value.map(line => Object.entries(line.reactions).map(([emoji, reaction]) => emoji + reaction.count).join()).join('|'))
watch(reactionsKey, () => {
	emit('scroll')
})

function toggleReaction(message: ChatMessage, emoji: string) {
	if (message.my_reaction === emoji) { // Remove current reaction
		LeekWars.delete('message-reaction/delete', { message_id: message.id })
		message.my_reaction = null
	} else {
		LeekWars.post('message-reaction/add', { reaction: emoji, message_id: message.id })
		message.my_reaction = emoji
		trackEmojiUsage(emoji)
	}
}
</script>

<style lang="scss" scoped>
	// Entre l'avatar, la bulle et la colonne du bouton de réaction.
	$gap: 8px;
	// Largeur du bouton de réaction, et de sa colonne à côté de la bulle.
	$add-width: 50px;
	.message {
		display: flex;
		align-items: flex-start;
		margin: 6px 8px;
		gap: $gap;
		&.me {
			flex-direction: row-reverse;
		}
		// Colonne du bouton de réaction, à côté de la bulle. Le bouton est posé par ligne
		// (cf. .add) et sort de la bulle : la colonne lui garde sa place.
		&.can-react:after {
			content: '';
			flex: 0 0 $add-width;
		}
	}
	.avatar-wrapper {
		position: sticky;
		top: 8px;
	}
	.avatar {
		width: 42px;
		height: 42px;
		flex: 0 0 42px;
	}
	.bubble {
		padding: 3px 7px;
		border-radius: var(--radius);
		background: var(--pure-white);
		position: relative;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
		min-width: 0;
		.report, .mute, .unmute {
			display: none;
			cursor: pointer;
		}
		// Le texte d'un message vit dans chat-message-text, hors de portée des
		// sélecteurs scopés d'ici (cf. ses styles) : il hérite sa taille de .line-body.
		&.large {
			padding: 6px 10px;
			.line-body, .author {
				font-size: 15.5px;
			}
			.right {
				top: 7px;
			}
		}
	}
	// Une ligne = un message. Le texte prend la place, la gouttière de droite porte les
	// marques d'édition ; `min-width: 0` pour que les mots longs cassent au lieu de
	// pousser la bulle hors de la conversation.
	.line {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}
	.line-body {
		flex: 1;
		min-width: 0;
	}
	.line-edited, .line-edit {
		font-size: 14px;
		margin-top: 3px;
		flex: none;
	}
	// État : ce message a été réécrit. Muet et non cliquable, la date est dans l'infobulle.
	.line-edited {
		color: var(--text-color-secondary);
		opacity: 0.6;
	}
	// Action : réécrire ce message. Au survol seulement, comme le bouton de réaction
	// juste à côté — le chat en afficherait autant qu'il y a de messages récents.
	.line-edit {
		color: var(--primary);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.message:hover .line-edit {
		opacity: 1;
	}
	.message.reactions .bubble {
		margin-bottom: 12px;
	}
	.bubble:hover {
		.report, .mute, .unmute {
			display: inline;
		}
	}
	.author {
		font-weight: 500;
		display: block;
		padding-bottom: 2px;
		padding-right: 60px;
		color: var(--text-color-secondary);
	}
	// Le badge suit la ligne du pseudo sans l'écarter : hauteur de la casse,
	// aligné sur la base du texte.
	.lwplus-badge {
		width: 15px;
		height: 15px;
		margin-left: 3px;
		vertical-align: -2px;
	}
	.right {
		font-size: 13px;
		position: absolute;
		top: 3px;
		right: 0;
		.time {
			color: var(--text-color-secondary);
			padding-right: 4px;
		}
		.v-btn {
			margin: 0;
			margin-top: -3px;
			margin-left: -5px;
			height: 24px;
			width: 24px;
		}
		i.v-icon {
			font-size: 18px;
			color: var(--grey-9);
		}
	}
	// Dans la colonne réservée à côté de la bulle, à la hauteur de sa ligne : la bulle,
	// positionnée, sert de repère horizontal, et le bouton garde verticalement sa position
	// statique, qu'`align-self` centre sur la ligne. `visibility` plutôt qu'`opacity` : les
	// boutons de deux lignes courtes se chevauchent, un voisin transparent prendrait le clic.
	.add {
		position: absolute;
		left: calc(100% + #{$gap});
		align-self: center;
		width: $add-width;
		background: var(--pure-white);
		padding: 2px 6px;
		cursor: pointer;
		border-radius: var(--radius-large);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22px;
		visibility: hidden;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
		user-select: none;
		.v-icon {
			font-size: 20px;
			margin-right: 3px;
		}
	}
	.message.me .add {
		left: auto;
		right: calc(100% + #{$gap});
	}
	.message:hover .line.target .add {
		visibility: visible;
	}
	.message {
		.reactions {
			display: flex;
			margin: 3px 0 4px;
			gap: 5px;
			flex-wrap: wrap;
			// Sous le dernier message, elles chevauchent le bas de la bulle, qui leur
			// laisse la place (cf. .message.reactions).
			&.last {
				margin-bottom: -15px;
				margin-top: 5px;
			}
		}
		.reaction {
			background: var(--pure-white);
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.1), 0px 1px 1px 0px rgba(0,0,0,0.07), 0px 1px 3px 0px rgba(0,0,0,0.06);
			border-radius: var(--radius);
			padding: 2.5px 5px;
			border: 1px solid var(--border);
			color: var(--text-color-secondary);
			font-weight: 500;
			user-select: none;
			font-size: 18px;
			display: flex;
			align-items: center;
			cursor: pointer;
			.count {
				font-size: 15px;
				margin-left: 4px;
			}
			&.me {
				border: 1px solid var(--text-color-secondary);
			}
		}
	}
</style>