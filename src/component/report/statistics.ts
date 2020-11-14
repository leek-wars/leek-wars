import { ActionType } from '@/model/action'
import { Cell } from '@/model/cell'
import { EffectType, EntityEffect } from '@/model/effect'
import { Entity } from '@/model/entity'
import { Field } from '@/model/field'
import { Fight, FightLeek } from "@/model/fight"
import { LeekWars } from '@/model/leekwars'

class StatisticsEntity extends Entity {
	public leek!: FightLeek
	public alive: boolean = true
	public name!: string
	public level!: number
	public team!: number

	public tp: number = 0
	public mp: number = 0
	public strength: number = 0
	public agility: number = 0
	public wisdom: number = 0
	public resistance: number = 0
	public magic: number = 0
	public science: number = 0
	public relativeShield: number = 0
	public absoluteShield: number = 0
	public damageReturn: number = 0

	public effects: {[key: number]: EntityEffect} = {}
	public launched_effects: {[key: number]: EntityEffect} = {}

	// Damage stats
	public dmg_in: number = 0
	public dmg_out: number = 0
	public direct_dmg_in: number = 0
	public direct_dmg_out: number = 0
	public poison_in: number = 0
	public poison_out: number = 0
	public nova_in: number = 0
	public nova_out: number = 0
	public return_in: number = 0
	public return_out: number = 0
	public life_dmg_in: number = 0
	public life_dmg_out: number = 0

	// Heal stats
	public heal_in: number = 0
	public heal_out: number = 0
	public life_steal_in: number = 0
	public life_steal_out: number = 0
	public max_life_in: number = 0
	public max_life_out: number = 0
	public antidote: number = 0

	// Tank stats
	public tank: number = 0

	// Other stats
	public operations: number = 0
	public ops_format: string = ''
	public operations_per_turn: number = 0
	public ops_per_turn_format: string = ''
	public kills: number = 0
	public usedPT: number = 0
	public usedPTperTurn: number = 0
	public usedPM: number = 0
	public roundsPlayed: number = 0
	public actionsWeapon: number = 0
	public actionsChip: number = 0
	public invocation: number = 0
	public resurrection: number = 0
	public critical: number = 0
	public crashes: number = 0
	public life!: number
	public max_life!: number
	public walkedCells: Set<number> = new Set<number>()
	public summons: StatisticsEntity[] = []

	constructor(leek: FightLeek) {
		super()
		this.leek = leek
		this.name = leek.name
		this.level = leek.level
		this.team = leek.team
		this.life = leek.life
		this.max_life = leek.life
		this.walkedCells.add(leek.cellPos)
	}

	public move(cell: Cell) {
		if (this.cell) {
			this.cell.entity = null
		}
		this.cell = cell
		cell.entity = this
	}
}

enum StatisticsState {
	BEGIN_TURN, USE_ITEM, ITEM_DAMAGE, ITEM_LIFE_STEAL, ITEM_DAMAGE_RETURN
}

class FightStatistics {

	public kills: number = 0
	public bullets: number = 0
	public usedChips: number = 0
	public summons: number = 0
	public damages: number = 0
	public heal: number = 0
	public distance: number = 0
	public stackOverflow: number = 0
	public errors: number = 0
	public resurrects: number = 0
	public damagePoison: number = 0
	public damageReturn: number = 0
	public criticalHits: number = 0
	public tpUsed: number = 0
	public mpUsed: number = 0
	public operations: number = 0
	public says: number = 0
	public saysLength: number = 0
	public entities: {[key: number]: StatisticsEntity} = {}
	public lives_raw: any[][][][] = []
	public lives: any[][] = []
	public lives_percent: any[][] = []
	public lives_turns: boolean[] = []
	public team1: StatisticsEntity[] = []
	public team2: StatisticsEntity[] = []
	public teams: {[key: number]: any} = {}
	public best: any[] = []
	public effects: any[] = []
	public field!: Field
	public newGlobalTurn: boolean = true
	public time: number = 0

	public generate(fight: Fight) {

		this.field = new Field(fight.data.map.width, fight.data.map.height)

		const entities = this.entities

		let leek_count = 0
		for (const leek of fight.data.leeks) {
			entities[leek.id] = new StatisticsEntity(leek)
			if (!leek.summon) {
				this.field.cells[leek.cellPos].entity = entities[leek.id]
				leek_count++
			}
			if (fight.data.ops && leek.id in fight.data.ops) {
				entities[leek.id].operations = fight.data.ops[leek.id]
			}
			if (!(leek.team in this.teams)) {
				this.teams[leek.team] = new Set<number>()
			}
		}
		let currentEntity!: StatisticsEntity
		let currentTurn = 0
		this.lives_raw.push([])
		this.updateLifes()
		const preciseLives = leek_count <= 2 && fight.report.duration <= 32

		let state = StatisticsState.BEGIN_TURN
		let itemCaster: StatisticsEntity | null = null
		let lastDamageAction: any = null

		for (const action of fight.data.actions) {
			const type = action[0] as ActionType
			// console.log(action)
			switch (type) {
				case ActionType.NEW_TURN: {
					// Possible d'avoir des action new_turn deux fois de suite (bug corrigé)
					if (currentTurn !== action[1]) {
						currentTurn = action[1]
						this.newGlobalTurn = true
						this.lives_raw.push([])
					}
					this.addTime()
					break
				}
				case ActionType.LEEK_TURN: {
					if (!preciseLives) { // Pour le mode moins précis on met à jour au début du tour d'une entité
						this.updateLifes()
					}
					state = StatisticsState.BEGIN_TURN
					const entity = entities[action[1]]
					entity.roundsPlayed++
					currentEntity = entity

					let life = entity.life
					for (const effect_id in entity.effects) {
						const effect = entity.effects[effect_id]
						const caster = entities[effect.caster]
						switch (effect.type) {
							case EffectType.POISON: {
								const value = Math.max(0, Math.min(life, effect.value))
								// console.log("poison from", caster, value)
								caster.poison_out += value
								caster.nova_out += Math.round(value * 0.1)
								entity.poison_in += value
								entity.nova_in += Math.round(value * 0.1)
								life -= value
								break
							}
							case EffectType.HEAL: {
								const value = Math.max(0, Math.min(entity.max_life - life, effect.value))
								caster.heal_out += value
								entity.heal_in += value
								life += value
								break
							}
						}
					}

					for (const effect_id in entity.launched_effects) {
						const effect = entity.launched_effects[effect_id]
						if (effect.turns === 1) {
							delete entity.launched_effects[effect_id]
						} else if (effect.turns !== -1) {
							effect.turns--
						}
					}
					this.addTime()
					break
				}
				case ActionType.MOVE_TO: {
					const end_cell = this.field.cells[action[3][action[3].length - 1]]
					const entity = entities[action[1]]
					for (const cell of action[3]) {
						entity.walkedCells.add(cell)
					}
					entity.move(end_cell)
					this.addTime(action[3].length * 25)
					break
				}
				case ActionType.MP_LOST:
				{
					entities[action[1]].usedPM += action[2]
					this.addTime()
					break
				}
				case ActionType.CARE:
				{
					const entity = entities[action[1]]
					const heal = action[2]
					entity.life += heal

					if (state === StatisticsState.ITEM_DAMAGE && currentEntity === itemCaster) {
						// C'est un vol de vie
						currentEntity.life_steal_out += heal
						state = StatisticsState.ITEM_LIFE_STEAL
					} else {
						// C'est un soin sur lui-même
						entity.heal_in += heal
						currentEntity.heal_out += heal
					}
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.BOOST_VITA: {
					const entity = entities[action[1]]
					const boost = action[2]
					entity.life += boost
					entity.max_life += boost

					entity.max_life_in += boost
					currentEntity.max_life_out += boost

					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.LIFE_LOST:
				{
					if (state === StatisticsState.USE_ITEM) {
						state = StatisticsState.ITEM_DAMAGE
						lastDamageAction = action
					} else if (state === StatisticsState.ITEM_DAMAGE && currentEntity === itemCaster) {
						state = StatisticsState.ITEM_DAMAGE_RETURN
					}
					const entity = entities[action[1]]
					const damage = action[2]
					const erosion = action.length > 3 ? action[3] : 0

					entity.life -= damage
					entity.max_life -= erosion

					if (currentEntity !== entity) {
						// Pas le tour de l'entité : direct damage ou life damage
						entity.direct_dmg_in += damage
						entity.nova_in += erosion
						currentEntity.direct_dmg_out += damage
						currentEntity.nova_out += erosion
					} else {
						// Pendant son propre tour
						if (state === StatisticsState.ITEM_DAMAGE_RETURN) {
							// C'est un renvoi de dégâts
							const target = entities[lastDamageAction[1]]
							currentEntity.return_in += damage
							currentEntity.nova_in += erosion
							target.return_out += damage
							target.nova_out += erosion
						} else {
							// C'est un dégât sur lui-même
							entity.direct_dmg_in += damage
							entity.nova_in += erosion
							currentEntity.direct_dmg_out += damage
							currentEntity.nova_out += erosion
						}
					}

					// Tank
					if (state !== StatisticsState.BEGIN_TURN) { // On compte pas les poisons
						const theoricalDamage = Math.round((damage + entity.absoluteShield) / (1 - entity.relativeShield / 100))
						entity.tank += Math.max(0, theoricalDamage - damage)
					}

					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.DAMAGE_RETURN: {
					const entity = entities[action[1]]
					const damage = action[2]
					const erosion = action.length > 3 ? action[3] : 0
					entity.life -= damage
					entity.max_life -= erosion
					entity.return_in += damage
					entity.nova_in += erosion

					if (lastDamageAction) {
						// C'est un renvoi de dégâts
						const target = entities[lastDamageAction[1]]
						target.return_out += damage
						target.nova_out += erosion
					}
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.POISON_DAMAGE: {
					const entity = entities[action[1]]
					const damage = action[2]
					const erosion = action.length > 3 ? action[3] : 0
					entity.life -= damage
					entity.max_life -= erosion
					// Stats handled in start_turn
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.LIFE_DAMAGE: {
					const entity = entities[action[1]]
					const damage = action[2]
					const erosion = action.length > 3 ? action[3] : 0
					entity.life -= damage
					entity.max_life -= erosion
					entity.life_dmg_in += damage
					entity.nova_in += erosion
					currentEntity.life_dmg_out += damage
					currentEntity.nova_out += erosion
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.AFTEREFFECT: {
					const entity = entities[action[1]]
					const damage = action[2]
					const erosion = action.length > 3 ? action[3] : 0
					entity.life -= damage
					entity.max_life -= erosion
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.NOVA_DAMAGE: {
					const entity = entities[action[1]]
					const damage = action[2]
					entity.max_life -= damage
					// Dégâts nova
					if (currentEntity !== entity) {
						entity.nova_in += damage
						currentEntity.nova_out += damage
					}
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.TP_LOST: {
					entities[action[1]].usedPT += action[2]
					this.addTime()
					break
				}
				case ActionType.PLAYER_DEAD: {
					const entity = entities[action[1]]
					entity.alive = false
					entity.launched_effects = {}
					const killer = action.length > 2 ? entities[action[2]] : currentEntity
					if (killer) { killer.kills++ }
					entity.life = 0
					this.addTime()
					break
				}
				case ActionType.USE_WEAPON: {
					const entity = entities[action[1]]
					state = StatisticsState.USE_ITEM
					itemCaster = entity

					const cell = this.field.cells[action[2]]
					// const weapon = LeekWars.weapons[LeekWars.weaponTemplates[action[3]].item]
					// const area = weapon.area
					// targets = this.field.getTargets(cell, area)
					// console.log("weapon", weapon.name, "area", area, "targets", targets)

					entity.actionsWeapon++
					if (action[4] === 2) { // CC
						entity.critical++
					}
					this.addTime(50)
					break
				}
				case ActionType.USE_CHIP: {
					const entity = entities[action[1]]
					state = StatisticsState.USE_ITEM
					itemCaster = entity

					const cell = this.field.cells[action[2]]
					const chipID = action[3]
					const chip = LeekWars.chips[LeekWars.chipTemplates[chipID].item]
					const area = chip.area
					const targets = this.field.getTargets(cell, area) as StatisticsEntity[]
					// console.log("chip", chip.name, "area", area, "targets", targets)

					entity.actionsChip++
					if (action[4] === 2) { // CC
						entity.critical++
					}
					// Update leek cell after teleportation
					if (chipID === 37) {
						entity.move(cell)
					}
					// Update leeks cells after inversion
					if (chipID === 39) {
						if (targets.length) {
							targets[0].move(entity.cell!)
							entity.move(cell)
						}
					}
					this.addTime(50)
					break
				}
				case ActionType.SUMMON: {
					entities[action[1]].invocation++
					this.addTime()
					break
				}
				case ActionType.RESURRECTION: {
					entities[action[2]].resurrection++
					entities[action[2]].life = action[4]
					if (preciseLives) {
						this.updateLifes()
					}
					this.addTime()
					break
				}
				case ActionType.BUG: {
					entities[action[1]].crashes++
					this.addTime()
					break
				}
				case ActionType.ADD_WEAPON_EFFECT:
				case ActionType.ADD_CHIP_EFFECT: {
					this.addEffect(action, false)
					this.addTime()
					break
				}
				case ActionType.ADD_STACKED_EFFECT: {
					this.addEffect(action, true)
					this.addTime()
					break
				}
				case ActionType.REMOVE_EFFECT:
					this.removeEffect(action[1])
					this.addTime()
					break
				case ActionType.UPDATE_EFFECT : {
					this.updateEffect(action[1], action[2])
					this.addTime()
					break
				}
			}
		}
		this.updateLifes()
		this.finalizeLifes()

		for (const j in entities) {
			const leek = entities[j]
			leek.usedPTperTurn = Math.round(leek.usedPT / leek.roundsPlayed * 10) / 10
			leek.summons = []
			if (leek.leek.summon) {
				entities[leek.leek.owner].summons.push(leek)
			}
			for (const cell of leek.walkedCells) {
				this.teams[leek.team].add(cell)
			}
		}

		for (const l in entities) {
			const leek = entities[l]

			leek.dmg_in = leek.direct_dmg_in + leek.poison_in + leek.return_in + leek.nova_in + leek.life_dmg_in
			leek.dmg_out = leek.direct_dmg_out + leek.poison_out + leek.return_out + leek.nova_out + leek.life_dmg_out
			leek.operations_per_turn = Math.round(leek.operations / Math.max(1, leek.roundsPlayed))
			leek.ops_format = this.formatOps(leek.operations)
			leek.ops_per_turn_format = this.formatOps(leek.operations_per_turn)

			if (leek.leek.summon) { continue }
			if (fight.winner === 0) {
				if (leek.leek.team === 1) { this.team1.push(leek) }
				else { this.team2.push(leek) }
			} else {
				if (leek.leek.team === fight.winner) { this.team1.push(leek) }
				else { this.team2.push(leek) }
			}
		}
	}

	private addTime(time: number = 6) {
		this.time += time
	}

	private updateLifes() {
		const current_turn = this.lives_raw[this.lives_raw.length - 1]
		const lives = []
		const lives_percent = []
		for (const j in this.entities) {
			let previous_life = -1
			if (current_turn.length) {
				previous_life = current_turn[current_turn.length - 1][0][j]
			} else if (this.lives_raw.length > 1) {
				const last_turn = this.lives_raw[this.lives_raw.length - 2]
				if (last_turn.length) {
					previous_life = last_turn[last_turn.length - 1][0][j]
				}
			}
			if (previous_life === 0 && this.entities[j].life === 0) {
				lives.push(null)
				lives_percent.push(null)
			} else {
				lives.push(this.entities[j].life)
				lives_percent.push(Math.round(100 * this.entities[j].life / this.entities[j].max_life))
			}
		}
		current_turn.push([lives, lives_percent])
		this.lives_turns.push(this.newGlobalTurn)
		this.newGlobalTurn = false
	}

	private finalizeLifes() {
		for (const j in this.entities) {
			const lives = []
			const lives_percent = []
			for (let turn = 0; turn < this.lives_raw.length; ++turn) {
				const actions = this.lives_raw[turn]
				const actions_count = actions.length
				for (let i = 0; i < actions_count; ++i) {
					let x = turn + 1 + ((i + 1) / actions_count)
					if (turn === 0 && i === 0) { x = 1 }
					lives.push({x, y: actions[i][0][j] })
					lives_percent.push({x, y: actions[i][1][j] })
				}
			}
			this.lives.push(lives)
			this.lives_percent.push(lives_percent)
		}
	}

	private formatOps(operations: number) {
		if (operations === 0) { return '' + operations }
		if (operations >= 1000000) {
			return Math.round(operations / 100000) / 10 + 'M'
		} else if (operations >= 1000) {
			return Math.round(operations / 100) / 10 + 'k'
		} else {
			return '' + operations
		}
	}

	private addEffect(action: any, stacked: boolean) {
		const item = action[1]
		const id = action[2]
		const caster_id = action[3]
		const target = action[4]
		const type = action[5]
		const value = action[6]
		const turns = action[7]
		const caster = this.entities[caster_id]
		const leek = this.entities[target]

		if (stacked) {
			// Search for an similar effect to stack
			for (const i in leek.effects) {
				const e = leek.effects[i]
				if (e.item === item && e.type === type && e.turns === turns && e.caster === caster_id) {
					e.value += value
					break
				}
			}
		} else {
			// Ajout de l'effet
			this.effects[id] = {id, item, caster: caster_id, target, type, value, turns, texture: null}

			leek.effects[id] = this.effects[id]
			caster.launched_effects[id] = this.effects[id]
		}

		switch (type) {
		case EffectType.ABSOLUTE_SHIELD:
		case EffectType.STEAL_ABSOLUTE_SHIELD:
		case EffectType.RAW_ABSOLUTE_SHIELD:
			leek.absoluteShield += value
			break
		case EffectType.RELATIVE_SHIELD:
			leek.relativeShield += value
			break
		case EffectType.VULNERABILITY:
			leek.relativeShield -= value
			break
		case EffectType.ABSOLUTE_VULNERABILITY:
			leek.absoluteShield -= value
			break
		case EffectType.BUFF_AGILITY:
		case EffectType.RAW_BUFF_AGILITY:
			leek.agility += value
			break
		case EffectType.RAW_BUFF_MAGIC:
			leek.magic += value
			break
		case EffectType.RAW_BUFF_SCIENCE:
			leek.science += value
			break
		case EffectType.BUFF_STRENGTH:
		case EffectType.RAW_BUFF_STRENGTH:
			leek.strength += value
			break
		case EffectType.BUFF_TP:
		case EffectType.RAW_BUFF_TP:
			leek.tp += value
			break
		case EffectType.BUFF_MP:
		case EffectType.RAW_BUFF_MP:
			leek.mp += value
			break
		case EffectType.BUFF_WISDOM:
			leek.wisdom += value
			break
		case EffectType.BUFF_RESISTANCE:
			leek.resistance += value
			break
		case EffectType.SHACKLE_MP:
			leek.mp += value
			break
		case EffectType.SHACKLE_TP:
			leek.tp += value
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.strength -= value
			break
		case EffectType.SHACKLE_MAGIC:
			leek.magic -= value
			break
		case EffectType.DAMAGE_RETURN:
			leek.damageReturn += value
			break
		case EffectType.POISON:
			break
		}
	}

	private removeEffect(id: number) {
		const effect = this.effects[id]

		if (!effect) { return }

		const effectID = effect.type
		const leek = this.entities[effect.target]
		const value = effect.value

		switch (effectID) {
		case EffectType.SHACKLE_MP:
			leek.mp += value
			break
		case EffectType.SHACKLE_TP:
			leek.tp += value
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.strength += value
			break
		case EffectType.SHACKLE_MAGIC:
			leek.magic += value
			break
		case EffectType.STEAL_ABSOLUTE_SHIELD:
		case EffectType.ABSOLUTE_SHIELD:
		case EffectType.RAW_ABSOLUTE_SHIELD:
			leek.absoluteShield -= value
			break
		case EffectType.RELATIVE_SHIELD:
			leek.relativeShield -= value
			break
		case EffectType.VULNERABILITY:
			leek.relativeShield += value
			break
		case EffectType.ABSOLUTE_VULNERABILITY:
			leek.absoluteShield += value
			break
		case EffectType.BUFF_AGILITY:
		case EffectType.RAW_BUFF_AGILITY:
			leek.agility -= value
			break
		case EffectType.BUFF_STRENGTH:
		case EffectType.RAW_BUFF_STRENGTH:
			leek.strength -= value
			break
		case EffectType.BUFF_WISDOM:
			leek.wisdom -= value
			break
		case EffectType.RAW_BUFF_MAGIC:
			leek.magic -= value
			break
		case EffectType.RAW_BUFF_SCIENCE:
			leek.science -= value
			break
		case EffectType.BUFF_RESISTANCE:
			leek.resistance -= value
			break
		case EffectType.DAMAGE_RETURN:
			leek.damageReturn -= value
			break
		case EffectType.BUFF_MP:
		case EffectType.RAW_BUFF_MP:
			leek.mp -= value
			break
		case EffectType.BUFF_TP:
		case EffectType.RAW_BUFF_TP:
			leek.tp -= value
			break
		}
		delete leek.effects[id]
		delete this.effects[id]
	}

	private updateEffect(id: number, new_value: number) {

		const effect = this.effects[id]
		if (!effect) { return }

		const effectID = effect.type
		const leek = this.entities[effect.target]
		const delta = new_value - effect.value

		switch (effectID) {
		case EffectType.SHACKLE_MP:
			leek.mp -= delta
			break
		case EffectType.SHACKLE_TP:
			leek.tp -= delta
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.strength -= delta
			break
		case EffectType.SHACKLE_MAGIC:
			leek.magic -= delta
			break
		case EffectType.ABSOLUTE_SHIELD:
			leek.absoluteShield += delta
			break
		case EffectType.RELATIVE_SHIELD:
			leek.relativeShield += delta
			break
		case EffectType.VULNERABILITY:
			leek.relativeShield -= delta
			break
		case EffectType.ABSOLUTE_VULNERABILITY:
			leek.absoluteShield -= delta
			break
		case EffectType.BUFF_AGILITY:
		case EffectType.RAW_BUFF_AGILITY:
			leek.agility += delta
			break
		case EffectType.BUFF_STRENGTH:
		case EffectType.RAW_BUFF_STRENGTH:
			leek.strength += delta
			break
		case EffectType.BUFF_WISDOM:
			leek.wisdom += delta
			break
		case EffectType.RAW_BUFF_MAGIC:
			leek.magic += delta
			break
		case EffectType.RAW_BUFF_SCIENCE:
			leek.science += delta
			break
		case EffectType.BUFF_RESISTANCE:
			leek.resistance += delta
			break
		case EffectType.DAMAGE_RETURN:
			leek.damageReturn += delta
			break
		case EffectType.BUFF_MP:
		case EffectType.RAW_BUFF_MP:
			leek.mp += delta
			break
		case EffectType.BUFF_TP:
		case EffectType.RAW_BUFF_TP:
			leek.tp += delta
			break
		}
		effect.value = new_value // Updating the effect's value to properly remove it with `removeEffect`
	}
}

export { FightStatistics }