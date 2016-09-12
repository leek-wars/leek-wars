LW.pages.admin_trophies.init = function(params, $scope, $page) {

	_.get('trophy/get-admin/' + _.lang.current + '/$/$', function(data) {

		$scope.data = data
		$page.render()
	})
}