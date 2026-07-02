import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Squares construit les popups éphémères (notifications + messages). On coupe le graphe
// lourd : LeekWars (protect/getAvatar/flag notifsPopups), i18n (rend la clé pour pouvoir
// inspecter les args), chat-format et les modèles Notification/ChatMessage (types seuls).
const lw = vi.hoisted(() => ({
	notifsPopups: true,
	protect: vi.fn((s: string) => `P(${s})`),
	getAvatar: vi.fn((id: number, changed: number) => `/avatar/${id}/${changed}`),
}))
vi.mock('@/model/leekwars', () => ({ LeekWars: lw }))

const i18nMock = vi.hoisted(() => ({ t: vi.fn((key: string) => key) }))
vi.mock('@/model/i18n', () => ({ i18n: i18nMock }))

vi.mock('@/model/chat-format', () => ({ formatChatPreview: (content: string) => `PREVIEW(${content})` }))
vi.mock('@/model/notification', () => ({ Notification: class Notification {} }))
vi.mock('@/model/chat', () => ({ ChatMessage: class ChatMessage {} }))

import { Squares } from '@/model/squares'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSquare = (o: any) => o

beforeEach(() => {
	vi.useFakeTimers()
	lw.notifsPopups = true
	lw.protect.mockClear()
	lw.getAvatar.mockClear()
	i18nMock.t.mockClear()
})
afterEach(() => { vi.useRealTimers() })

describe('Squares.add', () => {
	it('numérote les carrés et les empile', () => {
		const sq = new Squares()
		sq.add(asSquare({ message: 'a' }))
		sq.add(asSquare({ message: 'b' }))
		expect(sq.squares.map(s => s.id)).toEqual([0, 1])
	})

	it('retire chaque carré au bout de 5s', () => {
		const sq = new Squares()
		sq.add(asSquare({ message: 'a' }))
		expect(sq.squares).toHaveLength(1)
		vi.advanceTimersByTime(4999)
		expect(sq.squares).toHaveLength(1)
		vi.advanceTimersByTime(1)
		expect(sq.squares).toHaveLength(0)
	})
})

describe('Squares.addFromNotification', () => {
	const baseNotif = () => ({
		icon: false, image: 'foo.png', title: ['Alice', 'Bob'], message: ['x'],
		type: 5, link: '/l', clazz: 'cl', result: 1 as number | null,
	})

	it('ne fait rien si les popups de notification sont désactivées', () => {
		lw.notifsPopups = false
		const sq = new Squares()
		sq.addFromNotification(asSquare(baseNotif()))
		expect(sq.squares).toHaveLength(0)
	})

	it('préfixe /image/ quand ce n\'est pas une icône', () => {
		const sq = new Squares()
		sq.addFromNotification(asSquare(baseNotif()))
		expect(sq.squares[0].image).toBe('/image/foo.png')
		expect(sq.squares[0].icon).toBe(false)
	})

	it('garde l\'image telle quelle pour une icône', () => {
		const sq = new Squares()
		sq.addFromNotification(asSquare({ ...baseNotif(), icon: true }))
		expect(sq.squares[0].image).toBe('foo.png')
	})

	it('met les arguments du titre en gras et échappés (protect + <b>)', () => {
		const sq = new Squares()
		sq.addFromNotification(asSquare(baseNotif()))
		expect(i18nMock.t).toHaveBeenCalledWith('notification.title_5', { p0: '<b>P(Alice)</b>', p1: '<b>P(Bob)</b>' }, { escapeParameter: false })
	})

	it('copie link et clazz depuis la notification', () => {
		const sq = new Squares()
		sq.addFromNotification(asSquare(baseNotif()))
		expect(sq.squares[0].link).toBe('/l')
		expect(sq.squares[0].clazz).toBe('cl')
	})

	it('mappe result vers une icône de résultat', () => {
		const sq = new Squares()
		for (const [result, icon] of [[null, ''], [1, 'mdi-check'], [0, 'mdi-equal'], [-1, 'mdi-close']] as const) {
			sq.addFromNotification(asSquare({ ...baseNotif(), result }))
			expect(sq.squares[sq.squares.length - 1].resultIcon).toBe(icon)
		}
	})
})

describe('Squares.addFromMessage', () => {
	it('construit un carré depuis un message de chat', () => {
		const sq = new Squares()
		sq.addFromMessage(asSquare({ farmer: { id: 7, avatar_changed: 123, name: 'Zoe' }, content: 'hi', chat: 42 }))
		const s = sq.squares[0]
		expect(s.image).toBe('/avatar/7/123')
		expect(s.title).toBe('P(Zoe)')
		expect(s.message).toBe('► PREVIEW(hi)')
		expect(s.link).toBe('/messages/conversation/42')
		expect(s.icon).toBe(false)
		expect(s.padding).toBe(false)
		expect(s.resultIcon).toBe('')
	})
})
