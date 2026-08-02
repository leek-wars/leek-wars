import { buildObjectApiModel, OBJECT_MEMBER_LS, type ApiMember } from '@/component/editor/leekwars-dts'
import type { DocLanguage } from '@/model/doc-language'
import { stdlibEquivalent } from '@/model/doc-stdlib'

/**
 * Signature d'une fonction rendue dans le langage que le lecteur a choisi.
 *
 * En LeekScript (v4) l'API est PLATE (`getLife(entity)`) ; en JS/TS/Python elle est OBJET
 * (`entity.life`), et les trois langages polyglot partagent exactement les mêmes noms de
 * membres. La correspondance vit dans `OBJECT_MEMBER_LS` (membre objet -> nom plat), déjà
 * utilisée par le survol Monaco : on l'inverse ici plutôt que d'en tenir une deuxième.
 *
 * Les TYPES ne viennent pas du registre plat, qui est trop grossier pour l'API objet :
 * `getCell` y déclare `entier` (un id de cellule) alors que `Entity.cell` renvoie un objet
 * `Cell`. On lit donc les déclarations TypeScript (`buildObjectApiModel`), qui sont la
 * source de vérité de l'API objet.
 */

export interface ObjectSignature {
	/** Chemin canonique : `Entity.life`, `Field.cellFromXY`, `Me.useWeapon`. */
	path: string
	container: string
	member: string
	kind: 'method' | 'property'
	/** Signature TypeScript telle que déclarée : `life: number`, `distance(target: CellLike): number`. */
	typescript: string
	/** Même signature translittérée en Python. */
	python: string
	/** Vrai pour un équivalent de bibliothèque standard du langage hôte, pas de l'API objet. */
	stdlib?: boolean
}

let _flatToPath: Record<string, string> | null = null

/**
 * Inverse de `OBJECT_MEMBER_LS`. Plusieurs membres objet peuvent viser la même fonction plate
 * (`Cell.distance`, `Entity.distance`, `Field.distance` et `Field.cellDistance` pointent tous
 * vers `getCellDistance`) : on garde le PREMIER, l'ordre de la table allant du plus spécifique
 * au plus général, et c'est celui qu'un lecteur cherchant `getCellDistance` veut voir.
 */
export function flatToObjectPath(): Record<string, string> {
	if (_flatToPath) return _flatToPath
	const map: Record<string, string> = {}
	for (const [path, flat] of Object.entries(OBJECT_MEMBER_LS)) {
		if (!(flat in map)) map[flat] = path
	}
	_flatToPath = map
	return map
}

/**
 * Fonction plate correspondant à un chemin objet (`Entity.life` -> `getLife`), ou null.
 *
 * Sert à résoudre les URLs : une page d'encyclopédie est titrée du nom PLAT, mais un lecteur
 * en Python voit `Entity.life` partout et va légitimement taper cette adresse. On redirige
 * côté client plutôt que d'ajouter une macro `{{alias:...}}` dans le contenu des ~343 pages :
 * la macro est extraite par le serveur (`extractAliases`) MAIS aussi affichée au lecteur
 * («Aussi appelé : …»), ce qui polluerait la page de tous ceux qui lisent en LeekScript.
 */
export function flatNameForObjectPath(path: string): string | null {
	const trimmed = path.trim()
	if (!trimmed.includes('.')) return null
	if (trimmed in OBJECT_MEMBER_LS) return OBJECT_MEMBER_LS[trimmed]
	// Tolérance sur le receveur : `entity.life` ou `me.useWeapon` aussi bien que `Entity.life`.
	const [receiver, member] = trimmed.split('.')
	if (!member) return null
	const capitalized = receiver.charAt(0).toUpperCase() + receiver.slice(1) + '.' + member
	if (capitalized in OBJECT_MEMBER_LS) return OBJECT_MEMBER_LS[capitalized]
	if (receiver.toLowerCase() === 'me') {
		return OBJECT_MEMBER_LS['Me.' + member] ?? OBJECT_MEMBER_LS['Entity.' + member] ?? null
	}
	return null
}

/** Types TS -> Python. Les noms de classes de l'API (Cell, Entity, Weapon...) sont identiques. */
const PYTHON_TYPES: { [ts: string]: string } = {
	number: 'int', boolean: 'bool', string: 'str', void: 'None',
	any: 'Any', null: 'None', undefined: 'None', unknown: 'Any',
}

/**
 * Translittère un type TypeScript en Python. `Cell[]` -> `list[Cell]`, `X | null` -> `X | None`,
 * `Record<string, string>` -> `dict[str, str]`.
 *
 * `number` devient `int` : dans l'API de jeu la quasi-totalité des nombres sont des entiers
 * (vie, PT, PM, ids de cellule, compteurs). Les rares réels (distance euclidienne) sont
 * corrigés par le type de retour du registre plat, cf. `refineNumber`.
 */
export function typescriptTypeToPython(type: string): string {
	const trimmed = type.trim()
	const record = trimmed.match(/^Record<\s*([^,]+),\s*(.+)>$/)
	if (record) return `dict[${typescriptTypeToPython(record[1])}, ${typescriptTypeToPython(record[2])}]`
	if (trimmed.includes('|')) return trimmed.split('|').map(typescriptTypeToPython).join(' | ')
	if (trimmed.endsWith('[]')) return `list[${typescriptTypeToPython(trimmed.slice(0, -2))}]`
	return PYTHON_TYPES[trimmed] ?? trimmed
}

/**
 * Précise `int` en `float` quand le registre LeekScript déclare un réel (type 7) ou un nombre
 * indifférencié (type 1). Sans ça `Field.euclideanDistance` afficherait `int` en Python alors
 * qu'elle renvoie un réel.
 */
function refineNumber(pythonSignature: string, returnTypeCode: number | undefined): string {
	if (returnTypeCode === 7) return pythonSignature.replace(/\bint\b(?![^(]*\()/, 'float')
	if (returnTypeCode === 1) return pythonSignature.replace(/\bint\b(?![^(]*\()/, 'int | float')
	return pythonSignature
}

function findMember(container: string, member: string): ApiMember | null {
	const model = buildObjectApiModel()
	const inInstance = (model.members[container] ?? []).find(m => m.name === member)
	if (inInstance) return inInstance
	return (model.statics[container] ?? []).find(m => m.name === member) ?? null
}

/**
 * Signature objet d'une fonction plate LeekScript, ou null si elle n'a pas d'équivalent —
 * cas des fonctions dépréciées (`getForce`) et de celles retirées avant la v4 (`getLeek`),
 * que l'API objet n'a volontairement pas reprises.
 */
export function objectSignatureOf(flatName: string, returnTypeCode?: number, language?: DocLanguage): ObjectSignature | null {
	// La stdlib n'est pas dans l'API objet du runtime : en JS/TS et en Python c'est celle du
	// langage hôte. `abs` -> `Math.abs` en TS, `abs` natif en Python. On la consulte d'abord,
	// car ces noms n'ont par construction aucune entrée dans OBJECT_MEMBER_LS.
	if (language) {
		const stdlib = stdlibEquivalent(flatName, language)
		if (stdlib) {
			const [container, ...rest] = stdlib.path.split('.')
			return {
				path: stdlib.path,
				container,
				member: rest.join('.') || stdlib.path,
				kind: 'method',
				typescript: stdlib.signature,
				python: stdlib.signature,
				stdlib: true,
			}
		}
	}
	const path = flatToObjectPath()[flatName]
	if (!path) return null
	const [container, member] = path.split('.')
	const declared = findMember(container, member)
	if (!declared) return null
	const python = declared.kind === 'property'
		? `${member}: ${typescriptTypeToPython(declared.detail.slice(member.length + 2))}`
		: declared.detail.replace(/:\s*([^,()]+)(?=[,)])/g, (_, t) => `: ${typescriptTypeToPython(t)}`)
			.replace(/\):\s*(.+)$/, (_, t) => `) -> ${typescriptTypeToPython(t)}`)
	return {
		path,
		container,
		member,
		kind: declared.kind,
		typescript: declared.detail,
		python: refineNumber(python, returnTypeCode),
	}
}

/**
 * Receveur à afficher devant un membre d'instance. `Me.*` s'appelle sur `Fight.me` (le
 * poireau courant) ; les autres classes sur une instance quelconque, nommée d'après la classe.
 */
export function receiverFor(container: string, language: DocLanguage): string | null {
	if (container === 'Me') return 'Fight.me'
	const model = buildObjectApiModel()
	if (model.singletons.includes(container)) return null // Fight.turn, Field.cellFromXY : pas de receveur
	void language
	return container.charAt(0).toLowerCase() + container.slice(1)
}
