import { describe, expect, it } from 'vitest'
import { isReservedName } from './reserved-names'

describe('isReservedName', () => {
	it('refuse les noms que le serveur refuse', () => {
		for (const name of ['.', '..', '.trash', '.git', '.GIT', '.Git']) {
			expect(isReservedName(name), name).toBe(true)
		}
	})

	it('accepte les noms voisins', () => {
		for (const name of ['...', 'Poil au...', '.gitignore', '.github', 'git', '.trash2']) {
			expect(isReservedName(name), name).toBe(false)
		}
	})
})
