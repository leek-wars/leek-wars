import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setTranslations } from '@/locale'

// boss-squads.ts tire model/leekwars.ts, qui lit LANGUAGES[locale] au chargement du module :
// hors de l'app, la locale est vide tant que main.ts n'a pas appelé setTranslations.
setTranslations('fr', {})

const currentRoute = { value: { path: '/garden/boss' } }
const push = vi.fn()
const replace = vi.fn()
vi.mock('@/router', () => ({
	default: {
		isReady: () => Promise.resolve(),
		get currentRoute() { return currentRoute },
		push: (...args: unknown[]) => push(...args),
		replace: (...args: unknown[]) => replace(...args),
	},
}))

// Cycle d'imports boss-squads <-> leekwars : charger leekwars en premier (comme l'app le
// fait via main.ts), sinon `new BossSquads()` s'évalue avant la définition de la classe.
await import('@/model/leekwars')
const { BossSquads } = await import('@/model/boss-squads')

describe('boss-squads.ts — escouade inexistante', () => {
	beforeEach(() => {
		push.mockClear()
		replace.mockClear()
		localStorage.setItem('garden/boss-squad', 'abcd')
	})

	// Revenir en arrière depuis le combat ramène sur l'URL de l'escouade, dissoute par
	// l'attaque : la redirection doit remplacer l'entrée d'historique, pas en empiler une
	// nouvelle, sinon tout l'historique « en avant » est effacé. Topic forum 12092.
	it('remplace l\'entrée d\'historique au lieu d\'en empiler une', async () => {
		currentRoute.value.path = '/garden/boss/tortue/abcd'
		new BossSquads().noSuchSquad()
		await Promise.resolve()
		expect(replace).toHaveBeenCalledWith('/garden/boss')
		expect(push).not.toHaveBeenCalled()
	})

	it('oublie l\'escouade mémorisée', () => {
		currentRoute.value.path = '/garden/boss/tortue/abcd'
		new BossSquads().noSuchSquad()
		expect(localStorage.getItem('garden/boss-squad')).toBe(null)
	})

	it('ne navigue pas si on est déjà sur la liste des boss', async () => {
		currentRoute.value.path = '/garden/boss'
		new BossSquads().noSuchSquad()
		await Promise.resolve()
		expect(replace).not.toHaveBeenCalled()
		expect(push).not.toHaveBeenCalled()
	})

	it('ne navigue pas depuis une autre page', async () => {
		currentRoute.value.path = '/fight/123'
		new BossSquads().noSuchSquad()
		await Promise.resolve()
		expect(replace).not.toHaveBeenCalled()
		expect(push).not.toHaveBeenCalled()
	})
})
