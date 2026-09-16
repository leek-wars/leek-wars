import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'

// BossSquads recale l'URL du potager de boss depuis les messages du websocket. On coupe
// leekwars/store/socket/leek/boss (jamais utilisés par les transitions testées, et
// @/model/leekwars forme un cycle d'imports avec boss-squads) pour ne garder que le
// routeur et le vrai localStorage de happy-dom.
vi.mock('@/model/leekwars', () => ({ LeekWars: { socket: { send: vi.fn() } } }))
vi.mock('@/model/store', () => ({ store: { state: { farmer: null }, commit: vi.fn() } }))
vi.mock('@/model/socket', () => ({ SocketMessage: {} }))
vi.mock('@/model/leek', () => ({ Leek: class Leek {} }))
vi.mock('@/model/farmer', () => ({ Farmer: class Farmer {} }))
vi.mock('@/model/boss', () => ({ BOSSES: { 3: { id: 3, name: 'tortue' } } }))

const routerMock = vi.hoisted(() => ({
	isReady: () => Promise.resolve(),
	currentRoute: { value: { path: '/garden/boss' } },
	push: vi.fn(),
	replace: vi.fn(),
}))
vi.mock('@/router', () => ({ default: routerMock }))

import { BossSquads } from '@/model/boss-squads'

// Les navigations passent par router.isReady().then(...) : laisser tourner les promesses
// avant d'observer le routeur.
const at = async (path: string, action: (squads: BossSquads) => void) => {
	routerMock.currentRoute.value.path = path
	action(new BossSquads())
	await flushPromises()
}

beforeEach(() => {
	localStorage.clear()
	vi.clearAllMocks()
})

describe('noSuchSquad', () => {
	// Revenir en arrière depuis le combat ramène sur l'URL de l'escouade, dissoute par
	// l'attaque : la redirection doit remplacer l'entrée d'historique, pas en empiler une
	// nouvelle, sinon tout l'historique « en avant » est effacé. Topic forum 12092.
	it('remplace l\'entrée d\'historique et oublie l\'escouade', async () => {
		localStorage.setItem('garden/boss-squad', 'abcd')
		await at('/garden/boss/tortue/abcd', s => s.noSuchSquad())
		expect(routerMock.replace).toHaveBeenCalledWith('/garden/boss')
		expect(routerMock.push).not.toHaveBeenCalled()
		expect(localStorage.getItem('garden/boss-squad')).toBe(null)
	})

	it.each(['/garden/boss', '/fight/123'])('ne navigue pas depuis %s', async (path) => {
		await at(path, s => s.noSuchSquad())
		expect(routerMock.replace).not.toHaveBeenCalled()
		expect(routerMock.push).not.toHaveBeenCalled()
	})
})

// Les trois autres transitions partagent la même redirection : elles restent des push,
// puisqu'elles font suite à une intention du joueur.
describe('autres transitions', () => {
	const squad = { id: 'abcd', boss: 3 } as unknown as Parameters<BossSquads['joined']>[0]

	it('joined empile l\'URL de l\'escouade rejointe', async () => {
		await at('/garden/boss', s => s.joined(squad))
		expect(routerMock.push).toHaveBeenCalledWith('/garden/boss/tortue/abcd')
		expect(routerMock.replace).not.toHaveBeenCalled()
	})

	it('joined ne renavigue pas si on y est déjà', async () => {
		await at('/garden/boss/tortue/abcd', s => s.joined(squad))
		expect(routerMock.push).not.toHaveBeenCalled()
	})

	it('left ramène à la liste des boss', async () => {
		await at('/garden/boss/tortue/abcd', s => s.left())
		expect(routerMock.push).toHaveBeenCalledWith('/garden/boss/')
	})

	it('start ouvre le combat depuis n\'importe quelle page du potager', async () => {
		await at('/garden/solo/42', s => s.start([98765]))
		expect(routerMock.push).toHaveBeenCalledWith('/fight/98765')
	})

	it('start ne fait rien hors du potager', async () => {
		await at('/farmer/1', s => s.start([98765]))
		expect(routerMock.push).not.toHaveBeenCalled()
	})
})
