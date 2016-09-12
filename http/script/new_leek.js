LW.pages.new_leek.init = function(params, $scope, $page) {

	_.get('leek/get-next-price/$', function(data) {

		$scope.price = data.price
		$scope.leek_count = _.objectSize(LW.farmer.leeks)

		$page.render()

		LW.setTitle(_.lang.get('new_leek', 'title'))

		$('#create-leek').click(function() {

			var name = $('#leek-name').val()
		
			_.post('leek/create', {name: name}, function(data) {
				if (data.success) {
					document.location.href = '/leek/' + data.id
					// LW.page('/leek/' + data.id)
				} else {
					var error = _.lang.get('leek', 'error_' + data.error, data.params)
					_.log("error: " + error)
					$('#error').text(error)
				}
			})
		})
	})
}