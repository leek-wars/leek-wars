<template>
	<div class="actions">
		<template v-for="line of game.consoleLines">
			<action-element v-if="line.action" :key="line.id" :action="line.action" :leeks="game.leeks" :display-logs="true" turn="1" class="action" />
			<pre v-else :key="line.id" :class="logClass(line.log)" :style="{color: logColor(line.log)}" class="log">[<leek :leek="game.leeks[line.log[0]]" />] {{ logText(line.log) }}</pre>
		</template>
	</div>
</template>

<script lang="ts">
	import EntityDetails from '@/component/player/entity-details.vue'
	import ActionLeekElement from '@/component/report/action-leek.vue'
	import ActionElement from '@/component/report/action.vue'
	import { Effect, EffectType } from '@/model/effect'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Game } from './game/game'

	@Component({ name: 'player-actions', components: { ActionElement, EntityDetails, leek: ActionLeekElement } })
	export default class PlayerActions extends Vue {
		@Prop({required: true}) game!: Game

		logClass(log: any[]) {
			if (log[1] === 2 || log[1] === 7) { return "warning" }
			else if (log[1] === 3 || log[1] === 8) { return "error" }
			else if (log[1] === 5) { return "pause" }
		}
		logColor(log: any[]) {
			return log.length > 3 ? LeekWars.colorToHex(log[3]) : ''
		}
		logText(log: any[]) {
			if (log[1] === 5) {	return "pause()" }
			if (log[1] >= 6 && log[1] <= 8) { return log[2] + i18n.t('leekscript.' + log[3], log[4]) }
			return log[2]
		}
	}
</script>

<style lang="scss" scoped>
	.actions {
		text-align: left;
		padding: 6px;
		overflow-y: auto;
		flex: 1;
	}
	.actions .action {
		padding: 1px 0;
		font-size: 14px;
	}
	.log {
		padding: 2px 0;
		font-size: 11px;
		margin: 0;
		font-family: monospace;
		word-break: break-all;
		white-space: pre-wrap;
		width: 600px;
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
</style>