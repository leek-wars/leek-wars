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

	_.get('message/get-latest-conversations/100/$', function(data) {

		for (var c in data.conversations) {
			data.conversations[c].avatars = LW.messages.getAvatars(data.conversations[c])
			data.conversations[c].name = LW.messages.getConversationList(data.conversations[c])
			data.conversations[c].last_message = LW.messages.getConversationLastMessage(data.conversations[c])
 		}

		$scope.conversations = data.conversations
		$page.render()

		LW.setTitle(_.lang.get('messages', 'title'))

		// Sélection de la conversation de départ

		if (new_conversation) {

			var found = false
			for (var c in data.conversations) {
				var conversation = data.conversations[c]
				var farmers = conversation.farmers
				for (var f in farmers) {
					if (farmers[f].id == new_farmer) {
						LW.page('/messages/conversation/' + conversation.id)
						found = true
						break
					}
				}
			}

			if (!found) {

				_conversation = 0
				$('#conversations-list').prepend("<div class='conversation-preview selected' conv='0'>" +
					"<img src='" + LW.staticURL + "image/no_avatar.png'>" +
					"<div class='content'>" + _.lang.get('messages', 'new_message') + "</div>" +
					"</div>")
			}

		} else {
			if (id != null) {
				LW.page('/messages/conversation/' + id)
			} else {
				LW.page('/messages/conversation/' + $('.conversation-preview').first().attr('conv'))
			}
		}

		$('.conversation-preview').click(function() {
			
			var id = $(this).attr('conv')
			LW.page('/messages/conversation/' + id)
		})
		
		// Send message
		$('#chat-send').click(function() {
			sendMessage()
		})
		$("#messages-page .chat-input").keyup(function(e) {
			if (e.keyCode == 13) {
				sendMessage()
			}
		})
		
		// Smileys
		$('.chat-message-messages div, .conversation-preview .content').each(function() {
			// $(this).html(smiley($(this).html()));
		});
		
		// Focus
		$(window).focus(function() {
			_focus = true;
			conversationRead();
		});
		$(window).blur(function() {
			_focus = false;
		});

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
	var h = $('#header').height() + 135
	$('#conversations').css('height', $(window).height() - h);
	$('#conversations-list').css('height', $(window).height() - h + 45);
}

LW.pages.messages.update = function(params) {

	LW.pages.messages.selectConversation(params.id)
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
		_chat_controllers[conversationID].receive_message(message)

		if (conversationID == _conversation) {
			updateScroll(conversationID)
		}
		
		// if (_focus)
			// conversationRead();
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

	_.log("load conv " + conv)
	
	if (typeof(_conversations[conv]) === 'undefined') {
		
		_conversations[conv] = []
		_chat_controllers[conv] = new ChatController($('.conversation[conv=' + conv + ']'), true)
		
		// Ajout d'un loader
		$('#conversation-' + conv).append("<center class='loader'><img src='" + LW.staticURL + "image/loader.gif' class='loader'></img></center>");
		
		_.get('message/get-messages/' + conv + '/' + 50 + '/' + 1 + '/$', function(data) {

			if (!data.success) return null

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
			
			$('#conversation-' + conv).find('.loader').remove();
		})
		
	} else {
		updateScroll(conv)
	}
}

function updateScroll(conv) {
	$("#conversations").scrollTop($('.conversation[conv=' + conv + ']').height());
}

function sendMessage() {

	var message = $.trim($('#messages-page .chat-input').val())
	if (message.length == 0) return null
	
	if (_conversation == 0) { // Nouvelle conversation
	
		_.post('message/create-conversation', {farmer_id: _new_farmer, message: message}, function(data) {
			if (data.success) {
				// LW.page('/messages/conversation/' + data.conversation_id)
				_.reload()
			}
		})
	
	} else {
		
		var m = {
			farmer_id: LW.farmer.id, 
			farmer_name: LW.farmer.name, 
			content: message, 
			date: LW.time.get(), 
			farmer_color: LW.farmer.color, 
			avatar_changed: LW.farmer.avatar_changed, 
			lang: '_'
		}
		_chat_controllers[_conversation].receive_message(m)
		
		updateScroll(_conversation)
		
		_.post('message/send-message', {conversation_id: _conversation, message: message})
	}
	$('#messages-page .chat-input').val("").height(0)
}


function conversationRead() {
	LW.socket.send([MP_READ, _conversation])
}
