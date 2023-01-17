import { Chat, ChatMessage, ChatType } from '@/model/chat'
import { Farmer } from '@/model/farmer'
import { ItemType } from '@/model/item'
import { LeekWars } from '@/model/leekwars'
import { Notification, NotificationType } from '@/model/notification'
import { Team } from '@/model/team'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { AI } from './ai'
import { fileSystem } from './filesystem'
import { Hat } from './hat'
import { Leek } from './leek'
import { vueMain } from './vue'
import { Weapon } from './weapon'

class LeekWarsState {
	public token: string | null = null
	public connected: boolean = false
	public farmer: Farmer | null = null
	public chat: {[key: string]: Chat} = {}
	public wsconnected: boolean = false
	public wsdisconnected: boolean = false
	public supertoken: string = ''
	public unreadNotifications: number = 0
	public unreadMessages: number = 0
	public notifications: Notification[] = []
	public conversationsList: Chat[] = []
	public last_ping: number = 0
	public connected_farmers: number = 0
	public loadingConversations: boolean = false
	public habs_timer: any = null
	public crystals_timer: any = null
	public farmer_by_name: {[key: string]: Farmer} = {}
}

function updateTitle(state: LeekWarsState) {
	LeekWars.setTitleCounter(state.unreadNotifications + state.unreadMessages)
}

Vue.use(Vuex)

const store: Store<LeekWarsState> = new Vuex.Store({
	state: new LeekWarsState(),
	getters: {
		moderator: (state: LeekWarsState) => state.farmer && state.farmer.moderator,
		admin: (state: LeekWarsState) => state.farmer && state.farmer.admin,
		leek_count: (state: LeekWarsState) => state.farmer ? Object.values(state.farmer.leeks).length : 0,
	},
	mutations: {
		"connected"(state: LeekWarsState, token: string) {
			state.connected = true
			state.token = token
		},

		"connect"(state: LeekWarsState, data: {
				farmer: Farmer,
				farmers: number,
				message: string | null,
				unread: number,
				notifications: Notification[],
				conversations: any[],
				chats: {id: number, read: boolean}[],
				token: string
			}) {
			state.farmer = data.farmer
			for (const id in state.farmer.leeks) {
				Vue.set(state.farmer.leeks[id], 'country', state.farmer.country)
			}
			Vue.set(state.farmer, 'animated_habs', state.farmer.habs)
			Vue.set(state.farmer, 'animated_crystals', state.farmer.crystals)
			state.token = data.token
			state.connected = true
			state.connected_farmers = data.farmers
			state.farmer_by_name[data.farmer.name] = data.farmer
			localStorage.setItem('connected', 'true')
			localStorage.removeItem('login-attempt')
			if (LeekWars.DEV) {
				localStorage.setItem('token', data.token)
			}
			LeekWars.displayMessage(data.message)
			state.unreadNotifications = data.unread
			for (const notification of data.notifications.reverse()) {
				store.commit('notification', notification)
			}
			for (const conversation of data.conversations) {
				store.commit('new-conversation', conversation)
			}
			for (const chat of data.chats) {
				store.commit('register-chat', chat)
			}
			fileSystem.init(data.farmer)
			LeekWars.keepConnected = setInterval(() => {
				store.commit('last-connection', LeekWars.time)
				LeekWars.post('farmer/update').then(data => {
					store.commit('connected-count', data.farmers)
				})
			}, 59 * 1000)
			updateTitle(state)
			vueMain.$emit('connected', state.farmer)
		},

		"disconnect"(state: LeekWarsState) {
			LeekWars.post('farmer/disconnect')
			state.connected = false
			localStorage.removeItem('connected')
			localStorage.removeItem('login-attempt')
			localStorage.removeItem('token')
			localStorage.removeItem('editor/tabs')
			localStorage.removeItem('garden/category') // On revient à la catégorie potager par défaut
			state.token = null
			state.farmer = null
			window.__FARMER__ = null
			LeekWars.socket.disconnect()
			LeekWars.setTitleCounter(0)
			LeekWars.battleRoyale.leave()
			state.notifications = []
			state.conversationsList = []
			state.unreadNotifications = 0
			state.chat = {}
			fileSystem.clear()
			if (LeekWars.keepConnected) {
				clearInterval(LeekWars.keepConnected)
				LeekWars.keepConnected = null
			}
			console.clear()
		},

		"wsconnected"(state: LeekWarsState) {
			// console.log("store wsconnected")
			state.wsconnected = true
			state.wsdisconnected = false

			for (const chat of Object.values(state.chat)) {
				if (chat.opened && !chat.loaded) {
					// console.log("wsconnected chat", chat.name, chat.opened, chat.loaded)
					store.commit('register-chat', chat)
					store.commit('load-chat', chat)
				}
			}
			vueMain.$emit('wsconnected')
		},

		"wsclose"(state: LeekWarsState) {
			for (const chat in state.chat) {
				state.chat[chat].invalidated = true
			}
			state.wsconnected = false
			state.wsdisconnected = true
		},

		'register-chat'(state: LeekWarsState, data: {id: number, name: string, notifications: boolean}) {
			// console.log("register-chat", data.id)
			LeekWars.socket.enableChannel(data.id)
			if (!state.chat[data.id]) {
				const teamChat = state.farmer && state.farmer.team ? state.farmer.team.chat : null
				const groupeChat = state.farmer && state.farmer.groupe ? state.farmer.groupe.chat : null
				const type = LeekWars.isPublicChat(data.id) ? ChatType.GLOBAL : (data.id === teamChat ? ChatType.TEAM : (data.id === groupeChat ? ChatType.GROUP : ChatType.PM))
				const name = type === ChatType.GLOBAL ? LeekWars.publicChats[data.id].name : (type === ChatType.TEAM ? state.farmer!.team!.name : (type === ChatType.GROUP ? state.farmer!.groupe!.name : data.name))
				const chat = new Chat(data.id, type, name, data.notifications)
				Vue.set(state.chat, data.id, chat)
			}
		},

		'load-chat'(state: LeekWarsState, chat: Chat) {
			if (chat.loading || chat.loaded) return
			store.commit('reload-chat', chat)
		},

		'reload-chat'(state: LeekWarsState, chat: Chat) {
			if (chat.loading) return
			// console.log("load chat", chat, chat.id)
			state.chat[chat.id].opened = true
			state.chat[chat.id].loading = true
			LeekWars.get('message/get-messages/' + chat.id + '/' + 30 + '/0').then(data => {
				store.commit('clear-chat', chat.id)
				for (const farmer of data.mentions) {
					state.farmer_by_name[farmer.name] = farmer
				}
				for (const message of data.messages) {
					store.commit('chat-receive', { chat: chat.id, message, new: false })
				}
				for (const farmer of data.farmers) {
					store.commit('add-conversation-participant', {id: chat.id, farmer})
				}
				state.chat[chat.id].loaded = true
				state.chat[chat.id].loading = false
			}).error(() => {
				store.commit('clear-chat', chat.id)
				state.chat[chat.id].loaded = true
				state.chat[chat.id].loading = false
			})
		},

		'load-chat-history'(state: LeekWarsState, chatID: number) {
			const chat = state.chat[chatID]
			if (chat.messages.length < 30) {
				chat.fully_loaded = true
			}
			if (chat.loading || chat.fully_loaded) return
			chat.loading = true
			LeekWars.get('message/get-messages/' + chatID + '/' + 30 + '/' + chat.messages.length).then(data => {
				const chat = state.chat[chatID]
				if (data.messages.length === 0) {
					chat.fully_loaded = true
				}
				for (const farmer of data.mentions) {
					state.farmer_by_name[farmer.name] = farmer
				}
				for (const message of data.messages.reverse()) {
					store.commit('chat-receive', { chat: chatID, message, new: false, unshift: true })
				}
				vueMain.$emit('chat-history', chatID)
				chat.loading = false
			}).error(error => {
				LeekWars.toast(error.error)
				const chat = state.chat[chatID]
				vueMain.$emit('chat-history', chatID)
				chat.loading = false
			})
		},

		'clear-chat'(state: LeekWarsState, chatID: number) {
			// console.log("clear chat", chatID)
			const chat = state.chat[chatID]
			if (chat) {
				chat.clear()
			}
		},

		'toggle-chat-notifications'(state: LeekWarsState, chatID: number) {
			const chat = state.chat[chatID]
			if (chat) {
				chat.notifications = !chat.notifications
				LeekWars.post('message/toggle-notifications', {conversation_id: chat.id})
			}
		},

		'br'(state: LeekWarsState, data: any) {
			const channel = data[0]
			if (!state.chat[channel]) {
				const name = LeekWars.publicChats[channel].name
				Vue.set(state.chat, channel, new Chat(channel, ChatType.GLOBAL, name, false))
			}
			state.chat[channel].battleRoyale(data[1], data[2])
		},

		'chat-receive'(state: LeekWarsState, data: {chat: number, message: ChatMessage, new: boolean, unshift: boolean }) {

			if (!state.farmer) return
			// console.log("chat-receive message", data.chat, data.message)

			const chatID = data.chat
			const message = data.message
			const newChat = !state.chat[chatID]
			const type = chatID === 1 || chatID === 2 ? ChatType.GLOBAL : (state.farmer.team && chatID === state.farmer.team.chat ? ChatType.TEAM : ChatType.PM)

			// Update or create chat
			if (!state.chat[chatID]) {
				const name = type === ChatType.GLOBAL ? LeekWars.publicChats[chatID].name : (type === ChatType.TEAM ? state.farmer!.team!.name : message.farmer.name)
				Vue.set(state.chat, chatID, new Chat(chatID, type, name, type === ChatType.PM))
			}
			const chat = state.chat[chatID]

			// Load mentions
			if (message.mentions) {
				for (const farmer of message.mentions) {
					state.farmer_by_name[farmer.name] = farmer
				}
			}

			chat.last_date = message.date
			chat.last_farmer = message.farmer
			if (!chat.farmers.find(f => f.id === message.farmer.id)) {
				chat.farmers.push(message.farmer)
			}
			if (data.unshift) {
				chat.unshift(message)
			} else {
				chat.add(message)
				vueMain.$emit('chat', [chatID])
			}

			if (chat.type === ChatType.PM) {
				if (newChat) {
					state.conversationsList.unshift(chat)
				} else if (data.new) {
					const index = state.conversationsList.findIndex((c) => c.id === chatID)
					state.conversationsList.splice(index, 1)
					state.conversationsList.unshift(chat)
				}
			}
			// État non-lu (pas si bot)
			if (data.new && message.farmer.id !== 0) {
				store.commit('chat-set-read', { chat: chatID, read: false })
			}

			if (data.new && chat.type === ChatType.PM && state.farmer.id !== message.farmer.id) {
				LeekWars.squares.addFromMessage(message)
			}
		},

		'chat-set-read'(state: LeekWarsState, data: {chat: number, read: boolean}) {
			const chat = state.chat[data.chat]
			if (chat) {
				chat.read = data.read
				state.unreadMessages = state.conversationsList.reduce((sum, c) => sum + (c.read ? 0 : 1), 0)
				updateTitle(state)
			}
		},

		'add-conversation-participant'(state: LeekWarsState, data: {id: number, farmer: Farmer}) {
			const chat = state.chat[data.id]
			if (chat && !chat.farmers.find(f => f.id === data.farmer.id)) {
				chat.farmers.push(data.farmer)
			}
		},

		'update-crystals'(state: LeekWarsState, crystals: number) {
			if (state.farmer) {
				state.farmer.crystals += crystals
				clearTimeout(state.crystals_timer)
				const increment = (state.farmer!.crystals - state.farmer!.animated_crystals) / 23
				const update = () => {
					state.farmer!.animated_crystals = state.farmer!.animated_crystals + increment
					if (Math.abs(state.farmer!.animated_crystals - state.farmer!.crystals) > 0.4) {
						state.crystals_timer = setTimeout(update, 41)
					} else {
						state.farmer!.animated_crystals = state.farmer!.crystals
					}
				}
				update()
			}
		},

		'set-habs'(state: LeekWarsState, habs: number) {
			if (state.farmer) {
				state.farmer.habs = habs
			}
		},

		'update-habs'(state: LeekWarsState, habs: number) {
			if (state.farmer) {
				state.farmer.habs += habs
				clearTimeout(state.habs_timer)
				const increment = (state.farmer.habs - state.farmer.animated_habs) / 23
				const update = () => {
					state.farmer!.animated_habs = state.farmer!.animated_habs + increment
					if (Math.abs(state.farmer!.animated_habs - state.farmer!.habs) > 0.4) {
						state.habs_timer = setTimeout(update, 41)
					} else {
						state.farmer!.animated_habs = state.farmer!.habs
					}
				}
				update()
			}
		},

		'update-fights'(state: LeekWarsState, fights: number) {
			if (state.farmer) { state.farmer.fights += fights }
		},

		'set-talent'(state: LeekWarsState, talent: number) {
			if (state.farmer) { state.farmer.talent = talent }
		},

		'set-leek-talents'(state: LeekWarsState, talents: any) {
			if (state.farmer) {
				for (const i in talents) {
					state.farmer.leeks[parseInt(i, 10)].talent = talents[i]
				}
			}
		},

		'rename-leek'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].name = data.name
			}
		},

		'rename-farmer'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.name = data.name
			}
		},

		'update-capital'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].capital = data.capital
			}
		},

		'change-skin'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].skin = data.skin
			}
		},

		'change-fish'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].fish = data.fish
			}
		},

		'change-hat'(state: LeekWarsState, data: { leek: number, hat: Hat }) {
			if (state.farmer) {
				const leek = state.farmer.leeks[data.leek]
				if (data.hat) {
					for (let h = 0; h < state.farmer.hats.length; ++h) {
						if (state.farmer.hats[h].hat_template === data.hat.hat_template) {
							state.farmer.hats[h].quantity--
							if (state.farmer.hats[h].quantity === 0) {
								state.farmer.hats.splice(h, 1)
							}
							break
						}
					}
				}
				if (leek.hat) {
					const template = LeekWars.hats[leek.hat.hat_template]
					let found = false
					for (const hat of state.farmer.hats) {
						if (hat.template === leek.hat.template) {
							hat.quantity++
							found = true
							break
						}
					}
					if (!found) {
						const newHat = {
							template: leek.hat.template,
							id: leek.hat.id,
							name: template.name,
							level: template.level,
							hat_template: leek.hat.hat_template,
							quantity: 1
						}
						state.farmer.hats.push(newHat)
					}
				}
				leek.hat = data.hat
			}
		},

		notification(state: LeekWarsState, data: { id: number, type: number, date: number, parameters: any[], new: boolean }) {
			if (data.new) {
				// Received a new trophy, invalidate farmer trophies, add to rewards
				if (state.farmer && data.type === NotificationType.TROPHY_UNLOCKED) {
					Vue.delete(state.farmer, 'trophies_list')
					const trophy = parseInt(data.parameters[0], 10)
					import("@/model/trophies").then(module => {
						state.farmer!.rewards.push({
							trophy,
							habs: module.TROPHIES[trophy - 1].habs
						})
					})
				}
			}

			import("@/model/notification-builder").then(module => {

				const notification = module.NotificationBuilder.build(data)
				state.notifications.unshift(notification)

				if (data.new) {
					state.unreadNotifications = state.notifications.reduce((sum, n) => sum + (n.read ? 0 : 1), 0)
					updateTitle(state)
					LeekWars.squares.addFromNotification(notification)
				}
			})
		},

		'chat-censor'(state: LeekWarsState, data: {chat: number, messages: number[], censorer: Farmer}) {
			const chat = state.chat[data.chat]
			// console.log("censor chat", chat)
			if (chat) {
				for (const messageID of data.messages) {
					for (const message of chat.messages) {
						if (message.id === messageID) {
							message.censored = Date.now() / 1000
							message.censored_by = data.censorer
							break
						}
					}
				}
			}
		},

		'chat-delete'(state: LeekWarsState, data: {chat: number, messages: number[], censorer: Farmer}) {
			const chat = state.chat[data.chat]
			// console.log("delete chat", chat, data.messages)
			if (chat) {
				for (const message of data.messages) {
					chat.deleteMessage(message)
				}
			}
		},

		'chat-react'(state: LeekWarsState, data: {chat: number, message: number, reaction: string, old: string, farmer: string}) {
			const chat = state.chat[data.chat]
			if (chat) {
				for (const message of chat.messages) {
					if (message.id === data.message) {
						if (data.old) {
							message.reactions[data.old].count--
							const i = message.reactions[data.old].farmers.indexOf(data.farmer)
							if (i !== -1) {
								message.reactions[data.old].farmers.splice(i, 1)
							}
							if (message.reactions[data.old].count === 0) {
								Vue.delete(message.reactions, data.old)
							}
						}
						if (data.reaction) {
							if (data.reaction in message.reactions) {
								message.reactions[data.reaction].count++
								message.reactions[data.reaction].farmers.push(data.farmer)
							} else {
								Vue.set(message.reactions, data.reaction, { count: 1, farmers: [ data.farmer ] })
							}
						}
						break
					}
				}
			}
		},

		'new-conversation'(state: LeekWarsState, data: any) {
			// console.log("new-conversation", data)
			let chat = state.chat[data.id]
			if (!chat) {
				const last_farmer = data.farmers.find((f: any) => f.id === data.last_farmer_id)
				const other_farmer = data.farmers.find((f: any) => f.id !== state.farmer!.id)
				chat = new Chat(data.id, data.type ? data.type : ChatType.PM, other_farmer ? other_farmer.name : '?', true)
				chat.last_date = data.last_date
				chat.last_farmer = last_farmer
				chat.last_message = data.last_message
				Vue.set(state.chat, data.id, chat)
				state.conversationsList.push(chat)
			}
			chat.farmers = [...data.farmers]
			store.commit('chat-set-read', { chat: chat.id, read: data.read })
		},

		'quit-conversation'(state: LeekWarsState, id: number) {
			if (id in state.chat) {
				Vue.delete(state.chat, '' + id)
				const index = state.conversationsList.findIndex((chat) => chat.id === id)
				state.conversationsList.splice(index, 1)
			}
		},

		'read-notifications'(state: LeekWarsState) {
			state.unreadNotifications = 0
			for (const notification of state.notifications) {
				notification.read = true
			}
			updateTitle(state)
		},

		'read-notification'(state: LeekWarsState, id: number) {
			for (const notification of state.notifications) {
				if (notification.id === id) {
					notification.read = true
					state.unreadNotifications = state.notifications.reduce((sum, n) => sum + (n.read ? 0 : 1), 0)
					updateTitle(state)
					break
				}
			}
		},

		'add-inventory'(state: LeekWarsState, data: { type: ItemType, id: number, quantity: number, template: number }) {
			if (!state.farmer) { return }
			// console.log("add-inventory", data)
			const quantity = data.quantity || 1
			if (data.type === ItemType.WEAPON) {
				const weapon = LeekWars.selectWhere(state.farmer.weapons, 'id', data.id)
				if (weapon !== null) {
					weapon.quantity += quantity
				} else {
					state.farmer.weapons.push({id: data.id, template: data.template, quantity: 1})
				}
			} else if (data.type === ItemType.CHIP) {
				const chip = LeekWars.selectWhere(state.farmer.chips, 'id', data.id)
				if (chip !== null) {
					chip.quantity += quantity
				} else {
					state.farmer.chips.push({id: data.id, template: data.template, quantity: 1})
				}
			} else if (data.type === ItemType.HAT) {
				const hat = LeekWars.selectWhere(state.farmer.hats, 'id', data.id)
				if (hat !== null) {
					hat.quantity += quantity
				} else {
					const item_template = LeekWars.items[data.template]
					const hat_template = LeekWars.hats[item_template.params]
					state.farmer.hats.push({
						id: data.id,
						template: data.template,
						name: hat_template.name,
						level: hat_template.level,
						hat_template: hat_template.id,
						quantity: 1
					})
				}
			} else if (data.type === ItemType.POTION) {
				const potion = LeekWars.selectWhere(state.farmer.potions, 'id', data.id)
				if (potion !== null) {
					potion.quantity += quantity
				} else {
					state.farmer.potions.push({id: data.id, template: data.template, quantity: 1})
				}
			} else if (data.type === ItemType.POMP) {
				const pomp = LeekWars.selectWhere(state.farmer.pomps, 'id', data.id)
				if (pomp) {
					pomp.quantity += quantity
				} else {
					state.farmer.pomps.push(data)
				}
			} else if (data.type === ItemType.RESOURCE) {
				const resource = LeekWars.selectWhere(state.farmer.resources, 'id', data.id)
				if (resource) { // Même ID d'item
					resource.quantity += quantity
				} else {
					// Même template : on stack
					for (const resource of state.farmer.resources) {
						if (resource.template === data.template) {
							resource.quantity += quantity
							return
						}
					}
					// Sinon on ajoute
					state.farmer.resources.push(data)
				}
			}
		},

		'remove-inventory'(state: LeekWarsState, data) {
			if (!state.farmer) { return }
			// console.log(data)
			const quantity = data.quantity || 1
			let list = null
			if (data.type === ItemType.WEAPON) {
				list = state.farmer.weapons
			} else if (data.type === ItemType.CHIP) {
				list = state.farmer.chips
			} else if (data.type === ItemType.POTION) {
				list = state.farmer.potions
			} else if (data.type === ItemType.RESOURCE) {
				list = state.farmer.resources
			}
			const item = LeekWars.selectWhere(list, 'template', data.item_template)
			if (item !== null) {
				item.quantity -= quantity
				if (item.quantity <= 0) {
					LeekWars.removeOneWhere(list, 'template', data.item_template)
				}
			}
		},

		'didactitiel-seen'(state: LeekWarsState) {
			if (state.farmer) { state.farmer.didactitiel_seen = true }
		},

		'add-weapon'(state: LeekWarsState, weapon) {
			if (!state.farmer) { return }
			for (const w of state.farmer.weapons) {
				if (w.template === weapon.template) {
					w.quantity++
					return
				}
			}
			state.farmer.weapons.push({id: weapon.id, quantity: 1, template: weapon.template})
		},

		'remove-weapon'(state: LeekWarsState, weapon: Weapon) {
			if (!state.farmer) { return }
			for (let w = 0; w < store.state.farmer!.weapons.length; ++w) {
				const f_weapon = store.state.farmer!.weapons[w]
				if (f_weapon.template === weapon.template) {
					f_weapon.quantity--
					if (f_weapon.quantity === 0) {
						state.farmer.weapons.splice(w, 1)
					}
					return
				}
			}
		},

		'add-chip'(state: LeekWarsState, chip) {
			if (!state.farmer) { return }
			for (const c of state.farmer.chips) {
				if (c.template === chip.template) {
					c.quantity++
					return
				}
			}
			state.farmer.chips.push({id: chip.id, quantity: 1, template: chip.template})
		},

		'remove-chip'(state: LeekWarsState, chip) {
			if (!state.farmer) { return }
			for (let w = 0; w < store.state.farmer!.chips.length; ++w) {
				const f_chip = store.state.farmer!.chips[w]
				if (f_chip.template === chip.template) {
					f_chip.quantity--
					if (f_chip.quantity === 0) {
						state.farmer.chips.splice(w, 1)
					}
					return
				}
			}
		},

		'last-connection'(state: LeekWarsState, time: number) {
			if (!state.farmer) { return }
			state.farmer.last_connection = time
		},

		'last-ping'(state: LeekWarsState, time: number) {
			state.last_ping = time
		},

		'receive-pong'(state: LeekWarsState, data: any) {
			// const channel = data[0]
			// if (!state.chat[channel]) {
				// Vue.set(state.chat, channel, new Chat(channel, ChatType.GLOBAL, false))
			// }
			// state.chat[channel].add(state.farmer!.id, state.farmer!.name, state.farmer!.avatar_changed, state.farmer!.grade, "pong ! " + (Date.now() - state.last_ping) + "ms", Date.now() / 1000)
			// vueMain.$emit('chat', [channel])
		},

		'create-team'(state: LeekWarsState, team: Team) {
			if (state.farmer) {
				state.farmer.team = team
			}
		},

		'dissolve-team'(state: LeekWarsState) {
			if (state.farmer) {
				state.farmer.team = null
			}
		},

		'update-emblem'(state: LeekWarsState) {
			if (state.farmer && state.farmer.team) {
				state.farmer.team.emblem_changed = Date.now() / 1000
			}
		},

		'level-up'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].level = data.level
				state.farmer.leeks[data.leek].capital = data.capital
			}
		},

		'add-ai'(state: LeekWarsState, ai: AI) {
			if (state.farmer) {
				state.farmer.ais.push(ai)
			}
		},

		'delete-ai'(state: LeekWarsState, id: number) {
			if (state.farmer) {
				state.farmer.ais = state.farmer.ais.filter(ai => ai.id !== id)
			}
		},

		'set-title'(state: LeekWarsState, title: number[]) {
			if (state.farmer) {
				state.farmer.title = title
			}
		},

		'set-leek-title'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				const leek = state.farmer.leeks[data.leek]
				leek.title = data.title
			}
		},

		'set-leek-weapon'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				const leek = state.farmer.leeks[data.leek]
				leek.weapon = data.weapon
			}
		},

		'toggle-show-ai-lines'(state: LeekWarsState) {
			if (state.farmer) {
				state.farmer.show_ai_lines = !state.farmer.show_ai_lines
			}
		},

		'toggle-metal'(state: LeekWarsState, leek: number) {
			if (state.farmer) {
				state.farmer.leeks[leek].metal = !state.farmer.leeks[leek].metal
			}
		},

		'set-face'(state: LeekWarsState, data: {leek: number, face: number}) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].face = data.face
			}
		},

		'set-trophies'(state: LeekWarsState, trophies) {
			if (state.farmer) {
				Vue.set(state.farmer, 'trophies_list', trophies)
			}
		},

		'connected-count'(state: LeekWarsState, farmers) {
			state.connected_farmers = farmers
		},

		'new-leek'(state: LeekWarsState, leek: Leek) {
			if (state.farmer) {
				Vue.set(state.farmer.leeks, leek.id, leek)
			}
		},

		'load-conversations'(state: LeekWarsState) {
			state.loadingConversations = true
			LeekWars.get('message/get-conversations/' + state.conversationsList.length + '/25').then(data => {
				for (const conversation of data.conversations) {
					store.commit('new-conversation', conversation)
				}
				state.loadingConversations = false
			})
		},

		'remove-reward'(state: LeekWarsState, trophy: number) {
			if (state.farmer) {
				state.farmer.rewards = state.farmer.rewards.filter(r => r.trophy !== trophy)
			}
		},

		'remove-all-rewards'(state: LeekWarsState) {
			if (state.farmer) {
				state.farmer.rewards = []
			}
		},

		'update-xp'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].xp += data.xp
			}
		},

		'update-leek-talent'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].talent += data.talent
			}
		},

		'update-farmer-talent'(state: LeekWarsState, talent: number) {
			if (state.farmer) {
				state.farmer.talent += talent
			}
		},

		'invalidate-chats'(state: LeekWarsState) {
			// console.log("invalidate chats")
			for (const chat of Object.values(state.chat)) {
				chat.loaded = false
			}
		},

		'add-resource'(state: LeekWarsState, data: { template: number, id: number }) {
			// console.log("add resource", data);
			if (state.farmer) {
				for (const resource of state.farmer.resources) {
					if (resource.template === data.template) {
						resource.quantity += 1
						return
					}
				}
				state.farmer.resources.push({ template: data.template, id: data.id, quantity: 1 })
			}
		},

		'remove-error'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				state.farmer.errors--
			}
		},
		'error-count'(state: LeekWarsState, count: number) {
			if (state.farmer) {
				state.farmer.errors = count
			}
		},
		'set-tutorial-progress'(state: LeekWarsState, progress: number) {
			if (state.farmer) {
				state.farmer.tutorial_progress = progress
			}
		}
	},
})
export { store }
