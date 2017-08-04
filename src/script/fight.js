var canvas
var ctx
var game
var T, S

var _fullscreen = false
var _resources_initialized = false
var _getDelay = 1000
var _error = false
var _load = true

var _id

LW.pages.fight.init = function(params, $scope, $page) {

	var id = params.id
	_id = id

	var callback = function(data) {

		if (!data.success) {
			LW.error("Fight not found")
			return
		}

		var fight = data.fight

		$scope.fight = fight
		if (!_.isEmptyObj(fight.farmers1)) {
			$scope.first_farmer = _.first(fight.farmers1).id
		}

		fight.title = fight.team1_name + ' vs ' + fight.team2_name
		if (fight.type == LW.FIGHT_TYPE.BATTLE_ROYALE) {
			fight.title = _.lang.get('fight', 'battle_royale')
		}
		LW.setTitle(fight.title, _.format.date(fight.date))

		$page.render()

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

		if (!_resources_initialized) {
			T = new Textures()
			S = new Sounds()
			M = new Maps()
			_resources_initialized = true
		}

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
		var controller = new ChatController($('#comments-wrapper'), function(comment) {
			_.post('fight/comment', {fight_id: id, comment: comment}, function(data) {
				if (data.success) {
					$('#comments').append(_.view.render('main.comment', {
						comment: comment,
						farmer: LW.farmer,
						date: LW.time.get()
					}))
					LW.smileyElem($('#comments .comment').last().find('.text'))
				}
			})
		})
		$('#comments .comment .text').each(function() {
			$(this).html(LW.smiley(_.protect($(this).text())))
		})

		LW.pages.fight.file_input()
	}

	if (id == 'local') {
		var local_fight = {
			context: 3,
			date: 0,
			farmers1: {1: {id: 1}},
			farmers2: {1: {id: 1}},
			id: 0,
			leeks1: [],
			leeks2: [],
			report: null,
			status: 1,
			team1_name: "A",
			team2_name: "B",
			tournament: 0,
			type: 0,
			winner: 1,
			year: 2016,
			data: __FIGHT_DATA
		}
		_.log("Local fight: ", local_fight);
		callback({success: true, fight: local_fight})
	} else {
		_.get('fight/get/' + id, callback)
	}
}

LW.pages.fight.pause = function() {
	if (game) {
		game.pause()
		clearTimeout(game.reportTimer)
	}
	_load = false
}

LW.pages.fight.keydown = function(event) {

	if ($("#fight-page .chat-input-content").is(":focus")) return null

	if (event.keyCode == 81) { // Q
		if (_fullscreen) {
			LW.pages.fight.fullscreen()
		}
		game.showReport()
		event.preventDefault()
	}

	if (event.keyCode == 80) { // P
		if (game.paused) {
			game.resume()
		} else {
			game.pause()
		}
		event.preventDefault()
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

			game.width = $('#fight-page').width()
			if (!_.is_mobile()) game.width -= 15
			game.height = Math.ceil(game.width / RATIO)

			$("#fight").css("height", game.height)
			$("#game").css("width", 'auto')
			$("#game").css("height", 'auto')
		}

		var devicePixelRatio = window.devicePixelRatio || 1
		var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
								ctx.mozBackingStorePixelRatio ||
								ctx.msBackingStorePixelRatio ||
								ctx.oBackingStorePixelRatio ||
								ctx.backingStorePixelRatio || 1
		var ratio = devicePixelRatio / backingStoreRatio

		var oldWidth = game.width
		var oldHeight = game.height
		canvas.width = oldWidth * ratio
		canvas.height = oldHeight * ratio
		canvas.style.width = oldWidth + 'px'
		canvas.style.height = oldHeight + 'px'
		game.width = canvas.width
		game.height = canvas.height
		game.ratio = ratio
		$('#bg-canvas').css('width', oldWidth).css('height', oldHeight)
		$("#layers").css("height", oldHeight)

		game.ground.resize(game.width, game.height, _fullscreen, game.shadows)
		game.setupMouseMove()

		game.requestPause = game.paused
		game.draw() // redraw
	}
}

LW.pages.fight.fullscreen = function() {
	if (_fullscreen) {
		_fullscreen = false
		_.fullscreen.exit()
		setTimeout(LW.pages.fight.resize, 100)
	} else {
		_fullscreen = true
		_.fullscreen.enter($('#game')[0], function() {
			setTimeout(LW.pages.fight.resize, 100)
		})
	}
}

LW.pages.fight.leekImages = function(leeks) {

	$('#fight-page .leek').each(function() {

		var id = parseInt($(this).attr('leek'))
		var image = $(this).find('.image')
		var leek = leeks[id]
		LW.createLeekImage(id, 0.8, leek.level, leek.skin, leek.hat, function(id, data) {
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
			if (queue.position == -1 || queue.position == 0) {
				$('.queue-position').show().text(_.lang.get('fight', 'generating'))
			} else {
				var message = _.lang.get('fight', 'position_in_queue', queue.position + 1, queue.total)
				$('.queue-position').show().text(message)
			}

			if (!_load) return false

			setTimeout(function() {
				if (!game.initialized && !_error) {
					getFight();
				}
			}, _getDelay);

			_getDelay += 500;
			_getDelay = Math.min(4000, _getDelay);
		}
	})
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
