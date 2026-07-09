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

// Lien Markdown vers la page de doc LeekScript du symbole (fonction ou constante). Monaco rend le
// Markdown au survol -> lien cliquable qui ouvre /help/documentation/<symbole> (la doc du symbole,
// dans la langue du joueur via son locale). Réutilise la doc LeekScript existante pour JS/TS/Python.
function docLink(symbol: string): string {
	return `📖 [Documentation](https://leekwars.com/help/documentation/${symbol})`
}

// JSDoc d'une fonction plate : description + @param (noms de la signature émise) + @returns +
// @deprecated + lien vers la doc LeekScript du symbole.
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
	lines.push(docLink(name)) // toujours le lien doc, même sans description
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
	{ prefix: 'MESSAGE_', container: 'Fight', sub: 'Message' },
	{ prefix: 'MAP_', container: 'Field' },
	{ prefix: 'EFFECT_', container: 'Effect' },
	{ prefix: 'STATE_', container: 'State' },
]
// Conteneurs qui sont des objets `const` (pas des classes) : namespace-merge impossible -> on injecte
// leurs constantes INLINE dans la déclaration de l'objet (cf renderInlineContainer).
const CONST_OBJECT_CONTAINERS = new Set(['Fight', 'Field'])

type ConstMember = { member: string, full: string, doc?: string, isInstance: boolean }
type ConstBucket = { direct: ConstMember[], subs: Record<string, ConstMember[]> }

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
	// Constantes rangées par conteneur : container -> { direct, subs }. Émises en fin de fichier
	// (namespaces mergés aux classes, ou inline pour Fight/Field). La globale plate n'est PAS émise
	// -> le style objet remplace WEAPON_PISTOL par Weapon.pistol (globale conservée au runtime).
	const collected: Record<string, ConstBucket> = {}
	const bucketFor = (container: string): ConstBucket => (collected[container] ||= { direct: [], subs: {} })

	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || declared.has(name)) continue
		declared.add(name)
		const cdoc = doc?.('const_' + name)
		const rule = CONST_CONTAINERS.find((r) => name.startsWith(r.prefix))
		if (rule) {
			const raw = name.slice(rule.prefix.length)
			const entry: ConstMember = { member: rule.item ? camelCase(raw) : raw, full: name, doc: cdoc, isInstance: !!rule.item }
			const b = bucketFor(rule.container)
			if (rule.sub) (b.subs[rule.sub] ||= []).push(entry)
			else b.direct.push(entry)
			continue
		}
		out.push(renderJsdoc(cdoc ? [sanitizeDoc(cdoc), docLink(name)] : [docLink(name)], ''))
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
	let objBlock = doc ? annotateObjectApi(OBJECT_API_DECLARATIONS, doc) : OBJECT_API_DECLARATIONS
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

// Alias minuscules employés dans les pointeurs de DEPRECATED_FLAT -> nom de la classe/const déclarée.
const OO_ALIAS: Record<string, string> = { me: 'Me', entity: 'Entity', cell: 'Cell', weapon: 'Weapon', chip: 'Chip' }

// Membres de l'API objet qui n'ont PAS d'équivalent plat déprécié (donc absents de DEPRECATED_FLAT)
// mais qui correspondent quand même à une fonction LS documentée : on les mappe à la main pour que
// leur survol hérite de la description LS + du lien de doc. Ne lister QUE des fonctions ayant une
// entrée `func_<name>` dans doc.*.lang (sinon pas de description ET page de doc potentiellement absente).
const OBJECT_DOC_EXTRA: Record<string, string> = {
	'Me.weaponCells': 'getCellsToUseWeapon', 'Me.chipCells': 'getCellsToUseChip',
	'Me.weaponTargets': 'getWeaponTargets', 'Me.chipTargets': 'getChipTargets',
	'Weapon.needsLos': 'weaponNeedLos', 'Chip.needsLos': 'chipNeedLos',
	'Chip.features': 'getChipEffects', 'Cell.content': 'getCellContent', 'Cell.path': 'getPath',
	'Fight.getNearestEnemyToCell': 'getNearestEnemyToCell', 'Fight.getNearestAllyToCell': 'getNearestAllyToCell',
}

// Construit la table membre objet -> nom de fonction LS, en inversant DEPRECATED_FLAT (qui encode
// déjà la correspondance fonction plate -> forme objet) puis en fusionnant OBJECT_DOC_EXTRA. Clé =
// `Conteneur.membre` (désambiguïse les membres homonymes entre classes, ex: Cell.distance vs
// Field.distance). Ainsi la doc de survol de `Fight.getAliveEnemies()` réutilise
// `doc.func_getAliveEnemies`, source unique traduite en 18 langues.
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
	for (const key in OBJECT_DOC_EXTRA) if (!(key in map)) map[key] = OBJECT_DOC_EXTRA[key]
	return map
}

// Ajoute une ligne lien de doc dans le bloc de commentaire JSDoc écrit à la main qui se termine à
// out[out.length-1] (repéré par son ouverture commentStart). Gère la forme courte `/** desc */`
// (convertie en multi-lignes) et la forme multi-lignes (le lien s'insère avant la ligne ` */`).
function injectDocLink(out: string[], commentStart: number, link: string): void {
	const end = out.length - 1
	if (commentStart === end) {
		const m = out[end].match(/^(\s*)\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/)
		if (!m) return
		const ind = m[1]
		out[end] = `${ind}/**\n${ind} * ${m[2]}\n${ind} * ${link}\n${ind} */`
	} else {
		const ind = (out[end].match(/^(\s*)\*\//)?.[1] ?? '').replace(/\s$/, '')
		out.splice(end, 0, `${ind} * ${link}`)
	}
}

// Injecte des blocs JSDoc dans les déclarations objet statiques : pour chaque membre qui correspond
// à une fonction LS documentée, on préfixe sa description (et @returns pour les méthodes non-void) +
// un lien vers la page de doc. Si le membre a déjà un commentaire écrit à la main (Effect, me...),
// on ne réécrit pas sa description mais on y insère quand même le lien de doc. Membres sans
// équivalent LS : laissés tels quels.
function annotateObjectApi(block: string, doc: DocLookup): string {
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
		} else {
			// Membre : indentation + [readonly] identifiant suivi de `(` (méthode) ou `:` (propriété).
			const memberM = line.match(/^(\s+)(?:readonly\s+)?([A-Za-z_]\w*)\s*[(:]/)
			if (container && memberM) {
				const [, indent, member] = memberM
				const lsName = memberToLs[container + '.' + member]
				if (lsName) {
					if (prevWasComment && commentStart >= 0) {
						// Déjà commenté à la main : on ajoute juste le lien de doc au bloc existant.
						injectDocLink(out, commentStart, docLink(lsName))
					} else if (!prevWasComment) {
						const desc = doc('func_' + lsName)
						const jlines: string[] = []
						if (desc) jlines.push(sanitizeDoc(desc))
						const isMethod = line.slice(line.indexOf(member) + member.length).trimStart().startsWith('(')
						if (isMethod && !/:\s*void\s*;?\s*$/.test(line)) {
							const r = doc('func_' + lsName + '_return')
							if (r) jlines.push(`@returns ${sanitizeDoc(r)}`)
						}
						jlines.push(docLink(lsName))
						out.push(renderJsdoc(jlines, indent))
					}
				}
			}
		}
		if (trimmed.startsWith('/**')) commentStart = out.length // ligne d'ouverture (poussée juste après)
		out.push(line)
		prevWasComment = trimmed.endsWith('*/')
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
	/** Contenu de la case (Cell.Type.EMPTY/PLAYER/ENTITY/OBSTACLE). */
	readonly content: number;
	distance(target: CellLike): number;
	pathLength(target: CellLike): number;
	lineOfSight(target: CellLike): boolean;
	/** Chemin (liste de cellules) jusqu'à la cible, en évitant 'ignoredCells'. */
	path(target: CellLike, ignoredCells?: CellLike[]): Cell[];
}

/** Base commune aux armes et puces. Porte les constantes partagées (Item.LaunchType, Item.Area). */
declare class Item {
	readonly id: number;
}

declare class Weapon extends Item {
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
	readonly needsLos: boolean;
	/** Caractéristiques déclarées de l'arme (dégâts, poison, téléport...). cf Feature. */
	readonly features: Feature[];
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
	/** Caractéristiques déclarées de la puce. cf Feature. */
	readonly features: Feature[];
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
	/** Entité alliée/ennemie la plus proche d'une CELLULE. */
	getNearestEnemyToCell(cell: CellLike): Entity | null;
	getNearestAllyToCell(cell: CellLike): Entity | null;
};

declare const Field: {
	readonly type: number;
	cellFromXY(x: number, y: number): Cell | null;
	getObstacles(): Cell[];
	distance(a: CellLike, b: CellLike): number;
	cellDistance(a: CellLike, b: CellLike): number;
	pathLength(a: CellLike, b: CellLike): number;
	lineOfSight(a: CellLike, b: CellLike): boolean;
	/** Chemin (liste de cellules) de 'from' à 'to', en évitant 'ignoredCells'. */
	path(from: CellLike, to: CellLike, ignoredCells?: CellLike[]): Cell[];
};

declare const Debug: {
	mark(cells: CellLike | CellLike[], color?: number, duration?: number): boolean;
	markText(cells: CellLike | CellLike[], text: any, color?: number, duration?: number): boolean;
	clearMarks(): void;
	show(cell: CellLike, color?: number): boolean;
	pause(): void;
};
`
