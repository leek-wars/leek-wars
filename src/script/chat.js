LW.pages.chat.init = function(params, $scope, $page) {

	$page.render()

	LW.setTitle(_.lang.get('chat', 'title'))

	$page.chat = new ChatController($('#chat .content'), function(message) {
		LW.socket.send([FORUM_CHAT_SEND, $page.chat.channel, message])
	}, true)
	for (var c in LW.chat.channels) {
		for (var m in LW.chat.messages[LW.chat.channels[c]]) {
			var message = LW.chat.messages[LW.chat.channels[c]][m]
			if (message.length <= 3) {
				$page.chat.receive_br_notif(message)
			} else {
				$page.chat.receive_message(message)
			}
		}
	}
}

LW.pages.chat.resize = function() {
	if (_.is_mobile()) {
		$('#chat .chat-messages').height($(window).height() - 155)
	} else {
		$('#chat .chat-messages').height($(window).height() - $('#header').height() - 170)
	}
}

LW.pages.chat.wsconnected = function() {
	$('#chat .websocket-loader').remove()
	$('#chat .chat-messages').empty()
}

LW.pages.chat.wsreceive = function(data) {

	if (!this.chat) return ;

	if (data.type == FORUM_CHAT_RECEIVE) {
		var data = data.data
		var message = {
			lang: data[0],
			farmer_id: data[1],
			farmer_name: data[2],
			content: data[3],
			date: data[4],
			farmer_color: data[5],
			avatar_changed: data[6]
		}
		this.chat.receive_message(message)

	} else if (data.type == CHAT_MUTE_USER) {
		this.chat.mute_user(data.data)
	} else if (data.type == BATTLE_ROYALE_CHAT_NOTIF) {
		this.chat.receive_br_notif(data.data)
	} else if (data.type == PONG) {
		this.chat.receive_pong(data.data)
	}
}
