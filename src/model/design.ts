import { reactive } from 'vue'

/**
 * Le design courant, dans un module feuille.
 *
 * `item.ts` en a besoin — le dossier des images de puces dépend du thème — et
 * ne peut pas importer `leekwars.ts`, qui l'importe déjà : le cycle laisserait
 * `ItemType` indéfini au moment où `LeekWars` s'évalue. D'où cet état isolé,
 * dont `LeekWars.legacyTheme` n'est qu'un accesseur : une seule source de
 * vérité, et la bascule du thème reste réactive pour les templates.
 */
export const design = reactive({
	/** Ancien design (v2). Le défaut est le nouveau (v3), cf. `src/theme/`. */
	legacy: localStorage.getItem('design') === 'v2',
})
