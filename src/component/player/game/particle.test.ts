import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))

import { explosionColors, PLUTONIUM_FIRE, prepareParticleSprites, RealisticExplosion } from '@/component/player/game/particle'
import { discs } from '@/component/player/game/particle-sprites'
import type { Game } from '@/component/player/game/game'

interface Rond { alpha: number, couleur: string, x: number, y: number, r: number }

// Contexte minimal qui applique la règle du canvas pour globalAlpha : une valeur hors de
// [0, 1] est IGNORÉE. Chaque disque rempli est relevé avec l'alpha effectif du moment.
function contexte() {
	let alpha = 1
	let arc: [number, number, number] | null = null
	const ronds: Rond[] = []
	const ctx = {
		get globalAlpha() { return alpha },
		set globalAlpha(v: number) { if (v >= 0 && v <= 1) { alpha = v } },
		fillStyle: '',
		beginPath() { arc = null },
		closePath() {},
		arc(x: number, y: number, r: number) { arc = [x, y, r] },
		fill() { if (arc) { ronds.push({ alpha, couleur: ctx.fillStyle, x: arc[0], y: arc[1], r: arc[2] }) } },
		drawImage() { throw new Error('pas de bitmap sans canvas') },
	}
	return { ctx: ctx as unknown as CanvasRenderingContext2D, ronds }
}

function rgb(couleur: string) {
	const m = couleur.match(/-?[\d.]+/g)!.map(Number)
	return m.map((v) => Math.round(Math.min(255, Math.max(0, v))))
}

function explosion(age: number, colorFn?: (t: number) => string) {
	let graine = 7
	vi.spyOn(Math, 'random').mockImplementation(() => (graine = (graine * 16807) % 2147483647) / 2147483647)
	const game = { ground: { realTileSizeY: 35, width: 2000, height: 2000 } } as unknown as Game
	const e = new RealisticExplosion(game, 500, 500, 2, colorFn)
	for (let t = 0; t < age; t++) { e.update(1) }
	return e
}

describe('RealisticExplosion posée à plat', () => {

	afterEach(() => { vi.restoreAllMocks() })

	// Âges choisis pour couvrir : tout opaque, vagues qui s'éteignent pendant que d'autres
	// sont neuves (alpha hérité), points morts, fin de l'explosion.
	for (const age of [1, 12, 30, 36, 42, 47, 52, 60]) {
		it(`dessine les mêmes boules de feu, au même alpha, que le tracé d'origine (âge ${age})`, () => {
			const e = explosion(age)
			const avant = contexte(), apres = contexte()
			e.draw(avant.ctx)
			e.blit(apres.ctx, 0, 0, 1)
			const visibles = avant.ronds.filter((r) => r.alpha > 0)
			expect(apres.ronds.length).toBe(visibles.length)
			visibles.forEach((r, i) => {
				const b = apres.ronds[i]
				expect(b.alpha).toBe(r.alpha)
				expect([b.x, b.y, b.r]).toEqual([r.x, r.y, r.r])
				// Couleur prise à la vie arrondie : au plus une demi-unité de vie d'écart
				rgb(b.couleur).forEach((v, k) => expect(Math.abs(v - rgb(r.couleur)[k])).toBeLessThanOrEqual(11))
			})
		})
	}

	it('suit la couleur choisie par l\'arme', () => {
		const orange = (t: number) => 'rgb(255, ' + Math.round(165 + 90 * t) + ', 0)'
		const e = explosion(20, orange)
		const avant = contexte(), apres = contexte()
		e.draw(avant.ctx)
		e.blit(apres.ctx, 0, 0, 1)
		expect(apres.ronds.length).toBe(avant.ronds.filter((r) => r.alpha > 0).length)
		apres.ronds.forEach((b, i) => rgb(b.couleur).forEach((v, k) => expect(Math.abs(v - rgb(avant.ronds[i].couleur)[k])).toBeLessThanOrEqual(1)))
	})
})

describe('Feuilles de disques préparées avant le combat', () => {

	afterEach(() => { vi.restoreAllMocks() })

	// Hors de la feuille, un disque retombe en cercle vectoriel — ce que la préparation
	// évite pendant le combat (canvas accéléré de Firefox saturé à la première explosion).
	for (const k of [0.6, 0.88, 1.5]) {
		it(`couvrent chaque boule de feu des trois tailles d'explosion (échelle ${k})`, () => {
			prepareParticleSprites(k, [PLUTONIUM_FIRE])
			for (const [radius, palette] of [[1.5, undefined], [2, undefined], [3, undefined], [3, PLUTONIUM_FIRE]] as const) {
				let graine = 11
				vi.spyOn(Math, 'random').mockImplementation(() => (graine = (graine * 16807) % 2147483647) / 2147483647)
				const game = { ground: { realTileSizeY: 35, width: 2000, height: 2000 } } as unknown as Game
				const e = new RealisticExplosion(game, 500, 500, radius, palette)
				const colors = explosionColors(palette)
				for (let t = 0; t < RealisticExplosion.LIFE - 1; t++) {
					e.update(1)
					for (const source of e.sources) {
						for (const p of source.points) {
							if (p.life <= 0) { continue }
							const sheet = discs(colors[Math.round(p.life)]).sheet!
							expect(sheet.frames.has(Math.round(p.s * k * 2))).toBe(true)
						}
					}
				}
				vi.restoreAllMocks()
			}
		})
	}
})
