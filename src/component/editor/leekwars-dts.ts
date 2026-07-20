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
// Description d'une CLASSE de l'API (Debug, Field...) -> JSDoc sur `declare class/const X`, pour que
// le survol TS de JS/TS l'affiche comme LeekScript/Python (cf. api-class-doc.ts). Fournie par
// l'appelant (monaco.ts) car elle dépend de la locale active.
export type ClassDocLookup = (className: string) => string | undefined

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

// Lien Markdown vers la page de doc LeekScript du symbole (fonction ou constante). Monaco rend le
// Markdown au survol -> lien cliquable qui ouvre /help/documentation/<symbole> (la doc du symbole,
// dans la langue du joueur via son locale). Réutilise la doc LeekScript existante pour JS/TS/Python.
function docLink(symbol: string): string {
	return `📖 [Documentation](https://leekwars.com/help/documentation/${symbol})`
}

// Mots-clés réservés JS/TS : interdits comme nom de membre de constante déclaré.
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

// Constantes rangées en membres OBJET (Weapon.pistol, Effect.DAMAGE, Fight.Type.SOLO...) au lieu de
// globales plates. préfixe -> conteneur (+ sous-conteneur). item=true -> INSTANCE (type = conteneur,
// camelCase) ; sinon CATÉGORIE (type number, nom MAJUSCULE). DOIT rester en phase avec le RULES du
// runtime (generator objects.js/objects.py). Préfixes composés listés avant les simples.
const CONST_CONTAINERS: { prefix: string, container: string, sub?: string, item?: boolean }[] = [
	{ prefix: 'WEAPON_', container: 'Weapon', item: true },
	{ prefix: 'CHIP_', container: 'Chip', item: true },
	{ prefix: 'LAUNCH_TYPE_', container: 'Item', sub: 'LaunchType' },
	{ prefix: 'FIGHT_TYPE_', container: 'Fight', sub: 'Type' },
	{ prefix: 'FIGHT_CONTEXT_', container: 'Fight', sub: 'Context' },
	{ prefix: 'AREA_', container: 'Item', sub: 'Area' },
	{ prefix: 'STAT_', container: 'Entity', sub: 'Stat' },
	{ prefix: 'ENTITY_', container: 'Entity', sub: 'Type' },
	{ prefix: 'CELL_', container: 'Cell', sub: 'Type' },
	{ prefix: 'CHEST_', container: 'Chest', sub: 'Type' },
	{ prefix: 'BULB_', container: 'Bulb', sub: 'Type' },
	{ prefix: 'MOB_', container: 'Mob', sub: 'Type' },
	{ prefix: 'BOSS_', container: 'Fight', sub: 'Boss' },
	{ prefix: 'EROSION_', container: 'Fight', sub: 'Erosion' },
	{ prefix: 'USE_', container: 'Fight', sub: 'Use' },
	{ prefix: 'MESSAGE_', container: 'Message', sub: 'Type' },
	{ prefix: 'MAP_', container: 'Field' },
	{ prefix: 'EFFECT_', container: 'Effect' },
	{ prefix: 'STATE_', container: 'State' },
	{ prefix: 'COLOR_', container: 'Color' },
]
// Constantes attachées TELLES QUELLES à un conteneur (pas de préfixe à retirer). Miroir du EXACT
// du runtime (objects.js/objects.py).
const CONST_EXACT: Record<string, string> = {
	OPERATIONS_LIMIT: 'System', INSTRUCTIONS_LIMIT: 'System',
	CRITICAL_FACTOR: 'Fight', MAX_TURNS: 'Fight', SUMMON_LIMIT: 'Fight',
}
// Conteneurs qui sont des objets `const` (pas des classes) : namespace-merge impossible -> on injecte
// leurs constantes INLINE dans la déclaration de l'objet (cf renderInlineContainer).
const CONST_OBJECT_CONTAINERS = new Set(['Fight', 'Field', 'System', 'Color'])

type ConstMember = { member: string, full: string, doc?: string, isInstance: boolean }
type ConstBucket = { direct: ConstMember[], subs: Record<string, ConstMember[]> }

// Routage d'une constante vers son membre objet selon CONST_EXACT + CONST_CONTAINERS. Retourne null
// pour une constante sans famille (PI, SORT_*, TYPE_*...) : elle n'est PAS exposée (les natifs du
// langage la remplacent). `member` applique déjà camelCase pour les items (WEAPON_PISTOL -> pistol) ;
// l'appelant reste responsable de re-valider `member` selon sa cible (identifiant JS pour le d.ts,
// Python pour le stub .pyi). SOURCE UNIQUE du routage, partagée par le d.ts, la complétion, le survol
// et le stub Python -> impossible de diverger.
export interface RoutedConstant { container: string, sub?: string, member: string, isInstance: boolean }
export function routeConstant(name: string): RoutedConstant | null {
	if (CONST_EXACT[name]) return { container: CONST_EXACT[name], member: name, isInstance: false }
	const rule = CONST_CONTAINERS.find((r) => name.startsWith(r.prefix))
	if (!rule) return null
	const raw = name.slice(rule.prefix.length)
	return { container: rule.container, sub: rule.sub, member: rule.item ? camelCase(raw) : raw, isInstance: !!rule.item }
}

export function buildLeekwarsDeclarations(functions: readonly LSFunction[], constants: readonly Constant[], doc?: DocLookup, classDoc?: ClassDocLookup): string {
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
	// Constantes rangées par conteneur : container -> { direct, subs }. Émises en fin de fichier
	// (namespaces mergés aux classes, ou inline pour Fight/Field/System/Color). AUCUNE globale plate
	// n'est émise (API 100% objet) : une constante sans famille est simplement absente, et les
	// FONCTIONS plates ne sont plus déclarées du tout (le runtime ne les expose plus).
	const collected: Record<string, ConstBucket> = {}
	const bucketFor = (container: string): ConstBucket => (collected[container] ||= { direct: [], subs: {} })

	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || declared.has(name)) continue
		declared.add(name)
		const cdoc = doc?.('const_' + name)
		const routed = routeConstant(name)
		if (routed) {
			const entry: ConstMember = { member: routed.member, full: name, doc: cdoc, isInstance: routed.isInstance }
			const b = bucketFor(routed.container)
			if (routed.sub) (b.subs[routed.sub] ||= []).push(entry)
			else b.direct.push(entry)
		}
	}

	// JSDoc d'un membre constante : description (si dispo) + lien vers la doc du symbole.
	const constJsdoc = (m: ConstMember, indent: string): string => {
		const jlines: string[] = []
		if (m.doc) jlines.push(sanitizeDoc(m.doc))
		jlines.push(docLink(m.full))
		return renderJsdoc(jlines, indent)
	}
	// Rend un membre de namespace `const X: type;` (type = conteneur pour une instance, sinon number).
	const memberLines = (m: ConstMember, container: string, indent: string): string[] => {
		const safe = safeName(m.member)
		if (!safe) return []
		return [constJsdoc(m, indent), `${indent}const ${safe}: ${m.isInstance ? container : 'number'};`]
	}
	// Pour Fight/Field (objets const) : les constantes s'injectent INLINE (readonly ...: number).
	const inlineContainer = (container: string): string => {
		const b = collected[container]
		if (!b) return ''
		const lines: string[] = []
		const seen = new Set<string>()
		for (const m of b.direct) {
			const safe = safeName(m.member)
			if (safe && !seen.has(safe)) { seen.add(safe); lines.push(constJsdoc(m, '\t'), `\treadonly ${safe}: number;`) }
		}
		for (const sub of Object.keys(b.subs)) {
			lines.push(`\treadonly ${sub}: {`)
			const seenS = new Set<string>()
			for (const m of b.subs[sub]) {
				const safe = safeName(m.member)
				if (safe && !seenS.has(safe)) { seenS.add(safe); lines.push(constJsdoc(m, '\t\t'), `\t\treadonly ${safe}: number;`) }
			}
			lines.push('\t};')
		}
		return lines.join('\n')
	}

	// Bloc API objet (classes + const Fight/Field) : on injecte les constantes de Fight/Field inline.
	const funcByName = new Map(functions.map((f) => [f.name, f]))
	let objBlock = doc ? annotateObjectApi(OBJECT_API_DECLARATIONS, doc, funcByName, classDoc) : OBJECT_API_DECLARATIONS
	for (const container of CONST_OBJECT_CONTAINERS) {
		const inline = inlineContainer(container)
		if (inline) objBlock = objBlock.replace(`declare const ${container}: {\n`, `declare const ${container}: {\n${inline}\n`)
	}
	out.push('')
	out.push(objBlock)

	// Namespaces de constantes fusionnés aux classes (declaration merging) : Effect.DAMAGE,
	// Entity.Stat.STRENGTH, Weapon.pistol, Item.LaunchType.LINE... (Fight/Field déjà injectés inline).
	for (const container of Object.keys(collected)) {
		if (CONST_OBJECT_CONTAINERS.has(container)) continue
		const { direct, subs } = collected[container]
		out.push('')
		out.push(`declare namespace ${container} {`)
		const seen = new Set<string>()
		for (const m of direct) {
			const safe = safeName(m.member)
			if (!safe || seen.has(safe)) continue
			seen.add(safe)
			for (const l of memberLines(m, container, '\t')) out.push(l)
		}
		for (const sub of Object.keys(subs)) {
			out.push(`\tnamespace ${sub} {`)
			const seenS = new Set<string>()
			for (const m of subs[sub]) {
				const safe = safeName(m.member)
				if (!safe || seenS.has(safe)) continue
				seenS.add(safe)
				for (const l of memberLines(m, container, '\t\t')) out.push(l)
			}
			out.push('\t}')
		}
		out.push('}')
	}
	return out.join('\n') + '\n'
}

// ---------------------------------------------------------------------------------------------
// Modèle structuré de l'API objet, pour l'AUTOCOMPLÉTION Python (Monaco n'a pas de language service
// Python : on alimente un CompletionItemProvider custom). Source unique = OBJECT_API_DECLARATIONS
// ci-dessous (le même bloc qui type le .d.ts JS/TS) + les constantes des game data.
// ---------------------------------------------------------------------------------------------

export interface ApiMember {
	name: string
	kind: 'method' | 'property'
	detail: string // signature affichée dans la complétion (ex: "moveToward(target: CellLike): number")
	container: string // classe/const d'origine (pour retrouver la doc via buildMemberToLs)
}

export interface ObjectApiModel {
	members: Record<string, ApiMember[]> // membres d'INSTANCE par conteneur (Fight, Weapon, Entity, Me...)
	statics: Record<string, ApiMember[]> // membres STATIQUES par classe (Weapon.getAll, Chip.isChip...)
	singletons: string[]                 // objets const (accédés Nom.membre) : Fight, Field, System, Color...
	classes: string[]                    // classes (dont on a des instances / qu'on utilise en instanceof)
	instanceUnion: ApiMember[]           // union des membres d'instance (pour `x.` quand x n'est pas typé)
	meMembers: ApiMember[]               // Me + Entity (pour `me.`, cas dominant)
}

// Classes dont les membres constituent l'« union d'instance » (offerte après `variable.`). On exclut
// les singletons (Fight/Field/Registers/Debug...), accédés par leur nom, pas via une variable typée.
const INSTANCE_CLASSES = ['Entity', 'Me', 'Cell', 'Weapon', 'Chip', 'Item', 'Effect', 'Feature', 'Message', 'Leek', 'Turret', 'Bulb', 'Chest', 'Mob']

// Parse OBJECT_API_DECLARATIONS (format régulier généré à la main) en modèle de complétion. Robuste
// au format exact du bloc ci-dessous : `declare class X {` / `declare const X: {` ouvrent un conteneur,
// une ligne `  [readonly] nom: type;` = propriété, `  nom(args): type;` = méthode, `}` ferme.
let _objectApiModel: ObjectApiModel | null = null
export function buildObjectApiModel(): ObjectApiModel {
	if (_objectApiModel) return _objectApiModel
	const members: Record<string, ApiMember[]> = {}
	const statics: Record<string, ApiMember[]> = {}
	const singletons: string[] = []
	const classes: string[] = []
	let container: string | null = null
	for (const raw of OBJECT_API_DECLARATIONS.split('\n')) {
		const open = raw.match(/^declare\s+(class|const)\s+([A-Za-z_]\w*)/)
		if (open) {
			container = open[2]
			if (!members[container]) members[container] = []
			;(open[1] === 'const' ? singletons : classes).push(container)
			continue
		}
		if (!container) continue
		if (raw.startsWith('}')) { container = null; continue }
		let trimmed = raw.trim()
		if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue
		// membre statique (Weapon.getAll...) : rangé à part, offert après le NOM de la classe.
		let bucket = members[container]
		if (trimmed.startsWith('static ')) {
			trimmed = trimmed.slice('static '.length)
			bucket = (statics[container] ||= [])
		}
		// méthode : nom( ... ) : type ;
		const method = trimmed.match(/^([A-Za-z_]\w*)\s*\((.*)\)\s*:\s*([^;]+);/)
		if (method) {
			bucket.push({ name: method[1], kind: 'method', detail: `${method[1]}(${method[2]}): ${method[3].trim()}`, container })
			continue
		}
		// propriété : [readonly] nom : type ;
		const prop = trimmed.match(/^(?:readonly\s+)?([A-Za-z_]\w*)\s*:\s*([^;]+);/)
		if (prop) {
			bucket.push({ name: prop[1], kind: 'property', detail: `${prop[1]}: ${prop[2].trim()}`, container })
		}
	}
	const dedup = (list: ApiMember[]): ApiMember[] => {
		const seen = new Set<string>(); const out: ApiMember[] = []
		for (const m of list) if (!seen.has(m.name)) { seen.add(m.name); out.push(m) }
		return out
	}
	const instanceUnion = dedup(INSTANCE_CLASSES.flatMap((c) => members[c] ?? []))
	const meMembers = dedup([...(members['Me'] ?? []), ...(members['Entity'] ?? [])])
	_objectApiModel = { members, statics, singletons, classes, instanceUnion, meMembers }
	return _objectApiModel
}

// Membres CONSTANTES par chemin d'accès, pour la complétion (ex: `Weapon.` -> pistol, machineGun... ;
// `Entity.` -> Stat, Type (sous-namespaces) ; `Entity.Stat.` -> STRENGTH...). Clé = chemin (conteneur
// ou conteneur.sous). isNamespace=true pour un sous-conteneur (offert au niveau du conteneur parent).
// Même routage (CONST_CONTAINERS + camelCase) que le .d.ts, donc toujours en phase.
export interface ConstCompletion { name: string, isNamespace: boolean, full?: string }
export function buildConstantMembersByPath(constants: readonly Constant[]): Record<string, ConstCompletion[]> {
	const byPath: Record<string, ConstCompletion[]> = {}
	const seen: Record<string, Set<string>> = {}
	const add = (path: string, item: ConstCompletion) => {
		;(byPath[path] ||= [])
		;(seen[path] ||= new Set())
		if (!seen[path].has(item.name)) { seen[path].add(item.name); byPath[path].push(item) }
	}
	const declaredNames = new Set<string>()
	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || declaredNames.has(name)) continue
		declaredNames.add(name)
		const routed = routeConstant(name)
		if (!routed) continue
		const member = safeName(routed.member)
		if (!member) continue
		if (routed.sub) {
			add(`${routed.container}.${routed.sub}`, { name: member, isNamespace: false, full: name })
			add(routed.container, { name: routed.sub, isNamespace: true }) // le sous-namespace au niveau du conteneur
		} else {
			add(routed.container, { name: member, isNamespace: false, full: name })
		}
	}
	return byPath
}

// Map notation objet -> nom de constante plat, ex: "Weapon.bazooka" -> "WEAPON_BAZOOKA",
// "Effect.DAMAGE" -> "EFFECT_DAMAGE", "Fight.Type.SOLO" -> "FIGHT_TYPE_SOLO". Même routage
// (CONST_CONTAINERS + camelCase) que la génération du d.ts. Sert au survol de l'éditeur polyglot à
// remonter du symbole objet vers la fiche de doc de la constante d'origine.
export function buildConstantPathMap(constants: readonly Constant[]): Map<string, string> {
	const map = new Map<string, string>()
	const seen = new Set<string>()
	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || seen.has(name)) continue
		seen.add(name)
		const routed = routeConstant(name)
		if (!routed) continue // constante plate : la notation objet == son nom, matché directement
		const member = safeName(routed.member)
		if (!member) continue
		const path = routed.sub ? `${routed.container}.${routed.sub}.${member}` : `${routed.container}.${member}`
		if (!map.has(path)) map.set(path, name)
	}
	return map
}

// Membre objet (`Conteneur.membre`) -> fonction LS dont il reprend la DOC (description + params +
// retour + lien /help/documentation, traduite en 18 langues). SOURCE UNIQUE pour le survol JS/TS
// (annotateObjectApi) et Python (resolvePolyglotSymbol). À garder en phase avec objects.js/objects.py.
export const OBJECT_MEMBER_LS: Record<string, string> = {
	// Entity (propriétés)
	'Entity.life': 'getLife', 'Entity.maxLife': 'getTotalLife', 'Entity.tp': 'getTP', 'Entity.maxTP': 'getTotalTP',
	'Entity.mp': 'getMP', 'Entity.maxMP': 'getTotalMP', 'Entity.strength': 'getStrength', 'Entity.agility': 'getAgility',
	'Entity.wisdom': 'getWisdom', 'Entity.resistance': 'getResistance', 'Entity.science': 'getScience',
	'Entity.magic': 'getMagic', 'Entity.power': 'getPower', 'Entity.level': 'getLevel', 'Entity.name': 'getName',
	'Entity.absoluteShield': 'getAbsoluteShield', 'Entity.relativeShield': 'getRelativeShield',
	'Entity.damageReturn': 'getDamageReturn', 'Entity.frequency': 'getFrequency', 'Entity.cores': 'getCores',
	'Entity.ram': 'getRAM', 'Entity.cell': 'getCell', 'Entity.weapon': 'getWeapon', 'Entity.weapons': 'getWeapons',
	'Entity.chips': 'getChips', 'Entity.effects': 'getEffects', 'Entity.launchedEffects': 'getLaunchedEffects',
	'Entity.passiveEffects': 'getPassiveEffects', 'Entity.states': 'getStates', 'Entity.summons': 'getSummons',
	'Entity.summoner': 'getSummoner', 'Entity.summoned': 'isSummon', 'Entity.alive': 'isAlive', 'Entity.dead': 'isDead',
	'Entity.isStatic': 'isStatic', 'Entity.birthTurn': 'getBirthTurn', 'Entity.turnOrder': 'getEntityTurnOrder',
	'Entity.side': 'getSide', 'Entity.leekID': 'getLeekID', 'Entity.teamID': 'getTeamID', 'Entity.teamName': 'getTeamName',
	'Entity.compositionName': 'getCompositionName', 'Entity.farmerID': 'getFarmerID', 'Entity.farmerName': 'getFarmerName',
	'Entity.farmerCountry': 'getFarmerCountry', 'Entity.aiID': 'getAIID', 'Entity.aiName': 'getAIName',
	'Entity.isAlly': 'isAlly', 'Entity.isEnemy': 'isEnemy', 'Entity.stat': 'getStat', 'Entity.distance': 'getCellDistance',
	// me (actions)
	'Me.useWeapon': 'useWeapon', 'Me.useWeaponOnCell': 'useWeaponOnCell', 'Me.useChip': 'useChip',
	'Me.useChipOnCell': 'useChipOnCell', 'Me.setWeapon': 'setWeapon', 'Me.say': 'say', 'Me.lama': 'lama',
	'Me.moveToward': 'moveToward', 'Me.moveAwayFrom': 'moveAwayFrom', 'Me.moveTowardCells': 'moveTowardCells',
	'Me.moveTowardEntities': 'moveTowardEntities', 'Me.moveTowardLine': 'moveTowardLine',
	'Me.moveAwayFromCells': 'moveAwayFromCells', 'Me.moveAwayFromEntities': 'moveAwayFromEntities',
	'Me.moveAwayFromLine': 'moveAwayFromLine', 'Me.canUseWeapon': 'canUseWeapon',
	'Me.canUseWeaponOnCell': 'canUseWeaponOnCell', 'Me.canUseChip': 'canUseChip',
	'Me.canUseChipOnCell': 'canUseChipOnCell', 'Me.resurrect': 'resurrect', 'Me.summon': 'summon',
	'Me.itemUses': 'getItemUses', 'Me.setLoadout': 'setLoadout',
	'Me.weaponCell': 'getCellToUseWeapon', 'Me.weaponCells': 'getCellsToUseWeapon',
	'Me.chipCell': 'getCellToUseChip', 'Me.chipCells': 'getCellsToUseChip',
	'Me.weaponTargets': 'getWeaponTargets', 'Me.chipTargets': 'getChipTargets',
	// Cell
	'Cell.x': 'getCellX', 'Cell.y': 'getCellY', 'Cell.empty': 'isEmptyCell', 'Cell.obstacle': 'isObstacle',
	'Cell.entity': 'getEntityOnCell', 'Cell.hasEntity': 'isEntity', 'Cell.content': 'getCellContent',
	'Cell.distance': 'getCellDistance', 'Cell.pathLength': 'getPathLength', 'Cell.lineOfSight': 'lineOfSight',
	'Cell.path': 'getPath', 'Cell.onSameLine': 'isOnSameLine',
	// Field
	'Field.type': 'getMapType', 'Field.cellFromXY': 'getCellFromXY', 'Field.getObstacles': 'getObstacles',
	'Field.distance': 'getDistance', 'Field.cellDistance': 'getCellDistance', 'Field.pathLength': 'getPathLength',
	'Field.lineOfSight': 'lineOfSight', 'Field.onSameLine': 'isOnSameLine', 'Field.path': 'getPath',
	// Fight
	'Fight.me': 'getEntity', 'Fight.turn': 'getTurn', 'Fight.id': 'getFightID', 'Fight.type': 'getFightType',
	'Fight.context': 'getFightContext', 'Fight.boss': 'getFightBoss', 'Fight.winner': 'getWinner',
	'Fight.alliesLife': 'getAlliesLife', 'Fight.enemiesLife': 'getEnemiesLife',
	'Fight.getNearestEnemy': 'getNearestEnemy', 'Fight.getNearestAlly': 'getNearestAlly',
	'Fight.getFarthestEnemy': 'getFarthestEnemy', 'Fight.getFarthestAlly': 'getFarthestAlly',
	'Fight.getNearestEnemyTo': 'getNearestEnemyTo', 'Fight.getNearestAllyTo': 'getNearestAllyTo',
	'Fight.getNearestEnemyToCell': 'getNearestEnemyToCell', 'Fight.getNearestAllyToCell': 'getNearestAllyToCell',
	'Fight.getEnemies': 'getEnemies', 'Fight.getAllies': 'getAllies', 'Fight.getAliveEnemies': 'getAliveEnemies',
	'Fight.getAliveAllies': 'getAliveAllies', 'Fight.getDeadEnemies': 'getDeadEnemies',
	'Fight.getDeadAllies': 'getDeadAllies', 'Fight.getEnemiesCount': 'getEnemiesCount',
	'Fight.getAlliesCount': 'getAlliesCount', 'Fight.getAliveEnemiesCount': 'getAliveEnemiesCount',
	'Fight.getAliveAlliesCount': 'getAliveAlliesCount', 'Fight.getDeadEnemiesCount': 'getDeadEnemiesCount',
	'Fight.getAlliedTurret': 'getAlliedTurret', 'Fight.getEnemyTurret': 'getEnemyTurret',
	'Fight.getNextPlayer': 'getNextPlayer', 'Fight.getPreviousPlayer': 'getPreviousPlayer', 'Fight.listen': 'listen',
	// Weapon / Chip
	'Weapon.cost': 'getWeaponCost', 'Weapon.minRange': 'getWeaponMinRange', 'Weapon.maxRange': 'getWeaponMaxRange',
	'Weapon.name': 'getWeaponName', 'Weapon.area': 'getWeaponArea', 'Weapon.launchType': 'getWeaponLaunchType',
	'Weapon.maxUses': 'getWeaponMaxUses', 'Weapon.inline': 'isInlineWeapon', 'Weapon.needsLos': 'weaponNeedLos',
	'Weapon.failure': 'getWeaponFailure', 'Weapon.features': 'getWeaponEffects',
	'Weapon.passiveFeatures': 'getWeaponPassiveEffects', 'Weapon.effectiveArea': 'getWeaponEffectiveArea',
	'Weapon.getAll': 'getAllWeapons', 'Weapon.isWeapon': 'isWeapon',
	'Chip.cost': 'getChipCost', 'Chip.cooldown': 'getChipCooldown', 'Chip.currentCooldown': 'getCooldown',
	'Chip.currentCooldownOf': 'getCooldown', 'Chip.minRange': 'getChipMinRange', 'Chip.maxRange': 'getChipMaxRange',
	'Chip.minScope': 'getChipMinScope', 'Chip.maxScope': 'getChipMaxScope', 'Chip.name': 'getChipName',
	'Chip.area': 'getChipArea', 'Chip.launchType': 'getChipLaunchType', 'Chip.maxUses': 'getChipMaxUses',
	'Chip.inline': 'isInlineChip', 'Chip.needsLos': 'chipNeedLos', 'Chip.failure': 'getChipFailure',
	'Chip.features': 'getChipEffects', 'Chip.effectiveArea': 'getChipEffectiveArea',
	'Chip.bulbChips': 'getBulbChips', 'Chip.bulbCharacteristics': 'getBulbCharacteristics',
	'Chip.bulbStats': 'getBulbStats', 'Chip.getAll': 'getAllChips', 'Chip.isChip': 'isChip',
	// Sous-types d'entité
	'Bulb.type': 'getBulbType', 'Chest.type': 'getChestType', 'Mob.type': 'getMobType',
	// Effect / Message
	'Effect.getAll': 'getAllEffects',
	'Message.author': 'getMessageAuthor', 'Message.type': 'getMessageType', 'Message.params': 'getMessageParams',
	// Network
	'Network.sendTo': 'sendTo', 'Network.sendAll': 'sendAll', 'Network.getMessages': 'getMessages',
	// Registres (stockage persistant)
	'Registers.get': 'getRegister', 'Registers.set': 'setRegister',
	'Registers.all': 'getRegisters', 'Registers.delete': 'deleteRegister',
	// Marquage / visualisation / journal (debug)
	'Debug.log': 'debug', 'Debug.mark': 'mark', 'Debug.markText': 'markText',
	'Debug.clearMarks': 'clearMarks', 'Debug.show': 'show', 'Debug.pause': 'pause',
	// System (budget d'exécution, horloge)
	'System.operations': 'getOperations', 'System.maxOperations': 'getMaxOperations',
	'System.instructionsCount': 'getInstructionsCount', 'System.usedRAM': 'getUsedRAM',
	'System.maxRAM': 'getMaxRAM', 'System.date': 'getDate', 'System.time': 'getTime',
	'System.timestamp': 'getTimestamp',
	// Color
	'Color.rgb': 'getColor', 'Color.red': 'getRed', 'Color.green': 'getGreen', 'Color.blue': 'getBlue',
}

// (exportée) Table membre objet -> nom de fonction LS. Clé = `Conteneur.membre` (désambiguïse les
// membres homonymes entre classes, ex: Cell.distance vs Field.distance). Ainsi la doc de survol de
// `Fight.getAliveEnemies()` réutilise `doc.func_getAliveEnemies`, source unique traduite en 18 langues.
export function buildMemberToLs(): Record<string, string> {
	return OBJECT_MEMBER_LS
}

// Ajoute des lignes JSDoc (description LS, @returns, lien de doc...) dans le bloc de commentaire écrit
// à la main qui se termine à out[out.length-1] (repéré par son ouverture commentStart). Gère la forme
// courte `/** desc */` (convertie en multi-lignes) et la forme multi-lignes (les lignes s'insèrent
// avant la ligne ` */`). Ainsi un membre déjà commenté conserve sa prose ET reçoit la doc LS complète.
function injectJsdocLines(out: string[], commentStart: number, extra: string[]): void {
	if (!extra.length) return
	const end = out.length - 1
	if (commentStart === end) {
		const m = out[end].match(/^(\s*)\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/)
		if (!m) return
		const ind = m[1]
		const body = [m[2], ...extra].map((l) => `${ind} * ${l}`).join('\n')
		out[end] = `${ind}/**\n${body}\n${ind} */`
	} else {
		const ind = (out[end].match(/^(\s*)\*\//)?.[1] ?? '').replace(/\s$/, '')
		out.splice(end, 0, ...extra.map((l) => `${ind} * ${l}`))
	}
}

// Doc LS COMPLÈTE d'un symbole (celle de sa page /help/documentation), en lignes JSDoc : description
// + un @param par argument (nom réel de la fonction LS + description, marqué optionnel) + @returns +
// lien. Reproduit dans la tooltip le contenu de la page de doc, params compris. `lsFun` (les game
// data de la fonction) fournit les noms/optionnalité des arguments ; absent -> desc + lien seuls.
function lsFullDocLines(doc: DocLookup, lsName: string, lsFun: LSFunction | undefined, isMethod: boolean): string[] {
	const lines: string[] = []
	const desc = doc('func_' + lsName)
	if (desc) lines.push(sanitizeDoc(desc))
	// @param seulement pour les méthodes : sur une propriété (weapon.cost) le 1er argument LS est le
	// récepteur lui-même (weapon), un @param serait trompeur.
	const names = isMethod ? (lsFun?.arguments_names ?? []) : []
	const optional = lsFun?.optional ?? []
	for (let i = 0; i < names.length; i++) {
		const d = doc(`func_${lsName}_arg_${i + 1}`)
		if (d) lines.push(`@param ${names[i]} ${optional[i] ? '(optionnel) ' : ''}${sanitizeDoc(d)}`)
	}
	// @returns dès qu'une doc de retour existe (indépendant de la présence de la fonction dans les game
	// data : certains helpers objet mappent une fonction non listée mais documentée).
	const r = doc('func_' + lsName + '_return')
	if (r) lines.push(`@returns ${sanitizeDoc(r)}`)
	lines.push(docLink(lsName))
	return lines
}

// Injecte des blocs JSDoc dans les déclarations objet statiques : pour chaque membre qui correspond
// à une fonction LS, on injecte sa doc COMPLÈTE (description + paramètres + retour + lien), soit le
// contenu de sa page de doc. Si le membre a déjà un commentaire écrit à la main (Effect, me...), on
// conserve sa prose et on y ajoute la doc LS. Membres sans équivalent LS : laissés tels quels.
function annotateObjectApi(block: string, doc: DocLookup, funcByName: Map<string, LSFunction>, classDoc?: ClassDocLookup): string {
	const memberToLs = buildMemberToLs()
	const out: string[] = []
	let container: string | null = null
	let prevWasComment = false
	let commentStart = -1 // index dans `out` de la ligne ouvrant le dernier bloc de commentaire
	for (const line of block.split('\n')) {
		const trimmed = line.trim()
		const containerM = line.match(/^declare\s+(?:class|const)\s+([A-Za-z_]\w*)/)
		if (containerM) {
			container = containerM[1]
			// Description de la classe -> JSDoc juste avant `declare class/const X` (survol TS en JS/TS).
			const cdoc = classDoc?.(container)
			if (cdoc) {
				const indent = line.match(/^\s*/)?.[0] ?? ''
				if (prevWasComment && commentStart >= 0) injectJsdocLines(out, commentStart, [cdoc])
				else if (!prevWasComment) out.push(renderJsdoc([cdoc], indent))
			}
		} else {
			// Membre : indentation + [readonly|static] identifiant suivi de `(` (méthode) ou `:` (propriété).
			const memberM = line.match(/^(\s+)(?:readonly\s+|static\s+)?([A-Za-z_]\w*)\s*[(:]/)
			if (container && memberM) {
				const [, indent, member] = memberM
				const lsName = memberToLs[container + '.' + member]
				if (lsName) {
					const isMethod = line.slice(line.indexOf(member) + member.length).trimStart().startsWith('(')
					const lsLines = lsFullDocLines(doc, lsName, funcByName.get(lsName), isMethod)
					// Déjà commenté à la main : on fusionne (prose conservée + doc LS ajoutée). Sinon on
					// génère le bloc directement.
					if (prevWasComment && commentStart >= 0) injectJsdocLines(out, commentStart, lsLines)
					else if (!prevWasComment) out.push(renderJsdoc(lsLines, indent))
				}
			}
		}
		if (trimmed.startsWith('/**')) commentStart = out.length // ligne d'ouverture (poussée juste après)
		out.push(line)
		prevWasComment = trimmed.endsWith('*/')
	}
	return out.join('\n')
}

// API de combat orientée objet (COMPLÈTE : seule API exposée au runtime), couche guest définie par le
// prélude objects.js du moteur. Statique (pas issue des game data) -> déclarée à la main pour que
// l'éditeur connaisse Fight/Entity/Cell/System... Doit rester en phase avec generator objects.js/objects.py.
const OBJECT_API_DECLARATIONS = `// --- API de combat orientée objet (LeekScript v5-style) ---
type CellLike = Cell | Entity | number;
type EntityLike = Entity | number;
type WeaponLike = Weapon | number;
type ChipLike = Chip | number;

/** Un effet actif ou lancé sur une entité (Effect.DAMAGE, Effect.HEAL...). */
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
	/** Liste des ids de TYPES d'effets existants (Effect.DAMAGE, Effect.HEAL...). */
	static getAll(): number[];
}

/** Un message d'équipe reçu (cf Network.getMessages). */
declare class Message {
	/** Tableau brut [auteur, type, params]. */
	readonly raw: any[];
	readonly author: Entity | null;
	/** Type du message (Message.Type.*). */
	readonly type: number;
	readonly params: any;
}

/** Une caractéristique déclarée par une arme/puce (ou un effet passif) : ce que l'item peut faire
 *  quand il touche (dégâts, poison, téléport, inversion...). Potentiel, fourchette de valeurs.
 *  À distinguer d'Effect (un effet actif sur une entité). */
declare class Feature {
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
	/** Une entité occupe-t-elle la case. */
	readonly hasEntity: boolean;
	/** Contenu de la case (Cell.Type.EMPTY/PLAYER/ENTITY/OBSTACLE). */
	readonly content: number;
	distance(target: CellLike): number;
	pathLength(target: CellLike, ignoredCells?: CellLike[]): number;
	lineOfSight(target: CellLike, ignoredEntities?: EntityLike | EntityLike[]): boolean;
	/** Chemin (liste de cellules) jusqu'à la cible, en évitant 'ignoredCells'. */
	path(target: CellLike, ignoredCells?: CellLike[]): Cell[];
	/** La case est-elle alignée (même ligne ou colonne) avec la cible. */
	onSameLine(target: CellLike): boolean;
}

/** Base commune aux armes et puces. Porte les constantes partagées (Item.LaunchType, Item.Area). */
declare class Item {
	readonly id: number;
}

declare class Weapon extends Item {
	readonly cost: number;
	readonly minRange: number;
	readonly maxRange: number;
	readonly name: string;
	readonly area: number;
	readonly launchType: number;
	readonly maxUses: number;
	readonly inline: boolean;
	readonly needsLos: boolean;
	/** Pourcentage d'échec de l'arme. */
	readonly failure: number;
	/** Caractéristiques déclarées de l'arme (dégâts, poison, téléport...). cf Feature. */
	readonly features: Feature[];
	/** Caractéristiques passives de l'arme (bonus quand elle est équipée). */
	readonly passiveFeatures: Feature[];
	/** Zone d'effet réelle de l'arme sur 'cell', tirée depuis 'from' (défaut : position courante). */
	effectiveArea(cell: CellLike, from?: CellLike): Cell[];
	/** Toutes les armes du jeu. */
	static getAll(): Weapon[];
	/** La valeur est-elle un id d'arme valide. */
	static isWeapon(value: any): boolean;
}

declare class Chip extends Item {
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
	readonly needsLos: boolean;
	/** Pourcentage d'échec de la puce. */
	readonly failure: number;
	/** Caractéristiques déclarées de la puce. cf Feature. */
	readonly features: Feature[];
	/** Pour une puce d'INVOCATION : puces du bulbe invoqué. */
	readonly bulbChips: Chip[];
	/** Pour une puce d'INVOCATION : caractéristiques du bulbe invoqué. */
	readonly bulbCharacteristics: any;
	/** Pour une puce d'INVOCATION : statistiques du bulbe invoqué. */
	readonly bulbStats: any;
	/** Cooldown restant de la puce pour une AUTRE entité que soi. */
	currentCooldownOf(entity: EntityLike): number;
	/** Zone d'effet réelle de la puce sur 'cell', lancée depuis 'from' (défaut : position courante). */
	effectiveArea(cell: CellLike, from?: CellLike): Cell[];
	/** Toutes les puces du jeu. */
	static getAll(): Chip[];
	/** La valeur est-elle un id de puce valide. */
	static isChip(value: any): boolean;
}

// Sous-types d'entité. Héritage exprimé par 'interface X extends Entity' (côté INSTANCE, structurel)
// plutôt que 'class X extends Entity' : ainsi le static side d'Entity (Entity.Type, Entity.Stat)
// n'est PAS propagé aux sous-classes, ce qui évite le conflit TS entre Entity.Type et
// Chest/Bulb/Mob.Type. 'x instanceof Bulb', l'assignabilité à Entity et les propriétés héritées
// fonctionnent identiquement (le runtime, lui, fait un vrai class extends).
/** Un poireau. */
declare class Leek {}
interface Leek extends Entity {}
/** Une tourelle d'équipe. */
declare class Turret {}
interface Turret extends Entity {}
/** Un bulbe invoqué. */
declare class Bulb {
	/** Sous-type de bulbe (Bulb.Type.PUNY...). */
	readonly type: number;
}
interface Bulb extends Entity {}
/** Un coffre (chasse aux coffres). */
declare class Chest {
	/** Sous-type de coffre (Chest.Type.WOOD...). */
	readonly type: number;
}
interface Chest extends Entity {}
/** Un monstre / boss. */
declare class Mob {
	/** Sous-type de monstre (Mob.Type.GRAAL...). */
	readonly type: number;
}
interface Mob extends Entity {}

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
	readonly damageReturn: number;
	readonly frequency: number;
	readonly cores: number;
	readonly ram: number;
	readonly cell: Cell;
	readonly weapon: Weapon | null;
	readonly weapons: Weapon[];
	readonly chips: Chip[];
	readonly effects: Effect[];
	readonly launchedEffects: Effect[];
	readonly passiveEffects: Feature[];
	readonly states: any[];
	readonly summons: Entity[];
	readonly summoner: Entity | null;
	readonly summoned: boolean;
	readonly alive: boolean;
	readonly dead: boolean;
	/** L'entité ne peut pas bouger (tourelle, coffre...). */
	readonly isStatic: boolean;
	readonly birthTurn: number;
	readonly turnOrder: number;
	readonly side: number;
	readonly leekID: number;
	readonly teamID: number;
	readonly teamName: string;
	readonly compositionName: string;
	readonly farmerID: number;
	readonly farmerName: string;
	readonly farmerCountry: string;
	readonly aiID: number;
	readonly aiName: string;
	isAlly(): boolean;
	isEnemy(): boolean;
	/** Valeur d'une caractéristique par sa constante (Entity.Stat.STRENGTH...). */
	stat(stat: number): number;
	distance(target: CellLike): number;
}

declare class Me extends Entity {
	/** Se rapproche de 'target' en dépensant au plus 'mp' PM (défaut : tous). */
	moveToward(target: CellLike, mp?: number): number;
	moveAwayFrom(target: CellLike, mp?: number): number;
	moveTowardCells(cells: CellLike[], mp?: number): number;
	moveTowardEntities(entities: EntityLike[], mp?: number): number;
	moveTowardLine(a: CellLike, b: CellLike, mp?: number): number;
	moveAwayFromCells(cells: CellLike[], mp?: number): number;
	moveAwayFromEntities(entities: EntityLike[], mp?: number): number;
	moveAwayFromLine(a: CellLike, b: CellLike, mp?: number): number;
	useWeapon(target: EntityLike): number;
	useWeaponOnCell(cell: CellLike): number;
	useChip(chip: ChipLike, target?: EntityLike): number;
	useChipOnCell(chip: ChipLike, cell: CellLike): number;
	setWeapon(weapon: WeaponLike): boolean;
	say(message: any): boolean;
	/** Fait dire « lama » à ton entité. */
	lama(): void;
	/** Peut-on utiliser l'arme courante sur 'target' — ou 'weapon' sur 'target' (2 arguments). */
	canUseWeapon(target: EntityLike): number;
	canUseWeapon(weapon: WeaponLike, target: EntityLike): number;
	/** Peut-on utiliser l'arme courante sur la case 'cell' — ou 'weapon' sur 'cell' (2 arguments). */
	canUseWeaponOnCell(cell: CellLike): number;
	canUseWeaponOnCell(weapon: WeaponLike, cell: CellLike): number;
	canUseChip(chip: ChipLike, target: EntityLike): number;
	canUseChipOnCell(chip: ChipLike, cell: CellLike): number;
	resurrect(target: EntityLike, cell: CellLike): number;
	/** Nombre d'utilisations de l'item (arme ou puce) ce tour. */
	itemUses(item: WeaponLike | ChipLike): number;
	/** Change l'équipement courant (nom du loadout). */
	setLoadout(name: string, keep?: boolean): boolean;
	/** Invoque un bulbe : 'callback' est rejouée à chaque tour du bulbe (me désigne alors le bulbe). */
	summon(chip: ChipLike, cell: CellLike, callback: () => void, name?: string): number;
	/** Cellule d'où utiliser l'arme (courante ou 'weapon') sur 'target' (une entité OU une case). */
	weaponCell(target: EntityLike | CellLike, weapon?: WeaponLike, ignoredCells?: CellLike[]): Cell | null;
	/** Toutes les cellules d'où utiliser l'arme sur 'target'. */
	weaponCells(target: EntityLike | CellLike, weapon?: WeaponLike, ignoredCells?: CellLike[]): Cell[];
	/** Cellule d'où utiliser 'chip' sur 'target' (une entité OU une case). */
	chipCell(chip: ChipLike, target: EntityLike | CellLike, ignoredCells?: CellLike[]): Cell | null;
	/** Toutes les cellules d'où utiliser 'chip' sur 'target'. */
	chipCells(chip: ChipLike, target: EntityLike | CellLike, ignoredCells?: CellLike[]): Cell[];
	/** Entités touchées si l'arme (courante ou 'weapon') est utilisée sur la case 'cell'. */
	weaponTargets(cell: CellLike, weapon?: WeaponLike): Entity[];
	/** Entités touchées si 'chip' est utilisée sur la case 'cell'. */
	chipTargets(chip: ChipLike, cell: CellLike): Entity[];
}

declare const Registers: {
	get(key: string): any;
	set(key: string, value: any): any;
	delete(key: string): any;
	all(): any;
};

declare const Fight: {
	/** L'IA courante (votre entité). */
	readonly me: Me;
	readonly turn: number;
	/** Id du combat. */
	readonly id: number;
	/** Type de combat (Fight.Type.SOLO...). */
	readonly type: number;
	/** Contexte du combat (Fight.Context.GARDEN...). */
	readonly context: number;
	/** Boss du combat (Fight.Boss.*), s'il y en a un. */
	readonly boss: number;
	readonly winner: number;
	/** Somme des PV des alliés / des ennemis. */
	readonly alliesLife: number;
	readonly enemiesLife: number;
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
	getDeadEnemiesCount(): number;
	getAlliedTurret(): Entity | null;
	getEnemyTurret(): Entity | null;
	/** Entité alliée/ennemie la plus proche d'une CELLULE. */
	getNearestEnemyToCell(cell: CellLike): Entity | null;
	getNearestAllyToCell(cell: CellLike): Entity | null;
	/** Joueur suivant / précédent dans l'ordre de jeu (défaut : relatif à soi). */
	getNextPlayer(entity?: EntityLike): Entity | null;
	getPreviousPlayer(entity?: EntityLike): Entity | null;
	/** Paroles prononcées (say) par les entités : liste de [entité, message]. */
	listen(): any[][];
};

declare const Field: {
	readonly type: number;
	cellFromXY(x: number, y: number): Cell | null;
	getObstacles(): Cell[];
	distance(a: CellLike, b: CellLike): number;
	cellDistance(a: CellLike, b: CellLike): number;
	pathLength(a: CellLike, b: CellLike, ignoredCells?: CellLike[]): number;
	lineOfSight(a: CellLike, b: CellLike, ignoredEntities?: EntityLike | EntityLike[]): boolean;
	/** Les deux cases sont-elles alignées (même ligne ou colonne). */
	onSameLine(a: CellLike, b: CellLike): boolean;
	/** Chemin (liste de cellules) de 'from' à 'to', en évitant 'ignoredCells'. */
	path(from: CellLike, to: CellLike, ignoredCells?: CellLike[]): Cell[];
};

declare const Network: {
	/** Envoie un message typé (Message.Type.*) à une entité alliée. */
	sendTo(entity: EntityLike, type: number, params: any): boolean;
	/** Envoie un message typé à toutes les entités alliées. */
	sendAll(type: number, params: any): void;
	/** Messages reçus (de 'entity' seulement si fourni). */
	getMessages(entity?: EntityLike): Message[];
};

declare const Debug: {
	/** Écrit dans le journal de combat, éventuellement en couleur (cf Color). console.log existe aussi. */
	log(value: any, color?: number): void;
	mark(cells: CellLike | CellLike[], color?: number, duration?: number): boolean;
	markText(cells: CellLike | CellLike[], text: any, color?: number, duration?: number): boolean;
	clearMarks(): void;
	show(cell: CellLike, color?: number): boolean;
	pause(): void;
};

declare const System: {
	/** Opérations consommées ce tour (à comparer à maxOperations pour borner une recherche). */
	readonly operations: number;
	readonly maxOperations: number;
	readonly instructionsCount: number;
	readonly usedRAM: number;
	readonly maxRAM: number;
	readonly date: string;
	readonly time: string;
	readonly timestamp: number;
};

declare const Color: {
	/** Compose une couleur depuis ses composantes 0-255. */
	rgb(r: number, g: number, b: number): number;
	red(color: number): number;
	green(color: number): number;
	blue(color: number): number;
};
`
