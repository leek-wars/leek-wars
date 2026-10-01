import { describe, expect, it } from 'vitest'
import { markInvisibleCharacters } from '@/component/editor/invisible-characters'

// Construits par code point : un caractère invisible écrit tel quel dans ce fichier ne se
// verrait pas à la relecture.
const ch = (code: number) => String.fromCodePoint(code)
const ZWSP = ch(0x200b)

describe('markInvisibleCharacters', () => {
	it('entoure un espace de largeur nulle sans le retirer du texte', () => {
		expect(markInvisibleCharacters('"fa' + ZWSP + 'lse"'))
			.toBe('"fa<span class="t-invisible" title="U+200B">' + ZWSP + '</span>lse"')
	})

	it('signale aussi les marques bidi, le BOM, les remplisseurs hangûl…', () => {
		for (const code of [0x202e, 0x2066, 0x200f, 0xfeff, 0x00ad, 0x0007, 0x200c, 0x3164, 0x115f, 0x2800]) {
			expect(markInvisibleCharacters(ch(code)), code.toString(16)).toContain('class="t-invisible"')
		}
	})

	it('laisse tabulations, espaces, espaces insécables et emojis composés', () => {
		const family = ch(0x1f468) + ch(0x200d) + ch(0x1f469) + ch(0x200d) + ch(0x1f467)
		const heart = ch(0x2764) + ch(0xfe0f)
		const text = '\tif (a) { b }  ' + family + heart + ch(0xa0) + '\r'
		expect(markInvisibleCharacters(text)).toBe(text)
	})
})
