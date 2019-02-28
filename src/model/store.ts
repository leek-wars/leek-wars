import { Chat, ChatType } from '@/model/chat'
import { Conversation } from '@/model/conversation'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { ItemType } from '@/model/item'
import { LeekWars } from '@/model/leekwars'
import { Notification } from '@/model/notification'
import { Team } from '@/model/team'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { vueMain } from './vue'

class LeekWarsState {
	public token: string | null = null
	public connected: boolean = false
	public farmer: Farmer | null = null
	public chat: {[key: string]: Chat} = {}
	public wsconnected: boolean = false
	public supertoken: string = ''
	public unreadMessages: number = 0
	public unreadNotifications: number = 0
	public notifications: Notification[] = []
	public conversations: {[key: number]: Conversation} = {}
	public conversationsList: Conversation[] = []
	public last_ping: number = 0
}

function updateTitle(state: LeekWarsState) {
	LeekWars.setTitleCounter(state.unreadNotifications + state.unreadMessages)
}
function loadNotifications(state: LeekWarsState) {
	LeekWars.get<any>('notification/get-latest/20/' + state.token).then((data: any) => {
		if (data.success) {
			state.unreadNotifications = data.unread
			updateTitle(state)
			for (const notification of data.notifications.reverse()) {
				store.commit('notification', notification)
			}
		}
	})
}
function loadMessages(state: LeekWarsState) {
	LeekWars.get<any>('message/get-latest-conversations/20/' + state.token).then((data: any) => {
		if (data.success) {
			state.unreadMessages = data.unread
			updateTitle(state)
			for (const conversation of data.conversations) {
				store.commit('new-conversation', conversation)
			}
		}
	})
}

Vue.use(Vuex)
const store: Store<LeekWarsState> = new Vuex.Store({
	state: new LeekWarsState(),
	getters: {
		moderator: (state: LeekWarsState) => state.farmer && state.farmer.moderator,
		admin: (state: LeekWarsState) => state.farmer && state.farmer.admin,
	},
	mutations: {
		"connected"(state: LeekWarsState, token: string) {
			state.connected = true
			state.token = token
		},
		"connect"(state: LeekWarsState, data: {farmer: Farmer, token: string}) {
			state.farmer = data.farmer
			state.token = data.token
			state.connected = true
			localStorage.setItem('connected', 'true')
			if (LeekWars.dev) {
				localStorage.setItem('token', data.token)
			}
			loadNotifications(state)
			loadMessages(state)
			vueMain.$emit('connected')
		},
		"disconnect"(state: LeekWarsState) {
			LeekWars.post('farmer/disconnect')
			state.connected = false
			localStorage.removeItem('connected')
			localStorage.removeItem('token')
			state.token = null
			state.farmer = null
			LeekWars.socket.disconnect()
			LeekWars.setTitleCounter(0)
			LeekWars.battleRoyale.leave()
			state.notifications = []
			state.conversations = {}
			state.conversationsList = []
			state.unreadMessages = 0
			state.unreadNotifications = 0
			state.chat = {}
			console.clear()
		},
		"wsconnected"(state: LeekWarsState) {
			state.wsconnected = true
		},
		"wsclose"(state: LeekWarsState) {
			state.wsconnected = false
		},
		'init-team-chat'(state: LeekWarsState) {
			if (!state.chat.team) {
				Vue.set(state.chat, 'team', new Chat('team', ChatType.TEAM))
			}
		},
		'chat-receive'(state: LeekWarsState, data: any) {
			const channel = data.message[0]
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel, ChatType.GLOBAL))
			}
			state.chat[channel].add(data.message[1], data.message[2], data.message[6], data.message[5], data.message[3], data.message[4])
			vueMain.$emit('chat', [channel])
		},
		'chat-team-receive'(state: LeekWarsState, data: any) {
			if (!state.chat.team) {
				Vue.set(state.chat, 'team', new Chat("team", ChatType.TEAM))
			}
			state.chat.team.add(data.message[0], data.message[1], data.message[5], data.message[4], data.message[2], data.message[3])
			vueMain.$emit('chat', ['team'])
		},
		'br'(state: LeekWarsState, data: any) {
			const channel = data[0]
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel, ChatType.GLOBAL))
			}
			state.chat[channel].battleRoyale(data[1], data[2])
		},
		'pm-receive'(state: LeekWarsState, data: any) {
			const conversationID = data.message[0]
			const senderID = data.message[1]
			const senderName = data.message[2]
			const channel = 'pm-' + conversationID
			const isNewMessage = !data.message[7]
			const date = data.message[7] || LeekWars.time
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel, ChatType.PM))
			}
			state.chat[channel].add(senderID, senderName, data.message[6], data.message[5], data.message[3], date)
			vueMain.$emit('chat', [channel])
			let conversation = state.conversations[conversationID]
			if (!conversation) {
				conversation = {id: conversationID,	farmers: [], unread: false} as any
				Vue.set(state.conversations, conversationID, conversation)
				state.conversationsList.unshift(conversation)
			} else if (isNewMessage) {
				const index = state.conversationsList.findIndex((c) => c.id === conversationID)
				state.conversationsList.splice(index, 1)
				state.conversationsList.unshift(conversation)
				if (!conversation.unread && senderID !== state.farmer!.id) {
					conversation.unread = true
					state.unreadMessages++
					updateTitle(state)
				}
			}
			conversation.last_message = data.message[3]
			conversation.last_farmer_id = senderID
			conversation.last_farmer_name = senderName
			if (!conversation.farmers.find(f => f.id === senderID)) {
				conversation.farmers.push({id: senderID, name: senderName, avatar_changed: data.message[6]} as Farmer)
			}
			if (isNewMessage && conversation.last_farmer_id !== state.farmer!.id) {
				LeekWars.squares.add({
					image: LeekWars.getAvatar(conversation.last_farmer_id, data.message[6]),
					title: senderName,
					message: "► " + conversation.last_message,
					link: "/messages/conversation/" + conversationID,
					padding: false
				})
			}
		},
		'add-conversation-participant'(state: LeekWarsState, data: {id: number, farmer: Farmer}) {
			const conversation = state.conversations[data.id]
			if (conversation && !conversation.farmers.find(f => f.id === data.farmer.id)) {
				conversation.farmers.push(data.farmer)
			}
		},
		'update-crystals'(state: LeekWarsState, crystals: number) {
			if (state.farmer) { state.farmer.crystals += crystals }
		},
		'set-habs'(state: LeekWarsState, habs: number) {
			if (state.farmer) { state.farmer.habs = habs }
		},
		'update-habs'(state: LeekWarsState, habs: number) {
			if (state.farmer) { state.farmer.habs += habs }
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
		'change-hat'(state: LeekWarsState, data: any) {
			if (state.farmer) {
				const leek = state.farmer.leeks[data.leek]
				if (data.hat) {
					for (let h = 0; h < state.farmer.hats.length; ++h) {
						if (state.farmer.hats[h].hat_template === data.hat) {
							state.farmer.hats.splice(h, 1)
							break
						}
					}
				}
				if (leek.hat) {
					const template = LeekWars.hats[LeekWars.hatTemplates[leek.hat].item]
					const newHat = {
						template: LeekWars.hatTemplates[leek.hat].item,
						id: 0,
						name: template.name,
						level: template.level,
						hat_template: leek.hat
					}
					state.farmer.hats.push(newHat)
				}
				leek.hat = data.hat
			}
		},
		notification(state: LeekWarsState, data: any) {
			if (data.unread) {
				state.unreadNotifications = data.unread
				updateTitle(state)
			}
			const notification = Notification.build(data)
			state.notifications.unshift(notification)
			if (data.unread) {
				LeekWars.squares.add({
					image: '/image/notif/' + notification.image + '.png',
					title: i18n.t('notifications.title_' + notification.type, notification.title) as string,
					message: i18n.t('notifications.message_' + notification.type, notification.message) as string,
					link: notification.link,
					padding: true
				})
			}
		},
		'new-conversation'(state: LeekWarsState, data: any) {
			const conversation = state.conversations[data.id]
			if (!conversation) {
				Vue.set(state.conversations, data.id, data)
				state.conversationsList.push(data)
			} else {
				conversation.farmers.push(data.farmers[0])
			}
		},
		'quit-conversation'(state: LeekWarsState, id: number) {
			if (id in state.conversations) {
				Vue.delete(state.conversations, '' + id)
				const index = state.conversationsList.findIndex((conversation) => conversation.id === id)
				state.conversationsList.splice(index, 1)
			}
		},
		'unread-messages'(state: LeekWarsState, unread: number) {
			state.unreadMessages = unread
			updateTitle(state)
		},
		'read-notifications'(state: LeekWarsState) {
			state.unreadNotifications = 0
			updateTitle(state)
		},
		'unread-notifications'(state: LeekWarsState, unread: number) {
			state.unreadNotifications = unread
			updateTitle(state)
		},
		'add-inventory'(state: LeekWarsState, data) {
			if (!state.farmer) { return }
			if (data.type === ItemType.WEAPON) {
				state.farmer.weapons.push({id: data.item_id, template: data.item_template})
			} else if (data.type === ItemType.CHIP) {
				state.farmer.chips.push({id: data.item_id, template: data.item_template})
			} else if (data.type === ItemType.HAT) {
				const hat_template = LeekWars.getHatTemplate(data.item_template)
				state.farmer.hats.push({id: data.item_id, template: data.item_template, hat_template})
			} else if (data.type === ItemType.POTION) {
				const potion = LeekWars.selectWhere(state.farmer.potions, 'id', data.item_id)
				if (potion !== null) {
					potion.quantity++
				} else {
					state.farmer.potions.push({id: data.item_id, template: data.item_template, quantity: 1})
				}
			}
		},
		'remove-inventory'(state: LeekWarsState, data) {
			if (!state.farmer) { return }
			if (data.type === ItemType.WEAPON) {
				LeekWars.removeOneWhere(state.farmer.weapons, 'template', data.item_template)
			} else if (data.type === ItemType.CHIP) {
				LeekWars.removeOneWhere(state.farmer.chips, 'template', data.item_template)
			} else if (data.type === ItemType.POTION) {
				const potion = LeekWars.selectWhere(state.farmer.potions, 'template', data.item_template)
				if (potion !== null) {
					potion.quantity--
				} else {
					LeekWars.removeOneWhere(state.farmer.potions, 'template', data.item_template)
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
					state.farmer.weapons.push({id: w.id, template: weapon.template})
					return
				}
			}
			state.farmer.weapons.push(weapon)
		},
		'remove-weapon'(state: LeekWarsState, weapon) {
			if (!state.farmer) { return }
			state.farmer.weapons.splice(state.farmer.weapons.findIndex((w) => w.id === weapon.id), 1)
		},
		'add-chip'(state: LeekWarsState, chip) {
			if (!state.farmer) { return }
			for (const c of state.farmer.chips) {
				if (c.template === chip.template) {
					state.farmer.chips.push({id: c.id, template: chip.template})
					return
				}
			}
			state.farmer.chips.push(chip)
		},
		'remove-chip'(state: LeekWarsState, chip) {
			if (!state.farmer) { return }
			state.farmer.chips.splice(state.farmer.chips.findIndex((c) => c.id === chip.id), 1)
		},
		'last-connection'(state: LeekWarsState, time: number) {
			if (!state.farmer) { return }
			state.farmer.last_connection = time
		},
		'last-ping'(state: LeekWarsState, time: number) {
			state.last_ping = time
		},
		'receive-pong'(state: LeekWarsState, data: any) {
			const channel = data[0]
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel, ChatType.GLOBAL))
			}
			state.chat[channel].add(state.farmer!.id, state.farmer!.name, state.farmer!.avatar_changed, state.farmer!.grade, "pong ! " + (Date.now() - state.last_ping) + "ms", Date.now() / 1000)
			vueMain.$emit('chat', [channel])
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
		}
	},
})
export { store }
