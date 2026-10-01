// Échappement de texte inséré dans du markdown de survol/complétion Monaco. Pur (aucune dépendance
// Monaco) -> testable en isolation.

/**
 * Échappe une chaîne pour l'insérer dans un libellé ou un attribut `title` de lien markdown
 * (backslash compris). Les retours à la ligne deviennent des espaces.
 */
export function escapeMarkdownText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/[`[\]()"'<>]/g, (c) => '\\' + c)
		.replace(/[\r\n]+/g, ' ')
}

/**
 * Fusionne la documentation d'un item de complétion venue de Pyright (`fromServer`, la docstring du
 * symbole) avec celle déjà posée côté client (`existing`, le lien 📖 en https). Le résultat n'est pas
 * marqué `isTrusted` : un lien https reste cliquable sans.
 */
export function mergeCompletionDocumentation(fromServer: string, existing?: string): { value: string } {
	return { value: existing ? `${fromServer}\n\n${existing}` : fromServer }
}
