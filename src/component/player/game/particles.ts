import { FightEntity } from '@/component/player/game/entity'
import { Game } from "@/component/player/game/game"
import { Blood, Bubble, Bullet, Cartridge, CriticalParticle, Explosion, Fire, Garbage, Gaz, Grenade, ImageParticle, Laser, LighningBall, Lightning, Meteorite, NUM_BLOOD_SPRITES, Particle, Plasma, RealisticExplosion, Rectangle, Rocket, Shot, SimpleFire, SpikeParticle, SpinningParticle } from '@/component/player/game/particle'
import { Position } from '@/component/player/game/position'
import { Texture } from '@/component/player/game/texture'
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
	public addRealisticExplosion(x: number, y: number, radius: number) {
		this.add(new RealisticExplosion(this.game, x, y, radius))
		S.explosion.play(this.game)
	}
	public addPlasma(x: number, y: number, z: number, texture: Texture, life: number) {
		this.add(new Plasma(this.game, x, y, z, texture, life))
	}
	public addCartridge(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture) {
		this.add(new Cartridge(this.game, x, y, z, dx, dy, dz, texture))
	}
	public addGarbage(x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: Texture, orientation: number, rotation: number, scale: number = 1) {
		this.add(new Garbage(this.game, x, y, z, dx, dy, dz, texture, orientation, rotation, scale))
	}
	public addImage(x: number, y: number, z: number, dx: number, dy: number, dz: number, angle: number, texture: Texture, life: number, alpha: number = 1, rotation: number = 0, onground: boolean = false) {
		this.add(new ImageParticle(this.game, x, y, z, dx, dy, dz, angle, texture, life, alpha, rotation), onground)
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
	public addRocket(x: number, y: number, z: number, angle: number, duration: number, targetCell: Cell, radius: number) {
		this.add(new Rocket(this.game, x, y, z, angle, duration, targetCell, radius))
	}
	public addLighningBall(x: number, y: number, z: number, angle: number, duration: number, radius: number, texture: Texture) {
		this.add(new LighningBall(this.game, x, y, z, angle, duration, radius, texture))
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
