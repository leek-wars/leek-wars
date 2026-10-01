import { describe, it, expect } from 'vitest'
import { escapeMarkdownText, mergeCompletionDocumentation } from './markdown-safe'

describe('escapeMarkdownText', () => {
	it('laisse un nom de fichier normal lisible', () => {
		expect(escapeMarkdownText('modules/util.py')).toBe('modules/util.py')
	})

	it('échappe les caractères qui referment un lien ou son attribut title', () => {
		expect(escapeMarkdownText('a"b')).toBe('a\\"b')
		expect(escapeMarkdownText('a[b]c')).toBe('a\\[b\\]c')
		expect(escapeMarkdownText('a(b)c')).toBe('a\\(b\\)c')
		expect(escapeMarkdownText('a`b')).toBe('a\\`b')
	})

	it('échappe le backslash AVANT le reste', () => {
		// Sans échappement du backslash, `\` + `"` ferait de la guillemet un caractère littéral et
		// l'échappement suivant serait annulé.
		expect(escapeMarkdownText('a\\"b')).toBe('a\\\\\\"b')
	})

	it('échappe une chaîne qui contient elle-même un lien markdown', () => {
		const input = 'x" ) [a](b:c?{"d":"e"}) ("y'
		const escaped = escapeMarkdownText(input)
		// plus aucune parenthèse/crochet/guillemet non échappé
		expect(escaped).not.toMatch(/(^|[^\\])[[\]()"]/)
		expect(escaped).toContain('b:c')  // le texte reste visible
	})

	it('replie les retours à la ligne (une nouvelle ligne terminerait le lien)', () => {
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
