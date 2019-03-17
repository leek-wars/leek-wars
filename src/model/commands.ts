import { LeekWars } from "@/model/leekwars"

// URLs for /wiki and /doc
const URL_WIKI = "http://leekwarswiki.net"
const URL_WIKI_PAGE = "http://leekwarswiki.net/index.php?title="
const URL_DOC = "/help/documentation"
const URL_MARKET = "/market"
const URL_TUTO = "/help/tutorial"

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
		description: "Ajoute un lien vers la documentation au message",
		regex: /(?:^|(\s))\/doc(?::([^\s#]+))?(?=\s|$)/gi,
		replacement: (a: any, b: any, item: string) => {
			const link = item ? URL_DOC + "/" + item : URL_DOC
			const name = item ? item : "Doc"
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "doc!",
		description: "Ajoute un lien vers la documentation au message",
		regex: /(?:^|(\s))\/doc!(?=\s|$)/gi,
		replacement: () => {
			return " " + LeekWars.toChatLink(URL_DOC, "LA DOOOOOC", "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "fliptable",
		description: "Ajoute (╯°□°）╯︵ ┻━┻ au message",
		regex: /(^| )\/fliptable(?=$|\s)/gi,
		replacement: (a: any, b: string) => b + "(╯°□°）╯︵ ┻━┻"
	}, {
		name: "lama",
		description: "Ajoute #LamaSwag avec une emphase au message",
		regex: /(^| )\/lama(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "<i>#LamaSwag</i>"
	}, {
		name: "lenny",
		description: "Ajoute ( ͡° ͜ʖ ͡° ) au message",
		regex: /(^| )\/lenny(?=$|\s)/gi,
		replacement: (a: any, b: string) => b + "( ͡° ͜ʖ ͡° )"
	}, {
		name: "market",
		regex: /(?:^|(\s))\/market(?::([^\s#]+))?(?=\s|$)/gi,
		description: "Ajoute un lien vers un item du marché au message",
		replacement: (a: any, b: any, item: string) => {
			const link = item ? URL_MARKET + "/" + item : URL_MARKET
			const name = item ? item : "Marché"
			return " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		}
	}, {
		name: "market!",
		regex: /(?:^|(\s))\/market!(?=\s|$)/gi,
		description: "Ajoute un lien vers un item du marché au message",
		replacement: () => " " + LeekWars.toChatLink(URL_MARKET, "LE MARCHÉÉÉÉÉ", "target='_blank' rel='noopener'") + " "
	}, {
		name: "me",
		description: "Ajoute votre pseudo avec une emphase au message",
		regex: /(^| )\/me(?=$|\s)/gi,
		replacement: (authorName: string, space: string) => space + "<i>" + authorName + "</i>"
	}, {
		name: "ping",
		description: "Envoie un message ping au serveur",
		regex: /(^| )\/ping(?=$|\s)/gi,
		replacement: () => ''
	}, {
		name: "replacetable",
		description: "Ajoute ┬─┬﻿ ノ( ゜-゜ノ) au message",
		regex: /(^| )\/replacetable(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "┬─┬﻿ ノ( ゜-゜ノ)"
	}, {
		name: "shrug",
		description: "Ajoute ¯\\_(ツ)_/¯ au message",
		regex: /(^| )\/shrug(?=$|\s)/gi,
		replacement: (_: string, space: string) => space + "¯\\_(ツ)_/¯"
	}, {
		name: "tuto",
		description: "Ajoute un lien vers le tutorial au message",
		regex: /(^| )\/tuto(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, "tuto", "target='_blank' rel='noopener'") + " "
	}, {
		name: "tuto!",
		description: "Ajoute un lien vers le tutorial au message",
		regex: /(^| )\/tuto([!]?)(?=$|\s)/gi,
		replacement: () => " " + LeekWars.toChatLink(URL_TUTO, "LE TUTOOOOO", "target='_blank' rel='noopener'") + " "
	}, {
		name: "wiki",
		description: "Ajoute un lien vers le wiki au message (avec une page et une ancre)",
		regex: /(?:^|(\s))\/wiki(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/gi,
		replacement: (a: any, b: any, page: string, anchor: string) => {
			const name = page ? page + (anchor ? '#' + anchor : '') : "Wiki"
			const link = page ? URL_WIKI_PAGE + page + (anchor ? '#' + anchor : '') : URL_WIKI
			return  " " + LeekWars.toChatLink(link, name, "target='_blank' rel='noopener'") + " "
		},
		options: []
	}, {
		name: "wiki!",
		description: "Ajoute un lien vers le wiki au message (avec une page et une ancre)",
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