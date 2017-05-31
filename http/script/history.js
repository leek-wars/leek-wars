LW.pages.history.init = function(params, $scope, $page) {

	var id = params.id
	var type = params.type

	_.get('history/get-' + type + '-history/' + id, function(data) {

		// TODO
		data.entity = data.leek
		data.entity.name = "Gorglucks"

		$scope.fights = data.fights
		$scope.entity = data.entity

		$page.render()
		LW.setTitle(_.lang.get('history', 'title', data.entity.name))

		if (type == 'leek') {
			LW.createLeekImage(data.entity.id, 0.8, data.entity.level, data.entity.skin, data.entity.hat, function(id, data) {
				$('#history-page .summary .image').html(data)
			})
		}

		})
	})
}
