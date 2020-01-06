import { i18n } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

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
}

class Notification {
	public static build(data: any, isNew: boolean = false) {
		const type = data.type
		const params = data.parameters as string[]
		const leeks = []
		if (store.state.farmer && store.state.farmer.leeks) {
			for (const l in store.state.farmer.leeks) {
				leeks[store.state.farmer.leeks[l].id] = store.state.farmer.leeks[l]
			}
		}
		if (type === NotificationType.UP_LEVEL) {
			const leekId = parseInt(params[0], 10)
			const leekName = leeks[leekId].name
			const level = params[1]
			if (isNew) {
				store.commit('level-up', {leek: leekId, level})
			}
			return new Notification(data, "/leek/" + leekId, "level_up", [leekName, level], [leekName])
		} else if (type === NotificationType.FIGHT_REPORT) {
			let leekName = "?"
			if (params[0] in leeks) {
				leekName = leeks[parseInt(params[0], 10)].name
			}
			const fightId = params[1]
			const enemyName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightId, "fight", [leekName, enemyName], [], result)
		} else if (type === NotificationType.NEW_MESSAGE) {
			const farmerName = params[0]
			const topicId = params[1]
			const catgoryId = params[3]
			const page = parseInt(params[4], 10)
			const topicTitle = params[5]
			return new Notification(data, "/forum/category-" + catgoryId + "/topic-" + topicId + (page > 1 ? "/page-" + page : "") + "#message-" + params[2], "forum_response", [farmerName, topicTitle])
		} else if (type === NotificationType.COMPOSITION_FIGHT_REPORT) {
			const leekName = leeks[parseInt(params[0], 10)].name
			const fightId = params[1]
			const teamName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightId, "team_fight", [leekName, teamName], [], result)
		} else if (type === NotificationType.TEAM_BANNED) {
			const teamName = params[0]
			return new Notification(data, "/farmer", "team_banned", [teamName])
		} else if (type === NotificationType.TEAM_NEW_CANDIDACY) {
			const teamID = params[0]
			const teamName = params[1]
			const farmerName = params[2]
			return new Notification(data, "/team/" + teamID, "team_candidacy", [farmerName, teamName])
		} else if (type === NotificationType.CANDIDACY_ACCEPTED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "team_accepted", [teamName])
		} else if (type === NotificationType.CANDIDACY_REFUSED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "team_refused", [teamName])
		} else if (type === NotificationType.TOURNAMENT_WINNER) {
			const tournamentID = params[0]
			const leekName = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win", [leekName])
		} else if (type === NotificationType.NO_TOURNAMENT) {
			return new Notification(data, "/farmer", "tournament_fail")
		} else if (type === NotificationType.TROPHY_UNLOCKED) {
			const trophyID = parseInt(params[0], 10)
			const trophyName = i18n.t('trophy.' + LeekWars.trophies[trophyID - 1].code) as string
			return new Notification(data, "/farmer", "trophy_unlocked", [trophyName])
		} else if (type === NotificationType.FIGHT_COMMENT) {
			const farmerName = params[0]
			const fightID = params[1]
			return new Notification(data, "/fight/" + fightID, "comment", [farmerName])
		} else if (type === NotificationType.TOURNAMENT_COMMENT) {
			const farmerName = params[0]
			const tournamentID = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "comment", [farmerName])
		} else if (type === NotificationType.TOURNAMENT_END) {
			const tournamentID = parseInt(params[0], 10)
			const lastRound = parseInt(params[1], 10)
			const leekName = params[3]
			const rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']
			const lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end", [leekName, i18n.t('tournament.' + lastRoundName) as string])
		} else if (type === NotificationType.CHALLENGE) {
			const leekName = leeks[parseInt(params[0], 10)].name
			const fightID = params[1]
			const enemyName = params[2]
			return new Notification(data, "/fight/" + fightID, "fight", [leekName, enemyName])
		} else if (type === NotificationType.FARMER_CHALLENGE) {
			const fightID = params[0]
			const enemyName = params[1]
			return new Notification(data, "/fight/" + fightID, "fight", [enemyName])
		} else if (type === NotificationType.FARMER_FIGHT_REPORT) {
			const fightID = params[1]
			const farmerName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightID, "fight", [farmerName], [], result)
		} else if (type === NotificationType.TEAM_NEW_FARMER) {
			const teamID = params[0]
			const farmerName = params[1]
			return new Notification(data, "/team/" + teamID, "team_accepted", [farmerName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win")
		} else if (type === NotificationType.NEW_GODSON) {
			const godsonID = params[0]
			const godsonName = params[1]
			return new Notification(data, "/farmer/" + godsonID, "godfather", [godsonName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1], 10)
			const rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']
			const lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end", [i18n.t('tournament.' + lastRoundName) as string])
		} else if (type === NotificationType.NEW_WARNING) {
			return new Notification(data, "/farmer", "warning")
		} else if (type === NotificationType.TEAM_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			const compoName = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win", [compoName])
		} else if (type === NotificationType.TEAM_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1], 10)
			const compoName = params[2]
			const rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']
			const lastRoundName = lastRound < 5 ? rounds[lastRound] : rounds[4]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end", [compoName, i18n.t('tournament.' + lastRoundName) as string])
		} else if (type === NotificationType.REPORTING_PROCESSED) {
			const targetName = params[0]
			return new Notification(data, null, "reporting_processed", [targetName])
		} else if (type === NotificationType.BATTLE_ROYALE_STARTED) {
			const fightID = params[0]
			return new Notification(data, "/fight/" + fightID, "fight")
		} else {
			return new Notification(data, null, null, ["? type " + type])
		}
	}
	public id!: number
	public type!: NotificationType
	public date!: number
	public link!: string | null
	public image!: string | null
	public title!: string[]
	public message!: string[]
	public result!: number | null
	public read!: boolean

	constructor(data: any, link: string | null, image: string | null, title: string[] = [], message: string[] = [], result: number | null = null) {
		this.id = data.id
		this.date = data.date
		this.type = data.type as NotificationType
		this.link = link
		this.image = image
		this.title = title.map(LeekWars.protect)
		this.message = message.map(LeekWars.protect)
		this.result = result
		this.read = data.read
	}
}

export { Notification, NotificationType }
