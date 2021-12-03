import { env } from '@/env'
import { LeekWars } from '@/model/leekwars'
import { vueMain } from '@/model/vue'
import router from '@/router'
import { ChatMessage, ChatType } from './chat'
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
}

class Socket {
	public socket!: WebSocket
	public queue: any[] = []
	public retry_count: number = 10
	public retry_delay: number = 1000

	public connect() {
		if (!store.state.farmer || this.connecting() || this.connected()) {
			return
		}
		const url = LeekWars.LOCAL ? "ws://localhost:1213/" : "wss://leekwars.com/ws"
		this.socket = new WebSocket(url)

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
		}
		this.socket.onclose = () => {
			// console.log("[ws] onclose")
			store.commit('wsclose')
			this.retry()
		}
		this.socket.onmessage = (msg: any) => {
			// console.log("[ws] onmessage", msg)
			const json = JSON.parse(msg.data)
			const id = json[0]
			const data = json[1]
			vueMain.$emit('wsmessage', {type: id, data})

			switch (id) {
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
					} else if (message.type === NotificationType.UP_LEVEL) {
						const leek = parseInt(message.parameters[0], 10)
						const level = parseInt(message.parameters[1], 10)
						const capital = parseInt(message.parameters[2], 10)
						store.commit('level-up', {leek, level, capital})
					} else {
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
					store.commit('chat-receive', { chat: message.chat, message, new: true })
					break
				}
				case SocketMessage.CHAT_RECEIVE_PACK : {
					store.commit('chat-receive-pack', data)
					break
				}
				case SocketMessage.LUCKY: {
					LeekWars.lucky()
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
				case SocketMessage.CHAT_REACT: {
					store.commit('chat-react', { chat: data[0], message: data[1], reaction: data[2], old: data[3] })
					break
				}
			}
		}
	}
	public retry() {
		if (this.retry_count > 0) {
			this.retry_count--
			// console.log("[ws] retry in", this.retry_delay)
			setTimeout(() => this.connect(), this.retry_delay)
			this.retry_delay += 1000
		}
	}

	public send(message: any) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(message))
		} else {
			this.queue.push(message)
		}
	}
	public enableChannel(id: number) {
		this.send([SocketMessage.CHAT_ENABLE, id])
	}
	public disconnect() {
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
