/**
 * La coquille : ce que le cadre du site (barre du haut, menu, colonnes) impose
 * aux pages. Un module feuille, sans dépendance — `leekwars.ts` monte tout le
 * modèle du jeu au chargement, ce qu'un composant de page n'a pas à payer pour
 * une mesure de mise en page.
 */

/**
 * Hauteur de la bande que la barre du haut masque, 0 si elle n'en masque aucune.
 *
 * En v3 la barre est un bandeau FIXE (`#app:not(.app) header.header`, cf.
 * leekwars-shell-v3.scss) : un `scrollTo` calculé pour le haut de la fenêtre
 * dépose sa cible DERRIÈRE elle. Les appelants déduisent cette hauteur.
 *
 * On mesure l'élément plutôt que de lire `--header-height` : le jeton existe
 * aussi en v2, où la barre est dans le flux et ne masque rien, et la barre
 * n'est pas rendue du tout sur mobile connecté (app.vue, c'est `lw-bar` qui
 * tient ce rôle). La mesure répond juste dans les trois cas.
 */
export function fixedHeaderHeight(): number {
	const header = document.querySelector('#app:not(.app) header.header') as HTMLElement | null
	return header && getComputedStyle(header).position === 'fixed' ? header.offsetHeight : 0
}
