import { DamageType, FightEntity } from '@/component/player/game/entity'
import { Colors, Game } from "@/component/player/game/game"
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'
import { Cell } from '@/model/cell'
import { Position } from './position'
import { Effect, EffectTarget, State } from '@/model/effect'

abstract class ChipAnimation {
	public game: Game
	public done: boolean = false
	public willFinish: boolean = false
	public sound: Sound | null
	public cell!: Cell
	public targets: FightEntity[] | undefined
	public duration: number
	public launchPos!: Position
	public position!: Position
	public launcher!: FightEntity | undefined
	// Effects de la chip template, posé par game.ts avant launch().
	// Utilisé pour filtrer les visuels (createChipImage/Aureol) selon le
	// bitmask Effect.targets (#3127).
	public effects: Effect[] | undefined
	// Type de dégât
	public damageType: DamageType

	constructor(game: Game, sound: Sound | null, duration: number, damageType: DamageType) {
		this.game = game
		this.sound = sound
		this.duration = duration
		this.damageType = damageType
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		this.launchPos = launchPos
		this.cell = targetCell
		this.targets = targets
		this.position = position
		this.launcher = launcher
		if (this.sound) {
			this.sound.play(this.game)
		}
	}
	public update(dt: number) {
		this.duration -= dt
		if (this.duration <= 0) {
			this.done = true
			this.end()
		}
	}
	public end() {
		// nothing
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public draw(ctx: CanvasRenderingContext2D) {
		// nothing to draw
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public drawBack(ctx: CanvasRenderingContext2D) {
		// nothing to draw
	}
	public createChipAureol(targets: FightEntity[], texture: Texture) {
		for (const target of targets) {
			const x = target.ox
			const y = target.oy
			const z = target.height + 20
			this.game.particles.addImage(x, y, z, 0, 0, -0.6, 0, texture, 60)
		}
	}
	public createChipImage(targets: FightEntity[], texture: Texture) {
		for (const target of targets) {
			const x = target.ox
			const y = target.oy
			const z = target.height + 40
			this.game.particles.addImage(x, y, z, 0, 0, 0.2, 0, texture, 70)
		}
	}
	public createChipHaloEntity(target: FightEntity) {
		const dx = Math.random() * 100 - 50
		const x = target.ox + dx
		const y = target.oy + Math.random() * 30 - 15
		const z = Math.random() * 10
		const speed = 1.5 + (50 - Math.abs(dx)) / 50
		const life = 80 - Math.abs(dx)
		this.game.particles.addImage(x, y, z, 0, 0, speed, 0, T.halo, life)
	}
	public createChipHalo(targets: FightEntity[]) {
		for (const target of targets) {
			this.createChipHaloEntity(target)
		}
	}
	public createChipHealEntity(target: FightEntity) {
		const dx = Math.random() * 100 - 50
		const x = target.ox + dx
		const y = target.oy + Math.random() * 30 - 15
		const z = Math.random() * 10
		const speed = 1.5 + (50 - Math.abs(dx)) / 50
		const life = 80 - Math.abs(dx)
		this.game.particles.addImage(x, y, z, 0, 0, speed, 0, T.heal_cross, life)
	}
	public createChipHeal(targets: FightEntity[]) {
		for (const target of targets) {
			this.createChipHealEntity(target)
		}
	}
	public createChipNovaEntity(target: FightEntity) {
		const dx = Math.random() * 100 - 50
		const x = target.ox + dx
		const y = target.oy + Math.random() * 30 - 15
		const z = Math.random() * 10
		const speed = 1.5 + (50 - Math.abs(dx)) / 50
		const life = 80 - Math.abs(dx)
		this.game.particles.addImage(x, y, z, 0, 0, speed, 0, T.nova_particle, life)
	}
	public createChipNova(targets: FightEntity[]) {
		for (const target of targets) {
			this.createChipNovaEntity(target)
		}
	}
	// Filtre les cibles d'une AoE pour ne garder que celles qui reçoivent
	// effectivement au moins un effet de la puce (issue #3127). Fallback safe :
	// si effects absent, retourne tout (pas de régression visuelle).
	public recipientsOf(launcher: FightEntity | undefined, targets: FightEntity[]): FightEntity[] {
		return effectRecipients(this.effects, launcher, targets)
	}
}

// Variante autonome (sans instance d'animation) : filtre les cibles selon le masque
// effect.targets d'un set d'effets. Utilisée par le chemin de saut de game.ts pour
// répliquer le filtrage serveur (cf. #11548). Fallback safe : effects absent -> tout.
export function effectRecipients(effects: Effect[] | undefined, launcher: FightEntity | undefined, targets: FightEntity[]): FightEntity[] {
	if (!launcher || !effects || effects.length === 0) return targets
	return targets.filter(target => effects.some(e => recipientMatches(e, launcher, target)))
}

function recipientMatches(effect: Effect, launcher: FightEntity, target: FightEntity): boolean {
	const mask = effect.targets
	if (!mask) return true
	const isCaster = target.id === launcher.id
	const isAlly = !isCaster && target.team === launcher.team
	const isEnemy = !isCaster && target.team !== launcher.team
	const sideOk =
		(isCaster && (mask & EffectTarget.CASTER) !== 0) ||
		(isAlly   && (mask & EffectTarget.ALLIES) !== 0) ||
		(isEnemy  && (mask & EffectTarget.ENEMIES) !== 0)
	if (!sideOk) return false
	// Filtre summon/non-summon : appliqué seulement si l'un des deux bits
	// est posé ; sinon le side filter ci-dessus décide seul.
	const summonRestriction = (mask & (EffectTarget.SUMMONS | EffectTarget.NON_SUMMONS)) !== 0
	if (!summonRestriction) return true
	if (target.summon  && (mask & EffectTarget.SUMMONS) !== 0) return true
	if (!target.summon && (mask & EffectTarget.NON_SUMMONS) !== 0) return true
	return false
}

// Copies teintées de textures existantes (canvas créé une seule fois par couple
// texture/couleur) : terre brune des plantes, entaille rouge d'Hémorragie…
// Pas de nouveau PNG, pas d'allocation par frame.
const tintCache = new Map<Texture, Map<string, Texture>>()
function tintedTexture(source: Texture, color: string, alpha: number): Texture {
	// Sprite pas encore chargée : repli sur l'originale, sans mettre en cache.
	if (!source.texture.width) { return source }
	let byColor = tintCache.get(source)
	if (!byColor) { byColor = new Map(); tintCache.set(source, byColor) }
	const key = color + '/' + alpha
	let tinted = byColor.get(key)
	if (!tinted) {
		const canvas = document.createElement('canvas')
		canvas.width = source.texture.width
		canvas.height = source.texture.height
		const ctx = canvas.getContext('2d')!
		ctx.drawImage(source.texture, 0, 0)
		ctx.globalCompositeOperation = 'source-atop'
		ctx.globalAlpha = alpha
		ctx.fillStyle = color
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		tinted = new Texture('')
		tinted.texture = canvas
		byColor.set(key, tinted)
	}
	return tinted
}

// Halo rond en dégradé radial (bulle de poison, lueur), créé une seule fois
// par couple couleur/taille.
const glowTextures = new Map<string, Texture>()
function glowTexture(color: string, size: number): Texture {
	const key = color + '/' + size
	let glow = glowTextures.get(key)
	if (!glow) {
		const canvas = document.createElement('canvas')
		canvas.width = size
		canvas.height = size
		const ctx = canvas.getContext('2d')!
		const r = size / 2
		const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
		gradient.addColorStop(0, color)
		gradient.addColorStop(0.55, color + 'aa')
		gradient.addColorStop(1, color + '00')
		ctx.fillStyle = gradient
		ctx.fillRect(0, 0, size, size)
		glow = new Texture('')
		glow.texture = canvas
		glowTextures.set(key, glow)
	}
	return glow
}

// Petite pastille de couleur unie (goutte), créée une seule fois par couleur.
const dropTextures = new Map<string, Texture>()
function dropTexture(color: string): Texture {
	let drop = dropTextures.get(color)
	if (!drop) {
		const canvas = document.createElement('canvas')
		canvas.width = 6
		canvas.height = 6
		const ctx = canvas.getContext('2d')!
		ctx.fillStyle = color
		ctx.beginPath()
		ctx.arc(3, 3, 3, 0, Math.PI * 2)
		ctx.fill()
		drop = new Texture('')
		drop.texture = canvas
		dropTextures.set(color, drop)
	}
	return drop
}

// Couleur de goutte assortie au sang de l'entité (sève pâle des poireaux,
// variantes des mobs) pour que les gouttes se fondent avec les giclées du moteur.
function bloodColor(target: FightEntity): string {
	if (target.bloodTex === T.blood_orange) { return '#e8862a' }
	if (target.bloodTex === T.blood_purple) { return '#9b4dbb' }
	if (target.bloodTex === T.blood_white) { return '#e8e8e8' }
	return '#c9e6bc'
}

class Summon extends ChipAnimation {
	static textures = [T.summon_leaf, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.bulb, S.bury]

	public summon!: FightEntity
	public summoned: boolean = false
	// Plantes : la terre se soulève AVANT que la plante ne sorte (Pierre,
	// 08/09/2026 : « les cailloux un peu plus tôt »). Première motte à
	// duration 54 (16 frames après le lancer), la principale à l'apparition (40).
	static PLANT_HEAVE_TIME = 54
	public heaved: boolean = false

	constructor(game: Game) {
		super(game, null, 70, DamageType.DEFAULT)
	}

	private isPlant(): boolean {
		return (this.summon as { plant?: boolean } | undefined)?.plant === true
	}

	// Motte de terre : fragments de roche teintés brun projetés du sol, que des
	// cailloux, pas de feuilles.
	private throwClods(count: number, minDz: number, maxDz: number) {
		const pos = this.position
		for (let i = 0; i < count; ++i) {
			const angle = Math.random() * Math.PI * 2
			const dist = 0.3 + Math.random() * 1.6
			const texture = tintedTexture(Math.random() > 0.5 ? T.explosion_rock : T.explosion_rock2, '#6b4a2b', 0.65)
			this.game.particles.addGarbage(pos.x, pos.y, 4, Math.cos(angle) * dist, Math.sin(angle) * dist * 0.5, minDz + Math.random() * (maxDz - minDz), texture, 1, Math.random() * 0.2 - 0.1, 0.25 + Math.random() * 0.4, Math.random() * Math.PI, 60)
		}
	}

	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)

		// Une plante (Piment, Maïs, Prototaxite) sort de terre : rien que la
		// motte à l'apparition, aucune feuille (Pierre, 08/09/2026). Les feuilles
		// du lancer sont réservées aux bulbes.
		if (this.isPlant()) { return }

		const s = 2.0
		const life = 70
		const y = targetPos.y - 2
		this.game.particles.addImage(targetPos.x, y + 2, 0, -0.08 * s, -0.1 * s, 0, 0, T.summon_leaf, life, 1, -0.003, false, 0.6, 1)
		this.game.particles.addImage(targetPos.x, y + 2, 0, 0.08 * s, -0.1 * s, 0, 0, T.summon_leaf, life, 1, 0.003, false, 0.6, -1)
		this.game.particles.addImage(targetPos.x, y, 0, 0, -0.01 * s, 0, Math.PI / 6, T.summon_leaf, life, 1, -0.004, false, 0.7, 1)
		this.game.particles.addImage(targetPos.x - 5, y + 2, 0, -0.1 * s, 0.01 * s, 0, -Math.PI / 12, T.summon_leaf, life, 1, -0.003, false, 0.7, 1)
		this.game.particles.addImage(targetPos.x + 5, y + 2, 0, 0.1 * s, 0.01 * s, 0, Math.PI / 12, T.summon_leaf, life, 1, 0.003, false, 0.7, -1)
		this.game.particles.addImage(targetPos.x - 5, y + 5, 0, -0.05 * s, 0.01 * s, 0, -Math.PI / 12, T.summon_leaf, life, 1, -0.003, false, 0.5, 1)
		this.game.particles.addImage(targetPos.x + 5, y + 5, 0, 0.05 * s, 0.01 * s, 0, Math.PI / 12, T.summon_leaf, life, 1, 0.003, false, 0.5, -1)
	}

	public update(dt: number) {
		super.update(dt)

		const plant = this.isPlant()
		// Une plante se plante : la terre se soulève d'abord (bruit de terre, pas
		// le cri des bulbes), puis la plante jaillit dans la motte principale.
		if (plant && !this.heaved && this.duration < Summon.PLANT_HEAVE_TIME) {
			this.heaved = true
			S.bury.play(this.game)
			this.throwClods(7, 1.5, 2.5)
		}

		if (this.duration < 40 && !this.summoned) {

			if (plant) {
				this.throwClods(10, 2, 3.5)
			} else {
				S.bulb.play(this.game)
			}
			this.summon.active = true
			this.summon.blooming = true
			this.summon.deadAnim = 1
			const index = this.game.entityOrder.findIndex((e) => e.id === this.launcher!.id)
			this.game.entityOrder.splice(index + 1, 0, this.summon)

			this.summon.setCell(this.cell)
			this.summon.drawID = this.game.addDrawableElement(this.summon, this.summon.y)
			this.game.updateReachableCells()

			this.summoned = true
		}
	}
}

class ChipShieldAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.shield, 60, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.createChipAureol(recipients, T.shield_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, 'orange')
		}
	}
}

class ChipBoostAnimation extends ChipAnimation {
	public texture: Texture
	public delay: number = 2
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.buff, 60, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.targets = recipients
		this.createChipAureol(recipients, T.buff_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, 'blue')
		}
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			if (this.targets) {
				this.createChipHalo(this.targets)
			}
			this.delay = 2
		}
	}
}

class ChipHealAnimation extends ChipAnimation {
	public texture: Texture
	public delay: number = 2
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.heal, 45, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.targets = recipients
		this.createChipAureol(recipients, T.cure_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, 'green')
		}
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			if (this.targets) {
				this.createChipHeal(this.targets)
			}
			this.delay = 2
		}
	}
}

class ChipNovaVitalityAnimation extends ChipAnimation {
	public texture: Texture
	public delay: number = 2
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.alteration, 45, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.targets = recipients
		this.createChipAureol(recipients, T.nova_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, '#26ffba')
		}
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			if (this.targets) {
				this.createChipNova(this.targets)
			}
			this.delay = 2
		}
	}
}

class ChipDebuffAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.debuff, 60, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.createChipAureol(recipients, T.shackle_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, '#9f00ef')
		}
	}
}

class ChipPoisonAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.poison, 60, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Cell, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.createChipAureol(recipients, T.poison_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, '#ea5ef9')
		}
	}
}

class ChipDamageReturnAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: Texture, area: Area = Area.SINGLE_CELL) {
		super(game, S.buff, 60, DamageType.DEFAULT)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.createChipAureol(recipients, T.damage_return_aureol)
		this.createChipImage(recipients, this.texture)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, Colors.AGILITY_COLOR)
		}
	}
}

class Adrenaline extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_adrenaline]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_adrenaline) }
}
class Armor extends ChipShieldAnimation {
	static textures = [T.shield_aureol, T.chip_armor]
	static sounds = [S.shield]
	constructor(game: Game) { super(game, T.chip_armor) }
}
class Armoring extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_armoring]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_armoring) }
}
class Bandage extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_bandage]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_bandage) }
}
class Carapace extends ChipShieldAnimation {
	static textures = [T.shield_aureol, T.chip_carapace]
	static sounds = [S.shield]
	constructor(game: Game) { super(game, T.chip_carapace) }
}
class Cure extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_cure]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_cure) }
}

class DevilStrike extends ChipAnimation {
	static textures = [T.red_circle, T.daemon_shadow, T.m_laser_bullet]
	static sounds = [S.fire, S.rock]
	public delay = 0
	public x!: number
	public y!: number
	constructor(game: Game) {
		super(game, S.fire, 100, DamageType.EXPLOSION)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.x = targetPos.x
		this.y = targetPos.y
		this.game.setEffectArea(targetCell, Area.CIRCLE3, 'red', 180)
		this.game.particles.addImage(this.x, this.y, 0, 0, 0, 0, 0, T.red_circle, 120, 0.6, 0, true)
		this.game.particles.addImage(this.x, this.y, 50, 0, 0, 1.2, 0, T.daemon_shadow, 100, 0.9)
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 12
			const x = Math.random() * 250 - 125
			const y = Math.random() * 125 - 62.5
			this.game.particles.addLaser(this.x + x, this.y + y, 230, Math.PI / 2, 500, T.m_laser_bullet, null)
			S.rock.play(this.game)
		}
	}
}

class Doping extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_doping]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_doping, Area.CIRCLE2) }
}
class Drip extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_drip]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_drip, Area.CIRCLE2) }
}

class Flame extends ChipAnimation {
	static textures = [T.fire]
	static sounds = [S.fire]
	public delay = 2
	constructor(game: Game) { super(game, S.fire, 70, DamageType.FIRE) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		for (const target of targets) {
			target.burnAnim(100)
		}
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 12
			if (this.targets) {
				for (const target of this.targets) {
					const z = 20 + Math.random() * 30
					const dx = Math.random() * 8 - 4
					const dy = Math.random() * 8 - 4
					const x = Math.random() * 40 - 20
					const y = Math.random() * 40 - 20
					target.hurt(target.ox + x, target.oy + y, z, dx, dy, 0)
				}
			}
		}
	}
}

class Flash extends ChipAnimation {
	static textures = [T.grey_cloud, T.purple_lightning]
	static sounds = [S.lightning]
	public delay = 1
	constructor(game: Game) { super(game, S.lightning, 70, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addImage(targetPos.x - 50, targetPos.y, 220, 0.5, 0, 0, 0, T.grey_cloud, 80)
		this.game.particles.addImage(targetPos.x + 50, targetPos.y, 220, -0.5, 0, 0, 0, T.grey_cloud, 80)
		this.game.particles.addImage(targetPos.x + 10, targetPos.y, 230, 0.2, 0, 0, 0, T.grey_cloud, 80)
		this.game.particles.addImage(targetPos.x - 10, targetPos.y, 230, -0.2, 0, 0, 0, T.grey_cloud, 80)
		this.game.setEffectArea(targetCell, Area.CIRCLE1, 'red')
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 1
			const da = Math.random() * Math.PI / 20 - Math.PI / 40
			const dx = Math.random() * 60 - 30
			const dy = Math.random() * 4 - 2
			this.game.particles.addLightning(this.position.x + dx, this.position.y - 200 + dy, 0, Math.PI / 2 + da, this.position, T.purple_lightning)
			if (this.targets) {
				for (const target of this.targets) {
					target.electrify()
				}
			}
		}
	}
}
class Fortress extends ChipShieldAnimation {
	static sounds = [S.shield]
	static textures = [T.shield_aureol, T.chip_fortress]
	constructor(game: Game) { super(game, T.chip_fortress) }
}
class Helmet extends ChipShieldAnimation {
	static sounds = [S.shield]
	static textures = [T.shield_aureol, T.chip_helmet]
	constructor(game: Game) { super(game, T.chip_helmet) }
}
class Dome extends ChipShieldAnimation {
	static sounds = [S.shield]
	static textures = [T.shield_aureol, T.chip_dome]
	constructor(game: Game) { super(game, T.chip_dome, Area.CIRCLE3) }
}
// Protection divine (113) : bouclier sur TOUS les alliés (zone ALLIES), où
// qu'ils soient. La zone n'a pas de centre, donc pas de losange au sol (le
// CIRCLE3 orange d'avant mentait) ; à la place, l'auréole de bouclier et le
// glyphe de la puce au-dessus de chaque protégé.
export class DivineProtection extends ChipAnimation {
	static sounds = [S.shield]
	static textures = [T.shield_aureol, T.chip_divine_protection]
	constructor(game: Game) { super(game, S.shield, 60, DamageType.DEFAULT) }
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchCell, targetPos, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.createChipAureol(recipients, T.shield_aureol)
		this.createChipImage(recipients, T.chip_divine_protection)
	}
}

class Ice extends ChipAnimation {
	static textures = [T.ice_small]
	static sounds = [S.ice]
	constructor(game: Game) {
		super(game, S.ice, 30, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 100, 0, 0, 1.5, T.ice_small, 1, 0)
	}
}

class Iceberg extends ChipAnimation {
	static textures = [T.iceberg, T.ice_part, T.ice_part2]
	static sounds = [S.ice]
	constructor(game: Game) {
		super(game, S.ice, 40, DamageType.EXPLOSION)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 180, 0, 0, 3, T.iceberg, 1, 0)
		this.game.setEffectArea(targetCell, Area.CIRCLE2, 'white')
	}
}

class Inversion extends ChipAnimation {
	static textures = []
	static sounds = [S.teleportation]

	public inverted = false
	public target: FightEntity | null = null

	constructor(game: Game) {
		super(game, S.teleportation, 120, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.target = targets.length ? targets[0] : null
		this.launchPos = launchPos
	}
	public update(dt: number) {
		super.update(dt)
		if (Math.random() > 0.8 && this.duration > 40) {
			const xx = Math.random() * 60 - 30
			const x1 = this.launchPos.x + xx
			const y1 = this.launchPos.y
			const x2 = this.position.x + xx
			const y2 = this.position.y
			const z = 0
			const dz = 1.7
			const dx = 0
			const dy = 0
			const angle = 0
			const sx = 10
			const sy = 10
			const dsx = 0
			const dsy = 0.6
			const color = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)]
			const life = 50
			const alpha = 0.4
			this.game.particles.addRectangle(x1, y1, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
			this.game.particles.addRectangle(x2, y2, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
		}
		if (!this.inverted && this.duration < 40 && this.launcher && this.target && !this.target.states.has(State.STATIC)) {
			const cell = this.launcher.cell!
			this.launcher.setCell(this.target.cell!)
			this.target.setCell(cell)
			this.game.updateReachableCells()
			this.inverted = true
		}
	}
}

class Repotting extends ChipAnimation {
	static textures = []
	static sounds = [S.teleportation]

	public inverted = false
	public target: FightEntity | null = null

	constructor(game: Game) {
		super(game, S.teleportation, 120, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		// Le Rempotage ne peut échanger qu'avec un bulbe allié (effect targets=22).
		// On filtre comme le serveur (recipientsOf / #3127) pour ne pas jouer un
		// faux swap quand la cible n'est pas un bulbe allié (topic #11756).
		const recipients = this.recipientsOf(launcher, targets)
		this.target = recipients.length ? recipients[0] : null
		this.launchPos = launchPos
	}
	public update(dt: number) {
		super.update(dt)
		if (Math.random() > 0.8 && this.duration > 40) {
			const xx = Math.random() * 60 - 30
			const x1 = this.launchPos.x + xx
			const y1 = this.launchPos.y
			const x2 = this.position.x + xx
			const y2 = this.position.y
			const z = 0
			const dz = 1.7
			const dx = 0
			const dy = 0
			const angle = 0
			const sx = 10
			const sy = 10
			const dsx = 0
			const dsy = 0.6
			const color = ['#0a0', '#0f0', '#7f7'][Math.floor(Math.random() * 3)]
			const life = 50
			const alpha = 0.4
			this.game.particles.addRectangle(x1, y1, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
			this.game.particles.addRectangle(x2, y2, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
		}
		// !STATIC : le serveur (invertEntities) ne swappe pas une entité statique.
		if (!this.inverted && this.duration < 40 && this.launcher && this.target && !this.target.states.has(State.STATIC)) {
			const cell = this.launcher.cell!
			this.launcher.setCell(this.target.cell!)
			this.target.setCell(cell)
			this.game.updateReachableCells()
			this.inverted = true
		}
	}
}

class LeatherBoots extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_leather_boots]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_leather_boots) }
}
class Liberation extends ChipAnimation {
	static textures = [T.liberation_halo]
	static sounds = [S.liberation]
	public delay = 2
	constructor(game: Game) {
		super(game, S.liberation, 60, DamageType.DEFAULT)
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.targets) { return  }
		if (Math.random() > 0.5) {
			let angle = Math.random() * Math.PI * 2
			const dx = Math.cos(angle) * 2
			const dy = Math.sin(angle)
			angle = Math.atan2(dy, dx)
			const x = this.position.x + dx * 10
			const y = this.position.y + dy * 10
			const z = 50
			this.game.particles.addImage(x, y, z, dx, dy, 0, angle, T.liberation_halo, 60)
		}
	}
}

class Lightning extends ChipAnimation {
	static textures = [T.black_cloud, T.red_lightning]
	static sounds = [S.lightning]
	public delay = 1
	constructor(game: Game) {
		super(game, S.lightning, 80, DamageType.EXPLOSION)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		this.game.particles.addImage(this.position.x - 50, this.position.y, 230, 0.5, 0, 0, 0, T.black_cloud, 90)
		this.game.particles.addImage(this.position.x + 50, this.position.y, 230, -0.5, 0, 0, 0, T.black_cloud, 90)
		this.game.particles.addImage(this.position.x + 10, this.position.y, 240, 0.2, 0, 0, 0, T.black_cloud, 90)
		this.game.particles.addImage(this.position.x - 10, this.position.y, 240, -0.2, 0, 0, 0, T.black_cloud, 90)
		this.game.setEffectArea(targetCell, Area.CIRCLE2, 'red')
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 1
			const da = Math.random() * Math.PI / 20 - Math.PI / 40
			const dx = Math.random() * 80 - 40
			const dy = Math.random() * 4 - 2
			this.game.particles.addLightning(this.position.x + dx, this.position.y - 200 + dy, 0, Math.PI / 2 + da, this.position, T.red_lightning)
			if (this.targets) {
				for (const target of this.targets) {
					target.electrify()
				}
			}
		}
	}
}

class Meteorite extends ChipAnimation {
	static textures = [T.meteorite, T.fire, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.meteorite, S.explosion]

	public willFinish = false
	public count = 6
	public delay = 0
	public vx: number = 0
	constructor(game: Game) {
		super(game, S.meteorite, 100, DamageType.FIRE)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.vx = (500 + Math.random() * 300) * ((Math.random() > 0.5) ? 1 : -1)
		this.game.setEffectArea(targetCell, Area.CIRCLE2, '#f26304', 180)
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay < 0) {
			this.delay = 5 + Math.random() * 15
			this.count--
			if (this.count > 0) {
				const y = this.position.y
				const z = this.position.y + 200
				const x = this.position.x + this.vx
				const angle = Math.atan2(this.vx, z) + Math.PI / 2
				const ox = Math.random() * 120 - 60
				const oy = Math.random() * 120 - 60
				const size = 0.7 + Math.random() * 0.5
				this.game.particles.addMeteorite(x + ox, y + oy, z, angle, size, this.targets, this.count === 1)
			} else {
				this.willFinish = true
			}
		}
	}
}
class Motivation extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_motivation]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_motivation) }
}
class Pebble extends ChipAnimation {
	static textures = [T.forest_rock_small]
	static sounds = [S.rock]
	constructor(game: Game) { super(game, S.rock, 30, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 100, 0, 0, 2, T.forest_rock_small, 1, 0, 0.5)
	}
}
class Protein extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_protein]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_protein) }
}
class Rage extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_rage]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_rage, Area.CIRCLE3) }
}
class Rampart extends ChipShieldAnimation {
	static textures = [T.shield_aureol, T.chip_rampart]
	static sounds = [S.shield]
	constructor(game: Game) { super(game, T.chip_rampart) }
}
class Reflexes extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_reflexes]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_reflexes, Area.PLUS_3) }
}
class Regeneration extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_regeneration]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_regeneration) }
}
class Remission extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_remission]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_remission) }
}
class Therapy extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_therapy]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_therapy, Area.PLUS_2) }
}
class Serum extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_serum]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_serum, Area.SQUARE_1) }
}
class Elevation extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_elevation]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_elevation) }
}

class Rock extends ChipAnimation {
	static textures = [T.rock]
	static sounds = [S.rock]
	constructor(game: Game) { super(game, S.rock, 40, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 150, 0, 0, 2, T.rock, 1, 0)
	}
}

class Rockfall extends ChipAnimation {
	static textures = [T.rock]
	static sounds = [S.rockfall]
	public delay = 0
	constructor(game: Game) { super(game, S.rockfall, 70, DamageType.EXPLOSION) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.game.setEffectArea(targetCell, Area.CIRCLE2, '#c5c2c6', 100)
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 10
			const x = Math.random() * 100 - 50
			const y = Math.random() * 100 - 50
			const z = 120 + Math.random() * 100
			const dz = -1 - Math.random() * 3
			const scale = 0.3 + Math.random() * 0.5
			this.game.particles.addGarbage(this.position.x + x, this.position.y + y, z, 0, 0, dz, T.rock, 1, 0, scale)
		}
	}
}
class SevenLeagueBoots extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_seven_league_boots]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_seven_league_boots, Area.PLUS_2) }
}
class Shield extends ChipShieldAnimation {
	static textures = [T.shield_aureol, T.chip_shield]
	static sounds = [S.shield]
	constructor(game: Game) { super(game, T.chip_shield) }
}

class Shock extends ChipAnimation {
	static textures = [T.cloud, T.lightning]
	static sounds = [S.lightning]
	public delay = 2
	constructor(game: Game) { super(game, S.lightning, 60, DamageType.DEFAULT) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.game.particles.addImage(this.position.x - 50, this.position.y, 220, 0.5, 0, 0, 0, T.cloud, 70)
		this.game.particles.addImage(this.position.x + 50, this.position.y, 220, -0.5, 0, 0, 0, T.cloud, 70)
		this.game.particles.addImage(this.position.x + 10, this.position.y, 230, 0.2, 0, 0, 0, T.cloud, 70)
		this.game.particles.addImage(this.position.x - 10, this.position.y, 230, -0.2, 0, 0, 0, T.cloud, 70)
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 2
			const da = Math.random() * Math.PI / 20 - Math.PI / 40
			const dx = Math.random() * 60 - 30
			const dy = Math.random() * 4 - 2
			this.game.particles.addLightning(this.position.x + dx, this.position.y - 200 + dy, 0, Math.PI / 2 + da, this.position, T.lightning)
			if (this.targets) {
				for (const target of this.targets) {
					target.electrify()
				}
			}
		}
	}
}

class Spark extends ChipAnimation {
	static textures = [T.fire]
	static sounds = [S.fire]
	constructor(game: Game) { super(game, S.fire, 40, DamageType.FIRE) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		for (const target of targets) {
			target.burnAnim(50)
		}
	}
}

class Stalactite extends ChipAnimation {
	static textures = [T.stalactite, T.ice_part, T.ice_part2]
	static sounds = [S.ice]
	constructor(game: Game) { super(game, S.ice, 40, DamageType.SLICE) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 180, 0, 0, 3, T.stalactite, 1, 0)
	}
}
class Steroid extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_steroid]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_steroid) }
}
class Stretching extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_stretching]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_stretching) }
}

class Teleportation extends ChipAnimation {
	static textures = []
	static sounds = [S.teleportation]

	public teleported = false
	public targetPos!: Position
	public target!: FightEntity
	constructor(game: Game) {
		super(game, S.teleportation, 140, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.cell = targetCell
		this.target = targets[0]
		this.launchPos = launchPos
		this.targetPos = targetPos
	}
	public update(dt: number) {
		super.update(dt)
		if (Math.random() > 0.6) {
			const xx = Math.random() * 60 - 30
			const yy = Math.random() * 30 - 15
			const x1 = this.launchPos.x + xx
			const y1 = this.launchPos.y + yy
			const x2 = this.targetPos.x + xx
			const y2 = this.targetPos.y + yy
			const z = 0
			const dz = 1.7
			const dx = 0
			const dy = 0
			const angle = 0
			const sx = 10
			const sy = 10
			const dsx = 0
			const dsy = 0.5
			const color = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)]
			const life = 50
			const alpha = 0.4
			if (this.duration > 70) {
				this.game.particles.addRectangle(x1, y1, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
			}
			if (this.duration < 100) {
				this.game.particles.addRectangle(x2, y2, z, dx, dy, dz, angle, sx, sy, dsx, dsy, color, alpha, life)
			}
		}
		if (!this.teleported && this.duration < 50) {
			this.launcher!.setCell(this.cell)
			this.game.updateReachableCells()
			this.teleported = true
		}
	}
}
class Vaccine extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_vaccine]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_vaccine) }
}
class Wall extends ChipShieldAnimation {
	static textures = [T.shield_aureol, T.chip_wall]
	static sounds = [S.shield]
	constructor(game: Game) { super(game, T.chip_wall)	}
}
class WarmUp extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_warm_up]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_warm_up) }
}
class WingedBoots extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_winged_boots]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_winged_boots) }
}
class Whip extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_whip]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_whip) }
}
class Acceleration extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_acceleration]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_acceleration) }
}
class Loam extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_loam]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_loam) }
}
class Fertilizer extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_fertilizer]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_fertilizer) }
}
class SlowDown extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_slow_down]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_slow_down) }
}
class BallAndChain extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_ball_and_chain]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_ball_and_chain, Area.CIRCLE2) }
}
class Tranquilizer extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_tranquilizer]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_tranquilizer) }
}
class Soporific extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_soporific]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_soporific, Area.CIRCLE3) }
}
class Fracture extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_fracture]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_fracture) }
}
class Crushing extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_crushing]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_crushing) }
}
class Brainwashing extends ChipDebuffAnimation {
	static textures = [T.shackle_aureol, T.chip_brainwashing]
	static sounds = [S.debuff]
	constructor(game: Game) { super(game, T.chip_brainwashing) }
}

class Solidification extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_solidification]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_solidification) }
}
class Venom extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_venom]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_venom) }
}
class Toxin extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_toxin]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_toxin, Area.CIRCLE2) }
}
class Plague extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_plague]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_plague, Area.CIRCLE3) }
}
class Covid extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_covid]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_covid) }
}
class Arsenic extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_arsenic]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_arsenic) }
}

class Thorn extends ChipDamageReturnAnimation {
	static textures = [T.damage_return_aureol, T.chip_thorn]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_thorn, Area.CIRCLE1) }
}
class Mirror extends ChipDamageReturnAnimation {
	static textures = [T.damage_return_aureol, T.chip_mirror]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_mirror, Area.CIRCLE2) }
}
class Bramble extends ChipDamageReturnAnimation {
	static textures = [T.damage_return_aureol, T.chip_bramble]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_bramble) }
}

class Ferocity extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_ferocity]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_ferocity) }
}
class Collar extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_collar]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_collar) }
}
class Bark extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_bark]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_bark) }
}
class Wizardry extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_wizardry]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_wizardry) }
}
class Knowledge extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_knowledge]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_knowledge) }
}

class Burning extends ChipAnimation {
	static textures = [T.chip_burning, T.fire]
	static sounds = [S.fire]
	fires: Array<{x: number, y: number}> = []

	constructor(game: Game) { super(game, S.fire, 60, DamageType.FIRE) }

	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.createChipImage(this.recipientsOf(launcher, targets), T.chip_burning)
		this.game.setEffectArea(targetCell, Area.CIRCLE3, 'red')

		const area = 220
		for (let i = 0; i < 15; ++i) {
			this.fires.push({ x: targetPos.x + Math.random() * area - area / 2, y: targetPos.y + Math.random() * area / 2 - area / 4 })
		}
		this.fires.sort((a, b) => a.y - b.y)
	}

	public update(dt: number) {
		super.update(dt)
		const area = 30
		for (const fire of this.fires) {
			for (let i = 0; i < dt * 0.2; i++) {
				this.game.particles.addFire(fire.x + Math.random() * area - area / 2, fire.y + Math.random() * area / 2 - area / 4, 0, -Math.PI / 2)
			}
		}
	}
}

class Antidote extends ChipAnimation {
	static textures = [T.antidote_halo]
	static sounds = [S.liberation]
	public delay = 2
	constructor(game: Game) { super(game, S.liberation, 60, DamageType.DEFAULT) }
	public update(dt: number) {
		super.update(dt)
		if (Math.random() > 0.5) {
			let angle = Math.random() * Math.PI * 2
			const dx = Math.cos(angle) * 2
			const dy = Math.sin(angle)
			angle = Math.atan2(dy, dx)
			const x = this.position.x + dx * 10
			const y = this.position.y + dy * 10
			const z = 50
			this.game.particles.addImage(x, y, z, dx, dy, 0, angle, T.antidote_halo, 60)
		}
	}
}

export class Exasperation extends ChipAnimation {
	static textures = [T.exasperation_halo]
	static sounds = [S.liberation]
	public delay = 2
	constructor(game: Game) { super(game, S.liberation, 60, DamageType.DEFAULT) }
	public update(dt: number) {
		super.update(dt)
		if (Math.random() > 0.5) {
			let angle = Math.random() * Math.PI * 2
			const dx = Math.cos(angle) * 2
			const dy = Math.sin(angle)
			angle = Math.atan2(dy, dx)
			const x = this.position.x + dx * 10
			const y = this.position.y + dy * 10
			const z = 50
			this.game.particles.addImage(x, y, z, dx, dy, 0, angle, T.exasperation_halo, 60)
		}
	}
}

class Punishment extends ChipAnimation {
	static textures = [T.spike1, T.spike2]
	static sounds = [S.sword]
	public soundPlayed = false
	constructor(game: Game) {
		super(game, null, 35, DamageType.EXPLOSION)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.targets = targets
		const s = 40
		const d = 60
		const l = 40
		this.game.particles.addSpike(this.position.x - d, this.position.y + d / 2, 40,  s, -s / 2, T.spike1, l, false)
		this.game.particles.addSpike(this.position.x - d, this.position.y - d / 2, 46,  s,  s / 2, T.spike2, l, false)
		this.game.particles.addSpike(this.position.x + d, this.position.y + d / 2, 40, -s, -s / 2, T.spike1, l, true)
		this.game.particles.addSpike(this.position.x + d, this.position.y - d / 2, 46, -s,  s / 2, T.spike2, l, true)
	}
	public update(dt: number) {
		super.update(dt)
		if (this.duration < 7 && !this.soundPlayed) {
			S.sword.play(this.game)
			this.soundPlayed = true
		}
	}
}

class StealChipAnimation extends ChipAnimation {
	delta: number = 0
	spinningTexture!: Texture
	halo: (entity: FightEntity) => void;
	constructor(game: Game, sound: Sound, spinningTexture: Texture, halo: (entity: FightEntity) => void) {
		super(game, sound, 110, DamageType.DEFAULT)
		this.spinningTexture = spinningTexture
		this.halo = halo
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, caster)
		this.targets = this.recipientsOf(caster, targets)
	}
	public update(dt: number) {
		super.update(dt)
		this.delta += dt
		if (this.delta > 3 && this.duration > 60) {
			for (const target of this.targets!) {
				if (target === this.launcher) {
					this.halo(target)
				} else {
					this.game.particles.addSpinningParticle(target.ox, target.oy, Math.PI / 2, this.spinningTexture)
				}
			}
			this.delta = 0
		}
	}
}
class Precipitation extends StealChipAnimation {
	static textures = [T.buff_aureol, T.chip_precipitation, T.halo]
	static sounds = [S.buff]
	constructor(game: Game) {
		super(game, S.buff, T.halo, ChipAnimation.prototype.createChipHaloEntity)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, caster)
		this.game.setEffectArea(targetCell, Area.X_2, '#0280db')
		this.createChipImage([caster], T.chip_precipitation)
		this.createChipAureol([caster], T.buff_aureol)
	}
}
class Covetousness extends StealChipAnimation {
	static textures = [T.buff_aureol, T.chip_covetousness, T.halo]
	static sounds = [S.buff]
	constructor(game: Game) {
		super(game, S.buff, T.halo, ChipAnimation.prototype.createChipHaloEntity)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, caster)
		this.game.setEffectArea(targetCell, Area.X_2, '#0280db')
		this.createChipImage([caster], T.chip_covetousness)
		this.createChipAureol([caster], T.buff_aureol)
	}
}
class Vampirization extends StealChipAnimation {
	static textures = [T.cure_aureol, T.chip_vampirization, T.heal_cross, T.halo_green]
	static sounds = [S.heal]
	constructor(game: Game) {
		super(game, S.heal, T.halo_green, ChipAnimation.prototype.createChipHealEntity)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, caster)
		this.game.setEffectArea(targetCell, Area.PLUS_3, '#5efe36')
		this.createChipImage([caster], T.chip_vampirization)
		this.createChipAureol([caster], T.heal_cross)
	}
}

class Plasma extends ChipAnimation {
	static textures = [T.plasma, T.lightning, T.purple_lightning, T.halo_green]
	static sounds = [S.lightning, S.electrisor]

	static DURATION = 120
	public delay: number = 0
	constructor(game: Game) {
		super(game, null, Plasma.DURATION, DamageType.EXPLOSION)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.targets = targets
		this.game.particles.addPlasma(position.x, position.y, 20, T.plasma, Plasma.DURATION)
		this.game.setEffectArea(targetCell, Area.PLUS_2, '#2400ff', Plasma.DURATION)
		S.lightning.play(this.game)
		S.electrisor.play(this.game)
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 1
			if (this.targets) {
				for (const target of this.targets) {
					if (target.cell !== this.cell) {
						const angle = Math.atan2((target.oy - this.position.y + 20) / 2, target.ox - this.position.x)
						this.game.particles.addLightning(this.position.x, this.position.y, 20, angle, {x: target.ox, y: target.oy}, Math.random() > 0.5 ? T.purple_lightning : T.lightning, 25)
					}
					target.electrify()
				}
			}
		}
	}
}

class NovaDamageChip extends ChipAnimation {
	static textures = [T.alteration]
	static sounds = [S.alteration]
	static DURATION = 60
	public delay = 2
	public directions: number[] = []
	constructor(game: Game) {
		super(game, S.alteration, NovaDamageChip.DURATION, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.directions = []
		for (let i = 0; i < 10; ++i) {
			this.directions.push((2 * Math.PI * i) / 10 + (Math.random() * (Math.PI / 4)))
		}
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.targets) { return  }
		this.delay -= dt
		if (this.delay < 0) {
			for (const direction of this.directions) {
				const dx = Math.cos(direction) * 2 * 1.3
				const dy = Math.sin(direction) * 1.3
				const angle = Math.atan2(dy, dx)
				const x = this.position.x + dx * 5
				const y = this.position.y + dy * 5
				const z = 50
				this.game.particles.addImage(x, y, z, dx, dy, 0, angle, T.alteration, 50)
			}
			this.delay = 4
		}
	}
}

class Alteration extends NovaDamageChip {
}
class Desintegration extends NovaDamageChip {
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.game.setEffectArea(targetCell, Area.SQUARE_1, '#26ffba', NovaDamageChip.DURATION)
	}
}

class Jump extends ChipAnimation {
	static textures = []
	static sounds = []

	public teleported = false
	public targetPos!: Position
	public target!: FightEntity

	constructor(game: Game) {
		super(game, S.move, 70, DamageType.DEFAULT)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.cell = targetCell
		this.target = targets[0]
		this.launchPos = launchPos
		this.targetPos = targetPos

		caster.jumpToCell(targetCell)
	}
	public update(dt: number) {
		this.duration -= dt
		if (this.duration <= 0) {
			this.willFinish = true
		}
	}
}

class Mutation extends ChipNovaVitalityAnimation {
	static textures = [T.nova_aureol, T.nova_particle, T.chip_mutation]
	static sounds = [S.alteration]
	constructor(game: Game) { super(game, T.chip_mutation, Area.SQUARE_2) }
}

class Transmutation extends ChipNovaVitalityAnimation {
	static textures = [T.nova_aureol, T.nova_particle, T.chip_transmutation]
	static sounds = [S.alteration]
	constructor(game: Game) { super(game, T.chip_transmutation, Area.SQUARE_1) }
}

class Manumission extends ChipAnimation {
	static textures = [T.manumission_halo]
	static sounds = [S.liberation]
	public delay = 2
	constructor(game: Game) {
		super(game, S.liberation, 60, DamageType.DEFAULT)
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.targets) { return  }
		if (Math.random() > 0.5) {
			let angle = Math.random() * Math.PI * 2
			const dx = Math.cos(angle) * 2
			const dy = Math.sin(angle)
			angle = Math.atan2(dy, dx)
			const x = this.position.x + dx * 10
			const y = this.position.y + dy * 10
			const z = 50
			this.game.particles.addImage(x, y, z, dx, dy, 0, angle, T.manumission_halo, 60)
		}
	}
}

class Resurrection extends ChipAnimation {
	static textures = [T.cloud, T.ray]
	static sounds = [S.resurrection]
	public delay = 1
	constructor(game: Game) { super(game, S.resurrection, 35, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addImage(targetPos.x, targetPos.y, 70, 0, 0, 0, 0, T.ray, 80)
		this.game.particles.addImage(targetPos.x - 50, targetPos.y, 150, 0.5, 0, 0, 0, T.cloud, 80)
		this.game.particles.addImage(targetPos.x + 50, targetPos.y, 150, -0.5, 0, 0, 0, T.cloud, 80)
		this.game.particles.addImage(targetPos.x + 10, targetPos.y, 160, 0.2, 0, 0, 0, T.cloud, 80)
		this.game.particles.addImage(targetPos.x - 10, targetPos.y, 160, -0.2, 0, 0, 0, T.cloud, 80)
	}
}

export class Awakening extends ChipAnimation {
	static textures = [T.black_cloud, T.ray_red]
	static sounds = [S.resurrection]
	public delay = 1
	constructor(game: Game) { super(game, S.resurrection, 35, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addImage(targetPos.x, targetPos.y, 70, 0, 0, 0, 0, T.ray_red, 80)
		this.game.particles.addImage(targetPos.x - 50, targetPos.y, 150, 0.5, 0, 0, 0, T.black_cloud, 80)
		this.game.particles.addImage(targetPos.x + 50, targetPos.y, 150, -0.5, 0, 0, 0, T.black_cloud, 80)
		this.game.particles.addImage(targetPos.x + 10, targetPos.y, 160, 0.2, 0, 0, 0, T.black_cloud, 80)
		this.game.particles.addImage(targetPos.x - 10, targetPos.y, 160, -0.2, 0, 0, 0, T.black_cloud, 80)
	}
}

class Grapple extends ChipAnimation {

	static textures = [T.grapple_1, T.grapple_2, T.grapple_back_1, T.grapple_back_2, T.chain, T.chain_back]
	static sounds = [S.grapple]
	static DURATION = 70

	sx!: number
	sy!: number
	x!: number
	y!: number
	dx!: number
	dy!: number
	ex!: number
	ey!: number
	d!: number
	tsx!: number
	tsy!: number
	angle!: number
	front!: boolean
	right!: boolean
	chain!: Texture
	chain_sx!: number
	chain_sy!: number
	target: FightEntity | null = null
	move_end: number = 0

	constructor(game: Game) {
		super(game, S.grapple, Grapple.DURATION, DamageType.DEFAULT)
	}

	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		// Fix targetCell and targetPos
		if (targets.length) {
			targetCell = this.game.ground.field.computeAttractCell(launcher.cell!, targets[0].cell!, targetCell)
			const xy = this.game.ground.field.cellToXY(targetCell)
			targetPos = this.game.ground.xyToXYPixels(xy.x, xy.y)
		}
		super.launch(launchPos, targetPos, targets, targetCell)

		const angle = Math.atan2(targetPos.y - launchPos.y, targetPos.x - launchPos.x)
		this.dx = Math.cos(angle)
		this.dy = Math.sin(angle)
		const offset = this.front ? 30 : 30
		this.sx = launchPos.x + offset * this.dx
		this.sy = launchPos.y + offset * this.dy
		this.target = targets[0]
		if (this.target) {
			this.tsx = this.target.ox
			this.tsy = this.target.oy
		} else {
			this.tsx = launchPos.x + this.game.ground.realTileLength * 8 * this.dx
			this.tsy = launchPos.y + this.game.ground.realTileLength * 8 * this.dy
		}
		const total_distance = Math.sqrt(Math.pow(this.sx - this.tsx, 2) + Math.pow(this.sy - this.tsy, 2))
		const target_distance = Math.sqrt(Math.pow(this.position.x - this.sx, 2) + Math.pow(this.position.y - this.sy, 2))
		this.move_end = target_distance / total_distance
		this.ex = this.dx * total_distance
		this.ey = this.dy * total_distance

		this.front = this.dy > 0
		this.right = this.dx > 0
		this.angle = this.dy > 0 ? 26.56 : -26.56
		this.chain = this.front ? T.chain : T.chain_back
		const chain_start = this.front ? -5 : 15
		this.chain_sx = launchPos.x + chain_start * this.dx
		this.chain_sy = launchPos.y + chain_start * this.dy
	}

	public update(dt: number) {
		super.update(dt)
		const r = 1 - this.duration / Grapple.DURATION
		const x = r < 0.5
			? (1 / (1 + Math.pow(10, -10 * (r - 0.25))))
			: (this.move_end + (1 - this.move_end) / (1 + Math.pow(10,  10 * (r - 0.75))))
		this.x = this.sx + x * this.ex
		this.y = this.sy + x * this.ey
		this.d = Math.sqrt(Math.pow(this.x - this.sx, 2) + Math.pow(this.y - this.sy, 2))
		if (this.target && !this.target.unmovable && r > 0.5) {
			this.target.ox = this.x
			this.target.oy = this.y
		}
	}

	public end() {
		if (this.target && !this.target.unmovable) {
			this.target.setCell(this.cell)
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (!this.front) {
			this.drawGrapple(ctx)
		}
		const W = 100
		const H = 41
		const CS = 0.35
		const CW = W * CS
		const CH = H * CS
		ctx.save()
		ctx.translate(this.chain_sx, this.chain_sy)
		ctx.scale(this.right ? 1 : -1, 1)
		ctx.rotate(this.angle * Math.PI / 180)
		const offset = this.front ? -5 : -7
		let i = this.d - CW - offset
		for (; i > 0; i -= CW) {
			ctx.drawImage(this.chain.texture, i, -25, CW, CH)
		}
		i += CW
		const sw = W * i / CW
		ctx.drawImage(T.chain.texture, W - sw, 0, sw, H, 0, -25, i, CH)
		ctx.restore()

		if (this.front) {
			this.drawGrapple(ctx)
		}
	}

	public drawBack(ctx: CanvasRenderingContext2D) {
		const SC = 0.35
		const W = 200 * SC
		const H = 235 * SC
		const offset = this.front ? -19 : -21
		ctx.save()
		ctx.translate(this.x, offset + this.y - H / 2)
		ctx.scale(this.right ? 1 : -1, 1)
		ctx.drawImage(this.front ? T.grapple_2.texture : T.grapple_back_2.texture, - W / 2, 0, W, H)
		ctx.restore()
	}

	public drawGrapple(ctx: CanvasRenderingContext2D) {
		const SC = 0.35
		const W = 200 * SC
		const H = 235 * SC
		const offset = this.front ? -19 : -21
		ctx.save()
		ctx.translate(this.x, offset + this.y - H / 2)
		ctx.scale(this.right ? 1 : -1, 1)
		ctx.drawImage(this.front ? T.grapple_1.texture : T.grapple_back_1.texture, - W / 2, 0, W, H)
		ctx.restore()
	}
}

class BoxingGlove extends ChipAnimation {
	static textures = [T.glove, T.glove_back, T.chain, T.chain_back]
	static sounds = [S.boxing]
	static DURATION = 70
	sx!: number
	sy!: number
	x!: number
	y!: number
	dx!: number
	dy!: number
	ex!: number
	ey!: number
	d!: number
	tsx!: number
	tsy!: number
	angle!: number
	front!: boolean
	right!: boolean
	chain!: Texture
	chain_sx!: number
	chain_sy!: number
	target: FightEntity | null = null
	moved: boolean = false
	move_start: number = 0

	constructor(game: Game) {
		super(game, S.boxing, BoxingGlove.DURATION, DamageType.DEFAULT)
	}

	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell)
		const angle = Math.atan2(targetPos.y - launchPos.y, targetPos.x - launchPos.x)
		this.target = targets[0]
		let entity_cell
		if (this.target) {
			this.tsx = this.target.ox
			this.tsy = this.target.oy
			entity_cell = this.target.cell!
		} else {
			this.tsx = launchPos.x + this.game.ground.realTileLength * 8 * this.dx
			this.tsy = launchPos.y + this.game.ground.realTileLength * 8 * this.dy
			entity_cell = launcher.cell!
		}
		// Find real end cell
		this.cell = this.game.ground.field.getLastAvailableCell(entity_cell, this.cell, targets[0])
		// console.log("end cell", this.cell)
		const xy = this.game.ground.field.cellToXY(this.cell)
		this.position = this.game.ground.xyToXYPixels(xy.x, xy.y)
		const target_distance = Math.sqrt(Math.pow(launchPos.x - this.tsx, 2) + Math.pow(launchPos.y - this.tsy, 2))
		const total_distance = Math.sqrt(Math.pow(this.position.x - launchPos.x, 2) + Math.pow(this.position.y - launchPos.y, 2))
		this.move_start = target_distance / total_distance

		this.dx = Math.cos(angle)
		this.dy = Math.sin(angle)
		this.ex = this.dx * (total_distance - this.game.ground.realTileLength * 2.2)
		this.ey = this.dy * (total_distance - this.game.ground.realTileLength * 2.2)
		this.front = this.dy > 0
		this.right = this.dx > 0
		this.angle = this.dy > 0 ? 26.56 : -26.56
		const offset = this.front ? 50 : 50
		this.sx = launchPos.x + offset * this.dx
		this.sy = launchPos.y + offset * this.dy
		this.chain = this.front ? T.chain : T.chain_back
		const chain_start = this.front ? -5 : 15
		this.chain_sx = launchPos.x + chain_start * this.dx
		this.chain_sy = launchPos.y + chain_start * this.dy
	}

	public update(dt: number) {
		super.update(dt)
		const r = 1 - this.duration / BoxingGlove.DURATION
		const x = r < 0.2
			? 1 / (1 + Math.pow(10, -16 * (r - 0.1)))
			: 1 / (1 + Math.pow(10,  12 * (r - 0.6)))
		this.x = this.sx + x * this.ex
		this.y = this.sy + x * this.ey
		this.d = Math.sqrt(Math.pow(this.x - this.sx, 2) + Math.pow(this.y - this.sy, 2))

		if (this.target && !this.target.unmovable) {
			const tr = Math.max(0, Math.min(1, r / (0.2 * (1 - this.move_start)) - this.move_start))
			this.target.ox = this.tsx + tr * (this.position.x - this.tsx)
			this.target.oy = this.tsy + tr * (this.position.y - this.tsy)
			if (tr >= 1 && !this.moved) {
				this.target.setCell(this.cell)
				this.moved = true
			}
		}
	}

	public draw(ctx: CanvasRenderingContext2D) {
		if (!this.front) {
			this.drawGlove(ctx)
		}
		const W = 100
		const H = 41
		const CS = 0.35
		const CW = W * CS
		const CH = H * CS
		ctx.save()
		ctx.translate(this.chain_sx, this.chain_sy)
		ctx.scale(this.right ? 1 : -1, 1)
		ctx.rotate(this.angle * Math.PI / 180)
		const offset = this.front ? 12 : 17
		let i = this.d - CW + offset
		for (; i > 0; i -= CW) {
			ctx.drawImage(this.chain.texture, i, -25, CW, CH)
		}
		i += CW
		const sw = W * i / CW
		ctx.drawImage(T.chain.texture, W - sw, 0, sw, H, 0, -25, i, CH)
		ctx.restore()

		if (this.front) {
			this.drawGlove(ctx)
		}
	}

	public drawGlove(ctx: CanvasRenderingContext2D) {
		const SC = 0.35
		const W = 200 * SC
		const H = 165 * SC
		const offset = this.front ? -19 : -21
		ctx.save()
		ctx.translate(this.x, offset + this.y - H / 2)
		ctx.scale(this.right ? 1 : -1, 1)
		ctx.drawImage(this.front ? T.glove.texture : T.glove_back.texture, - W / 2, 0, W, H)
		ctx.restore()
	}
}

class Prism extends ChipAnimation {
	static textures = [T.prism]
	static sounds = [S.buff]
	public delay = 1
	constructor(game: Game) { super(game, S.buff, 60, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addPrism(targetPos.x, targetPos.y, 180, 80)
	}
}

// Hémorragie (2.50, #4905) : applique l'état Insoignable (state 2). L'entaille :
// un arc pourpre bref en travers de la cible, une grosse giclée à l'impact avec
// des gouttes qui retombent (gravité), puis un suintement résiduel — la plaie
// qui ne se referme pas.
class Hemorrhage extends ChipAnimation {
	static textures = [T.chip_hemorrhage, T.slash, T.leek_blood]
	static sounds = [S.leek_slice]
	static DURATION = 70
	static SLASH_TIME = 8
	public slashed = false
	public ooze = 0
	constructor(game: Game) { super(game, S.leek_slice, Hemorrhage.DURATION, DamageType.DEFAULT) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		this.createChipImage(this.targets, T.chip_hemorrhage)
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.targets) { return }
		const elapsed = Hemorrhage.DURATION - this.duration
		if (!this.slashed && elapsed >= Hemorrhage.SLASH_TIME) {
			this.slashed = true
			const slash = tintedTexture(T.slash, '#d01030', 0.9)
			for (const target of this.targets) {
				// L'entaille en diagonale à travers le corps. Vie 42 : l'enveloppe
				// d'alpha des ImageParticle (fade-in 30, fade-out 20) plafonne
				// l'opacité très bas sur les vies courtes.
				const angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 10 + Math.random() * Math.PI / 12)
				this.game.particles.addImage(target.ox, target.oy, target.height * 0.62, 0, 0, 0, angle, slash, 42, 1, 0, false, 0.9)
				// La giclée principale
				target.hurt(target.ox, target.oy, target.height * 0.5, Math.random() * 2 - 1, Math.random() - 0.5, 2)
				// Gouttes projetées qui retombent en pluie
				const drop = dropTexture(bloodColor(target))
				for (let i = 0; i < 7; ++i) {
					const a = Math.random() * Math.PI * 2
					const d = 0.4 + Math.random() * 1.2
					this.game.particles.addGarbage(target.ox, target.oy, target.height * 0.5, Math.cos(a) * d, Math.sin(a) * d * 0.5, 1 + Math.random() * 2, drop, 1, 0, 1 + Math.random() * 0.8, 0, 45)
				}
			}
		}
		// Suintement : la plaie continue de goutter jusqu'à la fin
		if (this.slashed) {
			this.ooze -= dt
			if (this.ooze <= 0) {
				this.ooze = 6
				for (const target of this.targets) {
					const drop = dropTexture(bloodColor(target))
					const ox = Math.random() * 16 - 8
					this.game.particles.addGarbage(target.ox + ox, target.oy, target.height * (0.3 + Math.random() * 0.3), Math.random() * 0.4 - 0.2, 0, 0.2, drop, 1, 0, 0.6 + Math.random() * 0.4, 0, 40)
					// De temps en temps une vraie giclée qui tache le sol
					if (Math.random() > 0.72) {
						target.hurt(target.ox, target.oy, target.height * 0.45, Math.random() * 2 - 1, Math.random() - 0.5, 1)
					}
				}
			}
		}
	}
}

// Maturation (2.50, #1813) : buff permanent d'une invocation alliée (+vie max,
// +puissance). Une poussée de croissance : hélice de sève verte et dorée qui
// monte en se resserrant autour de l'invocation, impulsion de squash & stretch
// au sommet, couronne dorée et gerbe de feuilles.
class Maturation extends ChipAnimation {
	static textures = [T.summon_leaf, T.chip_maturation]
	static sounds = [S.heal]
	static DURATION = 65
	static PULSE_TIME = 38
	// Une émission tous les 2 pas et non à chaque frame. Émises frame par frame,
	// les lueurs se recouvrent (leur diamètre valait la moitié de celui de
	// l'hélice) et la spirale devient un nuage informe ; espacées, l'œil relie
	// les points et lit l'hélice. Tous les 3 pas (retour de Pierre du 08/09),
	// les perles étaient trop éparses : 2 pas en donne dix-neuf au lieu de treize,
	// encore distinctes avec des lueurs de 13 px.
	static SPIRAL_STEP = 2
	// L'enveloppe d'alpha des ImageParticle plafonne l'opacité à vie² / 2400
	// (cf. ImageParticle.draw) : sous ~49 frames de vie, une particule n'est
	// JAMAIS pleinement opaque. Les lueurs de l'hélice vivaient 32 frames, donc
	// plafonnaient à 43 % : d'où la impression de brouillard. Elles vivent
	// maintenant assez longtemps pour être franches, et la traînée entière reste
	// à l'écran jusqu'à la poussée, ce qui dessine l'hélice au lieu de la suggérer.
	static GLOW_LIFE = 50
	public pulsed = false
	public spiral = 0
	public step = 0
	constructor(game: Game) { super(game, S.heal, Maturation.DURATION, DamageType.DEFAULT) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		this.createChipImage(this.targets, T.chip_maturation)
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.targets) { return }
		const elapsed = Maturation.DURATION - this.duration
		// L'hélice montante : UN seul brin, dont les perles alternent sève verte
		// et sève dorée, du sol jusqu'au-dessus de l'invocation.
		if (elapsed <= Maturation.PULSE_TIME) {
			this.spiral -= dt
			if (this.spiral <= 0) {
				this.spiral = Maturation.SPIRAL_STEP
				const progress = Math.min(1, elapsed / Maturation.PULSE_TIME)
				// Deux tours pleins, et un rayon qui se resserre en montant :
				// l'hélice visse la pousse dans la plante au lieu de l'entourer.
				const angle = progress * Math.PI * 4
				const radius = 24 - progress * 12
				// Un seul brin se suit à l'œil ; deux brins opposés (la version
				// d'avant) se recouvrent, et on retombe sur le nuage qu'on cherche
				// à éviter. La couleur alterne d'une perle à l'autre, ce qui garde
				// le vert ET le doré.
				const color = this.step % 2 === 0 ? '#7ee04a' : '#ffc93a'
				const glow = glowTexture(color, 13)
				for (const target of this.targets) {
					// PLUS HAUTE QUE LARGE, sinon ce ne sont que des anneaux
					// empilés : un bulbe chétif mesure 48 de haut pour une hélice
					// qui faisait 76 de diamètre, et l'œil n'y lisait aucune
					// montée. On monte donc bien au-dessus de la plante.
					const z = progress * (target.height * 1.25 + 30)
					const x = target.ox + Math.cos(angle) * radius
					const y = target.oy + Math.sin(angle) * radius * 0.5
					this.game.particles.addImage(x, y, z, 0, 0, 0.04, 0, glow, Maturation.GLOW_LIFE, 1, 0, false, 1)
					// Des feuilles qui PARTENT DU PIED du bulbe (retour de Pierre du
					// 08/09 : posées à mi-hauteur en face de la perle, elles
					// flottaient sans origine). Elles naissent au ras du sol, au
					// pourtour de la base, et montent le long de la plante en
					// s'écartant un peu : la sève monte des racines.
					if (this.step % 3 === 1) {
						const leaf = tintedTexture(T.summon_leaf, '#8fd94b', 0.5)
						// Petites (0,32) et en s'écartant franchement : à 0,45 et
						// serrées sur l'axe, elles recouvraient un bulbe chétif et
						// cachaient l'hélice.
						const side = Math.random() * Math.PI * 2
						const foot = 10 + Math.random() * 8
						const lx = target.ox + Math.cos(side) * foot
						const ly = target.oy + Math.sin(side) * foot * 0.5
						this.game.particles.addImage(lx, ly, 2, Math.cos(side) * 0.22, Math.sin(side) * 0.11, 0.55 + Math.random() * 0.3, 0, leaf, 55, 1, (Math.random() - 0.5) * 0.08, false, 0.32, Math.cos(side) < 0 ? -1 : 1)
					}
				}
				this.step++
			}
		}
		// L'impulsion de croissance, la couronne dorée et la gerbe de feuilles
		if (!this.pulsed && elapsed >= Maturation.PULSE_TIME) {
			this.pulsed = true
			const gold = glowTexture('#ffd75e', 16)
			const leaf = tintedTexture(T.summon_leaf, '#a8e85a', 0.45)
			for (const target of this.targets) {
				const bulb = target as { bounceX?: number, bounceY?: number }
				if (bulb.bounceY !== undefined) {
					bulb.bounceY = 1.35
					bulb.bounceX = 0.82
				}
				// Couronne qui s'ouvre à mi-hauteur : douze points nets valent
				// mieux qu'un halo, ils dessinent l'anneau en s'écartant.
				for (let i = 0; i < 12; ++i) {
					const angle = (i / 12) * Math.PI * 2
					this.game.particles.addImage(target.ox, target.oy, target.height * 0.55, Math.cos(angle) * 1.5, Math.sin(angle) * 0.75, 0.25, 0, gold, 50, 1, 0, false, 0.9)
				}
				// Gerbe de feuilles plutôt que les croix de soin d'avant :
				// Maturation fait grandir, elle ne soigne pas. Elle jaillit du
				// pied de la plante (z ≈ 0), pas de sa mi-hauteur, et monte vite.
				for (let i = 0; i < 8; ++i) {
					const angle = Math.random() * Math.PI * 2
					const speed = 0.5 + Math.random() * 0.6
					this.game.particles.addImage(target.ox + Math.cos(angle) * 4, target.oy + Math.sin(angle) * 2, 2, Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5, 1.5 + Math.random() * 0.7, 0, leaf, 60, 1, (Math.random() - 0.5) * 0.1, false, 0.3 + Math.random() * 0.2, Math.cos(angle) < 0 ? -1 : 1)
				}
			}
		}
	}
}

// Surinfection (2.50, #1813) : convertit une partie des poisons actifs de la
// cible en dégâts immédiats. La conversion se lit en deux temps : des bulles
// violettes (les poisons qu'on active) convergent depuis le pourtour de la
// cible, puis détonent en gerbe toxique avec le flash.
class Superinfection extends ChipPoisonAnimation {
	static textures = [T.poison_aureol, T.chip_superinfection, T.halo_green]
	static sounds = [S.poison]
	static BURST = 28
	public burst = Superinfection.BURST
	constructor(game: Game) { super(game, T.chip_superinfection) }
	public launch(launchPos: Cell, position: Cell, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		const recipients = this.recipientsOf(launcher, targets)
		this.targets = recipients
		// Les poisons convergent : bulles violettes depuis le pourtour, réglées
		// pour se résorber dans la cible au moment de la détonation.
		const bubble = glowTexture('#c93ef0', 22)
		for (const target of recipients) {
			for (let i = 0; i < 11; ++i) {
				const angle = Math.random() * Math.PI * 2
				const dist = 45 + Math.random() * 35
				const life = Superinfection.BURST + Math.random() * 6
				const x = target.ox + Math.cos(angle) * dist
				const y = target.oy + Math.sin(angle) * dist * 0.5
				const z = 5 + Math.random() * 40
				this.game.particles.addImage(x, y, z, -Math.cos(angle) * dist / life, -Math.sin(angle) * dist * 0.5 / life, 0.2, 0, bubble, life, 1, 0, false, 1.2 + Math.random() * 0.9)
			}
		}
	}
	public update(dt: number) {
		super.update(dt)
		if (this.burst > 0) {
			this.burst -= dt
			if (this.burst <= 0 && this.targets) {
				const flash = glowTexture('#e577ff', 22)
				for (const target of this.targets) {
					// La détonation : flash + gerbe de halos toxiques + anneau violet
					target.hurt(target.ox, target.oy, 25, 0, 0, 0)
					// Les traînées verticales (halo_green teinté violet : en vert,
					// elles évoquaient un soin — Pierre, 08/09/2026) montent droit,
					// chacune depuis son point du pourtour, sans dérive latérale —
					// un trait vertical qui glisse de côté se lit comme un bug
					// d'affichage.
					const streak = tintedTexture(T.halo_green, '#c93ef0', 0.85)
					for (let i = 0; i < 8; ++i) {
						const x = target.ox + (Math.random() - 0.5) * 60
						const y = target.oy + (Math.random() - 0.5) * 20
						this.game.particles.addImage(x, y, Math.random() * 15, 0, 0, 1.6 + Math.random() * 0.8, 0, streak, 40)
					}
					for (let i = 0; i < 8; ++i) {
						const angle = (i / 8) * Math.PI * 2
						this.game.particles.addImage(target.ox, target.oy, 25, Math.cos(angle) * 2.2, Math.sin(angle) * 1.1, 0.4, 0, flash, 32, 1, 0, false, 1.2)
					}
				}
			}
		}
	}
}

// Puces des plantes 2.50 (Éveil, release/250/eveil_plantes_puces.md). Le Piment
// et le Maïs se réveillent quand une entité entre dans leur zone et répondent
// avec ces quatre puces, que seules les plantes portent.

// Piquant (118) : la morsure du Piment. Dégâts purs, courts et secs : trois
// éclats de piqûre rouge orangé jaillissent de la cible, comme sur l'icône,
// et la cible flambe brièvement. Pas de glyphe : les attaques n'en ont pas.
class Piquant extends ChipAnimation {
	// T.fire : burnAnim() dessine des flammes, la texture doit être préchargée
	// (sinon drawImage lève et fige tout le combat).
	static textures = [T.fire]
	static sounds = [S.fire]
	constructor(game: Game) { super(game, S.fire, 40, DamageType.FIRE) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		const sting = glowTexture('#ff7a30', 18)
		for (const target of this.targets) {
			target.burnAnim(25)
			// Trois éclats principaux bien séparés, plus quelques étincelles.
			// Vie 40 : sous ~49 frames l'enveloppe d'alpha des ImageParticle
			// plafonne l'opacité, on compense par la taille.
			for (let i = 0; i < 12; ++i) {
				const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3
				const speed = i % 4 === 0 ? 2.6 : 1.3 + Math.random() * 0.9
				const scale = i % 4 === 0 ? 1.6 : 0.9
				this.game.particles.addImage(target.ox, target.oy, target.height * 0.6, Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5, 0.6 + Math.random() * 0.6, 0, sting, 40, 1, 0, false, scale)
			}
		}
	}
}

// Capsaïcine (119) : le Piment explose de capsaïcine sur toute sa zone
// (retour de Pierre du 09/09 : même construction que Pop-corn). Lancée par le
// Piment sur lui-même : une gerbe de particules rouges jaillit de son sommet
// dans tous les sens et retombe sur la zone, puis chaque ennemi touché
// s'embrase, et des braises montent de lui : la séquelle s'annonce. Pas de
// glyphe, c'est une attaque.
class Capsaicin extends ChipAnimation {
	static textures = [T.fire]
	static sounds = [S.fire]
	static DURATION = 85
	static SHOWER = 22
	static BLAZE = 30
	public burnt = false
	constructor(game: Game) { super(game, S.fire, Capsaicin.DURATION, DamageType.FIRE) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		this.game.setEffectArea(targetCell, Area.CIRCLE3, '#ff3a1a', 70)
	}
	public update(dt: number) {
		super.update(dt)
		const elapsed = Capsaicin.DURATION - this.duration
		const pepper = this.launcher
		// La gerbe : gouttes de capsaïcine rouges et quelques éclats plus clairs,
		// balistiques, qui sautent haut et retombent jusqu'aux bords de la zone.
		if (pepper && elapsed < Capsaicin.SHOWER) {
			const drop = glowTexture('#ff3c1c', 14)
			const spark = glowTexture('#ffb060', 10)
			for (let i = 0; i < 4; ++i) {
				const angle = Math.random() * Math.PI * 2
				const dist = 0.8 + Math.random() * 2.4
				const texture = i === 3 ? spark : drop
				this.game.particles.addGarbage(pepper.ox, pepper.oy, pepper.height * 0.9, Math.cos(angle) * dist, Math.sin(angle) * dist * 0.5, 3 + Math.random() * 3.5, texture, 1, 0, 0.8 + Math.random() * 0.7, 0, 70)
			}
			// Et le Piment lui-même crache un peu de feu
			if (Math.random() > 0.5) {
				this.game.particles.addFire(pepper.ox + Math.random() * 10 - 5, pepper.oy + Math.random() * 6 - 3, pepper.height * 0.8, Math.random() * Math.PI * 2, false)
			}
		}
		if (!this.targets) { return }
		// L'embrasement de chaque ennemi quand la pluie l'atteint…
		if (!this.burnt && elapsed >= Capsaicin.SHOWER) {
			this.burnt = true
			for (const target of this.targets) {
				target.burnAnim(Capsaicin.DURATION - Capsaicin.SHOWER + 20)
			}
		}
		if (elapsed < Capsaicin.SHOWER) { return }
		const ember = glowTexture('#ff4a1a', 9)
		for (const target of this.targets) {
			if (elapsed < Capsaicin.SHOWER + Capsaicin.BLAZE) {
				// …de vraies flammes sur la cible…
				if (Math.random() > 0.3) {
					this.game.particles.addFire(target.ox + Math.random() * 30 - 15, target.oy + Math.random() * 16 - 8, 10 + Math.random() * 30, Math.random() * Math.PI * 2, false)
				}
			} else if (Math.random() > 0.55) {
				// …puis des braises qui montent en dérivant : ça continue de brûler.
				const x = target.ox + (Math.random() - 0.5) * 40
				const y = target.oy + (Math.random() - 0.5) * 14
				this.game.particles.addImage(x, y, 5 + Math.random() * 20, (Math.random() - 0.5) * 0.3, 0, 0.9 + Math.random() * 0.6, 0, ember, 45, 1, 0, false, 0.6 + Math.random() * 0.6)
			}
		}
	}
}

// Sucre (120) : une bouchée de maïs doux. Le Maïs éjecte un morceau de sucre
// de son sommet, qui décrit une cloche jusqu'à l'allié et rebondit à ses pieds
// (retour de Pierre du 09/09) ; à l'arrivée, auréole de soin, glyphe et
// quelques cristaux qui scintillent.
class Sugar extends ChipAnimation {
	static textures = [T.cure_aureol, T.chip_sugar, T.sugar_cube]
	static sounds = [S.heal]
	// Vol du morceau de sucre, en frames. La gravité des Garbage vaut 0,3 par
	// frame : dz est choisi pour que le morceau retombe exactement sur la cible.
	static FLIGHT = 28
	static DURATION = Sugar.FLIGHT + 40
	public landed = false
	constructor(game: Game) { super(game, S.heal, Sugar.DURATION, DamageType.DEFAULT) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		if (!launcher) { this.land(); return }
		const flight = Sugar.FLIGHT
		const z0 = launcher.height * 0.95
		for (const target of this.targets) {
			const dx = (target.ox - launcher.ox) / flight
			const dy = (target.oy - launcher.oy) / flight
			const dz = (0.15 * flight * flight - z0) / flight
			this.game.particles.addGarbage(launcher.ox, launcher.oy, z0, dx, dy, dz, T.sugar_cube, Math.random() > 0.5 ? 1 : -1, 0, 1.3, 0, flight + 30)
		}
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.landed && Sugar.DURATION - this.duration >= Sugar.FLIGHT) { this.land() }
		if (!this.landed || !this.targets || this.duration < 12) { return }
		const crystal = glowTexture('#f4ffe8', 12)
		for (const target of this.targets) {
			if (Math.random() > 0.5) {
				const x = target.ox + (Math.random() - 0.5) * 50
				const y = target.oy + (Math.random() - 0.5) * 16
				this.game.particles.addImage(x, y, Math.random() * 12, 0, 0, 0.8 + Math.random() * 0.7, 0, crystal, 50, 1, 0, false, 0.8 + Math.random())
			}
		}
	}
	private land() {
		this.landed = true
		if (!this.targets) { return }
		this.createChipAureol(this.targets, T.cure_aureol)
		this.createChipImage(this.targets, T.chip_sugar)
	}
}

// Pop-corn (121) : l'épi éclate et arrose tout le monde. Lancée par le Maïs
// sur lui-même : une fontaine de grains éclatés (sprite popcorn) jaillit de
// son sommet et retombe en pluie sur la zone, puis chaque allié touché reçoit
// son soin.
class Popcorn extends ChipAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_popcorn, T.popcorn]
	static sounds = [S.heal]
	static DURATION = 75
	static SHOWER = 22
	public healed = false
	constructor(game: Game) { super(game, S.heal, Popcorn.DURATION, DamageType.DEFAULT) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		this.game.setEffectArea(targetCell, Area.CIRCLE3, '#ffd75e', 70)
		// Le glyphe au-dessus du Maïs lui-même, pas au-dessus des soignés.
		if (launcher) { this.createChipImage([launcher], T.chip_popcorn) }
	}
	public update(dt: number) {
		super.update(dt)
		const elapsed = Popcorn.DURATION - this.duration
		const corn = this.launcher
		// La fontaine de grains : balistiques, ils sautent haut et retombent
		// jusqu'aux bords de la zone.
		if (corn && elapsed < Popcorn.SHOWER) {
			for (let i = 0; i < 3; ++i) {
				const angle = Math.random() * Math.PI * 2
				const dist = 0.8 + Math.random() * 2.2
				this.game.particles.addGarbage(corn.ox, corn.oy, corn.height * 0.9, Math.cos(angle) * dist, Math.sin(angle) * dist * 0.5, 3 + Math.random() * 3.5, T.popcorn, Math.random() > 0.5 ? 1 : -1, 0, 0.6 + Math.random() * 0.5, 0, 70)
			}
		}
		// Le soin sur chaque allié quand la pluie les atteint
		if (!this.healed && elapsed >= Popcorn.SHOWER && this.targets) {
			this.healed = true
			this.createChipAureol(this.targets, T.cure_aureol)
			for (const target of this.targets) {
				for (let i = 0; i < 3; ++i) { this.createChipHealEntity(target) }
			}
		}
	}
}

// Chips boss (#3627). Patterns inspirés des chips existantes :
// Kemuridama → Teleportation + smoke ; Shuriken → projectile rotation + impact ;
// FireBall → projectile + dégâts feu ; Trebuchet → Meteorite ; Thunder → Lightning grande zone.
class Kemuridama extends ChipAnimation {
	static textures = [T.grey_cloud, T.cloud]
	static sounds = [S.teleportation]
	public teleported = false
	public targetPos!: Position
	constructor(game: Game) { super(game, S.teleportation, 120, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.targetPos = targetPos
	}
	public update(dt: number) {
		super.update(dt)
		// Gros nuage de fumée : plusieurs sprites de nuage par frame, étalés, qui
		// dérivent sur le côté et montent, sans rotation, en grande échelle.
		const spawnCloud = (p: Position) => {
			const ox = Math.random() * 90 - 45
			const oy = Math.random() * 60 - 30
			const dx = (Math.random() - 0.5) * 1.4 // dérive latérale
			const scale = 0.5 + Math.random() * 0.9 // petits à moyens nuages
			const texture = Math.random() > 0.5 ? T.grey_cloud : T.cloud
			this.game.particles.addImage(p.x + ox, p.y + oy, 20 + Math.random() * 40, dx, 0, 0.2, 0, texture, 75, 0.5, 0, false, scale)
		}
		// Fenêtres qui se chevauchent : origine jusqu'à la téléportation (60), et
		// arrivée dès 90 (bien avant 60) pour que les nuages soient déjà denses
		// quand le poireau s'y téléporte.
		if (this.duration > 60 && Math.random() > 0.55) spawnCloud(this.launchPos)
		if (this.duration < 90 && Math.random() > 0.55) spawnCloud(this.targetPos)
		if (!this.teleported && this.duration < 60) {
			this.launcher!.setCell(this.cell)
			this.game.updateReachableCells()
			this.teleported = true
		}
	}
}

class Shuriken extends ChipAnimation {
	static textures = [T.shuriken_star]
	static sounds = [S.leek_slice]
	public flyDuration = 30
	public hit = false
	constructor(game: Game) { super(game, S.leek_slice, 50, DamageType.DEFAULT) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.game.particles.addFlyingSpinningProjectile(launchPos.x, launchPos.y, 40, targetPos.x, targetPos.y, this.flyDuration, T.shuriken_star, 56, 1.0)
	}
	public update(dt: number) {
		super.update(dt)
		if (!this.hit && this.duration < this.flyDuration) {
			this.hit = true
			if (this.targets) {
				for (const target of this.targets) {
					target.hurt(target.ox, target.oy, 10, 0, 0, 0)
				}
			}
		}
	}
}

class FireBall extends ChipAnimation {
	static textures = [T.fire]
	static sounds = [S.fire]
	static DURATION = 70
	static FLIGHT = 45
	public exploded = false
	constructor(game: Game) { super(game, S.fire, FireBall.DURATION, DamageType.FIRE) }
	public update(dt: number) {
		super.update(dt)
		const elapsed = FireBall.DURATION - this.duration
		if (elapsed < FireBall.FLIGHT) {
			// Vol : vraie boule de feu (flux de particules de feu) qui laisse une
			// traînée en suivant la tête interpolée du lanceur vers la cible.
			const p = elapsed / FireBall.FLIGHT
			const hx = this.launchPos.x + (this.position.x - this.launchPos.x) * p
			const hy = this.launchPos.y + (this.position.y - this.launchPos.y) * p
			for (let i = 0; i < 3; ++i) {
				// thrown=false : particules lentes qui restent près de la tête (traînée courte)
				this.game.particles.addFire(hx + Math.random() * 16 - 8, hy + Math.random() * 16 - 8, 45, Math.random() * Math.PI * 2, false)
			}
		} else if (!this.exploded) {
			this.exploded = true
			this.game.setEffectArea(this.cell, Area.CIRCLE1, '#f26304', 60)
		}
		// Petits feux sur targets après impact
		if (elapsed > FireBall.FLIGHT + 2 && this.targets && Math.random() > 0.5) {
			for (const target of this.targets) {
				this.game.particles.addFire(target.ox + Math.random() * 30 - 15, target.oy + Math.random() * 30 - 15, 20, Math.random() * Math.PI * 2, false)
				target.burnAnim(40)
			}
		}
	}
}

class Trebuchet extends ChipAnimation {
	static textures = [T.boulder, T.explosion_mark, T.explosion_rock, T.explosion_rock2]
	static sounds = [S.meteorite, S.explosion]
	static DURATION = 50
	public flyDuration = 40
	public boulderSize = 96
	public exploded = false
	constructor(game: Game) { super(game, S.meteorite, Trebuchet.DURATION, DamageType.EXPLOSION) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		// Zone d'impact télégraphiée
		this.game.setEffectArea(targetCell, Area.CIRCLE2, '#888', 180)
		// Boulet en trajectoire de trébuchet : il entre par le côté de l'écran
		// (côté du lanceur), monte en parabole, puis s'écrase sur la cible.
		const side = Math.sign(launchPos.x - position.x) || 1
		const startX = position.x + side * 700
		this.game.particles.addBoulder(startX, position.y, 120, position.x, position.y, 160, this.flyDuration, T.boulder, this.boulderSize)
	}
	public update(dt: number) {
		super.update(dt)
		// Impact quand le rocher atteint la cible (durée totale - durée de vol)
		if (!this.exploded && this.duration <= Trebuchet.DURATION - this.flyDuration) {
			this.exploded = true
			// Le rocher éclate en fragments procéduraux (découpage de la sprite, comme
			// la mort d'un poireau) + souffle d'impact et débris projetés par le sol.
			this.game.particles.addShatter(T.boulder, this.position.x, this.position.y, 14, this.boulderSize)
			this.game.particles.addRealisticExplosion(this.position.x, this.position.y, 1.5)
			if (this.targets) {
				for (const target of this.targets) {
					target.hurt(this.position.x, this.position.y, 0, 0, 0, 0)
				}
			}
		}
	}
}

class Thunder extends ChipAnimation {
	static textures = [T.black_cloud, T.yellow_lightning]
	static sounds = [S.lightning]
	public delay = 1
	constructor(game: Game) { super(game, S.lightning, 90, DamageType.EXPLOSION) }
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
		super.launch(launchPos, position, targets, targetCell, launcher)
		this.targets = this.recipientsOf(launcher, targets)
		// Nuages noirs larges couvrant toute la zone CIRCLE3
		for (const offset of [-110, -75, -40, -5, 30, 65, 100]) {
			this.game.particles.addImage(this.position.x + offset, this.position.y, 240, offset > 0 ? -0.4 : 0.4, 0, 0, 0, T.black_cloud, 100, 1, 0, false, 1.3)
		}
		this.game.setEffectArea(targetCell, Area.CIRCLE3, '#ffcc00')
	}
	public update(dt: number) {
		super.update(dt)
		this.delay -= dt
		if (this.delay <= 0) {
			this.delay = 1
			// Rayon pixel de CIRCLE3 (~3 cellules), ellipse isométrique (y aplati x0.5)
			const rx = 3 * this.game.ground.realTileSizeX / 2
			// Plusieurs éclairs par tick, répartis dans toute la zone CIRCLE3
			for (let i = 0; i < 2; ++i) {
				const ang = Math.random() * Math.PI * 2
				const rr = Math.sqrt(Math.random()) * rx
				const landing = { x: this.position.x + Math.cos(ang) * rr, y: this.position.y + Math.sin(ang) * rr * 0.5 }
				const da = Math.random() * Math.PI / 18 - Math.PI / 36
				this.game.particles.addLightning(landing.x, landing.y - 220, 0, Math.PI / 2 + da, landing, T.yellow_lightning)
			}
			if (this.targets) {
				for (const target of this.targets) {
					target.electrify()
				}
			}
		}
	}
}

export { Alteration, Arsenic, Adrenaline, Armor, Acceleration, Antidote, Armoring, BallAndChain, Bandage, Bark, BoxingGlove, Brainwashing, Bramble, Burning, Covid, ChipAnimation, Carapace, Collar, Covetousness, Crushing, Cure, Desintegration, DevilStrike, Dome, Doping, Drip, Elevation, Ferocity, Fertilizer, FireBall, Flame, Flash, Fortress, Fracture, Grapple, Helmet, Hemorrhage, Ice, Iceberg, Inversion, Jump, Kemuridama, Knowledge, LeatherBoots, Liberation, Lightning, Loam, Manumission, Maturation, Meteorite, Mirror, Motivation, Mutation, Pebble, Plague, Plasma, Precipitation, Protein, Punishment, Prism, Rage, Rampart, Reflexes, Regeneration, Remission, Repotting, Resurrection, Rock, Rockfall, Serum, SevenLeagueBoots, Shield, Shock, Shuriken, SlowDown, Solidification, Soporific, Spark, Stalactite, Steroid, Stretching, Summon, Superinfection, Teleportation, Therapy, Thorn, Thunder, Toxin, Tranquilizer, Transmutation, Trebuchet, Vaccine, Vampirization, Venom, Wall, WarmUp, Whip, WingedBoots, Wizardry, Piquant, Capsaicin, Sugar, Popcorn }
