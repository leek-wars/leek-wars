import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Requêtes simulées : `post`/`get` rendent un objet thenable avec `.error`, comme LeekWars.
const calls = vi.hoisted(() => ({ post: [] as [string, Record<string, unknown>][], get: [] as string[], postReply: null as unknown, postError: null as unknown, getReply: null as unknown }))
function request(reply: () => unknown, error: () => unknown) {
	const r = {
		then(ok: (d: unknown) => void) { if (error() === null) { queueMicrotask(() => ok(reply())) } return r },
		error(ko: (e: unknown) => void) { if (error() !== null) { queueMicrotask(() => ko(error())) } return r },
	}
	return r
}
vi.mock('@/model/leekwars', () => ({
	LeekWars: {
		trophies: [{ id: 1, code: 'winner' }, { id: 2, code: 'lucky_shot' }],
		post: (url: string, args: Record<string, unknown>) => { calls.post.push([url, args]); return request(() => calls.postReply, () => calls.postError) },
		get: (url: string) => { calls.get.push(url); return request(() => calls.getReply, () => null) },
	},
}))
const commits = vi.hoisted(() => [] as [string, unknown][])
vi.mock('@/model/store', () => ({
	store: { state: { connected: true, farmer: { id: 7 } }, commit: (type: string, data: unknown) => { commits.push([type, data]) }, watch: vi.fn() },
}))
vi.mock('@/model/i18n', () => ({ i18n: { locale: 'fr' } }))

import { achievementName, desktop, desktopAutoLogin, desktopSyncTrophies, desktopTrophyUnlocked, isDesktop } from './desktop'

function bridge(available = true) {
	return {
		wrapper: true as const, version: '0.1.0', platform: 'linux',
		info: vi.fn(async () => ({ available })),
		user: vi.fn(async () => null),
		authTicket: vi.fn(async () => 'abcd'),
		cancelAuthTicket: vi.fn(async () => {}),
		achievement: { activate: vi.fn(async () => true), isActivated: vi.fn(async () => false), sync: vi.fn(async (n: string[]) => n) },
		setRichPresence: vi.fn(async () => {}),
		app: { openExternal: vi.fn(async () => {}), toggleFullscreen: vi.fn(async () => {}), setZoom: vi.fn(async () => {}), quit: vi.fn(async () => {}) },
	}
}
const flush = () => new Promise(r => setTimeout(r, 0))

beforeEach(() => {
	calls.post.length = 0; calls.get.length = 0; commits.length = 0
	calls.postReply = null; calls.postError = null; calls.getReply = null
})
afterEach(() => { delete window.desktop })

describe('client de bureau', () => {
	it('inactif dans un navigateur', async () => {
		expect(desktop()).toBe(null)
		expect(isDesktop()).toBe(false)
		expect(await desktopAutoLogin()).toBe(false)
		desktopSyncTrophies()
		desktopTrophyUnlocked(1)
		expect(calls.post).toEqual([])
		expect(calls.get).toEqual([])
	})

	it('le nom de succès est le code du trophée en majuscules', () => {
		expect(achievementName('lucky_shot')).toBe('LUCKY_SHOT')
	})

	it('connexion automatique : ticket envoyé, éleveur connecté', async () => {
		window.desktop = bridge()
		calls.postReply = { farmer: { id: 7 } }
		expect(await desktopAutoLogin()).toBe(true)
		expect(calls.post).toEqual([['farmer/login-desktop', { ticket: 'abcd' }]])
		expect(commits.map(c => c[0])).toEqual(['connect', 'connected'])
	})

	it('connexion automatique : compte inconnu, rien de connecté', async () => {
		window.desktop = bridge()
		calls.postError = { error: 'no_such_farmer' }
		expect(await desktopAutoLogin()).toBe(false)
		expect(commits).toEqual([])
	})

	it('connexion automatique : plateforme absente, aucun appel', async () => {
		window.desktop = bridge(false)
		expect(await desktopAutoLogin()).toBe(false)
		expect(calls.post).toEqual([])
	})

	it('synchro : seuls les trophées obtenus partent', async () => {
		const b = bridge()
		window.desktop = b
		calls.getReply = { trophies: [{ code: 'winner', unlocked: true }, { code: 'lucky_shot', unlocked: false }] }
		desktopSyncTrophies()
		await flush()
		expect(calls.get).toEqual(['trophy/my-trophies/fr'])
		expect(b.achievement.sync).toHaveBeenCalledWith(['WINNER'])
	})

	it('trophée en temps réel : activé par son code, id inconnu ignoré', () => {
		const b = bridge()
		window.desktop = b
		desktopTrophyUnlocked(2)
		desktopTrophyUnlocked(99)
		expect(b.achievement.activate).toHaveBeenCalledTimes(1)
		expect(b.achievement.activate).toHaveBeenCalledWith('LUCKY_SHOT')
	})
})
