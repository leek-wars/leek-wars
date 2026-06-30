import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setLocalStorageSafe } from '@/model/storage'

// Faux localStorage contrôlable : `failsLeft` fait échouer les N prochains setItem
// avec une QuotaExceededError, pour simuler un quota plein de façon déterministe.
class FakeStorage {
	map = new Map<string, string>()
	failsLeft = 0
	get length() { return this.map.size }
	key(i: number) { return Array.from(this.map.keys())[i] ?? null }
	getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null }
	setItem(k: string, v: string) {
		if (this.failsLeft > 0) { this.failsLeft--; throw new DOMException('full', 'QuotaExceededError') }
		this.map.set(k, v)
	}
	removeItem(k: string) { this.map.delete(k) }
	clear() { this.map.clear() }
}

let fake: FakeStorage
beforeEach(() => { fake = new FakeStorage(); vi.stubGlobal('localStorage', fake) })
afterEach(() => { vi.unstubAllGlobals() })

describe('setLocalStorageSafe', () => {
	it('écrit normalement quand il y a de la place', () => {
		setLocalStorageSafe('k', 'v')
		expect(fake.getItem('k')).toBe('v')
	})

	it('purge les caches régénérables puis réessaie quand le quota est plein', () => {
		fake.map.set('editor/viewstate/a', '1')
		fake.map.set('editor/scroll/b', '2')
		fake.map.set('important', 'keep')
		fake.failsLeft = 1 // seul le 1er setItem échoue, le retry passe
		setLocalStorageSafe('k', 'v')
		expect(fake.getItem('k')).toBe('v')
		expect(fake.getItem('editor/viewstate/a')).toBeNull() // purgé
		expect(fake.getItem('editor/scroll/b')).toBeNull() // purgé
		expect(fake.getItem('important')).toBe('keep') // non régénérable → conservé
	})

	it('ne purge pas la clé en cours d\'écriture', () => {
		fake.map.set('editor/viewstate/old', '1')
		fake.map.set('editor/viewstate/current', 'stale')
		fake.failsLeft = 1
		setLocalStorageSafe('editor/viewstate/current', 'new')
		expect(fake.getItem('editor/viewstate/current')).toBe('new') // réécrite, pas purgée
		expect(fake.getItem('editor/viewstate/old')).toBeNull() // l'autre est purgée
	})

	it('abandonne silencieusement si toujours plein après purge', () => {
		fake.map.set('editor/viewstate/a', '1')
		fake.failsLeft = 2 // initial + retry échouent
		expect(() => setLocalStorageSafe('k', 'v')).not.toThrow()
		expect(fake.getItem('k')).toBeNull()
		expect(fake.getItem('editor/viewstate/a')).toBeNull() // purgé malgré tout
	})

	it('relance une erreur qui n\'est pas un dépassement de quota', () => {
		fake.setItem = () => { throw new Error('boom') }
		expect(() => setLocalStorageSafe('k', 'v')).toThrow('boom')
	})
})
