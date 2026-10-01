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

	// Régression signalée par un joueur : le dossier d'une bibliothèque ne doit JAMAIS devenir un
	// chemin de recherche, sinon `attack/attack.py` masque le paquet `attack/` et `import
	// attack.attack` casse. Seuls les dossiers des IA d'entrée comptent.
	it('ne renvoie que les dossiers des IA d’entrée qu’on lui donne', () => {
		// entrée à la racine -> aucun chemin supplémentaire, même s'il existe des dossiers ailleurs
		expect(importRoots(['main.py'])).toEqual([])
		// entrée dans un dossier -> ce dossier seulement (imports voisins, comme au runtime)
		expect(importRoots(['MonIA/main.py'])).toEqual(['/MonIA'])
	})
})
