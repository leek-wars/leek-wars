/**
 * Images cuites sous une transformation linéaire (rotation, échelle, miroir), à leur
 * taille finale à l'écran, puis posées en copie 1:1 à coordonnées entières.
 *
 * Un `drawImage` tourné, ou un tracé vectoriel refait de zéro, coûte bien plus qu'un
 * blit aligné sur les axes. Tout ce que le moteur dessine de la même façon image après
 * image — silhouette d'arme, ombres, losanges d'équipe — est donc cuit une fois pour
 * la matrice courante et reposé tel quel tant qu'elle ne change pas.
 *
 * Chaque porteur (poireau, entité) garde un mémo de SON dernier sprite : le chemin
 * chaud se résume à quelques comparaisons de flottants. La clé textuelle et la Map ne
 * servent qu'au changement de matrice ou de source — bâtir la clé à chaque image
 * coûtait plus que la rotation économisée.
 *
 * Usage :
 *   if (!memoMatches(porteur.memo, tag, m)) { porteur.memo = CACHE.lookup(clé, tag, m, rects, paint) }
 *   const sprite = ready(porteur.memo)
 *   if (sprite) { ctx.save(); blitBaked(ctx, sprite, m); ctx.restore() } else { dessin direct }
 */

export interface BakedSprite {
	/** Nul tant que la cuisson n'est pas finie, ou pour de bon si elle a échoué. */
	bitmap: ImageBitmap | null
	dx: number
	dy: number
	/** Purgé : les porteurs qui le mémorisaient doivent en redemander un. */
	dead: boolean
}

/** Ce qu'un porteur retient de son dernier sprite, pour éviter la Map. */
export interface BakedMemo {
	/** Coefficients bruts : tant que la matrice ne bouge pas, ils sont identiques au bit près. */
	ra: number
	rb: number
	rc: number
	rd: number
	/** Les mêmes arrondis au 1/500 : ce qui entre dans la clé. */
	a: number
	b: number
	c: number
	d: number
	/** Ce qui, en plus de la matrice, identifie le sprite (arme, canevas source, couleur…). */
	tag: unknown
	sprite: BakedSprite
}

/** Rectangle dans le repère local : x, y, largeur, hauteur. */
export type BakedRect = readonly [number, number, number, number]

export const CAN_BAKE = typeof createImageBitmap === 'function'

const round = (x: number) => Math.round(x * 500) / 500

/** Le mémo vaut-il encore pour ce tag et cette matrice ? Le chemin chaud. */
export function memoMatches(memo: BakedMemo | null, tag: unknown, m: DOMMatrix): memo is BakedMemo {
	if (!memo || memo.sprite.dead || memo.tag !== tag) { return false }
	if (memo.ra === m.a && memo.rb === m.b && memo.rc === m.c && memo.rd === m.d) { return true }
	if (memo.a !== round(m.a) || memo.b !== round(m.b) || memo.c !== round(m.c) || memo.d !== round(m.d)) { return false }
	// Même sprite à l'arrondi près : on retient la nouvelle matrice pour la comparaison exacte
	memo.ra = m.a; memo.rb = m.b; memo.rc = m.c; memo.rd = m.d
	return true
}

/** Le sprite du mémo, s'il est prêt à être posé. */
export function ready(memo: BakedMemo | null): BakedSprite | null {
	return memo && memo.sprite.bitmap ? memo.sprite : null
}

/**
 * Pose le sprite en copie 1:1, calée sur la grille de pixels du canvas. Remet la
 * matrice à l'identité : l'appelant l'encadre d'un save/restore.
 */
export function blitBaked(ctx: CanvasRenderingContext2D, sprite: BakedSprite, m: DOMMatrix) {
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.drawImage(sprite.bitmap!, Math.round(m.e) + sprite.dx, Math.round(m.f) + sprite.dy)
}

export class BakedSpriteCache {

	private readonly sprites = new Map<string, BakedSprite>()

	constructor(private readonly max: number) {}

	/**
	 * Le sprite de cette clé pour la matrice courante, cuit s'il manque (`rects` borne ce
	 * que `paint` dessine, dans le repère local). Rend le mémo à garder sur le porteur.
	 */
	public lookup(key: string, tag: unknown, m: DOMMatrix, rects: readonly BakedRect[], paint: (ctx: CanvasRenderingContext2D) => void): BakedMemo {
		const a = round(m.a), b = round(m.b), c = round(m.c), d = round(m.d)
		const fullKey = key + '|' + a + '|' + b + '|' + c + '|' + d
		let sprite = this.sprites.get(fullKey)
		if (!sprite) {
			if (this.sprites.size >= this.max) { this.clear() }
			sprite = bake(m, rects, paint)
			this.sprites.set(fullKey, sprite)
		}
		return { ra: m.a, rb: m.b, rc: m.c, rd: m.d, a, b, c, d, tag, sprite }
	}

	public clear() {
		killSprites(this.sprites.values())
		this.sprites.clear()
	}
}

/** Referme les bitmaps et marque les sprites morts : leurs porteurs en redemanderont. */
function killSprites(sprites: Iterable<BakedSprite | undefined>) {
	for (const sprite of sprites) {
		if (!sprite) { continue }
		if (sprite.bitmap) { sprite.bitmap.close() }
		sprite.bitmap = null
		sprite.dead = true
	}
}

/**
 * Cuit `paint` sous la matrice. Rend toujours une entrée : une boîte aberrante, un
 * contexte refusé ou un createImageBitmap en échec la laissent sans bitmap, et l'appelant
 * dessine directement. La retirer à la place ferait recuire à chaque image.
 */
function bake(m: DOMMatrix, rects: readonly BakedRect[], paint: (ctx: CanvasRenderingContext2D) => void): BakedSprite {
	const sprite: BakedSprite = { bitmap: null, dx: 0, dy: 0, dead: false }

	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
	for (const [x, y, w, h] of rects) {
		for (const px of [x, x + w]) {
			for (const py of [y, y + h]) {
				const sx = m.a * px + m.c * py, sy = m.b * px + m.d * py
				if (sx < minX) { minX = sx }
				if (sx > maxX) { maxX = sx }
				if (sy < minY) { minY = sy }
				if (sy > maxY) { maxY = sy }
			}
		}
	}
	minX = Math.floor(minX - 1); maxX = Math.ceil(maxX + 1)
	minY = Math.floor(minY - 1); maxY = Math.ceil(maxY + 1)
	const largeur = maxX - minX, hauteur = maxY - minY
	// Une boîte démesurée trahirait une matrice aberrante : pas de canevas géant
	if (!(largeur > 0) || !(hauteur > 0) || largeur > 2000 || hauteur > 2000) { return sprite }

	return bakeCanvas(largeur, hauteur, minX, minY, (ctx) => {
		ctx.setTransform(m.a, m.b, m.c, m.d, -minX, -minY)
		paint(ctx)
	})
}

/**
 * Peint un canevas de `width` × `height` et le fige en bitmap, posé ensuite à (dx, dy) du
 * point d'ancrage. Même règle que `bake` : l'entrée reste, sans bitmap, en cas d'échec.
 */
function bakeCanvas(width: number, height: number, dx: number, dy: number, paint: (ctx: CanvasRenderingContext2D) => void): BakedSprite {
	const sprite: BakedSprite = { bitmap: null, dx, dy, dead: false }
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	// ⚠️ Surtout PAS de `willReadFrequently` : il force un canevas côté processeur, dont
	// le filtrage n'est pas celui du canevas accéléré du jeu — la cuisson sortait
	// sensiblement plus molle que le dessin direct.
	const ctx = canvas.getContext('2d')
	if (!ctx) { return sprite }
	paint(ctx)
	createImageBitmap(canvas).then((bitmap) => {
		if (sprite.dead) { bitmap.close() } else { sprite.bitmap = bitmap }
	}, () => {})
	return sprite
}
