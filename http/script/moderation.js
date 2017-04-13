var _target
var _targetName
var _reason
var _reasonText
var _fault
var _parameter
var _data

LW.pages.moderation.init = function(params, $scope, $page) {

	_.get('moderation/get-reportings/' + LW.token(), function(data) {

		$scope.faults = data.faults
		$scope.thugs = data.thugs

		$page.render()
		LW.setTitle('Modération')
		LW.setMenuTab('moderation')

		$('.fault').click(function() {

			_fault = $(this).attr('id')
			_target = $(this).attr('target')
			_reason = $(this).attr('reason')
			_reasonText = $(this).find('.reason').text()
			_targetName = $(this).find('.target-name').text()
			_parameter = $(this).attr('parameter')
			if (_parameter == 'null') _parameter = null
			_data = $(this).attr('data')

			$('#warning-avatar').attr('src', $(this).find('img').attr('src'))
			$('#warning-target').text(_targetName)
			if (_target != 0) {
				$('#warning-target-link').attr('href', '/farmer/' + _target)
			}
			$('#warning .reason').text("Motif : " + _reasonText)
			$('#warning .details').text("")

			if (_reason == LW.WARNING.INCORRECT_LEEK_NAME) {
				$('#warning .details').html("Poireau : <a href='/leek/" + _parameter + "'>" + _data + "</a>")
			}

			if (_reason == LW.WARNING.FLOOD_CHAT || _reason == LW.WARNING.RUDE_CHAT) {
				$('#warning .details').html("Message : " + _.protect(_parameter))
			}

			$('.fault').removeClass('selected')
			$(this).addClass('selected')
		})

		$('.fault').first().click()

		var popup = new _.popup.new('moderation.warning_confirm_popup')

		$('#give-warning').click(function(e) {

			popup.find('.target').text(_targetName)
			popup.find('.reason').text(_reasonText)
			popup.find('.severity').text(parseInt($('#warning-severity').val()))
			popup.find('.message').text($('#warning-message').val())

			popup.show(e)
		})

		$('#archive-reporting').click(function(e) {

			_.post('moderation/archive', {target: _target, reason: _reason, parameter: _parameter}, function(data) {

				if (data.success) {
					_.toast(_.lang.get('moderation', 'reporting_deleted'))

					$('.fault.selected').remove()
					$('.fault').first().click()
				} else {
					_.toast(data.error)
				}
			})
		})

		popup.find('#send-warning').click(function() {

			var reason = _reason
			var severity = parseInt($('#warning-severity').val())
			var message = $('#warning-message').val()

			_.post('moderation/warn', {target: _target, reason: reason, message: message, severity: severity, parameter: _parameter}, function(data) {

				if (data.success) {
					_.toast(_.lang.get('moderation', 'warning_sent'))

					$('.fault.selected').remove()
					$('.fault').first().click()
					popup.dismiss()

				} else {
					_.toast(data.error)
				}
			})
		})

		$('.ban').click(function() {

			_.post('moderation/ban', {target: $(this).attr('target')}, function(data) {
				if (data.success) {
					_.toast("Éleveur banni")
				} else {
					_.toast(data.error)
				}
			})
		})

		if (!_.isTouchScreen()) {

			$(window).scroll(function() {

				var scroll = $(window).scrollTop()

				if (scroll < 80) {
					$('#warning-wrapper').css('position', 'absolute')
					$('#warning-wrapper').css('top', 55)
				} else {
					$('#warning-wrapper').css('position', 'fixed')
					$('#warning-wrapper').css('top', 20)
					$('#warning-wrapper').css('left', 'auto')
					$('#warning-wrapper').css('margin-top', 0)
				}
			})
		}
	})
}

LW.pages.moderation.resize = function() {
	$('#warning-wrapper').css('width', $('#warning-wrapper').parent('.column5 ').width())
}
