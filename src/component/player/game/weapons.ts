import { EntityDirection, FightEntity } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'
import { Cell } from '@/model/cell'
import { LeekWars } from '@/model/leekwars'
import { WeaponsData } from '@/model/weapon'
import { Leek } from './leek'
import { Position } from './position'

abstract class WeaponAnimation {
	public game: Game
	public texture: Texture
	// Position de l'arme par rapport au poireau (centre de rotation)
	public cx: number
	public cz: number
	public ocx: number
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
	public id: number

	constructor(game: Game, texture: Texture, id: number) {
		this.game = game
		this.texture = texture
		const data = WeaponsData[id]
		this.cx = data.cx
		this.cz = data.cz
		this.ocx = data.ocx
		this.x = data.x
		this.z = data.z
		this.mx1 = data.mx1
		this.mz1 = data.mz1
		this.mx2 = data.mx2
		this.mz2 = data.mz2
		this.sx = data.sx!
		this.sz = data.sz!
		this.id = LeekWars.weapons[id].item
	}
	public abstract update(dt: number): void
	public abstract shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number): number
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
		super(game, texture, id)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, pos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		this.step = 1
		this.inte = 0.001
		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation === EntityDirection.SOUTH || orientation === EntityDirection.EAST) ? 1 : -1
		this.angle = angle
		return WhiteWeaponAnimation.WHITE_WEAPON_DURATION
	}

	public update(dt: number) {
		if (this.inte < 1) {
			if (this.step === 1) {
				this.inte += dt * 0.04
			} else {
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

	public draw(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, front: boolean = true) {
		if (!front) { ctx.translate(0, 40) }
		if (this.step === 1) {
			ctx.translate(-this.inte * 40, -this.inte * 30)
		}
		ctx.rotate(front ? -Math.PI / 2 : -Math.PI / 4)
		if (this.step === 1) {
			const i = 1 - Math.min(1, (0.1 / this.inte))
			ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) * i)
		} else if (this.step === 2) {
			const i = 1 - Math.min(1, (0.05 / this.inte))
			ctx.rotate((front ? -Math.PI / 3 : -Math.PI / 3) + (Math.PI / 2.6 + (front ? Math.PI / 3 : Math.PI / 3)) * i)
		}
		ctx.drawImage(texture, 0, 0, this.texture.texture.width, this.texture.texture.height)
	}
}

abstract class RangeWeapon extends WeaponAnimation {
	public sx: number
	public sz: number
	public cartX: number
	public cartZ: number
	public cartAngle: number
	public recoilForce: number
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

	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, id: number) {
		super(game, texture, id)
		this.cartTexture = cartTexture
		this.sound = sound
		const data = WeaponsData[id]
		this.sx = data.sx!
		this.sz = data.sz!
		this.cartX = data.cartX!
		this.cartZ = data.cartZ!
		this.cartAngle = data.cartAngle!
		this.recoilForce = data.recoilForce!
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		// Coordonnées sans rotation (par rapport au centre)
		const x = this.x + this.sx - this.recoil
		const y = 0
		this.bulletZ = this.cz * scale + this.z + this.sz + handPos
		// Rotation
		this.bulletX = leekX + (this.cx + x * cos - y * sin) * orientation
		this.bulletY = leekY + (y * cos + x * sin)
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
		// Play sound
		this.sound.play(this.game)

		return duration
	}
	public update(dt: number) {
		if (this.recoil > 0) {
			this.recoil -= 1 * dt
			if (this.recoil < 0) { this.recoil = 0 }
		}
	}
	public abstract throwBullet(X: number, Y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell): number
}

class Firegun extends RangeWeapon {
	static FIREGUN_DURATION = 20
	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, id: number) {
		super(game, texture, cartTexture, sound, id)
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
		super(game, texture, cartTexture, sound, id)
		this.laserTexture = laserTexture
		this.range = range
		this.min_range = min_range
		this.color = color
	}
	public throwBullet(X: number, Y: number, z: number, angle: number, targetPosition: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		const dx = Math.sign(cell.x - caster.cell!.x)
		const dy = Math.sign(cell.y - caster.cell!.y)
		let current_cell = caster.cell
		for (let r = 0; r < this.min_range; ++r) {
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
		}
		let length = this.min_range - 1
		const cells = [] as Cell[]
		for (let r = 0; r < this.range; ++r) {
			length++
			if (current_cell) { cells.push(current_cell) }
			current_cell = this.game.ground.field.next_cell(current_cell, dx, dy)
			if (!current_cell || current_cell.obstacle) { break }
		}
		const width = (length + 0.5) * this.game.ground.realTileLength - this.sx - this.x
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
		super(game, T.destroyer, T.cart_destroyer, S.double_gun, 9)
	}
}
class DoubleGun extends Firegun {
	static textures = [T.shots, T.bullet, T.double_gun, T.cart_double_gun]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.double_gun, T.cart_double_gun, S.double_gun, 3)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[]) {
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

	constructor(game: Game) {
		super(game, T.electrisor, 11)
		this.lightning = T.lightning
		this.areaColor = '#0263f4'
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: Leek, cell: Cell, scale: number) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz * scale + this.z + this.sz - (caster.front ? 5 : -5)
		this.lightningX = leekX + (this.cx + x * cos) * orientation
		this.lightningY = leekY + x * sin
		this.lightningZ = z
		this.lightningAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.lightningPosition = targetPos
		this.shoots = 30
		this.game.setEffectArea(cell, Area.CIRCLE1, this.areaColor, 110)
		S.electrisor.play(this.game)
		this.caster = caster
		return Electrisor.ELECTRISOR_DURATION
	}

	public update(dt: number) {
		if (this.shoots > 0) {
			this.currentDelay -= dt
			if (this.currentDelay <= 0) {
				this.currentDelay = this.delay
				this.game.particles.addLightning(this.lightningX, this.lightningY, this.lightningZ + this.caster.handPos, this.lightningAngle, this.lightningPosition, this.lightning, 42)
				this.shoots--
			}
		}
	}
}
class MysteriousElectrisor extends Electrisor {
	static textures = [T.mysterious_electrisor, T.cyan_lightning]
	static sounds = [S.electrisor]

	constructor(game: Game) {
		super(game)
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
	public sx: number = 145
	public sz: number = 2
	public cartX = 60
	public cartZ = 20
	public cartAngle = Math.PI / 2
	public min_range: number = 2
	public range: number = 8

	constructor(game: Game) {
		super(game, T.flame_thrower, 8)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPosition: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = FlameThrower.FLAMETHROWER_DURATION
		S.flame_thrower.play(this.game)

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
		this.game.setEffectAreaLaser(cells, "orange", dx, dy)
		return FlameThrower.FLAMETHROWER_DURATION
	}

	public update(dt: number) {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, true)
				}
			}
			this.shoots -= dt
		}
	}
}
class Gazor extends WeaponAnimation {
	static GAZOR_DURATION = 80
	static textures = [T.gazor, T.gaz]
	static sounds = [S.gazor]

	public shoots: number = 0
	public bulletX: number = 0
	public bulletY: number = 0
	public bulletZ: number = 0
	public bulletAngle: number = 0
	public sx: number = 130
	public sz: number = 2
	public cartX = 60
	public cartZ = 20
	public cartAngle = Math.PI / 2
	public color: string
	public gaz: Texture
	public targetPos!: Position

	constructor(game: Game) {
		super(game, T.gazor, 10)
		this.color = '#04e513'
		this.gaz = T.gaz
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		this.targetPos = targetPos
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz * scale + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = Gazor.GAZOR_DURATION
		this.game.setEffectArea(cell, Area.CIRCLE3, this.color, 120)
		S.gazor.play(this.game)
		return Gazor.GAZOR_DURATION
	}

	public update(dt: number) {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.gaz, true)
				}
			}
			this.shoots--
		}
	}
}
class UnbridledGazor extends Gazor {
	static textures = [T.unbridled_gazor, T.orange_gaz, T.explosion]
	static sounds = [S.gazor]
	explosions: number = 0
	delay: number = 0
	constructor(game: Game) {
		super(game)
		this.texture = T.unbridled_gazor
		this.gaz = T.orange_gaz
		this.color = '#ff5c00'
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		this.explosions = 4
		this.delay = 40
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}
	public update(dt: number) {
		super.update(dt)
		if (this.explosions > 0) {
			this.delay -= dt
			if (this.delay < 0) {
				this.game.particles.addExplosion(this.targetPos.x + Math.random() * 200 - 100, this.targetPos.y + Math.random() * 100 - 50, 0, T.explosion)
				this.explosions--
				this.delay = 15 + Math.random() * 10
			}
		}
	}
}

class GrenadeLauncher extends Firegun {
	static GRENADE_LAUNCHER_DURATION = 50
	static textures = [T.shots, T.grenade_launcher, T.cart_grenade_launcher, T.grenade, T.explosion]
	static sounds = [S.grenade_shoot, S.explosion]

	constructor(game: Game) {
		super(game, T.grenade_launcher, T.cart_grenade_launcher, S.grenade_shoot, 7)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addGrenade(x, y, z, angle, position, targets, T.grenade, T.explosion)
		this.game.setEffectArea(cell, Area.CIRCLE2, '#0094c5')
		return GrenadeLauncher.GRENADE_LAUNCHER_DURATION
	}
}

class IllicitGrenadeLauncher extends Firegun {
	static GRENADE_LAUNCHER_DURATION = 50
	static textures = [T.shots, T.illicit_grenade_launcher, T.cart_illicit_grenade_launcher, T.red_grenade, T.red_explosion]
	static sounds = [S.grenade_shoot, S.explosion]

	constructor(game: Game) {
		super(game, T.illicit_grenade_launcher, T.cart_illicit_grenade_launcher, S.grenade_shoot, 18)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		this.game.particles.addGrenade(x, y, z, angle, position, targets, T.red_grenade, T.red_explosion)
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
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
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
		super(game, T.rifle, T.rifle_cartridge, S.rifle, 22)
	}

	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: FightEntity[], caster: FightEntity, cell: Cell, scale: number) {
		this.shoots = Rifle.SHOTS
		return super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell, scale)
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			this.delay -= dt
			if (this.delay <= 0) {
				S.rifle.play(this.game)
				this.throwBullet(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.targetPos, this.targets, this.caster, this.cell)
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
		super(game, T.j_laser, T.j_laser_bullet, T.cart_j_laser, S.laser, 17, 6, 6, "#f7c604")
	}
}
class MachineGun extends Firegun {
	static textures = [T.shots, T.bullet, T.machine_gun, T.cart_machine_gun]
	static sounds = [S.machine_gun]

	constructor(game: Game) {
		super(game, T.machine_gun, T.cart_machine_gun, S.machine_gun, 2)
	}

	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
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
		super(game, T.magnum, T.cart_magnum, S.double_gun, 5)
	}
}
class Pistol extends Firegun {
	static textures = [T.shots, T.bullet, T.pistol, T.cart_pistol]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.pistol, T.cart_pistol, S.double_gun, 1)
	}
}
class Rhino extends Firegun {
	static textures = [T.shots, T.bullet, T.rhino, T.rhino_cartridge]
	static sounds = [S.double_gun]
	constructor(game: Game) {
		super(game, T.rhino, T.rhino_cartridge, S.double_gun, 23)
	}
}
class Shotgun extends Firegun {
	static textures = [T.shots, T.bullet, T.shotgun, T.cart_shotgun]
	static sounds = [S.shotgun]

	constructor(game: Game) {
		super(game, T.shotgun, T.cart_shotgun, S.shotgun, 4)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: FightEntity[], caster: FightEntity, cell: Cell) {
		for (let i = 0; i < 5; i++) {
			this.game.particles.addBullet(x, y, z, angle + Math.random() * Math.PI / 4 - Math.PI / 8, targets)
		}
		return Firegun.FIREGUN_DURATION
	}
}

export { WeaponAnimation, WhiteWeaponAnimation, Axe, BLaser, Broadsword, Destroyer, DoubleGun, Electrisor, FlameThrower, Gazor, GrenadeLauncher, IllicitGrenadeLauncher, JLaser, Katana, Laser, MachineGun, Magnum, Rhino, MLaser, MysteriousElectrisor, Pistol, RevokedMLaser, Rifle, Shotgun, UnbridledGazor }
