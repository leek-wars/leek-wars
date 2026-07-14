// Génère le stub Python (.pyi) de l'API de combat pour Pyright (validation des IA .py dans l'éditeur).
// Pendant Python de `leekwars-dts.ts` (le .d.ts TS) : MÊME source (game data + CONST_CONTAINERS) pour
// que l'API vue par Pyright reste alignée sur celle du moteur, sans redéfinir les symboles à la main.
//
// Le stub est exposé comme module `leekwars` ; le client injecte `from leekwars import *` en tête du
// document envoyé à Pyright -> les globales runtime (getNearestEnemy, Weapon, Fight...) sont résolues
// SANS import. `me` est VOLONTAIREMENT absent (retiré du global par le refactor objet) : un `me` nu
// produit alors « "me" is not defined », exactement le trou que cette validation comble.
//
// Nullabilité : on N'émet PAS d'`Optional`/`| None` sur l'API objet (getNearestEnemy -> Entity, pas
// Entity | None). Pyright traite None strictement (pas d'équivalent « strictNullChecks off ») ; or le
// .d.ts TS tourne SANS strictNullChecks (les `| null` sont ignorés). Émettre Entity (non-optionnel)
// reproduit ce comportement et évite des faux positifs sur le code joueur (ex `me.moveToward(enemy)`).

import type { LSFunction } from '@/model/function'
import type { Constant } from '@/model/constant'
import { routeConstant, functionParams } from './leekwars-dts'

// Type-id LeekScript -> type Python. Aligné sur TS_TYPE (leekwars-dts.ts) : number/integer/real -> int
// (real -> float), array -> list, map -> dict, function -> Callable, reste -> Any.
export const PY_TYPE: Record<number, string> = {
	0: 'None',
	1: 'int', 6: 'int', 7: 'float', // number / integer / real
	2: 'str',
	3: 'bool',
	4: 'list',
	5: 'Callable[..., Any]',
	8: 'dict', // map
	9: 'list', // set
	10: 'Any', // interval
	41: 'list[int]', 42: 'list[str]', 43: 'list[bool]', 44: 'list[list]', 46: 'list[int]', 47: 'list[int]',
	96: 'list[int]',
	806: 'Any',
}
function pyType(id: number | null | undefined): string {
	if (id === null || id === undefined) return 'Any'
	return PY_TYPE[id] ?? 'Any'
}

// Mots réservés Python : interdits comme nom de def / paramètre / attribut. (Les membres de l'API sont
// des identifiants valides, mais un nom d'argument des game data peut tomber dessus -> positionnel.)
const PY_KEYWORDS = new Set([
	'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
	'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
	'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'match',
	'case',
])
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/
function pySafe(name: string | null | undefined): string | null {
	if (!name || !IDENT.test(name) || PY_KEYWORDS.has(name)) return null
	return name
}

// --- API objet statique (miroir de OBJECT_API_DECLARATIONS), SANS les constantes (injectées ensuite).
// Chaque entrée = corps de classe (lignes SANS indentation) ; `inject` = clé de conteneur de constantes
// (CONST_CONTAINERS.container) à fusionner dans cette classe. Les singletons Fight/Field/Registers/Debug
// sont des classes `_X` + une instance `X: _X`.
interface ClassSpec { name: string, base?: string, body: string[], inject?: string, instance?: string }

const CLASSES: ClassSpec[] = [
	{ name: 'Effect', inject: 'Effect', body: [
		'raw: list', 'type: int', 'value: int', 'caster: Entity', 'turns: int', 'critical: bool',
		'item: int', 'target: Entity', 'modifiers: int',
	] },
	{ name: 'Feature', body: [
		'raw: list', 'type: int', 'minValue: int', 'maxValue: int', 'turns: int', 'targets: int',
		'modifiers: int',
	] },
	{ name: 'Cell', inject: 'Cell', body: [
		'id: int', 'x: int', 'y: int', 'empty: bool', 'obstacle: bool', 'entity: Entity', 'content: int',
		'def distance(self, target: CellLike) -> int: ...',
		'def pathLength(self, target: CellLike) -> int: ...',
		'def lineOfSight(self, target: CellLike) -> bool: ...',
		'def path(self, target: CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
	] },
	{ name: 'Item', inject: 'Item', body: ['id: int'] },
	{ name: 'Weapon', base: 'Item', inject: 'Weapon', body: [
		'cost: int', 'minRange: int', 'maxRange: int', 'minScope: int', 'maxScope: int', 'name: str',
		'area: int', 'launchType: int', 'maxUses: int', 'inline: bool', 'needsLos: bool',
		'features: list[Feature]',
	] },
	{ name: 'Chip', base: 'Item', inject: 'Chip', body: [
		'cost: int', 'cooldown: int', 'currentCooldown: int', 'minRange: int', 'maxRange: int',
		'minScope: int', 'maxScope: int', 'name: str', 'area: int', 'launchType: int', 'maxUses: int',
		'inline: bool', 'needsLos: bool', 'features: list[Feature]',
	] },
	{ name: 'Entity', inject: 'Entity', body: [
		'id: int', 'life: int', 'maxLife: int', 'tp: int', 'maxTP: int', 'mp: int', 'maxMP: int',
		'strength: int', 'agility: int', 'wisdom: int', 'resistance: int', 'science: int', 'magic: int',
		'power: int', 'level: int', 'name: str', 'absoluteShield: int', 'relativeShield: int', 'cell: Cell',
		'weapon: Weapon', 'weapons: list[Weapon]', 'chips: list[Chip]', 'effects: list[Effect]',
		'launchedEffects: list[Effect]', 'passiveEffects: list[Feature]', 'states: list', 'summons: list[Entity]',
		'summoner: Entity', 'summoned: bool', 'alive: bool', 'dead: bool',
		'def isAlly(self) -> bool: ...', 'def isEnemy(self) -> bool: ...',
		'def distance(self, target: CellLike) -> int: ...',
	] },
	{ name: 'Me', base: 'Entity', body: [
		'def moveToward(self, target: CellLike) -> int: ...',
		'def moveAwayFrom(self, target: CellLike) -> int: ...',
		'def useWeapon(self, target: EntityLike) -> int: ...',
		'def useWeaponOnCell(self, cell: CellLike) -> int: ...',
		'def useChip(self, chip: ChipLike, target: EntityLike) -> int: ...',
		'def useChipOnCell(self, chip: ChipLike, cell: CellLike) -> int: ...',
		'def setWeapon(self, weapon: WeaponLike) -> bool: ...',
		'def say(self, message: Any) -> bool: ...',
		'def canUseWeapon(self, target: EntityLike) -> int: ...',
		'def canUseChip(self, chip: ChipLike, target: EntityLike) -> int: ...',
		'def resurrect(self, target: EntityLike, cell: CellLike) -> int: ...',
		'def weaponCell(self, target: EntityLike | CellLike, weapon: WeaponLike = ..., ignoredCells: list = ...) -> Cell: ...',
		'def weaponCells(self, target: EntityLike | CellLike, weapon: WeaponLike = ..., ignoredCells: list = ...) -> list[Cell]: ...',
		'def chipCell(self, chip: ChipLike, target: EntityLike | CellLike, ignoredCells: list = ...) -> Cell: ...',
		'def chipCells(self, chip: ChipLike, target: EntityLike | CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
		'def weaponTargets(self, cell: CellLike, weapon: WeaponLike = ...) -> list[Entity]: ...',
		'def chipTargets(self, chip: ChipLike, cell: CellLike) -> list[Entity]: ...',
	] },
	// Sous-types d'entité (le runtime fait un vrai extends ; instanceof / attributs hérités OK).
	{ name: 'Leek', base: 'Entity', body: ['pass'] },
	{ name: 'Turret', base: 'Entity', body: ['pass'] },
	{ name: 'Bulb', base: 'Entity', inject: 'Bulb', body: ['type: int'] },
	{ name: 'Chest', base: 'Entity', inject: 'Chest', body: ['type: int'] },
	{ name: 'Mob', base: 'Entity', inject: 'Mob', body: ['type: int'] },
	// Conteneur de catégories seul (STATE_*), pas de membres statiques.
	{ name: 'State', inject: 'State', body: [] },
	{ name: '_Registers', instance: 'Registers', body: [
		'def get(self, key: str) -> Any: ...',
		'def set(self, key: str, value: Any) -> Any: ...',
		'def delete(self, key: str) -> Any: ...',
		'def all(self) -> Any: ...',
	] },
	{ name: '_Fight', instance: 'Fight', inject: 'Fight', body: [
		'me: Me', 'turn: int',
		'def getNearestEnemy(self) -> Entity: ...', 'def getNearestAlly(self) -> Entity: ...',
		'def getFarthestEnemy(self) -> Entity: ...', 'def getFarthestAlly(self) -> Entity: ...',
		'def getNearestEnemyTo(self, target: EntityLike) -> Entity: ...',
		'def getNearestAllyTo(self, target: EntityLike) -> Entity: ...',
		'def getEnemies(self) -> list[Entity]: ...', 'def getAllies(self) -> list[Entity]: ...',
		'def getAliveEnemies(self) -> list[Entity]: ...', 'def getAliveAllies(self) -> list[Entity]: ...',
		'def getDeadEnemies(self) -> list[Entity]: ...', 'def getDeadAllies(self) -> list[Entity]: ...',
		'def getEnemiesCount(self) -> int: ...', 'def getAlliesCount(self) -> int: ...',
		'def getAliveEnemiesCount(self) -> int: ...', 'def getAliveAlliesCount(self) -> int: ...',
		'def getAlliedTurret(self) -> Entity: ...', 'def getEnemyTurret(self) -> Entity: ...',
		'def getNearestEnemyToCell(self, cell: CellLike) -> Entity: ...',
		'def getNearestAllyToCell(self, cell: CellLike) -> Entity: ...',
	] },
	{ name: '_Field', instance: 'Field', inject: 'Field', body: [
		'type: int',
		'def cellFromXY(self, x: int, y: int) -> Cell: ...',
		'def getObstacles(self) -> list[Cell]: ...',
		'def distance(self, a: CellLike, b: CellLike) -> int: ...',
		'def cellDistance(self, a: CellLike, b: CellLike) -> int: ...',
		'def pathLength(self, a: CellLike, b: CellLike) -> int: ...',
		'def lineOfSight(self, a: CellLike, b: CellLike) -> bool: ...',
		'def path(self, a: CellLike, b: CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
	] },
	{ name: '_Debug', instance: 'Debug', body: [
		'def mark(self, cells: Any, color: int = ..., duration: int = ...) -> bool: ...',
		'def markText(self, cells: Any, text: Any, color: int = ..., duration: int = ...) -> bool: ...',
		'def clearMarks(self) -> None: ...',
		'def show(self, cell: CellLike, color: int = ...) -> bool: ...',
		'def pause(self) -> None: ...',
	] },
]

type ConstMember = { member: string, isInstance: boolean }
type ConstBucket = { direct: ConstMember[], subs: Record<string, ConstMember[]> }

// Range les constantes en buckets par conteneur, avec les MÊMES règles que le .d.ts (CONST_CONTAINERS).
function bucketConstants(constants: readonly Constant[]): { buckets: Record<string, ConstBucket>, flat: string[] } {
	const buckets: Record<string, ConstBucket> = {}
	const flat: string[] = []
	const seen = new Set<string>()
	const bucketFor = (c: string): ConstBucket => (buckets[c] ||= { direct: [], subs: {} })
	for (const c of constants) {
		const name = pySafe(c.name)
		if (!name || seen.has(name)) continue
		seen.add(name)
		const routed = routeConstant(name) // routage partagé avec le d.ts (leekwars-dts.ts)
		if (routed) {
			if (!pySafe(routed.member)) continue // membre non représentable en Python : on saute
			const entry: ConstMember = { member: routed.member, isInstance: routed.isInstance }
			const b = bucketFor(routed.container)
			if (routed.sub) (b.subs[routed.sub] ||= []).push(entry)
			else b.direct.push(entry)
		} else {
			flat.push(`${name}: ${pyType(c.type)}`)
		}
	}
	return { buckets, flat }
}

// Lignes de corps de classe pour les constantes d'un conteneur : membres directs (instance -> type =
// conteneur ; catégorie -> int) + sous-conteneurs en classes imbriquées (catégories -> int).
function constBodyLines(container: string, bucket: ConstBucket | undefined): string[] {
	if (!bucket) return []
	const lines: string[] = []
	const seen = new Set<string>()
	for (const m of bucket.direct) {
		if (seen.has(m.member)) continue
		seen.add(m.member)
		lines.push(`${m.member}: ${m.isInstance ? container : 'int'}`)
	}
	for (const sub of Object.keys(bucket.subs)) {
		lines.push(`class ${sub}:`)
		const seenS = new Set<string>()
		const subLines: string[] = []
		for (const m of bucket.subs[sub]) {
			if (seenS.has(m.member)) continue
			seenS.add(m.member)
			subLines.push(`    ${m.member}: int`)
		}
		lines.push(...(subLines.length ? subLines : ['    pass']))
	}
	return lines
}

/**
 * Construit le stub `.pyi` complet de l'API de combat (module `leekwars`) depuis les game data.
 * MÊME entrée que buildLeekwarsDeclarations (leekwars-dts.ts). N'expose PAS `me` (cf en-tête).
 */
export function buildLeekwarsPyi(functions: readonly LSFunction[], constants: readonly Constant[]): string {
	const { buckets, flat } = bucketConstants(constants)
	const out: string[] = [
		'# Auto-généré depuis les game data Leek Wars (API de combat). Ne pas éditer à la main.',
		'from typing import Any, Callable',
		'',
		'CellLike = Cell | Entity | int',
		'EntityLike = Entity | int',
		'WeaponLike = Weapon | int',
		'ChipLike = Chip | int',
		'',
	]
	const exported: string[] = ['Cell', 'Entity', 'Weapon', 'Chip', 'Item', 'Effect', 'Feature', 'Me',
		'Leek', 'Turret', 'Bulb', 'Chest', 'Mob', 'State', 'CellLike', 'EntityLike', 'WeaponLike', 'ChipLike']

	for (const spec of CLASSES) {
		const header = spec.base ? `class ${spec.name}(${spec.base}):` : `class ${spec.name}:`
		out.push(header)
		const body = [...spec.body.filter((l) => l !== 'pass')]
		if (spec.inject) body.push(...constBodyLines(spec.inject, buckets[spec.inject]))
		const bodyLines = body.length ? body : ['pass']
		for (const l of bodyLines) out.push('    ' + l.split('\n').join('\n    '))
		out.push('')
		if (spec.instance) {
			out.push(`${spec.instance}: ${spec.name}`)
			out.push('')
			exported.push(spec.instance)
		}
	}

	// Fonctions plates (getNearestEnemy, useWeapon, WEAPON stats...) : globales runtime, résolues via
	// `from leekwars import *`. Toutes émises (y compris les dépréciées : conservées au runtime).
	const seenFn = new Set<string>()
	for (const f of functions) {
		const name = pySafe(f.name)
		if (!name || seenFn.has(name)) continue
		seenFn.add(name)
		// Paramètres via l'assainisseur commun (leekwars-dts.ts), avec le garde-mots-clés Python.
		const params = functionParams(f, pySafe).map((p) => `${p.name}: ${pyType(p.typeId)}${p.optional ? ' = ...' : ''}`)
		out.push(`def ${name}(${params.join(', ')}) -> ${pyType(f.return_type)}: ...`)
		exported.push(name)
	}
	out.push('')

	// Constantes plates (hors conteneur) : globales module.
	for (const line of flat) {
		out.push(line)
		exported.push(line.split(':')[0].trim())
	}
	out.push('')

	// `__all__` explicite : `import *` n'apporte QUE ces noms -> `me` (absent) reste indéfini, et on
	// n'importe pas Any/Callable (bruit).
	out.push('__all__ = [' + exported.map((n) => `'${n}'`).join(', ') + ']')
	return out.join('\n') + '\n'
}
