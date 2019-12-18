import { Game } from '@/component/player/game/game'
import { env } from '@/env'

const SHADOW_QUALITY = 0.3

class Textures {
	public leek_hand: Texture
	public machine_gun: Texture
	public laser: Texture
	public laser_bullet: Texture
	public bullet: Texture
	public shots: Texture
	public cart_machine_gun: Texture
	public cart_laser: Texture
	public m_laser: Texture
	public m_laser_bullet: Texture
	public cart_m_laser: Texture
	public leek_blood: Texture
	public electrisor: Texture
	public lightning: Texture
	public purple_lightning: Texture
	public red_lightning: Texture
	public particle: Texture
	public double_gun: Texture
	public cart_double_gun: Texture
	public pistol: Texture
	public cart_pistol: Texture
	public shotgun: Texture
	public cart_shotgun: Texture
	public magnum: Texture
	public cart_magnum: Texture
	public grenade_launcher: Texture
	public cart_grenade_launcher: Texture
	public destroyer: Texture
	public cart_destroyer: Texture
	public flame_thrower: Texture
	public gazor: Texture
	public b_laser: Texture
	public b_laser_bullet: Texture
	public cart_b_laser: Texture
	public katana: Texture
	public broadsword: Texture
	public axe: Texture
	public slash: Texture
	public box: Texture
	public big_box: Texture
	public factory: Texture
	public desert: Texture
	public desert_rock2_small: Texture
	public desert_grass: Texture
	public cactus: Texture
	public desert_rock1_big: Texture
	public desert_rock2_big: Texture
	public desert_rock3_big: Texture
	public skull: Texture
	public forest: Texture
	public forest_rock: Texture
	public forest_rock_small: Texture
	public stump: Texture
	public leaf: Texture
	public leaf2: Texture
	public leaf3: Texture
	public leaf4: Texture
	public mushroom: Texture
	public glacier: Texture
	public beach: Texture
	public starfish: Texture
	public starfish2: Texture
	public palm: Texture
	public pebble: Texture
	public pebble_small: Texture
	public snowman: Texture
	public fir: Texture
	public ice: Texture
	public ice_small: Texture
	public barrel: Texture
	public cone: Texture
	public cone_big: Texture
	public fire: Texture
	public gaz: Texture
	public grenade: Texture
	public explosion: Texture
	public cloud: Texture
	public grey_cloud: Texture
	public black_cloud: Texture
	public nexus_bg: Texture
	public nexus_block: Texture
	public nexus_block_small: Texture
	public rock: Texture
	public stalactite: Texture
	public iceberg: Texture
	public ice_part: Texture
	public ice_part2: Texture
	public meteorite: Texture
	public pumpkin: Texture
	public red_circle: Texture
	public daemon_shadow: Texture
	public cure_aureol: Texture
	public shield_aureol: Texture
	public buff_aureol: Texture
	public halo: Texture
	public heal_cross: Texture
	public liberation_halo: Texture
	public poison_aureol: Texture
	public shackle_aureol: Texture
	public damage_return_aureol: Texture
	public chip_steroid: Texture
	public chip_protein: Texture
	public chip_warm_up: Texture
	public chip_stretching: Texture
	public chip_reflexes: Texture
	public chip_doping: Texture
	public chip_adrenaline: Texture
	public chip_motivation: Texture
	public chip_rage: Texture
	public chip_seven_league_boots: Texture
	public chip_leather_boots: Texture
	public chip_winged_boots: Texture
	public chip_whip: Texture
	public chip_acceleration: Texture
	public chip_solidification: Texture
	public chip_ferocity: Texture
	public chip_collar: Texture
	public chip_bark: Texture
	public chip_helmet: Texture
	public chip_wall: Texture
	public chip_armor: Texture
	public chip_shield: Texture
	public chip_fortress: Texture
	public chip_rampart: Texture
	public chip_carapace: Texture
	public chip_bandage: Texture
	public chip_cure: Texture
	public chip_vaccine: Texture
	public chip_regeneration: Texture
	public chip_drip: Texture
	public chip_armoring: Texture
	public chip_remission: Texture
	public chip_loam: Texture
	public chip_fertilizer: Texture
	public chip_thorn: Texture
	public chip_mirror: Texture
	public chip_venom: Texture
	public chip_toxin: Texture
	public chip_plague: Texture
	public chip_slow_down: Texture
	public chip_ball_and_chain: Texture
	public chip_tranquilizer: Texture
	public chip_soporific: Texture
	public chip_fracture: Texture
	public chip_burning: Texture
	public lama: Texture
	public bug: Texture
	public bulb_front: Texture
	public bulb_back: Texture
	public fire_bulb_front: Texture
	public fire_bulb_back: Texture
	public healer_bulb_front: Texture
	public healer_bulb_back: Texture
	public rocky_bulb_front: Texture
	public rocky_bulb_back: Texture
	public iced_bulb_front: Texture
	public iced_bulb_back: Texture
	public lightning_bulb_front: Texture
	public lightning_bulb_back: Texture
	public metallic_bulb_front: Texture
	public metallic_bulb_back: Texture
	public arena: Texture
	public pyramid: Texture
	public grass: Texture
	public pillar: Texture
	public cube: Texture
	public small_cube: Texture
	public square: Texture
	public spike1: Texture
	public spike2: Texture

	constructor(game: Game) {
		this.leek_hand = new Texture(game, env.STATIC + "image/fight/leek_hand.png", true, SHADOW_QUALITY)

		this.machine_gun = new Texture(game, env.STATIC + "image/weapon/machine_gun.png", true, SHADOW_QUALITY)

		this.laser = new Texture(game, env.STATIC + "image/weapon/laser.png", true, SHADOW_QUALITY)
		this.laser_bullet = new Texture(game, env.STATIC + "image/weapon/laser_bullet.png")

		this.bullet = new Texture(game, env.STATIC + 'image/weapon/bullet.png')
		this.shots = new Texture(game, env.STATIC + 'image/weapon/shots.png')
		this.cart_machine_gun = new Texture(game, env.STATIC + 'image/weapon/cart_machine_gun.png')
		this.cart_laser = new Texture(game, env.STATIC + 'image/weapon/cart_laser.png')
		this.m_laser = new Texture(game, env.STATIC + "image/weapon/m_laser.png", true, SHADOW_QUALITY)
		this.m_laser_bullet = new Texture(game, env.STATIC + "image/weapon/m_laser_bullet.png")
		this.cart_m_laser = new Texture(game, env.STATIC + 'image/weapon/cart_m_laser.png')
		this.leek_blood = new Texture(game, env.STATIC + 'image/fight/leek_blood.png')
		this.electrisor = new Texture(game, env.STATIC + 'image/weapon/electrisor.png', true, SHADOW_QUALITY)
		this.lightning = new Texture(game, env.STATIC + 'image/weapon/lightning.png')
		this.purple_lightning = new Texture(game, env.STATIC + 'image/weapon/purple_lightning.png')
		this.red_lightning = new Texture(game, env.STATIC + 'image/weapon/red_lightning.png')
		this.particle = new Texture(game, env.STATIC + 'image/weapon/particle.png')
		this.double_gun = new Texture(game, env.STATIC + 'image/weapon/double_gun.png', true, SHADOW_QUALITY)
		this.cart_double_gun = new Texture(game, env.STATIC + 'image/weapon/cart_double_gun.png')
		this.pistol = new Texture(game, env.STATIC + 'image/weapon/pistol.png', true, SHADOW_QUALITY)
		this.cart_pistol = new Texture(game, env.STATIC + 'image/weapon/cart_pistol.png')
		this.shotgun = new Texture(game, env.STATIC + 'image/weapon/shotgun.png', true, SHADOW_QUALITY)
		this.cart_shotgun = new Texture(game, env.STATIC + 'image/weapon/cart_shotgun.png')
		this.magnum = new Texture(game, env.STATIC + 'image/weapon/magnum.png', true, SHADOW_QUALITY)
		this.cart_magnum = new Texture(game, env.STATIC + 'image/weapon/cart_magnum.png')
		this.grenade_launcher = new Texture(game, env.STATIC + 'image/weapon/grenade_launcher.png', true, SHADOW_QUALITY)
		this.cart_grenade_launcher = new Texture(game, env.STATIC + 'image/weapon/cart_grenade_launcher.png')
		this.destroyer = new Texture(game, env.STATIC + 'image/weapon/destroyer.png', true, SHADOW_QUALITY)
		this.cart_destroyer = new Texture(game, env.STATIC + 'image/weapon/cart_destroyer.png')
		this.flame_thrower = new Texture(game, env.STATIC + 'image/weapon/flame_thrower.png', true, SHADOW_QUALITY)
		this.gazor = new Texture(game, env.STATIC + 'image/weapon/gazor.png', true, SHADOW_QUALITY)
		this.b_laser = new Texture(game, env.STATIC + "image/weapon/b_laser.png", true, SHADOW_QUALITY)
		this.b_laser_bullet = new Texture(game, env.STATIC + "image/weapon/b_laser_bullet.png")
		this.cart_b_laser = new Texture(game, env.STATIC + 'image/weapon/cart_b_laser.png')
		this.katana = new Texture(game, env.STATIC + 'image/weapon/katana.png', true, SHADOW_QUALITY)
		this.broadsword = new Texture(game, env.STATIC + 'image/weapon/broadsword.png', true, SHADOW_QUALITY)
		this.axe = new Texture(game, env.STATIC + 'image/weapon/axe.png', true, SHADOW_QUALITY)
		this.slash = new Texture(game, env.STATIC + 'image/fight/slash.png', true, SHADOW_QUALITY)

		this.box = new Texture(game, env.STATIC + 'image/map/box.png', true, 1)
		this.big_box = new Texture(game, env.STATIC + 'image/map/big_box.png', true, 1)
		this.factory = new Texture(game, env.STATIC + 'image/map/factory_bg.png')
		this.desert = new Texture(game, env.STATIC + 'image/map/desert.png')
		this.desert_rock2_small = new Texture(game, env.STATIC + 'image/map/rock2_small.png', true, 1)
		this.desert_grass = new Texture(game, env.STATIC + 'image/map/desert_grass.png', true, 1)
		this.cactus = new Texture(game, env.STATIC + 'image/map/cactus.png', true, 1)
		this.desert_rock1_big = new Texture(game, env.STATIC + 'image/map/rock1_big.png', true, 1),
		this.desert_rock2_big = new Texture(game, env.STATIC + 'image/map/rock2_big.png', true, 1),
		this.desert_rock3_big = new Texture(game, env.STATIC + 'image/map/rock3_big.png', true, 1),
		this.skull = new Texture(game, env.STATIC + 'image/map/skull.png')
		this.cactus = new Texture(game, env.STATIC + 'image/map/cactus.png', true, 1)
		this.forest = new Texture(game, env.STATIC + 'image/map/forest.png')
		this.forest_rock = new Texture(game, env.STATIC + 'image/map/forest_rock.png', true, 1)
		this.forest_rock_small = new Texture(game, env.STATIC + 'image/map/forest_rock_small.png', true, 1)
		this.stump = new Texture(game, env.STATIC + 'image/map/stump.png', true, 1)
		this.leaf = new Texture(game, env.STATIC + 'image/map/leaf.png')
		this.leaf2 = new Texture(game, env.STATIC + 'image/map/leaf2.png')
		this.leaf3 = new Texture(game, env.STATIC + 'image/map/leaf3.png')
		this.leaf4 = new Texture(game, env.STATIC + 'image/map/leaf4.png')
		this.mushroom = new Texture(game, env.STATIC + 'image/map/mushroom.png', true, 1)
		this.glacier = new Texture(game, env.STATIC + 'image/map/glacier.png')
		this.beach = new Texture(game, env.STATIC + 'image/map/beach.png')
		this.starfish = new Texture(game, env.STATIC + 'image/map/starfish.png', false, 0, true)
		this.starfish2 = new Texture(game, env.STATIC + 'image/map/starfish2.png', false, 0, true)
		this.palm = new Texture(game, env.STATIC + 'image/map/palm.png', true, 1, true)
		this.pebble = new Texture(game, env.STATIC + 'image/map/pebble.png', true, 1, true)
		this.pebble_small = new Texture(game, env.STATIC + 'image/map/pebble_small.png')
		this.snowman = new Texture(game, env.STATIC + 'image/map/snowman.png', true, 1, true)
		this.fir = new Texture(game, env.STATIC + 'image/map/fir.png', true, 1, true)
		this.ice = new Texture(game, env.STATIC + 'image/map/ice.png', true, 1, true)
		this.ice_small = new Texture(game, env.STATIC + 'image/map/ice_small.png', true, 1, true)
		this.barrel = new Texture(game, env.STATIC + 'image/map/barrel.png', true, 1)
		this.cone = new Texture(game, env.STATIC + 'image/map/cone.png', true, 1)
		this.cone_big = new Texture(game, env.STATIC + 'image/map/cone_big.png', true, 1)
		this.fire = new Texture(game, env.STATIC + 'image/weapon/fire.png')
		this.gaz = new Texture(game, env.STATIC + 'image/weapon/gaz.png')
		this.grenade = new Texture(game, env.STATIC + 'image/weapon/grenade.png')
		this.explosion = new Texture(game, env.STATIC + 'image/weapon/explosion.png')
		this.cloud = new Texture(game, env.STATIC + 'image/fight/cloud.png')
		this.grey_cloud = new Texture(game, env.STATIC + 'image/fight/grey_cloud.png')
		this.black_cloud = new Texture(game, env.STATIC + 'image/fight/black_cloud.png')
		this.nexus_bg = new Texture(game, env.STATIC + 'image/map/nexus_bg.png')
		this.nexus_block = new Texture(game, env.STATIC + 'image/map/nexus_block.png')
		this.nexus_block_small = new Texture(game, env.STATIC + 'image/map/nexus_block_small.png')
		this.rock = new Texture(game, env.STATIC + 'image/map/rock.png')
		this.stalactite = new Texture(game, env.STATIC + 'image/fight/stalactite.png')
		this.iceberg = new Texture(game, env.STATIC + 'image/fight/iceberg.png')
		this.ice_part = new Texture(game, env.STATIC + 'image/fight/ice_part.png')
		this.ice_part2 = new Texture(game, env.STATIC + 'image/fight/ice_part2.png')
		this.meteorite = new Texture(game, env.STATIC + 'image/fight/meteorite.png')
		this.pumpkin = new Texture(game, env.STATIC + 'image/map/pumpkin.png', true, 1, true)
		this.red_circle = new Texture(game, env.STATIC + 'image/fight/red_circle.png')
		this.daemon_shadow = new Texture(game, env.STATIC + 'image/fight/daemon_shadow.png')
		this.arena = new Texture(game, env.STATIC + 'image/map/arena.png')
		this.pyramid = new Texture(game, env.STATIC + 'image/map/pyramid.png', true, 1)
		this.grass = new Texture(game, env.STATIC + 'image/map/grass.png', true, 1)
		this.pillar = new Texture(game, env.STATIC + 'image/map/pillar.png', true, 1)
		this.cube = new Texture(game, env.STATIC + 'image/map/cube.png', true, 1)
		this.small_cube = new Texture(game, env.STATIC + 'image/map/small_cube.png', true, 1)
		this.square = new Texture(game, env.STATIC + 'image/map/square.png', true, 1)
		this.spike1 = new Texture(game, env.STATIC + 'image/fight/spike1.png', true, 1)
		this.spike2 = new Texture(game, env.STATIC + 'image/fight/spike2.png', true, 1)

		// Chips
		this.cure_aureol = new Texture(game, env.STATIC + 'image/fight/cure_aureol.png')
		this.shield_aureol = new Texture(game, env.STATIC + 'image/fight/shield_aureol.png')
		this.buff_aureol = new Texture(game, env.STATIC + 'image/fight/buff_aureol.png')
		this.halo = new Texture(game, env.STATIC + 'image/fight/halo.png')
		this.heal_cross = new Texture(game, env.STATIC + 'image/fight/heal_cross.png')
		this.liberation_halo = new Texture(game, env.STATIC + 'image/fight/liberation.png')
		this.poison_aureol = new Texture(game, env.STATIC + 'image/fight/poison_aureol.png')
		this.shackle_aureol = new Texture(game, env.STATIC + 'image/fight/shackle_aureol.png')
		this.damage_return_aureol = new Texture(game, env.STATIC + 'image/fight/damage_return_aureol.png')
		this.chip_burning = new Texture(game, env.STATIC + 'image/chip/glyph/burning.png')

		// Buff
		this.chip_steroid = new Texture(game, env.STATIC + 'image/chip/glyph/steroid.png')
		this.chip_protein = new Texture(game, env.STATIC + 'image/chip/glyph/protein.png')
		this.chip_warm_up = new Texture(game, env.STATIC + 'image/chip/glyph/warm_up.png')
		this.chip_stretching = new Texture(game, env.STATIC + 'image/chip/glyph/stretching.png')
		this.chip_reflexes = new Texture(game, env.STATIC + 'image/chip/glyph/reflexes.png')
		this.chip_doping = new Texture(game, env.STATIC + 'image/chip/glyph/doping.png')
		this.chip_adrenaline = new Texture(game, env.STATIC + 'image/chip/glyph/adrenaline.png')
		this.chip_motivation = new Texture(game, env.STATIC + 'image/chip/glyph/motivation.png')
		this.chip_rage = new Texture(game, env.STATIC + 'image/chip/glyph/rage.png')
		this.chip_seven_league_boots = new Texture(game, env.STATIC + 'image/chip/glyph/seven_league_boots.png')
		this.chip_leather_boots = new Texture(game, env.STATIC + 'image/chip/glyph/leather_boots.png')
		this.chip_winged_boots = new Texture(game, env.STATIC + 'image/chip/glyph/winged_boots.png')
		this.chip_whip = new Texture(game, env.STATIC + 'image/chip/glyph/whip.png')
		this.chip_acceleration = new Texture(game, env.STATIC + 'image/chip/glyph/acceleration.png')
		this.chip_solidification = new Texture(game, env.STATIC + 'image/chip/glyph/solidification.png')
		this.chip_ferocity = new Texture(game, env.STATIC + 'image/chip/glyph/ferocity.png')
		this.chip_collar = new Texture(game, env.STATIC + 'image/chip/glyph/collar.png')
		this.chip_bark = new Texture(game, env.STATIC + 'image/chip/glyph/bark.png')

		// Shield
		this.chip_helmet = new Texture(game, env.STATIC + 'image/chip/glyph/helmet.png')
		this.chip_wall = new Texture(game, env.STATIC + 'image/chip/glyph/wall.png')
		this.chip_armor = new Texture(game, env.STATIC + 'image/chip/glyph/armor.png')
		this.chip_shield = new Texture(game, env.STATIC + 'image/chip/glyph/shield.png')
		this.chip_fortress = new Texture(game, env.STATIC + 'image/chip/glyph/fortress.png')
		this.chip_rampart = new Texture(game, env.STATIC + 'image/chip/glyph/rampart.png')
		this.chip_carapace = new Texture(game, env.STATIC + 'image/chip/glyph/carapace.png')

		// Heal
		this.chip_bandage = new Texture(game, env.STATIC + 'image/chip/glyph/bandage.png')
		this.chip_cure = new Texture(game, env.STATIC + 'image/chip/glyph/cure.png')
		this.chip_vaccine = new Texture(game, env.STATIC + 'image/chip/glyph/vaccine.png')
		this.chip_regeneration = new Texture(game, env.STATIC + 'image/chip/glyph/regeneration.png')
		this.chip_drip = new Texture(game, env.STATIC + 'image/chip/glyph/drip.png')
		this.chip_armoring = new Texture(game, env.STATIC + 'image/chip/glyph/armoring.png')
		this.chip_remission = new Texture(game, env.STATIC + 'image/chip/glyph/remission.png')
		this.chip_loam = new Texture(game, env.STATIC + 'image/chip/glyph/loam.png')
		this.chip_fertilizer = new Texture(game, env.STATIC + 'image/chip/glyph/fertilizer.png')

		// Damage return
		this.chip_thorn = new Texture(game, env.STATIC + 'image/chip/glyph/thorn.png')
		this.chip_mirror = new Texture(game, env.STATIC + 'image/chip/glyph/mirror.png')

		// Poison
		this.chip_venom = new Texture(game, env.STATIC + 'image/chip/glyph/venom.png')
		this.chip_toxin = new Texture(game, env.STATIC + 'image/chip/glyph/toxin.png')
		this.chip_plague = new Texture(game, env.STATIC + 'image/chip/glyph/plague.png')

		// Shackles
		this.chip_slow_down = new Texture(game, env.STATIC + 'image/chip/glyph/slow_down.png')
		this.chip_ball_and_chain = new Texture(game, env.STATIC + 'image/chip/glyph/ball_and_chain.png')
		this.chip_tranquilizer = new Texture(game, env.STATIC + 'image/chip/glyph/tranquilizer.png')
		this.chip_soporific = new Texture(game, env.STATIC + 'image/chip/glyph/soporific.png')
		this.chip_fracture = new Texture(game, env.STATIC + 'image/chip/glyph/fracture.png')

		// Lama
		this.lama = new Texture(game, env.STATIC + 'image/fight/lama_big.png')

		// Bug
		this.bug = new Texture(game, env.STATIC + 'image/fight/leek_bug.png')

		// Bulbs
		this.bulb_front = new Texture(game, env.STATIC + 'image/bulb/puny_bulb_front.png', true, SHADOW_QUALITY)
		this.bulb_back = new Texture(game, env.STATIC + 'image/bulb/puny_bulb_back.png', true, SHADOW_QUALITY)
		this.fire_bulb_front = new Texture(game, env.STATIC + 'image/bulb/fire_bulb_front.png', true, SHADOW_QUALITY)
		this.fire_bulb_back = new Texture(game, env.STATIC + 'image/bulb/fire_bulb_back.png', true, SHADOW_QUALITY)
		this.healer_bulb_front = new Texture(game, env.STATIC + 'image/bulb/healer_bulb_front.png', true, SHADOW_QUALITY)
		this.healer_bulb_back = new Texture(game, env.STATIC + 'image/bulb/healer_bulb_back.png', true, SHADOW_QUALITY)
		this.rocky_bulb_front = new Texture(game, env.STATIC + 'image/bulb/rocky_bulb_front.png', true, SHADOW_QUALITY)
		this.rocky_bulb_back = new Texture(game, env.STATIC + 'image/bulb/rocky_bulb_back.png', true, SHADOW_QUALITY)
		this.iced_bulb_front = new Texture(game, env.STATIC + 'image/bulb/iced_bulb_front.png', true, SHADOW_QUALITY)
		this.iced_bulb_back = new Texture(game, env.STATIC + 'image/bulb/iced_bulb_back.png', true, SHADOW_QUALITY)
		this.lightning_bulb_front = new Texture(game, env.STATIC + 'image/bulb/lightning_bulb_front.png', true, SHADOW_QUALITY)
		this.lightning_bulb_back = new Texture(game, env.STATIC + 'image/bulb/lightning_bulb_back.png', true, SHADOW_QUALITY)
		this.metallic_bulb_front = new Texture(game, env.STATIC + 'image/bulb/metallic_bulb_front.png', true, SHADOW_QUALITY)
		this.metallic_bulb_back = new Texture(game, env.STATIC + 'image/bulb/metallic_bulb_back.png', true, SHADOW_QUALITY)
	}
}

class Texture {
	public texture: HTMLImageElement
	public offset: number = 1
	public inverse: boolean = false
	public shadow!: HTMLCanvasElement
	public game: Game
	constructor(game: Game, path: string, buildShadow: boolean = false, quality: number = 1, inverse: boolean = false) {
		this.texture = new Image()
		this.game = game
		game.numData++
		this.texture.crossOrigin = "anonymous"
		this.texture.onload = () => {
			if (buildShadow) {
				buildTextureShadow(this, quality)
			}
			game.resourceLoaded(path)
		}
		this.texture.onerror = (err) => {
			console.warn("Error loading : " + path)
			game.resourceLoaded(path)
		}
		this.texture.onabort = (err) => {
			console.warn("Error loading : " + path)
			game.resourceLoaded(path)
		}
		this.inverse = inverse
		this.texture.src = path // Start loading
	}
}

function createScaledTexture(texture: HTMLImageElement, width: number, height: number, inverse: boolean) {
	try {
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d')
		if (!ctx) { return null }
		if (inverse) {
			ctx.translate(width, 0)
			ctx.scale(-1, 1)
		}
		ctx.drawImage(texture, 0, 0, width, height)
		if (isFinite(width) && isFinite(height)) {
			ctx.putImageData(ctx.getImageData(0, 0, width, height), 0, 0)
		}
		return canvas
	} catch (e) {
		return texture
	}
}

function buildTextureShadow(texture: Texture, quality: number) {
	try {
		if (quality == null) { quality = 1 }

		const canvas = document.createElement('canvas')
		canvas.width = texture.texture.width * quality
		canvas.height = texture.texture.height * quality
		const context = canvas.getContext('2d')
		if (!context) { return  }
		context.drawImage(texture.texture, 0, 0, canvas.width, canvas.height)

		const newTexture = context.getImageData(0, 0, canvas.width, canvas.height)
		const textureSize = canvas.width * canvas.height
		for (let i = 0; i < textureSize * 4; i += 4) {
			newTexture.data[i] = 0
			newTexture.data[i + 1] = 0
			newTexture.data[i + 2] = 0
		}
		context.putImageData(newTexture, 0, 0)
		texture.shadow = canvas
	} catch (e) {
		console.error("Failed to create texture!", e)
	}
}

export { Texture, Textures, SHADOW_QUALITY, createScaledTexture }
