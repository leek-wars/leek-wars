import { Commands } from '@/model/commands'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { Latex } from '@/model/latex'
import { LeekWars } from '@/model/leekwars'

enum ChatType { GLOBAL, TEAM, PM }

class ChatMessage {
	author!: Farmer
	texts: string[] = []
	time!: number
}

class Chat {
	name: string
	type: ChatType
	messages: ChatMessage[] = []

	constructor(name: string, type: ChatType) {
		this.name = name
		this.type = type
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
		message = Latex.latexify(message)
		message = Commands.execute(message, authorName)
		message = message.replace(/\n/g, '<br>')
		return message
	}
}

export { Chat, ChatType, ChatMessage }