import { FightEntity } from '@/component/player/game/entity'
import { Colors, Game } from "@/component/player/game/game"
import { S, Sound } from '@/component/player/game/sound'
import { T, Texture } from '@/component/player/game/texture'
import { Area } from '@/model/area'
import { Cell } from '@/model/cell'
import { Position } from './position'

abstract class ChipAnimation {
	public game: Game
	public done: boolean = false
	public willFinish: boolean = false
	public sound: Sound | null
	public cell!: Cell
	public targets: FightEntity[] | undefined
	public duration: number
	public position!: Position
	public launcher!: FightEntity | undefined

	constructor(game: Game, sound: Sound | null, duration: number) {
		this.game = game
		this.sound = sound
		this.duration = duration
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, launcher?: FightEntity) {
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
		}
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
}

class ChipShieldAnimation extends ChipAnimation {
	public texture: Texture
	constructor(game: Game, texture: Texture) {
		super(game, S.shield, 60)
		this.texture = texture
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.shield_aureol)
	}
}

class ChipBoostAnimation extends ChipAnimation {
	public texture: Texture
	public delay: number = 2
	public area: Area
	constructor(game: Game, texture: any, area: Area = Area.SINGLE_CELL) {
		super(game, S.buff, 60)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.buff_aureol)
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
	constructor(game: Game, texture: any, area: Area = Area.SINGLE_CELL) {
		super(game, S.heal, 45)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.cure_aureol)
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

class ChipDebuffAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: any, area: Area = Area.SINGLE_CELL) {
		super(game, S.debuff, 60)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.shackle_aureol)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, '#9f00ef')
		}
	}
}

class ChipPoisonAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: any, area: Area = Area.SINGLE_CELL) {
		super(game, S.poison, 60)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Cell, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.poison_aureol)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, '#ea5ef9')
		}
	}
}

class ChipDamageReturnAnimation extends ChipAnimation {
	public texture: Texture
	public area: Area
	constructor(game: Game, texture: any, area: Area = Area.SINGLE_CELL) {
		super(game, S.buff, 60)
		this.texture = texture
		this.area = area
	}
	public launch(launchCell: Cell, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchCell, targetPos, targets, targetCell)
		this.createChipImage(targets, this.texture)
		this.createChipAureol(targets, T.damage_return_aureol)
		if (this.area !== Area.SINGLE_CELL) {
			this.game.setEffectArea(targetCell, this.area, Colors.AGILITY_COLOR)
		}
	}
}

class Adrenaline extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_adrenaline]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_adrenaline, Area.CIRCLE1) }
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
		super(game, S.fire, 100)
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
	constructor(game: Game) { super(game, S.fire, 70) }
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
	constructor(game: Game) { super(game, S.lightning, 70) }
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

class Ice extends ChipAnimation {
	static textures = [T.ice_small]
	static sounds = [S.ice]
	constructor(game: Game) {
		super(game, S.ice, 30)
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
		super(game, S.ice, 40)
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
	public launchPos!: Position
	public target: any
	constructor(game: Game) {
		super(game, S.teleportation, 120)
	}
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell, launcher: FightEntity) {
		super.launch(launchPos, targetPos, targets, targetCell, launcher)
		this.target = targets[0]
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
		if (!this.inverted && this.duration < 40 && this.launcher) {
			const cell = this.launcher.cell
			this.launcher.setCell(this.target.cell)
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
		super(game, S.liberation, 60)
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
		super(game, S.lightning, 80)
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, position, targets, targetCell)
		this.targets = targets
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
	static textures = [T.meteorite, T.explosion, T.fire]
	static sounds = [S.meteorite, S.explosion]

	public willFinish = false
	public count = 6
	public delay = 0
	public vx: number = 0
	constructor(game: Game) {
		super(game, S.meteorite, 100)
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
	static textures = [T.pebble_small]
	static sounds = [S.rock]
	constructor(game: Game) { super(game, S.rock, 30) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 100, 0, 0, 2, T.pebble_small, 1, 0)
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
class Elevation extends ChipHealAnimation {
	static textures = [T.cure_aureol, T.heal_cross, T.chip_remission]
	static sounds = [S.heal]
	constructor(game: Game) { super(game, T.chip_remission) }
}
class Rock extends ChipAnimation {
	static textures = [T.rock]
	static sounds = [S.rock]
	constructor(game: Game) { super(game, S.rock, 40) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.game.particles.addGarbage(targetPos.x, targetPos.y, 150, 0, 0, 2, T.rock, 1, 0)
	}
}
class Rockfall extends ChipAnimation {
	static textures = [T.rock]
	static sounds = [S.rockfall]
	public delay = 0
	constructor(game: Game) { super(game, S.rockfall, 70) }
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
	constructor(game: Game) { super(game, S.lightning, 60) }
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
	constructor(game: Game) { super(game, S.fire, 40) }
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
	constructor(game: Game) { super(game, S.ice, 40) }
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
	public cell!: Cell
	public launchPos!: Position
	public targetPos: any
	public target!: FightEntity
	constructor(game: Game) {
		super(game, S.teleportation, 140)
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
	constructor(game: Game) { super(game, T.chip_winged_boots, Area.CIRCLE1) }
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
	static textures = [T.poison_aureol, T.chip_plague]
	static sounds = [S.poison]
	constructor(game: Game) { super(game, T.chip_plague) }
}
class Thorn extends ChipDamageReturnAnimation {
	static textures = [T.damage_return_aureol, T.chip_thorn]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_thorn, Area.CIRCLE2) }
}
class Mirror extends ChipDamageReturnAnimation {
	static textures = [T.damage_return_aureol, T.chip_mirror]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_mirror, Area.CIRCLE2) }
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
	static textures = [T.buff_aureol, T.halo, T.chip_ferocity]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_ferocity) }
}
class Knowledge extends ChipBoostAnimation {
	static textures = [T.buff_aureol, T.halo, T.chip_ferocity]
	static sounds = [S.buff]
	constructor(game: Game) { super(game, T.chip_ferocity) }
}
class Burning extends ChipAnimation {
	static textures = [T.chip_burning]
	static sounds = [S.fire]
	constructor(game: Game) { super(game, S.fire, 60) }
	public launch(launchPos: Position, targetPos: Position, targets: FightEntity[], targetCell: Cell) {
		super.launch(launchPos, targetPos, targets, targetCell)
		this.createChipImage(targets, T.chip_burning)
		this.game.setEffectArea(targetCell, Area.CIRCLE3, 'red')
	}
}
class Antidote extends ChipAnimation {
	static textures = [T.antidote_halo]
	static sounds = [S.liberation]
	public delay = 2
	constructor(game: Game) { super(game, S.liberation, 60) }
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
class Punishment extends ChipAnimation {
	static textures = [T.spike1, T.spike2]
	static sounds = [S.sword]
	public soundPlayed = false
	constructor(game: Game) {
		super(game, null, 35)
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
	caster!: FightEntity
	spinningTexture!: Texture
	halo: Function
	constructor(game: Game, sound: Sound, spinningTexture: Texture, halo: Function) {
		super(game, sound, 110)
		this.spinningTexture = spinningTexture
		this.halo = halo
	}
	public launch(launchPos: Position, position: Position, targets: FightEntity[], targetCell: Cell, caster: FightEntity) {
		super.launch(launchPos, position, targets, targetCell)
		this.caster = caster
	}
	public update(dt: number) {
		super.update(dt)
		this.delta += dt
		if (this.delta > 3 && this.duration > 60) {
			for (const target of this.targets!) {
				if (target === this.caster) {
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
		super(game, null, Plasma.DURATION)
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

class Alteration extends ChipAnimation {
	static textures = [T.alteration]
	static sounds = [S.alteration]
	public delay = 2
	public directions: number[] = []
	constructor(game: Game) {
		super(game, S.alteration, 60)
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

class Jump extends ChipAnimation {
	static textures = []
	static sounds = []

	public teleported = false
	public cell!: Cell
	public launchPos!: Position
	public targetPos: any
	public target!: FightEntity
	constructor(game: Game) {
		super(game, S.move, 70)
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

export { Alteration, Covid, ChipAnimation, Adrenaline, Armor, Acceleration, Antidote, Armoring, BallAndChain, Bandage, Bark, Burning, Carapace, Collar, Covetousness, Cure, DevilStrike, Doping, Drip, Elevation, Ferocity, Fertilizer, Flame, Flash, Fortress, Fracture, Helmet, Ice, Iceberg, Inversion, Jump, Knowledge, LeatherBoots, Liberation, Lightning, Loam, Meteorite, Mirror, Motivation, Pebble, Plague, Plasma, Precipitation, Protein, Punishment, Rage, Rampart, Reflexes, Regeneration, Remission, Rock, Rockfall, SevenLeagueBoots, Shield, Shock, SlowDown, Solidification, Soporific, Spark, Stalactite, Steroid, Stretching, Teleportation, Thorn, Toxin, Tranquilizer, Vaccine, Vampirization, Venom, Wall, WarmUp, Whip, WingedBoots, Wizardry }
