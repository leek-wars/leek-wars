import { Bubble } from '@/component/player/game/bubble'
import { ChipAnimation } from '@/component/player/game/chips'
import { Colors, Game, TEAM_COLORS } from '@/component/player/game/game'
import { InfoText } from '@/component/player/game/infotext'
import { T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { EffectType, EntityEffect } from '@/model/effect'
import { Entity } from '@/model/entity'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { S } from './sound'

enum EntityType {
	LEEK = 0,
	BULB = 1,
	TURRET = 2
}
enum EntityDirection {
	NORTH = 0,
	SOUTH = 1,
	EAST = 2,
	WEST = 3,
}
const MOVE_DELAY = 3
const MOVE_DURATION = 25
const MOVE_HEIGHT = 17

class FightEntity extends Entity {
	// Infos générales
	public game: Game
	public farmer!: Farmer | null
	public type: EntityType
	public summon = false
	public summoner!: Entity
	public active = false
	// Caractéristiques
	public life = 0
	public strength = 0
	public wisdom = 0
	public agility = 0
	public resistance = 0
	public frequency = 0
	public science = 0
	public magic = 0
	public tp = 0
	public mp = 0
	public maxLife = 0
	public maxTP = 0
	public maxMP = 0
	public absoluteShield = 0
	public relativeShield = 0
	public damageReturn = 0
	// Position
	public x = 0
	public y = 0
	public z = 0
	public baseZ = 0
	// Position réelle
	public rx = 0
	public ry = 0
	// Destination
	public dx = 0
	public dy = 0
	public dz = 0
	public dcell: Cell | null = null
	// Position en pixels
	public ox = 0
	public oy = 0
	// Orientation
	public angle = 0
	public orientation: EntityDirection = EntityDirection.SOUTH
	public front = true
	public direction = 1
	public isTop = false // Sur les lignes du haut
	// Vitesse de déplacement
	public speed = 0.04
	public moveDelay = 0
	public moveDuration = 0
	public moveAnim = 0
	public jumpHeight = 0
	// Drawing
	public drawID: number | null = null
	public height: number = 100
	// States
	public dead = false
	public flash = 0
	public burning = 0
	public burningAnim = 0
	public gazing = 0
	// Bulle de parole
	public bubble: Bubble | null
	// Info text
	public infoText: InfoText[] = []
	// Movement
	public path: Cell[] = []
	// Dead
	public deadAnim = 1
	// Animation
	public oscillation = 1
	public frame: number
	// Effects
	public effects: {[key: number]: EntityEffect} = {}
	public launched_effects: {[key: number]: EntityEffect} = {}
	public jumpForce: number = 0
	public bodyTexFront!: Texture
	public bodyTexBack!: Texture
	public bloodTex: Texture
	public lifeColor!: string
	public lifeColorLighter!: string
	// Reachable cells
	public reachableCells: Set<Cell> = new Set<Cell>()
	public reachableCellsArea: any

	constructor(game: Game, type: EntityType, team: number) {
		super()
		this.game = game
		this.type = type
		this.team = team
		this.bubble = new Bubble(game)
		this.path = []
		this.frame = Math.random() * 100
		this.effects = {}
		this.bloodTex = T.leek_blood
		this.lifeColor = TEAM_COLORS[this.team - 1]
		this.lifeColorLighter = LeekWars.shadeColor(this.lifeColor, 120)
	}

	public isDead() {
		return this.dead
	}

	public setCell(cell: Cell) {
		if (cell === null) {
			console.trace("Cell is null")
		}
		cell.setEntity(this)
		this.cell = cell

		const pos = this.game.ground.field.cellToXY(cell)
		const oldY = this.y

		this.x = pos.x
		this.dx = pos.x
		this.rx = pos.x

		this.y = pos.y
		this.dy = pos.y
		this.ry = pos.y

		this.z = this.baseZ

		this.isTop = this.y <= 4

		const xy = this.game.ground.xyToXYPixels(this.x, this.y)
		this.ox = xy.x
		this.oy = xy.y
		this.isTop = this.y <= 4

		if (oldY !== this.y && this.drawID != null) {
			this.game.moveDrawableElement(this, this.drawID, oldY, this.y)
		}
	}

	public setOrientation(orientation: EntityDirection) {
		this.orientation = orientation
		this.front = orientation === EntityDirection.SOUTH || orientation === EntityDirection.WEST
		this.direction = (orientation === EntityDirection.SOUTH || orientation === EntityDirection.EAST) ? 1 : -1
		this.angle = this.front ? Math.PI / 7 : -Math.PI / 7
	}

	public move(path: Cell[]) { // Move along a path
		this.path = [] as Cell[]
		for (const cell of path) {
			this.path.push(cell)
		}
		this.pathNext() // Start movement
	}

	public pathNext() {
		if (this.path.length === 0) {
			this.game.actionDone()
		} else {
			const cell = this.path[0]
			this.jumpToCell(cell)
			this.path.shift() // Supprime la première case
		}
	}

	public jumpToCell(cell: Cell) {

		// Set destination
		this.rx = this.x
		this.ry = this.y
		this.dcell = cell

		const distance = Math.abs(this.cell!.x - cell.x) + Math.abs(this.cell!.y - cell.y)

		const pos = this.game.ground.field.cellToXY(cell)

		this.dx = pos.x
		this.dy = pos.y

		this.moveDuration = distance * MOVE_DURATION
		this.moveAnim = this.moveDuration

		// Jump
		this.jumpHeight = Math.pow(distance, 1.6) * MOVE_HEIGHT
		// Orientation
		if (this.dx > this.rx) {
			if (this.dy > this.ry) {
				this.setOrientation(EntityDirection.SOUTH)
			} else {
				this.setOrientation(EntityDirection.EAST)
			}
		} else {
			if (this.dy > this.ry) {
				this.setOrientation(EntityDirection.WEST)
			} else {
				this.setOrientation(EntityDirection.NORTH)
			}
		}
	}

	public updateReachableCells() {
		// console.log("update reachable cells", this.name)

		this.reachableCells.clear()

		let grow = [this.cell]

		for (let i = 1; i <= this.mp; ++i) {
			const new_cells = []
			for (const c of grow) {
				const c1 = this.game.ground.field.next_cell(c, 1, 0)
				const c2 = this.game.ground.field.next_cell(c, -1, 0)
				const c3 = this.game.ground.field.next_cell(c, 0, 1)
				const c4 = this.game.ground.field.next_cell(c, 0, -1)
				if (c1 && !c1.obstacle && !c1.entity && !this.reachableCells.has(c1)) {
					new_cells.push(c1)
					this.reachableCells.add(c1)
				}
				if (c2 && !c2.obstacle && !c2.entity && !this.reachableCells.has(c2)) {
					new_cells.push(c2)
					this.reachableCells.add(c2)
				}
				if (c3 && !c3.obstacle && !c3.entity && !this.reachableCells.has(c3)) {
					new_cells.push(c3)
					this.reachableCells.add(c3)
				}
				if (c4 && !c4.obstacle && !c4.entity && !this.reachableCells.has(c4)) {
					new_cells.push(c4)
					this.reachableCells.add(c4)
				}
			}
			grow = new_cells
		}
		// console.log(Array.from(this.reachableCells).map(cell => cell.id))

		this.reachableCellsArea = this.game.createReachableAreaOutline(this.mp, this.cell!, this.reachableCells)
	}

	public looseMP(mp: number, jump: boolean) {
		this.mp -= mp
		if (!jump) {
			const info = new InfoText()
			info.init("-" + mp, Colors.MP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)

			// Update reachable cells when loosing MPs
			if (this.game.mouseEntity === this || this.game.hoverEntity === this || this.game.selectedEntity === this) {
				this.updateReachableCells()
			}
		}
	}

	public buffMP(mp: number, jump: boolean) {
		this.mp += mp
		if (!jump) {
			const info = new InfoText()
			info.init("+" + mp, Colors.MP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)

			// Update reachable cells when earning MPs
			if (this.game.mouseEntity === this || this.game.hoverEntity === this || this.game.selectedEntity === this) {
				this.updateReachableCells()
			}
		}
	}

	public buffWisdom(wisdom: number, jump: boolean) {
		this.wisdom += wisdom
		if (!jump) {
			const info = new InfoText()
			info.init("+" + wisdom, Colors.WISDOM_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public buffResistance(resistance: number, jump: boolean) {
		this.resistance += resistance
		if (!jump) {
			const info = new InfoText()
			info.init("+" + resistance, Colors.RESISTANCE_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public looseLife(life: number, erosion: number, jump: boolean) {
		this.life -= life
		if (this.life < 0) { this.life = 0 }

		this.maxLife -= erosion
		if (this.maxLife < 0) { this.maxLife = 0 }

		if (!jump) {
			const info = new InfoText()
			info.init("-" + life, Colors.LIFE_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public looseMaxLife(life: number, jump: boolean) {
		this.maxLife -= life
		if (this.maxLife < 0) { this.maxLife = 0 }

		if (!jump) {
			const info = new InfoText()
			info.init("-" + life, Colors.MAX_LIFE_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public looseStrength(strength: number, jump: boolean) {

		this.strength -= strength

		if (!jump) {
			const info = new InfoText()
			info.init("-" + strength, Colors.STRENGTH_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public looseMagic(magic: number, jump: boolean) {

		this.magic -= magic

		if (!jump) {
			const info = new InfoText()
			info.init("-" + magic, Colors.MAGIC_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public care(life: number, jump: boolean) {

		this.life += life

		if (!jump) {
			const info = new InfoText()
			info.init("+" + life, Colors.LIFE_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public boostVita(life: number, jump: boolean) {

		this.life += life
		this.maxLife += life

		if (!jump) {
			const info = new InfoText()
			info.init("+" + life, Colors.LIFE_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public looseTP(tp: number, jump: boolean) {

		this.tp -= tp

		if (!jump) {
			const info = new InfoText()
			info.init("-" + tp, Colors.TP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public buffTP(tp: number, jump: boolean) {

		this.tp += tp

		if (!jump) {
			const info = new InfoText()
			info.init("+" + tp, Colors.TP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public buffStrength(strength: number, jump: boolean) {
		this.strength += strength
		if (!jump) { this.newInfoText("+" + strength, Colors.STRENGTH_COLOR) }
	}

	public buffAgility(agility: number, jump: boolean) {
		this.agility += agility
		if (!jump) { this.newInfoText("+" + agility, Colors.AGILITY_COLOR) }
	}

	public buffMagic(magic: number, jump: boolean) {
		this.magic += magic
		if (!jump) { this.newInfoText("+" + magic, Colors.MAGIC_COLOR) }
	}

	public buffScience(science: number, jump: boolean) {
		this.science += science
		if (!jump) { this.newInfoText("+" + science, Colors.SCIENCE_COLOR) }
	}

	public buffRelativeShield(relativeShield: number, jump: boolean) {
		this.relativeShield += relativeShield
		if (!jump) {
			this.newInfoText((relativeShield >= 0 ? "+" : "") + relativeShield + '%', Colors.SHIELD_COLOR)
		}
	}

	public buffAbsoluteShield(absoluteShield: number, jump: boolean) {
		this.absoluteShield += absoluteShield
		if (!jump) {
			this.newInfoText((absoluteShield >= 0 ? "+" : "") + absoluteShield, Colors.SHIELD_COLOR)
		}
	}

	public buffDamageReturn(damageReturn: number, jump: boolean) {
		this.damageReturn += damageReturn
		if (!jump) { this.newInfoText("+" + damageReturn + '%', '#000000') }
	}

	public fail(jump: number) {
		if (!jump) { this.newInfoText(i18n.t('fight.fail') as string, '#000000') }
	}

	public newInfoText(text: string, color: string) {
		const info = new InfoText()
		info.init(text, color, -this.getHeight(), this.isTop)
		this.infoText.push(info)
	}

	public update(dt: number) {

		// Update si dead
		if (this.dead) {

			if (this.deadAnim >= 0) {

				this.deadAnim -= 0.04 * dt

				if (this.deadAnim <= 0) {
					if (this.drawID) {
						this.game.removeDrawableElement(this.drawID, this.dy)
						this.drawID = null
					}
					this.game.actionDone()
				}
			}
		}

		if (!this.dead) {

			// Animation
			this.frame += dt / Math.max(1, this.game.speed / 6)
			this.oscillation = 1 + Math.cos(this.frame / 17) / 40

			// Déplacement
			if (this.moveDelay > 0) {

				this.moveDelay -= dt

			} else if (this.moveAnim > 0) {

				this.moveAnim -= dt
				if (this.moveAnim <= 0) {
					// Arrivé
					S.move.play(this.game)
					this.z = this.baseZ
					this.setCell(this.dcell!)

					this.moveDelay = MOVE_DELAY
					this.pathNext()

				} else {

					const progress = 1 - this.moveAnim / this.moveDuration

					this.z = this.baseZ + Math.pow(Math.cos((Math.PI * (progress - 0.5))), 1) * this.jumpHeight
					const x = this.rx + (this.dx - this.rx) * progress
					const y = this.ry + (this.dy - this.ry) * progress

					const xy = this.game.ground.xyToXYPixels(x, y)
					this.ox = xy.x
					this.oy = xy.y
				}
			}
		}

		// Update bubble
		if (this.bubble != null) {
			this.bubble.update(dt)
		}

		// Update info text
		for (let i = 0; i < this.infoText.length; i++) {
			this.infoText[i].life -= dt
			if (this.infoText[i].life <= 0) {
				this.infoText.splice(i, 1)
				i--
				continue
			}
			const d = (this.infoText[i].life / 50) * (1 + (this.infoText.length - i - 1) / 1.2) * dt
			this.infoText[i].y -= d * this.infoText[i].bottom
		}

		// Update states
		if (!this.dead) {
			if (this.flash > 0) {
				this.flash -= dt
			}
			if (this.burning > 0 || this.burningAnim > 0) {
				this.burningAnim -= dt
				for (let i = 0; i < Math.round(dt) / 2.5; i++) {
					this.game.particles.addFire(this.ox + Math.random() * 40 - 20, this.oy + Math.random() * 40 - 20, 10, -Math.PI / 2)
				}
			}
			if (this.gazing > 0) {
				if (Math.random() > 0.8) {
					for (let i = 0; i < Math.round(dt); i++) {
						this.game.particles.addGaz(this.ox + Math.random() * 40 - 20, this.oy + Math.random() * 40 - 20, 10, -Math.PI / 2, T.gaz)
					}
				}
			}
		}
	}

	public useChip(chip: ChipAnimation, cell: Cell, targets: FightEntity[]) {
		const pos = this.game.ground.field.cellToXY(cell)
		const cellPixels = this.game.ground.xyToXYPixels(pos.x, pos.y)
		this.watch(cell)
		chip.launch({x: this.ox, y: this.oy}, cellPixels, targets, cell, this)
	}

	// Inclinaison du poireau vers la cellule cible
	public watch(cell: Cell) {
		if (cell !== this.cell) {
			const pos = this.game.ground.field.cellToXY(cell)
			const east = this.y < pos.y
			const south = this.x < pos.x
			this.setOrientation(south ? (east ? EntityDirection.SOUTH : EntityDirection.EAST) : (east ? EntityDirection.WEST : EntityDirection.NORTH))
		}
	}

	public say(ctx: CanvasRenderingContext2D, message: string) {
		if (!this.dead && this.bubble) {
			this.bubble.setMessage(ctx, message)
			const time = Math.max(10, message.length / 4)
			this.bubble.show(time)
		}
	}
	public sayLama() {
		if (!this.dead && this.bubble) {
			this.bubble.setLama()
			this.bubble.show(10)
			S.lama.play(this.game)
		}
	}
	public bug() {
		if (!this.dead && this.bubble) {
			this.bubble.setBug()
			this.bubble.show(10)
		}
	}
	public collide(x: number, y: number, z: number) {
		return Math.abs(x - this.ox) < 50 && Math.abs(y - this.oy) < 50 && Math.abs(z - (this.z + 80)) < 80
	}
	public electrify() {
		this.flash = 5
	}
	public burnAnim(time: number) {
		this.burningAnim += time
	}
	public burn() {
		this.burning++
	}
	public stopBurn() {
		this.burning--
	}
	public gaz() {
		this.gazing++
	}
	public stopGaz() {
		this.gazing--
	}

	public kill(animation: boolean) {
		this.dead = true
		if (animation) {
			this.deadAnim = 1
		}
		this.bubble = null
		if (this.drawID) {
			this.game.removeDrawableElement(this.drawID, this.y)
			this.drawID = null
		}
	}

	public reborn() {
		this.dead = false
		this.bubble = new Bubble(this.game)
		this.active = true
	}

	public draw(ctx: CanvasRenderingContext2D) {

		if (this.dead) { return  }

		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)
		ctx.translate(this.ox, this.oy)

		// Team square
		ctx.save()

		ctx.globalAlpha = this.deadAnim
		ctx.beginPath()
		ctx.moveTo(0, -this.game.ground.realTileSizeY / 2)
		ctx.lineTo(this.game.ground.realTileSizeX / 2, 0)
		ctx.lineTo(0, this.game.ground.realTileSizeY / 2)
		ctx.lineTo(-this.game.ground.realTileSizeX / 2, 0)
		ctx.closePath()

		if (this.id === this.game.currentPlayer) {
			ctx.fillStyle = TEAM_COLORS[this.team - 1]
			ctx.globalAlpha = this.deadAnim * 0.5
			ctx.fill()
		}

		ctx.globalAlpha = 0.8 * this.deadAnim
		ctx.strokeStyle = TEAM_COLORS[this.team - 1]
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
		ctx.lineWidth = 3.5
		ctx.stroke()

		ctx.globalAlpha = 1
		ctx.restore()

		// Integrate z pos
		ctx.translate(0, - this.z)
	}

	public endDraw(ctx: CanvasRenderingContext2D) {
		if (this.dead) { return  }
		ctx.restore()
	}

	public drawTexts(ctx: CanvasRenderingContext2D) {

		if (this.infoText.length > 0) {

			ctx.save()
			ctx.scale(this.game.ground.scale, this.game.ground.scale)
			ctx.translate(this.ox, this.oy)

			ctx.textBaseline = "middle"
			ctx.textAlign = "center"
			ctx.lineWidth = 2
			ctx.font = "bold 22pt Roboto"

			for (const infoText of this.infoText) {
				infoText.draw(ctx)
			}
			ctx.globalAlpha = 1
			ctx.restore()
		}
	}

	public drawPath(ctx: CanvasRenderingContext2D) {
		if (this.x !== this.dx || this.y !== this.dy) {
			ctx.save()
			ctx.globalAlpha = 0.5
			ctx.fillStyle = 'white'

			for (const cell of this.path) {
				const pos = this.game.ground.field.cellToXY(cell)
				this.drawWhiteTile(ctx, pos.x, pos.y)
			}
			this.drawWhiteTile(ctx, this.dx, this.dy)

			ctx.globalAlpha = 1
			ctx.restore()
		}
	}

	public drawWhiteTile(ctx: CanvasRenderingContext2D, x: number, y: number) {

		ctx.save()
		ctx.translate(((x + 1) / 2) * this.game.ground.tileSizeX, ((y + 1) / 2) * this.game.ground.tileSizeY)

		ctx.beginPath()
		ctx.moveTo(0, -this.game.ground.tileSizeY / 2.1)
		ctx.lineTo(this.game.ground.tileSizeX / 2.1, 0)
		ctx.lineTo(0, this.game.ground.tileSizeY / 2.1)
		ctx.lineTo(-this.game.ground.tileSizeX / 2.1, 0)
		ctx.closePath()

		ctx.fill()
		ctx.restore()
	}

	public drawName(ctx: CanvasRenderingContext2D) {

		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)

		if (this.isTop) {
			ctx.translate(this.ox, this.oy)
		} else {
			ctx.translate(this.ox, this.oy - this.height * 0.85)
		}

		ctx.font = "11pt Roboto"

		let text = this.name + " (" + this.life + ")"
		if (this.game.showIDs) { text = '#' + this.id + ' • ' + text }
		const width = Math.max(140, ctx.measureText(text).width + 14)
		const height = 19
		const barHeight = 8

		const active = this === this.game.selectedEntity || this === this.game.hoverEntity || this === this.game.mouseEntity

		// Fond
		ctx.globalAlpha = active ? 0.8 : 0.6
		ctx.fillStyle = active ? 'white' : 'black'
		ctx.fillRect(-width / 2, 0, width, height + barHeight - 1)

		// Nom
		ctx.globalAlpha = 1
		ctx.fillStyle = active ? 'black' : 'white'
		ctx.textBaseline = "middle"
		ctx.textAlign = "center"
		ctx.fillText(text, 0, 10)

		// Barre de vie
		const life = this.life / this.maxLife
		const barWidth = life * width
		ctx.fillStyle = this.lifeColor
		ctx.strokeStyle = this.lifeColorLighter
		ctx.fillRect(-width / 2 + 1, height, barWidth - 2, barHeight - 2)
		ctx.strokeRect(-width / 2 + 1, height, barWidth - 2, barHeight - 2)

		// Effects
		const count = LeekWars.objectSize(this.effects)
		let x = -count * 28 / 2
		ctx.font = "bold 8pt Roboto"
		ctx.textAlign = "left"
		for (const e in this.effects) {
			const effect = this.effects[e]
			ctx.drawImage(effect.texture, x, 25, 28, 28)
			let effect_message = '' + effect.value
			if (effect.type === EffectType.SHACKLE_MAGIC || effect.type === EffectType.SHACKLE_MP || effect.type === EffectType.SHACKLE_TP || effect.type === EffectType.SHACKLE_STRENGTH || effect.type === EffectType.VULNERABILITY || effect.type === EffectType.ABSOLUTE_VULNERABILITY) {
				effect_message = '-' + effect_message
			}
			if (effect.type === EffectType.RELATIVE_SHIELD || effect.type === EffectType.DAMAGE_RETURN || effect.type === EffectType.VULNERABILITY) {
				effect_message = effect_message + '%'
			}
			const effect_duration = effect.turns === -1 ? '∞' : '' + effect.turns
			const w = ctx.measureText(effect_message).width
			const w2 = ctx.measureText(effect_duration).width
			ctx.globalAlpha = 0.5
			ctx.fillStyle = 'black'
			ctx.fillRect(x + 1, 25 + 17, w + 2, 10)
			ctx.fillRect(x + 19, 26.5, w2 + 2, 11)
			ctx.globalAlpha = 1
			ctx.fillStyle = 'white'
			ctx.fillText(effect_message, x + 2, 25 + 23)
			ctx.fillText(effect_duration, x + 20, 32)
			x += 28
		}

		if (this.id === this.game.currentPlayer) {
			this.drawCurrentTPMP(ctx)
		}

		ctx.restore()
	}

	public drawCurrentTPMP(ctx: CanvasRenderingContext2D) {

		ctx.translate(0, -18)

		ctx.font = "bold 11pt Roboto"
		ctx.textAlign = "center"
		const textTP = '' + this.tp
		const textMP = '' + this.mp
		const iconSize = 13
		const padding = 2
		const widthTP = ctx.measureText(textTP).width
		const barWidthTP = widthTP + iconSize + padding * 3
		const widthMP = ctx.measureText(textMP).width
		const barWidthMP = widthMP + iconSize + padding * 3
		const height = 16
		const totalWidth = barWidthTP + padding + barWidthMP

		// Fond
		ctx.globalAlpha = 0.6
		ctx.fillStyle = 'black'
		ctx.fillRect(-totalWidth / 2, 0, barWidthTP, height)
		ctx.fillRect(-totalWidth / 2 + barWidthTP + padding, 0, barWidthMP, height)

		// TP
		ctx.globalAlpha = 1
		ctx.drawImage(T.tp.texture, -totalWidth / 2 + padding, 1, iconSize, iconSize)
		ctx.fillStyle = '#ffa100'
		ctx.fillText(textTP, -totalWidth / 2 + iconSize / 2 + 0.5 * padding + barWidthTP / 2, 9)

		// MP
		ctx.globalAlpha = 1
		ctx.drawImage(T.mp.texture, -totalWidth / 2 + barWidthTP + 2 * padding, 1, iconSize, iconSize)
		ctx.fillStyle = '#5ebe00'
		ctx.fillText(textMP, -totalWidth / 2 + barWidthTP + iconSize / 2 + barWidthMP / 2 + 1.5 * padding, 9)
	}

	public drawBubble(ctx: CanvasRenderingContext2D) {
		if (this.bubble != null) {
			ctx.save()
			ctx.scale(this.game.ground.scale, this.game.ground.scale)
			ctx.translate(this.ox, this.oy)
			this.bubble.draw(ctx, 0, this.getHeight() + 40, this.isTop)
			ctx.restore()
		}
	}

	public getLifeColorRGB() {
		const life = this.life / this.maxLife
		return [Math.min(210, Math.round(420 * (1 - life))), Math.min(210, Math.round(420 * life)), 0]
	}
	public getLifeBarBorderColor() {
		const hex = this.getLifeColorRGB()
		return LeekWars.rgbToHex(Math.round(hex[0] * 0.7), Math.round(hex[1] * 0.7), Math.round(hex[2] * 0.7))
	}
	public getHeight() {
		return this.bodyTexFront.texture.height / 1.5
	}
	public hurt(x: number, y: number, z: number, dx: number, dy: number, dz: number) {
		const dir = Math.random()
		dx *= dir / 10
		dy *= dir / 10
		let bx = this.ox + dx * (40 + Math.random() * 60)
		let by = this.oy + dy *  (40 + Math.random() * 60)
		this.game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex)
		this.game.particles.addBloodOnGround(bx, by, this.bloodTex)
		dx = -dx
		dy = -dy
		bx = this.ox + dx * (40 + Math.random() * 60)
		by = this.oy + dy * (40 + Math.random() * 60)
		this.game.particles.addBlood(x, y, z, dx, dy, dz, this.bloodTex)
		this.game.particles.addBloodOnGround(bx, by, this.bloodTex)
		this.flash = 5
	}
	public randomHurt() {
		const z = 20 + Math.random() * 40
		const dx = Math.random() * 30 - 15
		const dy = Math.random() * 30 - 15
		const dz = Math.random() * 30 - 15
		const x = this.ox + Math.random() * 40 - 20
		const y = this.oy + Math.random() * 40 - 20
		this.hurt(x, y, z, dx, dy, dz)
	}
	get color() {
		const color = TEAM_COLORS[this.team - 1]
		const rgb = LeekWars.hexToRgb(color)
		return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.6)'
	}
	get gradient() {
		const color = TEAM_COLORS[this.team - 1]
		const rgb = LeekWars.hexToRgb(color)
		const background = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.4)'
		const background2 = 'rgba(0,0,0,0.1)'
		return "linear-gradient(to bottom, " + background2 + " 0%, " + background2 + " 30%," + background + " 100%)"
	}
	get lifeBarGadient() {
		const color = TEAM_COLORS[this.team - 1]
		const rgb = LeekWars.hexToRgb(color)
		const background = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.8)'
		const background2 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.4)'
		return "linear-gradient(to bottom, " + background2 + " 0%, " + background2 + " 30%," + background + " 100%)"
	}
}

export { EntityType, EntityDirection, FightEntity }
