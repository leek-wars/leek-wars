import { Notification } from '@/model/notification'
import { Conversation } from './conversation'
import { i18n } from './i18n'
import { LeekWars } from './leekwars'

class Square {
	id?: number
	message!: string
	image!: string | null
	icon!: boolean
	title!: string
	link!: string | null
	padding!: boolean
}

class Squares {
	squares: Square[] = []
	id: number = 0

	add(square: Square) {
		square.id = this.id++
		this.squares.push(square)
		setTimeout(() => this.squares.shift(), 5000)
	}

	addFromNotification(notification: Notification) {
		this.add({
			image: (notification.icon ? notification.image : '/image/' + notification.image),
			icon: notification.icon,
			title: i18n.t('notification.title_' + notification.type, notification.title) as string,
			message: i18n.t('notification.message_' + notification.type, notification.message) as string,
			link: notification.link,
			padding: true
		})
	}

	addFromConversation(conversation: Conversation, senderAvatar: number) {
		this.add({
			image: LeekWars.getAvatar(conversation.last_farmer_id, senderAvatar),
			icon: false,
			title: conversation.last_farmer_name,
			message: "► " + conversation.last_message,
			link: "/messages/conversation/" + conversation.id,
			padding: false
		})
	}
}

export { Square, Squares }