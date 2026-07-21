// Génère le stub Python (.pyi) de l'API de combat pour Pyright (validation des IA .py dans l'éditeur).
// Pendant Python de `leekwars-dts.ts` (le .d.ts TS) : MÊME source (CONST_CONTAINERS + API objet) pour
// que l'API vue par Pyright reste alignée sur celle du moteur, sans redéfinir les symboles à la main.
//
// Le stub est exposé comme module `leekwars` ; le client injecte `from leekwars import *` en tête du
// document envoyé à Pyright -> les noms runtime (Fight, Weapon, System...) sont résolus SANS import.
// L'API est 100% OBJET : AUCUNE fonction ni constante plate n'est émise (le runtime ne les expose
// plus) ; un appel plat (getLife()) produit « "getLife" is not defined », comme au combat.
//
// Nullabilité : on N'émet PAS d'`Optional`/`| None` sur l'API objet (getNearestEnemy -> Entity, pas
// Entity | None). Pyright traite None strictement (pas d'équivalent « strictNullChecks off ») ; or le
// .d.ts TS tourne SANS strictNullChecks (les `| null` sont ignorés). Émettre Entity (non-optionnel)
// reproduit ce comportement et évite des faux positifs sur le code joueur (ex `me.moveToward(enemy)`).

import type { Constant } from '@/model/constant'
import { routeConstant } from './leekwars-dts'

// Mots réservés Python : interdits comme nom de def / paramètre / attribut. (Les membres de l'API sont
// des identifiants valides, mais un nom des game data peut tomber dessus -> on saute.)
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
// (CONST_CONTAINERS.container) à fusionner dans cette classe. Les singletons Fight/Field/System... sont
// des classes `_X` + une instance `X: _X`. DOIT rester en phase avec objects.py (generator).
interface ClassSpec { name: string, base?: string, body: string[], inject?: string, instance?: string }

const CLASSES: ClassSpec[] = [
	{ name: 'Effect', inject: 'Effect', body: [
		'raw: list', 'type: int', 'value: int', 'caster: Entity', 'turns: int', 'critical: bool',
		// item : l'ARME ou la PUCE qui a appliqué l'effet (miroir du runtime), l'id brut restant dans raw[5].
		'item: Weapon | Chip', 'target: Entity', 'modifiers: int',
		'@staticmethod', 'def getAll() -> list[int]: ...',
	] },
	{ name: 'Feature', body: [
		'raw: list', 'type: int', 'minValue: int', 'maxValue: int', 'turns: int', 'targets: int',
		'modifiers: int',
	] },
	{ name: 'Message', inject: 'Message', body: [
		'raw: list', 'author: Entity', 'type: int', 'params: Any',
	] },
	{ name: 'Cell', inject: 'Cell', body: [
		'id: int', 'x: int', 'y: int', 'empty: bool', 'obstacle: bool', 'entity: Entity',
		'hasEntity: bool', 'content: int',
		'def distance(self, target: CellLike) -> int: ...',
		'def pathLength(self, target: CellLike, ignoredCells: list = ...) -> int: ...',
		'def lineOfSight(self, target: CellLike, ignoredEntities: Any = ...) -> bool: ...',
		'def path(self, target: CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
		'def onSameLine(self, target: CellLike) -> bool: ...',
		'@staticmethod', 'def get(id: int) -> Cell: ...',
	] },
	// Base commune aux armes et puces : porte tout ce qu'une arme ET une puce savent faire, pour que le
	// code générique sur un équipement quelconque (`def best(item: Item): return item.cost`) type juste.
	// Weapon et Chip redéclarent ces membres, chacun gardant sa propre documentation. Miroir du .d.ts.
	{ name: 'Item', inject: 'Item', body: [
		'id: int', 'cost: int', 'minRange: int', 'maxRange: int', 'name: str',
		'area: int', 'launchType: int', 'maxUses: int', 'inline: bool', 'needsLos: bool',
		'failure: int', 'features: list[Feature]',
		'def effectiveArea(self, cell: CellLike, frm: CellLike = ...) -> list[Cell]: ...',
		'@staticmethod', 'def get(id: int) -> Weapon | Chip: ...',
	] },
	{ name: 'Weapon', base: 'Item', inject: 'Weapon', body: [
		'cost: int', 'minRange: int', 'maxRange: int', 'name: str',
		'area: int', 'launchType: int', 'maxUses: int', 'inline: bool', 'needsLos: bool',
		'failure: int', 'features: list[Feature]', 'passiveFeatures: list[Feature]',
		'def effectiveArea(self, cell: CellLike, frm: CellLike = ...) -> list[Cell]: ...',
		'@staticmethod', 'def get(id: int) -> Weapon: ...',
		'@staticmethod', 'def getAll() -> list[Weapon]: ...',
		'@staticmethod', 'def isWeapon(value: Any) -> bool: ...',
	] },
	{ name: 'Chip', base: 'Item', inject: 'Chip', body: [
		'cost: int', 'cooldown: int', 'currentCooldown: int', 'minRange: int', 'maxRange: int',
		'minScope: int', 'maxScope: int', 'name: str', 'area: int', 'launchType: int', 'maxUses: int',
		'inline: bool', 'needsLos: bool', 'failure: int', 'features: list[Feature]',
		'bulbChips: list[Chip]', 'bulbCharacteristics: dict', 'bulbStats: dict',
		'def currentCooldownOf(self, entity: EntityLike) -> int: ...',
		'def effectiveArea(self, cell: CellLike, frm: CellLike = ...) -> list[Cell]: ...',
		'@staticmethod', 'def get(id: int) -> Chip: ...',
		'@staticmethod', 'def getAll() -> list[Chip]: ...',
		'@staticmethod', 'def isChip(value: Any) -> bool: ...',
	] },
	{ name: 'Entity', inject: 'Entity', body: [
		'id: int', 'life: int', 'maxLife: int', 'tp: int', 'maxTP: int', 'mp: int', 'maxMP: int',
		'strength: int', 'agility: int', 'wisdom: int', 'resistance: int', 'science: int', 'magic: int',
		'power: int', 'level: int', 'name: str', 'absoluteShield: int', 'relativeShield: int',
		'damageReturn: int', 'frequency: int', 'cores: int', 'ram: int', 'cell: Cell',
		'weapon: Weapon', 'weapons: list[Weapon]', 'chips: list[Chip]', 'effects: list[Effect]',
		'launchedEffects: list[Effect]', 'passiveEffects: list[Feature]', 'states: list', 'summons: list[Entity]',
		'summoner: Entity', 'summoned: bool', 'alive: bool', 'dead: bool', 'isStatic: bool',
		'birthTurn: int', 'turnOrder: int', 'side: int', 'leekID: int', 'teamID: int', 'teamName: str',
		'compositionName: str', 'farmerID: int', 'farmerName: str', 'farmerCountry: str',
		'aiID: int', 'aiName: str',
		'def isAlly(self) -> bool: ...', 'def isEnemy(self) -> bool: ...',
		'def stat(self, stat: int) -> int: ...',
		'@staticmethod', 'def get(id: int) -> Entity: ...',
		'def distance(self, target: CellLike) -> int: ...',
	] },
	{ name: 'Me', base: 'Entity', body: [
		'def moveToward(self, target: CellLike, mp: int = ...) -> int: ...',
		'def moveAwayFrom(self, target: CellLike, mp: int = ...) -> int: ...',
		'def moveTowardCells(self, cells: list, mp: int = ...) -> int: ...',
		'def moveTowardEntities(self, entities: list, mp: int = ...) -> int: ...',
		'def moveTowardLine(self, a: CellLike, b: CellLike, mp: int = ...) -> int: ...',
		'def moveAwayFromCells(self, cells: list, mp: int = ...) -> int: ...',
		'def moveAwayFromEntities(self, entities: list, mp: int = ...) -> int: ...',
		'def moveAwayFromLine(self, a: CellLike, b: CellLike, mp: int = ...) -> int: ...',
		'def useWeapon(self, target: EntityLike) -> int: ...',
		'def useWeaponOnCell(self, cell: CellLike) -> int: ...',
		'def useChip(self, chip: ChipLike, target: EntityLike = ...) -> int: ...',
		'def useChipOnCell(self, chip: ChipLike, cell: CellLike) -> int: ...',
		'def setWeapon(self, weapon: WeaponLike) -> bool: ...',
		'def say(self, message: Any) -> bool: ...',
		'def lama(self) -> None: ...',
		// Prédicats -> bool (moteur : Type.BOOL), à ne pas confondre avec les actions useWeapon/useChip
		// qui renvoient un code USE_*. Miroir du .d.ts.
		'def canUseWeapon(self, target: WeaponLike | EntityLike, target2: EntityLike = ...) -> bool: ...',
		'def canUseWeaponOnCell(self, cell: WeaponLike | CellLike, cell2: CellLike = ...) -> bool: ...',
		'def canUseChip(self, chip: ChipLike, target: EntityLike) -> bool: ...',
		'def canUseChipOnCell(self, chip: ChipLike, cell: CellLike) -> bool: ...',
		'def resurrect(self, target: EntityLike, cell: CellLike) -> int: ...',
		'def itemUses(self, item: WeaponLike | ChipLike) -> int: ...',
		'def setLoadout(self, name: str, keep: bool = ...) -> bool: ...',
		'def summon(self, chip: ChipLike, cell: CellLike, callback: Callable[..., Any], name: str = ...) -> int: ...',
		'def weaponCell(self, target: EntityLike | CellLike, weapon: WeaponLike = ..., ignoredCells: list = ...) -> Cell: ...',
		'def weaponCells(self, target: EntityLike | CellLike, weapon: WeaponLike = ..., ignoredCells: list = ...) -> list[Cell]: ...',
		'def chipCell(self, chip: ChipLike, target: EntityLike | CellLike, ignoredCells: list = ...) -> Cell: ...',
		'def chipCells(self, chip: ChipLike, target: EntityLike | CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
		'def weaponTargets(self, cell: CellLike, weapon: WeaponLike = ...) -> list[Entity]: ...',
		'def chipTargets(self, chip: ChipLike, cell: CellLike) -> list[Entity]: ...',
	] },
	// Sous-types d'entité (le runtime fait un vrai extends ; isinstance / attributs hérités OK).
	{ name: 'Leek', base: 'Entity', body: ['pass'] },
	{ name: 'Turret', base: 'Entity', body: ['pass'] },
	{ name: 'Bulb', base: 'Entity', inject: 'Bulb', body: ['type: int'] },
	{ name: 'Chest', base: 'Entity', inject: 'Chest', body: ['type: int'] },
	{ name: 'Mob', base: 'Entity', inject: 'Mob', body: ['type: int'] },
	// Conteneur de catégories seul (STATE_*), pas de membres statiques.
	{ name: 'State', inject: 'State', body: [] },
	// Les registres ne stockent QUE du texte (getRegister -> STRING_OR_NULL, getRegisters ->
	// MAP_STRING_STRING côté moteur) : `Any` laissait croire qu'on en ressortait un nombre.
	// Pas de `| None` sur get, cf la règle de nullabilité en tête de fichier.
	{ name: '_Registers', instance: 'Registers', body: [
		'def get(self, key: str) -> str: ...',
		'def set(self, key: str, value: Any) -> bool: ...',
		'def delete(self, key: str) -> None: ...',
		'def all(self) -> dict[str, str]: ...',
	] },
	{ name: '_Fight', instance: 'Fight', inject: 'Fight', body: [
		'me: Me', 'turn: int', 'id: int', 'type: int', 'context: int', 'boss: int', 'winner: int',
		'alliesLife: int', 'enemiesLife: int',
		'def getNearestEnemy(self) -> Entity: ...', 'def getNearestAlly(self) -> Entity: ...',
		'def getFarthestEnemy(self) -> Entity: ...', 'def getFarthestAlly(self) -> Entity: ...',
		'def getNearestEnemyTo(self, target: EntityLike) -> Entity: ...',
		'def getNearestAllyTo(self, target: EntityLike) -> Entity: ...',
		'def getEnemies(self) -> list[Entity]: ...', 'def getAllies(self) -> list[Entity]: ...',
		'def getAliveEnemies(self) -> list[Entity]: ...', 'def getAliveAllies(self) -> list[Entity]: ...',
		'def getDeadEnemies(self) -> list[Entity]: ...', 'def getDeadAllies(self) -> list[Entity]: ...',
		'def getEnemiesCount(self) -> int: ...', 'def getAlliesCount(self) -> int: ...',
		'def getAliveEnemiesCount(self) -> int: ...', 'def getAliveAlliesCount(self) -> int: ...',
		'def getDeadEnemiesCount(self) -> int: ...',
		'def getAlliedTurret(self) -> Entity: ...', 'def getEnemyTurret(self) -> Entity: ...',
		'def getNearestEnemyToCell(self, cell: CellLike) -> Entity: ...',
		'def getNearestAllyToCell(self, cell: CellLike) -> Entity: ...',
		'def getNextPlayer(self, entity: EntityLike = ...) -> Entity: ...',
		'def getPreviousPlayer(self, entity: EntityLike = ...) -> Entity: ...',
		'def listen(self) -> list: ...',
	] },
	{ name: '_Field', instance: 'Field', inject: 'Field', body: [
		'type: int',
		'def cellFromXY(self, x: int, y: int) -> Cell: ...',
		'def getObstacles(self) -> list[Cell]: ...',
		'def distance(self, a: CellLike, b: CellLike) -> int: ...',
		'def cellDistance(self, a: CellLike, b: CellLike) -> int: ...',
		'def pathLength(self, a: CellLike, b: CellLike, ignoredCells: list = ...) -> int: ...',
		'def lineOfSight(self, a: CellLike, b: CellLike, ignoredEntities: Any = ...) -> bool: ...',
		'def onSameLine(self, a: CellLike, b: CellLike) -> bool: ...',
		'def path(self, a: CellLike, b: CellLike, ignoredCells: list = ...) -> list[Cell]: ...',
	] },
	{ name: '_Network', instance: 'Network', body: [
		'def sendTo(self, entity: EntityLike, type: int, params: Any) -> bool: ...',
		'def sendAll(self, type: int, params: Any) -> None: ...',
		'def getMessages(self, entity: EntityLike = ...) -> list[Message]: ...',
	] },
	{ name: '_Debug', instance: 'Debug', body: [
		'def log(self, value: Any, color: int = ...) -> None: ...',
		'def mark(self, cells: Any, color: int = ..., duration: int = ...) -> bool: ...',
		'def markText(self, cells: Any, text: Any, color: int = ..., duration: int = ...) -> bool: ...',
		'def clearMarks(self) -> None: ...',
		'def show(self, cell: CellLike, color: int = ...) -> bool: ...',
		'def pause(self) -> None: ...',
	] },
	{ name: '_System', instance: 'System', inject: 'System', body: [
		'operations: int', 'maxOperations: int', 'instructionsCount: int',
		'usedRAM: int', 'maxRAM: int', 'date: str', 'time: str', 'timestamp: int',
	] },
	{ name: '_Color', instance: 'Color', inject: 'Color', body: [
		'def rgb(self, r: int, g: int, b: int) -> int: ...',
		'def red(self, color: int) -> int: ...',
		'def green(self, color: int) -> int: ...',
		'def blue(self, color: int) -> int: ...',
	] },
]

type ConstMember = { member: string, isInstance: boolean }
type ConstBucket = { direct: ConstMember[], subs: Record<string, ConstMember[]> }

// Range les constantes en buckets par conteneur, avec les MÊMES règles que le .d.ts (CONST_CONTAINERS).
// Une constante sans famille (PI, SORT_*...) n'est PAS émise (API 100% objet, natifs Python à la place).
function bucketConstants(constants: readonly Constant[]): Record<string, ConstBucket> {
	const buckets: Record<string, ConstBucket> = {}
	const seen = new Set<string>()
	const bucketFor = (c: string): ConstBucket => (buckets[c] ||= { direct: [], subs: {} })
	for (const c of constants) {
		const name = pySafe(c.name)
		if (!name || seen.has(name)) continue
		seen.add(name)
		const routed = routeConstant(name) // routage partagé avec le d.ts (leekwars-dts.ts)
		if (!routed) continue
		if (!pySafe(routed.member)) continue // membre non représentable en Python : on saute
		const entry: ConstMember = { member: routed.member, isInstance: routed.isInstance }
		const b = bucketFor(routed.container)
		if (routed.sub) (b.subs[routed.sub] ||= []).push(entry)
		else b.direct.push(entry)
	}
	return buckets
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
 * MÊME routage de constantes que buildLeekwarsDeclarations (leekwars-dts.ts). API 100% objet :
 * aucune fonction/constante plate, et pas de `me` global (me = Fight.me).
 */
export function buildLeekwarsPyi(constants: readonly Constant[]): string {
	const buckets = bucketConstants(constants)
	const out: string[] = [
		'# Auto-généré depuis les game data Leek Wars (API de combat, 100% objet). Ne pas éditer à la main.',
		'from typing import Any, Callable',
		'',
		'CellLike = Cell | Entity | int',
		'EntityLike = Entity | int',
		'WeaponLike = Weapon | int',
		'ChipLike = Chip | int',
		'',
	]
	const exported: string[] = ['Cell', 'Entity', 'Weapon', 'Chip', 'Item', 'Effect', 'Feature', 'Message', 'Me',
		'Leek', 'Turret', 'Bulb', 'Chest', 'Mob', 'State', 'CellLike', 'EntityLike', 'WeaponLike', 'ChipLike']

	for (const spec of CLASSES) {
		const header = spec.base ? `class ${spec.name}(${spec.base}):` : `class ${spec.name}:`
		out.push(header)
		const body = spec.body.filter((l) => l !== 'pass')
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

	// `__all__` explicite : `import *` n'apporte QUE ces noms -> `me` (absent) reste indéfini, et on
	// n'importe pas Any/Callable (bruit).
	out.push('__all__ = [' + exported.map((n) => `'${n}'`).join(', ') + ']')
	return out.join('\n') + '\n'
}
