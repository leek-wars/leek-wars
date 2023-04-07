
import Player from '@/component/player.vue'
import { Bubble } from '@/component/player/game/bubble'
import { Bulb } from '@/component/player/game/bulb'
import { Acceleration, Adrenaline, Alteration, Antidote, Armor, Armoring, Arsenic, BallAndChain, Bandage, Bark, BoxingGlove, Brainwashing, Bramble, Burning, Carapace, ChipAnimation, Collar, Covetousness, Covid, Crushing, Cure, Desintegration, DevilStrike, Dome, Doping, Drip, Elevation, Ferocity, Fertilizer, Flame, Flash, Fortress, Fracture, Grapple, Helmet, Ice, Iceberg, Inversion, Jump, Knowledge, LeatherBoots, Liberation, Lightning, Loam, Manumission, Meteorite, Mirror, Motivation, Mutation, Pebble, Plague, Plasma, Precipitation, Prism, Protein, Punishment, Rage, Rampart, Reflexes, Regeneration, Remission, Repotting, Resurrection, Rock, Rockfall, Serum, SevenLeagueBoots, Shield, Shock, SlowDown, Solidification, Soporific, Spark, Stalactite, Steroid, Stretching, Summon, Teleportation, Therapy, Thorn, Toxin, Tranquilizer, Transmutation, Vaccine, Vampirization, Venom, Wall, WarmUp, Whip, WingedBoots, Wizardry } from '@/component/player/game/chips'
import { DamageType, EntityDirection, EntityType, FightEntity } from '@/component/player/game/entity'
import { Ground } from '@/component/player/game/ground'
import { Leek } from '@/component/player/game/leek'
import { Arena, Beach, DarkNexus, Desert, Factory, Forest, Glacier, Map, Nexus } from '@/component/player/game/maps'
import { Obstacle } from '@/component/player/game/obstacle'
import { Particles } from '@/component/player/game/particles'
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Axe, Bazooka, BLaser, Broadsword, DarkKatana, Destroyer, DoubleGun, Electrisor, EnhancedLightninger, ExplorerRifle, Fish, FlameThrower, Gazor, GrenadeLauncher, HeavySword, IllicitGrenadeLauncher, JLaser, Katana, Laser, Lightninger, MachineGun, Magnum, MLaser, MysteriousElectrisor, Neutrino, Pistol, RevokedMLaser, Rhino, Rifle, Shotgun, Sword, UnbridledGazor, UnstableDestroyer } from '@/component/player/game/weapons'
import { locale } from '@/locale'
import { Action, ActionType } from '@/model/action'
import { Area } from '@/model/area'
import { Cell } from '@/model/cell'
import { CHIPS } from '@/model/chips'
import { EffectType, EntityEffect } from '@/model/effect'
import { Fight, FightData, FightType } from '@/model/fight'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import Vue from 'vue'
import { Chest } from './chest'
import { Turret } from './turret'

enum Colors {
	MP_COLOR = "#08D900",
	LIFE_COLOR = "#ff0000",
	MAX_LIFE_COLOR = "#00d5b5",
	TP_COLOR = "#FF7F01",
	SHIELD_COLOR = "#FF4A01",
	STRENGTH_COLOR = "#833100",
	AGILITY_COLOR = "#0080F7",
	WISDOM_COLOR = "#5ebe00",
	RESISTANCE_COLOR = "#fe7700",
	MAGIC_COLOR = "#b800b6",
	SCIENCE_COLOR = "#0000a2",
}

// Params
const FPS = 60
const MAX_DT = 8
const GROUND_TEXTURE = true
const SHADOW_SCALE = 0.5
const SHADOW_ALPHA = 0.55

let lastTime = new Date().getTime()
let dt = 0
const frameTime = 1000 / FPS
const lastFPS = [] as number[]

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
	Turret,
	Chest,
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
	JLaser, // 17
	IllicitGrenadeLauncher, // 18
	MysteriousElectrisor, // 19
	UnbridledGazor, // 20
	RevokedMLaser, // 21
	Rifle, // 22
	Rhino, // 23
	ExplorerRifle, // 24
	Lightninger, // 25
	null, // 26
	Neutrino, // 27
	null, // 28
	Bazooka, // 29
	null, // 30
	null, // 31
	DarkKatana, // 32
	EnhancedLightninger, // 33
	UnstableDestroyer, // 34
	Sword, // 35
	HeavySword, // 36
]

const CHIP_ANIMATIONS = [
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
	Summon, // 40 summon
	null, // 41
	null, // 42
	null, // 43
	null, // 44
	null, // 45
	null, // 46
	Remission, // 47
	Carapace, // 48
	Resurrection, // 49
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
	Punishment, // 71
	Covetousness, // 72
	Vampirization, // 73
	Precipitation, // 74
	Alteration, // 75
	Plasma, // 76
	null, // 77 bulb
	Jump, // 78
	Covid, // 79
	Elevation, // 80
	Knowledge, // 81
	Wizardry, // 82
	Repotting, // 83
	Therapy, // 84
	Mutation, // 85
	Desintegration, // 86
	Transmutation, // 87
	Grapple, // 88
	BoxingGlove, // 89
	null, // 90
	null, // 91
	null, // 92 bulb
	null, // 93 bulb
	Serum, // 94
	Crushing, // 95
	Brainwashing, // 96
	Arsenic, // 97
	Bramble, // 98
	Dome, // 99
	Manumission, // 100
	null,
	null,
	null,
	Prism, // 104
]

class Game {
	public canvas!: HTMLCanvasElement
	public loadedData: number = 0
	public numData: number = 0
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
	public teams: FightEntity[][] = []
	public leeks: FightEntity[] = []
	public farmers: {[key: number]: any} = {}
	public entityOrder: FightEntity[] = []
	public states: {[key: number]: any} = []
	// Actions
	public data!: FightData
	public actions: Action[] = []
	public consoleLines: any[] = []
	public currentAction: number = -1
	public actionToDo = true
	public actionDelay = 0
	public turn = 1
	public turnPosition: {[key: number]: number} = {}
	public effects: EntityEffect[] = []
	public startTurn: number = 1
	public startAction: number = 0
	// Chips
	public chips: ChipAnimation[] = []
	// Logs
	public logs: {[key: number]: any} = {}
	public currentLog = 0
	// Marqueurs
	public markers = [] as any[]
	public markersText = [] as any[]
	// Map
	public mapType: number = -1 // -1 = pas initialisée
	public map!: Map
	public drawArea = 0
	// Mouse
	public mouseX = 0
	public mouseY = 0
	public mouseTileX: number | undefined = 0
	public mouseTileY: number | undefined = 0
	public mouseCell: Cell | undefined = undefined
	public mouseCellX: number = 0
	public mouseCellY: number = 0
	public mouseRealX: number = 0
	public mouseRealY: number = 0
	public mouseEntity: FightEntity | null = null
	// Settings
	public large = true
	public tactic = false
	public shadows = true
	public showCells: boolean = false
	public showLifes: boolean = true
	public showEffects: boolean = true
	public showIDs: boolean = false
	public showActions: boolean = true
	public dark: boolean = false
	public autoDark: boolean = true
	public largeActions: boolean = false
	public actionsWidth: number = 400
	public displayDebugs: boolean = true
	public displayAllyDebugs: boolean = true
	public plainBackground: boolean = false
	public sound: boolean = false
	public atmosphere!: Sound
	public obstacles!: {[key: number]: number[]}
	public error: boolean = false
	public fps: number = 0
	public avgFPS: number = 0
	public showCellTime: number = 0
	public currentPlayer: number | null = null
	public selectedEntity: FightEntity | null = null
	public hoverEntity: FightEntity | null = null
	public jumping: any
	public logging: any = true
	public jumpRequested: boolean = false
	public jumpAction: number = 0
	public ratio: number = 1
	public areaColor: any
	public area!: any[]
	public showCellX: any
	public showCellY: any
	public ctx!: CanvasRenderingContext2D
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
	public textRatio: number = 1
	public trophies: any[] = []
	public trophiesToSend: any[] = []
	public progressBarMarkers: {[key: number]: any} = {}

	public maps: Map[] = [
		new Nexus(this),
		new Factory(this),
		new Desert(this),
		new Forest(this),
		new Glacier(this),
		new Beach(this),
		new Arena(this)
	]
	public darkNexus = new DarkNexus(this)

	constructor() {
		for (let i = 0; i < this.ground.field.tilesY * 2; i++) {
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
		this.trophies = fight.trophies
		this.trophiesToSend = [...fight.trophies]

		// Check data
		if (this.data == null) {
			console.warn("Fight is null...")
			this.setError()
			return
		}

		this.mapType = this.data.map.type + 1
		this.map = this.maps[this.mapType]
		if (this.mapType === 0 && this.dark) {
			this.map = this.darkNexus
		}
		this.map.seed = fight.id
		this.map.create()

		// Atmosphere sound of the map
		this.atmosphere = this.map.options.sound

		// Obstacles
		if (this.halloween) {
			T.pumpkin.load(this)
		}

		this.obstacles = this.data.map.obstacles
		for (const i in this.obstacles) {
			const o = this.obstacles[i]
			const size = o instanceof Array ? o[1] : o // Before the obstacle was an array [type, size]
			if (size !== -1) {
				const obstacle = new Obstacle(this, size, this.ground.field.cells[parseInt(i, 10)])
				obstacle.resize()
				this.ground.addObstacle(obstacle)
			}
		}

		// Add entities
		const entities = this.data.leeks

		for (const e of entities) {

			const type = typeof(e.type) === 'undefined' ? EntityType.LEEK : e.type

			const entity = new ENTITY_CLASSES[type](this, e.team, e.level, e.name)

			// Infos vitales
			entity.id = e.id
			entity.level = e.level
			entity.team = e.team
			entity.type = type
			entity.summon = typeof(e.summon) === 'undefined' ? false : e.summon
			if (entity.team === 2) {
				entity.orientation = -1
			}

			entity.farmer = null
			if (typeof(e.farmer) !== 'undefined') {
				entity.farmer = ((entity.team === 1 || fight.type === FightType.BATTLE_ROYALE) ? fight.farmers1 : fight.farmers2)[e.farmer]
			}

			////// Stats

			// Life
			entity.life = e.life
			entity.maxLife = entity.life
			entity.initialMaxLife = entity.maxLife

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

			if (!entity.summon) {
				const cell = this.ground.field.cells[e.cellPos]
				cell.setEntity(entity)
				entity.setCell(cell)
				if (entity.cell) {
					entity.setOrientation(this.getInitialOrientation(entity.cell))
				}
			}

			for (const id in fight.farmers1) {
				this.farmers[id] = fight.farmers1[id]
			}
			for (const id in fight.farmers2) {
				this.farmers[id] = fight.farmers2[id]
			}

			this.leeks[entity.id] = entity

			// entity
			if (entity instanceof Leek) {

				if (this.teams[entity.team - 1] === undefined) {
					Vue.set(this.teams, entity.team - 1, [])
				}
				this.teams[entity.team - 1].push(entity)
				this.entityOrder.push(entity)

				// Skin
				const skin = typeof(e.skin) === 'undefined' ? 1 : e.skin
				const hat = typeof(e.hat) === 'undefined' ? null : e.hat
				const appearance = LeekWars.getLeekAppearance(entity.level)
				const metal = typeof(e.metal) === 'undefined' ? (e.level >= 80) : e.metal
				const face = typeof(e.face) === 'undefined' ? (e.level >= 20 ? 2 : 0) : e.face
				entity.setSkin(skin, appearance, hat, metal, face)
				entity.active = true
				entity.drawID = this.addDrawableElement(entity, entity.y)

				const l1 = fight.leeks1.find(l => l.name === entity.name)
				if (l1) { entity.fish = l1.fish }
				const l2 = fight.leeks2.find(l => l.name === entity.name)
				if (l2) { entity.fish = l2.fish }

			} else if (entity instanceof Bulb) {

				entity.name = i18n.t('entity.' + entity.name) as string
				if (e.critical) {
					entity.name += (locale === 'fr' ? ' !' : '!')
					entity.initialMaxLife = entity.initialMaxLife / 1.2
					entity.updateGrowth()
				}
				entity.setSkin(e.skin)

			} else if (entity instanceof Turret) {

				entity.name = i18n.t('entity.turret') as string

				if (this.teams[entity.team - 1] === undefined) {
					this.teams[entity.team - 1] = []
				}
				this.teams[entity.team - 1].push(entity)
				this.entityOrder.push(entity)

				entity.active = true
				entity.drawID = this.addDrawableElement(entity, entity.y)

			} else if (entity instanceof Chest) {

				entity.name = i18n.t('entity.' + entity.name) as string

				if (this.teams[entity.team - 1] === undefined) {
					this.teams[entity.team - 1] = []
				}
				this.teams[entity.team - 1].push(entity)
				this.entityOrder.push(entity)
				entity.setOrientation(EntityDirection.SOUTH)

				entity.active = true
				entity.drawID = this.addDrawableElement(entity, entity.y)
			}
		}

		// Actions
		this.actions = this.data.actions.map(a => new Action(a))
		this.currentAction = 0

		// Check first action
		if (this.actions.length === 0 || this.actions[0].type !== ActionType.START_FIGHT) {
			console.warn("Error ! no action START_FIGHT")
			this.setError()
			return
		}
		this.log(this.actions[0])

		// Get the relative position of the turns in the actions
		this.turnPosition = {1: 0}
		for (let i = 0; i < this.actions.length; ++i) {
			if (this.actions[i].type === ActionType.NEW_TURN) {
				this.turnPosition[this.actions[i].params[1]] = i / this.actions.length
			}
		}

		// Lecture des actions pour déterminer les puces et armes utilisées
		const chipsUsed = new Set<number>()
		const weaponsTaken = new Set<number>()
		for (const action of this.actions) {
			switch (action.type) {
				case ActionType.USE_CHIP_OLD: {
					chipsUsed.add(action.params[3])
					break
				}
				case ActionType.USE_CHIP: {
					chipsUsed.add(action.params[1])
					break
				}
				case ActionType.SET_WEAPON_OLD:
					weaponsTaken.add(action.params[2])
					break
				case ActionType.SET_WEAPON:
					weaponsTaken.add(action.params[1])
					break
				case ActionType.LAMA:
					S.lama.load(this)
					T.lama.load(this)
					break
				case ActionType.BUG:
					T.bug.load(this)
					S.crash.load(this)
					break
				case ActionType.SUMMON:
					chipsUsed.add(40)
					break
			}
		}
		// console.log("used chips", chipsUsed)
		// console.log("weapons taken", weaponsTaken)
		// console.log("weapons used", weaponsUsed)

		// Load common textures
		T.tp.load(this)
		T.mp.load(this)
		T.critical.load(this)
		S.critical.load(this)
		S.leek_explosion.load(this)
		S.leek_slice.load(this)
		S.bury.load(this)
		T.smoke.load(this)
		S.burn.load(this)
		if (chipsUsed.size > 0) {
			S.chip.load(this)
			T.chip_one.load(this)
			T.chip_zero.load(this)
		}

		const textures = new Set<Texture>()
		const sounds = new Set<Sound>()
		for (const chip of chipsUsed) {
			const chipAnimation = CHIP_ANIMATIONS[chip - 1]
			if (!chipAnimation) { continue }
			for (const texture of chipAnimation.textures) {
				textures.add(texture)
			}
			for (const sound of chipAnimation.sounds) {
				sounds.add(sound)
			}
		}
		for (const weapon of weaponsTaken) {
			const weaponAnimation = WEAPONS[weapon - 1]
			if (!weaponAnimation) { continue }
			for (const texture of weaponAnimation.textures) {
				textures.add(texture)
			}
			for (const sound of weaponAnimation.sounds) {
				sounds.add(sound)
			}
		}
		for (const texture of Fish.textures) {
			textures.add(texture)
		}
		for (const sound of Fish.sounds) {
			sounds.add(sound)
		}
		// console.log("textures to load", textures)
		// console.log("sounds to load", sounds)
		for (const texture of textures) {
			texture.load(this)
		}
		for (const sound of sounds) {
			sound.load(this)
		}

		// On a chargé tout le jeu, on peut charger les ressources
		// le jeu démarrera quand toutes les ressources seront ok
		this.initialized = true

		if (this.loadedData === this.numData) {
			this.launch() // Start game if all resources are loaded
		}
	}

	public setLogs(logs: any) {
		// Merge logs
		// return
		for (const farmer in logs) {
			const farmerLogs = logs[farmer]
			const me = parseInt(farmer, 10) === store.state.farmer!.id
			for (const action in farmerLogs) {
				const actionI = parseInt(action, 10)
				if (!(action in this.logs)) {
					Vue.set(this.logs, actionI, [])
				}
				for (const log of farmerLogs[action]) {
					const type = log[1]
					log[5] = me
					if (me || (type !== 4 && type !== 9 && type !== 10 && type !== 5)) {
						this.logs[actionI].push(log)
					}
				}
			}
		}
		this.resourceLoaded('logs')
	}

	/*
	 * Ressources chargées, on peut y aller
	 */
	public launch() {
		// Atmosphere sound
		if (this.atmosphere != null && this.sound) {
			this.atmosphere.loop(this)
		}
		for (const obstacle of this.ground.obstacles) {
			obstacle.resize()
			this.ground.addObstacleElement(obstacle)
		}
		this.ground.resize(this.width, this.height, this.shadows)

		for (const entity of this.leeks) {
			if (entity.active) {
				entity.setCell(entity.cell!)
			}
		}

		// console.log(this.leeks)
		for (const leek of this.leeks) {
			this.states[leek.id] = {
				absoluteShield: 0,
				relativeShield: 0,
				active: !leek.summon,
				life: leek.life,
				maxLife: leek.life,
				tp: leek.tp,
				mp: leek.mp,
				agility: leek.agility,
				strength: leek.strength,
				wisdom: leek.wisdom,
				damageReturn: leek.damageReturn,
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

		if (this.startAction) {
			if (this.startAction >= 0 && this.startAction < this.actions.length) {
				this.jump(this.startAction)
			}
		} else if (this.startTurn !== 1) {
			for (let a = 0; a < this.actions.length; ++a) {
				const action = this.actions[a]
				if (action.type === ActionType.NEW_TURN && action.params[1] === this.startTurn) {
					this.jump(a)
				}
			}
		}
	}

	public resize(width: number, height: number) {
		this.width = width
		this.height = height
		this.ground.resize(width, height, this.shadows)
		this.textRatio = Math.sqrt(window.devicePixelRatio)
	}
	public setOrigin(originX: number, originY: number) {
		this.mouseOriginX = originX + Math.round(this.ground.startX / this.ratio)
		this.mouseOriginY = originY + Math.round(this.ground.startY / this.ratio)
	}

	public updateFrame() {
		if (!this.paused) {
			this.update()
			setTimeout(() => this.updateFrame(), frameTime)
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
				this.atmosphere.loop(this)
			} else {
				this.atmosphere.stop()
			}
		}
	}

	public update() {

		// Jump ?
		if (this.jumpRequested) {
			this.jumpRequested = false
			this.jump(this.jumpAction)
		}

		if (!this.paused) {

			this.computeDT()

			// Logs
			const needPause = this.readLogs()

			// Actions
			if (!needPause) {
				if (this.actionToDo) {
					this.actionDelay -= dt
					if (this.actionDelay <= 0) {

						this.readTrophies() // Sur l'action qui vient de finir

						this.actionDelay = 0
						this.actionToDo = false
						this.currentAction++

						const action = this.actions[this.currentAction]

						if (action === undefined) {
							// this.log(i18n.t('fight.end_of_fight') as string)
							this.reportTimer = setTimeout(() => this.showReport(), 2500)
							return
						}
						this.doAction(action)
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
				if (this.mouseEntity !== hover_entity) {
					this.mouseEntity = hover_entity
					if (this.mouseEntity) {
						this.mouseEntity.updateReachableCells()
					}
				}
				if (this.mouseCell !== undefined) {
					if (this.hoverEntity !== hover_entity) {
						this.hoverEntity = hover_entity
						if (this.hoverEntity) {
							this.hoverEntity.updateReachableCells()
						}
					}
				}

				// Chips
				for (let c = 0; c < this.chips.length; ++c) {
					const chip = this.chips[c]
					chip.update(dt)
					if (chip.willFinish) {
						this.chips.splice(c, 1)
						c--
					} else if (chip.done) {
						this.chips.splice(c, 1)
						c--
						this.actionDone()
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
				this.atmosphere.loop(this)
			}
			this.paused = false
			this.updateFrame()
		}
	}

	public doAction(action: Action) {
		switch (action.type) {
		case ActionType.NEW_TURN: {
			this.turn = action.params[1]
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.LEEK_TURN: {
			this.log(action)
			this.currentPlayer = action.params[1]
			const entity = this.leeks[action.params[1]]

			for (const effect_id in entity.launched_effects) {
				const effect = entity.launched_effects[effect_id]
				if (effect.turns === 1) {
					delete entity.launched_effects[effect_id]
				} else if (effect.turns !== -1) {
					effect.turns--
				}
			}

			if (this.logging) {
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
				for (const m in this.markersText) {
					const marker = this.markersText[m]
					if (marker.owner === this.currentPlayer) {
						marker.duration--
						if (marker.duration === 0) {
							delete this.markersText[m]
						}
					}
				}
			}
			this.actionDone()
			break
		}
		case ActionType.END_TURN: {
			this.currentPlayer = null
			// Reinitialisation of characteristics
			this.leeks[action.params[1]].tp = action.params[2]
			this.leeks[action.params[1]].mp = action.params[3]
			this.actionDone(0)
			break
		}
		case ActionType.MOVE_TO: {
			const entity = action.params[1]
			const end_cell = action.params[3][action.params[3].length - 1]
			if (this.jumping) {
				this.ground.field.cells[end_cell].setEntity(this.leeks[entity])
				this.leeks[action.params[1]].looseMP(action.params[3].length, this.jumping)
				this.actionDone()
			} else {
				const cells = [] as Cell[]
				for (const c of action.params[3]) {
					cells.push(this.ground.field.cells[c])
				}
				this.leeks[action.params[1]].move(cells)
			}
			break
		}
		case ActionType.MP_LOST: {
			// this.leeks[action.params[1]].looseMP(action.params[2], this.jumping)
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
		case ActionType.SET_WEAPON_OLD: {
			const leek = this.leeks[action.params[1]] as Leek
			if (leek.fish) {
				leek.setWeapon(new Fish(this))
			} else {
				leek.setWeapon(new WEAPONS[action.params[2] - 1]!(this))
			}
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.SET_WEAPON: {
			const leek = this.leeks[this.currentPlayer!] as Leek
			if (leek.fish) {
				leek.setWeapon(new Fish(this))
			} else {
				leek.setWeapon(new WEAPONS[action.params[1] - 1]!(this))
			}
			action.entity = leek
			leek.looseTP(1, this.jumping)
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.USE_CHIP:
		case ActionType.USE_CHIP_OLD: {

			let chip: number, cell: Cell, result: number, new_format: boolean = false
			if (action.params.length === 4) { // Nouveau format [ type, chip, cell, result ]
				chip = action.params[1]
				cell = this.ground.field.cells[action.params[2]]
				result = action.params[3]
				new_format = true
			} else { // Nouveau format [ type, caster, cell, chip, result, targets ]
				cell = this.ground.field.cells[action.params[2]]
				chip = action.params[3]
				result = action.params[4]
			}

			const caster = this.leeks[this.currentPlayer!]
			const chip_template = CHIPS[LeekWars.chipTemplates[chip].item]
			const targets = this.ground.field.getTargets(cell, chip_template.area, caster.cell!) as FightEntity[]

			action.entity = caster
			action.item = chip_template
			this.log(action)

			if (this.jumping) {
				// Update leek cell after teleportation
				if (chip === 37 || chip === 78) {
					cell.setEntity(caster)
				}
				if (chip === 88) { // grapple
					if (targets.length) {
						const realCell = this.ground.field.computeAttractCell(caster.cell!, targets[0].cell!, cell)
						realCell.setEntity(targets[0])
					}
				}
				if (chip === 89) { // boxing glove
					if (targets.length) {
						const realCell = this.ground.field.getLastAvailableCell(caster.cell!, cell)
						realCell.setEntity(targets[0])
					}
				}
				// Update leeks cells after inversion / repotting
				if (chip === 39 || chip === 83) {
					if (targets.length) { // C'est possible de lancer dans le vide
						const launcher_cell = caster.cell!
						cell.setEntity(caster)
						launcher_cell.setEntity(targets[0])
					}
				}
				this.actionDone()
				break
			}

			if (new_format) {
				caster.looseTP(chip_template.cost, this.jumping)
			}

			if (CHIP_ANIMATIONS[chip - 1] !== null && chip !== 40) {
				const chipAnimation: ChipAnimation = new CHIP_ANIMATIONS[chip - 1]!(this)
				caster.useChip(chipAnimation, cell, targets, result)
				this.chips.push(chipAnimation)
				caster.lastDamageType = chipAnimation.damageType
			} else {
				this.actionDone()
			}
			break
		}
		case ActionType.USE_WEAPON:
		case ActionType.USE_WEAPON_OLD: {

			let cell: Cell, result: number, new_format: boolean = false
			if (action.params.length === 3) { // Nouveau format [ type, cell, result ]
				cell = this.ground.field.cells[action.params[1]]
				result = action.params[2]
				new_format = true
			} else { // Ancien format [ type, caster, cell, targets, result ]
				cell = this.ground.field.cells[action.params[2]]
				result = action.params[4]
			}

			const leek = this.leeks[this.currentPlayer!] as Leek
			const weapon_template = LeekWars.weapons[LeekWars.items[leek.weapon!.id].params]
			leek.lastDamageType = leek.weapon!.damageType
			action.entity = leek
			action.item = weapon_template
			this.log(action)

			if (this.jumping) {
				this.actionDone()
				break
			}

			// console.log(leek.weapon, weapon_template)
			const targets = this.ground.field.getTargets(cell, weapon_template.area, leek.cell!) as FightEntity[]

			const duration = leek.useWeapon(cell, targets, result)
			this.actionDone(Math.max(6, duration))

			if (new_format) {
				leek.looseTP(weapon_template.cost, this.jumping)
			}

			break
		}
		case ActionType.LIFE_LOST:
		case ActionType.DAMAGE_RETURN:
		case ActionType.POISON_DAMAGE:
		case ActionType.LIFE_DAMAGE:
		case ActionType.AFTEREFFECT:
		{
			const erosion = action.params.length > 3 ? action.params[3] : 0
			this.leeks[action.params[1]].looseLife(action.params[2], erosion, this.jumping)
			this.log(action)
			if (!this.jumping) {
				this.leeks[action.params[1]].randomHurt()
			}
			this.actionDone()
			break
		}
		case ActionType.NOVA_DAMAGE: {
			this.leeks[action.params[1]].looseMaxLife(action.params[2], this.jumping)
			this.log(action)
			if (!this.jumping) {
				this.leeks[action.params[1]].randomHurt()
			}
			this.actionDone()
			break
		}
		case ActionType.NOVA_VITALITY: {
			this.leeks[action.params[1]].winMaxLife(action.params[2], this.jumping)
			this.log(action)
			if (!this.jumping) {
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
				const index = this.entityOrder.indexOf(entity)
				if (index !== -1) {
					this.entityOrder.splice(index, 1)
				}
			}

			// Ajout du marqueur
			this.addTimelineMarker(action, entity)

			// Remove all effects
			for (const effect in entity.effects) {
				this.removeEffect(parseInt(effect))
			}

			if (entity.cell) {
				entity.cell.entity = null
				entity.cell = null
			}
			if (this.jumping) {
				entity.active = false
				entity.kill(false, DamageType.DEFAULT, 0, 0)
				this.actionDone()
			} else {
				this.log(action)
				const killer = this.leeks[action.params[2]]
				if (killer) {
					const dx = (entity.x - killer.x)
					const dy = (entity.y - killer.y) / 2
					const angle = Math.atan2(dy, dx)
					const ndx = Math.cos(angle)
					const ndy = Math.sin(angle)
					// console.log("dx", dx, "dy", dy, "angle", angle, "ndx", ndx, "ndy", ndy)
					entity.kill(true, killer.lastDamageType, ndx, ndy) // Animation
				} else {
					entity.kill(true, DamageType.DEFAULT, 0, 0) // Animation
				}
			}
			break
		}
		case ActionType.SAY_OLD: {
			action.entity = this.leeks[this.currentPlayer!]
			this.log(action)
			if (!this.jumping) {
				const entity = this.leeks[action.params[1]]
				let message = action.params[2]
				if (entity.farmer && entity.farmer.muted) {
					message = "@*%#$€"
				}
				entity.say(this.ctx, message)
			}
			this.actionDone(40)
			break
		}
		case ActionType.SAY: {
			action.entity = this.leeks[this.currentPlayer!]
			this.log(action)
			if (!this.jumping) {
				let message = action.params[1]
				if (action.entity.farmer && action.entity.farmer.muted) {
					message = "@*%#$€"
				}
				action.entity.say(this.ctx, message)
				action.entity.looseTP(1, this.jumping)
			}
			this.actionDone(40)
			break
		}
		case ActionType.LAMA: {
			action.entity = this.leeks[this.currentPlayer!]
			this.log(action)
			action.entity.looseTP(1, this.jumping)
			if (!this.jumping) {
				this.leeks[this.currentPlayer!].sayLama()
			}
			this.actionDone(40)
			break
		}
		case ActionType.SUMMON: {
			const caster = action.params[1]
			const summonID = action.params[2]
			const cell = this.ground.field.cells[action.params[3]]
			const result = action.params[4]
			const summon = this.leeks[summonID]
			summon.summoner = this.leeks[caster]
			this.log(action)
			if (this.jumping) {
				cell.setEntity(summon)
				summon.active = true
				const index = this.entityOrder.findIndex((e) => e.id === caster)
				this.entityOrder.splice(index + 1, 0, summon)
				this.actionDone()
			} else {
				const chipAnimation: Summon = new Summon(this)
				chipAnimation.summon = summon
				;(summon.summoner as Leek).useChip(chipAnimation, cell, [summon], result)
				this.chips.push(chipAnimation)
			}
			break
		}
		case ActionType.RESURRECTION: {
			const target = action.params[2]
			const cell = this.ground.field.cells[action.params[3]]
			const life = action.params[4]
			const maxLife = action.params[5]
			const entity = this.leeks[target]

			entity.life = life
			entity.maxLife = maxLife
			entity.reborn()
			cell.setEntity(entity)
			if (!this.jumping) {
				entity.setCell(cell)
				entity.drawID = this.addDrawableElement(entity, entity.y)
			}

			// Ajout du marqueur
			this.addTimelineMarker(action, entity)

			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.SHOW_OLD: {
			action.entity = this.leeks[this.currentPlayer!]
			this.log(action)
			if (this.jumping) {
				this.actionDone()
				break
			}
			this.showCellCell = this.ground.field.cells[action.params[2]]
			this.showCellColor = '#' + action.params[3]
			const pos = this.ground.field.cellToXY(this.showCellCell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			this.showCellX = xy.x * this.ground.scale
			this.showCellY = xy.y * this.ground.scale
			this.showCellTime = 50
			break
		}
		case ActionType.SHOW: {
			action.entity = this.leeks[this.currentPlayer!]
			this.log(action)
			action.entity.looseTP(1, this.jumping)
			if (this.jumping) {
				this.actionDone()
				break
			}
			this.showCellCell = this.ground.field.cells[action.params[1]]
			this.showCellColor = '#' + action.params[2]
			const pos = this.ground.field.cellToXY(this.showCellCell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			this.showCellX = xy.x * this.ground.scale
			this.showCellY = xy.y * this.ground.scale
			this.showCellTime = 50
			break
		}
		case ActionType.ADD_WEAPON_EFFECT:
		case ActionType.ADD_CHIP_EFFECT: {
			this.addEffect(action, false)
			this.actionDone()
			break
		}
		case ActionType.ADD_STACKED_EFFECT : {
			this.addEffect(action, true)
			this.actionDone()
			break
		}
		case ActionType.STACK_EFFECT: {
			this.stackEffect(action)
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
		case ActionType.REDUCE_EFFECTS : {
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.REMOVE_POISONS : {
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.REMOVE_SHACKLES : {
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.BUG: {
			this.log(action)
			if (this.jumping) {
				this.actionDone()
			} else {
				this.leeks[action.params[1]].bug()
			}
			break
		}
		case ActionType.OPEN_CHEST: {
			this.log(action)
			this.actionDone()
			break
		}
		case ActionType.END_FIGHT: {
			break
		}
		default: {
			console.warn("Erreur : action inconnue", action)
			this.actionDone()
		}
		}
		if (!this.jumping) {
			// On peut logger pour cette action !
			this.currentLog = 0
		}
	}

	public stackEffect(action: Action) {
		const id = action.params[1]
		const value = action.params[2]

		const effect = this.effects[id]
		if (effect) {
			effect.value += value
			const leek = this.leeks[effect.target]
			this.updateCharacteristics(leek, effect.type, value)

			action.item = effect
			this.log(action)
		}
	}

	public addEffect(action: Action, stacked: boolean) {

		const item = action.params[1]
		const id = action.params[2]
		const caster_id = action.params[3]
		const target = action.params[4]
		const type = action.params[5]
		const value = action.params[6]
		const turns = action.params[7]

		const caster = this.leeks[caster_id]
		const leek = this.leeks[target]

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

			const modifiers = action.params.length >= 8 ? action.params[8] : 0

			// Ajout de l'image sur le hud
			let image: string = ''
			if (item === 0) {
				image = LeekWars.STATIC + "image/fight/power.png"
			} else if (item in CHIPS) {
				image = LeekWars.STATIC + "image/chip/" + CHIPS[item].name + ".png"
			} else /* weapon */ {
				if (item in LeekWars.items) {
					const template = LeekWars.items[item].params
					const img = ["pistol", "machine_gun", "double_gun", "shotgun", "magnum", "laser", "grenade_launcher", "flamme", "destroyer", "gaz_icon", "electrisor", "m_laser", "b_laser", "katana", "broadsword", "axe", "j_laser", "illicit_grenade_launcher", "mysterious_electrisor", "unbridled_gazor", "revoked_m_laser", "rifle", "rhino", "explorer_rifle",
					"lightninger",
					null, // 26
					"neutrino", // 27
					null, // 28
					"bazooka", // 29
					null, // 30
					null, // 31
					"dark_katana", // 32
					"enhanced_lightninger", // 33
					"unstable_destroyer", // 34
					"sword", // 35
					"heavy_sword", // 36
				][template - 1]
					image = LeekWars.STATIC + "image/weapon/" + img + ".png"
					// Gestion des états du poireau
					if (template === 8) {
						leek.burn()
					} else if (template === 10) {
						leek.gaz()
					}
				}
			}
			const texture = new Image()
			texture.src = image

			// Ajout de l'effet
			this.effects[id] = { id, item, caster: caster_id, target, type, value, turns, texture, modifiers }
			leek.effects[id] = this.effects[id]
			caster.launched_effects[id] = this.effects[id]
		}

		this.log(action)

		this.updateCharacteristics(leek, type, value)
	}

	public updateCharacteristics(leek: FightEntity, type: number, value: number) {
		switch (type) {
			case EffectType.ABSOLUTE_SHIELD:
			case EffectType.DAMAGE_TO_ABSOLUTE_SHIELD:
			case EffectType.RAW_ABSOLUTE_SHIELD:
			case EffectType.STEAL_ABSOLUTE_SHIELD:
				leek.buffAbsoluteShield(value, this.jumping)
				break
			case EffectType.RELATIVE_SHIELD:
			case EffectType.RAW_RELATIVE_SHIELD:
				leek.buffRelativeShield(value, this.jumping)
				break
			case EffectType.VULNERABILITY:
				leek.buffRelativeShield(-value, this.jumping)
				break
			case EffectType.ABSOLUTE_VULNERABILITY:
				leek.buffAbsoluteShield(-value, this.jumping)
				break
			case EffectType.BUFF_AGILITY:
			case EffectType.RAW_BUFF_AGILITY:
				leek.buffAgility(value, this.jumping)
				break
			case EffectType.RAW_BUFF_MAGIC:
				leek.buffMagic(value, this.jumping)
				break
			case EffectType.RAW_BUFF_SCIENCE:
				leek.buffScience(value, this.jumping)
				break
			case EffectType.BUFF_STRENGTH:
			case EffectType.RAW_BUFF_STRENGTH:
				leek.buffStrength(value, this.jumping)
				break
			case EffectType.BUFF_TP:
			case EffectType.RAW_BUFF_TP:
				leek.buffTP(value, this.jumping)
				break
			case EffectType.BUFF_MP:
			case EffectType.RAW_BUFF_MP:
				leek.buffMP(value, this.jumping)
				break
			case EffectType.BUFF_WISDOM:
			case EffectType.RAW_BUFF_WISDOM:
				leek.buffWisdom(value, this.jumping)
				break
			case EffectType.BUFF_RESISTANCE:
			case EffectType.RAW_BUFF_RESISTANCE:
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
			case EffectType.SHACKLE_AGILITY:
				leek.looseAgility(value, this.jumping)
				break
			case EffectType.SHACKLE_WISDOM:
				leek.looseWisdom(value, this.jumping)
				break
			case EffectType.DAMAGE_RETURN:
				leek.buffDamageReturn(value, this.jumping)
				break
			case EffectType.POISON:
				break
			case EffectType.RAW_BUFF_POWER:
				leek.buffPower(value, this.jumping)
				break
		}
	}

	public removeEffect(id: number) {
		const effect = this.effects[id]

		if (!effect) { return }

		const effectID = effect.type
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
		case EffectType.SHACKLE_AGILITY:
			leek.agility += value
			break
		case EffectType.SHACKLE_WISDOM:
			leek.wisdom += value
			break
		case EffectType.ABSOLUTE_SHIELD:
		case EffectType.STEAL_ABSOLUTE_SHIELD:
		case EffectType.RAW_ABSOLUTE_SHIELD:
		case EffectType.DAMAGE_TO_ABSOLUTE_SHIELD:
			leek.absoluteShield -= value
			break
		case EffectType.RELATIVE_SHIELD:
		case EffectType.RAW_RELATIVE_SHIELD:
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
		case EffectType.RAW_BUFF_WISDOM:
			leek.wisdom -= value
			break
		case EffectType.RAW_BUFF_MAGIC:
			leek.magic -= value
			break
		case EffectType.RAW_BUFF_SCIENCE:
			leek.science -= value
			break
		case EffectType.BUFF_RESISTANCE:
		case EffectType.RAW_BUFF_RESISTANCE:
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
		case EffectType.RAW_BUFF_POWER:
			leek.power -= value
			break
		}
		// Gestion des états du poireau
		if (effect.item === 46) {
			leek.stopBurn()
		} else if (effect.item === 48) {
			leek.stopGaz()
		}
		Vue.delete(leek.effects, id)
		delete this.effects[id]
	}

	public updateEffect(id: number, new_value: number) {

		const effect = this.effects[id]
		if (!effect) { return }

		const effectID = effect.type
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
		case EffectType.DAMAGE_TO_ABSOLUTE_SHIELD:
		case EffectType.RAW_ABSOLUTE_SHIELD:
		case EffectType.STEAL_ABSOLUTE_SHIELD:
			leek.absoluteShield += delta
			break
		case EffectType.RELATIVE_SHIELD:
		case EffectType.RAW_RELATIVE_SHIELD:
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
		case EffectType.RAW_BUFF_WISDOM:
			leek.wisdom += delta
			break
		case EffectType.RAW_BUFF_MAGIC:
			leek.magic += delta
			break
		case EffectType.RAW_BUFF_SCIENCE:
			leek.science += delta
			break
		case EffectType.BUFF_RESISTANCE:
		case EffectType.RAW_BUFF_RESISTANCE:
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
		case EffectType.RAW_BUFF_POWER:
			leek.power += delta
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
			if (this.displayDebugs && (this.displayAllyDebugs || log[5])) {
				if (type === 5) {
					this.pause()
					this.addConsoleLine({id: 'l' + this.currentAction + '-' + this.currentLog, log})
					return true
				} else if (type === 4) {
					this.addMarker(log[0], log[2], log[3], log[4])
				} else if (type === 9) {
					this.addTextMarker(log[0], log[2], log[3], log[4], log[5])
				} else if (type === 10) {
					this.clearMarks()
				} else {
					this.addConsoleLine({id: 'l' + this.currentAction + '-' + this.currentLog, log})
				}
			}
		}
		return false
	}

	public readTrophies() {
		for (let t = 0; t < this.trophiesToSend.length; ++t) {
			const trophy = this.trophiesToSend[t]
			if (this.currentAction >= trophy.action) {
				this.player.$emit('unlock-trophy', trophy.trophy)
				this.trophiesToSend.splice(t, 1)
				t--
			}
		}
		for (let t = 0; t < this.trophies.length; ++t) {
			const trophy = this.trophies[t]
			if (this.currentAction === trophy.action) {
				this.addConsoleLine({id: 't' + t, trophy})
			}
		}
	}

	public actionDone(delay: number = 6) {
		this.actionToDo = true
		this.actionDelay = delay
	}
	public log(action: any) {
		if (this.logging) {
			this.addConsoleLine({id: 'a' + this.currentAction, action})
		}
	}
	public addConsoleLine(line: any) {
		this.consoleLines.push(line)
		if (this.consoleLines.length > 80) {
			this.consoleLines.shift()
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
		if (cx >= 0 && cy >= 0 && cx < this.ground.field.tilesX * 2 - 1 && cy < this.ground.field.tilesY * 2 - 1) {
			this.mouseTileX = cx
			this.mouseTileY = cy
			const cell = this.ground.field.xyToCell(cx, cy)
			if (cell.obstacle) {
				this.mouseCell = undefined
			} else {
				this.mouseCell = cell
				const xy = this.ground.field.cellToXY(this.mouseCell)
				this.mouseCellX = xy.x
				this.mouseCellY = xy.y
				const pos = this.ground.xyToXYPixels(xy.x, xy.y)
				this.mouseRealX = pos.x * this.ground.scale
				this.mouseRealY = pos.y * this.ground.scale
			}
			let hover_entity = null
			for (const entity of this.leeks) {
				if (entity.cell === this.mouseCell && entity.active && !entity.dead) {
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
			if (this.mouseEntity !== hover_entity) {
				this.mouseEntity = hover_entity
				if (this.mouseEntity) {
					this.mouseEntity.updateReachableCells()
				}
			}
		} else {
			this.mouseTileX = undefined
			this.mouseTileY = undefined
			this.mouseCell = undefined
			this.mouseEntity = null
			this.canvas.style.cursor = "auto"
		}
		if (this.paused) {
			this.draw()
		}
	}

	public click() {
		return this.mouseEntity
	}

	public addTimelineMarker(action: Action, entity: FightEntity) {

		const width = Math.max(100 / this.actions.length, 0.7)
		let left = this.currentAction / this.actions.length * 100
		if (left + width > 100) left -= left + width - 100
		const background =  entity.summon ? entity.lifeColorLighter : entity.lifeColor
		const outline = action.type == ActionType.RESURRECTION ? '1.5px solid #fff' : '1.5px solid #000'
		this.progressBarMarkers[this.currentAction] = { left, width, background, outline }
	}

	public addMarker(owner: number, cells: number[], color: string, duration: number) {
		for (const cell_id of cells) {
			const cell = this.ground.field.cells[cell_id]
			const pos = this.ground.field.cellToXY(cell)
			if (color.length === 8) { color = color.substring(2) }
			this.markers[cell.id] = {owner, color: '#' + color, duration, x: pos.x, y: pos.y}
		}
	}

	public addTextMarker(owner: number, cells: number[], text: string, color: string, duration: number) {
		for (const cell_id of cells) {
			const cell = this.ground.field.cells[cell_id]
			const pos = this.ground.field.cellToXY(cell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			if (color.length === 8) { color = color.substring(2) }
			this.markersText[cell.id] = {owner, text, color: '#' + color, duration, x: xy.x, y: xy.y}
		}
	}

	public clearMarks() {
		this.markers = []
		this.markersText = []
	}

	public addDrawableElement(element: any, line: number): number {
		// console.log("add drawable element")
		this.drawableElementCurrentId++
		this.drawableElements[line][this.drawableElementCurrentId] = element
		return this.drawableElementCurrentId
	}

	public moveDrawableElement(element: any, id: number, line: number, newLine: number) {
		// console.log("move drawable element")
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

	public createEffectAreaCells(cells: Cell[], lines: number[][], convert: {[key: number]: [number, number]}) {
		const area = []
		for (const cell of cells) {
			const xy = this.ground.field.cellToXY(cell)
			const c = convert[cell.id]
			area.push([xy.x, xy.y, lines[c[0]][c[1]]])
		}
		return area
	}

	public setEffectAreaLaser(cells: Cell[], color: string, dx: number, dy: number, duration: number = 60) {
		this.drawArea = duration
		this.areaColor = color
		this.area = []
		const sides = dx === 0 ? 1 + 4 : 2 + 8
		const first = dx === 0 ? (dy > 0 ? 2 : 8) : (dx > 0 ? 1 : 4)
		const last = dx === 0 ? (dy > 0 ? 8 : 2) : (dx > 0 ? 4 : 1)
		for (let c = 0; c < cells.length; ++c) {
			const cell = cells[c]
			const xy = this.ground.field.cellToXY(cell)
			const lines = sides + (c === 0 ? first : (c === cells.length - 1 ? last : 0))
			this.area.push([xy.x, xy.y, lines])
		}
	}

	public setEffectArea(cell: Cell, area: number, color: string, duration: number = 80) {
		this.drawArea = duration
		this.areaColor = color
		this.area = this.createEffectAreaOutline(cell, area)
	}

	public createEffectAreaOutline(cell: Cell, area: number) {

		const cells = [] as Cell[]
		const lines = [] as number[][]
		const convert = {} as {[key: number]: [number, number]}
		let c = 0

		const init_lines = (l: number) => {
			for (let i = 0; i < l; ++i) {
				lines.push(new Array(l).fill(0))
			}
			c = Math.floor(l / 2)
		}

		const add_cell = (x: number, y: number) => {
			const n = this.ground.field.next_cell(cell, x, y)
			lines[c + x][c + y] = ~lines[c + x][c + y] + 16
			if (n && !n.obstacle) {
				if (x < c) { lines[c + x + 1][c + y] ^= 1 }
				if (y < c) { lines[c + x][c + y + 1] ^= 2 }
				if (x > -c) { lines[c + x - 1][c + y] ^= 4 }
				if (y > -c) { lines[c + x][c + y - 1] ^= 8 }
			}
			if (n === null || n.obstacle) { return }
			cells.push(n)
			convert[n.id] = [c + x, c + y]
		}

		if (area === Area.CIRCLE1) {

			init_lines(3)
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)

		} else if (area === Area.CIRCLE2) {

			init_lines(5)
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)
			add_cell(2, 0)
			add_cell(0, 2)
			add_cell(-2, 0)
			add_cell(0, -2)
			add_cell(-1, -1)
			add_cell(1, -1)
			add_cell(-1, 1)
			add_cell(1, 1)

		} else if (area === Area.CIRCLE3) {

			init_lines(7)
			add_cell(0, 0)
			add_cell(1, 0)
			add_cell(0, 1)
			add_cell(-1, 0)
			add_cell(0, -1)
			add_cell(2, 0)
			add_cell(0, 2)
			add_cell(-2, 0)
			add_cell(0, -2)
			add_cell(3, 0)
			add_cell(0, 3)
			add_cell(-3, 0)
			add_cell(0, -3)
			add_cell(-1, -1)
			add_cell(1, -1)
			add_cell(-1, 1)
			add_cell(1, 1)
			add_cell(1, 2)
			add_cell(2, 1)
			add_cell(2, -1)
			add_cell(1, -2)
			add_cell(-1, -2)
			add_cell(-2, -1)
			add_cell(-2, 1)
			add_cell(-1, 2)

		} else if (area === Area.PLUS_2) {
			init_lines(5)
			add_cell(0, 0)
			for (let i = 1; i <= 2; ++i) {
				add_cell(i, 0)
				add_cell(0, i)
				add_cell(-i, 0)
				add_cell(0, -i)
			}
		} else if (area === Area.PLUS_3) {
			init_lines(7)
			add_cell(0, 0)
			for (let i = 1; i <= 3; ++i) {
				add_cell(i, 0)
				add_cell(0, i)
				add_cell(-i, 0)
				add_cell(0, -i)
			}
		} else if (area === Area.X_1) {
			init_lines(3)
			add_cell(0, 0)
			for (let i = 1; i <= 1; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		} else if (area === Area.X_2) {
			init_lines(5)
			add_cell(0, 0)
			for (let i = 1; i <= 2; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		} else if (area === Area.X_3) {
			init_lines(7)
			add_cell(0, 0)
			for (let i = 1; i <= 3; ++i) {
				add_cell(i, i)
				add_cell(i, -i)
				add_cell(-i, i)
				add_cell(-i, -i)
			}
		} else if (area === Area.SQUARE_1) {
			init_lines(3)
			for (let i = -1; i <= 1; ++i) {
				for (let j = -1; j <= 1; ++j) {
					add_cell(i, j)
				}
			}
		} else if (area === Area.SQUARE_2) {
			init_lines(5)
			for (let i = -2; i <= 2; ++i) {
				for (let j = -2; j <= 2; ++j) {
					add_cell(i, j)
				}
			}
		}
		return this.createEffectAreaCells(cells, lines, convert)
	}

	public createReachableAreaOutline(mp: number, cell: Cell, reachableCells: Set<Cell>) {

		const cells = [] as Cell[]
		const lines = [] as number[][]
		const convert = {} as {[key: number]: [number, number]}
		let c = 0

		const init_lines = (l: number) => {
			for (let i = 0; i < l; ++i) {
				lines.push(new Array(l).fill(0))
			}
			c = Math.floor(l / 2)
		}

		const add_cell = (x: number, y: number) => {
			const n = this.ground.field.next_cell(cell, x, y)
			lines[c + x][c + y] = ~lines[c + x][c + y] + 16
			if (n && !n.obstacle) {
				if (x < c) { lines[c + x + 1][c + y] ^= 1 }
				if (y < c) { lines[c + x][c + y + 1] ^= 2 }
				if (x > -c) { lines[c + x - 1][c + y] ^= 4 }
				if (y > -c) { lines[c + x][c + y - 1] ^= 8 }
			}
			if (n === null || n.obstacle) { return }
			cells.push(n)
			convert[n.id] = [c + x, c + y]
		}

		init_lines(2 * mp + 1)
		for (const reachableCell of reachableCells) {
			add_cell(reachableCell.x - cell.x, reachableCell.y - cell.y)
		}

		return this.createEffectAreaCells(cells, lines, convert)
	}

	public updateReachableCells() {
		// Update only the necessary entities
		if (this.selectedEntity && this.selectedEntity.active) {
			this.selectedEntity.updateReachableCells()
		}
		if (this.mouseEntity && this.mouseEntity.active) {
			this.mouseEntity.updateReachableCells()
		}
		if (this.hoverEntity && this.hoverEntity.active) {
			this.hoverEntity.updateReachableCells()
		}
	}

	public selectEntity(entity: FightEntity | null) {
		this.selectedEntity = entity
		if (this.selectedEntity) {
			this.selectedEntity.updateReachableCells()
		}
	}

	public drawEffectArea(area: any, color: string, width: number, lineAlpha: number, areaAlpha: number) {

		this.ctx.save()

		this.ctx.fillStyle = color
		this.ctx.strokeStyle = color
		this.ctx.lineWidth = width * this.ground.scale
		this.ctx.lineCap = 'round'

		for (const cell of area) {
			this.drawEffectTile(cell[0], cell[1], cell[2], lineAlpha, areaAlpha)
		}
		this.ctx.restore()
	}

	public drawEffectTile(x: number, y: number, lines: number, lineAlpha: number, areaAlpha: number) {

		this.ctx.save()
		this.ctx.globalAlpha = areaAlpha

		const xy = this.ground.xyToXYPixels(x, y)
		this.ctx.translate(xy.x * this.ground.scale, xy.y * this.ground.scale)

		this.ctx.beginPath()
		this.ctx.moveTo(0, -this.ground.tileSizeY / 2.)
		this.ctx.lineTo(this.ground.tileSizeX / 2., 0)
		this.ctx.lineTo(0, this.ground.tileSizeY / 2.)
		this.ctx.lineTo(-this.ground.tileSizeX / 2., 0)
		this.ctx.closePath()
		this.ctx.fill()

		if (lines) {
			this.ctx.globalAlpha = lineAlpha
			if (lines & 2) {
				this.ctx.beginPath()
				this.ctx.moveTo(0, -this.ground.tileSizeY / 2.)
				this.ctx.lineTo(this.ground.tileSizeX / 2., 0)
				this.ctx.closePath()
				this.ctx.stroke()
			}
			if (lines & 4) {
				this.ctx.beginPath()
				this.ctx.moveTo(this.ground.tileSizeX / 2., 0)
				this.ctx.lineTo(0, this.ground.tileSizeY / 2.)
				this.ctx.closePath()
				this.ctx.stroke()
			}
			if (lines & 8) {
				this.ctx.beginPath()
				this.ctx.moveTo(0, this.ground.tileSizeY / 2.)
				this.ctx.lineTo(-this.ground.tileSizeX / 2., 0)
				this.ctx.closePath()
				this.ctx.stroke()
			}
			if (lines & 1) {
				this.ctx.beginPath()
				this.ctx.moveTo(-this.ground.tileSizeX / 2., 0)
				this.ctx.lineTo(0, -this.ground.tileSizeY / 2.)
				this.ctx.closePath()
				this.ctx.stroke()
			}
		}

		this.ctx.restore()
	}

	public drawMarker(x: number, y: number, color: string) {

		this.ctx.save()

		this.ctx.globalAlpha = 0.7
		this.ctx.fillStyle = color

		const xy = this.ground.xyToXYPixels(x, y)
		this.ctx.translate(xy.x * this.ground.scale, xy.y * this.ground.scale)

		this.ctx.beginPath()
		this.ctx.moveTo(0, -this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(this.ground.tileSizeX / 2.1, 0)
		this.ctx.lineTo(0, this.ground.tileSizeY / 2.1)
		this.ctx.lineTo(-this.ground.tileSizeX / 2.1, 0)
		this.ctx.closePath()

		this.ctx.fill()

		this.ctx.restore()
	}

	public drawTextMarker(x: number, y: number, text: string, color: string) {

		this.ctx.save()

		this.ctx.translate(x * this.ground.scale, y * this.ground.scale)
		this.ctx.scale(this.ground.scale, this.ground.scale)

		this.ctx.globalAlpha = 1
		this.ctx.font = "bold 8pt Roboto"
		this.ctx.fillStyle = color
		this.ctx.lineWidth = 1
		this.ctx.strokeStyle = '#333'
		this.ctx.textAlign = "center"
		this.ctx.textBaseline = "middle"
		this.ctx.strokeText(text, 0, 0)
		this.ctx.fillText(text, 0, 0)

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
		for (const entity of this.leeks) {
			if (entity.active) {
				entity.drawPath(this.ctx)
			}
			if (entity === this.hoverEntity || entity === this.mouseEntity || entity === this.selectedEntity) {
				this.drawEffectArea(entity.reachableCellsArea, this.map.options.reachableColor, 2, 0.7, 0.1)
			}
		}

		// Effect area
		if (this.drawArea > 0) {
			const areaAlpha = 0.5 * Math.min(1, this.drawArea / 10)
			const lineAlpha = 2 * areaAlpha
			this.drawEffectArea(this.area, this.areaColor, 3, lineAlpha, areaAlpha)
		}

		// Draw markers
		for (const m in this.markers) {
			const marker = this.markers[m]
			this.drawMarker(marker.x, marker.y, marker.color)
		}
		// Show pointer cell
		this.drawPointerCell()

		// Chips (back)
		this.ctx.save()
		this.ctx.scale(this.ground.scale, this.ground.scale)
		for (const chip of this.chips) {
			chip.drawBack(this.ctx)
		}
		this.ctx.restore()

		// Draw elements
		for (const line of this.drawableElements) {
			for (const j in line) {
				line[j].draw(this.ctx)
			}
		}

		// Draw cells numbers
		if (this.showCells) {
			this.ground.drawCellNumbers(this.ctx)
		} else {
			for (const m in this.markersText) {
				const marker = this.markersText[m]
				this.drawTextMarker(marker.x, marker.y, marker.text, marker.color)
			}
		}

		// Show cell
		if (this.showCellTime > 0) {
			this.showCell()
		}

		// Draw air particles
		this.particles.drawAir(this.ctx)

		// Chips
		this.ctx.save()
		this.ctx.scale(this.ground.scale, this.ground.scale)
		for (const chip of this.chips) {
			chip.draw(this.ctx)
		}
		this.ctx.restore()

		// Life bars
		for (const entity of this.leeks) {
			if (!entity.active) { continue }
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
		this.ctx.lineWidth = 1.8 * this.ground.scale
		this.ctx.stroke()

		this.ctx.globalAlpha = 1
		this.ctx.restore()
	}

	public showReport() {
		this.going_to_report = true
		document.body.style.cursor = ''
	}

	public requestJump(jumpAction: number) {
		clearTimeout(this.reportTimer)
		if (this.paused) {
			this.jump(jumpAction)
		} else {
			this.jumpRequested = true
			this.jumpAction = jumpAction
		}
	}

	public jump(jumpAction: number) {
		// Return to initial state
		this.ground.field.resetCells()
		for (const i in this.states) {
			const leek = this.leeks[i] as Leek
			leek.active = this.states[i].active
			leek.life = this.states[i].life
			leek.maxLife = this.states[i].maxLife
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
			leek.deadAnim = 0
			leek.burning = 0
			leek.gazing = 0
			leek.crashAnim = 0
			leek.bubble = new Bubble(this)
			leek.weapon = null
			leek.path = []
			leek.moveDelay = 0
			leek.moveAnim = 0
			leek.updateGrowth()
			// leek.setOrientation(Math.random() * 4 | 0 as EntityDirection)

			if (leek.summon) {
				const index = this.entityOrder.indexOf(leek)
				if (index !== -1) {
					this.entityOrder.splice(index, 1)
				}
			} else {
				leek.setCell(this.states[i].cell)
			}
			// Remove drawable element
			if (leek.drawID) {
				this.removeDrawableElement(leek.drawID, leek.y)
				leek.drawID = null
			}
		}

		// Clear entity effects
		for (const entity of this.leeks) {
			entity.effects = {}
			entity.infoText = []
		}
		this.consoleLines = []
		this.effects = []
		this.drawArea = 0

		for (let i = 0; i < this.particles.particles.length; i++) {
			this.particles.particles.splice(i, 1)
			i--
		}

		this.clearMarks()
		this.turn = 1
		this.currentPlayer = null

		this.showCellTime = 0
		for (const chip of this.chips) {
			chip.done = true
		}
		this.chips = []

		// Do actions
		this.jumping = true
		this.logging = false
		this.currentAction = 1
		const loggingAction = Math.max(0, jumpAction - 150)
		while (this.currentAction < loggingAction) {
			this.doAction(this.actions[this.currentAction])
			this.currentAction++
		}
		this.logging = true
		while (this.currentAction < jumpAction) {
			this.doAction(this.actions[this.currentAction])
			this.currentLog = 0
			this.readLogs()
			this.readTrophies()
			this.currentAction++
		}

		// Set cells
		for (const e in this.leeks) {
			const entity = this.leeks[e]
			if (entity.active && entity.cell) {
				entity.setCell(entity.cell!)
				if (!entity.drawID) {
					entity.drawID = this.addDrawableElement(entity, entity.y)
				}
			}
		}
		this.updateReachableCells()

		// End
		this.jumping = false
		this.currentAction = this.currentAction - 1
		this.actionDone() // Start new action

		this.requestPause = this.paused
		this.draw()
	}

	public previousAction() {
		let i = this.currentAction
		if (i >= this.actions.length) i = this.actions.length - 1
		for (; i >= 0; i--) {
			if (this.actions[i].type !== ActionType.REMOVE_EFFECT &&
				this.actions[i].type !== ActionType.ADD_CHIP_EFFECT &&
				this.actions[i].type !== ActionType.END_TURN &&
				this.actions[i].type !== ActionType.ADD_STACKED_EFFECT &&
				this.actions[i].type !== ActionType.ADD_WEAPON_EFFECT) break
		}
		this.requestJump(i)
	}

	public nextAction() {
		let i = this.currentAction + 2
		for (; i < this.actions.length; i++) {
			if (this.actions[i].type !== ActionType.REMOVE_EFFECT &&
				this.actions[i].type !== ActionType.ADD_CHIP_EFFECT &&
				this.actions[i].type !== ActionType.END_TURN &&
				this.actions[i].type !== ActionType.ADD_STACKED_EFFECT &&
				this.actions[i].type !== ActionType.ADD_WEAPON_EFFECT) break
		}
		if (i <= this.actions.length) {
			this.requestJump(i)
		}
	}

	public resourceLoaded(res: string) { // variable "res" utile pour débug
		this.loadedData++
		if (this.cancelled) { return }
		// console.log("Resource loaded : " + res + " (" + this.loadedData + "/" + this.numData + ")")
		if (this.loadedData === this.numData && this.initialized === true) {
			if (!this.launched) {
				this.launch() // Start game if all resources are loaded
			} else {
				this.mapLoaded()
			}
		}
	}

	public getInitialOrientation(cell: Cell) {
		const top = cell.id <= 314
		const mod = this.ground.field.tilesX * 2 - 1
		const left = ((cell.id % mod) * 2) % mod < this.ground.field.tilesX / 2
		if (top && left) {
			return EntityDirection.SOUTH
		} else if (top && !left) {
			return EntityDirection.WEST
		} else if (!top && left) {
			return EntityDirection.EAST
		} else {
			return EntityDirection.NORTH
		}
	}

	public updateMap() {
		this.map = this.maps[this.mapType]
		if (this.mapType === 0 && this.dark) {
			this.map = this.darkNexus
		}
		this.map.create()
		this.atmosphere = this.map.options.sound
	}

	public mapLoaded() {
		this.ground.updateMap()
		this.ground.resize(this.width, this.height, this.shadows)
		this.redraw()
	}

	public toggleDark() {
		if (this.mapType == 0) {
			if (this.dark) {
				this.map = this.darkNexus
			} else {
				this.map = this.maps[this.mapType]
			}
			this.map.create()
			this.atmosphere = this.map.options.sound
		}
	}
}

export { Game, Colors, SHADOW_SCALE, SHADOW_ALPHA, GROUND_TEXTURE }
