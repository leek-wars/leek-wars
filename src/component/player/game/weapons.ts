import { Entity, EntityDirection } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { Sound } from '@/component/player/game/sound'
import { Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'
import { LeekWars } from '@/model/leekwars'
import { WeaponsData } from '@/model/weapon'
import { Cell } from './cell'
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
		this.id = LeekWars.weaponTemplates[id].item
	}
	public abstract shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Entity, cell: Cell): void
	public abstract update(dt: number): void
}

class WhiteWeaponAnimation extends WeaponAnimation {
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
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, pos: Position, targets: Entity[]) {
		this.step = 1
		this.inte = 0.001
		this.leekX = leekX
		this.leekY = leekY
		this.direction = (orientation === EntityDirection.SOUTH || orientation === EntityDirection.EAST) ? 1 : -1
		this.angle = angle
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
					this.game.S.sword.play()
					const angle = this.angle + (1 - this.direction) * Math.PI / 2
					this.game.particles.addImage(this.leekX + Math.cos(angle) * 50, this.leekY, 50 - Math.sin(angle) * 50, this.direction * 0.2, 0, 0, angle, this.game.T.slash, 30)
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
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Entity, cell: Cell) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		// Coordonnées sans rotation (par rapport au centre)
		const x = this.x + this.sx - this.recoil
		const y = 0
		const z = this.cz + this.z + this.sz + handPos
		// Rotation
		const X = leekX + (this.cx + x * cos - y * sin) * orientation
		const Y = leekY + (y * cos + x * sin)
		const realAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.throwBullet(X, Y, z, realAngle, targetPos, targets, caster, cell)
		// Cartridges
		if (this.cartTexture) {
			const cx = this.x + this.cartX - this.recoil
			const cz = this.cz + this.z + this.cartZ + handPos
			const CX = leekX + (this.cx + cx * cos) * orientation
			const CY = leekY + cx * sin
			const cartAngle = realAngle - this.cartAngle + (Math.random() * Math.PI / 4 - Math.PI / 8)
			const dx = Math.cos(cartAngle) * 3 * orientation
			const dy = Math.random() - 0.5
			const dz = 4 + Math.random() * 2
			this.game.particles.addCartridge(CX, CY, cz, dx, dy, dz, this.cartTexture)
		}
		// Recoil
		this.recoil = this.recoilForce
		// Play sound
		this.sound.play()
	}
	public update(dt: number) {
		if (this.recoil > 0) {
			this.recoil -= 1 * dt
			if (this.recoil < 0) { this.recoil = 0 }
		}
	}
	public abstract throwBullet(X: number, Y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell): void
}

class Firegun extends RangeWeapon {
	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, id: number) {
		super(game, texture, cartTexture, sound, id)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addBullet(x, y, z, angle, targets)
	}
}

class LaserWeapon extends RangeWeapon {
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
	public throwBullet(X: number, Y: number, z: number, angle: number, targetPosition: Position, targets: Entity[], caster: Entity, cell: Cell) {
		const dx = Math.sign(cell.x - caster.cell!.x)
		const dy = Math.sign(cell.y - caster.cell!.y)
		let current_cell = caster.cell
		for (let r = 0; r < this.min_range; ++r) {
			current_cell = this.game.ground.next_cell(current_cell, dx, dy)
		}
		let length = this.min_range - 1
		const cells = [] as Cell[]
		for (let r = 0; r < this.range; ++r) {
			length++
			if (current_cell) { cells.push(current_cell) }
			current_cell = this.game.ground.next_cell(current_cell, dx, dy)
			if (!current_cell || current_cell.obstacle) { break }
		}
		const width = (length + 0.5) * this.game.ground.realTileLength - this.sx - this.x
		const deltaX = Math.cos(angle) * width / 2
		const deltaY = Math.sin(angle) * width / 2
		this.game.particles.addLaser(X + deltaX, Y + deltaY, z, angle, width, this.laserTexture, targets)

		this.game.setEffectAreaLaser(cells, this.color, dx, dy)
	}
}

class Axe extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.axe, 16)
	}
}
class BLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.b_laser, game.T.b_laser_bullet, game.T.cart_b_laser, game.S.laser, 13, 7, 2, "#51C5FF")
	}
}
class Broadsword extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.broadsword, 15)
	}
}
class Destroyer extends Firegun {
	constructor(game: Game) {
		super(game, game.T.destroyer, game.T.cart_destroyer, game.S.double_gun, 9)
	}
}
class DoubleGun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.double_gun, game.T.cart_double_gun, game.S.double_gun, 3)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[]) {
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 40, targets)
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 40, [])
	}
}
class Electrisor extends WeaponAnimation {
	public shoots: number = 0
	public delay: number = 2
	public currentDelay: number = 0
	public lightningX: number = 0
	public lightningY: number = 0
	public lightningZ: number = 0
	public lightningAngle: number = 0
	public lightningPosition!: Position
	public sx: number = 89
	public sz: number = -15
	public caster!: Leek
	public lightning!: Texture
	public areaColor!: string
	constructor(game: Game) {
		super(game, game.T.electrisor, 11)
		this.lightning = game.T.lightning
		this.areaColor = '#0263f4'
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Leek, cell: Cell) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz - (caster.front ? 5 : -5)
		this.lightningX = leekX + (this.cx + x * cos) * orientation
		this.lightningY = leekY + x * sin
		this.lightningZ = z
		this.lightningAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.lightningPosition = targetPos
		this.shoots = 40
		this.game.setEffectArea(cell, Area.CIRCLE1, this.areaColor, 110)
		this.game.S.electrisor.play()
		this.caster = caster
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			this.currentDelay -= dt
			if (this.currentDelay <= 0) {
				this.currentDelay = this.delay
				this.game.particles.addLightning(this.lightningX, this.lightningY, this.lightningZ + this.caster.handPos, this.lightningAngle, this.lightningPosition, this.lightning, 42)
				this.shoots--
				if (this.shoots === 0) {
					this.game.actionDone()
				}
			}
		}
	}
}
class MysteriousElectrisor extends Electrisor {
	constructor(game: Game) {
		super(game)
		this.texture = game.T.mysterious_electrisor
		this.lightning = game.T.cyan_lightning
		this.areaColor = '#00de9b'
	}
}
class FlameThrower extends WeaponAnimation {
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
		super(game, game.T.flame_thrower, 8)
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPosition: Position, targets: Entity[], caster: Entity, cell: Cell) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = 72
		this.game.S.flame_thrower.play()

		const dx = Math.sign(cell.x - caster.cell!.x)
		const dy = Math.sign(cell.y - caster.cell!.y)
		let current_cell = caster.cell
		for (let r = 0; r < this.min_range; ++r) {
			current_cell = this.game.ground.next_cell(current_cell, dx, dy)
		}
		const cells = [] as Cell[]
		for (let r = 0; r < this.range; ++r) {
			if (current_cell) { cells.push(current_cell) }
			current_cell = this.game.ground.next_cell(current_cell, dx, dy)
			if (!current_cell || current_cell.obstacle) { break }
		}
		this.game.setEffectAreaLaser(cells, "orange", dx, dy)
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, true)
				}
			}
			this.shoots -= dt
			if (this.shoots <= 0) {
				this.game.actionDone()
			}
		}
	}
}
class Gazor extends WeaponAnimation {
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
		super(game, game.T.gazor, 10)
		this.color = '#04e513'
		this.gaz = game.T.gaz
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Entity, cell: Cell) {
		this.targetPos = targetPos
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = 80
		this.game.setEffectArea(cell, Area.CIRCLE3, this.color, 120)
		this.game.S.gazor.play()
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			if (this.shoots > 30) {
				for (let i = 0; i < Math.round(3 * dt); i++) {
					this.game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, this.gaz, true)
				}
			}
			this.shoots--
			if (this.shoots <= 0) {
				this.game.actionDone()
			}
		}
	}
}
class UnbridledGazor extends Gazor {
	explosions: number = 0
	delay: number = 0
	constructor(game: Game) {
		super(game)
		this.texture = game.T.unbridled_gazor
		this.gaz = game.T.orange_gaz
		this.color = '#ff5c00'
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Entity, cell: Cell) {
		super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell)
		this.explosions = 4
		this.delay = 40
	}
	public update(dt: number) {
		super.update(dt)
		if (this.explosions > 0) {
			this.delay -= dt
			if (this.delay < 0) {
				this.game.particles.addExplosion(this.targetPos.x + Math.random() * 200 - 100, this.targetPos.y + Math.random() * 100 - 50, 0, this.game.T.explosion)
				this.explosions--
				this.delay = 15 + Math.random() * 10
			}
		}
	}
}
class GrenadeLauncher extends Firegun {
	constructor(game: Game) {
		super(game, game.T.grenade_launcher, game.T.cart_grenade_launcher, game.S.grenade_shoot, 7)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell) {
		this.game.particles.addGrenade(x, y, z, angle, position, targets, this.game.T.grenade, this.game.T.explosion)
		this.game.setEffectArea(cell, Area.CIRCLE2, '#0094c5')
	}
}
class IllicitGrenadeLauncher extends Firegun {
	constructor(game: Game) {
		super(game, game.T.illicit_grenade_launcher, game.T.cart_illicit_grenade_launcher, game.S.grenade_shoot, 18)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell) {
		this.game.particles.addGrenade(x, y, z, angle, position, targets, this.game.T.red_grenade, this.game.T.red_explosion)
		this.game.setEffectArea(cell, Area.CIRCLE2, 'red')
	}
}
class Katana extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.katana, 14)
	}
}
class Laser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.laser, game.T.laser_bullet, game.T.cart_laser, game.S.laser, 6, 8, 2, "#02e009")
	}
}
class MLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.m_laser, game.T.m_laser_bullet, game.T.cart_m_laser, game.S.laser, 12, 8, 5, "#d80205")
	}
}
class RevokedMLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.revoked_m_laser, game.T.revoked_m_laser_bullet, game.T.cart_revoked_m_laser, game.S.laser, 21, 8, 5, "#c500e6")
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, targetPos: Position, targets: Entity[], caster: Entity, cell: Cell) {
		super.shoot(leekX, leekY, handPos, angle, orientation, targetPos, targets, caster, cell)
		this.game.S.poison.play()
	}
}
class JLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.j_laser, game.T.j_laser_bullet, game.T.cart_j_laser, game.S.laser, 17, 6, 6, "#f7c604")
	}
}
class MachineGun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.machine_gun, game.T.cart_machine_gun, game.S.machine_gun, 2)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell) {
		this.game.particles.addBullet(x, y, z, angle, targets)
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 25, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 25, [])
	}
}
class Magnum extends Firegun {
	constructor(game: Game) {
		super(game, game.T.magnum, game.T.cart_magnum, game.S.double_gun, 5)
	}
}
class Pistol extends Firegun {
	constructor(game: Game) {
		super(game, game.T.pistol, game.T.cart_pistol, game.S.double_gun, 1)
	}
}
class Shotgun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.shotgun, game.T.cart_shotgun, game.S.shotgun, 4)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, position: Position, targets: Entity[], caster: Entity, cell: Cell) {
		// Real bullet
		this.game.particles.addBullet(x, y, z, angle, targets)
		// Others
		for (let i = 0; i < 4; i++) {
			this.game.particles.addBullet(x, y, z, angle + Math.random() * Math.PI / 4 - Math.PI / 8, [])
		}
	}
}

export { WeaponAnimation, WhiteWeaponAnimation, Axe, BLaser, Broadsword, Destroyer, DoubleGun, Electrisor, FlameThrower, Gazor, GrenadeLauncher, IllicitGrenadeLauncher, JLaser, Katana, Laser, MachineGun, Magnum, MLaser, MysteriousElectrisor, Pistol, RevokedMLaser, Shotgun, UnbridledGazor }
