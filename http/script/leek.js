LW.pages.leek.init = function(params, $scope, $page) {

	var id = params.id

	if (!('id' in params)) {

		if (LW.connected) {
			id = _.first(LW.farmer.leeks).id
		} else {
			LW.error(
				_.lang.get('leek', 'not_found_id', [id]),
				_.lang.get('leek', 'not_found_id', [id])
			)
			return
		}
	}

	var myLeek = LW.connected && _.anyAttrEqual(LW.farmer.leeks, 'id', id)

	var url = myLeek ? 'leek/get-private/' + id + '/' + LW.token() : 'leek/get/' + id

	_.get(url, function(data) {

		if (!data.success) {
			LW.error(
				_.lang.get('leek', 'not_found_id', [id]),
				_.lang.get('leek', 'not_found_id', [id])
			)
			return
		}

		var leek = data.leek

		leek.baseLife = 100 + (leek.level - 1) * 3

		var xpBarWidth = leek.level == 301 ? 100 :
			Math.floor(100 * (leek.xp - leek.down_xp) / (leek.up_xp - leek.down_xp))

		for (var t in leek.tournaments) {
			leek.tournaments[t].name = _.lang.get('leek', 'tournament_of',
				_.format.date(leek.tournaments[t].date))
		}

		leek.talent_gains = Math.round(leek.talent_more / 3)

		$scope.leek = leek
		$scope.my_leek = myLeek
		$scope.leeks = LW.connected ? LW.farmer.leeks : []
		$scope.max_level = leek.level == 301
		$scope.xp_bar_width = xpBarWidth
		$scope.xp_bar_class = leek.level == 301 ? 'blue' : xpBarWidth
		$scope.garden_switch = {
			id: 'in-garden-switch',
			checked: leek.in_garden,
			theme: 'dark'
		}

		$page.render()

		LW.setTitle(leek.name)
		LW.setMenuTab('leek-' + leek.id)

		LW.pages.leek.updateImage()
		LW.pages.leek.chart()
		LW.pages.leek.report()

		if (myLeek) {

			// Remove existing popups
			$("#popups").children().remove();

			LW.pages.leek.garden()
			LW.pages.leek.tournament()
			LW.pages.leek.capital()
			LW.pages.leek.hat()
			LW.pages.leek.potion(leek)
			LW.pages.leek.rename(leek)
			LW.pages.leek.weapons(leek)
			LW.pages.leek.chips(leek)
			LW.pages.leek.ai(leek)
			LW.pages.leek.registers(leek)
			LW.pages.leek.levelPopup()
		}
	})
}

LW.pages.leek.pause = function() {

	clearInterval(this.leekTimeUpdate)
}

LW.pages.leek.chart = function() {

	var labels = []
	var time = LW.time.get()
	for (var i = 0; i < 7; ++i) {
		labels.push(_.format.dayMonthShort(time - i * 24 * 3600))
	}

	var data = {
		labels: labels.reverse(),
		series: [this.scope.leek.talent_history]
	};

	new Chartist.Line('.ct-chart', data, {height: 130, showArea: true, fullWidth: true, fullHeight: true});

	var chart = $('.ct-chart');

	var toolTip = chart
		.append('<div class="tooltip top"><div class="content"></div><div class="arrow"></div></div>')
		.find('.tooltip')
		.hide();

	chart.on('mouseenter', '.ct-point', function() {
		var point = $(this),
		value = point.attr('ct:value'),
		seriesName = point.parent().attr('ct:series-name');
		toolTip.find('.content').html(value)
		toolTip.show();
	});

	chart.on('mouseleave', '.ct-point', function() {
		toolTip.hide();
	});

	chart.on('mousemove', function(event) {
		toolTip.css({
			left: (event.offsetX || event.originalEvent.layerX) - toolTip.width() / 2 - 5,
			top: (event.offsetY || event.originalEvent.layerY) - toolTip.height() - 20
		});
	});
}

LW.pages.leek.updateImage = function() {

	LW.createLeekImage(this.scope.leek.id, 1, this.scope.leek.level, this.scope.leek.skin, this.scope.leek.hat, function(id, data) {
		$('#page #leek-image').html(data)
	})
}

LW.pages.leek.rename = function(e) {

	var leek = this.scope.leek

	var prices = {
		habs: 2000000,
		crystals: 200
	}

	$('#rename-button').click(function(e) {

		var popup = new _.popup.new('leek.rename_popup', {
			rename_price_habs: prices.habs,
			rename_price_crystals: prices.crystals,
			leek: leek
		})

		var done = function(newName, money) {

			leek.name = newName
			$('#leek-page h1').text(newName)
			$('#menu .section[leek=' + leek.id + '] div').text(newName)

			money == 'crystals' ? LW.updateCrystals(-prices.crystals) : LW.updateHabs(-prices.habs)

			popup.dismiss()

			_.toast(_.lang.get('leek', 'rename_done'))
		}

		popup.view.find('#rename-habs').click(function() {

			var name = $('#rename-new-name').val()

			_.post('leek/rename-habs', {leek_id: leek.id, new_name: name}, function(data) {

				if (data.success) {
					done(name, 'habs')
				} else {
					_.toast(_.lang.get('leek', data.error, data.error_params))
				}
			})
		})

		popup.view.find('#rename-crystals').click(function() {

			var name = $('#rename-new-name').val()

			_.post('leek/rename-crystals', {leek_id: leek.id, new_name: name}, function(data) {

				if (data.success) {
					done(name, 'crystals')
				} else {
					_.toast(_.lang.get('leek', data.error, data.error_params))
				}
			})
		})

		popup.show(e)
	})
}

LW.pages.leek.potion = function() {

	var leek = this.scope.leek

	var popup = new _.popup.new('leek.potion_popup', {leek: leek, potions: LW.farmer.potions})

	popup.find('.potion').click(function() {

		popup.dismiss()

		var id = $(this).attr('potion')
		var potion = _.selectWhere(LW.farmer.potions, 'id', id)

		_.post('leek/use-potion', {leek_id: leek.id, potion_id: id}, function(data) {

			var template = LW.potions[potion.template]

			for (var e in template.effects) {

				var effect = template.effects[e]

				if (effect.type == 1) { // Restat

					_.reload()

				} else if (effect.type == 2) { // Skin

					leek.skin = effect.params[0]
					LW.pages.leek.updateImage()
				}
			}
		})
	})

	$('#use-potion').click(function(e) {
		popup.show(e)
	})
}

LW.pages.leek.capital = function() {

	var leek = this.scope.leek

	$('#capital').toggle(leek.capital > 0)
	if (leek.capital > 0) $('#capital').addClass('green')

	$('#menu .section[leek=' + leek.id + ']').attr('label', leek.capital == 0 ? '' : leek.capital)

	$('#capital').click(function(e) {

		var popup = new _.popup.new('leek.capital_popup', {leek: leek}, 800)

		var costs = {
			life : [
				{step : 0, capital : 1, sup : 4},
				{step : 1000, capital : 1, sup : 3},
				{step : 2000, capital : 1, sup : 2},
			],
			strength : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			wisdom : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			agility : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			resistance : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			science : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			magic : [
				{step : 0, capital : 1, sup : 2},
				{step : 200, capital : 1, sup : 1},
				{step : 400, capital : 2, sup : 1},
				{step : 600, capital : 3, sup : 1},
			],
			frequency : [
				{step : 0, capital : 1, sup : 1}
			],
			tp : [
				{step : 0, capital : 80, sup : 1}
			],
			mp : [
				{step : 0, capital : 50, sup : 1}
			]
		}

		var bonuses
		var capital
		var base

		var reset = function() {

			bonuses = {
				life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
				frequency: 0, science: 0, magic: 0, tp: 0, mp: 0
			}

			base = {
				life: leek.life - 100 - (leek.level - 1) * 3,
				strength: leek.strength,
				wisdom: leek.wisdom,
				agility: leek.agility,
				resistance: leek.resistance,
				science: leek.science,
				magic: leek.magic,
				frequency: leek.frequency - 100,
				tp: leek.tp - 10,
				mp: leek.mp - 3
	 		}

			capital = leek.capital

			popup.view.find('.sup').text('')
			popup.view.find('.stat').each(function() {
				$(this).text(leek[$(this).attr('stat')])
			})

			update()
		}

		var update = function() {

			popup.view.find('.capital')
				.html(_.lang.get('leek', 'n_capital', capital))
				.attr('v', capital)

			popup.view.find('.add').each(function() {

				$(this).removeClass('locked')

				var tmpCapital = capital
				var tmpBonuses = _.clone(bonuses)

				var charac = $(this).attr('stat')
				var q = parseInt($(this).attr('q'))

				var buttonCost = 0
				var buttonBonus = 0

				while (q > 0) {

					var total = base[charac] + tmpBonuses[charac]
					var step = 0

					for (; step < costs[charac].length; ++step) {
						if (costs[charac][step].step > total) break
					}
					step--

					var cost = costs[charac][step].capital
					var bonus = costs[charac][step].sup

					if (cost > tmpCapital) {
						$(this).addClass('locked')
						$('#tt_' + $(this).attr('id')).text('')
						break
					}

					q -= bonus
					tmpBonuses[charac] += bonus
					tmpCapital -= cost
					buttonCost += cost
					buttonBonus += bonus
				}

				$('#tt_' + $(this).attr('id')).text(buttonCost + ' capital ⇔ ' + buttonBonus + ' ' + _.lang.get('leek', $(this).attr('stat')).toLowerCase())
			})

			$('#capital').toggle(capital > 0)
			$('#menu .section[leek=' + leek.id + ']').attr('label', capital == 0 ? '' : capital)
		}

		popup.view.find('.add').click(function() {

			if ($(this).hasClass('locked')) {
				return
			}

			var charac = $(this).attr('stat')
			var q = parseInt($(this).attr('q'))

			while (q > 0) {

				// Get the step for the characteristic
				var total = base[charac] + bonuses[charac]
				var step = 0

				for (; step < costs[charac].length; ++step) {
					if (costs[charac][step].step > total) {
						break
					}
				}
				step--

				var bonus = costs[charac][step].sup
				var cost = costs[charac][step].capital

				if (cost > capital) {
					break
				}

				bonuses[charac] += bonus
				q -= bonus
				capital -= cost
			}

			popup.view.find('.stat[stat=' + charac + ']').next('.sup').text('(+' + bonuses[charac] + ')')
			popup.view.find('.stat[stat=' + charac + ']').text(leek[$(this).attr('stat')] + bonuses[charac])

			update()
		})

		popup.view.find('.reset').click(function() {
			reset()
		})

		popup.view.find('.validate').click(function() {

			_.post('leek/spend-capital', {leek: leek.id, characteristics: JSON.stringify(bonuses)}, function(data) {

				if (data.success) {

					// Update leek characs
					for (var stat in bonuses) {
						leek[stat] += bonuses[stat]
						$('#stats').find('[stat=' + stat + ']').text(leek[stat])
					}

					// Update capital
					leek.capital = capital
					$('#stats #capital').find('#capital-count').text(capital)
					if (capital == 0) $('#stats #capital').hide()

					popup.dismiss()


				} else {
					_.toast(data.error)
				}
			})
		})

		popup.show(e)

		reset()
	})
}

LW.pages.leek.garden = function() {

	var leek = this.scope.leek

	$('#in-garden-button').click(function() {

		var inGarden = !$('#in-garden-switch').is(':checked')

		$('#in-garden-switch').prop('checked', inGarden)

		_.post('leek/set-in-garden', {leek_id: leek.id, in_garden: inGarden})
	})
}

LW.pages.leek.tournament = function() {

	var leek = this.scope.leek

	if (leek.tournament.registered) {
		$('#register-tournament .register').hide()
		$('#register-tournament .unregister').show()
	} else {
		$('#register-tournament .register').show()
		$('#register-tournament .unregister').hide()
	}

	$('#register-tournament').click(function() {
		if (leek.tournament.registered) {
			leek.tournament.registered = false
			_.post('leek/unregister-tournament', {leek_id: leek.id})
			$(this).find('.unregister').hide()
			$(this).find('.register').show()
		} else {
			leek.tournament.registered = true
			_.post('leek/register-tournament', {leek_id: leek.id})
			$(this).find('.unregister').show()
			$(this).find('.register').hide()
		}
	})
}

LW.pages.leek.hat = function() {

	var leek = this.scope.leek

	$('#leek-image').click(function(e) {

		var popup = new _.popup.new('leek.hat_popup', {farmer_hats: LW.farmer.hats})

		popup.view.find('.hat').click(function() {

			var hatID = parseInt($(this).attr('hat'))
			var hatItemID = parseInt($(this).attr('item_id'))
			var hatTemplate = parseInt($(this).attr('template'))

			if (hatID == -1) {

				_.post('leek/remove-hat', {leek_id: leek.id}, function(data) {

					if (data.success) {

						// Add old one
						var template = LW.hats[LW.hatTemplates[leek.hat].item]
						LW.farmer.hats.push({
							template: LW.hatTemplates[leek.hat].item,
							id: 0,
							name: template.name,
							level: template.level,
							hat_template: leek.hat
						})

						leek.hat = null
						LW.pages.leek.updateImage()
						popup.dismiss()
					}
				})

			} else {

				_.post('leek/set-hat', {leek_id: leek.id, hat_id: hatID}, function(data) {

					if (data.success) {

						// Remove new hat
						_.removeOneWhere(LW.farmer.hats, 'id', hatItemID)

						// Add old one
						if (leek.hat) {
							var template = LW.hats[LW.hatTemplates[leek.hat].item]
							LW.farmer.hats.push({
								template: LW.hatTemplates[leek.hat].item,
								id: 0,
								name: template.name,
								level: template.level,
								hat_template: leek.hat
							})
						}

						leek.hat = hatTemplate
						LW.pages.leek.updateImage()

						popup.dismiss()
					}
				})
			}
		})

		popup.show(e)
	})
}

LW.pages.leek.report = function() {

	var leek = this.scope.leek

	$('#report-button').click(function(e) {

		LW.createReportPopup({
			title: _.lang.get('moderation', 'report_farmer', leek.farmer.name),
			message: _.lang.get('moderation', 'report_farmer_for_reason', leek.farmer.name),
			target: leek.farmer.id,
			reasons: [
				LW.WARNING.INCORRECT_LEEK_NAME,
				LW.WARNING.INCORRECT_AI_NAME,
				LW.WARNING.RUDE_SAY,
				LW.WARNING.CHEAT
			],
			parameter: leek.id
		}).show(e)
	})
}

LW.pages.leek.registers = function() {

	var leek = this.scope.leek

	if (localStorage['leek/show_registers'] === 'true') {
		$('#show-registers').hide()
		$('#registers-wrapper .content').show()
	} else {
		$('#hide-registers').hide()
		$('#registers-wrapper .content').hide()
	}

	$('#hide-registers').click(function() {
		$('#registers-wrapper .content').hide()
		$('#show-registers').show()
		$(this).hide()
		localStorage['leek/show_registers'] = false
	})
	$('#show-registers').click(function() {
		$('#registers-wrapper .content').show()
		$('#hide-registers').show()
		$(this).hide()
		localStorage['leek/show_registers'] = true
	})

	$('#registers .value').focusout(function() {

		var key = $(this).parent().find('.key').text()
		var value = $(this).text()

		for (var r in leek.registers) {
			if (key == leek.registers[r].key) {

				old = leek.registers[r].value

				if (old != value) {

					leek.registers[r].value = value

					_.post('leek/set-register', {leek_id: leek.id, key: key, value: value}, function(data) {
						if (data.success) {
							_.toast("Register saved")
						}
					})
				}
				break
			}
		}
	})

	$('#registers .delete').click(function() {

		var key = $(this).parent().find('.key').text()

		$(this).parent().remove()
		_.toast("Register deleted")
		_.removeWhere(leek.registers, 'key', key)

		_.post('leek/delete-register', {leek_id: leek.id, key: key})

		$('#registers-wrapper .register-count').text('[' + leek.registers.length + '/100]')
	})
}

LW.pages.leek.weapons = function(leek) {

	var popup = new _.popup.new('leek.weapon_popup', {leek: leek, farmer_weapons: LW.farmer.weapons}, 800)
	var draggedWeapon = null

	var changeWeapon = function(action, weaponID) {

		var weaponElem = popup.view.find('.weapon[weapon=' + weaponID + ']')
		var weaponItem = parseInt(weaponElem.attr('item'))
		var weaponTemplate = parseInt(weaponElem.attr('template'))
		var weapon = LW.weapons[weaponTemplate]
		var location = weaponElem.attr('location')
		weaponElem.removeClass('dragging')

		if (action == 'add') {

			if (leek.weapons.length >= leek.max_weapons || location == 'leek') {
				_.toast(_.lang.get('leek', 'error_max_weapon', leek.name))
				return
			}
			if (weapon.level > leek.level) {
				_.toast(_.lang.get('leek', 'error_under_required_level_weapon', leek.name))
				return
			}

			popup.view.find('.leek-weapons').append(weaponElem)
			weaponElem.attr('location', 'leek')
			leek.weapons.push({id: weaponItem, template: weaponElem.attr('template')})

			$('#leek-weapons').append("<div class='weapon' id='leek-weapon-" + weaponID + "' weapon='" + weaponID +
				"' item='" + weaponItem + "' template='" + weaponTemplate + "'><img src='" + LW.staticURL + 'image/weapon/' +
				weapon.name + ".png'></div><br>")

			LW.addTooltip("leek-weapon-" + weaponID, "<b>" + _.lang.get('weapon', weapon.name) + "</b><br>" +
				_.lang.get('leek', 'level_n', weapon.level) + "<br>WEAPON_" + weapon.name.toUpperCase())

			_.post('leek/add-weapon', {leek_id: leek.id, weapon_id: weaponItem}, function(data) {

			})

		} else if (action == 'remove') {

			if (location == 'farmer') return null

			popup.view.find('.farmer-weapons').append(weaponElem)
			weaponElem.attr('location', 'farmer')
			_.removeWhere(leek.weapons, 'id', weaponItem)

			$("#leek-weapons .weapon[item='" + weaponItem + "'] + br").remove()
			$("#leek-weapons .weapon[item='" + weaponItem + "']").remove()

			_.post('leek/remove-weapon', {weapon_id: weaponItem}, function(data) {})
		}

		$('.weapon-count').text('[' + leek.weapons.length + '/' + leek.max_weapons + "]")
	}

	popup.view.find('.weapon.available').on({

        dragstart: function(e) {

			if ($(this).attr('location') == 'leek') {
				popup.find('.farmer-weapons').addClass('dashed')
			} else {
				if (leek.weapons.length < leek.max_weapons) {
					popup.find('.leek-weapons').addClass('dashed')
				}
			}

			draggedWeapon = $(this).attr('weapon')
            $(this).addClass('dragging');
        },
        dragend: function() {

            $(this).removeClass('dragging')
            popup.find('.leek-weapons').removeClass('dashed')
            popup.find('.farmer-weapons').removeClass('dashed')
        }
    }).click(function() {

		if ($(this).attr('location') == 'leek') {
			changeWeapon('remove', $(this).attr('weapon'))
		} else {
			changeWeapon('add', $(this).attr('weapon'))
		}
	})

    popup.view.find('.leek-weapons, .farmer-weapons').on({
        drop: function(e) {

			$(this).removeClass('dashed')

			if ($(this).hasClass('leek-weapons'))
				changeWeapon('add', draggedWeapon)
			else
				changeWeapon('remove', draggedWeapon)

			draggedWeapon = null
			e.preventDefault()
			return false
        },
        dragover: function(e) {
            e.preventDefault()
        }
	})

	$('#edit-weapons').click(function(e) {
		popup.show(e)
	})
}

LW.pages.leek.chips = function(leek) {

	var popup = new _.popup.new('leek.chip_popup', {leek: leek, farmer_chips: LW.farmer.chips}, 800)
	var draggedChip = null

	var changeChip = function(action, chipID) {

		var chipElem = popup.view.find('.chip[chip=' + chipID + ']')
		var chipTemplate = parseInt(chipElem.attr('template'))
		var chipItem = parseInt(chipElem.attr('item'))
		var chip = LW.chips[chipTemplate]
		var location = chipElem.attr('location')
		chipElem.removeClass('dragging')

		if (action == 'add') {

			if (location == 'leek' || leek.chips.length >= leek.max_chips) {
				_.toast(_.lang.get('leek', 'error_max_chip', leek.name))
				return
			}
			if (chip.level > leek.level) {
				_.toast(_.lang.get('leek', 'error_under_required_level_chip', leek.name))
				return
			}

			popup.view.find('.leek-chips').append(chipElem)
			chipElem.attr('location', 'leek')
			leek.chips.push({id: chipItem, template: chipElem.attr('template')})

			$('#leek-chips').append("<div class='chip' id='leek-chip-" + chipID + "' item='" + chipItem +
				"' template='" + chipTemplate + "'><img src='" + LW.staticURL + 'image/chip/small/' +
				chip.name + ".png'></div> ")

			LW.addTooltip("leek-chip-" + chipID, "<b>" + _.lang.get('chip', chip.name) + "</b><br>" +
				_.lang.get('leek', 'level_n', chip.level) + "<br>CHIP_" + chip.name.toUpperCase())

			_.post('leek/add-chip', {leek_id: leek.id, chip_id: chipItem})

		} else if (action == 'remove') {

			if (location == 'farmer') return null

			popup.view.find('.farmer-chips').append(chipElem)
			chipElem.attr('location', 'farmer')
			_.removeWhere(leek.chips, 'id', chipItem)

			$("#leek-chips .chip[item='" + chipItem + "']").remove()

			_.post('leek/remove-chip', {chip_id: chipItem})
		}

   		$('.chip-count').text('[' + leek.chips.length + '/' + leek.max_chips + "]")
	}

	popup.view.find('.chip.available').on({

        dragstart: function(e) {

			if ($(this).attr('location') == 'leek') {
				popup.find('.farmer-chips').addClass('dashed')
			} else {
				if (leek.chips.length < leek.max_chips) {
					popup.find('.leek-chips').addClass('dashed')
				}
			}

			draggedChip = $(this).attr('chip')
            $(this).addClass('dragging');
        },
        dragend: function() {

            $(this).removeClass('dragging')
            popup.find('.leek-chips').removeClass('dashed')
            popup.find('.farmer-chips').removeClass('dashed')
        }
    }).click(function() {

		if ($(this).attr('location') == 'leek') {
			changeChip('remove', $(this).attr('chip'))
		} else {
			changeChip('add', $(this).attr('chip'))
		}
	})

    popup.view.find('.leek-chips, .farmer-chips').on({
        drop: function(e) {
			$(this).removeClass('dashed')

			if ($(this).hasClass('leek-chips'))
				changeChip('add', draggedChip)
			else
				changeChip('remove', draggedChip)

			draggedChip = null
			e.preventDefault()
			return false
        },
        dragover: function(e) {
            e.preventDefault()
        }
	})

	$('#edit-chips').click(function(e) {
		popup.show(e)
	})
}

LW.pages.leek.ai = function(leek) {

	var popup = new _.popup.new('leek.ai_popup', {leek: leek, farmer_ais: LW.farmer.ais}, 800)
	var draggedAI = null

	var changeAI = function(action, aiID) {

		var aiElem = popup.view.find('.ai[ai=' + aiID + ']')
		var location = aiElem.attr('location')
		aiElem.removeClass('dragging')

		if (action == 'add') {

			if (location == 'leek') return null

			if (leek.ai) {
				popup.find('.leek-ai .ai').attr('location', 'farmer')
				popup.find('.farmer-ais').append(popup.find('.leek-ai .ai'))
			}
			popup.find('.leek-ai').append(aiElem)
			aiElem.attr('location', 'leek')

			leek.ai = {id: aiID}
			$('#leek-page #leek-ai .ai').remove()
			var newAiElem = aiElem.clone()
			$('#leek-page #leek-ai').append(newAiElem)
			$('#leek-page #leek-ai .ai').wrap("<a href='/editor/" + aiID + "'></a>")
			LW.setTooltipParent('ai-' + aiID, newAiElem)

			_.post('leek/set-ai', {leek_id: leek.id, ai_id: aiID})

		} else if (action == 'remove') {

			if (location == 'farmer') return null

			popup.find('.farmer-ais').append(aiElem)
			aiElem.attr('location', 'farmer')

			if (leek.ai) {
				$('#leek-page #leek-ai .ai').remove()
			}
			leek.ai = null

			_.post('leek/remove-ai', {leek_id: leek.id})
		}
	}

	popup.find('.ai').on({

        dragstart: function(e) {

			e.originalEvent.dataTransfer.setData('text/plain', 'drag !!!');

			if ($(this).attr('location') == 'leek') {
				popup.find('.farmer-ais').addClass('dashed')
			} else {
				popup.find('.leek-ai').addClass('dashed')
			}
			draggedAI = $(this).attr('ai')
            $(this).addClass('dragging')

            return true
        },
        dragend: function(e) {

            $(this).removeClass('dragging')
            popup.find('.leek-ai').removeClass('dashed')
            popup.find('.farmer-ais').removeClass('dashed')

            e.preventDefault()
            return false
        }
    }).click(function() {

		if ($(this).attr('location') == 'leek') {
			changeAI('remove', $(this).attr('ai'))
		} else {
			changeAI('add', $(this).attr('ai'))
		}
	})

	popup.view.find('.leek-ai, .farmer-ais').on({
        drop: function(e) {
			$(this).removeClass('dashed')

			if ($(this).hasClass('leek-ai'))
				changeAI('add', draggedAI)
			else
				changeAI('remove', draggedAI)

			draggedAI = null
			e.preventDefault()
			return false
        },
        dragover: function(e) {
            e.preventDefault()
        }
	})

	$('#edit-ai').click(function(e) {
		popup.show(e)
	})
}

LW.pages.leek.levelPopup = function() {

	var leek = this.scope.leek

	if (leek.level_seen < leek.level) {

		_.get('leek/get-level-popup/' + leek.id + '/' + LW.token(), function(data) {

			var popup = new _.popup.new('leek.level_popup', {popup: data.popup, leek: leek}, 900, true)

			popup.setOnDismiss(function() {
				_.post('leek/set-popup-level-seen', {leek_id: leek.id})
			})
			popup.show()

			LW.createLeekImage(leek.id, 0.6, leek.level, leek.skin, leek.hat, function(id, data) {
				$('.popup.level_popup .leek-image').html(data)
			})
		})
	}
}

// Conversion from characteristic amount to invested capital
LW.pages.leek.characteristicToCapital = function(characteristic, amount, level = 1) {
	switch (characteristic) {
	    case CHARACTERISTIC_LIFE:
	        return Math.min(amount-(100+(level-1)*3), 1000) * 1/4 + Math.min(Math.max(0, amount-(1100+(level-1) *3)), 999) * 1/3 + Math.max(0, amount-(2100+(level-1) *3)) * 1/2

	    case CHARACTERISTIC_TP:
	        return (amount - 10) * 80

	    case CHARACTERISTIC_MP:
	        return (amount - 3) * 50

	    case CHARACTERISTIC_FREQUENCY:
	       	return amount - 100

	    case CHARACTERISTIC_STRENGTH:
	    case CHARACTERISTIC_WISDOM:
	    case CHARACTERISTIC_AGILITY:
	    case CHARACTERISTIC_RESISTANCE:
	    case CHARACTERISTIC_SCIENCE:
	    case CHARACTERISTIC_MAGIC:
	        return Math.min(amount, 200) / 2 + Math.min(Math.max(0, amount-200), 200) + Math.min(Math.max(0, amount-400), 200) * 2 + Math.max(0, amount-600) * 3

	    default:
	        return 0
	}
}
