import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le store tire tout le client : on isole les dépendances lourdes.
const post = vi.fn()
vi.mock('@/model/leekwars', () => {
	const noop = () => undefined
	return { LeekWars: {
		setTitleCounter: noop, notifsOpenReport: true, protect: (s: string) => s,
		post: (...args: unknown[]) => post(...args),
	} }
})
vi.mock('@/model/filesystem', () => ({ fileSystem: { clear: () => undefined, init: () => undefined } }))

import { Notification, NotificationType } from '@/model/notification'
import { readNotificationsAt, store } from '@/model/store'

const notif = (id: number, link: string | null, read = false) =>
	new Notification({ id, type: NotificationType.FIGHT_REPORT, read, date: 0, parameters: [] }, link, null)

beforeEach(() => {
	post.mockClear()
	store.state.connected = true
	store.state.notifications = [
		notif(1, '/forum/category-2/topic-5/page-3#message-9'),
		notif(2, '/fight/42'),
		notif(3, '/inventory/'),
		notif(4, '/fight/43', true),
		notif(5, null),
	]
	store.state.unreadNotifications = 4
})

const readIds = () => post.mock.calls.map(c => (c[1] as { notification_id: number }).notification_id)

describe('readNotificationsAt', () => {
	it('lit la notification dont la page est affichée, ancre ignorée', () => {
		readNotificationsAt('/forum/category-2/topic-5/page-3')
		expect(readIds()).toEqual([1])
		expect(store.state.notifications[0].read).toBe(true)
		expect(store.state.unreadNotifications).toBe(3)
	})
	it('un rapport de combat vaut son combat', () => {
		readNotificationsAt('/report/42')
		expect(readIds()).toEqual([2])
	})
	it('barre finale ignorée', () => {
		readNotificationsAt('/inventory')
		expect(readIds()).toEqual([3])
	})
	it('ni les notifications déjà lues ni les autres pages', () => {
		readNotificationsAt('/fight/43')
		readNotificationsAt('/forum/category-2/topic-5')
		readNotificationsAt('/')
		expect(post).not.toHaveBeenCalled()
	})
	it('rien si aucune notification non lue', () => {
		store.state.unreadNotifications = 0
		readNotificationsAt('/fight/42')
		expect(post).not.toHaveBeenCalled()
	})
	it('rien si déconnecté', () => {
		store.state.connected = false
		readNotificationsAt('/fight/42')
		expect(post).not.toHaveBeenCalled()
	})
})
