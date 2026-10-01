import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))
// Path2D est absent de happy-dom : celui-ci compte les losanges tracés.
vi.hoisted(() => {
	globalThis.Path2D = class {
		diamonds = 0
		moveTo() { this.diamonds++ }
		lineTo() {}
		closePath() {}
	} as unknown as typeof Path2D
})

import { Game } from '@/component/player/game/game'

type Marker = { owner: number, color: string, duration: number, x: number, y: number }
type TextMarker = Marker & { text: string }

// Contexte qui relève chaque remplissage et chaque texte avec l'état du moment.
function context(log: string[]) {
	const stack: [number, string, string][] = []
	const ctx = {
		globalAlpha: 1,
		globalCompositeOperation: 'source-over',
		fillStyle: '',
		save() { stack.push([ctx.globalAlpha, ctx.globalCompositeOperation, ctx.fillStyle]) },
		restore() { [ctx.globalAlpha, ctx.globalCompositeOperation, ctx.fillStyle] = stack.pop()! },
		scale() {},
		translate() {},
		strokeText() {},
		fillText(text: string) { log.push(`texte ${text}`) },
		fill(path: { diamonds: number }) { log.push(`${ctx.fillStyle} ${ctx.globalAlpha} ${ctx.globalCompositeOperation} ×${path.diamonds}`) },
	}
	return ctx
}

// Le prototype est greffé sans constructeur : un Game complet demanderait textures et canvas.
function game(log: string[], options: { markers?: {[cell: number]: Marker}, texts?: {[cell: number]: TextMarker}, marksForeground?: boolean, showCells?: boolean }) {
	const ground = {
		tileSizeX: 64, tileSizeY: 32, scale: 1,
		xyToXYPixels: (x: number, y: number) => ({ x: x * 32 + 32, y: y * 16 + 16 }),
		draw() {}, endDraw() {}, drawCellNumbers() { log.push('numéros') },
	}
	const poireau = { draw: () => log.push('poireau') }
	const ctx = context(log)
	const g = Object.assign(Object.create(Game.prototype), {
		ctx, ground, markers: options.markers ?? {}, markersText: options.texts ?? {},
		marksForeground: options.marksForeground ?? false, showCells: options.showCells ?? false,
		particles: { drawGround() {}, drawAir() {} },
		leeks: [], chips: [], drawableElements: [{ 1: poireau }],
		drawArea: 0, showCellTime: 0, requestPause: false,
	}) as Game
	return { g, ctx }
}

const marker = (color: string, x: number, y: number): Marker => ({ owner: 0, color, duration: 1, x, y })
const text = (value: string): TextMarker => ({ ...marker('#ffffff', 0, 0), text: value })
const markers = () => ({ 10: marker('#ff0000', 0, 0), 11: marker('#ff0000', 2, 0), 12: marker('#00ff00', 1, 1) })

describe('Game : marques', () => {

	it('par défaut, marques et textes restent sous les poireaux, un tracé par couleur', () => {
		const log: string[] = []
		const { g } = game(log, { markers: markers(), texts: { 20: text('A') } })
		g.draw()
		expect(log).toEqual([
			'#ff0000 0.7 source-over ×2',
			'#00ff00 0.7 source-over ×1',
			'texte A',
			'poireau',
		])
	})

	it('mark() en premier plan : les marques repassent par-dessus les poireaux, en source-atop, et les textes devant', () => {
		const log: string[] = []
		const { g, ctx } = game(log, { markers: markers(), texts: { 20: text('A') }, marksForeground: true })
		g.draw()
		expect(log).toEqual([
			'#ff0000 0.7 source-over ×2',
			'#00ff00 0.7 source-over ×1',
			'poireau',
			'#ff0000 0.5 source-atop ×2',
			'#00ff00 0.5 source-atop ×1',
			'texte A',
		])
		expect(ctx.globalCompositeOperation).toBe('source-over')
		expect(ctx.globalAlpha).toBe(1)
	})

	for (const marksForeground of [false, true]) {
		it(`les numéros des cases remplacent les textes (premier plan : ${marksForeground})`, () => {
			const log: string[] = []
			const { g } = game(log, { texts: { 20: text('A') }, marksForeground, showCells: true })
			g.draw()
			expect(log).toEqual(['poireau', 'numéros'])
		})
	}

	it('sans marque, rien n\'est dessiné', () => {
		const log: string[] = []
		const { g, ctx } = game(log, {})
		const save = vi.spyOn(ctx, 'save')
		g.drawMarkers(0.5, 'source-atop')
		expect(save).not.toHaveBeenCalled()
		expect(log).toEqual([])
	})
})
