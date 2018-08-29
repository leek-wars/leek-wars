<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
			</div>
			<div class="tabs">
				<div id="play-pause-button" class="tab action" icon="pause">
					<img src="/image/icon/pause.png">
					<span>{{ $t('pause') }}</span>
				</div>
			</div>
		</div>

		<div v-if="!statistics" class="panel">
			<loader />
		</div>
		<div v-for="(category, category_id) in statistics" v-else :key="category_id" class="panel">
			<h2>{{ $t('category_' + category_id) }}</h2>
			<div class="category" category="{category_id}">
				<div v-for="(statistic, name) in category" v-if="statistic.visible" :key="name" :class="{private: statistic.private, show_today: statistic.show_today}" :statistic="name" :value="statistic.value" class="statistic">
					<div class="label">{{ $t(name) }}</div>
					<div class="value total">{{ statistic.value.toLocaleString('fr-FR') }}</div>
					<div v-if="statistic.show_today" class="value today">{{ statistic.today.toLocaleString('fr-FR') }}</div>
					<div class="type">{{ $t('total') }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	const FIGHT_CATEGORY = 2
	const AI_CATEGORY = 3
	const CODE_CATEGORY = 6

	@Component({ name: 'statistics', i18n: {} })
	export default class Statistics extends Vue {
		statistics: any = null
		created() {
			LeekWars.get<any>('statistic/get-all').then((data) => {
				LeekWars.setTitle(this.$i18n.t('statistics.title'))
				data.data.statistics[3].operations.value *= 1000000
				data.data.statistics[3].operations.speed *= 1000000
				data.data.statistics[3].operations.today *= 1000000
				data.data.statistics[3].operations.value += Math.floor(Math.random() * 1000000)
				data.data.statistics[3].operations.today += Math.floor(Math.random() * 1000000)
				data.data.statistics[3].operations.speed += Math.floor(Math.random() * 10000)
				this.statistics = data.data.statistics

				// $($(".category[category='3']").find('.statistic')[2]).after('<br/>')
				// LW.pages.statistics.languages_chart(data.data.statistics[CODE_CATEGORY])
				// LW.pages.statistics.ais_chart(data.data.statistics[AI_CATEGORY])
				// LW.pages.statistics.fight_type_chart(data.data.statistics[FIGHT_CATEGORY])
				// LW.pages.statistics.fight_context_chart(data.data.statistics[FIGHT_CATEGORY])
				// LW.pages.statistics.fight_categories()
				// LW.pages.statistics.interpolate_button(data.data.statistics)
				// LW.pages.statistics.statistic_click()
			})
		}
		beforeDestroy() {
			// clearInterval(this.interval)
		}
		resize() {
			// setTimeout(function() {
				// $('#statistics-page .chart').find('.ct-series path').css('stroke-width', '')
			// })
		}

		statistic_click() {
			// $('#statistics-page .statistic').click(function() {
			// 	var s = $(this)
			// 	if (!s.hasClass('show_today')) return null
			// 	if (s.find('.value.today').is(':visible')) {
			// 		s.find('.value.today').hide()
			// 		s.find('.value.total').show()
			// 		s.find('.type').text(_.lang.get('statistics', 'total'))
			// 	} else {
			// 		s.find('.value.today').show()
			// 		s.find('.value.total').hide()
			// 		s.find('.type').text(_.lang.get('statistics', 'today'))
			// 	}
			// })
		}

		interpolate_button() {
			// var _DELAY = 80
			// var self = this
			// var interpolated_stats = []
			// for (var c in statistics) {
			// 	for (var s in statistics[c]) {
			// 		if (!statistics[c][s].visible || !statistics[c][s].interpolate) continue
			// 		var element_total = $('#statistics-page .statistic[statistic="' + s + '"] .value.total')
			// 		var element_today = $('#statistics-page .statistic[statistic="' + s + '"] .value.today')
			// 		var speed = statistics[c][s].speed * (_DELAY / 1000)
			// 		if (speed > 0.002) {
			// 			interpolated_stats.push({element_total: element_total, element_today: element_today, speed: speed, value: statistics[c][s].value, today: statistics[c][s].today})
			// 		}
			// 	}
			// }
			// var play = function() {
			// 	localStorage['statistics/play'] = true
			// 	self.interval = setInterval(function() {
			// 		for (var s in interpolated_stats) {
			// 			var statistic = interpolated_stats[s]
			// 			statistic.value += statistic.speed
			// 			statistic.today += statistic.speed
			// 			statistic.element_total.html(Math.floor(statistic.value).toLocaleString('fr-FR'))
			// 			statistic.element_today.html(Math.floor(statistic.today).toLocaleString('fr-FR'))
			// 		}
			// 	}, _DELAY)
			// 	$('#play-pause-button img').attr('src', LW.staticURL + 'image/icon/pause.png')
			// 	$('#play-pause-button .icon').text('pause')
			// 	$('#play-pause-button span').text(_.lang.get('statistics', 'pause'))
			// }
			// var pause = function() {
			// 	localStorage['statistics/play'] = false
			// 	clearInterval(self.interval)
			// 	$('#play-pause-button img').attr('src', LW.staticURL + 'image/icon/play.png')
			// 	$('#play-pause-button .icon').text('play_arrow')
			// 	$('#play-pause-button span').text(_.lang.get('statistics', 'play'))
			// }
			// if (localStorage['statistics/play'] === 'false') {
			// 	pause()
			// } else {
			// 	play()
			// }
			// $('#play-pause-button').click(function() {
			// 	if (localStorage['statistics/play'] === 'true') {
			// 		pause()
			// 	} else {
			// 		play()
			// 	}
			// })
		}

		fight_categories() {
			// var cat = $('#statistics-page .category[category=' + FIGHT_CATEGORY + ']')
			// var g1 = $('<div class="group" />')
			// var g2 = $('<div class="group" />')
			// var stats = cat.find('.statistic')
			// for (var i = 0; i < 8; ++i) g1.append($(stats[i]))
			// for (var i = 8; i < stats.length; ++i) g2.append($(stats[i]))
			// // g1.before(cat.find('.chart.type'))
			// // g2.after(cat.find('.chart.context'))
			// cat.append(g1)
			// cat.append(g2)
			// g1.before(cat.find('.chart.type'))
			// g2.after(cat.find('.chart.context'))
		}

		fight_type_chart() {
			// var stats = {}
			// stats[_.lang.get('statistics', 'fight_solo')] = statistics.fight_solo.value
			// stats[_.lang.get('statistics', 'fight_farmer')] = statistics.fight_farmer.value
			// stats[_.lang.get('statistics', 'fight_team')] = statistics.fight_team.value
			// var chart = $('<div class="chart type">')
			// $('.category[category=' + FIGHT_CATEGORY + ']').append(chart)
			// new Chartist.Pie('#statistics-page .chart', {
			// 	labels: Object.keys(stats),
			// 	series: Object.values(stats)
			// }, {
			// donut: true,
			// donutSolid: true,
			// donutWidth: 38,
			// startAngle: 90,
			// showLabel: true
			// })
			// setTimeout(function() {
			// 	chart.find('.ct-series path').css('stroke-width', '')
			// }, 10)
			// chart.on('mouseenter', '.ct-series', function(event) {
			// 	$(this).addClass('selected')
			// }).on('mouseleave', '.ct-series', function(event) {
			// 	$(this).removeClass('selected')
			// })
		}

		fight_context_chart() {
			// var stats = {}
			// stats[_.lang.get('statistics', 'fight_garden')] = statistics.fight_garden.value
			// stats[_.lang.get('statistics', 'fight_test')] = statistics.fight_test.value
			// stats[_.lang.get('statistics', 'fight_tournament')] = statistics.fight_tournament.value
			// stats[_.lang.get('statistics', 'fight_challenge')] = statistics.fight_challenge.value
			// var chart = $('<div class="chart context">')
			// $('.category[category=' + FIGHT_CATEGORY + ']').append(chart)
			// new Chartist.Pie(chart[0], {
			// 	labels: Object.keys(stats),
			// 	series: Object.values(stats)
			// }, {
			// donut: true,
			// donutSolid: true,
			// donutWidth: 38,
			// startAngle: 90,
			// showLabel: true
			// })
			// setTimeout(function() {
			// 	chart.find('.ct-series path').css('stroke-width', '')
			// }, 10)
			// chart.on('mouseenter', '.ct-series', function(event) {
			// 	$(this).addClass('selected')
			// }).on('mouseleave', '.ct-series', function(event) {
			// 	$(this).removeClass('selected')
			// })
		}

		damage_chart() {
			// var stats = {}
			// var direct = statistics.damage.value - statistics.damage_poison.value - statistics.damage_return.value
			// var poison = statistics.damage_poison.value
			// var back = statistics.damage_return.value
			// var sum = direct + poison + back
			// direct = direct / sum
			// poison = poison / sum
			// back = Math.max(0.04, back / sum)
			// stats[_.lang.get('statistics', 'chart_damage_direct')] = direct
			// stats[_.lang.get('statistics', 'chart_damage_poison')] = poison
			// stats[_.lang.get('statistics', 'chart_damage_return')] = back
			// console.log(stats)
			// var chart = $('<div class="chart">')
			// chart.insertBefore($('.category[category=' + FIGHT_CATEGORY + ']'))
			// new Chartist.Pie('#statistics-page .chart', {
			// 	labels: Object.keys(stats),
			// 	series: Object.values(stats)
			// }, {
			// donut: true,
			// donutSolid: true,
			// donutWidth: 38,
			// startAngle: 90,
			// showLabel: true
			// })
			// setTimeout(function() {
			// 	chart.find('.ct-series path').css('stroke-width', '')
			// }, 10)
			// chart.on('mouseenter', '.ct-series', function(event) {
			// 	$(this).addClass('selected')
			// }).on('mouseleave', '.ct-series', function(event) {
			// 	$(this).removeClass('selected')
			// })
		}

		ais_chart() {
			// var v1 = statistics.ais_v1.value
			// var v2 = statistics.ais_v2.value
			// var sum = v1 + v2
			// v1 = v1 / sum
			// v2 = Math.max(0.04, v2 / sum)
			// var chart = $('<div class="chart">')
			// chart.insertBefore($('.category[category=' + AI_CATEGORY + ']'))
			// new Chartist.Pie('#statistics-page .chart', {
			// 	labels: ['V1', 'V2'],
			// 	series: [v1, v2]
			// }, {
			// donut: true,
			// donutSolid: true,
			// donutWidth: 38,
			// startAngle: 90,
			// showLabel: true
			// })
			// setTimeout(function() {
			// 	chart.find('.ct-series path').css('stroke-width', '')
			// }, 10)
			// chart.on('mouseenter', '.ct-series', function(event) {
			// 	$(this).addClass('selected')
			// }).on('mouseleave', '.ct-series', function(event) {
			// 	$(this).removeClass('selected')
			// })
		}

		languages_chart() {
			// var stats = {
			// 	'Java': statistics.lw_code_java,
			// 	'C++': statistics.lw_code_cpp,
			// 	'JavaScript': statistics.lw_code_javascript,
			// 	'PHP': statistics.lw_code_php,
			// 	'CSS': statistics.lw_code_css,
			// 	'HTML': statistics.lw_code_html,
			// }
			// var short_names = {'Java': 'Java', 'C++': 'C++', 'JavaScript': 'JS', 'PHP': 'PHP', 'CSS': 'CSS', 'HTML': 'HTML'}
			// var names = Object.keys(stats)
			// for (var n in names)
			// 	names[n] = short_names[names[n]]

			// var chart = $('<div class="chart languages">')
			// chart.insertBefore($('.category[category=' + CODE_CATEGORY + ']'))
			// new Chartist.Pie('#statistics-page .chart.languages', {
			// 	labels: names,
			// 	series: Object.values(stats)
			// }, {
			// donut: true,
			// donutSolid: true,
			// donutWidth: 38,
			// startAngle: 90,
			// showLabel: true
			// })
			// setTimeout(function() {
			// 	chart.find('.ct-series path').css('stroke-width', '')
			// }, 10)
			// var stats_elems = $('.category[category=' + CODE_CATEGORY + '] .statistic')
			// // Sort languages by lines of code
			// stats_elems.sort(function(a, b) {
			// 	var va = parseInt($(a).attr('value'))
			// 	if ($(a).attr('statistic').indexOf('lw_code') == -1) va = -1
			// 	var vb = parseInt($(b).attr('value'))
			// 	if ($(b).attr('statistic').indexOf('lw_code') == -1) vb = -1
			// 	return va < vb;
			// }).appendTo('.category[category=' + CODE_CATEGORY + ']');

			// var select_stat = function(stat) {
			// 	if (stat == -1) {
			// 		chart.find('.ct-series').removeClass('selected').removeClass('unselected')
			// 		stats_elems.removeClass('selected').find('.value').removeAttr('style');
			// 	} else {
			// 		chart.find('.ct-series').removeClass('selected').addClass('unselected')
			// 		$(chart.find('.ct-series')[stat]).addClass('selected').removeClass('unselected')
			// 		stats_elems.removeClass('selected').find('.value').removeAttr('style');
			// 		$(stats_elems[stat + 1]).addClass('selected')
			// 		var color = $(chart.find('.ct-series')[stat]).find('path').css('stroke')
			// 		$(stats_elems[stat + 1]).find('.value').css('color', color)
			// 	}
			// }
			// chart.on('mouseenter', '.ct-series', function(event) {
			// 	select_stat($(this).index())
			// }).on('mouseleave', '.ct-series', function(event) {
			// 	select_stat(-1)
			// })
			// stats_elems.on('mouseenter', function() {
			// 	select_stat($(this).index() - 1)
			// }).on('mouseleave', function() {
			// 	select_stat(-1)
			// })
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		padding-top: 10px;
		text-align: center;
	}
	h2 {
		font-family: 'Fjalla One', sans-serif;
		text-align: center;
		font-size: 28px;
	}
	h2:before, h2:after {
		height: 5px;
		width: 80px;
		vertical-align: middle;
		display: inline-block;
		content: "";
	}
	h2:before {
		background: linear-gradient(to left, #aaa, rgba(0,0,0,0));
		margin-right: 10px;
	}
	h2:after {
		background: linear-gradient(to right, #aaa, rgba(0,0,0,0));
		margin-left: 10px;
	}
	h2.blue {
		color: #0079DE;
	}
	h2.green {
		color: #0a0;
	}
	h2.red {
		color: #DC0006;
	}
	h2.orange {
		color: #FF7600;
	}
	h2.pink {
		color: #FF00A4;
	}
	.stats {
		padding-top: 10px;
		padding-bottom: 20px;
		text-align: center;
	}
	.category {
		display: inline-block;
		vertical-align: top;
		padding: 5px;
		margin-bottom: 10px;
	}
	.statistic {
		text-align: center;
		height: 100%;
		vertical-align: top;
		display: inline-block;
		padding: 6px 10px;
		margin: 10px;
		background: white;
		border-radius: 3px;
		border-bottom: 2px solid #ddd;
		padding-bottom: 4px;
		min-width: 120px;
	}
	.statistic.private {
		background: #eee;
	}
	.unit {
		display: inline-block;
		margin-left: 4px;
	}
	.type {
		font-size: 14px;
		color: #888;
		font-weight: 300;
		text-align: right;
		margin-top: -3px;
	}
	.value {
		font-size: 24px;
		display: block;
		color: #888;
		text-align: right;
	}
	.statistic.show_today {
		cursor: pointer;
	}
	.statistic.show_today:hover .value.total {
		color: #222;
	}
	.value.today {
		display: none;
		color: #00C0E5;
	}
	.label {
		text-align: left;
		font-size: 16px;
		color: #888;
		display: block;
		font-weight: 300;
		margin: 0 auto;
	}
	.chart {
		width: 190px;
		height: 190px;
		display: inline-block;
	}
	.chart .ct-label {
		font-size: 13px;
		fill: rgba(0,0,0,.7);
		font-weight: bold;
		pointer-events: none;
	}
	.chart .ct-series path {
		cursor: pointer;
		stroke-width: 38px;
		transition: stroke-width 0.1s ease;
	}
	.chart .ct-series.selected path {
		stroke-width: 48px;
	}
	.chart .ct-series-a path {
		stroke: #55E055;
	}
	.chart .ct-series-b path {
		stroke: #FFD45D;
	}
	.chart .ct-series-c path {
		stroke: #FF5C5C;
	}
	.chart .ct-series-d path {
		stroke:	#FF61C6;
	}
	.chart .ct-series-e path {
		stroke: #6179FF;
	}
	.chart .ct-series-f path {
		stroke: #65E5FF;
	}
	.category[category="6"] {
		max-width: 650px;
	}
	.category[category="6"] .statistic {
		width: 120px;
	}
	.group {
		max-width: 800px;
		display: inline-block;
		vertical-align: top;
	}
</style>