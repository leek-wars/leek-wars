LW.pages.login.init = function(params, $scope, $page) {

	this.render()
	LW.setTitle(_.lang.get('login', 'title'))

	$('#login-form').submit(function() {

		var url = LW.dev ? 'farmer/login-token' : 'farmer/login'
		var data = $('#login-form').serializeArray()
		if (data.length >= 3) {
			data[2].value = data[2].value === 'on'
		} else {
			data[2] = {name: 'keep_connected', value: false}
		}
		_.post(url, data, function(data) {
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
