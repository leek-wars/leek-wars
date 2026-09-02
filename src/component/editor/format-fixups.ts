/**
 * Retouches appliquées à la sortie de js-beautify, qui formate du JavaScript et ne connaît
 * donc pas la syntaxe propre à LeekScript. Chaque règle répare une découpe que le beautifier
 * a faite à tort.
 */
const FIXUPS: Array<[RegExp, string]> = [
	// L'opérateur `\=` est découpé en `\ =`
	[/\\ =/g, ' \\='],
	// L'opérateur d'intervalle `..` est découpé en `. .`
	[/\. \./g, '..'],
	// La flèche `->` est découpée en `- >`
	[/- >/g, '->'],
	// Les mots-clés logiques et de cast sont pris pour des noms de fonction quand une
	// parenthèse suit : `a and (b)` devient `a and(b)`, illisible et signalé par les
	// joueurs. `in` n'est pas concerné, js-beautify le connaît comme opérateur.
	[/\b(and|or|xor|not|instanceof|as|new)\(/g, '$1 ('],
]

// Chaînes (avec échappements) et commentaires : capturés pour être laissés intacts.
const STRINGS_AND_COMMENTS = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g

/**
 * Applique les retouches au code formaté, hors chaînes et commentaires : `debug("and(x)")`
 * doit rester tel quel.
 */
export function applyFormatFixups(formatted: string): string {
	// split avec un groupe capturant : les éléments d'indice impair sont les chaînes et
	// commentaires capturés, les pairs le code entre eux.
	return formatted.split(STRINGS_AND_COMMENTS).map((part, index) => {
		if (index % 2 === 1) return part
		return FIXUPS.reduce((code, [pattern, replacement]) => code.replace(pattern, replacement), part)
	}).join('')
}
