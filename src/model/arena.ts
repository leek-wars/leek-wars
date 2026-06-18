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

class Arena {
	static readonly MIN_PLAYERS = 10
	static readonly MAX_PLAYERS = 20

	leeks: {[key: number]: Leek} = {}
	progress: number = 0
	enabled: boolean = false
	countdown: number = -1
	preference: number = -1

	init() {
		if (localStorage.getItem('in-arena')) {
			// L'inscription mémorisée appartient à un éleveur précis : ne pas la
			// reprendre après un changement de compte (sinon réinscription du
			// poireau d'un autre compte → affichage bloqué à 0).
			const farmer = parseInt(localStorage.getItem('arena-farmer') || '', 10)
			if (!store.state.farmer || farmer !== store.state.farmer.id) {
				this.clearStorage()
				return
			}
			const leek = parseInt(localStorage.getItem('arena-leek') || '', 10)
			const preference = parseInt(localStorage.getItem('arena-preference') || '-1', 10)
			const wantsColossus = localStorage.getItem('arena-colossus') === '1'
			if (leek) { this.register(leek, preference, wantsColossus) }
		}
	}
	register(leek: number, preference: number = -1, wantsColossus: boolean = false) {
		LeekWars.socket.send([SocketMessage.ARENA_REGISTER, leek, preference, wantsColossus])
		localStorage.setItem('arena-leek', '' + leek)
		localStorage.setItem('arena-preference', '' + preference)
		localStorage.setItem('arena-colossus', wantsColossus ? '1' : '0')
		localStorage.setItem('in-arena', '1')
		if (store.state.farmer) { localStorage.setItem('arena-farmer', '' + store.state.farmer.id) }
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
	clearStorage() {
		localStorage.removeItem('in-arena')
		localStorage.removeItem('arena-leek')
		localStorage.removeItem('arena-preference')
		localStorage.removeItem('arena-colossus')
		localStorage.removeItem('arena-farmer')
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
			LeekWars.setTitleTag(null)
			this.leeks = []
			this.enabled = false
			this.progress = 0
			this.countdown = -1
			this.preference = -1
			store.commit('arena-status', {enabled: false, preference: -1})
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
