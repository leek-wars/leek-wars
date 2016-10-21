var _farmer = null
var _myFarmer = false

LW.pages.farmer.init = function(params, $scope, $page) {

	var id = params.id
	var farmer = null

	if (LW.connected && id == LW.farmer.id) {

		init(LW.farmer, $scope, $page)

	} else {

		_.get('farmer/get/' + id, function(data) {
			if (data.success) {
				init(data.farmer, $scope, $page)
			} else {
				LW.error('Unknown farmer!')
				return
			}
		})
	}
}

function init(farmer, $scope, $page) {

	if (farmer.banned) {

		LW.error(_.lang.get('farmer', 'banned'), _.lang.get('farmer', 'banned_message'))
		return
	}

	if (farmer.deleted) {

		LW.error(_.lang.get('farmer', 'deleted'), _.lang.get('farmer', 'deleted_message'))
		return
	}

	_farmer = farmer
	_myFarmer = LW.connected && farmer.id == LW.farmer.id

	for (var t in farmer.tournaments) {
		farmer.tournaments[t].name = _.lang.get('farmer', 'tournament_of',
			_.format.date(farmer.tournaments[t].date))
	}

	farmer.talent_gains = Math.round(farmer.talent_more / 3)

	$scope.farmer = farmer
	$scope.my_farmer = _myFarmer
	if (farmer.godfather != null) {
		$scope.godfather = _.lang.get('farmer', 'godson_of', "<a href='/farmer/" + farmer.godfather.id + "'>" + _.protect(farmer.godfather.name) + "</a>")
	}
	if (farmer.godsons.length > 0) {
		$scope.godsons = _.lang.get('farmer', 'godfather_of',
			farmer.godsons.map(function(f) {
				return "<a href='/farmer/" + f.id + "'>" + _.protect(f.name) + "</a>"
			}).join(', '))
	}
	$page.render()

	$('#leeks .leek').each(function() {
		var id = $(this).attr('id')
		var leek = farmer.leeks[id]
		var elem = this
		LW.createLeekImage(1, leek.level, leek.skin, leek.hat, function(data) {
			$(elem).find('.image').html(data)
		})
	})

	LW.setTitle(farmer.name)

	LW.pages.farmer.trophies()

	if (_myFarmer) {

		LW.pages.farmer.country()
		LW.pages.farmer.createTeam()
		LW.pages.farmer.cancelCandidacy()
		LW.pages.farmer.tournament()
		LW.pages.farmer.godfather()
		LW.pages.farmer.avatar()
		LW.pages.farmer.logout()
		LW.pages.farmer.warnings()

	} else {

		LW.pages.farmer.challenge()
		LW.pages.farmer.report()

		if (LW.farmer.moderator) {
			LW.pages.farmer.warnings()
		}
	}
}

LW.pages.farmer.trophies = function() {

	if (!('farmer/trophies-mode' in localStorage)) {
		localStorage['farmer/trophies-mode'] = 'list'
	}

	var updateTrophies = function() {

		if (localStorage['farmer/trophies-mode'] === 'grid') {
			$('#trophies').removeClass('list').addClass('grid')
			$('#trophies-mode-button').attr('src', LW.staticURL + 'image/list.png')
		} else {
			$('#trophies').removeClass('grid').addClass('list')
			$('#trophies-mode-button').attr('src', LW.staticURL + 'image/grid.png')
		}
	}

	$('#trophies-mode-button').click(function() {
		if (localStorage['farmer/trophies-mode'] === 'list') {
			localStorage['farmer/trophies-mode'] = 'grid'
		} else {
			localStorage['farmer/trophies-mode'] = 'list'
		}
		updateTrophies()
	})

	_.get('trophy/get-farmer-trophies/' + _farmer.id + '/' + _.lang.current + '/' + LW.token(), function(data) {

		var list = []
		var bonus = []
		for (var t in data.trophies) {
			if (data.trophies[t] != null && data.trophies[t].unlocked) {
				if (data.trophies[t].category == 6) {
					bonus.push(data.trophies[t])
					data.trophies[t] = null
				} else {
					list.push(data.trophies[t])
				}
			} else {
				data.trophies[t] = null
			}
		}
		list.sort(function(t1, t2) {
			return t1.date - t2.date
		})

		$('#trophies').html(_.view.render('farmer.trophies', {
			list: list,
			grid: data.trophies,
			count: data.count,
			bonus_trophies: bonus,
			my_farmer: _myFarmer,
			total: data.total
		}))
		LW.handleHTML('#trophies', 'page')

		$('#trophy-count').text(data.count)

		updateTrophies()
	})
}

LW.pages.farmer.createTeam = function() {

	var createPopup = new _.popup.new('farmer.create_team_popup', 500)

	createPopup.find('#create-team').click(function(e) {

		_.post('team/create', {team_name: $('#team-name').val()}, function(data) {
			if (data.success) {
				_.toast(_.lang.get('farmer', 'team_created'), _.reload)
				createPopup.dismiss()
			} else {
				_.toast(data)
			}
		})
	})

	$('#create-team-button').click(function(e) {
		createPopup.show(e)
	})
}

LW.pages.farmer.cancelCandidacy = function() {

	$('#cancel-candidacy').click(function() {

		_.post('team/cancel-candidacy', {}, function(data) {

			if (data.success) {
				_.toast(_.lang.get('farmer', 'candidacy_canceled'))
				$('#cancel-candidacy-wrapper').hide()
			} else {
				_.toast(data.error)
			}
		})
	})
}

LW.pages.farmer.tournament = function() {

	if (_farmer.tournament && _farmer.tournament.registered) {
		$('#register-tournament').hide()
		$('#unregister-tournament').show()
	}

	$('#register-tournament').click(function() {

		_.post('farmer/register-tournament')

		$('#unregister-tournament').show()
		$(this).hide()
	})

	$('#unregister-tournament').click(function() {

		_.post('farmer/unregister-tournament')

		$('#register-tournament').show()
		$(this).hide()
	})
}

LW.pages.farmer.country = function() {

	_.get('country/get-all', function(data) {
		if (data.success) {

			var countryPopup = new _.popup.new('farmer.country_popup', data, 850)

			$('#country.my-farmer').click(function(e) {
				countryPopup.show(e)
			})

			countryPopup.find('.country').click(function() {

				var code = $(this).attr('code')
				_.post('farmer/change-country', {country_code: code}, function(data) {
					if (data.success) {

						LW.farmer.country = code
						$('#country .country').text(code == 'null' ? _.lang.get('farmer', 'no_country') : _.lang.get('country', code))
						$('#country .flag').attr('src', LW.staticURL + 'image/flag/32/' + (code == 'null' ? '_' : code) + '.png')
						countryPopup.dismiss()
					}
				})
			})
		}
	})
}

LW.pages.farmer.avatar = function() {

	$('#avatar').click(function() {
		$('#avatar-input input').click()
	})

	$('#avatar-input input').change(function() {

		var file = $(this)[0].files[0]

		if (!_.upload.check(file)) return null

		_.upload.fileToImage(file, "#avatar")

		var formdata = new FormData()
		formdata.append('avatar', file)

		_.toast(_.lang.get('farmer', 'uploading_avatar'))

		_.post('farmer/set-avatar', formdata, function(data) {

			if (data.success) {
				_.toast(_.lang.get('farmer', 'upload_success'))
				$('#avatar').attr('src', $('#avatar').attr('src'))
				window.location.reload()
			} else {
				_.toast(_.lang.get('farmer', 'upload_failed', data.error))
			}
		})
	})
}

LW.pages.farmer.report = function() {

	var reportPopup = new _.popup.new('farmer_report_popup')

	$('#report-button').click(function(e) {
		reportPopup.show(e)
	})
}

LW.pages.farmer.godfather = function() {

	var godfatherPopup = new _.popup.new("farmer.godfather_popup", {name: _farmer.name})

	$('#godfather-link').click(function(e) {

		godfatherPopup.show(e)
		_.selectText(godfatherPopup.find('#godfather-url')[0])
	})
}

LW.pages.farmer.challenge = function() {
/*
	$('#challenge').click(function() {

		_.post('garden/start-farmer-challenge', {
			target_id: _farmer.id
		}, function(data) {
			if (data.success) {
				LW.page('/fight/' + data.fight)
			}
		})
	})
*/
}

LW.pages.farmer.report = function() {

	$('#report-button').click(function(e) {

		LW.createReportPopup({
			title: _.lang.get('moderation', 'report_farmer', _farmer.name),
			message: _.lang.get('moderation', 'report_farmer_for_reason', _farmer.name),
			target: _farmer.id,
			reasons: [
				LW.WARNING.INCORRECT_FARMER_NAME,
				LW.WARNING.INCORRECT_TEAM_NAME,
				LW.WARNING.INCORRECT_AI_NAME,
				LW.WARNING.INCORRECT_AVATAR,
				LW.WARNING.INCORRECT_EMBLEM,
				LW.WARNING.CHEAT,
				LW.WARNING.FLOOD_CHAT,
				LW.WARNING.FLOOD_FORUM,
				LW.WARNING.RUDE_FORUM,
				LW.WARNING.RUDE_CHAT
			]
		}).show(e)
	})
}

LW.pages.farmer.logout = function() {
	$('#logout').click(function() {
		LW.disconnect()
		LW.page('/')
	})
}

LW.pages.farmer.warnings = function() {
	_.get('moderation/get-warnings/' + this.scope.farmer.id + '/' + LW.token(), function(data) {
		if (data.success) {
			if (data.warnings.length) {
				$('#farmer-warnings').html(_.view.render('farmer.warnings', data))
			}
		}
	})
}
