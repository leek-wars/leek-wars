LW.pages.changelog.init = function(params, $scope, $page) {

	_.get('changelog/get/' + _.lang.current, function(data) {

		$scope.changelog = data.changelog
		$page.render()
	})
}