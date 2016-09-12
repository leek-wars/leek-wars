LW.pages.search.init = function(params, $scope, $page) {

	_.log(params)

	var query = 'query' in params ? params.query : ''
	if (query == '-') query = ''
	var farmer = 'farmer' in params ? params.farmer : ''
	if (farmer == '-') farmer = ''
	var page = 'page' in params ? params.page : 1

	_.get('forum/search/' + query + '/' + farmer + '/' + page + '/$', function(data) {

		var results = data.results
		for (var r in results) {

			var pos = results[r].title.toLowerCase().indexOf(query)
			_.log(pos)

			if (query == "") {
				results[r].formatted_title = results[r].title
			} else {
				// results[r].formatted_title = results[r].title
				results[r].formatted_title = results[r].title.split(query).join(
					"<b>" + results[r].title.substring(pos, pos + query.length) + "</b>"
				)
			}
		}

		$scope.query = query
		$scope.farmer_query = farmer
		$scope.results = data.results

		var urlQuery = query == '' ? '-' : query
		var farmerQuery = farmer == '' ? '-' : farmer
		$scope.pagination = _.pagination.create(page, data.pages, '/search/' + urlQuery + '/' + farmerQuery)

		$page.render()

		LW.setTitle(_.lang.get('search', 'title'))

		// Recherche
		$('#search-box #query').keyup(function(e) {
			if (e.keyCode == 13) {
				LW.pages.search.search()
			}
		})
		$('#search-box img').click(function() {
			LW.pages.search.search()
		})

		$('#search-box-farmer #farmer-query').keyup(function(e) {
			if (e.keyCode == 13) {
				LW.pages.search.search()
			}
		})
		$('#search-box-farmer img').click(function() {
			LW.pages.search.search()
		})
	})	
}

LW.pages.search.search = function() {

	var query = $('#query').val().replace(/ /g, '+')
	if (query == "") query = "-";

	var farmer = $('#farmer-query').val().replace(/ /g, '+')

	if (farmer != "") {
		LW.page("/search/" + query + "/" + farmer)
	} else {
		LW.page("/search/" + query)
	}
}