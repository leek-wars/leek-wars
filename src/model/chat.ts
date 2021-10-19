import { Commands } from '@/model/commands'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
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
	messages: ChatMessage[] = []
	invalidated: boolean = false
	read: boolean = true
	last_message: string | null = null
	last_farmer: Farmer | null = null
	last_date: number | null = null
	farmers: Farmer[] = []
	loaded: boolean = false

	constructor(id: number, type: ChatType) {
		this.id = id
		this.type = type
	}

	add(message: ChatMessage) {
		// console.log("chat add", message, this)
		const content = this.formatMessage(message.content, message.farmer.name)
		const day = new Date(message.date * 1000).getDate()
		Vue.set(message, 'day', day)
		if (!('censored' in message)) {
			Vue.set(message, 'censored', 0)
		}
		let separator = false
		if (this.messages.length) {
			const lastMessage = this.messages[this.messages.length - 1]
			if (lastMessage.farmer.id === message.farmer.id && message.date - lastMessage.date < 120) {
				lastMessage.contents.push(content)
				lastMessage.subMessages.push(message)
				return
			}
			if (lastMessage.day !== day) {
				separator = true
			}
		} else {
			separator = true
		}
		// Separator
		if (separator) {
			this.messages.push({
				farmer: { id: -1, name: '', avatar_changed: 0, grade: '' },
				contents: [''],
				date: message.date,
				day,
				subMessages: [] as ChatMessage[]
			} as ChatMessage)
		}
		Vue.set(message, 'contents', [content])
		Vue.set(message, 'subMessages', [])
		Vue.set(this, 'last_message', content)
		this.messages.push(message)
		if (!message.read) {
			this.read = false
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
			const message = this.formatMessage(raw_message[3], raw_message[2])
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
		this.messages = prepared_messages
	}

	battleRoyale(fightID: number, time: number) {
		this.messages.push({
			id: 0,
			chat: this.id,
			farmer: { id: 0, name: "Leek Wars" } as Farmer,
			content: '',
			contents: [i18n.t('main.br_started_message') as string, '' + fightID],
			subMessages: [],
			date: time,
			day: new Date(time * 1000).getDate(),
			censored: 0,
			censored_by: null,
			read: false
		})
	}

	formatMessage(messageRaw: string, authorName: string): string {
		// console.log("raw", messageRaw)
		let message = LeekWars.protect(messageRaw)
		message = LeekWars.linkify(message)
		message = LeekWars.formatEmojis(message)
		message = Commands.execute(message, authorName)
		message = message.replace(/\n/g, '<br>')
		// console.log("res", message)
		return message
	}
}

export { Chat, ChatType, ChatMessage, ChatWindow }