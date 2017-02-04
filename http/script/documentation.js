var _query = ''

LW.pages.documentation.init = function(params, $scope, $page) {

	var urlItem = 'item' in params ? params.item : null

	_.get('function/get-categories', function(data) {

		var categories = data.categories
		var items = {}

		for (var c in categories) {
			items[categories[c].id] = []
		}

		var last = null
		var index = 1
		for (var f in LW.functions) {
			var item = LW.functions[f]
			item.type = 'function'
			item.real_name = item.name
			if (last != null && last.name == item.name) {
				item.real_name = last.name + '_' + (++index)
			} else {
				index = 1
			}
			items[LW.functions[f].category].push(item)
			last = item
		}
		for (var c in LW.constants) {
			var item = LW.constants[c]
			item.type = 'constant'
			item.real_name = item.name
			items[item.category].push(item)
		}

		$scope.categories = categories
		$scope.items = items
		$page.render()

		LW.setTitle(_.lang.get('documentation', 'title'))

		if (urlItem != null) {
			LW.pages.documentation.selectItem(urlItem)
		}

		$('#items-list .item').click(function() {

			LW.page('/help/documentation/' + $(this).attr('name'))
		})

		// Search
		$('#query').keyup(function() {

			_query = $.trim($('#query').val().toLowerCase())

			LW.pages.documentation.filter()
		})

		// Liens
		$('#items .item').each(function() {

			var text = $(this).html();
			var changed = false;
			var pos = 0;

			while ((pos = text.regexIndexOf(/[ \(>-]#/, pos + 1)) >= 0) {

				pos += 2;
				var size = 0;

				while (isNameChar(text.charAt(pos))) {
					pos++;
					size++;
				}

				if (size > 0) {
					var link = text.substring(pos - size, pos);

					text = text.slice(0, pos - size - 1) + text.slice(pos - size)
					text = text.insert(pos - 1, "'>" + link + "</a>");
					text = text.insert(pos - size - 1, "<a href='/help/documentation/");

					pos += 15;
					changed = true;
				}
			}

			if (changed) {
				$(this).html(text);
			}
		})

		// Click sur une référence
		$('.function a').click(function() {

			$('#query').val('');
			$('#items .function').show();
			$('#items-list div').show();
		});

		// Balises code
		$('#documentation-page code').each(function() {
			var content = $(this).text()
			$(this).html("<pre>" + content + "</pre>")

			LW.util.createCodeArea(content, $(this).find('pre')[0])
		})
	})
}

LW.pages.documentation.update = function(params) {

	LW.pages.documentation.selectItem(params.item)
}

LW.pages.documentation.resize = function() {

	$('#items-list').height($(window).height() - 190)
	$('#items').height($(window).height() - 190)
}

LW.pages.documentation.selectItem = function(item) {

	var element = $('#items .item[item=' + item.toLowerCase() + ']:visible')
	if (element.length) {
		var pos = element.position().top + $('#items').scrollTop();
		$('#items').scrollTop(pos - 80);
	}
}

function isNameChar(char) {
	return /[a-zA-Z0-9_]/.test(char);
}

String.prototype.insert = function( idx, s ) {
    return (this.slice(0,idx) + s + this.slice(idx));
};

LW.pages.documentation.filter = function() {

	$('#items .item').hide();
	$('#items-list .item').hide();

	$('#items .item').each(function() {

		var found = false;

		$(this).find('.searchable').each(function() {

			if ($(this).text().toLowerCase().indexOf(_query) != -1) {
				found = true;
			}
		});

		if (found) {
			$(this).show();
			$('#items-list .item[item=' + $(this).attr('item') + ']').show();
		}
	});
}

String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}
