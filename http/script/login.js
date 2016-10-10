LW.pages.login.init = function(params, $scope, $page) {

	this.render()

	$('#login-form').submit(function() {

		var url = LW.dev ? 'farmer/login-token' : 'farmer/login'
		_.post(url, $('#login-form').serialize(), function(data) {
			if (data.success) {
				if (LW.dev) {
					localStorage['token'] = data.token
				}
				LW.connect(data.farmer, function() {
					LW.page('/')
				})
			} else {
				$('#error').hide().fadeIn()
			}
		}, false)

		return false
	})

	if (localStorage['keep'] == 'true') {
		$('#keep').attr("checked", true)
	}

	$('#keep').change(function() {
		localStorage['keep'] = $(this).is(':checked')
	})
}
