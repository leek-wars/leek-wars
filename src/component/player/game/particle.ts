import { Entity } from '@/component/player/game/entity'
import { Game } from '@/component/player/game/game'
import { Position } from '@/component/player/game/position'
import { Texture } from "@/component/player/game/texture"

const NUM_SHOTS_SPRITES = 4
const NUM_BLOOD_SPRITES = 4

const BULLET_SPEED = 25
const FIRE_SPEED_MIN = 3
const FIRE_SPEED_MAX = 5
const GAZ_SPEED_MIN = 4
const GAZ_SPEED_MAX = 7

const BULLET_LIFE = 300
const FIRE_LIFE = 100
const SHOT_LIFE = 10
const GAZ_LIFE = 100
const CARTRIDGE_LIFE = 200
const LASER_LIFE = 25
const BLOOD_LIFE = 12
const LIGHTNING_LIFE = 10
const GRENADE_LIFE = 10000
const EXPLOSION_LIFE = 15
const GARBAGE_LIFE = 50

abstract class Particle {
	public game: Game
	public x: any
	public y: any
	public z: any
	public life: number
	public dx: number = 0
	public dy: number = 0
	public dz: number = 0
	public angle: number = 0
	public rotation: number = 0

	constructor(game: Game, x: number, y: number, z: number, life: number) {
		this.game = game
		this.x = x
		this.y = y
		this.z = z
		this.life = life
	}
	public update(dt: number): boolean {
		this.x += this.dx * dt
		this.y += this.dy * dt
		this.z += this.dz * dt
		this.angle += this.rotation
		// Life
		this.life -= dt
		if (this.life <= 0) {
			this.onDie()
			return true
		}
		// Sortie de terrain
		if (!(this instanceof Laser) && !(this instanceof Meteorite)) {
			if (this.x < -this.game.ground.startX - 50 || this.y < -this.game.ground.startY - 50 || this.x > this.game.ground.startX + this.game.ground.width + 50 || this.y > this.game.ground.startY + this.game.ground.height + 50) {
				this.onDie()
				return true
			}
		}
		return false
	}
	public onDie() {
		// nothing to do
	}
	public abstract draw(ctx: CanvasRenderingContext2D): void
}

abstract class CollideParticle extends Particle {
	public targets: Entity[]
	constructor(game: Game, x: number, y: number, z: number, life: number, targets: Entity[]) {
		super(game, x, y, z, life)
		this.targets = targets
	}
	public update(dt: number): boolean {
		for (let t = 0; t < this.targets.length; ++t) {
			const target = this.targets[t]
			if (!target) { continue }
			if (target.collide(this.x, this.y, this.z)) {
				target.hurt(this.x, this.y, this.z, this.dx, this.dy, this.dz)
				if (this instanceof Bullet) {
					this.game.actionDone()
				}
				this.targets.splice(t, 1)
				t--
			}
		}
		if (this.targets.length === 0) {
			return true
		}
		return super.update(dt)
	}
	public onDie() {
		this.game.actionDone()
	}
}

abstract class FallingParticle extends Particle {
	public update(dt: number): boolean {
		this.dz -= 0.3 * dt
		if (this.z <= 0) {
			this.z -= this.dz
			this.dz = -this.dz * 0.4
			if (this.dz < 1) {
				this.onDie()
				return true
			}
			this.dx *= 0.5
			this.dy *= 0.5
		}
		return super.update(dt)
	}
}

class Bullet extends CollideParticle {
	constructor(game: Game, x: number, y: number, z: number, angle: number, targets: Entity[]) {
		super(game, x, y, z, BULLET_LIFE, targets)
		this.dx = Math.cos(angle) * BULLET_SPEED
		this.dy = Math.sin(angle) * BULLET_SPEED
		this.angle = angle
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.game.T.bullet.texture, -this.game.T.bullet.texture.width / 2 , -this.game.T.bullet.texture.height / 2)
	}
}
class Laser extends Particle {
	public width = 0
	public texture: HTMLImageElement
	constructor(game: Game, texture: Texture, x: number, y: number, z: number, width: number, angle: number) {
		super(game, x, y, z, LASER_LIFE)
		this.texture = texture.texture
		this.angle = angle
		this.width = width
	}
	public draw(ctx: CanvasRenderingContext2D) {
		const height = this.life * this.texture.height / 10
		ctx.globalAlpha = this.life / 15
		ctx.drawImage(this.texture, -this.width / 2, -height / 2, this.width, height)
		ctx.globalAlpha = 1
	}
}
class Lightning extends Particle {
	public vertices: number[]
	public texture: HTMLImageElement
	constructor(game: Game, texture: Texture, x: number, y: number, z: number, angle: number, position: Position) {
		super(game, x, y, z, LIGHTNING_LIFE)
		this.texture = texture.texture
		angle += (Math.random() * 0.3 - 0.15)
		// Création de l'éclair
		const dx = Math.cos(angle)
		const dy = Math.sin(angle)
		const vertices: number[] = []
		const longX = x - position.x
		const longY = y - position.y
		const long = Math.sqrt(longX * longX + longY * longY)
		const points = Math.round(long / 50)
		const fragLength = long / points
		// Création des points
		for (let i = 0; i <= points; i++) {
			let px = x + dx * i * fragLength
			let py = y + dy * i * fragLength
			const deformation = (points / 2 - Math.abs(points / 2 - i)) * 30
			px += Math.random() * deformation - deformation / 2
			py += Math.random() * deformation - deformation / 2
			vertices.push(px, py - z)
		}
		this.vertices = vertices
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.translate(-this.x, -this.y + this.z)
		ctx.globalAlpha = this.life / 4
		for (let j = 0; j < this.vertices.length - 2; j += 2) {
			const x1 = this.vertices[j]
			const y1 = this.vertices[j + 1]
			const x2 = this.vertices[j + 2]
			const y2 = this.vertices[j + 3]
			const dx = x2 - x1
			const dy = y2 - y1
			const angle = Math.atan2(dy, dx)
			const width = Math.sqrt(dx * dx + dy * dy) + 2
			ctx.save()
			ctx.translate(x1, y1)
			ctx.rotate(angle)
			ctx.drawImage(this.texture, 0, -this.texture.height / 2, width, this.texture.height)
			ctx.restore()
		}
		ctx.globalAlpha = 1
	}
}
class Fire extends Particle {
	constructor(game: Game, x: number, y: number, z: number, angle: number, thrown: boolean) {
		super(game, x, y, z, FIRE_LIFE)
		angle += (Math.random() * (Math.PI / 10)) - Math.PI / 20
		let speed = FIRE_SPEED_MIN + Math.random() * (FIRE_SPEED_MAX - FIRE_SPEED_MIN)
		if (!thrown) { speed /= 4 }
		this.dx = Math.cos(angle) * speed
		this.dy = Math.sin(angle) * speed
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 100
		const size = 70 - this.life / 2.5
		const textureId = 10 - Math.round(this.life / 10)
		ctx.drawImage(this.game.T.fire.texture, textureId * 20, 0, 20, 20, -size / 2, -size / 2, size, size)
		ctx.globalAlpha = 1
	}
}
class SimpleFire extends Particle {
	constructor(game: Game, x: number, y: number, z: number, angle: number) {
		super(game, x, y, z, FIRE_LIFE)
		this.dx = Math.cos(angle)
		this.dy = Math.sin(angle)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 100
		const size = 70 - this.life / 2.5
		const textureId = 10 - Math.round(this.life / 10)
		ctx.drawImage(this.game.T.fire.texture, textureId * 20, 0, 20, 20, -size / 2, -size / 2, size, size)
		ctx.globalAlpha = 1
	}
}
class Gaz extends Particle {
	public texture: Texture
	public textureID: number
	constructor(game: Game, x: number, y: number, z: number, angle: number, thrown: boolean, texture: Texture) {
		super(game, x, y, z, GAZ_LIFE)
		this.textureID = Math.floor(Math.random() * 5)
		angle += (Math.random() * (Math.PI / 10)) - Math.PI / 20
		let speed = GAZ_SPEED_MIN + Math.random() * (GAZ_SPEED_MAX - GAZ_SPEED_MIN)
		if (!thrown) { speed /= 3 }
		this.dx = Math.cos(angle) * speed
		this.dy = Math.sin(angle) * speed
		this.texture = texture
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 100
		const size = 70 - this.life / 2.5
		ctx.drawImage(this.texture.texture, this.textureID * 20, 0, 20, 20, -size / 2, -size / 2, size, size)
		ctx.globalAlpha = 1
	}
}
class Meteorite extends Particle {
	public size: number
	public originalAngle: number
	public targets: Entity[]
	public actionDoneAfterDie: boolean
	constructor(game: Game, x: number, y: number, z: number, size: number, angle: number, targets: Entity[] = [], actionDoneAfterDie: boolean = false) {
		super(game, x, y, z, 1000)
		this.size = size
		this.dx = Math.cos(angle) * 8
		this.dz = -Math.sin(angle) * 8
		this.originalAngle = angle
		this.angle = Math.random() * Math.PI * 2
		this.life = 1000
		this.rotation = 0
		this.targets = targets
		this.actionDoneAfterDie = actionDoneAfterDie
	}
	public update(dt: number): boolean {
		// Fire
		if (Math.random() > 0.3) {
			const x = this.x + Math.random() * 60 - 30
			const y = this.y + Math.random() * 60 - 30
			this.game.particles.addFireSimple(x, y, this.z, (this.originalAngle) * (0.2 + Math.random() * 0.2))
		}
		if (this.z < 20) {
			this.game.particles.addExplosion(this.x, this.y, this.z, this.game.T.explosion)
			for (const target of this.targets) {
				target.hurt(this.x, this.y, this.z, this.dx, this.dy, this.dz)
			}
			if (this.actionDoneAfterDie) {
				this.game.actionDone()
			}
			return true
		}
		return super.update(dt)
	}
	public onDie() {
		this.game.actionDone()
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.game.T.meteorite.texture, 0, 0, 60, 54, -30 * this.size , -27 * this.size, 60 * this.size, 54 * this.size)
	}
}
class Grenade extends FallingParticle {
	public targets: Entity[]
	public texture: Texture
	public explosion: Texture
	constructor(game: Game, x: number, y: number, z: number, angle: number, pos: Position, targets: Entity[], texture: Texture, explosion: Texture) {
		super(game, x, y, z, GRENADE_LIFE)
		const dist = Math.sqrt((x - pos.x) * (x - pos.x) + (y - pos.y) * (y - pos.y))
		this.dx = Math.cos(angle) * dist * 0.033
		this.dy = Math.sin(angle) * dist * 0.033
		this.angle = angle
		this.rotation = (Math.random() - 0.5) / 2
		this.targets = targets
		this.texture = texture
		this.explosion = explosion
	}
	public onDie() {
		this.game.particles.addExplosion(this.x, this.y, this.z, this.explosion)
		for (const target of this.targets) {
			target.hurt(this.x, this.y, this.z, this.dx, this.dy, this.dz)
		}
		this.game.actionDone()
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.texture.texture, -this.game.T.grenade.texture.width / 2 , -this.game.T.grenade.texture.height / 2)
	}
}
class Shot extends Particle {
	public textureID: number
	constructor(game: Game, x: number, y: number, z: number, angle: number) {
		super(game, x, y, z, SHOT_LIFE)
		this.angle = angle
		this.textureID = Math.floor(Math.random() * NUM_SHOTS_SPRITES)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 10
		ctx.drawImage(this.game.T.shots.texture, this.textureID * 50, 0, 50, 50, -25, -25, 50, 50)
		ctx.globalAlpha = 1
	}
}
class Explosion extends Particle {
	public texture: Texture
	constructor(game: Game, x: number, y: number, z: number, texture: Texture) {
		super(game, x, y, z, EXPLOSION_LIFE)
		this.texture = texture
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 5
		const size = 300 - 15 * this.life
		ctx.drawImage(this.texture.texture, 0, 0, this.texture.texture.width, this.texture.texture.height, -size / 2, -size / 3.6, size, size / 1.8)
		ctx.globalAlpha = 1
	}
}
class Cartridge extends FallingParticle {
	public texture: HTMLImageElement
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		super(game, x, y, z, CARTRIDGE_LIFE)
		this.texture = texture.texture
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.angle = Math.random() * Math.PI * 2
		this.rotation = Math.random() * 0.1 - 0.05
	}
	public onDie() {
		this.game.ground.drawTexture(this.texture, this.x, this.y - this.z, this.angle)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.texture, -this.texture.width / 2 , -this.texture.height / 2)
	}
}
class Garbage extends FallingParticle {
	public orientation: number
	public scale: number
	public texture: HTMLImageElement
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture, orientation: number, rotation: number, scale: number | undefined) {
		super(game, x, y, z, GARBAGE_LIFE)
		this.texture = texture.texture
		this.orientation = orientation
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.scale = scale || 1
		this.rotation = rotation
	}
	public update(dt: number): boolean {
		// Stalactite ou iceberg
		if (this.texture === this.game.T.iceberg.texture || this.texture === this.game.T.stalactite.texture) {
			if (this.z < this.texture.height / 2.8) {
				// Débrits de glace
				this.game.particles.addGarbage(this.x + 5, this.y + 7, this.z - 10, 0.2, 1.5, 0, this.game.T.ice_part, 1, 0.02)
				this.game.particles.addGarbage(this.x + 3, this.y + 4, this.z + 10, -1.3, 0.4, 0, this.game.T.ice_part2, 1, -0.05)
				this.game.particles.addGarbage(this.x - 3, this.y + 3, this.z + 20, 0.5, -1.4, 0, this.game.T.ice_part, 1, 0.05)
				this.game.particles.addGarbage(this.x - 2, this.y - 8, this.z - 20, -0.7, 1.1, 0, this.game.T.ice_part2, 1, -0.02)
				return true
			}
		}
		return super.update(dt)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 5
		ctx.scale(this.orientation, 1)
		ctx.drawImage(this.texture, 0, 0, this.texture.width, this.texture.height, -this.texture.width * this.scale / 2, -this.texture.height * this.scale / 2, this.texture.width * this.scale, this.texture.height * this.scale)
		ctx.globalAlpha = 1
	}
}
class ImageParticle extends Particle {
	public totalLife: any
	public alpha: number
	public texture: HTMLImageElement
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, texture: Texture, life: number, alpha: number) {
		super(game, x, y, z, life)
		this.texture = texture.texture
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.angle = angle
		this.rotation = 0
		this.totalLife = life
		this.alpha = alpha || 1
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.alpha * Math.min(1, (this.life / 20) * ((this.totalLife - this.life) / 30))
		ctx.drawImage(this.texture, -this.texture.width / 2 , -this.texture.height / 2)
		ctx.globalAlpha = 1
	}
}
class SpikeParticle extends Particle {
	public totalLife: any
	public flip: boolean
	public ix: number
	public iy: number
	public texture: HTMLImageElement
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, texture: Texture, life: number, flip: boolean) {
		super(game, x, y, z, life)
		this.texture = texture.texture
		this.ix = x
		this.iy = y
		this.dx = dx
		this.dy = dy
		this.dz = 0
		this.angle = 0
		this.rotation = 0
		this.totalLife = life
		this.flip = flip
	}
	public update(dt: number): boolean {
		const r = 1 - Math.max(0, (this.life - 5) / this.totalLife)
		const x = r < 0.66 ? Math.sqrt(r) : 1 - (r - 0.66) * 4.5
		this.x = this.ix - this.dx * x
		this.y = this.iy - this.dy * x
		// Life
		this.life -= dt
		if (this.life <= 0) {
			this.onDie()
			return true
		}
		return false
	}
	public draw(ctx: CanvasRenderingContext2D) {
		if (this.flip) {
			ctx.save()
			ctx.scale(-1, 1)
		}
		ctx.drawImage(this.texture, -this.texture.width / 2 , -this.texture.height / 2)
		if (this.flip) {
			ctx.restore()
		}
	}
}
class Rectangle extends Particle {
	public totalLife: number
	public sx: number
	public sy: number
	public dsx: number
	public dsy: number
	public color: string
	public alpha: number
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, sx: number, sy: number, dsx: number, dsy: number, color: string, alpha: number, life: number) {
		super(game, x, y, z, life)
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.angle = angle
		this.totalLife = life
		this.sx = sx
		this.sy = sy
		this.dsx = dsx
		this.dsy = dsy
		this.color = color
		this.alpha = alpha
	}
	public update(dt: number): boolean {
		this.sx += this.dsx * dt
		this.sy += this.dsy * dt
		return super.update(dt)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.alpha
		ctx.beginPath()
		ctx.rect(0, 0, this.sx, this.sy)
		ctx.fillStyle = this.color
		ctx.fill()
		ctx.globalAlpha = 1
	}
}
class Blood extends Particle {
	public textureID: number
	public texture: HTMLImageElement
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		super(game, x, y, z, BLOOD_LIFE)
		this.texture = texture.texture
		this.textureID = Math.floor(Math.random() * NUM_BLOOD_SPRITES)
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.angle = Math.random() * Math.PI * 2
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 4
		ctx.drawImage(this.texture, this.textureID * 50, 0, 50, 50, -25, -25, 50, 50)
		ctx.globalAlpha = 1
	}
}
class SpinningParticle extends Particle {
	angle2: number = 0
	rotation2: number = 0
	texture: Texture
	constructor(game: Game, x: number, y: number, angle: number, texture: Texture) {
		super(game, x, y, 0, 80)
		this.dz = 0.75
		this.angle2 = angle
		this.rotation2 = 0.16
		this.texture = texture
	}
	public update(dt: number) {
		this.angle2 += this.rotation2 * dt
		return super.update(dt)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.save()
		const behind = Math.max(0, Math.abs((this.angle2 % (2 * Math.PI)) - 3 * Math.PI / 2) / (Math.PI / 3) - 0.3)
		ctx.globalAlpha = Math.min(1, this.life / 10) * behind
		const x = Math.cos(this.angle2) * 20
		const y = Math.sin(this.angle2) * 20
		ctx.translate(x, y / 2)
		ctx.rotate(this.angle2 + 0.4)
		ctx.drawImage(this.texture.texture, -10, -20, 20, 40)
		ctx.restore()
		ctx.globalAlpha = 1
	}
}

export { Particle, Bullet, Laser, Lightning, Fire, SimpleFire, Gaz, Meteorite, Grenade, Shot, Explosion, Cartridge, Garbage, ImageParticle, Rectangle, Blood, SpikeParticle, SpinningParticle, NUM_BLOOD_SPRITES }
