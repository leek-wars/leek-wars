var _team = null
var _member = false
var _captain = false
var _owner = false
var _candidacySent = false

var _draggedLeek = null
var _oldCompo = null

LW.pages.team.init = function(params, $scope, $page) {

	var id = 'id' in params ? params.id : (LW.connected && LW.farmer.team != null ? LW.farmer.team.id : null)

	if (id == null) {
		page('/')
		return
	}

	var request = 'team/get/' + id
	if (LW.connected) {
		if (LW.farmer.team != null && LW.farmer.team.id == id) {
			request = 'team/get-private/' + id + '/' + LW.token()
		} else {
			request = 'team/get-connected/' + id + '/' + LW.token()
		}
	}

	_.get(request, function(data) {

		if (!data.success) {

			LW.error('Pas de team', 'Team introuvable !')
			return null
		}

		var team = data.team
		$page.team = team
		_team = team

		_team.membersById = []
		for (var m in _team.members) _team.membersById[_team.members[m].id] = _team.members[m]

		var teamMember = LW.connected && LW.farmer.team != null && team.id == LW.farmer.team.id
		var teamCaptain = teamMember && ['captain', 'owner'].indexOf(team.membersById[LW.farmer.id].grade) != -1
		_member = teamMember
		_captain = teamCaptain
		_owner = teamMember && _team.membersById[LW.farmer.id].grade == 'owner'

		var xpBarWidth = team.level == 100 ? 100 :
			Math.floor(100 * (team.xp - team.down_xp) / (team.up_xp - team.down_xp))

		var leeks = []
		if (_member) {
			for (var c in team.compositions)
				for (var l in team.compositions[c].leeks)
					leeks[team.compositions[c].leeks[l].id] = team.compositions[c].leeks[l]
			for (var l in team.unengaged_leeks)
				leeks[team.unengaged_leeks[l].id] = team.unengaged_leeks[l]
		} else {
			for (var l in team.leeks) leeks[team.leeks[l].id] = team.leeks[l]
		}

		for (var t in team.tournaments) {
			team.tournaments[t].name = _.lang.get('team', 'tournament_of',
				_.format.date(team.tournaments[t].date))
		}

		$scope.team = team
		$scope.team_member = teamMember
		$scope.team_captain = teamCaptain
		$scope.team_owner = _owner
		$scope.max_level = team.level == 100
		$scope.xp_bar_width = xpBarWidth
		$scope.xp_bar_class = team.level == 100 ? 'blue' : ''
		$scope.recrutement_switch = {
			id: "opened-switch",
			checked: team.opened,
			theme: 'dark'
		}
		$page.render()

		LW.setTitle(team.name)
		LW.setMenuTab('team')

		LW.pages.team.leekImages(leeks)
		LW.pages.team.candidacies()
		LW.pages.team.emblem()
		LW.pages.team.description()
		LW.pages.team.recrutement()
		LW.pages.team.adminMembers()
		LW.pages.team.setupChat()
		LW.pages.team.createComposition()
		LW.pages.team.quitTeam()
		LW.pages.team.dissolveTeam()
		LW.pages.team.manageMembers()
		LW.pages.team.manageCompositions()
		LW.pages.team.deleteComposition()
		LW.pages.team.tournaments()
		LW.pages.team.changeOwner()
		LW.pages.team.report()
	})
}

LW.pages.team.emblem = function() {

	$('#emblem').click(function() {
		$('#emblem-input input').click()
	})

	$('#emblem-input input').change(function() {

		var file = $(this)[0].files[0]

		if (!_.upload.check(file)) return null

		_.upload.fileToImage(file, "#emblem")

		var formdata = new FormData()
		formdata.append('team_id', _team.id)
		formdata.append('emblem', file)

		_.toast(_.lang.get('team', 'uploading_emblem'))

		_.post('team/set-emblem', formdata, function(data) {

			if (data.success) {
				_.toast(_.lang.get('team', 'upload_success'))
				$('#emblem').attr('src', $('#emblem').attr('src'))
			} else {
				_.toast(_.lang.get('team', 'upload_failed', data.error))
			}
		})
	})
}

LW.pages.team.description = function() {

	if ($('#team-status').text() === "") {
		$('#team-status').addClass('empty')
		$('#team-status').text(_.lang.get('team', 'no_description'))
	}

	if (_member) {

		$('#team-status').click(function() {
			if ($(this).hasClass('empty')) {
				$('#team-status').text("");
				$('#team-status').removeClass('empty');
			}
		})

		var saveStatus = function() {

			_.post('team/change-description', {team_id: _team.id, description: $('#team-status').text()})

			if ($.trim($('#team-status').text()) === "") {
				$('#team-status').addClass('empty')
				$('#team-status').text(_.lang.get('team', 'no_description'))
			}
		}

		$('#team-status').keydown(function(e) {
			if (e.keyCode == 13) {
				$('#team-status').blur()
				e.preventDefault()
			}
		})

		$('#team-status').focusout(saveStatus)
	}
}

LW.pages.team.recrutement = function() {

	if (_member && _owner) {
		var setOpened = function(opened) {

			_team.opened = opened
			$('#opened-switch').prop('checked', opened)

			_.post('team/set-opened', {opened: opened})
		}

		$('#opened-button').click(function(e) {
			if (!_team.opened) {
				setOpened(true)
			} else {
				setOpened(false)
			}
		})
	}
}

LW.pages.team.candidacies = function() {

	if (_captain) {

		$('#candidacies .accept').click(function(e) {
			var candidacy = $(this).attr('candidacy')
			_.post('team/accept-candidacy', {candidacy_id: candidacy}, function(data) {
				if (data.success) {
					_.toast(_.lang.get('team', 'farmer_accepted'), _.reload)
				} else {
					_.toast(data.error)
				}
			})
		})

		$('#candidacies .reject').click(function(e) {
			var candidacy = $(this).attr('candidacy');

			_.post('team/reject-candidacy', {candidacy_id: candidacy}, function(data) {
				if (data.success) {
					_.toast(_.lang.get('team', 'farmer_refused'), _.reload)
				} else {
					_.toast(data.error)
				}
			})
		})
	}

	if (!_member && LW.connected && LW.farmer.team == null) {

		if (_team.candidacy) {
			$('#send-candidacy').hide()
		} else {
			$('#cancel-candidacy').hide()
		}

		// Envoi candidature
		$('#send-candidacy').click(function() {

			_.post('team/send-candidacy', {team_id: _team.id}, function(data) {
				if (data.success) {
					_.toast(_.lang.get('team', 'candidacy_sent'))
					$('#send-candidacy').hide()
					$('#cancel-candidacy').show()
				} else {
					_.toast(data.error)
				}
			})
		})

		// Annulation candidature
		$('#cancel-candidacy').click(function() {
			_.post('team/cancel-candidacy-for-team', {team_id: _team.id}, function(data) {
				if (data.success) {
					_.toast(_.lang.get('team', 'candidacy_cancelled'))
					$('#cancel-candidacy').hide()
					$('#send-candidacy').show()
				} else {
					_.toast(data.error)
				}
			})
		})

	} else {

		$('#send-candidacy').hide()
		$('#cancel-candidacy').hide()
	}
}

LW.pages.team.createComposition = function() {

	var popup = new _.popup.new('team.create_compo_popup', 500)

	var createCompo = function() {

		var name = $('#compo-name').val()

		_.post('team/create-composition', {composition_name: name}, function(data) {
			if (data.success) {
				_.reload()
			} else {
				_.toast(data.error)
			}
		})
	}

	popup.find("#compo-name").keyup(function(e) {
		if (e.keyCode == 13) {
			createCompo()
		}
	})

	popup.find('#create-compo').click(createCompo)

	$('#create-compo-button').click(function(e) {
		popup.show(e)
	})

	$('.no-compos').toggle($('#team-page .compo').length == 0)
}

LW.pages.team.leekImages = function(leeks) {

	$('#team-page .leek').each(function() {

		var id = parseInt($(this).attr('leek'))
		var image = $(this).find('.image')
		var leek = leeks[id]
		LW.createLeekImage(id, 0.6, leek.level, leek.skin, leek.hat, function(id, data) {
			image.html(data)
		})
	})
}

LW.pages.team.adminMembers = function() {

	var changeOwnerPopup = new _.popup.new('team.change_owner_popup')
	var newOwner = null

	$('.level').change(function(e) {

		var grade = $(this).val()

		if (grade == 'captain' || grade == 'member') {

			_.post('team/change-member-grade', {member_id: $(this).attr('member'), new_grade: grade}, function(data) {
				if (data.success) {
					_.reload()
				} else {
					_.toast(data.error)
				}
			})

		} else if (grade == 'owner') {

			var name = $(this).attr('farmer')
			newOwner = $(this).attr('member')

			setTimeout(function() {
				changeOwnerPopup.find('.change-owner-farmer').text(name)
				changeOwnerPopup.show(e)
			})
		}
	})

	changeOwnerPopup.find('#change-owner').click(function() {

		_.post('team/change-owner', {team_id: _team.id, new_owner: newOwner}, function(data) {
			_.reload()
		})
	})
}

LW.pages.team.setupChat = function() {

	var chatExpanded = 'team/chat-expanded' in localStorage ?
		localStorage['team/chat-expanded'] === 'true' : true

	var change = function(expand) {
		if (expand) {
			$('#team-chat .expand img').attr('src', LW.staticURL + 'image/icon/collapse.png')
			$('#team-chat > .content').show()
		} else {
			$('#team-chat .expand img').attr('src', LW.staticURL + 'image/icon/expand.png')
			$('#team-chat > .content').hide()
		}
		chatExpanded = expand
		localStorage['team/chat-expanded'] = expand
	}

	if (!chatExpanded) change(false)

	$('#team-chat .expand').click(function() {
		change(!chatExpanded)
	})

	this.chat = new ChatController($('#team-chat .content'), false, true)
}

LW.pages.team.wsreceive = function(data) {

	if (!_member || !this.chat) return null

	if (data.type == TEAM_CHAT_RECEIVE) {
		var data = data.data
		var message = {
			lang: '_',
			farmer_id: data[0],
			farmer_name: data[1],
			content: data[2],
			date: data[3],
			farmer_color: data[4],
			avatar_changed: data[5]
		}
		this.chat.receive_message(message)
	}
}

LW.pages.team.manageMembers = function() {

	$('.farmer .ban').click(function(e) {

		var member = $(this).attr('member')
		var name = $(this).attr('name')

		var banPopup = new _.popup.new('team.ban_popup', {name: name}, 500)
		banPopup.show(e)

		banPopup.find('.ban').click(function() {
			_.post('team/ban', {farmer_id: member},	function(data) {
				if (data.success) {
					_.toast(_.lang.get('team', 'farmer_banned'), _.reload)
				} else {
					_.toast(data.error)
				}
			})
			banPopup.dismiss()
		})
	})
}

LW.pages.team.manageCompositions = function() {

	function moveLeek(leek, oldCompo, newCompo) {

		if (oldCompo != newCompo) {

			if ($('#team-page .compo[compo=' + newCompo + ']').hasClass('in-tournament')) return null
			if (newCompo != -1 && $('#team-page .compo[compo=' + newCompo + '] .leeks .leek').length >= 6) return null

			_.post('team/move-leek', {leek_id: leek, to: newCompo}, function(data) {

				if (data.success) {

					var leekElem = $('#team-page .leek[leek=' + leek + ']').parent()

					$('#team-page .compo[compo=' + newCompo + '] .leeks').append(leekElem)

					leekElem.find('.leek').addClass('moving')
					setTimeout(function() {
						leekElem.find('.leek').removeClass('moving')
					})

					// Empty elements
					$('#team-page .compo[compo=' + newCompo + '] .leeks .empty').hide()
					var oldCompoElem = $('.compo[compo=' + oldCompo + '] .leeks')

					if (oldCompoElem.find('.leek').length == 0) {
						oldCompoElem.find('.empty').show()
					}
				} else {
					_.toast(data.error)
				}
			})
		}
	}

	$('#team-page .compo .leeks').on({

		dragstart: function(e) {

			var leek = $(e.target).find('.image').parent()

			if (leek.closest('.compo').hasClass('in-tournament')) return false

			e.originalEvent.dataTransfer.setData('text/plain', 'drag !!!');

			$('#team-page .compo:not(.in-tournament) .leeks').addClass('dashed')

			_draggedLeek = leek.attr('leek')
			_oldCompo = leek.closest('.compo').attr('compo')

			leek.addClass('dragging');
			return true
		},
		dragend: function(e) {

			var leek = $(e.target).children('.leek')

			leek.removeClass('dragging');
			$('#team-page .compo .leeks').removeClass('dashed');

			e.preventDefault()
			return false
		}
	})

	$('#team-page .compo .leeks').on({

		drop: function(e) {

			$(this).removeClass('dashed')
			moveLeek(_draggedLeek, _oldCompo, $(this).closest('.compo').attr('compo'))
			_draggedLeek = -1
			e.preventDefault()
			return false
		},
		dragover: function(e) {
			e.preventDefault()
			e.stopPropagation();
			return false
		}
	})

	$('.compo').each(function() {
		$(this).find('.empty').toggle($(this).find('.leek').length == 0)
	})
}

LW.pages.team.tournaments = function() {

	$('.compo').each(function() {

		var compo = $(this)
		var compoID = $(this).attr('compo')

		if ($(this).hasClass('in-tournament')) {
			$(this).find('.register-tournament').hide()
			$(this).find('.unregister-tournament').show()
		}

		$(this).find('.register-tournament').click(function() {

			if ($(this).closest('.compo').find('.leeks .leek').length < 4) {
				_.toast(_.lang.get('team', 'compo_must_contain_4_leeks'))
				return
			}

			_.post('team/register-tournament', {composition_id: compoID})

			$(this).hide()
			compo.find('.unregister-tournament').show()

			compo.addClass('in-tournament')
		});

		$(this).find('.unregister-tournament').click(function() {

			_.post('team/unregister-tournament', {composition_id: compoID})

			$(this).hide()
			compo.find('.register-tournament').show()

			compo.removeClass('in-tournament')
		})
	})
}

LW.pages.team.deleteComposition = function() {

	$('.delete-compo').click(function() {

		var compo = $(this).attr('compo')

		_.post('team/delete-composition', {composition_id: compo}, function(data) {

			if (data.success) {

				_.toast(_.lang.get('team', 'compo_deleted', $('.compo-title[compo=' + compo + ']').text()))

				// On transfère tous les leeks dans les leeks non engagés
				$('.compo[compo=' + compo + '] .leeks .leek').appendTo($('.compo[compo=-1] .leeks'));
				$('.compo[compo=-1] .leeks .empty').hide();

				$('[compo=' + compo + ']').remove();

				if ($('.compo').length == 1) { // il reste plus que la compo des non engagés
					$('.no-compos').show()
				}
			} else {
				_.toast(data.error)
			}
		})
	})
}

LW.pages.team.quitTeam = function() {

	var quitPopup = new _.popup.new('team.quit_team_popup', {team: _team}, 500)

	quitPopup.find('#quit-team').click(function() {

		_.post('team/quit', {}, function(data) {
			if (data.success) {
				_.toast(_.lang.get('team', 'you_left_team'), _.reload)
			} else {
				_.toast(data)
			}
			quitPopup.dismiss()
		})
	})

	$('#quit-team-button').click(function(e) {

		if (_owner) {
			_.toast(_.lang.get('team', 'cant_quit_owner'))
		} else {
			quitPopup.show(e)
		}
	})
}

LW.pages.team.dissolveTeam = function() {

	var dissolvePopup = new _.popup.new('team.dissolve_popup', {}, 500)

	dissolvePopup.find('#dissolve-team').click(function() {

		_.post('team/dissolve', {}, function(data) {

			if (data.success == true) {
				_.toast(_.lang.get('team', 'team_have_been_disolved'), function() {
					LW.page('/farmer/' + LW.farmer.id)
				})
			} else {
				_.toast(_.lang.get('team', data.error))
			}
			dissolvePopup.dismiss()
		})
	})

	$('#dissolve-team-button').click(function(e) {

		dissolvePopup.show(e)
	})
}

LW.pages.team.changeOwner = function() {

	var team = this.scope.team

	var changePopup = new _.popup.new('team.change_owner_popup', {members: team.members}, 800)

	changePopup.find('.farmer').click(function() {

		changePopup.find('.farmer').removeClass('selected')
		$(this).addClass('selected')
	})

	changePopup.find('#change-owner').click(function(e) {

		var new_owner = team.membersById[changePopup.find('.farmer.selected').attr('farmer-id')]

		if (new_owner.grade == 'owner') return ;

		var changeConfirmPopup = new _.popup.new('team.change_owner_confirm_popup', {new_owner: new_owner}, 600)

		changeConfirmPopup.find('#change-owner-confirm').click(function() {

			var password = changeConfirmPopup.find('#change-owner-password').val()

			_.post('team/change-owner', {new_owner: new_owner.id, password: password}, function(data) {

				if (data.success == true) {
					_.toast(_.lang.get('team', 'owner_has_been_changed'), _.reload)
					changeConfirmPopup.dismiss()
				} else {
					_.toast(data.error)
				}
			})
		})

		changePopup.dismiss()
		changeConfirmPopup.show(e)
	})

	$('#change-owner-button').click(function(e) {
		changePopup.show(e)
	})
}

LW.pages.team.report = function() {
	var self = this
	$('#report-button').click(function(e) {
		LW.createReportPopup({
			title: _.lang.get('moderation', 'report_farmer', self.team.name),
			message: _.lang.get('moderation', 'report_farmer_for_reason', self.team.name),
			target: self.team.emblem_author,
			reasons: [
				LW.WARNING.INCORRECT_EMBLEM
			]
		}).show(e)
	})
}
