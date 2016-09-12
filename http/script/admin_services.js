LW.pages.admin_services.init = function(params, $scope, $page) {

	LW.setTitle("Services")

	_.get('service/get-all-admin/$/$', function(data) {

		$scope.services = data.services
		$page.render()
	})
}