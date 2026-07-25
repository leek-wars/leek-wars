import { ref } from 'vue'

/**
 * Composant actuellement posé au centre de la forge (#622).
 *
 * L'état vit au niveau du module, pas dans un composant : la palette d'altérations
 * et la forge sont sœurs, et la palette est démontée puis remontée à chaque
 * changement d'onglet. Un événement serait perdu pour une palette montée après coup,
 * alors qu'une ref de module se relit à tout moment.
 *
 * La palette s'en sert pour chiffrer la charge de chaque altération : le gain dépend
 * de la famille du composant visé, via la matrice d'efficacité.
 */
const forgeComponent = ref<{
	family: number
	level: number
	// item_template du composant + alterations deja posees, pour que la colonne de stats
	// (voisine de la forge) affiche ses caracteristiques a jour (#622).
	template: number
	stats: { [carac: string]: number } | null
} | null>(null)

/**
 * Puissance de la recette en cours de composition, publiée par la forge pour que la
 * colonne des caractéristiques annonce la charge qu'on va ATTEINDRE, et pas seulement
 * celle qu'on a (#622).
 */
const forgePendingPower = ref(0)

export { forgeComponent, forgePendingPower }
