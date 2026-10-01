import { LeekWars } from '@/model/leekwars'
import router from '@/router'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import { Leek } from './leek'
import { Farmer } from './farmer'
import { BOSSES, Boss } from './boss'

class BossSquad {
	public id!: string
	public boss!: number
	public farmers!: Farmer[]
	public engaged_leeks!: Leek[]
	public locked?: boolean
	public engaged_count?: number
	public available_leeks?: Leek[]
	public master?: number | Farmer
	[key: string]: unknown
}

export class BossSquads {
	leeks: {[key: number]: Leek} = {}
	progress: number = 0
	enabled: boolean = false
	squads: {[key: number]: BossSquad[]} = {}
	squad: BossSquad | null = null

	init() {
		const squad = localStorage.getItem('garden/boss-squad')
		if (squad) {
			this.join(squad)
		}
	}
	listen() {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_LISTEN])
	}
	create(boss: Boss) {
		const locked = localStorage.getItem('garden/boss-locked') === 'true'
		const allLeeks = Object.keys(store.state.farmer!.leeks).map(i => parseInt(i))
		const leeks = localStorage.getItem('garden/boss-leeks') ? JSON.parse(localStorage.getItem('garden/boss-leeks')!) : allLeeks
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_CREATE_SQUAD, boss.id, locked, leeks])
	}
	join(squad_id: string) {
		localStorage.setItem('garden/boss-squad', squad_id)
		const allLeeks = Object.keys(store.state.farmer!.leeks).map(i => parseInt(i))
		const leeks = localStorage.getItem('garden/boss-leeks') ? JSON.parse(localStorage.getItem('garden/boss-leeks')!) : allLeeks
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_JOIN_SQUAD, squad_id, leeks])
	}
	update(data: {[key: number]: BossSquad[]}) {
		this.squads = data
		// this.enabled = true
		// this.leeks = data.data[1]
		// this.progress = LeekWars.objectSize(this.leeks)
		// LeekWars.setTitleTag('BR ' + this.progress + '/10')
	}
	updateSquad(data: BossSquad) {
		this.squad = data
		// console.log("Update squad", data)
		const leeks = this.squad!.engaged_leeks.filter(l => (l.farmer as unknown as number) === store.state.farmer!.id).map(l => l.id)
		localStorage.setItem('garden/boss-leeks', JSON.stringify(leeks))
		// this.enabled = true
		// this.leeks = data.data[1]
		// this.progress = LeekWars.objectSize(this.leeks)
		// LeekWars.setTitleTag('BR ' + this.progress + '/10')
	}
	// Recalage d'URL depuis un message du websocket ; la garde de préfixe évite de dérouter un
	// joueur parti ailleurs. `push` pour ce qui suit une intention du joueur, `replace` pour
	// corriger une URL devenue inatteignable — un push depuis une entrée qui n'est plus la
	// dernière effacerait tout l'historique « en avant ».
	private navigate(target: string, mode: 'push' | 'replace', from: string = '/garden/boss') {
		router.isReady().then(() => {
			const path = router.currentRoute.value.path
			if (path.startsWith(from) && path !== target) {
				if (mode === 'replace') { router.replace(target) } else { router.push(target) }
			}
		})
	}
	joined(squad: BossSquad) {
		this.squad = squad
		this.navigate('/garden/boss/' + BOSSES[squad.boss].name + '/' + squad.id, 'push')
	}
	noSuchSquad() {
		localStorage.removeItem('garden/boss-squad')
		// Typiquement un retour arrière depuis le combat, l'attaque ayant dissous l'escouade :
		// en `push` la flèche « suivant » mourait et le retour rebouclait sur la redirection.
		this.navigate('/garden/boss', 'replace')
	}
	addLeek(leek: Leek) {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_ADD_LEEK, leek.id])
	}
	removeLeek(leek: Leek) {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_REMOVE_LEEK, leek.id])
	}
	leaveSquad() {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_LEAVE_SQUAD])
	}
	left() {
		this.navigate('/garden/boss/', 'push')
		this.squad = null
		localStorage.removeItem('garden/boss-squad')
		// LeekWars.setTitleTag(null)
	}
	attack() {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_ATTACK])
	}
	start(data: unknown[]) {
		// Only decrease fight count if we have engaged leeks in the squad
		const hasEngagedLeeks = this.squad && this.squad.engaged_leeks.some(l => (l.farmer as unknown as number) === store.state.farmer!.id)
		if (hasEngagedLeeks) {
			store.commit('update-fights', -1)
		}
		this.navigate('/fight/' + data[0], 'push', '/garden/')
		this.squad = null
		// 	LeekWars.setTitleTag(null)
		localStorage.removeItem('garden/boss-squad')
	}
	open() {
		localStorage.setItem('garden/boss-locked', 'false')
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_OPEN])
	}
	lock() {
		localStorage.setItem('garden/boss-locked', 'true')
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_LOCK])
	}
}
