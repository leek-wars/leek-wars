<template>
	<v-dialog>
		<div class='title'>Ajouter des points de capital</div>

		<div class='content'>

			<center><div class='capital rounded4'></div></center>

			<div v-for="c in ['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']" :key="c" class="charac">
				
				<v-tooltip bottom :open-delay="0" :close-delay="0">
					<img slot="activator" :src="'/image/charac/' + c + '.png'">
					<b>{{ $t('leek.' + c) }}</b><br />
					{{ $t('leek.' + c + '_description') }}
				</v-tooltip>
				<span :class="'stat color-' + c">{{ leek[c] }}</span>
				<span class='sup'></span>

				<div class='add-wrapper'>
					<v-tooltip bottom :open-delay="0" :close-delay="0">
						<span slot="activator" class='add' q='1'></span>
						{{ $t('leek.' + c + '_cost') }}
					</v-tooltip>
					<v-tooltip bottom :open-delay="0" :close-delay="0">
						<span slot="activator" class='add' q='10'></span>
						{{ $t('leek.' + c + '_cost_10') }}
					</v-tooltip>
					<v-tooltip bottom :open-delay="0" :close-delay="0">
						<span slot="activator" class='add' q='100'></span>
						{{ $t('leek.' + c + '_cost_100') }}
					</v-tooltip>
				</div>
			</div>
		</div>
		<div class='actions'>
			<div class='action dismiss'>{{ $t('cancel') }}</div>
			<div class='action reset'>{{ $t('reset') }}</div>
			<div class='action validate green'>{{ $t('validate') }}</div>
		</div>
	</v-dialog>
</template>

<script lang="ts">
	import { Leek } from '@/model/leek'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'capital-dialog' })
	export default class CapitalDialog extends Vue {
		@Prop() leek!: Leek

		capital() {

			// $('#capital').toggle(leek.capital > 0)
			// if (leek.capital > 0) $('#capital').addClass('green')

			// $('#menu .section[leek=' + leek.id + ']').attr('label', leek.capital == 0 ? '' : leek.capital)

			// var popup = new _.popup.new('leek.capital_popup', {leek: leek}, 800)

			// $('#capital').click(function(e) {

			// 	var costs = {
			// 		life : [
			// 			{step : 0, capital : 1, sup : 4},
			// 			{step : 1000, capital : 1, sup : 3},
			// 			{step : 2000, capital : 1, sup : 2},
			// 		],
			// 		strength : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		wisdom : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		agility : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		resistance : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		science : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		magic : [
			// 			{step : 0, capital : 1, sup : 2},
			// 			{step : 200, capital : 1, sup : 1},
			// 			{step : 400, capital : 2, sup : 1},
			// 			{step : 600, capital : 3, sup : 1},
			// 		],
			// 		frequency : [
			// 			{step : 0, capital : 1, sup : 1}
			// 		],
			// 		tp : [
			// 			{step : 0, capital : 30, sup : 1}, {step : 1, capital : 35, sup : 1},
			// 			{step : 2, capital : 40, sup : 1}, {step : 3, capital : 45, sup : 1},
			// 			{step : 4, capital : 50, sup : 1}, {step : 5, capital : 55, sup : 1},
			// 			{step : 6, capital : 60, sup : 1}, {step : 7, capital : 65, sup : 1},
			// 			{step : 8, capital : 70, sup : 1}, {step : 9, capital : 75, sup : 1},
			// 			{step : 10, capital : 80, sup : 1}, {step : 11, capital : 85, sup : 1},
			// 			{step : 12, capital : 90, sup : 1}, {step : 13, capital : 95, sup : 1},
			// 			{step : 14, capital : 100, sup : 1}
			// 		],
			// 		mp : [
			// 			{step : 0, capital : 20, sup : 1},
			// 			{step : 1, capital : 30, sup : 1},
			// 			{step : 2, capital : 40, sup : 1},
			// 			{step : 3, capital : 50, sup : 1},
			// 			{step : 4, capital : 60, sup : 1},
			// 			{step : 5, capital : 70, sup : 1},
			// 			{step : 6, capital : 80, sup : 1},
			// 			{step : 7, capital : 90, sup : 1},
			// 			{step : 8, capital : 100, sup : 1}
			// 		]
			// 	}

			// 	var bonuses
			// 	var capital
			// 	var base

			// 	var reset = function() {

			// 		bonuses = {
			// 			life: 0, strength: 0, wisdom: 0, agility: 0, resistance: 0,
			// 			frequency: 0, science: 0, magic: 0, tp: 0, mp: 0
			// 		}

			// 		base = {
			// 			life: leek.life - 100 - (leek.level - 1) * 3,
			// 			strength: leek.strength,
			// 			wisdom: leek.wisdom,
			// 			agility: leek.agility,
			// 			resistance: leek.resistance,
			// 			science: leek.science,
			// 			magic: leek.magic,
			// 			frequency: leek.frequency - 100,
			// 			tp: leek.tp - 10,
			// 			mp: leek.mp - 3
			// 		}

			// 		capital = leek.capital

			// 		popup.view.find('.sup').text('')
			// 		popup.view.find('.stat').each(function() {
			// 			$(this).text(leek[$(this).attr('stat')])
			// 		})

			// 		update()
			// 	}

			// 	var update = function() {

			// 		popup.view.find('.capital')
			// 			.html(_.lang.get('leek', 'n_capital', capital))
			// 			.attr('v', capital)

			// 		popup.view.find('.add').each(function() {

			// 			$(this).removeClass('locked')

			// 			var tmpCapital = capital
			// 			var tmpBonuses = _.clone(bonuses)

			// 			var charac = $(this).attr('stat')
			// 			var q = parseInt($(this).attr('q'))

			// 			var buttonCost = 0
			// 			var buttonBonus = 0

			// 			while (q > 0) {

			// 				var total = base[charac] + tmpBonuses[charac]
			// 				var step = 0

			// 				for (; step < costs[charac].length; ++step) {
			// 					if (costs[charac][step].step > total) break
			// 				}
			// 				step--

			// 				var cost = costs[charac][step].capital
			// 				var bonus = costs[charac][step].sup

			// 				if (cost > tmpCapital) {
			// 					$(this).addClass('locked')
			// 					$('#tt_' + $(this).attr('id')).text('')
			// 					break
			// 				}

			// 				q -= bonus
			// 				tmpBonuses[charac] += bonus
			// 				tmpCapital -= cost
			// 				buttonCost += cost
			// 				buttonBonus += bonus
			// 			}

			// 			$('#tooltips #tt_' + $(this).attr('id')).text(buttonCost + ' capital ⇔ ' + buttonBonus + ' ' + _.lang.get('leek', $(this).attr('stat')).toLowerCase())
			// 		})

			// 		$('#capital').toggle(capital > 0)
			// 		$('#menu .section[leek=' + leek.id + ']').attr('label', capital == 0 ? '' : capital)
			// 		$('#stats #capital').find('#capital-count').text(capital)
			// 	}

			// 	popup.view.find('.add').click(function() {

			// 		if ($(this).hasClass('locked')) {
			// 			return
			// 		}

			// 		var charac = $(this).attr('stat')
			// 		var q = parseInt($(this).attr('q'))

			// 		while (q > 0) {

			// 			// Get the step for the characteristic
			// 			var total = base[charac] + bonuses[charac]
			// 			var step = 0

			// 			for (; step < costs[charac].length; ++step) {
			// 				if (costs[charac][step].step > total) {
			// 					break
			// 				}
			// 			}
			// 			step--

			// 			var bonus = costs[charac][step].sup
			// 			var cost = costs[charac][step].capital

			// 			if (cost > capital) {
			// 				break
			// 			}

			// 			bonuses[charac] += bonus
			// 			q -= bonus
			// 			capital -= cost
			// 		}

			// 		popup.view.find('.stat[stat=' + charac + ']').next('.sup').text('(+' + bonuses[charac] + ')')
			// 		popup.view.find('.stat[stat=' + charac + ']').text(leek[$(this).attr('stat')] + bonuses[charac])

			// 		update()
			// 	})

			// 	popup.view.find('.reset, .dismiss').click(function() {
			// 		reset()
			// 	})
			// 	popup.ondismiss = function() {
			// 		reset()
			// 	}

			// 	popup.view.find('.validate').click(function() {

			// 		_.post('leek/spend-capital', {leek: leek.id, characteristics: JSON.stringify(bonuses)}, function(data) {

			// 			if (data.success) {

			// 				// Update leek characs
			// 				for (var stat in bonuses) {
			// 					leek[stat] += bonuses[stat]
			// 					$('#stats').find('[stat=' + stat + ']').text(leek[stat])
			// 				}

			// 				// Update capital
			// 				leek.capital = capital
			// 				$('#stats #capital').find('#capital-count').text(capital)
			// 				if (capital == 0) $('#stats #capital').hide()

			// 				popup.dismiss()


			// 			} else {
			// 				_.toast(data.error)
			// 			}
			// 		})
			// 	})

			// 	popup.show(e)

			// 	reset()
			// })
		}
	}
</script>

<style lang="scss" scoped>
	.content .charac {
		padding: 10px 0;
		width: 187px;
		display: inline-block;
	}
	.capital {
		color: white;
		font-size: 18px;
		background: #5FAD1B;
		display: inline-block;
		padding: 5px 10px;
	}
	.capital[v='0'] {
		background: #888;
	}
	.sup {
		color: #555;
	}
	.content img {
		float: left;
		width: 40px;
		margin-right: 10px;
	}
	.add {
		vertical-align: top;
		width: 20px;
		height: 27px;
		background-image: url('/image/add.png');
		cursor: pointer;
		opacity: 0.5;
		user-select: none;
	}
	.add[q='10'] {
		width: 25px;
		background-image: url('/image/add10.png');
	}
	.add[q='100'] {
		width: 30px;
		background-image: url('/image/add100.png');
	}
	.add.locked {
		cursor: auto;
		opacity: 0.2;
	}
	.add:hover {
		opacity: 1;
	}
	.add.locked:hover {
		opacity: 0.2;
	}
	.content .charac span {
		font-size: 19px;
		vertical-align: top;
		display: inline-block;
		margin-top: 2px;
		font-weight: 500;
	}
</style>