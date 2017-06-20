LW.pages.bank.init = function(params, $scope, $page) {

	_.get('bank/get-packs', function(data) {

		$scope.packs = data.packs
		$page.render()

		LW.setTitle(_.lang.get('bank', 'title'))
	})
}