import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes (même liste que
// store-chat-reload.test.ts, qui monte le même store).
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

import { canEditChatMessage, CHAT_EDIT_DELAY, Chat, ChatType, type ChatMessage } from '@/model/chat'
import { store } from '@/model/store'

const NOW = 1_700_000_000

// Un message du chat, réduit à ce que l'édition regarde.
const message = (over: Partial<ChatMessage> = {}) => ({
	id: 1, chat: 1, content: 'salut', raw_content: 'salut', date: NOW, day: 0,
	censored: 0, edited: 0, read: true, formatted: true, only_emojis: false,
	farmer: { id: 7, name: 'Klaude' }, reactions: {}, mentions: [], subMessages: [],
	...over,
}) as unknown as ChatMessage

describe('canEditChatMessage', () => {

	it('accepte son propre message, frais', () => {
		expect(canEditChatMessage(message(), 7, NOW)).toBe(true)
	})

	it('refuse le message de quelqu\'un d\'autre', () => {
		expect(canEditChatMessage(message(), 42, NOW)).toBe(false)
	})

	it('refuse quand personne n\'est connecté', () => {
		expect(canEditChatMessage(message(), undefined, NOW)).toBe(false)
	})

	it('n\'ouvre pas les annonces du bot (éleveur 0) à un visiteur', () => {
		// Le bot poste sous l'éleveur 0, et 0 est aussi ce que vaudrait un `farmerID`
		// absent : c'est le test de vérité (`!farmerID`) qui ferme le cas, pas la
		// comparaison des deux ids, qui serait vraie.
		expect(canEditChatMessage(message({ farmer: { id: 0, name: null } as never }), 0, NOW)).toBe(false)
	})

	it('refuse un message censuré : il appartient à la modération', () => {
		expect(canEditChatMessage(message({ censored: NOW - 10 }), 7, NOW)).toBe(false)
	})

	it('refuse un message portant un /exec : son résultat a été calculé sur ce code-là', () => {
		expect(canEditChatMessage(message({ exec: { lang: 'leekscript', result: '4' } }), 7, NOW)).toBe(false)
		// Résultat encore en vol : le message porte déjà le drapeau, donc pas de crayon non plus.
		expect(canEditChatMessage(message({ exec: { pending: true } }), 7, NOW)).toBe(false)
	})

	it('suit la fenêtre d\'édition, bornes comprises', () => {
		const m = message()
		expect(canEditChatMessage(m, 7, NOW + CHAT_EDIT_DELAY - 1)).toBe(true)
		expect(canEditChatMessage(m, 7, NOW + CHAT_EDIT_DELAY)).toBe(true)
		expect(canEditChatMessage(m, 7, NOW + CHAT_EDIT_DELAY + 1)).toBe(false)
	})

	it('vaut la même fenêtre que le serveur', () => {
		// Même valeur que la fenêtre d'édition de l'API. Les deux doivent bouger ensemble :
		// une valeur client plus grande propose un crayon qui se fera refuser.
		expect(CHAT_EDIT_DELAY).toBe(900)
	})
})

describe('mutation chat-edit', () => {

	let chat: Chat

	beforeEach(() => {
		store.state.farmer = { id: 7, leeks: {} } as never
		store.state.farmer_by_name = {}
		chat = new Chat(1, ChatType.GLOBAL, 'FR', true)
		store.state.chat = { 1: chat }
	})

	it('réécrit le texte et pose la date d\'édition', () => {
		chat.add(message({ id: 10, content: 'faute de frape' }))

		store.commit('chat-edit', { chat: 1, message: 10, content: 'faute de frappe', date: NOW + 5 })

		const m = chat.messages[0]
		expect(m.content).toBe('faute de frappe')
		expect(m.raw_content).toBe('faute de frappe')
		expect(m.edited).toBe(NOW + 5)
	})

	it('redemande le formatage du message', () => {
		// formatMessage (chat.vue) travaille en place et se souvient d'être passé. Sans
		// cette remise à zéro, le message garderait l'ANCIEN HTML pour toujours : le
		// texte réécrit ne s'afficherait jamais.
		chat.add(message({ id: 10, formatted: true }))

		store.commit('chat-edit', { chat: 1, message: 10, content: 'neuf', date: NOW + 5 })

		expect(chat.messages[0].formatted).toBe(false)
	})

	it('atteint un message groupé sous un autre', () => {
		// Deux messages du même éleveur à moins de 2 min : le second est rangé dans les
		// `subMessages` du premier. La mutation cherche dans la liste PLATE, et c'est le
		// même objet des deux côtés — c'est tout l'invariant dont elle dépend.
		chat.add(message({ id: 10, content: 'premier' }))
		chat.add(message({ id: 11, content: 'second', date: NOW + 30 }))
		expect(chat.messages.length).toBe(2)
		expect(chat.days[0][0].subMessages.length).toBe(1)

		store.commit('chat-edit', { chat: 1, message: 11, content: 'second, corrigé', date: NOW + 40 })

		expect(chat.days[0][0].subMessages[0].content).toBe('second, corrigé')
		expect(chat.days[0][0].content).toBe('premier')
	})

	it('apprend les éleveurs mentionnés à l\'édition', () => {
		// Un @pseudo AJOUTÉ en corrigeant désigne quelqu'un que le client ne connaît
		// peut-être pas encore ; sans ça la mention resterait du texte brut.
		chat.add(message({ id: 10 }))

		store.commit('chat-edit', {
			chat: 1, message: 10, content: 'salut @Amal', date: NOW + 5,
			mentions: [{ id: 19_070, name: 'Amal' }],
		})

		expect(store.state.farmer_by_name['Amal']).toEqual({ id: 19_070, name: 'Amal' })
	})

	it('met l\'aperçu de la conversation à jour quand c\'est le dernier message', () => {
		chat.add(message({ id: 10, content: 'le dernier mot' }))

		store.commit('chat-edit', { chat: 1, message: 10, content: 'le dernier mot, corrigé', date: NOW + 5 })

		expect(chat.last_message).toBe('le dernier mot, corrigé')
	})

	it('laisse l\'aperçu tranquille quand un message plus récent a suivi', () => {
		chat.add(message({ id: 10, content: 'mon message' }))
		chat.add(message({ id: 11, content: 'JE SUIS LE DERNIER', date: NOW + 500, farmer: { id: 8, name: 'Amal' } as never }))
		expect(chat.last_message).toBe('JE SUIS LE DERNIER')

		store.commit('chat-edit', { chat: 1, message: 10, content: 'mon message, corrigé', date: NOW + 505 })

		expect(chat.last_message).toBe('JE SUIS LE DERNIER')
		expect(chat.messages[0].content).toBe('mon message, corrigé')
	})

	it('ne bronche pas sur une conversation ou un message inconnus', () => {
		// La socket diffuse à tout le salon : un onglet qui n'a pas chargé cette
		// conversation, ou qui a déjà élagué ce message (Chat.trim), reçoit le paquet
		// quand même.
		chat.add(message({ id: 10 }))

		expect(() => store.commit('chat-edit', { chat: 999, message: 10, content: 'x', date: NOW })).not.toThrow()
		expect(() => store.commit('chat-edit', { chat: 1, message: 999, content: 'x', date: NOW })).not.toThrow()
		expect(chat.messages[0].content).toBe('salut')
	})
})
