import { Commands } from '@/model/commands'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { Conversation } from './conversation'

enum ChatType { GLOBAL, TEAM, PM }

class ChatMessage {
	author!: Farmer
	texts: string[] = []
	time!: number
}

class ChatWindow {
	name!: string
	type!: ChatType
	title!: string
	expanded: boolean = true
}

class Chat {
	name: string
	type: ChatType
	messages: ChatMessage[] = []
	invalidated: boolean = false
	conversation: Conversation | null = null

	constructor(name: string, type: ChatType, conversation: Conversation | null = null) {
		this.name = name
		this.type = type
		this.conversation = conversation
	}
	add(authorID: number, authorName: string, authorAvatarChanged: number, authorGrade: string, messageRaw: string, time: number) {
		const message = this.formatMessage(messageRaw, authorName)
		if (this.messages.length) {
			const lastMessage = this.messages[this.messages.length - 1]
			if (lastMessage.author.id === authorID && time - lastMessage.time < 120) {
				lastMessage.texts.push(message)
				return
			}
		}
		this.messages.push({
			author: { id: authorID, name: authorName, avatar_changed: authorAvatarChanged, grade: authorGrade },
			texts: [message],
			time
		} as ChatMessage)
	}

	set_messages(messages: any[]) {
		const prepared_messages: any[] = []
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
				time: raw_message[4]
			} as ChatMessage)
		}
		this.messages = prepared_messages
	}

	battleRoyale(fightID: number, time: number) {
		this.messages.push({
			author: { id: 0, name: "Leek Wars" } as Farmer,
			texts: [i18n.t('main.br_started_message') as string, '' + fightID],
			time
		})
	}

	formatMessage(messageRaw: string, authorName: string): string {
		let message = LeekWars.protect(messageRaw)
		message = LeekWars.linkify(message)
		message = LeekWars.formatEmojis(message)
		message = Commands.execute(message, authorName)
		message = message.replace(/\n/g, '<br>')
		return message
	}
}

export { Chat, ChatType, ChatMessage, ChatWindow }