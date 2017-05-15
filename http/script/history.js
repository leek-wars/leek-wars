LW.pages.history.init = function(params, $scope, $page) {

	var id = params.id

	_.get('history/get-leek-history/' + id, function(data) {

		$scope.fights = data.fights
		$page.render()
		LW.setTitle(_.lang.get('history', 'title'))

		LW.createLeekImage(data.leek.id, 0.8, data.leek.level, data.leek.skin, data.leek.hat, function(id, data) {
			$('#history-page .summary .image').html(data)
		})
	})
}
