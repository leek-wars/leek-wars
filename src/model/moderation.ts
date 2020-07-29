import { Farmer } from '@/model/farmer'

enum Warning {
	INCORRECT_FARMER_NAME = 1,
	INCORRECT_LEEK_NAME = 2,
	INCORRECT_AI_NAME = 3,
	INCORRECT_TEAM_NAME = 4,
	INCORRECT_TEAM_DESCRIPTION = 5,
	RUDE_SAY = 6,
	RUDE_FORUM = 7,
	RUDE_CHAT = 8,
	INSULT_MODERATOR = 9,
	INSULT_ADMIN = 10,
	CHEAT = 11,
	FLOOD_FORUM = 12,
	FLOOD_CHAT = 13,
	PROMO_CHAT = 14,
	PROMO_FORUM = 15,
	INCORRECT_AVATAR = 16,
	INCORRECT_EMBLEM = 17,
	INCORRECT_WEBSITE = 18,
	REPORTING_ABUSE = 100,
	SERVER_ATTACK = 101,
	BUG_EXPLOITATION = 102,
	BOT_OR_SCRIPT_USE = 103
}

class Reporting {
	farmer_id!: number
	farmer_name!: string
	message!: string
	date!: number
}

class Fault {
	id!: number
	parameter!: string
	reason!: Warning
	reportings!: Reporting[]
	target!: Farmer
}

export { Warning, Reporting, Fault }