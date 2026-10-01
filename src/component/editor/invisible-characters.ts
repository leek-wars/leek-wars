// Caractères invisibles d'un extrait de code, que l'éditeur signale : largeur nulle,
// remplisseurs hangûl, contrôles, marques bidi. Pas le ZWJ ni les sélecteurs de variante, qui
// composent les emojis, ni les espaces qui se voient (insécables, typographiques).
// eslint-disable-next-line no-control-regex, no-misleading-character-class -- échappements, pas de glyphes combinés
const INVISIBLE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180e\u200b\u200c\u200e\u200f\u2028\u2029\u202a-\u202e\u2060-\u206f\u2800\u3164\ufeff\uffa0\ufff9-\ufffb]/g

// Enveloppe chacun d'un .t-invisible (point rouge) sans le retirer du texte copié. `html` est
// déjà échappé : aucun des caractères visés n'est une entité ni du balisage.
export function markInvisibleCharacters(html: string): string {
	return html.replace(INVISIBLE, c => '<span class="t-invisible" title="U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') + '">' + c + '</span>')
}
