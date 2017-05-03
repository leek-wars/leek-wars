var _trophy = false

LW.pages.tutorial.init = function(params, $scope, $page) {

	// Tableaux des opérateurs === et ==
	var values = ['false', 'true', '0', '1', '12', '" "', '"0"', '"1"', '"12"', '"lama"',
				  '"true"', '"false"', '[]', '[0]', '[1]', '[12]', '[1,2,3]', 'null']

	var equalEqual = [
		'X X  XX    XXX    ', // false
		' X XX  XXXX   XXX ', // true
		'X X  XX    XXX    ', // 0
		' X X   X XX   X   ', // 1
		' X  X   X X    X  ', // 12
		'X X  X      XX    ', // " "
		'X X   X      X    ', // "0"
		' X X   X      X   ', // "1"
		' X  X   X      X  ', // "12"
		' X X     X        ', // "lama"
		' X XX     X   XXX ', // "true"
		'X X        XXX    ', // "false"
		'X X  X     XX     ', // []
		'X X  XX    X X    ', // [0]
		' X X   X  X   X   ', // [1]
		' X  X   X X    X  ', // [12]
		' X        X     X ', // [1,2,3]
		'                 X', // null
	]

	$scope.values = values
	$scope.equalEqual = equalEqual
	$page.render()

	LW.setTitle(_.lang.get('tutorial', 'title'))

	$('#tutorial-page screen').each(function() {

		var content = $(this).html();
		var newHtml = "<img src='" + $(this).attr('src') + "'></img>";
		newHtml += "<div class='legend'>" + content + "</div>";

		$(this).html(newHtml);

		$(this).find('img').click(function() {
			if ($(this).hasClass('big')) {
				$(this).removeClass('big');
			} else {
				$(this).removeClass('big').addClass('big');
			}
		});
	});

	$('#tutorial-page code').each(function() {
		var content = $(this).text();
		$(this).html("<pre>" + content + "</pre>");

		LW.util.createCodeArea(content, $(this).find('pre')[0]);
	})
}

LW.pages.tutorial.scroll = function(scroll) {
	if (scroll > ($(document).height() - $(window).height()) - 300) {
		if (_trophy == false) {
			_.post('trophy/unlock', {trophy_id: 46}) // Trophée Instruit
			_trophy = true
		}
	}
}
