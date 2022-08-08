import { Commands } from '@/model/commands'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Vue from 'vue'
import { store } from './store'

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

	getDay(date: number) {
		const d = new Date(date * 1000)
		d.setHours(0)
		d.setMinutes(0)
		d.setSeconds(0)
		d.setMilliseconds(0)
		return d.getTime()
	}

	add(message: ChatMessage) {
		// console.log("chat add", message, this)
		this.formatMessage(message)
		this.messages.push(message)

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
		this.formatMessage(message)
		this.messages.unshift(message)

		if (!this.messages_by_day[message.day]) {
			Vue.set(this.messages_by_day, message.day, [])
			this.days.unshift(this.messages_by_day[message.day])
		}
		this.messages_by_day[message.day].unshift(message)
	}

	formatMessage(message: ChatMessage) {
		message.content = this.formatMessageContent(message.content, message.farmer.name)
		const element = document.createElement('div')
		element.innerHTML = message.content
		const innerText = element.innerText.trim()
		Vue.set(message, 'only_emojis', innerText.length === 0 || /^[\s\p{Emoji_Presentation}]+$/gmu.test(innerText))
		const day = this.getDay(message.date)
		Vue.set(message, 'day', day)
		if (!('censored' in message)) {
			Vue.set(message, 'censored', 0)
		}
		Vue.set(message, 'subMessages', [])
		Vue.set(message, 'reactionDialog', false)
		if (!message.reactions) {
			Vue.set(message, 'reactions', {})
		}
	}

	set_messages(messages: any[]) {
		// console.log("[chat] set_messages", messages)
		const prepared_messages: any[] = []
		if (messages.length) {
			prepared_messages.push({
				author: { id: -1, name: '', avatar_changed: 0, grade: '' },
				texts: [''],
				time: messages[0][4],
				day: new Date(messages[0][4] * 1000).getDate()
			})
		}
		for (const raw_message of messages) {
			const message = this.formatMessageContent(raw_message[3], raw_message[2])
			if (prepared_messages.length) {
				const lastMessage = prepared_messages[prepared_messages.length - 1]
				if (lastMessage.author.id === raw_message[1] && raw_message[4] - lastMessage.time < 120) {
					lastMessage.texts.push(message)
					continue
				}
			}
			prepared_messages.push({
				author: { id: raw_message[1], name: raw_message[2], avatar_changed: raw_message[6], grade: raw_message[5] },
				texts: [message],
				time: raw_message[4],
				day: new Date(raw_message[4] * 1000).getDate()
			})
		}
		console.log(this.messages)
		this.messages = prepared_messages
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
			mentions: []
		})
	}

	formatMessageContent(messageRaw: string, authorName: string): string {
		// console.log("raw", messageRaw)
		let message = LeekWars.protect(messageRaw)
		message = LeekWars.linkify(message)
		message = LeekWars.formatEmojis(message)
		message = Commands.execute(message, authorName)
		message = message.replace(/@(\w+)/g, (a, b, c, d, e) => {
			const farmer = store.state.farmer_by_name[b]
			if (farmer) {
				return "<span class='pseudo'>" + b + "</span>"
			}
			return a
		})
		message = message.replace(/\n/g, '<br>')
		// console.log("res", message)
		return message
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