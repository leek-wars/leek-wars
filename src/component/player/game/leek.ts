import { DamageType, EntityDirection, EntityType, FightEntity } from "@/component/player/game/entity"
import { Game, SHADOW_ALPHA, SHADOW_SCALE } from '@/component/player/game/game'
import { isDrawable, SHADOW_QUALITY, T, Texture } from '@/component/player/game/texture'
import { WeaponAnimation, WhiteWeaponAnimation } from '@/component/player/game/weapons'
import { Cell } from '@/model/cell'
import { LEEK_FACES } from "@/model/leek"
import { LeekWars } from '@/model/leekwars'
import { BakedMemo, BakedSprite, BakedSpriteCache, blitBaked, CAN_BAKE, memoMatches, ready } from './baked-sprite'
import { S } from './sound'

const handSize = 20

/**
 * Silhouettes d'arme pré-composées, mains comprises et DÉJÀ TOURNÉES.
 *
 * Une arme est dessinée dans un repère tourné (l'angle de visée) ; un
 * `drawImage` tourné coûte une dizaine de fois un blit aligné sur les axes. Sur
 * un combat à 30 poireaux cela fait une quinzaine de dessins par image, qu'on
 * remplace par un seul blit — mains comprises, ce qui en retire deux de plus.
 *
 * Ce qui rend le cache payant : l'angle de visée ne change qu'à l'attaque, il
 * persiste ensuite d'une image à l'autre. Mesuré sur quinze secondes de combat,
 * 13 573 dessins d'arme tournés pour 195 silhouettes distinctes — 99 % de
 * réutilisation, et moins d'une cuisson par seconde en cours de partie.
 *
 * Gain mesuré (combat de prod 53704146, builds appariés dans les deux ordres) :
 * +2 % d'images par seconde à CPU ÷6, +5 % à ÷10, p99 −7 %. Netteté inchangée
 * (énergie de gradient sur l'arme agrandie, 83,3 contre 83,2 au dessin direct).
 *
 * ⚠️ Les mains sont cuites dans la silhouette, PAS dans `weapon.texture` : cette
 * texture sert aussi à faire tomber l'arme à la mort du poireau, qui partirait
 * alors avec des mains collées dessus.
 */
const WEAPON_SPRITES = new BakedSpriteCache(220)

/**
 * Silhouette d'arme (mains comprises) pour la matrice courante — rotation, échelle
 * et miroir compris : on prend la matrice telle quelle plutôt que d'en décomposer
 * les facteurs, ce qui serait faux pour un poireau tourné vers la gauche. `null`
 * tant qu'elle n'est pas prête : l'appelant dessine directement.
 */
function weaponSprite(leek: Leek, weapon: WeaponAnimation, m: DOMMatrix): BakedSprite | null {
	if (!memoMatches(leek.weaponSprite, weapon, m)) {
		const tex = weapon.texture.texture
		const hand = leek.handTex.texture
		if (!isDrawable(tex) || !isDrawable(hand)) { return null }
		const hs2 = handSize / 2
		leek.weaponSprite = WEAPON_SPRITES.lookup(weapon.texture.path + '|' + leek.handTex.path, weapon, m, [
			[weapon.x, weapon.z, weapon.w, weapon.h],
			[weapon.x + weapon.mx1 - hs2, weapon.z + weapon.mz1 - hs2, handSize, handSize],
			[weapon.x + weapon.mx2 - hs2, weapon.z + weapon.mz2 - hs2, handSize, handSize],
		], (ctx) => {
			ctx.translate(weapon.x, weapon.z)
			ctx.drawImage(tex, 0, 0, weapon.w, weapon.h)
			ctx.drawImage(hand, weapon.mx1 - hs2, weapon.mz1 - hs2, handSize, handSize)
			ctx.drawImage(hand, weapon.mx2 - hs2, weapon.mz2 - hs2, handSize, handSize)
		})
	}
	return ready(leek.weaponSprite)
}

/**
 * La respiration du poireau (± 2,5 % sur sa hauteur, cf. `oscillation`) étirait
 * aussi son ombre. Elle agit AVANT la rotation de l'ombre, donc le long d'une
 * diagonale à l'écran : une ombre cuite déjà tournée (cf. SHADOW_SPRITES) ne peut
 * pas la suivre par une simple mise à l'échelle. Les ombres ne respirent donc
 * plus, ce qui permet de les cuire.
 * `true` leur rend la respiration et les repasse en dessin direct, tourné — le
 * rendu et le coût d'avant. Pour la garder SANS ce coût : cuire une silhouette
 * par palier d'oscillation (6 à 8 paliers suffisent sur ± 2,5 %).
 */
const SHADOW_BREATHING = false

/**
 * Ombres du corps cuites DÉJÀ TOURNÉES, à leur taille finale à l'écran.
 *
 * L'ombre est aplatie puis tournée d'un huitième de tour (drawShadow) : un
 * `drawImage` tourné par poireau et par image. Comme pour les silhouettes d'arme,
 * on la cuit une fois sous la transformation complète et on la pose en copie 1:1
 * à coordonnées entières. Sans la respiration, cette transformation ne change
 * qu'au zoom ou au redimensionnement : une silhouette par face et par poireau.
 *
 * Mesuré sous Firefox (combat de prod 53704146, 20 poireaux, image figée, A/B
 * alterné dans la page, témoin A/A à zéro) : −0,6 ms par image sur 4,8, 16 blocs
 * gagnés sur 16. Netteté des bords d'ombre à 99,9 % du dessin direct, décalage
 * d'au plus un demi-pixel.
 */
const SHADOW_SPRITES = new BakedSpriteCache(200)
/** Un canevas n'a pas de nom : on lui donne un numéro pour la clé. */
const SHADOW_SOURCE_IDS = new WeakMap<HTMLCanvasElement, number>()
let shadowSourceCount = 0

/**
 * Ombre `source` posée sur le rectangle (x, y, w, h) du repère courant, pour la
 * matrice courante. Un poireau pose deux ombres par image (le corps, puis l'arme) :
 * chacune a SON emplacement de mémo, sinon elles se l'arracheraient à chaque image.
 */
function shadowSprite(leek: Leek, slot: 'shadowSprite' | 'weaponShadowSprite', source: HTMLCanvasElement, x: number, y: number, w: number, h: number, m: DOMMatrix): BakedSprite | null {
	if (!memoMatches(leek[slot], source, m)) {
		let id = SHADOW_SOURCE_IDS.get(source)
		if (id === undefined) {
			id = ++shadowSourceCount
			SHADOW_SOURCE_IDS.set(source, id)
		}
		leek[slot] = SHADOW_SPRITES.lookup(id + '|' + x + '|' + y + '|' + w + '|' + h, source, m, [[x, y, w, h]], (ctx) => {
			ctx.drawImage(source, 0, 0, source.width, source.height, x, y, w, h)
		})
	}
	return ready(leek[slot])
}

/** Ombres du corps et du chapeau réunies (cf. Leek.drawBodyShadow). */
interface ShadowSilhouette {
	canvas: HTMLCanvasElement
	/** Ombre du chapeau cuite dedans : si elle change, on recuit. */
	hat: HTMLCanvasElement
	/** Rectangle de pose, dans le repère de drawBody. */
	x: number
	y: number
	w: number
	h: number
}

class Leek extends FightEntity {

	// public weapon_name: string | null = null
	public skin!: number
	public metal!: boolean
	public face!: number
	public heightAnim: number = 0
	public fish: boolean = false
	public weaponSprite: BakedMemo | null = null
	public shadowSprite: BakedMemo | null = null
	public weaponShadowSprite: BakedMemo | null = null
	private shadowSilhouettes = new Map<HTMLCanvasElement, ShadowSilhouette>()

	constructor(game: Game, team: number, level: number, name: string) {
		super(game, EntityType.LEEK, team, name)
		this.baseZ = -5
		this.z = this.baseZ
	}

	public setSkin(skin: number, appearance: number, hat: number | null = null, metal: boolean = false, face: number = 0) {

		super.setHat(hat)

		if (typeof LeekWars.skins[skin] === 'undefined') { skin = 1 }

		this.scale = 0.65 - appearance * 0.01
		this.skin = skin
		this.metal = metal
		this.face = face
		const face_param = face === 0 ? '' : LEEK_FACES[face]
		this.bodyTexFront = T.get(this.game, "image/leek/svg/leek_" + appearance + "_front_" + LeekWars.skins[skin] + (metal ? '_metal' : '') + face_param + ".svg", true, SHADOW_QUALITY, LeekWars.SERVER)
		this.bodyTexBack = T.get(this.game, "image/leek/svg/leek_" + appearance + "_back_" + LeekWars.skins[skin] + (metal ? '_metal' : '') + face_param + ".svg", true, SHADOW_QUALITY, LeekWars.SERVER)

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

		const handTex = this.skin === 15 ? T.leek_hand_gold : T.leek_hand
		this.handTex = handTex.load(this.game)
		this.bloodTex = T.leek_blood.load(this.game)
		S.move.load(this.game)
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

	public frameTexture(includeHat: boolean): Texture {

		const canvas = document.createElement('canvas')
		canvas.width = this.baseWidth
		const hatTexture = this.front ? this.hatFront : this.hatBack
		const height = this.baseHeight + (this.hatTemplate ? ((this.bodyTexFront.texture.width * this.hatTemplate.width) * (hatTexture.texture.height / hatTexture.texture.width)) * (1 - this.hatTemplate.height) : 0)
		canvas.height = height * this.oscillation
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
		textureCtx.translate(canvas.width / 2, canvas.height)
		textureCtx.scale(this.scale * this.direction, this.scale)
		const bodyTexture = this.front ? this.bodyTexFront : this.bodyTexBack
		this.drawBody(textureCtx, bodyTexture.texture, includeHat && hatTexture ? hatTexture.texture : null)
		textureCtx.restore()

		this.scale = savedScale
		this.growth = savedGrowth

		return texture
	}

	public kill(animation: boolean, damageType: DamageType, dx: number, dy: number) {
		super.kill(animation, damageType, dx, dy)

		// console.log("kill", "dx", dx, "dy", dy)

		if (animation) {
			// Throw hat
			if (this.hat && damageType === DamageType.DEFAULT) {
				const leekWidth = this.bodyTexFront.texture.width
				const height = this.bodyTexFront.texture.height
				const hatX = -(leekWidth / 25)
				const hatTexture = this.front ? this.hatFront : this.hatBack
				const hatWidth = leekWidth * this.hatTemplate.width
				const hatHeight = hatWidth * (hatTexture.texture.height / hatTexture.texture.width)
				const hatZ = height - hatHeight * this.hatTemplate.height + hatHeight / 2
				const scale = this.scale * this.growth * leekWidth * this.hatTemplate.width / hatTexture.texture.width
				const hdx = dx * 1.5 + Math.random() * 2 - 1
				const hdy = dy * 1.5 + Math.random() * 2 - 1
				const hdz = Math.random() * 2
				// const dx = 0
				// const dy = 0
				// const dz = 0
				const rotation = Math.random() * 0.02 - 0.01
				this.game.particles.addGarbage(this.ox + hatX * this.scale * this.growth, this.oy, hatZ * this.scale * this.growth, hdx, hdy, hdz, hatTexture, this.direction, rotation, scale, 0, 70)
			}
			// Throw weapon
			if (this.weapon) {
				const wdx = dx * 1.5
				const wdy = dy * 1.5
				const dz = 2 + Math.random() * 3
				const rotation = Math.random() * 0.04 - 0.02
				const angle = this.weapon instanceof WhiteWeaponAnimation ? (this.direction === 1 ? -Math.PI / 3 : Math.PI / 3) : (this.direction === 1 ? this.angle : -this.angle)
				const cos = Math.cos(this.angle)
				const sin = Math.sin(this.angle)
				const cx = this.weapon.x + this.weapon.w / 2
				const cz = this.weapon.z + this.weapon.h / 2
				const x = (this.weapon.cx + cx * cos - cz * sin) * this.direction
				const y = this.weapon.cz - cx * sin + cz * cos
				const z = Math.max(1, this.handPos)
				const scale = this.weapon.w / this.weapon.texture.texture.width
				this.game.particles.addGarbage(this.ox + x * this.scale, this.oy - y * this.scale, z * this.scale, wdx, wdy, dz, this.weapon.texture, this.direction, rotation, this.scale * scale, angle, 70)
			}
		}
	}

	public draw(ctx: CanvasRenderingContext2D): void {
		super.draw(ctx)

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
			if (!this.dead) {
				ctx.drawImage(this.handTex.texture, 15 * front - 7, -32 - this.handPos - 3, handSize * 0.8, handSize * 0.8) // back hand
			}
			this.drawBody(ctx, texture.texture, hatTexture ? hatTexture.texture : null)
			if (!this.dead) {
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
		ctx.translate(this.weapon.cx, -this.weapon.cz - this.handPos)

		// Rotate
		if (shadow) {
			ctx.rotate(this.angle / 2)
		} else {
			ctx.rotate(this.angle - this.weapon.recoilAngle * (Math.PI / 100))
		}

		// Silhouette pré-composée (cf. WEAPON_SPRITES) : arme et mains déjà
		// tournées, posées en un seul blit aligné sur les axes. Écartée pendant le
		// recul d'un tir (l'arme recule et pivote image par image, chaque position
		// serait une silhouette de plus) et pour les armes blanches, dont
		// l'animation applique ses propres rotations. Une transparence ou un filtre
		// l'écartent aussi : appliqués une fois à la silhouette entière, ils ne
		// donnent pas le même rendu qu'appliqués à l'arme puis aux mains, qui se
		// recouvrent.
		const weapon = this.weapon
		const anime = weapon.recoil !== 0 || weapon.recoilAngle !== 0
		const bakeable = CAN_BAKE && !anime && ctx.filter === 'none' && !(weapon instanceof WhiteWeaponAnimation)
		if (!shadow && bakeable && ctx.globalAlpha === 1) {
			const m = ctx.getTransform()
			const sprite = weaponSprite(this, weapon, m)
			if (sprite) {
				ctx.save()
				blitBaked(ctx, sprite, m)
				ctx.restore()
				ctx.restore()
				return
			}
		}

		// Ombre de l'arme, cuite déjà tournée (cf. SHADOW_SPRITES) : elle suit l'angle de
		// visée, qui ne change qu'à l'attaque. Mêmes exclusions que la silhouette. L'ombre
		// est une seule image, sans les mains : sa transparence se pose au blit.
		if (shadow && bakeable && texture instanceof HTMLCanvasElement && texture.width > 0 && texture.height > 0) {
			const m = ctx.getTransform()
			const sprite = shadowSprite(this, 'weaponShadowSprite', texture, weapon.x, weapon.z, weapon.w, weapon.h, m)
			if (sprite) {
				blitBaked(ctx, sprite, m)
				ctx.restore()
				return
			}
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
		if (!shadow) {
			this.drawHand(ctx, this.weapon.mx1, this.weapon.mz1)
			this.drawHand(ctx, this.weapon.mx2, this.weapon.mz2)
		}
		ctx.restore()
	}

	/**
	 * Une main est un DISQUE : la faire tourner avec l'arme ne change pas un
	 * pixel. Or, dessinée dans le repère tourné de l'arme, elle payait une
	 * rotation — 85 µs sous Firefox contre 2,5 pour un blit aligné sur les axes,
	 * et il y en a deux par poireau armé, soit trente par image sur un combat à
	 * trente poireaux. On lit donc sa position dans la matrice, et on la pose
	 * hors du repère tourné, à sa taille exacte pour rester un blit 1:1.
	 *
	 * ⚠️ On ne peut pas simplement annuler la rotation par `rotate(-angle)` :
	 * un poireau tourné vers la gauche porte un miroir (`scale(direction, 1)`),
	 * et le produit d'un miroir et d'une rotation ne se défait pas ainsi.
	 */
	private drawHand(ctx: CanvasRenderingContext2D, x: number, z: number): void {
		ctx.save()
		ctx.translate(x, z)
		const m = ctx.getTransform()
		ctx.restore()
		const taille = handSize * Math.hypot(m.a, m.b)
		if (!(taille > 0)) { return }
		const tex = this.handTex.getScaled(Math.round(taille))
		ctx.save()
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		ctx.drawImage(tex, m.e - tex.width / 2, m.f - tex.height / 2)
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

		this.drawBodyShadow(ctx, texture.shadow!, hatTexture ? hatTexture.shadow : null)
		if (this.weapon != null && !this.dead && (this.orientation === EntityDirection.SOUTH || this.orientation === EntityDirection.NORTH)) {
			this.drawWeapon(ctx, this.weapon.texture.shadow!, true)
		}

		ctx.restore()
	}

	/**
	 * L'ombre du corps et celle du chapeau, posées en UNE silhouette.
	 *
	 * Dessinées l'une après l'autre à `SHADOW_ALPHA`, elles se recouvraient et la
	 * zone commune ressortait plus sombre (1 − 0,45² ≈ 0,80 au lieu de 0,55) : une
	 * tache qui n'a pas de sens, un poireau chapeauté ne projette qu'une ombre. On
	 * les réunit donc d'abord à pleine opacité, puis on pose l'ensemble une seule
	 * fois. La croissance reste appliquée au dessin (la respiration aussi si
	 * SHADOW_BREATHING) : la silhouette est cuite dans le repère du corps, avant
	 * ces échelles. Le tout est ensuite posé déjà tourné, cf. SHADOW_SPRITES.
	 */
	private drawBodyShadow(ctx: CanvasRenderingContext2D, body: HTMLCanvasElement, hat: HTMLCanvasElement | null | undefined): void {
		// Pendant un flash, drawBody compose en 'lighter' : on lui laisse la main. Et
		// la silhouette est cuite pour un poireau debout (drawBody abaisse un mort).
		if (this.dead || this.flash > 0) {
			this.drawBody(ctx, body, hat || null)
			return
		}
		// Ce qu'on pose, et où, dans le repère de drawBody : la silhouette réunie avec
		// le chapeau, sinon l'ombre du corps seule, à la géométrie de drawBody.
		let source: HTMLCanvasElement, x: number, y: number, w: number, h: number
		if (hat) {
			const silhouette = this.getShadowSilhouette(body, hat)
			if (!silhouette) {
				this.drawBody(ctx, body, hat)
				return
			}
			source = silhouette.canvas
			x = silhouette.x; y = silhouette.y; w = silhouette.w; h = silhouette.h
		} else {
			const leekWidth = this.bodyTexFront.texture.width
			const leekHeight = this.bodyTexFront.texture.height
			// Mêmes gardes que drawBody (#11573) : une source 0×0 fait lever drawImage
			if (!(body.width > 0) || !(body.height > 0) || !(leekWidth > 0) || !(leekHeight > 0)) { return }
			source = body
			x = -leekWidth / 2; y = -leekHeight; w = leekWidth; h = leekHeight
		}
		ctx.save()
		ctx.scale(this.growth, (SHADOW_BREATHING ? this.oscillation : 1) * this.growth)
		// Ombre cuite déjà tournée (cf. SHADOW_SPRITES). Un filtre en cours (écrasement)
		// l'écarte, comme pour l'arme.
		if (!SHADOW_BREATHING && CAN_BAKE && ctx.filter === 'none') {
			const m = ctx.getTransform()
			const sprite = shadowSprite(this, 'shadowSprite', source, x, y, w, h, m)
			if (sprite) {
				blitBaked(ctx, sprite, m)
				ctx.restore()
				return
			}
		}
		ctx.drawImage(source, 0, 0, source.width, source.height, x, y, w, h)
		ctx.restore()
	}

	/**
	 * Silhouette réunie, une par face (avant/arrière), reprise tant que les deux
	 * ombres sources sont les mêmes : elles ne changent qu'au chargement d'une
	 * texture ou à un changement de chapeau.
	 */
	private getShadowSilhouette(body: HTMLCanvasElement, hat: HTMLCanvasElement): ShadowSilhouette | null {
		const cached = this.shadowSilhouettes.get(body)
		if (cached && cached.hat === hat) { return cached }

		// Même géométrie que drawBody, dans le même repère
		const leekWidth = this.bodyTexFront.texture.width
		const leekHeight = this.bodyTexFront.texture.height
		// Mêmes gardes que drawBody (#11573) : une source 0×0 fait lever drawImage
		if (!(leekWidth > 0) || !(leekHeight > 0) || !(body.width > 0) || !(body.height > 0) || !(hat.width > 0) || !(hat.height > 0)) { return null }
		const hatWidth = leekHeight * 0.8 * this.hatTemplate.width
		const hatHeight = hatWidth * (hat.height / hat.width)
		const hatY = -leekHeight - hatHeight + hatHeight * this.hatTemplate.height

		const left = Math.min(-leekWidth / 2, -hatWidth / 2)
		const top = Math.min(-leekHeight, hatY)
		const right = Math.max(leekWidth / 2, hatWidth / 2)
		const bottom = Math.max(0, hatY + hatHeight)

		// Résolution des ombres sources (SHADOW_QUALITY) : ni plus fine, ni plus floue
		const k = body.width / leekWidth
		const canvas = document.createElement('canvas')
		canvas.width = Math.ceil((right - left) * k)
		canvas.height = Math.ceil((bottom - top) * k)
		const sctx = canvas.getContext('2d')
		if (!sctx) { return null }
		sctx.setTransform(k, 0, 0, k, -left * k, -top * k)
		sctx.drawImage(body, 0, 0, body.width, body.height, -leekWidth / 2, -leekHeight, leekWidth, leekHeight)
		sctx.drawImage(hat, -hatWidth / 2, hatY, hatWidth, hatHeight)

		const silhouette = { canvas, hat, x: left, y: top, w: canvas.width / k, h: canvas.height / k }
		this.shadowSilhouettes.set(body, silhouette)
		return silhouette
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

		// Body. Garde sur la taille SOURCE > 0 : une texture SVG dégénérée (0x0,
		// décodage SVG non terminé sous Firefox) ferait lever IndexSizeError à
		// drawImage, ce qui interrompait définitivement la boucle de rendu et
		// masquait tous les poireaux suivants (#11573, même garde que #4312 pour
		// bulb/chest).
		const y = -leekHeight + (this.dead ? this.baseZ / this.scale : 0)
		if (texture.width > 0 && texture.height > 0) {
			ctx.drawImage(texture, 0, 0, texture.width, texture.height, -leekWidth / 2, y, leekWidth, leekHeight)
		}

		// Hat
		if (hatTexture && hatTexture.width > 0 && hatTexture.height > 0) {
			const hatWidth = leekHeight * 0.8 * this.hatTemplate.width
			const hatHeight = hatWidth * (hatTexture.height / hatTexture.width)
			ctx.drawImage(hatTexture, -hatWidth / 2, -leekHeight - hatHeight + hatHeight * this.hatTemplate.height, hatWidth, hatHeight)
		}
		ctx.restore()
	}
}

export { Leek }
