import { i18n } from "./i18n"
import { ItemType } from "./item"
import type { Leek } from "./leek"
import { LeekWars } from "./leekwars"
import { Notification, NotificationType } from "./notification"
import { store } from "./store"

class NotificationBuilder {

	public static rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']

	public static build(data: Record<string, unknown>) {

		const type = data.type
		const params = data.parameters as string[]
		const leeks: Leek[] = []
		// Les rapports d'arène et de tournoi ne transportent que le NOM du poireau,
		// pas son identifiant. Le nom suffit : une notification ne parle que d'un
		// de nos poireaux, et deux des nôtres ne peuvent pas porter le même nom.
		// La table est remplie dans la boucle qui existe déjà : `leeks` est un
		// tableau CREUX indexé par identifiant global, y chercher un nom au `find`
		// balayait tout jusqu'au plus grand identifiant du jeu — 134 000 cases pour
		// retrouver un poireau parmi quatre, à chaque ligne de notification.
		const idByName = new Map<string, number>()
		if (store.state.farmer && store.state.farmer.leeks) {
			for (const l in store.state.farmer.leeks) {
				const leek = store.state.farmer.leeks[l]
				leeks[leek.id] = leek
				idByName.set(leek.name, leek.id)
			}
		}
		const leekByName = (name: string) => idByName.get(name) ?? null
		/** L'identifiant du paramètre, s'il désigne bien un de NOS poireaux. */
		const leekById = (param: string) => leeks[parseInt(param, 10)]?.id ?? null
		if (type === NotificationType.UP_LEVEL) {
			const leekId = parseInt(params[0], 10)
			const leekName = leeks[leekId].name
			const level = params[1]
			return new Notification(data, "/leek/" + leekId, "mdi-transfer-up", [leekName, level], [leekName], null, leekById(params[0]))
		} else if (type === NotificationType.FIGHT_REPORT) {
			let leekName = "?"
			if (params[0] in leeks) {
				leekName = leeks[parseInt(params[0], 10)].name
			}
			const fightId = params[1]
			const enemyName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightId, "mdi-sword", [leekName, enemyName], [], result, leekById(params[0]))
		} else if (type === NotificationType.NEW_MESSAGE) {
			const farmerName = params[0]
			const topicId = params[1]
			const catgoryId = params[3]
			const page = parseInt(params[4], 10)
			const topicTitle = params[5]
			return new Notification(data, "/forum/category-" + catgoryId + "/topic-" + topicId + (page > 1 ? "/page-" + page : "") + "#message-" + params[2], "mdi-forum", [farmerName, topicTitle])
		} else if (type === NotificationType.COMPOSITION_FIGHT_REPORT) {
			const leekName = leeks[parseInt(params[0], 10)].name
			const fightId = params[1]
			const teamName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightId, "mdi-shield-sword", [leekName, teamName], [], result, leekById(params[0]))
		} else if (type === NotificationType.TEAM_BANNED) {
			const teamName = params[0]
			return new Notification(data, "/farmer", "mdi-shield", [teamName])
		} else if (type === NotificationType.TEAM_NEW_CANDIDACY) {
			const teamID = params[0]
			const teamName = params[1]
			const farmerName = params[2]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [farmerName, teamName])
		} else if (type === NotificationType.CANDIDACY_ACCEPTED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [teamName])
		} else if (type === NotificationType.CANDIDACY_REFUSED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [teamName])
		} else if (type === NotificationType.TOURNAMENT_WINNER) {
			const tournamentID = params[0]
			const leekName = params[1]
			// Coupe (récompense obtenue), pas l'arbre du tournoi — cf. ICONS.md.
			// L'ancien PNG était BLANC : taillé pour la rangée en dégradé d'or du v2,
			// il devenait invisible sur le lavis clair qui l'a remplacée, et la règle
			// d'inversion des notifications épargne justement les rangées `notif-trophy`.
			return new Notification(data, "/tournament/" + tournamentID, "mdi-trophy", [leekName], [], null, leekByName(leekName))
		} else if (type === NotificationType.NO_TOURNAMENT) {
			const name = params[0]
			return new Notification(data, "/farmer", "mdi-tournament", [name])
		} else if (type === NotificationType.TROPHY_UNLOCKED) {
			const trophyID = parseInt(params[0], 10)
			const trophy = LeekWars.trophies[trophyID - 1]
			if (!trophy) {
				return new Notification(data, "/trophies", "mdi-trophy", ["#" + trophyID])
			}
			const trophyName = i18n.t('trophy.' + trophy.code) as string
			return new Notification(data, "/trophy/" + trophy.code, "trophy/" + trophy.code + '.svg', [trophyName])
		} else if (type === NotificationType.FIGHT_COMMENT) {
			const farmerName = params[0]
			const fightID = params[1]
			return new Notification(data, "/fight/" + fightID, "mdi-message", [farmerName])
		} else if (type === NotificationType.TOURNAMENT_COMMENT) {
			const farmerName = params[0]
			const tournamentID = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "mdi-message", [farmerName])
		} else if (type === NotificationType.TOURNAMENT_END) {
			const tournamentID = parseInt(params[0], 10)
			const lastRound = parseInt(params[1], 10)
			const leekName = params[3]
			const lastRoundName = NotificationBuilder.rounds[lastRound < 5 ? lastRound : 4]
			const result = params.length > 5 ? parseInt(params[5]) : 0
			return new Notification(data, "/tournament/" + tournamentID, "mdi-tournament", [leekName, i18n.t('main.' + lastRoundName) as string], [], result, leekByName(leekName))
		} else if (type === NotificationType.CHALLENGE) {
			const leekName = leeks[parseInt(params[0], 10)].name
			const fightID = params[1]
			const enemyName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightID, "mdi-flag-outline", [leekName, enemyName], [], result, leekById(params[0]))
		} else if (type === NotificationType.FARMER_CHALLENGE) {
			const fightID = params[0]
			const enemyName = params[1]
			const result = params.length > 2 ? parseInt(params[2], 10) : null
			return new Notification(data, "/fight/" + fightID, "mdi-flag-outline", [enemyName], [], result)
		} else if (type === NotificationType.FARMER_FIGHT_REPORT) {
			const fightID = params[1]
			const farmerName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightID, "mdi-sword", [farmerName], [], result)
		} else if (type === NotificationType.TEAM_NEW_FARMER) {
			const teamID = params[0]
			const farmerName = params[1]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [farmerName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			return new Notification(data, "/tournament/" + tournamentID, "mdi-trophy")
		} else if (type === NotificationType.NEW_GODSON) {
			const godsonID = params[0]
			const godsonName = params[1]
			return new Notification(data, "/farmer/" + godsonID, "mdi-account-supervisor", [godsonName])
		} else if (type === NotificationType.GODFATHER_REQUEST) {
			const requesterName = params[1]
			return new Notification(data, "/farmer", "mdi-account-supervisor", [requesterName])
		} else if (type === NotificationType.GODFATHER_REQUEST_ACCEPTED) {
			const godfatherID = params[0]
			const godfatherName = params[1]
			return new Notification(data, "/farmer/" + godfatherID, "mdi-account-supervisor", [godfatherName])
		} else if (type === NotificationType.GODFATHER_REQUEST_REFUSED) {
			const targetID = params[0]
			const targetName = params[1]
			return new Notification(data, "/farmer/" + targetID, "mdi-account-supervisor", [targetName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1])
			const lastRoundName = NotificationBuilder.rounds[lastRound < 5 ? lastRound : 4]
			const result = params.length > 3 ? parseInt(params[3]) : 0
			return new Notification(data, "/tournament/" + tournamentID, "mdi-tournament", [i18n.t('main.' + lastRoundName) as string], [], result)
		} else if (type === NotificationType.NEW_WARNING) {
			return new Notification(data, "/farmer", "mdi-flag")
		} else if (type === NotificationType.TEAM_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			const compoName = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "mdi-trophy", [compoName])
		} else if (type === NotificationType.TEAM_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1])
			const compoName = params[2]
			const lastRoundName = NotificationBuilder.rounds[lastRound < 5 ? lastRound : 4]
			const result = params.length > 4 ? parseInt(params[4]) : 0
			return new Notification(data, "/tournament/" + tournamentID, "mdi-tournament", [compoName, i18n.t('main.' + lastRoundName) as string], [], result)
		} else if (type === NotificationType.REPORTING_PROCESSED) {
			const targetName = params[0]
			return new Notification(data, "/farmer", "mdi-gavel", [targetName])
		} else if (type === NotificationType.BATTLE_ROYALE_STARTED) {
			const fightID = params[0]
			const result = params.length > 1 ? parseInt(params[1]) : 0
			// L'arène qui démarre, pas le potager : même glyphe que NO_BR et que la
			// sortie automatique des arènes.
			return new Notification(data, "/fight/" + fightID, "mdi-stadium", [], [], result)
		} else if (type === NotificationType.NO_TOURNAMENT_FARMER) {
			return new Notification(data, "/farmer", "mdi-tournament")
		} else if (type === NotificationType.NO_TOURNAMENT_TEAM) {
			const name = params[0]
			return new Notification(data, "/farmer", "mdi-tournament", [name])
		} else if (type === NotificationType.NO_BR) {
			const name = params[0]
			return new Notification(data, "/farmer", "mdi-stadium", [name])
		} else if (type === NotificationType.CHAT_MENTION) {
			const farmer_name = params[0]
			const conversation_id = params[1]
			const conversation_name = params[2]
			// const message_id = params[3]
			return new Notification(data, "/chat/" + conversation_id, "mdi-at", [farmer_name, conversation_name])
		} else if (type === NotificationType.GIVE_ITEM) {
			const farmer_name = params[0]
			const item_id = params[1]
			const item = LeekWars.items[item_id]
			let item_name: string = item.name
			if (item.type === ItemType.WEAPON) {
				item_name = i18n.t('weapon.' + item.name.substring(7))
			} else if (item.type === ItemType.CHIP) {
				item_name = i18n.t('chip.' + item.name.substring(5))
			}
			return new Notification(data, "/inventory/", "mdi-gift-outline", [farmer_name, item_name])
		} else if (type === NotificationType.BOSS_STARTED) {
			const farmer_name = params[0]
			const fightID = params[1]
			// const result = params.length > 1 ? parseInt(params[1]) : 0
			return new Notification(data, "/fight/" + fightID, "mdi-crown", [farmer_name])
		} else if (type === NotificationType.FORUM_TOPIC) {
			const farmerName = params[0]
			const topicId = params[1]
			const catgoryId = params[2]
			const topicTitle = params[3]
			return new Notification(data, "/forum/category-" + catgoryId + "/topic-" + topicId, "mdi-forum", [farmerName, topicTitle])
		} else if (type === NotificationType.GIVE_MONEY) {
			const farmer_name = params[0]
			const amount = params[1]
			return new Notification(data, "/market", "mdi-hand-coin-outline", [farmer_name, amount])
		} else if (type === NotificationType.GIVE_FIGHTS) {
			const farmer_name = params[0]
			const fights = params[1]
			return new Notification(data, "/market", "mdi-sword-cross", [farmer_name, fights])
		} else if (type === NotificationType.FORUM_VOTE_UP || type === NotificationType.FORUM_VOTE_DOWN) {
			const farmerName = params[0]
			const topicId = params[1]
			const messageId = parseInt(params[2], 10)
			const categoryId = params[3]
			const page = parseInt(params[4], 10)
			const topicTitle = params[5]
			const link = messageId === -1
				? "/forum/category-" + categoryId + "/topic-" + topicId
				: "/forum/category-" + categoryId + "/topic-" + topicId + (page > 1 ? "/page-" + page : "") + "#message-" + messageId
			const icon = type === NotificationType.FORUM_VOTE_UP ? "mdi-thumb-up" : "mdi-thumb-down"
			return new Notification(data, link, icon, [farmerName, topicTitle])
		} else if (type === NotificationType.TEAM_INVITATION) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [teamName])
		} else if (type === NotificationType.TEAM_INVITATION_ACCEPTED) {
			const teamID = params[0]
			const farmerName = params[1]
			return new Notification(data, "/team/" + teamID, "mdi-shield", [farmerName])
		} else if (type === NotificationType.BATTLE_ROYALE_REPORT || type === NotificationType.WAR_REPORT || type === NotificationType.CHEST_HUNT_REPORT || type === NotificationType.COLOSSUS_REPORT || type === NotificationType.COLOSSUS_OWN_REPORT) {
			const fightID = params[0]
			const result = params.length > 1 ? parseInt(params[1]) : 0
			const leekName = params.length > 2 ? params[2] : ''
			const participantCount = params.length > 3 ? params[3] : ''
			return new Notification(data, "/fight/" + fightID, "mdi-sword", [leekName, participantCount], [], result, leekByName(leekName))
		} else if (type === NotificationType.LEEK_AUTO_EXIT_ARENA) {
			const leekId = parseInt(params[0], 10)
			const leekName = leeks[leekId]?.name ?? '?'
			return new Notification(data, "/leek/" + leekId, "mdi-stadium", [leekName], [], null, leekById(params[0]))
		} else if (type === NotificationType.FARMER_AUTO_EXIT_GARDEN) {
			return new Notification(data, "/farmer", "mdi-sword-cross", [])
		} else {
			return new Notification(data, null, null, ["? type " + type])
		}
	}
}

export { NotificationBuilder }