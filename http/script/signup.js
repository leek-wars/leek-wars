LW.pages.signup.init = function(params, $scope, $page) {

	var godfather = 'godfather' in params ? params.godfather : ''

	$scope.godfather = godfather
	$page.render()
	LW.setTitle(null)

	_.get('leek/get-count', function(data) {
		if (data.success) {	
			$('#leek-count').html(_.lang.get('signup', 'n_leeks_already', _.format.number(data.leeks)))
			$('#leek-count').show()
		}
	})
	
	$('#signup-form').submit(function(event) {

		var login = $('#signup-form input[name=login]').val()
		var leek = $('#signup-form input[name=leek_name]').val()
		var password1 = $('#signup-form input[name=password]').val()
		var password2 = $('#signup-form input[name=password2]').val()
		var email = $('#signup-form input[name=email]').val()
		var godfather = $('#signup-form input[name=godfather]').val()

		event.preventDefault();

		clearErrors()

		if (password1 != password2) {
			$('#signup-form input[name=password2]').addClass('error')
			$($('#signup-form .errors')[4]).append("<div class='error-msg'>" + _.lang.get('farmer', 'error_not_same_password') + "</div>")
			return false
		}
		
		_.post('farmer/register', {
			login: login,
			password: password1,
			email: email,
			leek_name: leek,
			godfather: godfather
		}, function(data) {
			
			if (data.success) {

				var popup = new _.popup.new('signup.success_popup', {login: login})
				popup.find('.action.ok').click(function() {
					LW.page('/login')
					popup.dismiss()
				})
				popup.show(event)
				
			} else {
				
				displayErrors(data.errors)
			}
		})
		
		return false
	})

	// Ranking
	_.get('ranking/get-home-ranking', function(data) {

		data.leeks[0].style = data.farmers[0].style = 'first'
		data.leeks[1].style = data.farmers[1].style = 'second'
		data.leeks[2].style = data.farmers[2].style = 'third'

		$('#leek-ranking').html(_.view.render('signup.leek_ranking', {
			leeks: data.leeks
		}))
		$('#farmer-ranking').html(_.view.render('signup.farmer_ranking', {
			farmers: data.farmers
		}))
	})
	
	$('#screenshots img').click(function(e) {
		
		$('#dark').show()
		$('#bigscreen').show()
		$('#bigscreen img').attr('src', $(this).attr('src').replace('_small', ''))
		
		$('#biglegend').text($(this).parent().find('.legend').text())
	})
	
	$('#screenshots').click(function(e) {
		e.stopPropagation();
	})
	
	$('html').click(function() {
		$('#dark').hide()
		$('#bigscreen').hide()
	})
	
	$('#bigscreen img').css('max-width', Math.min($(window).width() - 300, Math.max(1351, $(window).width())))
}

function clearErrors() {

	// Clear errors
	$('#signup-form input[type=text], #signup-form input[type=password]').each(function() {
		$(this).removeClass('error')
		if ($(this).val().length > 0) {
			$(this).removeClass('good')
			$(this).removeClass('error')
		}
	})

	$('#signup-form .errors').each(function() {
		$(this).empty()
	})

	$('#signup-errors').empty()
}

function displayErrors(errors) {

	$('#signup-form input[type=text], #signup-form input[type=password]').each(function() {
		$(this).removeClass('error')
		if ($(this).val().length > 0) {
			$(this).addClass('good')
		}
	})
	
	// Add
	for (var i in errors) {
					
		var inputNum = errors[i][0]
		var error = _.lang.get('farmer', 'error_' + errors[i][1], errors[i].length == 3 ? errors[i][2] : [])
		
		if (inputNum > -1) {
		
			$($('#signup-form input')[inputNum]).addClass('error')
			$($('#signup-form input')[inputNum]).removeClass('good')
			$($('#signup-form .errors')[inputNum]).append("<div class='error-msg'>" + error + "</div>")
			
		} else {
			
			$('#signup-errors').append("<div class='error-msg'>" + error + "</div>")
		}
	}
}
