import { describe, it, expect, vi, beforeEach } from 'vitest'

// latexify charge katex + son CSS en dynamic import (lazy). On mocke les deux : le CSS
// n'a aucun effet en test, et renderToString est remplacé par une fonction inspectable
// pour vérifier le rendu, les macros passées et le fallback en cas d'erreur.
const k = vi.hoisted(() => ({ renderToString: vi.fn((f: string) => `KATEX(${f})`) }))
vi.mock('katex', () => ({ renderToString: k.renderToString, default: { renderToString: k.renderToString } }))
vi.mock('katex/dist/katex.min.css', () => ({ default: {} }))

import { Latex } from '@/model/latex'

beforeEach(() => {
	k.renderToString.mockReset()
	k.renderToString.mockImplementation((f: string) => `KATEX(${f})`)
})

describe('Latex.latexify', () => {
	it('laisse le HTML intact quand il n\'y a pas de $...$', async () => {
		expect(await Latex.latexify('hello world')).toBe('hello world')
		expect(k.renderToString).not.toHaveBeenCalled()
	})

	it('un $ seul (non apparié) n\'est pas interprété', async () => {
		expect(await Latex.latexify('price is $5')).toBe('price is $5')
		expect(k.renderToString).not.toHaveBeenCalled()
	})

	it('remplace un $...$ par un span titré avec le rendu katex', async () => {
		expect(await Latex.latexify('a $x^2$ b')).toBe('a <span title="x^2">KATEX(x^2)</span> b')
	})

	it('remplace plusieurs formules sur la même ligne', async () => {
		expect(await Latex.latexify('$a$ et $b$')).toBe('<span title="a">KATEX(a)</span> et <span title="b">KATEX(b)</span>')
	})

	it('passe les macros maison (\\R → \\mathbb{R}) à katex', async () => {
		await Latex.latexify('$\\R$')
		const opts = k.renderToString.mock.calls[0][1] as { macros: Record<string, string> }
		expect(opts.macros['\\R']).toBe('\\mathbb{R}')
		expect(opts.macros['\\iff']).toBe('\\Leftrightarrow')
	})

	it('conserve la formule brute si katex lève une erreur', async () => {
		k.renderToString.mockImplementation((f: string) => {
			if (f === 'bad') { throw new Error('parse error') }
			return `KATEX(${f})`
		})
		expect(await Latex.latexify('ok $good$ puis $bad$ fin')).toBe('ok <span title="good">KATEX(good)</span> puis $bad$ fin')
	})
})
