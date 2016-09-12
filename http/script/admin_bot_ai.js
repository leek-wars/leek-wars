$(document).ready(function() {

	$('#code').each(function() {

		var content = $(this).text();
		$(this).html("<pre>" + content + "</pre>");

		_createCodeArea(content, $(this).find('pre')[0]);
	});

	$('#ais .ai').click(function() {

		$('#ais .ai').removeClass('selected');
		$(this).addClass('selected');
	});

	$('#validate').click(function() {

		var ai = $('#ais .ai.selected')
		if (ai.length == 0) {
			Toast("Pas d'IA sélectionnée !")
			return
		}
		var id = ai.attr('ai')
		_log(id)
		submitForm("admin_bot_ai", [
			['update_ai', id]
		])
	})
})