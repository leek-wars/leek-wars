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
}

class Notification {

	public id!: number
	public type!: NotificationType
	public date!: number
	public link!: string | null
	public image!: string | null
	public title!: string[]
	public message!: string[]
	public result!: number | null
	public read!: boolean
	public icon!: boolean
	public clazz!: string

	constructor(data: any, link: string | null, image: string | null, title: string[] = [], message: string[] = [], result: number | null = null) {
		this.id = data.id
		this.date = data.date
		this.type = data.type as NotificationType
		this.link = link
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
		this.title = title.map(LeekWars.protect)
		this.message = message.map(LeekWars.protect)
		this.result = result
		this.read = data.read

		this.clazz = ''
		if (this.type === NotificationType.TROPHY_UNLOCKED) {
			this.clazz = 'notif-trophy'
		}
		if (this.type === NotificationType.TEAM_TOURNAMENT_WIN || this.type === NotificationType.FARMER_TOURNAMENT_WIN || this.type === NotificationType.TOURNAMENT_WINNER) {
			this.clazz = 'notif-bigwin'
		}
	}
}

export { Notification, NotificationType }
