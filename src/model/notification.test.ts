import { describe, it, expect, beforeEach, vi } from 'vitest'

// notification.ts ne dépend que de LeekWars (protect + flag réactif notifsOpenReport).
// On mocke ces deux points. protect renvoie un marqueur pour vérifier qu'il est bien appliqué.
const h = vi.hoisted(() => ({ notifsOpenReport: false }))
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		get notifsOpenReport() { return h.notifsOpenReport },
		protect: (s: string) => `P(${s})`,
	},
}))

import { Notification, NotificationType } from '@/model/notification'

beforeEach(() => { h.notifsOpenReport = false })

describe('Notification - normalisation de l\'image', () => {
	it('image fichier sans dossier → préfixée notif/', () => {
		const n = new Notification({ type: NotificationType.FIGHT_REPORT }, '/x', 'foo.png')
		expect(n.image).toBe('notif/foo.png')
		expect(n.icon).toBeFalsy()
	})
	it('image fichier avec dossier → conservée telle quelle', () => {
		const n = new Notification({ type: NotificationType.TROPHY_UNLOCKED }, '/x', 'trophy/abc.svg')
		expect(n.image).toBe('trophy/abc.svg')
		expect(n.icon).toBeFalsy()
	})
	it('image sans extension → traitée comme icône (mdi)', () => {
		const n = new Notification({ type: NotificationType.NEW_WARNING }, '/x', 'mdi-flag')
		expect(n.image).toBe('mdi-flag')
		expect(n.icon).toBe(true)
	})
	it('image null → pas d\'icône', () => {
		const n = new Notification({ type: NotificationType.NEW_WARNING }, '/x', null)
		expect(n.image).toBeNull()
		expect(n.icon).toBeFalsy()
	})
})

describe('Notification - champs et échappement', () => {
	it('reprend id/date/type/result/read depuis data', () => {
		const n = new Notification({ id: 5, date: 99, type: NotificationType.FIGHT_REPORT, read: true }, '/fight/3', null, [], [], 1)
		expect(n.id).toBe(5)
		expect(n.date).toBe(99)
		expect(n.type).toBe(NotificationType.FIGHT_REPORT)
		expect(n.read).toBe(true)
		expect(n.result).toBe(1)
	})
	it('le message passe par protect, le titre reste brut', () => {
		const n = new Notification({ type: NotificationType.NEW_MESSAGE }, '/x', null, ['<raw>'], ['a', 'b'])
		expect(n.title).toEqual(['<raw>'])
		expect(n.message).toEqual(['P(a)', 'P(b)'])
	})
})

describe('Notification - classe CSS', () => {
	it('trophée → notif-trophy', () => {
		expect(new Notification({ type: NotificationType.TROPHY_UNLOCKED }, '/x', null).clazz).toBe('notif-trophy')
	})
	it('grosses victoires de tournoi → notif-bigwin', () => {
		for (const t of [NotificationType.TOURNAMENT_WINNER, NotificationType.FARMER_TOURNAMENT_WIN, NotificationType.TEAM_TOURNAMENT_WIN]) {
			expect(new Notification({ type: t }, '/x', null).clazz).toBe('notif-bigwin')
		}
	})
	it('autre type → pas de classe', () => {
		expect(new Notification({ type: NotificationType.NEW_MESSAGE }, '/x', null).clazz).toBe('')
	})
})

describe('Notification - getter link (#4222 rapport vs combat)', () => {
	it('type résultat de combat + préférence ON → /fight/ devient /report/', () => {
		const n = new Notification({ type: NotificationType.FIGHT_REPORT }, '/fight/42', null)
		h.notifsOpenReport = true
		expect(n.link).toBe('/report/42')
	})
	it('préférence OFF → lien /fight/ inchangé', () => {
		const n = new Notification({ type: NotificationType.FIGHT_REPORT }, '/fight/42', null)
		expect(n.link).toBe('/fight/42')
	})
	it('FIGHT_COMMENT est exclu : reste sur le combat même préférence ON', () => {
		const n = new Notification({ type: NotificationType.FIGHT_COMMENT }, '/fight/42', null)
		h.notifsOpenReport = true
		expect(n.link).toBe('/fight/42')
	})
	it('type hors combat → lien inchangé même préférence ON', () => {
		const n = new Notification({ type: NotificationType.NEW_MESSAGE }, '/forum/category-1/topic-2', null)
		h.notifsOpenReport = true
		expect(n.link).toBe('/forum/category-1/topic-2')
	})
	it('lien ne commençant pas par /fight/ → inchangé', () => {
		const n = new Notification({ type: NotificationType.CHALLENGE }, null, null)
		h.notifsOpenReport = true
		expect(n.link).toBeNull()
	})
})
