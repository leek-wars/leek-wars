import { describe, it, expect } from 'vitest'
import { escapeMarkdownText, mergeCompletionDocumentation } from './markdown-safe'

describe('escapeMarkdownText', () => {
	it('laisse un nom de fichier normal lisible', () => {
		expect(escapeMarkdownText('modules/util.py')).toBe('modules/util.py')
	})

	it('échappe la ponctuation du markdown', () => {
		expect(escapeMarkdownText('a"b')).toBe('a\\"b')
		expect(escapeMarkdownText('a[b]c')).toBe('a\\[b\\]c')
		expect(escapeMarkdownText('a(b)c')).toBe('a\\(b\\)c')
		expect(escapeMarkdownText('a`b')).toBe('a\\`b')
	})

	it('échappe le backslash AVANT le reste', () => {
		expect(escapeMarkdownText('a\\"b')).toBe('a\\\\\\"b')
	})

	it('échappe une chaîne riche en ponctuation', () => {
		const input = 'notes (v2) [copie] "final".leek'
		const escaped = escapeMarkdownText(input)
		// plus aucune parenthèse/crochet/guillemet non échappé
		expect(escaped).not.toMatch(/(^|[^\\])[[\]()"]/)
		expect(escaped).toContain('final')  // le texte reste visible
	})

	it('replie les retours à la ligne', () => {
		expect(escapeMarkdownText('a\nb\r\nc')).toBe('a b c')
	})
})

describe('mergeCompletionDocumentation', () => {
	const docstring = '[Doc](https://example.com)'

	it('ne marque pas le résultat isTrusted', () => {
		const merged = mergeCompletionDocumentation(docstring, '📖 [Documentation](https://leekwars.com/help/documentation/getLife)')
		expect(merged).not.toHaveProperty('isTrusted')
		expect((merged as Record<string, unknown>).isTrusted).toBeUndefined()
	})

	it('sans doc préexistante non plus', () => {
		expect(mergeCompletionDocumentation(docstring)).not.toHaveProperty('isTrusted')
	})

	it('conserve les deux contenus dans l’ordre (Pyright puis lien LW)', () => {
		const merged = mergeCompletionDocumentation('def f() -> int', '📖 lien')
		expect(merged.value).toBe('def f() -> int\n\n📖 lien')
	})
})
