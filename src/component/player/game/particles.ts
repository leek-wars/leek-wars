import { FightEntity } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { Blood, Boulder, Bubble, Bullet, BuryParticle, Cartridge, CriticalParticle, Explosion, Fire, FlyingSpinningProjectile, Garbage, Gaz, Grenade, ImageParticle, Laser, LighningBall, Lightning, LineParticle, Meteorite, NUM_BLOOD_SPRITES, Orbital, Particle, Plasma, PrismParticle, RealisticExplosion, Rectangle, Rocket, Shot, SimpleFire, SmallExplosion, SpikeParticle, SpinningParticle } from '@/component/player/game/particle'
import { Path } from './path'
import { Position } from '@/component/player/game/position'
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { S } from './sound'

class Particles {
	public game: Game
	public particles: Particle[] = []
	public groundParticles: Particle[] = []

	constructor(game: Game) {
		this.game = game
	}

	public addBullet(x: number, y: number, z: number, angle: number, targets: FightEntity[]): void {
		const bullet = new Bullet(this.game, x, y, z, angle, targets)
		// Vérification traversée
		if (targets.length > 0) {
			const leek = targets[0]
			const dx = leek.ox - x
			const dy = leek.oy - y
			const dist = Math.sqrt(dx * dx + dy * dy)
			const dx2 = leek.ox - (x + bullet.dx)
			const dy2 = leek.oy - (y + bullet.dy)
			const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
			if (dist2 > dist) { // la balle recule
				leek.hurt(leek.ox, leek.oy, z, bullet.dx, bullet.dy, 0)
				return
			}
		}
		this.add(bullet)
	}

	public addBubble(x: number, y: number, z: number, angle: number) {
		const bullet = new Bubble(this.game, x, y, z, angle)
		this.add(bullet)
	}

	public addLaser(x: number, y: number, z: number, angle: number, width: number, texture: Texture, targets: FightEntity[] | null) {
		this.add(new Laser(this.game, texture, x, y, z, width, angle))
		// Collision
		if (targets != null) {
			for (const target of targets) {
				target.hurt(target.ox, target.oy, z, Math.cos(angle) * 10, Math.sin(angle) * 10, 0)
			}
			this.game.actionDone()
		}
	}

	public addLightning(x: number, y: number, z: number, angle: number, position: Position, texture: Texture, threshold: number = 50) {
		this.add(new Lightning(this.game, texture, x, y, z, angle, position, threshold))
	}
	public addFire(x: number, y: number, z: number, angle: number, thrown: boolean = false) {
		this.add(new Fire(this.game, x, y, z, angle, thrown))
	}
	public addFireSimple(x: number, y: number, z: number, angle: number) {
		this.add(new SimpleFire(this.game, x, y, z, angle))
	}
	public addGaz(x: number, y: number, z: number, angle: number, texture: Texture, thrown: boolean = false) {
		this.add(new Gaz(this.game, x, y, z, angle, thrown, texture))
	}
	public addMeteorite(x: number, y: number, z: number, angle: number, size: number, targets: FightEntity[] | undefined, actionDoneAfterDie: boolean) {
		this.add(new Meteorite(this.game, x, y, z, size, angle, targets, actionDoneAfterDie))
	}
	public addGrenade(x: number, y: number, z: number, angle: number, pos: Position, targets: FightEntity[], texture: Texture, cell: Cell) {
		this.add(new Grenade(this.game, x, y, z, angle, pos, targets, texture, cell))
	}
	public addShot(x: number, y: number, z: number, angle: number) {
		this.add(new Shot(this.game, x, y, z, angle))
	}
	public addExplosion(x: number, y: number, z: number, texture: Texture, life: number = Explosion.EXPLOSION_LIFE) {
		this.add(new Explosion(this.game, x, y, z, texture, life))
		S.explosion.play(this.game)
	}
	public addRealisticExplosion(x: number, y: number, radius: number, colorFn?: (t: number) => string, debris: boolean = true) {
		// Explosion (fonction de couleur optionnelle, sinon dégradé de feu)
		this.add(new RealisticExplosion(this.game, x, y, radius, colorFn))
		// Sound
		S.explosion.play(this.game)
		// Mark
		this.game.ground.drawTextureScale(T.explosion_mark.texture, x, y, 0, 0.5, 0.5, 0.5)
		// Debrits
		if (debris) {
			const count = (3 + Math.random() * 5) * radius
			for (let p = 0; p < count; ++p) {
				const scale = 0.15 + Math.random() * 0.35
				const dx = -4 + Math.random() * 8
				const dy = -2 + Math.random() * 4
				const dz = 1 + Math.random() * 6
				const texture = Math.random() > 0.5 ? T.explosion_rock : T.explosion_rock2
				this.addGarbage(x, y, 5, dx, dy, dz, texture, 1, Math.random() * 0.2, scale, Math.random() * Math.PI, 70)
			}
		}
	}
	public addSmallExplosion(x: number, y: number, radius: number) {
		this.add(new SmallExplosion(this.game, x, y, radius))
	}
	public addPlasma(x: number, y: number, z: number, texture: Texture, life: number) {
		this.add(new Plasma(this.game, x, y, z, texture, life))
	}
	public addCartridge(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		this.add(new Cartridge(this.game, x, y, z, dx, dy, dz, texture))
	}
	public addGarbage(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture, orientation: number, rotation: number, scale: number = 1, angle: number = 0, life: number = Particle.GARBAGE_LIFE) {
		this.add(new Garbage(this.game, x, y, z, dx, dy, dz, texture, orientation, rotation, scale, angle, life))
	}
	public addImage(x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, texture: Texture, life: number, alpha: number = 1, rotation: number = 0, onground: boolean = false, scale: number = 1, orientation: number = 1) {
		this.add(new ImageParticle(this.game, x, y, z, dx, dy, dz, angle, texture, life, alpha, rotation, scale, orientation), onground)
	}
	public addCritical(x: number, y: number, z: number) {
		this.add(new CriticalParticle(this.game, x, y, z))
	}
	public addSpike(x: number, y: number, z: number, dx: number, dy: number, texture: Texture, life: number, flip: boolean) {
		this.add(new SpikeParticle(this.game, x, y, z, dx, dy, texture, life, flip))
	}
	public addRectangle(x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, sx: number, sy: number, dsx: number, dsy: number, color: string, alpha: number, life: number) {
		this.add(new Rectangle(this.game, x, y, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life))
	}
	public addBlood(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		this.add(new Blood(this.game, x, y, z, dx, dy, dz, texture))
	}
	public addBloodOnGround(x: number, y: number, texture: Texture) {
		const angle = Math.random() * Math.PI * 2
		const textureId = Math.floor(Math.random() * NUM_BLOOD_SPRITES)
		this.game.ground.drawTextureCropScale(texture.texture, x, y, angle, textureId * 50, 0, 50, 50, 1, 0.5)
	}
	public addSpinningParticle(x: number, y: number, angle: number, texture: Texture) {
		this.particles.unshift(new SpinningParticle(this.game, x, y, angle, texture))
	}
	public addFlyingSpinningProjectile(startX: number, startY: number, z: number, endX: number, endY: number, duration: number, texture: Texture, size?: number, rotation?: number) {
		this.add(new FlyingSpinningProjectile(this.game, startX, startY, z, endX, endY, duration, texture, size, rotation))
	}
	public addBoulder(startX: number, startY: number, startZ: number, targetX: number, targetY: number, arcHeight: number, duration: number, texture: Texture, size?: number) {
		this.add(new Boulder(this.game, startX, startY, startZ, targetX, targetY, arcHeight, duration, texture, size))
	}
	// Éclate une sprite en fragments « parts de tarte » qui s'envolent, comme
	// l'animation de mort d'un poireau (cf. entity.explode). displaySize = taille
	// affichée de la sprite entière en pixels (les fragments sont scalés en conséquence).
	public addShatter(texture: Texture, x: number, y: number, z: number, displaySize: number, dx: number = 0, dy: number = 0) {
		const tex = texture.texture
		const w = tex.width
		const h = tex.height
		const s = Math.max(w, h)
		const scale = displaySize / s
		const cx = w * (0.3 + Math.random() * 0.4)
		const cy = h * (0.3 + Math.random() * 0.4)
		const startAngle = Math.random() * Math.PI
		const lines = 8 + Math.random() * 6 | 0
		for (let f = 0; f < lines; ++f) {
			const angle1 = startAngle + (f / lines) * Math.PI * 2
			const angle3 = startAngle + ((f + 1) / lines) * Math.PI * 2
			const angle2 = (angle1 + angle3) / 2
			const path = new Path(0, 0, w, h)
			path.moveTo(cx, cy)
			path.lineTo(cx + Math.cos(angle1) * s, cy + Math.sin(angle1) * s)
			path.lineTo(cx + Math.cos(angle3) * s, cy + Math.sin(angle3) * s)
			path.closePath()
			const canvas = document.createElement('canvas')
			canvas.width = path.x2 - path.x1
			canvas.height = path.y2 - path.y1
			const fragmentCtx = canvas.getContext('2d')!
			const fragment = new Texture('')
			fragment.texture = canvas
			fragmentCtx.translate(-path.x1, -path.y1)
			fragmentCtx.drawImage(tex, 0, 0)
			fragmentCtx.globalCompositeOperation = 'destination-in'
			fragmentCtx.fill(path)
			fragmentCtx.globalCompositeOperation = 'source-over'
			const f_x = x + (-w / 2 + (path.x1 + path.x2) / 2) * scale
			const f_z = z + (h / 2 - (path.y1 + path.y2) / 2) * scale
			const fdx = dx + Math.cos(angle2) * 2.5
			const fdz = dy + 1 + Math.random() * 2 // pop vers le haut
			const rotation = -0.06 + Math.random() * 0.12
			this.addGarbage(f_x, y, f_z, fdx, 0, fdz, fragment, 1, rotation, scale, 0, 70)
		}
	}
	public addRocket(x: number, y: number, z: number, angle: number, duration: number, targetCell: Cell, radius: number, texture?: Texture, explosionColorFn?: (t: number) => string, explosionDebris: boolean = true) {
		this.add(new Rocket(this.game, x, y, z, angle, duration, targetCell, radius, texture, explosionColorFn, explosionDebris))
	}
	public addLighningBall(x: number, y: number, z: number, angle: number, duration: number, radius: number, texture: Texture) {
		this.add(new LighningBall(this.game, x, y, z, angle, duration, radius, texture))
	}
	public addBuryParticle(x: number, y: number, texture: Texture, scale: number) {
		this.add(new BuryParticle(this.game, x, y, texture, scale))
	}
	public addLineParticle(x1: number, y1: number, x2: number, y2: number) {
		this.add(new LineParticle(this.game, x1, y1, x2, y2))
	}
	public addPrism(x: number, y: number, z: number, life: number) {
		this.add(new PrismParticle(this.game, x, y, z, life))
	}
	public addOrbital(x: number, y: number, z: number, angle: number, duration: number, radius: number, scale: number, speed: number) {
		this.add(new Orbital(this.game, x, y, z, angle, duration, radius, scale, speed))
	}

	public add(particle: Particle, onground: boolean = false) {
		if (onground) {
			this.groundParticles.push(particle)
		} else {
			this.particles.push(particle)
		}
	}

	public update(dt: number) {
		this._update(this.particles, dt)
		this._update(this.groundParticles, dt)
	}
	public _update(particles: Particle[], dt: number) {
		for (let i = 0; i < particles.length; i++) {
			const particle = particles[i]
			const finished = particle.update(dt)
			if (finished) {
				particles.splice(i, 1)
				i--
				continue
			}
		}
	}

	public drawGround(ctx: CanvasRenderingContext2D) {
		this.draw(ctx, this.groundParticles)
	}
	public drawAir(ctx: CanvasRenderingContext2D) {
		this.draw(ctx, this.particles)
	}
	public draw(ctx: CanvasRenderingContext2D, particles: Particle[]) {
		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)
		for (const particle of particles) {
			ctx.save()
			ctx.translate(particle.x, particle.y - particle.z)
			ctx.rotate(particle.angle)
			particle.draw(ctx)
			ctx.restore()
		}
		ctx.restore()
	}
}

export { Particles }
