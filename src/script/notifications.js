LW.pages.notifications.init = function(params, $scope, $page) {

	_.get('notification/get-latest/500/' + LW.token(), function(data) {

		for (var n in data.notifications) {
			var notif = LW.notifications.getData(data.notifications[n])
			notif.formatted_date = LW.util.formatDuration(notif.date)
			notif.view = _.view.render('main.notification', notif)
			data.notifications[n] = notif
		}

		$scope.notifications = data.notifications
		$page.render()

		LW.setTitle(_.lang.get('notifications', 'title'))

		_.post('notification/read-all')
	})
}
