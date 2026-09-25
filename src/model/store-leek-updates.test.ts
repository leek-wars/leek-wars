import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	return { LeekWars: {
		setTitleCounter: noop, clearIntervals: noop, startIntervals: noop, displayMessage: noop,
		arena: { suspend: noop }, bossSquads: { leaveSquad: noop }, publicChats: {},
	} }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import { store } from '@/model/store'

const leek = () => store.state.farmer!.leeks[1]

beforeEach(() => {
	store.state.farmer = { id: 42, leeks: { 1: { id: 1, xp: 100, talent: 500 } } } as never
})

describe('update-xp / update-leek-talent', () => {
	it('met à jour le poireau de l\'éleveur', () => {
		store.commit('update-xp', { leek: 1, xp: 25 })
		store.commit('update-leek-talent', { leek: 1, talent: -10 })
		expect(leek().xp).toBe(125)
		expect(leek().talent).toBe(490)
	})

	// Changement de compte dans un autre onglet : le WebSocket est authentifié sur
	// un autre éleveur et pousse des poireaux inconnus (#4669).
	it('ignore un poireau qui n\'appartient pas à l\'éleveur', () => {
		store.commit('update-xp', { leek: 60063, xp: 25 })
		store.commit('update-leek-talent', { leek: 60063, talent: 25 })
		expect(leek().xp).toBe(100)
		expect(leek().talent).toBe(500)
	})

	it('ignore les messages hors connexion', () => {
		store.state.farmer = null
		expect(() => store.commit('update-xp', { leek: 1, xp: 25 })).not.toThrow()
	})
})

// La clé 'active-account' est le vrai correctif de #4706 : c'est elle qui fait
// recharger les onglets restés sur l'ancien compte (cf. onStorage dans app.vue).
// Les gardes ci-dessus ne font qu'amortir le crash pendant ce rechargement.
describe('active-account', () => {
	const connect = (id: number) => store.commit('connect', {
		farmer: { id, name: 'F' + id, leeks: {}, country: 'fr', habs: 0, crystals: 0, fights: 0, team_fights: 0 },
		farmers: 0, message: null, unread: 0, notifications: [], conversations: [], chats: [], token: 't',
	})

	it('connect publie le compte actif, reset le retire', () => {
		connect(42)
		expect(localStorage.getItem('active-account')).toBe('42')
		// connect commit 'reset' en interne : l'ordre des deux écritures compte.
		connect(97060)
		expect(localStorage.getItem('active-account')).toBe('97060')
		store.commit('reset')
		expect(localStorage.getItem('active-account')).toBe(null)
	})
})
