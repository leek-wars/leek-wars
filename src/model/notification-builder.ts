import { i18n } from "./i18n"
import { ItemType } from "./item"
import { LeekWars } from "./leekwars"
import { Notification, NotificationType } from "./notification"
import { store } from "./store"
import { TROPHIES } from "./trophies"

class NotificationBuilder {

	public static rounds = ['sixteenth_final', 'eighth_final', 'quarter_final', 'semi_final', 'final']

	public static build(data: any) {

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
			return new Notification(data, "/leek/" + leekId, "mdi-transfer-up", [leekName, level], [leekName])
		} else if (type === NotificationType.FIGHT_REPORT) {
			let leekName = "?"
			if (params[0] in leeks) {
				leekName = leeks[parseInt(params[0], 10)].name
			}
			const fightId = params[1]
			const enemyName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightId, "garden.png", [leekName, enemyName], [], result)
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
			return new Notification(data, "/fight/" + fightId, "team_fight.png", [leekName, teamName], [], result)
		} else if (type === NotificationType.TEAM_BANNED) {
			const teamName = params[0]
			return new Notification(data, "/farmer", "team_banned.png", [teamName])
		} else if (type === NotificationType.TEAM_NEW_CANDIDACY) {
			const teamID = params[0]
			const teamName = params[1]
			const farmerName = params[2]
			return new Notification(data, "/team/" + teamID, "team_candidacy.png", [farmerName, teamName])
		} else if (type === NotificationType.CANDIDACY_ACCEPTED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "team_accepted.png", [teamName])
		} else if (type === NotificationType.CANDIDACY_REFUSED) {
			const teamID = params[0]
			const teamName = params[1]
			return new Notification(data, "/team/" + teamID, "team_refused.png", [teamName])
		} else if (type === NotificationType.TOURNAMENT_WINNER) {
			const tournamentID = params[0]
			const leekName = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win_white.png", [leekName])
		} else if (type === NotificationType.NO_TOURNAMENT) {
			const name = params[0]
			return new Notification(data, "/farmer", "tournament_fail.png", [name])
		} else if (type === NotificationType.TROPHY_UNLOCKED) {
			const trophyID = parseInt(params[0], 10)
			const trophy = TROPHIES[trophyID - 1]
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
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end.png", [leekName, i18n.t('main.' + lastRoundName) as string], [], result)
		} else if (type === NotificationType.CHALLENGE) {
			const leekName = leeks[parseInt(params[0], 10)].name
			const fightID = params[1]
			const enemyName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightID, "mdi-flag-outline", [leekName, enemyName], [], result)
		} else if (type === NotificationType.FARMER_CHALLENGE) {
			const fightID = params[0]
			const enemyName = params[1]
			const result = params.length > 2 ? parseInt(params[2], 10) : null
			return new Notification(data, "/fight/" + fightID, "mdi-flag-outline", [enemyName], [], result)
		} else if (type === NotificationType.FARMER_FIGHT_REPORT) {
			const fightID = params[1]
			const farmerName = params[2]
			const result = params.length > 3 ? parseInt(params[3], 10) : null
			return new Notification(data, "/fight/" + fightID, "garden.png", [farmerName], [], result)
		} else if (type === NotificationType.TEAM_NEW_FARMER) {
			const teamID = params[0]
			const farmerName = params[1]
			return new Notification(data, "/team/" + teamID, "team_accepted.png", [farmerName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win_white.png")
		} else if (type === NotificationType.NEW_GODSON) {
			const godsonID = params[0]
			const godsonName = params[1]
			return new Notification(data, "/farmer/" + godsonID, "godfather.png", [godsonName])
		} else if (type === NotificationType.FARMER_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1])
			const lastRoundName = NotificationBuilder.rounds[lastRound < 5 ? lastRound : 4]
			const result = params.length > 3 ? parseInt(params[3]) : 0
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end.png", [i18n.t('main.' + lastRoundName) as string], [], result)
		} else if (type === NotificationType.NEW_WARNING) {
			return new Notification(data, "/farmer", "mdi-flag")
		} else if (type === NotificationType.TEAM_TOURNAMENT_WIN) {
			const tournamentID = params[0]
			const compoName = params[1]
			return new Notification(data, "/tournament/" + tournamentID, "tournament_win_white.png", [compoName])
		} else if (type === NotificationType.TEAM_TOURNAMENT_END) {
			const tournamentID = params[0]
			const lastRound = parseInt(params[1])
			const compoName = params[2]
			const lastRoundName = NotificationBuilder.rounds[lastRound < 5 ? lastRound : 4]
			const result = params.length > 4 ? parseInt(params[4]) : 0
			return new Notification(data, "/tournament/" + tournamentID, "tournament_end.png", [compoName, i18n.t('main.' + lastRoundName) as string], [], result)
		} else if (type === NotificationType.REPORTING_PROCESSED) {
			const targetName = params[0]
			return new Notification(data, "/farmer", "reporting_processed.png", [targetName])
		} else if (type === NotificationType.BATTLE_ROYALE_STARTED) {
			const fightID = params[0]
			const result = params.length > 1 ? parseInt(params[1]) : 0
			return new Notification(data, "/fight/" + fightID, "mdi-sword-cross", [], [], result)
		} else if (type === NotificationType.NO_TOURNAMENT_FARMER) {
			return new Notification(data, "/farmer", "tournament_fail.png")
		} else if (type === NotificationType.NO_TOURNAMENT_TEAM) {
			const name = params[0]
			return new Notification(data, "/farmer", "tournament_fail.png", [name])
		} else if (type === NotificationType.NO_BR) {
			const name = params[0]
			return new Notification(data, "/farmer", "tournament_fail.png", [name])
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
			let item_name = item.name as any
			if (item.type === ItemType.WEAPON) {
				item_name = i18n.t('weapon.' + item.name.substring(7))
			} else if (item.type === ItemType.CHIP) {
				item_name = i18n.t('chip.' + item.name.substring(5))
			}
			return new Notification(data, "/inventory/", "mdi-gift-outline", [farmer_name, item_name])
		} else {
			return new Notification(data, null, null, ["? type " + type])
		}
	}
}

export { NotificationBuilder }