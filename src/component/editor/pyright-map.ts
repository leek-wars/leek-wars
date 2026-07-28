// Aides pures (aucune dépendance Monaco / worker -> testables en isolation) pour le pont Pyright
// (pyright-client.ts). Les documents sont envoyés à Pyright tels quels (l'API vient du stub
// __builtins__.pyi) : les positions Monaco et LSP coïncident, aucun décalage de lignes à gérer.

/**
 * Dossiers (absolus, triés, dédupliqués) contenant les fichiers donnés (paths relatifs type
 * `dossier/x.py`), racine exclue (déjà dans les chemins de recherche de Pyright). Miroir du runtime :
 * le generator insère /ai ET le dossier de l'IA d'entrée en tête de sys.path -> côté éditeur, chaque
 * dossier contenant un .py devient un `extraPaths` (sur-approximation inoffensive : moins de faux
 * « import non résolu », au pire un import inter-dossiers résolu que le combat refuserait).
 */
export function importRoots(paths: Iterable<string>): string[] {
	const dirs = new Set<string>()
	for (const path of paths) {
		const i = path.lastIndexOf('/')
		if (i > 0) dirs.add('/' + path.slice(0, i))
	}
	return [...dirs].sort()
}
