import { Game } from '@/component/player/game/game'
import { env } from '@/env'

const SHADOW_QUALITY = 0.3

class Texture {
	public path: string
	public texture!: HTMLImageElement
	public offset: number = 1
	public shadow: HTMLCanvasElement | null = null
	public buildShadow: boolean
	public shadowQuality: number
	private cache: {[key: number]: HTMLCanvasElement} = {}

	constructor(path: string, buildShadow: boolean = false, quality: number = 1) {
		this.path = path
		this.buildShadow = buildShadow
		this.shadowQuality = quality
	}

	public load(game: Game) {
		// Already loaded
		if (this.texture) {
			game.numData++
			setTimeout(() => {
				game.resourceLoaded(this.path)
			})
			return this
		}

		game.numData++
		this.texture = new Image()
		this.texture.crossOrigin = "anonymous"
		this.texture.onload = () => {
			if (this.buildShadow) {
				buildTextureShadow(this, this.shadowQuality)
			}
			game.resourceLoaded(this.path)
		}
		this.texture.onerror = () => {
			console.warn("Error loading : " + this.path)
			game.resourceLoaded(this.path)
		}
		this.texture.onabort = () => {
			console.warn("Error loading : " + this.path)
			game.resourceLoaded(this.path)
		}
		this.texture.src = this.path // Start loading
		return this
	}

	getScaled(width: number) {
		if (width === this.texture.width) {
			return this.texture
		}
		if (width in this.cache) {
			return this.cache[width]
		}
		try {
			const canvas = document.createElement('canvas')
			canvas.width = width
			canvas.height = this.texture.height * (width / this.texture.width)
			const ctx = canvas.getContext('2d')!
			ctx.drawImage(this.texture, 0, 0, width, canvas.height)
			if (isFinite(width) && isFinite(canvas.height)) {
				ctx.putImageData(ctx.getImageData(0, 0, width, canvas.height), 0, 0)
			}
			this.cache[width] = canvas
			return canvas
		} catch (e) {
			return this.texture
		}
	}
}

class T {
	// Textures communes
	public static bug = new Texture(env.STATIC + 'image/fight/leek_bug.png')
	public static tp = new Texture(env.STATIC + 'image/charac/small/tp.png')
	public static mp = new Texture(env.STATIC + 'image/charac/small/mp.png')
	public static leek_hand = new Texture(env.STATIC + "image/fight/leek_hand.png", true, SHADOW_QUALITY)

	// Armes
	public static machine_gun = new Texture(env.STATIC + "image/weapon/machine_gun.png", true, SHADOW_QUALITY)
	public static laser = new Texture(env.STATIC + "image/weapon/laser.png", true, SHADOW_QUALITY)
	public static laser_bullet = new Texture(env.STATIC + "image/weapon/laser_bullet.png")
	public static bullet = new Texture(env.STATIC + 'image/weapon/bullet.png')
	public static shots = new Texture(env.STATIC + 'image/weapon/shots.png')
	public static cart_machine_gun = new Texture(env.STATIC + 'image/weapon/cart_machine_gun.png')
	public static cart_laser = new Texture(env.STATIC + 'image/weapon/cart_laser.png')
	public static m_laser = new Texture(env.STATIC + "image/weapon/m_laser.png", true, SHADOW_QUALITY)
	public static m_laser_bullet = new Texture(env.STATIC + "image/weapon/m_laser_bullet.png")
	public static cart_m_laser = new Texture(env.STATIC + 'image/weapon/cart_m_laser.png')
	public static revoked_m_laser = new Texture(env.STATIC + "image/weapon/revoked_m_laser.png", true, SHADOW_QUALITY)
	public static revoked_m_laser_bullet = new Texture(env.STATIC + "image/weapon/revoked_m_laser_bullet.png")
	public static cart_revoked_m_laser = new Texture(env.STATIC + 'image/weapon/cart_revoked_m_laser.png')
	public static leek_blood = new Texture(env.STATIC + 'image/fight/leek_blood.png')
	public static electrisor = new Texture(env.STATIC + 'image/weapon/electrisor.png', true, SHADOW_QUALITY)
	public static mysterious_electrisor = new Texture(env.STATIC + 'image/weapon/mysterious_electrisor.png', true, SHADOW_QUALITY)
	public static lightning = new Texture(env.STATIC + 'image/weapon/lightning.png')
	public static cyan_lightning = new Texture(env.STATIC + 'image/weapon/cyan_lightning.png')
	public static purple_lightning = new Texture(env.STATIC + 'image/weapon/purple_lightning.png')
	public static red_lightning = new Texture(env.STATIC + 'image/weapon/red_lightning.png')
	public static double_gun = new Texture(env.STATIC + 'image/weapon/double_gun.png', true, SHADOW_QUALITY)
	public static cart_double_gun = new Texture(env.STATIC + 'image/weapon/cart_double_gun.png')
	public static pistol = new Texture(env.STATIC + 'image/weapon/pistol.png', true, SHADOW_QUALITY)
	public static cart_pistol = new Texture(env.STATIC + 'image/weapon/cart_pistol.png')
	public static shotgun = new Texture(env.STATIC + 'image/weapon/shotgun.png', true, SHADOW_QUALITY)
	public static cart_shotgun = new Texture(env.STATIC + 'image/weapon/cart_shotgun.png')
	public static magnum = new Texture(env.STATIC + 'image/weapon/magnum.png', true, SHADOW_QUALITY)
	public static cart_magnum = new Texture(env.STATIC + 'image/weapon/cart_magnum.png')
	public static grenade_launcher = new Texture(env.STATIC + 'image/weapon/grenade_launcher.png', true, SHADOW_QUALITY)
	public static illicit_grenade_launcher = new Texture(env.STATIC + 'image/weapon/illicit_grenade_launcher.png', true, SHADOW_QUALITY)
	public static cart_grenade_launcher = new Texture(env.STATIC + 'image/weapon/cart_grenade_launcher.png')
	public static cart_illicit_grenade_launcher = new Texture(env.STATIC + 'image/weapon/cart_illicit_grenade_launcher.png')
	public static destroyer = new Texture(env.STATIC + 'image/weapon/destroyer.png', true, SHADOW_QUALITY)
	public static cart_destroyer = new Texture(env.STATIC + 'image/weapon/cart_destroyer.png')
	public static flame_thrower = new Texture(env.STATIC + 'image/weapon/flame_thrower.png', true, SHADOW_QUALITY)
	public static gazor = new Texture(env.STATIC + 'image/weapon/gazor.png', true, SHADOW_QUALITY)
	public static unbridled_gazor = new Texture(env.STATIC + 'image/weapon/unbridled_gazor.png', true, SHADOW_QUALITY)
	public static b_laser = new Texture(env.STATIC + "image/weapon/b_laser.png", true, SHADOW_QUALITY)
	public static b_laser_bullet = new Texture(env.STATIC + "image/weapon/b_laser_bullet.png")
	public static cart_b_laser = new Texture(env.STATIC + 'image/weapon/cart_b_laser.png')
	public static katana = new Texture(env.STATIC + 'image/weapon/katana.png', true, SHADOW_QUALITY)
	public static broadsword = new Texture(env.STATIC + 'image/weapon/broadsword.png', true, SHADOW_QUALITY)
	public static axe = new Texture(env.STATIC + 'image/weapon/axe.png', true, SHADOW_QUALITY)
	public static slash = new Texture(env.STATIC + 'image/fight/slash.png', true, SHADOW_QUALITY)
	public static j_laser = new Texture(env.STATIC + 'image/weapon/j_laser.png', true, SHADOW_QUALITY)
	public static j_laser_bullet = new Texture(env.STATIC + 'image/weapon/j_laser_bullet.png', true, SHADOW_QUALITY)
	public static cart_j_laser = new Texture(env.STATIC + 'image/weapon/cart_j_laser.png')

	// Cartes
	public static box = new Texture(env.STATIC + 'image/map/box.png', true, 1)
	public static big_box = new Texture(env.STATIC + 'image/map/big_box.png', true, 1)
	public static factory = new Texture(env.STATIC + 'image/map/factory_bg.png')
	public static desert = new Texture(env.STATIC + 'image/map/desert.png')
	public static desert_rock2_small = new Texture(env.STATIC + 'image/map/rock2_small.png', true, 1)
	public static desert_grass = new Texture(env.STATIC + 'image/map/desert_grass.png', true, 1)
	public static cactus = new Texture(env.STATIC + 'image/map/cactus.png', true, 1)
	public static desert_rock1_big = new Texture(env.STATIC + 'image/map/rock1_big.png', true, 1)
	public static desert_rock2_big = new Texture(env.STATIC + 'image/map/rock2_big.png', true, 1)
	public static desert_rock3_big = new Texture(env.STATIC + 'image/map/rock3_big.png', true, 1)
	public static skull = new Texture(env.STATIC + 'image/map/skull.png')
	public static forest = new Texture(env.STATIC + 'image/map/forest.png')
	public static forest_rock = new Texture(env.STATIC + 'image/map/forest_rock.png', true, 1)
	public static forest_rock_small = new Texture(env.STATIC + 'image/map/forest_rock_small.png', true, 1)
	public static stump = new Texture(env.STATIC + 'image/map/stump.png', true, 1)
	public static fern = new Texture(env.STATIC + 'image/map/fern.png', true, 1)
	public static leaf = new Texture(env.STATIC + 'image/map/leaf.png')
	public static leaf2 = new Texture(env.STATIC + 'image/map/leaf2.png')
	public static leaf3 = new Texture(env.STATIC + 'image/map/leaf3.png')
	public static leaf4 = new Texture(env.STATIC + 'image/map/leaf4.png')
	public static mushroom = new Texture(env.STATIC + 'image/map/mushroom.png', true, 1)
	public static glacier = new Texture(env.STATIC + 'image/map/glacier.png')
	public static beach = new Texture(env.STATIC + 'image/map/beach.png')
	public static starfish = new Texture(env.STATIC + 'image/map/starfish.png', false, 0)
	public static starfish2 = new Texture(env.STATIC + 'image/map/starfish2.png', false, 0)
	public static palm = new Texture(env.STATIC + 'image/map/palm.png', true, 1)
	public static pebble = new Texture(env.STATIC + 'image/map/pebble.png', true, 1)
	public static pebble_small = new Texture(env.STATIC + 'image/map/pebble_small.png')
	public static snowman = new Texture(env.STATIC + 'image/map/snowman.png', true, 1)
	public static fir = new Texture(env.STATIC + 'image/map/fir.png', true, 1)
	public static ice = new Texture(env.STATIC + 'image/map/ice.png', true, 1)
	public static ice_small = new Texture(env.STATIC + 'image/map/ice_small.png', true, 1)
	public static barrel = new Texture(env.STATIC + 'image/map/barrel.png', true, 1)
	public static factory_cone = new Texture(env.STATIC + 'image/map/factory_cone.png', true, 1)
	public static cone_big = new Texture(env.STATIC + 'image/map/cone_big.png', true, 1)
	public static fire = new Texture(env.STATIC + 'image/weapon/fire.png')
	public static gaz = new Texture(env.STATIC + 'image/weapon/gaz.png')
	public static orange_gaz = new Texture(env.STATIC + 'image/weapon/orange_gaz.png')
	public static grenade = new Texture(env.STATIC + 'image/weapon/grenade.png')
	public static red_grenade = new Texture(env.STATIC + 'image/weapon/red_grenade.png')
	public static explosion = new Texture(env.STATIC + 'image/weapon/explosion.png')
	public static red_explosion = new Texture(env.STATIC + 'image/weapon/red_explosion.png')
	public static cloud = new Texture(env.STATIC + 'image/fight/cloud.png')
	public static grey_cloud = new Texture(env.STATIC + 'image/fight/grey_cloud.png')
	public static black_cloud = new Texture(env.STATIC + 'image/fight/black_cloud.png')
	public static nexus_bg = new Texture(env.STATIC + 'image/map/nexus_bg.png')
	public static nexus_block = new Texture(env.STATIC + 'image/map/nexus_block.png')
	public static nexus_block_small = new Texture(env.STATIC + 'image/map/nexus_block_small.png')
	public static rock = new Texture(env.STATIC + 'image/map/rock.png')
	public static stalactite = new Texture(env.STATIC + 'image/fight/stalactite.png')
	public static iceberg = new Texture(env.STATIC + 'image/fight/iceberg.png')
	public static ice_part = new Texture(env.STATIC + 'image/fight/ice_part.png')
	public static ice_part2 = new Texture(env.STATIC + 'image/fight/ice_part2.png')
	public static meteorite = new Texture(env.STATIC + 'image/fight/meteorite.png')
	public static pumpkin = new Texture(env.STATIC + 'image/map/pumpkin.png', true, 1)
	public static red_circle = new Texture(env.STATIC + 'image/fight/red_circle.png')
	public static daemon_shadow = new Texture(env.STATIC + 'image/fight/daemon_shadow.png')
	public static arena = new Texture(env.STATIC + 'image/map/arena.png')
	public static pyramid = new Texture(env.STATIC + 'image/map/pyramid.png', true, 1)
	public static grass = new Texture(env.STATIC + 'image/map/grass.png', true, 1)
	public static pillar = new Texture(env.STATIC + 'image/map/pillar.png', true, 1)
	public static cube = new Texture(env.STATIC + 'image/map/cube.png', true, 1)
	public static small_cube = new Texture(env.STATIC + 'image/map/small_cube.png', true, 1)
	public static square = new Texture(env.STATIC + 'image/map/square.png', true, 1)
	public static dirt = new Texture(env.STATIC + 'image/map/dirt.png')
	public static forest_grass = new Texture(env.STATIC + 'image/map/forest_grass.png')
	public static rock_new = new Texture(env.STATIC + 'image/map/rock_new.png', true, 1)
	public static little_grass = new Texture(env.STATIC + 'image/map/little_grass.png', true, 1)
	public static little_grass_2 = new Texture(env.STATIC + 'image/map/little_grass_2.png', true, 1)
	public static caillou = new Texture(env.STATIC + 'image/map/caillou.png', true, 1)
	public static branch = new Texture(env.STATIC + 'image/map/branch.png')
	public static glacier_snow = new Texture(env.STATIC + 'image/map/glacier_snow.png')
	public static factory_metal = new Texture(env.STATIC + 'image/map/factory_metal.png')
	public static factory_metal_2 = new Texture(env.STATIC + 'image/map/factory_metal_2.png')
	public static arrows = new Texture(env.STATIC + 'image/map/arrows.png')
	public static forest_flower = new Texture(env.STATIC + 'image/map/forest_flower.png', true, 1)
	public static factory_bolt = new Texture(env.STATIC + 'image/map/factory_bolt.png', true, 1)
	public static forest_branch = new Texture(env.STATIC + 'image/map/forest_branch.png')

	// Chips
	public static cure_aureol = new Texture(env.STATIC + 'image/fight/cure_aureol.png')
	public static shield_aureol = new Texture(env.STATIC + 'image/fight/shield_aureol.png')
	public static buff_aureol = new Texture(env.STATIC + 'image/fight/buff_aureol.png')
	public static halo = new Texture(env.STATIC + 'image/fight/halo.png')
	public static halo_green = new Texture(env.STATIC + 'image/fight/halo_green.png')
	public static heal_cross = new Texture(env.STATIC + 'image/fight/heal_cross.png')
	public static liberation_halo = new Texture(env.STATIC + 'image/fight/liberation.png')
	public static antidote_halo = new Texture(env.STATIC + 'image/fight/antidote.png')
	public static poison_aureol = new Texture(env.STATIC + 'image/fight/poison_aureol.png')
	public static shackle_aureol = new Texture(env.STATIC + 'image/fight/shackle_aureol.png')
	public static damage_return_aureol = new Texture(env.STATIC + 'image/fight/damage_return_aureol.png')
	public static chip_burning = new Texture(env.STATIC + 'image/chip/glyph/burning.png')
	public static spike1 = new Texture(env.STATIC + 'image/fight/spike1.png', true, 1)
	public static spike2 = new Texture(env.STATIC + 'image/fight/spike2.png', true, 1)
	public static plasma = new Texture(env.STATIC + 'image/fight/plasma.png', true, 1)
	public static alteration = new Texture(env.STATIC + 'image/fight/alteration.png', true, 1)

	// Buff
	public static chip_steroid = new Texture(env.STATIC + 'image/chip/glyph/steroid.png')
	public static chip_protein = new Texture(env.STATIC + 'image/chip/glyph/protein.png')
	public static chip_warm_up = new Texture(env.STATIC + 'image/chip/glyph/warm_up.png')
	public static chip_stretching = new Texture(env.STATIC + 'image/chip/glyph/stretching.png')
	public static chip_reflexes = new Texture(env.STATIC + 'image/chip/glyph/reflexes.png')
	public static chip_doping = new Texture(env.STATIC + 'image/chip/glyph/doping.png')
	public static chip_adrenaline = new Texture(env.STATIC + 'image/chip/glyph/adrenaline.png')
	public static chip_motivation = new Texture(env.STATIC + 'image/chip/glyph/motivation.png')
	public static chip_rage = new Texture(env.STATIC + 'image/chip/glyph/rage.png')
	public static chip_seven_league_boots = new Texture(env.STATIC + 'image/chip/glyph/seven_league_boots.png')
	public static chip_leather_boots = new Texture(env.STATIC + 'image/chip/glyph/leather_boots.png')
	public static chip_winged_boots = new Texture(env.STATIC + 'image/chip/glyph/winged_boots.png')
	public static chip_whip = new Texture(env.STATIC + 'image/chip/glyph/whip.png')
	public static chip_acceleration = new Texture(env.STATIC + 'image/chip/glyph/acceleration.png')
	public static chip_solidification = new Texture(env.STATIC + 'image/chip/glyph/solidification.png')
	public static chip_ferocity = new Texture(env.STATIC + 'image/chip/glyph/ferocity.png')
	public static chip_collar = new Texture(env.STATIC + 'image/chip/glyph/collar.png')
	public static chip_bark = new Texture(env.STATIC + 'image/chip/glyph/bark.png')
	public static chip_precipitation = new Texture(env.STATIC + 'image/chip/glyph/precipitation.png')
	public static chip_covetousness = new Texture(env.STATIC + 'image/chip/glyph/covetousness.png')
	public static chip_vampirization = new Texture(env.STATIC + 'image/chip/glyph/vampirization.png')

	// Shield
	public static chip_helmet = new Texture(env.STATIC + 'image/chip/glyph/helmet.png')
	public static chip_wall = new Texture(env.STATIC + 'image/chip/glyph/wall.png')
	public static chip_armor = new Texture(env.STATIC + 'image/chip/glyph/armor.png')
	public static chip_shield = new Texture(env.STATIC + 'image/chip/glyph/shield.png')
	public static chip_fortress = new Texture(env.STATIC + 'image/chip/glyph/fortress.png')
	public static chip_rampart = new Texture(env.STATIC + 'image/chip/glyph/rampart.png')
	public static chip_carapace = new Texture(env.STATIC + 'image/chip/glyph/carapace.png')

	// Heal
	public static chip_bandage = new Texture(env.STATIC + 'image/chip/glyph/bandage.png')
	public static chip_cure = new Texture(env.STATIC + 'image/chip/glyph/cure.png')
	public static chip_vaccine = new Texture(env.STATIC + 'image/chip/glyph/vaccine.png')
	public static chip_regeneration = new Texture(env.STATIC + 'image/chip/glyph/regeneration.png')
	public static chip_drip = new Texture(env.STATIC + 'image/chip/glyph/drip.png')
	public static chip_armoring = new Texture(env.STATIC + 'image/chip/glyph/armoring.png')
	public static chip_remission = new Texture(env.STATIC + 'image/chip/glyph/remission.png')
	public static chip_loam = new Texture(env.STATIC + 'image/chip/glyph/loam.png')
	public static chip_fertilizer = new Texture(env.STATIC + 'image/chip/glyph/fertilizer.png')

	// Damage return
	public static chip_thorn = new Texture(env.STATIC + 'image/chip/glyph/thorn.png')
	public static chip_mirror = new Texture(env.STATIC + 'image/chip/glyph/mirror.png')

	// Poison
	public static chip_venom = new Texture(env.STATIC + 'image/chip/glyph/venom.png')
	public static chip_toxin = new Texture(env.STATIC + 'image/chip/glyph/toxin.png')
	public static chip_plague = new Texture(env.STATIC + 'image/chip/glyph/plague.png')

	// Shackles
	public static chip_slow_down = new Texture(env.STATIC + 'image/chip/glyph/slow_down.png')
	public static chip_ball_and_chain = new Texture(env.STATIC + 'image/chip/glyph/ball_and_chain.png')
	public static chip_tranquilizer = new Texture(env.STATIC + 'image/chip/glyph/tranquilizer.png')
	public static chip_soporific = new Texture(env.STATIC + 'image/chip/glyph/soporific.png')
	public static chip_fracture = new Texture(env.STATIC + 'image/chip/glyph/fracture.png')

	// Lama
	public static lama = new Texture(env.STATIC + 'image/fight/lama_big.png')

	static get(game: Game, path: string, buildShadow: boolean = false, quality: number = 1) {
		if (path in this.cache) {
			return this.cache[path]
		}
		const texture = new Texture(env.STATIC + path, buildShadow, quality).load(game)
		this.cache[path] = texture
		return texture
	}

	private static cache: {[key: string]: Texture} = {}
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

export { T, Texture, SHADOW_QUALITY }
