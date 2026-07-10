import { describe, it, expect } from 'vitest'
import { buildObjectApiModel, buildConstantMembersByPath } from './leekwars-dts'
import type { Constant } from '@/model/constant'

describe('buildObjectApiModel', () => {
	const m = buildObjectApiModel()

	it('classe les singletons et les classes', () => {
		expect(m.singletons).toEqual(expect.arrayContaining(['Fight', 'Field', 'Registers', 'Debug']))
		expect(m.classes).toEqual(expect.arrayContaining(['Entity', 'Me', 'Cell', 'Weapon', 'Chip']))
		// Fight est un const, pas une classe
		expect(m.classes).not.toContain('Fight')
	})

	it('extrait les méthodes et propriétés de Fight', () => {
		const names = m.members['Fight'].map(x => x.name)
		expect(names).toContain('me')          // propriété
		expect(names).toContain('turn')        // propriété
		expect(names).toContain('getNearestEnemy') // méthode
		const getNear = m.members['Fight'].find(x => x.name === 'getNearestEnemy')!
		expect(getNear.kind).toBe('method')
		expect(getNear.detail).toContain('()')
		const me = m.members['Fight'].find(x => x.name === 'me')!
		expect(me.kind).toBe('property')
	})

	it('Me expose les actions, Entity les stats', () => {
		expect(m.members['Me'].map(x => x.name)).toEqual(expect.arrayContaining(['useWeapon', 'setWeapon', 'moveToward']))
		expect(m.members['Entity'].map(x => x.name)).toEqual(expect.arrayContaining(['life', 'tp', 'strength', 'cell']))
	})

	it('meMembers = Me + Entity (dédupliqués)', () => {
		const names = m.meMembers.map(x => x.name)
		expect(names).toContain('useWeapon') // de Me
		expect(names).toContain('life')      // hérité d'Entity
		expect(new Set(names).size).toBe(names.length) // pas de doublon
	})

	it('instanceUnion couvre les membres de plusieurs classes sans doublon', () => {
		const names = m.instanceUnion.map(x => x.name)
		expect(names).toContain('cost')   // Weapon/Chip
		expect(names).toContain('life')   // Entity
		expect(names).toContain('x')      // Cell
		expect(new Set(names).size).toBe(names.length)
	})

	it('ne capte pas les lignes type/interface/commentaires comme des membres', () => {
		const all = Object.values(m.members).flat().map(x => x.name)
		expect(all).not.toContain('CellLike')
		expect(all).not.toContain('EntityLike')
	})
})

describe('buildConstantMembersByPath', () => {
	const constants = [
		{ name: 'WEAPON_PISTOL' }, { name: 'WEAPON_MACHINE_GUN' },
		{ name: 'CHIP_FIRE_BALL' },
		{ name: 'EFFECT_DAMAGE' }, { name: 'EFFECT_HEAL' },
		{ name: 'STATE_PACIFIST' },
		{ name: 'ENTITY_LEEK' }, { name: 'ENTITY_BULB' },
		{ name: 'STAT_STRENGTH' },
		{ name: 'FIGHT_TYPE_SOLO' },
	] as unknown as Constant[]
	const byPath = buildConstantMembersByPath(constants)

	it('items -> camelCase au niveau du conteneur', () => {
		expect(byPath['Weapon'].map(x => x.name)).toEqual(expect.arrayContaining(['pistol', 'machineGun']))
		expect(byPath['Chip'].map(x => x.name)).toContain('fireBall')
	})

	it('catégories directes en MAJUSCULE', () => {
		expect(byPath['Effect'].map(x => x.name)).toEqual(expect.arrayContaining(['DAMAGE', 'HEAL']))
		expect(byPath['State'].map(x => x.name)).toContain('PACIFIST')
	})

	it('sous-namespaces exposés au niveau conteneur ET peuplés au niveau sous-chemin', () => {
		// Entity.Stat.STRENGTH, Entity.Type.LEEK
		expect(byPath['Entity'].find(x => x.name === 'Stat')?.isNamespace).toBe(true)
		expect(byPath['Entity'].find(x => x.name === 'Type')?.isNamespace).toBe(true)
		expect(byPath['Entity.Stat'].map(x => x.name)).toContain('STRENGTH')
		expect(byPath['Entity.Type'].map(x => x.name)).toEqual(expect.arrayContaining(['LEEK', 'BULB']))
		expect(byPath['Fight.Type'].map(x => x.name)).toContain('SOLO')
		expect(byPath['Fight'].find(x => x.name === 'Type')?.isNamespace).toBe(true)
	})
})
