

LW.pages.chat.init = function(params, $scope, $page) {

	$page.render()

	LW.setTitle(_.lang.get('chat', 'title'))

	$page.chat = new ChatController($('#chat .content'))
}

LW.pages.chat.resize = function() {
	$('#chat .chat-messages').height($(window).height() - $('#header').height() - 170)
}

LW.pages.chat.wsconnected = function() {

	$('#chat .websocket-loader').remove()
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
		this.chat.mute_user(data[1])
	}
}
