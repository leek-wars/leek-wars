import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
const get = vi.fn()
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	return { LeekWars: {
		setTitleCounter: noop, clearIntervals: noop, startIntervals: noop, displayMessage: noop,
		arena: { suspend: noop }, bossSquads: { leaveSquad: noop }, publicChats: {},
		socket: { enableChannel: noop }, squares: { addFromMessage: noop },
		get: (...args: unknown[]) => get(...args),
	} }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import { Chat, ChatType } from '@/model/chat'
import { store } from '@/model/store'

// LeekWars.get renvoie une promesse étendue d'un .error() (cf. request() dans leekwars.ts).
// `chain` garde chaque maillon construit par l'appelant : le dernier porte le résultat des
// handlers du store, et permet donc de vérifier qu'aucun n'a levé.
function deferred() {
	let resolve!: (data: unknown) => void
	let reject!: (error: unknown) => void
	const promise = new Promise((res, rej) => { resolve = res; reject = rej })
	const chain: Promise<unknown>[] = []
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const extend = (p: any) => {
		chain.push(p)
		p.error = (e: (error: unknown) => void) => extend(p.catch(e))
		const originalThen = p.then.bind(p)
		// eslint-disable-next-line unicorn/no-thenable
		p.then = (f: (data: unknown) => void, r?: (error: unknown) => void) => extend(originalThen(f, r))
		return p
	}
	return { promise: extend(promise), resolve, reject, chain }
}

const message = (id: number, content: string) => ({
	id, chat: 1, content, date: 1_700_000_000 + id, day: 0, censored: 0, read: true,
	farmer: { id: 7, name: 'Klaude' }, reactions: {}, mentions: [], subMessages: [],
})
const response = (...messages: unknown[]) => ({ type: ChatType.GLOBAL, messages, mentions: [], farmers: [] })
const contents = () => store.state.chat[1].messages.map(m => m.content)

beforeEach(() => {
	get.mockReset()
	store.state.farmer = { id: 7, leeks: {} } as never
	store.state.chat = { 1: new Chat(1, ChatType.GLOBAL, 'FR', true) }
})

describe('reload-chat', () => {
	it('remplit la conversation avec les messages du serveur', async () => {
		const first = deferred()
		get.mockReturnValueOnce(first.promise)
		store.commit('reload-chat', store.state.chat[1])
		expect(store.state.chat[1].loading).toBe(true)

		first.resolve(response(message(1, 'salut')))
		await first.promise
		expect(contents()).toEqual(['salut'])
		expect(store.state.chat[1].loaded).toBe(true)
		expect(store.state.chat[1].loading).toBe(false)
	})

	// Au retour sur l'app on rafraîchit en HTTP tout de suite, puis la socket se reconnecte
	// et relance un chargement : la réponse de la première requête, arrivée après celle de
	// la seconde, ne doit pas réécraser les messages plus frais.
	it('ignore la réponse d\'un chargement dépassé par un plus récent', async () => {
		const first = deferred()
		const second = deferred()
		get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

		store.commit('reload-chat', store.state.chat[1])
		// invalidate-chats (socket.onopen) remet loading à false : le second chargement passe.
		store.commit('invalidate-chats')
		store.commit('reload-chat', store.state.chat[1])
		expect(get).toHaveBeenCalledTimes(2)

		second.resolve(response(message(1, 'salut'), message(2, 'nouveau')))
		await second.promise
		expect(contents()).toEqual(['salut', 'nouveau'])

		first.resolve(response(message(1, 'salut')))
		await first.promise
		expect(contents()).toEqual(['salut', 'nouveau'])
		expect(store.state.chat[1].loaded).toBe(true)
		expect(store.state.chat[1].loading).toBe(false)
	})

	// Le rechargement ramène les 30 derniers messages : l'historique n'est plus épuisé, même
	// si l'éleveur l'avait remonté jusqu'au bout avant. Sinon load-chat-history refuse à vie
	// de charger les messages plus anciens de cette conversation.
	it('rouvre le chargement de l\'historique', async () => {
		store.state.chat[1].fully_loaded = true
		const first = deferred()
		get.mockReturnValueOnce(first.promise)
		store.commit('reload-chat', store.state.chat[1])
		first.resolve(response(message(1, 'salut')))
		await first.promise
		expect(store.state.chat[1].fully_loaded).toBe(false)
	})

	// Déconnexion ou changement de compte pendant la requête : la mutation 'reset' vide
	// state.chat, la réponse en vol ne doit pas planter en écrivant dans le vide.
	it('ne plante pas si la conversation a disparu pendant la requête', async () => {
		const first = deferred()
		get.mockReturnValueOnce(first.promise)
		store.commit('reload-chat', store.state.chat[1])

		store.state.chat = {}
		first.resolve(response(message(1, 'salut')))
		// Copie obligatoire : allSettled appelle le .then() de chaque maillon, ce qui en
		// ajoute un nouveau au tableau — l'itérer en direct ne terminerait jamais.
		const results = await Promise.allSettled([...first.chain])
		expect(results[results.length - 1].status).toBe('fulfilled')
	})

	it('ignore aussi l\'échec d\'un chargement dépassé', async () => {
		const first = deferred()
		const second = deferred()
		get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

		store.commit('reload-chat', store.state.chat[1])
		store.commit('invalidate-chats')
		store.commit('reload-chat', store.state.chat[1])

		second.resolve(response(message(1, 'salut')))
		await second.promise
		first.reject({ error: 'unknown_error' })
		await first.promise.catch(() => undefined)
		expect(contents()).toEqual(['salut'])
	})
})
