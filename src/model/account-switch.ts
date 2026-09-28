import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import router from '@/router'
import { nextTick } from 'vue'

/**
 * Passe sur le compte que le serveur vient de rendre actif (farmer/switch, connexion
 * depuis le sélecteur de comptes, déconnexion du compte actif) en restant sur la page :
 * elle est rouverte par le routeur, puis recréée pour le nouveau compte.
 */
export async function activateAccount(data: { token?: string }) {
	const route = router.currentRoute.value
	// Rouvrir la même adresse passe par les gardes de la page, qui peuvent retenir des
	// modifications non enregistrées. `force` : sans lui, le routeur ne ferait rien.
	const failure = await router.replace({ path: route.path, query: route.query, hash: route.hash, force: true })
	store.commit('connect', { ...data, token: LeekWars.DEV ? data.token : '$' })
	// Retenue par ses gardes, la page garde son contenu.
	if (failure) { return }
	// Un tick pour que la page voie d'abord le changement de compte (l'accueil y abandonne
	// la sauvegarde en attente de l'ancien), avant d'être recréée.
	await nextTick()
	LeekWars.routerViewKey++
}
