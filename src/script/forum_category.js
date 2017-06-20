var _category = null

LW.pages.forum_category.init = function(params, $scope, $page) {

	var category = params.category
	var page = 'page' in params ? params.page : 1

	_.get('forum/get-topics/' + category + '/' + page + '/' + LW.token(), function(data) {

		_category = data.category
		_category.name = _category.team > 0 ? _category.name : _.lang.get('forum', 'category_' + _category.name)

		$scope.topics = data.topics
		$scope.category = data.category
		$scope.pagination = _.pagination.create(page, data.pages, '/forum/category-' + category)

		$page.render()

		LW.setTitle(_category.name)
		LW.setMenuTab('forum')

		LW.pages.forum_category.create()
		LW.pages.forum_category.search()
	})
}

LW.pages.forum_category.create = function() {

	var popup = new _.popup.new('forum_category.create_popup')

	$('#create').click(function(e) {
		popup.show(e)
	})

	popup.find('#send').click(function() {

		_.post('forum/create-topic', {

			category_id: _category.id,
			title: $('#topic-name').val(),
			message: $('#topic-message').val()

		}, function(data) {

			popup.dismiss()

			if (data.success) {
				LW.page("/forum/category-" + _category.id + "/topic-" + data.topic_id)
			} else {
				_.toast(data.error);
			}
		})
	})
}

LW.pages.forum_category.search = function() {

	var search = function() {
		var query = $('#query').val().replace(' ', '+');
		document.location.href = "/search/" + query;
	}

	$('#search-box #query').keyup(function(e) {
		if (e.keyCode == 13) {
			search()
		}
	})
	$('#search-box img').click(function() {
		search()
	});
}
