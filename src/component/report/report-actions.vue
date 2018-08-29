<template>
	<div>
		<!-- {{ resetCounter() }} -->
		<action v-for="(action, a) in actions" :key="a" :action="action" :leeks="leeks" :turn="turn" class="action" />
	</div>
</template>

<script lang="ts">
	import ActionElement from '@/component/player/action.vue'
	import { Action } from '@/component/player/game/action'
	import { FightLeek } from '@/component/player/game/fight'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: "actions", components: { action: ActionElement } })
	export default class ActionsElement extends Vue {
		@Prop({required: true}) actions!: number[][]
		@Prop({required: true}) leeks!: {[key: number]: any}
		turn: number = 1

		resetCounter() {
			this.turn = 1
		}
		turnCounter(action: any) {
			if (action[0] === Action.NEW_TURN) { this.turn++ }
		}

	// 	var next = function(data, logs) {
	// 		var weaponsNames = []
	// 		var chipsNames = []
	// 		var turn = 0
	// 		var html = ""

	// 		for (var a in data.actions) {

	// 			// Logs personnels ?
	// 			if (logs != null && a in logs) {

	// 				actionLogs = logs[a]

	// 				for (var l in actionLogs) {

	// 					var log = actionLogs[l]
	// 					leek = log[0]
	// 					type = log[1]

	// 					if (type == 1 || type == 2 || type == 3) {

	// 						var clazz = ""
	// 						if (log[1] == 2) clazz = "warning"
	// 						else if (log[1] == 3) clazz = "error"

	// 						if (l == 0) clazz += " first"
	// 						if (l == logs.length - 1) clazz += " last"

	// 						var color = log.length > 3 ? _.colorToHex(log[3]) : '';

	// 						// TODO à tester
	// 						html += "<pre class='log " + clazz + "'> [" + leeks[leek].name + "] <span style='color: " + color + "'>" + log[2] + "</span></pre>"

	// 					} else if (type == 5) { // Pause

	// 						html += "<pre class='log pause'> [" + leeks[leek].name + "] " + "<i>pause()</i>" + "</pre>"
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	}
</script>

	