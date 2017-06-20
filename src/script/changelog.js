LW.pages.changelog.init = function(params, $scope, $page) {

	_.get('changelog/get/' + _.lang.current, function(data) {

		for (var d in data.changelog) {
			var changes_data = _.lang.get('changelog', data.changelog[d].data)
			data.changelog[d].changes = []
			var changes_array = changes_data.split("\n")
			for (var c in changes_array) {
				var change = changes_array[c].replace('# ', '')
				if (change.length > 0) {
					data.changelog[d].changes.push(change)
				}
			}
		}

		$scope.changelog = data.changelog
		$page.render()
		LW.setTitle(_.lang.get('changelog', 'title'))
	})
}
