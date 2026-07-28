import { describe, it, expect } from 'vitest'
import { escapeMarkdownText } from './markdown-safe'

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

	it('échappe le backslash AVANT le reste (pas de ré-ouverture de brèche)', () => {
		// Sans échappement du backslash, `\` + `"` ferait de la guillemet un caractère littéral et
		// l'échappement suivant serait annulé.
		expect(escapeMarkdownText('a\\"b')).toBe('a\\\\\\"b')
	})

	it('neutralise la charge utile d’injection de la revue de sécurité', () => {
		const attack = 'x" ) [Doc](command:type?{"text":"pwned"}) ("y'
		const escaped = escapeMarkdownText(attack)
		// plus aucune parenthèse/crochet/guillemet non échappé : impossible de fermer le lien porteur
		expect(escaped).not.toMatch(/(^|[^\\])[[\]()"]/)
		expect(escaped).toContain('command:type')  // le texte reste visible, il est juste inerte
	})

	it('replie les retours à la ligne (une nouvelle ligne terminerait le lien)', () => {
		expect(escapeMarkdownText('a\nb\r\nc')).toBe('a b c')
	})
})
