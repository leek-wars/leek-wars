import { describe, it, expect, vi } from 'vitest'

// commands.ts importe LeekWars (graphe lourd) + CHIPS/FUNCTIONS (data). On mocke tout :
// les commandes simples testées ici n'appellent jamais LeekWars.toChatLink ni init().
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		toChatLink: (url: string, text: string) => `<a href="${url}">${text}</a>`,
		constants: [],
		weapons: {},
		hats: {},
		potions: {},
		items: {},
		chipTemplates: {},
	},
}))
vi.mock('@/model/chips', () => ({ CHIPS: {} }))
vi.mock('@/model/functions', () => ({ FUNCTIONS: [] }))

import { Commands } from '@/model/commands'

describe('Commands.execute - commandes simples', () => {
	it('/shrug en début de message', () => {
		expect(Commands.execute('/shrug', 'Bob')).toBe('¯\\_(ツ)_/¯')
	})
	it('/shrug après du texte conserve l\'espace', () => {
		expect(Commands.execute('a /shrug', 'Bob')).toBe('a ¯\\_(ツ)_/¯')
	})
	it('/me insère le pseudo de l\'auteur en italique', () => {
		expect(Commands.execute('hi /me', 'Bob')).toBe('hi <i>Bob</i>')
	})
	it('/ping est retiré du message', () => {
		expect(Commands.execute('/ping', 'Bob')).toBe('')
	})
	it('/fliptable', () => {
		expect(Commands.execute('/fliptable', 'Bob')).toBe('(╯°□°）╯︵ ┻━┻')
	})
	it('texte sans commande reste inchangé', () => {
		expect(Commands.execute('hello world', 'Bob')).toBe('hello world')
	})
})

describe('Commands.isCommand - détection en cours de frappe', () => {
	it('préfixe d\'une commande connue', () => {
		expect(Commands.isCommand('/sh')).toBe('sh')
		expect(Commands.isCommand('/me')).toBe('me')
	})
	it('pas de commande sans slash', () => expect(Commands.isCommand('hello')).toBe(false))
	it('slash mais préfixe inconnu', () => expect(Commands.isCommand('/xyz')).toBe(false))
})
