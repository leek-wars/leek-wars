LW.pages.admin_translation.init = function(params, $scope, $page) {

	_.get('lang/get-files/$/$', function(data) {

		$scope.files = data.files
		$scope.langs = _.lang.languages

		$page.render()

		LW.setTitle('Admin traduction')
		LW.setMenuTab('admin')
	})
}