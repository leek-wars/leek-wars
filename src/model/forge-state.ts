import { ref } from 'vue'

/**
 * Composant actuellement posé au centre de la forge.
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
	/**
	 * Id de l'INSTANCE posée, ou `null` quand la colonne montre la pièce visée par un
	 * schéma de fabrication, qui n'existe pas encore. L'historique s'en sert pour
	 * n'afficher que la vie de cette pièce-là (#12146).
	 */
	id: number | null
	// Id du COMPOSANT (component_template, ex. 47 pour la carte mère Pro), et non sa
	// famille : le champ s'appelait `family` mais portait déjà cet id, ce qui donnait une
	// efficacité toujours nulle à qui le lisait comme une famille. Pour la famille, passer
	// par `alterations.component_families[component]`.
	component: number
	level: number
	// item_template du composant + alterations deja posees, pour que la colonne de stats
	// (voisine de la forge) affiche ses caracteristiques a jour.
	template: number
	stats: { [carac: string]: number } | null
	/**
	 * Dosage optimal de la pièce posée, une fois son métabolisme résolu (#12146), `null`
	 * avant : la colonne de stats n'a alors rien à annoncer.
	 */
	optimal_dose: number | null
} | null>(null)

/**
 * Ce que la recette en cours AJOUTE à la charge, tel que planAttempt le projette (et
 * non sa puissance brute : reboucher un déficit ne rend que DEFICIT_REFUND). Publié par
 * la forge pour que la colonne des caractéristiques annonce la charge qu'on va
 * ATTEINDRE, et pas seulement celle qu'on a.
 */
const forgePendingPower = ref(0)

/**
 * Écarts de la pièce posée une fois la recette en cours appliquée, tels que planAttempt
 * les projette. La palette y pose chaque altération candidate et recalcule la charge pour
 * savoir si elle rentre encore : une addition de puissance brute comptait plein tarif le
 * rebouchage d'un déficit, qui ne coûte que DEFICIT_REFUND.
 */
const forgeProjected = ref<{ [carac: string]: number }>({})

/**
 * Tentative en cours (dosage, gains vises, chances, casse, cout), publiee par la forge
 * pour que la colonne des caracteristiques l'affiche SOUS les stats de la piece :
 * l'aperçu et les stats qu'il vise se lisent alors d'un seul regard, et la forge ne
 * grandit pas quand on pose des altérations.
 *
 * `null` tant qu'aucune altération n'est posée : il n'y a alors rien à annoncer.
 */
const forgePreview = ref<{
	/** Somme des numéros publiés des altérations posées. */
	dose: number
	/** Gains visés par caractéristique, tels que planAttempt les projette. */
	rolls: { [carac: string]: { points: number } }
	/** Chance de réussite annoncée par le serveur, `null` tant qu'elle est inconnue. */
	probability: number | null
	/** Vrai tant qu'on attend les chances du serveur. */
	loading: boolean
	/** Risque de casse annoncé par le serveur, `null` tant qu'il est inconnu. */
	breakRisk: number | null
	habsCost: number
} | null>(null)

export { forgeComponent, forgePendingPower, forgeProjected, forgePreview }
