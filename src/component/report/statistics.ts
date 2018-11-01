import { ActionType } from '@/model/action'
import { EffectType } from '@/model/effect'
import { Fight } from "@/model/fight"

class Statistics {
	static generate(fight: Fight) {
		const statistics: any = {}
		const leeks: {[key: number]: any} = {}
		const life: {[key: number]: any} = {}

		for (const leek of fight.data.leeks) {
			leeks[leek.id] = {
				leek,
				alive         : true,
				name          : leek.name,
				level         : leek.level,
				dmg_in        : 0,
				dmg_out       : 0,
				heal_in       : 0,
				heal_out      : 0,
				kills         : 0,
				usedPT        : 0,
				usedPTperTurn : 0,
				usedPM        : 0,
				roundsPlayed  : 0,
				actionsWeapon : 0,
				actionsChip   : 0,
				invocation    : 0,
				resurrection  : 0,
				critical      : 0,
				crashes       : 0,
				life          : leek.life,
				next_ph_queue : [],	// Whenever we receive a poison or vaccine we add it to a queue for the next turn.
				ph_queue : [] // When it is our turn, we will receive damage or healing in the same order as in this queue.
			}
		}
		life[0] = {}
		for (const j in leeks) {
			life[0][j] = leeks[j].life
		}
		let currentPlayer = 0
		let currentTurn = 1

		for (const action of fight.data.actions) {
			const type = action[0]
			switch (type) {
				case ActionType.NEW_TURN:
					life[action[1] - 1] = {}
					for (const j in leeks) {
						life[action[1] - 1][j] = leeks[j].life
					}
					currentTurn = action[1]
					break
				case ActionType.LEEK_TURN:
					leeks[action[1]].roundsPlayed++
					currentPlayer = action[1]
					leeks[currentPlayer].ph_queue = leeks[currentPlayer].next_ph_queue
					leeks[currentPlayer].next_ph_queue = []
				break
				case ActionType.MP_LOST:
					leeks[action[1]].usedPM += action[2]
					break
				case ActionType.CARE:
					leeks[action[1]].heal_in += action[2]
					if (leeks[currentPlayer].ph_queue.length === 0) {
						leeks[currentPlayer].heal_out += action[2]
					} else {
						const effectCare = leeks[currentPlayer].ph_queue.shift()
						leeks[effectCare.caster].heal_out += action[2]
						leeks[currentPlayer].next_ph_queue.push(effectCare)
					}
					leeks[action[1]].life += action[2]
					break
				case ActionType.BOOST_VITA:
					leeks[action[1]].heal_in += action[2]
					leeks[currentPlayer].heal_out += action[2]
					leeks[action[1]].life += action[2]
					break
				case ActionType.LIFE_LOST:
					leeks[action[1]].dmg_in += action[2]
					if (leeks[currentPlayer].ph_queue.length === 0) {
						leeks[currentPlayer].dmg_out += action[2]
					} else {
						const effect = leeks[currentPlayer].ph_queue.shift()
						leeks[effect.caster].dmg_out += action[2]
						leeks[currentPlayer].next_ph_queue.push(effect)
					}
					leeks[action[1]].life -= action[2]
					break
				case ActionType.TP_LOST:
					leeks[action[1]].usedPT += action[2]
					break
				case ActionType.PLAYER_DEAD:
					leeks[action[1]].alive = false
					const killer = action.length > 2 ? action[2] : currentPlayer
					if (killer in leeks) { leeks[killer].kills++ }
					leeks[action[1]].life = 0
					break
				case ActionType.USE_WEAPON:
					leeks[action[1]].actionsWeapon++
					if (action[4] === 2) { // CC
						leeks[action[1]].critical++
					}
					break
				case ActionType.USE_CHIP:
					leeks[action[1]].actionsChip++
					if (action[4] === 2) { // CC
						leeks[action[1]].critical++
					}
					break
				case ActionType.SUMMON:
					leeks[action[1]].invocation++
					break
				case ActionType.RESURRECTION:
					leeks[action[2]].resurrection++
					leeks[action[2]].life = action[4]
					break
				case ActionType.BUG:
					leeks[action[1]].crashes++
					break
				case ActionType.ADD_WEAPON_EFFECT:
				case ActionType.ADD_CHIP_EFFECT:
					// These actions are of the form
					// [actionType, itemID, effectID, caster, target, effect, value, turns]
					// The effectID is unique and allows us to keep track of it easily
					if (action[5] === EffectType.POISON || action[5] === EffectType.HEAL) {
						leeks[action[4]].next_ph_queue.push({id : action[2], caster : action[3]})
					}
					break
				case ActionType.REMOVE_EFFECT:
					// This action is of the form [actionType, effectID]
					// Wether through Antidote, Liberation, or end of lifetime
					// we have to remove vaccine or poison from our queues.
					const id = action[1]
					for (const j in leeks) {
						leeks[j].ph_queue = leeks[j].ph_queue.filter((e: any) => e.id !== id)
						leeks[j].next_ph_queue = leeks[j].next_ph_queue.filter((e: any) => e.id !== id)
					}
					break
			}
		}
		life[currentTurn] = {}
		for (const j in leeks) {
			const leek = leeks[j]
			life[currentTurn][j] = leeks[j].life
			leek.usedPTperTurn = Math.round(leek.usedPT / leek.roundsPlayed * 10) / 10
			leek.summons = []
			if (leek.leek.summon) {
				leeks[leek.leek.owner].summons.push(leek)
			}
		}
		statistics.leeks = leeks
		statistics.life = life
		statistics.team1 = []
		statistics.team2 = []
		statistics.best = []

		for (const l in leeks) {
			const leek = leeks[l]
			if (leek.leek.summon) { continue }
			if (fight.winner === 0) {
				if (leek.leek.team === 1) { statistics.team1.push(leek) }
				else { statistics.team2.push(leek) }
			} else {
				if (leek.leek.team === fight.winner) { statistics.team1.push(leek) }
				else { statistics.team2.push(leek) }
			}
		}
		return statistics
	}
}

export { Statistics }