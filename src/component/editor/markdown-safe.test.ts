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

// Garde de SÉCURITÉ (régression du 28/07/2026, corrigée) : la doc de complétion fusionnée contient la
// docstring du symbole, donc du contenu de fichier arbitraire — potentiellement écrit par un tiers via
// un dépôt git cloné. Marquée `isTrusted`, elle rendait exécutable un lien `command:` d'un simple clic.
describe('mergeCompletionDocumentation', () => {
	const payload = '[Doc officielle](command:type?%7B%22text%22%3A%22pwned%22%7D)'

	it('ne marque JAMAIS le résultat de confiance, docstring hostile ou non', () => {
		const merged = mergeCompletionDocumentation(payload, '📖 [Documentation](https://leekwars.com/help/documentation/getLife)')
		expect(merged).not.toHaveProperty('isTrusted')
		expect((merged as Record<string, unknown>).isTrusted).toBeUndefined()
	})

	it('sans doc préexistante non plus', () => {
		expect(mergeCompletionDocumentation(payload)).not.toHaveProperty('isTrusted')
	})

	it('conserve les deux contenus dans l’ordre (Pyright puis lien LW)', () => {
		const merged = mergeCompletionDocumentation('def f() -> int', '📖 lien')
		expect(merged.value).toBe('def f() -> int\n\n📖 lien')
	})
})
