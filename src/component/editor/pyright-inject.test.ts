import { describe, it, expect } from 'vitest'
import { injectImport, IMPORT } from './pyright-inject'

describe('injectImport', () => {
	it('insère en tête pour du code normal (offset 0)', () => {
		const r = injectImport('me = Fight.me\nme.useWeapon(enemy)')
		expect(r.line).toBe(0)
		expect(r.text).toBe(`${IMPORT}\nme = Fight.me\nme.useWeapon(enemy)`)
	})

	it('insère APRÈS `from __future__` (qui doit rester la 1re instruction)', () => {
		const r = injectImport('from __future__ import annotations\nme = Fight.me')
		expect(r.line).toBe(1)
		expect(r.text.split('\n')[0]).toBe('from __future__ import annotations')
		expect(r.text.split('\n')[1]).toBe(IMPORT)
		// __future__ reste bien en 1re position -> Pyright ne lèvera pas d'erreur d'ordre
		expect(r.text.indexOf('from __future__')).toBeLessThan(r.text.indexOf(IMPORT))
	})

	it('saute docstring + commentaires + lignes vides avant un __future__', () => {
		const code = '"""Mon IA."""\n# commentaire\n\nfrom __future__ import annotations\nme = Fight.me'
		const r = injectImport(code)
		const lines = r.text.split('\n')
		expect(lines[r.line]).toBe(IMPORT)
		// l'import est APRÈS le docstring, les commentaires et le __future__
		expect(r.line).toBe(4)
		expect(lines.indexOf('from __future__ import annotations')).toBeLessThan(r.line)
	})

	it('gère un docstring multi-ligne', () => {
		const code = '"""\nplusieurs\nlignes\n"""\nme = Fight.me'
		const r = injectImport(code)
		expect(r.line).toBe(4) // juste avant `me = Fight.me`
		expect(r.text.split('\n')[4]).toBe(IMPORT)
	})

	it('ne confond pas une chaîne triple-quote assignée avec un docstring', () => {
		// `x = """..."""` n'est PAS un docstring de module -> l'import s'insère avant (offset 0)
		const r = injectImport('x = """hello"""\nprint(x)')
		expect(r.line).toBe(0)
	})
})
