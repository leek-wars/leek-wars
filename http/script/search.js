LW.pages.search.init = function(params, $scope, $page) {

	var query = 'query' in params ? params.query : ''
	if (query == '-') query = ''
	var farmer = 'farmer' in params ? params.farmer : ''
	if (farmer == '-') farmer = ''
	var page = 'page' in params ? params.page : 1

	_.get('forum/search/' + query + '/' + farmer + '/' + page + '/' + LW.token(), function(data) {

		var results = data.results
		for (var r in results) {

			if (query != "" && results[r].title.toLowerCase().indexOf(query) != -1) {
				var text = results[r].title
				var pos = results[r].title.toLowerCase().indexOf(query)
				results[r].formatted_title = text.substring(0, pos) + "<b>" + text.substring(pos, pos + query.length) + "</b>" + text.substring(pos + query.length)
			} else {
				results[r].formatted_title = results[r].title
			}
			if (farmer == "") {
				results[r].formatted_farmer = results[r].fname
			} else {
				var text = results[r].fname
				var pos = text.toLowerCase().indexOf(farmer)
				results[r].formatted_farmer = text.substring(0, pos) + "<b>" + text.substring(pos, pos + farmer.length + 1) + "</b>" + text.substring(pos + farmer.length + 1)
			}

			// link
			var f = "<a href='/farmer/" + results[r].fid + "'>" + results[r].formatted_farmer + "</a>"
			var date = "<dark>" + _.format.date(results[r].date) + "</dark>"
			var category = "<a href='/forum/category-" + results[r].cid + "'>" + _.lang.get('forum', 'category_' + results[r].cname) + "</a>"
			results[r].link = _.lang.get('search', 'post_by_x_the_x_in_x', f, date, category)
		}

		$scope.query = query
		$scope.farmer_query = farmer
		$scope.results = data.results

		var urlQuery = query == '' ? '-' : query
		var farmerQuery = farmer == '' ? '-' : farmer
		$scope.pagination = _.pagination.create(page, data.pages, '/search/' + urlQuery + '/' + farmerQuery)

		$page.render()

		LW.setTitle(_.lang.get('search', 'title'))

		if (query != '' || farmer != '') {
			$('#search-page .results-wrapper').show()
		}

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
