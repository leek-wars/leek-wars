import { describe, expect, it, vi } from 'vitest'

vi.mock('@/model/leekwars', () => ({ LeekWars: { STATIC: '/' } }))
// entity.ts tire tout le moteur de rendu (game → path → Path2D, absent de happy-dom).
// vi.hoisted s'exécute avant les imports, seul moment où la classe peut être posée.
vi.hoisted(() => {
	if (typeof globalThis.Path2D === 'undefined') {
		globalThis.Path2D = class { } as unknown as typeof Path2D
	}
})

// L'import de game.ts doit précéder entity.ts : le cycle entity → game → bulb →
// entity laisse sinon FightEntity indéfini au moment où bulb.ts en hérite.
import '@/component/player/game/game'
import { EntityType, FightEntity } from '@/component/player/game/entity'
import { State } from '@/model/effect'

// On greffe le prototype sans passer par le constructeur : instancier une
// FightEntity demanderait un Game complet (textures, canvas), sans rien apporter
// au test, et les deux getters vivent de toute façon sur le prototype.
function entity(type: EntityType, ...states: State[]): FightEntity {
	return Object.assign(Object.create(FightEntity.prototype), { type, states: new Set<number>(states) })
}

describe('FightEntity.isStatic', () => {

	it('une tourelle est statique même sans l\'effet d\'état', () => {
		// Combats d'avant l'état STATIC des tourelles (37495408, 36440101) : le
		// générateur n'émettait aucun ADD_STATE, le grappin les déplaçait
		expect(entity(EntityType.TURRET).isStatic).toBe(true)
		expect(entity(EntityType.TURRET).unmovable).toBe(true)
	})

	it('un poireau n\'est statique que s\'il porte l\'état', () => {
		expect(entity(EntityType.LEEK).isStatic).toBe(false)
		expect(entity(EntityType.LEEK).unmovable).toBe(false)
		expect(entity(EntityType.LEEK, State.STATIC).isStatic).toBe(true)
	})

	it('l\'Enraciné est immobile mais pas statique, l\'Inversion le déplace', () => {
		expect(entity(EntityType.BULB, State.ROOTED).unmovable).toBe(true)
		expect(entity(EntityType.BULB, State.ROOTED).isStatic).toBe(false)
	})
})
