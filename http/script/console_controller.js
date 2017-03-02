var ConsoleController = function(console_element) {
	var self = this
	var lines = console_element.find('.lines')
	var input = console_element.find('input')
	var add_line_event = function(line) {
		line.on('mouseup', function(e) {
			_.log("line mouse up")
			e.stopPropagation()
			e.preventDefault()
			return false;
		})
	}
	console_element.find('.line').each(function() {
		add_line_event($(this))
	})
	console_element.on('mouseup', function() {
		input.focus()
	})
	input.on('keydown', function(e) {
		if (e.keyCode == 13) {
			var code = $(this).val()
			_.post('leekscript/execute', {code: code}, function(data) {
				if (data.success) {
					var line1 = $('<div class="line"><span class="arrow">►</span><span>' + _.protect(code) + '</span></div>')
					add_line_event(line1)
					lines.append(line1)
					if (!data.result) {
						var line2 = $('<div class="line result error">error</div>')
						add_line_event(line2)
						lines.append(line2)
					} else {
						data = JSON.parse(data.result)
						var time = data.ops + ' op' + (data.ops > 1 ? 's' : '') + ' | ' + Math.round(data.time / 1000) / 1000 + 'ms'
						var line2 = $('<div class="line result">' + _.protect(data.res) + '<span class="time">' + time + '</span></div>')
						add_line_event(line2)
						lines.append(line2)
					}
					self.scroll_down()
				} else {
					_.toast(data.error)
				}
				input.val('')
			})
		}
	})
	this.focus = function() {
		input.focus()
	}
	this.scroll_down = function() {
		console_element[0].scrollTop = console_element[0].scrollHeight
	}
}
