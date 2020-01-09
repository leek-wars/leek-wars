import { LeekWars } from "@/model/leekwars"

// URLs for /wiki and /doc
const URL_WIKI = "http://leekwarswiki.net"
const URL_WIKI_PAGE = "http://leekwarswiki.net/index.php?title="
const URL_DOC = "/help/documentation"
const URL_MARKET = "/market"
const URL_TUTO = "/help/tutorial"
const URL_UPDATE = "/forum/category-6/topic-"
const URL_PR = "https://github.com/leek-wars/leek-wars-client/pulls"
const URL_ISSUE = "https://github.com/leek-wars/leek-wars-client/issues/new"

class Command {
	name!: string
	regex!: RegExp
	replacement!: any
	description!: string
	options?: any[]
}

const COMMANDS = [
	{
		name: "doc",
		description: "Lien vers la documentation",
		regex: /(?:^|(\s))\/doc(?::([^\s#]+))?(?=\s|$)/gi,
		replacement: (a: any, b: any, item: string) => {
			const link = item ? URL_DOC + "/" + item : URL_DOC
			const name = item ? item : "Doc"
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "doc!",
		description: "Lien vers la documentation",
		regex: /(?:^|(\s))\/doc!(?=\s|$)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_DOC, "LA DOOOOOC", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "fliptable",
		description: "(╯°□°）╯︵ ┻━┻",
		regex: /(^| )\/fliptable(?=$|\s)/gi,
		replacement: (a: any, b: string) => b + "(╯°□°）╯︵ ┻━┻"
	}, {
		name: "issue",
		description: "Lien vers les Issues sur GitHub",
		regex: /(^| )\/issue(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_ISSUE, "Issue", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "issue!",
		description: "Lien vers les Issues sur GitHub, de manière appuyée",
		regex: /(^| )\/issue!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_ISSUE, "ISSUEEEEE", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "lama",
		description: "#LamaSwag avec une emphase",
		regex: /(^| )\/lama(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "<i>#LamaSwag</i>"
	}, {
		name: "lenny",
		description: "( ͡° ͜ʖ ͡° )",
		regex: /(^| )\/lenny(?=$|\s)/gi,
		replacement: (a: any, b: string) => b + "( ͡° ͜ʖ ͡° )"
	}, {
		name: "market",
		regex: /(?:^|(\s))\/market(?::([^\s#]+))?(?=\s|$)/gi,
		description: "Lien vers un item du marché",
		replacement: (a: any, b: any, item: string) => {
			const link = item ? URL_MARKET + "/" + item : URL_MARKET
			const name = item ? item : "Marché"
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "market!",
		regex: /(?:^|(\s))\/market!(?=\s|$)/gi,
		description: "Lien vers le marché, de manière appuyée",
		replacement: () => " " + LeekWars.toChatLink(URL_MARKET, "LE MARCHÉÉÉÉÉ", "target='_blank' rel='noopener'") + " "
	}, {
		name: "me",
		description: "Votre pseudo avec une emphase",
		regex: /(^| )\/me(?=$|\s)/gi,
		replacement: (authorName: string, space: string) => space + "<i>" + authorName + "</i>"
	}, {
		name: "ping",
		description: "Envoie un message ping au serveur",
		regex: /(^| )\/ping(?=$|\s)/gi,
		replacement: () => ''
	}, {
		name: "pr",
		description: "Lien vers les Pull Request sur GitHub",
		regex: /(^| )\/pr(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_PR, "Pull Request", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "pr!",
		description: "Lien vers les PR sur GitHub de manière appuyée",
		regex: /(^| )\/pr!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_PR, "PULL REQUESTTTTT", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "replacetable",
		description: "┬─┬﻿ ノ( ゜-゜ノ)",
		regex: /(^| )\/replacetable(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "┬─┬﻿ ノ( ゜-゜ノ)"
	}, {
		name: "shrug",
		description: "¯\\_(ツ)_/¯",
		regex: /(^| )\/shrug(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "¯\\_(ツ)_/¯"
	}, {
		name: "tuto",
		description: "Lien vers le tutorial",
		regex: /(^| )\/tuto(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, "tuto", "target='_blank' rel='noopener'") + " "
	}, {
		name: "tuto!",
		description: "Lien vers le tutorial, de manière appuyée",
		regex: /(^| )\/tuto([!]?)(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, "LE TUTOOOOO", "target='_blank' rel='noopener'") + " "
	}, {
		name: "update",
		description: "Lien vers le sujet de la dernière mise à jour",
		regex: /(^| )\/update(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_UPDATE + localStorage.getItem('changelog_forum_topic'), "la màj", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "update!",
		description: "Lien vers le sujet de la dernière mise à jour, de manière appuyée",
		regex: /(^| )\/update!(?=$|\s)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_UPDATE + localStorage.getItem('changelog_forum_topic'), "LA MÀJJJJJ", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "wiki",
		description: "Lien vers le wiki (avec une page et une ancre)",
		regex: /(?:^|(\s))\/wiki(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/gi,
		replacement: (a: any, b: any, page: string, anchor: string) => {
			const name = page ? page + (anchor ? '#' + anchor : '') : "Wiki"
			const link = page ? URL_WIKI_PAGE + page + (anchor ? '#' + anchor : '') : URL_WIKI
			return  " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		},
		options: []
	}, {
		name: "wiki!",
		description: "Lien vers le wiki, de manière appuyée",
		regex: /(?:^|(\s))\/wiki!(?=\s|$)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='noopener'") + " "
	}
] as Command[]

const Commands = {
	commands: COMMANDS,
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
			text = text.replace(command.regex, (a, b, c, d, e) => command.replacement(authorName, b, c, d, e))
		}
		return text
	},
	addDocumentationCommands: () => {
		const docCommand = COMMANDS.find((cmd) => cmd.name === "doc")
		if (!docCommand) { return }
		docCommand.options = []
		const doneFunc: {[key: string]: any} = {}
		for (const fun of LeekWars.functions) {
			const name = fun.name
			if (!doneFunc[name]) {
				docCommand.options.push({name: fun.name, nameLower: fun.name.toLowerCase(), description: "Ajoute un lien vers la fonction \"" + fun.name + "\" de la documentation au message"})
				doneFunc[name] = true
			}
		}
		for (const constant of LeekWars.constants) {
			docCommand.options.push({name: constant.name, nameLower: constant.name.toLowerCase(), description: "Ajoute un lien vers la constante \"" + constant.name + "\" de la documentation au message"})
		}
	},
	addMarketCommands: () => {
		const marketCommand = COMMANDS.find((cmd) => cmd.name === "market")
		if (!marketCommand) { return }
		marketCommand.options = []
		for (const w in LeekWars.weapons) {
			const weapon = LeekWars.weapons[w]
			marketCommand.options.push({name: weapon.name, nameLower: weapon.name.toLowerCase(), description: "Ajoute un lien vers l'arme \"" + weapon.name + "\" du marché au message"})
		}
		for (const c in LeekWars.chips) {
			const chip = LeekWars.chips[c]
			marketCommand.options.push({name: chip.name, nameLower: chip.name.toLowerCase(), description: "Ajoute un lien vers la puce \"" + chip.name + "\" du marché au message"})
		}
		for (const key in LeekWars.potions) {
			const potion = LeekWars.potions[key]
			marketCommand.options.push({name: potion.name, nameLower: potion.name.toLowerCase(), description: "Ajoute un lien vers la potion \""  + potion.name + "\" du marché au message"})
		}
		for (const key in LeekWars.hats) {
			const hat = LeekWars.hats[key]
			marketCommand.options.push({name: hat.name, nameLower: hat.name.toLowerCase(), description: "Ajoute un lien vers le chapeau \"" + hat.name + "\" du marché au message"})
		}
	}
}

export { Commands, Command }