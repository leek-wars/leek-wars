/**
 * Purge unique du cache HTTP du navigateur, une fois par mise à jour qui redessine
 * des images.
 *
 * Les images sont servies sous un nom stable (`/image/chip/hemorrhage.png`) avec un
 * `Cache-Control: max-age=31536000` posé par nginx : un joueur qui a déjà vu une
 * tuile garde la sienne pendant un an, même si le fichier a changé sur le serveur.
 * Les assets JS et CSS, eux, portent un hash dans leur nom et n'ont pas ce problème.
 * La 3.00 redessine puces, apparats et icônes de trophées SANS les renommer : sans
 * cette purge, les joueurs de retour verraient un mélange d'anciennes et de
 * nouvelles images.
 *
 * `GET /api/data/clear-cache` répond avec l'en-tête `Clear-Site-Data: "cache"`, qui
 * vide le cache HTTP de l'origine — et rien d'autre : ni cookies, ni stockage local,
 * donc aucune déconnexion. La page est ensuite rechargée pour repartir sur les
 * fichiers du serveur.
 *
 * Le marqueur est écrit AVANT le rechargement : même si l'appel échoue, la purge
 * n'est tentée qu'une fois et il n'y a pas de boucle. Sans stockage local (mode
 * privé verrouillé), on ne tente rien du tout, pour la même raison.
 *
 * Aux prochaines mises à jour : incrémenter `CACHE_VERSION` seulement si des images
 * existantes ont été redessinées.
 */
const CACHE_VERSION = '300'
const CACHE_KEY = 'cache_bust'

try {
	if (localStorage.getItem(CACHE_KEY) !== CACHE_VERSION) {
		localStorage.setItem(CACHE_KEY, CACHE_VERSION)
		fetch('/api/data/clear-cache', { credentials: 'omit' })
			.catch(() => { /* hors ligne ou API muette : on ne bloque pas le démarrage */ })
			.then(() => location.reload())
	}
} catch (e) {
	// localStorage inaccessible : pas de marqueur possible, donc pas de purge.
}

export {}
