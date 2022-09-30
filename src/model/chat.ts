import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import Vue from 'vue'

enum ChatType { GLOBAL, TEAM, PM }

class ChatMessage {
	id!: number
	chat!: number
	farmer!: Farmer
	content!: string
	contents: string[] = []
	date!: number
	day!: number
	subMessages: ChatMessage[] = []
	censored!: number
	censored_by!: Farmer | null
	read!: boolean
	reactions!: {[key: string]: { count: number, farmers: string[] }}
	my_reaction!: string | null
	only_emojis!: boolean
	mentions!: Farmer[]
	formatted: boolean = false
}

class ChatWindow {
	id!: number
	type!: ChatType
	title!: string
	expanded: boolean = true
}

class Chat {
	id: number
	type: ChatType
	name!: string
	notifications: boolean
	messages: ChatMessage[] = []
	messages_by_day: {[key: number]: ChatMessage[]} = {}
	days: ChatMessage[][] = []
	invalidated: boolean = false
	read: boolean = true
	last_message: string | null = null
	last_farmer: Farmer | null = null
	last_date: number | null = null
	farmers: Farmer[] = []
	loaded: boolean = false
	opened: boolean = false
	loading: boolean = false
	fully_loaded: boolean = false

	constructor(id: number, type: ChatType, name: string, notifications: boolean) {
		this.id = id
		this.type = type
		this.name = name
		this.notifications = notifications
	}

	add(message: ChatMessage) {
		// console.log("chat add", message, this)
		this.messages.push(message)

		if (!this.messages_by_day[message.day]) {
			Vue.set(this.messages_by_day, message.day, [])
			this.days.push(this.messages_by_day[message.day])
		}
		const day_messages = this.messages_by_day[message.day]
		if (day_messages.length) {
			const lastMessage = day_messages[day_messages.length - 1]
			if (lastMessage.farmer.id === message.farmer.id && message.date - lastMessage.date < 120) {
				if (!lastMessage.subMessages) {
					Vue.set(lastMessage, 'subMessages', [])
				}
				lastMessage.subMessages.push(message)
				return
			}
		}
		Vue.set(this, 'last_message', message.content.replace(/<br>/g, '\n'))
		day_messages.push(message)
	}

	unshift(message: ChatMessage) {
		// console.log("chat add", message, this)
		this.messages.unshift(message)

		if (!this.messages_by_day[message.day]) {
			Vue.set(this.messages_by_day, message.day, [])
			this.days.unshift(this.messages_by_day[message.day])
		}
		this.messages_by_day[message.day].unshift(message)
	}

	battleRoyale(fightID: number, time: number) {
		this.add({
			id: 0,
			chat: this.id,
			farmer: { id: 0, name: "Leek Wars" } as Farmer,
			content: '',
			contents: [i18n.t('main.br_started_message') as string, '' + fightID],
			subMessages: [],
			date: time,
			day: 0,
			censored: 0,
			censored_by: null,
			read: false,
			reactions: {},
			my_reaction: null,
			only_emojis: false,
			mentions: [],
			formatted: false
		})
	}

	deleteMessage(messageID: number) {
		// Delete from messages list
		for (let m = 0; m < this.messages.length; ++m) {
			if (this.messages[m].id === messageID) {
				this.messages.splice(m, 1)
				break
			}
		}
		// Delete from day lists
		for (const messages of Object.values(this.messages_by_day)) {
			for (let m = 0; m < messages.length; ++m) {
				const message = messages[m]
				if (message.id === messageID) {
					if (message.subMessages && message.subMessages.length) {
						// Remonte le premier sous-message
						const firstSubMessage = message.subMessages.shift()!
						firstSubMessage.subMessages = message.subMessages
						messages.splice(m, 1, firstSubMessage)
					} else {
						// Sinon on supprime juste
						messages.splice(m, 1)
					}
					break
				}
			}
		}
	}

	clear() {
		this.messages = []
		this.messages_by_day = {}
		this.days = []
	}
}

export { Chat, ChatType, ChatMessage, ChatWindow }