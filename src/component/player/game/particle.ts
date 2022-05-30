import { FightEntity } from '@/component/player/game/entity'
import { Game } from '@/component/player/game/game'
import { Position } from '@/component/player/game/position'
import { T, Texture } from "@/component/player/game/texture"
import { Cell } from '@/model/cell'
import { S } from './sound'

const NUM_SHOTS_SPRITES = 4
const NUM_BLOOD_SPRITES = 4

const BULLET_SPEED = 25
const BUBBLE_SPEED = 2
const FIRE_SPEED_MIN = 1
const FIRE_SPEED_MAX = 4
const GAZ_SPEED_MIN = 1
const GAZ_SPEED_MAX = 5

const BULLET_LIFE = 100
const FIRE_LIFE = 70
const SHOT_LIFE = 15
const GAZ_LIFE = 100
const CARTRIDGE_LIFE = 200
const LASER_LIFE = 25
const BLOOD_LIFE = 12
const LIGHTNING_LIFE = 10
const GRENADE_LIFE = 10000

abstract class Particle {
	public static GARBAGE_LIFE = 50

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
			if (this.x < -150 || this.y < -150 || this.x > this.game.ground.width + 150 || this.y > this.game.ground.height + 150) {
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
	public targets: FightEntity[]
	constructor(game: Game, x: number, y: number, z: number, life: number, targets: FightEntity[]) {
		super(game, x, y, z, life)
		this.targets = [...targets] // copy
	}
	public update(dt: number): boolean {
		let hit = false
		for (let t = 0; t < this.targets.length; ++t) {
			const target = this.targets[t]
			if (!target) { continue }
			if (target.collide(this.x, this.y, this.z)) {
				target.hurt(this.x, this.y, this.z, this.dx, this.dy, this.dz)
				this.targets.splice(t, 1)
				t--
				hit = true
			}
		}
		if (hit && this.targets.length === 0) {
			return true
		}
		return super.update(dt)
	}
}

abstract class FallingParticle extends Particle {
	public update(dt: number): boolean {
		if (this.dz !== 0) {
			this.dz -= 0.3 * dt
			if (this.z <= 0) {
				this.z -= this.dz
				this.dz = -this.dz * 0.4
				if (this.dz < 1) {
					this.dz = 0
					this.dy = 0
					this.dx = 0
					this.rotation = 0
				}
				this.dx *= 0.5
				this.dy *= 0.5
			}
		}
		return super.update(dt)
	}
}

class Bullet extends CollideParticle {
	constructor(game: Game, x: number, y: number, z: number, angle: number, targets: FightEntity[]) {
		super(game, x, y, z, BULLET_LIFE, targets)
		this.dx = Math.cos(angle) * BULLET_SPEED
		this.dy = Math.sin(angle) * BULLET_SPEED
		this.angle = angle
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(T.bullet.texture, -T.bullet.texture.width / 2 , -T.bullet.texture.height / 2)
	}
}

class Bubble extends Particle {
	size = 10
	constructor(game: Game, x: number, y: number, z: number, angle: number) {
		super(game, x, y, z, BULLET_LIFE)
		const speed = BUBBLE_SPEED + Math.random()
		this.dx = Math.cos(angle + Math.random() * 0.05) * speed
		this.dy = Math.sin(angle + Math.random() * 0.05) * speed
		this.dz = 0
		this.angle = angle
		this.size = 10 + Math.random() * 10
	}
	public update(dt: number): boolean {
		this.dz += Math.random() * 0.1 * dt
		return super.update(dt)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(T.bubble.texture, -this.size / 2 , -this.size / 2, this.size, this.size)
	}
}

class Laser extends Particle {
	public width = 0
	public texture: HTMLImageElement | HTMLCanvasElement
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
	public texture: HTMLImageElement | HTMLCanvasElement
	constructor(game: Game, texture: Texture, x: number, y: number, z: number, angle: number, position: Position, threshold: number = 50) {
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
		const points = Math.round(long / threshold)
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
			// ctx.strokeStyle = 'white'
			// ctx.strokeRect(0, -this.texture.height / 2, width, this.texture.height)
			// ctx.fillStyle = 'green'
			// ctx.beginPath();
			// ctx.arc(0, 0, 2, 0, 2 * Math.PI);
			// ctx.closePath();
			// ctx.fill();
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
		ctx.globalAlpha = this.life / 70
		const size = 60 - this.life / 2.2
		const textureId = 10 - Math.round(this.life / 7)
		ctx.drawImage(T.fire.texture, textureId * 20, 0, 20, 20, -size / 2, -size / 2, size, size)
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
		ctx.drawImage(T.fire.texture, textureId * 20, 0, 20, 20, -size / 2, -size / 2, size, size)
		ctx.globalAlpha = 1
	}
}
class Gaz extends Particle {
	public texture: Texture
	public textureID: number
	constructor(game: Game, x: number, y: number, z: number, angle: number, thrown: boolean, texture: Texture) {
		super(game, x, y, z, GAZ_LIFE)
		this.textureID = Math.floor(Math.random() * 5)
		angle += (Math.random() * (Math.PI / 6)) - Math.PI / 12
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
	public targets: FightEntity[]
	public actionDoneAfterDie: boolean

	constructor(game: Game, x: number, y: number, z: number, size: number, angle: number, targets: FightEntity[] = [], actionDoneAfterDie: boolean = false) {
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
			this.game.particles.addRealisticExplosion(this.x, this.y, 2)
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
		ctx.drawImage(T.meteorite.texture, 0, 0, 60, 54, -30 * this.size , -27 * this.size, 60 * this.size, 54 * this.size)
	}
}
class Grenade extends FallingParticle {
	public targets: FightEntity[]
	public texture: Texture
	targetCell: Cell

	constructor(game: Game, x: number, y: number, z: number, angle: number, pos: Position, targets: FightEntity[], texture: Texture, targetCell: Cell) {
		super(game, x, y, z, GRENADE_LIFE)
		const dist = Math.sqrt((x - pos.x) * (x - pos.x) + (y - pos.y) * (y - pos.y))
		this.dx = Math.cos(angle) * dist * 0.033
		this.dy = Math.sin(angle) * dist * 0.033
		this.angle = angle
		this.rotation = (Math.random() - 0.5) / 2
		this.targets = targets
		this.texture = texture
		this.targetCell = targetCell
	}
	public onDie() {
		let xy = this.game.ground.field.cellToXY(this.targetCell)
		xy = this.game.ground.xyToXYPixels(xy.x, xy.y)
		this.game.particles.addRealisticExplosion(xy.x, xy.y, 2)
		for (const target of this.targets) {
			target.hurt(this.x, this.y, this.z, this.dx, this.dy, this.dz)
		}
	}
	public draw(ctx: CanvasRenderingContext2D): void {
		ctx.drawImage(this.texture.texture, -this.texture.texture.width / 2 , -this.texture.texture.height / 2)
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
		ctx.drawImage(T.shots.texture, this.textureID * 50, 0, 50, 50, -25, -25, 50, 50)
		ctx.globalAlpha = 1
	}
}
class Explosion extends Particle {
	static EXPLOSION_LIFE = 15
	public texture: Texture
	constructor(game: Game, x: number, y: number, z: number, texture: Texture, life = Explosion.EXPLOSION_LIFE) {
		super(game, x, y, z, life)
		this.texture = texture
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 5
		const size = 300 - 15 * this.life
		ctx.drawImage(this.texture.texture, 0, 0, this.texture.texture.width, this.texture.texture.height, -size / 2, -size / 3.6, size, size / 1.8)
		ctx.globalAlpha = 1
	}
}

class RealisticExplosion extends Particle {
	static LIFE = 65
	static POINT_LIFE = 50
	public sources = [] as {
		s: number, p: number, x: number, y: number, dx: number, dy: number,
		points: {x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, s: number, life: number}[]
	}[]
	public delay = 0
	public radius: number

	constructor(game: Game, x: number, y: number, radius: number) {
		super(game, x, y, 0, RealisticExplosion.LIFE)

		this.radius = radius
		const SOURCE_SPEED = radius / 2.5
		const rad = radius * this.game.ground.realTileSizeY / 5
		const RADIUS_RAND = radius * this.game.ground.realTileSizeY / 8
		const size = radius * 2

		this.sources.push({ s: size, p: 8, x: - (rad + Math.random() * RADIUS_RAND), y: - (rad + Math.random() * RADIUS_RAND) / 2 , dx: -SOURCE_SPEED, dy: -SOURCE_SPEED, points: [] })
		this.sources.push({ s: size, p: 8, x: + (rad + Math.random() * RADIUS_RAND), y: - (rad + Math.random() * RADIUS_RAND) / 2 , dx: SOURCE_SPEED, dy: -SOURCE_SPEED, points: [] })
		this.sources.push({ s: size * 1.6, p: 8, x: 0, y: 0, dx: 0, dy: 0, points: [] })
		this.sources.push({ s: size, p: 8, x: + (rad + Math.random() * RADIUS_RAND), y: + (rad + Math.random() * RADIUS_RAND) / 2 , dx: SOURCE_SPEED, dy: SOURCE_SPEED, points: [] })
		this.sources.push({ s: size, p: 8, x: - (rad + Math.random() * RADIUS_RAND), y: + (rad + Math.random() * RADIUS_RAND) / 2 , dx: -SOURCE_SPEED, dy: SOURCE_SPEED, points: [] })

		const P = 5
		for (const source of this.sources) {
			for (let i = 0; i < Math.PI * 2; i += Math.PI * 2 / P) {
				this.add_point(source, i)
			}
		}
	}

	public add_point(source: any, angle: number): void {
		const dx = Math.cos(angle)
		const dy = Math.sin(angle)
		const speed = this.radius + Math.random() * (this.radius / 1.3)
		source.points.push({
			x: source.x,
			y: source.y,
			z: 0,
			dx: (source.dx + dx) * speed,
			dy: (source.dy + dy) * speed / 2,
			dz: Math.random() * speed / 10,
			angle,
			s: source.s + Math.random() * 5,
			life: RealisticExplosion.POINT_LIFE
		})
	}

	public update(dt: number): boolean {

		this.delay -= dt
		if (this.life > RealisticExplosion.POINT_LIFE && this.delay <= 0) {
			this.delay = 2
			for (const source of this.sources) {
				for (let i = 0; i < source.p; ++i) {
					this.add_point(source, Math.random() * Math.PI * 2)
				}
			}
		}

		for (const source of this.sources) {
			for (const point of source.points) {
				point.x += point.dx * dt
				point.y += point.dy * dt
				point.z += point.dz * dt
				point.dx += (point.dx * 0.88 - point.dx) * dt
				point.dy += (point.dy * 0.88 - point.dy) * dt
				point.dz += dt * 0.02
				point.life -= dt
				point.s += dt * 0.05
			}
		}
		return super.update(dt)
	}

	public draw(ctx: CanvasRenderingContext2D): void {

		for (const source of this.sources) {
			for (const point of source.points) {
				ctx.globalAlpha = Math.max(0, point.life / (RealisticExplosion.POINT_LIFE / 3))
				const dir = (RealisticExplosion.POINT_LIFE / 4)
				const blue = (point.life - 3 * RealisticExplosion.POINT_LIFE / 4) / dir
				const green = (point.life - 2 * RealisticExplosion.POINT_LIFE / 4) / dir
				const red = (point.life - RealisticExplosion.POINT_LIFE / 4) / dir
				ctx.fillStyle = 'rgb(' + red * 255 + ', ' + green * 255 + ', ' + blue * 255 + ')'

				ctx.beginPath()
				ctx.arc(point.x, point.y - point.z, point.s, 0, 2 * Math.PI)
				ctx.closePath()
				ctx.fill()
			}
		}
		ctx.globalAlpha = 1
	}
}

class SmallExplosion extends Particle {
	static LIFE = 65
	static POINT_LIFE = 50
	public sources = [] as {
		s: number, p: number, x: number, y: number, dx: number, dy: number,
		points: {x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, s: number, life: number}[]
	}[]
	public delay = 0
	public radius: number

	constructor(game: Game, x: number, y: number, radius: number) {
		super(game, x, y, 0, RealisticExplosion.LIFE)

		this.radius = radius
		const SOURCE_SPEED = radius / 2.5
		const rad = radius * this.game.ground.realTileSizeY / 5
		const RADIUS_RAND = radius * this.game.ground.realTileSizeY / 8
		const size = radius * 2

		// this.sources.push({ s: size, p: 8, x: - (rad + Math.random() * RADIUS_RAND), y: - (rad + Math.random() * RADIUS_RAND) / 2 , dx: -SOURCE_SPEED, dy: -SOURCE_SPEED, points: [] })
		// this.sources.push({ s: size, p: 8, x: + (rad + Math.random() * RADIUS_RAND), y: - (rad + Math.random() * RADIUS_RAND) / 2 , dx: SOURCE_SPEED, dy: -SOURCE_SPEED, points: [] })
		this.sources.push({ s: size * 1.6, p: 8, x: 0, y: 0, dx: 0, dy: 0, points: [] })
		// this.sources.push({ s: size, p: 8, x: + (rad + Math.random() * RADIUS_RAND), y: + (rad + Math.random() * RADIUS_RAND) / 2 , dx: SOURCE_SPEED, dy: SOURCE_SPEED, points: [] })
		// this.sources.push({ s: size, p: 8, x: - (rad + Math.random() * RADIUS_RAND), y: + (rad + Math.random() * RADIUS_RAND) / 2 , dx: -SOURCE_SPEED, dy: SOURCE_SPEED, points: [] })

		const P = 5
		for (const source of this.sources) {
			for (let i = 0; i < Math.PI * 2; i += Math.PI * 2 / P) {
				this.add_point(source, i)
			}
		}
	}

	public add_point(source: any, angle: number): void {
		const dx = Math.cos(angle)
		const dy = Math.sin(angle)
		const speed = this.radius + Math.random() * (this.radius / 1.3)
		source.points.push({
			x: source.x,
			y: source.y,
			z: 0,
			dx: (source.dx + dx) * speed,
			dy: (source.dy + dy) * speed / 2,
			dz: Math.random() * speed / 10,
			angle,
			s: source.s + Math.random() * 5,
			life: RealisticExplosion.POINT_LIFE
		})
	}

	public update(dt: number): boolean {

		this.delay -= dt
		if (this.life > RealisticExplosion.POINT_LIFE && this.delay <= 0) {
			this.delay = 2
			for (const source of this.sources) {
				for (let i = 0; i < source.p; ++i) {
					this.add_point(source, Math.random() * Math.PI * 2)
				}
			}
		}

		for (const source of this.sources) {
			for (const point of source.points) {
				point.x += point.dx * dt
				point.y += point.dy * dt
				point.z += point.dz * dt
				point.dx += (point.dx * 0.88 - point.dx) * dt
				point.dy += (point.dy * 0.88 - point.dy) * dt
				point.dz += dt * 0.02
				point.life -= dt
				point.s += dt * 0.05
			}
		}
		return super.update(dt)
	}

	public draw(ctx: CanvasRenderingContext2D): void {

		for (const source of this.sources) {
			for (const point of source.points) {
				ctx.globalAlpha = Math.max(0, point.life / (RealisticExplosion.POINT_LIFE / 3))
				const dir = (RealisticExplosion.POINT_LIFE / 4)
				const blue = (point.life - 3 * RealisticExplosion.POINT_LIFE / 4) / dir
				const green = (point.life - 2 * RealisticExplosion.POINT_LIFE / 4) / dir
				const red = (point.life - RealisticExplosion.POINT_LIFE / 4) / dir
				ctx.fillStyle = 'rgb(' + red * 255 + ', ' + green * 255 + ', ' + blue * 255 + ')'

				ctx.beginPath()
				ctx.arc(point.x, point.y - point.z, point.s, 0, 2 * Math.PI)
				ctx.closePath()
				ctx.fill()
			}
		}
		ctx.globalAlpha = 1
	}
}

class Plasma extends Particle {
	public texture: Texture
	constructor(game: Game, x: number, y: number, z: number, texture: Texture, life: number) {
		super(game, x, y, z, life)
		this.texture = texture

	}
	public draw(ctx: CanvasRenderingContext2D) {
		const x = 1 - this.life / 120
		const r = Math.pow(Math.cos((Math.PI * (x - 0.5))), 0.2)
		const size = 80 * r
		ctx.globalAlpha = r
		ctx.drawImage(this.texture.texture, 0, 0, this.texture.texture.width, this.texture.texture.height, -size / 2, -size / 2, size, size)
		ctx.globalAlpha = 1
	}
}
class Cartridge extends FallingParticle {
	public texture: HTMLImageElement | HTMLCanvasElement
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
	public texture: HTMLImageElement | HTMLCanvasElement

	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture, orientation: number, rotation: number, scale: number, angle: number, life: number) {
		super(game, x, y, z, life)
		this.texture = texture.texture
		this.orientation = orientation
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.scale = scale
		this.rotation = rotation
		this.angle = angle
	}

	public onDie() {
		// this.game.ground.drawTextureScale(this.texture, this.x, this.y - this.z, this.angle, this.scale, this.scale)
	}

	public update(dt: number): boolean {
		// Stalactite ou iceberg
		if (this.texture === T.iceberg.texture || this.texture === T.stalactite.texture) {
			if (this.z < this.texture.height / 2.8) {
				// Débrits de glace
				this.game.particles.addGarbage(this.x + 5, this.y + 7, this.z - 10, 0.2, 1.5, 0, T.ice_part, 1, 0.02)
				this.game.particles.addGarbage(this.x + 3, this.y + 4, this.z + 10, -1.3, 0.4, 0, T.ice_part2, 1, -0.05)
				this.game.particles.addGarbage(this.x - 3, this.y + 3, this.z + 20, 0.5, -1.4, 0, T.ice_part, 1, 0.05)
				this.game.particles.addGarbage(this.x - 2, this.y - 8, this.z - 20, -0.7, 1.1, 0, T.ice_part2, 1, -0.02)
				return true
			}
		}
		return super.update(dt)
	}

	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.life / 5
		ctx.scale(this.orientation, 1)
		// ctx.rotate(this.angle)
		ctx.drawImage(this.texture, 0, 0, this.texture.width, this.texture.height, -this.texture.width * this.scale / 2, -this.texture.height * this.scale / 2, this.texture.width * this.scale, this.texture.height * this.scale)
		ctx.globalAlpha = 1
	}
}

class ImageParticle extends Particle {
	public totalLife: any
	public alpha: number
	public texture: HTMLImageElement | HTMLCanvasElement
	public scale: number
	public orientation: number
	constructor(game: Game, x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, texture: Texture, life: number, alpha: number, rotation: number, scale: number, orientation: number) {
		super(game, x, y, z, life)
		this.texture = texture.texture
		this.dx = dx
		this.dy = dy
		this.dz = dz
		this.angle = angle
		this.rotation = rotation
		this.totalLife = life
		this.alpha = alpha
		this.scale = scale
		this.orientation = orientation
	}
	public draw(ctx: CanvasRenderingContext2D) {
		ctx.globalAlpha = this.alpha * Math.min(1, (this.life / 20) * ((this.totalLife - this.life) / 30))
		ctx.scale(this.orientation, 1)
		ctx.drawImage(this.texture, -this.texture.width * this.scale / 2 , -this.texture.height * this.scale / 2, this.texture.width * this.scale, this.texture.height * this.scale)
		ctx.globalAlpha = 1
	}
}
class CriticalParticle extends Particle {
	static LIFE = 40
	constructor(game: Game, x: number, y: number, z: number) {
		super(game, x, y, z, CriticalParticle.LIFE)
	}
	public draw(ctx: CanvasRenderingContext2D) {
		const x = this.life / CriticalParticle.LIFE
		const size = (1 - 2000 * Math.pow(Math.abs(x - 0.5), 12)) * 50
		ctx.drawImage(T.critical.texture, -size / 2, -size / 2, size, size)
	}
}
class SpikeParticle extends Particle {
	public totalLife: any
	public flip: boolean
	public ix: number
	public iy: number
	public texture: HTMLImageElement | HTMLCanvasElement
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
	public texture: HTMLImageElement | HTMLCanvasElement
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

class Rocket extends Particle {
	static SPEED = 8
	static SCALE = 0.5
	fire_x: number
	fire_y: number
	initial_angle: number
	targetCell: Cell
	radius: number

	public constructor(game: Game, x: number, y: number, z: number, angle: number, duration: number, targetCell: Cell, radius: number) {
		super(game, x, y, z, duration)
		this.dx = Math.cos(angle) * Rocket.SPEED
		this.dy = Math.sin(angle) * Rocket.SPEED
		this.angle = this.initial_angle = angle
		this.fire_x = -Math.cos(angle) * 45
		this.fire_y = -Math.sin(angle) * 45
		this.targetCell = targetCell
		this.radius = radius
	}

	public update(dt: number): boolean {
		this.angle = this.initial_angle + Math.cos(this.life * 0.2) / 10
		this.dx = Math.cos(this.angle + Math.cos(this.life * 0.2) / 6) * Rocket.SPEED
		this.dy = Math.sin(this.angle + Math.sin(this.life * 0.2) / 6) * Rocket.SPEED

		// Add fire
		for (let i = 0; i < 2; ++i) {
			this.game.particles.addFire(this.x + this.fire_x, this.y + this.fire_y, this.z, this.angle, true)
		}

		if (super.update(dt)) {
			let xy = this.game.ground.field.cellToXY(this.targetCell)
			xy = this.game.ground.xyToXYPixels(xy.x, xy.y)
			this.game.particles.addRealisticExplosion(xy.x, xy.y, this.radius)
			return true
		}
		return false
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		ctx.drawImage(T.rocket.texture, -T.rocket.texture.width / 2 * Rocket.SCALE, -T.rocket.texture.height / 2 * Rocket.SCALE, T.rocket.texture.width * Rocket.SCALE, T.rocket.texture.height * Rocket.SCALE)
	}
}

class LighningBall extends Particle {
	static SPEED = 4
	static SCALE = 0.9
	radius: number
	texture: Texture

	public constructor(game: Game, x: number, y: number, z: number, angle: number, duration: number, radius: number, texture: Texture) {
		super(game, x, y, z, duration)
		this.dx = Math.cos(angle) * LighningBall.SPEED
		this.dy = Math.sin(angle) * LighningBall.SPEED
		this.angle = angle
		this.radius = radius
		this.texture = texture
	}

	public update(dt: number): boolean {

		const R = 3
		const L = this.radius
		for (let i = 0; i < 3; ++i) {
			const angle = Math.random() * Math.PI * 2
			const dx = Math.cos(angle)
			const dy = Math.sin(angle)
			const l = L + Math.random() * 10
			const position = {x: this.x + dx * l, y: this.y + dy * l}
			this.game.particles.addLightning(this.x + dx * R, this.y + dy * R, this.z, angle, position, this.texture, 20)
		}

		if (super.update(dt)) {
			if (this.texture === T.blue_lightning || this.texture === T.red_lightning) {
				S.lightninger_impact.play(this.game)
			}
			return true
		}
		return false
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public draw(ctx: CanvasRenderingContext2D): void {
		// nothing to draw
	}
}

class BuryParticle extends Particle {
	static LIFE = 25
	texture: Texture
	scale: number
	public constructor(game: Game, x: number, y: number, texture: Texture, scale: number) {
		super(game, x, y, 0, BuryParticle.LIFE)
		this.texture = texture
		this.scale = scale
		// console.log("texture", game, x, y, texture, texture.texture.width, texture.texture.height)
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		const w = this.texture.texture.width
		const h = (this.life / BuryParticle.LIFE) * this.texture.texture.height
		// console.log("draw", this.x, this.y, w, h)
		ctx.drawImage(this.texture.texture, 0, 0, w, h, - w / 2 * this.scale, - h * this.scale, w * this.scale, h * this.scale)
	}
}

class LineParticle extends Particle {
	static LIFE = 15
	path: Path2D

	public constructor(game: Game, x1: number, y1: number, x2: number, y2: number) {
		super(game, x1, y1, 0, LineParticle.LIFE)
		this.path = new Path2D()
		this.path.moveTo(0, 0)
		this.path.lineTo(x2 - x1, y2 - y1)
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		ctx.globalAlpha = this.life / 10
		ctx.strokeStyle = '#fff'
		ctx.lineWidth = 4 * (this.life / 10)
		ctx.lineCap = 'round'
		ctx.stroke(this.path)
	}
}

export { Particle, Bubble, Bullet, BuryParticle, CriticalParticle, Laser, Lightning, Fire, SimpleFire, Gaz, Meteorite, Grenade, Shot, Explosion, Cartridge, Garbage, ImageParticle, LighningBall, LineParticle, Plasma, Rectangle, Blood, RealisticExplosion, Rocket, SmallExplosion, SpikeParticle, SpinningParticle, NUM_BLOOD_SPRITES }
