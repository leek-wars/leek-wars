import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import { writeFileSync, mkdtempSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import ts from 'typescript'
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

// Compile un .d.ts avec le VRAI compilateur TypeScript, dans la configuration de l'éditeur
// (cf monaco.configurePolyglotTypeScript : lib esnext seule, pas de DOM, pas de @types, non strict).
// Renvoie les diagnostics formatés. Les assertions `toContain` du reste du fichier passent sur un
// fichier qui ne compile pas : c'est ce test qui garantit qu'il tient debout.
function compileDts(dts: string): string[] {
	const dir = mkdtempSync(join(tmpdir(), 'lw-dts-'))
	const file = join(dir, 'leekwars.d.ts')
	writeFileSync(file, dts)
	const program = ts.createProgram([file], {
		noEmit: true, target: ts.ScriptTarget.ESNext, lib: ['lib.esnext.d.ts'],
		allowJs: true, checkJs: true, types: [], typeRoots: [],
	})
	return ts.getPreEmitDiagnostics(program)
		.map((d) => `${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`)
}

describe('le .d.ts généré compile', () => {
	it('avec des game data complètes', () => {
		expect(compileDts(buildLeekwarsDeclarations(FUNCTIONS, CONSTANTS))).toEqual([])
	})

	// Le bloc écrit à la main référence des familles (Effect.Type, Fight.Use, Entity.Stat...) qui sont
	// émises par le générateur. Si elles dépendaient des constantes CHARGÉES, un d.ts bâti avant leur
	// arrivée référencerait des namespaces inexistants -> API entière en `any`, et monaco ne s'en
	// relève pas (son rattrapage ne surveille que LeekWars.functions). D'où l'émission depuis la config.
	it('même sans aucune game data', () => {
		expect(compileDts(buildLeekwarsDeclarations([], []))).toEqual([])
	})
})

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
		expect(dts).toContain('const DAMAGE: Effect.Type;') // membre de catégorie, typé par sa famille
		expect(dts).toContain('const OPERATIONS_LIMIT: number;') // fusionné dans namespace System
		expect(dts).toContain('const RED: Color.Value;') // fusionné dans namespace Color
		expect(dts).toMatch(/declare namespace Message \{[\s\S]*namespace Type \{[\s\S]*HEAL/) // Message.Type.HEAL
		// alias de famille émis à côté du namespace de valeurs (Entity.Stat en type ET en valeurs)
		expect(dts).toContain('type Type = number;')
		expect(dts).toMatch(/declare namespace Entity \{[\s\S]*type Stat = number;[\s\S]*namespace Stat \{/)
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

// Anti-régression du bug #4540 : le moteur Pyright navigateur (@typefox/pyright-browser, GELÉ en 1.1.299)
// et le typeshed bundlé (harvesté du paquet `pyright`, cf pyrightTypeshedPlugin dans vite.config.ts) DOIVENT
// rester co-versionnés. Un typeshed trop récent définit `Any` en `class Any: ...` (au lieu de `Any = object()`)
// que le vieux moteur ne spécial-case pas -> il traite `Any` comme une classe nominale, et TOUT paramètre
// typé `Any` (Debug.mark, markText, Message.params...) rejette les arguments concrets. On fige donc `pyright`
// en 1.1.299 (package.json) ; ce test échoue si un bump le désaligne. On fait tourner le VRAI Pyright bundlé
// (node_modules/pyright = même version/typeshed que le worker) sur le code exact du rapport #4540.
describe('Pyright bundlé accepte l\'API `Any` (anti-régression #4540)', () => {
	const clientRoot = process.cwd()
	const pyrightBin = join(clientRoot, 'node_modules', '.bin', 'pyright')
	const typeshedPath = join(clientRoot, 'node_modules', 'pyright', 'dist', 'typeshed-fallback')
	const hasBundledPyright = existsSync(pyrightBin) && existsSync(typeshedPath)

	it.runIf(hasBundledPyright)('Debug.mark(Cell) / mark(list) / markText ne sont PAS signalés incompatibles', () => {
		const dir = mkdtempSync(join(tmpdir(), 'lwpy4540-'))
		// Stub `leekwars` résolu comme module local (comme le worker le seede sous /leekwars.pyi).
		writeFileSync(join(dir, 'leekwars.pyi'), buildLeekwarsPyi([cst('COLOR_BLUE'), cst('COLOR_RED')]))
		// Code du rapport #4540 (+ variantes liste / markText), avec l'import injecté par pyright-inject.
		writeFileSync(join(dir, 'ia.py'), [
			'from leekwars import *',
			'sud = Field.cellFromXY(17, 0)',
			'Debug.mark(sud, Color.BLUE, 1)',
			'Debug.mark([sud, sud], Color.BLUE, 1)',
			'Debug.markText(sud, "hp", Color.RED)',
		].join('\n'))
		writeFileSync(join(dir, 'pyrightconfig.json'), JSON.stringify({
			typeCheckingMode: 'basic', reportMissingImports: 'none', typeshedPath,
		}))
		// pyright renvoie un code de sortie non nul dès qu'il y a des erreurs -> on capture stdout quoi qu'il arrive.
		let out = ''
		try {
			out = execFileSync(pyrightBin, ['--outputjson', 'ia.py'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' })
		} catch (e) {
			out = (e as { stdout?: string }).stdout ?? ''
		}
		const report = JSON.parse(out) as { generalDiagnostics: Array<{ severity: string, message: string }> }
		const errors = report.generalDiagnostics.filter((d) => d.severity === 'error')
		expect(errors, `Pyright signale des erreurs (typeshed désaligné du moteur ?) :\n${errors.map((d) => d.message).join('\n')}`).toEqual([])
	})
})
