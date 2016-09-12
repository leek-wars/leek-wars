LW.pages.help.init = function(params) {

	this.render()

	LW.setTitle(_.lang.get('help', 'title'))
	LW.setMenuTab('help')

	$('#show-didactitiel').click(function(e) {

		LW.didactitiel(e)
	})

	LW.pages.help.advanced()
}

LW.pages.help.advanced = function() {

	var expanded = false

	$('.advanced-button').click(function() {
		if (expanded) {
			$(this).find('img').attr('src', LW.staticURL + 'image/expand.png')
		} else {
			$(this).find('img').attr('src', LW.staticURL + 'image/collapse.png')
		}
		expanded = !expanded
		$('.advanced').toggle()
	})
}