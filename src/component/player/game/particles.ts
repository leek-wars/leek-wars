import { Position } from '@/component/player/game/position'
import { Entity } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { Blood, Bullet, Cartridge, CollideFire, CollideGaz, Explosion, Fire, Garbage, Gaz, Grenade, ImageParticle, Laser, Lightning, Meteorite, NUM_BLOOD_SPRITES, Particle, Rectangle, Shot, SimpleFire, SpikeParticle } from '@/component/player/game/particle'
import { Texture } from '@/component/player/game/texture'
import { Cell } from './cell'

class Particles {
	public game: Game
	public particles: Particle[] = []
	public groundParticles: Particle[] = []

	constructor(game: Game) {
		this.game = game
	}

	public addBullet(x: number, y: number, z: number, angle: number, targets: Entity[]) {
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
				this.game.actionDone()
				return
			}
		}
		this.add(bullet)
	}

	public addLaser(x: number, y: number, z: number, angle: number, width: number, texture: Texture, targets: Entity[] | null) {
		this.add(new Laser(this.game, texture, x, y, z, width, angle))
		// Collision
		if (targets != null) {
			for (const target of targets) {
				target.hurt(target.ox, target.oy, z, Math.cos(angle) * 10, Math.sin(angle) * 10, 0)
			}
			this.game.actionDone()
		}
	}

	public addLightning(x: number, y: number, z: number, angle: number, position: Position, texture: Texture) {
		this.add(new Lightning(this.game, texture, x, y, z, angle, position))
	}
	public addFire(x: number, y: number, z: number, angle: number, thrown: boolean = false) {
		this.add(new Fire(this.game, x, y, z, angle, thrown))
	}
	public addCollideFire(x: number, y: number, z: number, angle: number, targets: Entity[]) {
		this.add(new CollideFire(this.game, x, y, z, angle, targets))
	}
	public addFireSimple(x: number, y: number, z: number, angle: number) {
		this.add(new SimpleFire(this.game, x, y, z, angle))
	}
	public addGaz(x: number, y: number, z: number, angle: number, thrown: boolean = false) {
		this.add(new Gaz(this.game, x, y, z, angle, thrown))
	}
	public addCollideGaz(x: number, y: number, z: number, angle: number, targets: Entity[]) {
		this.add(new CollideGaz(this.game, x, y, z, targets, angle))
	}
	public addMeteorite(x: number, y: number, z: number, angle: number, size: number, targets: Entity[] | undefined, actionDoneAfterDie: boolean) {
		this.add(new Meteorite(this.game, x, y, z, size, angle, targets, actionDoneAfterDie))
	}
	public addGrenade(x: number, y: number, z: number, angle: number, pos: Position, targets: Entity[]) {
		this.add(new Grenade(this.game, x, y, z, angle, pos, targets))
	}
	public addShot(x: number, y: number, z: number, angle: number) {
		this.add(new Shot(this.game, x, y, z, angle))
	}
	public addExplosion(x: number, y: number, z: number) {
		this.add(new Explosion(this.game, x, y, z))
		this.game.S.explosion.play()
	}
	public addCartridge(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		this.add(new Cartridge(this.game, x, y, z, dx, dy, dz, texture))
	}
	public addGarbage(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture, orientation: number, rotation: number, scale: number = 1) {
		this.add(new Garbage(this.game, x, y, z, dx, dy, dz, texture, orientation, rotation, scale))
	}
	public addImage(x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, texture: Texture, life: number, alpha: number = 1, onground: boolean = false) {
		this.add(new ImageParticle(this.game, x, y, z, dx, dy, dz, angle, texture, life, alpha), onground)
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
