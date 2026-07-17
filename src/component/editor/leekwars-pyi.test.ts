import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import { writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { buildLeekwarsPyi } from './leekwars-pyi'
import { buildObjectApiModel, buildLeekwarsDeclarations } from './leekwars-dts'
import type { LSFunction } from '@/model/function'
import type { Constant } from '@/model/constant'

const fn = (name: string, args: [string, number][] = [], ret = 6, optional: boolean[] = []): LSFunction =>
	({ name, arguments_names: args.map((a) => a[0]), arguments_types: args.map((a) => String(a[1])), return_type: ret, optional } as unknown as LSFunction)
const cst = (name: string, type = 6): Constant => ({ name, type } as unknown as Constant)

const FUNCTIONS = [
	fn('getNearestEnemy'),
	fn('moveToward', [['cell', 6]]),
	fn('getPath', [['from', 6], ['to', 6], ['ignored', 4]], 4, [false, false, true]),
	fn('setWeapon', [['weapon', 6]], 3),
]
const CONSTANTS = [
	cst('WEAPON_PISTOL'), cst('WEAPON_MACHINE_GUN'),
	cst('CHIP_BANDAGE'),
	cst('EFFECT_DAMAGE'),
	cst('STAT_STRENGTH'),
	cst('ENTITY_LEEK'),
	cst('FIGHT_TYPE_SOLO'),
	cst('STATE_UNHEALABLE'),
	cst('MAP_NEXUS'),
	cst('MESSAGE_HEAL'),
	cst('COLOR_RED'),
	cst('OPERATIONS_LIMIT'),
	cst('PI', 7), // constante sans famille : NON exposée (API 100% objet)
]

describe('buildLeekwarsPyi', () => {
	const stub = buildLeekwarsPyi(CONSTANTS)

	it('exposes the object API but NOT a global `me`', () => {
		expect(stub).toContain('class Me(Entity):')
		expect(stub).toContain('me: Me') // Fight.me exists
		// aucun `me` global (def/affectation/annotation en tête de ligne)
		expect(stub).not.toMatch(/^me\b/m)
		expect(stub).not.toContain("'me'") // pas dans __all__
	})

	it('places constants under their containers', () => {
		expect(stub).toContain('pistol: Weapon')
		expect(stub).toContain('machineGun: Weapon')
		expect(stub).toContain('DAMAGE: int')
		expect(stub).toMatch(/class Stat:[\s\S]*STRENGTH: int/)
		expect(stub).toMatch(/class Type:[\s\S]*SOLO: int/) // Fight.Type.SOLO
		expect(stub).toMatch(/class Type:[\s\S]*HEAL: int/) // Message.Type.HEAL
		expect(stub).toContain('RED: int') // Color.RED
		expect(stub).toContain('OPERATIONS_LIMIT: int') // System.OPERATIONS_LIMIT
	})

	it('is 100% object: no flat functions nor flat constants', () => {
		// aucune def top-level (toutes les def du stub sont indentées dans une classe)
		expect(stub).not.toMatch(/^def /m)
		expect(stub).not.toMatch(/^\s*PI: /m)
		expect(stub).not.toContain('getNearestEnemy() -> int') // la forme plate n'existe plus
		expect(stub).toContain('def getNearestEnemy(self) -> Entity: ...') // la forme objet oui
	})

	it('exposes the new singletons (System, Network, Color) and Message', () => {
		expect(stub).toContain('System: _System')
		expect(stub).toContain('Network: _Network')
		expect(stub).toContain('Color: _Color')
		expect(stub).toContain('class Message:')
		expect(stub).toContain('operations: int')
	})

	const hasPython = (() => {
		try { execFileSync('python3', ['--version'], { stdio: 'pipe' }); return true } catch { return false }
	})()
	it.runIf(hasPython)('is valid Python (py_compile)', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lwpyi-'))
		const file = join(dir, 'leekwars.pyi')
		writeFileSync(file, stub)
		// lève si la syntaxe est invalide
		expect(() => execFileSync('python3', ['-m', 'py_compile', file], { stdio: 'pipe' })).not.toThrow()
	})
})

// Gardes anti-dérive entre les deux générateurs (le .d.ts TS et le .pyi Python décrivent la MÊME API,
// en partie à la main). Si l'un gagne un membre d'API objet que l'autre n'a pas, ces tests échouent
// -> divergence rendue bruyante au lieu de faux positifs Pyright silencieux.
describe('parité stub Python <-> API TS (anti-dérive)', () => {
	it('d.ts : 100% objet, routage des constantes inchangé', () => {
		const dts = buildLeekwarsDeclarations(FUNCTIONS, CONSTANTS)
		// plus AUCUNE déclaration plate (ni fonction, ni constante)
		expect(dts).not.toContain('declare function')
		expect(dts).not.toContain('declare const PI')
		// routage objet des constantes
		expect(dts).toContain('const pistol: Weapon;') // membre de namespace (item)
		expect(dts).toContain('const DAMAGE: number;') // membre de catégorie
		expect(dts).toContain('readonly OPERATIONS_LIMIT: number;') // inline dans System
		expect(dts).toContain('readonly RED: number;') // inline dans Color
		expect(dts).toMatch(/declare namespace Message \{[\s\S]*namespace Type \{[\s\S]*HEAL/) // Message.Type.HEAL
	})

	it('tout membre de l\'API objet déclaré côté TS existe dans le stub Python', () => {
		const emptyStub = buildLeekwarsPyi([]) // bloc objet statique seul (indépendant des game data)
		const model = buildObjectApiModel() // parse OBJECT_API_DECLARATIONS (source du .d.ts)
		for (const container of Object.keys(model.members)) {
			for (const m of model.members[container]) {
				expect(new RegExp(`\\b${m.name}\\b`).test(emptyStub), `${container}.${m.name} (API TS) manquant dans le stub Python (CLASSES)`).toBe(true)
			}
		}
		for (const container of Object.keys(model.statics)) {
			for (const m of model.statics[container]) {
				expect(new RegExp(`\\b${m.name}\\b`).test(emptyStub), `${container}.${m.name} (static TS) manquant dans le stub Python (CLASSES)`).toBe(true)
			}
		}
	})
})
