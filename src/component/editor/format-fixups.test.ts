import { describe, it, expect } from 'vitest'
import { applyFormatFixups } from './format-fixups'

describe('applyFormatFixups', () => {
	it('rend l\'espace avant la parenthèse des mots-clés logiques (#2961)', () => {
		expect(applyFormatFixups('if (a and(b) or(c)) {')).toBe('if (a and (b) or (c)) {')
		expect(applyFormatFixups('var x = a xor(b)')).toBe('var x = a xor (b)')
		expect(applyFormatFixups('var x = not(b)')).toBe('var x = not (b)')
		expect(applyFormatFixups('var x = a instanceof(B)')).toBe('var x = a instanceof (B)')
		expect(applyFormatFixups('var x = a as(integer)')).toBe('var x = a as (integer)')
	})

	it('ne touche pas aux identifiants qui se terminent par un mot-clé', () => {
		expect(applyFormatFixups('var x = bias(2)')).toBe('var x = bias(2)')
		expect(applyFormatFixups('var x = cannot(2)')).toBe('var x = cannot(2)')
		expect(applyFormatFixups('var x = anor(2)')).toBe('var x = anor(2)')
	})

	it('répare les opérateurs découpés par js-beautify', () => {
		expect(applyFormatFixups('var x = 10 \\ = 2')).toBe('var x = 10  \\= 2')
		expect(applyFormatFixups('for (var i in 1 . . 10)')).toBe('for (var i in 1 .. 10)')
		expect(applyFormatFixups('var f = x - > x * 2')).toBe('var f = x -> x * 2')
	})

	it('laisse les chaînes et les commentaires intacts', () => {
		expect(applyFormatFixups('debug("a and(b)")')).toBe('debug("a and(b)")')
		expect(applyFormatFixups("debug('x - > y')")).toBe("debug('x - > y')")
		expect(applyFormatFixups('// a and(b)')).toBe('// a and(b)')
		expect(applyFormatFixups('/* a and(b) */')).toBe('/* a and(b) */')
		// une chaîne contenant un guillemet échappé ne doit pas décaler la segmentation
		expect(applyFormatFixups('debug("a \\" and(b)") and(c)')).toBe('debug("a \\" and(b)") and (c)')
	})

	it('corrige le code autour des chaînes', () => {
		expect(applyFormatFixups('if (a and(b)) { debug("and(x)") } or(c)'))
			.toBe('if (a and (b)) { debug("and(x)") } or (c)')
	})
})
