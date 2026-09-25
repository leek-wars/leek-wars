import { describe, it, expect } from 'vitest'

import { Chat, ChatMessage, ChatType } from '@/model/chat'

// JSON brut du serveur : pas d'instance de ChatMessage, donc pas de subMessages.
function serverMessage(id: number, farmer: number, date: number) {
	return { id, farmer: { id: farmer }, content: 'msg' + id, date } as unknown as ChatMessage
}

function newChat() {
	return new Chat(1, ChatType.GLOBAL, 'Général', false)
}

describe('Chat - initialisation des sous-messages', () => {
	it('add() et unshift() (historique) initialisent subMessages', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.unshift(serverMessage(2, 1, 900))
		expect(chat.messages.map(m => m.subMessages)).toEqual([[], []])
	})
})

describe('Chat - groupement', () => {
	it('regroupe deux messages proches du même farmer', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 1, 1060))
		const day = chat.days[0]
		expect(day.length).toBe(1)
		expect(day[0].subMessages.map(m => m.id)).toEqual([2])
	})

	it('ne regroupe pas deux farmers différents', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 2, 1010))
		expect(chat.days[0].map(m => m.id)).toEqual([1, 2])
	})
})

describe('Chat - deleteMessage', () => {
	it('supprime un message principal isolé', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 2, 1010))
		chat.deleteMessage(1)
		expect(chat.messages.map(m => m.id)).toEqual([2])
		expect(chat.days[0].map(m => m.id)).toEqual([2])
	})

	it('remonte le premier sous-message quand le parent est supprimé', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 1, 1010))
		chat.add(serverMessage(3, 1, 1020))
		chat.deleteMessage(1)
		const day = chat.days[0]
		expect(day.map(m => m.id)).toEqual([2])
		expect(day[0].subMessages.map(m => m.id)).toEqual([3])
	})

	it('supprime un sous-message', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 1, 1010))
		chat.deleteMessage(2)
		expect(chat.messages.map(m => m.id)).toEqual([1])
		expect(chat.days[0][0].subMessages).toEqual([])
	})

	// Régression #11810512 : après un scroll qui charge l'historique (unshift), un événement
	// WS de suppression parcourait les subMessages des messages d'historique, absents.
	it('ne crashe pas après un chargement d\'historique', () => {
		const chat = newChat()
		chat.add(serverMessage(10, 1, 5000))
		chat.add(serverMessage(11, 2, 5010))
		// Historique remonté au scroll (même jour, ordre décroissant comme dans le store)
		chat.unshift(serverMessage(2, 3, 2000))
		chat.unshift(serverMessage(1, 4, 1000))
		expect(() => chat.deleteMessage(11)).not.toThrow()
		expect(chat.messages.map(m => m.id)).toEqual([1, 2, 10])
		expect(chat.days[0].map(m => m.id)).toEqual([1, 2, 10])
	})
})

describe('Chat - trim', () => {
	it('reconstruit les jours et regroupe les messages restants', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1010))
		chat.add(serverMessage(2, 2, 1020))
		// Les deux derniers sont du même farmer : le rebuild doit les regrouper.
		chat.add(serverMessage(3, 3, 1030))
		chat.add(serverMessage(4, 3, 1040))
		chat.trim(2)
		expect(chat.messages.map(m => m.id)).toEqual([3, 4])
		expect(chat.days.length).toBe(1)
		expect(chat.days[0].map(m => m.id)).toEqual([3])
		expect(chat.days[0][0].subMessages.map(m => m.id)).toEqual([4])
	})
})
