import { describe, expect, it } from 'vitest'
import { displaySignature, flatNameForObjectPath, flatToObjectPath, objectSignatureOf, receiverFor, typescriptTypeToPython } from '@/model/doc-signature'

describe('typescriptTypeToPython', () => {
	it('translittère les types de base', () => {
		expect(typescriptTypeToPython('number')).toBe('int')
		expect(typescriptTypeToPython('boolean')).toBe('bool')
		expect(typescriptTypeToPython('string')).toBe('str')
		expect(typescriptTypeToPython('void')).toBe('None')
	})
	it('garde les classes de l’API, identiques dans les deux langages', () => {
		expect(typescriptTypeToPython('Cell')).toBe('Cell')
		expect(typescriptTypeToPython('Entity')).toBe('Entity')
	})
	it('translittère les listes, unions et Record', () => {
		expect(typescriptTypeToPython('Cell[]')).toBe('list[Cell]')
		expect(typescriptTypeToPython('Entity | null')).toBe('Entity | None')
		expect(typescriptTypeToPython('Record<string, string>')).toBe('dict[str, str]')
	})
})

describe('flatToObjectPath', () => {
	it('inverse la table des membres objet', () => {
		expect(flatToObjectPath()['getLife']).toBe('Entity.life')
		expect(flatToObjectPath()['getCellFromXY']).toBe('Field.cellFromXY')
	})
	it('garde un seul chemin quand plusieurs membres visent la même fonction plate', () => {
		// getCellDistance est visée par Cell.distance, Entity.distance, Field.distance et
		// Field.cellDistance : une seule doit sortir, sinon l'affichage serait ambigu.
		expect(typeof flatToObjectPath()['getCellDistance']).toBe('string')
	})
})

describe('objectSignatureOf', () => {
	it('donne la propriété et son type pour getLife', () => {
		const signature = objectSignatureOf('getLife', 6)
		expect(signature).not.toBeNull()
		expect(signature!.path).toBe('Entity.life')
		expect(signature!.kind).toBe('property')
		expect(signature!.typescript).toBe('life: number')
		expect(signature!.python).toBe('life: int')
	})

	it('affine int en float quand LeekScript déclare un réel', () => {
		// getDistance renvoie un réel (type 7) : `int` serait faux en Python.
		const signature = objectSignatureOf('getDistance', 7)
		expect(signature!.python).toContain('float')
	})

	it('rend une méthode avec ses arguments', () => {
		const signature = objectSignatureOf('useWeapon')
		expect(signature!.kind).toBe('method')
		expect(signature!.container).toBe('Me')
		// La flèche de retour Python remplace le `:` final de TypeScript.
		expect(signature!.python).toMatch(/^useWeapon\(.*\) -> /)
		expect(signature!.typescript).toMatch(/^useWeapon\(.*\): /)
	})

	it('rend une méthode de singleton', () => {
		const signature = objectSignatureOf('getCellFromXY')
		expect(signature!.path).toBe('Field.cellFromXY')
		expect(signature!.python).toContain('x: int')
		expect(signature!.python).toContain('Cell | None')
	})

	it('renvoie null pour une fonction sans équivalent objet', () => {
		// getForce est un alias historique de getStrength que l'API objet n'a pas repris.
		expect(objectSignatureOf('getForce')).toBeNull()
		expect(objectSignatureOf('fonctionQuiNExistePas')).toBeNull()
	})
})

describe('receiverFor', () => {
	it('donne Fight.me pour les actions du poireau courant', () => {
		expect(receiverFor('Me', 'python')).toBe('Fight.me')
	})
	it('ne donne pas de receveur pour un singleton', () => {
		expect(receiverFor('Field', 'python')).toBeNull()
		expect(receiverFor('Fight', 'javascript')).toBeNull()
	})
	it('nomme le receveur d’après la classe', () => {
		expect(receiverFor('Entity', 'python')).toBe('entity')
		expect(receiverFor('Cell', 'python')).toBe('cell')
	})
})

describe('flatNameForObjectPath', () => {
	it('résout un chemin objet vers la fonction plate', () => {
		expect(flatNameForObjectPath('Entity.life')).toBe('getLife')
		expect(flatNameForObjectPath('Field.cellFromXY')).toBe('getCellFromXY')
	})
	it('tolère le receveur en minuscule, tel qu’affiché dans la doc', () => {
		// La fiche montre `entity.life` : c'est ce que le lecteur va recopier dans l'URL.
		expect(flatNameForObjectPath('entity.life')).toBe('getLife')
		expect(flatNameForObjectPath('me.useWeapon')).toBe('useWeapon')
	})
	it('ne touche pas aux titres de page normaux', () => {
		// Les vraies pages d'encyclopédie ne doivent surtout pas être redirigées.
		expect(flatNameForObjectPath('getLife')).toBeNull()
		expect(flatNameForObjectPath('Règles du jeu')).toBeNull()
		expect(flatNameForObjectPath('LeekScript')).toBeNull()
		expect(flatNameForObjectPath('Entity.inexistant')).toBeNull()
	})
})

describe('équivalents de bibliothèque standard', () => {
	it('montre la forme native de CHAQUE langage', () => {
		// `abs` n'a aucune entrée dans l'API objet : la fiche affichait la forme plate avec un
		// badge « LeekScript uniquement », faux dans les deux langages.
		expect(objectSignatureOf('abs', undefined, 'typescript')!.path).toBe('Math.abs')
		// Python garde son builtin : on ne double pas sa stdlib.
		expect(objectSignatureOf('abs', undefined, 'python')!.path).toBe('abs')
	})

	it('signale l’arrondi bancaire de Python au lieu de le masquer', () => {
		// round(2.5) vaut 2 en Python, 3 en LeekScript et en JS. Une IA Python doit se comporter
		// comme du Python : l'écart est ASSUMÉ, la doc le dit.
		const python = objectSignatureOf('round', undefined, 'python')!
		expect(python.path).toBe('round')
		expect(python.python).toContain('BANCAIRE')
		expect(objectSignatureOf('round', undefined, 'typescript')!.path).toBe('Math.round')
	})

	it('couvre toute la trigonométrie et les logarithmes', () => {
		for (const name of ['sqrt', 'cos', 'sin', 'tan', 'log', 'log2', 'log10', 'exp', 'pow', 'floor', 'ceil', 'round']) {
			expect(objectSignatureOf(name, undefined, 'typescript'), name).not.toBeNull()
			expect(objectSignatureOf(name, undefined, 'python'), name).not.toBeNull()
		}
	})

	it('marque les entrées stdlib pour ne pas leur coller un receveur', () => {
		const signature = objectSignatureOf('sqrt', undefined, 'typescript')!
		expect(signature.stdlib).toBe(true)
		expect(signature.typescript).toBe('Math.sqrt(x: number): number')
	})

	it('renvoie chaque langage vers SA bibliothèque', () => {
		for (const n of ['sqrt', 'cos', 'sin', 'tan', 'log', 'exp', 'floor', 'ceil', 'hypot']) {
			expect(objectSignatureOf(n, undefined, 'typescript')!.path, n).toBe('Math.' + n)
			expect(objectSignatureOf(n, undefined, 'python')!.path, n).toBe('math.' + n)
		}
	})

	it('traduit les fonctions de chaîne en méthodes du langage hôte', () => {
		expect(objectSignatureOf('toUpper', undefined, 'typescript')!.path).toBe('s.toUpperCase')
		expect(objectSignatureOf('toUpper', undefined, 'python')!.path).toBe('s.upper')
		expect(objectSignatureOf('length', undefined, 'python')!.path).toBe('len')
	})

	it('expose sous Math les utilitaires que le langage hôte n’a pas', () => {
		// Le prélude polyglot les greffe désormais sur Math : même nom dans les quatre langages.
		// Avant, elles n'étaient atteignables par AUCUNE IA polyglot.
		// Absentes des DEUX langages : Math les porte de part et d'autre.
		for (const name of ['rotateLeft', 'isPermutation', 'setBit', 'realBits', 'testBit', 'bitReverse']) {
			expect(objectSignatureOf(name, undefined, 'typescript')!.path, name).toBe('Math.' + name)
			expect(objectSignatureOf(name, undefined, 'python')!.path, name).toBe('Math.' + name)
		}
		// Absentes de JS SEULEMENT : Python a déjà de quoi faire.
		expect(objectSignatureOf('bitCount', undefined, 'typescript')!.path).toBe('Math.bitCount')
		expect(objectSignatureOf('bitCount', undefined, 'python')!.path).toBe('x.bit_count()')
		expect(objectSignatureOf('toDegrees', undefined, 'typescript')!.path).toBe('Math.toDegrees')
		expect(objectSignatureOf('toDegrees', undefined, 'python')!.path).toBe('math.degrees')
	})

	it('ne prétend pas avoir un équivalent quand il n’y en a vraiment pas', () => {
		// Les intervalles n'ont pas de type équivalent : le badge « LeekScript uniquement »
		// reste la bonne réponse.
		expect(objectSignatureOf('intervalMin', undefined, 'typescript')).toBeNull()
		expect(objectSignatureOf('arrayPartition', undefined, 'python')).toBeNull()
	})

	it('laisse l’API de jeu à l’API objet', () => {
		// La stdlib ne doit pas court-circuiter getLife -> Entity.life.
		expect(objectSignatureOf('getLife', 6, 'typescript')!.path).toBe('Entity.life')
	})

	it('n’affiche aucun équivalent stdlib en LeekScript', () => {
		expect(objectSignatureOf('abs', undefined, 'leekscript')).toBeNull()
	})
})

describe('couverture de la table stdlib', () => {
	const enTS = (n: string) => objectSignatureOf(n, undefined, 'typescript')
	const enPY = (n: string) => objectSignatureOf(n, undefined, 'python')

	it('couvre les listes, tables et ensembles', () => {
		for (const n of ['count', 'push', 'pop', 'arrayConcat', 'arrayEvery', 'arraySome', 'arraySlice',
			'arrayToSet', 'arrayUnique', 'isEmpty', 'pushAll', 'search', 'insert']) {
			expect(enTS(n), n).not.toBeNull()
			expect(enPY(n), n).not.toBeNull()
		}
		for (const n of ['mapClear', 'mapIsEmpty', 'mapMerge', 'mapPutAll', 'mapSearch', 'mapFilter']) {
			expect(enTS(n), n).not.toBeNull()
			expect(enPY(n), n).not.toBeNull()
		}
		for (const n of ['setPut', 'setRemove', 'setContains', 'setSize', 'setUnion', 'setIntersection',
			'setDifference', 'setToArray', 'setIsSubsetOf']) {
			expect(enTS(n), n).not.toBeNull()
			expect(enPY(n), n).not.toBeNull()
		}
	})

	it('utilise les opérateurs d’ensemble de Python', () => {
		expect(enPY('setUnion')!.path).toBe('s | t')
		expect(enPY('setDifference')!.path).toBe('s - t')
	})

	it('renvoie randInt vers randrange et non randint', () => {
		// randInt est [a, b) en LeekScript, exactement randrange. random.randint serait FAUX
		// (inclusif), et l'erreur passerait inaperçue. JS n'a pas de tirage borné : Math.randInt.
		expect(enPY('randInt')!.path).toBe('random.randrange')
		expect(enTS('randInt')!.path).toBe('Math.randInt')
	})

	it('couvre un langage sans l’autre quand c’est le cas', () => {
		// itertools.batched est du 3.12, JS n'a pas d'équivalent natif.
		expect(enPY('arrayChunk')).not.toBeNull()
		expect(enTS('arrayChunk')).toBeNull()
		// console.warn existe en JS ; Python n'a pas de canal d'avertissement séparé.
		expect(enTS('debugW')).not.toBeNull()
		expect(enPY('debugW')).toBeNull()
		// bitCount, lui, est désormais couvert des DEUX côtés via Math.
		expect(enTS('bitCount')).not.toBeNull()
		expect(enPY('bitCount')).not.toBeNull()
	})

	it('laisse les intervalles sans équivalent', () => {
		// Aucun type intervalle en JS ni en Python : la forme LeekScript et son badge sont
		// la bonne réponse, pas un pseudo-équivalent.
		for (const n of ['intervalMin', 'intervalContains', 'intervalToArray']) {
			expect(enTS(n), n).toBeNull()
			expect(enPY(n), n).toBeNull()
		}
	})
})

describe('displaySignature', () => {
	it('ne colle pas de receveur devant une forme stdlib', () => {
		// Régression : la fiche affichait `m.list(m.keys())` en prod, un receveur devant une
		// forme qui portait déjà son chemin. La composition était dupliquée entre la fiche et
		// le titre de page ; une seule des deux avait été corrigée.
		expect(displaySignature('mapKeys', undefined, 'python')).toBe('list(m.keys()) -> list')
		expect(displaySignature('abs', undefined, 'typescript')).toBe('Math.abs(x: number): number')
		expect(displaySignature('sqrt', undefined, 'python')).toBe('math.sqrt(x: float) -> float')
	})

	it('compose le receveur pour l’API de jeu', () => {
		expect(displaySignature('getLife', 6, 'python')).toBe('entity.life: int')
		expect(displaySignature('useWeapon', undefined, 'typescript')).toMatch(/^Fight\.me\.useWeapon\(/)
	})

	it('ne renvoie rien en LeekScript ni sans équivalent', () => {
		expect(displaySignature('getLife', 6, 'leekscript')).toBeNull()
		expect(displaySignature('intervalMin', undefined, 'python')).toBeNull()
	})
})

describe('catégorie sans équivalent dans le langage lu', () => {
	// Règle appliquée par documentation.vue : une catégorie dont AUCUNE fonction n'existe dans
	// le langage lu est masquée. En pratique ce sont les intervalles, absents de JS et Python.
	const INTERVALLES = ['intervalMin', 'intervalMax', 'intervalContains', 'intervalToArray',
		'intervalToSet', 'intervalIsEmpty', 'intervalAverage', 'intervalSize']
	const LISTES = ['count', 'push', 'pop', 'arrayFilter', 'arraySort']

	it('aucune fonction d’intervalle n’a d’équivalent', () => {
		for (const langue of ['typescript', 'python'] as const) {
			for (const n of INTERVALLES) {
				expect(displaySignature(n, undefined, langue), `${n} en ${langue}`).toBeNull()
			}
		}
	})

	it('les listes en ont, elles restent affichées', () => {
		for (const langue of ['typescript', 'python'] as const) {
			expect(LISTES.some(n => displaySignature(n, undefined, langue) !== null), langue).toBe(true)
		}
	})
})
