LW.pages.activate.init = function(params, $scope, $page) {

	_.post('farmer/activate', {farmer_id: params.id, code: params.code}, function(data) {

		$scope.success = data.success
		$scope.error = data.error
		$page.render()
	})
}