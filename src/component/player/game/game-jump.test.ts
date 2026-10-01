import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))
vi.hoisted(() => {
	// Path2D est absent de happy-dom.
	if (typeof globalThis.Path2D === 'undefined') {
		globalThis.Path2D = class { } as unknown as typeof Path2D
	}
})

import { Game } from '@/component/player/game/game'
import { Ground } from '@/component/player/game/ground'

// Prototypes greffés sans constructeur : un Game complet demanderait textures et canvas.
function game(currentAction: number) {
	const clearTraces = vi.fn()
	const g = Object.assign(Object.create(Game.prototype), {
		ground: { clearTraces, field: { resetCells() {} } },
		leeks: [], chips: [], particles: { particles: [] }, consoleLineIds: new Set(), actions: [],
		currentAction,
		clearMarks() {}, log() {}, readLogs() {}, readTrophies() {}, doAction() {},
		updateReachableCells() {}, actionDone() {}, draw() {}, refreshUI() {},
	}) as Game
	return { g, clearTraces }
}

function ground(hasTraces: boolean) {
	const ctx = { save() {}, restore() {}, setTransform() {}, drawImage: vi.fn(), globalCompositeOperation: 'source-over' }
	const gr = Object.assign(Object.create(Ground.prototype), {
		game: { shadows: true }, width: 800, height: 400, hasTraces,
		texture: { width: 800, height: 400 }, textureCtx: ctx,
	}) as Ground
	// resize() repeint un fond propre, sans trace.
	const resize = vi.spyOn(gr, 'resize').mockImplementation(() => { gr.hasTraces = false })
	return { gr, ctx, resize }
}

describe('Game.jump : traces au sol', () => {
	it('revenir en arrière efface les traces', () => {
		const { g, clearTraces } = game(6)
		g.jump(3)
		expect(clearTraces).toHaveBeenCalled()
	})

	it('avancer garde les traces déjà peintes', () => {
		const { g, clearTraces } = game(3)
		g.jump(6)
		expect(clearTraces).not.toHaveBeenCalled()
	})
})

describe('Ground.clearTraces', () => {
	it("un sol sans trace n'est pas repeint", () => {
		const { gr, resize } = ground(false)
		gr.clearTraces()
		expect(resize).not.toHaveBeenCalled()
	})

	it('repeint le fond une fois, puis recolle sa copie', () => {
		const { gr, ctx, resize } = ground(true)
		gr.clearTraces()
		expect(resize).toHaveBeenCalledWith(800, 400, true)
		gr.hasTraces = true
		gr.clearTraces()
		expect(resize).toHaveBeenCalledTimes(1)
		expect(ctx.drawImage).toHaveBeenCalledTimes(1)
		expect(gr.hasTraces).toBe(false)
	})
})
