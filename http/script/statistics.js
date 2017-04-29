var CODE_CATEGORY = 6

LW.pages.statistics.init = function(params, $scope, $page) {

	var _DELAY = 40

	_.get('statistic/get-all', function(data) {

		LW.setTitle(_.lang.get('statistics', 'title'))
		data.statistics[3].operations.value *= 1000000
		data.statistics[3].operations.value += Math.floor(Math.random() * 1000000)
		$scope.statistics = data.statistics
		$page.render()

		$page.interval = setInterval(function() {
			for (var c in data.statistics) {
				for (var s in data.statistics[c]) {
					var statistic = data.statistics[c][s]
					var element = $('#statistics-page .statistic[statistic="' + s + '"] .value')
					var speed = statistic.speed * (_DELAY / 1000)
					if (speed > 0) {
						statistic.value += speed
						element.html(Math.floor(statistic.value).toLocaleString('fr-FR'))
					}
				}
			}
		}, _DELAY)

		$($("#statistics-page .category[category='3']").find('.statistic')[2]).after('<br/>')
		LW.pages.statistics.languages_chart(data.statistics[CODE_CATEGORY])
	})
}

LW.pages.statistics.leave = function() {
	clearInterval(this.interval)
}

LW.pages.statistics.languages_chart = function(statistics) {
	var stats = {
		'Java': statistics.lw_code_java,
	    'C++': statistics.lw_code_cpp,
	    'JavaScript': statistics.lw_code_javascript,
	    'PHP': statistics.lw_code_php,
	    'CSS': statistics.lw_code_css,
	    'HTML': statistics.lw_code_html,
	}
	var short_names = {'Java': 'Java', 'C++': 'C++', 'JavaScript': 'JS', 'PHP': 'PHP', 'CSS': 'CSS', 'HTML': 'HTML'}
	var names = Object.keys(stats)
	for (var n in names)
		names[n] = short_names[names[n]]

	var chart = $('<div id="chart">')
	chart.insertBefore($('.category[category=' + CODE_CATEGORY + ']'))
	new Chartist.Pie('#chart', {
		labels: names,
		series: Object.values(stats)
	}, {
	  donut: true,
	  donutSolid: true,
	  donutWidth: 40,
	  startAngle: 90,
	  showLabel: true
	});
	setTimeout(function() {
		chart.find('.ct-series path').css('stroke-width', '')
	}, 10)
	var stats_elems = $('.category[category=' + CODE_CATEGORY + '] .statistic')
	// Sort languages by lines of code
	stats_elems.sort(function(a, b) {
		var va = parseInt($(a).attr('value'))
		if ($(a).attr('statistic').indexOf('lw_code') == -1) va = -1
		var vb = parseInt($(b).attr('value'))
		if ($(b).attr('statistic').indexOf('lw_code') == -1) vb = -1
		return va < vb;
	}).appendTo('.category[category=' + CODE_CATEGORY + ']');

	var select_stat = function(stat) {
		if (stat == -1) {
			chart.find('.ct-series').removeClass('selected').removeClass('unselected')
			stats_elems.removeClass('selected').find('.value').removeAttr('style');
		} else {
			chart.find('.ct-series').removeClass('selected').addClass('unselected')
			$(chart.find('.ct-series')[stat]).addClass('selected').removeClass('unselected')
			stats_elems.removeClass('selected').find('.value').removeAttr('style');
			$(stats_elems[stat + 1]).addClass('selected')
			var color = $(chart.find('.ct-series')[stat]).find('path').css('stroke')
			$(stats_elems[stat + 1]).find('.value').css('color', color)
		}
	}
	chart.on('mouseenter', '.ct-series', function(event) {
		select_stat($(this).index())
	}).on('mouseleave', '.ct-series', function(event) {
		select_stat(-1)
	})
	stats_elems.on('mouseenter', function() {
		select_stat($(this).index() - 1)
	}).on('mouseleave', function() {
		select_stat(-1)
	})
}
