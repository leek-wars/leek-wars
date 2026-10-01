<template>
	<div class="hud" :class="{dark, compact}">
		<div v-if="!creator" class="life-bar">
			<div class="wrapper">
				<!-- v-memo : le hud se redessine en bloc à chaque rafraîchissement, alors
				     qu'entre deux images un seul poireau change de vie. Sans lui, ce sont
				     autant d'infobulles Vuetify reconstruites pour rien. Il exige une seule
				     boucle, d'où la liste à plat plutôt que les équipes imbriquées.
				     ⚠️ La clé porte les valeurs RENDUES, déjà arrondies : la vie affichée
				     dérive de quelques dixièmes par image pendant une animation, et comme
				     `totalLife` en est la somme, mémoïser dessus invaliderait toutes les
				     barres à la fois — le contraire du but. -->
				<v-tooltip v-for="entity in livingEntities" :key="entity.id" v-memo="[Math.round(barWidth * entity.displayLife / totalLife), Math.round(entity.displayLife)]" top>
					<template #activator="{ props }">
						<div :style="{background: entity.lifeBarGadient, width: Math.max(1, Math.round(barWidth * entity.displayLife / totalLife) - 3) + 'px'}" class="bar" v-bind="props"></div>
					</template>
					<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
					<span v-else>{{ entity.name }}</span>
					({{ Math.round(entity.displayLife) }})
				</v-tooltip>
			</div>
		</div>
		<div v-if="debug" class="debug">
			<div>Particles : {{ game.particles.particles.length }}</div>
			<div>Mouse : ({{ game.mouseX }}, {{ game.mouseY }})</div>
			<div>Mouse tile : ({{ game.mouseTileX }}, {{ game.mouseTileY }})</div>
			<div>Mouse cell : <span v-if="game.mouseCell">{obstacle: {{ game.mouseCell.obstacle }}, entity: <span v-if="game.mouseCell.entity">{{ game.mouseCell.entity.name }}</span>, id: {{ game.mouseCell.id }}, x: {{ game.mouseCell.x }}, y: {{ game.mouseCell.y }}}</span></div>
			<div>FPS : {{ game.meter.fps }}</div>
			<div>Resources : {{ game.numData }}</div>
		</div>
		<!-- Sur un petit écran mobile, l'ordre des poireaux et les actions ne peuvent pas se
		     poser en surimpression : l'écran est trop étroit, ils masqueraient le terrain. Ils
		     étaient donc purement et simplement absents. Le Teleport les envoie SOUS le lecteur,
		     sans rien changer à leur logique : même composant, même virtualisation
		     de la liste d'actions, seul le point d'accroche dans le DOM change. -->
		<Teleport v-if="timelineTarget" :to="mobilePanels || 'body'" :disabled="!compact">
			<div v-if="!creator" class="timeline" :class="{large: !game.showActions || actionsBelow, compact}" :style="compact ? undefined : {left: (game.showActions && !actionsBelow ? (game.largeActions ? actionsWidth + 5 : 400) : 0) + 'px'}">
				<!-- Même raison que la barre de vie : sans v-memo, les trente vignettes de
				     l'ordre de jeu (infobulle + image du poireau) sont reconstruites à
				     chaque rafraîchissement, pour une ou deux qui changent vraiment. La clé
				     porte le pourcentage de vie ARRONDI, celui qui est rendu.
				     ⚠️ Clavetée par l'identité de l'entité, pas par l'indice : l'ordre de
				     jeu est modifié par insertion (une invocation se range derrière son
				     invocateur) et par retrait (une mort), ce qui décale toutes les
				     positions suivantes — et un diff par position les re-rendrait toutes. -->
				<v-tooltip v-for="entity of game.entityOrder" :key="entity.id" v-memo="[entity, Math.round(entity.displayLife / entity.maxLife * 100), entity.dead, entity.id === game.currentPlayer, entity === game.selectedEntity, entity === game.mouseEntity]" location="top">
					<template #activator="{ props }">
						<div :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :style="{background: entity === game.selectedEntity || entity === game.mouseEntity ? '#fffc' : (entity.id === game.currentPlayer ? entity.color : entity.gradient)}" class="entity" v-bind="props" @mouseenter="entity_enter(entity)" @mouseleave="entity_leave(entity)" @click="entity_click(entity)">
							<div v-if="!entity.dead" :style="{height: 'calc(6px + ' + Math.round(entity.displayLife / entity.maxLife * 100) + '%)', background: entity.lifeColor, 'border-color': entity.lifeColorLighter}" class="bar"></div>
							<div class="image">
								<img v-if="entity.summon" :src="'/' + summonImage(entity.bulbName)">
								<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="1" />
								<img v-else-if="(entity instanceof Chest)" :src="'/image/chest/' + entity.name + '.png'">
								<img v-else-if="(entity instanceof Mob)" :src="'/image/mob/' + entity.name + '.png'">
								<leek-image v-else :leek="entity" :scale="1" />
							</div>
						</div>
					</template>
					<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
					<span v-else-if="entity.summon">{{ entity.translatedName }}</span>
					<span v-else>{{ entity.name }}</span>
				</v-tooltip>
			</div>
		</Teleport>
		<!-- Les actions ont leur propre Teleport : dans l'éditeur, quand le lecteur est plus
		     haut que large, elles passent seules sous le combat et l'ordre reste sur la carte. -->
		<Teleport v-if="actionsTarget" :to="mobilePanels || 'body'" :disabled="!below">
			<!-- v-memo : le panneau n'a aucune raison de refabriquer son arbre de vnodes à
			     chaque rafraîchissement du lecteur, alors que rien n'y a bougé. -->
			<div v-if="!creator && game.showActions && (below || actionsWidth > 0)" ref="actionsRef" v-memo="[renderedLines, renderStart, renderEnd, followBottom, actionsWidth, game.largeActions, game.displayDebugs, game.displayAILines, dark, below]" class="fight-actions" :class="{large: game.largeActions && !below, scrolled: !followBottom, below, compact, dark}" :style="below ? undefined : {'width': game.largeActions ? actionsWidth + 'px' : '', 'max-width': game.largeActions ? Math.max(600, actionsWidth) + 'px' : ''}" @scroll.passive="onActionsScroll" @wheel.passive="onActionsWheel">
				<div v-if="renderStart > 0" class="load-marker">…</div>
				<!-- ⚠️ La clé va sur le `template`, pas sur les éléments internes : sinon la
				     liste est diffée SANS clés, donc par position — et comme la fenêtre
				     glisse d'un cran à chaque ligne qui arrive, chaque position change de
				     ligne et les quatre-vingts se re-rendent. -->
				<template v-for="line of renderedLines" :key="line.id">
					<component :is="ActionComponents[line.action.type]" v-if="line.action" :action="line.action" :leeks="game.leeks" />
					<div v-else-if="line.trophy" class="notif-trophy">
						<trophy-icon :code="line.trophy.name" />
						<i18n-t keypath="trophy.x_unlocks_t">
							<template #farmer>{{ line.trophy.farmer.name }}</template>
							<template #trophy>
								<b>{{ $t('trophy.' + line.trophy.name) }}</b>
							</template>
						</i18n-t>
					</div>
					<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
					<action-log v-else-if="game.displayDebugs && line.log" :log="(line.log as any)" :leeks="(game.leeks as any)" :action="0" :index="0" :lines="game.displayAILines" />
				</template>
				<div v-if="!followBottom && renderEnd < game.consoleLines.length" class="load-marker bottom">…</div>
			</div>
		</Teleport>
		<div v-if="!creator && !below && game.showActions && game.largeActions" class="resizer" :style="{left: actionsWidth + 'px'}" @mousedown="resizerMousedown"></div>
		<!-- Une seule instance, pas trois branches : chaque branche est un vnode distinct,
		     donc passer du poireau courant à celui qu'on survole démontait et remontait
		     tout le panneau — seize infobulles Vuetify et une image d'entité — à chaque
		     fois que la souris franchit le bord d'une entité, en jetant au passage le
		     cache de mémoïsation, qui vit sur l'instance. -->
		<entity-details v-if="detailsEntity" :entity="detailsEntity" :game="game" :tick="tick" :dark="dark" />
	</div>
</template>

<script setup lang="ts">
	import EntityDetails from '@/component/player/entity-details.vue'
	import ActionLeek from '@/component/report/action-leek.vue'
	import { ActionComponents as ActionComponentsTyped } from '@/model/action-components'
	import { summonImage } from '@/model/summon'
	import { Chest } from './game/chest'
	import { Mob } from './game/mob'
	import { Game } from './game/game'
	import { FightEntity } from './game/entity'
	import { Turret } from './game/turret'
	import TurretImage from '@/component/turret-image.vue'
	import ActionLog from '../report/report-log.vue'
	import type { Component } from 'vue'
	import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

	defineOptions({ name: 'Hud', components: { leek: ActionLeek } })

	const props = defineProps<{
		game: Game
		/**
		 * Compteur de rafraîchissement poussé par player.vue : le moteur n'est plus
		 * réactif, c'est ce compteur qui fait relire ses valeurs au hud (cf. player.vue).
		 */
		tick: number
		creator?: boolean
		/**
		 * Conteneur posé sous le lecteur par player.vue, où atterrissent l'ordre des poireaux
		 * et les actions en compact. Nul tant que le lecteur n'est pas monté.
		 */
		mobilePanels?: HTMLElement | null
		/**
		 * Actions sous le lecteur, dans `mobilePanels`, hors compact : l'éditeur le demande
		 * quand son panneau de combat est plus haut que large.
		 */
		actionsBelow?: boolean
		/** Disposition des petits écrans mobiles (cf. player.vue). */
		compact?: boolean
	}>()

	// En compact on attend le conteneur : un Teleport sans cible valide avertit et perd son
	// contenu. Sinon le Teleport est désactivé, il rend sur place, la cible est ignorée.
	const timelineTarget = computed(() => !props.compact || !!props.mobilePanels)
	/** Actions posées sous le lecteur plutôt qu'en surimpression. */
	const below = computed(() => props.compact || !!props.actionsBelow)
	const actionsTarget = computed(() => !below.value || !!props.mobilePanels)

	const ActionComponents: Record<number, Component> = ActionComponentsTyped

	const debug = ref(false)
	const actionsWidth = ref(395)

	const barWidth = computed(() => props.compact ? 300 : 500)
	// Teinte de nuit de la carte, lue six fois dans le gabarit. ⚠️ `void props.tick` :
	// le moteur est hors de la réactivité Vue (cf. player.vue), un computed qui ne
	// dépendrait que de lui se figerait sur sa première valeur.
	// Tant que la carte n'est pas créée (combat en chargement), on suit le réglage sombre
	// du lecteur : sans ça, les actions sous le lecteur passaient en clair en thème sombre.
	const dark = computed(() => { void props.tick; return props.game.map ? props.game.map.isDark : props.game.isDark() })
	/**
	 * Entité dont on montre les détails : survolée, sinon sélectionnée, sinon celle
	 * dont c'est le tour. Une seule instance de panneau pour les trois cas (cf. le
	 * gabarit), donc un changement de cible est une mise à jour, pas un remontage.
	 */
	const detailsEntity = computed(() => {
		void props.tick
		const game = props.game
		if (game.mouseEntity) { return game.mouseEntity }
		if (game.selectedEntity) { return game.selectedEntity }
		if (!props.compact && game.currentPlayer !== null && game.currentPlayer in game.leeks) { return game.leeks[game.currentPlayer] }
		return null
	})
	const totalLife = computed(() => { void props.tick; return props.game.leeks.reduce((total, e) => total + (!e.summon ? e.displayLife : 0), 0) })
	/** Barre de vie d'équipe : une seule boucle, pour que v-memo s'y applique. */
	const livingEntities = computed(() => { void props.tick; return props.game.teams.flat().filter(e => !e.dead) })
	actionsWidth.value = props.game.actionsWidth

	// Fenêtre de lignes réellement dans le DOM. Le panneau n'en montre que 5 à 15 à la
	// fois, et on recharge au défilement.
	// ⚠️ Ce plafond borne le nombre de NŒUDS, ce n'est pas un levier de performance :
	// le coût qu'il combattait (tout le panneau reconstruit à chaque ligne) venait
	// d'une clé de v-for mal placée, corrigée depuis. Vérifié à la mesure, 20, 80 ou
	// 250 lignes donnent les mêmes images par seconde — inutile de le descendre en
	// espérant y gagner.
	// Il était tombé à 80 le temps du mauvais diagnostic, et ça se payait au
	// défilement : on atteignait le haut de la fenêtre en cinq crans de molette, la
	// fenêtre glissait, et l'ancre ramenait la barre de défilement en arrière — un
	// tapis roulant. À 250 on ne l'atteint plus en relisant normalement.
	const MAX_WINDOW = 250
	const LOAD_CHUNK = 40
	const SCROLL_THRESHOLD = 80
	const PRELOAD_RATIO = 0.5
	const AT_EDGE_TOLERANCE = 5

	const actionsRef = ref<HTMLElement | null>(null)
	const followBottom = ref(true)
	const renderStart = ref(0)
	const renderEnd = ref(0)

	function windowBounds() {
		const length = props.game.consoleLines.length
		if (followBottom.value) {
			return { start: Math.max(0, length - MAX_WINDOW), end: length, length }
		}
		return { start: renderStart.value, end: renderEnd.value, length }
	}

	// Version du journal : incrémentée quand des lignes arrivent ou que la fenêtre
	// visible bouge. `renderedLines` n'en dépend QUE d'elle, pas du tick, sinon le
	// v-memo du panneau serait invalidé à chaque rafraîchissement.
	const linesVersion = ref(0)
	const renderedLines = computed(() => {
		void linesVersion.value
		const { start, end } = windowBounds()
		return props.game.consoleLines.slice(start, end)
	})

	// Coalescé dans une frame : lire scrollHeight force un recalcul de mise en page,
	// et l'arrivée d'une salve de lignes en déclenchait un par ligne (watcher +
	// ResizeObserver). Une seule fois par image suffit.
	let scrollScheduled = false
	function scrollToBottom() {
		if (scrollScheduled) return
		scrollScheduled = true
		requestAnimationFrame(() => {
			scrollScheduled = false
			// Relire followBottom ICI : entre la demande et l'image suivante, l'utilisateur
			// a pu remonter dans le journal (les événements de défilement passent avant),
			// et le ramener en bas de force annulerait aussi l'ancre de loadDirection.
			if (!followBottom.value) return
			const el = actionsRef.value
			if (el) el.scrollTop = el.scrollHeight
		})
	}

	watch(() => { void props.tick; return props.game.consoleLines.length }, (newLen) => {
		linesVersion.value++
		if (!followBottom.value) return
		renderEnd.value = newLen
		renderStart.value = Math.max(0, newLen - MAX_WINDOW)
		nextTick(scrollToBottom)
	})

	// `game.jump()` est entièrement synchrone : `jumping` passe true puis false dans le
	// même tour de boucle, aucun watcher ne peut voir la transition (le moteur n'est plus
	// réactif de toute façon). C'est donc le moteur qui nous appelle en fin de saut.
	function onJumpEnd() {
		linesVersion.value++
		followBottom.value = true
		resizeAnchor = null
		const len = props.game.consoleLines.length
		renderEnd.value = len
		renderStart.value = Math.max(0, len - MAX_WINDOW)
		nextTick(scrollToBottom)
	}

	watch(() => { void props.tick; return props.game.largeActions }, () => {
		if (followBottom.value) nextTick(scrollToBottom)
	})

	// Au resize (hover/leave, large mode, changement de contenu), on re-bottoms
	// si followBottom, sinon on restaure l'ancre visuelle capturée au scroll
	// pour éviter le décalage dû au re-wrapping du texte (largeur 395 → 600).
	let resizeObserver: ResizeObserver | null = null
	let resizeAnchor: Anchor | null = null
	onMounted(() => {
		// eslint-disable-next-line vue/no-mutating-props
		props.game.onJumpEnd = onJumpEnd
		nextTick(() => {
			const el = actionsRef.value
			if (!el) return
			scrollToBottom()
			resizeObserver = new ResizeObserver(() => {
				const target = actionsRef.value
				if (!target) return
				if (followBottom.value) {
					scrollToBottom()
				} else if (resizeAnchor) {
					restoreAnchor(target, resizeAnchor)
				}
			})
			resizeObserver.observe(el)
		})
	})
	onBeforeUnmount(() => {
		// eslint-disable-next-line vue/no-mutating-props
		if (props.game.onJumpEnd === onJumpEnd) props.game.onJumpEnd = null
		resizeObserver?.disconnect()
		resizeObserver = null
	})

	let loadingMore = false

	// Mémorise le DERNIER enfant visible (en bas du viewport) et son offset
	// par rapport au bas du viewport. Au resize/re-render on restaure cet item
	// au même bord bas → la vue réduite montre la queue de la vue agrandie.
	function captureAnchor(el: HTMLElement) {
		const prevScrollTop = el.scrollTop
		const viewportBottom = prevScrollTop + el.clientHeight
		for (let i = el.children.length - 1; i >= 0; i--) {
			const child = el.children[i] as HTMLElement
			if (child.offsetTop < viewportBottom) {
				return {
					index: i,
					offsetFromBottom: viewportBottom - (child.offsetTop + child.offsetHeight),
					prevScrollTop,
				}
			}
		}
		return { index: -1, offsetFromBottom: 0, prevScrollTop }
	}

	type Anchor = ReturnType<typeof captureAnchor>

	function restoreAnchor(el: HTMLElement, anchor: Anchor, indexShift = 0) {
		const target = anchor.index >= 0 ? el.children[anchor.index + indexShift] as HTMLElement | undefined : undefined
		if (target) {
			const newViewportBottom = (target.offsetTop + target.offsetHeight) + anchor.offsetFromBottom
			el.scrollTop = Math.max(0, newViewportBottom - el.clientHeight)
		} else {
			el.scrollTop = anchor.prevScrollTop
		}
	}

	function loadDirection(direction: -1 | 1) {
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		if (direction < 0 ? w.start <= 0 : w.end >= w.length) return
		loadingMore = true
		const anchor = captureAnchor(el)
		let newStart = w.start
		let newEnd = w.end
		if (direction < 0) {
			newStart = Math.max(0, w.start - LOAD_CHUNK)
			if (newEnd - newStart > MAX_WINDOW) newEnd = newStart + MAX_WINDOW
			followBottom.value = false
		} else {
			newEnd = Math.min(w.length, w.end + LOAD_CHUNK)
			if (newEnd - newStart > MAX_WINDOW) newStart = newEnd - MAX_WINDOW
		}
		const indexShift = w.start - newStart
		renderStart.value = newStart
		renderEnd.value = newEnd
		nextTick(() => {
			const el2 = actionsRef.value
			if (el2) {
				restoreAnchor(el2, anchor, indexShift)
				// Les indices dans inner.children ont shifté : on re-capture pour
				// que le prochain ResizeObserver (hover/leave) restaure
				// correctement la position.
				if (!followBottom.value) resizeAnchor = captureAnchor(el2)
			}
			loadingMore = false
		})
	}

	function onActionsScroll() {
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		const preloadThreshold = Math.max(SCROLL_THRESHOLD, el.clientHeight * PRELOAD_RATIO)
		const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
		const nearTop = el.scrollTop < preloadThreshold
		const nearBottom = distanceFromBottom < preloadThreshold
		const atBottom = distanceFromBottom < SCROLL_THRESHOLD

		if (nearTop && w.start > 0) return loadDirection(-1)
		if (nearBottom && w.end < w.length) return loadDirection(1)

		if (atBottom && w.end >= w.length && !followBottom.value) {
			followBottom.value = true
			resizeAnchor = null
			renderEnd.value = w.length
			renderStart.value = Math.max(0, w.length - MAX_WINDOW)
			nextTick(scrollToBottom)
			return
		}

		if (followBottom.value && !atBottom) {
			followBottom.value = false
			renderStart.value = w.start
			renderEnd.value = w.end
		}

		if (!followBottom.value) resizeAnchor = captureAnchor(el)
	}

	function onActionsWheel(e: WheelEvent) {
		// MAX_WINDOW saturé + trim symétrique → scrollHeight constant, scrollTop
		// reste collé au bord → plus d'événement scroll. Le wheel reste actif.
		if (loadingMore) return
		const el = actionsRef.value
		if (!el) return
		const w = windowBounds()
		if (e.deltaY < 0) {
			if (el.scrollTop > AT_EDGE_TOLERANCE || w.start <= 0) return
			loadDirection(-1)
		} else {
			if (el.scrollHeight - el.scrollTop - el.clientHeight > AT_EDGE_TOLERANCE || w.end >= w.length) return
			loadDirection(1)
		}
	}

	function entity_enter(entity: FightEntity) {
		// eslint-disable-next-line vue/no-mutating-props
		props.game.hoverEntity = entity
		props.game.hoverEntity!.updateReachableCells()
	}
	function entity_leave(_entity: FightEntity) {
		// eslint-disable-next-line vue/no-mutating-props
		props.game.hoverEntity = null
	}
	function entity_click(entity: FightEntity) {
		props.game.selectEntity(entity)
	}

	function resizerMousedown(e: MouseEvent) {
		const startWidth = actionsWidth.value
		const startX = e.clientX
		const visible = actionsWidth.value > 0
		const mousemove = (ev: MouseEvent) => {
			let panelWidth = Math.max(0, Math.min(1000, startWidth + ev.clientX - startX))
			if (visible && panelWidth < 60) {
				panelWidth = 0
			}
			actionsWidth.value = panelWidth
		}
		const mouseup = () => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
			// eslint-disable-next-line vue/no-mutating-props
			props.game.actionsWidth = actionsWidth.value
			if (props.game.actionsWidth === 0) {
				// eslint-disable-next-line vue/no-mutating-props
				props.game.largeActions = false
				actionsWidth.value = 395
			}
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

</script>

<style lang="scss" scoped>
	.hud {
		color: #111;
	}
	.timeline {
		position: absolute;
		bottom: 5px;
		left: 400px; right: 400px;
		text-align: center;
		white-space: nowrap;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 2px;
		&.large {
			left: 0;
		}
	}
	// Sous le lecteur : plus de positionnement absolu, et l'ordre défile
	// horizontalement quand les entités ne tiennent pas dans la largeur de l'écran.
	.timeline.compact {
		position: static;
		justify-content: safe center;
		overflow-x: auto;
		padding: 0 4px;
		background: var(--background);
		// Vignettes réduites : à la taille du bureau, un combat d'éleveur (8 poireaux)
		// déborde dès 410 px de large et l'ordre de jeu ne se lit plus d'un coup d'œil.
		// À cette taille, dix entités tiennent sur l'écran d'un téléphone courant.
		.entity {
			flex: 0 0 40px;
			height: 62px;
			&.current:before {
				left: calc(50% - 11px);
				top: -6px;
				width: 22px;
				height: 12px;
			}
			.image svg, .image img {
				max-width: 30px;
				max-height: 48px;
			}
			&.summon {
				flex: 0 0 32px;
				height: 40px;
				&.current {
					width: 33px;
					height: 41px;
				}
				img {
					max-width: 22px;
					max-height: 32px;
				}
			}
		}
	}
	.timeline .entity {
		display: inline-flex;
		vertical-align: bottom;
		flex: 0 1 65px;
		height: 100px;
		min-width: 0;
		padding: 3px 0;
		position: relative;
		border-top-left-radius: var(--radius-small);
		border-top-right-radius: var(--radius-small);
		align-items: flex-end;
		cursor: pointer;
		min-width: 0;
		&.current:before {
			content: "";
			position: absolute;
			left: calc(50% - 18px);
			top: -10px;
			width: 36px;
			height: 20px;
			background-image: url('../../../public/image/fight/arrow.svg');
			background-size: cover;
		}
	}
	.timeline .entity.dead {
		opacity: 0.3;
	}
	.timeline .entity .bar {
		flex: 7px 0 0;
		border-top-left-radius: var(--radius-small);
		border: 1px solid var(--black);
		margin-top: -3px;
		margin-bottom: -3px;
	}
	.timeline .entity .image {
		max-width: 100%;
		max-height: 100%;
		overflow: hidden;
		padding: 0 4px;
	}
	.timeline .entity .image svg, .timeline .entity .image img {
		max-width: 50px;
		max-height: 80px;
	}
	.timeline .entity.summon {
		flex: 0 1 50px;
		height: 60px;
	}
	.timeline .entity.summon.current {
		width: 51px;
		height: 61px;
	}
	.timeline .entity.summon .bar {
		margin-right: 4px;
	}
	.timeline .entity.summon img {
		max-width: 30px;
		max-height: 50px;
	}
	.timeline .entity:hover .details, .details.visible {
		display: block;
	}
	.life-bar {
		position: absolute;
		top: 0; left: 0; right: 0;
		text-align: center;
	}
	.hud.compact .life-bar {
		transform: scale(0.7);
		transform-origin: top;
	}
	.life-bar .wrapper {
		display: inline-block;
		background: #fffa;
		border-bottom-left-radius: var(--radius-pill);
		border-bottom-right-radius: var(--radius-pill);
		padding-top: 3px;
		padding-left: 4px;
		padding-bottom: 0px;
		padding-right: 1px;
		height: 16px;
	}
	.hud.dark .life-bar .wrapper {
		background: #000a;
	}
	.life-bar .bar {
		display: inline-block;
		margin-right: 3px;
		height: calc(100% - 3px);
		vertical-align: top;
	}
	.life-bar .bar.dead {
		margin-right: 0px;
	}
	.life-bar .wrapper :first-of-type {
		border-bottom-left-radius: var(--radius-large);
	}
	.life-bar .wrapper :last-of-type {
		border-bottom-right-radius: var(--radius-large);
	}
	.fight-actions {
		text-align: left;
		max-height: 100px;
		width: 395px;
		overflow: hidden;
		overscroll-behavior: contain;
		position: absolute;
		background: var(--white);
		border-top-right-radius: var(--radius);
		box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
		left: 0;
		bottom: 5px;
		padding: 6px;
		padding-bottom: 10px;
		display: flex;
		flex-direction: column;
		// `margin-top: auto` sur le 1er enfant équivaut à `min-height: 100%` sur
		// un wrapper : quand le contenu rentre, le bloc s'absorbe l'espace
		// libre et pousse les items en bas. Quand ça déborde, ce margin se
		// résorbe à 0 et le contenu fluit naturellement, donc `scrollHeight`
		// reste correct (pas de bug Chromium comme avec `justify-content: flex-end`).
		& > *:first-child {
			margin-top: auto;
		}
		// Les lignes sont des items de ce flex : dès que la liste déborde, elles
		// sont candidates au rétrécissement. Les lignes ordinaires y échappent
		// parce que leur `min-height: auto` vaut la hauteur de leur contenu,
		// mais celle du trophée porte `overflow: hidden` (le reflet du thème v3),
		// ce qui ramène ce minimum automatique à zéro : elle était écrasée à ses
		// 8px de padding, rognant l'icône de 36px et le texte.
		& > * {
			flex-shrink: 0;
		}
		&::-webkit-scrollbar {
			width: 4px;
		}
		&:not(.large) {
			&:not(.below):hover {
				max-height: calc(100% - 5px);
				height: auto;
				width: 600px !important;
				background-color: #f2f2f2ee;
				border-top-right-radius: 0;
				overflow-y: auto;
			}
			.log {
				width: 600px;
			}
		}
		&.large {
			height: calc(100% - 5px);
			max-height: calc(100% - 5px);
			max-width: 1000px;
			border-top-right-radius: 0;
			background-color: var(--white);
			overflow-y: auto;
			&:hover {
				width: max(100%, 600px) !important;
				background-color: #f2f2f2dd;
			}
		}
		& > div:not(.load-marker) {
			font-size: 14px;
			width: max(588px, 100%);
		}
		& > pre {
			width: max(588px, 100%);
		}
		.load-marker {
			text-align: center;
			color: var(--grey-7);
			font-size: 12px;
			padding: 4px 0;
			user-select: none;
		}
	}
	// Idem pour les actions : hauteur fixe et défilement propre, la page se charge du reste.
	.fight-actions.below {
		position: static;
		width: auto;
		max-width: none;
		overflow-y: auto;
		border-top-right-radius: 0;
		box-shadow: none;
		border-top: 1px solid var(--border);
		& > div:not(.load-marker), & > pre {
			width: auto;
		}
		&.compact {
			max-height: 200px;
		}
		// Éditeur : le conteneur fixe la hauteur, le panneau la remplit.
		&:not(.compact) {
			flex: 1;
			min-height: 0;
			max-height: none;
			.log {
				width: auto;
			}
		}
	}
	.resizer {
		position: absolute;
		width: 30px;
		margin-left: -15px;
		bottom: 0;
		top: 0;
		cursor: ew-resize;
		z-index: 5;
		user-select: none;
		&:hover {
			background: #7773;
		}
	}
	// Carte sombre : la classe est portée par le bloc lui-même et non par le hud, parce
	// qu'en compact il est téléporté hors du hud. Le sélecteur descendant reste,
	// pour les cas où le bloc est rendu sur place.
	.hud.dark .fight-actions, .fight-actions.dark {
		background-color: var(--grey-1);
		color: var(--grey-13);
		&:hover {
			background-color: #222d;
		}
	}
	.debug {
		position: absolute;
		top: 0;
		left: 0;
		text-align: left;
		background: rgba(255,255,255,0.9);
		padding: 5px;
		pointer-events: none;
	}
	.pause {
		color: var(--grey-8);
	}
	.warning {
		color: #ff5f00;
	}
	.error {
		color: #ff1900;
	}
	.notif-trophy {
		color: var(--black);
		padding: 4px;
		display: flex;
		align-items: center;
		white-space: nowrap;
		gap: 6px;
		margin: 5px 0;
		img {
			// Une quarantaine d'icônes de trophée ne sont pas carrées (blitzkrieg va jusqu'à
			// 1:2,4) : sans hauteur, la ligne s'étirait à 94px. object-fit pour ne pas les
			// déformer, comme trophies.vue.
			width: 36px;
			height: 36px;
			object-fit: contain;
		}
	}
	.hud.compact .details-wrapper {
		transform: scale(0.5);
		transform-origin: bottom right;
	}
</style>