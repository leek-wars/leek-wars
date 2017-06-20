LW.pages.line_of_sight.init = function(params, $scope, $page) {

	$page.render()

	var width = 40
	var height = 30
	var map = []
	
	for (var h = 0; h < height; ++h) {
		$('#map').append("<div class='row'></div>")
		var row = []
		for (var w = 0; w < width; ++w) {
			var obstacle = Math.random() > 0.8
			$('#map .row').last().append("<div class='cell" + (obstacle ? ' obstacle' : '') + "'></div>")
			row.push(obstacle ? 1 : 0)
		}
		map.push(row)
	}
	
	$('.cell').click(function() {
		
		$('.cell').removeClass('los').removeClass('red')
		
		var x = $(this).index()
		var y = $(this).parent().index()
		
		for (var h = 0; h < height; ++h) {
			for (var w = 0; w < width; ++w) {
				if (los(map, x, y, w, h)) {
					$($($('#map .row')[h]).find('.cell')[w]).addClass('los')
				}
			}
		}
		$($($('#map .row')[y]).find('.cell')[x]).addClass('red')
	})

	function los(map, x1, y1, x2, y2) {
			
		var a = Math.abs(y1 - y2)
		var b = Math.abs(x1 - x2)
		var dx = x1 > x2 ? -1 : 1
		var dy = y1 < y2 ? 1 : -1
		var path = []

		if (b == 0) {
			path.push(0, a + 1)
		} else {
			var d = a / b / 2
			var h = 0
			for (var i = 0; i < b; ++i) {
				var y = 0.5 + (i * 2 + 1) * d
				var ry = Math.ceil(y)
				if (ry == y) {
					path.push(h, y - h)
					h = y
				} else {
					path.push(h, ry - h)
					h = ry - 1
				}
			}
			path.push(h, a + 1 - h)
		}
		for (var p = 0; p < path.length; p += 2) {
			for (var i = 0; i < path[p + 1]; ++i) {
				if (map[y1 + (path[p] + i) * dy][x1 + (p / 2) * dx] == 1) {
					return false
				}
			}
		}
		return true
	}
}