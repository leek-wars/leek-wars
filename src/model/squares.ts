import { Notification } from '@/model/notification'
import { ChatMessage } from './chat'
import { formatChatPreview } from './chat-format'
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
		if (!LeekWars.notifsPopups) { return }
		// Le titre est rendu en v-html (cf. squares.vue) : on met les arguments en gras
		// via <b>. Les title_* utilisent des placeholders NOMMÉS {p0}/{p1} (cf.
		// notification.vue + notification.json), donc on passe des args nommés, pas le
		// tableau (= args liste, qui ne remplit pas les placeholders nommés). La valeur
		// est échappée (protect) AVANT le <b> et escapeParameter:false préserve le markup.
		const titleArgs = notification.title.reduce((args: Record<string, string>, value, index) => {
			args['p' + index] = '<b>' + LeekWars.protect(value) + '</b>'
			return args
		}, {})
		this.add({
			notification,
			image: (notification.icon ? notification.image : '/image/' + notification.image),
			icon: notification.icon,
			title: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			(i18n as any).t('notification.title_' + notification.type, titleArgs, { escapeParameter: false }) as string,
			message: // eslint-disable-next-line @typescript-eslint/no-explicit-any
			(i18n as any).t('notification.message_' + notification.type, notification.message) as string,
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
			title: LeekWars.protect(message.farmer.name),
			message: "► " + formatChatPreview(message.content, message.farmer.name),
			link: "/messages/conversation/" + message.chat,
			padding: false,
			clazz: '',
			resultIcon: ''
		})
	}
}

export { Square, Squares }