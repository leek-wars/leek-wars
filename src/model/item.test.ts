import { describe, it, expect } from 'vitest'
import { ItemType, itemImageName, itemImageUrl } from '@/model/item'

describe('itemImageName', () => {
	it('retire le préfixe de catégorie', () => {
		expect(itemImageName({ type: ItemType.WEAPON, name: 'weapon_pistol' })).toBe('pistol')
		expect(itemImageName({ type: ItemType.POTION, name: 'potion_life_potion' })).toBe('life_potion')
		expect(itemImageName({ type: ItemType.HAT, name: 'hat_beret' })).toBe('beret')
	})
	it('garde les noms nus (ressources, composants, altérations)', () => {
		expect(itemImageName({ type: ItemType.RESOURCE, name: 'leek_juice' })).toBe('leek_juice')
		expect(itemImageName({ type: ItemType.COMPONENT, name: 'neural_core_pro' })).toBe('neural_core_pro')
		// Sans le préfixe exact, vitamin_d finissait en « d ».
		expect(itemImageName({ type: ItemType.ALTERATION, name: 'vitamin_d' })).toBe('vitamin_d')
	})
	it('accepte les deux formes du nom d\'un pack de combats', () => {
		// Le catalogue serveur : fight-pack_fight_pack_50.
		expect(itemImageName({ type: ItemType.FIGHT_PACK, name: 'fight-pack_fight_pack_50' })).toBe('fight_pack_50')
		// La forme courte que le marché fabrique pour ses propres tuiles.
		expect(itemImageName({ type: ItemType.FIGHT_PACK, name: 'fight_pack_50' })).toBe('fight_pack_50')
	})
})

describe('itemImageUrl', () => {
	it('pack de combats', () => {
		expect(itemImageUrl({ type: ItemType.FIGHT_PACK, name: 'fight_pack_50' })).toBe('/image/fight-pack/fight_pack_50.png')
		expect(itemImageUrl({ type: ItemType.FIGHT_PACK, name: 'fight-pack_fight_pack_500' })).toBe('/image/fight-pack/fight_pack_500.png')
	})
	it('les puces suivent le dossier du design courant', () => {
		expect(itemImageUrl({ type: ItemType.CHIP, name: 'chip_shock' })).toBe('/image/chipv3/shock.png')
	})
})
