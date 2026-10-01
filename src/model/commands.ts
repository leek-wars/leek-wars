import { LeekWars } from "@/model/leekwars"
import { mdiBookOpenPageVariant } from "@mdi/js"
import { hasSentinel } from "./chat-sentinels"
import { CHIPS } from "./chips"
import { FUNCTIONS } from "./functions"
import { i18n } from "./i18n"

// Traduits à l'affichage : les libellés dans la langue du lecteur, pas de l'auteur
const tr = (key: string) => i18n.t('main.' + key) as string
const loud = (key: string) => tr(key) + tr('chat_cmd_loud')
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// URLs for /encyclo and /doc
const URL_ENCYCLOPEDIA = "/encyclopedia"
const URL_DOC = "/help/documentation"
const URL_MARKET = "/market"
const URL_TUTO = "/help/tutorial"
const URL_UPDATE = "/forum/category-6/topic-"
const URL_PR = "https://github.com/leek-wars/leek-wars/pulls"
const URL_ISSUE = "https://github.com/leek-wars/leek-wars/issues/new"

const mdiInlineSvg = (path: string, cls = '') =>
	`<i class="v-icon notranslate theme--light ${cls}"><svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg></i>`

interface CommandOption {
	name: string
	nameLower: string
	description: string
}

class Command {
	name!: string
	regex!: RegExp
	replacement!: (...args: string[]) => string
	description!: string
	options?: CommandOption[]
}

const COMMANDS = [
	{
		name: "arena",
		get description() { return tr('chat_cmd_arena') },
		regex: /(^|\s)\/arena(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite"></span>'
	}, {
		name: "arena!",
		get description() { return loud('chat_cmd_arena') },
		regex: /(^|\s)\/arena!(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-label="' + escape(tr('chat_cmd_label_arena_loud')) + '"></span>'
	}, {
		name: "br",
		get description() { return tr('chat_cmd_br') },
		regex: /(^|\s)\/br(?::(\d+))?(?=$|\s)/gi,
		replacement: (_: string, space: string, level: string) => space + '<span class="br-invite" data-mode="0" data-level="' + (level || '') + '" data-label="' + escape(tr('battle_royale')) + '"></span>'
	}, {
		name: "br!",
		get description() { return loud('chat_cmd_br') },
		regex: /(^|\s)\/br!(?::(\d+))?(?=$|\s)/gi,
		replacement: (_: string, space: string, level: string) => space + '<span class="br-invite" data-mode="0" data-level="' + (level || '') + '" data-label="' + escape(tr('chat_cmd_label_br_loud')) + '"></span>'
	}, {
		name: "chest",
		get description() { return tr('chat_cmd_chest') },
		regex: /(^|\s)\/chest(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="2" data-label="' + escape(tr('chest_hunt')) + '"></span>'
	}, {
		name: "chest!",
		get description() { return loud('chat_cmd_chest') },
		regex: /(^|\s)\/chest!(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="2" data-label="' + escape(tr('chat_cmd_label_chest_loud')) + '"></span>'
	}, {
		name: "coloss",
		get description() { return tr('chat_cmd_coloss') },
		regex: /(^|\s)\/coloss(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="3" data-label="' + escape(tr('colossus')) + '"></span>'
	}, {
		name: "coloss!",
		get description() { return loud('chat_cmd_coloss') },
		regex: /(^|\s)\/coloss!(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="3" data-label="' + escape(tr('chat_cmd_label_coloss_loud')) + '"></span>'
	}, {
		name: "doc",
		get description() { return tr('chat_cmd_doc') },
		regex: /(?:^|(\s))\/doc(?::([^\s#]+))?(?=\s|$)/gi,
		replacement: (_: string, __: string, item: string) => {
			const link = item ? URL_DOC + "/" + item : URL_DOC
			const name = item ? item : "Doc"
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'", "lw") + " "
		}
	}, {
		name: "doc!",
		get description() { return loud('chat_cmd_doc') },
		regex: /(?:^|(\s))\/doc!(?=\s|$)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_DOC, escape(tr('chat_cmd_label_doc_loud')), "target='_blank' rel='noopener'", "lw") + " "
		}
	}, {
		name: "encyclo",
		get description() { return tr('chat_cmd_encyclo') },
		regex: /(?:^|(\s))\/encyclo(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/gi,
		replacement: (_: string, __: string, page: string, anchor: string) => {
			const name = page ? page + (anchor ? '#' + anchor : '') : escape(tr('encyclopedia'))
			const link = page ? URL_ENCYCLOPEDIA + '/' + page + (anchor ? '#' + anchor : '') : URL_ENCYCLOPEDIA
			return  " " + mdiInlineSvg(mdiBookOpenPageVariant, 'book') + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'", "lw") + " "
		},
		options: []
	}, {
		name: "encyclo!",
		get description() { return loud('chat_cmd_encyclo_link') },
		regex: /(?:^|(\s))\/encyclo!(?=\s|$)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_ENCYCLOPEDIA, escape(tr('chat_cmd_label_encyclo_loud')), "target='_blank' rel='noopener'", "lw") + " "
	}, {
		name: "exec",
		// Le résultat de l'exécution s'affiche sous le message. Ici, rien à transformer : le
		// message reste tel qu'il a été tapé, la
		// commande n'est là que pour apparaître dans la liste de complétion du chat.
		get description() { return tr('chat_cmd_exec') },
		regex: /(^|\s)\/exec(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "/exec"
	}, {
		name: "fliptable",
		description: "(╯°□°）╯︵ ┻━┻",
		regex: /(^|\s)\/fliptable(?=$|\s)/gi,
		replacement: (_: string, b: string) => b + "(╯°□°）╯︵ ┻━┻"
	}, {
		name: "issue",
		get description() { return tr('chat_cmd_issue') },
		regex: /(^|\s)\/issue(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_ISSUE, "Issue", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "issue!",
		get description() { return loud('chat_cmd_issue') },
		regex: /(^|\s)\/issue!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_ISSUE, "ISSUEEEEE", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "lama",
		get description() { return tr('chat_cmd_lama') },
		regex: /(^|\s)\/lama(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "<i>#LamaSwag</i>"
	}, {
		name: "lenny",
		description: "( ͡° ͜ʖ ͡° )",
		regex: /(^|\s)\/lenny(?=$|\s)/gi,
		replacement: (_: string, b: string) => b + "( ͡° ͜ʖ ͡° )"
	}, {
		name: "market",
		regex: /(?:^|(\s))\/market(?::([^\s#]+))?(?=\s|$)/gi,
		get description() { return tr('chat_cmd_market') },
		replacement: (_: string, __: string, item: string) => {
			const link = item ? URL_MARKET + "/" + item : URL_MARKET
			const name = item ? item : escape(tr('market'))
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'", "lw") + " "
		}
	}, {
		name: "market!",
		regex: /(?:^|(\s))\/market!(?=\s|$)/gi,
		get description() { return loud('chat_cmd_market_link') },
		replacement: () => " " + LeekWars.toChatLink(URL_MARKET, escape(tr('chat_cmd_label_market_loud')), "target='_blank' rel='noopener'", "lw") + " "
	}, {
		name: "me",
		get description() { return tr('chat_cmd_me') },
		regex: /(^|\s)\/me(?=$|\s)/gi,
		replacement: (authorName: string, space: string) => space + "<i>" + authorName + "</i>"
	}, {
		name: "ping",
		get description() { return tr('chat_cmd_ping') },
		regex: /(^|\s)\/ping(?=$|\s)/gi,
		replacement: () => ''
	}, {
		name: "pr",
		get description() { return tr('chat_cmd_pr') },
		regex: /(^|\s)\/pr(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_PR, "Pull Request", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "pr!",
		get description() { return loud('chat_cmd_pr') },
		regex: /(^|\s)\/pr!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_PR, "PULL REQUESTTTTT", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "replacetable",
		description: "┬─┬﻿ ノ( ゜-゜ノ)",
		regex: /(^|\s)\/replacetable(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "┬─┬﻿ ノ( ゜-゜ノ)"
	}, {
		name: "shrug",
		description: "¯\\_(ツ)_/¯",
		regex: /(^|\s)\/shrug(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "¯\\_(ツ)_/¯"
	}, {
		name: "tuto",
		get description() { return tr('chat_cmd_tuto') },
		regex: /(^|\s)\/tuto(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, escape(tr('chat_cmd_label_tuto')), "target='_blank' rel='noopener'", "lw") + " "
	}, {
		name: "tuto!",
		get description() { return loud('chat_cmd_tuto') },
		regex: /(^|\s)\/tuto([!]?)(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, escape(tr('chat_cmd_label_tuto_loud')), "target='_blank' rel='noopener'", "lw") + " "
	}, {
		name: "update",
		get description() { return tr('chat_cmd_update') },
		regex: /(^|\s)\/update(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_UPDATE + localStorage.getItem('changelog_forum_topic'), escape(tr('chat_cmd_label_update')), "target='_blank' rel='noopener'", "lw") + " "
		}
	}, {
		name: "update!",
		get description() { return loud('chat_cmd_update') },
		regex: /(^|\s)\/update!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_UPDATE + localStorage.getItem('changelog_forum_topic'), escape(tr('chat_cmd_label_update_loud')), "target='_blank' rel='noopener'", "lw") + " "
		}
	}, {
		name: "war",
		get description() { return tr('chat_cmd_war') },
		regex: /(^|\s)\/war(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="1" data-label="' + escape(tr('arena_mode_war')) + '"></span>'
	}, {
		name: "war!",
		get description() { return loud('chat_cmd_war') },
		regex: /(^|\s)\/war!(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + '<span class="br-invite" data-mode="1" data-label="' + escape(tr('chat_cmd_label_war_loud')) + '"></span>'
	}
] as Command[]

const Commands = {
	commands: COMMANDS,
	initialized: false,
	init: () => {
		if (Commands.initialized) return
		Commands.initialized = true
		Commands.addDocumentationCommands()
		Commands.addMarketCommands()
	},
	isCommand: (text: string) => {
		const match = /(?:^|\s)\/(\w*(!|(:\w*))?)$/gi.exec(text)
		if (match) {
			const c = match[1].toLowerCase()
			for (const command of COMMANDS) {
				if (c.indexOf(command.name.substring(0, c.length).toLowerCase()) === 0) { return c }
			}
		}
		return false
	},
	execute(text: string, authorName: string) {
		for (const command of COMMANDS) {
			// Une commande qui engloberait un segment masqué (code, lien…) reste telle quelle.
			text = text.replace(command.regex, (a, b, c, d, e) => hasSentinel(a) ? a : command.replacement(authorName, b, c, d, e))
		}
		return text
	},
	addDocumentationCommands: () => {
		const docCommand = COMMANDS.find((cmd) => cmd.name === "doc")
		if (!docCommand) { return }
		docCommand.options = []
		const doneFunc: {[key: string]: boolean} = {}
		for (const fun of FUNCTIONS) {
			const name = fun.name
			if (!doneFunc[name]) {
				docCommand.options.push({name: fun.name, nameLower: fun.name.toLowerCase(), get description() { return tr('chat_cmd_doc_function') }})
				doneFunc[name] = true
			}
		}
		for (const constant of LeekWars.constants) {
			docCommand.options.push({name: constant.name, nameLower: constant.name.toLowerCase(), get description() { return tr('chat_cmd_doc_constant') }})
		}
	},
	addMarketCommands: () => {
		const marketCommand = COMMANDS.find((cmd) => cmd.name === "market")
		if (!marketCommand) { return }
		marketCommand.options = []
		for (const w in LeekWars.weapons) {
			const weapon = LeekWars.weapons[w]
			if (!LeekWars.items[weapon.item]?.market) { continue }
			marketCommand.options.push({name: weapon.name, nameLower: weapon.name.toLowerCase(), get description() { return tr('chat_cmd_market_weapon') }})
		}
		for (const c in CHIPS) {
			const chip = CHIPS[c]
			if (!LeekWars.items[LeekWars.chipTemplates[chip.id]?.item]?.market) { continue }
			marketCommand.options.push({name: chip.name, nameLower: chip.name.toLowerCase(), get description() { return tr('chat_cmd_market_chip') }})
		}
		for (const key in LeekWars.potions) {
			const potion = LeekWars.potions[key]
			if (!LeekWars.items[potion.id]?.market) { continue }
			marketCommand.options.push({name: potion.name, nameLower: potion.name.toLowerCase(), get description() { return tr('chat_cmd_market_potion') }})
		}
		for (const key in LeekWars.hats) {
			const hat = LeekWars.hats[key]
			if (!LeekWars.items[hat.item]?.market) { continue }
			marketCommand.options.push({name: hat.name, nameLower: hat.name.toLowerCase(), get description() { return tr('chat_cmd_market_hat') }})
		}
	}
}

export { Commands, Command }