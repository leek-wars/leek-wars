import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import { writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { buildLeekwarsPyi, PY_TYPE } from './leekwars-pyi'
import { TS_TYPE, buildObjectApiModel, buildLeekwarsDeclarations } from './leekwars-dts'
import type { LSFunction } from '@/model/function'
import type { Constant } from '@/model/constant'

const fn = (name: string, args: [string, number][] = [], ret = 6, optional: boolean[] = []): LSFunction =>
	({ name, arguments_names: args.map((a) => a[0]), arguments_types: args.map((a) => String(a[1])), return_type: ret, optional } as unknown as LSFunction)
const cst = (name: string, type = 6): Constant => ({ name, type } as unknown as Constant)

const FUNCTIONS = [
	fn('getNearestEnemy'),
	fn('moveToward', [['cell', 6]]),
	fn('getPath', [['from', 6], ['to', 6], ['ignored', 4]], 4, [false, false, true]), // arg python keyword 'from'
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
	cst('PI', 7), // non-container flat constant
]

describe('buildLeekwarsPyi', () => {
	const stub = buildLeekwarsPyi(FUNCTIONS, CONSTANTS)

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
		expect(stub).toContain('PI: float') // constante plate hors conteneur
	})

	it('emits flat functions, sanitizing python-keyword arg names', () => {
		expect(stub).toContain('def getNearestEnemy() -> int: ...')
		expect(stub).toContain('def moveToward(')
		expect(stub).toContain('def getPath(a0: int, to: int, ignored: list = ...)') // 'from' -> a0
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
// en partie à la main). Si l'un gagne un type-id ou un membre d'API objet que l'autre n'a pas, ces
// tests échouent -> divergence rendue bruyante au lieu de faux positifs Pyright silencieux.
describe('parité stub Python <-> API TS (anti-dérive)', () => {
	it('PY_TYPE couvre tous les type-ids mappés par TS_TYPE', () => {
		for (const id of Object.keys(TS_TYPE)) {
			expect(PY_TYPE, `type-id ${id} présent dans TS_TYPE mais absent de PY_TYPE`).toHaveProperty(id)
		}
	})

	// Le d.ts TS et le stub Python partagent routeConstant()/functionParams() : on caractérise la sortie
	// du d.ts pour garantir que l'extraction de ces helpers reste iso-comportement.
	it('d.ts: routage des constantes et paramètres inchangés', () => {
		const dts = buildLeekwarsDeclarations(FUNCTIONS, CONSTANTS)
		expect(dts).toContain('declare function getNearestEnemy(): number;')
		// 'from' est un identifiant JS valide -> conservé (contrairement au Python) ; 3e arg optionnel -> `?`.
		expect(dts).toContain('declare function getPath(from: number, to: number, ignored?: any[]): any[];')
		expect(dts).toContain('const pistol: Weapon;') // membre de namespace (item)
		expect(dts).toContain('const DAMAGE: number;') // membre de catégorie
		expect(dts).toContain('declare const PI: number;') // constante plate hors conteneur
	})

	it('tout membre de l\'API objet déclaré côté TS existe dans le stub Python', () => {
		const emptyStub = buildLeekwarsPyi([], []) // bloc objet statique seul (indépendant des game data)
		const model = buildObjectApiModel() // parse OBJECT_API_DECLARATIONS (source du .d.ts)
		for (const container of Object.keys(model.members)) {
			for (const m of model.members[container]) {
				expect(new RegExp(`\\b${m.name}\\b`).test(emptyStub), `${container}.${m.name} (API TS) manquant dans le stub Python (CLASSES)`).toBe(true)
			}
		}
	})
})
