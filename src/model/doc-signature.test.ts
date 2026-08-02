import { describe, expect, it } from 'vitest'
import { flatNameForObjectPath, flatToObjectPath, objectSignatureOf, receiverFor, typescriptTypeToPython } from '@/model/doc-signature'

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
	it('donne Math.abs en TypeScript et abs natif en Python', () => {
		// Le cas qui manquait : `abs` n'a aucune entrée dans l'API objet, la fiche affichait
		// donc la forme plate avec un badge « LeekScript uniquement » — faux en TS.
		expect(objectSignatureOf('abs', undefined, 'typescript')!.path).toBe('Math.abs')
		expect(objectSignatureOf('abs', undefined, 'python')!.path).toBe('abs')
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

	it('traduit les fonctions de chaîne en méthodes du langage hôte', () => {
		expect(objectSignatureOf('toUpper', undefined, 'typescript')!.path).toBe('s.toUpperCase')
		expect(objectSignatureOf('toUpper', undefined, 'python')!.path).toBe('s.upper')
		expect(objectSignatureOf('length', undefined, 'python')!.path).toBe('len')
	})

	it('ne prétend pas avoir un équivalent quand il n’y en a pas', () => {
		// Les utilitaires de bits et les tirages entiers n'ont pas de contrepartie native :
		// le badge « LeekScript uniquement » est alors correct.
		expect(objectSignatureOf('rotateLeft', undefined, 'typescript')).toBeNull()
		expect(objectSignatureOf('randInt', undefined, 'typescript')).toBeNull()
		expect(objectSignatureOf('bitCount', undefined, 'python')).toBeNull()
		// toDegrees existe en Python (math.degrees) mais pas en JS.
		expect(objectSignatureOf('toDegrees', undefined, 'typescript')).toBeNull()
		expect(objectSignatureOf('toDegrees', undefined, 'python')!.path).toBe('math.degrees')
	})

	it('laisse l’API de jeu à l’API objet', () => {
		// La stdlib ne doit pas court-circuiter getLife -> Entity.life.
		expect(objectSignatureOf('getLife', 6, 'typescript')!.path).toBe('Entity.life')
	})

	it('n’affiche aucun équivalent stdlib en LeekScript', () => {
		expect(objectSignatureOf('abs', undefined, 'leekscript')).toBeNull()
	})
})
