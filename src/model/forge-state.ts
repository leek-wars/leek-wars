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
 * Ce que la recette en cours AJOUTE à la charge, tel que planAttempt le projette (et
 * non sa puissance brute : reboucher un déficit ne rend que DEFICIT_REFUND). Publié par
 * la forge pour que la colonne des caractéristiques annonce la charge qu'on va
 * ATTEINDRE, et pas seulement celle qu'on a (#622).
 */
const forgePendingPower = ref(0)

/**
 * Charge deja investie sur la piece posee, en points de puissance. Avec
 * forgePendingPower et la capacite du composant, la palette sait quelles altérations
 * ne rentrent plus (#622).
 */
const forgeCharge = ref(0)

/**
 * Tentative en cours (dosage, gains vises, chances, casse, cout), publiee par la forge
 * pour que la colonne des caracteristiques l'affiche SOUS les stats de la piece :
 * l'aperçu et les stats qu'il vise se lisent alors d'un seul regard, et la forge ne
 * grandit plus quand on pose des altérations (demande de Pierre).
 *
 * `null` tant qu'aucune altération n'est posée : il n'y a alors rien à annoncer.
 */
const forgePreview = ref<{
	/** Somme des numéros publiés des altérations posées. */
	dose: number
	/** Gains visés par caractéristique, tels que planAttempt les projette. */
	rolls: { [carac: string]: { points: number } }
	/** Chance de réussite, celle du serveur dès qu'elle est connue. */
	probability: number
	/** Vrai tant que le serveur calcule la vraie probabilité (gate du métabolisme). */
	loading: boolean
	/** Risque de casse de la tentative entière. */
	breakRisk: number
	habsCost: number
} | null>(null)

export { forgeComponent, forgePendingPower, forgeCharge, forgePreview }
