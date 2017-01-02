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
		$page.render()

		LW.pages.tournament.display()
		LW.pages.tournament.nextTime()
		LW.pages.tournament.comments()
	})
}

LW.pages.tournament.display = function() {

	$('#tournament a').each(function() {

		if ($(this).attr('xlink:href') == 'null' || $(this).attr('xlink:href') == '') {

			$(this).find('rect').css('fill', '#f2f2f2').addClass('no-fight')
			$(this).find('image').attr('id', '').addClass('no-fight')
			$(this).find('image, rect').unwrap()
		}
	})
}

LW.pages.tournament.nextTime = function() {

	var update = function() {

		var time = _tournament.next_round - LW.time.get()

		if (time < 0) {

			$('#next-round-time').text(_.lang.get('tournament', 'next_round_in', _.lang.get('tournament', 'few_seconds')))

		} else {

			$('#next-round-time').text(_.lang.get('tournament', 'next_round_in', FormatTime(time)))
			setTimeout(update, 1000)
		}
	}

	if (_tournament.next_round > 0) {
		update()
	}
}

LW.pages.tournament.comments = function() {

	$('#comment-send').click(function() {

		var comment = $('#comment-input').val()

		_.post('tournament/comment', {tournament_id: _tournament.id, comment: comment}, function(data) {

			if (data.success) {
				$('#comment-input').val("")

				$('#comments').append(_.view.render('main.comment', {
					comment: comment,
					farmer: LW.farmer,
					date: LW.time.get()
				}))
			}
		})
	})

	$('#comments .comment .text').each(function() {
		$(this).html(LW.smiley(_.protect($(this).text())))
	})
}
