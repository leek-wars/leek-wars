/**
 * Particules posées à plat : des images préparées à leur taille à l'écran, rangées en
 * feuilles de sprites, et posées en copie 1:1 à coordonnées entières.
 *
 * Flammes, gaz et boules de feu des explosions sont nombreux et éphémères. Ils se
 * dessinaient un par un : une case de planche agrandie à chaque image, ou un cercle
 * vectoriel refait de zéro. Sous Firefox, une flamme agrandie coûte 15 à 27 µs et un
 * cercle ~5 µs ; posés en copies alignées, ~5 et ~0,6 µs. Une pluie de météorites en
 * enchaîne près de deux mille par image.
 *
 * Tout est préparé au lancement du combat et à chaque changement d'échelle, jamais
 * pendant : avec le canvas accéléré de Firefox (processus GPU), des cercles tracés en
 * attendant les sprites et des sprites cuits en plein combat saturaient la puce
 * graphique à la première explosion — images affichées 200 à 460 ms en retard. Une
 * feuille par planche (feu, gaz) et par couleur de boule de feu, peinte d'un coup sur un
 * canevas côté processeur (sans aller-retour avec le GPU), puis découpée une fois pour
 * toutes en bitmaps : sous Firefox, poser un bitmap entier coûte ~1 µs, en découper un
 * morceau dans la feuille à chaque dessin ~3,3 µs — autant qu'un cercle.
 */
import { CAN_BAKE } from './baked-sprite'

/**
 * Seulement sous Gecko (Firefox et ses dérivés), dont le canvas rastérise chaque ordre
 * au moment de l'appel. Chromium enregistre les ordres et laisse le GPU les exécuter : un
 * cercle y coûte moins à enregistrer qu'un drawImage, les disques préparés doublaient le
 * temps de l'explosion et les cases agrandies n'y changeaient rien.
 */
export const STAMPS = CAN_BAKE && typeof navigator !== 'undefined' && /\bGecko\/\d/.test(navigator.userAgent)

/** Emplacement d'un sprite dans sa feuille. */
interface Frame { sx: number, sy: number, w: number, h: number }

export interface Sheet {
	frames: Map<number, Frame>
	/** Les sprites découpés, par clé : vide tant que la feuille n'est pas prête, ou si elle a échoué. */
	bitmaps: Map<number, ImageBitmap>
	dead: boolean
}

interface Sprite { key: number, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void }

const SHEET_WIDTH = 1024
const GAP = 1

/**
 * Range les sprites en étagères dans un seul canevas, puis le découpe en bitmaps. `paint` dessine
 * dans la boîte (0, 0, w, h) de son sprite.
 */
function buildSheet(sprites: Sprite[]): Sheet {
	const sheet: Sheet = { frames: new Map(), bitmaps: new Map(), dead: false }
	let x = 0, y = 0, shelf = 0, width = 0
	for (const s of sprites) {
		if (x + s.w > SHEET_WIDTH) { x = 0; y += shelf + GAP; shelf = 0 }
		sheet.frames.set(s.key, { sx: x, sy: y, w: s.w, h: s.h })
		x += s.w + GAP
		shelf = Math.max(shelf, s.h)
		width = Math.max(width, x)
	}
	const height = y + shelf
	if (!(width > 0) || !(height > 0)) { return sheet }
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	// Côté processeur exprès : préparer ne doit rien demander au GPU (cf. en-tête)
	const ctx = canvas.getContext('2d', { willReadFrequently: true })
	if (!ctx) { return sheet }
	for (const s of sprites) {
		const f = sheet.frames.get(s.key)!
		ctx.save()
		ctx.translate(f.sx, f.sy)
		s.paint(ctx)
		ctx.restore()
	}
	const keys = [...sheet.frames.keys()]
	Promise.all(keys.map((key) => {
		const f = sheet.frames.get(key)!
		return createImageBitmap(canvas, f.sx, f.sy, f.w, f.h)
	})).then((bitmaps) => {
		if (sheet.dead) {
			bitmaps.forEach((b) => b.close())
		} else {
			bitmaps.forEach((b, i) => sheet.bitmaps.set(keys[i], b))
		}
	}, () => {})
	return sheet
}

function kill(sheet: Sheet) {
	sheet.bitmaps.forEach((b) => b.close())
	sheet.bitmaps.clear()
	sheet.dead = true
}

/** Côté des cases des planches de particules (feu, gaz). */
export const CELL = 20
const CELLS = new Map<HTMLImageElement | HTMLCanvasElement, Sheet>()
const cellKey = (cell: number, size: number) => cell * 1024 + size

/** Prépare la feuille d'une planche : ses cases `[cell, taille en pixels]`. */
export function prepareCells(sheet: HTMLImageElement | HTMLCanvasElement, cells: Iterable<[number, number]>) {
	const old = CELLS.get(sheet)
	if (old) { kill(old) }
	const sprites: Sprite[] = []
	for (const [cell, s] of cells) {
		if (s <= 0 || s >= 1024) { continue }
		sprites.push({ key: cellKey(cell, s), w: s, h: s, paint: (c) => c.drawImage(sheet, cell * CELL, 0, CELL, CELL, 0, 0, s, s) })
	}
	CELLS.set(sheet, buildSheet(sprites))
}

/**
 * Case `cell` de la planche, agrandie à `size` pixels et centrée en (x, y), dans le
 * repère du canvas (matrice identité).
 */
export function blitCell(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement | HTMLCanvasElement, cell: number, x: number, y: number, size: number) {
	const s = Math.round(size)
	const bitmap = CELLS.get(sheet)?.bitmaps.get(cellKey(cell, s))
	if (bitmap) {
		ctx.drawImage(bitmap, Math.round(x - s / 2), Math.round(y - s / 2))
	} else {
		ctx.drawImage(sheet, cell * CELL, 0, CELL, CELL, x - size / 2, y - size / 2, size, size)
	}
}

/** Disques d'une couleur, par rayon en demi-pixels. */
export interface Discs {
	color: string
	sheet: Sheet | null
}

const DISCS = new Map<string, Discs>()

export function discs(color: string): Discs {
	let table = DISCS.get(color)
	if (!table) {
		table = { color, sheet: null }
		DISCS.set(color, table)
	}
	return table
}

/** Côté du sprite d'un disque de `h` demi-pixels de rayon : pair, centre sur un coin de pixel. */
const discSide = (h: number) => 2 * Math.ceil(h / 2) + 2

/** Prépare la feuille d'une couleur : ses disques de `hMin` à `hMax` demi-pixels de rayon. */
export function prepareDiscs(color: string, hMin: number, hMax: number) {
	const table = discs(color)
	if (table.sheet) { kill(table.sheet) }
	const sprites: Sprite[] = []
	for (let h = Math.max(1, hMin); h <= Math.min(511, hMax); h++) {
		const w = discSide(h)
		sprites.push({ key: h, w, h: w, paint: (c) => {
			c.fillStyle = color
			c.beginPath()
			c.arc(w / 2, w / 2, h / 2, 0, 2 * Math.PI)
			c.fill()
		} })
	}
	table.sheet = buildSheet(sprites)
}

/** Disque plein de rayon `r` centré en (x, y), dans le repère du canvas (matrice identité). */
export function blitDisc(ctx: CanvasRenderingContext2D, table: Discs, x: number, y: number, r: number) {
	const bitmap = table.sheet?.bitmaps.get(Math.round(r * 2))
	if (bitmap) {
		const half = bitmap.width / 2
		ctx.drawImage(bitmap, Math.round(x) - half, Math.round(y) - half)
	} else {
		ctx.fillStyle = table.color
		ctx.beginPath()
		ctx.arc(x, y, r, 0, 2 * Math.PI)
		ctx.fill()
	}
}
