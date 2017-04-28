LW.pages.statistics.init = function(params, $scope, $page) {

	var _DELAY = 40

	_.get('statistic/get-all', function(data) {

		LW.setTitle(_.lang.get('statistics', 'title'))
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

LW.pages.statistics.leave = function() {
	clearInterval(this.interval)
}
	});
});
