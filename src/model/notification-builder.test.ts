import { describe, it, expect, beforeEach, vi } from 'vitest'

// On garde Notification/NotificationType réels (notification.ts ne dépend que de LeekWars),
// et on mocke les sources de données : store (leeks de l'éleveur), LeekWars (trophies/items/
// préférence rapport), i18n (t = identité instrumentée), item (enum ItemType).
const h = vi.hoisted(() => ({
	leeks: {} as Record<string, { id: number, name: string }>,
	trophies: [] as Array<{ code: string }>,
	items: {} as Record<string, { name: string, type: number }>,
	notifsOpenReport: false,
}))
vi.mock('@/model/store', () => ({ store: { state: { farmer: { get leeks() { return h.leeks } } } } }))
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		protect: (s: string) => s,
		get notifsOpenReport() { return h.notifsOpenReport },
		get trophies() { return h.trophies },
		get items() { return h.items },
	},
}))
vi.mock('@/model/i18n', () => ({ i18n: { t: (k: string) => `T(${k})` } }))
vi.mock('@/model/item', () => ({ ItemType: { WEAPON: 1, CHIP: 2, POTION: 3, HAT: 4 } }))

import { NotificationBuilder } from '@/model/notification-builder'
import { NotificationType } from '@/model/notification'

beforeEach(() => {
	h.leeks = {}
	h.trophies = []
	h.items = {}
	h.notifsOpenReport = false
})

describe('NotificationBuilder.build - combats & poireaux', () => {
	it('UP_LEVEL : lien /leek/<id>, nom résolu depuis les leeks', () => {
		h.leeks = { a: { id: 7, name: 'Poiro' } }
		const n = NotificationBuilder.build({ type: NotificationType.UP_LEVEL, parameters: ['7', '5'] })
		expect(n.link).toBe('/leek/7')
		expect(n.title).toEqual(['Poiro', '5'])
		expect(n.icon).toBe(true) // mdi-transfer-up
	})
	it('FIGHT_REPORT : lien, image, résultat', () => {
		h.leeks = { a: { id: 7, name: 'Poiro' } }
		const n = NotificationBuilder.build({ type: NotificationType.FIGHT_REPORT, parameters: ['7', '42', 'Enemy', '1'] })
		expect(n.link).toBe('/fight/42')
		expect(n.image).toBe('notif/garden.png')
		expect(n.title).toEqual(['Poiro', 'Enemy'])
		expect(n.result).toBe(1)
	})
	it('FIGHT_REPORT : leek inconnu → "?"', () => {
		const n = NotificationBuilder.build({ type: NotificationType.FIGHT_REPORT, parameters: ['999', '42', 'Enemy'] })
		expect(n.title).toEqual(['?', 'Enemy'])
	})
	it('FIGHT_REPORT respecte la préférence rapport (#4222)', () => {
		h.leeks = { a: { id: 7, name: 'Poiro' } }
		const n = NotificationBuilder.build({ type: NotificationType.FIGHT_REPORT, parameters: ['7', '42', 'Enemy', '1'] })
		h.notifsOpenReport = true
		expect(n.link).toBe('/report/42')
	})
})

describe('NotificationBuilder.build - trophées', () => {
	it('trophée connu : lien /trophy/<code>, classe notif-trophy', () => {
		h.trophies = [{ code: 'first_win' }, { code: 'second' }, { code: 'third' }]
		const n = NotificationBuilder.build({ type: NotificationType.TROPHY_UNLOCKED, parameters: ['3'] })
		expect(n.link).toBe('/trophy/third')
		expect(n.image).toBe('trophy/third.svg')
		expect(n.title).toEqual(['T(trophy.third)'])
		expect(n.clazz).toBe('notif-trophy')
	})
	it('trophée inconnu : repli vers /trophies', () => {
		const n = NotificationBuilder.build({ type: NotificationType.TROPHY_UNLOCKED, parameters: ['99'] })
		expect(n.link).toBe('/trophies')
		expect(n.title).toEqual(['#99'])
		expect(n.icon).toBe(true) // mdi-trophy
	})
})

describe('NotificationBuilder.build - tournoi & item', () => {
	it('TOURNAMENT_END : mappe l\'index de round vers son nom', () => {
		const n = NotificationBuilder.build({ type: NotificationType.TOURNAMENT_END, parameters: ['10', '4', 'x', 'Poiro'] })
		expect(n.link).toBe('/tournament/10')
		expect(n.title).toEqual(['Poiro', 'T(main.final)'])
	})
	it('TOURNAMENT_END : round >= 5 est ramené à "final"', () => {
		const n = NotificationBuilder.build({ type: NotificationType.TOURNAMENT_END, parameters: ['10', '9', 'x', 'Poiro'] })
		expect(n.title[1]).toBe('T(main.final)')
	})
	it('GIVE_ITEM (arme) : nom traduit via le préfixe weapon.', () => {
		h.items = { 100: { name: 'weapon_pistol', type: 1 } }
		const n = NotificationBuilder.build({ type: NotificationType.GIVE_ITEM, parameters: ['Giver', '100'] })
		expect(n.link).toBe('/inventory/')
		expect(n.title).toEqual(['Giver', 'T(weapon.pistol)'])
	})
})

describe('NotificationBuilder.build - forum & inconnu', () => {
	it('FORUM_VOTE_UP avec messageId -1 → lien sujet, icône pouce haut', () => {
		const n = NotificationBuilder.build({ type: NotificationType.FORUM_VOTE_UP, parameters: ['Voter', '5', '-1', '2', '1', 'Titre'] })
		expect(n.link).toBe('/forum/category-2/topic-5')
		expect(n.image).toBe('mdi-thumb-up')
		expect(n.title).toEqual(['Voter', 'Titre'])
	})
	it('type inconnu → repli lien null + libellé de debug', () => {
		const n = NotificationBuilder.build({ type: 9999, parameters: [] })
		expect(n.link).toBeNull()
		expect(n.title).toEqual(['? type 9999'])
	})
})
