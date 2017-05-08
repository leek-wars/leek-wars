var _conversations
var _conversation
var _new_farmer
var _chat_controllers = {}

LW.pages.messages.init = function(params, $scope, $page) {

	_conversations = []
	_conversation = null

	var new_conversation = 'new_conversation' in params
	var new_farmer = new_conversation ? params.new_farmer : null
	var id = 'id' in params ? params.id : null
	_new_farmer = new_farmer

	_.get('message/get-latest-conversations/100/' + LW.token(), function(data) {

		for (var c in data.conversations) {
			data.conversations[c].avatars = LW.messages.getAvatars(data.conversations[c])
			data.conversations[c].name = LW.messages.getConversationList(data.conversations[c])
			data.conversations[c].last_message = LW.messages.getConversationLastMessage(data.conversations[c])
 		}
		// new conversation
		if (new_conversation) {
			data.conversations.unshift({id: 0, avatars: "<img class='avatar' src='" + _.view.render('main.avatar', new_farmer) + "'>", last_message: _.lang.get('messages', 'new_message'), name: _.protect(new_farmer.name), farmers: [_.protect(new_farmer)]})
		}

		$scope.conversations = data.conversations
		$page.render()

		LW.setTitle(_.lang.get('messages', 'title'))

		// Sélection de la conversation de départ
		if (new_conversation) {
			var found = false
			for (var c in data.conversations) {
				var conversation = data.conversations[c]
				if (conversation.id == 0) continue
				var farmers = conversation.farmers
				for (var f in farmers) {
					if (farmers[f].id == new_farmer.id) {
						$('#conversations-list [conv="0"]').hide()
						LW.page.redirect('/messages/conversation/' + conversation.id)
						found = true
						break
					}
				}
			}
			if (!found) {
				_conversation = 0
				$('#conversations-list [conv="0"]').show()
				LW.pages.messages.selectConversation(0)
			}
		} else {
			if (id != null) {
				LW.page.redirect('/messages/conversation/' + id)
			} else {
				LW.page.redirect('/messages/conversation/' + $('.conversation-preview').first().attr('conv'))
			}
		}

		$('.conversation-preview').click(function() {
			var id = $(this).attr('conv')
			if (id == 0) {
				LW.page('/messages/new/' + new_farmer.id + '/' + new_farmer.name + '/' + new_farmer.avatar_changed)
			} else {
				LW.page('/messages/conversation/' + id)
			}
		})

		// Quit conversation
		var quitPopup = new _.popup.new('messages.quit_popup')

		$('#quit-conversation').click(function(e) {
			quitPopup.show(e)
		})

		quitPopup.find('#quit-conversation-validate').click(function() {
			_.post('message/quit-conversation', {conversation_id: _conversation}, function(data) {
				if (data.success) {
					_.reload()
				}
			})
		})
	})
}

LW.pages.messages.resize = function() {
	var h = $(window).height() - $('#header').height() - 75
	$('#conversations').css('height', h);
	$('#conversations .conversation').css('height', h);
	$('#conversations-list').css('height', h);
}

LW.pages.messages.focus = function() {
	_focus = true
	conversationRead()
}
LW.pages.messages.blur = function() {
	_focus = false
}

LW.pages.messages.update = function(params) {
	var new_conversation = params && 'new_conversation' in params
	if (new_conversation) {
		LW.pages.messages.selectConversation(0)
	} else {
		LW.pages.messages.selectConversation(params.id)
	}
}

LW.pages.messages.wsreceive = function(data) {

	if (data.type == MP_RECEIVE) {

		data = data.data
		var conversationID = data[0]

		var message = {
			lang: '_',
			farmer_id: data[1],
			farmer_name: data[2],
			content: data[3],
			date: LW.time.get(),
			farmer_color: data[5],
			avatar_changed: data[6]
		}

		if (typeof(_chat_controllers[conversationID]) === 'undefined') {
			LW.pages.messages.loadConversation(conversationID);
		}
		_chat_controllers[conversationID].receive_message(message)

		if (conversationID == _conversation) {
			updateScroll(conversationID)
		}
	}
}

LW.pages.messages.selectConversation = function(id) {
	_conversation = id
	$('.conversation').hide()
	$('.conversation[conv=' + id + ']').show()
	$('.conversation-preview').removeClass('selected')
	$('.conversation-preview[conv=' + id + ']').addClass('selected')
	LW.pages.messages.loadConversation(id)
}

LW.pages.messages.loadConversation = function(conv) {

	if (typeof(_conversations[conv]) === 'undefined') {

		_conversations[conv] = []
		_chat_controllers[conv] = new ChatController($('.conversation[conv=' + conv + ']'), function(message) {
			sendMessage(message)
		})

		// Load messages
		if (conv != 0) {
			LW.loader.show()
			_.get('message/get-messages/' + conv + '/' + 50 + '/' + 1 + '/' + LW.token(), function(data) {
				if (!data.success) {
					_.toast(data.error)
					return null
				}
				// Unread ?
				if (data.unread) {
					_messageCount--
					updateCounters()
				}
				for (var m in data.messages.reverse()) {
					var message = data.messages[m]
					_chat_controllers[conv].receive_message(message)
					_conversations[conv].push(message)
				}
				updateScroll(conv)
				conversationRead()
				LW.loader.hide()
			})
		}
	} else {
		updateScroll(conv)
	}
}

function updateScroll(conv) {
	$("#conversations").scrollTop($('.conversation[conv=' + conv + ']').height());
}

function sendMessage(message) {

	if (message.length == 0) return null

	if (_conversation == 0) { // Nouvelle conversation

		_.post('message/create-conversation', {farmer_id: _new_farmer.id, message: message}, function(data) {
			if (data.success) {
				// LW.page('/messages/conversation/' + data.conversation_id)
				_.reload()
			}
		})

	} else {

		_.post('message/send-message', {conversation_id: _conversation, message: message}, function (data) {
			if (data.success) {
				updateScroll(_conversation)
				LW.messages.updateConversationSidebar({
					id: _conversation,
					last_date: LW.time.get(),
					last_message: message,
					last_farmer_id: LW.farmer.id,
					isNew: false
				})
			}
		})
	}
}

function conversationRead() {
	LW.socket.send([MP_READ, _conversation])
}
