// Neutralisation de texte inséré dans du markdown de survol/complétion Monaco. Pur (aucune dépendance
// Monaco) -> testable en isolation.
//
// Pourquoi c'est nécessaire : les survols émettent des liens `command:jump?...` dans une chaîne
// markdown marquée de confiance. Or un nom de fichier d'IA est quasi libre côté serveur
// (FarmerRepo::validateName n'interdit que \0 et /), donc un nom contenant `"`, `[`, `]`, `(`, `)` ou
// un accent grave peut fermer le lien ou son attribut `title` et faire parser la suite comme un
// SECOND lien markdown — exécutable si la chaîne est de confiance. Les noms de fichiers proviennent
// aussi de dépôts git clonés, donc potentiellement d'un tiers.

/**
 * Rend une chaîne inoffensive à l'intérieur d'un libellé ou d'un attribut `title` de lien markdown :
 * échappe les caractères qui referment ces contextes, plus le backslash (sinon `\` + caractère
 * échappé rouvrirait la brèche). Les retours à la ligne deviennent des espaces (une nouvelle ligne
 * termine le lien).
 */
export function escapeMarkdownText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/[`[\]()"'<>]/g, (c) => '\\' + c)
		.replace(/[\r\n]+/g, ' ')
}
