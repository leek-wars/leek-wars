// Aides pures (aucune dépendance Monaco / worker -> testables en isolation) pour le pont Pyright
// (pyright-client.ts). Les documents sont envoyés à Pyright tels quels (l'API vient du stub
// __builtins__.pyi) : les positions Monaco et LSP coïncident, aucun décalage de lignes à gérer.

/**
 * Chemins de recherche supplémentaires (absolus, triés, dédupliqués) à donner à Pyright, calculés
 * depuis les paths des IA d'ENTRÉE (celles assignées à un poireau), racine exclue (déjà couverte).
 *
 * Miroir exact du runtime : le generator insère /ai en tête de sys.path, PLUS le dossier de l'IA
 * d'entrée quand elle n'est pas à la racine -> un `MonIA/main.py` peut faire `import util` pour son
 * voisin `MonIA/util.py`. Rien d'autre n'est sur le chemin.
 *
 * Ne PAS élargir aux dossiers de tous les .py : un chemin de recherche rend chaque fichier qu'il
 * contient importable en module de premier niveau, ce qui MASQUE le paquet de même nom vu depuis la
 * racine. Un dossier `attack/` contenant `attack.py` faisait alors résoudre `attack` vers le fichier,
 * et `import attack.attack` échouait (« could not be resolved ») alors que le combat l'accepte.
 */
export function importRoots(entryPaths: Iterable<string>): string[] {
	const dirs = new Set<string>()
	for (const path of entryPaths) {
		const i = path.lastIndexOf('/')
		if (i > 0) dirs.add('/' + path.slice(0, i))
	}
	return [...dirs].sort()
}
