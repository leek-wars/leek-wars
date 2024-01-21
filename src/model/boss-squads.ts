import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { SocketMessage } from '@/model/socket'
import { store } from '@/model/store'
import router from '@/router'
import { Leek } from './leek'
import { Farmer } from './farmer'
import { BOSSES, Boss } from './boss'

export class BossSquad {
	public id!: string
	public boss!: number
	public farmers!: Farmer[]
	public engaged_leeks!: Leek[]
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
	update(data: any) {
		this.squads = data
		// this.enabled = true
		// this.leeks = data.data[1]
		// this.progress = LeekWars.objectSize(this.leeks)
		// LeekWars.setTitleTag('BR ' + this.progress + '/10')
	}
	updateSquad(data: any) {
		this.squad = data
		// console.log("Update squad", data)
		const leeks = this.squad!.engaged_leeks.filter(l => l.farmer === store.state.farmer!.id).map(l => l.id)
		localStorage.setItem('garden/boss-leeks', JSON.stringify(leeks))
		// this.enabled = true
		// this.leeks = data.data[1]
		// this.progress = LeekWars.objectSize(this.leeks)
		// LeekWars.setTitleTag('BR ' + this.progress + '/10')
	}
	joined(squad: BossSquad) {
		this.squad = squad
		const route = '/garden/boss/' + BOSSES[squad.boss].name + '/' + squad.id
		if (router.currentRoute.path !== route) {
			router.push(route)
		}
	}
	noSuchSquad() {
		if (router.currentRoute.path.startsWith("/garden/") && router.currentRoute.path !== "/garden/boss") {
			router.push('/garden/boss')
		}
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
		if (router.currentRoute.path.startsWith("/garden/")) {
			router.push('/garden/boss/')
		}
		this.squad = null
		localStorage.removeItem('garden/boss-squad')
		// LeekWars.setTitleTag(null)
	}
	attack() {
		LeekWars.socket.send([SocketMessage.GARDEN_BOSS_ATTACK])
	}
	start(data: any[]) {
		store.commit('update-fights', -1)
		if (router.currentRoute.path.startsWith("/garden/")) {
			router.push('/fight/' + data[0])
		}
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
