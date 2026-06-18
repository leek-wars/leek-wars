import { LeekWars } from '@/model/leekwars'
import router from '@/router'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import { Leek } from './leek'

const ARENA_MODE_ICONS = ['mdi-sword-cross', 'mdi-flag', 'mdi-treasure-chest', 'mdi-shield-account']
const ARENA_MODE_LABELS = ['arena_mode_br', 'arena_mode_war', 'arena_mode_chest_hunt', 'arena_mode_colossus']

function arenaModeIcon(preference: number): string {
	return ARENA_MODE_ICONS[preference] || 'mdi-help-circle-outline'
}

interface ArenaRegistration {
	leek: number
	preference: number
	colossus: boolean
}

// Inscriptions à l'arène mémorisées par éleveur, pour pouvoir réinscrire le
// poireau du bon compte après un changement de compte (multi-compte).
const REGISTRATIONS_KEY = 'arena-registrations'

class Arena {
	static readonly MIN_PLAYERS = 10
	static readonly MAX_PLAYERS = 20

	leeks: {[key: number]: Leek} = {}
	progress: number = 0
	enabled: boolean = false
	countdown: number = -1
	preference: number = -1

	private loadRegistrations(): {[farmer: number]: ArenaRegistration} {
		try {
			return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || '{}')
		} catch {
			return {}
		}
	}
	private saveRegistrations(registrations: {[farmer: number]: ArenaRegistration}) {
		localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations))
	}
	private setRegistration(farmer: number, registration: ArenaRegistration) {
		const registrations = this.loadRegistrations()
		registrations[farmer] = registration
		this.saveRegistrations(registrations)
	}
	// Migre l'ancien format mono-compte (clés à plat) vers la map par éleveur,
	// pour ne pas perdre une inscription en cours lors du déploiement.
	private migrateLegacy() {
		const farmer = parseInt(localStorage.getItem('arena-farmer') || '', 10)
		const leek = parseInt(localStorage.getItem('arena-leek') || '', 10)
		if (localStorage.getItem('in-arena') && farmer && leek && !(farmer in this.loadRegistrations())) {
			this.setRegistration(farmer, {
				leek,
				preference: parseInt(localStorage.getItem('arena-preference') || '-1', 10),
				colossus: localStorage.getItem('arena-colossus') === '1'
			})
		}
	}

	init() {
		this.migrateLegacy()
		if (!store.state.farmer) { return }
		const registration = this.loadRegistrations()[store.state.farmer.id]
		if (registration && registration.leek) {
			// Réinscrit le poireau du compte actif s'il était inscrit.
			this.register(registration.leek, registration.preference, registration.colossus)
		} else if (localStorage.getItem('in-arena')) {
			// Le slot actif appartient à un autre compte : le purger pour ne pas
			// fuir la sélection d'un compte vers un autre.
			this.clearActiveSlot()
		}
	}
	register(leek: number, preference: number = -1, wantsColossus: boolean = false) {
		LeekWars.socket.send([SocketMessage.ARENA_REGISTER, leek, preference, wantsColossus])
		localStorage.setItem('arena-leek', '' + leek)
		localStorage.setItem('arena-preference', '' + preference)
		localStorage.setItem('arena-colossus', wantsColossus ? '1' : '0')
		localStorage.setItem('in-arena', '1')
		if (store.state.farmer) {
			localStorage.setItem('arena-farmer', '' + store.state.farmer.id)
			this.setRegistration(store.state.farmer.id, { leek, preference, colossus: wantsColossus })
		}
		this.enabled = true
		this.preference = preference
		store.commit('arena-status', {enabled: true, preference})
	}
	update(data: { type?: number, data?: unknown[] }) {
		this.enabled = true
		this.progress = (data.data?.[0] as number) ?? 0
		this.countdown = (data.data?.[1] as number) ?? -1
		this.leeks = (data.data?.[2] as {[key: number]: Leek}) ?? {}
		if (!store.state.arenaEnabled) {
			store.commit('arena-status', {enabled: true, preference: this.preference})
		}
		LeekWars.setTitleTag('Arène ' + this.progress + '/' + Arena.MAX_PLAYERS)
	}
	private clearActiveSlot() {
		localStorage.removeItem('in-arena')
		localStorage.removeItem('arena-leek')
		localStorage.removeItem('arena-preference')
		localStorage.removeItem('arena-colossus')
		localStorage.removeItem('arena-farmer')
	}
	clearStorage() {
		this.clearActiveSlot()
		// Oublie l'inscription mémorisée du compte actif (départ / combat lancé).
		if (store.state.farmer) {
			const registrations = this.loadRegistrations()
			if (store.state.farmer.id in registrations) {
				delete registrations[store.state.farmer.id]
				this.saveRegistrations(registrations)
			}
		}
	}
	leave() {
		LeekWars.socket.send([SocketMessage.ARENA_LEAVE])
		this.clearStorage()
		this.reset()
	}
	reset() {
		LeekWars.setTitleTag(null)
		this.leeks = []
		this.enabled = false
		this.progress = 0
		this.countdown = -1
		this.preference = -1
		store.commit('arena-status', {enabled: false, preference: -1})
	}
	start(data: [unknown, unknown]) {
		if (data[1]) { // Garden arena (not automatic)
			this.reset()
			this.clearStorage()
			store.commit('update-fights', -1)

			// Redirect if on the garden page
			router.isReady().then(() => {
				if (router.currentRoute.value.path.startsWith("/garden/")) {
					router.push('/fight/' + data[0])
				}
			})
		}
	}
}

export { Arena, ARENA_MODE_LABELS, arenaModeIcon }
