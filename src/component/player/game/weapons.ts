import { Cell } from '@/component/player/game/cell'
import { Entity, EntityDirection } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { Sound } from '@/component/player/game/sound'
import { Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'

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
	constructor(game: Game, texture: Texture, cx: number, cz: number, ocx: number, x: number, z: number, mx1: number, mz1: number, mx2: number, mz2: number) {
		this.game = game
		this.texture = texture
		this.cx = cx
		this.cz = cz
		this.ocx = ocx
		this.x = x
		this.z = z
		this.mx1 = mx1
		this.mz1 = mz1
		this.mx2 = mx2
		this.mz2 = mz2
	}
	public abstract shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]): void
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
	constructor(game: Game, texture: Texture, cx: number, cz: number, ocx: number, x: number, z: number, mx1: number, mz1: number, mx2: number, mz2: number) {
		super(game, texture, cx, cz, ocx, x, z, mx1, mz1, mx2, mz2)
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]) {
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

	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, cx: number, cz: number, ocx: number, x: number, z: number, mx1: number, mz1: number, mx2: number, mz2: number, sx: number, sz: number, cartX: number, cartZ: number, cartAngle: number, recoilForce: number) {
		super(game, texture, cx, cz, ocx, x, z, mx1, mz1, mx2, mz2)
		this.cartTexture = cartTexture
		this.sound = sound
		this.sx = sx
		this.sz = sz
		this.cartX = cartX
		this.cartZ = cartZ
		this.cartAngle = cartAngle
		this.recoilForce = recoilForce
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]) {
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
		this.throwBullet(X, Y, z, realAngle, cell, targets)
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
	public abstract throwBullet(X: number, Y: number, z: number, angle: number, cell: Cell, targets: Entity[]): void
}

class Firegun extends RangeWeapon {
	constructor(game: Game, texture: Texture, cartTexture: Texture | null, sound: Sound, cx: number, cz: number, ocx: number, x: number, z: number, mx1: number, mz1: number, mx2: number, mz2: number, sx: number, sz: number, cartX: number, cartZ: number, cartAngle: number, recoilForce: number) {
		super(game, texture, cartTexture, sound, cx, cz, ocx, x, z, mx1, mz1, mx2, mz2, sx, sz, cartX, cartZ, cartAngle, recoilForce)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
		this.game.particles.addShot(x, y, z, angle)
		this.game.particles.addBullet(x, y, z, angle, targets)
	}
}

class LaserWeapon extends RangeWeapon {
	public laserTexture: Texture
	constructor(game: Game, texture: Texture, laserTexture: Texture, cartTexture: Texture, sound: Sound, cx: number, cz: number, ocx: number, x: number, z: number, mx1: number, mz1: number, mx2: number, mz2: number, sx: number, sz: number, cartX: number, cartZ: number, cartAngle: number, recoilForce: number) {
		super(game, texture, cartTexture, sound, cx, cz, ocx, x, z, mx1, mz1, mx2, mz2, sx, sz, cartX, cartZ, cartAngle, recoilForce)
		this.laserTexture = laserTexture
	}
	public throwBullet(X: number, Y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
		const width = 1600
		this.game.particles.addLaser(X, Y, z, angle, width, this.laserTexture, targets)
	}
}

class Axe extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.axe, 5, 40, 25, 40, -40, 32, 32, 55, 32)
	}
}
class BLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.b_laser, game.T.b_laser_bullet, game.T.cart_b_laser, game.S.laser, 15, 38, 0, -70, -20, 33, 33, 80, 33, 960, 25, 60, 20, Math.PI / 2, 18)
	}
}
class Broadsword extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.broadsword, 5, 40, 15, 15, -15, 14, 14, 30, 14)
	}
}
class Destroyer extends Firegun {
	constructor(game: Game) {
		super(game, game.T.destroyer, game.T.cart_destroyer, game.S.double_gun, 15, 38, 0, -50, -15, 47, 39, 88, 42, 182, 14, 60, 20, Math.PI / 2, 18)
	}
}
class DoubleGun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.double_gun, game.T.cart_double_gun, game.S.double_gun, 15, 35, 0, -10, -15, 11, 30, 32, 31, 160, 14, 60, 20, Math.PI / 2, 18)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
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
	public lightningCell!: Cell
	public sx: number = 90
	public sz: number = -10
	constructor(game: Game) {
		super(game, game.T.electrisor, 5, 52, 0, -30, 0, 42, 31, 72, 34)
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.lightningX = leekX + (this.cx + x * cos) * orientation
		this.lightningY = leekY + x * sin
		this.lightningZ = z
		this.lightningAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.lightningCell = cell
		this.shoots = 40
		this.game.setEffectArea(cell.x, cell.y, Area.CIRCLE1, 'red')
		this.game.S.electrisor.play()
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			this.currentDelay -= dt
			if (this.currentDelay <= 0) {
				this.currentDelay = this.delay
				this.game.particles.addLightning(this.lightningX, this.lightningY, this.lightningZ, this.lightningAngle, this.lightningCell, this.game.T.lightning)
				this.shoots--
				if (this.shoots === 0) {
					this.game.actionDone()
				}
			}
		}
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
	constructor(game: Game) {
		super(game, game.T.flame_thrower, 25, 60, 0, -60, -15, 31, 51, 80, 50)
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = 42
		this.game.particles.addCollideFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, targets)
		this.game.S.flame_thrower.play()
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			for (let i = 0; i < Math.round(3 * dt); i++) {
				this.game.particles.addFire(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, true)
			}
			this.shoots--
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
	constructor(game: Game) {
		super(game, game.T.gazor, 15, 60, 0, -43, -12, 28, 52, 74, 50)
	}
	public shoot(leekX: number, leekY: number, handPos: number, angle: number, orientation: number, cell: Cell, targets: Entity[]) {
		const cos = Math.cos(angle)
		const sin = Math.sin(angle)
		const x = this.x + this.sx
		const z = this.cz + this.z + this.sz + handPos
		this.bulletX = leekX + (this.cx + x * cos) * orientation
		this.bulletY = leekY + x * sin
		this.bulletZ = z
		this.bulletAngle = (angle + Math.PI / 2) * orientation - Math.PI / 2
		this.shoots = 50
		this.game.particles.addCollideGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, targets)
		this.game.setEffectArea(cell.x, cell.y, Area.CIRCLE3, 'red')
		this.game.S.gazor.play()
	}
	public update(dt: number) {
		if (this.shoots > 0) {
			for (let i = 0; i < Math.round(3 * dt); i++) {
				this.game.particles.addGaz(this.bulletX, this.bulletY, this.bulletZ, this.bulletAngle, true)
			}
			this.shoots--
			if (this.shoots <= 0) {
				this.game.actionDone()
			}
		}
	}
}
class GrenadeLauncher extends Firegun {
	constructor(game: Game) {
		super(game, game.T.grenade_launcher, game.T.cart_grenade_launcher, game.S.grenade_shoot, 0, 40, 0, -35, -15, 38, 28, 66, 29, 150, 14, 60, 20, Math.PI / 2, 18)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
		this.game.particles.addGrenade(x, y, z, angle, cell, targets)
		this.game.setEffectArea(cell.x, cell.y, Area.CIRCLE2, 'red')
	}
}
class Katana extends WhiteWeaponAnimation {
	constructor(game: Game) {
		super(game, game.T.katana, 5, 40, 10, 15, -15, 30, 12, 42, 12)
	}
}
class Laser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.laser, game.T.laser_bullet, game.T.cart_laser, game.S.laser, 15, 42, 0, -50, -15, 30, 34, 79, 39, 400, 15, 60, 20, Math.PI / 2, 18)
	}
}
class MLaser extends LaserWeapon {
	constructor(game: Game) {
		super(game, game.T.m_laser, game.T.m_laser_bullet, game.T.cart_m_laser, game.S.laser, 15, 38, 0, -70, -20, 69, 33, 114, 33, 960, 25, 60, 20, Math.PI / 2, 18)
	}
}
class MachineGun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.machine_gun, game.T.cart_machine_gun, game.S.machine_gun, 15, 45, 0, -35, -15, 20, 40, 63, 40, 160, 14, 60, 20, Math.PI / 2, 18)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
		this.game.particles.addBullet(x, y, z, angle, targets)
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 50, [])
		this.game.particles.addBullet(x, y, z, angle + Math.PI / 25, [])
		this.game.particles.addBullet(x, y, z, angle - Math.PI / 25, [])
	}
}
class Magnum extends Firegun {
	constructor(game: Game) {
		super(game, game.T.magnum, game.T.cart_magnum, game.S.double_gun, 12, 40, 0, 15, -15, 22, 32, 25, 23, 94, 22, 60, 20, Math.PI / 2, 18)
	}
}
class Pistol extends Firegun {
	constructor(game: Game) {
		super(game, game.T.pistol, game.T.cart_pistol, game.S.double_gun, 12, 40, 0, 15, -15, 10, 26, 19, 18, 90, 22, 60, 20, Math.PI / 2, 18)
	}
}
class Shotgun extends Firegun {
	constructor(game: Game) {
		super(game, game.T.shotgun, game.T.cart_shotgun, game.S.shotgun, 15, 45, 0, -35, -15, 17, 30, 63, 30, 160, 14, 60, 20, Math.PI / 2, 18)
	}
	public throwBullet(x: number, y: number, z: number, angle: number, cell: Cell, targets: Entity[]) {
		// Real bullet
		this.game.particles.addBullet(x, y, z, angle, targets)
		// Others
		for (let i = 0; i < 4; i++) {
			this.game.particles.addBullet(x, y, z, angle + Math.random() * Math.PI / 4 - Math.PI / 8, [])
		}
	}
}

export { WeaponAnimation, WhiteWeaponAnimation, Axe, BLaser, Broadsword, Destroyer, DoubleGun, Electrisor, FlameThrower, Gazor, GrenadeLauncher, Katana, Laser, MachineGun, Magnum, MLaser, Pistol, Shotgun }
