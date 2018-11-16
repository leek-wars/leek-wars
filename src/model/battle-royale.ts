import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import router from '@/router'

class BattleRoyale {
	leeks = []
	progress: number = 0
	enabled: boolean = false

	init() {
		const leek = parseInt(localStorage.getItem('battle-royale') || '', 10)
		if (leek) {	this.register(leek) }
	}
	register(leek: number) {
		LeekWars.socket.send([SocketMessage.BATTLE_ROYALE_REGISTER, leek])
		localStorage.setItem('battle-royale', '' + leek)
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
		localStorage.removeItem('battle-royale')
		LeekWars.setTitleTag(null)
		this.leeks = []
		this.enabled = false
		this.progress = 0
	}
	start(data: any) {
		LeekWars.toast(i18n.t('main', 'starting_battle_royale'))
		LeekWars.setTitleTag(null)
		this.leeks = []
		this.enabled = false
		this.progress = 0
		localStorage.removeItem('battle-royale')
		store.commit('update-fights', -1)
		router.push('/fight/' + data[0])
	}
}

export { BattleRoyale }