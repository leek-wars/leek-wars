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
const forgeComponent = ref<{ family: number, level: number } | null>(null)

export { forgeComponent }
