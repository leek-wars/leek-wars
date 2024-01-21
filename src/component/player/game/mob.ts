import { EntityDirection, EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { SHADOW_QUALITY, T, Texture } from './texture'
import { WhiteWeaponAnimation } from "./weapons"
import { i18n } from "@/model/i18n"
import { Cell } from "@/model/cell"

const handSize = 20
const handSize2 = handSize / 2

export class MobTemplate {
	id!: number
	name!: string
	hat!: number | null
	weapon!: number | null
	baseZ!: number
	type!: string
	hand!: Texture | null
	scale!: number
	weaponCX!: number
	blood!: Texture | null
}

export const MOBS = {
	"leek": { id: 0, name: "leek", hat: null, weapon: null, baseZ: -4, type: 'mob', life: 2000, hand: T.leek_hand, scale: 1.0, weaponCX: 0, blood: T.leek_blood },
	"nasu_samurai": { id: 1, name: "nasu_samurai", hat: null, weapon: 408, baseZ: -16, type: 'mob', life: 2000, hand: T.nasu_hand, scale: 1.0, weaponCX: 0, blood: T.blood_purple },
	"nasu_seito": { id: 13, name: "nasu_seito", hat: null, weapon: null, baseZ: -6, type: 'mob', life: 500, hand: T.nasu_hand, scale: 1.0, weaponCX: 0, blood: T.blood_purple },
	"nasu_warrior": { id: 14, name: "nasu_warrior", hat: null, weapon: 107, baseZ: -6, type: 'mob', life: 1000, hand: T.nasu_hand, scale: 1.0, weaponCX: 20, blood: T.blood_purple },
	"nasu_ronin": { id: 15, name: "nasu_ronin", hat: null, weapon: 187, baseZ: -6, type: 'mob', life: 1200, hand: T.nasu_hand, scale: 1.0, weaponCX: 20, blood: T.blood_purple },
	"fennel_king": { id: 2, name: "fennel_king", hat: 5, weapon: 409, baseZ: -16, type: 'mob', life: 10000, hand: T.leek_hand, scale: 1.0, weaponCX: 0, blood: T.blood_white },
	"fennel_knight": { id: 16, name: "fennel_knight", hat: null, weapon: 277, baseZ: -10, type: 'mob', life: 6000, hand: T.leek_hand, scale: 1.0, weaponCX: 15, blood: T.blood_white },
	"fennel_squire": { id: 17, name: "fennel_squire", hat: null, weapon: null, baseZ: -6, type: 'mob', life: 3000, hand: T.leek_hand, scale: 1.0, weaponCX: 0, blood: T.blood_white },
	"fennel_scribe": { id: 18, name: "fennel_scribe", hat: null, weapon: 278, baseZ: -15, type: 'mob', life: 8000, hand: T.leek_hand, scale: 1.0, weaponCX: 25, blood: T.blood_white },
	"graal": { id: 4, name: "graal", hat: null, weapon: null, baseZ: -8, type: 'object', life: 1000, hand: null, scale: 0.8, weaponCX: 0, blood: null },
	"red_crystal": { id: 5, name: "red_crystal", hat: null, weapon: null, baseZ: -2, type: 'object', life: 1, hand: null, scale: 0.8, weaponCX: 0, blood: null },
	"green_crystal": { id: 6, name: "green_crystal", hat: null, weapon: null, baseZ: -2, type: 'object', life: 1, hand: null, scale: 0.8, weaponCX: 0, blood: null },
	"blue_crystal" : { id: 7, name: "blue_crystal", hat: null, weapon: null, baseZ: -2, type: 'object', life: 1, hand: null, scale: 0.8, weaponCX: 0, blood: null },
	"yellow_crystal": { id: 8, name: "yellow_crystal", hat: null, weapon: null, baseZ: -2, type: 'object', life: 1, hand: null, scale: 0.8, weaponCX: 0, blood: null },
	"evil_pumpkin": { id: 3, name: "evil_pumpkin", hat: null, weapon: 410, baseZ: -16, type: 'mob', life: 17000, hand: T.pumpkin_hand, scale: 1.0, weaponCX: 30, blood: T.blood_orange },
	"turban": { id: 9, name: "turban", hat: null, weapon: null, baseZ: -8, type: 'mob', life: 11000, hand: T.pumpkin_hand, scale: 1.0, weaponCX: 0, blood: T.blood_orange },
	"warty": { id: 10, name: "warty", hat: null, weapon: null, baseZ: -8, type: 'mob', life: 13000, hand: T.pumpkin_hand, scale: 1.0, weaponCX: 0, blood: T.blood_orange },
	"hubbard": { id: 11, name: "hubbard", hat: null, weapon: null, baseZ: -8, type: 'mob', life: 12000, hand: T.leek_hand, scale: 1.0, weaponCX: 0, blood: T.blood_white },
	"offspring": { id: 12, name: "offspring", hat: null, weapon: null, baseZ: -8, type: 'mob', life: 6000, hand: T.pumpkin_hand, scale: 1.0, weaponCX: 0, blood: T.blood_orange },
} as {[key: string]: MobTemplate}

class Mob extends FightEntity {

	template!: MobTemplate
	beam!: Texture
	beamDXY: {x: number, y: number} | null = null
	beamAngle: number | null = null
	beamFront: boolean = false

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.MOB, team, name)

		this.template = MOBS[name] || MOBS['leek']
		this.baseZ = this.template.baseZ
		this.scale = 0.5 * this.template.scale
		this.bloodTex = this.template.blood
		if (this.bloodTex) this.bloodTex.load(game)
		this.living = this.template.type !== 'object'

		this.bodyTexFront = T.get(this.game, 'image/mob/' + this.name + '.png', true, SHADOW_QUALITY)
		this.bodyTexBack = T.get(this.game, 'image/mob/' + this.name + '_back.png', true, SHADOW_QUALITY)

		if (this.name === 'red_crystal') {
			this.beam = T.m_laser_bullet.load(this.game)
			this.beamDXY = {x: 0, y: -1}
			this.beamAngle = -Math.PI / 6.7
			this.beamFront = false
		}
		if (this.name === 'green_crystal') {
			this.beam = T.green_beam.load(this.game)
			this.beamDXY = {x: 0, y: 1}
			this.beamAngle = Math.PI - Math.PI / 6.7
			this.beamFront = true
		}
		if (this.name === 'blue_crystal') {
			this.beam = T.b_laser_bullet.load(this.game)
			this.beamDXY = {x: -1, y: 0}
			this.beamAngle = -Math.PI + Math.PI / 6.7
			this.beamFront = false
		}
		if (this.name === 'yellow_crystal') {
			this.beam = T.j_laser_bullet.load(this.game)
			this.beamDXY = {x: 1, y: 0}
			this.beamAngle = Math.PI / 6.7
			this.beamFront = true
		}

		this.translatedName = i18n.t('entity.' + this.name) as string

		if (this.bodyTexFront.loaded) {
			this.baseHeight = this.bodyTexFront.texture.height
			this.baseWidth = this.bodyTexFront.texture.width
			this.updateGrowth()
		} else {
			this.bodyTexFront.texture.addEventListener('load', () => {
				this.baseHeight = this.bodyTexFront.texture.height
				this.baseWidth = this.bodyTexFront.texture.width
				this.updateGrowth()
			}, { once: true })
		}

		if (this.template.hat) {
			super.setHat(this.template.hat)
		}

		if (this.template.hand) {
			this.handTex = this.template.hand.load(this.game)
		}
	}

	public update(dt: number): void {
		super.update(dt)
		this.handPos = Math.cos(this.frame / 17 - Math.PI / 6) * 2.5
		this.handPos += (this.front ? 0 : 10)
		// Update weapon
		if (this.weapon != null) {
			this.weapon.update(dt)
		}
	}

	public frameTexture(includeHat: boolean): Texture {

		const canvas = document.createElement('canvas')
		canvas.width = this.baseWidth
		canvas.height = this.baseHeight + this.baseZ
		const textureCtx = canvas.getContext('2d')!
		const texture = new Texture('')
		texture.texture = canvas
		texture.ctx = textureCtx

		// Debug
		// textureCtx.strokeStyle = 'red'
		// textureCtx.lineWidth = 2
		// textureCtx.strokeRect(0, 0, canvas.width, canvas.height)

		const savedScale = this.scale
		const savedGrowth = this.growth
		this.scale = 1
		this.growth = 1

		textureCtx.save()
		textureCtx.translate(canvas.width / 2, canvas.height - this.baseZ)
		textureCtx.scale(this.scale, this.scale)
		this.drawNormal(textureCtx)
		textureCtx.restore()

		this.scale = savedScale
		this.growth = savedGrowth

		return texture
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		super.draw(ctx)

		if (this.beam && !this.beamFront) {
			this.drawBeam(ctx)
		}

		if (!this.dead) {

			ctx.save()
			ctx.scale(this.scale, this.scale)

			// Draw shadow
			if (this.game.shadows && !this.dead) {
				this.drawShadow(ctx)
			}
			// Draw normal
			ctx.scale(this.direction, 1)
			this.drawNormal(ctx)


			/*
			if (this.weapon) {
				// Center (debug)
				ctx.save()
				ctx.translate(this.weapon.cx, -this.weapon.cz - this.handPos)
				ctx.fillStyle = 'red'
				ctx.beginPath();
				ctx.arc(0, 0, 7, 0, 2 * Math.PI);
				ctx.closePath();
				ctx.fill();
				ctx.restore()
			}
			*/

			ctx.restore()
		}

		if (this.beam && this.beamFront) {
			this.drawBeam(ctx)
		}

		super.endDraw(ctx)

		/*
		if (this.weapon && !(this.weapon instanceof WhiteWeaponAnimation)) {
			// Shoot point (debug)
			const coord = this.weapon.getShootPoint(this.angle, this.handPos)
			const sx = (this.ox + coord.x * this.scale * this.direction ) * this.game.ground.scale
			const sy = (this.oy - this.z + (coord.y - coord.z) * this.scale) * this.game.ground.scale
			ctx.fillStyle = 'blue'
			ctx.beginPath();
			ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();
		}
		*/
	}

	public drawBeam(ctx: CanvasRenderingContext2D) {
		let length = 0
		let current_cell = this.cell
		for (let r = 0; r < 50; ++r) {
			current_cell = this.game.ground.field.next_cell(current_cell, this.beamDXY!.x, this.beamDXY!.y)
			if (!current_cell || current_cell.obstacle || current_cell.entity) { break }
			length++
		}
		const width = (length + 1) * this.game.ground.tileSize * 0.65

		ctx.save()
		ctx.translate(0, -15)
		ctx.rotate(this.beamAngle!)
		ctx.drawImage(this.beam.texture, 0, -13, width, 26)
		ctx.restore()
	}

	public drawNormal(ctx: CanvasRenderingContext2D): void {
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		const hatTexture = this.front ? this.hatFront : this.hatBack

		if (this.weapon != null && !this.dead) {
			// Weapon !
			if (this.front) {
				this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
				this.drawWeapon(ctx, this.weapon.texture.texture)
			} else {
				this.drawWeapon(ctx, this.weapon.texture.texture)
				this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
			}
		} else {
			// No weapon
			const front = this.front ? 1 : -1
			if (!this.dead && this.template.type === 'mob') {
				ctx.drawImage(this.handTex.texture, 15 * front - 7, -32 - this.handPos - 3, handSize * 0.8, handSize * 0.8) // back hand
			}
			this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
			if (!this.dead && this.template.type === 'mob') {
				ctx.drawImage(this.handTex.texture, -18 * front - 7, -32 - this.handPos + 1, handSize, handSize) // front hand
			}
		}
	}

	public drawWeapon(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, shadow: boolean = false): void {
		if (!this.weapon) { return  }

		ctx.save()

		if (shadow) {
			ctx.scale(this.direction, 1)
		}

		// Translate to center
		ctx.translate(this.weapon.cx + this.template.weaponCX, -this.weapon.cz - this.handPos)

		// Rotate
		if (shadow) {
			ctx.rotate(this.angle / 2)
		} else {
			ctx.rotate(this.angle - this.weapon.recoilAngle * (Math.PI / 100))
		}

		if (this.weapon instanceof WhiteWeaponAnimation) {
			this.weapon.draw(ctx, texture, this.front)
		} else {
			// Translate to the weapon texture origin
			ctx.translate(this.weapon.x - this.weapon.recoil, this.weapon.z)
			// Draw the weapon
			ctx.drawImage(texture, 0, 0, this.weapon.w, this.weapon.h)
		}
		// Draw hands
		if (!shadow && this.template.type === 'mob') {
			ctx.drawImage(this.handTex.texture, this.weapon.mx1 - handSize2, this.weapon.mz1 - handSize2, handSize, handSize)
			ctx.drawImage(this.handTex.texture, this.weapon.mx2 - handSize2, this.weapon.mz2 - handSize2, handSize, handSize)
		}
		ctx.restore()
	}

	public drawShadow(ctx: CanvasRenderingContext2D): void {

		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		const hatTexture = this.front ? this.hatBack : this.hatFront

		ctx.save()
		ctx.scale(1, -SHADOW_SCALE)
		ctx.rotate(-Math.PI / 4)
		ctx.globalAlpha = SHADOW_ALPHA

		ctx.translate(0, - this.z)

		if (this.weapon != null && (this.orientation === EntityDirection.SOUTH || this.orientation === EntityDirection.NORTH)) {
			this.drawBody(ctx, texture.shadow!, hatTexture ? hatTexture.shadow : null)
			if (!this.dead) {
				this.drawWeapon(ctx, this.weapon.texture.shadow!, true)
			}
		} else {
			this.drawBody(ctx, texture.shadow!, hatTexture ? hatTexture.shadow : null)
		}

		ctx.restore()
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement, hatTexture: HTMLImageElement | HTMLCanvasElement | null): void {

		if (texture == null) { return }

		ctx.save()

		ctx.scale(this.growth, this.oscillation * this.growth)

		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}

		const leekWidth = this.bodyTexFront.texture.width
		const leekHeight = this.bodyTexFront.texture.height

		// Body
		const y = -leekHeight + (this.dead ? this.baseZ / this.scale : 0)
		ctx.drawImage(texture, 0, 0, texture.width, texture.height, -leekWidth / 2, y, leekWidth, leekHeight)

		// Hat
		if (hatTexture) {
			const hatWidth = leekHeight * 0.7 * this.hatTemplate.width
			const hatHeight = hatWidth * (hatTexture.height / hatTexture.width)
			ctx.drawImage(hatTexture, -hatWidth / 2, -leekHeight, hatWidth, hatHeight)
		}
		ctx.restore()
	}

	public useWeapon(cell: Cell, targets: FightEntity[], result: number): number {

		if (this.weapon == null) {
			return 0 // Il n'y aura pas d'anim
		}

		const pos = this.game.ground.field.cellToXY(cell)
		const x = pos.x
		const y = pos.y

		// Angle
		const south = this.y > y
		const east = this.x > x

		this.setOrientation(south ? (east ? EntityDirection.NORTH : EntityDirection.EAST) : (east ? EntityDirection.WEST : EntityDirection.SOUTH))

		if (result === 2) {
			this.addCritical()
		}

		this.angle = Math.atan2(Math.abs(this.x - x), (this.y - y) / 2) - Math.PI / 2

		const position = this.game.ground.xyToXYPixels(x, y)

		return this.weapon.shoot(this.ox, this.oy - this.z, this.handPos, this.angle, this.direction, position, targets, this, cell, this.scale)
	}
}

export { Mob }
