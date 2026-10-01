/**
 * Frappe destinée à un champ de saisie (code de l'éditeur, recherche, chat…) : ce n'est
 * pas un raccourci clavier. Monaco saisit dans une zone éditable qui n'est pas toujours
 * un textarea, d'où le test sur son conteneur.
 */
export function isTyping(e: KeyboardEvent) {
	const target = e.target
	return target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input, textarea, select, .monaco-editor'))
}
