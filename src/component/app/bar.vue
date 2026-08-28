<template>
	<div :class="{subtitle: LeekWars.subtitle, full: !LeekWars.lightBar || LeekWars.menuExpanded}" class="app-bar">
		<div v-ripple :class="{back: LeekWars.splitBack}" class="menu-button" @click="mainButton">
			<div>
				<div class="bar"></div>
				<div class="bar"></div>
				<div class="bar"></div>
			</div>
		</div>
		<div v-if="!LeekWars.lightBar || LeekWars.menuExpanded" class="title-wrapper" @click="LeekWars.toggleMenu">
			<div class="title">{{ LeekWars.title }}</div>
			<div v-show="LeekWars.subtitle" class="subtitle">{{ LeekWars.subtitle }}</div>
		</div>
		<div v-if="!LeekWars.lightBar || LeekWars.menuExpanded" class="actions-wrapper">
			<div class="static-actions">
				<div v-show="LeekWars.menuExpanded || $store.state.unreadMessages > 0" v-ripple class="action header-button mobile messages-button" @click="$router.push('/messages'); LeekWars.closeMenu()">
					<v-icon>mdi-message-outline</v-icon>
					<span v-show="$store.state.unreadMessages > 0" class="counter messages-counter">{{ $store.state.unreadMessages }}</span>
				</div>
				<div v-show="LeekWars.menuExpanded || $store.state.unreadNotifications > 0" v-ripple class="action header-button mobile notifications-button">
					<v-menu :nudge-bottom="0" :max-width="400" :max-height="434" bottom offset-y @update:model-value="readNotifications">
						<template #activator="{ props }">
							<div class="header-button notifications-button" v-bind="props">
								<v-icon>mdi-information-outline</v-icon>
								<span v-show="$store.state.unreadNotifications > 0" class="counter notifications-counter">{{ $store.state.unreadNotifications }}</span>
							</div>
						</template>
						<div class="dialog">
							<div class="dialog-items">
								<notification v-for="notification in $store.state.notifications" :key="notification.id" :notification="notification" @click="readNotification(notification)" />
							</div>
							<router-link to="/notifications" class="see-all" @click="LeekWars.closeMenu()">{{ $t('main.all_notifications') }}</router-link>
						</div>
					</v-menu>
				</div>
				<router-link v-show="LeekWars.menuExpanded" v-ripple to="/settings" class="action header-button mobile settings" @click="closeMenu">
					<v-icon>mdi-cog-outline</v-icon>
				</router-link>
			</div>
			<div v-show="!LeekWars.menuExpanded" class="actions">
				<doc-language-selector v-if="onDocumentation" />
				<div v-for="(action, a) in LeekWars.actions" :key="a" v-ripple class="tab action" @click="action.click($event)">
					<img v-if="action.image" :src="'/image/' + action.image" class="action">
					<v-icon v-else-if="action.icon" class="action">{{ action.icon }}</v-icon>
					<span v-if="action.text" class="action action-text">{{ action.text }}</span>
				</div>
			</div>
		</div>
		<div class="dark" :class="{visible: dark}"></div>
	</div>
</template>

<script setup lang="ts">
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { emitter } from '@/model/emitter'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DocLanguageSelector from '@/component/documentation/doc-language-selector.vue'
import type { Notification } from '@/model/notification'

defineOptions({ name: 'LwBar' })

const dark = ref(false)
const route = useRoute()

/**
 * Le sélecteur de langage n'a de sens que là où on LIT de la documentation. Sur mobile la
 * barre d'onglets de la page n'existe pas — c'est cette barre d'application qui la remplace —
 * donc sans ça le sélecteur serait tout simplement absent sur téléphone.
 */
const onDocumentation = computed(() => {
	const path = route.path
	return path.startsWith('/help/documentation') || path.startsWith('/encyclopedia')
})

function mainButton() {
	if (LeekWars.menuExpanded || !LeekWars.splitBack) {
		LeekWars.toggleMenu()
	} else {
		emitter.emit('back')
	}
}
function closeMenu() {
	LeekWars.menuExpanded = false
	LeekWars.dark = 0
}
function readNotifications(e: boolean) {
	if (e === false && store.state.unreadNotifications) {
		LeekWars.post('notification/read-all')
		store.commit('read-notifications')
	}
	dark.value = e
}
function readNotification(notification: Notification) {
	LeekWars.post('notification/read', {notification_id: notification.id})
}
</script>

<style lang="scss" scoped>
	// Le sélecteur n'est pas dans une `.page-bar .tabs`, il ne reçoit donc PAS la mise en forme
	// d'onglet du site : sans hauteur ni centrage explicites il se calait en haut d'une barre
	// de 56px. On l'aligne sur les autres actions, qui font toute la hauteur.
	// `:deep` et non une classe passée au composant : sa racine est un `<v-menu>`, dont
	// l'héritage d'attributs n'atteint pas l'élément activateur — la classe se perdait en route.
	.actions :deep(.doc-language-selector) {
		display: inline-flex;
		align-items: center;
		height: 56px;
		padding: 0 12px;
		vertical-align: top;
	}

	.app-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 56px;
		z-index: 6;
		background: #4b9e06;
		color: var(--white);
		line-height: 55px;
		font-size: 18px;
		overflow: hidden;
		text-overflow: ellipsis;
		word-break: break-all;
		white-space: nowrap;
		display: flex;
		box-shadow: 0 2px 2px 0 rgba(0,0,0,.07);
		&.full {
			right: 0;
		}
	}
	#app:not(.connected) .app-bar {
		display: none;
	}
	.app-bar .menu-button {
		width: 61px;
		padding: 14px 20px;
		padding-right: 14px;
	}
	.app-bar .menu-button .bar {
		width: 20px;
		height: 2px;
		border-radius: var(--radius-tiny);
		margin: 5px 0;
		background: var(--white);
		transition: all ease 400ms;
	}
	.app-bar .menu-button.back .bar:first-child {
		transform: translateY(2px) rotate(-38deg);
	}
	.app-bar .menu-button.back .bar:nth-child(2) {
		opacity: 0;
	}
	.app-bar .menu-button.back .bar:last-child {
		transform: rotate(38deg);
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:first-child {
		transform: translateY(7px) rotate(45deg);
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:nth-child(2) {
		opacity: 0;
	}
	#app.app.menu-expanded .app-bar .menu-button .bar:last-child {
		transform: translateY(-7px) rotate(-45deg);
	}
	.app-bar .title-wrapper {
		flex: 1;
		text-overflow: ellipsis;
		overflow-x: hidden;
		padding-left: 4px;
	}
	.app-bar .title {
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
	.app-bar.subtitle .title {
		line-height: 25px;
		padding-top: 7px;
		font-weight: bold;
	}
	.app-bar .subtitle {
		text-overflow: ellipsis;
		overflow-x: hidden;
		line-height: 15px;
		font-size: 12px;
		display: none;
	}
	.app-bar.subtitle .subtitle {
		display: block;
	}
	.app-bar .actions-wrapper {
		padding-right: 4px;
	}
	.app-bar .actions, .app-bar .static-actions {
		display: inline-block;
	}
	#app.app.menu-expanded .app-bar .static-actions .action {
		display: inline-block;
	}
	.action {
		display: inline-block;
		line-height: normal;
		vertical-align: top;
		position: relative;
	}
	.action .v-icon {
		width: 56px;
		height: 56px;
		padding: 15px;
		color: var(--white);
	}
	.action img {
		width: 56px;
		height: 56px;
		opacity: 1;
		padding: 16px;
	}
	.action-text {
		height: 56px;
		line-height: 56px;
		padding: 0 12px;
		color: var(--white);
		font-size: 16px;
		white-space: nowrap;
	}
	.app-bar.content .action.list:not(.content),
	.app-bar.list .action.content:not(.list),
	.app-bar .action.hidden {
		display: none;
	}
	.app-bar .action.visible {
		display: inline-block;
	}
	.counter {
		position: absolute;
		top: 7px;
		right: 5px;
		padding: 4px 3px;
		background: #ff6f00;
		color: var(--white);
		border-radius: 5px;
		height: 20px;
		line-height: 12px;
	}

	/* ====== v3 : la barre d'application est une barre de page ======
	   Elle n'avait jamais été reprise : aplat vert du v2 écrit en dur, encre
	   blanche et ombre floue d'élévation. En thème clair, un bandeau vif au-dessus
	   du parchemin ; et son encre `--white`, jamais redéfinie en sombre, est le
	   piège du lot 10. Elle prend la surface d'en-tête et l'encre du thème, comme
	   la barre de page sur grand écran, et se détache par le trait (principe 1). */
	body:not(.v2) {
		.app-bar {
			background: var(--background-header);
			color: var(--text-color);
			box-shadow: none;
			border-bottom: 1.5px solid var(--border-strong);
		}
		/* Le shell habille `.menu-button` en poignée de repli — un petit carré bordé
		   posé dans le vide, pour le menu et le panneau social sur grand écran. Ici
		   ce n'est pas une poignée mais le premier bouton de la barre : sa surface
		   de panneau y dessinait un carré plus clair, cousu à même le bandeau. */
		.app-bar .menu-button {
			background: transparent;
			border: none;
			color: inherit;
		}
		/* Les trois traits du bouton et les icônes suivaient `--white` : ils suivent
		   maintenant l'encre de la barre, quel que soit le thème. */
		.app-bar .menu-button .bar {
			background: currentColor;
		}
		.action .v-icon,
		.action-text {
			color: inherit;
		}
		/* Même pastille que le compteur du header sur grand écran. Le orange en dur
		   ne descendait d'aucun jeton et ne tenait que sur l'aplat vert. */
		.counter {
			background: var(--primary-surface);
			color: var(--primary-surface-text);
			border-radius: var(--radius-tiny);
		}
		/* Les images d'action sont les PNG BLANCS du v2 (garden, market, potion,
		   github_white — mesurés entre 245 et 255 de luminosité), taillés pour
		   l'aplat vert : sur le parchemin ils disparaissent. On les retourne en
		   clair seulement, l'inverse de ce que le shell fait pour les icônes
		   noires en thème sombre. */
		&:not(.dark) .action img {
			filter: invert(1);
		}
	}
	.dark {
		position: fixed;
		top: 56px;
		left: 0;
		right: 0;
		height: 0;
		background: #0000;
		transition: background 200ms ease;
		&.visible {
			height: 100vh;
			background: #0007;
		}
	}
	.dialog {
		background: var(--background);
		min-width: min(400px, 100vw);
	}
	.dialog-items {
		overflow-y: auto;
		max-height: 400px;
	}
	.see-all {
		padding: 8px;
		display: block;
		text-align: center;
		color: var(--text-color-secondary);
	}
	.see-all:hover {
		background: var(--pure-white);
	}
</style>