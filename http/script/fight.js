var canvas
var ctx
var game
var T, S

var _fullscreen = false

var _getDelay = 2000
var _error = false
var _load = true

var _id

LW.pages.fight.init = function(params, $scope, $page) {

	var id = params.id
	_id = id

	_.get('fight/get/' + id, function(data) {

		if (!data.success) {
			LW.error("Fight not found")
			return
		}

		var fight = data.fight

		$scope.fight = fight
		$scope.first_farmer = _.first(fight.farmers1).id
		$page.render()

		LW.setTitle(fight.team1_name + ' vs ' + fight.team2_name)

		var leeks = []
		for (var l in fight.leeks1) leeks[fight.leeks1[l].id] = fight.leeks1[l]
		for (var l in fight.leeks2) leeks[fight.leeks2[l].id] = fight.leeks2[l]

		LW.pages.fight.leekImages(leeks)

		canvas = $('#game-canvas').get(0)

		// Check the element is in the DOM and the browser supports canvas
		if (!canvas.getContext || typeof(__NO_HTML5) !== 'undefined') {

			$('#browser-list .browser').shuffle()
			$('#loading').hide()
			$('#browser').show()
			return
		}

		// Initaliase a 2-dimensional drawing context
		ctx = canvas.getContext('2d')

		T = new Textures()
		S = new Sounds()
		M = new Maps()

		// Create game
		game = new Game()

		if (fight.status == 1) {

			game.init(fight)

		} else {

			_load = true
			getFight()
		}

		$('#fullscreen-button').click(function() {
			LW.pages.fight.fullscreen()
		});

		// Commenatires
		$('#comment-send').click(function() {

			var comment = $('#comment-input').val()

			_.post('fight/comment', {fight_id: id, comment: comment}, function(data) {

				if (data.success) {
					$('#comment-input').val("")

					$('#comments').append(_.view.render('fight.comment', {
						comment: comment,
						farmer: LW.farmer,
						date: LW.time.get()
					}))
				}
			})
		})

		$('#comments .comment .text').each(function() {

			$(this).html(LW.smiley($(this).text()))
		})

		// Écoute de la position sur la file
		// LW.socket.send([FIGHT_LISTEN, id]);

		LW.pages.fight.file_input();
	})
}

LW.pages.fight.pause = function() {

	if (game) {
		game.pause()
		clearTimeout(game.reportTimer)
	}
	_load = false
}

LW.pages.fight.keydown = function(event) {

	if ($("#comment-input").is(":focus")) return null

	if (event.keyCode == 81) { // Q
		game.showReport()
		event.preventDefault()
	}

	if (event.keyCode == 80) { // P
		if (game.paused) {
			game.resume()
		} else {
			game.pause()
		}
		event.preventDefault();
	}

	if (event.keyCode == 83) { // S
		game.speedUp()
		event.preventDefault()
	}

	if (event.keyCode == 70) { // F

		LW.pages.fight.fullscreen()
		event.preventDefault()
	}
}

LW.pages.fight.resize = function() {

	if (game) {

		var windowWidth = $(window).width()
		var windowHeight = $(window).height()

		if (_fullscreen) {

			game.width = windowWidth
			game.height = windowHeight - 50

			$('#controls').addClass('large')

			$("#game").css("width", "100%")
			$("#game").css("height", "100%")

		} else {

			$('#controls').removeClass('large')

			game.width = $('#fight-page').width() - 15
			game.height = Math.ceil(game.width / RATIO)

			$("#fight").css("height", game.height)
			$("#game").css("width", 'auto')
			$("#game").css("height", 'auto')
		}

		$(canvas).attr("width", game.width)
		$(canvas).attr("height", game.height)
		$("#layers").css("height", game.height)

		game.ground.resize(game.width, game.height, _fullscreen, game.quality)
		game.setupMouseMove()

		game.requestPause = game.paused
		game.draw() // redraw
	}
}

LW.pages.fight.fullscreen = function() {

	if (_fullscreen) {

		_fullscreen = false
		_.fullscreen.exit()
		setTimeout(LW.pages.fight.resize, 100);

	} else {
		_fullscreen = true
		_.fullscreen.enter($('#game')[0], function() {
			setTimeout(LW.pages.fight.resize, 100);
		})
	}
}

LW.pages.fight.leekImages = function(leeks) {

	$('#fight-page .leek').each(function() {

		var id = parseInt($(this).attr('leek'))
		var image = $(this).find('.image')
		var leek = leeks[id]
		LW.createLeekImage(id, 0.6, leek.level, leek.skin, leek.hat, function(id, data) {
			image.html(data)
		})
	})
}

function getFight() {

	_.get('fight/get/' + _id, function(data) {

		if (!data.success) {
			game.error()
			return
		}

		if (data.fight.status >= 1) {

			game.init(data.fight)

		} else {

			var queue = data.fight.queue

			if (queue.position == -1) {

				$('.queue-position').show().text(_.lang.get('fight', 'generating'))

			} else {
				var message = _.lang.get('fight', 'position_in_queue', queue.position + 1, queue.total)

				$('.queue-position').show().text(message)
			}

			if (!_load) return false

			setTimeout(function() {
				if (!game.inited && !_error) {
					getFight();
				}
			}, _getDelay);

			_getDelay += 500;
			_getDelay = Math.min(4000, _getDelay);
		}
	})
}

function fightWaitingPosition(data) {
	// _log("Position : " + data[1] + " sur " + data[2]);
	//showQueueMessage(data[1], data[2]);
}

function showQueueMessage(position, queue) {
	if (position == -1) {

		$('.queue-position').show().text(LW.lang.get('fight', 'generating'));

	} else {
		var message = LW.lang.get('fight', 'position_in_queue', parseInt(position) + 1, queue);

		$('.queue-position').show().text(message);
	}
}

LW.pages.fight.file_input = function() {
	_.log("file_input")
	$('#fight-page #file-input').on('change', function() {
		var file = this.files[0]
		if (file) {
		    var reader = new FileReader();
		    reader.readAsText(file, "UTF-8");
		    reader.onload = function (evt) {
		    	var json = evt.target.result
		    	_.log(json)
		    	game.init({data: JSON.parse(json)})
		    }
		    reader.onerror = function (evt) {
		    	_.log("error reading file")
		    }
		}
	})
}
