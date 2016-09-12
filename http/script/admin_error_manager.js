LW.pages.admin_error_manager.init = function(params, $scope, $page) {

	_.get('error/get-latest/$/$', function(data) {

		$scope.errors = data.errors
		$page.render()

		LW.setTitle("Gestionnaire d'erreur")

		$('#errors .error code').each(function() {
			var content = $(this).text()
			$(this).html("<pre>" + content + "</pre>")
			LW.util.createCodeArea(content, $(this).find('pre')[0])
		})

		$('.error .code').click(function(e) {

			_.get('ai/get/' + $(this).parent().attr('ai') + '/$', function(data) {

				var popup = new _.popup.new('admin_error_manager.ai_popup', {ai: data.ai}, 1000)
				popup.show(e)

				var content = popup.find('code').text()
				popup.find('code').html("<pre>" + content + "</pre>")
				LW.util.createCodeArea(content, popup.find('code').find('pre')[0])
			})
		})

		// var line = __ERROR_LINE

		// var elem = $($($('#codes td')[1]).find('.line-number span')[line - 1])
		// elem.css('color', 'red')
		// elem.css('font-weight', 'bold')
	})
}