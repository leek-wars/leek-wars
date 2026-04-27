<template>
	<div class="hud" :class="{dark: game.autoDark ? (game.map && game.map.options.dark) : game.dark}">
		<div v-if="!creator" class="life-bar">
			<div class="wrapper">
				<template v-for="team in game.teams">
					<v-tooltip v-for="entity in team.filter(e => !e.dead)" :key="entity.id" top>
						<template #activator="{ props }">
							<div :style="{background: entity.lifeBarGadient, width: Math.max(1, barWidth * (entity.displayLife / totalLife) - 3) + 'px'}" class="bar" v-bind="props"></div>
						</template>
						<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
						<span v-else>{{ entity.name }}</span>
						({{ Math.round(entity.displayLife) }})
					</v-tooltip>
				</template>
			</div>
		</div>
		<div v-if="debug" class="debug">
			<div>Particles : {{ game.particles.particles.length }}</div>
			<div>Mouse : ({{ game.mouseX }}, {{ game.mouseY }})</div>
			<div>Mouse tile : ({{ game.mouseTileX }}, {{ game.mouseTileY }})</div>
			<div>Mouse cell : <span v-if="game.mouseCell">{obstacle: {{ game.mouseCell.obstacle }}, entity: <span v-if="game.mouseCell.entity">{{ game.mouseCell.entity.name }}</span>, id: {{ game.mouseCell.id }}, x: {{ game.mouseCell.x }}, y: {{ game.mouseCell.y }}}</span></div>
			<div>FPS : {{ game.fps }}, avg: {{ game.avgFPS }}</div>
			<div>Resources : {{ game.numData }}</div>
		</div>
		<div v-if="!creator && !LeekWars.mobile" class="timeline" :class="{large: !game.showActions}" :style="{left: (game.showActions ? (game.largeActions ? actionsWidth + 5 : 400) : 0) + 'px'}">
			<v-tooltip v-for="(entity, e) of game.entityOrder" :key="e" location="top">
				<template #activator="{ props }">
					<div :class="{summon: entity.summon, current: entity.id === game.currentPlayer, dead: entity.dead}" :style="{background: entity === game.selectedEntity || entity === game.mouseEntity ? '#fffc' : (entity.id === game.currentPlayer ? entity.color : entity.gradient)}" class="entity" v-bind="props" @mouseenter="entity_enter(entity)" @mouseleave="entity_leave(entity)" @click="entity_click(entity)">
						<div v-if="!entity.dead" :style="{height: 'calc(6px + ' + ((entity.displayLife / entity.maxLife) * 100) + '%)', background: entity.lifeColor, 'border-color': entity.lifeColorLighter}" class="bar"></div>
						<div class="image">
							<img v-if="entity.summon" :src="'/image/bulb/' + entity.bulbName + '_front.png'">
							<turret-image v-else-if="(entity instanceof Turret)" :level="entity.level" :skin="entity.team" :scale="1" />
							<img v-else-if="(entity instanceof Chest)" :src="'/image/chest/' + entity.name + '.png'">
							<img v-else-if="(entity instanceof Mob)" :src="'/image/mob/' + entity.name + '.png'">
							<leek-image v-else :leek="entity" :scale="1" />
						</div>
					</div>
				</template>
				<span v-if="entity instanceof Mob">{{ $t('entity.' + entity.name) }}</span>
				<span v-else>{{ entity.name }}</span>
			</v-tooltip>
		</div>
		<div v-if="!creator && !LeekWars.mobile && game.showActions && actionsWidth > 0" ref="actions" class="fight-actions" :class="{large: game.largeActions}" :style="{'width': game.largeActions ? actionsWidth + 'px' : null, 'max-width': game.largeActions ? Math.max(600, actionsWidth) + 'px' : null}">
			<template v-for="line of game.consoleLines">
				<component :is="ActionComponents[line.action.type]" v-if="line.action" :key="line.id" :action="line.action" :leeks="game.leeks" />
				<div v-else-if="line.trophy" :key="line.id" class="notif-trophy">
					<img :src="'/image/trophy/' + line.trophy.name + '.svg'">
					<i18n-t keypath="trophy.x_unlocks_t">
						<template #farmer>{{ line.trophy.farmer.name }}</template>
						<template #trophy>
							<b>{{ $t('trophy.' + line.trophy.name) }}</b>
						</template>
					</i18n-t>
				</div>
				<action-log v-else-if="game.displayDebugs && line.log" :key="'_' + line.id" :log="line.log" :leeks="game.leeks" :action="0" :index="0" :lines="game.displayAILines" />
			</template>
		</div>
		<div v-if="!creator && game.showActions && game.largeActions" class="resizer" :style="{left: actionsWidth + 'px'}" @mousedown="resizerMousedown"></div>
		<entity-details v-if="game.mouseEntity" :entity="game.mouseEntity" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
		<entity-details v-else-if="game.selectedEntity" :entity="game.selectedEntity" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
		<entity-details v-else-if="!LeekWars.mobile && game.currentPlayer in game.leeks" :entity="game.leeks[game.currentPlayer]" :game="game" :dark="game.autoDark ? (game.map && game.map.options.dark) : game.dark" />
	</div>
</template>

<script setup lang="ts">
	import EntityDetails from '@/component/player/entity-details.vue'
	import ActionLeek from '@/component/report/action-leek.vue'
	import { ActionComponents as ActionComponentsTyped } from '@/model/action-components'
	import { LeekWars } from '@/model/leekwars'
	import { Chest } from './game/chest'
	import { Mob } from './game/mob'
	import { Game } from './game/game'
	import { Turret } from './game/turret'
	import TurretImage from '@/component/turret-image.vue'
	import ActionLog from '../report/report-log.vue'
	import router from '@/router'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'hud', components: { leek: ActionLeek } })

	const props = defineProps<{
		game: Game
		creator?: boolean
	}>()

	const ActionComponents: Record<number, any> = ActionComponentsTyped

	const debug = ref(false)
	const actionsWidth = ref(395)

	const barWidth = computed(() => LeekWars.mobile ? 300 : 500)
	const totalLife = computed(() => props.game.leeks.reduce((total, e) => total + (!e.summon ? e.displayLife : 0), 0))
	const darkEnabledtest = computed(() => props.game.dark)
	const dark = computed(() => props.game.autoDark ? (props.game.map && props.game.map.options.dark) : props.game.dark)
	const leeks = computed(() => props.game.leeks)

	actionsWidth.value = props.game.actionsWidth

	function entity_enter(entity: any) {
		props.game.hoverEntity = entity
		props.game.hoverEntity!.updateReachableCells()
	}
	function entity_leave(entity: any) {
		props.game.hoverEntity = null
	}
	function entity_click(entity: any) {
		props.game.selectEntity(entity)
	}

	function formatTurns(turns: number) {
		return turns === -1 ? '∞' : turns
	}

	function resizerMousedown(e: MouseEvent) {
		const startWidth = actionsWidth.value
		const startX = e.clientX
		const visible = actionsWidth.value > 0
		const mousemove: any = (ev: MouseEvent) => {
			let panelWidth = Math.max(0, Math.min(1000, startWidth + ev.clientX - startX))
			if (visible && panelWidth < 60) {
				panelWidth = 0
			}
			actionsWidth.value = panelWidth
		}
		const mouseup: any = (ev: MouseEvent) => {
			document.documentElement!.removeEventListener('mousemove', mousemove)
			document.documentElement!.removeEventListener('mouseup', mouseup)
			props.game.actionsWidth = actionsWidth.value
			if (props.game.actionsWidth === 0) {
				props.game.largeActions = false
				actionsWidth.value = 395
			}
		}
		document.documentElement!.addEventListener('mousemove', mousemove, false)
		document.documentElement!.addEventListener('mouseup', mouseup, false)
		e.preventDefault()
	}

	function goToAI(file: number, line: number, log: any) {
		router.push('/editor/' + file + '?line=' + line)
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
	.timeline .entity {
		display: inline-flex;
		vertical-align: bottom;
		flex: 0 1 65px;
		height: 100px;
		min-width: 0;
		padding: 3px 0;
		position: relative;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
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
		border-top-left-radius: 3px;
		border: 1px solid black;
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
	#app.app .life-bar {
		transform: scale(0.7);
		transform-origin: top;
	}
	.life-bar .wrapper {
		display: inline-block;
		background: #fffa;
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
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
		border-bottom-left-radius: 10px;
	}
	.life-bar .wrapper :last-of-type {
		border-bottom-right-radius: 10px;
	}
	.fight-actions {
		text-align: left;
		max-height: 100px;
		width: 395px;
		overflow: hidden;
		position: absolute;
		background: #fff;
		border-top-right-radius: 5px;
		box-shadow: 0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12);
		left: 0;
		bottom: 5px;
		padding: 6px;
		padding-bottom: 10px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		&::-webkit-scrollbar {
			width: 4px;
		}
		&:not(.large) {
			&:hover {
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
			background-color: #fff;
			overflow-y: auto;
			&:hover {
				width: max(100%, 600px) !important;
				background-color: #f2f2f2dd;
			}
		}
		& > div {
			padding: 1px 0;
			font-size: 14px;
			width: max(588px, 100%);
		}
		pre {
			width: max(588px, 100%);
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
	.hud.dark {
		.fight-actions {
			background-color: #222;
			color: #eee;
			&:hover {
				background-color: #222d;
			}
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
		color: #999;
	}
	.warning {
		color: #ff5f00;
	}
	.error {
		color: #ff1900;
	}
	.notif-trophy {
		color: black;
		padding: 4px;
		display: flex;
		align-items: center;
		white-space: nowrap;
		gap: 6px;
		margin: 5px 0;
		img {
			width: 36px;
		}
	}
	#app.app .details-wrapper {
		transform: scale(0.5);
		transform-origin: bottom right;
	}
</style>