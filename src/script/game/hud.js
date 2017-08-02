var _settings = false
var _hoverEntity = null

var Hud = function() {

	$('#play-button').click(function() {
		if (game.paused)
			game.resume()
		else
			game.pause()
	})

	$('#speed-button').click(function() {
		game.speedUp()
	})

	var hud = this

	$('#fight-settings-button').click(function(e) {
		if (!_settings) {
			hud.updateSettings()
			$('#fight-settings').show()
			$('#tt_fight-settings-button').removeClass('disabled').addClass('disabled')
			$('#tt_fight-settings-button').hide()
			_settings = true
		} else {
			$('#fight-settings').hide()
			$('#tt_fight-settings-button').removeClass('disabled')
			_settings = false
		}
		e.stopPropagation()
	})

	$('#fight-settings').click(function(e) {
		e.stopPropagation()
	})
	$('#fight-size').change(function() {
		game.toggleSize()
		hud.updateSettings()
	})
	$('#fight-debug').change(function() {
		game.toggleDebug()
	})
	$('#fight-tactic').change(function() {
		game.toggleTactic()
	})
	$('#fight-cells').change(function() {
		game.toggleCells()
	})
	$('#fight-lifes').change(function() {
		game.toggleLifes()
	})
	$('#fight-discrete-pause').change(function() {
		game.toggleDiscretePause()
	})
	$('#fight-quality').change(function() {
		game.changeQuality($('#fight-quality').val())
	})

	var updateSoundSetting = function() {
		if (game.sound) {
			$('#sound-setting img').attr('src', LW.staticURL + 'image/icon/sound.png')
			$('#sound-setting .icon').text('volume_up')
			$('#sound-setting span').text(_.lang.get('fight', 'sound_activated'))
		} else {
			$('#sound-setting img').attr('src', LW.staticURL + 'image/icon/no_sound.png')
			$('#sound-setting .icon').text('volume_mute')
			$('#sound-setting span').text(_.lang.get('fight', 'sound_disactivated'))
		}
	}
	$('#sound-setting').click(function() {
		game.toggleSound()
		updateSoundSetting()
	})
	$('#quit-button').click(function() {
		game.showReport()
	})

	$('html').click(function() {
		$('#fight-settings').hide()
		$('#tt_fight-settings-button').removeClass('disabled')
		_settings = false
	})

	$('#logs').mouseenter(function() {
		$('#logs-wrapper').css('height', 500)
		$('#logs-wrapper2').css('height', 500)
	})
	$('#logs').mouseleave(function() {
		$('#logs-wrapper').css('height', 100)
		$('#logs-wrapper2').css('height', 100)
	})

	$('#progress-bar').mousemove(function(e) {
		var tooltip = $('#progress-bar-turn')
		var turn = 0
		var pos = (e.pageX - $(this).offset().left) / $(this).width()

		for (var i in game.turnPosition) {
			if (game.turnPosition.hasOwnProperty(i) && pos >= game.turnPosition[i]) {
				turn = i
			}
		}
		var margin = Math.min(Math.max((e.pageX - $(this).offset().left) - (tooltip.outerWidth() / 2), 0), $(this).outerWidth() - tooltip.outerWidth())
		tooltip.find('.content').text(_.lang.get('fight', 'turn_n', turn))
		tooltip.css('margin-left', margin)
	})

	$('#progress-bar').hover(function() {
		$('#progress-bar-turn').show()
	}, function() {
		$('#progress-bar-turn').hide()
	})

	var space = GROUND_PADDING_LEFT + GROUND_PADDING_RIGHT
	var padding = 30
	var width = space - padding

	this.currentLog = 0
	this.speedButtonFrame = 0
	this.speedButtonVisible = true

	this.updateSettings = function() {

		var parent = '#fight-settings-button'
		var tt = '#fight-settings'
		$(tt).css('top', $(tt).css('top', $(parent).offset().top - $(tt).outerHeight() - 15))
		$(tt).css('left', $(parent).offset().left + $(parent).outerWidth() / 2)
		$(tt).css('margin-left', - $(tt).outerWidth() / 2)
	}

	this.init = function() {
		// Timeline
		for (var e = 0; e < game.entityOrder.length; e++) {
			if (game.entityOrder[e].active) {
				this.addEntityBlock(game.entityOrder[e])
			}
		}
		// Life bar
		for (var t = 0; t < game.teams.length; ++t) {
			for (var e = 0; e < game.teams[t].length; ++e) {

				var entity = game.teams[t][e]
				var color = LW.TEAM_COLORS[t]
				var rgb = hexToRgb(color)
				var background = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.8)'
				var background2 = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.4)'
				background = "linear-gradient(to bottom, " + background2 + " 0%, " + background2 + " 30%," + background + " 100%)"

				$('#life-bar .wrapper').append("<div class='bar' id='entity-bar-" + entity.id +
					"' entity='" + entity.id + "' style='background: "
					+ background + "'></div>")

				LW.addTooltip("entity-bar-" + entity.id, entity.name)
			}
		}

		// Settings
		$('#fight-size').prop('checked', game.large);
		$('#fight-debug').prop('checked', game.debug);
		$('#fight-tactic').prop('checked', game.tactic);
		$('#fight-cells').prop('checked', game.showCells);
		$('#fight-lifes').prop('checked', game.showLifes);
		$('#fight-discrete-pause').prop('checked', game.discretePause);
		$('#fight-quality').val(game.quality);
		$('#progress-bar-turn').hide()

		updateSoundSetting();
	}

	this.addEntityBlock = function(entity) {

		var team = entity.team
		var left = team == 1

		var clazz = entity.summon ? 'summon' : ''
		var background = LW.TEAM_COLORS[entity.team - 1]
		var rgb = hexToRgb(background)
		background = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.4)'
		var border = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.6)'

		var backgroundCSS = "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 30%," + background + " 100%)"

		var div = "<div class='entity " + clazz + "' entity='" + entity.id + "' style='background: " + backgroundCSS + "; border-color: " + border + "'>"
		div += "<div class='bar'></div>"
		div += "<div class='image'></div>"
		div += "</div>"

		if (entity.summon) {
			$(div).insertAfter('#timeline .entity[entity=' + entity.summoner.id + ']')
		} else {
			$('#timeline').append(div)
		}

		if (entity.summon) {
			var url = LW.staticURL + 'image/bulb/' + entity.bulbName + '_front.png'
			$('.entity[entity=' + entity.id + '] .image').append("<img src='" + url + "' />")
		} else {
			LW.createLeekImage(entity.id, 1, entity.level, entity.skin, entity.hat, function(id, data) {
				$('.entity[entity=' + id + '] .image').html(data)
			})
		}

		$('#details [entity=' + entity.id + ']').remove()
		$('#details').append(this.createLeekDetails(entity))

		$('.entity[entity=' + entity.id + ']').mouseenter(function() {
			_hoverEntity = entity.id
			$('.entity-details[entity=' + entity.id + ']').css('margin-left', $(this).offset().left - $('#game').offset().left - 125).show()
		})
		.mouseleave(function() {
			_hoverEntity = null
			$('.entity-details[entity=' + entity.id + ']').hide()
		})
	}

	this.removeEntityBlock = function(entity) {

		$("#timeline .entity[entity=" + entity.id + ']').remove()

		// $("#entity-details-" + entity.id).remove();
	}

	this.createLeekDetails = function(leek) {

		var view = "<div entity='" + leek.id + "' class='entity-details'>";

		var avatar = LW.staticURL + 'image/avatar/' + leek.farmer + ".png";
		var noavatar = "this.onerror=null;this.src='" + LW.staticURL + "image/no_avatar.png';";

		view += "<img class='farmer-avatar' src='" + avatar + "' onerror=\"" + noavatar + "\"></img>";

		view += "<h2 class='name'>" + leek.name + "</h2>";
		view += "<div class='level'>" + _.lang.get('fight', 'leek_level', leek.level) + "</div>";
		view += "<div class='bar-wrapper'>";
		view += "<div class='bar'></div>";
		view += "</div>";

		view += "<div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/life.png'></img>";
		view += "<div class='stat life color-life'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/tp.png'></img>";
		view += "<div class='stat tp color-tp'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/mp.png'></img>";
		view += "<div class='stat mp color-mp'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/frequency.png'></img>";
		view += "<div class='stat frequency color-frequency'>" + leek.frequency + "</div>"

		view += "<br>";

		view += "<img src='" + LW.staticURL + "image/charac/small/strength.png'></img>";
		view += "<div class='stat strength color-strength'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/wisdom.png'></img>";
		view += "<div class='stat wisdom color-wisdom'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/agility.png'></img>";
		view += "<div class='stat agility color-agility'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/resistance.png'></img>";
		view += "<div class='stat resistance color-resistance'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/science.png'></img>";
		view += "<div class='stat science color-science'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/magic.png'></img>";
		view += "<div class='stat magic color-magic'></div>";

		view += "<br>";

		view += "<img src='" + LW.staticURL + "image/charac/small/absolute_shield.png'></img>";
		view += "<div class='stat absolute-shield'></div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/relative_shield.png'></img>";
		view += "<div class='stat relative-shield'>0%</div>";
		view += "<img src='" + LW.staticURL + "image/charac/small/damage_return.png'></img>";
		view += "<div class='stat damage-return'>0%</div>";
		view += "</div>";

		view += "<div class='effects'></div>"

		view += "</div>"

		return view
	}

	this.addLog = function(log) {
		var div = "<div class='action'>";

		for (var i = 0; i < log.length; i += 2) {
	    	var text = log[i];
			var color = log[i + 1];
	        div += "<span style='color: " + color + ";'>" + text + "</span>";
	    }
		div += "</div>"
		this.addActionInternal(div)
	}

	this.addPersonalLog = function(log) {

		var leek = game.leeks[log[0]];
		var color = (new Array("black", "orange", "red"))[log[1] - 1];
		if (log.length > 3) color = _.colorToHex(log[3])
		var message = log[2];

		var div = "<div class='action log'>"
	    div += "<pre style='color: " + color + ";'>" + "[" + leek.name + "] " + message + "</pre>";
		div += "</div>"

		this.addActionInternal(div)
	}

	this.addActionInternal = function(actionDiv) {
		var actions = $("#actions")
		actions.append(actionDiv)

		if (actions.height() > $('#left-part').height()) {
			actions.children().first().remove()
		}
		var margin = Math.min(0, $('#layers').height() - actions.height() - 120)
		actions.css('margin-top', margin)
	}

	this.refresh = function() {

		// Turn
		$('#turn').text(_.lang.get('fight', 'turn_n', game.turn));

		// Life bar
		var totalLife = game.leeks.reduce(function(total, e) {
			return total + (!e.summon ? e.life : 0)
		}, 0)

		for (var e in game.leeks) {

			var entity = game.leeks[e]

			$("#life-bar .bar[entity='" + entity.id + "']").toggleClass('dead', entity.dead)

			var size = Math.max(1, 500 * (entity.life / totalLife) - 3)
			$("#life-bar .bar[entity='" + entity.id + "']").width(size)

			LW.setTooltipContent($('#tt_entity-bar-' + entity.id), entity.name + ' (' + entity.life + ')')
		}
		// var team1Life = 0, team2Life = 0;
		// for (var i in game.leeks) {
		// 	if (game.leeks[i].team == 1) team1Life += game.leeks[i].life;
		// 	else if (game.leeks[i].team == 2) team2Life += game.leeks[i].life;
		// }
		// $('#team1-life').text(team1Life);
		// $('#team2-life').text(team2Life);

		for (var i = 0; i < game.leeks.length; i++) {

			var entity = game.leeks[i]

			var infos = $('#timeline .entity[entity=' + entity.id + ']')

			if (entity.dead) {
				infos.addClass('dead')
			} else {
				infos.removeClass('dead')
			}

			var current = entity.id == game.currentPlayer
			if (!current && infos.hasClass('current')) infos.removeClass('current')
			if (current && !infos.hasClass('current')) infos.addClass('current')

			infos.find('.bar').css('top', ((1 - entity.life / entity.maxLife) * 100) + "%")

			var color = entity.getLifeColor()
			infos.find('.bar').css('background', color)

			var hex = entity.getLifeColorRGB()
			var border = rgbToHex(Math.round(hex[0] * 0.7), Math.round(hex[1] * 0.7), Math.round(hex[2] * 0.7))
			infos.find('.bar').css('border-color', border)

			var detailsView = $('#details .entity-details[entity=' + game.leeks[i].id + ']')

			var life = entity.life / entity.maxLife
			detailsView.find('.bar').css('width', (life * 100) + "%")
			detailsView.find('.bar').css('background', color)
			detailsView.find('.life').text(entity.life + ' / ' + entity.maxLife)
			detailsView.find('.tp').text(entity.tp)
			detailsView.find('.mp').text(entity.mp)
			detailsView.find('.agility').text(entity.agility)
			detailsView.find('.strength').text(entity.strength)
			detailsView.find('.wisdom').text(entity.wisdom)
			detailsView.find('.resistance').text(entity.resistance)
			detailsView.find('.strength').text(entity.strength)
			detailsView.find('.science').text(entity.science)
			detailsView.find('.magic').text(entity.magic)
			detailsView.find('.absolute-shield').text(entity.absoluteShield)
			detailsView.find('.relative-shield').text(entity.relativeShield + "%")
			detailsView.find('.damage-return').text(entity.damageReturn + "%")
		}
	}

	this.addEntityEffect = function(effect, image) {
		$('#details .entity-details[entity=' + effect.target + ']').find('.effects').append("<img id='effect-" + effect.id + "' src='" + image + "'></img>");
	}

	this.removeLeekEffect = function(id) {
		$('#effect-' + id).remove();
	}

	this.draw = function() {

		/// Bottom part
		if (game.speed > 1 && !game.paused) {
			this.speedButtonFrame += dt;
			if (this.speedButtonFrame > 50) {
				this.speedButtonFrame = 0;
				this.speedButtonVisible = !this.speedButtonVisible * 1.0;
				$('#speed-button').css('opacity', this.speedButtonVisible);
			}
		}

		/// Debug
		if (game.debug) {
			$('#debug-particles').text(game.particles.particles.length);
			$('#debug-mouse').text("(" + game.mouseX + ", " + game.mouseY + ")");
			$('#debug-mouse-tile').text("(" + game.mouseTileX + ", " + game.mouseTileY + ")");
			$('#debug-mouse-cell').text(game.mouseCell);
			$('#debug-fps').text(game.fps + ", avg : " + game.avgFPS);
		}

		/// Mouse hover
		document.body.style.cursor = ''

		if (game.going_to_report) return null
		if (game.showLifes) {
			for (var i in game.leeks) {
				var leek = game.leeks[i];
				if (leek.isDead() || !leek.active) continue;
				leek.drawName();
				if (game.mouseCell == leek.cell || game.mouseCell == leek.cell - 35 || game.mouseCell == leek.cell - 17 || game.mouseCell == leek.cell - 18) {
					document.body.style.cursor = 'pointer';
				}
			}
		} else {
			for (var i in game.leeks) {
				var leek = game.leeks[i];
				if (leek.isDead() || !leek.active) continue;
				if (leek.id == _hoverEntity || (game.mouseCell == leek.cell || game.mouseCell == leek.cell - 35 || game.mouseCell == leek.cell - 17 || game.mouseCell == leek.cell - 18)) {
					leek.drawName();
					document.body.style.cursor = 'pointer';
				}
			}
		}
	}
}
