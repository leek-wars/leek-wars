var _searchLeeks = true;
var _searchFarmers = true;
var _searchTeams = true;
var _query;

LW.pages.ranking.init = function(params, $scope, $page) {

	var fun = 'fun' in params ? params.fun : false

	if (fun) {

		_.get('ranking/fun/' + LW.token(), function(data) {

			for (var r in data.rankings) {
				data.rankings[r].ranking.ranking[0].style = 'first'
				data.rankings[r].ranking.ranking[1].style = 'second'
				data.rankings[r].ranking.ranking[2].style = 'third'
			}

			for (var rr in data.rankings) {
				for (var r in data.rankings[rr].ranking.ranking) {
					if (data.rankings[rr].ranking.ranking[r].id == LW.farmer.id) {
						data.rankings[rr].ranking.ranking[r].me = 'me'
					}
				}
			}

			$scope.fun = true
			$scope.rankings = data.rankings

			$page.render()

			LW.setTitle(_.lang.get('ranking', 'title'), _.lang.get('ranking', 'fun'))
			LW.setMenuTab('ranking')

			LW.pages.ranking.search()
		})

	} else {

		var category = 'category' in params ? params.category : 'leek'
		var order = 'order' in params ? params.order : 'talent'
		var page = 'page' in params ? params.page : 1

		_.get('ranking/get/' + category + '/' + order + '/' + page, function(data) {

			if (!data.success) {
				LW.error()
				return
			}

			if (page == 1) {
				data.ranking[0].style = 'first'
				data.ranking[1].style = 'second'
				data.ranking[2].style = 'third'
			}

			for (var r in data.ranking) {
				if (category == 'leek') {
					if (data.ranking[r].id in LW.farmer.leeks) {
						data.ranking[r].me = 'me'
					}
				} else if (category == 'farmer') {
					if (data.ranking[r].id == LW.farmer.id) {
						data.ranking[r].me = 'me'
					}
				} else if (category == 'team') {
					if (LW.farmer.team && data.ranking[r].id == LW.farmer.team.id) {
						data.ranking[r].me = 'me'
					}
				}
			}

			$scope.fun = false
			$scope.page = page
			$scope.category = category
			$scope.order = order
			$scope.ranking = data.ranking
			$scope.pagination = _.pagination.create(page, data.pages, '/ranking/' + category + '/' + order)
			$page.render()

			LW.setTitle(_.lang.get('ranking', 'title'), _.lang.get('ranking', 'n_' + category + 's', data.total))
			LW.setMenuTab('ranking')

			LW.pages.ranking.search()
			LW.pages.ranking.my_ranking()
		})
	}
}

LW.pages.ranking.leave = function() {
	this.searchPopup.remove()
}

LW.pages.ranking.search = function() {

	this.searchPopup = new _.popup.new('ranking.search_popup')
	var searchPopup = this.searchPopup
	searchPopup.setDismissable(true)

	var getDescription = function(type, level) {
		if (type == 'leek') {
			return _.lang.get('ranking', 'leek_level', level)
		} else if (type == 'farmer') {
			return _.lang.get('ranking', 'farmer')
		} else if (type == 'team') {
			return _.lang.get('ranking', 'team_level', level)
		}
	}

	var search = function() {

		if (_query.length > 0) $('#search-results-title').show();
		else $('#search-results-title').hide();

		_.post('ranking/search', {

			query: _query,
			search_leeks: _searchLeeks,
			search_farmers: _searchFarmers,
			search_teams: _searchTeams

		}, function(data) {
			$('#search-results').html("")
			for (var r in data.results) {
				var result = "<a href='/" + data.results[r].type + "/" + data.results[r].id + "'>"
				result += "<div class='result'>"
				result += "<div class='image'><img src='" + data.results[r].image + "' /></div>"
				result += "<div class='name'>" + _.protect(data.results[r].name) + "</div>"
				result += "<div class='level'>" + getDescription(data.results[r].type, data.results[r].level) + "</div>"
				result += "</div></a>"
				$('#search-results').append(result)
			}
			$('#search-results a').click(function(e) {
				e.preventDefault()
				LW.page($(this).attr('href'))
				searchPopup.dismiss()
			})
		})
	}

	searchPopup.find('#search-leeks-checkbox').change(function() {
		_searchLeeks = $(this).is(':checked')
		search()
	})

	searchPopup.find('#search-farmers-checkbox').change(function() {
		_searchFarmers = $(this).is(':checked')
		search()
	})

	searchPopup.find('#search-teams-checkbox').change(function() {
		_searchTeams = $(this).is(':checked')
		search()
	})

	searchPopup.find('#query').keyup(function() {
		_query = $(this).val()
		search()
	})

	$('#ranking-search').click(function(e) {

		searchPopup.show(e)
		searchPopup.find('#query').focus()
	})
}

LW.pages.ranking.my_ranking = function() {

	var category = this.scope.category
	var order = this.scope.order

	$('#ranking-page .me-button').click(function() {

		var url = ''

		if (category == 'leek') {

			var leek = $(this).attr('leek')
			url = 'ranking/get-leek-rank/' + leek + '/' + order

		} else if (category == 'farmer') {

			url = 'ranking/get-farmer-rank/' + LW.farmer.id + '/' + order

		} else if (category == 'team' && LW.farmer.team != null) {

			url = 'ranking/get-team-rank/' + LW.farmer.team.id + '/' + order
		}

		_.get(url, function(data) {

			if (data.success) {

				var page = 1 + Math.floor((data.rank - 1) / 50)
				LW.page('/ranking/' + category + '/' + order + '/page-' + page)
			}
		})
	})
}
