var _tournament = null

LW.pages.tournament.init = function(params, $scope, $page) {

	var id = 'id' in params ? params.id : 0

	if (id == 0) {
		LW.error()
		return
	}

	_.get('tournament/get/' + id + '/' + LW.token(), function(data) {

		_tournament = data.tournament

		$scope.winner = data.tournament.winner
		$scope.sixteenths = data.tournament.rounds.sixteenths
		$scope.eighths = data.tournament.rounds.eighths
		$scope.quarters = data.tournament.rounds.quarters
		$scope.semifinals = data.tournament.rounds.semifinals
		$scope.finals = data.tournament.rounds.finals
		$scope.tournament = data.tournament
		$scope.title = _.lang.get('tournament', data.tournament.type, _.format.date(data.tournament.date))
		$page.render()

		LW.setTitle($scope.title)

		LW.pages.tournament.display()
		LW.pages.tournament.nextTime()
		LW.pages.tournament.comments()
		LW.pages.tournament.zoom()
	})
}

LW.pages.tournament.leave = function() {
	clearTimeout(this.timer)
}

LW.pages.tournament.display = function() {
	$('#tournament a').each(function() {
		if ($(this).attr('xlink:href') == 'null' || $(this).attr('xlink:href') == '') {
			$(this).find('rect').css('fill', '#f2f2f2').addClass('no-fight')
			$(this).find('image').attr('id', '').addClass('no-fight')
			$(this).find('image, rect').unwrap()
		}
	})
	$('#tournament a').click(function(e) {
		e.preventDefault()
		var link = this.getAttribute('xlink:href')
		LW.page(link)
	})
}

LW.pages.tournament.nextTime = function() {
	var self = this
	var update = function() {
		var time = _tournament.next_round - LW.time.get()
		if (time < 0) {
			var text = _.lang.get('tournament', 'next_round_in', _.lang.get('tournament', 'few_seconds'))
			$('#next-round-time').text(text)
			LW.setSubTitle(text)
		} else {
			var text = _.lang.get('tournament', 'next_round_in', FormatTime(time))
			$('#next-round-time').text(text)
			LW.setSubTitle(text)
			self.timer = setTimeout(update, 1000)
		}
	}
	if (!_tournament.finished && _tournament.next_round > 0) {
		update()
	}
}

LW.pages.tournament.comments = function() {
	var controller = new ChatController($('#comments-wrapper'), function(comment) {
		_.post('tournament/comment', {tournament_id: _tournament.id, comment: comment}, function(data) {
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
}

LW.pages.tournament.zoom = function() {
	$('#app-bar .action.zoom').click(function() {
		var t = $('#tournament')
		if (!t.hasClass('zoomed')) {
			if ($(window).height() > $(window).width()) {
				t.css('height', $(window).height() - $('#app-bar').height() - 20)
				$('#tournament-page .content').css('overflow-x', 'auto')
			}
			t.addClass('zoomed')
			$(this).find('.icon').text('zoom_out')
		} else {
			if ($(window).height() > $(window).width()) {
				t.css('height', 'auto')
				$('#tournament-page .content').css('overflow-x', 'hidden')
			}
			t.removeClass('zoomed')
			$(this).find('.icon').text('zoom_in')
		}
	})
}
