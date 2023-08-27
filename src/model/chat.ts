import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import Vue from 'vue'

enum ChatType { GLOBAL, TEAM, PM, GROUP }

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
		this.prepare(message)
		this.messages.push(message)
		Vue.set(message, 'subMessages', [])

		if (!this.messages_by_day[message.day]) {
			Vue.set(this.messages_by_day, message.day, [])
			this.days.push(this.messages_by_day[message.day])
		}
		const day_messages = this.messages_by_day[message.day]
		if (day_messages.length) {
			const lastMessage = day_messages[day_messages.length - 1]
			if (lastMessage.farmer.id === message.farmer.id && message.date - lastMessage.date < 120) {
				lastMessage.subMessages.push(message)
				return
			}
		}
		Vue.set(this, 'last_message', message.content.replace(/<br>/g, '\n'))
		day_messages.push(message)
	}

	unshift(message: ChatMessage) {
		// console.log("chat add", message, this)
		this.prepare(message)
		this.messages.unshift(message)

		if (!this.messages_by_day[message.day]) {
			Vue.set(this.messages_by_day, message.day, [])
			this.days.unshift(this.messages_by_day[message.day])
		}
		this.messages_by_day[message.day].unshift(message)
	}

	prepare(message: ChatMessage) {

		Vue.set(message, 'day', this.getDay(message.date))
		if (!message.reactions) {
			Vue.set(message, 'reactions', {})
		}
	}

	getDay(date: number) {
		const d = new Date(date * 1000)
		d.setHours(0)
		d.setMinutes(0)
		d.setSeconds(0)
		d.setMilliseconds(0)
		return d.getTime()
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
					if (message.subMessages.length) {
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