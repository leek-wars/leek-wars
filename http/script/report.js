var _fight

LW.pages.report.init = function(params, $scope, $page) {

	var id = params.id
	var url = LW.farmer.admin ? 'fight/get-private/' + id + '/' + LW.token() : 'fight/get/' + id;

	_.get(url, function(data) {

		var fight = data.fight
		_fight = fight

		LW.pages.report.generateActions(fight.data, function(html, logs) {

			$scope.fight = fight
			$scope.report = fight.report
			$scope.actionsHTML = html

			if (fight.type == LW.FIGHT_TYPE.BATTLE_ROYALE) {

				$scope.leeks = data.fight.report.leeks

			} else {

				var report = fight.report

				var team1Title = _.lang.get('report', 'winners')
				var team2Title = _.lang.get('report', 'loosers')
				var leeks1 = data.fight.report.leeks1
				var leeks2 = data.fight.report.leeks2
				var farmer1 = data.fight.report.farmer1
				var farmer2 = data.fight.report.farmer2
				var team1 = data.fight.report.team1
				var team2 = data.fight.report.team2
				var flags1 = data.fight.report.flags1
				var flags2 = data.fight.report.flags2

				if (fight.report.win == 0) {

					team1Title = _.lang.get('report', 'team1')
					team2Title = _.lang.get('report', 'team2')

				} else if (fight.report.win == 2) {

					leeks1 = data.fight.report.leeks2
					leeks2 = data.fight.report.leeks1
					farmer1 = data.fight.report.farmer2
					farmer2 = data.fight.report.farmer1
					team1 = data.fight.report.team2
					team2 = data.fight.report.team1
					flags1 = data.fight.report.flags2
					flags2 = data.fight.report.flags1
				}

				if (LW.farmer.admin) {
					var times = []
					for (var t in report.ai_times) {
						times[report.ai_times[t].id] = report.ai_times[t].time
					}
					report.ai_times = times
				}

				var total1 = {
					level: leeks1.reduce(function(sum, leek) {return sum + leek.level}, 0),
					xp: leeks1.reduce(function(sum, leek) {return sum + leek.xp}, 0),
					money: leeks1.reduce(function(sum, leek) {return sum + leek.money}, 0)
				}
				if (LW.farmer.admin) {
					total1.time = leeks1.reduce(function(sum, leek) {
						return sum + Math.floor(report.ai_times[leek.id] / 1000) / 1000
					}, 0)
				}
				var total2 = {
					level: leeks2.reduce(function(sum, leek) {return sum + leek.level}, 0),
					xp: leeks2.reduce(function(sum, leek) {return sum + leek.xp}, 0),
					money: leeks2.reduce(function(sum, leek) {return sum + leek.money}, 0)
				}
				if (LW.farmer.admin) {
					total2.time = leeks2.reduce(function(sum, leek) {
						return sum + Math.floor(report.ai_times[leek.id] / 1000) / 1000
					}, 0)
				}

				// Barres d'XP
				var computeXP = function(leek, i) {

					var totalXP = leek.next_xp - leek.prev_xp
					var newLevel = leek.cur_xp - leek.xp < leek.prev_xp

					var oldXP = newLevel ? 0 : leek.cur_xp - leek.xp - leek.prev_xp
					var newXPInCurrentLevel = newLevel ? leek.cur_xp - leek.prev_xp : leek.xp

					leek.current_bar = Math.floor(100 * oldXP / totalXP)
					leek.new_bar = Math.floor(100 * newXPInCurrentLevel / totalXP)

					leek.bonus = report.bonus
					if (LW.farmer.admin) {
						leek.ai_time = Math.floor(report.ai_times[leek.id] / 1000) / 1000;
					}
				}

				for (var l in leeks1) computeXP(leeks1[l], l)
				for (var l in leeks2) computeXP(leeks2[l], l)

				if (fight.type == LW.FIGHT_TYPE.TEAM) {
					computeXP(team1)
					if (team2) {
						computeXP(team2)
					}
				}

				$scope.team1_title = team1Title
				$scope.team2_title = team2Title
				$scope.leeks1 = leeks1
				$scope.leeks2 = leeks2
				$scope.farmer1 = farmer1
				$scope.farmer2 = farmer2
				$scope.team1 = team1
				$scope.team2 = team2
				$scope.flags1 = flags1
				$scope.flags2 = flags2
				$scope.total1 = total1
				$scope.total2 = total2

				// Challenge
				if (LW.connected) {

					$scope.my_fight = false

					for (var ml in LW.farmer.leeks) {
						var exists = false
						for (var l in fight.report.leeks1) {
							if (fight.report.leeks1[l].id == LW.farmer.leeks[ml].id) {
								$scope.my_fight = true
								$scope.i_win = fight.report.win == 1
								if (fight.type == LW.FIGHT_TYPE.SOLO)
									$scope.enemy = fight.report.leeks2[0].id
								else if (fight.type == LW.FIGHT_TYPE.FARMER)
									$scope.enemy = fight.farmer2
								break
							}
						}
						for (var l in fight.report.leeks2) {
							if (fight.report.leeks2[l].id == LW.farmer.leeks[ml].id) {
								$scope.my_fight = true
								$scope.i_win = fight.report.win == 2
								if (fight.type == LW.FIGHT_TYPE.SOLO)
									$scope.enemy = fight.report.leeks1[0].id
								else if (fight.type == LW.FIGHT_TYPE.FARMER)
									$scope.enemy = fight.farmer1
								break
							}
						}
					}
				}
			}

			// Statistics
			$scope.statistics = LW.pages.report.statistics(fight)
			var warningsErrors = LW.pages.report.warningsErrors($scope.statistics.leeks, logs)
			$scope.errors = warningsErrors.errors
			$scope.warnings = warningsErrors.warnings

			$page.render()

			LW.pages.report.graph($scope.statistics, fight)
			LW.pages.report.highlightStatisticsTable($scope.statistics)
			LW.pages.report.expandTabs()
			LW.pages.report.refightButton(fight)

			LW.setTitle(_.lang.get('report', 'title') + " - " + fight.team1_name + " vs " + fight.team2_name)
		})
	})
}

// Connect the button to make an other test fight with same parameters
LW.pages.report.refightButton = function(fight) {
	if (fight.context == LW.FIGHT_CONTEXT.TEST) {
		$('#refight-test').click(function() {

			var data = localStorage['editor/last-scenario-data']

			_.post('ai/test-new', {data: data}, function(data) {
				if (data.success) {
					LW.page('/fight/' + data.fight)
				} else {
					_.toast("Erreur : " + data.error)
				}
			})
		})
	}
}

LW.pages.report.generateActions = function(data, callback) {

	var getLeekName = function(leek) {
		return "<span style='color:" + LW.TEAM_COLORS[leek.team - 1] + ";'>" + leek.name + "</span>"
	}

	var colorText = function(text, color) {
		return "<span style='color: " + color + ";'>" + text + "</span>"
	}

	var createEffectAction = function(leeks, action) {

		var data = ""

		var objectID = action[1]
		var id = action[2]
		var caster = action[3]
		var leek = leeks[action[4]]
		var effect = action[5]
		var value = action[6]

		switch (effect) {

			case LW.EFFECT.ABSOLUTE_SHIELD:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_absolute_shield', value), SHIELD_COLOR));
				break;

			case LW.EFFECT.RELATIVE_SHIELD:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_relative_shield', value + '%'), SHIELD_COLOR));
				break;

			case LW.EFFECT.BUFF_AGILITY:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_agility', value), AGILITY_COLOR));
				break;

			case LW.EFFECT.BUFF_STRENGTH:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_strength', value), STRENGTH_COLOR));
				break;

			case LW.EFFECT.BUFF_RESISTANCE:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_resistance', value), RESISTANCE_COLOR));
				break;

			case LW.EFFECT.BUFF_WISDOM:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_wisdom', value), WISDOM_COLOR));
				break;

			case LW.EFFECT.BUFF_MP:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_mp', value), MP_COLOR));
				break;

			case LW.EFFECT.BUFF_TP:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_tp', value), TP_COLOR));
				break;

			case LW.EFFECT.SHACKLE_TP:
				data = _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_tp', -value), TP_COLOR));
				break;

			case LW.EFFECT.SHACKLE_MP:
				data = _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_mp', -value), MP_COLOR));
				break;

			case LW.EFFECT.SHACKLE_STRENGTH:
				data = _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_strength', -value), STRENGTH_COLOR));
				break;

			case LW.EFFECT.SHACKLE_MAGIC:
				data = _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_magic', -value), MAGIC_COLOR));
				break;

			case LW.EFFECT.DAMAGE_RETURN:
				data = _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_damage_return', value + '%'), 'black'))
				break;
		}
		return data
	}

	var next = function(data, logs) {

		var weaponsNames = []
		var chipsNames = []

		var leeks = []
		for (var leek of data.leeks) {
			leeks[leek.id] = leek
			if (leek.summon) {
				leek.name = _.lang.get('entity', leek.name)
			}
		}

		var turn = 0
		var html = ""

		for (var a in data.actions) {

			var action = data.actions[a]
			var type = action[0]
			var action_text = ""

			if (type == ACTION_START_FIGHT) {

				turn++
				action_text += "<span class='turn'>" + _.lang.get('fight', 'turn_n', 1) + "</span>"

			} else if (type == ACTION_USE_WEAPON) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_hit', getLeekName(leek))
				if (action[4] == 2) action_text += "... " + _.lang.get('effect', 'critical')

			} else if (type == ACTION_USE_CHIP) {

				var chip = LW.chips[LW.chipTemplates[action[3]].item]

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_cast', getLeekName(leek), _.lang.get('chip', chip.name))
				if (action[4] == 2) action_text += "... " + _.lang.get('effect', 'critical')

			} else if (type == ACTION_SET_WEAPON) {

				var weapon = LW.weapons[LW.weaponTemplates[action[2]].item]

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_take_weapon', getLeekName(leek), _.lang.get('weapon', weapon.name))

			} else if (type == ACTION_END_FIGHT) {

				action_text += _.lang.get('fight', 'end_of_fight')

			} else if (type == ACTION_PLAYER_DEAD) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_is_dead', getLeekName(leek))

			} else if (type == ACTION_NEW_TURN) {

				turn++
				action_text += "<span class='turn'>" + _.lang.get('fight', 'turn_n', turn) + "</span>"

			} else if (type == ACTION_END_TURN) {
				// rien

			} else if (type == ACTION_LEEK_TURN) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'turn_of_leek', getLeekName(leek))

			} else if (type == ACTION_MOVE_TO) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_move', getLeekName(leek))

			} else if (type == ACTION_TP_LOST) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_tp', action[2]), TP_COLOR))

			} else if (type == ACTION_LIFE_LOST) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_life', action[2]), LIFE_COLOR))

			} else if (type == ACTION_MP_LOST) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_loose_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_mp', action[2]), MP_COLOR))

			} else if (type == ACTION_CARE) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_life', action[2]), LIFE_COLOR))

			} else if (type == ACTION_BOOST_VITA) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_win_x', getLeekName(leek), colorText(_.lang.get('fight', 'n_vita', action[2]), LIFE_COLOR))

			} else if (type == ACTION_ADD_CHIP_EFFECT) {

				action_text += createEffectAction(leeks, action)

			} else if (type == ACTION_ADD_WEAPON_EFFECT) {

				action_text += createEffectAction(leeks, action)

			} else if (type == ACTION_REMOVE_EFFECT) {

			} else if (type == ACTION_SAY) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_speak', getLeekName(leek), _.protect(action[2]))

			} else if (type == ACTION_SUMMON) {

				leek = leeks[action[1]]
				summon = leeks[action[2]]

				action_text += _.lang.get('fight', 'summon', getLeekName(leek), getLeekName(summon))

			} else if (type == ACTION_LAMA) {

			} else if (type == ACTION_SHOW) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_show_cell', getLeekName(leek), action[2])

			} else if (type == ACTION_BUG) {

				leek = leeks[action[1]]
				action_text += _.lang.get('fight', 'leek_bug', getLeekName(leek))
			} else if (type == ACTION_RESURRECTION) {
				action_text += _.lang.get('fight', 'leek_resurrect', getLeekName(leeks[action[1]]), getLeekName(leeks[action[2]]))
			} else {
				action_text += "Unknown action : number " + type
			}

			if (action_text != "") {
				html += "<div class='action'>"
				html += action_text
				html += "</div>"
			}

			// Logs personnels ?
			if (logs != null && a in logs) {

				actionLogs = logs[a]

				for (var l in actionLogs) {

					var log = actionLogs[l]

					leek = log[0]
					type = log[1]

					if (type == 1 || type == 2 || type == 3) {

						var clazz = ""
						if (log[1] == 2) clazz = "warning"
						else if (log[1] == 3) clazz = "error"

						if (l == 0) clazz += " first"
						if (l == logs.length - 1) clazz += " last"

						var color = log.length > 3 ? _.colorToHex(log[3]) : '';

						// TODO à tester
						html += "<pre class='log " + clazz + "'> [" + leeks[leek].name + "] <span style='color: " + color + "'>" + log[2] + "</span></pre>"

					} else if (type == 5) { // Pause

						html += "<pre class='log pause'> [" + leeks[leek].name + "] " + "<i>pause()</i>" + "</pre>"
					}
				}
			}
		}

		callback(html, logs)
	}

	if (LW.connected) {

		_.get('fight/get-logs/' + _fight.id + '/' + LW.token(), function(logs) {
			next(data, logs.logs)
		})

	} else {

		next(data, null)
	}
}

LW.pages.report.statistics = function(fight) {

	var statistics = {}
	var leeks = {}
	var life  = {}

	for (var i in fight.data.leeks) {
		var leek = fight.data.leeks[i]
		leeks[leek.id] = {
			leek          : leek,
			alive         : true,
			name          : leek.name,
			level         : leek.level,
			dmg_in        : 0,
			dmg_out       : 0,
			heal_in       : 0,
			heal_out      : 0,
			kills         : 0,
			usedPT        : 0,
			usedPTperTurn : 0,
			usedPM        : 0,
			roundsPlayed  : 0,
			actionsWeapon : 0,
			actionsChip   : 0,
			invocation    : 0,
			resurrection  : 0,
			critical      : 0,
			crashes       : 0,
			life          : leek.life
		}
	}

	life[0] = {}
	for (var j in leeks) {
		life[0][j] = leeks[j].life
	}

	var currentPlayer = 0
	var currentTurn = 1

	for (var i in fight.data.actions) {

		var action = fight.data.actions[i]
		var type = action[0]

		switch (type) {
			case ACTION_NEW_TURN:
				life[action[1] - 1] = {}
				for (var j in leeks) {
					life[action[1] - 1][j] = leeks[j].life
				}
				currentTurn = action[1]
				break

			case ACTION_LEEK_TURN:
				leeks[action[1]].roundsPlayed++
				currentPlayer = action[1]
			break

			case ACTION_MP_LOST:
				leeks[action[1]].usedPM += action[2]
				break

			case ACTION_CARE:
				leeks[action[1]].heal_in += action[2]
				leeks[currentPlayer].heal_out += action[2]
				leeks[action[1]].life += action[2]
				break

			case ACTION_BOOST_VITA:
				leeks[action[1]].heal_in += action[2]
				leeks[currentPlayer].heal_out += action[2]
				leeks[action[1]].life += action[2]
				break

			case ACTION_LIFE_LOST:
				leeks[action[1]].dmg_in += action[2]
				leeks[currentPlayer].dmg_out += action[2]
				leeks[action[1]].life -= action[2]
				break

			case ACTION_TP_LOST:
				leeks[action[1]].usedPT += action[2]
				break

			case ACTION_PLAYER_DEAD:
				leeks[action[1]].alive = false
				var killer = action.length > 2 ? action[2] : currentPlayer
				if (killer in leeks) leeks[killer].kills++
				leeks[action[1]].life = 0
				break

			case ACTION_USE_WEAPON:
				leeks[action[1]].actionsWeapon++
				if (action[4] == 2) { // CC
					leeks[action[1]].critical++
				}
				break

			case ACTION_USE_CHIP:
				leeks[action[1]].actionsChip++
				if (action[4] == 2) { // CC
					leeks[action[1]].critical++
				}
				break

			case ACTION_SUMMON:
				leeks[action[1]].invocation++
				break

			case ACTION_RESURRECTION:
				leeks[action[2]].resurrection++
				break

			case ACTION_BUG:
				leeks[action[1]].crashes++
				break
		}
	}

	life[currentTurn] = {}
	for (var j in leeks) {
		life[currentTurn][j] = leeks[j].life
	}

	for (var i in leeks) {
		var leek = leeks[i]
		leek.usedPTperTurn = Math.round(leek.usedPT / leek.roundsPlayed * 10) / 10
		leek.summons = []
	}

	for (var i in leeks) {
		var leek = leeks[i]
		if (leek.leek.summon) {
			leeks[leek.leek.owner].summons.push(leek)
		}
	}

	statistics.leeks = leeks
	statistics.life = life
	statistics.team1 = []
	statistics.team2 = []

	for (var l in leeks) {
		var leek = leeks[l]
		if (leek.leek.summon) continue
		if (fight.winner == 0) {
			if (leek.leek.team == 1) statistics.team1.push(leek)
			else statistics.team2.push(leek)
		} else {
			if (leek.leek.team == fight.winner) statistics.team1.push(leek)
			else statistics.team2.push(leek)
		}
	}

	return statistics
}

LW.pages.report.graph = function(statistics, fight) {

	function getY(line, x) {

		var path = $('#chart .ct-chart .ct-series path')[line]

		x = Math.max(path.getPointAtLength(0).x, x)
		x = Math.min(path.getPointAtLength(path.getTotalLength()).x, x)

		var pos
		var p1 = 0
		var p2 = path.getTotalLength()
		var c
		var sec = 1000
		while (sec-- > 0) {
			c = (p1 + p2) / 2
			pos = path.getPointAtLength(c)
			if (Math.abs(x - pos.x) < 1) break
			if (pos.x > x) p2 = c
			else p1 = c
		}
		return pos.y
	}

	var update = function() {

		var series = []
		var data = []

		for (var i in statistics.leeks) {
			var leek = statistics.leeks[i]
			if (!leek.leek.summon) {
				data = []
				var thisTurn = 0
				for (var j = 0; j <= fight.report.duration; j++) {
					data.push(statistics.life[j][i])
				}
				series.push(data)
			}
		}

		var data = {
			labels: series[0].map(function(i, j) { return (j + 1) }),
			series: series
		}

		var smooth = localStorage['report/graph-type'] === 'smooth'

		var chart = new Chartist.Line('#chart .ct-chart', data, {
			showPoint: false,
			lineSmooth: smooth,
			height: 350,
			fullWidth: true,
			fullHeight: true
		})

		chart.on('draw', function(context) {
			if (context.type === 'line') {
				context.element.attr({
					style: 'stroke: ' + (LW.TEAM_COLORS[statistics.leeks[context.index].leek.team - 1])
				})
			}
		})

		var selected = null
		var tooltipLeek = -1
		var toolTip = $('#chart .ct-chart')
			.append('<div class="tooltip top"><div class="content"></div><div class="arrow"></div></div>')
			.find('.tooltip').hide()

		$('#chart .ct-chart').off('mouseenter', '.ct-line').on('mouseenter', '.ct-line', function() {
			$('#chart .ct-line').css('stroke-opacity', '0.3')
			$(this).css('stroke-opacity', '1').css('stroke-width', '4px')
			tooltipLeek = $(this).parent().index() - 2
			toolTip.show()
			selected = $(this).parent().index()
		})

		$('#chart-panel').off('mouseleave').on('mouseleave', function() {
			$('#chart .ct-line').css('stroke-opacity', '1').css('stroke-width', '3px')
			toolTip.hide()
		})

		$('#chart-panel').off('mousemove').on('mousemove', function(event) {

			if (tooltipLeek == -1) return ;

			var x = event.clientX - $('#chart-panel').offset().left

			var index = Math.floor(series[tooltipLeek].length * x / $('#chart').width())
			if (typeof series[tooltipLeek][index] === 'undefined') return ;

			var top = getY(tooltipLeek, x) - 55

			toolTip.css({
				left: x - toolTip.width() / 2 - 5,
				top: top
			})

			toolTip.find('.content').html(statistics.leeks[tooltipLeek].leek.name + '<br>' + series[tooltipLeek][index] + ' PV')
		})
	}

	var smooth = localStorage['report/graph-type'] === 'smooth'

	var updateSmooth = function() {

		if (smooth) {
			localStorage['report/graph-type'] = 'smooth'
			$('#graph-type-button img').attr('src', LW.staticURL + 'image/icon/graph_angular.png')
		} else {
			localStorage['report/graph-type'] = 'angular'
			$('#graph-type-button img').attr('src', LW.staticURL + 'image/icon/graph_smooth.png')
		}
	}

	$('#graph-type-button').click(function() {

		smooth = !smooth
		updateSmooth()
		update()
	})

	updateSmooth()
	update()

	LW.pages.report.updateGraph = update
}

LW.pages.report.highlightStatisticsTable = function(statistics) {

	var leeks = Object.keys(statistics.leeks).length
	var trs = $('#statistics-table tr.entity')

	for (var c = 2; c < 17; ++c) {

		var best = 0
		var bestl = null

		for (var l = 0; l < leeks; ++l) {
			var v = parseFloat($($(trs[l]).find('td')[c]).text().replace(/( |\u00a0)/g, ''))
			if (v > best) {
				best = v
				bestl = l
			}
		}
		$($(trs[bestl]).find('td')[c]).addClass('best')
	}
}

LW.pages.report.warningsErrors = function(leeks, logs) {

	var errors = []
	var warnings = []

	for (var a in logs) {
		for (var b in logs[a]) {

			var log = logs[a][b]
			var leek = log[0]
			var type = log[1]

			if (type == 2) {
				warnings.push({entity: leeks[leek].name, data: log[2]})
			} else if (type == 3) {
				errors.push({entity: leeks[leek].name, data: log[2]})
			}
		}
	}

	return {errors: errors, warnings: warnings}
}

LW.pages.report.expandTabs = function() {

	var update = function(panel) {
		var name = $(panel).attr('name')
		var collapsed = localStorage['report/' + name + '-collapsed'] === 'true'
		if (collapsed) {
			$(panel).find('.button.expand img').attr('src', LW.staticURL + 'image/icon/expand.png')
			$(panel).find('.content').hide()
		} else {
			$(panel).find('.button.expand img').attr('src', LW.staticURL + 'image/icon/collapse.png')
			$(panel).find('.content').show()
		}

		if (name == 'graph') LW.pages.report.updateGraph()
	}

	$('#report-page .panel[name]').each(function() {

		var name = $(this).attr('name')
		var panel = this

		$(this).find('.button.expand').click(function() {
			localStorage['report/' + name + '-collapsed'] = !(localStorage['report/' + name + '-collapsed'] === 'true')
			update(panel)
		})

		update(panel)
	})
}
