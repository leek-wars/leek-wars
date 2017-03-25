LW.pages.trophies.init = function(params, $scope, $page) {

	var farmerID = params.id

	_.get('trophy/get-farmer-trophies/' + farmerID + '/' + _.lang.current + '/' + LW.token(), function(data) {

		var trophies = {}
		var progressions = {}
		var totals = {}
		LW.trophyCategories.forEach(function(c) {
			trophies[c.id] = []
			progressions[c.id] = 0
			totals[c.id] = 0
		})
		for (var t in data.trophies) {
			var tr = data.trophies[t]
			if (tr != null) {
				trophies[tr.category].push(tr)
				totals[tr.category]++
				if (tr.unlocked) {
					progressions[tr.category]++
				}
			}
		}
		for (var c in trophies) {
			trophies[c].sort(function(a, b) {
				return a.index - b.index
			})
		}

		$scope.trophies = trophies
		$scope.categories = LW.trophyCategories
		$scope.progressions = progressions
		$scope.totals = totals
		$scope.count = data.count
		$scope.total = data.total

		if (farmerID == LW.farmer.id) {
			$scope.title = _.lang.get('trophies', 'title_me')
		} else {
			$scope.title = _.lang.get('trophies', 'title', data.farmer_name)
		}

		$page.render()

		if (farmerID == LW.farmer.id) {
			LW.setTitle(_.lang.get('trophies', 'title_me'))
		} else {
			LW.setTitle(_.lang.get('trophies', 'title_text', data.farmer_name))
		}
		LW.setMenuTab('trophies')
	})


}
