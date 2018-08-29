import { Bubble } from '@/component/player/game/bubble'
import { Bulb } from '@/component/player/game/bulb'
import { Acceleration, Adrenaline, Antidote, Armor, Armoring, BallAndChain, Bandage, Bark, Burning, Carapace, Collar, Cure, DevilStrike, Doping, Drip, Ferocity, Fertilizer, Flame, Flash, Fortress, Fracture, Helmet, Ice, Iceberg, Inversion, LeatherBoots, Liberation, Lightning, Loam, Meteorite, Mirror, Motivation, Pebble, Plague, Protein, Rage, Rampart, Reflexes, Regeneration, Remission, Rock, Rockfall, SevenLeagueBoots, Shield, Shock, SlowDown, Solidification, Soporific, Spark, Stalactite, Steroid, Stretching, Teleportation, Thorn, Toxin, Tranquilizer, Vaccine, Venom, Wall, WarmUp, Whip, WingedBoots } from '@/component/player/game/chips'
import { Entity, EntityType } from '@/component/player/game/entity'
import { Ground } from '@/component/player/game/ground'
import { Leek } from '@/component/player/game/leek'
import { Beach, Desert, Factory, Forest, Glacier, Map, Nexus } from '@/component/player/game/maps'
import { Obstacle } from '@/component/player/game/obstacle'
import { Particles } from '@/component/player/game/particles'
import { Sounds } from '@/component/player/game/sound'
import { Textures } from '@/component/player/game/texture'
import { Axe, BLaser, Broadsword, Destroyer, DoubleGun, Electrisor, FlameThrower, Gazor, GrenadeLauncher, Katana, Laser, MachineGun, Magnum, MLaser, Pistol, Shotgun, WhiteWeaponAnimation } from '@/component/player/game/weapons'
import { Area } from '@/model/area'
import { EffectType } from '@/model/effect'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { Action } from './action'
import { FightData } from './fight'

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

const TEAM_COLORS = [
	"#0000AB", // blue
	"#DC0000", // red
	"#4FBF1C", // green
	"#FDED00", // yellow
	"#B02D20", // brown
	"#A2A2A2", // grey
	"#9800AE", // purple
	"#FF7D00", // orange
	"#14D7E4", // cyan
	"#E414C9", // pink
	"#000000", // black
	"#ffffff", // white
]

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
	public loadedData: number = 0
	public numData: number = 0
	public T = new Textures(this)
	public S = new Sounds(this)
	public initialized: boolean = false
	public paused: boolean = false
	public requestPause = false
	public speed = 1
	public focus = true
	public going_to_report = false
	public width: number = 0
	public height: number = 0
	public particles = new Particles(this)
	public ground = new Ground(this)
	public drawableElements: Array<{[key: number]: any}> = []
	public drawableElementCurrentId: number = -1
	// Players
	public teams = new Array()
	public leeks: Entity[] = []
	public entityOrder = new Array()
	public states = new Array()
	// Actions
	public data!: FightData
	public actions!: any[][]
	public currentActions: any[] = []
	public currentAction = -1
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
	public mouseTileX = 0
	public mouseTileY = 0
	public mouseCell = 0
	// Settings
	public large = true
	public debug = false
	public tactic = false
	public shadows = true
	public discretePause = false
	public showCells: boolean
	public showLifes: boolean
	public sound: boolean = false
	public atmosphere: any
	public obstacles!: {[key: number]: number[]}
	public error: boolean = false
	public fps: number = 0
	public avgFPS: number = 0
	public showCellTime: number = 0
	public currentPlayer: any
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
	public maps: Map[] = [
		new Nexus(this),
		new Factory(this),
		new Desert(this),
		new Forest(this),
		new Glacier(this),
		new Beach(this),
	]

	constructor() {
		// Init drawable elements array
		for (let i = 0; i < this.ground.tilesY * 2; i++) {
			this.drawableElements[i] = {}
		}
		// Settings
		if (localStorage.getItem('fight/large') === undefined) { localStorage.setItem('fight/large', 'true') }
		if (localStorage.getItem('fight/sound') === undefined) { localStorage.setItem('fight/sound', 'true') }
		if (localStorage.getItem('fight/shadows') === undefined) { localStorage.setItem('fight/shadows', 'true') }
		this.large = localStorage.getItem('fight/large') === 'true'
		this.debug = localStorage.getItem('fight/debug') === 'true'
		this.tactic = localStorage.getItem('fight/tactic') === 'true'
		this.shadows = localStorage.getItem('fight/shadows') === 'true'
		this.showCells = localStorage.getItem('fight/cells') === 'true'
		this.showLifes = localStorage.getItem('fight/lifes') === 'true'
		this.sound = localStorage.getItem('fight/sound') === 'true'
		this.sound = false
		this.discretePause = localStorage.getItem('fight/discrete_pause') === 'true'

		// Click
		// $(canvas).click(function() {
		// 	if (game.paused) {
		// 		game.resume();
		// 	}
		// });
	}

	public init(fightData: FightData) {
		console.log("Init fight...")
		this.data = fightData

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

			const entity = type === EntityType.LEEK ? new Leek(this) : new Bulb(this)

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

			entity.farmer = 0
			if (typeof(e.farmer) !== 'undefined') {
				entity.farmer = e.farmer
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
			this.entityOrder.push(entity)

			// entity
			if (entity instanceof Leek) {

				if (this.teams[entity.team - 1] === undefined) {
					this.teams[entity.team - 1] = []
				}
				this.teams[entity.team - 1].push(entity)

				// Skin
				const skin = typeof(e.skin) === 'undefined' ? 1 : e.skin
				const hat = typeof(e.hat) === 'undefined' ? null : e.hat
				const appearence = LeekWars.getLeekAppearence(entity.level)
				entity.setSkin(skin, appearence, hat)
				entity.active = true
				entity.drawID = this.addDrawableElement(entity, entity.y)

			} else if (entity instanceof Bulb) {

				entity.setSkin(e.skin)
			}
		}

		// Actions
		this.actions = this.data.actions
		this.currentAction = 0

		// Check first action
		if (this.actions.length === 0 || this.actions[this.currentAction][0] !== Action.START_FIGHT) {
			console.warn("Error ! no action START_FIGHT")
			this.setError()
			return
		}

		// Get the relative position of the turns in the actions
		this.turnPosition = {1: 0}
		for (let i = 0; i < this.actions.length; ++i) {
			if (this.actions[i][0] === Action.NEW_TURN) {
				this.turnPosition[this.actions[i][1]] = i / this.actions.length
			}
		}

		// Chargement des logs
		// if (.connected) {
		// 	_.post('fight/get-logs', {fight_id: _id}, function(data) {
		// 		if (data.success) {
		// 			game.setLogs(data.logs)
		// 			LW.setHabs(data.habs)
		// 		}
		// 	})
		// }

		// On a chargé tout le jeu, on peut charger les ressources
		// le jeu démarrera quand toutes les ressources seront ok
		this.initialized = true

		if (this.loadedData === this.numData) {
			this.launch() // Start game if all resources are loaded
		} else {
			console.log('Wait for the resources...')
		}
	}

	public setLogs(logs: any) {
		this.logs = logs
	}

	/*
	 * Ressources chargées, on peut y aller
	 */
	public launch() {
		console.log("Starting fight...")

		// Atmosphere sound
		if (this.atmosphere != null && this.sound) {
			this.atmosphere.loop()
		}

		// Obstacles
		for (const i in this.obstacles) {
			if (this.obstacles.hasOwnProperty(i)) {
				const o = this.obstacles[i]
				const type = o[0]
				const size = o[1]
				if (size !== -1) {
					const obstacle = new Obstacle(this, type, size, parseInt(i, 10))
					obstacle.resize()
					this.ground.addObstacle(obstacle)
				}
			}
		}
		// $('#loading').hide();
		// $('#game').show();

		// Mouse move
		this.setupMouseMove()

		// if (game.large)	LW.enlarge()
		// LW.pages.fight.resize()

		for (const l in this.leeks) {
			if (this.leeks[l].active) { this.leeks[l].computeOrginPos() }
		}

		// this.log(i18n.t('fight.start_of_fight'))

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

		// $('#progress-bar').click(function(e) {
		// 	var action = Math.round(game.actions.length * (e.pageX - $(this).offset().left) / $(this).width())
		// 	game.jump(action)
		// })

		/*
		 *  Launch!
		 */
		this.updateFrame()
	}

	public resize(width: number, height: number) {
		console.log("Resize game [" + width + " × " + height + "]")
		this.ground.resize(width, height, false, true)
	}

	public updateFrame() {
		if (!this.paused) {
			setTimeout(() => this.updateFrame(), frameTime)
			this.update()
		}
	}

	public setError() {
		// $('#loading').hide();
		// $('#error').show();
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

	public toggleSize() {
		if (this.large) {
			this.large = false
			// LW.shrink()
		} else {
			this.large = true
			// LW.enlarge()
		}
		localStorage.setItem('fight/large', '' + this.large)
	}

	public toggleDebug() {
		this.debug = !this.debug
		localStorage.setItem('fight/debug', '' + this.debug)
		// if (this.debug) $('#debug').show(); else $('#debug').hide();
	}

	public toggleTactic() {
		this.tactic = !this.tactic
		localStorage.setItem('fight/tactic', '' + this.tactic)

		this.requestPause = this.paused
		// LW.pages.fight.resize()
		this.draw() // redraw
	}

	public toggleCells() {
		this.showCells = !this.showCells
		localStorage.setItem('fight/cells', '' + this.showCells)

		this.requestPause = this.paused
		this.draw() // redraw
	}

	public toggleLife() {
		this.showLifes = !this.showLifes
		localStorage.setItem('fight/lifes', '' + this.showLifes)

		this.requestPause = this.paused
		this.draw() // redraw
	}

	public toggleShadows() {
		this.shadows = !this.shadows
		localStorage.setItem('fight/shadows', '' + this.shadows)
	}

	public toggleSound() {
		this.sound = !this.sound
		if (this.atmosphere != null) {
			if (this.sound) {
				this.atmosphere.loop()
			} else {
				this.atmosphere.stop()
			}
		}
		localStorage.setItem('fight/sound', '' + this.sound)
	}

	public toggleDiscretePause() {
		this.discretePause = !this.discretePause
		localStorage.setItem('fight/discrete_pause', '' + this.discretePause)

		this.requestPause = this.paused
		this.draw() // redraw
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
							this.updateBar()

							const action = this.actions[this.currentAction]

							if (action === undefined) {

								// this.log(i18n.t('fight.end_of_fight') as string)
								this.fightEnd = true

								this.reportTimer = setTimeout(this.showReport, 2500)
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
				for (const i in this.leeks) {
					if (this.leeks[i].active) { this.leeks[i].update(dt) }
				}

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

	public doAction(action: any) {

		const type: number = action[0]

		switch (type) {

		case Action.NEW_TURN: {
			this.turn = action[1]
			this.actionDone()
			break
		}
		case Action.LEEK_TURN: {

			this.currentPlayer = action[1]

			if (typeof(action[2]) !== 'undefined' && typeof(action[3]) !== 'undefined') {
				this.leeks[action[1]].tp = action[2]
				this.leeks[action[1]].mp = action[3]
			}

			if (!this.jumping) {
				// Update markers
				for (const m in this.markers) {
					if (this.markers.hasOwnProperty(m)) {
						const marker = this.markers[m]
						if (marker.owner === this.currentPlayer) {
							marker.duration--
							if (marker.duration === 0) {
								delete this.markers[m]
							}
						}
					}
				}
			}
			this.actionDone()
			break
		}
		case Action.END_TURN: {
			// Reinitialisation of characteristics
			this.leeks[action[1]].tp = action[2]
			this.leeks[action[1]].mp = action[3]
			if (action.length > 4) { this.leeks[action[1]].strength = action[4] }
			if (action.length > 5) { this.leeks[action[1]].magic = action[5] }

			this.actionDone()
			break
		}
		case Action.MOVE_TO: {
			if (this.jumping) {
				this.leeks[action[1]].cell = action[2]
				this.actionDone()
			} else {
				this.leeks[action[1]].move(action[3])
			}
			break
		}
		case Action.MP_LOST: {
			this.leeks[action[1]].looseMP(action[2], this.jumping)
			this.actionDone()
			break
		}
		case Action.CARE: {
			this.leeks[action[1]].care(action[2], this.jumping)
			if (!this.jumping) {
				this.log(action)
			}
			this.actionDone()
			break
		}
		case Action.BOOST_VITA: {
			this.leeks[action[1]].boostVita(action[2], this.jumping)
			if (!this.jumping) {
				this.log(action)
			}
			this.actionDone()
			break
		}
		case Action.SET_WEAPON: {
			(this.leeks[action[1]] as Leek).setWeapon(new WEAPONS[action[2] - 1](this))
			if (!this.jumping) {
				this.log(action)
			}
			this.actionDone()
			break
		}
		case Action.USE_CHIP: {

			const launcher = action[1]
			const cell = action[2]
			const chip = action[3]
			const result = action[4]
			const leeksID = action[5]

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

			let log = i18n.t('fight.leek_cast', [
				this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
				i18n.t('chip.' + LeekWars.chips[LeekWars.chipTemplates[chip].item].name),
			]) as string

			if (result > 0) { // Success!
				if (result === 2) {
					log += "... " + i18n.t('effect.critical')
				}
				if (CHIPS[action[3] - 1] !== null) {
					const chipAnimation: any = new CHIPS[action[3] - 1](this)
					const leeks = []
					for (const leek of leeksID) {
						leeks.push(this.leeks[leek])
					}
					this.leeks[action[1]].useChip(chipAnimation, cell, leeks)
					this.chips.push(chipAnimation)
				} else {
					this.actionDone()
				}
			} else {
				// log += "... " + i18n.t('fight.fail');
				this.actionDone()
			}
			this.log(log)

			break
		}
		case Action.USE_WEAPON: {

			if (this.jumping) {
				this.actionDone()
				break
			}
			const launcher = action[1]
			const cell = action[2]
			const result = action[4]
			const leeksID = action[5]

			const gesture = (this.leeks[action[1]] as Leek).weapon instanceof WhiteWeaponAnimation ? 'leek_hit' : 'leek_shoot'
			let log = i18n.t('fight.' + gesture, [this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1]))]) as string

			if (result > 0) { // Success!
				if (result === 2) {
					log += "... " + i18n.t('fight.critical')
				}
				const leeks = new Array()
				for (const leek of leeksID) {
					leeks.push(this.leeks[leek])
				}
				(this.leeks[launcher] as Leek).useWeapon(cell, leeks)
				// Pas de cibles workaround
				if (leeksID.length === 0) {
					this.actionDone()
				}
			}
			this.log(log)
			break
		}
		case Action.LIFE_LOST: {

			const erosion = action.length > 3 ? action[3] : 0
			this.leeks[action[1]].looseLife(action[2], erosion, this.jumping)

			if (!this.jumping) {
				this.log(i18n.t('fight.leek_loose_x', [
					this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
					this.colorText(i18n.t('fight.n_life', [action[2]]) as string, Colors.LIFE_COLOR),
				]) as string)
				this.leeks[action[1]].randomHurt()
			}
			this.actionDone()
			break
		}
		case Action.TP_LOST: {
			this.leeks[action[1]].looseTP(action[2], this.jumping)
			this.actionDone()
			break
		}
		case Action.PLAYER_DEAD: {
			const entity = this.leeks[action[1]]
			if (this.jumping) {
				entity.dead = true
				this.removeDrawableElement(entity.drawID, entity.dy)
				this.actionDone()
			} else {
				this.log(i18n.t('fight.leek_is_dead', this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1]))) as string)
				entity.kill() // Animation
			}
			break
		}
		case Action.SAY: {
			if (!this.jumping) {
				this.log(action)
				this.leeks[action[1]].say(this.ctx, action[2])
			}
			this.actionDone()
			break
		}
		case Action.LAMA: {
			if (!this.jumping) {
				this.leeks[action[1]].sayLama()
			}
			this.actionDone()
			break
		}
		case Action.SUMMON: {
			const caster = action[1]
			const summonID = action[2]
			const cell = action[3]
			const summon = this.leeks[summonID]

			summon.setCell(cell)
			summon.summoner = this.leeks[caster]
			summon.active = true

			summon.drawID = this.addDrawableElement(summon, summon.y)

			if (!this.jumping) {
				this.log(i18n.t('fight.summon', [
					this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
					this.colorText(summon.name, this.getLeekColor(summon.id)),
				]) as string)
				this.S.bulb.play()
			}
			this.actionDone()
			break
		}
		case Action.RESURRECTION: {
			const target = action[2]
			const cell = action[3]
			const life = action[4]
			const maxLife = action[5]
			const entity = this.leeks[target]

			entity.setCell(cell)
			entity.life = life
			entity.maxLife = maxLife
			entity.active = true
			entity.reborn()

			entity.drawID = this.addDrawableElement(entity, entity.y)
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_resurrect', [
					this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])),
					this.colorText(this.leeks[action[2]].name, this.getLeekColor(action[2])),
				]) as string)
			}
			this.actionDone()
			break
		}
		case Action.SHOW: {
			if (this.jumping) {
				this.actionDone()
				break
			}
			this.showCellCell = action[2]
			this.showCellColor = '#' + action[3]
			const pos = this.ground.cellToXY(this.showCellCell)
			const xy = this.ground.xyToXYPixels(pos.x, pos.y)
			this.showCellX = xy.x * this.ground.scale
			this.showCellY = xy.y * this.ground.scale
			this.showCellTime = 50
			this.log(i18n.t('fight.leek_show_cell', this.colorText(this.leeks[action[1]].name, this.getLeekColor(action[1])), action[2]) as string)
			break
		}
		case Action.ADD_WEAPON_EFFECT : {
			this.addEffect(action, 'weapon')
			this.actionDone()
			break
		}
		case Action.ADD_CHIP_EFFECT : {
			this.addEffect(action, 'chip')
			this.actionDone()
			break
		}
		case Action.REMOVE_EFFECT : {
			this.removeEffect(action[1])
			this.actionDone()
			break
		}
		case Action.UPDATE_EFFECT : {
			this.updateEffect(action[1], action[2])
			this.actionDone()
			break
		}
		case Action.BUG: {
			if (!this.jumping) {
				this.leeks[action[1]].bug()
			}
			this.actionDone()
			break
		}
		case Action.END_FIGHT: {
			this.fightEnd = true
			break
		}
		default: {
			console.warn("Error : unknown action type (" + type + ")")
			this.actionDone()
		}
		}
		if (!this.jumping) {
			// On peut logger pour cette action !
			this.currentLog = 0
		}
	}

	public addEffect(action: any, object: any) {
		const objectID = action[1]
		const id = action[2]
		const caster = action[3]
		const target = action[4]
		const effect = action[5]
		const value = action[6]
		const leek = this.leeks[target]

		// Ajout de l'effet
		this.effects[id] = {id, object: objectID, objectType: object, caster, target, effect, value}

		// Ajout de l'image sur le hud
		let image: string = ''
		if (object === 'chip') {
			if (objectID in LeekWars.chips) {
				image = LeekWars.staticURL + "image/chip/small/" + LeekWars.chips[objectID].name + ".png"
			}
		} else /* if (object == 'weapon') */ {

			if (objectID in LeekWars.weapons) {

				const template = LeekWars.weapons[objectID].template
				const img = ["1", "2", "3", "4", "5", "6", "7", "flamme", "destroyer", "gaz_icon", "11", "12", "13", "katana", "broadswoard", "axe"][template - 1]
				image = LeekWars.staticURL + "image/weapon/" + img + ".png"

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

		// Action !
		switch (effect) {

		case EffectType.ABSOLUTE_SHIELD:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_absolute_shield', value) as string, Colors.SHIELD_COLOR),
				]) as string)
			}
			leek.buffAbsoluteShield(value, this.jumping)
			break

		case EffectType.RELATIVE_SHIELD:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_relative_shield', value + '%') as string, Colors.SHIELD_COLOR),
				]) as string)
			}
			leek.buffRelativeShield(value, this.jumping)
			break

		case EffectType.VULNERABILITY:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_receives_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_vulnerability', value + '%') as string, Colors.SHIELD_COLOR),
				]) as string)
			}
			leek.buffRelativeShield(-value, this.jumping)
			break

		case EffectType.BUFF_AGILITY:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_agility', value) as string, Colors.AGILITY_COLOR),
				]) as string)
			}
			leek.buffAgility(value, this.jumping)
			break

		case EffectType.BUFF_STRENGTH:

			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_strength', value) as string, Colors.STRENGTH_COLOR),
				]) as string)
			}
			leek.buffStrength(value, this.jumping)
			break

		case EffectType.BUFF_TP:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_tp', value) as string, Colors.TP_COLOR),
				]) as string)
			}
			leek.buffTP(value, this.jumping)
			break

		case EffectType.BUFF_MP:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_mp', value) as string, Colors.MP_COLOR),
				]) as string)
			}
			leek.buffMP(value, this.jumping)
			break

		case EffectType.BUFF_WISDOM:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_wisdom', [value]) as string, Colors.WISDOM_COLOR),
				]) as string)
			}
			leek.buffWisdom(value, this.jumping)
			break

		case EffectType.BUFF_RESISTANCE:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_resistance', value) as string, Colors.RESISTANCE_COLOR),
				]) as string)
			}
			leek.buffResistance(value, this.jumping)
			break

		case EffectType.SHACKLE_MP:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_loose_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_mp', value) as string, Colors.MP_COLOR),
				]) as string)
			}
			leek.looseMP(value, this.jumping)
			break

		case EffectType.SHACKLE_TP:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_loose_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_tp', value) as string, Colors.TP_COLOR),
				]) as string)
			}
			leek.looseTP(value, this.jumping)
			break

		case EffectType.SHACKLE_STRENGTH:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_loose_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_strength', value) as string, Colors.STRENGTH_COLOR),
				]) as string)
			}
			leek.looseStrength(value, this.jumping)
			break

		case EffectType.SHACKLE_MAGIC:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_loose_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_magic', value) as string, Colors.MAGIC_COLOR),
				]) as string)
			}
			leek.looseMagic(value, this.jumping)
			break

		case EffectType.DAMAGE_RETURN:
			if (!this.jumping) {
				this.log(i18n.t('fight.leek_win_x', [
					this.colorText(leek.name, this.getLeekColor(target)),
					this.colorText(i18n.t('fight.n_damage_return', value + '%') as string, 'black'),
				]) as string)
			}
			leek.buffDamageReturn(value, this.jumping)
			break

		case EffectType.POISON:
			// rien
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
			leek.mp -= value
			break
		case EffectType.SHACKLE_TP:
			leek.tp -= value
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.strength -= value
			break
		case EffectType.SHACKLE_MAGIC:
			leek.magic -= value
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

		if (!this.jumping) {
			// Gestion des états du poireau
			if (effect.objectType === 'weapon') {
				if (effect.object === 46) {
					leek.stopBurn()
				} else if (effect.object === 48) {
					leek.stopGaz()
				}
			}
		}
		delete leek.effects[id]
		delete this.effects[id]
	}

	public updateEffect(id: number, new_value: number) {

		const effect = this.effects[id]
		if (!effect) { return  }

		const effectID = effect.effect
		const leek = this.leeks[effect.target]
		const delta = new_value - effect.value

		switch (effectID) {
		case EffectType.SHACKLE_MP:
			leek.mp += delta
			break
		case EffectType.SHACKLE_TP:
			leek.tp += delta
			break
		case EffectType.SHACKLE_STRENGTH:
			leek.strength += delta
			break
		case EffectType.SHACKLE_MAGIC:
			leek.magic += delta
			break
		case EffectType.ABSOLUTE_SHIELD:
			leek.absoluteShield += delta
			break
		case EffectType.RELATIVE_SHIELD:
			leek.relativeShield += delta
			break
		case EffectType.VULNERABILITY:
			leek.relativeShield += delta
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

		// Logs personnels
		if (this.logs == null) { return }
		if (!(this.currentAction in this.logs)) { return }

		for (let l = this.currentLog; l < this.logs[this.currentAction].length; ++l) {

			this.currentLog++

			const log = this.logs[this.currentAction][l]
			const type = log[1]

			if (type === 5) {
				this.pause()
				return true
			} else if (type === 4) {
				this.addMarker(log[0], log[2], log[3], log[4])
			} else {
				// this.hud.addPersonalLog(log)
			}
		}
		return false
	}

	public actionDone() {
		this.actionToDo = true
		this.actionDelay = 6
	}

	public getLeekColor(leek: number) {
		return TEAM_COLORS[this.leeks[leek].team - 1]
	}

	public colorText(text: string, color: string): string {
		return "<span style='color: " + color + ";'>" + text + "</span>"
	}

	public log(action: any) {
		this.currentActions.push({id: this.currentAction, action})
	}

	public setupMouseMove() {

		// var mouseOrigin = $('#game').offset()

		// mouseOrigin.left += Math.round(this.ground.startX / this.ratio)
		// mouseOrigin.top += Math.round(this.ground.startY / this.ratio)

		// $(this.canvas).off('mousemove')
		// $(this.canvas).mousemove((e) => {
		// 	this.mouseX = (e.pageX - mouseOrigin.left) * this.ratio
		// 	this.mouseY = (e.pageY - mouseOrigin.top) * this.ratio

		// 	var x = (this.mouseX / this.ground.tileSizeX) * 2 - 0.5
		// 	var y = (this.mouseY / this.ground.tileSizeY) * 2 - 0.5

		// 	var cx = Math.floor(x)
		// 	var cy = Math.floor(y)

		// 	var ox = x - cx - 0.5
		// 	var oy = y - cy - 0.5

		// 	if ((cx + cy) % 2 == 1) {
		// 		if (-oy > Math.abs(ox)) { // en haut
		// 			cy--
		// 		} else if (oy > Math.abs(ox)) { // en bas
		// 			cy++
		// 		} else if (ox > Math.abs(oy)) { // à droite
		// 			cx++
		// 		} else { // forcément à gauche
		// 			cx--
		// 		}
		// 	}
		// 	if (cx >= 0 && cy >= 0 && cx < this.ground.tilesX * 2 - 1 && cy < this.ground.tilesY * 2 - 1) {
		// 		this.mouseTileX = cx
		// 		this.mouseTileY = cy
		// 		this.mouseCell = this.ground.xyToCell(cx, cy)
		// 	} else {
		// 		this.mouseTileX = undefined
		// 		this.mouseTileY = undefined
		// 		this.mouseCell = undefined
		// 	}
		// })
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

	public addDrawableElement(element: any, line: number) {
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
			if (this.markers.hasOwnProperty(m)) {
				const marker = this.markers[m]
				this.drawMarker(marker.x, marker.y, marker.color)
			}
		}

		// Draw elements
		for (const line of this.drawableElements) {
			for (const j in line) {
				if (this.drawableElements.hasOwnProperty(j)) {
					line[j].draw(this.ctx)
				}
			}
		}

		// Show cell
		if (this.showCellTime > 0) {
			this.showCell()
		}

		// Draw air particles
		this.particles.drawAir(this.ctx)

		if (this.requestPause) {
			this.paused = true
			this.requestPause = false
			if (!this.going_to_report) {
				this.drawPause()
			}
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

	public drawPause() {
		this.ctx.save()

		this.ctx.translate(-this.ground.startX, -this.ground.startY)

		this.ctx.globalAlpha = 0.2
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.width, this.height)

		this.ctx.fillStyle = 'white'
		this.ctx.font = "30pt Roboto"
		this.ctx.textAlign = "center"
		this.ctx.globalAlpha = 1
		this.ctx.fillText("Pause", this.width / 2, 60)

		this.ctx.restore()
	}

	public showReport() {
		this.going_to_report = true
		document.body.style.cursor = ''
	}

	public updateBar() {
		// $('#progress-bar .bar').css('width', (100 * this.currentAction / this.actions.length) + '%');
	}

	public jump(jumpAction: any) {

		// Return to initial state
		for (const i of this.states) {
			if (this.states.hasOwnProperty(i)) {
				this.leeks[i].active = this.states[i].active
				this.leeks[i].life = this.states[i].life
				this.leeks[i].maxLife = this.states[i].max_life
				this.leeks[i].tp = this.states[i].tp
				this.leeks[i].mp = this.states[i].mp
				this.leeks[i].agility = this.states[i].agility
				this.leeks[i].strength = this.states[i].strength
				this.leeks[i].wisdom = this.states[i].wisdom
				this.leeks[i].resistance = this.states[i].resistance
				this.leeks[i].science = this.states[i].science
				this.leeks[i].magic = this.states[i].magic
				this.leeks[i].absoluteShield = 0
				this.leeks[i].relativeShield = 0
				this.leeks[i].damageReturn = 0
				this.leeks[i].cell = this.states[i].cell

				this.leeks[i].dead = false
				this.leeks[i].bubble = new Bubble(this)
				// $('#entity-info-' + this.leeks[i].id).removeClass('dead')

				; (this.leeks[i] as Leek).weapon = null

				if (!this.leeks[i].active) {
					if (this.leeks[i].drawID) {
						this.removeDrawableElement(this.leeks[i].drawID, this.leeks[i].y)
						this.leeks[i].drawID = null
					}
				} else {
					if (this.leeks[i].drawID === null && this.leeks[i].life) {
						this.leeks[i].drawID = this.addDrawableElement(this.leeks[i], this.leeks[i].y)
					}
				}
				this.leeks[i].moveDelay = 0
				this.leeks[i].path = []
			}
		}

		// Clear entity effects
		for (const e in this.leeks) {
			if (this.leeks.hasOwnProperty(e)) {
				const entity = this.leeks[e]
				entity.effects = {}
			}
		}

		// Cleaning
		// $("#actions .action").remove()
		// $("#logs .log").remove()
		// $("[id^=effect]").remove()
		// $('#turn').text("")

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
		let action = 0

		while (action < jumpAction) {
			this.doAction(this.actions[action])
			action++
		}

		// End
		this.jumping = false
		this.currentAction = action

		for (const e in this.leeks) {
			if (this.leeks.hasOwnProperty(e)) {
				const entity = this.leeks[e]
				entity.setCell(entity.cell)
			}
		}
		this.updateBar()
		this.requestPause = this.paused
		this.draw()
	}

	public resourceLoaded(res: string) {
		this.loadedData++
		// console.log("Resource loaded : " + res + " (" + this.loadedData + "/" + this.numData + ")")
		if (this.loadedData === this.numData && this.initialized === true) {
			this.launch() // Start game if all resources are loaded
		}
	}
}

export { Game, Colors, TEAM_COLORS, SHADOW_SCALE, SHADOW_ALPHA, GROUND_TEXTURE }
