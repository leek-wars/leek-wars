import { Bubble } from '@/component/player/game/bubble'
import { ChipAnimation } from '@/component/player/game/chips'
import { Colors, Game, TEAM_COLORS } from '@/component/player/game/game'
import { InfoText } from '@/component/player/game/infotext'
import { Texture } from '@/component/player/game/texture'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'

enum EntityType {
	LEEK = 0,
	BULB = 1,
}
enum EntityDirection {
	NORTH = 0,
	SOUTH = 1,
	EAST = 2,
	WEST = 3,
}
const MOVE_DELAY = 3

class Entity {
	// Infos générales
	public game: Game
	public name = ""
	public id!: number
	public level = 1
	public team!: number
	public farmer!: number
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
	public cell = 0
	// Position réelle
	public rx = 0
	public ry = 0
	// Destination
	public dx = 0
	public dy = 0
	public dz = 0
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
	public jumpHeight = 35
	// Drawing
	public drawID: number | null = null
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
	public path: any
	// Dead
	public deadAnim = 1
	// Animation
	public oscillation = 1
	public frame: number
	// Effects
	public effects: {[key: number]: any} = {}
	public jumpForce: number = 0
	public bodyTexFront!: Texture
	public bodyTexBack!: Texture
	public bloodTex: Texture

	constructor(game: Game, type: EntityType) {
		this.game = game
		this.type = type
		this.bubble = new Bubble(game)
		this.path = new Array()
		this.frame = Math.random() * 100
		this.effects = {}
		this.bloodTex = this.game.T.leek_blood
	}

	public isDead() {
		return this.dead
	}

	public setCell(cell: number) {
		this.cell = cell
		const pos = this.game.ground.cellToXY(cell)
		this.setPosition(pos.x, pos.y)
		this.computeOrginPos()
	}

	public computeOrginPos() {
		const pos = this.game.ground.xyToXYPixels(this.x, this.y)
		this.ox = pos.x
		this.oy = pos.y
	}

	public setPosition(x: number, y: number) {
		const oldY = this.y

		this.x = x
		this.dx = x
		this.rx = x

		this.y = y
		this.dy = y
		this.ry = y

		this.z = 0

		this.computeOrginPos()

		if (oldY !== y && this.drawID != null) {
			this.game.moveDrawableElement(this, this.drawID, oldY, y)
		}
	}

	public setOrientation(orientation: EntityDirection) {
		this.orientation = orientation
		this.front = orientation === EntityDirection.SOUTH || orientation === EntityDirection.WEST
		this.direction = (orientation === EntityDirection.SOUTH || orientation === EntityDirection.EAST) ? 1 : -1
		this.angle = this.front ? Math.PI / 7 : -Math.PI / 7
	}

	public jump() {
		if (this.dz === 0) {
			this.dz = this.jumpForce
		}
	}

	public move(path: number[]) { // Move along a path
		this.path = []
		for (const cell of path) {
			this.path.push(cell)
		}
		this.pathNext() // Start movement
	}

	public pathNext() {
		if (this.path.length === 0) {
			this.game.actionDone()
			return
		}
		// Set destination
		this.rx = this.x
		this.ry = this.y

		const cell = this.path[0]
		this.cell = cell

		const pos = this.game.ground.cellToXY(cell)

		this.dx = pos.x
		this.dy = pos.y

		// Jump
		this.jump()
		this.game.S.move.play()
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

		// Update line
		if (this.drawID) {
			this.game.moveDrawableElement(this, this.drawID, this.ry, this.dy)
		}
		this.path.shift() // Supprime la première case
	}

	public looseMP(mp: number, jump: boolean) {
		this.mp -= mp
		if (!jump) {
			const info = new InfoText()
			info.init("-" + mp, Colors.MP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
		}
	}

	public buffMP(mp: number, jump: boolean) {
		this.mp += mp
		if (!jump) {
			const info = new InfoText()
			info.init("+" + mp, Colors.MP_COLOR, -this.getHeight(), this.isTop)
			this.infoText.push(info)
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

	public buffRelativeShield(relativeShield: number, jump: boolean) {
		this.relativeShield += relativeShield
		if (!jump) { this.newInfoText("+" + relativeShield + '%', Colors.SHIELD_COLOR) }
	}

	public buffAbsoluteShield(absoluteShield: number, jump: boolean) {
		this.absoluteShield += absoluteShield
		if (!jump) { this.newInfoText("+" + absoluteShield, Colors.SHIELD_COLOR) }
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
					}
					this.game.actionDone()
				}
			}
		}

		if (!this.dead) {

			let pathNext = false

			// Animation
			this.frame += dt / Math.max(1, this.game.speed / 6)
			this.oscillation = 1 + Math.cos(this.frame / 17) / 40

			// Déplacement
			if (this.moveDelay > 0) {

				this.moveDelay -= dt

			} else {

				let check = false

				if (this.x !== this.dx) {
					if (this.x < this.dx) { this.x += this.speed * dt }
					if (this.x > this.dx) { this.x -= this.speed * dt }

					// Saut
					this.z = this.baseZ + (0.5 - Math.abs((this.dx + this.ox) / 2 - this.x)) * 2 * this.jumpHeight
					check = true
				}
				if (this.y !== this.dy) {
					if (this.y < this.dy) { this.y += this.speed * dt }
					if (this.y > this.dy) { this.y -= this.speed * dt }

					// Saut
					this.z = this.baseZ + (0.5 - Math.abs((this.dy + this.ry) / 2 - this.y)) * 2 * this.jumpHeight
					check = true
				}

				if (check && Math.abs(this.x - this.dx) <= dt * this.speed &&
					Math.abs(this.y - this.dy) <= dt * this.speed) { // Arrivé

					this.x = this.dx
					this.y = this.dy
					this.z = this.baseZ

					this.moveDelay = MOVE_DELAY
					pathNext = true
				}
			}

			// Compute origin position
			this.computeOrginPos()

			// Is on top ?
			this.isTop = this.y <= 3

			// Start new path
			if (pathNext) { this.pathNext() }
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
						this.game.particles.addGaz(this.ox + Math.random() * 40 - 20, this.oy + Math.random() * 40 - 20, 10, -Math.PI / 2)
					}
				}
			}
		}
	}

	public useChip(chip: ChipAnimation, cell: number, targets: Entity[]) {

		const pos = this.game.ground.cellToXY(cell)
		const x = pos.x
		const y = pos.y

		// Inclinaison du poireau vers la cellule cible
		if (this.x !== x || this.y !== y) {
			const south = this.y > y
			const east = this.x > x
			this.setOrientation(south ? (east ? EntityDirection.NORTH : EntityDirection.EAST) : (east ? EntityDirection.WEST : EntityDirection.SOUTH))
		}

		const cellPixels = this.game.ground.xyToXYPixels(pos.x, pos.y)

		this.computeOrginPos()

		chip.launch({x: this.ox, y: this.oy}, cellPixels, targets, cell, this)
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
			this.game.S.lama.play()
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
	public kill() {
		this.dead = true
		this.deadAnim = 1
		this.bubble = null
	}
	public reborn() {
		this.dead = false
		this.bubble = new Bubble(this.game)
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
		ctx.lineWidth = 4
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
			for (const cell of this.path) {
				const pos = this.game.ground.cellToXY(cell)
				this.drawWhiteTile(ctx, pos.x, pos.y)
			}
			this.drawWhiteTile(ctx, this.dx, this.dy)
		}
	}

	public drawWhiteTile(ctx: CanvasRenderingContext2D, x: number, y: number) {

		ctx.save()
		ctx.globalAlpha = 0.4
		ctx.fillStyle = 'white'

		ctx.translate(((x + 1) / 2) * this.game.ground.tileSizeX, ((y + 1) / 2) * this.game.ground.tileSizeY)

		ctx.beginPath()
		ctx.moveTo(0, -this.game.ground.tileSizeY / 2.1)
		ctx.lineTo(this.game.ground.tileSizeX / 2.1, 0)
		ctx.lineTo(0, this.game.ground.tileSizeY / 2.1)
		ctx.lineTo(-this.game.ground.tileSizeX / 2.1, 0)
		ctx.closePath()

		ctx.fill()

		ctx.globalAlpha = 1
		ctx.restore()
	}

	public drawName(ctx: CanvasRenderingContext2D) {

		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)

		if (this.isTop) {
			ctx.translate(this.ox, this.oy)
		} else {
			ctx.translate(this.ox, this.oy - this.bodyTexFront.texture.height * 0.85)
		}

		ctx.font = "11pt Roboto"

		const text = this.name + " (" + this.life + ")"
		const width = Math.max(140, ctx.measureText(text).width + 14)
		const height = 18
		const barHeight = 9

		// Fond
		ctx.globalAlpha = 0.4
		ctx.fillStyle = 'black'
		ctx.fillRect(-width / 2, 0, width, height + barHeight)

		// Nom
		ctx.globalAlpha = 1
		ctx.fillStyle = 'white'
		ctx.textBaseline = "middle"
		ctx.textAlign = "center"
		ctx.fillText(text, 0, 10)

		// Barre de vie
		const life = this.life / this.maxLife
		ctx.fillStyle = this.getLifeColor()
		const barWidth = life * width
		ctx.fillRect(-width / 2 + 2, height + 2, barWidth - 4, barHeight - 4)

		// Effects
		const count = LeekWars.objectSize(this.effects)
		let x = -count * 28 / 2
		for (const e in this.effects) {
			ctx.drawImage(this.effects[e].texture, x, 26, 28, 28)
			x += 28
		}
		ctx.restore()
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
	public getLifeColor() {
		const rgb = this.getLifeColorRGB()
		return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"
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

export { Entity, EntityType, EntityDirection }
