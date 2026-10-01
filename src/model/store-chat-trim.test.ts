import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	return { LeekWars: {
		setTitleCounter: noop, clearIntervals: noop, startIntervals: noop, displayMessage: noop,
		arena: { suspend: noop }, bossSquads: { leaveSquad: noop }, publicChats: {},
		socket: { enableChannel: noop }, squares: { addFromMessage: noop },
		get: noop,
	} }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import { Chat, ChatType } from '@/model/chat'
import { store } from '@/model/store'

const message = (id: number) => ({
	id, chat: 1, content: 'message ' + id, date: 1_700_000_000 + id, day: 0, censored: 0, read: true,
	farmer: { id: 7 + id, name: 'Klaude' + id }, reactions: {}, mentions: [], subMessages: [],
})

function receive(count: number, from: number = 1) {
	for (let i = 0; i < count; ++i) {
		store.commit('chat-receive', { chat: 1, type: ChatType.GLOBAL, message: message(from + i), new: true })
	}
}

beforeEach(() => {
	store.state.farmer = { id: 7, leeks: {} } as never
	store.state.chat = { 1: new Chat(1, ChatType.GLOBAL, 'FR', true) }
})

describe('chat-receive - purge des vieux messages', () => {
	it('limite la conversation à MAX_MESSAGES', () => {
		receive(Chat.MAX_MESSAGES + 10)
		expect(store.state.chat[1].messages.length).toBe(Chat.MAX_MESSAGES)
		expect(store.state.chat[1].messages[0].id).toBe(11)
	})

	// Une vue remontée dans l'historique pose un verrou : purger le début de la liste
	// supprimerait des messages affichés au-dessus du viewport, le contenu remonterait
	// d'autant et le lecteur serait propulsé vers les messages récents.
	it('ne purge pas pendant la lecture de l\'historique', () => {
		store.state.chat[1].history_locks = 1
		receive(Chat.MAX_MESSAGES + 10)
		expect(store.state.chat[1].messages.length).toBe(Chat.MAX_MESSAGES + 10)
		expect(store.state.chat[1].messages[0].id).toBe(1)
	})

	it('rattrape la purge quand le verrou est relâché', () => {
		store.state.chat[1].history_locks = 1
		receive(Chat.MAX_MESSAGES + 10)
		store.state.chat[1].history_locks = 0
		store.commit('trim-chat', 1)
		expect(store.state.chat[1].messages.length).toBe(Chat.MAX_MESSAGES)
		expect(store.state.chat[1].messages[0].id).toBe(11)
	})

	it('ne purge pas tant qu\'une autre vue tient encore le verrou', () => {
		store.state.chat[1].history_locks = 2
		receive(Chat.MAX_MESSAGES + 10)
		store.state.chat[1].history_locks = 1
		store.commit('trim-chat', 1)
		expect(store.state.chat[1].messages.length).toBe(Chat.MAX_MESSAGES + 10)
	})
})
