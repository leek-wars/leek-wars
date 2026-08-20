import { describe, expect, it, vi } from 'vitest'

import type { Game } from '@/component/player/game/game'
import { isDrawable, loadDrawableImage, T, Texture } from '@/component/player/game/texture'

// texture.ts ne se sert de LeekWars que pour le préfixe des URL : on le simule
// pour ne pas embarquer le store de l'application dans le test.
vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))

// `load` ne se sert du Game que pour le compteur et le callback de chargement
function fakeGame() {
	return { numData: 0, resourceLoaded: vi.fn() } as unknown as Game
}

describe('Texture', () => {

	it('remplace une texture en échec par un repli dessinable', () => {
		const game = fakeGame()
		const texture = new Texture('/image/inexistant.png').load(game)
		const image = texture.texture

		image.dispatchEvent(new Event('error'))

		// Une Image en échec reste « broken » : drawImage lèverait InvalidStateError
		expect(texture.texture).not.toBe(image)
		expect(texture.texture).toBeInstanceOf(HTMLCanvasElement)
		// Les appelants attendent un 'load' tant que `loaded` est faux, or le canvas
		// de repli n'en émettra jamais
		expect(texture.loaded).toBe(true)
		expect(game.resourceLoaded).toHaveBeenCalledTimes(1)
	})

	it('fournit aussi un repli pour l\'ombre des textures qui en construisent une', () => {
		const withShadow = new Texture('/image/inexistant.png', true).load(fakeGame())
		const withoutShadow = new Texture('/image/inexistant2.png').load(fakeGame())

		withShadow.texture.dispatchEvent(new Event('error'))
		withoutShadow.texture.dispatchEvent(new Event('error'))

		// Les ombres sont dessinées via `shadow!`, sans garde
		expect(withShadow.shadow).toBe(withShadow.texture)
		// ...mais une texture sans ombre doit le rester : les appelants testent `shadow`
		expect(withoutShadow.shadow).toBeNull()
	})

	it('ne compte la ressource qu\'une fois, quels que soient les événements d\'échec', () => {
		const game = fakeGame()
		const texture = new Texture('/image/inexistant.png').load(game)

		// loadedData est comparé à numData par égalité stricte : un dépassement
		// bloquerait le combat sur l'écran de chargement
		texture.texture.dispatchEvent(new Event('abort'))
		texture.texture.dispatchEvent(new Event('error'))

		expect(game.resourceLoaded).toHaveBeenCalledTimes(1)
	})

	it('retente le chargement au combat suivant après un échec', () => {
		const texture = new Texture('/image/inexistant.png').load(fakeGame())
		const failed = texture.texture

		failed.dispatchEvent(new Event('error'))
		texture.load(fakeGame())

		// Les textures de T sont partagées par toute la session : garder le repli
		// laisserait le mob sans main dans tous les combats suivants
		expect(texture.texture).toBeInstanceOf(HTMLImageElement)
		expect(texture.texture).not.toBe(failed)
		// Les appelants lisent la taille de base dès que `loaded` est vrai, or la
		// nouvelle Image ne mesure rien tant qu'elle n'a pas chargé
		expect(texture.loaded).toBe(false)
	})

	it('prévient les appelants qui attendent la taille de base', () => {
		const texture = new Texture('/image/inexistant.png').load(fakeGame())
		const listener = vi.fn(() => texture.texture.width)

		texture.texture.addEventListener('load', listener, { once: true })
		texture.texture.dispatchEvent(new Event('error'))

		// Sans cet événement, l'entité garderait une taille nulle, que drawImage
		// refuse comme source ; elle doit mesurer le repli, pas l'Image en échec
		expect(listener).toHaveBeenCalledTimes(1)
		expect(listener).toHaveReturnedWith(1)
	})

	it('ne recharge pas une texture déjà chargée', () => {
		const game = fakeGame()
		const texture = new Texture('/image/existant.png').load(game)
		const image = texture.texture

		image.dispatchEvent(new Event('load'))
		texture.load(game)

		expect(texture.texture).toBe(image)
	})

	it('ne met pas le repli 1×1 à l\'échelle', () => {
		const texture = new Texture('/image/inexistant.png').load(fakeGame())

		texture.texture.dispatchEvent(new Event('error'))

		// Sinon le cache, jamais purgé, garderait un canvas par niveau de zoom
		expect(texture.getScaled(300)).toBe(texture.texture)
	})
})

describe('T.get', () => {

	it('retente une texture du cache dont le chargement a échoué', () => {
		const texture = T.get(fakeGame(), 'image/mob/inexistant.png')

		texture.texture.dispatchEvent(new Event('error'))
		const again = T.get(fakeGame(), 'image/mob/inexistant.png')

		// Le cache renvoie toujours la même Texture, mais elle doit retenter le
		// chargement : sinon le mob resterait invisible tout le reste de la session
		expect(again).toBe(texture)
		expect(again.texture).toBeInstanceOf(HTMLImageElement)
	})

	it('ne recharge pas une texture du cache qui a chargé', () => {
		const texture = T.get(fakeGame(), 'image/mob/existant.png')

		texture.texture.dispatchEvent(new Event('load'))

		expect(T.get(fakeGame(), 'image/mob/existant.png').texture).toBe(texture.texture)
	})
})

describe('loadDrawableImage', () => {

	it('recharge un pixel transparent quand l\'image échoue', () => {
		const image = loadDrawableImage('/image/inexistant.svg')

		image.dispatchEvent(new Event('error'))

		// L'Image sort de l'état « broken » : drawImage redevient sûr, sans garde
		// sur la taille — un SVG sans width/height mesure 0 mais reste dessinable
		expect(image.src).toMatch(/^data:image\/gif;base64,/)
	})

	it('donne une image dessinable même sans source', () => {
		// Objet inconnu du client : une src vide ferait recharger la page elle-même
		expect(loadDrawableImage('').src).toMatch(/^data:image\/gif;base64,/)
	})

	it('partage l\'image entre les effets qui utilisent la même icône', () => {
		expect(loadDrawableImage('/image/chip/heal.png')).toBe(loadDrawableImage('/image/chip/heal.png'))
	})
})

describe('isDrawable', () => {

	// L'état « broken » n'existe pas en jsdom : on le simule, complete=true et
	// naturalWidth=0 étant exactement ce que le navigateur expose après un échec.
	function image({ complete, naturalWidth }: { complete: boolean, naturalWidth: number }) {
		const img = new Image()
		Object.defineProperty(img, 'complete', { value: complete })
		Object.defineProperty(img, 'naturalWidth', { value: naturalWidth })
		return img
	}

	it('refuse une image cassée', () => {
		// La fenêtre fatale : échec réseau constaté, handler d'erreur pas encore passé
		expect(isDrawable(image({ complete: true, naturalWidth: 0 }))).toBe(false)
	})

	it('accepte une image chargée', () => {
		expect(isDrawable(image({ complete: true, naturalWidth: 32 }))).toBe(true)
	})

	it('accepte une image encore en chargement', () => {
		// drawImage y est un no-op : sauter le dessin priverait l'icône de son premier
		// affichage sans raison
		expect(isDrawable(image({ complete: false, naturalWidth: 0 }))).toBe(true)
	})

	it('refuse une image absente', () => {
		expect(isDrawable(null)).toBe(false)
		expect(isDrawable(undefined)).toBe(false)
	})

	it('accepte un canvas dimensionné', () => {
		// Les textures construites (ombres, fragments) ne sont pas des HTMLImageElement
		expect(isDrawable(document.createElement('canvas'))).toBe(true) // 300x150 par défaut
	})

	it('refuse un canvas de dimension nulle', () => {
		// Texture d'entité pas encore rendue : drawImage lève « canvas element with a
		// width or height of 0 », même conséquence que l'image cassée
		const canvas = document.createElement('canvas')
		canvas.width = 0
		expect(isDrawable(canvas)).toBe(false)
		canvas.width = 32
		canvas.height = 0
		expect(isDrawable(canvas)).toBe(false)
	})
})
