LW.pages.translation.init = function(params, $scope, $page) {

	var file = params.file

	_.get('lang/get-file-translations/' + file + '/' + LW.token(), function(data) {

		$scope.file = data.file
		$scope.langs = _.lang.languages

		$page.render()

		LW.enlarge()

		var updateFocusout = function() {

			$('.translation').off('focusout')
			$('.translation').focusout(function() {

				_.log('Translation : key : ' + $(this).attr('key'))

				var value = $('<div>').html($(this).html().replace(/<br>\n/gi, "\n").replace(/<br>/gi, "\n")).text()
				var index = $(this).parent().index()

				_.post('lang/update-value', {
					file: file,
					key:  $(this).attr('key'),
					lang: $(this).attr('lang'),
					value: value,
					index: index
				})
			})
		}
		updateFocusout()

		$('.deploy').click(function() {

			var lang = $(this).parent().attr('lang')

			_.post('lang/deploy', {file: file, lang: lang, supertoken: '$'}, function(data) {
				if (data.success) {
					_.toast('Fichier déployé !')
				}
			})
		})

		$('.change-respo').click(function() {

			var lang = $(this).parent().parent().attr('lang')
			var respo = $(this).parent().find('input').val()
			var ref = $(this).parent().find('select').val()

			_.log("Change respo : " + respo + ', langue : ' + lang + ', ref : ' + ref + ' (file : ' + file + ')')

			_.post('lang/set-translator', {farmer_id: respo, lang: lang, file: file, reference: ref, supertoken: '$'}, function(data) {
				if (data.success) {
					_.reload()
				}
			})
		})

		var updateDragAndDrop = function() {
			 $("#translation-keys").tableDnD({
				dragHandle: ".arrows",
				onDrop: function(table, row) {

					var order = []

					$('#translation-keys tr').each(function() {
						if ($(this).attr('key'))
							order.push($(this).attr('key'))
					})
					order = JSON.stringify(order)

					_.log('Update order')
					_.post('lang/set-file-order', {order: order, file: file, supertoken: '$'})
				}
			})
		}
		updateDragAndDrop()

		var updateDelete = function() {
			$('.delete').off('click')
			$('.delete').click(function() {

				var key = $(this).parent().attr('key')

				_.post('lang/remove-value', {file: file, key: key, supertoken: '$'})

				$(this).parent().remove()
			})
		}
		updateDelete()

		$('#add-value').click(function() {

			_.log("add value")

			var key = $('#add-key').val()

			if ($.trim(key) != '') {

				var exists = false
				$('#translation-keys tr').each(function() {
					if ($(this).attr('key') == key) exists = true
				})

				if (!exists) {

					$('#add-key').val('')

					var line = $($('#translation-keys tr')[1]).clone()
					line.attr('key', key)
					line.find('.translation').attr('key', key)
					line.find('.translation').text('')
					line.find('.key').text(key)

					$('#translation-keys').append(line)
					updateDragAndDrop()
					updateDelete()
					updateFocusout()

					var index = $('#translation-keys tr').length - 1

					_.post('lang/add-value', {file: file, key: key, index: index, supertoken: '$'})

				} else {
					_.toast('La clé existe déjà !')
				}
			} else {
				_.toast('La clé est vide !')
			}
		})
	})
}
