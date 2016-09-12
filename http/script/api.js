LW.pages.api.init = function(params, $scope, $page) {

	_.get('service/get-all/' + LW.token(), function(data) {

		$scope.services = data.services
		$page.render()

		LW.setTitle('API')
	})
}
