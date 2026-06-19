import { LeekWars } from '@/model/leekwars'

enum NotificationType {
	UP_LEVEL = 1, // Passage de niveau
	FIGHT_REPORT = 2, // Rapport de combat
	NEW_MESSAGE = 3, // Nouveau message (forum)
	COMPOSITION_FIGHT_REPORT = 4, // Rapport de combat de composition
	TEAM_BANNED = 5, // Banni d'une team
	TEAM_NEW_CANDIDACY = 6, // Nouvelle candidature (à voir parceque si le mec fait Rejoindre/Annuler ma demande en boucle ça va vite être chiant)
	CANDIDACY_ACCEPTED = 7, // Accepté dans une team
	CANDIDACY_REFUSED = 8, // Refusé dans une team
	TOURNAMENT_WINNER = 9, // Gagnant d'un tournoi
	NO_TOURNAMENT = 10, // Pas de place pour le tournoi
	TROPHY_UNLOCKED = 11, // Nouveau trophée
	FIGHT_COMMENT = 12, // Quelqu'un commente un combat dans lequel vous jouez
	TOURNAMENT_END = 13, // Fin d'un tournoi
	CHALLENGE = 14, // Quelqu'un nous a challengé
	FARMER_FIGHT_REPORT = 15, // Aggression par un farmer
	TEAM_NEW_FARMER = 16, // Nouveau Farmer dans une team
	FARMER_TOURNAMENT_WIN = 17, // Victoire tournoi éleveur
	NEW_GODSON = 18, // Nouveau Filleul (params : id_godson, name_godson)
	FARMER_TOURNAMENT_END = 19, // Fin d'un tournoi de farmer
	NEW_WARNING = 20, // Warning
	TOURNAMENT_COMMENT = 21, // Quelqu'un commente un tournoi dans lequel vous jouez
	TEAM_TOURNAMENT_WIN = 22, // Victoire tournoi team
	TEAM_TOURNAMENT_END = 23, // Fin d'un tournoi de team
	REPORTING_PROCESSED = 24, // Signalement traité par un modérateur
	FARMER_CHALLENGE = 25, // Défi éleveur
	BATTLE_ROYALE_STARTED = 26, // Battle royale
	NEW_LEEKWARS_VERSION = 27, // Nouvelle version de Leek Wars
	PRIVATE_MESSAGE = 28, // Message privé (pas en notif mais pour les push & mails)
	NO_TOURNAMENT_FARMER = 29, // Pas de place pour le tournoi d'éleveur
	NO_TOURNAMENT_TEAM = 30, // Pas de place pour le tournoi d'équipe
	NO_BR = 31, // Pas de place pour la BR
	CHAT_MENTION = 32, // Mention sur un chat publique
	GAME_UPDATE = 33, // Nouvelle mise à jour
	GIVE_ITEM = 34, // Don d'item
	BOSS_STARTED = 35, // Démarrage d'un boss
	FORUM_TOPIC = 36, // Création d'un nouveau topic
	GIVE_MONEY = 37, // Don d'argent
	GIVE_FIGHTS = 38, // Don de combats
	FORUM_VOTE_UP = 39, // Vote positif sur un message/topic forum
	FORUM_VOTE_DOWN = 40, // Vote négatif sur un message/topic forum
	TEAM_INVITATION = 41, // Invitation à rejoindre une équipe
	TEAM_INVITATION_ACCEPTED = 42, // Invitation acceptée par le joueur
	BATTLE_ROYALE_REPORT = 43, // Rapport de Battle Royale (avec nom du poireau)
	WAR_REPORT = 44, // Rapport de Guerre
	CHEST_HUNT_REPORT = 45, // Rapport de Chasse aux coffres
	COLOSSUS_REPORT = 46, // Rapport de Colosse
	LEEK_AUTO_EXIT_ARENA = 47, // Poireau sorti auto du potager (20 défaites en défense)
	FARMER_AUTO_EXIT_GARDEN = 48, // Éleveur sorti auto du potager (20 défaites en défense)
	GODFATHER_REQUEST = 49, // Demande de parrainage reçue (params : id_requester, name_requester)
	GODFATHER_REQUEST_ACCEPTED = 50, // Demande de parrainage acceptée (params : id_godfather, name_godfather)
	GODFATHER_REQUEST_REFUSED = 51, // Demande de parrainage refusée (params : id_target, name_target)
	COLOSSUS_OWN_REPORT = 52, // Rapport de Colosse, reçu par le colosse lui-même
}

// Notifications de résultat de combat dont le lien respecte la préférence
// "Ouvrir le rapport plutôt que le combat" (#4222). FIGHT_COMMENT en est exclu :
// son lien doit rester sur le visionneur (où vit le fil de discussion).
const FIGHT_RESULT_NOTIFICATION_TYPES = new Set<NotificationType>([
	NotificationType.FIGHT_REPORT,
	NotificationType.COMPOSITION_FIGHT_REPORT,
	NotificationType.CHALLENGE,
	NotificationType.FARMER_FIGHT_REPORT,
	NotificationType.FARMER_CHALLENGE,
	NotificationType.BATTLE_ROYALE_STARTED,
	NotificationType.BOSS_STARTED,
	NotificationType.BATTLE_ROYALE_REPORT,
	NotificationType.WAR_REPORT,
	NotificationType.CHEST_HUNT_REPORT,
	NotificationType.COLOSSUS_REPORT,
	NotificationType.COLOSSUS_OWN_REPORT,
])

class Notification {

	public id!: number
	public type!: NotificationType
	public date!: number
	private _link!: string | null
	public image!: string | null
	public title!: string[]
	public message!: string[]
	public result!: number | null
	public read!: boolean
	public icon!: boolean
	public clazz!: string

	constructor(data: Record<string, unknown>, link: string | null, image: string | null, title: string[] = [], message: string[] = [], result: number | null = null) {
		this.id = data.id as number
		this.date = data.date as number
		this.type = data.type as NotificationType
		this._link = link
		this.image = image
		if (this.image) {
			if (this.image.includes(".")) {
				if (!this.image.includes('/')) {
					this.image = 'notif/' + this.image
				}
			} else {
				this.icon = true
			}
		}
		// Valeurs brutes : le gras + l'échappement sont gérés côté template par <i18n-t>
		// (slots #0/#1 : <b> du slot + {{ }} qui échappe). Voir notification.vue.
		this.title = title
		this.message = message.map(LeekWars.protect)
		this.result = result
		this.read = data.read as boolean

		this.clazz = ''
		if (this.type === NotificationType.TROPHY_UNLOCKED) {
			this.clazz = 'notif-trophy'
		}
		if (this.type === NotificationType.TEAM_TOURNAMENT_WIN || this.type === NotificationType.FARMER_TOURNAMENT_WIN || this.type === NotificationType.TOURNAMENT_WINNER) {
			this.clazz = 'notif-bigwin'
		}
	}

	// Lien de navigation. Pour une notification de résultat de combat, on recalcule
	// dynamiquement la destination (/report/<id> vs /fight/<id>) selon la préférence
	// LeekWars.notifsOpenReport (#4222) : comme c'est un getter lisant un état réactif,
	// le toggle prend effet immédiatement, sans recharger. notification-builder produit
	// le lien canonique /fight/<id>.
	get link(): string | null {
		if (this._link && LeekWars.notifsOpenReport && FIGHT_RESULT_NOTIFICATION_TYPES.has(this.type) && this._link.startsWith('/fight/')) {
			return '/report/' + this._link.slice('/fight/'.length)
		}
		return this._link
	}
}

export { Notification, NotificationType }
