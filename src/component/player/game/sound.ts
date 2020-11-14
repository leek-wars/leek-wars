import { Game } from '@/component/player/game/game'
import { env } from '@/env'
import { LeekWars } from '@/model/leekwars'

// var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;

// Sound volume constant
const VOL_MAP_SOUND = 0.03 // atmosphere sound
const VOL_DEFFENSIVE_SOUND = 0.4 // heal, buff, shield, ...
const VOL_OFFENSIVE_SOUND = 0.5 // weapons and offensive chips
const VOL_SPECIAL_SOUND = 0.5 // liberation, teleportation, summon, resurection, ...
const VOL_OTHER_SOUND = 0.1 // setWeapon, move

class Sound {
	public src!: string
	public volume!: number
	public sound!: HTMLAudioElement

	constructor(src: string, volume: number) {
		this.src = src
		this.volume = volume
	}

	public load(game: Game) {
		// already loaded
		if (this.sound) {
			game.numData++
			setTimeout(() => {
				game.resourceLoaded(this.src)
			})
			return this
		}

		game.numData++
		this.sound = document.createElement('audio')
		this.sound.controls = true
		this.sound.addEventListener("loadeddata", () => {
			game.resourceLoaded(this.src)
		}, true)
		this.sound.addEventListener("error", () => {
			game.resourceLoaded(this.src)
		}, true)
		this.sound.addEventListener("abort", () => {
			game.resourceLoaded(this.src)
		}, true)
		this.sound.volume = this.volume
		this.sound.src = this.src
		this.sound.load()
		return this
	}

	public play(game: Game) {
		if (game.sound && this.sound != null) {
			this.sound.currentTime = 0
			this.sound.play()
		}
	}
	public loop(game: Game) {
		if (game.sound && this.sound != null) {
			if (typeof this.sound.loop === 'boolean') {
				this.sound.loop = true
			} else {
				this.sound.addEventListener('timeupdate', () => {
					this.sound.currentTime = 0
					this.sound.play()
				}, false)
			}
			this.sound.play()
		}
	}
	public stop() {
		if (this.sound != null) {
			this.sound.pause()
			this.sound.currentTime = 0
		}
	}
}

class S {
	public static machine_gun = new Sound(LeekWars.STATIC + "sound/machine_gun.mp3", VOL_OFFENSIVE_SOUND)
	public static laser = new Sound(LeekWars.STATIC + "sound/laser.mp3", VOL_OFFENSIVE_SOUND)
	public static electrisor = new Sound(LeekWars.STATIC + "sound/electrisor.mp3", VOL_OFFENSIVE_SOUND)
	public static double_gun = new Sound(LeekWars.STATIC + "sound/double_gun.mp3", VOL_OFFENSIVE_SOUND)
	public static shotgun = new Sound(LeekWars.STATIC + "sound/shotgun.mp3", VOL_OFFENSIVE_SOUND)
	public static grenade_shoot = new Sound(LeekWars.STATIC + "sound/grenade_shoot.mp3", VOL_OFFENSIVE_SOUND)
	public static explosion = new Sound(LeekWars.STATIC + "sound/explosion.mp3", VOL_OFFENSIVE_SOUND)
	public static sword = new Sound(LeekWars.STATIC + "sound/sword.mp3", VOL_OFFENSIVE_SOUND)
	public static flame_thrower = new Sound(LeekWars.STATIC + "sound/flame_thrower.mp3", VOL_OFFENSIVE_SOUND)
	public static gazor = new Sound(LeekWars.STATIC + "sound/gazor.mp3", VOL_OFFENSIVE_SOUND)
	// chips
	public static heal = new Sound(LeekWars.STATIC + "sound/heal.mp3", VOL_DEFFENSIVE_SOUND)
	public static buff = new Sound(LeekWars.STATIC + "sound/buff.mp3", VOL_DEFFENSIVE_SOUND)
	public static shield = new Sound(LeekWars.STATIC + "sound/shield.mp3", VOL_DEFFENSIVE_SOUND)
	public static poison = new Sound(LeekWars.STATIC + "sound/poison.mp3", VOL_OFFENSIVE_SOUND)
	public static lightning = new Sound(LeekWars.STATIC + "sound/lightning.mp3", VOL_OFFENSIVE_SOUND)
	public static fire = new Sound(LeekWars.STATIC + "sound/fire.mp3", VOL_OFFENSIVE_SOUND)
	public static rock = new Sound(LeekWars.STATIC + "sound/rock.mp3", VOL_OFFENSIVE_SOUND)
	public static rockfall = new Sound(LeekWars.STATIC + "sound/rockfall.mp3", VOL_OFFENSIVE_SOUND)
	public static ice = new Sound(LeekWars.STATIC + "sound/ice.mp3", VOL_OFFENSIVE_SOUND)
	public static meteorite = new Sound(LeekWars.STATIC + "sound/meteorite.mp3", VOL_OFFENSIVE_SOUND)
	public static liberation = new Sound(LeekWars.STATIC + "sound/liberation.mp3", VOL_SPECIAL_SOUND)
	public static teleportation = new Sound(LeekWars.STATIC + "sound/teleportation.mp3", VOL_SPECIAL_SOUND)
	public static debuff = new Sound(LeekWars.STATIC + "sound/debuff.mp3", VOL_OFFENSIVE_SOUND)
	public static alteration = new Sound(LeekWars.STATIC + "sound/alteration.wav", VOL_OFFENSIVE_SOUND)
	// other
	public static move = new Sound(LeekWars.STATIC + "sound/move.mp3", VOL_OTHER_SOUND)
	public static lama = new Sound(LeekWars.STATIC + "sound/lama.mp3", VOL_OTHER_SOUND)
	public static bulb = new Sound(LeekWars.STATIC + "sound/bulb.mp3", VOL_SPECIAL_SOUND)
	public static critical = new Sound(LeekWars.STATIC + "sound/crit.wav", VOL_SPECIAL_SOUND)
	public static map_forest = new Sound(LeekWars.STATIC + "sound/map_forest.mp3", VOL_MAP_SOUND)
	public static map_beach = new Sound(LeekWars.STATIC + "sound/map_beach.mp3", VOL_MAP_SOUND)
	public static map_desert = new Sound(LeekWars.STATIC + "sound/map_desert.mp3", VOL_MAP_SOUND)
	public static map_factory = new Sound(LeekWars.STATIC + "sound/map_factory.mp3", VOL_MAP_SOUND)
	public static map_glacier = new Sound(LeekWars.STATIC + "sound/map_glacier.mp3", VOL_MAP_SOUND)
	public static map_nexus = new Sound(LeekWars.STATIC + "sound/map_nexus.mp3", VOL_MAP_SOUND)

	private cache: {[key: string]: Sound} = {}

	get(game: Game, path: string, volume: number) {
		if (path in this.cache) {
			return this.cache[path]
		}
		const sound = new Sound(LeekWars.STATIC + path, volume).load(game)
		this.cache[path] = sound
		return sound
	}
}

export { S, Sound, VOL_MAP_SOUND }
