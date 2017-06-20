LW.pages.forgot_password.init = function($params, $scope, $page) {

	$scope.state = $params.state
	if ('email' in $params) $scope.email = $params.email

	$page.render()

	$('#form').submit(function() {

		var email = $(this).get(0).email.value

		_.post('farmer/forgot-password', {email: email}, function(data) {
			if (data.success) {
				_.toast(_.lang.get('forgot_password', 'mail_sent', email))
				LW.page('/forgot-password/email-sent/' + email)
			} else {
				_.toast(data.error)
			}
		})
		
		return false
	})
	
	$('#reset-form').submit(function() {

		var password = $(this).get(0).password.value
		var password2 = $(this).get(0).password2.value

		if (password != password2) {
			_.toast(_.lang.get('farmer', 'error_not_same_password'))
			return false
		}

		_.post('farmer/forgot-password-change', {farmer_id: $params.id, new_password: password, code: $params.code}, function(data) {
			if (data.success) {
				_.toast(_.lang.get('forgot_password', 'password_changed'), function() {
					LW.page('/login')
				})
			}
		})
		
		return false
	})
}