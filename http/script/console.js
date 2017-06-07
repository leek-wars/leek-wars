LW.pages.console.init = function(params, $scope, $page) {

	LW.setTitle(_.lang.get('console', 'title'))

	$page.render()

	var console = new ConsoleController($('.console'))
	console.focus()

	if (_.is_mobile()) {
		$('.console').height($(window).height() - $('#app-bar').height() - 10)
	} else {
		$('.console').height($(window).height() - 165)
	}
}
