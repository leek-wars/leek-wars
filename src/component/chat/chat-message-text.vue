<template lang="html">
	<div v-if="message.censored" class="censored">{{ $t('main.censored_by', [message.censored_by?.name]) }}</div>
	<div v-else>
		<div v-chat-code-latex class="text" :class="{'leek-wars': message.farmer.id === 0, 'large-emojis': message.only_emojis}" v-html="message.content"></div>
		<popup v-model="enlargedOpen" :width="1100" icon="mdi-image-outline" :title="$t('main.image')">
			<img v-if="enlarged" :src="enlarged" class="enlarged" :alt="''">
		</popup>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, getCurrentInstance, ref, type App } from 'vue'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { userImageHashes } from '@/model/user-image'
import { createSubApp } from '@/model/sub-app'
import Pseudo from '../app/pseudo.vue'
import type { ChatMessage } from '@/model/chat'
import Loader from '@/component/app/loader.vue'
import Avatar from '../avatar.vue'
import Flag from '../flag.vue'
import Emblem from '../emblem.vue'
import Talent from '../talent.vue'
import RankingBadge from '../ranking-badge.vue'
import BrInvite from './br-invite.vue'

defineOptions({ name: 'ChatMessageText' })

defineProps<{
	message: ChatMessage
}>()

// Le message change de hauteur APRÈS son rendu : la conversation a déjà défilé quand
// l'image arrive, et l'on se retrouvait à lire le message précédent avec l'image
// poussée hors de l'écran. Rien ne permet de réserver la place à l'avance — le texte
// ne porte qu'une URL, pas les dimensions — donc c'est le chargement lui-même qui
// redemande le défilement. Le chat ne le suivra que si le lecteur était déjà en bas
// (updateScroll respecte `userScroll`) : personne n'est ramené de force.
const emit = defineEmits<{ resize: [] }>()

const subApps: App[] = []
const instance = getCurrentInstance()
const enlarged = ref<string | null>(null)
const enlargedOpen = computed({
	get: () => enlarged.value !== null,
	set: (open: boolean) => { if (!open) { enlarged.value = null } },
})

onMounted(() => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const el = (instance?.proxy as any)?.$el
	if (!el) return
	el.querySelectorAll('.pseudo').forEach((c: HTMLElement) => {
		const name = c.innerText
		const farmer = store.state.farmer_by_name[name]
		if (farmer) {
			const app = createSubApp(Pseudo, { farmer }, 'chat-pseudo')
			app.component('Loader', Loader)
			app.component('Avatar', Avatar)
			app.component('Emblem', Emblem)
			app.component('Flag', Flag)
			app.component('Talent', Talent)
			app.component('RankingBadge', RankingBadge)
			app.mount(c)
			subApps.push(app)
		}
	})
	// Images : on enveloppe chaque <img> pour lui poser ses commandes à CÔTÉ
	// d'elle, jamais par-dessus — un bouton sur l'image en masque toujours un coin, et
	// c'est souvent le coin qui porte l'information sur une capture d'écran. Fait ici
	// et non dans chat-format : le formateur produit du texte, la manipulation du DOM
	// rendu vit déjà dans ce composant.
	el.querySelectorAll('img.chat-image').forEach((img: HTMLImageElement) => {
		if (img.parentElement?.classList.contains('chat-image-box')) return

		const box = document.createElement('span')
		box.className = 'chat-image-box'
		const label = document.createElement('span')
		label.className = 'chat-image-label'
		label.textContent = i18n.t('main.image') as string
		const actions = document.createElement('span')
		actions.className = 'chat-image-actions'

		const button = (cls: string, title: string) => {
			const b = document.createElement('button')
			b.className = cls
			b.type = 'button'
			b.title = title
			actions.appendChild(b)
			return b
		}
		const toggle = button('chat-image-toggle', i18n.t('main.image_collapse') as string)

		img.replaceWith(box)
		box.appendChild(label)
		box.appendChild(img)
		box.appendChild(actions)

		toggle.addEventListener('click', () => {
			box.classList.toggle('collapsed')
			emit('resize')
		})
		label.addEventListener('click', () => {
			box.classList.remove('collapsed')
			emit('resize')
		})
		img.addEventListener('click', () => { enlarged.value = img.src })
		// `complete` couvre l'image déjà en cache : `load` ne s'y déclenche pas toujours,
		// et c'est justement le cas le plus fréquent en rechargeant une conversation.
		if (img.complete) { emit('resize') } else { img.addEventListener('load', () => emit('resize')) }

		// Image qui ne charge pas : bannie ou effacée depuis. Le client ne connaît pas
		// l'état d'une image au rendu : l'échec de chargement vaut indisponibilité.
		img.addEventListener('error', () => {
			box.classList.add('banned')
			label.textContent = i18n.t('main.image_unavailable') as string
			emit('resize')
		})

		// Bannir : un seul geste, sans confirmation, car c'est réversible. Réservé aux
		// modérateurs.
		if (store.getters.moderator) {
			const hash = userImageHashes(img.getAttribute('src') || '')[0]
			if (hash) {
				const ban = button('chat-image-ban', i18n.t('main.image_ban') as string)
				ban.addEventListener('click', () => {
					ban.disabled = true
					LeekWars.post('user-image/ban', { hash }).then(() => {
						box.classList.add('banned')
						label.textContent = i18n.t('main.image_banned') as string
						LeekWars.toast(i18n.t('main.image_banned') as string)
					}).error((error) => {
						ban.disabled = false
						LeekWars.toast(error.error as string)
					})
				})
			}
		}
	})
	el.querySelectorAll('.br-invite').forEach((c: HTMLElement) => {
		const level = parseInt(c.dataset.level || '', 10) || 0
		const label = c.dataset.label || undefined
		const modeStr = c.dataset.mode
		const mode = modeStr !== undefined ? parseInt(modeStr, 10) : undefined
		const app = createSubApp(BrInvite, { level, label, mode }, 'chat-br-invite')
		app.mount(c)
		subApps.push(app)
	})
})

onBeforeUnmount(() => {
	for (const app of subApps) app.unmount()
})
</script>

<style lang="scss" scoped>
	// Les règles du texte vivent ICI et non dans chat-message.vue : la racine de ce
	// composant est une enveloppe (le texte et la popup d'agrandissement), et un style
	// scopé du parent n'atteint que la racine d'un enfant, jamais .text. Posées là-bas,
	// elles ne s'appliquaient plus : une URL sans espace débordait de la bulle, et un
	// message fait d'emojis restait à la taille du texte.
	.text {
		word-break: break-word;
	}
	.text.large-emojis {
		line-height: 26px;
		font-size: 22px;
		:deep(.emoji) {
			width: 24px;
			height: 24px;
		}
	}
	.text:deep(a) {
		color: var(--primary);
		&.lw {
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 0 4px;
			&:hover {
				border: 1px solid var(--primary);
			}
		}
	}
	.text:deep(.v-icon) {
		color: var(--primary);
		font-size: 18px;
		margin-right: 4px;
		vertical-align: baseline;
	}
	.censored {
		font-size: 15px;
		color: var(--text-color-secondary);
		font-style: italic;
	}
	// Images du chat : bornées à la zone de chat, bien plus petite que l'image.
	//
	// La HAUTEUR MAX est une variable et non une constante, parce qu'elle dépend du
	// contenant : la page /chat offre ~757 px de messages visibles, mais le panneau
	// docké du forum n'en offre que 360 — mesurés. Une image à 300 px y prendrait 83 %
	// de la place et chasserait la conversation. Chaque contenant pose donc sa valeur
	// (cf chat-panel.vue) ; 260 px est celle de la page pleine.
	.text:deep(.chat-image) {
		display: block;
		max-width: 100%;
		max-height: var(--chat-image-max-height, 260px);
		width: auto;
		height: auto;
		border-radius: var(--radius);
		cursor: zoom-in;
		// L'espace est réservé avant le chargement : sinon chaque image qui arrive
		// décale les messages déjà lus sous les yeux du lecteur.
		background: var(--background-secondary);
	}
	// Enveloppe posée au montage (cf onMounted) : l'image, et ses commandes À DROITE.
	// Hors de l'image et non par-dessus : un bouton posé dessus masque toujours un
	// coin, et sur une capture d'écran c'est souvent là qu'est l'information.
	.text:deep(.chat-image-box) {
		display: flex;
		align-items: flex-start;
		gap: 4px;
		margin: 4px 0;
		width: fit-content;
		max-width: 100%;
	}
	.text:deep(.chat-image-actions) {
		display: flex;
		gap: 3px;
		flex: none;
	}
	.text:deep(.chat-image-actions button) {
		width: 20px;
		height: 20px;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--background-secondary);
		cursor: pointer;
		// Discrètes tant qu'on ne s'occupe pas de l'image, mais JAMAIS invisibles :
		// une commande qu'on ne devine pas n'existe pas.
		opacity: 0.45;
		transition: opacity 0.15s;
		&:hover { opacity: 1; }
		&:disabled { opacity: 0.25; cursor: default; }
	}
	.text:deep(.chat-image-box:hover) .chat-image-actions button {
		opacity: 1;
	}
	// Chevron du repli, dessiné en bordures : pas d'icône à charger pour deux traits.
	.text:deep(.chat-image-toggle):after {
		content: '';
		display: block;
		margin: 2px auto 0;
		width: 7px;
		height: 7px;
		border-left: 2px solid var(--text-color-secondary);
		border-bottom: 2px solid var(--text-color-secondary);
		transform: rotate(135deg);
	}
	.text:deep(.chat-image-box.collapsed) .chat-image-toggle:after {
		transform: rotate(-45deg);
		margin: -1px auto 0;
	}
	// Croix du bannissement (modérateurs).
	.text:deep(.chat-image-ban) {
		position: relative;
		&:before, &:after {
			content: '';
			position: absolute;
			top: 8px;
			left: 4px;
			width: 10px;
			height: 2px;
			background: #c0392b;
		}
		&:before { transform: rotate(45deg); }
		&:after { transform: rotate(-45deg); }
	}
	// Mention laissée par la modération à la place de l'image (cf renderChatImage).
	// Même apparence que le libellé d'une image repliée : c'est la même idée — le
	// message garde sa place dans la conversation, seule l'image n'est plus là.
	.text:deep(.chat-image-banned) {
		color: var(--text-color-secondary);
		font-style: italic;
	}
	.text:deep(.chat-image-label) {
		display: none;
		cursor: pointer;
		color: var(--text-color-secondary);
		font-style: italic;
		align-self: center;
	}
	// Repliée : l'image cède la place à une ligne de texte. Le message ne disparaît
	// pas de la conversation, il cesse juste de la remplir.
	.text:deep(.chat-image-box.collapsed) {
		.chat-image { display: none; }
		.chat-image-label { display: inline; }
	}
	// Bannie : l'image n'est plus servie. On la retire de la vue au lieu de laisser
	// une image cassée.
	.text:deep(.chat-image-box.banned) {
		.chat-image, .chat-image-actions { display: none; }
		.chat-image-label { display: inline; cursor: default; }
	}
	.enlarged {
		display: block;
		max-width: 100%;
		max-height: 80vh;
		margin: 0 auto;
	}
</style>