var chat_commands = {
    regex: /\/(\w*(!|(:\w*))?)$/gi
}

chat_commands.list = [
    {
        command: "doc",
        regex: /(?:^|(\s))\/doc([!]?)(?::([^\s#]+))?(?=\s|$)/gi,
        replacement: function(authorName) {
            return " " + _.toChatLink(URL_DOC, "Doc", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers la documentation au message",
        options: [{
            command: "doc!",
            regex: /(^| )\/doc!(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_DOC, "LA DOOOOOC", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers la documentation au message"
        }]
    }, {
        command: "fliptable",
        regex: /(^| )\/fliptable(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1(╯°□°）╯︵ ┻━┻"
        },
        description: "Ajoute (╯°□°）╯︵ ┻━┻ au message"
    }, {
        command: "lama",
        regex: /(^| )\/lama(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1<i>#LamaSwag</i>"
        },
        description: "Ajoute #LamaSwag avec une emphase au message"
    }, {
        command: "lenny",
        regex: /(^| )\/lenny(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1( ͡° ͜ʖ ͡° )"
        },
        description: "Ajoute ( ͡° ͜ʖ ͡° ) au message"
    }, {
        command: "market",
        regex: /(?:^|(\s))\/market(?::([^\s#]+))?(?=\s|$)/gi,
        replacement: function(authorName) {
            return " " + _.toChatLink(URL_MARKET, "Marché", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers le marché au message",
        options: [{
            command: "market!",
            regex: /(^| )\/market!(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_MARKET, "LE MARCHÉÉÉÉÉ", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers le marché au message"
        }]
    }, {
        command: "me",
        regex: /(^| )\/me(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1<i>" + authorName + "</i>"
        },
        description: "Ajoute votre pseudo avec une emphase au message"
    }, {
        command: "ping",
        regex: /(^| )\/ping(?=$|\s)/gi,
        description: "Envoie un message ping au serveur"
    }, {
        command: "replacetable",
        regex: /(^| )\/replacetable(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1┬─┬﻿ ノ( ゜-゜ノ)"
        },
        description: "Ajoute ┬─┬﻿ ノ( ゜-゜ノ) au message"
    }, {
        command: "shrug",
        regex: /(^| )\/shrug(?=$|\s)/gi,
        replacement: function(authorName) {
            return "$1¯\\_(ツ)_/¯"
        },
        description: "Ajoute ¯\\_(ツ)_/¯ au message"
    }, {
        command: "tuto",
        regex: /(^| )\/tuto([!]?)(?=$|\s)/gi,
        replacement: function(authorName) {
                return " " + _.toChatLink(URL_TUTO, "tuto", "target='_blank' rel='nofollow'") + " "
            },
        description: "Ajoute un lien vers le tutorial au message",
	options: [{
            command: "tuto!",
            regex: /(^| )\/tuto!(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_TUTO, "LE TUTOOOOO", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers le tutorial au message"
        }]
    }, {
        command: "wiki",
        regex: /(?:^|(\s))\/wiki([!]?)(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/gi,
        replacement: function(authorName) {
            return  " " + _.toChatLink(URL_WIKI, "Wiki", "target='_blank' rel='nofollow'") + " "
        },
        description: "Ajoute un lien vers le wiki au message",
        options: [{
            command: "wiki!",
            regex: /(^| )\/wiki!(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers le wiki au message"
        }, {
            command: "wiki:page",
            regex: /(^| )\/wiki:page(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers la page du wiki au message"
        }, {
            command: "wiki:page#ancre",
            regex: /(^| )\/wiki:page#ancre(?=$|\s)/gi,
            replacement: function(authorName) {
                return " " + _.toChatLink(URL_WIKI, "LE WIKIIIII", "target='_blank' rel='nofollow'") + " "
            },
            description: "Ajoute un lien vers l'ancre de la page du wiki au message"
        }]
    }
]

chat_commands.isCommand = function(command) {
    var match = /\/(\w*(!|(:\w*))?)$/gi.exec(command)
    if (match) {
        var c = match[1]
        for (var i in chat_commands.list) {
            if (chat_commands.list[i].command.substring(0, c.length).toLowerCase() == c.toLowerCase()) return true
            for (var j in chat_commands.list[i].options) {
                if (chat_commands.list[i].options[j].command.substring(0, c.length).toLowerCase() == c.toLowerCase()) return true
            }
        }
    }
    return false
}

chat_commands.filterPopup = function(command) {
    var match = /\/(\w*(!|(:\w*))?)$/gi.exec(command)
    $('.command').hide()
    $('.sub-command').hide()
    if (match) {
        var m = match[1]
        if (m.length) {
            $(".command[command]").filter(function() {
                return $(this).attr("command").substring(0, m.length).toLowerCase() == m.toLowerCase()
            }).show()
            var c = m.split(/(\:|\!)/gi)
            if (c.length == 1) {
                $(".sub-command[command]").filter(function() {
                    return $(this).attr("command").toLowerCase() == m.toLowerCase()
                }).show()
            } else {
                $(".sub-command[command][subcommand]").filter(function() {
                    return $(this).attr("command").toLowerCase() == c[0].toLowerCase()
                        && $(this).attr("subcommand").substring(0, m.length).toLowerCase() == m.toLowerCase()
                }).show()
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
    var doneFunc = []
    for (var key in LW.functions) {
        var name = LW.functions[key].name
        if(!doneFunc[name]) {
            docCommand.options.push({
                command: "doc:" + name,
                description: "Ajoute un lien vers la fonction \"" + _.lang.get('documentation', name) + "\" de la documentation au message",
                replacement: function(item) {
                    return function(authorName) {
                    return " " + _.toChatLink(URL_DOC + "/" + item, item, "target='_blank' rel='nofollow'") + " "
                    }
                }(name),
                regex: new RegExp("(?:^|(\\s))\/doc:" + name + "(?=\\s|$)", "gi")
            })
            doneFunc[name] = true
        }
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
            regex: new RegExp("(?:^|(\\s))\/doc:" + name + "(?=\\s|$)", "gi")
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
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "gi")
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
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "gi")
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
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "gi")
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
            regex: new RegExp("(?:^|(\\s))\/market:" + name + "(?=\\s|$)", "gi")
        })
    }
}

chat_commands.wikiCommands = function(text) {
    // Wiki commands
	while(matches = /(?:^|(\s))\/wiki([!]?)(?::([^\s#]+)(?:#([^\s]+))?)?(?=\s|$)/gi.exec(text)) {
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
