LW.pages.console.init = function(params, $scope, $page) {

	LW.setTitle(_.lang.get('console', 'title'))

	$page.render()

	var console = new ConsoleController($('#page .leekscript-console'))
	console.focus()

	if (_.is_mobile()) {
		$('#page .leekscript-console').height($(window).height() - $('#app-bar').height() - 10)
	} else {
		$('#page .leekscript-console').height($(window).height() - 165)
	}
}
