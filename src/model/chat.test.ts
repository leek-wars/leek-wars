import { describe, it, expect } from 'vitest'

import { Chat, ChatMessage, ChatType } from '@/model/chat'

// JSON brut du serveur : pas d'instance de ChatMessage, donc pas de subMessages.
function serverMessage(id: number, farmer: number, date: number) {
	return { id, farmer: { id: farmer }, content: 'msg' + id, date } as unknown as ChatMessage
}

function newChat() {
	return new Chat(1, ChatType.GLOBAL, 'Général', false)
}

// Les bulles, en ids : [tête, ...sous-messages] pour chaque bulle de chaque jour.
function bubbles(chat: Chat) {
	return chat.days.map(day => day.map(m => [m.id, ...m.subMessages.map(s => s.id)]))
}

describe('Chat - initialisation des sous-messages', () => {
	it('add() et unshift() (historique) initialisent subMessages', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.unshift(serverMessage(2, 2, 900))
		expect(chat.messages.map(m => m.subMessages)).toEqual([[], []])
	})
})

describe('Chat - historique (unshift)', () => {
	it('groupe les messages de l\'historique entre eux, comme add()', () => {
		const chat = newChat()
		chat.add(serverMessage(10, 3, 2000))
		chat.unshift(serverMessage(1, 1, 1000), serverMessage(2, 1, 1030), serverMessage(3, 2, 1040))
		expect(chat.messages.map(m => m.id)).toEqual([1, 2, 3, 10])
		expect(bubbles(chat)).toEqual([[[1, 2], [3], [10]]])
	})

	// En remontant, le plus ancien message affiché devient la suite d'un message plus
	// ancien du même éleveur, au lieu de garder sa propre bulle.
	it('rattache le début de la conversation à la bulle d\'un message plus ancien', () => {
		const chat = newChat()
		chat.add(serverMessage(10, 1, 1060))
		chat.add(serverMessage(11, 1, 1090))
		chat.add(serverMessage(12, 2, 1100))
		chat.unshift(serverMessage(9, 1, 1000))
		expect(bubbles(chat)).toEqual([[[9, 10, 11], [12]]])
		expect(chat.days[0][0].subMessages.every(m => m.subMessages.length === 0)).toBe(true)
	})

	// Une bulle ne couvre que 2 minutes depuis son premier message : rattacher des messages
	// plus anciens déplace ses coupures, et c'est tout le paquet qui doit se reformer.
	it('donne les mêmes bulles que si tout avait été chargé d\'un coup', () => {
		const all = [
			serverMessage(1, 1, 1000), serverMessage(2, 1, 1030), serverMessage(3, 1, 1060),
			serverMessage(4, 1, 1090), serverMessage(5, 1, 1130), serverMessage(6, 2, 1140),
			serverMessage(7, 1, 1150),
		]
		const direct = newChat()
		for (const message of all) { direct.add({ ...message }) }
		expect(bubbles(direct)).toEqual([[[1, 2, 3, 4], [5], [6], [7]]])

		const scrolled = newChat()
		for (const message of all.slice(2)) { scrolled.add({ ...message }) }
		expect(bubbles(scrolled)).toEqual([[[3, 4, 5], [6], [7]]])
		scrolled.unshift(...all.slice(0, 2).map(m => ({ ...m })))
		expect(bubbles(scrolled)).toEqual(bubbles(direct))
	})

	it('ne groupe pas par-dessus minuit', () => {
		const midnight = new Date(2026, 8, 20).getTime() / 1000
		const chat = newChat()
		chat.add(serverMessage(2, 1, midnight + 30))
		chat.unshift(serverMessage(1, 1, midnight - 30))
		expect(bubbles(chat)).toEqual([[[1]], [[2]]])
	})

	it('ignore un message déjà affiché', () => {
		const chat = newChat()
		chat.add(serverMessage(10, 2, 1060))
		chat.add(serverMessage(11, 3, 1070))
		chat.unshift(serverMessage(9, 1, 1000), serverMessage(10, 2, 1060))
		expect(chat.messages.map(m => m.id)).toEqual([9, 10, 11])
		expect(bubbles(chat)).toEqual([[[9], [10], [11]]])
	})
})

describe('Chat - réactions', () => {
	const reacted = (message: ChatMessage) => ({ ...message, reactions: { '👍': { count: 1, farmers: ['Amal'] } } })

	// Chaque message affiche ses réactions sous sa propre ligne : elles ne coupent pas la bulle.
	it('un message qui porte des réactions reste dans la bulle', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(reacted(serverMessage(2, 1, 1030)))
		chat.add(serverMessage(3, 1, 1060))
		expect(bubbles(chat)).toEqual([[[1, 2, 3]]])
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

describe('Chat - deleteMessages', () => {
	it('supprime un message principal isolé', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 2, 1010))
		chat.deleteMessages([1])
		expect(chat.messages.map(m => m.id)).toEqual([2])
		expect(chat.days[0].map(m => m.id)).toEqual([2])
	})

	it('remonte le premier sous-message quand le parent est supprimé', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 1, 1010))
		chat.add(serverMessage(3, 1, 1020))
		chat.deleteMessages([1])
		const day = chat.days[0]
		expect(day.map(m => m.id)).toEqual([2])
		expect(day[0].subMessages.map(m => m.id)).toEqual([3])
	})

	it('supprime un sous-message', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 1, 1010))
		chat.deleteMessages([2])
		expect(chat.messages.map(m => m.id)).toEqual([1])
		expect(chat.days[0][0].subMessages).toEqual([])
	})

	it('regroupe les messages qu\'un message supprimé séparait', () => {
		const chat = newChat()
		chat.add(serverMessage(1, 1, 1000))
		chat.add(serverMessage(2, 2, 1010))
		chat.add(serverMessage(3, 1, 1020))
		chat.deleteMessages([2])
		expect(bubbles(chat)).toEqual([[[1, 3]]])
	})

	// Après un scroll qui charge l'historique (unshift), un événement WS de suppression
	// ne doit pas parcourir les subMessages, absents, des messages d'historique.
	it('ne crashe pas après un chargement d\'historique', () => {
		const chat = newChat()
		chat.add(serverMessage(10, 1, 5000))
		chat.add(serverMessage(11, 2, 5010))
		// Historique remonté au scroll (même jour), d'un seul lot comme dans le store
		chat.unshift(serverMessage(1, 4, 1000), serverMessage(2, 3, 2000))
		expect(() => chat.deleteMessages([11])).not.toThrow()
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
