import { describe, it, expect, beforeAll } from 'vitest'

// polyfills.ts patche Node.prototype à l'import : on l'applique une fois pour toutes.
beforeAll(async () => {
	await import('./polyfills')
})

// Reproduit un « dead object » Firefox : le wrapper d'un nœud dont le document a été détruit
// (iframe retirée, compartiment d'extension déchargé) jette sur n'importe quel accès.
function deadNode(): Node {
	return new Proxy({} as Node, {
		get() { throw new TypeError("can't access dead object") },
		set() { throw new TypeError("can't access dead object") },
	})
}

describe('garde-fou removeChild / insertBefore', () => {

	it('laisse passer les opérations normales', () => {
		const parent = document.createElement('div')
		const child = document.createElement('span')
		const anchor = document.createElement('b')
		parent.appendChild(anchor)

		expect(parent.insertBefore(child, anchor)).toBe(child)
		expect(child.parentNode).toBe(parent)
		expect(parent.removeChild(child)).toBe(child)
		expect(child.parentNode).toBe(null)
	})

	it('neutralise une opération cross-parent au lieu de jeter', () => {
		const parent = document.createElement('div')
		const autre = document.createElement('div')
		const orphelin = document.createElement('span')
		const ancre = document.createElement('b')
		autre.appendChild(ancre)

		// L'ancre n'appartient pas à `parent` : Vue jetterait, on avale.
		expect(() => parent.insertBefore(orphelin, ancre)).not.toThrow()
		expect(() => parent.removeChild(ancre)).not.toThrow()
		expect(ancre.parentNode).toBe(autre)
	})

	it('neutralise un nœud mort au lieu de casser le patch de Vue', () => {
		const parent = document.createElement('div')
		const vivant = document.createElement('span')
		const mort = deadNode()

		// Nœud de référence mort : avant, la lecture de .parentNode jetait.
		expect(() => parent.insertBefore(vivant, mort)).not.toThrow()
		// Nœud inséré mort, puis parent mort : avant, l'appel natif jetait depuis polyfills.ts.
		expect(() => parent.insertBefore(mort, null)).not.toThrow()
		expect(() => Node.prototype.insertBefore.call(mort, vivant, null)).not.toThrow()
		expect(() => Node.prototype.removeChild.call(mort, vivant)).not.toThrow()
		expect(() => parent.removeChild(mort)).not.toThrow()
	})

	it('relaie les erreurs qui ne viennent pas d\'un nœud mort', () => {
		const parent = document.createElement('div')
		// Insérer un nœud dans lui-même : erreur de hiérarchie légitime, elle doit remonter.
		expect(() => parent.insertBefore(parent, null)).toThrow()
	})
})
