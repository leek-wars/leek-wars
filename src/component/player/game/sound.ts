import { Game } from '@/component/player/game/game'
import { env } from '@/env'

// var _iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false;

// Sound volume constant
const VOL_MAP_SOUND = 0.05 // atmosphere sound
const VOL_DEFFENSIVE_SOUND = 0.4 // heal, buff, shield, ...
const VOL_OFFENSIVE_SOUND = 0.5 // weapons and offensive chips
const VOL_SPECIAL_SOUND = 0.5 // liberation, teleportation, summon, resurection, ...
const VOL_OTHER_SOUND = 0.1 // setWeapon, move

class Sounds {
	public machine_gun: Sound
	public laser: Sound
	public electrisor: Sound
	public double_gun: Sound
	public shotgun: Sound
	public grenade_shoot: Sound
	public explosion: Sound
	public sword: Sound
	public flame_thrower: Sound
	public gazor: Sound
	public heal: Sound
	public buff: Sound
	public shield: Sound
	public poison: Sound
	public lightning: Sound
	public fire: Sound
	public rock: Sound
	public rockfall: Sound
	public ice: Sound
	public meteorite: Sound
	public liberation: Sound
	public teleportation: Sound
	public debuff: Sound
	public move: Sound
	public lama: Sound
	public bulb: Sound
	public map_forest: Sound
	public map_beach: Sound
	public map_desert: Sound
	public map_factory: Sound
	public map_glacier: Sound
	public map_nexus: Sound

	constructor(game: Game) {
		// weapons
		this.machine_gun = new Sound(game, env.STATIC + "sound/machine_gun.mp3", VOL_OFFENSIVE_SOUND)
		this.laser = new Sound(game, env.STATIC + "sound/laser.mp3", VOL_OFFENSIVE_SOUND)
		this.electrisor = new Sound(game, env.STATIC + "sound/electrisor.mp3", VOL_OFFENSIVE_SOUND)
		this.double_gun = new Sound(game, env.STATIC + "sound/double_gun.mp3", VOL_OFFENSIVE_SOUND)
		this.shotgun = new Sound(game, env.STATIC + "sound/shotgun.mp3", VOL_OFFENSIVE_SOUND)
		this.grenade_shoot = new Sound(game, env.STATIC + "sound/grenade_shoot.mp3", VOL_OFFENSIVE_SOUND)
		this.explosion = new Sound(game, env.STATIC + "sound/explosion.mp3", VOL_OFFENSIVE_SOUND)
		this.sword = new Sound(game, env.STATIC + "sound/sword.mp3", VOL_OFFENSIVE_SOUND)
		this.flame_thrower = new Sound(game, env.STATIC + "sound/flame_thrower.mp3", VOL_OFFENSIVE_SOUND)
		this.gazor = new Sound(game, env.STATIC + "sound/gazor.mp3", VOL_OFFENSIVE_SOUND)
		// chips
		this.heal = new Sound(game, env.STATIC + "sound/heal.mp3", VOL_DEFFENSIVE_SOUND)
		this.buff = new Sound(game, env.STATIC + "sound/buff.mp3", VOL_DEFFENSIVE_SOUND)
		this.shield = new Sound(game, env.STATIC + "sound/shield.mp3", VOL_DEFFENSIVE_SOUND)
		this.poison = new Sound(game, env.STATIC + "sound/poison.mp3", VOL_OFFENSIVE_SOUND)
		this.lightning = new Sound(game, env.STATIC + "sound/lightning.mp3", VOL_OFFENSIVE_SOUND)
		this.fire = new Sound(game, env.STATIC + "sound/fire.mp3", VOL_OFFENSIVE_SOUND)
		this.rock = new Sound(game, env.STATIC + "sound/rock.mp3", VOL_OFFENSIVE_SOUND)
		this.rockfall = new Sound(game, env.STATIC + "sound/rockfall.mp3", VOL_OFFENSIVE_SOUND)
		this.ice = new Sound(game, env.STATIC + "sound/ice.mp3", VOL_OFFENSIVE_SOUND)
		this.meteorite = new Sound(game, env.STATIC + "sound/meteorite.mp3", VOL_OFFENSIVE_SOUND)
		this.liberation = new Sound(game, env.STATIC + "sound/liberation.mp3", VOL_SPECIAL_SOUND)
		this.teleportation = new Sound(game, env.STATIC + "sound/teleportation.mp3", VOL_SPECIAL_SOUND)
		this.debuff = new Sound(game, env.STATIC + "sound/debuff.mp3", VOL_OFFENSIVE_SOUND)
		// other
		this.move = new Sound(game, env.STATIC + "sound/move.mp3", VOL_OTHER_SOUND)
		this.lama = new Sound(game, env.STATIC + "sound/lama.mp3", VOL_OTHER_SOUND)
		this.bulb = new Sound(game, env.STATIC + "sound/bulb.mp3", VOL_SPECIAL_SOUND)
		this.map_forest = new Sound(game, env.STATIC + "sound/map_forest.mp3", VOL_MAP_SOUND)
		this.map_beach = new Sound(game, env.STATIC + "sound/map_beach.mp3", VOL_MAP_SOUND)
		this.map_desert = new Sound(game, env.STATIC + "sound/map_desert.mp3", VOL_MAP_SOUND)
		this.map_factory = new Sound(game, env.STATIC + "sound/map_factory.mp3", VOL_MAP_SOUND)
		this.map_glacier = new Sound(game, env.STATIC + "sound/map_glacier.mp3", VOL_MAP_SOUND)
		this.map_nexus = new Sound(game, env.STATIC + "sound/map_nexus.mp3", VOL_MAP_SOUND)
	}
}

class Sound {
	public sound: HTMLAudioElement
	public game: Game
	constructor(game: Game, src: string, volume: number) {
		this.game = game
		game.numData++
		this.sound = document.createElement('audio')
		this.sound.controls = true
		this.sound.addEventListener("loadeddata", () => {
			// _.log("loading (loaded) : " + src);
			game.resourceLoaded(src)
		}, true)
		this.sound.addEventListener("error", () => {
			// _.log("Error loading (error) : " + src);
			game.resourceLoaded(src)
		}, true)
		this.sound.addEventListener("abort", () => {
			// _.log("Error loading (abort) : " + src);
			game.resourceLoaded(src)
		}, true)
		this.sound.volume = volume
		this.sound.src = src
		this.sound.load()
	}
	public play() {
		if (this.game.sound && this.sound != null) {
			this.sound.currentTime = 0
			this.sound.play()
		}
	}
	public loop() {
		if (this.game.sound && this.sound != null) {
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

export { Sound, Sounds }
