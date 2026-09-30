import { describe, it, expect } from 'vitest'
import { Loadout, LoadoutExportItems, componentStatsKey, exportLoadout, loadoutComponentStat, parseLoadouts, sameComponentChoice, serializeLoadouts, uniqueLoadoutName } from '@/model/loadout'

// Un mini-catalogue d'items : nom + type, c'est tout ce que l'échange manipule.
const ITEMS: LoadoutExportItems = {
	47: { name: 'weapon_m_laser', type: 1 },
	48: { name: 'weapon_gazor', type: 1 },
	107: { name: 'weapon_katana', type: 1 },
	159: { name: 'chip_mutation', type: 2 },
	6: { name: 'chip_flash', type: 2 },
	292: { name: 'core3', type: 8 },
	303: { name: 'sdcard', type: 8 },
	49: { name: 'potion_restat', type: 3 },
	// Collision réelle du catalogue : `rock` est une ressource ET une puce.
	7: { name: 'chip_rock', type: 2 },
	191: { name: 'rock', type: 7 },
}

function loadout(overrides: Partial<Loadout> = {}): Loadout {
	return Object.assign(new Loadout(), {
		id: 1, name: 'Build', icon: '🔥', order: 0,
		weapons: [47, 48], forgotten_weapons: [], chips: [159, 6],
		components: [{ index: 0, template: 292, stats: { strength: 12 } }],
		stats: { strength: 5000, ram: 200 },
	}, overrides)
}

describe('composants d\'ensemble avec stats mémorisées', () => {
	it('la clé des stats ignore l\'ordre et les zéros, et vaut vide pour une pièce de base', () => {
		expect(componentStatsKey(null)).toBe('')
		expect(componentStatsKey({})).toBe('')
		expect(componentStatsKey({ life: 0 })).toBe('')
		expect(componentStatsKey({ tp: 1, life: 10 })).toBe(componentStatsKey({ life: 10, tp: 1 }))
		expect(componentStatsKey({ tp: 1 })).not.toBe(componentStatsKey({ tp: 2 }))
	})

	it('deux choix sont la même pièce si template et stats coïncident', () => {
		expect(sameComponentChoice({ template: 299 }, { template: 299, stats: null })).toBe(true)
		expect(sameComponentChoice({ template: 299, stats: { tp: 1 } }, { template: 299, stats: { tp: 1 } })).toBe(true)
		expect(sameComponentChoice({ template: 299, stats: { tp: 1 } }, { template: 299 })).toBe(false)
		expect(sameComponentChoice({ template: 299 }, { template: 300 })).toBe(false)
	})

	it('l\'apport d\'un composant additionne la base du template et le delta', () => {
		const base: [string, number][] = [['life', 100], ['tp', 1]]
		expect(loadoutComponentStat(base, null, 'life')).toBe(100)
		expect(loadoutComponentStat(base, { life: 50, mp: 1 }, 'life')).toBe(150)
		expect(loadoutComponentStat(base, { life: 50, mp: 1 }, 'mp')).toBe(1)
		expect(loadoutComponentStat(base, { life: -20 }, 'life')).toBe(80)
		expect(loadoutComponentStat(undefined, { tp: 1 }, 'tp')).toBe(1)
	})
})

describe('export d\'un ensemble', () => {
	it('écrit des noms d\'items, pas des ids', () => {
		const out = exportLoadout(loadout(), ITEMS)
		expect(out.weapons).toEqual(['weapon_m_laser', 'weapon_gazor'])
		expect(out.chips).toEqual(['chip_mutation', 'chip_flash'])
		expect(out.components).toEqual([{ slot: 0, item: 'core3', stats: { strength: 12 } }])
		expect(out.stats).toEqual({ strength: 5000, ram: 200 })
		expect(out.icon).toBe('🔥')
	})
	it('omet les listes vides et les items inconnus du client', () => {
		const out = exportLoadout(loadout({ icon: '', weapons: [47, 9999], components: [] }), ITEMS)
		expect(out.weapons).toEqual(['weapon_m_laser'])
		expect(out.components).toBeUndefined()
		expect(out.forgotten_weapons).toBeUndefined()
		expect(out.icon).toBeUndefined()
	})
	it('plusieurs ensembles → une enveloppe loadouts', () => {
		const text = serializeLoadouts([loadout(), loadout({ id: 2, name: 'Autre' })], ITEMS)
		const data = JSON.parse(text)
		expect(data.type).toBe('leek-wars-loadouts')
		expect(data.loadouts.map((l: { name: string }) => l.name)).toEqual(['Build', 'Autre'])
	})
})

describe('import d\'un ensemble', () => {
	it('relit ce qu\'il a écrit', () => {
		const source = loadout({ forgotten_weapons: [107] })
		const result = parseLoadouts(serializeLoadouts([source], ITEMS), ITEMS)!
		expect(result.ignored).toEqual([])
		expect(result.loadouts).toHaveLength(1)
		const parsed = result.loadouts[0]
		expect(parsed.name).toBe('Build')
		expect(parsed.icon).toBe('🔥')
		// Armes fixes puis oubliées, l'appelant re-sépare
		expect(parsed.weapons).toEqual([47, 48, 107])
		expect(parsed.chips).toEqual([159, 6])
		expect(parsed.components).toEqual([{ index: 0, template: 292, stats: { strength: 12 } }])
		expect(parsed.stats).toEqual({ strength: 5000, ram: 200 })
	})
	it('relit une enveloppe de plusieurs ensembles', () => {
		const text = serializeLoadouts([loadout(), loadout({ id: 2, name: 'Autre' })], ITEMS)
		const result = parseLoadouts(text, ITEMS)!
		expect(result.loadouts.map(l => l.name)).toEqual(['Build', 'Autre'])
	})
	it('accepte un tableau nu, un id numérique et un nom sans préfixe', () => {
		const result = parseLoadouts('[{"name":"X","weapons":["m_laser",48],"chips":["flash"],"stats":{}}]', ITEMS)!
		expect(result.loadouts[0].weapons).toEqual([47, 48])
		expect(result.loadouts[0].chips).toEqual([6])
	})
	it('la forme courte d\'un nom porté par deux types désigne le bon', () => {
		// `rock` seul est une ressource : c'est `chip_rock` qu'il faut servir en puce.
		const result = parseLoadouts('{"name":"X","chips":["rock"],"weapons":[]}', ITEMS)!
		expect(result.loadouts[0].chips).toEqual([7])
		expect(result.ignored).toEqual([])
	})
	it('ignore un item inconnu ou du mauvais type', () => {
		const result = parseLoadouts('{"name":"X","weapons":["chip_flash","weapon_zzz","weapon_katana"],"chips":[]}', ITEMS)!
		expect(result.loadouts[0].weapons).toEqual([107])
		expect(result.ignored).toEqual(['chip_flash', 'weapon_zzz'])
	})
	it('dédoublonne les armes et les puces', () => {
		const result = parseLoadouts('{"name":"X","weapons":["weapon_katana","weapon_katana"],"chips":["chip_flash","chip_flash"]}', ITEMS)!
		expect(result.loadouts[0].weapons).toEqual([107])
		expect(result.loadouts[0].chips).toEqual([6])
	})
	it('refuse deux fois le même composant et recase un emplacement occupé', () => {
		const text = '{"name":"X","components":[{"slot":0,"item":"core3"},{"slot":0,"item":"sdcard"},{"slot":1,"item":"core3"}]}'
		const result = parseLoadouts(text, ITEMS)!
		expect(result.loadouts[0].components).toEqual([
			{ index: 0, template: 292, stats: null },
			{ index: 1, template: 303, stats: null },
		])
	})
	it('ne garde que des caractéristiques connues et des valeurs positives', () => {
		const result = parseLoadouts('{"name":"X","stats":{"strength":100,"agility":-5,"toto":42,"ram":"300"}}', ITEMS)!
		expect(result.loadouts[0].stats).toEqual({ strength: 100, ram: 300 })
	})
	it('tronque un nom trop long', () => {
		const result = parseLoadouts(JSON.stringify({ name: 'x'.repeat(100), stats: {} }), ITEMS)!
		expect(result.loadouts[0].name).toHaveLength(60)
	})
	it('rend null sur du texte qui n\'est pas un ensemble', () => {
		expect(parseLoadouts('pas du json', ITEMS)).toBeNull()
		expect(parseLoadouts('{"hello":"world"}', ITEMS)).toBeNull()
		expect(parseLoadouts('[]', ITEMS)).toBeNull()
		expect(parseLoadouts('42', ITEMS)).toBeNull()
	})
})

describe('nom unique', () => {
	it('suffixe tant que le nom est pris', () => {
		expect(uniqueLoadoutName('Build', ['Autre'], 'Importé')).toBe('Build')
		expect(uniqueLoadoutName('Build', ['Build'], 'Importé')).toBe('Build (2)')
		expect(uniqueLoadoutName('Build', ['Build', 'Build (2)'], 'Importé')).toBe('Build (3)')
	})
	it('remplace un nom vide par le nom de repli', () => {
		expect(uniqueLoadoutName('   ', [], 'Importé')).toBe('Importé')
	})
	it('garde le suffixe dans la longueur maximale', () => {
		const long = 'x'.repeat(60)
		expect(uniqueLoadoutName(long, [long], 'Importé')).toHaveLength(60)
	})
})
