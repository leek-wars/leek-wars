import { DamageType, EntityDirection, FightEntity } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'
import { Cell } from '@/model/cell'
import { LeekWars } from '@/model/leekwars'
import { FishData, WeaponsData } from '@/model/weapon'
import { Leek } from './leek'
import { LighningBall, RealisticExplosion } from './particle'
import { Position } from './position'

abstract class WeaponAnimation {
	public game: Game
	public texture: Texture
	public w: number
	public h: number
	// Position de l'arme par rapport au poireau (centre de rotation)
	public cx: number
	public cz: number
	// Position de l'arme par rapport au centre
	public x: number
	public z: number
	// Position des mains
	public mx1: number
	public mz1: number
	public mx2: number
	public mz2: number
	// Position du tir
	public sx: number
	public sz: number
	public recoil: number = 0
	public recoilAngle: number = 0
	public id: number
	// Type de dégât
	public damageType: DamageType

	constructor(game: Game, texture: Texture, id: number, damageType: DamageType) {
		this.game = game
		this.texture = texture
		const data = WeaponsData[id] || FishData
		this.w = data.width
		this.h = data.height
		this.cz = data.centerZ
		this.cx = data.centerX
		this.x = data.x
		this.z = data.z
		this.mx1 = data.hand1x
		this.mz1 = data.hand1z
		this.mx2 = data.hand2x
		this.mz2 = data.hand2z
		this.sx = data.sx!
		this.sz = data.sz!
		this.id = id === 0 ? 0 : LeekWars.weapons[id].item
		this.damageType = damageType
	}
	public abstract update(dt: number): void
	public abstract shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number

	public getShootPoint(angle: number, handZ: number): {x: number, y: number, z: number} {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		// Coordonnées sans rotation (par rapport au centre)
		const x = this.x + this.sx - this.recoil
		const y = this.z + this.sz
		// Rotation
		const bulletX = this.cx + x * cos - y * sin
		const bulletY = y * cos + x * sin
		const bulletZ = this.cz
		return { x: bulletX, y: bulletY, z: bulletZ + handZ }
	}
}

class WhiteWeaponAnimation extends WeaponAnimation {
	static WHITE_WEAPON_DURATION = 50
	public angle: number = 0
	public step = 0
	public steps = 2
	public inte = 1
	public leekX!: number
	public leekY!: number
	public direction!: number

	constructor(game: Game, texture: Texture, id: number) {
		super(game, texture, id, DamageType.SLICE)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, pos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number {
		this.step = 1
		this.inte = 0.001
		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation === EntityDirection.SOUTH || orientation === EntityDirection.EAST) ? 1 : -1
		this.angle = angle
		return WhiteWeaponAnimation.WHITE_WEAPON_DURATION
	}

	public update(dt: number): void {
		if (this.inte < 1) {
			if (this.step === 1) {
				this.inte += dt * 0.04
			} else {
				this.inte += dt * 0.1
			}
			if (this.inte >= 1) {
				this.step++
				if (this.step === 2) {
					S.sword.play(this.game)
					const angle = this.angle + (1 - this.direction) * Math.PI / 2
					this.game.particles.addImage(this.leekX + Math.cos(angle) * 50, this.leekY, 50 - Math.sin(angle) * 50, this.direction * 0.2, 0, 0, angle, T.slash, 30)
				}
				if (this.step <= this.steps) {
					this.inte = 0.001
				} else {
					this.game.actionDone()
					this.step = 0
					this.inte = 1
				}
			}
		}
	}

	public draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, front: boolean = true): void {
		// ctx.translate(this.cx, this.cz)
		if (this.step === 1) {
			ctx.translate(-this.inte * 40, -this.inte * 30)
		}
		ctx.rotate(front ? -Math.PI / 2 : -Math.PI / 4)
		ctx.translate(this.x, this.z)
		if (this.step === 1) {
			const i = 1 - Math.min(1, (0.1 / this.inte))
			ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) * i)
		} else if (this.step === 2) {
			const i = 1 - Math.min(1, (0.05 / this.inte))
			ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) + (Math.PI / 2.6 + (front ? Math.PI / 3 : Math.PI / 3)) * i)
		}
		ctx.drawImage(texture, 0, 0, this.w, this.h)
	}
}

abstract class RangeWeapon extends WeaponAnimation {
	public sx: number
	public sz: number
	public cartX: number
	public cartZ: number
	public cartAngle: number
	public recoilForce: number
	public angleForce: number
	public cartTexture: Texture | null
	public sound: Sound
	public bulletX!: number
	public bulletY!: number
	public bulletZ!: number
	public bulletAngle!: number
	public targetPos!: Position
	public targets!: FightEntity[]
	public caster!: FightEntity
	public cell!: Cell

	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, id: number, damageType: DamageType) {
		super(game, texture, id, damageType)
		this.cartTexture = cartTexture
		this.sound = sound
		const data = WeaponsData[id] || FishData
		this.sx = data.sx!
		this.sz = data.sz!
		this.cartX = data.cartX!
		this.cartZ = data.cartZ!
		this.cartAngle = data.cartAngle!
		this.recoilForce = data.recoilForce!
		this.angleForce = data.angleForce!
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		const coord = this.getShootPoint(angle, handPos)
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		this.bulletX = leekX + coord.x * scale * orientation
		this.bulletY = leekY + coord.y * scale
		this.bulletZ = coord.z * scale
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.targetPos = targetPos
		this.targets = targets
		this.caster = caster
		this.cell = cell
		const duration = this.throwBullet(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, targetPos, targets, caster, cell)
		// Cartridges
		if (this.cartTexture) {
			const cx = this.x + this.cartX - this.recoil
			const cz = this.cz + this.z + this.cartZ + handPos
			const CX = leekX + (this.cx + cx * cos) * orientation
			const CY = leekY + cx * sin
			const cartAngle = this.bulletAngle - this.cartAngle + (Math.random() * Math.PI / 4 - Math.PI / 8)
			const dx = Math.cos(cartAngle) * 3 * orientation
			const dy = Math.random() - 0.5
			const dz = 4 + Math.random() * 2
			this.game.particles.addCartridge(CX, CY, cz, dx, dy, dz, this.cartTexture)
		}
		// Recoil
		this.recoil = this.recoilForce
		this.recoilAngle = this.angleForce
		// Play sound
		this.sound.play(this.game)

		return duration
	}
	public update(dt: number) {
		if (this.recoil > 0) {
			this.recoil -= 1 * dt
			if (this.recoil < 0) { this.recoil = 0 }
		}
		if (this.recoilAngle > 0) {
			this.recoilAngle -= 1 * dt
			if (this.recoilAngle < 0) { this.recoilAngle = 0 }
		}
	}
	public abstract throwBullet(X: number, Y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell): number
}

class Firegun extends RangeWeapon {
	static FIREGUN_DURATION = 20
	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, id: number, damageType: DamageType) {
		super(game, texture, cartTexture, sound, id, damageType)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addBullet(x, y, z, angle, targets)
		return Firegun.FIREGUN_DURATION
	}
}

class LaserWeapon extends RangeWeapon {
	static LASER_DURATION = 10
	public laserTexture: Texture
	public range: number
	public min_range: number
	public color: string

	constructor(game: Game, texture: Texture, laserTexture: Texture, cartTexture: Texture, sound: Sound, id: number, range: number, min_range: number, color: string) {
		super(game, texture, cartTexture, sound, id, DamageType.EXPLOSION)
		this.laserTexture = laserTexture
		this.range = range
		this.min_range = min_range
		this.color = color
	}

	public throwBullet(X: number, Y: number, z: number, angle: number, targetPosition: Position, targets: FightEntity[], caster: Leek, cell: Cell) {
		const dx = Math.sign(cell.x - caster.cell!.x)
		const dy = Math.sign(cell.y - caster.cell!.y)
		let current_cell = caster.cell
		for (let r = 0; r < this.min_range; ++r) {
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
		}
		let length = this.min_range
		const cells = [] as Cell[]
		for (let r = 0; r < this.range; ++r) {
			length++
			if (current_cell) { cells.push(current_cell) }
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
			if (!current_cell || current_cell.obstacle) { break }
		}
		const width = length * this.game.ground.realTileLength - (this.cx + this.x + this.sx) * caster.scale
		const deltaX = Math.cos(angle) * width / 2
		const deltaY = Math.sin(angle) * width / 2
		this.game.particles.addLaser(X + deltaX, Y + deltaY, z, angle, width, this.laserTexture, targets)

		this.game.setEffectAreaLaser(cells, this.color, dx, dy)
		return Laser.LASER_DURATION
	}
}

class Axe extends WhiteWeaponAnimation {
	static textures = [T.slash, T.axe]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.axe, 16)
	}
}
class BLaser extends LaserWeapon {
	static textures = [T.b_laser, T.b_laser_bullet, T.cart_b_laser]
	static sounds = [S.laser]
	constructor(game: Game) {
		super(game, T.b_laser, T.b_laser_bullet, T.cart_b_laser, S.laser, 13, 7, 2, "#51C5FF")
	}
}
class Broadsword extends WhiteWeaponAnimation {
	static textures = [T.slash, T.broadsword]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.broadsword, 15)
	}
}
class Destroyer extends Firegun {
	static textures = [T.shots, T.bullet, T.destroyer, T.cart_destroyer]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.destroyer, T.cart_destroyer, S.double_gun, 9, DamageType.DEFAULT)
	}
}
class UnstableDestroyer extends Firegun {
	static textures = [T.shots, T.bullet, T.unstable_destroyer, T.cart_unstable_destroyer]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.unstable_destroyer, T.cart_unstable_destroyer, S.double_gun, 34, DamageType.EXPLOSION)
	}
}
class DoubleGun extends Firegun {
	static textures = [T.shots, T.bullet, T.double_gun, T.cart_double_gun]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.double_gun, T.cart_double_gun, S.double_gun, 3, DamageType.DEFAULT)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[]) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 40, targets)
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 40, [])
		return Firegun.FIREGUN_DURATION
	}
}

class Electrisor extends WeaponAnimation {
	static ELECTRISOR_DURATION = 60
	static textures = [T.lightning, T.electrisor]
	static sounds = [S.electrisor]
	public shoots: number = 0
	public delay: number = 2
	public currentDelay: number = 0
	public lightningX: number = 0
	public lightningY: number = 0
	public lightningZ: number = 0
	public lightningAngle: number = 0
	public lightningPosition!: Position
	public caster!: Leek
	public lightning!: Texture
	public areaColor!: string

	constructor(game: Game, id: number = 11) {
		super(game, T.electrisor, id, DamageType.DEFAULT)
		this.lightning = T.lightning
		this.areaColor = '#0263f4'
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: Leek, cell: Cell, scale: number): number {
		const coord = this.getShootPoint(angle, 0)
		this.lightningX = leekX + coord.x * scale * orientation
		this.lightningY = leekY + coord.y * scale
		this.lightningZ = coord.z * scale
		this.lightningAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.lightningPosition = targetPos
		this.shoots = 40
		this.game.setEffectArea(cell, Area.CIRCLE1, this.areaColor, 110)
		S.electrisor.play(this.game)
		this.caster = caster
		return Electrisor.ELECTRISOR_DURATION
	}

	public update(dt: number): void {
		if (this.shoots > 0) {
			this.currentDelay -= dt
			if (this.currentDelay <= 0) {
				this.currentDelay = this.delay
				this.game.particles.addLightning(this.lightningX, this.lightningY, this.lightningZ + this.caster.handPos * this.caster.scale, this.lightningAngle, this.lightningPosition, this.lightning, 42)
				this.shoots -= dt
			}
		}
	}
}
class MysteriousElectrisor extends Electrisor {
	static textures = [T.mysterious_electrisor, T.cyan_lightning]
	static sounds = [S.electrisor]

	constructor(game: Game) {
		super(game, 19)
		this.texture = T.mysterious_electrisor
		this.lightning = T.cyan_lightning
		this.areaColor = '#00de9b'
	}
}
class FlameThrower extends WeaponAnimation {
	static FLAMETHROWER_DURATION = 72
	static textures = [T.flame_thrower, T.fire]
	static sounds = [S.flame_thrower]

	public shoots: number = 0
	public bulletX: number = 0
	public bulletY: number = 0
	public bulletZ: number = 0
	public bulletAngle: number = 0
	public cartX = 60
	public cartZ = 20
	public cartAngle = Math.PI / 2
	public min_range: number = 2
	public range: number = 8
	public caster!: Leek

	constructor(game: Game) {
		super(game, T.flame_thrower, 8, DamageType.FIRE)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPosition: Position, targets: FightEntity[], caster: Leek, cell: Cell, scale: number): number {
		const coord = this.getShootPoint(angle, 0)
		this.bulletX = leekX + coord.x * orientation * scale
		this.bulletY = leekY + coord.y * scale
		this.bulletZ = coord.z * scale
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = FlameThrower.FLAMETHROWER_DURATION
		S.flame_thrower.play(this.game)
		this.caster = caster

		const dx = Math.sign(cell.x - caster.cell!.x)
		const dy = Math.sign(cell.y - caster.cell!.y)
		let current_cell = caster.cell
		for (let r = 0; r < this.min_range; ++r) {
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
		}
		const cells = [] as Cell[]
		for (let r = 0; r < this.range - 1; ++r) {
			if (current_cell) { cells.push(current_cell) }
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
			if (!current_cell || current_cell.obstacle) { break }
		}
		this.game.setEffectAreaLaser(cells, "orange", dx, dy, FlameThrower.FLAMETHROWER_DURATION + 40)
		return FlameThrower.FLAMETHROWER_DURATION
	}

	public update(dt: number) {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ + this.caster.handPos * this.caster.scale, this.bulletAngle, true)
				}
			}
			this.shoots -= dt
		}
	}
}

class GenericGazor extends WeaponAnimation {
	static GAZOR_DURATION = 80

	public shoots: number = 0
	public bulletX: number = 0
	public bulletY: number = 0
	public bulletZ: number = 0
	public bulletAngle: number = 0
	public cartAngle = Math.PI / 2
	public color: string
	public gaz: Texture
	public targetPos!: Position
	public caster!: Leek

	constructor(game: Game, id: number, texture: Texture, color: string, gaz: Texture, damageType: DamageType) {
		super(game, texture, id, damageType)
		this.color = color
		this.gaz = gaz
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: Leek, cell: Cell, scale: number): number {
		this.targetPos = targetPos
		const coord = this.getShootPoint(angle, 0)
		this.bulletX = leekX + coord.x * orientation * scale
		this.bulletY = leekY + coord.y * scale
		this.bulletZ = coord.z * scale
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = Gazor.GAZOR_DURATION
		this.caster = caster
		this.game.setEffectArea(cell, Area.CIRCLE3, this.color, 120)
		S.gazor.play(this.game)
		return Gazor.GAZOR_DURATION
	}

	public update(dt: number): void {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ + this.caster.handPos * this.caster.scale, this.bulletAngle, this.gaz, true)
				}
			}
			this.shoots -= dt
		}
	}
}

class Gazor extends GenericGazor {
	static textures = [T.gazor, T.gaz]
	static sounds = [S.gazor]

	constructor(game: Game) {
		super(game, 10, T.gazor, '#04e513', T.gaz, DamageType.DEFAULT)
	}
}

class UnbridledGazor extends GenericGazor {
	static textures = [T.unbridled_gazor, T.orange_gaz, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.gazor, S.explosion]
	explosions: number = 0
	delay: number = 0

	constructor(game: Game) {
		super(game, 20, T.unbridled_gazor, '#ff5c00', T.orange_gaz, DamageType.EXPLOSION)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: Leek, cell: Cell, scale: number): number {
		this.explosions = 4
		this.delay = 40
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}

	public update(dt: number): void {
		super.update(dt)
		if (this.explosions > 0) {
			this.delay -= dt
			if (this.delay < 0) {
				this.game.particles.addRealisticExplosion(this.targetPos.x + Math.random() * 200 - 100, this.targetPos.y + Math.random() * 100 - 50, 2)
				this.explosions--
				this.delay = 10 + Math.random() * 10
			}
		}
	}
}

class GrenadeLauncher extends Firegun {
	static GRENADE_LAUNCHER_DURATION = 50
	static textures = [T.shots, T.grenade_launcher, T.cart_grenade_launcher, T.grenade, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.grenade_shoot, S.explosion]

	constructor(game: Game) {
		super(game, T.grenade_launcher, T.cart_grenade_launcher, S.grenade_shoot, 7, DamageType.EXPLOSION)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addGrenade(x, y, z, angle, position, targets, T.grenade, cell)
		this.game.setEffectArea(cell, Area.CIRCLE2, '#0094c5')
		return GrenadeLauncher.GRENADE_LAUNCHER_DURATION
	}
}

class IllicitGrenadeLauncher extends Firegun {
	static GRENADE_LAUNCHER_DURATION = 50
	static textures = [T.shots, T.illicit_grenade_launcher, T.cart_illicit_grenade_launcher, T.red_grenade, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.grenade_shoot, S.explosion]

	constructor(game: Game) {
		super(game, T.illicit_grenade_launcher, T.cart_illicit_grenade_launcher, S.grenade_shoot, 18, DamageType.EXPLOSION)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addGrenade(x, y, z, angle, position, targets, T.red_grenade, cell)
		this.game.setEffectArea(cell, Area.CIRCLE2, 'red')
		return IllicitGrenadeLauncher.GRENADE_LAUNCHER_DURATION
	}
}

class Katana extends WhiteWeaponAnimation {
	static textures = [T.slash, T.katana]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.katana, 14)
	}
}

class DarkKatana extends WhiteWeaponAnimation {
	static textures = [T.slash, T.dark_katana]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.dark_katana, 32)
	}
}

class Sword extends WhiteWeaponAnimation {
	static textures = [T.slash, T.sword]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.sword, 35)
	}
}

class HeavySword extends WhiteWeaponAnimation {
	static textures = [T.slash, T.heavy_sword]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.heavy_sword, 36)
	}
}

export class Odachi extends WhiteWeaponAnimation {
	static textures = [T.slash, T.odachi]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.odachi, 37)
	}
}

export class Excalibur extends WhiteWeaponAnimation {
	static textures = [T.slash, T.excalibur]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.excalibur, 38)
	}
}

export class Scythe extends WhiteWeaponAnimation {
	static textures = [T.slash, T.scythe]
	static sounds = [S.sword]
	constructor(game: Game) {
		super(game, T.scythe, 39)
	}
}

class Laser extends LaserWeapon {
	static textures = [T.laser, T.laser_bullet, T.cart_laser]
	static sounds = [S.laser]
	constructor(game: Game) {
		super(game, T.laser, T.laser_bullet, T.cart_laser, S.laser, 6, 8, 2, "#02e009")
	}
}

class MLaser extends LaserWeapon {
	static textures = [T.m_laser, T.m_laser_bullet, T.cart_m_laser]
	static sounds = [S.laser]
	constructor(game: Game) {
		super(game, T.m_laser, T.m_laser_bullet, T.cart_m_laser, S.laser, 12, 8, 5, "#d80205")
	}
}
class RevokedMLaser extends LaserWeapon {
	static textures = [T.revoked_m_laser, T.revoked_m_laser_bullet, T.cart_revoked_m_laser]
	static sounds = [S.laser, S.poison]

	constructor(game: Game) {
		super(game, T.revoked_m_laser, T.revoked_m_laser_bullet, T.cart_revoked_m_laser, S.laser, 21, 8, 5, "#c500e6")
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number {
		S.poison.play(this.game)
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}
}

class Rifle extends Firegun {
	static textures = [T.shots, T.bullet, T.rifle, T.rifle_cartridge]
	static sounds = [S.rifle]
	static SHOTS = 2
	static DELAY = 10
	shoots: number = 0
	delay: number = Rifle.DELAY
	constructor(game: Game) {
		super(game, T.rifle, T.rifle_cartridge, S.rifle, 22, DamageType.DEFAULT)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number {
		this.shoots = Rifle.SHOTS
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}
	public update(dt: number): void {
		super.update(dt)
		if (this.shoots > 0) {
			this.delay -= dt
			if (this.delay <= 0) {
				S.rifle.play(this.game)
				this.game.particles.addShot(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle)
				this.throwBullet(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.targetPos, this.targets, this.caster, this.cell)
				this.recoil = this.recoilForce
				this.recoilAngle = this.angleForce
				this.delay = Rifle.DELAY
				this.shoots--
			}
		}
	}
}

class ExplorerRifle extends Firegun {
	static textures = [T.shots, T.bullet, T.explorer_rifle, T.explorer_rifle_cartridge]
	static sounds = [S.rifle]
	static SHOTS = 2
	static DELAY = 10
	shoots: number = 0
	delay: number = Rifle.DELAY
	constructor(game: Game) {
		super(game, T.explorer_rifle, T.explorer_rifle_cartridge, S.rifle, 24, DamageType.DEFAULT)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number {
		this.shoots = Rifle.SHOTS
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}
	public update(dt: number): void {
		super.update(dt)
		if (this.shoots > 0) {
			this.delay -= dt
			if (this.delay <= 0) {
				S.rifle.play(this.game)
				this.game.particles.addShot(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle)
				this.throwBullet(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.targetPos, this.targets, this.caster, this.cell)
				this.recoil = this.recoilForce
				this.recoilAngle = this.angleForce
				this.delay = Rifle.DELAY
				this.shoots--
			}
		}
	}
}

class JLaser extends LaserWeapon {
	static textures = [T.j_laser, T.j_laser_bullet, T.cart_j_laser]
	static sounds = [S.laser]
	constructor(game: Game) {
		super(game, T.j_laser, T.j_laser_bullet, T.cart_j_laser, S.laser, 17, 7, 5, "#f7c604")
	}
}
class MachineGun extends Firegun {
	static textures = [T.shots, T.bullet, T.machine_gun, T.cart_machine_gun]
	static sounds = [S.machine_gun]

	constructor(game: Game) {
		super(game, T.machine_gun, T.cart_machine_gun, S.machine_gun, 2, DamageType.DEFAULT)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell): number {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addBullet(x, y, z, angle, targets)
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 25, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 25, [])
		return Firegun.FIREGUN_DURATION
	}
}
class Magnum extends Firegun {
	static textures = [T.shots, T.bullet, T.magnum, T.cart_magnum]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.magnum, T.cart_magnum, S.double_gun, 5, DamageType.DEFAULT)
	}
}
class Pistol extends Firegun {
	static textures = [T.shots, T.bullet, T.pistol, T.cart_pistol]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.pistol, T.cart_pistol, S.double_gun, 1, DamageType.DEFAULT)
	}
}
class Rhino extends Firegun {
	static textures = [T.shots, T.bullet, T.rhino, T.rhino_cartridge]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.rhino, T.rhino_cartridge, S.double_gun, 23, DamageType.DEFAULT)
	}
}
class Shotgun extends Firegun {
	static textures = [T.shots, T.bullet, T.shotgun, T.cart_shotgun]
	static sounds = [S.shotgun]

	constructor(game: Game) {
		super(game, T.shotgun, T.cart_shotgun, S.shotgun, 4, DamageType.EXPLOSION)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addShot(x, y, z, angle)
		for (let i = 0; i < 5; i++) {
			this.game.particles.addBullet(x, y, z, angle + Math.random() * Math.PI / 4 - Math.PI / 8, targets)
		}
		return Firegun.FIREGUN_DURATION
	}
}

class Fish extends Firegun {
	static GRENADE_LAUNCHER_DURATION = 100
	static textures = [T.shots, T.fish, T.fish_cartridge, T.bubble]
	static sounds = [S.bubble]
	static DELAY = 4

	private shoots = 0
	private delay = 0
	private bubbleX = 0
	private	bubbleY = 0
	private bubbleZ = 0
	private bubbleAngle = 0

	constructor(game: Game) {
		super(game, T.fish, T.fish_cartridge, S.bubble, 0, DamageType.DEFAULT)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.bubbleX = x
		this.bubbleY = y
		this.bubbleZ = z
		this.bubbleAngle = angle
		this.shoots = 20
		return GrenadeLauncher.GRENADE_LAUNCHER_DURATION
	}
	public update(dt: number): void {
		super.update(dt)
		if (this.shoots > 0) {
			this.delay -= dt
			if (this.delay <= 0) {
				this.delay = Fish.DELAY
				this.shoots--
				this.game.particles.addBubble(this.bubbleX, this.bubbleY, this.bubbleZ, this.bubbleAngle)
			}
		}
	}
}

class Neutrino extends Firegun {
	static textures = [T.shots, T.bullet, T.neutrino, T.cart_neutrino, T.green_lightning]
	static sounds = [S.lightninger]

	constructor(game: Game) {
		super(game, T.neutrino, T.cart_neutrino, S.lightninger, 27, DamageType.DEFAULT)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {

		this.targets = targets
		const distance = this.game.ground.field.real_distance(caster.cell!, cell)
		const duration = (distance - 2) * LighningBall.SPEED * 2
		this.game.particles.addLighningBall(x, y, z, angle, duration, 30, T.green_lightning)
		return duration
	}
}

class Lightninger extends Firegun {
	static textures = [T.shots, T.bullet, T.lightninger, T.cart_lightninger, T.plasma, T.blue_lightning]
	static sounds = [S.lightninger, S.lightning, S.electrisor, S.lightninger_impact]
	static EXPLOSION_DURATION = 40
	life: number = 100
	target_z!: number

	constructor(game: Game) {
		super(game, T.lightninger, T.cart_lightninger, S.lightninger, 25, DamageType.DEFAULT)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {

		this.targets = targets
		const distance = this.game.ground.field.real_distance(caster.cell!, cell)
		const duration = (distance - 2) * LighningBall.SPEED * 2
		this.life = duration + Lightninger.EXPLOSION_DURATION
		this.target_z = z

		this.game.particles.addLighningBall(x, y, z, angle, duration, 40, T.blue_lightning)
		this.game.setEffectArea(cell, Area.X_1, '#0096ff', duration + Lightninger.EXPLOSION_DURATION)

		return duration + Lightninger.EXPLOSION_DURATION
	}

	public update(dt: number) {
		super.update(dt)
		this.life -= dt
		if (this.life > 0 && this.life < Lightninger.EXPLOSION_DURATION && this.targets) {
			const R = 3
			const L = 50
			for (const target of this.targets) {
				for (let i = 0; i < 3; ++i) {
					const angle = Math.random() * Math.PI * 2
					const dx = Math.cos(angle)
					const dy = Math.sin(angle)
					const l = L + Math.random() * 10
					const position = {x: target.ox + dx * l, y: target.oy + dy * l}
					this.game.particles.addLightning(target.ox + dx * R, target.oy + dy * R, this.target_z, angle, position, T.blue_lightning, 20)
					target.electrify()
				}
			}
		}
	}
}


class EnhancedLightninger extends Firegun {
	static textures = [T.shots, T.bullet, T.enhanced_lightninger, T.cart_enhanced_lightninger, T.plasma, T.red_lightning]
	static sounds = [S.lightninger, S.lightning, S.electrisor, S.lightninger_impact]
	static EXPLOSION_DURATION = 40
	life: number = 100
	target_z!: number

	constructor(game: Game) {
		super(game, T.enhanced_lightninger, T.cart_enhanced_lightninger, S.lightninger, 33, DamageType.DEFAULT)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {

		this.targets = targets
		const distance = this.game.ground.field.real_distance(caster.cell!, cell)
		const duration = (distance - 2) * LighningBall.SPEED * 2
		this.life = duration + Lightninger.EXPLOSION_DURATION
		this.target_z = z

		this.game.particles.addLighningBall(x, y, z, angle, duration, 40, T.red_lightning)
		this.game.setEffectArea(cell, Area.SQUARE_1, '#ff2d02', duration + Lightninger.EXPLOSION_DURATION)

		return duration + Lightninger.EXPLOSION_DURATION
	}

	public update(dt: number) {
		super.update(dt)
		this.life -= dt
		if (this.life > 0 && this.life < Lightninger.EXPLOSION_DURATION && this.targets) {
			const R = 3
			const L = 50
			for (const target of this.targets) {
				for (let i = 0; i < 3; ++i) {
					const angle = Math.random() * Math.PI * 2
					const dx = Math.cos(angle)
					const dy = Math.sin(angle)
					const l = L + Math.random() * 10
					const position = {x: target.ox + dx * l, y: target.oy + dy * l}
					this.game.particles.addLightning(target.ox + dx * R, target.oy + dy * R, this.target_z, angle, position, T.red_lightning, 20)
					target.electrify()
				}
			}
		}
	}
}

class Bazooka extends Firegun {
	static textures = [T.shots, T.bullet, T.bazooka, T.cart_bazooka, T.rocket, T.fire, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.rocket, S.explosion]

	constructor(game: Game) {
		super(game, T.bazooka, T.cart_bazooka, S.rocket, 29, DamageType.EXPLOSION)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell): number {
		this.game.particles.addShot(x, y, z, angle)

		const distance = this.game.ground.field.real_distance(caster.cell!, cell)
		const duration = (distance - 1) * 4

		this.game.setEffectArea(cell, Area.CIRCLE3, 'red', duration + RealisticExplosion.LIFE)
		this.game.particles.addRocket(x, y, z, angle, duration, cell, 3)

		return duration + 10
	}
}

export { WeaponAnimation, WhiteWeaponAnimation, Axe, Bazooka, BLaser, Broadsword, DarkKatana, Destroyer, DoubleGun, Electrisor, EnhancedLightninger, ExplorerRifle, Fish, FlameThrower, Gazor, GrenadeLauncher, IllicitGrenadeLauncher, JLaser, Katana, Laser, Lightninger, MachineGun, Magnum, Neutrino, Rhino, MLaser, MysteriousElectrisor, Pistol, RevokedMLaser, Rifle, Shotgun, UnbridledGazor, UnstableDestroyer, Sword, HeavySword }
