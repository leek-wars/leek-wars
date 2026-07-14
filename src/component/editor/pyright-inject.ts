// Injection de l'import d'API dans un document Python avant envoi à Pyright. Pur (aucune dépendance
// Monaco / worker) -> testable en isolation. Utilisé par pyright-client.ts.

// Import injecté : rend les globales runtime (getNearestEnemy, Weapon, Fight...) résolues SANS import.
// `me` n'y est PAS -> un `me` nu est signalé « not defined ».
export const IMPORT = 'from leekwars import *'

/**
 * Insère `from leekwars import *` dans le code et renvoie `{text, line}` (line = index 0-based de la
 * ligne de l'import). Normalement en tête (line 0). Exception : `from __future__` DOIT rester la 1re
 * instruction -> on insère APRÈS l'en-tête (docstring de module, commentaires, lignes vides, imports
 * `__future__`), sinon Pyright lève « __future__ imports must occur at the beginning of the file ».
 */
export function injectImport(code: string): { text: string, line: number } {
	const lines = code.split('\n')
	let i = 0
	let docQuote: string | null = null // dans un docstring multi-ligne : délimiteur fermant attendu
	for (; i < lines.length; i++) {
		const t = lines[i].trim()
		if (docQuote) { if (t.includes(docQuote)) docQuote = null; continue }
		if (t === '' || t.startsWith('#') || t.startsWith('from __future__')) continue
		const m = t.match(/^[rbuf]*("""|''')/i) // docstring de module (mono- ou multi-ligne)
		if (m) { if (t.indexOf(m[1], t.indexOf(m[1]) + 3) < 0) docQuote = m[1]; continue }
		break // 1re vraie instruction : on insère juste avant
	}
	lines.splice(i, 0, IMPORT)
	return { text: lines.join('\n'), line: i }
}
