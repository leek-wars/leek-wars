var smiley_commands = {
    regex: /:(\w+(!|(:\w*))?)$/gi
}

smiley_commands.isSmiley = function(command) {
    var match = /:(\w+(!|(:\w*))?)$/gi.exec(command)
    if (match) {
        var c = match[1]
        for (var i in smileys.list) {
            for (var j in smileys.list[i].list) {
                if (smileys.list[i].list[j].name.substring(1, 1 + c.length).toLowerCase() == c.toLowerCase()) {
                    return true
                }
            }
        }
    }
    return false
}

smiley_commands.filterPopup = function(command) {
    var match = /:(\w+(!|(:\w*))?)$/gi.exec(command)
    $(".title").hide()
    $('.smiley').hide()
    if (match) {
        var m = match[1]
        if (m.length) {
            $("#chat-smileys .title").hide()
            $(".smiley[emoji]").filter(function() {
                return $(this).attr("emoji").substring(1, 1 + m.length).toLowerCase() == m.toLowerCase()
            }).show()
        } else {
            $("#chat-smileys .title").show()
            $(".smiley").show()
        }
    }
}
