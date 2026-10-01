import { describe, expect, it } from 'vitest'
import { buildSearchRegExp, searchText, type SearchOptions } from './search'

const opts = (query: string, o: Partial<SearchOptions> = {}): SearchOptions => ({ query, caseSensitive: false, wholeWord: false, regex: false, ...o })
const find = (code: string, o: SearchOptions, limit = 100) => searchText(code, buildSearchRegExp(o)!, limit)

describe('buildSearchRegExp', () => {
	it('une recherche vide ne cherche rien', () => {
		expect(buildSearchRegExp(opts(''))).toBeNull()
	})

	it('le texte est littéral hors mode regex', () => {
		expect(find('a.b axb', opts('a.b')).map(m => m.column)).toEqual([0])
		expect(find('f(x) + [1]', opts('(x)')).map(m => m.column)).toEqual([1])
	})

	it('une regex invalide lève une erreur', () => {
		expect(() => buildSearchRegExp(opts('(', { regex: true }))).toThrow(SyntaxError)
	})
})

describe('searchText', () => {
	const code = 'var Leek = 1\n\tvar leekLife = getLife(Leek)\n// leek'

	it('insensible à la casse par défaut, lignes 1-based et colonnes 0-based', () => {
		expect(find(code, opts('leek')).map(m => [m.line, m.column])).toEqual([[1, 4], [2, 5], [2, 24], [3, 3]])
	})

	it('respecte la casse sur demande', () => {
		expect(find(code, opts('Leek', { caseSensitive: true })).map(m => [m.line, m.column])).toEqual([[1, 4], [2, 24]])
	})

	it('mot entier', () => {
		expect(find(code, opts('leek', { wholeWord: true })).map(m => [m.line, m.column])).toEqual([[1, 4], [2, 24], [3, 3]])
	})

	it('expression régulière', () => {
		const r = find(code, opts('get\\w+\\(', { regex: true }))
		expect(r).toHaveLength(1)
		expect(r[0]).toMatchObject({ line: 2, column: 16, length: 8, match: 'getLife(' })
	})

	it('l\'extrait coupe l\'indentation en tête de ligne', () => {
		const [m] = find(code, opts('leekLife'))
		expect(m.before).toBe('var ')
		expect(m.after).toBe(' = getLife(Leek)')
	})

	it('l\'extrait d\'une longue ligne commence par une ellipse', () => {
		const [m] = find('x'.repeat(100) + 'needle', opts('needle'))
		expect(m.before).toBe('…' + 'x'.repeat(16))
		expect(m.column).toBe(100)
	})

	it('ignore les correspondances vides sans boucler', () => {
		expect(find('abc\n\nd', opts('x*', { regex: true }))).toEqual([])
		expect(find('abc', opts('^', { regex: true }))).toEqual([])
	})

	it('s\'arrête à la limite', () => {
		expect(find('a a a a a', opts('a'), 3)).toHaveLength(3)
		expect(find('a', opts('a'), 0)).toHaveLength(0)
	})

	it('accepte les fins de ligne Windows', () => {
		expect(find('a\r\nb\r\nb', opts('b')).map(m => m.line)).toEqual([2, 3])
	})
})
