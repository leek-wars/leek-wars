import { describe, it, expect, vi, beforeEach } from 'vitest'

// Arena mémorise l'inscription PAR ÉLEVEUR dans localStorage (multi-compte) et migre
// l'ancien format mono-compte. On coupe socket/store/router/LeekWars pour tester cette
// logique de persistance et d'isolation entre comptes (le vrai localStorage happy-dom sert).
const lw = vi.hoisted(() => ({
	socket: { send: vi.fn(), connected: vi.fn(() => true) },
	setTitleTag: vi.fn(),
}))
vi.mock('@/model/leekwars', () => ({ LeekWars: lw }))

const storeMock = vi.hoisted(() => ({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	state: { farmer: null as any, arenaEnabled: false },
	commit: vi.fn(),
}))
vi.mock('@/model/store', () => ({ store: storeMock }))

const routerMock = vi.hoisted(() => ({
	isReady: vi.fn(() => Promise.resolve()),
	currentRoute: { value: { path: '/' } },
	push: vi.fn(),
}))
vi.mock('@/router', () => ({ default: routerMock }))

vi.mock('@/model/socket', () => ({ SocketMessage: { ARENA_REGISTER: 10, ARENA_LEAVE: 11 } }))
vi.mock('@/model/leek', () => ({ Leek: class Leek {} }))

import { Arena, arenaModeIcon } from '@/model/arena'

const registrations = () => JSON.parse(localStorage.getItem('arena-registrations') || '{}')

beforeEach(() => {
	localStorage.clear()
	storeMock.state.farmer = null
	storeMock.state.arenaEnabled = false
	lw.socket.send.mockClear()
	lw.socket.connected.mockReturnValue(true)
	storeMock.commit.mockClear()
})

describe('arenaModeIcon', () => {
	it('renvoie l\'icône du mode', () => {
		expect(arenaModeIcon(0)).toBe('mdi-sword-cross')
		expect(arenaModeIcon(1)).toBe('mdi-flag')
		expect(arenaModeIcon(3)).toBe('mdi-shield-account')
	})
	it('renvoie un fallback pour un mode inconnu', () => {
		expect(arenaModeIcon(99)).toBe('mdi-help-circle-outline')
		expect(arenaModeIcon(-1)).toBe('mdi-help-circle-outline')
	})
})

describe('Arena.register', () => {
	it('envoie l\'inscription, persiste le slot actif et mémorise par éleveur', () => {
		storeMock.state.farmer = { id: 42 }
		const arena = new Arena()
		arena.register(7, 2, true)

		expect(lw.socket.send).toHaveBeenCalledWith([10, 7, 2, true])
		expect(localStorage.getItem('arena-leek')).toBe('7')
		expect(localStorage.getItem('arena-preference')).toBe('2')
		expect(localStorage.getItem('arena-colossus')).toBe('1')
		expect(localStorage.getItem('in-arena')).toBe('1')
		expect(localStorage.getItem('arena-farmer')).toBe('42')
		expect(registrations()['42']).toEqual({ leek: 7, preference: 2, colossus: true })
		expect(storeMock.commit).toHaveBeenCalledWith('arena-status', { enabled: true, preference: 2 })
		expect(arena.enabled).toBe(true)
		expect(arena.preference).toBe(2)
	})
})

describe('Arena.init', () => {
	it('réinscrit le poireau mémorisé du compte actif', () => {
		localStorage.setItem('arena-registrations', JSON.stringify({ 42: { leek: 9, preference: 1, colossus: false } }))
		storeMock.state.farmer = { id: 42 }
		const arena = new Arena()
		arena.init()
		expect(lw.socket.send).toHaveBeenCalledWith([10, 9, 1, false])
		expect(arena.enabled).toBe(true)
	})

	it('purge le slot actif s\'il appartient à un autre compte (pas de fuite entre comptes)', () => {
		// Slot legacy mono-compte du compte 99, aucun enregistrement pour le compte actif 42.
		localStorage.setItem('in-arena', '1')
		localStorage.setItem('arena-leek', '5')
		localStorage.setItem('arena-preference', '2')
		localStorage.setItem('arena-colossus', '1')
		localStorage.setItem('arena-farmer', '99')
		storeMock.state.farmer = { id: 42 }

		const arena = new Arena()
		arena.init()

		// migrateLegacy a sauvé le slot du compte 99 dans la map par éleveur...
		expect(registrations()['99']).toEqual({ leek: 5, preference: 2, colossus: true })
		// ...mais le slot actif est vidé pour ne pas exposer la sélection du compte 99 au compte 42.
		expect(localStorage.getItem('in-arena')).toBeNull()
		expect(localStorage.getItem('arena-preference')).toBeNull()
		expect(localStorage.getItem('arena-colossus')).toBeNull()
		expect(localStorage.getItem('arena-farmer')).toBeNull()
		// arena-leek est conservé (dernier poireau choisi, réutilisé pour la sélection UI).
		expect(localStorage.getItem('arena-leek')).toBe('5')
		expect(lw.socket.send).not.toHaveBeenCalled()
	})
})

describe('Arena.clearStorage', () => {
	it('oublie l\'inscription du compte actif mais garde celle des autres', () => {
		localStorage.setItem('arena-registrations', JSON.stringify({
			42: { leek: 7, preference: 2, colossus: true },
			99: { leek: 5, preference: 0, colossus: false },
		}))
		localStorage.setItem('in-arena', '1')
		localStorage.setItem('arena-farmer', '42')
		storeMock.state.farmer = { id: 42 }

		const arena = new Arena()
		arena.clearStorage()

		expect(registrations()['42']).toBeUndefined()
		expect(registrations()['99']).toEqual({ leek: 5, preference: 0, colossus: false })
		expect(localStorage.getItem('in-arena')).toBeNull()
		expect(localStorage.getItem('arena-farmer')).toBeNull()
	})
})

describe('Arena.reset', () => {
	it('remet l\'état à zéro et notifie le store', () => {
		const arena = new Arena()
		arena.enabled = true
		arena.progress = 5
		arena.preference = 2
		arena.reset()
		expect(arena.enabled).toBe(false)
		expect(arena.progress).toBe(0)
		expect(arena.preference).toBe(-1)
		expect(storeMock.commit).toHaveBeenCalledWith('arena-status', { enabled: false, preference: -1 })
	})
})
