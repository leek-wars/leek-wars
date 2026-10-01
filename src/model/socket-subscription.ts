import { LeekWars } from '@/model/leekwars'

/*
 * Abonnement compté par référence à un canal du websocket.
 *
 * Le comptage est indispensable : lors d'une navigation, Vue exécute le setup de
 * la nouvelle page (qui s'abonne) AVANT de démonter l'ancienne (qui se
 * désabonne). Sans compteur, le désabonnement du composant démonté annulerait
 * l'abonnement que la nouvelle page vient de poser sur le même canal, et la page
 * resterait figée. On n'envoie donc REGISTER qu'au passage 0->1 et UNREGISTER
 * qu'au passage 1->0.
 *
 * La trame REGISTER sert elle-même de clé : c'est exactement ce qui identifie un
 * abonnement, un canal ne peut donc pas être confondu avec un autre (le code du
 * message ouvre la trame) et il n'y a pas de convention de clé à inventer.
 *
 * Le vrai remède serait un registre d'abonnements DANS socket.ts, qui les
 * rejouerait à chaque `onopen` comme il le fait déjà pour l'arène et les
 * escouades — les consommateurs n'auraient alors plus de reconnexion à gérer.
 * En attendant, c'est ici que vit la mécanique, une seule fois.
 */
const refs = new Map<string, number>()

/** Ajoute (`on` vrai) ou retire une référence sur l'abonnement décrit par ces deux trames. */
export function socketRef(register: unknown[], unregister: unknown[], on: boolean) {
	const key = JSON.stringify(register)
	const n = (refs.get(key) || 0) + (on ? 1 : -1)
	if (n <= 0) {
		refs.delete(key)
		if (!on) { LeekWars.socket.send(unregister) }
	} else {
		refs.set(key, n)
		if (on && n === 1) { LeekWars.socket.send(register) }
	}
}

/**
 * Repose un abonnement après une reconnexion : le démon a perdu tous ceux de la
 * socket coupée. Envoi brut, idempotent côté démon, sans toucher au comptage.
 */
export function socketResubscribe(register: unknown[]) {
	LeekWars.socket.send(register)
}
