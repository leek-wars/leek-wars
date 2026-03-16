import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import { getRouter } from '@/model/leekwars'
import { Leek } from './leek'

class BattleRoyale {
	static readonly RANGES = [20, 100, 200, 300]
	static readonly ROOM_SIZE = 10

	leeks: {[key: number]: Leek} = {}
	progress: number = 0
	enabled: boolean = false

	static getRangeIndex(level: number): number {
		for (let i = BattleRoyale.RANGES.length - 1; i >= 0; i--) {
			if (level >= BattleRoyale.RANGES[i]) { return i }
		}
		return -1
	}

	static getRange(level: number): { min: number, max: number } | null {
		const idx = BattleRoyale.getRangeIndex(level)
		if (idx < 0) { return null }
		const min = BattleRoyale.RANGES[idx]
		const max = idx < BattleRoyale.RANGES.length - 1 ? BattleRoyale.RANGES[idx + 1] - 1 : 301
		return { min, max }
	}

	init() {
		if (localStorage.getItem('in-battle-royale')) {
			const leek = parseInt(localStorage.getItem('battle-royale-leek') || '', 10)
			if (leek) { this.register(leek) }
		}
	}
	register(leek: number) {
		LeekWars.socket.send([SocketMessage.BATTLE_ROYALE_REGISTER, leek])
		localStorage.setItem('battle-royale-leek', '' + leek)
		localStorage.setItem('in-battle-royale', '1')
		this.enabled = true
	}
	update(data: any) {
		this.enabled = true
		this.leeks = data.data[1]
		this.progress = LeekWars.objectSize(this.leeks)
		LeekWars.setTitleTag('BR ' + this.progress + '/10')
	}
	leave() {
		LeekWars.socket.send([SocketMessage.BATTLE_ROYALE_LEAVE])
		localStorage.removeItem('in-battle-royale')
		LeekWars.setTitleTag(null)
		this.leeks = []
		this.enabled = false
		this.progress = 0
	}
	start(data: any) {
		if (data[1]) { // Garden BR (not automatic)
			LeekWars.setTitleTag(null)
			this.leeks = []
			this.enabled = false
			this.progress = 0
			localStorage.removeItem('in-battle-royale')
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

export { BattleRoyale }