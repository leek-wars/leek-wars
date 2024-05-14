import { Notification } from '@/model/notification'
import { ChatMessage } from './chat'
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
	clazz!: string
	resultIcon!: string
	notification?: Notification
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
			notification,
			image: (notification.icon ? notification.image : '/image/' + notification.image),
			icon: notification.icon,
			title: i18n.t('notification.title_' + notification.type, notification.title) as string,
			message: i18n.t('notification.message_' + notification.type, notification.message) as string,
			link: notification.link,
			padding: true,
			clazz: notification.clazz,
			resultIcon: notification.result === null ? '' : notification.result === 1 ? 'mdi-check' : notification.result === 0 ? 'mdi-equal' : 'mdi-close'
		})
	}

	addFromMessage(message: ChatMessage) {
		this.add({
			image: LeekWars.getAvatar(message.farmer.id, message.farmer.avatar_changed),
			icon: false,
			title: message.farmer.name,
			message: "► " + message.content,
			link: "/messages/conversation/" + message.chat,
			padding: false,
			clazz: '',
			resultIcon: ''
		})
	}
}

export { Square, Squares }