// Génère un fichier de déclarations TypeScript ambiant (`leekwars.d.ts`) décrivant l'API de combat
// LeekScript (fonctions + constantes), à partir des game data chargées (LeekWars.functions / .constants).
// Il alimente le language service TypeScript de Monaco : autocomplétion + typecheck des IA polyglot
// .ts/.js sur toute l'API de jeu, sans serveur. Régénéré à chaque chargement -> toujours en phase
// avec les game data (pas de fichier figé à committer).

import type { Constant } from '@/model/constant'
import type { LSFunction } from '@/model/function'

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

export function buildLeekwarsDeclarations(functions: readonly LSFunction[], constants: readonly Constant[]): string {
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

	for (const c of constants) {
		const name = safeName(c.name)
		if (!name || declared.has(name)) continue
		declared.add(name)
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
		for (let i = 0; i < argNames.length; i++) {
			// Nom réel s'il est un identifiant valide et unique dans la signature, sinon positionnel.
			let pname = safeName(argNames[i])
			if (!pname || usedParams.has(pname)) pname = 'a' + i
			usedParams.add(pname)
			// Règle TS : un paramètre optionnel ne peut pas être suivi d'un requis -> optionnel à partir du 1er.
			optionalFromHere = optionalFromHere || !!optional[i]
			params.push(`${pname}${optionalFromHere ? '?' : ''}: ${tsType(Number(argTypes[i]))}`)
		}
		out.push(`declare function ${name}(${params.join(', ')}): ${tsType(f.return_type)};`)
	}

	return out.join('\n') + '\n'
}
