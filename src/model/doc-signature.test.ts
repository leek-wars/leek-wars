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
