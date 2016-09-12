LW.pages.notifications.init = function(params, $scope, $page) {

	_.get('notification/get-latest/500/' + LW.token(), function(data) {

		for (var n in data.notifications) {
			var notif = LW.notifications.getData(data.notifications[n])
			notif.date = LW.util.formatDuration(notif.date)
			notif.view = _.view.render('main.notification', notif)
			data.notifications[n] = notif
		}

		$scope.notifications = data.notifications
		$page.render()

		_.post('notification/read-all')
	})
}
