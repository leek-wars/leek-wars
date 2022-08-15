import { LeekWars } from '@/model/leekwars'
import { vueMain } from '@/model/vue'
import router from '@/router'
import { ChatMessage } from './chat'
import { NotificationType } from './notification'
import { store } from './store'

enum SocketMessage {
	AUTH = 0,
	// TEAM_CHAT_SEND = 1, // Deprecated
	// TEAM_CHAT_RECEIVE = 2, // Deprecated
	// TEAM_CHAT_MEMBERS = 3, // Deprecated
	// TEAM_CHAT_ENABLE = 4, // Deprecated
	// MP_RECEIVE = 5, // Deprecated
	NOTIFICATION_RECEIVE = 6,
	// CHAT_ENABLE = 7, // Deprecated
	CHAT_SEND = 8,
	CHAT_RECEIVE = 9,
	// MP_UNREAD_MESSAGES = 10, // Deprecated
	MP_READ = 11,
	FIGHT_LISTEN = 12,
	FIGHT_GENERATED = 12,
	FIGHT_WAITING_POSITION = 13,
	FORUM_CHAT_DISABLE = 19,
	READ_ALL_NOTIFICATIONS = 20,
	CHAT_REQUEST_MUTE = 21,
	CHAT_MUTE_USER = 22,
	CHAT_REQUEST_UNMUTE = 23,
	CHAT_UNMUTE_USER = 24,
	YOU_ARE_MUTED = 25,
	LUCKY = 26,
	GET_LUCKY = 27,
	BATTLE_ROYALE_REGISTER = 28,
	BATTLE_ROYALE_UPDATE = 29,
	BATTLE_ROYALE_START = 30,
	BATTLE_ROYALE_LEAVE = 31,
	BATTLE_ROYALE_CHAT_NOTIF = 32,
	PONG = 33,
	CHAT_ENABLE = 34,
	CHAT_RECEIVE_PACK = 35,
	GARDEN_QUEUE_REGISTER = 37,
	GARDEN_QUEUE = 38,
	GARDEN_QUEUE_UNREGISTER = 39,
	FIGHT_PROGRESS_REGISTER = 40,
	FIGHT_PROGRESS = 41,
	FIGHT_PROGRESS_UNREGISTER = 42,
	// TEAM_CHAT_ENABLE_FAST = 43, // Deprecated
	// TEAM_CHAT_RECEIVE_PACK = 44, // Deprecated
	UPDATE_LEEK_TALENT = 45,
	UPDATE_FARMER_TALENT = 46,
	UPDATE_TEAM_TALENT = 47,
	UPDATE_HABS = 48,
	UPDATE_LEEK_XP = 49,
	CHAT_CENSOR = 50,
	CHAT_REACT = 51,
	READ_NOTIFICATION = 52,
	ADD_RESOURCE = 53,
	EDITOR_HOVER = 54,
	CHAT_DELETE = 56,
	WRONG_TOKEN = 57,
	TOURNAMENT_LISTEN = 58,
	TOURNAMENT_UNLISTEN = 59,
	TOURNAMENT_UPDATE = 60,
	FAKE_LUCKY = 61,
	EDITOR_COMPLETE = 62,
	EDITOR_ANALYZE = 64,
	EDITOR_ANALYZE_ERROR = 65,
	GARDEN_BOSS_CREATE_SQUAD = 66,
	GARDEN_BOSS_JOIN_SQUAD = 67,
	GARDEN_BOSS_ADD_LEEK = 68,
	GARDEN_BOSS_REMOVE_LEEK = 69,
	GARDEN_BOSS_SQUAD_PUBLIC = 70,
	GARDEN_BOSS_ATTACK = 71,
	GARDEN_BOSS_LISTEN = 72,
	GARDEN_BOSS_SQUADS = 73,
	GARDEN_BOSS_SQUAD_JOINED = 74,
	GARDEN_BOSS_LEAVE_SQUAD = 75,
	GARDEN_BOSS_SQUAD = 76,
	GARDEN_BOSS_NO_SUCH_SQUAD = 77,
	GARDEN_BOSS_STARTED = 78,
	GARDEN_BOSS_OPEN = 79,
	GARDEN_BOSS_LOCK = 80,
	GARDEN_BOSS_UNLISTEN = 81,
	GARDEN_BOSS_LEFT = 82,
}

class Socket {
	public socket!: WebSocket
	public queue: any[] = []
	public retry_count: number = 10
	public retry_delay: number = 2000
	public wrong_token: boolean = false

	public connect() {
		// if (store.getters.admin || LeekWars.LOCAL || LeekWars.DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
		// 	const message = "[WS] connect()"
		// 	console.log(message)
		// }
		if (!store.state.farmer || this.connecting() || this.connected()) {
			return
		}
		this.wrong_token = false
		const url = LeekWars.LOCAL ? "ws://localhost:1213/" : "wss://leekwars.com/ws"
		this.socket = new WebSocket(url)
		// console.log("[socket] socket", this.socket)

		this.socket.onopen = () => {
			// console.log("[ws] onopen")
			if (LeekWars.DEV) {
				// In dev mode, auth via a AUTH message
				this.send([SocketMessage.AUTH, store.state.token])
			}
			store.commit('invalidate-chats')
			store.commit('wsconnected')
			this.retry_count = 10
			this.retry_delay = 0
			for (const p of this.queue) {
				this.send(p)
			}
			this.queue = []
			// Relaunch battle royale?
			LeekWars.battleRoyale.init()
			LeekWars.bossSquads.init()
		}
		this.socket.onclose = () => {
			// console.log("[ws] onclose")
			if (store.getters.admin || LeekWars.LOCAL || LeekWars.DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
				const message = "[WS] fermée"
				console.error(message)
				// LeekWars.toast(message, 5000)
			}
			store.commit('wsclose')
			this.retry()
		}
		this.socket.onerror = (event) => {
			if (store.getters.admin || LeekWars.LOCAL || LeekWars.DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
				const message = "[WS] erreur"
				console.error(message, event)
				// LeekWars.toast(message, 5000)
			}
		}
		this.socket.onmessage = (msg: any) => {
			const json = JSON.parse(msg.data)
			const id = json[0]
			const data = json[1]
			const request_id = json[2]
			// console.log("[WS] onmessage", id, data, request_id)

			vueMain.$emit('wsmessage', {type: id, data, id: request_id})

			switch (id) {
				case SocketMessage.WRONG_TOKEN: {
					this.wrong_token = true
					break
				}
				case SocketMessage.PONG: {
					store.commit('receive-pong', data)
					break
				}
				case SocketMessage.CHAT_MUTE_USER : {
					// var moderator_name = data[2]
					// var muted = data[3]
					// if (muted == LW.farmer.id) {
					// 	_.toast(_.lang.get('moderation', 'you_have_been_muted_by_x', moderator_name))
					// }
					// LW.chat.mute_user(data)
					break
				}
				case SocketMessage.YOU_ARE_MUTED : {
					// _.toast(_.lang.get('moderation', 'you_are_muted'))
					break
				}
				case SocketMessage.CHAT_UNMUTE_USER : {
					// var moderator_name = data[2]
					// var unmuted = data[3]
					// if (unmuted == LW.farmer.id) {
					// 	_.toast(_.lang.get('moderation', 'you_have_been_unmuted_by_x', moderator_name))
					// }
					break
				}
				case SocketMessage.NOTIFICATION_RECEIVE : {

					const message = { id: data[0], type: data[1], date: LeekWars.time, parameters: data[2], new: true }
					// Envoie de la notif sur la page du combat pour la mettre en file d'attente
					if (message.type === NotificationType.TROPHY_UNLOCKED && router.currentRoute.path.startsWith('/fight/' + message.parameters[1])) {
						vueMain.$emit('trophy', message)
					} else {
						if (message.type === NotificationType.UP_LEVEL) {
							const leek = parseInt(message.parameters[0], 10)
							const level = parseInt(message.parameters[1], 10)
							const capital = parseInt(message.parameters[2], 10)
							store.commit('level-up', {leek, level, capital})
						}
						store.commit('notification', message)
					}
					break
				}
				case SocketMessage.READ_ALL_NOTIFICATIONS : {
					store.commit('read-notifications', data[0])
					break
				}
				case SocketMessage.READ_NOTIFICATION : {
					store.commit('read-notification', data[0])
					break
				}
				case SocketMessage.MP_READ : {
					store.commit('chat-set-read', { chat: data[0], read: true })
					break
				}
				case SocketMessage.CHAT_RECEIVE : {
					// console.log("socket chat receive", data)
					const message = data as ChatMessage
					store.commit('chat-receive', { chat: message.chat, type: data.type, message, new: true })
					break
				}
				case SocketMessage.LUCKY: {
					LeekWars.lucky()
					break
				}
				case SocketMessage.FAKE_LUCKY: {
					LeekWars.lucky(true)
					break
				}
				case SocketMessage.BATTLE_ROYALE_CHAT_NOTIF: {
					store.commit('br', data)
					break
				}
				case SocketMessage.BATTLE_ROYALE_UPDATE: {
					LeekWars.battleRoyale.update({type: id, data})
					break
				}
				case SocketMessage.BATTLE_ROYALE_START: {
					LeekWars.battleRoyale.start(data)
					break
				}
				case SocketMessage.BATTLE_ROYALE_LEAVE: {
					LeekWars.battleRoyale.leave()
					break
				}
				case SocketMessage.GARDEN_QUEUE: {
					vueMain.$emit('garden-queue', data)
					break
				}
				case SocketMessage.FIGHT_PROGRESS: {
					vueMain.$emit('fight-progress', data)
					break
				}
				case SocketMessage.TOURNAMENT_UPDATE: {
					vueMain.$emit('tournament-update', data)
					break
				}
				case SocketMessage.UPDATE_HABS: {
					store.commit('update-habs', data[0])
					break
				}
				case SocketMessage.UPDATE_LEEK_XP: {
					const message = { leek: data[0], xp: data[1] }
					store.commit('update-xp', message)
					vueMain.$emit('update-leek-xp', message)
					break
				}
				case SocketMessage.UPDATE_LEEK_TALENT: {
					const message = { leek: data[0], talent: data[1] }
					store.commit('update-leek-talent', message)
					vueMain.$emit('update-leek-talent', message)
					break
				}
				case SocketMessage.UPDATE_FARMER_TALENT: {
					store.commit('update-farmer-talent', data[0])
					break
				}
				case SocketMessage.UPDATE_TEAM_TALENT: {
					const message = { composition: data[0], talent: data[1] }
					vueMain.$emit('update-team-talent', message)
					break
				}
				case SocketMessage.CHAT_CENSOR: {
					store.commit('chat-censor', { chat: data[0], messages: data[1], censorer: data[2] })
					break
				}
				case SocketMessage.CHAT_DELETE: {
					store.commit('chat-delete', { chat: data[0], messages: data[1] })
					break
				}
				case SocketMessage.CHAT_REACT: {
					store.commit('chat-react', { chat: data[0], message: data[1], reaction: data[2], old: data[3], farmer: data[4] })
					break
				}
				case SocketMessage.ADD_RESOURCE: {
					// console.log("add resource", data)
					const template = data[0]
					const id = data[1]
					const quantity = data[2]
					const item = LeekWars.items[data[0]]
					const time = data[3]
					if (item) {
						store.commit('add-inventory', { type: item.type, template, id, quantity, time })
					}
					break
				}
				case SocketMessage.GARDEN_BOSS_SQUADS: {
					LeekWars.bossSquads.update(data)
					break
				}
				case SocketMessage.GARDEN_BOSS_SQUAD_JOINED: {
					LeekWars.bossSquads.joined(data)
					break
				}
				case SocketMessage.GARDEN_BOSS_SQUAD: {
					LeekWars.bossSquads.updateSquad(data)
					break
				}
				case SocketMessage.GARDEN_BOSS_NO_SUCH_SQUAD: {
					LeekWars.bossSquads.noSuchSquad()
					break
				}
				case SocketMessage.GARDEN_BOSS_STARTED: {
					LeekWars.bossSquads.start(data)
					break
				}
				case SocketMessage.GARDEN_BOSS_LEFT: {
					LeekWars.bossSquads.left()
					break
				}
			}
		}
	}
	public retry() {
		if (store.getters.admin || LeekWars.LOCAL || LeekWars.DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
			const message = "[WS] retry(" + this.retry_delay + ")"
			console.log(message)
		}
		if (this.retry_count > 0 && !this.wrong_token) {
			this.retry_count--
			// console.log("[ws] retry in", this.retry_delay)
			setTimeout(() => this.connect(), this.retry_delay)
			this.retry_delay += 1000
		}
	}

	public send(message: any) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			// console.log("[WS] send", message)
			this.socket.send(JSON.stringify(message))
		} else {
			this.queue.push(message)
		}
	}
	public enableChannel(id: number) {
		this.send([SocketMessage.CHAT_ENABLE, id])
	}
	public disconnect() {
		if (store.getters.admin || LeekWars.LOCAL || LeekWars.DEV || (window.__FARMER__ && window.__FARMER__.farmer.id === 1)) {
			const message = "[WS] disconnect()"
			console.log(message)
		}
		if (this.socket) { this.socket.close() }
		store.commit('invalidate-chats')
	}
	public connected() {
		return this.socket && this.socket.readyState === WebSocket.OPEN
	}
	public connecting() {
		return this.socket && this.socket.readyState === WebSocket.CONNECTING
	}
}
export { Socket, SocketMessage }
