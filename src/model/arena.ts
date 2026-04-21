import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import { getRouter } from '@/model/leekwars'
import { ArenaMode } from '@/model/fight'
import { Leek } from './leek'

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
		this.enabled = true
		this.preference = preference
		store.commit('arena-status', {enabled: true, preference})
	}
	update(data: any) {
		this.enabled = true
		this.progress = data.data[0]
		this.countdown = data.data[1]
		this.leeks = data.data[2]
		if (!store.state.arenaEnabled) {
			store.commit('arena-status', {enabled: true, preference: this.preference})
		}
		LeekWars.setTitleTag('Arène ' + this.progress + '/' + Arena.MAX_PLAYERS)
	}
	leave() {
		LeekWars.socket.send([SocketMessage.ARENA_LEAVE])
		localStorage.removeItem('in-arena')
		localStorage.removeItem('arena-preference')
		localStorage.removeItem('arena-colossus')
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
	start(data: any) {
		if (data[1]) { // Garden arena (not automatic)
			LeekWars.setTitleTag(null)
			this.leeks = []
			this.enabled = false
			this.progress = 0
			this.countdown = -1
			this.preference = -1
			store.commit('arena-status', {enabled: false, preference: -1})
			localStorage.removeItem('in-arena')
			localStorage.removeItem('arena-preference')
			localStorage.removeItem('arena-colossus')
			store.commit('update-fights', -1)

			// Redirect if on the garden page
			getRouter().isReady().then(() => {
				if (getRouter().currentRoute.value.path.startsWith("/garden/")) {
					getRouter().push('/fight/' + data[0])
				}
			})
		}
	}
}

export { Arena }
