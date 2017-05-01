var chat_commands = {
    regex: /\/(\w*(!|(:\w*))?)$/g
}

chat_commands.list = [
    {
        command: "admin",
        regex: /(^| )\/admin(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1<i>" + authorName + " aime les admins !</i>"
        },
        description: "Ajoute votre amour pour Pilow avec une emphase au message"
    }, {
        command: "doc",
        regex: /(?:^|(\s))\/doc([!]?)(?::([^\s#]+))?(?=\s|$)/g,
        replacement: function(authorName) {
            return " " + _.toChatLink(URL_DOC, "Doc", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers la documentation au message",
        options: [{
            command: "doc!",
            regex: /(^| )\/doc!(?=$|\s)/g,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_DOC, "LA DOOOOOC", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers la documentation au message"
        }]
    }, {
        command: "fliptable",
        regex: /(^| )\/fliptable(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1(╯°□°）╯︵ ┻━┻"
        },
        description: "Ajoute (╯°□°）╯︵ ┻━┻ au message"
    }, {
        command: "lama",
        regex: /(^| )\/lama(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1<i>#LamaSwag</i>"
        },
        description: "Ajoute #LamaSwag avec une emphase au message"
    }, {
        command: "lenny",
        regex: /(^| )\/lenny(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1( ͡° ͜ʖ ͡° )"
        },
        description: "Ajoute ( ͡° ͜ʖ ͡° ) au message"
    }, {
        command: "market",
        regex: /(?:^|(\s))\/market(?::([^\s#]+))?(?=\s|$)/g,
        replacement: function(authorName) {
            return " " + _.toChatLink(URL_MARKET, "Marché", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers le marché au message",
        options: [{
            command: "market!",
            regex: /(^| )\/market!(?=$|\s)/g,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_MARKET, "LE MARCHÉÉÉÉÉ", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers le marché au message"
        }]
    }, {
        command: "me",
        regex: /(^| )\/me(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1<i>" + authorName + "</i>"
        },
        description: "Ajoute votre pseudo avec une emphase au message"
    }, {
        command: "replacetable",
        regex: /(^| )\/replacetable(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1┬─┬﻿ ノ( ゜-゜ノ)"
        },
        description: "Ajoute ┬─┬﻿ ノ( ゜-゜ノ) au message"
    }, {
        command: "shrug",
        regex: /(^| )\/shrug(?=$|\s)/g,
        replacement: function(authorName) {
            return "$1¯\\_(ツ)_/¯"
        },
        description: "Ajoute ¯\\_(ツ)_/¯ au message"
    }, {
        command: "wiki",
        regex: /(?:^|(\s))\/wiki([!]?)(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/g,
        replacement: function(authorName) {
            return  " " + _.toChatLink(URL_WIKI, "Wiki", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers le wiki au message",
        options: [{
            command: "wiki!",
            regex: /(^| )\/wiki!(?=$|\s)/g,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers le wiki au message"
        }, {
            command: "wiki:page",
            regex: /(^| )\/wiki:page(?=$|\s)/g,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers la page du wiki au message"
        }, {
            command: "wiki:page#ancre",
            regex: /(^| )\/wiki:page#ancre(?=$|\s)/g,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers l'ancre de la page du wiki au message"
        }]
    }
]

chat_commands.isCommand = function(command) {
    var match = /\/(\w*(!|(:\w*))?)$/g.exec(command)
    if (match) {
        var c = match[1]
        for (var i in chat_commands.list) {
            if (chat_commands.list[i].command.substring(0, c.length) == c) return true
            for (var j in chat_commands.list[i].options) {
                if (chat_commands.list[i].options[j].command.substring(0, c.length) == c) return true
            }
        }
    }
    return false
}

chat_commands.filterPopup = function(command) {
    var match = /\/(\w*(!|(:\w*))?)$/g.exec(command)
    $('.command').hide()
    $('.sub-command').hide()
    if (match) {
        var m = match[1]
        if (m.length) {
            m = m.replace(/(\:|\!)/g, function(a, b) { return "\\" + b })
            $(".command[command^=" + m + "]").show()
            var c = m.split(/\\:|\\!/g)
            if (c.length == 1) {
                $(".sub-command[command=" + m + "]").show()
            } else {
                $(".sub-command[command=" + c[0] + "][subcommand^=" + m + "]").show()
            }
        } else {
            $(".command").show()
        }
    }
}


chat_commands.setDocumentationOptions = function() {
    var docCommand = this.list.find(function(cmd) {
        return cmd.command == "doc"
    })
    for (var key in LW.functions) {
        var name = LW.functions[key].name
        docCommand.options.push({
            command: "doc:" + name,
            description: "Ajoute un lien vers la fonction \"" + _.lang.get('documentation', name) + "\" de la documentation au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_DOC + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/doc:" + name + "(?=\\s|$)", "g")
        })
    }
    for (var key in LW.constants) {
        var name = LW.constants[key].name
        docCommand.options.push({
            command: "doc:" + name,
            description: "Ajoute un lien vers la constante \"" + _.lang.get('documentation', name) + "\" de la documentation au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_DOC + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/doc:" + name + "(?=\\s|$)", "g")
        })
    }
}

chat_commands.setMarketOptions = function() {
    var marketCommand = this.list.find(function(cmd) {
        return cmd.command == "market"
    })
    for (var key in LW.weapons) {
        var name = LW.weapons[key].name
        marketCommand.options.push({
            command: "market:" + name,
            description: "Ajoute un lien vers l'arme \"" + _.lang.get('weapon', name) + "\" du marché au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_MARKET + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "g")
        })
    }
    for (var key in LW.chips) {
        var name = LW.chips[key].name
        marketCommand.options.push({
            command: "market:" + name,
            description: "Ajoute un lien vers la puce \"" + _.lang.get('chip', name) + "\" du marché au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_MARKET + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "g")
        })
    }
    for (var key in LW.potions) {
        var name = LW.potions[key].name
        marketCommand.options.push({
            command: "market:" + name,
            description: "Ajoute un lien vers la potion \"" + _.lang.get('potion', name) + "\" du marché au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_MARKET + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "g")
        })
    }
    for (var key in LW.hats) {
        var name = LW.hats[key].name
        marketCommand.options.push({
            command: "market:" + name,
            description: "Ajoute un lien vers le chapeau \"" + _.lang.get('hat', name) + "\" du marché au message",
            replacement: function(item) {
                return function(authorName) {
                   return " " + _.toChatLink(URL_MARKET + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                }
            }(name),
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "g")
        })
    }
}

chat_commands.wikiCommands = function(text) {
    // Wiki commands
	while(matches = /(?:^|(\s))\/wiki([!]?)(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/g.exec(text)) {
		var urlWiki = ''
		var textWiki = matches[2] ? 'LE WIKIIIII' : 'Wiki'
		// /wiki
		if (!matches[3]) {
			urlWiki += URL_WIKI
		}
		// /wiki:page OR /wiki:page#anchor
		else {
			urlWiki += URL_WIKI_PAGE + matches[3]
			textWiki = matches[3]
			if(matches[4]) {
				urlWiki += '#' + matches[4]
			}
		}
		text = text.replace(matches[0], ' ' + _.toChatLink(urlWiki, textWiki, "target='_blank' rel='nofollow'") + ' ')
	}
    return text
}
