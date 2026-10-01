import { Bubble } from '@/component/player/game/bubble'
import { ChipAnimation } from '@/component/player/game/chips'
import { Colors, Game } from '@/component/player/game/game'
import { InfoText } from '@/component/player/game/infotext'
import { isDrawable, isPainted, loadDrawableImage, SHADOW_QUALITY, T, Texture } from '@/component/player/game/texture'
import { Cell } from '@/model/cell'
import { EffectModifier, EffectType, effectValueText, EntityEffect, State } from '@/model/effect'
import { Entity } from '@/model/entity'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { TEAM_COLORS } from '@/model/team'
import { BakedMemo, BakedSprite, BakedSpriteCache, blitBaked, CAN_BAKE, memoMatches, ready } from './baked-sprite'
import { Path } from './path'
import { S } from './sound'
import { WeaponAnimation } from './weapons'
import { HatTemplate } from '@/model/hat'

enum EntityType {
	LEEK = 0,
	BULB = 1,
	TURRET = 2,
	CHEST = 3,
	MOB = 4,
	// v2.50 — les plantes (Maïs, Piment, Prototaxite) sont un type d'entité à part côté moteur :
	// enracinées, elles ne jouent pas leur tour. Le rendu reste celui d'un bulbe (cf Bulb.setPlant),
	// et les combats d'avant le changement les envoient encore en BULB.
	PLANT = 5,
}
enum EntityDirection {
	NORTH = 0,
	SOUTH = 1,
	EAST = 2,
	WEST = 3,
}
const MOVE_DELAY = 3
const MOVE_DURATION = 25
const MOVE_HEIGHT = 15

enum DamageType {
	DEFAULT,
	FIRE,
	EXPLOSION,
	SLICE
}

/**
 * Pastilles d'effet pré-composées.
 *
 * Une pastille (l'icône de la puce ou de l'arme, sa valeur, sa durée, son état)
 * ne change qu'à l'ajout, l'empilement ou le retrait d'un effet — mais on la
 * repeignait intégralement à chaque image. Sur un combat à 8 poireaux, les 71
 * pastilles affichées coûtaient 59 % du temps de dessin du moteur : un PNG de
 * 250 px redimensionné en 18, deux fonds et deux textes, chacun mesuré au
 * préalable (151 `measureText` par image, à eux seuls).
 *
 * On les peint donc une fois chacune, à la résolution exacte où elles
 * atterrissent à l'écran, et l'image ne fait plus qu'un blit par pastille :
 * 3,20 → 0,70 ms par image à CPU ÷6, dessin du moteur 5,80 → 3,30 ms.
 *
 * Le blit part d'un `ImageBitmap` et pas du canevas de brouillon : un bitmap est
 * immuable, donc envoyé au GPU une seule fois, là où un canevas reste une cible
 * de dessin que le navigateur peut avoir à renvoyer. Sa création étant
 * asynchrone, une pastille se dessine directement tant qu'il n'est pas arrivé.
 */
// Marge autour de la pastille (la valeur et la durée débordent un peu de l'icône),
// comptée en PIXELS DU CANVAS : l'origine du contenu tombe ainsi pile sur la
// grille de pixels, sinon le texte et l'icône sont déjà flous à la cuisson.
const EFFECT_BADGE_MARGIN = 2
const EFFECT_BADGE_FONT = "bold 9pt Roboto"
// La clé porte l'échelle de dessin : deux lecteurs affichés côte à côte à des
// zooms différents se partagent le cache au lieu de se chasser l'un l'autre.
const EFFECT_BADGES: Map<string, { bitmap: ImageBitmap | null }> = new Map()
// Un effet qui s'empile ou dont la durée s'écoule devient une nouvelle pastille :
// on borne le cache.
const EFFECT_BADGE_MAX = 400

// Une police ne se décharge jamais : on la demande UNE fois, puis on n'interroge
// plus le navigateur. ⚠️ `document.fonts.check` coûte cher — appelé pour chacune
// des 71 pastilles d'une image, il annulait à lui seul tout le gain de la
// pré-composition (5,00 ms par image au lieu de 3,30).
const fontsReady = new Set<string>()
const fontsAsked = new Set<string>()
function fontAvailable(font: string): boolean {
	if (!fontsReady.has(font) && !fontsAsked.has(font)) {
		fontsAsked.add(font)
		if (document.fonts.check(font)) {
			fontsReady.add(font)
		} else {
			// Figer une pastille avec la police de repli la garderait ainsi tout le
			// combat : on attend, le dessin direct prend le relais entre-temps.
			const ready = () => { fontsReady.add(font) }
			document.fonts.load(font).then(ready, ready)
		}
	}
	return fontsReady.has(font)
}

function effectDurationText(effect: EntityEffect): string {
	return '' + LeekWars.formatTurns(effect.turns)
}

/** Position, dans le repère courant, qui tombe pile sur un pixel du canvas. */
function snapToPixel(value: number, scale: number, offset: number): number {
	return (Math.round(scale * value + offset) - offset) / scale
}

/**
 * Peint une pastille, origine en haut à gauche de l'icône. `alpha` multiplie les
 * opacités internes : 1 pour la pré-composition, l'opacité de l'entité pour le
 * dessin direct (le repli, tant qu'une image n'est pas chargée).
 */
function drawEffectBadge(ctx: CanvasRenderingContext2D, effect: EntityEffect, size: number, alpha: number) {

	const state_size = 0.6
	const text_size = 9

	ctx.font = EFFECT_BADGE_FONT
	ctx.textAlign = "left"
	ctx.textBaseline = "middle"

	// Icône absente côté serveur : l'Image reste « broken » le temps que son
	// handler d'erreur bascule sur le pixel transparent, et drawImage lève dans
	// cet intervalle — ce qui tuait la boucle de rendu et figeait le combat.
	ctx.globalAlpha = alpha
	if (isDrawable(effect.texture)) {
		ctx.drawImage(effect.texture, 0, 0, size, size)
	}
	if (effect.modifiers & EffectModifier.IRREDUCTIBLE) {
		ctx.strokeStyle = "#ffca00"
		ctx.lineWidth = 3
		ctx.strokeRect(1.5, 1.5, size - 3, size - 3)
	}
	// Valeur, ou icône d'état
	if (effect.type === EffectType.ADD_STATE) {
		const color = FightEntity.stateColors[effect.value]
		if (color) {
			ctx.globalAlpha = 0.85 * alpha
			ctx.fillStyle = color
			ctx.fillRect(0, (1 - state_size) * size - 2, size * state_size + 2, size * state_size + 2)
		}
		ctx.globalAlpha = alpha
		const stateIcon = FightEntity.stateImage(effect.value)
		if (isDrawable(stateIcon)) {
			ctx.drawImage(stateIcon, 1, (1 - state_size) * size - 1, size * state_size, size * state_size)
		}
	} else {
		const value = effectValueText(effect)
		const w = ctx.measureText(value).width
		ctx.globalAlpha = 0.5 * alpha
		ctx.fillStyle = 'black'
		ctx.fillRect(1, size - text_size - 5, w + 3, text_size + 4)
		ctx.globalAlpha = alpha
		ctx.fillStyle = 'white'
		ctx.fillText(value, 2, size - 6)
	}
	// Durée
	const duration = effectDurationText(effect)
	const w2 = ctx.measureText(duration).width
	ctx.globalAlpha = 0.5 * alpha
	ctx.fillStyle = 'black'
	ctx.fillRect(size - 11, 1.5, w2 + 3, 12)
	ctx.globalAlpha = alpha
	ctx.fillStyle = 'white'
	ctx.fillText(duration, size - 9, 8)
}

/**
 * Pastille pré-composée d'un effet, ou `null` s'il est trop tôt pour la figer :
 * une icône encore en cours de chargement, ou la police pas encore disponible,
 * resterait absente de la pastille pour tout le combat. L'appelant repasse alors
 * par le dessin direct, et retentera à l'image suivante.
 */
function getEffectBadge(effect: EntityEffect, size: number, quality: number): ImageBitmap | null {

	if (typeof createImageBitmap !== 'function') { return null }

	const key = effect.item + '|' + effect.type + '|' + effect.value + '|' + effect.turns + '|' + effect.modifiers + '|' + quality
	const cached = EFFECT_BADGES.get(key)
	if (cached) { return cached.bitmap }

	// Les images et la police doivent être là avant de figer la pastille : ce qui
	// manque au moment de la peindre en resterait absent pour tout le combat
	// (cf. `isPainted`, qui est plus strict qu'`isDrawable` pour cette raison).
	if (!isPainted(effect.texture)) { return null }
	if (effect.type === EffectType.ADD_STATE && !isPainted(FightEntity.stateImage(effect.value))) { return null }
	if (!fontAvailable(EFFECT_BADGE_FONT)) { return null }

	const canvas = document.createElement('canvas')
	// `willReadFrequently` garde le brouillon côté processeur : sans lui,
	// createImageBitmap doit relire un canevas posé sur le GPU (1 ms pièce).
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) { return null }

	// Mesurer d'abord, dimensionner ensuite (fixer `width` réinitialise le
	// contexte) : la valeur et la durée peuvent dépasser à droite de l'icône —
	// elles débordent sur la pastille suivante, qui est dessinée après et les
	// recouvre, comme avant.
	ctx.font = EFFECT_BADGE_FONT
	const valueWidth = ctx.measureText(effectValueText(effect)).width
	const durationWidth = ctx.measureText(effectDurationText(effect)).width
	const width = Math.max(size, valueWidth + 5, size - 11 + durationWidth + 4)

	canvas.width = Math.ceil(width * quality) + 2 * EFFECT_BADGE_MARGIN
	canvas.height = Math.ceil(size * quality) + 2 * EFFECT_BADGE_MARGIN
	ctx.setTransform(quality, 0, 0, quality, EFFECT_BADGE_MARGIN, EFFECT_BADGE_MARGIN)
	drawEffectBadge(ctx, effect, size, 1)

	// Les entrées les plus anciennes portent des durées déjà écoulées : on en
	// évince une par création plutôt que de tout jeter d'un coup — sinon l'image
	// qui franchit le plafond repaie la composition des 71 pastilles affichées,
	// et ça se voit.
	while (EFFECT_BADGES.size >= EFFECT_BADGE_MAX) {
		const oldest = EFFECT_BADGES.keys().next()
		if (oldest.done) { break }
		const evicted = EFFECT_BADGES.get(oldest.value)
		if (evicted && evicted.bitmap) { evicted.bitmap.close() }
		EFFECT_BADGES.delete(oldest.value)
	}
	const badge: { bitmap: ImageBitmap | null } = { bitmap: null }
	EFFECT_BADGES.set(key, badge)
	createImageBitmap(canvas).then((bitmap) => {
		// L'entrée a pu être évincée entre-temps : ce bitmap-là ne sert plus.
		if (EFFECT_BADGES.get(key) === badge) { badge.bitmap = bitmap } else { bitmap.close() }
	}, () => {
		if (EFFECT_BADGES.get(key) === badge) { EFFECT_BADGES.delete(key) }
	})
	return null
}

const NAME_PLATE_FONT = "500 11pt Roboto"
const NAME_PLATE_HEIGHT = 22
const NAME_PLATE_BAR_HEIGHT = 9

/** Fond et nom d'une plaque, dans le repère de la plaque (origine au milieu du bord haut). */
function paintNamePlate(ctx: CanvasRenderingContext2D, text: string, width: number, active: boolean, alpha: number) {
	ctx.globalAlpha = (active ? 0.8 : 0.6) * alpha
	ctx.fillStyle = active ? 'white' : 'black'
	ctx.fillRect(-width / 2, 0, width, NAME_PLATE_HEIGHT + NAME_PLATE_BAR_HEIGHT - 1)
	ctx.globalAlpha = alpha
	ctx.fillStyle = active ? 'black' : 'white'
	ctx.font = NAME_PLATE_FONT
	ctx.textBaseline = "middle"
	ctx.textAlign = "center"
	ctx.fillText(text, 0, 12)
}

/** Barre de vie sous le nom, même repère que paintNamePlate. */
function paintLifeBar(ctx: CanvasRenderingContext2D, entity: FightEntity, width: number) {
	if (entity.life > 0) {
		const barWidth = entity.displayLife / entity.maxLife * width
		ctx.fillStyle = entity.lifeColor
		ctx.strokeStyle = entity.lifeColorLighter
		ctx.fillRect(-width / 2 + 1, NAME_PLATE_HEIGHT, barWidth - 2, NAME_PLATE_BAR_HEIGHT - 2)
		ctx.strokeRect(-width / 2 + 1, NAME_PLATE_HEIGHT, barWidth - 2, NAME_PLATE_BAR_HEIGHT - 2)
	}
}

let namePlateTokens = 0

/**
 * Plaque de nom pré-composée : le fond, le nom, la barre de vie et les pastilles
 * d'effets figés en UN bitmap, dans cet ordre — le bas de la barre et le haut des
 * pastilles se partagent une rangée de pixels, l'ordre compte.
 *
 * Le texte n'y est presque pour rien (~5 µs par plaque, mesuré) : ce qui coûtait,
 * c'est le NOMBRE d'appels — le fond, la mesure et l'écriture du nom, puis par
 * pastille une clé, une recherche et un blit calé, une douzaine d'opérations par
 * plaque et par image, que Chromium paie une à une (enregistrées puis envoyées au
 * processus GPU). Combat à 30 poireaux, 20 plaques : 4,38 → 2,88 ms de dessin
 * par image à CPU ÷4 sous Chromium, 3,80 → 3,35 ms sous Firefox.
 *
 * Le bitmap n'est composé qu'une fois les entrées stables deux images de suite :
 * les PV (et la barre) défilent pendant une seconde après chaque coup, et un
 * déplacement change la phase sous-pixel de la plaque à chaque image — la plaque
 * est alors dessinée directement, comme avant. Il retient cette phase et se pose
 * au pixel entier : la plaque ne bouge pas d'un pixel en se figeant, pastilles
 * comprises. Les entrées sont comparées champ par champ, sans clé textuelle : sur
 * les silhouettes d'arme, bâtir une clé et interroger une Map à chaque image
 * coûtait plus que ce que le cache économisait.
 */
class NamePlate {
	// Entrées de l'image précédente. Les PV affichés sont comparés EXACTS : la
	// barre de vie suit la valeur non arrondie jusqu'au bout du défilement.
	private displayLife = NaN
	private life = NaN
	private maxLife = NaN
	private active = false
	private showIDs = false
	private showEffects = false
	private quality = 0
	private phaseX = 0
	private phaseY = 0
	// Ce qui dessine les pastilles, cinq nombres par effet (cf. la clé de getEffectBadge)
	private effects: number[] = []
	public bitmap: ImageBitmap | null = null
	// Coin du bitmap, relatif au pixel entier du repère de la plaque
	public x = 0
	public y = 0
	// Jeton de la composition en cours, 0 si aucune
	private pending = 0

	/** Vrai si rien n'a bougé depuis l'image précédente ; sinon retient les nouvelles entrées. */
	public same(entity: FightEntity, active: boolean, m: DOMMatrix): boolean {
		const game = entity.game
		const phaseX = m.e - Math.floor(m.e), phaseY = m.f - Math.floor(m.f)
		let same = entity.displayLife === this.displayLife && entity.life === this.life && entity.maxLife === this.maxLife
			&& active === this.active && game.showIDs === this.showIDs
			&& game.showEffects === this.showEffects && m.a === this.quality
			&& phaseX === this.phaseX && phaseY === this.phaseY
		if (same) {
			const fx = this.effects
			let i = 0
			for (const id in entity.effects) {
				const e = entity.effects[id]
				if (fx[i] !== e.item || fx[i + 1] !== e.type || fx[i + 2] !== e.value || fx[i + 3] !== e.turns || fx[i + 4] !== e.modifiers) {
					same = false
					break
				}
				i += 5
			}
			if (i !== fx.length) { same = false }
		}
		if (!same) {
			this.displayLife = entity.displayLife
			this.life = entity.life
			this.maxLife = entity.maxLife
			this.active = active
			this.showIDs = game.showIDs
			this.showEffects = game.showEffects
			this.quality = m.a
			this.phaseX = phaseX
			this.phaseY = phaseY
			const effects: number[] = []
			for (const id in entity.effects) {
				const e = entity.effects[id]
				effects.push(e.item, e.type, e.value, e.turns, e.modifiers)
			}
			this.effects = effects
			if (this.bitmap) {
				this.bitmap.close()
				this.bitmap = null
			}
			this.pending = 0
		}
		return same
	}

	/**
	 * Lance la composition si tout ce qu'il faut est là : la police, et le bitmap de
	 * chaque pastille — ce qui manquerait au moment de figer la plaque en resterait
	 * absent. Sinon on retentera à l'image suivante, le dessin direct faisant le relais.
	 */
	public compose(entity: FightEntity, text: string, width: number, effectSize: number, m: DOMMatrix) {
		if (this.pending || this.bitmap || typeof createImageBitmap !== 'function') { return }
		if (!fontAvailable(NAME_PLATE_FONT)) { return }
		const q = this.quality
		const E = Math.floor(m.e), F = Math.floor(m.f)
		let minX = Math.floor(this.phaseX - q * width / 2) - 1
		let maxX = Math.ceil(this.phaseX + q * width / 2) + 1
		let minY = -1
		let maxY = Math.ceil(this.phaseY + q * (NAME_PLATE_HEIGHT + NAME_PLATE_BAR_HEIGHT - 1)) + 1
		const badges: { bitmap: ImageBitmap, x: number, y: number }[] = []
		if (this.showEffects) {
			let x = -LeekWars.objectSize(entity.effects) * effectSize / 2
			for (const id in entity.effects) {
				const bitmap = getEffectBadge(entity.effects[id], effectSize, q)
				if (!bitmap) { return }
				// Le calage du dessin direct (cf. drawName), relatif au pixel entier
				const bx = Math.round(q * x - EFFECT_BADGE_MARGIN + m.e) - E
				const by = Math.round(q * effectSize - EFFECT_BADGE_MARGIN + m.f) - F
				badges.push({ bitmap, x: bx, y: by })
				minX = Math.min(minX, bx)
				maxX = Math.max(maxX, bx + bitmap.width)
				minY = Math.min(minY, by)
				maxY = Math.max(maxY, by + bitmap.height)
				x += effectSize
			}
		}
		const canvas = document.createElement('canvas')
		canvas.width = maxX - minX
		canvas.height = maxY - minY
		// Cf. getEffectBadge : un brouillon côté processeur, que createImageBitmap
		// n'a pas à relire depuis le GPU. Rien n'y est rééchantillonné (texte,
		// rectangles, pastilles posées au pixel entier). Sous Firefox, bitmap et
		// dessin direct sont identiques au niveau près ; sous Chromium, dont le
		// canvas du jeu est rastérisé sur le GPU, seuls les bords anticrénelés
		// diffèrent un peu (netteté −1 %) — un brouillon accéléré ne faisait pas mieux.
		const ctx = canvas.getContext('2d', { willReadFrequently: true })
		if (!ctx) { return }
		ctx.setTransform(q, 0, 0, q, this.phaseX - minX, this.phaseY - minY)
		paintNamePlate(ctx, text, width, this.active, 1)
		paintLifeBar(ctx, entity, width)
		ctx.setTransform(1, 0, 0, 1, 0, 0)
		for (const badge of badges) {
			ctx.drawImage(badge.bitmap, badge.x - minX, badge.y - minY)
		}
		this.x = minX
		this.y = minY
		const token = this.pending = ++namePlateTokens
		createImageBitmap(canvas).then((bitmap) => {
			// Les entrées ont pu bouger entre-temps : ce bitmap-là ne sert plus
			if (this.pending === token) {
				this.bitmap = bitmap
				this.pending = 0
			} else {
				bitmap.close()
			}
		}, () => {
			if (this.pending === token) { this.pending = 0 }
		})
	}
}

/**
 * Losanges d'équipe pré-composés : le trait, et le remplissage de l'entité dont c'est
 * le tour.
 *
 * Chaque entité trace un losange sur sa case à chaque image : un chemin de quatre
 * segments, trait de 3,5 à bouts et jointures arrondis, rastérisé de zéro. Il ne
 * dépend pourtant que de la couleur d'équipe, de la taille des cases et de l'échelle
 * du terrain. On le cuit donc une fois à sa taille finale à l'écran et on le pose en
 * copie 1:1 à coordonnées entières, avec sa transparence : un trait cuit opaque puis
 * posé à α donne le même résultat que ce trait tracé à α.
 */
const TEAM_SQUARES = new BakedSpriteCache(120)
const TEAM_SQUARE_WIDTH = 3.5

/** Chemin du losange d'une case, centré sur l'origine. */
function traceDiamond(ctx: CanvasRenderingContext2D, tileX: number, tileY: number) {
	ctx.beginPath()
	ctx.moveTo(0, -tileY / 2)
	ctx.lineTo(tileX / 2, 0)
	ctx.lineTo(0, tileY / 2)
	ctx.lineTo(-tileX / 2, 0)
	ctx.closePath()
}

/** Pose le trait (ou le remplissage) du losange, de la couleur donnée. */
function paintDiamond(ctx: CanvasRenderingContext2D, color: string, tileX: number, tileY: number, fill: boolean) {
	traceDiamond(ctx, tileX, tileY)
	if (fill) {
		ctx.fillStyle = color
		ctx.fill()
	} else {
		ctx.strokeStyle = color
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
		ctx.lineWidth = TEAM_SQUARE_WIDTH
		ctx.stroke()
	}
}

/**
 * Trait ou remplissage du losange pour la matrice courante (l'échelle du terrain).
 * La taille des cases est une constante du terrain : la couleur suffit à distinguer
 * les losanges d'une même partie, la taille n'entre que dans la clé.
 */
function teamSquare(entity: FightEntity, color: string, tileX: number, tileY: number, fill: boolean, m: DOMMatrix): BakedSprite | null {
	const memo = fill ? entity.teamFill : entity.teamStroke
	if (memoMatches(memo, color, m)) { return ready(memo) }
	const hw = tileX / 2 + TEAM_SQUARE_WIDTH, hh = tileY / 2 + TEAM_SQUARE_WIDTH
	const fresh = TEAM_SQUARES.lookup((fill ? 'f|' : 's|') + color + '|' + tileX + '|' + tileY, color, m, [[-hw, -hh, 2 * hw, 2 * hh]], (ctx) => {
		paintDiamond(ctx, color, tileX, tileY, fill)
	})
	if (fill) { entity.teamFill = fresh } else { entity.teamStroke = fresh }
	return ready(fresh)
}

abstract class FightEntity extends Entity {

	static stateImages: Map<number, HTMLImageElement> = new Map()
	// Couleur du fond de l'icône d'état, indexée par état. Vert = bénéfique, bleu =
	// neutre, rouge = subi. Un état sans couleur ne peint pas de fond.
	// 2 = Insoignable (rouge), 9 = Enraciné (bleu, inhérent aux plantes 2.50),
	// 12 = Stérile (rouge).
	static stateColors = [
		'green', '', 'red', 'green', '', '', '', '', '', 'blue', '', 'blue', 'red'
	]

	/**
	 * Icône d'un état, toujours dessinable. Le chargement est paresseux et jamais
	 * conditionné à addState : un effet d'état dont la valeur n'a pas été enregistrée
	 * renvoyait `undefined`, et drawImage faisait alors tomber toute la boucle de jeu
	 * — combat figé. Un état sans icône part en 404, dont le repli évite une Image
	 * « broken » que drawImage refuserait aussi.
	 */
	static stateImage(state: number): HTMLImageElement {
		let image = FightEntity.stateImages.get(state)
		if (!image) {
			image = loadDrawableImage(LeekWars.STATIC + "image/state/" + state + ".svg")
			FightEntity.stateImages.set(state, image)
		}
		return image
	}

	// Infos générales
	public game: Game
	public farmer!: Farmer | null
	public type: EntityType
	public summon = false
	public summoner!: Entity
	public bulbName?: string
	public active = false
	public initially_dead!: boolean
	// Caractéristiques
	public life = 0
	public displayLife = 0
	public strength = 0
	public wisdom = 0
	public agility = 0
	public resistance = 0
	public frequency = 0
	public cores = 0
	public ram = 0
	public science = 0
	public magic = 0
	public tp = 0
	public mp = 0
	public power = 0
	public maxLife = 1
	public initialMaxLife = 1
	// Vie de base de l'entité (stats de base côté serveur), invariante pendant le
	// combat. Distincte de initialMaxLife, qui est amputée du bonus de critique des
	// invocations pour le calcul de la taille d'affichage (growth).
	public baseLife = 1
	public maxTP = 0
	public maxMP = 0
	public absoluteShield = 0
	public relativeShield = 0
	public damageReturn = 0
	// Items
	public ai: number = 0
	public chips: number[] = []
	public weapons: number[] = []
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
	private namePlate: NamePlate | null = null
	public width: number = 0
	public height: number = 0
	public baseHeight: number = 0
	public baseWidth: number = 0
	public scale: number = 1
	public living: boolean = true
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
	public fullPath: Cell[] = []
	public path: Cell[] = []
	// Animation
	public oscillation = 1
	public teamStroke: BakedMemo | null = null
	public teamFill: BakedMemo | null = null
	public frame: number
	public growth: number = 1.0
	public lastDamageType: DamageType = DamageType.DEFAULT
	/** Dernière attaque jouée = coup critique. Lu par les animations d'arme (repoussée de la lance). */
	public lastCritical: boolean = false
	public crashAnim: number = 0
	public carbonizeAnim: number = 0
	public deadAnim: number = 0
	public blooming: boolean = false
	// Effects
	public effects: {[key: number]: EntityEffect} = {}
	public jumpForce: number = 0
	public bodyTexFront!: Texture
	public bodyTexBack!: Texture
	public bloodTex: Texture | null
	public lifeColor!: string
	public lifeColorLighter!: string
	// States
	public states: Set<number> = new Set()
	// Statique : ni déplacement forcé, ni échange de position. Les tourelles le sont
	// par construction (Turret.startFight pose l'état, irréductible), mais les combats
	// enregistrés avant l'apparition de cet effet ne le contiennent pas : sans ce cas
	// particulier, le grappin et le gant de boxe les déplaçaient visuellement.
	get isStatic(): boolean {
		return this.type === EntityType.TURRET || this.states.has(State.STATIC)
	}
	// Immunisé aux déplacements forcés (poussée/attirance) : Statique ou Enraciné.
	// L'Inversion/Rempotage ne passe pas par ici (l'Enraciné reste échangeable).
	get unmovable(): boolean {
		return this.isStatic || this.states.has(State.ROOTED)
	}
	// Reachable cells
	public reachableCells: Set<Cell> = new Set<Cell>()
	public reachableCellsArea!: number[][]
	// Animations
	public handPos = 0
	// Weapon
	public weapon: WeaponAnimation | null = null
	public handTex!: Texture
	// Hat
	public hatFront!: Texture
	public hatBack!: Texture
	public hatName!: string
	public hat!: number
	public hatTemplate!: HatTemplate

	constructor(game: Game, type: EntityType, team: number, name: string) {
		super()
		this.game = game
		this.type = type
		this.team = team
		this.name = name
		this.translatedName = name
		this.bubble = new Bubble(game)
		this.path = []
		this.frame = Math.random() * 100
		this.effects = {}
		this.bloodTex = T.leek_blood
		this.lifeColor = TEAM_COLORS[this.team - 1]
		this.lifeColorLighter = LeekWars.shadeColor(this.lifeColor, 120)
	}

	public setHat(hat: number | null) {
		if (hat) {
			this.hat = hat
			this.hatTemplate = LeekWars.hats[hat]
			this.hatName = this.hatTemplate.name
			this.hatFront = T.get(this.game, "image/hat/" + this.hatName + ".png?2", true, SHADOW_QUALITY)
			this.hatBack = T.get(this.game, "image/hat/" +  this.hatName + "_back.png?2", true, SHADOW_QUALITY)
		}
	}

	public setWeapon(weapon: WeaponAnimation): void {
		this.weapon = weapon
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
		this.fullPath = [...path]
		for (const cell of path) {
			this.path.push(cell)
		}
		this.pathNext() // Start movement
	}

	public pathNext() {
		if (this.path.length === 0) {
			this.looseMP(this.fullPath.length, false, true)
			this.game.actionDone()
		} else {
			const cell = this.path[0]
			this.jumpToCell(cell)
			this.mp--
			this.path.shift() // Supprime la première case
		}
	}

	public jumpToCell(cell: Cell) {

		// Set destination
		this.rx = this.x
		this.ry = this.y
		this.dcell = cell

		const distance = this.cell
			? Math.abs(this.cell.x - cell.x) + Math.abs(this.cell.y - cell.y)
			: 1

		const pos = this.game.ground.field.cellToXY(cell)

		this.dx = pos.x
		this.dy = pos.y

		this.moveDuration = Math.sqrt(distance) * MOVE_DURATION
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

	public looseMP(mp: number, jump: boolean, info_only: boolean = false) {
		if (!info_only) {
			this.mp -= mp
		}
		if (!jump) {
			const info = new InfoText()
			info.init("-" + mp, Colors.MP_COLOR, -this.height, this.isTop)
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
			info.init("+" + mp, Colors.MP_COLOR, -this.height, this.isTop)
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
			info.init("+" + wisdom, Colors.WISDOM_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public buffResistance(resistance: number, jump: boolean) {
		this.resistance += resistance
		if (!jump) {
			const info = new InfoText()
			info.init("+" + resistance, Colors.RESISTANCE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseLife(life: number, erosion: number, jump: boolean) {
		this.life -= life
		if (this.life < 0) { this.life = 0 }

		this.maxLife -= erosion
		if (this.maxLife < 0) { this.maxLife = 0 }
		this.updateGrowth()

		if (!jump) {
			const info = new InfoText()
			info.init("-" + life, Colors.LIFE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseMaxLife(life: number, jump: boolean) {
		this.maxLife -= life
		if (this.maxLife < 0) { this.maxLife = 0 }
		this.updateGrowth()

		if (!jump) {
			const info = new InfoText()
			info.init("-" + life, Colors.MAX_LIFE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public winMaxLife(life: number, jump: boolean) {
		this.maxLife += life
		this.updateGrowth()
		if (!jump) {
			const info = new InfoText()
			info.init("+" + life, Colors.MAX_LIFE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public updateGrowth() {
		if (this.living) {
			this.growth = 1.0 + Math.log10(Math.max(0.0316227766, this.maxLife / this.initialMaxLife)) / 3
		}
		this.width = this.baseWidth * this.scale * this.growth
		this.height = this.baseHeight * this.scale * this.growth
	}

	public loosePower(power: number, jump: boolean) {

		this.power -= power

		if (!jump) {
			const info = new InfoText()
			info.init("-" + power, '#000', -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseStrength(strength: number, jump: boolean) {

		this.strength -= strength

		if (!jump) {
			const info = new InfoText()
			info.init("-" + strength, Colors.STRENGTH_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseMagic(magic: number, jump: boolean) {

		this.magic -= magic

		if (!jump) {
			const info = new InfoText()
			info.init("-" + magic, Colors.MAGIC_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseAgility(agility: number, jump: boolean) {
		this.agility -= agility
		if (!jump) {
			const info = new InfoText()
			info.init("-" + agility, Colors.AGILITY_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseWisdom(wisdom: number, jump: boolean) {
		this.wisdom -= wisdom
		if (!jump) {
			const info = new InfoText()
			info.init("-" + wisdom, Colors.WISDOM_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public care(life: number, jump: boolean) {

		this.life += life

		if (!jump) {
			const info = new InfoText()
			info.init("+" + life, Colors.LIFE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public boostVita(life: number, jump: boolean) {

		this.life += life
		this.displayLife += life
		this.maxLife += life
		this.updateGrowth()

		if (!jump) {
			const info = new InfoText()
			info.init("+" + life, Colors.LIFE_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public looseTP(tp: number, jump: boolean) {

		this.tp -= tp

		if (!jump) {
			const info = new InfoText()
			info.init("-" + tp, Colors.TP_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public buffTP(tp: number, jump: boolean) {

		this.tp += tp

		if (!jump) {
			const info = new InfoText()
			info.init("+" + tp, Colors.TP_COLOR, -this.height, this.isTop)
			this.infoText.push(info)
		}
	}

	public buffPower(power: number, jump: boolean) {
		this.power += power
		if (!jump) { this.newInfoText("+" + power, '#000') }
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
		info.init(text, color, -this.height, this.isTop)
		this.infoText.push(info)
	}

	public update(dt: number) {

		// Update si dead
		if (this.dead) {

			if (this.deadAnim < 1) {

				this.deadAnim += 0.035 * dt

				if (this.deadAnim >= 1) {
					this.finishDeath()
				}
			}
		}

		if (!this.dead) {

			// Animation
			this.frame += dt / Math.max(1, this.game.speed / 6)
			if (this.living) {
				this.oscillation = 1 + Math.cos(this.frame / 17) / 40
			}
			if (this.crashAnim > 0) {
				this.crashAnim -= dt
				if (this.crashAnim < 0) {
					this.crashAnim = 0
					this.game.actionDone()
				}
			}
			if (this.blooming && this.deadAnim > 0) {
				this.deadAnim -= 0.025 * dt
				if (this.deadAnim <= 0) {
					this.deadAnim = 0
					this.blooming = false
				}
			}

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

		// Update display life animation
		if (this.displayLife !== this.life) {
			const diff = this.life - this.displayLife
			const speed = Math.max(1, Math.abs(diff) * 0.1) * dt
			if (Math.abs(diff) < speed) {
				this.displayLife = this.life
			} else {
				this.displayLife += Math.sign(diff) * speed
			}
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

	public finishDeath() {
		this.deadAnim = 0
		if (this.drawID) {
			this.game.removeDrawableElement(this.drawID, this.y)
			this.drawID = null
		}
		this.active = false

		for (const id in this.effects) {
			this.game.removeEffect(parseInt(id, 10))
		}
		this.effects = {}
		this.game.actionDone()
	}

	public useChip(chip: ChipAnimation, cell: Cell, targets: FightEntity[], result: number) {
		if (!this.cell) { return }
		const pos = this.game.ground.field.cellToXY(cell)
		const cellPixels = this.game.ground.xyToXYPixels(pos.x, pos.y)
		this.watch(cell)
		chip.launch({x: this.ox, y: this.oy}, cellPixels, targets, cell, this)

		// One and zeros animation
		S.chip.play(this.game)
		const target_angle = cell.angle(this.game, this.cell)
		const distance = this.game.ground.field.real_distance(cell, this.cell)
		for (let p = 0; p < 40; ++p) {
			const angle_delta = Math.PI / 4 / distance
			const angle = cell === this.cell ? Math.random() * Math.PI * 2 : target_angle - angle_delta / 2 + Math.random() * angle_delta
			const texture = p % 2 ? T.chip_one : T.chip_zero
			const d = cell === this.cell ? (0.5 + Math.random() / 2) : (0.2 + distance * Math.random())
			const life = 50
			this.game.particles.addImage(this.ox - 10 + Math.random() * 20, this.oy - 10 + Math.random() * 20, 15, Math.cos(angle) * d, Math.sin(angle) * d / 2, 0, 0, texture, life, 1, 0, false, 0.35)
		}

		if (result === 2) {
			this.addCritical()
		}
	}

	// Inclinaison du poireau vers la cellule cible
	public watch(cell: Cell) {
		// Les objets statiques (graal, cristaux) ne pivotent pas : leur sprite est
		// asymétrique (les gemmes du graal) et le miroir appliqué à l'orientation
		// ouest/nord mettrait les couleurs du mauvais côté. Depuis l'ajout des
		// animations de chips boss (#3627), le graal appelle watch() en lançant une
		// boule de feu et se retrouvait inversé (forum #11964 / issue #4319).
		if (!this.living) { return }
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
			this.bubble.show(6)
			this.crashAnim = 50
			S.crash.play(this.game)
			this.game.particles.addSmallExplosion(this.ox, this.oy - this.height + 40, 2)
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

	public kill(animation: boolean, damageType: DamageType, dx: number, dy: number) {
		if (animation) {
			if (damageType === DamageType.DEFAULT) {
				this.bury()
			} else if (damageType === DamageType.SLICE) {
				this.slice()
			} else if (damageType === DamageType.EXPLOSION) {
				this.explode(dx, dy)
			} else if (damageType === DamageType.FIRE) {
				this.carbonize()
			}
		}
		this.dead = true
		this.flash = 0
		this.bubble = null
	}

	public bury() {

		const texture = this.frameTexture(false)

		const f_scale = this.scale * this.growth
		this.game.particles.addBuryParticle(this.ox, this.oy, texture, f_scale)
		S.bury.play(this.game)
	}

	public carbonize() {

		S.burn.play(this.game)

		const texture = this.frameTexture(true)
		const f_scale = this.scale * this.growth

		const data = texture.ctx.getImageData(0, 0, texture.texture.width, texture.texture.height)
		const wind_y = Math.random() > 0.5 ? 0.7 : -0.7
		const wind_x = Math.random() > 0.5 ? 0.5 : -0.5
		const inc = (data.width * f_scale) / 10 | 0
		for (let x = 0; x < data.width; x += inc) {
			for (let y = 0; y < data.height; y += inc) {
				if (data.data[y * data.width * 4 + x * 4 + 3] > 50) {
					const dx = wind_x * (0.7 + Math.random() * 3)
					const dy = wind_y - 0.2 + Math.random() * 0.4
					this.game.particles.addImage(this.ox - texture.texture.width * f_scale / 2 + x * f_scale, this.oy, this.z + texture.texture.height * f_scale - y * f_scale, dx, dy, 0, 0, T.smoke, 40 + Math.random() * 20, 1, 0, false, 1.2)
				}
			}
		}
	}

	public slice() {

		const texture = this.frameTexture(true)

		const w = texture.texture.width
		const h = texture.texture.height
		const s = Math.max(w, h) * 1.3
		const cx = w * 0.5
		const cy = h * (0.5 + Math.random() * 0.3)
		const angle = - Math.PI / 2 - 0.35 + Math.random() * 0.7
		const f_scale = this.scale * this.growth

		const topX = cx + Math.cos(angle) * s
		const topY = cy + Math.sin(angle) * s
		const bottomX = cx - Math.cos(angle) * s
		const bottomY = cy - Math.sin(angle) * s

		const path1 = new Path(0, 0, w, h)
		path1.moveTo(topX, topY)
		path1.lineTo(bottomX, bottomY)
		path1.lineTo(0, h)
		path1.lineTo(0, 0)
		path1.closePath()

		const path2 = new Path(0, 0, w, h)
		path2.moveTo(topX, topY)
		path2.lineTo(bottomX, bottomY)
		path2.lineTo(w, h)
		path2.lineTo(w, 0)
		path2.closePath()

		const canvas1 = document.createElement('canvas')
		canvas1.width = w
		canvas1.height = h
		const fragmentCtx = canvas1.getContext('2d')!
		const fragment1 = new Texture('')
		fragment1.texture = canvas1
		fragmentCtx.translate(-path1.x1, -path1.y1)
		fragmentCtx.drawImage(texture.texture, 0, 0)
		fragmentCtx.globalCompositeOperation = 'destination-in'
		fragmentCtx.fill(path1)
		fragmentCtx.globalCompositeOperation = 'source-over'

		// Debug
		// fragmentCtx.fillStyle = 'red'
		// fragmentCtx.fillRect(cx, cy, 10, 10)

		const canvas2 = document.createElement('canvas')
		canvas2.width = w
		canvas2.height = h
		const fragment2Ctx = canvas2.getContext('2d')!
		const fragment2 = new Texture('')
		fragment2.texture = canvas2
		fragmentCtx.translate(-path2.x1, -path2.y1)
		fragment2Ctx.drawImage(texture.texture, 0, 0)
		fragment2Ctx.globalCompositeOperation = 'destination-in'
		fragment2Ctx.fill(path2)
		fragment2Ctx.globalCompositeOperation = 'source-over'

		const f_x = this.ox + (-w / 2 + (path1.x1 + path1.x2) / 2) * f_scale
		const f_z = (h - (path1.y1 + path1.y2) / 2) * f_scale + this.z
		const fdx = -1.3
		const rotation = -0.023
		const fdy = 0
		const fdz = 2 + Math.random() * 1
		this.game.particles.addGarbage(f_x, this.oy - 15, f_z - 15, fdx, fdy, fdz, fragment1, 1, rotation, f_scale, 0, 70)

		const f2_x = this.ox + (-w / 2 + (path2.x1 + path2.x2) / 2) * f_scale
		const f2_z = (h - (path2.y1 + path2.y2) / 2) * f_scale + this.z
		const f2dx = 1.3
		const rotation2 = 0.023
		const f2dy = 0
		this.game.particles.addGarbage(f2_x, this.oy - 15, f2_z - 15, f2dx, f2dy, fdz, fragment2, 1, rotation2, f_scale, 0, 70)

		// console.log({ topX, topY, bottomX, bottomY, cx, cy })

		const s_top = s * (1 + cy / h - 0.5)
		this.game.particles.addLineParticle(
			this.ox - Math.cos(angle) * s * f_scale,
			this.oy - (h - cy + Math.sin(angle) * s) * f_scale,
			this.ox + Math.cos(angle) * s_top * f_scale,
			this.oy - (h - cy - Math.sin(angle) * s_top) * f_scale,
		)

		S.leek_slice.play(this.game)
	}

	public explode(dx: number, dy: number) {

		const texture = this.frameTexture(true)

		const w = texture.texture.width
		const h = texture.texture.height
		const s = Math.max(w, h)
		const cx = w * (0.3 + Math.random() * 0.4)
		const cy = h * (0.3 + Math.random() * 0.4)
		const startAngle = Math.random() * Math.PI
		const lines = 10 + Math.random() * 12 | 0
		const f_scale = this.scale * this.growth

		for (let f = 0; f < lines; ++f) {

			const angle1 = startAngle + (f / lines) * Math.PI * 2
			const angle3 = startAngle + ((f + 1) / lines) * Math.PI * 2
			const angle2 = (angle1 + angle3) / 2

			const path = new Path(0, 0, w, h)
			path.moveTo(cx, cy)
			path.lineTo(cx + Math.cos(angle1) * s, cy + Math.sin(angle1) * s)
			path.lineTo(cx + Math.cos(angle3) * s, cy + Math.sin(angle3) * s)
			path.closePath()

			const canvas = document.createElement('canvas')
			canvas.width = path.x2 - path.x1
			canvas.height = path.y2 - path.y1
			const fragmentCtx = canvas.getContext('2d')!
			const fragment = new Texture('')
			fragment.texture = canvas

			fragmentCtx.translate(-path.x1, -path.y1)
			fragmentCtx.drawImage(texture.texture, 0, 0)
			fragmentCtx.globalCompositeOperation = 'destination-in'
			fragmentCtx.fill(path)
			fragmentCtx.globalCompositeOperation = 'source-over'

			// fragmentCtx.strokeStyle = 'red'
			// fragmentCtx.lineWidth = 2
			// fragmentCtx.strokeRect(0, 0, canvas.width, canvas.height)
			// fragmentCtx.fillStyle = 'red'
			// fragmentCtx.font = '20pt Roboto'
			// fragmentCtx.fillText('' + f, path.x1 + 10, path.y1 + 25)

			const f_x = this.ox + (-w / 2 + (path.x1 + path.x2) / 2) * f_scale
			const f_z = (h - (path.y1 + path.y2) / 2) * f_scale + this.z
			const fdx = dx * 3 + Math.cos(angle2) * 3
			const fdy = dy * 3 + Math.random() * 2
			const rotation = -0.05 + Math.random() * 0.1
			// const dx = 0
			// const dz = 0
			// const rotation = 0
			this.game.particles.addGarbage(f_x, this.oy, f_z, fdx, 0, fdy, fragment, 1, rotation, f_scale, 0, 70)
		}

		S.leek_explosion.play(this.game)
	}

	public reborn() {
		this.dead = false
		this.deadAnim = 0
		this.bubble = new Bubble(this.game)
		this.active = true
		this.updateGrowth()
	}

	public addCritical() {
		const z = Math.max(30, this.height - (this.front ? 80 : 60))
		this.game.particles.addCritical(this.ox + 30 * this.direction, this.oy, z)
		S.critical.play(this.game)
	}

	public abstract frameTexture(includeHat: boolean): Texture

	public draw(ctx: CanvasRenderingContext2D) {

		ctx.save()
		ctx.scale(this.game.ground.scale, this.game.ground.scale)
		ctx.translate(this.ox, this.oy)

		// Team square
		ctx.save()

		// Losange pré-composé (cf. TEAM_SQUARES), posé 1:1 à coordonnées entières. Le
		// remplissage n'est cuit que pour l'entité dont c'est le tour.
		const color = TEAM_COLORS[this.team - 1]
		const tileX = this.game.ground.realTileSizeX, tileY = this.game.ground.realTileSizeY
		const current = this.id === this.game.currentPlayer
		let m: DOMMatrix | null = null, stroke: BakedSprite | null = null, fill: BakedSprite | null = null
		if (CAN_BAKE && ctx.filter === 'none') {
			m = ctx.getTransform()
			stroke = teamSquare(this, color, tileX, tileY, false, m)
			fill = current ? teamSquare(this, color, tileX, tileY, true, m) : null
		}
		if (m && stroke && (fill || !current)) {
			if (fill) {
				ctx.globalAlpha = 0.5
				blitBaked(ctx, fill, m)
			}
			ctx.globalAlpha = 0.8 * (1 - this.deadAnim)
			blitBaked(ctx, stroke, m)
		} else {
			this.drawTeamSquare(ctx, color, tileX, tileY, current)
		}
		ctx.restore()

		if (this.crashAnim) {
			const brightness = Math.min(100, Math.abs(this.crashAnim - 25))
			ctx.filter = 'brightness(' + brightness + '%)'
		}

		// Integrate z pos
		ctx.translate(0, - this.z)
	}

	/**
	 * Tracé direct du losange d'équipe : repli tant que sa version pré-composée
	 * n'est pas prête (cf. TEAM_SQUARES), ou si un filtre est en cours.
	 */
	private drawTeamSquare(ctx: CanvasRenderingContext2D, color: string, tileX: number, tileY: number, current: boolean) {
		if (current) {
			ctx.globalAlpha = 0.5
			paintDiamond(ctx, color, tileX, tileY, true)
		}
		ctx.globalAlpha = 0.8 * (1 - this.deadAnim)
		paintDiamond(ctx, color, tileX, tileY, false)
	}

	public endDraw(ctx: CanvasRenderingContext2D) {
		// if (this.dead) { return  }
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
			ctx.font = "bold 18pt Roboto"

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
			ctx.fillStyle = this.game.map.reachableColor

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

		const effect_size = 30
		const reverse = Math.min(0.7, this.game.textRatio / this.game.ground.scale)
		const z = LeekWars.objectSize(this.effects) > 0 && this.game.showEffects ? effect_size : 0
		const y = Math.max(-this.game.ground.startY / this.game.ground.scale + 20, this.oy - this.height - this.baseZ - 30 - z * reverse)
		ctx.translate(this.ox, y)

		ctx.scale(reverse, reverse)

		// Le repère de la plaque n'est qu'un agrandissement et une translation, sans
		// rotation : m.a est l'échelle réelle du contexte, (m.e, m.f) sa position.
		const m = ctx.getTransform()
		const active = this === this.game.selectedEntity || this === this.game.hoverEntity || this === this.game.mouseEntity
		const plate = this.namePlate || (this.namePlate = new NamePlate())
		// L'agonie fait varier l'opacité à chaque image : dessin direct
		const stable = plate.same(this, active, m) && this.deadAnim === 0

		if (stable && plate.bitmap) {
			ctx.save()
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.globalAlpha = 1
			ctx.drawImage(plate.bitmap, Math.floor(m.e) + plate.x, Math.floor(m.f) + plate.y)
			ctx.restore()
		} else {
			let text = this.translatedName + " (" + Math.round(this.displayLife) + ")"
			if (this.game.showIDs) { text = '#' + this.id + ' • ' + text }
			ctx.font = NAME_PLATE_FONT
			const width = Math.max(120, ctx.measureText(text).width + 14)
			paintNamePlate(ctx, text, width, active, 1 - this.deadAnim)
			paintLifeBar(ctx, this, width)

			// Effects
			if (this.game.showEffects) {
				const count = LeekWars.objectSize(this.effects)
				let x = -count * effect_size / 2
				// Les pastilles sont pré-composées (cf EFFECT_BADGES) à l'échelle RÉELLE
				// du contexte — que l'on lit plutôt que de la recalculer — puis posées
				// calées sur la grille de pixels : le même bitmap décalé d'un demi-pixel
				// serait entièrement mélangé à ses voisins, et c'est CE décalage qui
				// floutait les pastilles, pas la pré-composition.
				const quality = m.a, scaleY = m.d, offsetX = m.e, offsetY = m.f
				const margin = EFFECT_BADGE_MARGIN / quality
				const alpha = 1 - this.deadAnim
				ctx.globalAlpha = alpha
				for (const e in this.effects) {
					const effect = this.effects[e]
					const bitmap = getEffectBadge(effect, effect_size, quality)
					if (bitmap) {
						// Poser le bitmap à SA taille : un canevas se compte en pixels
						// entiers, et poser 19 px dans 18,1 rééchantillonnerait ce qui
						// doit rester un blit au pixel près.
						ctx.drawImage(bitmap,
							snapToPixel(x - margin, quality, offsetX),
							snapToPixel(effect_size - margin, scaleY, offsetY),
							bitmap.width / quality, bitmap.height / quality)
					} else {
						ctx.save()
						ctx.translate(x, effect_size)
						drawEffectBadge(ctx, effect, effect_size, alpha)
						ctx.restore()
					}
					x += effect_size
				}
			}
			if (stable) { plate.compose(this, text, width, effect_size, m) }
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
		// Posé ici : quand la plaque est un bitmap, plus personne ne l'a réglé avant
		ctx.textBaseline = "middle"
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
			this.bubble.draw(ctx, this.height + 30, this.isTop)
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

	public hurt(x: number, y: number, z: number, dx: number, dy: number, dz: number) {

		if (this.type === EntityType.TURRET || this.type === EntityType.CHEST) { return }

		if (this.bloodTex) {
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
		}
		if (!this.dead) {
			this.flash = 5
		}
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

	addState(state: number) {
		this.states.add(state)
		FightEntity.stateImage(state)
	}
}

export { DamageType, EntityType, EntityDirection, FightEntity }
