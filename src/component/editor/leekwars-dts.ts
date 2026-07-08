// Génère un fichier de déclarations TypeScript ambiant (`leekwars.d.ts`) décrivant l'API de combat
// LeekScript (fonctions + constantes), à partir des game data chargées (LeekWars.functions / .constants).
// Il alimente le language service TypeScript de Monaco : autocomplétion + typecheck des IA polyglot
// .ts/.js sur toute l'API de jeu, sans serveur. Régénéré à chaque chargement -> toujours en phase
// avec les game data (pas de fichier figé à committer).

import type { Constant } from '@/model/constant'
import type { LSFunction } from '@/model/function'

// Résout une entrée de doc localisée à partir d'une sous-clé du namespace i18n `doc`
// (ex: 'func_getAliveEnemies', 'func_getAliveEnemies_return'). Renvoie undefined si absente
// -> la déclaration correspondante est générée sans JSDoc. Fournie par l'appelant (monaco.ts)
// pour garder ce module indépendant d'i18n (testable).
export type DocLookup = (subkey: string) => string | undefined

// Nettoie un texte de doc (source: doc.*.lang, en HTML/markdown léger) pour l'inclure dans un
// bloc JSDoc rendu par le survol Monaco : retire le HTML, dénude les hash-refs (#weapon), et
// surtout n'autorise pas `*/` qui fermerait le commentaire prématurément.
function sanitizeDoc(raw: string): string {
	return raw
		.replace(/<br\s*\/?>/gi, ' ')   // <br> -> espace
		.replace(/<[^>]+>/g, '')        // autres balises HTML
		.replace(/#(\w+)/g, '$1')       // hash-refs (#weapon) -> texte nu
		.replace(/\*\//g, '* /')        // ne jamais fermer le bloc JSDoc
		.replace(/\s+/g, ' ')           // espaces / retours ligne multiples -> 1
		.trim()
}

// Rend un bloc JSDoc à partir de lignes déjà nettoyées, avec l'indentation donnée. Forme courte
// `/** desc */` si une seule ligne de description (pas de tag), sinon bloc multi-lignes.
function renderJsdoc(lines: string[], indent: string): string {
	if (lines.length === 1 && !lines[0].startsWith('@')) {
		return `${indent}/** ${lines[0]} */`
	}
	return `${indent}/**\n` + lines.map((l) => `${indent} * ${l}`).join('\n') + `\n${indent} */`
}

// JSDoc d'une fonction plate : description + @param (noms de la signature émise) + @returns + @deprecated.
function buildFunctionJsdoc(doc: DocLookup, name: string, paramNames: string[], hasReturn: boolean, deprecated?: string): string | null {
	const lines: string[] = []
	const desc = doc('func_' + name)
	if (desc) lines.push(sanitizeDoc(desc))
	for (let i = 0; i < paramNames.length; i++) {
		const d = doc(`func_${name}_arg_${i + 1}`)
		if (d) lines.push(`@param ${paramNames[i]} ${sanitizeDoc(d)}`)
	}
	if (hasReturn) {
		const r = doc('func_' + name + '_return')
		if (r) lines.push(`@returns ${sanitizeDoc(r)}`)
	}
	if (deprecated) lines.push(`@deprecated ${sanitizeDoc(deprecated)}`)
	if (!lines.length) return null
	return renderJsdoc(lines, '')
}

// Type-id LeekScript -> type TS. Aligné sur `doc.arg_type_<id>` (cf. doc.*.lang). 0 = void (pas de retour).
// Les valeurs marshallées côté guest : map -> objet/Map, set -> tableau (cf. TypeMarshaller).
const TS_TYPE: Record<number, string> = {
	0: 'void',
	1: 'number', 6: 'number', 7: 'number', // number / integer / real
	2: 'string',
	3: 'boolean',
	4: 'any[]',
	5: '(...args: any[]) => any',
	8: 'any', // map
	9: 'any[]', // set
	10: 'any', // interval
	41: 'number[]', 42: 'string[]', 43: 'boolean[]', 44: 'any[][]', 46: 'number[]', 47: 'number[]',
	96: 'number[]',
	806: 'any',
}

function tsType(id: number | null | undefined): string {
	if (id === null || id === undefined) return 'any'
	return TS_TYPE[id] ?? 'any'
}

// Mots-clés réservés JS/TS : interdits comme nom de `declare function` / `declare const` / paramètre.
const RESERVED = new Set([
	'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
	'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in',
	'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
	'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'await', 'async',
])

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/

// Identifiant JS valide et non réservé, sinon null (on saute la déclaration ou on renomme).
function safeName(name: string | null | undefined): string | null {
	if (!name || !IDENT.test(name) || RESERVED.has(name)) return null
	return name
}

// SNAKE_CASE (nom de constante) -> camelCase (membre objet). WEAPON_MACHINE_GUN -> machineGun.
// DOIT rester en phase avec la même conversion côté runtime (generator objects.js).
function camelCase(s: string): string {
	return s.toLowerCase().replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

// Constantes d'items exposées comme membres statiques objet (Weapon.pistol, Chip.fireball) plutôt
// que comme globales plates (WEAPON_PISTOL) : préfixe -> conteneur objet. cf objects.js runtime.
const ITEM_CONST_CONTAINERS: { prefix: string, container: string }[] = [
	{ prefix: 'WEAPON_', container: 'Weapon' },
	{ prefix: 'CHIP_', container: 'Chip' },
]

export function buildLeekwarsDeclarations(functions: readonly LSFunction[], constants: readonly Constant[], doc?: DocLookup): string {
	const out: string[] = [
		'// Auto-généré depuis les game data Leek Wars (API de combat). Ne pas éditer à la main.',
		'',
		// Globaux fournis par le runtime hors API de combat (lib esnext sans DOM -> on déclare console
		// nous-mêmes). console.* est routé vers debug() (visible dans le rapport de combat).
		'declare const console: {',
		'\tlog(...args: any[]): void;',
		'\tinfo(...args: any[]): void;',
		'\tdebug(...args: any[]): void;',
		'\twarn(...args: any[]): void;',
		'\terror(...args: any[]): void;',
		'};',
		'',
	]
	const declared = new Set<string>()
	// Constantes d'items (WEAPON_/CHIP_) détournées vers les namespaces objet (Weapon.pistol...) :
	// container -> [{member camelCase, doc}]. Émis en fin de fichier, fusionnés avec les classes.
	const itemConsts: Record<string, { member: string, doc?: string }[]> = {}

	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || declared.has(name)) continue
		declared.add(name)
		const cdoc = doc?.('const_' + name)
		// Arme/puce : on n'émet PAS la globale plate `declare const WEAPON_X` -> elle devient
		// `Weapon.x` (API objet, cf runtime objects.js). La globale reste dispo à l'exécution.
		const bucket = ITEM_CONST_CONTAINERS.find((b) => name.startsWith(b.prefix))
		if (bucket) {
			(itemConsts[bucket.container] ||= []).push({ member: camelCase(name.slice(bucket.prefix.length)), doc: cdoc })
			continue
		}
		if (cdoc) out.push(renderJsdoc([sanitizeDoc(cdoc)], ''))
		out.push(`declare const ${name}: ${tsType(c.type)};`)
	}
	out.push('')

	for (const f of functions) {
		const name = safeName(f.name)
		if (!name || declared.has(name)) continue
		declared.add(name)

		const argNames = f.arguments_names || []
		const argTypes = f.arguments_types || []
		const optional = f.optional || []
		const usedParams = new Set<string>()
		let optionalFromHere = false
		const params: string[] = []
		const paramNames: string[] = []
		for (let i = 0; i < argNames.length; i++) {
			// Nom réel s'il est un identifiant valide et unique dans la signature, sinon positionnel.
			let pname = safeName(argNames[i])
			if (!pname || usedParams.has(pname)) pname = 'a' + i
			usedParams.add(pname)
			paramNames.push(pname)
			// Règle TS : un paramètre optionnel ne peut pas être suivi d'un requis -> optionnel à partir du 1er.
			optionalFromHere = optionalFromHere || !!optional[i]
			params.push(`${pname}${optionalFromHere ? '?' : ''}: ${tsType(Number(argTypes[i]))}`)
		}
		// Dépréciation douce : si la fonction plate a un équivalent objet, on marque @deprecated avec le
		// pointeur (l'éditeur la barre + diagnostic, façon LS5 -> migration vers l'API objet).
		const replacement = DEPRECATED_FLAT[name]
		const deprecated = replacement ? `Préférez ${replacement} (API objet).` : undefined
		// Doc de survol = description + @param + @returns (depuis doc.*.lang), fusionnée avec @deprecated.
		// Sans DocLookup (ou doc absente), on garde au minimum le marqueur @deprecated seul.
		const jsdoc = doc
			? buildFunctionJsdoc(doc, name, paramNames, tsType(f.return_type) !== 'void', deprecated)
			: (deprecated ? `/** @deprecated ${deprecated} */` : null)
		if (jsdoc) out.push(jsdoc)
		out.push(`declare function ${name}(${params.join(', ')}): ${tsType(f.return_type)};`)
	}

	out.push('')
	out.push(doc ? annotateObjectApi(OBJECT_API_DECLARATIONS, doc) : OBJECT_API_DECLARATIONS)

	// Constantes objet : `declare namespace Weapon { const pistol: Weapon; ... }` fusionne (declaration
	// merging) avec `declare class Weapon` -> Weapon.pistol est une instance Weapon (poolée au runtime,
	// cf objects.js). Émis après les classes ; l'ordre dans un fichier ambiant n'importe pas.
	for (const { container } of ITEM_CONST_CONTAINERS) {
		const members = itemConsts[container]
		if (!members || !members.length) continue
		out.push('')
		out.push(`declare namespace ${container} {`)
		const seen = new Set<string>()
		for (const { member, doc: mdoc } of members) {
			const m = safeName(member)
			if (!m || seen.has(m)) continue // collision camelCase / mot réservé : on saute
			seen.add(m)
			if (mdoc) out.push(renderJsdoc([sanitizeDoc(mdoc)], '\t'))
			out.push(`\tconst ${m}: ${container};`)
		}
		out.push('}')
	}
	return out.join('\n') + '\n'
}

// Alias minuscules employés dans les pointeurs de DEPRECATED_FLAT -> nom de la classe/const déclarée.
const OO_ALIAS: Record<string, string> = { me: 'Me', entity: 'Entity', cell: 'Cell', weapon: 'Weapon', chip: 'Chip' }

// Construit la table membre objet -> nom de fonction LS, en inversant DEPRECATED_FLAT (qui encode
// déjà la correspondance fonction plate -> forme objet). Clé = `Conteneur.membre` (désambiguïse les
// membres homonymes entre classes, ex: Cell.distance vs Field.distance). Ainsi la doc de survol de
// `Fight.getAliveEnemies()` réutilise `doc.func_getAliveEnemies`, source unique traduite en 18 langues.
function buildMemberToLs(): Record<string, string> {
	const map: Record<string, string> = {}
	for (const lsName in DEPRECATED_FLAT) {
		for (const form of DEPRECATED_FLAT[lsName].split('/')) {
			const m = form.trim().match(/^([A-Za-z_]\w*)\.([A-Za-z_]\w*)/)
			if (!m) continue
			const key = (OO_ALIAS[m[1]] ?? m[1]) + '.' + m[2]
			if (!(key in map)) map[key] = lsName // 1re occurrence gagne
		}
	}
	return map
}

// Injecte des blocs JSDoc dans les déclarations objet statiques : pour chaque membre qui correspond
// à une fonction LS documentée, on préfixe sa description (et @returns pour les méthodes non-void).
// On ne touche pas les membres déjà commentés à la main (Effect, me...) ni ceux sans équivalent LS.
function annotateObjectApi(block: string, doc: DocLookup): string {
	const memberToLs = buildMemberToLs()
	const out: string[] = []
	let container: string | null = null
	let prevWasComment = false
	for (const line of block.split('\n')) {
		const containerM = line.match(/^declare\s+(?:class|const)\s+([A-Za-z_]\w*)/)
		if (containerM) {
			container = containerM[1]
			out.push(line)
			prevWasComment = line.trim().endsWith('*/')
			continue
		}
		// Membre : indentation + [readonly] identifiant suivi de `(` (méthode) ou `:` (propriété).
		const memberM = line.match(/^(\s+)(?:readonly\s+)?([A-Za-z_]\w*)\s*[(:]/)
		if (container && memberM && !prevWasComment) {
			const [, indent, member] = memberM
			const lsName = memberToLs[container + '.' + member]
			const desc = lsName ? doc('func_' + lsName) : undefined
			if (lsName && desc) {
				const jlines = [sanitizeDoc(desc)]
				const isMethod = line.slice(line.indexOf(member) + member.length).trimStart().startsWith('(')
				if (isMethod && !/:\s*void\s*;?\s*$/.test(line)) {
					const r = doc('func_' + lsName + '_return')
					if (r) jlines.push(`@returns ${sanitizeDoc(r)}`)
				}
				out.push(renderJsdoc(jlines, indent))
			}
		}
		out.push(line)
		prevWasComment = line.trim().endsWith('*/')
	}
	return out.join('\n')
}

// Fonctions plates qui ont un équivalent dans l'API objet -> dépréciées (pointeur vers la forme objet).
// À garder en phase avec objects.js/objects.py. Les fonctions sans équivalent objet (debug, getRegister,
// les helpers réseau/couleur...) ne sont PAS dépréciées.
const DEPRECATED_FLAT: Record<string, string> = {
	// Entity (propriétés)
	getLife: 'me.life / entity.life', getTotalLife: 'entity.maxLife', getTP: 'entity.tp', getTotalTP: 'entity.maxTP',
	getMP: 'entity.mp', getTotalMP: 'entity.maxMP', getStrength: 'entity.strength', getAgility: 'entity.agility',
	getWisdom: 'entity.wisdom', getResistance: 'entity.resistance', getScience: 'entity.science', getMagic: 'entity.magic',
	getPower: 'entity.power', getLevel: 'entity.level', getName: 'entity.name', getAbsoluteShield: 'entity.absoluteShield',
	getRelativeShield: 'entity.relativeShield', getCell: 'me.cell / entity.cell', getWeapon: 'entity.weapon',
	getWeapons: 'entity.weapons', getChips: 'entity.chips', isAlive: 'entity.alive', isDead: 'entity.dead',
	isAlly: 'entity.isAlly()', isEnemy: 'entity.isEnemy()', getEntity: 'me',
	// me (actions)
	useWeapon: 'me.useWeapon(target)', useWeaponOnCell: 'me.useWeaponOnCell(cell)', useChip: 'me.useChip(chip, target)',
	useChipOnCell: 'me.useChipOnCell(chip, cell)', setWeapon: 'me.setWeapon(weapon)', say: 'me.say(message)',
	moveToward: 'me.moveToward(target)', moveTowardCell: 'me.moveToward(cell)', moveAwayFrom: 'me.moveAwayFrom(target)',
	moveAwayFromCell: 'me.moveAwayFrom(cell)', canUseWeapon: 'me.canUseWeapon(target)', canUseChip: 'me.canUseChip(chip, target)',
	// Cell
	getCellX: 'cell.x', getCellY: 'cell.y', getCellDistance: 'cell.distance(target)', getPathLength: 'cell.pathLength(target)',
	isEmptyCell: 'cell.empty', isObstacle: 'cell.obstacle', getEntityOnCell: 'cell.entity', lineOfSight: 'cell.lineOfSight(target)',
	// Field
	getCellFromXY: 'Field.cellFromXY(x, y)', getObstacles: 'Field.getObstacles()', getMapType: 'Field.mapType',
	getDistance: 'Field.distance(a, b)',
	// Fight
	getNearestEnemy: 'Fight.getNearestEnemy()', getNearestAlly: 'Fight.getNearestAlly()',
	getFarthestEnemy: 'Fight.getFarthestEnemy()', getFarthestAlly: 'Fight.getFarthestAlly()',
	getNearestEnemyTo: 'Fight.getNearestEnemyTo(target)', getNearestAllyTo: 'Fight.getNearestAllyTo(target)',
	getEnemies: 'Fight.getEnemies()', getAllies: 'Fight.getAllies()', getAliveEnemies: 'Fight.getAliveEnemies()',
	getAliveAllies: 'Fight.getAliveAllies()', getDeadEnemies: 'Fight.getDeadEnemies()', getDeadAllies: 'Fight.getDeadAllies()',
	getEnemiesCount: 'Fight.getEnemiesCount()', getAlliesCount: 'Fight.getAlliesCount()',
	getAliveEnemiesCount: 'Fight.getAliveEnemiesCount()', getAliveAlliesCount: 'Fight.getAliveAlliesCount()',
	getAlliedTurret: 'Fight.getAlliedTurret()', getEnemyTurret: 'Fight.getEnemyTurret()', getTurn: 'Fight.turn',
	// Weapon / Chip (stats)
	getWeaponCost: 'weapon.cost', getWeaponMinRange: 'weapon.minRange', getWeaponMaxRange: 'weapon.maxRange',
	getWeaponName: 'weapon.name', getWeaponArea: 'weapon.area', getWeaponMaxUses: 'weapon.maxUses',
	getChipCost: 'chip.cost', getChipCooldown: 'chip.cooldown', getCurrentCooldown: 'chip.currentCooldown',
	getChipName: 'chip.name', getChipMinRange: 'chip.minRange', getChipMaxRange: 'chip.maxRange',
	// Effets / états / invocations (Entity, me)
	getEffects: 'entity.effects', getLaunchedEffects: 'entity.launchedEffects', getPassiveEffects: 'entity.passiveEffects',
	getStates: 'entity.states', getSummons: 'entity.summons', getSummoner: 'entity.summoner', isSummon: 'entity.summoned',
	resurrect: 'me.resurrect(target, cell)',
	// Registres (stockage persistant)
	getRegister: 'Registers.get(key)', setRegister: 'Registers.set(key, value)',
	getRegisters: 'Registers.all()', deleteRegister: 'Registers.delete(key)',
	// Marquage / visualisation (debug)
	mark: 'Debug.mark(cells, color, duration)', markText: 'Debug.markText(cells, text, color, duration)',
	clearMarks: 'Debug.clearMarks()', show: 'Debug.show(cell, color)', pause: 'Debug.pause()',
}

// API de combat orientée objet (tranche 1 : me / Entity / Cell / Fight), couche guest définie par le
// prélude objects.js du moteur. Statique (pas issue des game data) -> déclarée à la main pour que
// l'éditeur connaisse me/Entity/Cell/Fight. Doit rester en phase avec generator objects.js/objects.py.
const OBJECT_API_DECLARATIONS = `// --- API de combat orientée objet (LeekScript v5-style) ---
type CellLike = Cell | Entity | number;
type EntityLike = Entity | number;
type WeaponLike = Weapon | number;
type ChipLike = Chip | number;

/** Un effet actif ou lancé sur une entité (EFFECT_DAMAGE, EFFECT_HEAL...). */
declare class Effect {
	/** Tableau brut [type, value, caster, turns, critical, item, target, modifiers]. */
	readonly raw: any[];
	readonly type: number;
	readonly value: number;
	readonly caster: Entity | null;
	readonly turns: number;
	readonly critical: boolean;
	/** Id de l'arme ou de la puce qui a appliqué l'effet (0 si aucun). */
	readonly item: number;
	readonly target: Entity | null;
	readonly modifiers: number;
}

/** Un effet déclaré par une arme/puce ou un effet passif (potentiel, fourchette de valeurs). */
declare class EffectTemplate {
	/** Tableau brut [type, minValue, maxValue, turns, targets, modifiers]. */
	readonly raw: any[];
	readonly type: number;
	readonly minValue: number;
	readonly maxValue: number;
	readonly turns: number;
	readonly targets: number;
	readonly modifiers: number;
}

declare class Cell {
	readonly id: number;
	readonly x: number;
	readonly y: number;
	readonly empty: boolean;
	readonly obstacle: boolean;
	readonly entity: Entity | null;
	distance(target: CellLike): number;
	pathLength(target: CellLike): number;
	lineOfSight(target: CellLike): boolean;
}

declare class Weapon {
	readonly id: number;
	readonly cost: number;
	readonly minRange: number;
	readonly maxRange: number;
	readonly minScope: number;
	readonly maxScope: number;
	readonly name: string;
	readonly area: number;
	readonly launchType: number;
	readonly maxUses: number;
	readonly inline: boolean;
	needLos(): boolean;
	effects(): EffectTemplate[];
}

declare class Chip {
	readonly id: number;
	readonly cost: number;
	readonly cooldown: number;
	readonly currentCooldown: number;
	readonly minRange: number;
	readonly maxRange: number;
	readonly minScope: number;
	readonly maxScope: number;
	readonly name: string;
	readonly area: number;
	readonly launchType: number;
	readonly maxUses: number;
	readonly inline: boolean;
	needLos(): boolean;
	effects(): EffectTemplate[];
}

declare class Entity {
	readonly id: number;
	readonly life: number;
	readonly maxLife: number;
	readonly tp: number;
	readonly maxTP: number;
	readonly mp: number;
	readonly maxMP: number;
	readonly strength: number;
	readonly agility: number;
	readonly wisdom: number;
	readonly resistance: number;
	readonly science: number;
	readonly magic: number;
	readonly power: number;
	readonly level: number;
	readonly name: string;
	readonly absoluteShield: number;
	readonly relativeShield: number;
	readonly cell: Cell;
	readonly weapon: Weapon | null;
	readonly weapons: Weapon[];
	readonly chips: Chip[];
	readonly effects: Effect[];
	readonly launchedEffects: Effect[];
	readonly passiveEffects: EffectTemplate[];
	readonly states: any[];
	readonly summons: Entity[];
	readonly summoner: Entity | null;
	readonly summoned: boolean;
	readonly alive: boolean;
	readonly dead: boolean;
	isAlly(): boolean;
	isEnemy(): boolean;
	distance(target: CellLike): number;
}

declare class Me extends Entity {
	moveToward(target: CellLike): number;
	moveAwayFrom(target: CellLike): number;
	useWeapon(target: EntityLike): number;
	useWeaponOnCell(cell: CellLike): number;
	useChip(chip: ChipLike, target: EntityLike): number;
	useChipOnCell(chip: ChipLike, cell: CellLike): number;
	setWeapon(weapon: WeaponLike): boolean;
	say(message: any): boolean;
	canUseWeapon(target: EntityLike): number;
	canUseChip(chip: ChipLike, target: EntityLike): number;
	resurrect(target: EntityLike, cell: CellLike): number;
}

/** L'IA courante. */
declare const me: Me;

declare const Registers: {
	get(key: string): any;
	set(key: string, value: any): any;
	delete(key: string): any;
	all(): any;
};

declare const Fight: {
	readonly turn: number;
	getNearestEnemy(): Entity | null;
	getNearestAlly(): Entity | null;
	getFarthestEnemy(): Entity | null;
	getFarthestAlly(): Entity | null;
	getNearestEnemyTo(target: EntityLike): Entity | null;
	getNearestAllyTo(target: EntityLike): Entity | null;
	getEnemies(): Entity[];
	getAllies(): Entity[];
	getAliveEnemies(): Entity[];
	getAliveAllies(): Entity[];
	getDeadEnemies(): Entity[];
	getDeadAllies(): Entity[];
	getEnemiesCount(): number;
	getAlliesCount(): number;
	getAliveEnemiesCount(): number;
	getAliveAlliesCount(): number;
	getAlliedTurret(): Entity | null;
	getEnemyTurret(): Entity | null;
};

declare const Field: {
	readonly mapType: number;
	cellFromXY(x: number, y: number): Cell | null;
	getObstacles(): Cell[];
	distance(a: CellLike, b: CellLike): number;
	cellDistance(a: CellLike, b: CellLike): number;
	pathLength(a: CellLike, b: CellLike): number;
	lineOfSight(a: CellLike, b: CellLike): boolean;
};

declare const Debug: {
	mark(cells: CellLike | CellLike[], color?: number, duration?: number): boolean;
	markText(cells: CellLike | CellLike[], text: any, color?: number, duration?: number): boolean;
	clearMarks(): void;
	show(cell: CellLike, color?: number): boolean;
	pause(): void;
};
`
