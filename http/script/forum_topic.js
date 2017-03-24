var _topic
var _messageSent = false

LW.pages.forum_topic.init = function(params, $scope, $page) {

	var topic = params.topic
	var page = 'page' in params ? params.page : 1

	_.get('forum/get-messages/' + topic + '/' + page + '/' + LW.token(), function(data) {

		if (!data.success) {
			LW.error()
			return
		}

		_topic = data.topic
		_category = data.category

		$scope.messages = data.messages
		$scope.topic = data.topic
		$scope.category = data.category
		$scope.pagination = _.pagination.create(page, data.pages, '/forum/category-' + data.category.id + '/topic-' + data.topic.id)

		$page.render()

		LW.setTitle(_topic.name)
		LW.setMenuTab('forum')

		LW.pages.forum_topic.edit()
		LW.pages.forum_topic.remove()
		LW.pages.forum_topic.lock()
		LW.pages.forum_topic.pin()
		LW.pages.forum_topic.resolve()
		LW.pages.forum_topic.sendResponse()
		LW.pages.forum_topic.format()
		LW.pages.forum_topic.subscribe()
		LW.pages.forum_topic.vote()
	})
}

// Pour enlever le formattage du texte lors d'un paste
$('#forum_topic-page .text, #topic-title').on('paste',function(e) {
	e.preventDefault()
	var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..')
	document.execCommand('insertText', false, text)
})

LW.pages.forum_topic.resize = function() {

	$('#forum_topic-page code pre').css('max-width', $('#page').width() - 230)
}

LW.pages.forum_topic.edit = function() {

	$('#forum_topic-page .edit').click(function() {

		// On rend le message éditable
		var message = $(this).closest('.wrapper').find('.text')
		var original = $(this).closest('.wrapper').find('.original')
		original.height(message.height())
		message.hide()
		original.show().focus()

		// On rend le titre éditable si c'est le topic
		var id = $(this).closest('.message').attr('id')
		if (id == -1) {
			$('#topic-title').attr('contenteditable', 'true')
		}

		$(this).parent().hide()
		$(this).closest('.wrapper').find('.edit-buttons').show()
	})

	$('#forum_topic-page .cancel-edit').click(function() {
		$(this).parent().hide()
		$(this).closest('.wrapper').find('.edit-wrapper').show()

		$(this).closest('.wrapper').find('.text').show()
		$(this).closest('.wrapper').find('.original').hide()
	})

	$('#forum_topic-page .confirm-edit').click(function() {

		var elem = $(this)

		var original = $(this).closest('.wrapper').find('.original')
		var text = $(this).closest('.wrapper').find('.text')

		// Titre plus éditable
		$('#topic-title').removeAttr('contenteditable')

		// On cache le bouton valider
		$(this).parent().hide()
		$(this).closest('.wrapper').find('.edit-wrapper').show()

		// Id et message
		var id = $(this).closest('.message').attr('id')
		var message = original.val()

		// On cache le textarea
		text.show()
		original.hide()

		// Message classique
		if (id != -1) {

			_.post("forum/edit-message", {message_id: id, message: message}, function(data) {
				if (data.success) {
					_.reload()
				}
			})

		} else { // Topic lui-meme

			var title = $('#topic-title').text()

			_.post("forum/edit-topic", {topic_id: _topic.id, title: title, message: message}, function(data) {
				if (data.success) {
					text.html(data.html)
				}
			})
		}
	})
}

LW.pages.forum_topic.remove = function() {

	$('#forum_topic-page .delete').click(function(e) {

		var id = $(this).closest('.message').attr('id')

		if (id == -1) {

			var popup = new _.popup.new('forum_topic.delete_topic_popup', 500)

			popup.find('#delete-button').click(function() {

				_.post("forum/delete-topic", {topic_id: _topic.id}, function(data) {

					if (data.success) {
						popup.dismiss()
						LW.page("/forum/category-" + _category.id)
					}
				})
			})

			popup.show(e)

		} else {

			var popup = new _.popup.new('forum_topic.delete_popup', 500)

			popup.find('#delete-button').click(function() {

				_.post("forum/delete-message", {message_id: id}, function(data) {

					if (data.success) {
						_.reload()
					}
				})
			})

			popup.show(e)
		}
	})
}

LW.pages.forum_topic.lock = function() {

	if (_topic.locked) {
		$('#forum_topic-page .lock').text(_.lang.get('forum', 'unlock'))
	}

	$('#forum_topic-page .lock').click(function(e) {

		var service = _topic.locked ? 'forum/unlock-topic' : 'forum/lock-topic'

		_.post(service, {topic_id: _topic.id}, function(data) {
			if (data.success) {
				_.reload()
			}
		})
	})
}

LW.pages.forum_topic.pin = function() {

	if (_topic.pinned) {
		$('#forum_topic-page .pin').text(_.lang.get('forum', 'unpin'))
	}

	$('#forum_topic-page .pin').click(function(e) {

		var service = _topic.pinned ? 'forum/unpin-topic' : 'forum/pin-topic'

		_.post(service, {topic_id: _topic.id}, function(data) {
			if (data.success) {
				_.reload()
			}
		})
	})
}

LW.pages.forum_topic.resolve = function() {

	if (_topic.resolved) {
		$('#forum_topic-page .resolve').text(_.lang.get('forum', 'unsolved'))
	}

	$('#forum_topic-page .resolve').click(function(e) {

		var service = _topic.resolved ? 'forum/unresolve-topic' : 'forum/resolve-topic'

		_.post(service, {topic_id: _topic.id}, function(data) {
			if (data.success) {
				_.reload()
			}
		})
	})
}

LW.pages.forum_topic.sendResponse = function() {

	if ('forum/draft' in localStorage) {
		$('#response').val(localStorage['forum/draft'])
	}

	$('#response').keyup(function() {
		localStorage['forum/draft'] = $(this).val()
	})

	$('#send').click(function() {

		if (_messageSent) return null
		_messageSent = true

		_.post("forum/post-message", {

			topic_id: _topic.id,
			message: $('#response').val()

		}, function(data) {

			if (data.success) {
				_.reload()
				localStorage['forum/draft'] = ''
			}
		})
	})
}

LW.pages.forum_topic.format = function() {

	$('.message .text').each(function() {
		LW.smileyElem(this)
		// linkifyElem(this)
	})

	$('.message code').each(function() {
		var content = $(this).text();
		$(this).html("<pre>" + content + "</pre>");
		LW.util.createCodeArea(content, $(this).find('pre')[0]);
	})

	LW.pages.forum_topic.resize()
}

LW.pages.forum_topic.subscribe = function() {

	if (_topic.subscribed) {
		$('#subscribe').hide()
		$('#unsubscribe').show()
	}

	$('#subscribe').click(function() {

		_.post('forum/subscribe-topic', {topic_id: _topic.id})
		$('#subscribe').hide()
		$('#unsubscribe').show()
	})

	$('#unsubscribe').click(function() {

		_.post('forum/unsubscribe-topic', {topic_id: _topic.id})
		$('#subscribe').show()
		$('#unsubscribe').hide()
	})
}

LW.pages.forum_topic.vote = function() {

	var voteMessage = function(messageID, topicID, vote) {

		var method = ['vote-message-down', 'remove-message-vote', 'vote-message-up'][vote + 1]

		_.post('forum/' + method, {topic_id: _topic.id, message_id: parseInt(messageID)}, function(data) {

			if (data.success) {
				var message = $('.message[id=' + messageID + ']')
				message.find('.vote.up').find('.counter').text(data.up_votes)
				message.find('.vote.down').find('.counter').text(data.down_votes)
				message.find('.vote.down').toggleClass('active', data.down_votes > 0)
				message.find('.vote.up').toggleClass('active', data.up_votes > 0)
				message.find('.votes').addClass('active')
			}
		})
	}

	var getVotesNames = function(messageID, topicID, vote, callback) {

		var method = ['get-message-down-votes-names', 'get-message-up-votes-names'][(vote + 1) / 2]

		_.post('forum/' + method, {topic_id: _topic.id, message_id: parseInt(messageID)}, function(data) {
			callback(data)
		})
	}

	$('#forum_topic-page .vote.up').click(function() {

		var messageID = $(this).closest('.message').attr('id')

		if ($(this).hasClass('active')) {
			voteMessage(messageID, _topic.id, 0)
		} else {
			voteMessage(messageID, _topic.id, 1)
		}
	})

	$('#forum_topic-page .vote.down').click(function() {

		var messageID = $(this).closest('.message').attr('id')

		if ($(this).hasClass('active')) {
			voteMessage(messageID, _topic.id, 0)
		} else {
			voteMessage(messageID, _topic.id, -1)
		}
	})

	$('#forum_topic-page .vote.up').mouseenter(function() {

		_.log("vote.up mouseenter")

		if (parseInt($(this).find('.counter').text()) == 0 || $(this).hasClass('loaded')) return

		var messageID = $(this).closest('.message').attr('id')
		var button = this

		getVotesNames(messageID, _topic.id, 1, function(data) {

			if (data.success) {

				var names = []
				for (var f in data.farmers) names.push(data.farmers[f][1])
				$('#tt_votes_up_names_' + messageID).find('.content').html(names.join('<br>'))
				LW.resizeTooltip('#tt_votes_up_names_' + messageID, button)
				$(button).addClass('loaded')
			}
		})
	})

	$('#forum_topic-page .vote.down').mouseenter(function() {

		if (parseInt($(this).find('.counter').text()) == 0 || $(this).hasClass('loaded')) return

		var messageID = $(this).closest('.message').attr('id')
		var button = this

		getVotesNames(messageID, _topic.id, -1, function(data) {

			if (data.success) {

				var names = []
				for (var f in data.farmers) names.push(data.farmers[f][1])
				$('#tt_votes_down_names_' + messageID).find('.content').html(names.join('<br>'))
				LW.resizeTooltip('#tt_votes_down_names_' + messageID, button)
				$(button).addClass('loaded')
			}
		})
	})
}
