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
	// elle avale le début du commentaire, qui perd alors sa couleur grise (issue #4754).
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
