import { describe, it, expect } from 'vitest'
// @ts-expect-error no types for monaco internals (esm/vs/**)
import { compile } from 'monaco-editor/esm/vs/editor/standalone/common/monarch/monarchCompile.js'
// @ts-expect-error no types for monaco internals (esm/vs/**)
import { MonarchTokenizer } from 'monaco-editor/esm/vs/editor/standalone/common/monarch/monarchLexer.js'
// @ts-expect-error no types for leekscript-monarch.js
import { buildLeekScriptMonarch } from './leekscript-monarch.js'

// On tokenise avec le vrai moteur Monarch de Monaco (compile + lexer), sans éditeur ni thème :
// `tokenize` (mode classique, non encodé) ne touche ni au DOM ni au theme service, seuls un
// languageService et un configurationService minimaux sont nécessaires.
interface MonarchToken { offset: number, type: string }
interface Tokenizer {
	getInitialState(): unknown
	tokenize(line: string, hasEOL: boolean, state: unknown): { tokens: MonarchToken[] }
}

const lexer = compile('leekscript', buildLeekScriptMonarch({ constants: ['CHIP_BANDAGE'], functions: ['getLife'], deprecatedFunctions: [] }))
const languageService = { languageIdCodec: { encodeLanguageId: () => 1, decodeLanguageId: () => 'leekscript' } }
const configurationService = { getValue: () => 20000, onDidChangeConfiguration: () => ({ dispose() { /* noop */ } }) }

function tokenize(line: string): [number, string][] {
	const tokenizer = new MonarchTokenizer(languageService, null, 'leekscript', lexer, configurationService) as Tokenizer
	const result = tokenizer.tokenize(line, true, tokenizer.getInitialState())
	return result.tokens.map((token) => [token.offset, token.type.replace(/\.js$/, '')])
}

describe('commentaires collés à un opérateur', () => {
	// La suite d'opérateurs (`symbols`) est gloutonne et contient `/` et `*` : sans garde-fou
	// elle avale le début du commentaire, qui perd alors sa couleur grise.
	const cases: [string, [number, string][]][] = [
		['! /**/', [[0, 'delimiter'], [1, ''], [2, 'comment']]],
		['!/**/', [[0, 'delimiter'], [1, 'comment']]],
		['!/** doc */', [[0, 'delimiter'], [1, 'comment.doc']]],
		['a =//x', [[0, 'identifier'], [1, ''], [2, 'delimiter'], [3, 'comment']]],
		['a/=b//c', [[0, 'identifier'], [1, 'delimiter'], [3, 'identifier'], [4, 'comment']]],
	]
	for (const [line, tokens] of cases) {
		it(line, () => {
			expect(tokenize(line)).toEqual(tokens)
		})
	}
})

describe('les opérateurs contenant / ou * restent entiers', () => {
	const cases: [string, [number, string][]][] = [
		['a = b/2;', [[0, 'identifier'], [1, ''], [2, 'delimiter'], [3, ''], [4, 'identifier'], [5, 'delimiter'], [6, 'number'], [7, 'delimiter']]],
		['a /= 2', [[0, 'identifier'], [1, ''], [2, 'delimiter'], [4, ''], [5, 'number']]],
		['a **= 2', [[0, 'identifier'], [1, ''], [2, 'delimiter'], [5, ''], [6, 'number']]],
		['a *= 2', [[0, 'identifier'], [1, ''], [2, 'delimiter'], [4, ''], [5, 'number']]],
	]
	for (const [line, tokens] of cases) {
		it(line, () => {
			expect(tokenize(line)).toEqual(tokens)
		})
	}
})

// Grammaire dédiée : des natives normales (`abs`, `push`…), une native dépréciée (`getDistance`)
// et une constante, pour vérifier quel nom reste colorié en native et lequel redevient un
// identifiant du joueur.
const userLexer = compile('leekscript-user', buildLeekScriptMonarch({
	constants: ['CHIP_BANDAGE'],
	functions: ['abs', 'getLife', 'push', 'sqrt'],
	deprecatedFunctions: ['getDistance'],
}))

function tokenizeUser(line: string): [number, string][] {
	const tokenizer = new MonarchTokenizer(languageService, null, 'leekscript-user', userLexer, configurationService) as Tokenizer
	const result = tokenizer.tokenize(line, true, tokenizer.getInitialState())
	return result.tokens.map((token) => [token.offset, token.type.replace(/\.js$/, '')])
}

describe('un nom du joueur qui reprend celui d\'une native', () => {
	const cases: [string, [number, string][]][] = [
		// Le nom déclaré n'est pas la native, quelle que soit la forme du type de retour.
		['public static integer getDistance(Cell c1) {', [
			[0, 'keyword'], [6, ''], [7, 'keyword'], [13, ''], [14, 'keyword'], [21, ''], [22, 'identifier'],
			[33, 'delimiter.parenthesis'], [34, 'type.identifier'], [38, ''], [39, 'identifier'],
			[41, 'delimiter.parenthesis'], [42, ''], [43, 'delimiter.bracket'],
		]],
		['function getDistance(a, b) {', [
			[0, 'keyword'], [8, ''], [9, 'identifier'], [20, 'delimiter.parenthesis'], [21, 'identifier'],
			[22, 'delimiter'], [23, ''], [24, 'identifier'], [25, 'delimiter.parenthesis'], [26, ''], [27, 'delimiter.bracket'],
		]],
		['var getDistance = 1', [[0, 'keyword'], [3, ''], [4, 'identifier'], [15, ''], [16, 'delimiter'], [17, ''], [18, 'number']]],
		['Cell getDistance(Cell c) {', [
			[0, 'type.identifier'], [4, ''], [5, 'identifier'], [16, 'delimiter.parenthesis'], [17, 'type.identifier'],
			[21, ''], [22, 'identifier'], [23, 'delimiter.parenthesis'], [24, ''], [25, 'delimiter.bracket'],
		]],
		// Type générique : l'intérieur garde sa coloration (`integer` reste un mot-clé).
		['Map<Cell, integer> getDistance(Cell c) {', [
			[0, 'type.identifier'], [3, 'delimiter.angle'], [4, 'type.identifier'], [8, 'delimiter'], [9, ''],
			[10, 'keyword'], [17, 'delimiter.angle'], [18, ''], [19, 'identifier'], [30, 'delimiter.parenthesis'],
			[31, 'type.identifier'], [35, ''], [36, 'identifier'], [37, 'delimiter.parenthesis'], [38, ''], [39, 'delimiter.bracket'],
		]],
		// Membre d'une classe du joueur : `Cell` n'est pas une classe standard.
		['Cell.getDistance(c1, c2)', [
			[0, 'type.identifier'], [4, 'delimiter'], [5, 'identifier'], [16, 'delimiter.parenthesis'], [17, 'identifier'],
			[19, 'delimiter'], [20, ''], [21, 'identifier'], [23, 'delimiter.parenthesis'],
		]],
		['this.getDistance(c)', [
			[0, 'keyword'], [4, 'delimiter'], [5, 'identifier'], [16, 'delimiter.parenthesis'], [17, 'identifier'], [18, 'delimiter.parenthesis'],
		]],
		// … mais les natives SONT des méthodes des classes standard : `Field.getDistance` en est
		// une, `Array.push` et `a.push` aussi. Elles gardent leur coloration.
		['Field.getDistance(c1, c2)', [
			[0, 'type.identifier'], [5, 'delimiter'], [6, 'lsfunction-deprecated'], [17, 'delimiter.parenthesis'],
			[18, 'identifier'], [20, 'delimiter'], [21, ''], [22, 'identifier'], [24, 'delimiter.parenthesis'],
		]],
		['Array.push(a, 1)', [
			[0, 'type.identifier'], [5, 'delimiter'], [6, 'lsfunction'], [10, 'delimiter.parenthesis'], [11, 'identifier'],
			[12, 'delimiter'], [13, ''], [14, 'number'], [15, 'delimiter.parenthesis'],
		]],
		['a.push(1)', [[0, 'identifier'], [1, 'delimiter'], [2, 'lsfunction'], [6, 'delimiter.parenthesis'], [7, 'number'], [8, 'delimiter.parenthesis']]],
		// L'appel direct de la native reste bien signalé comme déprécié.
		['getDistance(c1, c2)', [
			[0, 'lsfunction-deprecated'], [11, 'delimiter.parenthesis'], [12, 'identifier'], [14, 'delimiter'], [15, ''],
			[16, 'identifier'], [18, 'delimiter.parenthesis'],
		]],
		['return abs(c1.x - c2.x)', [
			[0, 'keyword'], [6, ''], [7, 'lsfunction'], [10, 'delimiter.parenthesis'], [11, 'identifier'], [13, 'delimiter'],
			[14, 'identifier'], [15, ''], [16, 'delimiter'], [17, ''], [18, 'identifier'], [20, 'delimiter'], [21, 'identifier'],
			[22, 'delimiter.parenthesis'],
		]],
		// Le type de retour d'une lambda ressemble à une déclaration, mais ce qui suit est un APPEL.
		['var f = => real getLife()', [
			[0, 'keyword'], [3, ''], [4, 'identifier'], [5, ''], [6, 'delimiter'], [7, ''], [8, 'delimiter'], [10, ''],
			[11, 'keyword'], [15, ''], [16, 'lsfunction'], [23, 'delimiter.parenthesis'],
		]],
		// Une comparaison n'est pas un type générique : `>` ne déclare rien.
		['if (a > getLife()) {', [
			[0, 'keyword'], [2, ''], [3, 'delimiter.parenthesis'], [4, 'identifier'], [5, ''], [6, 'delimiter.angle'],
			[7, ''], [8, 'lsfunction'], [15, 'delimiter.parenthesis'], [18, ''], [19, 'delimiter.bracket'],
		]],
		// Les mots-clés et les constantes gardent leur couleur après un type, une majuscule ou un point.
		['CHIP_BANDAGE in chips', [[0, 'lsconstant'], [12, ''], [13, 'keyword'], [15, ''], [16, 'identifier']]],
		['this.class', [[0, 'keyword'], [4, 'delimiter'], [5, 'keyword']]],
		['var x = 1.5', [[0, 'keyword'], [3, ''], [4, 'identifier'], [5, ''], [6, 'delimiter'], [7, ''], [8, 'number.float']]],
	]
	for (const [line, tokens] of cases) {
		it(line, () => {
			expect(tokenizeUser(line)).toEqual(tokens)
		})
	}
})
