import { beforeEach, describe, expect, it, vi } from 'vitest'

// game.ts amorce l'application entière (store, vue.ts) : maps.ts ne lui prend
// que deux constantes de rendu, et LeekWars que le préfixe des URL statiques.
vi.mock('@/component/player/game/game', () => ({ SHADOW_ALPHA: 0.2, SHADOW_SCALE: 0.4 }))
vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/', shadeColor: (color: string) => color } }))

import type { Game } from '@/component/player/game/game'
import { Beach, Cemetery, Factory } from '@/component/player/game/maps'
import { T } from '@/component/player/game/texture'

// happy-dom ne fournit pas de contexte 2D : on enregistre les appels à la main,
// en refusant les images non dessinables comme le fait le navigateur
function fakeContext() {
	const drawn: unknown[] = []
	const ctx = {
		save: () => undefined,
		restore: () => undefined,
		translate: () => undefined,
		scale: () => undefined,
		rotate: () => undefined,
		drawImage: (image: unknown) => {
			if (!image) { throw new TypeError("Argument 1 could not be converted to any of: HTMLImageElement...") }
			drawn.push(image)
		},
	} as unknown as CanvasRenderingContext2D
	return { drawn, ctx }
}

function drawFactory() {
	// `drawDetails` ne se sert du Game que pour les dimensions de la grille
	const map = new Factory({ ground: { gridWidth: 800, gridHeight: 400, scale: 1 } } as unknown as Game)
	map.random.seed(42)
	const { drawn, ctx } = fakeContext()
	map.drawDetails(ctx)
	return drawn
}

describe('Factory.drawDetails', () => {

	// Les textures de T sont des singletons partagés : on repart de l'état réel
	// juste après `create()`, où `load()` a posé une Image encore vide
	beforeEach(() => {
		T.arrows.texture = new Image()
		T.factory_bolt.texture = new Image()
		T.factory_wrench.texture = new Image()
		T.factory_bolt.shadow = null
	})

	it('ne dessine pas d\'ombre tant que la texture n\'est pas chargée', () => {
		// `drawImage(null)` lève « Argument 1 could not be converted » (#4730)
		expect(() => drawFactory()).not.toThrow()
	})

	it('dessine l\'ombre une fois la texture chargée', () => {
		const shadow = document.createElement('canvas')
		T.factory_bolt.shadow = shadow

		expect(drawFactory()).toContain(shadow)
	})
})

describe('Mode sombre des cartes', () => {

	// Le Game n'est là que pour l'état de nuit et les couleurs tactiques
	const fakeGame = (night: boolean) => ({ night }) as unknown as Game

	it('assombrit d\'autant plus une carte claire', () => {
		// Multiply : plus la teinte est basse, plus la carte s'assombrit. La plage
		// est éblouissante en thème sombre, le cimetière est déjà nocturne (#4879)
		const plage = Number(new Beach(fakeGame(true)).nightColor.match(/\d+/)![0])
		const cimetiere = Number(new Cemetery(fakeGame(true)).nightColor.match(/\d+/)![0])

		expect(plage).toBeLessThan(cimetiere)
		expect(cimetiere).toBeLessThan(255)
	})

	it('éclaircit les traits quand le fond est assombri', () => {
		const nuit = new Factory(fakeGame(true))
		const jour = new Factory(fakeGame(false))

		// Grille, cases atteignables et damier sont dessinés par-dessus le fond
		// teinté : ils repassent en clair, et le HUD suit la carte
		expect([nuit.isDark, nuit.gridColor, nuit.reachableColor]).toEqual([true, '#fff', '#fff'])
		expect([jour.gridColor, jour.reachableColor]).toEqual([jour.options.gridColor, jour.options.reachableColor])
		// L'usine est sombre de jour aussi : le HUD y est déjà en clair
		expect(jour.isDark).toBe(true)
	})
})
