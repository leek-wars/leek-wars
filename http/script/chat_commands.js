var chat_commands = {

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
        regex: /(^| )\/doc(?=$|\s)/g,
        replacement: function(authorName) {
            return _.toChatLink(URL_DOC, "Doc", "target='_blank' rel='nofollow'")
        },
        description: "Ajoute un lien vers la documentation au message"
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
        regex: /(^| )\/market(?=$|\s)/g,
        replacement: function(authorName) {
            return _.toChatLink(URL_MARKET, "Market", "target='_blank' rel='nofollow'")
        },
        description: "Ajoute un lien vers le marché au message"
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
        regex: /(^| )\/wiki(?=$|\s)/g,
        replacement: function(authorName) {
            return _.toChatLink(URL_WIKI, "Wiki", "target='_blank' rel='nofollow'")
        },
        description: "Ajoute un lien vers le wiki au message"
    }
]

chat_commands.isCommand = function(command) {
    var match = /\/(\w*)$/g.exec(command);
    if(match) {
        var c = match[1];
        for(var i in chat_commands.list) {
            if(chat_commands.list[i].command.includes(c)) return true;
        }
    }
    return false;
}

chat_commands.filterPopup = function(command) {
    var match = /\/(\w*)$/g.exec(command);
    $('.command').hide()
    if(match) {
        var c = match[1];
        if(c.length) {
            $('.command[command^=' + c + ']').show()
        } else {
            $('.command').show()
        }
    }
}
