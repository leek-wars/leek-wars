import { EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { LeekWars } from '@/model/leekwars'
import { summonImage } from '@/model/summon'
import { SHADOW_QUALITY, T, Texture } from './texture'

// Invocation Prototaxite (#1544, 2.50 — ex-Menhir, devenu « un truc vivant mais statique »).
// 13 = id du template d'invocation côté serveur (SummonTemplateRegistry), après les
// bulbes 1-8/11-12 et les plantes 9-10.
export const PROTOTAXITE_SUMMON_TEMPLATE = 13

class Bulb extends FightEntity {

	public static SCALE: number = 0.30
	// Les plantes sont plus imposantes qu'un bulbe : enracinées, ce sont des
	// pièces de terrain plus que des familiers. 0,45 -> 0,55 le 10/09 (demande de
	// Pierre) : le Maïs passe de 68 à 83 px de haut, le Piment de 65 à 80, le
	// Prototaxite de 79 à 97, contre 38 à 66 px pour un bulbe. Tout le rendu suit
	// cette seule valeur (ombre, pousse, rebond, texture mise à l'échelle).
	public static PLANT_SCALE: number = 0.55

	public skin!: number
	declare public bulbName: string
	public heightAnim!: number

	// Plantes 2.50 (Piment, Maïs, Prototaxite) : entités enracinées, un seul visuel
	// (back = front), immobiles (pas de respiration ni de rebond périodique),
	// et zone d'effet teintée affichée autour (sauf le Prototaxite).
	public plant: boolean = false
	public spriteScale: number = Bulb.SCALE
	public bounceX: number = 1
	public bounceY: number = 1
	public zoneColor: string = ''
	public zoneRange: number = 0
	// Éveil : intensité de la lueur de zone, de 1 à 0. Posée à 1 quand la plante se
	// réveille, résorbée par update() — c'est ce qui fait clignoter le losange une
	// fois, pour qu'on voie QUELLE plante répond.
	public awakeGlow: number = 0
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
			this.bodyTexFront = T.get(this.game, summonImage('corn'), true, SHADOW_QUALITY)
			this.bodyTexBack = this.bodyTexFront
			this.setPlant('#2fe34a', 8) // zone de soin
		} else if (skin === 10) { // Piment (plante 2.50)
			this.bodyTexFront = T.get(this.game, summonImage('chilli_pepper'), true, SHADOW_QUALITY)
			this.bodyTexBack = this.bodyTexFront
			this.setPlant('#ff4d0a', 8) // portée de tir
		} else if (skin === PROTOTAXITE_SUMMON_TEMPLATE) { // Prototaxite (2.50) — pas de zone
			this.bodyTexFront = T.get(this.game, summonImage('prototaxite'), true, SHADOW_QUALITY)
			this.bodyTexBack = this.bodyTexFront
			this.setPlant('', 11)
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
			this.baseHeight = this.bodyTexFront.texture.height * this.spriteScale + 10
			this.baseWidth = this.bodyTexFront.texture.width * this.spriteScale
			this.updateGrowth()
		} else {
			this.bodyTexFront.texture.addEventListener('load', () => {
				this.baseHeight = this.bodyTexFront.texture.height * this.spriteScale + 10
				this.baseWidth = this.bodyTexFront.texture.width * this.spriteScale
				this.updateGrowth()
			}, { once: true })
		}
	}

	// Marque l'entité comme plante 2.50. zoneColor vide = pas de zone (Prototaxite) ;
	// sinon la zone affichée est fixée à 3 cases de rayon. Couleurs franches
	// (vert vif, orange rouge) : le `green` CSS (#008000) et l'orange d'avant
	// s'éteignaient sous la faible opacité du losange au sol.
	// `sink` : de combien la plante s'enfonce dans sa case, en pixels. Un z NÉGATIF
	// descend le sprite à l'écran — le poireau lui-même vit à -5, un sprite posé à 0
	// a l'air de flotter au-dessus du losange. Plus la plante est haute, plus il faut
	// l'enfoncer pour qu'elle ait l'air enracinée : le Prototaxite, colonne de 97 px,
	// est le plus concerné (retours de Pierre du 10/09 : 8 px pour le Maïs et le
	// Piment, 11 pour le Prototaxite — 16 le mettait trop bas).
	private setPlant(zoneColor: string, sink: number = 8) {
		this.plant = true
		this.spriteScale = Bulb.PLANT_SCALE
		this.baseZ = -sink
		this.z = -sink
		this.zoneColor = zoneColor
		this.zoneRange = zoneColor ? 3 : 0
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
		// Pas d'animation permanente (une plante est immobile), mais bounceX/Y
		// restent pilotables ponctuellement (impulsion de croissance de
		// Maturation) : l'impulsion se résorbe d'elle-même.
		if (!this.dead) {
			this.bounceX += (1 - this.bounceX) * Math.min(1, 0.1 * dt)
			this.bounceY += (1 - this.bounceY) * Math.min(1, 0.1 * dt)
			if (this.awakeGlow > 0) {
				this.awakeGlow = Math.max(0, this.awakeGlow - 0.04 * dt)
			}
		}
	}

	public frameTexture(_includeHat: boolean): Texture {
		const texture = this.front ? this.bodyTexFront : this.bodyTexBack
		return texture.getScaledTexture(texture.texture.width * this.spriteScale)
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
		// L'ombre est projetée SUR LE SOL : elle doit rester au niveau de la case,
		// quel que soit le décalage vertical du corps. Ce repère est déjà retourné et
		// écrasé par SHADOW_SCALE, donc un `translate(0, -z)` ne rattrape que
		// -z × SHADOW_SCALE de l'écran, soit la moitié du décalage : il faut diviser
		// par SHADOW_SCALE pour l'annuler exactement. Le bulbe garde la version
		// historique (à moitié rattrapée), qui fait justement flotter son ombre sous
		// lui ; une plante enfoncée de 11 px, elle, avait son ombre 11 px trop bas.
		ctx.translate(0, - this.z / (this.plant ? SHADOW_SCALE : 1))
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
		// Une plante ne respire pas : oscillation figée à 1.
		const oscillation = this.plant ? 1 : this.oscillation
		ctx.scale(this.direction * this.spriteScale * this.growth * this.bounceX, oscillation * this.spriteScale * this.growth * this.bounceY)
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
