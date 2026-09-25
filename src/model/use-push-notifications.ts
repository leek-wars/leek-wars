import { computed, ref } from 'vue'
import { LeekWars } from '@/model/leekwars'

// Clé publique VAPID (P-256), sa contrepartie privée vit dans le service push serveur.
const VAPID_KEY = new Uint8Array([4, 92, 237, 40, 114, 162, 99, 215, 179, 242, 70, 151, 236, 60, 216, 10, 167, 186, 77, 27, 233, 193, 117, 111, 78, 20, 121, 201, 142, 186, 91, 13, 111, 26, 241, 126, 12, 216, 94, 160, 38, 110, 214, 161, 249, 147, 233, 133, 128, 210, 170, 161, 158, 57, 24, 54, 194, 103, 195, 94, 49, 182, 20, 62, 184])

// Abonnement / désabonnement Web Push, partagé entre la page Réglages et la page Notifications.
// `t` doit résoudre les clés push_unsupported / push_blocked / push_error dans le namespace i18n
// de la page appelante (elles existent dans settings.*.i18n ET notifications.*.i18n).
export function usePushNotifications(t: (key: string, ...args: unknown[]) => string) {

	const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
	const pushPermission = ref<NotificationPermission | null>(pushSupported ? Notification.permission : null)
	const pushNotifications = ref(false)

	// Explication persistante affichée à côté du toggle (icône alerte + tooltip) quand le push est indisponible.
	const pushHint = computed(() => {
		if (!pushSupported) { return t('push_unsupported') }
		if (pushPermission.value === 'denied') { return t('push_blocked') }
		return ''
	})

	function getPushSubscription(): Promise<PushSubscription | null> {
		return navigator.serviceWorker.ready.then(registration => registration.pushManager.getSubscription())
	}

	// Réconcilie le toggle avec l'abonnement réel du navigateur. Attend navigator.serviceWorker.ready
	// plutôt que de lire LeekWars.service_worker (peuplé de façon asynchrone, encore null au moment où
	// get-settings répond : course qui affichait le toggle OFF après un reload alors même qu'on était abonné).
	// Si `knownEndpoints` est fourni (la page Réglages a la liste serveur), on exige en plus que l'endpoint
	// soit connu côté serveur.
	function reconcilePushToggle(knownEndpoints?: string[]) {
		if (!pushSupported) { return }
		getPushSubscription().then(subscription => {
			if (subscription && (knownEndpoints === undefined || knownEndpoints.includes(subscription.endpoint))) {
				pushNotifications.value = true
			}
		}).catch(() => { /* push indisponible sur ce navigateur, on laisse le toggle OFF */ })
	}

	function updatePushNotifications() {
		if (!pushSupported) {
			LeekWars.toast(t('push_unsupported'))
			return
		}
		if (pushNotifications.value) {
			pushNotifications.value = false
			getPushSubscription().then(subscription => subscription?.unsubscribe())
			return
		}
		// Demande la permission directement depuis le clic pour que le prompt reste dans le geste utilisateur (contrainte Safari).
		// Si déjà refusé, requestPermission() résout 'denied' sans re-prompter et on l'explique plus bas.
		Notification.requestPermission().then(permission => {
			pushPermission.value = permission
			if (permission !== 'granted') {
				LeekWars.toast(t('push_blocked'))
				return
			}
			navigator.serviceWorker.ready
				.then(registration => registration.pushManager.subscribe({ applicationServerKey: VAPID_KEY, userVisibleOnly: true }))
				.then(subscription => {
					// On ne reflète le toggle ON qu'une fois l'abonnement réellement accordé par le navigateur,
					// pour qu'il reste OFF (au lieu de mentir) quand les notifications sont bloquées.
					pushNotifications.value = true
					LeekWars.post('push-endpoint/register', {subscription: JSON.stringify(subscription)})
				})
				.catch(() => {
					pushNotifications.value = false
					LeekWars.toast(t('push_error'))
				})
		})
	}

	return { pushSupported, pushPermission, pushNotifications, pushHint, reconcilePushToggle, updatePushNotifications }
}
