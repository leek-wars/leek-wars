import { describe, it, expect } from 'vitest'

// Chaque fichier de test a ses propres modules : on retire Object.hasOwn AVANT d'importer
// polyfills-es, comme sur un moteur qui ne l'a pas (Chromium < 93).
describe('Object.hasOwn', () => {
	it('est posé quand le moteur ne l\'a pas', async () => {
		const native = Object.hasOwn
		Reflect.deleteProperty(Object, 'hasOwn')
		try {
			await import('./polyfills-es')
			expect(Object.hasOwn({ a: 1 }, 'a')).toBe(true)
			expect(Object.hasOwn(Object.create({ a: 1 }), 'a')).toBe(false)
			expect(() => Object.hasOwn(null as unknown as object, 'a')).toThrow(TypeError)
			expect(Object.keys(Object)).not.toContain('hasOwn')
		} finally {
			Object.defineProperty(Object, 'hasOwn', { configurable: true, writable: true, value: native })
		}
	})
})
