import Player from '@/component/player.vue'
import { Bubble } from '@/component/player/game/bubble'
import { Bulb } from '@/component/player/game/bulb'
import { Acceleration, Adrenaline, Antidote, Armor, Armoring, BallAndChain, Bandage, Bark, Burning, Carapace, Collar, Cure, DevilStrike, Doping, Drip, Ferocity, Fertilizer, Flame, Flash, Fortress, Fracture, Helmet, Ice, Iceberg, Inversion, LeatherBoots, Liberation, Lightning, Loam, Meteorite, Mirror, Motivation, Pebble, Plague, Protein, Rage, Rampart, Reflexes, Regeneration, Remission, Rock, Rockfall, SevenLeagueBoots, Shield, Shock, SlowDown, Solidification, Soporific, Spark, Stalactite, Steroid, Stretching, Teleportation, Thorn, Toxin, Tranquilizer, Vaccine, Venom, Wall, WarmUp, Whip, WingedBoots } from '@/component/player/game/chips'
import { Entity, EntityType } from '@/component/player/game/entity'
import { Ground } from '@/component/player/game/ground'
import { Leek } from '@/component/player/game/leek'
import { Arena, Beach, Desert, Factory, Forest, Glacier, Map, Nexus } from '@/component/player/game/maps'
import { Obstacle } from '@/component/player/game/obstacle'
import { Particles } from '@/component/player/game/particles'
import { Sounds } from '@/component/player/game/sound'
import { Textures } from '@/component/player/game/texture'
import { Axe, BLaser, Broadsword, Destroyer, DoubleGun, Electrisor, FlameThrower, Gazor, GrenadeLauncher, Katana, Laser, MachineGun, Magnum, MLaser, Pistol, Shotgun } from '@/component/player/game/weapons'
import { env } from '@/env'
import { Action, ActionType } from '@/model/action'
import { Area } from '@/model/area'
import { EffectType } from '@/model/effect'
import { Fight, FightData, TEAM_COLORS } from '@/model/fight'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { Turret } from './turret'

enum Colors {
	MP_COLOR = "#08D900",
	LIFE_COLOR = "#ff0000",
	TP_COLOR = "#FF7F01",
	SHIELD_COLOR = "#FF4A01",
	STRENGTH_COLOR = "#833100",
	AGILITY_COLOR = "#0080F7",
	WISDOM_COLOR = "#5ebe00",
	RESISTANCE_COLOR = "#fe7700",
	MAGIC_COLOR = "#b800b6",
}

// Params
const FPS = 60
const MAX_DT = 8
const GROUND_TEXTURE = true
const SHADOW_SCALE = 0.5
const SHADOW_ALPHA = 0.3

let lastTime = new Date().getTime()
let dt = 0
const frameTime = 1000 / FPS
const lastFPS = new Array()

// var hidden, visibilityState, visibilityChange;

// if (typeof document.hidden !== "undefined") {
// 	hidden = "hidden", visibilityChange = "visibilitychange", visibilityState = "visibilityState";
// } else if (typeof document.mozHidden !== "undefined") {
// 	hidden = "mozHidden", visibilityChange = "mozvisibilitychange", visibilityState = "mozVisibilityState";
// } else if (typeof document.msHidden !== "undefined") {
// 	hidden = "msHidden", visibilityChange = "msvisibilitychange", visibilityState = "msVisibilityState";
// } else if (typeof document.webkitHidden !== "undefined") {
// 	hidden = "webkitHidden", visibilityChange = "webkitvisibilitychange", visibilityState = "webkitVisibilityState";
// }
// var document_hidden = document[hidden];
// document.addEventListener(visibilityChange, function() {
// 	if (!game) return null
// 	if (document_hidden != document[hidden]) {
// 		if (document[hidden]) {
// 			game.focus = false;
// 		} else {
// 			game.focus = true;
// 		}
// 		document_hidden = document[hidden];
// 	}
// });

const ENTITY_CLASSES = [
	Leek,
	Bulb,
	Turret
]

const WEAPONS = [
	Pistol, // 1
	MachineGun, // 2
	DoubleGun, // 3
	Shotgun,  // 4
	Magnum, // 5
	Laser, // 6
	GrenadeLauncher, // 7
	FlameThrower, // 8
	Destroyer, // 9
	Gazor, // 10
	Electrisor, // 11
	MLaser, // 12
	BLaser, // 13
	Katana, // 14
	Broadsword, // 15
	Axe, // 16
]

const CHIPS: any[] = [
	Bandage, // 1
	Cure, // 2
	Drip, // 3
	Regeneration, // 4
	Vaccine, // 5
	Shock, // 6
	Flash, // 7
	Lightning, // 8
	Spark, // 9
	Flame, // 10
	Meteorite, // 11
	Pebble, // 12
	Rock, // 13
	Rockfall, // 14
	Ice, // 15
	Stalactite, // 16
	Iceberg, // 17
	Shield, // 18
	Helmet, // 19
	Armor, // 20
	Wall, // 21
	Rampart, // 22
	Fortress, // 23
	Protein, // 24
	Steroid, // 25
	Doping, // 26
	Stretching, // 27
	WarmUp, // 28
	Reflexes, // 29
	LeatherBoots, // 30
	WingedBoots, // 31
	SevenLeagueBoots, // 32
	Motivation, // 33
	Adrenaline, // 34
	Rage, // 35
	Liberation, // 36
	Teleportation, // 37
	Armoring, // 38
	Inversion, // 39
	null, // 40
	null, // 41
	null, // 42
	null, // 43
	null, // 44
	null, // 45
	null, // 46
	Remission, // 47
	Carapace, // 48
	null, // 49
	DevilStrike, // 50
	Whip, // 51
	Loam, // 52
	Fertilizer, // 53
	Acceleration, // 54
	SlowDown, // 55
	BallAndChain, // 56
	Tranquilizer, // 57
	Soporific, // 58
	Fracture, // 59
	Solidification, // 60
	Venom, // 61
	Toxin, // 62
	Plague, // 63
	Thorn, // 64
	Mirror, // 65
	Ferocity, // 66
	Collar, // 67
	Bark, // 68
	Burning, // 69
	Antidote, // 70
]

class Game {
	public canvas!: HTMLCanvasElement
	public loadedData: number = 0
	public numData: number = 0
	public T = new Textures(this)
	public S = new Sounds(this)
	public initialized: boolean = false
	public paused: boolean = false
	public requestPause = false
	public speed = 1
	public speedButtonFrame: number = 0
	public speedButtonVisible: boolean = true
	public focus = true
	public going_to_report = false
	public width: number = 0
	public height: number = 0
	public particles = new Particles(this)
	public ground = new Ground(this)
	public drawableElements: Array<{[key: number]: any}> = []
	public drawableElementCurrentId: number = 0
	// Players
	public teams = new Array()
	public leeks: Entity[] = []
	public entityOrder = new Array()
	public states = new Array()
	// Actions
	public data!: FightData
	public actions: Action[] = []
	public currentActions: any[] = []
	public currentAction: number = -1
	public actionToDo = true
	public actionDelay = 0
	public fightEnd = false
	public turn = 1
	public turnPosition: {[key: number]: number} = {}
	public effects = new Array()
	// Chips
	public chips = new Array()
	// Logs
	public logs = new Array()
	public currentLog = 0
	// Marqueurs
	public markers = new Array()
	// Map
	public map!: Map
	public drawArea = 0
	// Mouse
	public mouseX = 0
	public mouseY = 0
	public mouseTileX: number | undefined = 0
	public mouseTileY: number | undefined = 0
	public mouseCell: number | undefined = undefined
	public mouseCellX: number = 0
	public mouseCellY: number = 0
	public mouseRealX: number = 0
	public mouseRealY: number = 0
	public mouseEntity: Entity | null = null
	// Settings
	public large = true
	public debug = false
	public tactic = false
	public shadows = true
	public showCells: boolean = false
	public showLifes: boolean = false
	public sound: boolean = false
	public atmosphere: any
	public obstacles!: {[key: number]: number[]}
	public error: boolean = false
	public fps: number = 0
	public avgFPS: number = 0
	public showCellTime: number = 0
	public currentPlayer: number | null = null
	public jumping: any
	public currentTurn: number = 0
	public ratio: number = 1
	public areaColor: any
	public area!: any[]
	public showCellX: any
	public showCellY: any
	public ctx: any
	public showCellColor: any
	public showCellCell: any
	public reportTimer: any
	public progressBarWidth: number = 0
	public mouseOriginX: number = 0
	public mouseOriginY: number = 0
	public launched: boolean = false
	public cancelled: boolean = false
	public player!: Player
	public halloween: boolean = false

	public maps: Map[] = [
		new Nexus(this),
		new Factory(this),
		new Desert(this),
		new Forest(this),
		new Glacier(this),
		new Beach(this),
		new Arena(this)
	]

	constructor() {
		for (let i = 0; i < this.ground.tilesY * 2; i++) {
			this.drawableElements[i] = {}
		}
		const halloweenStart = new Date()
		halloweenStart.setDate(30)
		halloweenStart.setMonth(9) // October
		halloweenStart.setHours(0, 0, 0, 0)
		const halloweenEnd = new Date()
		halloweenEnd.setDate(1)
		halloweenEnd.setMonth(10) // November
		halloweenEnd.setHours(0, 0, 0, 0)
		const now = new Date()
		this.halloween = now >= halloweenStart && now < halloweenEnd
	}

	public init(fight: Fight) {
		this.data = fight.data

		// Check data
		if (this.data == null) {
			console.warn("Fight is null...")
			this.setError()
			return
		}

		this.map = this.maps[this.data.map.type + 1]

		// Atmosphere sound of the map
		this.atmosphere = this.map.sound
		this.obstacles = this.data.map.obstacles

		// Add entities
		const entities = this.data.leeks

		for (const e of entities) {

			const type = typeof(e.type) === 'undefined' ? EntityType.LEEK : e.type

			const entity = new ENTITY_CLASSES[type](this, e.team, e.level)

			// Infos vitales
			entity.id = e.id
			entity.name = e.name
			entity.level = e.level
			entity.team = e.team
			entity.type = type
			entity.summon = typeof(e.summon) === 'undefined' ? false : e.summon
			if (entity.team === 2) {
				entity.orientation = -1
			}
			if (entity.summon) {
				entity.name = i18n.t('entity.' + entity.name) as string
			}

			entity.farmer = null
			if (typeof(e.farmer) !== 'undefined') {
				entity.farmer = (entity.team === 1 ? fight.farmers1 : fight.farmers2)[e.farmer]
			}

			////// Stats

			// Life
			entity.life = e.life
			entity.maxLife = entity.life

			// Strength
			entity.strength = 0
			if (typeof(e.force) !== 'undefined') {
				entity.strength = e.force
			}
			if (typeof(e.strength) !== 'undefined') {
				entity.strength = e.strength
			}
			// Wisdom
			entity.wisdom = 0
			if (typeof(e.wisdom) !== 'undefined') {
				entity.wisdom = e.wisdom
			}
			// Agility
			entity.agility = 0
			if (typeof(e.agility) !== 'undefined') {
				entity.agility = e.agility
			}
			// Resistance
			entity.resistance = 0
			if (typeof(e.resistance) !== 'undefined') {
				entity.resistance = e.resistance
			}
			// Frequency
			entity.frequency = 0
			if (typeof(e.frequency) !== 'undefined') {
				entity.frequency = e.frequency
			}
			// Science
			entity.science = 0
			if (typeof(e.science) !== 'undefined') {
				entity.science = e.science
			}
			// Magic
			entity.magic = 0
			if (typeof(e.magic) !== 'undefined') {
				entity.magic = e.magic
			}
			// TP
			entity.tp = 0
			if (typeof(e.pt) !== 'undefined') {
				entity.tp = e.pt
			}
			if (typeof(e.tp) !== 'undefined') {
				entity.tp = e.tp
			}
			entity.maxTP = entity.tp

			// MP
			entity.mp = 0
			if (typeof(e.pm) !== 'undefined') {
				entity.mp = e.pm
			}
			if (typeof(e.mp) !== 'undefined') {
				entity.mp = e.mp
			}
			entity.maxMP = entity.mp

			entity.setCell(e.cellPos)

			this.leeks[entity.id] = entity
			
			// entity
			if (entity instanceof Leek) {

				if (this.teams[entity.team - 1] === undefined) {
					this.teams[entity.team - 1] = []
				}
				this.teams[entity.team - 1].push(entity)
				this.entityOrder.push(entity)

				// Skin
				const index = this.teams[entity.team - 1].length - 1
				const fightLeek = entity.team === 1 ? fight.leeks1[index] : fight.leeks2[index]
				const skin = !fightLeek || typeof(fightLeek.skin) === 'undefined' ? 1 : fightLeek.skin
				const hat = !fightLeek || typeof(fightLeek.hat) === 'undefined' ? null : fightLeek.hat
				const appearance = LeekWars.getLeekAppearance(entity.level)
				entity.setSkin(skin, appearance, hat)
				entity.active = true
				entity.drawID = this.addDrawableElement(entity, entity.y)

			} else if (entity instanceof Bulb) {

				entity.setSkin(e.skin)
			}
		}
		
		// for (var id = 0; id < 11; ++id) {
		// 	const level = Math.max(1, id * 10)
		// 	const turret = new Turret(this, (id + 1) % 2, level)
		// 	turret.id = id + 5
		// 	turret.team = 2
		// 	turret.level = level
		// 	turret.name = "Tourelle lvl " + turret.level
		// 	turret.life = turret.level * 10
		// 	turret.maxLife = turret.life
		// 	turret.setCell(420 + id * 19)
		// 	turret.active = true
		// 	this.leeks[id + 5] = turret
		// 	turret.drawID = this.addDrawableElement(turret, turret.y)
		// }

		// Actions
		this.actions = this.data.actions.map(a => new Action(a))
		this.currentAction = 0

		// Check first action
		if (this.actions.length === 0 || this.actions[this.currentAction].type !== ActionType.START_FIGHT) {
			console.warn("Error ! no action START_FIGHT")
			this.setError()
			return
		}

		// Get the relative position of the turns in the actions
		this.turnPosition = {1: 0}
		for (let i = 0; i < this.actions.length; ++i) {
			if (this.actions[i].type === ActionType.NEW_TURN) {
				this.turnPosition[this.actions[i].params[1]] = i / this.actions.length
			}
		}
		// On a chargé tout le jeu, on peut charger les ressources
		// le jeu démarrera quand toutes les ressources seront ok
		this.initialized = true

		if (this.loadedData === this.numData) {
			this.launch() // Start game if all resources are loaded
		}
	}

	public setLogs(logs: any) {
		this.logs = logs
	}

	/*
	 * Ressources chargées, on peut y aller
	 */
	public launch() {
		// Atmosphere sound
		if (this.atmosphere != null && this.sound) {
			this.atmosphere.loop()
		}
		// Obstacles
		for (const i in this.obstacles) {
			const o = this.obstacles[i]
			const type = o[0]
			const size = o[1]
			if (size !== -1) {
				const obstacle = new Obstacle(this, type, size, parseInt(i, 10))
				obstacle.resize()
				this.ground.addObstacle(obstacle)
			}
		}
		this.ground.resize(this.width, this.height, this.shadows)
		for (const l in this.leeks) {
			if (this.leeks[l].active) { this.leeks[l].computeOrginPos() }
		}
		// console.log(this.leeks)
		for (const leek of this.leeks) {
			this.states[leek.id] = {
				absolute_shield: 0,
				relative_shield: 0,
				active: leek.type === 0,
				life: leek.life,
				max_life: leek.life,
				tp: leek.tp,
				mp: leek.mp,
				agility: leek.agility,
				strength: leek.strength,
				wisdom: leek.wisdom,
				damage_return: leek.damageReturn,
				science: leek.science,
				magic: leek.magic,
				resistance: leek.resistance,
				cell: leek.cell,
				weapon: undefined,
				effects: [],
			}
		}
		/* Launch! */
		this.launched = true
		this.player.$emit('game-launched')
		this.updateFrame()
	}

	public resize(width: number, height: number) {
		this.width = width
		this.height = height
		this.ground.resize(width, height, this.shadows)
	}
	public setOrigin(originX: number, originY: number) {
		this.mouseOriginX = originX + Math.round(this.ground.startX / this.ratio)
		this.mouseOriginY = originY + Math.round(this.ground.startY / this.ratio)
	}

	public updateFrame() {
		if (!this.paused) {
			setTimeout(() => this.updateFrame(), frameTime)
			this.update()
		}
	}

	public setError() {
		this.error = true
	}

	public computeDT() {
		const timeNow = new Date().getTime()
		const delay = timeNow - lastTime
		dt = delay * 0.001 * 60 * this.speed
		if (dt > MAX_DT) {
			dt = MAX_DT
		}
		lastTime = timeNow
		this.fps = Math.floor(1000 / delay)

		lastFPS.push(this.fps)
		if (lastFPS.length > 30) {
			lastFPS.shift()
		}
		this.avgFPS = 0
		for (const f of lastFPS) {
			this.avgFPS += f
		}
		this.avgFPS = Math.round(this.avgFPS / 30)
	}

	public speedUp() {
		if (this.speed === 1) {
			this.speed = 3
			// LW.setTooltipContent($('#tt_speed-button'), i18n.t('fight.accelerate_again') + ' (S)');
		} else if (this.speed === 3) {
			this.speed = 12
			// LW.setTooltipContent($('#tt_speed-button'), i18n.t('fight.decelerate') + ' (S)');
		} else {
			this.speed = 1
			// LW.setTooltipContent($('#tt_speed-button'), i18n.t('fight.accelerate') + ' (S)');
			// $('#speed-button').css('opacity', '');
		}
	}
	public toggleShadows() {
		this.ground.resize(this.width, this.height, this.shadows)
	}
	public toggleSound() {
		if (this.atmosphere != null) {
			if (this.sound) {
				this.atmosphere.loop()
			} else {
				this.atmosphere.stop()
			}
		}
	}

	public update() {

		if (!this.paused) {

			this.computeDT()

			// Logs
			const needPause = this.readLogs()

			// Actions
			if (!needPause) {
				if (!this.fightEnd) {
					if (this.actionToDo) {
						this.actionDelay -= dt
						if (this.actionDelay <= 0) {

							this.actionDelay = 0
							this.actionToDo = false
							this.currentAction++

							const action = this.actions[this.currentAction]

							if (action === undefined) {
								// this.log(i18n.t('fight.end_of_fight') as string)
								this.fightEnd = true
								this.reportTimer = setTimeout(() => this.showReport(), 2500)
								return
							}
							this.doAction(action)
						}
					}
				}
				this.drawArea -= dt

				// Show cell
				if (this.showCellTime > 0) {
					this.showCellTime -= dt
					if (this.showCellTime <= 0) {
						this.actionDone()
					}
				}
				// Leeks
				let hover_entity = null
				for (const entity of this.leeks) {
					if (entity.active) {
						entity.update(dt)
						if (entity.cell === this.mouseCell) {
							hover_entity = entity
						}
					}
				}
				this.mouseEntity = hover_entity
				
				// Chips
				for (let c = 0; c < this.chips.length; ++c) {
					const chip = this.chips[c]
					chip.update(dt)
					if (chip.done) {
						this.chips.splice(c, 1)
						c--
						this.actionDone()
					}
					if (chip.willFinish) {
						this.chips.splice(c, 1)
						c--
					}
				}
				// Particles
				this.particles.update(dt)
			}
			/// Draw
			if (this.focus) {
				this.draw()
			}
			// Speed button
			if (this.speed > 1 && !this.paused) {
				this.speedButtonFrame += dt
				if (this.speedButtonFrame > 50) {
					this.speedButtonFrame = 0
					this.speedButtonVisible = !this.speedButtonVisible
				}
			} else {
				this.speedButtonVisible = true
			}
		}
	}

	public pause() {
		if (!this.requestPause && !this.paused) {
			if (this.atmosphere != null) {
				this.atmosphere.stop()
			}
			this.requestPause = true
		}
	}

	public resume() {
		if (this.paused) {
			if (this.atmosphere != null) {
				this.atmosphere.loop()
			}
			this.paused = false
			this.updateFrame()
		}
	}

	public doAction(action: Action) {
		switch (action.type) {
		case ActionType.NEW_TURN: {
			this.turn = action.params[1]
			this.actionDone()
			break
		}
		case ActionType.LEEK_TURN: {
			this.log(action)
			this.currentPlayer = action.params[1]
			const entity = this.leeks[action.params[1]]

			if (typeof(action.params[2]) !== 'undefined' && typeof(action.params[3]) !== 'undefined') {
				entity.tp = action.params[2]
				entity.mp = action.params[3]
			}

			for (const effect_id in entity.launched_effects) {
				const effect = entity.launched_effects[effect_id]
				if (effect.turns === 1) {
					delete entity.launched_effects[effect_id]
				} else {
					effect.turns--
				}
			}

			if (!this.jumping) {
				// Update markers
				for (const m in this.markers) {
					const marker = this.markers[m]
					if (marker.owner === this.currentPlayer) {
						marker.duration--
						if (marker.duration === 0) {
							delete this.markers[m]
						}
					}
				}
			}
			this.actionDone()
			break
		}
		case ActionType.END_TURN: {
			// Reinitialisation of characteristics
			this.leeks[action.params[1]].tp = action.params[2]
			this.leeks[action.params[1]].mp = action.params[3]
			if (action.params.length > 4) { this.leeks[action.params[1]].strength = action.params[4] }
			if (action.params.length > 5) { this.leeks[action.params[1]].magic = action.params[5] }
			this.actionDone()
			break
		}
		case ActionType.MOVE_TO: {
			if (this.jumping) {
				this.leeks[action.params[1]].cell = action.params[2]
				this.actionDone()
			} else {
				this.leeks[action.params[1]].move(action.params[3])
			}
			break
		}
		case ActionType.MP_LOST: {
			this.leeks[action.params[1]].looseMP(action.params[2], this.jumping)
			this.actionDone()
			break
		}
		case ActionType.CARE: {
			this.leeks[action.params[1]].care(action.params[2], this.jumping)
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.BOOST_VITA: {
			this.leeks[action.params[1]].boostVita(action.params[2], this.jumping)
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.SET_WEAPON: {
			const leek = this.leeks[action.params[1]] as Leek
			leek.setWeapon(new WEAPONS[action.params[2] - 1](this))
			leek.weapon_name = LeekWars.weapons[LeekWars.weaponTemplates[action.params[2]].item].name
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.USE_CHIP: {

			const launcher = action.params[1]
			const cell = action.params[2]
			const chip = action.params[3]
			const leeksID = action.params[5]

			if (this.jumping) {
				// Update leek cell after teleportation
				if (chip === 37) {
					this.leeks[launcher].cell = cell
				}
				// Update leeks cells after inversion
				if (chip === 39) {
					this.leeks[leeksID[0]].cell = this.leeks[launcher].cell
					this.leeks[launcher].cell = cell
				}
				this.actionDone()
				break
			}
			if (CHIPS[action.params[3] - 1] !== null) {
				const chipAnimation: any = new CHIPS[action.params[3] - 1](this)
				const leeks = []
				for (const leek of leeksID) {
					leeks.push(this.leeks[leek])
				}
				this.leeks[action.params[1]].useChip(chipAnimation, cell, leeks)
				this.chips.push(chipAnimation)
			} else {
				this.actionDone()
			}
			this.log(action)
			break
		}
		case ActionType.USE_WEAPON: {
			if (this.jumping) {
				this.actionDone()
				break
			}
			const launcher = action.params[1]
			const cell = action.params[2]
			const leeksID = action.params[5]
			action.weapon = (this.leeks[launcher] as Leek).weapon_name

			const leeks = new Array()
			for (const leek of leeksID) {
				leeks.push(this.leeks[leek])
			}
			(this.leeks[launcher] as Leek).useWeapon(cell, leeks)
			// Pas de cibles workaround
			if (leeksID.length === 0) {
				this.actionDone()
			}
			this.log(action)
			break
		}
		case ActionType.LIFE_LOST: {
			const erosion = action.params.length > 3 ? action.params[3] : 0
			this.leeks[action.params[1]].looseLife(action.params[2], erosion, this.jumping)
			if (!this.jumping) {
				this.log(action)
				this.leeks[action.params[1]].randomHurt()
			}
			this.actionDone()
			break
		}
		case ActionType.TP_LOST: {
			this.leeks[action.params[1]].looseTP(action.params[2], this.jumping)
			this.actionDone()
			break
		}
		case ActionType.PLAYER_DEAD: {
			const entity = this.leeks[action.params[1]]
			if (entity.summon) {
				this.entityOrder.splice(this.entityOrder.indexOf(entity), 1)
			}
			entity.launched_effects = {}
			if (this.jumping) {
				entity.dead = true
				if (entity.drawID) {
					this.removeDrawableElement(entity.drawID, entity.dy)
				}
				this.actionDone()
			} else {
				this.log(action)
				entity.kill() // Animation
			}
			break
		}
		case ActionType.SAY: {
			if (!this.jumping) {
				this.log(action)
				this.leeks[action.params[1]].say(this.ctx, action.params[2])
			}
			this.actionDone()
			break
		}
		case ActionType.LAMA: {
			if (!this.jumping) {
				this.leeks[action.params[1]].sayLama()
			}
			this.actionDone()
			break
		}
		case ActionType.SUMMON: {
			const caster = action.params[1]
			const summonID = action.params[2]
			const cell = action.params[3]
			const summon = this.leeks[summonID]
			summon.setCell(cell)
			summon.summoner = this.leeks[caster]
			summon.active = true
			summon.drawID = this.addDrawableElement(summon, summon.y)
			this.entityOrder.splice(this.entityOrder.findIndex((e) => e.id === caster) + 1, 0, summon)
			if (!this.jumping) {
				this.log(action)
				this.S.bulb.play()
			}
			this.actionDone()
			break
		}
		case ActionType.RESURRECTION: {
			const target = action.params[2]
			const cell = action.params[3]
			const life = action.params[4]
			const maxLife = action.params[5]
			const entity = this.leeks[target]

			entity.setCell(cell)
			entity.life = life
			entity.maxLife = maxLife
			entity.active = true
			entity.reborn()

			entity.drawID = this.addDrawableElement(entity, entity.y)
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.SHOW: {
			if (this.jumping) {
				this.actionDone()
				break
			}
			this.showCellCell = action.params[2]
			this.showCellColor = '#' + action.params[3]
			const pos = this.ground.cellToXY(this.showCellCell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			this.showCellX = xy.x * this.ground.scale
			this.showCellY = xy.y * this.ground.scale
			this.showCellTime = 50
			this.log(action)
			break
		}
		case ActionType.ADD_WEAPON_EFFECT : {
			this.addEffect(action, 'weapon')
			this.actionDone()
			break
		}
		case ActionType.ADD_CHIP_EFFECT : {
			this.addEffect(action, 'chip')
			this.actionDone()
			break
		}
		case ActionType.REMOVE_EFFECT : {
			this.removeEffect(action.params[1])
			this.actionDone()
			break
		}
		case ActionType.UPDATE_EFFECT : {
			this.updateEffect(action.params[1], action.params[2])
			this.actionDone()
			break
		}
		case ActionType.BUG: {
			if (!this.jumping) {
				this.leeks[action.params[1]].bug()
			}
			this.actionDone()
			break
		}
		case ActionType.END_FIGHT: {
			this.fightEnd = true
			break
		}
		default: {
			console.warn("Error : unknown action", action)
			this.actionDone()
		}
		}
		if (!this.jumping) {
			// On peut logger pour cette action !
			this.currentLog = 0
		}
	}

	public addEffect(action: Action, object: any) {
		const objectID = action.params[1]
		const id = action.params[2]
		const caster_id = action.params[3]
		const target = action.params[4]
		const effect = action.params[5]
		const value = action.params[6]
		const turns = action.params[7]
		const caster = this.leeks[caster_id]
		const leek = this.leeks[target]

		// Ajout de l'effet
		this.effects[id] = {id, object: objectID, objectType: object, caster: caster_id, target, effect, value, turns}

		// Ajout de l'image sur le hud
		let image: string = ''
		if (object === 'chip') {
			if (objectID in LeekWars.chips) {
				image = env.STATIC + "image/chip/small/" + LeekWars.chips[objectID].name + ".png"
			}
		} else /* if (object == 'weapon') */ {

			if (objectID in LeekWars.weapons) {

				const template = LeekWars.weapons[objectID].template
				const img = ["1", "2", "3", "4", "5", "6", "7", "flamme", "destroyer", "gaz_icon", "11", "12", "13", "katana", "broadsword", "axe"][template - 1]
				image = env.STATIC + "image/weapon/" + img + ".png"

				// Gestion des états du poireau
				if (template === 8) {
					leek.burn()
				} else if (template === 10) {
					leek.gaz()
				}
			}
		}
		this.effects[id].image = image
		this.effects[id].texture = new Image()
		this.effects[id].texture.src = image
		leek.effects[id] = this.effects[id]
		caster.launched_effects[id] = this.effects[id]
		
		this.log(action)

		switch (effect) {
		case EffectType.ABSOLUTE_SHIELD:
			leek.buffAbsoluteShield(value, this.jumping)
			break
		case EffectType.RELATIVE_SHIELD:
			leek.buffRelativeShield(value, this.jumping)
			break
		case EffectType.VULNERABILITY:
			leek.buffRelativeShield(-value, this.jumping)
			break
		case EffectType.ABSOLUTE_VULNERABILITY:
			leek.buffAbsoluteShield(-value, this.jumping)
			break
		case EffectType.BUFF_AGILITY:
			leek.buffAgility(value, this.jumping)
			break
		case EffectType.BUFF_STRENGTH:
			leek.buffStrength(value, this.jumping)
			break
		case EffectType.BUFF_TP:
			leek.buffTP(value, this.jumping)
			break
		case EffectType.BUFF_MP:
			leek.buffMP(value, this.jumping)
			break
		case EffectType.BUFF_WISDOM:
			leek.buffWisdom(value, this.jumping)
			break
		case EffectType.BUFF_RESISTANCE:
			leek.buffResistance(value, this.jumping)
			break
		case EffectType.SHACKLE_MP:
			leek.looseMP(value, this.jumping)
			break
		case EffectType.SHACKLE_TP:
			leek.looseTP(value, this.jumping)
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.looseStrength(value, this.jumping)
			break
		case EffectType.SHACKLE_MAGIC:
			leek.looseMagic(value, this.jumping)
			break
		case EffectType.DAMAGE_RETURN:
			leek.buffDamageReturn(value, this.jumping)
			break
		case EffectType.POISON:
			break
		}
	}

	public removeEffect(id: number) {
		const effect = this.effects[id]

		if (!effect) { return }

		const effectID = effect.effect
		const leek = this.leeks[effect.target]
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
		case EffectType.ABSOLUTE_SHIELD:
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
			leek.agility -= value
			break
		case EffectType.BUFF_STRENGTH:
			leek.strength -= value
			break
		case EffectType.BUFF_WISDOM:
			leek.wisdom -= value
			break
		case EffectType.BUFF_RESISTANCE:
			leek.resistance -= value
			break
		case EffectType.DAMAGE_RETURN:
			leek.damageReturn -= value
			break
		}
		// Gestion des états du poireau
		if (effect.objectType === 'weapon') {
			if (effect.object === 46) {
				leek.stopBurn()
			} else if (effect.object === 48) {
				leek.stopGaz()
			}
		}
		delete leek.effects[id]
		delete this.effects[id]
	}

	public updateEffect(id: number, new_value: number) {

		const effect = this.effects[id]
		if (!effect) { return }

		const effectID = effect.effect
		const leek = this.leeks[effect.target]
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
			leek.agility += delta
			break
		case EffectType.BUFF_STRENGTH:
			leek.strength += delta
			break
		case EffectType.BUFF_WISDOM:
			leek.wisdom += delta
			break
		case EffectType.BUFF_RESISTANCE:
			leek.resistance += delta
			break
		case EffectType.DAMAGE_RETURN:
			leek.damageReturn += delta
			break
		}
		effect.value = new_value // Updating the effect's value to properly remove it with `removeEffect`
	}
	public readLogs() {
		if (this.logs == null) { return }
		if (!(this.currentAction in this.logs)) { return }
		for (let l = this.currentLog; l < this.logs[this.currentAction].length; ++l) {
			this.currentLog++
			const log = this.logs[this.currentAction][l]
			const type = log[1]
			if (type === 5) {
				this.pause()
				this.actions[this.currentAction - 1].logs.push(log)
				return true
			} else if (type === 4) {
				this.addMarker(log[0], log[2], log[3], log[4])
			} else {
				const action = Math.max(1, this.currentAction - 1)
				this.actions[action].logs.push(log)
			}
		}
		return false
	}
	public actionDone() {
		this.actionToDo = true
		this.actionDelay = 6
	}
	public log(action: any) {
		if (!this.jumping) {
			this.currentActions.push({id: this.currentAction, action, logs: []})
		}
	}

	public mousemove(e: MouseEvent) {
		this.mouseX = (e.pageX - this.mouseOriginX) * this.ratio
		this.mouseY = (e.pageY - this.mouseOriginY) * this.ratio
		const x = (this.mouseX / this.ground.tileSizeX) * 2 - 0.5
		const y = (this.mouseY / this.ground.tileSizeY) * 2 - 0.5
		let cx = Math.floor(x)
		let cy = Math.floor(y)
		const ox = x - cx - 0.5
		const oy = y - cy - 0.5
		if ((cx + cy) % 2 === 1) {
			if (-oy > Math.abs(ox)) { // en haut
				cy--
			} else if (oy > Math.abs(ox)) { // en bas
				cy++
			} else if (ox > Math.abs(oy)) { // à droite
				cx++
			} else { // forcément à gauche
				cx--
			}
		}
		if (cx >= 0 && cy >= 0 && cx < this.ground.tilesX * 2 - 1 && cy < this.ground.tilesY * 2 - 1) {
			this.mouseTileX = cx
			this.mouseTileY = cy
			this.mouseCell = this.ground.xyToCell(cx, cy)
			const cell = this.ground.cellToXY(this.mouseCell)
			this.mouseCellX = cell.x
			this.mouseCellY = cell.y
			const pos = this.ground.xyToXYPixels(cell.x, cell.y)
			this.mouseRealX = pos.x * this.ground.scale
			this.mouseRealY = pos.y * this.ground.scale
			let hover_entity = null
			for (const entity of this.leeks) {
				if (entity.cell === this.mouseCell && entity.active) {
					hover_entity = entity
					break
				}
			}
			if (!this.mouseEntity && hover_entity) {
				this.canvas.style.cursor = "pointer"
			}
			if (this.mouseEntity && !hover_entity) {
				this.canvas.style.cursor = "auto"
			}
			this.mouseEntity = hover_entity
		} else {
			this.mouseTileX = undefined
			this.mouseTileY = undefined
			this.mouseCell = undefined
			this.mouseEntity = null
			this.canvas.style.cursor = "auto"
		}
	}

	public click() {
		return this.mouseEntity
	}

	public addMarker(owner: number, cells: number[], color: string, duration: number) {
		for (const cell of cells) {
			const pos = this.ground.cellToXY(cell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			const x = xy.x * this.ground.scale
			const y = xy.y * this.ground.scale
			if (color.length === 8) { color = color.substr(2) }
			this.markers[cell] = {owner, color: '#' + color, duration, x, y}
		}
	}

	public addDrawableElement(element: any, line: number): number {
		this.drawableElementCurrentId++
		this.drawableElements[line][this.drawableElementCurrentId] = element
		return this.drawableElementCurrentId
	}

	public moveDrawableElement(element: any, id: number, line: number, newLine: number) {
		if (!this.drawableElements[newLine]) {
			console.warn("Error moving object to line " + newLine)
			return
		}
		this.drawableElements[newLine][id] = element // Ajout de l'élément sur la nouvelle ligne
		this.removeDrawableElement(id, line) // Destruction de l'élément sur l'ancienne ligne
	}

	public removeDrawableElement(id: number, line: number) {
		if (this.drawableElements[line] !== undefined) {
			if (this.drawableElements[line][id] != null) {
				delete this.drawableElements[line][id]
			}
		}
	}

	public setEffectArea(x: number, y: number, area: number, color: string, duration: number = 80) {

		x *= this.ground.scale
		y *= this.ground.scale

		this.drawArea = duration
		this.areaColor = color

		this.area = []
		const w = this.ground.tileSizeX
		const h = this.ground.tileSizeY

		if (area === Area.SINGLE_CELL) {

			this.area.push([x, y])

		} else if (area === Area.CIRCLE1) {

			this.area.push([x - w / 2, y - h / 2])
			this.area.push([x + w / 2, y - h / 2])

			this.area.push([x, y])

			this.area.push([x - w / 2, y + h / 2])
			this.area.push([x + w / 2, y + h / 2])

		} else if (area === Area.CIRCLE2) {

			this.area.push([x - w, y - h])
			this.area.push([x, y - h])
			this.area.push([x + w, y - h])

			this.area.push([x - w / 2, y - h / 2])
			this.area.push([x + w / 2, y - h / 2])

			this.area.push([x - w, y])
			this.area.push([x, y])
			this.area.push([x + w, y])

			this.area.push([x - w / 2, y + h / 2])
			this.area.push([x + w / 2, y + h / 2])

			this.area.push([x - w, y + h])
			this.area.push([x, y + h])
			this.area.push([x + w, y + h])

		} else if (area === Area.CIRCLE3) {

			this.area.push([x - 1.5 * w, y - 1.5 * h])
			this.area.push([x - 0.5 * w, y - 1.5 * h])
			this.area.push([x + 0.5 * w, y - 1.5 * h])
			this.area.push([x + 1.5 * w, y - 1.5 * h])

			this.area.push([x - w, y - h])
			this.area.push([x, y - h])
			this.area.push([x + w, y - h])

			this.area.push([x - 1.5 * w, y - h / 2])
			this.area.push([x - 0.5 * w, y - h / 2])
			this.area.push([x + 0.5 * w, y - h / 2])
			this.area.push([x + 1.5 * w, y - h / 2])

			this.area.push([x - w, y])
			this.area.push([x, y])
			this.area.push([x + w, y])

			this.area.push([x - 1.5 * w, y + h / 2])
			this.area.push([x - 0.5 * w, y + h / 2])
			this.area.push([x + 0.5 * w, y + h / 2])
			this.area.push([x + 1.5 * w, y + h / 2])

			this.area.push([x - w, y + h])
			this.area.push([x, y + h])
			this.area.push([x + w, y + h])

			this.area.push([x - 1.5 * w, y + 1.5 * h])
			this.area.push([x - 0.5 * w, y + 1.5 * h])
			this.area.push([x + 0.5 * w, y + 1.5 * h])
			this.area.push([x + 1.5 * w, y + 1.5 * h])
		}
	}

	public drawEffectArea() {

		this.ctx.save()

		this.ctx.globalAlpha = 0.4 * Math.min(1, this.drawArea / 10)
		this.ctx.fillStyle = this.areaColor

		for (const cell of this.area) {
			this.drawEffectTile(cell[0], cell[1])
		}
		this.ctx.restore()
	}

	public drawEffectTile(x: number, y: number) {

		this.ctx.save()

		this.ctx.translate(x, y)

		this.ctx.beginPath()
		this.ctx.moveTo(0, -this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(this.ground.tileSizeX / 2.1, 0)
		this.ctx.lineTo(0, this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(-this.ground.tileSizeX / 2.1, 0)
		this.ctx.closePath()

		this.ctx.fill()

		this.ctx.restore()
	}

	public drawMarker(x: number, y: number, color: string) {

		this.ctx.save()

		this.ctx.globalAlpha = 0.7
		this.ctx.fillStyle = color

		this.ctx.translate(x, y)

		this.ctx.beginPath()
		this.ctx.moveTo(0, -this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(this.ground.tileSizeX / 2.1, 0)
		this.ctx.lineTo(0, this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(-this.ground.tileSizeX / 2.1, 0)
		this.ctx.closePath()

		this.ctx.fill()

		this.ctx.restore()
	}

	public showCell() {

		const alpha = (50 - this.showCellTime) / 50

		this.ctx.globalAlpha = alpha

		this.ctx.save()

		this.ctx.translate(this.showCellX, this.showCellY)

		this.ctx.beginPath()
		this.ctx.moveTo(0, -this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(this.ground.tileSizeX / 2.1, 0)
		this.ctx.lineTo(0, this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(-this.ground.tileSizeX / 2.1, 0)
		this.ctx.closePath()

		this.ctx.lineCap = 'round'

		this.ctx.globalAlpha = 0.4
		this.ctx.strokeStyle = 'black'
		this.ctx.lineWidth = 8 * this.ground.scale
		this.ctx.stroke()

		this.ctx.globalAlpha = 1
		this.ctx.strokeStyle = this.showCellColor
		this.ctx.lineWidth = 4 * this.ground.scale
		this.ctx.stroke()

		const y = Math.pow(this.showCellTime, 2) / 15
		this.ctx.beginPath()
		this.ctx.moveTo(-18 * this.ground.scale, -(y + 40) * this.ground.scale)
		this.ctx.lineTo(0, -(y + 32) * this.ground.scale)
		this.ctx.lineTo(18 * this.ground.scale, -(y + 40) * this.ground.scale)
		this.ctx.lineTo(0, -(y + 10) * this.ground.scale)
		this.ctx.closePath()

		this.ctx.globalAlpha = 0.4
		this.ctx.strokeStyle = 'black'
		this.ctx.stroke()

		this.ctx.globalAlpha = 1
		this.ctx.fillStyle = this.showCellColor
		this.ctx.fill()

		this.ctx.restore()

		this.ctx.globalAlpha = 1
	}

	public redraw() {
		if (!this.launched) { return }
		this.requestPause = this.paused
		this.draw()
	}

	public draw() {

		// Draw ground
		this.ground.draw(this.ctx)

		// Draw ground particles
		this.particles.drawGround(this.ctx)

		// Draw leeks paths
		for (const i in this.leeks) {
			if (this.leeks[i].active) { this.leeks[i].drawPath(this.ctx) }
		}

		// Effect area
		if (this.drawArea > 0) {
			this.drawEffectArea()
		}

		// Draw markers
		for (const m in this.markers) {
			const marker = this.markers[m]
			this.drawMarker(marker.x, marker.y, marker.color)
		}
		// Show pointer cell
		this.drawPointerCell()

		// Draw elements
		for (const line of this.drawableElements) {
			for (const j in line) {
				line[j].draw(this.ctx)
			}
		}

		// Show cell
		if (this.showCellTime > 0) {
			this.showCell()
		}

		// Draw air particles
		this.particles.drawAir(this.ctx)

		// Life bars
		for (const entity of this.leeks) {
			if (entity.isDead() || !entity.active) { continue }
			if ((this.showLifes && (this.mouseEntity == null || this.distance2(entity.x, entity.y, this.mouseTileX!, this.mouseTileY!) > 8)) || this.mouseCell === entity.cell) {
				entity.drawName(this.ctx)
			}
		}

		if (this.requestPause) {
			this.paused = true
			this.requestPause = false
		}
		// Bubbles
		for (const i in this.leeks) {
			if (this.leeks[i].active) { this.leeks[i].drawBubble(this.ctx) }
		}
		// Info texts
		for (const i in this.leeks) {
			if (this.leeks[i].active) { this.leeks[i].drawTexts(this.ctx) }
		}
		this.ground.endDraw(this.ctx)
	}

	public distance2(x1: number, y1: number, x2: number, y2: number) {
		return Math.abs(x1 - x2) + Math.abs(y1 - y2)
	}

	public drawPointerCell() {
		if (this.mouseCell === undefined) { return }
		this.ctx.save()

		this.ctx.beginPath()
		const dx = this.ground.tileSizeX
		const dy = this.ground.tileSizeY
		const x = this.mouseRealX!
		const y = this.mouseRealY!
		this.ctx.moveTo(x, y - dy / 2)
		this.ctx.lineTo(x + dx / 2, y)
		this.ctx.lineTo(x, y + dy / 2)
		this.ctx.lineTo(x - dx / 2, y)
		this.ctx.closePath()

		this.ctx.strokeStyle = 'black'
		this.ctx.lineCap = 'round'
		this.ctx.lineJoin = 'round'
		this.ctx.lineWidth = 2
		this.ctx.stroke()

		this.ctx.globalAlpha = 1
		this.ctx.restore()
	}

	public showReport() {
		this.going_to_report = true
		document.body.style.cursor = ''
	}

	public jump(jumpAction: number) {
		// Return to initial state
		for (const i in this.states) {
			const leek = this.leeks[i] as Leek
			leek.active = this.states[i].active
			leek.life = this.states[i].life
			leek.maxLife = this.states[i].max_life
			leek.tp = this.states[i].tp
			leek.mp = this.states[i].mp
			leek.agility = this.states[i].agility
			leek.strength = this.states[i].strength
			leek.wisdom = this.states[i].wisdom
			leek.resistance = this.states[i].resistance
			leek.science = this.states[i].science
			leek.magic = this.states[i].magic
			leek.absoluteShield = 0
			leek.relativeShield = 0
			leek.damageReturn = 0
			leek.dead = false
			leek.burning = 0
			leek.gazing = 0
			leek.bubble = new Bubble(this)
			leek.weapon = null

			if (leek.drawID) {
				this.removeDrawableElement(leek.drawID, leek.dy)
				leek.drawID = null
			}
			leek.setCell(this.states[i].cell)

			if (!leek.active) {
				if (leek.summon) {
					const index = this.entityOrder.indexOf(leek)
					if (index !== -1) { this.entityOrder.splice(index, 1) }
				}
			} else {
				leek.drawID = this.addDrawableElement(leek, leek.dy)
			}
			leek.moveDelay = 0
			leek.path = []
		}

		// Clear entity effects
		for (const entity of this.leeks) {
			entity.effects = {}
		}
		this.currentActions = []
		this.effects = []

		for (let i = 0; i < this.particles.particles.length; i++) {
			this.particles.particles.splice(i, 1)
			i--
		}

		this.markers = []
		this.currentTurn = 0
		this.turn = 1
		this.currentPlayer = null

		this.showCellTime = 0
		for (const chip of this.chips) {
			chip.done = true
		}

		// Do actions
		this.jumping = true
		let action = 1
		while (action < jumpAction) {
			this.doAction(this.actions[action])
			action++
		}

		// End
		this.jumping = false
		this.currentAction = action

		for (const e in this.leeks) {
			const entity = this.leeks[e]
			entity.setCell(entity.cell)
		}
		this.requestPause = this.paused
		this.draw()
	}

	public resourceLoaded(res: string) {
		this.loadedData++
		if (this.cancelled) { return }
		// console.log("Resource loaded : " + res + " (" + this.loadedData + "/" + this.numData + ")")
		if (this.loadedData === this.numData && this.initialized === true) {
			this.launch() // Start game if all resources are loaded
		}
	}
}

export { Game, Colors, TEAM_COLORS, SHADOW_SCALE, SHADOW_ALPHA, GROUND_TEXTURE }
