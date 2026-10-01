import { Farmer } from '@/model/farmer'

enum ChatType { GLOBAL, TEAM, PM, GROUP }

/**
 * Fenêtre d'édition d'un message, en secondes (forum #12141). Même valeur que côté
 * serveur, qui reste le seul juge : ici la valeur ne sert qu'à ne pas proposer un
 * crayon qui se ferait refuser. Les deux doivent bouger ensemble.
 */
const CHAT_EDIT_DELAY = 900

/**
 * Résultat d'un `/exec` posté dans le chat, calculé une seule fois par le serveur.
 * Même forme que les paquets de la console interactive : soit un `result` (+ `ops` et les
 * lignes de `logs`), soit une erreur — `error` est un code LeekScript traduit côté client
 * avec ses `params`, `message` une erreur déjà formatée (polyglot, refus du serveur).
 * `pending` seul = exécution lancée, résultat à venir par CHAT_EXEC_RESULT.
 */
interface ChatExec {
	lang?: string
	pending?: boolean
	result?: string
	ops?: number
	logs?: unknown[][]
	error?: number
	params?: string[]
	message?: string
}

class ChatMessage {
	id!: number
	chat!: number
	farmer!: Farmer
	content!: string
	raw_content?: string
	contents: string[] = []
	date!: number
	day!: number
	subMessages: ChatMessage[] = []
	/** Date de la dernière édition par l'auteur (forum #12141), 0 = jamais édité. */
	edited!: number
	censored!: number
	censored_by!: Farmer | null
	read!: boolean
	reactions!: {[key: string]: { count: number, farmers: string[] }}
	my_reaction!: string | null
	only_emojis!: boolean
	mentions!: Farmer[]
	exec?: ChatExec
	formatted: boolean = false
	reactionDialog: boolean = false
}

class ChatWindow {
	id!: number
	type!: ChatType
	title!: string
	name?: string
	expanded: boolean = true
}

class Chat {
	static MAX_MESSAGES = 200

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
	// Nombre de vues (panneau, widget d'accueil, page /chat) actuellement remontées dans
	// l'historique. Tant qu'il y en a une, trim() est différé : purger le début de la liste
	// pendant la lecture supprime des messages AU-DESSUS du viewport, le contenu remonte
	// d'autant, et le lecteur est propulsé vers les messages récents.
	history_locks: number = 0

	constructor(id: number, type: ChatType, name: string, notifications: boolean) {
		this.id = id
		this.type = type
		this.name = name
		this.notifications = notifications
	}

	add(message: ChatMessage) {
		// console.log("chat add", message, this)
		if (this.messages.length && this.messages[this.messages.length - 1].id === message.id) return
		this.prepare(message)
		this.messages.push(message)
		if (this.group(message)) {
			this.last_message = message.content.replace(/<br>/g, '\n')
		}
	}

	/**
	 * Historique : des messages plus anciens que tous ceux déjà là, en ordre chronologique
	 * (comme Array.unshift). Les bulles sont recalculées sur toute la conversation, comme si
	 * tout était arrivé par add() : l'historique se groupe comme le reste, et une bulle à
	 * cheval sur l'ancien début de la conversation se reforme d'un seul tenant.
	 */
	unshift(...messages: ChatMessage[]) {
		// Pagination par décalage : un message posté pendant la requête décale la fenêtre
		// du serveur, et le lot rapporte alors un message déjà affiché.
		const known = new Set(this.messages.map(m => m.id))
		const older = messages.filter(m => !known.has(m.id))
		if (!older.length) return
		for (const message of older) {
			this.prepare(message)
		}
		this.messages.unshift(...older)
		this.regroup()
	}

	/**
	 * Range un message, plus récent que tous ceux déjà rangés, dans les bulles de son jour :
	 * sous la dernière s'il est du même auteur à moins de 2 minutes du message qui l'ouvre,
	 * dans une nouvelle sinon. Les réactions n'y changent rien : chaque message affiche les
	 * siennes sous sa propre ligne. Rend vrai s'il ouvre une bulle.
	 */
	private group(message: ChatMessage): boolean {
		if (!this.messages_by_day[message.day]) {
			this.messages_by_day[message.day] = []
			this.days.push(this.messages_by_day[message.day])
		}
		const day_messages = this.messages_by_day[message.day]
		const head = day_messages[day_messages.length - 1]
		if (head && head.farmer.id === message.farmer.id && message.date - head.date < 120) {
			head.subMessages.push(message)
			return false
		}
		day_messages.push(message)
		return true
	}

	/** Reconstruit les jours et les bulles à partir de la liste plate `messages`. */
	private regroup() {
		this.messages_by_day = {}
		this.days = []
		for (const message of this.messages) {
			message.subMessages = []
			this.group(message)
		}
	}

	prepare(message: ChatMessage) {

		message.day = this.getDay(message.date)
		if (!message.reactions) {
			message.reactions = {}
		}
		// JSON brut du serveur : pas une instance de ChatMessage, donc l'initialisation de
		// champ de la classe ne s'applique pas. C'est ici, le seul passage obligé de add()
		// comme de unshift(), que l'invariant « subMessages est un tableau » est posé pour
		// tous les consommateurs.
		if (!message.subMessages) {
			message.subMessages = []
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

	/** Retire des messages : les bulles se recalculent comme au chargement. */
	deleteMessages(ids: number[]) {
		const deleted = new Set(ids)
		const remaining = this.messages.filter(m => !deleted.has(m.id))
		if (remaining.length === this.messages.length) return
		this.messages = remaining
		this.regroup()
	}

	/** `farmer` pose la réaction `reaction` et/ou retire `old` (changer de réaction fait les deux). */
	react(messageID: number, reaction: string, old: string, farmer: string) {
		const message = this.messages.find(m => m.id === messageID)
		if (!message) return
		if (old) {
			message.reactions[old].count--
			const i = message.reactions[old].farmers.indexOf(farmer)
			if (i !== -1) {
				message.reactions[old].farmers.splice(i, 1)
			}
			if (message.reactions[old].count === 0) {
				delete message.reactions[old]
			}
		}
		if (reaction) {
			if (reaction in message.reactions) {
				message.reactions[reaction].count++
				message.reactions[reaction].farmers.push(farmer)
			} else {
				message.reactions[reaction] = { count: 1, farmers: [ farmer ] }
			}
		}
	}

	clear() {
		this.messages = []
		this.messages_by_day = {}
		this.days = []
		// La conversation est rechargée à ses 30 derniers messages : l'historique n'est plus
		// épuisé, même si on l'avait remonté jusqu'au bout avant. Sans ça, load-chat-history
		// refusait définitivement de charger les messages plus anciens.
		this.fully_loaded = false
	}

	trim(max: number) {
		if (this.messages.length <= max) return
		this.messages.splice(0, this.messages.length - max)
		this.regroup()
		this.fully_loaded = false
	}
}

/**
 * Peut-on encore proposer le crayon sur ce message ? `now` est passé par l'appelant
 * (LeekWars.time, réactif et remis à l'heure à la minute) plutôt que lu ici : ce
 * module est importé par leekwars.ts, l'importer en retour ferait un cycle.
 *
 * Reprend les refus de l'API qui se voient depuis le client : auteur, message ni
 * censuré ni porteur d'un `/exec`, délai. Le serveur reste le seul juge — la sourdine,
 * elle, ne se lit pas d'ici.
 */
function canEditChatMessage(message: ChatMessage, farmerID: number | undefined, now: number): boolean {
	if (!farmerID || message.farmer.id !== farmerID) { return false }
	if (message.censored || message.exec) { return false }
	return now - message.date <= CHAT_EDIT_DELAY
}

export { Chat, ChatType, ChatMessage, ChatWindow, CHAT_EDIT_DELAY, canEditChatMessage }
export type { ChatExec }