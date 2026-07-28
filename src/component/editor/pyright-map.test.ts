import { describe, it, expect } from 'vitest'
import { importRoots } from './pyright-map'

describe('importRoots', () => {
	it('extrait les dossiers absolus, racine exclue, triés et dédupliqués', () => {
		expect(importRoots(['main.py', 'dossier/lib.py', 'dossier/utils.py', 'a/b/deep.py']))
			.toEqual(['/a/b', '/dossier'])
	})

	it('aucun dossier pour des fichiers à la racine', () => {
		expect(importRoots(['main.py', 'strat.py'])).toEqual([])
	})
})
