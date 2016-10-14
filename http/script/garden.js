LW.pages.garden.init = function(params, $scope, $page) {

	var challenge = 'challenge' in params

	this.br_last_leeks = []

	if (challenge) {

		var challenge_type = params.type
		var challengeTarget = 'challenge_target' in params ? params.challenge_target : null

		if (challenge_type == 'leek') {

			_.get('garden/get-solo-challenge/' + challengeTarget + '/' + LW.token(), function(data) {

				$scope.challenge = true
				$scope.garden = null
				$scope.challenge_type = 'leek'
				$scope.target = data.leek
				$scope.challenge_fights = data.challenges

				$page.render()

				var leeks = []
				for (var l in LW.farmer.leeks) leeks[LW.farmer.leeks[l].id] = LW.farmer.leeks[l]
				leeks[data.leek.id] = data.leek

				$scope.my_leek = $('.myleek').first().attr('leek')
				$('#garden-page .myleek').first().addClass('selected')
				$('#solo-leek').text($('.myleek[leek=' + $scope.my_leek + ']').attr('name'))

				$('.myleek').click(function() {
					var index = $(this).index();
					$('.enemies').hide();
					$($('.enemies')[index]).show();

					$('.myleek').removeClass('selected');
					$(this).addClass('selected');
					$scope.my_leek = $(this).attr('leek');
					$('#solo-leek').text($(this).attr('name'));
				});

				$(".leek.enemy").click(function() {

					_.post('garden/start-solo-challenge', {
						leek_id: $scope.my_leek,
						target_id: $(this).attr('leek')
					}, function(data) {

						if (data.success) {
							LW.page('/fight/' + data.fight)
						}
					})
				})
			})
		} else {

			_.get('garden/get-farmer-challenge/' + challengeTarget + '/' + LW.token(), function(data) {

				$scope.challenge = true
				$scope.garden = null
				$scope.target = data.farmer
				$scope.challenge_type = 'farmer'
				$scope.challenge_fights = data.challenges
				$page.render()

				$(".farmer.enemy").click(function() {

					_.post('garden/start-farmer-challenge', {
						target_id: $(this).attr('farmer')
					}, function(data) {
						if (data.success) {
							LW.page('/fight/' + data.fight)
						}
					})
				})
			})
		}
		return
	}

	_.get('garden/get/' + LW.token(), function(data) {

		$scope.challenge = false
		$scope.garden = data.garden
		$scope.garden.farmer = LW.farmer

		$page.render()

		LW.setTitle(_.lang.get('garden', 'title'))
		LW.setMenuTab('garden')

		// Restore
		$scope.category = 'garden/category' in localStorage ? localStorage["garden/category"] : 'solo'
		$scope.my_leek = 'garden/leek' in localStorage ? localStorage["garden/leek"] : _.first(LW.farmer.leeks).id
		$scope.my_compo = 'garden/compo' in localStorage ? localStorage["garden/compo"] : (
			_.isEmptyObj(data.garden.my_compositions) ? 0 : _.first(data.garden.my_compositions).id)

		if ($('.myleek[leek=' + $scope.my_leek + ']').length == 0) {
			$scope.my_leek = $('.myleek').first().attr('leek')
		}
		if ($('.compo[compo=' + $scope.my_compo + ']').length == 0) {
			$scope.my_compo = $('.compo').first().attr('compo')
		}

		// Tabs
		$('#tab-solo').click(function() {
			$page.select_category('solo')
		})
		$('#tab-farmer.enabled').click(function() {
			$page.select_category('farmer')
		})
		$('#tab-team.enabled').click(function() {
			$page.select_category('team')
		})
		$('#tab-battle-royale.enabled').click(function() {
			$page.select_category('battle-royale')
		})
		$('#garden-left .enabled .tooltip').remove()

		// Solo
		$('#garden-page #garden-solo .myleek').click(function() {
			$page.select_leek($(this).attr('leek'))
		})
		// BR
		$('#garden-battle-royale .myleek:not(.disabled)').click(function() {
			$page.select_leek($(this).attr('leek'))
		})
		$('#garden-battle-royale #br-select-button').click(function(e) {
			LW.pages.garden.battle_royale_select(e)
		})
		$('#garden-battle-royale #br-return').click(function() {
			LW.pages.garden.battle_royale()
		})

		for (var l in LW.farmer.leeks) {
			$page.leek_image(LW.farmer.leeks[l])
		}

		// Team
		$('.compo').click(function() {
			$page.select_composition($(this).attr('compo'))
		})

		$page.select_category($scope.category)
	})
}

LW.pages.garden.select_category = function(category) {

	_category = category
	localStorage["garden/category"] = _category

	$('.tab').removeClass('active')
	$('#tab-' + category).addClass('active')

	$('#garden-solo').hide()
	$('#garden-farmer').hide()
	$('#garden-team').hide()
	$('#garden-battle-royale').hide()
	$('#garden-' + _category).show()

	if (category == 'solo') {
		LW.pages.garden.select_leek(this.scope.my_leek)
	}
	if (category == 'farmer') {
		LW.pages.garden.select_farmer()
	}
	if (category == 'team') {
		LW.pages.garden.select_composition(this.scope.my_compo)
	}
	if (category == 'battle-royale') {
		LW.pages.garden.battle_royale()
	}
}

LW.pages.garden.select_leek = function(leek_id) {

	var index = $(this).index()
	$('#garden-solo .enemies').hide()
	$('#garden-solo .enemies[of=' + leek_id + ']').show()

	var element = $('.myleek[leek=' + leek_id + ']')

	$('.myleek').removeClass('selected')
	element.addClass('selected')

	this.scope.my_leek = leek_id
	localStorage["garden/leek"] = leek_id
	$('#solo-leek').text(element.attr('name'))

	$('#garden-solo .enemies[of=' + leek_id + '] .no-more-fights').hide()
	if (this.scope.garden.solo_fights[leek_id] == 0) {
		$('#garden-solo .enemies[of=' + leek_id + '] .no-more-fights').show()
		return null
	}

	if (element.attr('loaded')) return null
	element.attr('loaded', true)

	_.get('garden/get-leek-opponents/' + leek_id + '/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-solo .enemies[of=' + leek_id + '] .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-solo .enemies[of=' + leek_id + '] .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += _.view.render('garden.leek', {leek: data.opponents[o]})
			}
			$('#garden-solo .enemies[of=' + leek_id + '] .opponents').show().html(html)

			$('#garden-solo .enemies[of=' + leek_id + '] .opponents .leek').click(function() {
				_.post('garden/start-solo-fight', {
					leek_id: leek_id,
					target_id: $(this).attr('leek')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
					}
				})
			})
			for (var o in data.opponents) {
				LW.pages.garden.leek_image(data.opponents[o])
			}
		} else {
			_.toast(data.error)
		}
	})
}

LW.pages.garden.select_farmer = function() {

	$('#garden-farmer .no-more-fights').hide()
	if (this.scope.garden.farmer_fights == 0) {
		$('#garden-farmer .no-more-fights').show()
		return null
	}

	if ($('#garden-farmer').attr('loaded')) return null
	$('#garden-farmer').attr('loaded', true)

	_.get('garden/get-farmer-opponents/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-farmer .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-farmer .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += _.view.render('garden.farmer', data.opponents[o])
			}

			$('#garden-farmer .enemies .opponents').show().html(html)

			$('#garden-farmer .enemies .farmer').click(function() {
				_.post('garden/start-farmer-fight', {
					target_id: $(this).attr('id')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
					}
				})
			})
		} else {
			_.toast(data.error)
		}
	})
}

LW.pages.garden.select_composition = function(compo_id) {

	var index = $(this).index()
	$('#garden-team .enemies').hide()
	$('#garden-team .enemies[of=' + compo_id + ']').show()

	var element = $('.compo[compo=' + compo_id + ']')

	$('.compo').removeClass('selected')
	element.addClass('selected')

	this.scope.my_compo = compo_id
	localStorage["garden/compo"] = compo_id
	$('#my-compo').text(element.attr('name'))

	$('#garden-team .enemies[of=' + compo_id + '] .no-more-fights').hide()
	var compo_array_id = null
	for (var i in LW.pages.garden.scope.garden.my_compositions)
	{
		if (LW.pages.garden.scope.garden.my_compositions[i].id == compo_id)
		{
			compo_array_id = i
		}
	}
	if (this.scope.garden.my_compositions[compo_array_id].fights == 0) {
		$('#garden-team .enemies[of=' + compo_id + '] .no-more-fights').show()
		return null
	}

	if (element.attr('loaded')) return null
	element.attr('loaded', true)

	_.get('garden/get-composition-opponents/' + compo_id + '/' + LW.token(), function(data) {
		if (data.success) {

			$('#garden-team .enemies[of=' + compo_id + '] .no-opponents').hide()
			if (data.opponents.length == 0) {
				$('#garden-team .enemies[of=' + compo_id + '] .no-opponents').show()
				return null
			}

			var html = ''
			for (var o in data.opponents) {
				html += "<div class='compo-wrapper'>" + _.view.render('garden.compo', {compo: data.opponents[o]}) + "</div>"
			}
			$('#garden-team .enemies[of=' + compo_id + '] .opponents').show().html(html)

			$('#garden-team .enemies[of=' + compo_id + '] .opponents .compo').click(function() {
				_.post('garden/start-team-fight', {
					composition_id: compo_id,
					target_id: $(this).attr('compo')
				}, function(data) {
					if (data.success) {
						LW.page('/fight/' + data.fight)
					}
				})
			});
		} else {
			_.toast(data.error)
		}
	})
}

LW.pages.garden.images = function(leeks) {

	$('#garden-page .leek').each(function() {
		var id = $(this).attr('leek')
		var leek = leeks[id]
		var elem = this
		LW.createLeekImage(0.6, leek.level, leek.skin, leek.hat, function(data) {
			$(elem).find('.image').html(data)
		})
	})
}

LW.pages.garden.leek_image = function(leek) {
	LW.createLeekImage(0.6, leek.level, leek.skin, leek.hat, function(data) {
		$('#garden-page .leek[leek=' + leek.id + '] .image').html(data)
	})
}

LW.pages.garden.battle_royale = function() {

	$('#br-select').show()
	$('#br-room').hide()
	$('#br-return').hide()

	$('#br-select .myleek').first().addClass('selected')
}

LW.pages.garden.battle_royale_select = function(e) {

	$('#br-select').hide()
	$('#br-room').show()
	$('#br-return').show()

	var leek = $('#garden-battle-royale .myleek.selected').attr('leek')

	this.br_last_leeks = {}
	$('#garden-battle-royale .leeks').html('')

	LW.battle_royale.show(e)

	LW.socket.send([BATTLE_ROYALE_REGISTER, leek])
}

LW.pages.garden.wsreceive = function(data) {
	var self = this

	if (data.type == BATTLE_ROYALE_UPDATE) {
		var count = data.data[0]
		var leeks = data.data[1]

		$('#garden-battle-royale .count').text(count)

		for (var l in leeks) {
			if (l in this.br_last_leeks) continue

			var html = _.view.render('garden.leek', {leek: leeks[l]})
			$('#garden-battle-royale .leeks').html($('#garden-battle-royale .leeks').html() + html)
			LW.pages.garden.leek_image(leeks[l])
		}
		for (var l in this.br_last_leeks) {
			if (l in leeks) continue
			$('#garden-battle-royale .leek[leek=' + this.br_last_leeks[l].id + ']').remove()
		}
		this.br_last_leeks = leeks
	}
}
