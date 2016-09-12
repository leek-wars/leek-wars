LW.pages.general_help.init = function(params, $scope, $page) {

	$page.render()

	LW.setTitle(_.lang.get('general_help', 'title'))

	$('a[goto]').click(function() {
		$(window).scrollTop($($(this).attr('goto')).offset().top)
	})
}