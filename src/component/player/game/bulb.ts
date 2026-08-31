import { EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { CHIPS } from '@/model/chips'
import { LeekWars } from '@/model/leekwars'
import { SHADOW_QUALITY, T, Texture } from './texture'

// Invocation Prototaxite (#1544, 2.50 — ex-Menhir, devenu « un truc vivant mais statique »).
// 13 = id du template d'invocation côté serveur (SummonTemplateRegistry), après les
// bulbes 1-8/11-12 et les plantes 9-10.
export const PROTOTAXITES_SUMMON_TEMPLATE = 13

class Bulb extends FightEntity {

	public static SCALE: number = 0.30

	public skin!: number
	declare public bulbName: string
	public heightAnim!: number

	// Plantes 2.50 (Piment, Maïs, Prototaxite) : entités enracinées, un seul visuel
	// (back = front), animation = rebond de scale (squash & stretch périodique),
	// et zone d'effet teintée affichée autour (sauf le Prototaxite).
	public plant: boolean = false
	public bounceX: number = 1
	public bounceY: number = 1
	public zoneColor: string = ''
	public zoneRange: number = 0
	private zoneArea: number[][] | null = null
	private zoneAreaCellId: number = -1

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.BULB, team, name)
		this.baseZ = -6
		this.z = this.baseZ
		this.bloodTex = T.leek_blood
	}

	public setSkin(skin: number) {
		this.bulbName = LeekWars.summonTemplates[skin]?.name ?? this.name
		this.skin = skin

		if (skin === 1) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/puny_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/puny_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 2) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/fire_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/fire_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 3) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/healer_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/healer_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 4) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/rocky_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/rocky_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 5) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/iced_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/iced_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 6) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/lightning_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/lightning_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 7) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/metallic_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/metallic_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 8) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/wizard_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/wizard_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 9) { // Maïs (plante 2.50) — un seul visuel, back = front
			this.bodyTexFront = T.get(this.game, 'image/bulb/corn_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/corn_back.png', true, SHADOW_QUALITY)
			this.setPlant('green') // zone de soin
		} else if (skin === 10) { // Piment (plante 2.50)
			this.bodyTexFront = T.get(this.game, 'image/bulb/chilli_pepper_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/chilli_pepper_back.png', true, SHADOW_QUALITY)
			this.setPlant('#f26304') // portée de tir
		} else if (skin === PROTOTAXITES_SUMMON_TEMPLATE) { // Prototaxite (2.50) — pas de zone
			this.bodyTexFront = T.get(this.game, 'image/bulb/prototaxites_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/prototaxites_back.png', true, SHADOW_QUALITY)
			this.setPlant('')
		} else if (skin === 11) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/tactician_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/tactician_bulb_back.png', true, SHADOW_QUALITY)
		} else if (skin === 12) {
			this.bodyTexFront = T.get(this.game, 'image/bulb/savant_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/savant_bulb_back.png', true, SHADOW_QUALITY)
		} else {
			// Skin inconnu (nouvelle invocation plus récente que le client) : repli
			// sur le bulbe chétif plutôt qu'un crash sur bodyTexFront undefined.
			this.bodyTexFront = T.get(this.game, 'image/bulb/puny_bulb_front.png', true, SHADOW_QUALITY)
			this.bodyTexBack = T.get(this.game, 'image/bulb/puny_bulb_back.png', true, SHADOW_QUALITY)
		}
		if (this.bodyTexFront.loaded) {
			this.baseHeight = this.bodyTexFront.texture.height * Bulb.SCALE + 10
			this.baseWidth = this.bodyTexFront.texture.width * Bulb.SCALE
			this.updateGrowth()
		} else {
			this.bodyTexFront.texture.addEventListener('load', () => {
				this.baseHeight = this.bodyTexFront.texture.height * Bulb.SCALE + 10
				this.baseWidth = this.bodyTexFront.texture.width * Bulb.SCALE
				this.updateGrowth()
			}, { once: true })
		}
	}

	// Marque l'entité comme plante 2.50. zoneColor vide = pas de zone (Prototaxite) ;
	// sinon la portée de la zone est déduite des puces de la plante dans les
	// données serveur (portée de tir du Piment, zone de soin du Maïs).
	private setPlant(zoneColor: string) {
		this.plant = true
		this.zoneColor = zoneColor
		this.zoneRange = 0
		if (zoneColor) {
			const template = LeekWars.summonTemplates[this.skin]
			if (template && template.chips) {
				for (const item of template.chips) {
					const chip = CHIPS[item]
					if (chip && chip.max_range > this.zoneRange) {
						this.zoneRange = chip.max_range
					}
				}
			}
		}
	}

	// Zone d'effet autour de la plante, recalculée quand elle change de cellule
	// (Inversion : une plante enracinée reste échangeable).
	public plantArea(): number[][] {
		if (!this.zoneArea || this.zoneAreaCellId !== this.cell!.id) {
			this.zoneAreaCellId = this.cell!.id
			this.zoneArea = this.game.createPlantAreaOutline(this.cell!, this.zoneRange)
		}
		return this.zoneArea
	}

	public update(dt: number) {
		super.update(dt)
		if (this.plant && !this.dead) {
			// Rebond de scale : petit squash & stretch périodique, pas de sprite-sheet.
			const b = Math.max(0, Math.sin(this.frame / 12))
			this.bounceY = 1 + 0.08 * b
			this.bounceX = 1 - 0.05 * b
		}
	}

	public frameTexture(_includeHat: boolean): Texture {
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		return texture.getScaledTexture(texture.texture.width * Bulb.SCALE)
	}

	public draw(ctx: CanvasRenderingContext2D) {
		super.draw(ctx)
		if (!this.dead) {
			// Draw shadow
			if (this.game.shadows) {
				this.drawShadow(ctx)
			}
			// Draw normal
			this.drawNormal(ctx)
		}
		super.endDraw(ctx)
	}

	public drawNormal(ctx: CanvasRenderingContext2D) {
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		this.drawBody(ctx, texture.texture)
	}

	public drawShadow(ctx: CanvasRenderingContext2D) {
		const texture = this.front ? this.bodyTexBack : this.bodyTexFront
		ctx.save()
		ctx.globalAlpha = SHADOW_ALPHA
		ctx.scale(1, -SHADOW_SCALE)
		ctx.translate(0, - this.z)
		ctx.rotate(-Math.PI / 4)
		this.drawBody(ctx, texture.shadow!)
		ctx.restore()
	}

	public drawBody(ctx: CanvasRenderingContext2D, texture: HTMLImageElement | HTMLCanvasElement) {
		if (texture == null) { return }
		ctx.save()
		if (this.flash > 0 && (Math.random() > 0.5 || this.flash < 2)) {
			ctx.globalCompositeOperation = 'lighter'
		}
		ctx.scale(this.direction * Bulb.SCALE * this.growth * this.bounceX, this.oscillation * Bulb.SCALE * this.growth * this.bounceY)
		// Body
		const width = this.bodyTexFront.texture.width
		const height = this.bodyTexFront.texture.height
		const y = height * (this.deadAnim - 1)
		// Rectangle source dégénéré (image pas encore chargée → width 0, ou deadAnim == 1
		// en début de blooming → hauteur 0) : drawImage lève IndexSizeError sur Safari. On
		// saute le rendu de cette frame. (#4312)
		const sourceHeight = texture.height * (1 - this.deadAnim)
		if (texture.width > 0 && sourceHeight > 0) {
			ctx.drawImage(texture, 0, 0, texture.width, sourceHeight, -width / 2, y, width, -y)
		}

		ctx.restore()
	}
}

export { Bulb }
