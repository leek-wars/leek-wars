<template>
	<div>
		@view (test_popup)

		<div class="title">{{ $t('run_test') }}</div>

		<div class="content">
			<div class="tabs">
				<div class="tab" tab="scenario">{{ $t('test_scenario') }}</div>
				<div class="tab" tab="leeks">{{ $t('test_leeks') }}</div>
				<div class="tab" tab="maps">{{ $t('test_map') }}</div>
			</div>
			<div tab="scenario" class="view">
				<div class="column lateral-column">
					<h4>Scénarios</h4>
					<div class="items scenarios"></div>
					<div class="item add">✚ Ajouter</div>
				</div>
				<div class="column column-scenario">
					<div class="title">Poireaux</div>
					<div class="team team1">
						<div class="leeks"></div>
						<div class="add">+</div>
					</div>
					<div class="vs">VS</div>
					<div class="team team2">
						<div class="leeks"></div>
						<div class="add">+</div>
					</div>
					<br>
					<div class="title">Map</div>
					<div class="map-container">
						<div class="map">
							<img src="/image/map_icon_random.png">
							<div class="name"></div>
						</div>
					</div>
				</div>
			</div>

			<div tab="leeks" class="view">
				<div class="column lateral-column">
					<h4>Poireaux</h4>
					<div class="items leeks"></div>
					<div class="item add">✚ Ajouter</div>
				</div>
				<div class="column leek-column">
					<div class="title name"></div>
					<div class="image card"></div>
					<table class="stats">
						<tr><td>
							<div class="stat">
								<div id="lifespan">
									<img src="/image/charac/life.png">
									<span class="color-life" stat="life"></span>
								</div>
							</div>
						</td><td>
							<div class="stat">
								<div id="sciencespan">
									<img src="/image/charac/science.png">
									<span class="color-science" stat="science"></span>
								</div>
							</div>
						</td></tr>
						<tr><td>
							<div class="stat">
								<div id="strengthspan">
									<img src="/image/charac/strength.png">
									<span class="color-strength" stat="strength"></span>
								</div>
							</div>
						</td><td>
							<div class="stat">
								<div id="magicspan">
									<img src="/image/charac/magic.png">
									<span class="color-magic" stat="magic"></span>
								</div>
							</div>
						</td></tr>
						<tr><td>
							<div class="stat">
								<div id="wisdomspan">
									<img src="/image/charac/wisdom.png">
									<span class="color-wisdom" stat="wisdom"></span>
								</div>
							</div>
						</td><td>
							<div class="stat">
								<div id="frequencyspan">
									<img src="/image/charac/frequency.png">
									<span class="color-frequency" stat="frequency"></span>
								</div>
							</div>
						</td></tr>
						<tr><td>
							<div class="stat">
								<div id="agilityspan">
									<img src="/image/charac/agility.png">
									<span class="color-agility" stat="agility"></span>
								</div>
							</div>
						</td><td>
							<div class="stat">
								<div id="tpspan">
									<img src="/image/charac/tp.png">
									<span class="color-tp" stat="tp"></span>
								</div>
							</div>
						</td></tr>
						<tr><td>
							<div class="stat">
								<div id="resistancespan">
									<img src="/image/charac/resistance.png">
									<span class="color-resistance" stat="resistance"></span>
								</div>
							</div>
						</td><td>
							<div class="stat">
								<div id="mpspan">
									<img src="/image/charac/mp.png">
									<span class="color-mp" stat="mp"></span>
								</div>
							</div>
						</td></tr>
					</table>
					<br><br>
					<div class="title">Puces</div>
					<div class="chips">
						<div class="container"></div>
						<div class="add">+</div>
					</div>
					<br>
					<div class="title">Armes</div>
					<div class="weapons">
						<div class="container"></div>
						<div class="add">+</div>
					</div>
				</div>
			</div>
			<div tab="maps" class="view">
				<div class="column lateral-column">
					<h4>Maps</h4>
					<div class="items maps"></div>
					<div class="item add">✚ Ajouter</div>
				</div>
				<div class="column map-column">
					<div class="title name"></div>
					<div class="map" oncontextmenu="return false;">
						<div class="map-wrapper"></div>
					</div>
					<div class="buttons">
						<div class="button clear">❌ Clear</div>
						<div class="button random">❓ Random</div>
					</div>
					<div class="instructions">
						<div class="instruction">✔ Clic gauche pour ajouter ou retirer des obstacles</div>
						<div class="instruction">✔ Clic droit pour sélectionner les cellules de départ</div>
					</div>
				</div>
			</div>
		</div>

		<div class="actions">
			<div id="cancel-test" class="dismiss">❌ {{ $t('test_cancel') }}</div>
			<div id="launch" class="green">▶ {{ $t('test_validate') }}</div>
		</div>
		@endview

		@view (input_popup)
		<div class="title">{title}</div>
		<div class="content">
			<input type="text" class="input" value="{input}">
		</div>
		<div class="actions">
			<div class="dismiss">{{ $t('cancel') }}</div>
			<div class="validate green">{validate}</div>
		</div>
		@endview

		@view (folder_content)
		<div class="folder-content" folder="{folder.id}">
			@if (folder.contents.length == 0)
			<div class="empty">
				<img src="/image/empty.png">
				<br>
				<span class="message">{{ $t('empty_folder') }}</span>
			</div>
			@else
			@foreach (item in folder.contents)
			<div class="item">
				{item.name}
			</div>
			@end
			@end
		</div>
		@endview

		@view (map_popup)
		<div class="title">Sélectionnez une carte</div>
		<div class="content">
			<div class="map" map="-1">
				<img src="/image/map_icon_random.png">
				<div class="name">Random</div>
			</div>
			@foreach (map in maps)
			<div class="map" map="{map.id}">
				<img src="/image/map_icon.png">
				<div class="name">{map.name}</div>
			</div>
			@end
		</div>
		<div class="actions">
			<div class="dismiss">{{ $t('cancel') }}</div>
			<div class="validate green">Choisir</div>
		</div>
		@endview

		@view (editor_leek_popup)
		<div class="title">Sélectionnez une poireau</div>
		<div class="content">
			@foreach (leek in leeks)
			<div class="leek card {leek.real ? &quot;real&quot;: &quot;&quot;}" leek="{leek.id}">
				<div class="image"></div>
				<div class="name">{leek.name}</div>
			</div>
			@end
		</div>
		@endview

		@view (editor_ai_popup)
		<div class="title">Sélectionnez une IA</div>
		<div class="content">
			@foreach (ai in ais)
			<div class="ai" ai="{ai.id}">
				<div class="image"></div>
				<div class="name">{ai.path}</div>
			</div>
			@end
		</div>
		@endview

		@view (editor_chips_popup)
		<div class="title">Sélectionnez une puce</div>
		<div class="content">
			@foreach (chip in chips)
			<img class="chip" chip="{chip.id}" src="/image/chip/small/{chip.name}.png">
			@end
		</div>
		@endview

		@view (editor_weapons_popup)
		<div class="title">Sélectionnez une arme</div>
		<div class="content">
			@foreach (weapon in weapons)
			<img class="weapon" weapon="{weapon.id}" src="/image/weapon/{weapon.name}.png">
			@end
		</div>
		@endview
	</div>
</template>

<script>
	import { AI } from '@/model/ai'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { Editor } from './editor'

	@Component({})
	export default class EditorText extends Vue {

		// Settings de test
		_testPopup = null
		_testLeek = null
		_testMode = 'solo'
		_testAI = null
		_testEnemies = null

		created() {

		// 	for (var l in LW.farmer.leeks) {
		// 		LW.farmer.leeks[l].real = true
		// 	}

		// 	var data = {
		// 		ais: ais
		// 	}
		// 	_testPopup = new _.popup.new('editor.test_popup', data, 1024)
		// 	_testPopup.setDismissable(true)

		// 	_testPopup.find('.tab').click(function() {
		// 		_testPopup.find('.view').hide()
		// 		_testPopup.find('.tab').removeClass('selected')
		// 		$(this).addClass('selected')
		// 		_testPopup.find('.view[tab=' + $(this).attr('tab') + ']').css('display', 'flex')
		// 	})

		// 	var domingo = {id: -1, name: "Domingo", bot: true, level: 150, skin: 1, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: "50 to 1500", wisdom: 0, agility: 0,
		// 		resistance: 0, science: 0, magic: 0
		// 	}
		// 	var tisma = {id: -2, name: "Tisma", bot: true, level: 150, skin: 2, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: 0, wisdom: "50 to 1500", agility: 0,
		// 		resistance: 0, science: 0, magic: 0
		// 	}
		// 	var rioupi = {id: -3, name: "Rioupi", bot: true, level: 150, skin: 3, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: 0, wisdom: 0, agility: "50 to 1500",
		// 		resistance: 0, science: 0, magic: 0
		// 	}
		// 	var guj = {id: -4, name: "Guj", bot: true, level: 150, skin: 4, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: 0, wisdom: 0, agility: 0,
		// 		resistance: "50 to 1500", science: 0, magic: 0
		// 	}
		// 	var hachess = {id: -5, name: "Hachess", bot: true, level: 150, skin: 5, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: 0, wisdom: 0, agility: 0,
		// 		resistance: 0, science: "50 to 1500", magic: 0
		// 	}
		// 	var betalpha = {id: -6, name: "Betalpha", bot: true, level: 150, skin: 6, hat: null,
		// 		tp: "10 to 20", mp: "3 to 8", frequency: 100,
		// 		life: "100 to 3000", strength: 0, wisdom: 0, agility: 0,
		// 		resistance: 0, science: 0, magic: "50 to 1500"
		// 	}
		// 	var _bots = [domingo, tisma, rioupi, guj, hachess, betalpha]
		// 	var _scenarios = {}
		// 	var _maps = {}
		// 	var _leeks = {}

		// 	/*
		// 	* Scenarios
		// 	*/
		// 	var _current_scenario = null
		// 	var generate_default_scenarios = function(scenarios) {
		// 		for (var l in LW.farmer.leeks) {
		// 			var ai = editors[_leek_ais[l]]
		// 			if (!ai) continue
		// 			var ais = {}
		// 			ais[l] = {id: ai.id, name: ai.path}
		// 			var team1 = {}
		// 			team1[l] = LW.farmer.leeks[l]
		// 			scenarios["solo" + l] = {
		// 				id: "solo" + l,
		// 				name: "Solo " + LW.farmer.leeks[l].name,
		// 				base: true,
		// 				type: 'solo',
		// 				data: {
		// 					map: -1,
		// 					ais: ais,
		// 					team1: team1,
		// 					team2: {"-1": domingo}
		// 				}
		// 			}
		// 		}
		// 		var team2 = {}
		// 		var leek_count = _.objectSize(LW.farmer.leeks)
		// 		for (var i = 0; i < leek_count; ++i) {
		// 			team2[_bots[i].id] = _bots[i]
		// 		}
		// 		var ais = {}
		// 		for (var l in LW.farmer.leeks) {
		// 			var ai = editors[_leek_ais[l]]
		// 			if (!ai) continue
		// 			ais[l] = {id: ai.id, name: ai.path}
		// 		}
		// 		scenarios["farmer"] = {
		// 			name: "Éleveur",
		// 			id: "farmer",
		// 			base: true,
		// 			type: 'farmer',
		// 			data: {
		// 				map: -1,
		// 				team1: _.clone(LW.farmer.leeks),
		// 				team2: team2,
		// 				ais: ais
		// 			}
		// 		}
		// 	}
		// 	var add_scenario_leek_events = function(leek, team_id) {
		// 		leek.find('.delete').click(function() {
		// 			var id = parseInt($(this).parent().attr('leek'))
		// 			var team = team_id == 1 ? _current_scenario.data.team1 : _current_scenario.data.team2
		// 			delete team[id]
		// 			leek.remove()
		// 			_testPopup.find('.team' + team_id + ' .add').show()
		// 			save_scenario(_current_scenario)
		// 		})
		// 		leek.find('.ai').click(function(e) {
		// 			var ais = []
		// 			for (var ai in editors) {
		// 				ais.push({id: ai, path: editors[ai].path})
		// 			}
		// 			ais.sort(function(a, b) {
		// 				var al = a.path.toLowerCase()
		// 				var bl = b.path.toLowerCase()
		// 				if (al < bl) return -1;
		// 				if (al > bl) return 1;
		// 				return 0;
		// 			})
		// 			var set_ai_popup = _.popup.new('editor.editor_ai_popup', {ais: ais})
		// 			var leek_id = $(this).parent().attr('leek')
		// 			var ai_element = $(this)
		// 			set_ai_popup.find('.ai').click(function() {
		// 				var ai_id = parseInt($(this).attr('ai'))
		// 				ai_element.text($(this).text())
		// 				if (!_current_scenario.data.ais) {
		// 					_current_scenario.data.ais = {}
		// 				}
		// 				_current_scenario.data.ais[leek_id] = {id: ai_id, name: $(this).text()}
		// 				save_scenario(_current_scenario)
		// 				set_ai_popup.dismiss()
		// 			})
		// 			set_ai_popup.show(e)
		// 		})
		// 	}
		// 	var add_scenario_leek = function(leek, ai, team) {
		// 		var count = _testPopup.find('.team' + team + ' .leeks .leek').length
		// 		if (count >= 6) return null
		// 		var e = $("<div class='leek' leek='" + leek.id + "'><div class='delete'>×</div><div class='card'><div class='image'></div>" + leek.name + "</div><div class='ai'>" + leek.ai_name + "</div></div>")
		// 		_testPopup.find('.team' + team + ' .leeks').append(e)
		// 		LW.createLeekImage(leek.id, 0.4, leek.level, leek.skin, leek.hat, function(id, data) {
		// 			_testPopup.find('.team' + team + ' .leek[leek=' + id + '] .image').html(data)
		// 		})
		// 		if (ai != null) {
		// 			e.find('.ai').text(ai.name)
		// 		} else {
		// 			e.find('.ai').text("?")
		// 		}
		// 		add_scenario_leek_events(e, team)
		// 		if (count == 5) {
		// 			_testPopup.find('.team' + team + ' .add').hide()
		// 		} else {
		// 			_testPopup.find('.team' + team + ' .add').show()
		// 		}
		// 	}
		// 	var load_scenario = function(scenario) {
		// 		_current_scenario = scenario
		// 		_testPopup.find('.team1 .leek').remove()
		// 		_testPopup.find('.team2 .leek').remove()
		// 		for (var l in scenario.data.team1) {
		// 			var leek = scenario.data.team1[l]
		// 			var ai = scenario.data.ais[l]
		// 			add_scenario_leek(leek, ai, 1)
		// 		}
		// 		if (_.objectSize(scenario.data.team1) >= 6) {
		// 			_testPopup.find('.column-scenario .team1 .add').hide()
		// 		} else {
		// 			_testPopup.find('.column-scenario .team1 .add').show()
		// 		}
		// 		for (var l in scenario.data.team2) {
		// 			var leek = scenario.data.team2[l]
		// 			var ai = scenario.data.ais[l]
		// 			add_scenario_leek(leek, ai, 2)
		// 		}
		// 		if (_.objectSize(scenario.data.team2) >= 6) {
		// 			_testPopup.find('.column-scenario .team2 .add').hide()
		// 		} else {
		// 			_testPopup.find('.column-scenario .team2 .add').show()
		// 		}
		// 		if (scenario.data.map) {
		// 			var map = scenario.data.map
		// 			var name = map ? map.name : '?'
		// 			_testPopup.find('.column-scenario .map .name').text(name)
		// 			_testPopup.find('.column-scenario .map img').attr('src', LW.staticURL + 'image/map_icon.png')
		// 		} else {
		// 			_testPopup.find('.column-scenario .map .name').text("Random")
		// 			_testPopup.find('.column-scenario .map img').attr('src', LW.staticURL + 'image/map_icon_random.png')
		// 		}
		// 		if (scenario.base) {
		// 			_testPopup.find('.column-scenario .add').hide()
		// 		}
		// 		localStorage['editor/scenario'] = scenario.id
		// 	}
		// 	var select_scenario = function(scenario) {
		// 		_testPopup.find('.scenarios .scenario').removeClass('selected')
		// 		_testPopup.find('.scenarios .scenario[scenario=' + scenario.id + ']').addClass('selected')
		// 		load_scenario(scenario)
		// 	}
		// 	var add_scenario_events = function(e) {
		// 		e.click(function() {
		// 			select_scenario(_scenarios[$(this).attr('scenario')])
		// 		})
		// 		e.find('.delete').click(function() {
		// 			_.log('delete scenario ', _current_scenario)
		// 			_.post('test-scenario/delete', {id: _current_scenario.id}, function(data) {
		// 				if (data.error) {
		// 					_.toast(data.error)
		// 				}
		// 			})
		// 			e.remove()
		// 			select_scenario(_.first(_scenarios))
		// 		})
		// 	}
		// 	_.get('test-scenario/get-all/' + LW.token(), function(data) {
		// 		if (data.success) {
		// 			_scenarios = data.scenarios
		// 			generate_default_scenarios(_scenarios)
		// 			for (var m in data.scenarios) {
		// 				var e = $("<div class='item scenario' scenario='" +  _scenarios[m].id + "'>" + _scenarios[m].name + (_scenarios[m].base ? "<span class='base'>base</span>" : "<div class='delete'/>") + "</div>")
		// 				_testPopup.find('.scenarios').append(e)
		// 				add_scenario_events(e)
		// 			}
		// 			var start_scenario = localStorage['editor/scenario']
		// 			if (start_scenario && start_scenario in _scenarios) {
		// 				start_scenario = _scenarios[start_scenario]
		// 			} else {
		// 				start_scenario = _.first(_scenarios)
		// 			}
		// 			select_scenario(start_scenario)
		// 		} else {
		// 			_.toast(data.error)
		// 		}
		// 	})
		// 	_testPopup.find('.scenario').click(function() {
		// 		_testPopup.find('.scenario').removeClass('selected')
		// 		$(this).addClass('selected')
		// 	})
		// 	var add_scenario_popup = new _.popup.new('editor.input_popup', {title: "Ajouter un scénario", validate: "Ajouter"})
		// 	add_scenario_popup.find('.validate').click(function() {
		// 		var name = add_scenario_popup.find('input').val()
		// 		_.post('test-scenario/new', {name: name}, function(data) {
		// 			if (data.success) {
		// 				var e = $("<div class='item scenario' scenario='" +  data.id + "'>" + name + "</div>")
		// 				_testPopup.find('.scenarios').append(e)
		// 				_scenarios[data.id] = ({name: name, id: data.id, data: data.data})
		// 				add_scenario_events(e)
		// 				add_scenario_popup.dismiss()
		// 				add_scenario_popup.find('input').val('')
		// 				select_scenario(_scenarios[data.id])
		// 			} else {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	})
		// 	var save_scenario = function(scenario) {
		// 		if (scenario.base) return null
		// 		_.post('test-scenario/update', {id: scenario.id, data: JSON.stringify(scenario.data)}, function(data) {
		// 			if (!data.success) {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	}
		// 	_testPopup.find('.view[tab="scenario"] .item.add').click(function(e) {
		// 		add_scenario_popup.show(e)
		// 	})
		// 	_testPopup.find('.column-scenario .add').click(function(e) {
		// 		var team1 = $(this).parent().hasClass('team1')
		// 		var team = team1 ? _current_scenario.data.team1 : _current_scenario.data.team2
		// 		var available_leeks = {}
		// 		for (var l in _leeks) {
		// 			if (l in _current_scenario.data.team1 || l in _current_scenario.data.team2) continue
		// 			available_leeks[l] = _leeks[l]
		// 		}
		// 		for (var l in LW.farmer.leeks) {
		// 			if (l in _current_scenario.data.team1 || l in _current_scenario.data.team2) continue
		// 			available_leeks[l] = LW.farmer.leeks[l]
		// 		}
		// 		var leek_popup = _.popup.new('editor.editor_leek_popup', {leeks: available_leeks})
		// 		leek_popup.find('.leek').each(function() {
		// 			var leek_id = parseInt($(this).attr('leek'))
		// 			var leek = $(this).hasClass('real') > 0 ? LW.farmer.leeks[leek_id] : _leeks[leek_id]
		// 			LW.createLeekImage(leek.id, 0.4, leek.level, leek.skin, leek.hat, function(id, data) {
		// 				leek_popup.find('.leek[leek=' + id + '] .image').html(data)
		// 			})
		// 		})
		// 		leek_popup.find('.leek').click(function() {
		// 			var leek_id = parseInt($(this).attr('leek'))
		// 			var real = $(this).hasClass('real') > 0
		// 			var leek = real ? LW.farmer.leeks[leek_id] : _leeks[leek_id]
		// 			team[leek_id] = leek
		// 			var ai = null
		// 			if (real) {
		// 				var real_ai = editors[_leek_ais[leek_id]]
		// 				ai = {id: real_ai.id, name: real_ai.path}
		// 			}
		// 			_current_scenario.data.ais[leek_id] = ai
		// 			add_scenario_leek(leek, ai, team1 ? 1 : 2)
		// 			save_scenario(_current_scenario)
		// 			leek_popup.dismiss()
		// 		})
		// 		leek_popup.show(e)
		// 	})

		// 	_testPopup.find('.column-scenario .map').click(function(e) {
		// 		var set_map_popup = _.popup.new('editor.map_popup', {maps: _maps})
		// 		set_map_popup.find('.map').click(function() {
		// 			var map_id = parseInt($(this).attr('map'))
		// 			_current_scenario.data.map = _maps[map_id]
		// 			if (map_id == -1) {
		// 				_testPopup.find('.column-scenario .map .name').text("Random")
		// 				_testPopup.find('.column-scenario .map img').attr('src', LW.staticURL + 'image/map_icon_random.png')
		// 			} else {
		// 				var map = _maps[map_id]
		// 				_testPopup.find('.column-scenario .map .name').text(map.name)
		// 				_testPopup.find('.column-scenario .map img').attr('src', LW.staticURL + 'image/map_icon.png')
		// 			}
		// 			save_scenario(_current_scenario)
		// 			set_map_popup.dismiss()
		// 		})
		// 		set_map_popup.show(e)
		// 	})

		// 	/*
		// 	* Leeks
		// 	*/
		// 	var _characs_limits = {
		// 		life: {min: 1, max: 100000},
		// 		strength: {min: 0, max: 3000},
		// 		wisdom: {min: 0, max: 3000},
		// 		agility: {min: 0, max: 3000},
		// 		resistance: {min: 0, max: 3000},
		// 		science: {min: 0, max: 3000},
		// 		magic: {min: 0, max: 3000},
		// 		frequency: {min: 100, max: 3000},
		// 		tp: {min: 0, max: 100},
		// 		mp: {min: 0, max: 50}
		// 	}
		// 	var _current_leek = null
		// 	var generate_bots = function(leeks) {
		// 		for (var b in _bots) {
		// 			leeks[_bots[b].id] = _bots[b]
		// 		}
		// 	}
		// 	var add_chip_events = function(chip) {
		// 		var id = parseInt(chip.attr('chip'))
		// 		chip.click(function() {
		// 			_current_leek.chips.splice(_current_leek.chips.indexOf(id), 1)
		// 			$(this).remove()
		// 			_testPopup.find('.chips .add').show()
		// 			save_leek(_current_leek)
		// 		})
		// 	}
		// 	var add_weapon_events = function(weapon) {
		// 		var id = parseInt(weapon.attr('weapon'))
		// 		weapon.click(function() {
		// 			_current_leek.weapons.splice(_current_leek.weapons.indexOf(id), 1)
		// 			$(this).remove()
		// 			_testPopup.find('.weapons .add').show()
		// 			save_leek(_current_leek)
		// 		})
		// 	}
		// 	var load_leek = function(leek) {
		// 		_current_leek = leek
		// 		LW.createLeekImage(leek.id, 1, leek.level, leek.skin, leek.hat, function(id, data) {
		// 			_testPopup.find('.leek-column .image').html(data)
		// 		})
		// 		;['life', 'strength', 'wisdom', 'agility', 'resistance', 'science', 'magic', 'frequency', 'tp', 'mp'].forEach(function(s) {
		// 			_testPopup.find('.leek-column [stat="' + s + '"]').text(leek[s])
		// 		})
		// 		_testPopup.find('.leek-column .name').text(leek.name)
		// 		_testPopup.find('.leek-column .chips .container').empty()
		// 		for (var c in leek.chips) {
		// 			var chip = LW.chips[leek.chips[c]]
		// 			var e = $("<img class='chip' chip='" + chip.id + "' src='" + LW.staticURL + "image/chip/small/" + chip.name + ".png'/>")
		// 			_testPopup.find('.leek-column .chips .container').append(e)
		// 			add_chip_events(e)
		// 		}
		// 		if (leek.chips.length >= 12) {
		// 			_testPopup.find('.chips .add').hide()
		// 		} else {
		// 			_testPopup.find('.chips .add').show()
		// 		}
		// 		_testPopup.find('.leek-column .weapons .container').empty()
		// 		for (var c in leek.weapons) {
		// 			var weapon = LW.weapons[leek.weapons[c]]
		// 			var e = $("<img class='weapon' weapon='" + weapon.id + "' src='" + LW.staticURL + "image/weapon/" + weapon.name + ".png'/>")
		// 			_testPopup.find('.leek-column .weapons .container').append(e)
		// 			add_weapon_events(e)
		// 		}
		// 		if (leek.weapons.length >= 4) {
		// 			_testPopup.find('.weapons .add').hide()
		// 		} else {
		// 			_testPopup.find('.weapons .add').show()
		// 		}
		// 	}
		// 	var select_leek = function(leek) {
		// 		_testPopup.find('.leeks .leek').removeClass('selected')
		// 		_testPopup.find('.leeks .leek[leek=' + leek.id + ']').addClass('selected')
		// 		load_leek(leek)
		// 	}
		// 	var add_leek_events = function(e) {
		// 		e.click(function() {
		// 			select_leek(_leeks[$(this).attr('leek')])
		// 		})
		// 	}
		// 	_.get('test-leek/get-all/' + LW.token(), function(data) {
		// 		if (data.success) {
		// 			_leeks = data.leeks
		// 			generate_bots(_leeks)
		// 			for (var m in data.leeks) {
		// 				if (!_leeks[m].chips)_leeks[m].chips = []
		// 				if (!_leeks[m].weapons)_leeks[m].weapons = []
		// 				var e = $("<div class='item leek' leek='" +  _leeks[m].id + "'>" + _leeks[m].name + (_leeks[m].bot ? "<span class='bot'>bot</span>" : "<div class='delete'/>") + "</div>")
		// 				_testPopup.find('.lateral-column .leeks').append(e)
		// 				add_leek_events(e)
		// 			}
		// 			select_leek(_.first(_leeks))
		// 		} else {
		// 			_.toast(data.error)
		// 		}
		// 	})
		// 	var add_leek_popup = new _.popup.new('editor.input_popup', {title: "Ajouter un poireau", validate: "Ajouter"})
		// 	add_leek_popup.find('.validate').click(function() {
		// 		var name = add_leek_popup.find('input').val()
		// 		_.post('test-leek/new', {name: name}, function(data) {
		// 			if (data.success) {
		// 				var e = $("<div class='item leek' leek='" +  data.id + "'>" + name + "</div>")
		// 				_testPopup.find('.leeks').append(e)
		// 				_leeks[data.id] = ({name: name, id: data.id})
		// 				for (var k in data.data) _leeks[data.id][k] = data.data[k]
		// 				add_leek_events(e)
		// 				add_leek_popup.dismiss()
		// 				add_leek_popup.find('input').val('')
		// 				select_leek(_leeks[data.id])
		// 			} else {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	})
		// 	var save_leek = function(leek) {
		// 		_.post('test-leek/update', {id: leek.id, data: JSON.stringify(leek)}, function(data) {
		// 			if (!data.success) {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	}
		// 	_testPopup.find('.view[tab="leeks"] .item.add').click(function(e) {
		// 		add_leek_popup.show(e)
		// 	})
		// 	_testPopup.find('.leek-column .stat').click(function() {
		// 		if (_current_leek.bot) return null
		// 		$(this).find('span').attr('contenteditable', 'true').focus()
		// 	})
		// 	_testPopup.find('.leek-column .stat span').on('focusout', function() {
		// 		if (_current_leek.bot) return null
		// 		var charac = $(this).attr('stat')
		// 		var value = parseInt($(this).text())
		// 		if (isNaN(value)) {
		// 			value = _characs_limits[charac].min
		// 		}
		// 		value = Math.max(value, _characs_limits[charac].min)
		// 		value = Math.min(value, _characs_limits[charac].max)
		// 		$(this).text(value)
		// 		_current_leek[charac] = value
		// 		save_leek(_current_leek)
		// 	})
		// 	var add_chip_popup = new _.popup.new('editor.editor_chips_popup', {chips: LW.chips})
		// 	_testPopup.find('.leek-column .chips .add').click(function(e) {
		// 		add_chip_popup.show(e)
		// 	})
		// 	add_chip_popup.find('.chip').click(function() {
		// 		var chip = parseInt($(this).attr('chip'))
		// 		_current_leek.chips.push(chip)
		// 		if (_current_leek.chips.length >= 12) {
		// 			_testPopup.find('.chips .add').hide()
		// 		}
		// 		var e = $(this).clone()
		// 		_testPopup.find('.leek-column .chips .container').append(e)
		// 		add_chip_events(e)
		// 		add_chip_popup.dismiss()
		// 		save_leek(_current_leek)
		// 	})
		// 	var add_weapon_popup = new _.popup.new('editor.editor_weapons_popup', {weapons: LW.weapons})
		// 	_testPopup.find('.leek-column .weapons .add').click(function(e) {
		// 		add_weapon_popup.show(e)
		// 	})
		// 	add_weapon_popup.find('.weapon').click(function() {
		// 		var weapon = parseInt($(this).attr('weapon'))
		// 		_current_leek.weapons.push(weapon)
		// 		if (_current_leek.weapons.length >= 4) {
		// 			_testPopup.find('.weapons .add').hide()
		// 		}
		// 		var e = $(this).clone()
		// 		_testPopup.find('.leek-column .weapons .container').append(e)
		// 		add_weapon_events(e)
		// 		add_weapon_popup.dismiss()
		// 		save_leek(_current_leek)
		// 	})

		// 	/*
		// 	* Maps
		// 	*/
		// 	var _current_map = null
		// 	var load_map = function(map) {
		// 		if (_current_map && timeout) {
		// 			if (timeout) {
		// 				window.clearTimeout(timeout)
		// 				timeout = null
		// 			}
		// 			save_map(_current_map)
		// 		}
		// 		_current_map = map
		// 		_testPopup.find('.map .cell').removeClass('obstacle').removeClass('team1').removeClass('team2')

		// 		_testPopup.find('.map .cell').each(function() {
		// 			var cell = parseInt($(this).attr('cell'))
		// 			if (map.data.obstacles[cell]) {
		// 				$(this).addClass('obstacle')
		// 			} else if (map.data.team1.indexOf(cell) != -1) {
		// 				$(this).addClass('team1')
		// 			} else if (map.data.team2.indexOf(cell) != -1) {
		// 				$(this).addClass('team2')
		// 			}
		// 		})
		// 		_testPopup.find('.map-column .name').text(map.name)
		// 	}
		// 	var select_map = function(map) {
		// 		_testPopup.find('.maps .map').removeClass('selected')
		// 		_testPopup.find('.maps .map[map=' + map.id + ']').addClass('selected')
		// 		load_map(map)
		// 	}
		// 	var add_map_events = function(e) {
		// 		e.click(function() {
		// 			select_map(_maps[$(this).attr('map')])
		// 		})
		// 		e.find('.delete').click(function() {
		// 			_.post('test-map/delete', {id: _current_map.id}, function(data) {
		// 				if (!data.success) {
		// 					_.toast(data.error)
		// 				}
		// 			})
		// 			_testPopup.find('.maps .map[map=' + _current_map.id + ']').remove()
		// 			delete _maps[_current_map.id]
		// 			if (!_.isEmptyObj(_maps)) {
		// 				select_map(_.first(_maps))
		// 			}
		// 		})
		// 	}
		// 	_.get('test-map/get-all/' + LW.token(), function(data) {
		// 		if (data.success) {
		// 			_maps = data.maps
		// 			for (var m in data.maps) {
		// 				var e = $("<div class='item map' map='" +  data.maps[m].id + "'>" + _.protect(data.maps[m].name) + "<div class='delete'/></div>")
		// 				_testPopup.find('.maps').append(e)
		// 				add_map_events(e)
		// 			}
		// 			if (!_.isEmptyObj(data.maps)) {
		// 				select_map(_.first(data.maps))
		// 			}
		// 		} else {
		// 			_.toast(data.error)
		// 		}
		// 	})
		// 	var add_map_popup = new _.popup.new('editor.input_popup', {title: "Ajouter une carte", validate: "Ajouter"})
		// 	add_map_popup.find('.validate').click(function() {
		// 		var name = add_map_popup.find('input').val()
		// 		_.post('test-map/new', {name: name}, function(data) {
		// 			if (data.success) {
		// 				var e = $("<div class='item map' map='" +  data.id + "'>" + _.protect(name) + "</div>")
		// 				_testPopup.find('.maps').append(e)
		// 				_maps[data.id] = ({name: name, id: data.id, data: {obstacles: {}, team1: [], team2: []}})
		// 				add_map_events(e)
		// 				add_map_popup.dismiss()
		// 				add_map_popup.find('input').val('')
		// 				select_map(_maps[data.id])
		// 			} else {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	})
		// 	_testPopup.find('.view[tab="maps"] .item.add').click(function(e) {
		// 		add_map_popup.show(e)
		// 	})

		// 	var save_map = function(map) {
		// 		_.post('test-map/update', {id: map.id, data: JSON.stringify(map.data)}, function(data) {
		// 			if (!data.success) {
		// 				_.toast(data.error)
		// 			}
		// 		})
		// 	}

		// 	var timeout = null
		// 	var reset_save_timeout = function() {
		// 		if (timeout) window.clearTimeout(timeout)
		// 		timeout = window.setTimeout(function() {
		// 			timeout = null
		// 			save_map(_current_map)
		// 		}, 3000)
		// 	}

		// 	var init_map = function(element) {
		// 		var size = 34;
		// 		element.empty()
		// 		for (var i = 0; i <= size; ++i) {
		// 			var line = $("<div class='line'></div>");
		// 			for (var j = 0; j <= size; ++j) {
		// 				var y = i - Math.floor(size / 2)
		// 				var x = j - Math.floor(size / 2)
		// 				var enabled = Math.abs(x) + Math.abs(y) <= size / 2
		// 				var clazz = enabled ? '' : 'disabled'
		// 				var team = j < (size * (5 / 6) - i) ? '1' : (j > (size * (7 / 6) - i) ? '2' : '0')
		// 				var cell = 306 + 18 * y - 17 * x
		// 				line.append("<span class='cell " + clazz + "' cell='" + cell + "' team='" + team + "'></span>");
		// 			}
		// 			element.append(line)
		// 		}
		// 		map_down = false
		// 		map_add = false
		// 		element.find('.cell:not(.disabled)').each(function() {
		// 			$(this).on({
		// 				contextmenu: function(e) { // right click
		// 					var team = $(this).attr('team')
		// 					var cell = parseInt($(this).attr('cell'))
		// 					if (team != 0) {
		// 						$(this).removeClass('obstacle').toggleClass(team === '1' ? 'team1' : 'team2')
		// 						var team_array = team === '1' ? _current_map.data.team1 : _current_map.data.team2
		// 						var index = team_array.indexOf(cell)
		// 						if (index != -1) {
		// 							team_array.splice(index, 1)
		// 						} else {
		// 							team_array.push(cell)
		// 						}
		// 						reset_save_timeout()
		// 					}
		// 					e.preventDefault()
		// 				},
		// 				mousedown: function(e) {
		// 					if (e.originalEvent.button === 0) { // only left click
		// 						var cell = parseInt($(this).attr('cell'))
		// 						map_down = true
		// 						map_add = !$(this).hasClass('obstacle')
		// 						$(this).toggleClass('obstacle')
		// 						if (map_add) {
		// 							_current_map.data.obstacles[cell] = true
		// 						} else {
		// 							delete _current_map.data.obstacles[cell]
		// 						}
		// 						reset_save_timeout()
		// 					}
		// 				},
		// 				mouseenter: function(e) {
		// 					if (map_down) {
		// 						var has_class = $(this).hasClass('obstacle')
		// 						if (has_class != map_add) {
		// 							$(this).toggleClass('obstacle', map_add)
		// 							var cell = parseInt($(this).attr('cell'))
		// 							if (map_add) {
		// 								_current_map.data.obstacles[cell] = true
		// 							} else {
		// 								delete _current_map.data.obstacles[cell]
		// 							}
		// 							reset_save_timeout()
		// 						}
		// 					}
		// 				},
		// 				mouseup: function(e) {
		// 					map_down = false
		// 				},
		// 				dragstart: function(e) {
		// 					e.preventDefault()
		// 					return false
		// 				}
		// 			})
		// 		})
		// 	}
		// 	init_map(_testPopup.find('.map .map-wrapper'))

		// 	_testPopup.find('.button.clear').click(function() {
		// 		_testPopup.find('.map .cell').removeClass('obstacle')
		// 		_current_map.data.obstacles = {}
		// 		reset_save_timeout()
		// 	})
		// 	_testPopup.find('.button.random').click(function() {
		// 		_current_map.data.obstacles = {}
		// 		_testPopup.find('.map .cell').removeClass('obstacle')
		// 		_testPopup.find('.map .cell').each(function() {
		// 			if (Math.random() > 0.8) {
		// 				$(this).addClass('obstacle')
		// 				_current_map.data.obstacles[parseInt($(this).attr('cell'))] = true
		// 			}
		// 		})
		// 		reset_save_timeout()
		// 	})

		// 	/*
		// 	* Launch scenario
		// 	*/
		// 	_testPopup.view.find("#launch").click(function() {
		// 		var scenario_data = JSON.stringify(_current_scenario.data)
		// 		var v2 = false
		// 		for (var i in _current_scenario.data.ais) {
		// 			if (i != -1 && _current_scenario.data.ais[i] && _current_scenario.data.ais[i].id in editors && editors[_current_scenario.data.ais[i].id].v2) {
		// 				v2 = true
		// 				break
		// 			}
		// 		}
		// 		var service = v2 ? 'ai/test-v2' : 'ai/test-new'
		// 		_.post(service, {data: scenario_data}, function(data) {
		// 			if (data.success) {
		// 				localStorage['editor/last-scenario-data'] = scenario_data
		// 				_testPopup.dismiss()
		// 				LW.page('/fight/' + data.fight)
		// 			} else {
		// 				_.toast("Erreur : " + data.error)
		// 			}
		// 		})
		// 	})

		// 	$("#test-button").click(function(e) {
		// 		if (current != null) {
		// 			_testEvent = e
		// 			editors[current].test()
		// 		}
		// 	})
		}

		saveTestSettings() {
			localStorage['editor/test_type'] = _testType
			localStorage['editor/test_leek'] = _testLeek
			localStorage['editor/test_ai'] = _testAI
			localStorage['editor/test_enemies'] = JSON.stringify(_testEnemies)
		}
	}
</script>

<style lang="scss" scoped>
	h4 {
		display: inline-block;
	}
	#test-ais {
		font-size: 16px;
	}
	.leek-column .leek {
		width: 165px;
		text-align: center;
		margin: 5px 15px;
		padding: 10px 0;
		display: inline-block;
		cursor: pointer;
		opacity: 0.2;
	}
	.leek-column .leek h3 {
		display: block;
		margin-left: 0;
	}
	.leek-column .leek.enemy {
		width: 120px;
	}
	.leek-column .leek:hover {
		background-color: white;
		opacity: 0.35;
	}
	.leek-column .leek.selected {
		opacity: 1;
	}
	.tabs {
		margin: 0 -15px;
		margin-top: -15px;
		margin-bottom: 15px;
	}
	.tabs .tab {
		display: inline-block;
		width: 33.3333%;
		text-align: center;
		line-height: 35px;
		height: 35px;
		cursor: pointer;
		font-size: 18px;
		background: #ccc;
		color: #555;
	}
	.tabs .tab:hover {
		background: white;
	}
	.tabs .tab.selected {
		background: #888;
		color: white;
	}
	.view {
		display: none;
		min-height: 500px;
	}
	.column {
		display: inline-block;
		vertical-align: top;
	}
	.lateral-column {
		width: 180px;
		margin-left: -15px;
		margin-top: -15px;
		margin-bottom: -15px;
		margin-right: 15px;
		background: #333;
		color: #bbb;
	}
	.lateral-column h4 {
		padding: 5px 10px;
		color: white;
		text-transform: uppercase;
		font-size: 16px;
		background: #555;
		display: block;
	}
	.item {
		padding: 8px;
		cursor: pointer;
		position: relative;
	}
	.item:hover {
		background: #222;
	}
	.item.selected {
		background: #5FAD1B;
		color: white;
	}
	.lateral-column .add {
		background: #444;
	}
	.lateral-column .item .delete {
		position: absolute;
		right: 7px;
		top: 10px;
		width: 15px;
		height: 15px;
		background-image: url("/image/delete_new.png");
		background-size: cover;
		opacity: 0.6;
	}
	.lateral-column .item .delete:hover {
		opacity: 1.0;
	}
	.column .title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
		color: #555;
		padding-bottom: 8px;
	}
	.column-scenario .team {
		width: 810px;
	}
	.column-scenario .team {
		text-align: center;
	}
	.column-scenario .leeks {
		text-align: center;
		display: inline-block;
	}
	.column-scenario .add, .leek-column .add {
		background: white;
		font-size: 40px;
		border-radius: 50%;
		font-weight: 300;
		padding: 2px 14px;
		color: #bbb;
		cursor: pointer;
		display: inline-block;
		vertical-align: top;
		margin-left: 10px;
		margin-right: 10px;
		margin-top: 5px;
	}
	.column-scenario .add {
		margin-top: 46px;
		margin-bottom: 46px;
		margin-left: 20px;
		margin-right: 20px;
	}
	.column-scenario .add:hover, .leek-column .add:hover {
		color: #555;
		background: #ccc;
	}
	.column-scenario .vs {
		font-size: 22px;
		font-weight: 300;
		padding: 5px 30px;
		text-align: center;
	}
	.column-scenario .leek {
		display: inline-block;
		margin: 0 4px;
		font-size: 16px;
		position: relative;
	}
	.column-scenario .leek .card {
		display: inline-block;
		text-align: center;
		padding: 5px;
		cursor: pointer;
	}
	.column-scenario .leek .ai {
		display: inline-block;
		vertical-align: top;
	}

	.popup.editor_ai_popup .content {
		height: 400px;
	}
	.popup.editor_ai_popup .ai {
		padding: 3px 10px;
		cursor: pointer;
		border-radius: 3px;
	}
	.popup.editor_ai_popup .ai:hover {
		background: white;
		color: #5FAD1B;
	}

	.column-scenario .leek svg {
		height: 100px;
		width: 80px;
	}
	.column-scenario .leek .delete {
		color: red;
		background: white;
		border-radius: 50%;
		border-bottom: 2px solid #aaa;
		display: inline-block;
		vertical-align: top;
		padding: 1px 7px;
		font-size: 18px;
		position: absolute;
		top: -5px;
		left: -10px;
		cursor: pointer;
	}
	.column-scenario .leek .ai {
		background-image: url('/image/ai.png');
		background-size: cover;
		width: 55px;
		height: 65px;
		margin-top: 10px;
		margin-left: -30px;
		padding: 6px;
		word-wrap: break-word;
		color: #888;
		font-size: 12px;
		padding-top: 20px;
		font-weight: bold;
		cursor: pointer;
	}
	.popup.editor_leek_popup .leek {
		display: inline-block;
		text-align: center;
		padding: 8px;
		margin: 6px;
		cursor: pointer;
	}
	.column-scenario .map-container {
		text-align: center;
		width: 800px;
	}
	.column-scenario .map, .popup.map_popup .map {
		display: inline-block;
		background: white;
		border-bottom: 2px solid #eee;
		padding: 5px 10px;
		border-radius: 5px;
		text-align: center;
		font-size: 16px;
		cursor: pointer;
		margin: 5px;
	}
	.column-scenario .map img, .popup.map_popup .map img {
		width: 80px;
	}
	.item.leek .bot, .item.scenario .base {
		background: #777;
		color: white;
		border-radius: 4px;
		padding: 0 4px;
		margin-left: 5px;
		position: absolute;
		right: 7px;
		top: 5px;
	}
	.leek-column {
		width: 820px;
	}
	.leek-column .image {
		display: inline-block;
		text-align: center;
		margin-left: 140px;
		padding: 7px;
	}
	.leek-column .image svg {
		height: 156px;
		width: 120px;
	}
	.leek-column .stats {
		display: inline-block;
		vertical-align: top;
		margin-left: 10px;
	}
	.leek-column .stats tr:nth-child(even) {
		background: white;
	}
	.leek-column .stats {
		text-align: center;
	}
	.leek-column .stats .stat {
		width: 160px;
		padding: 5px 0;
		text-align: left;
		display: inline-block;
		cursor: text;
	}
	.leek-column .stats img {
		vertical-align: top;
		margin-right: 1px;
		margin-left: 20px;
		width: 25px;
	}
	.leek-column .stats .stat > div > span {
		font-size: 18px;
		vertical-align: top;
		display: inline-block;
		margin-top: 2px;
		padding: 0 6px;
		font-weight: 500;
	}
	.leek-column .chips .container, .leek-column .weapons .container {
		display: inline-block;
	}
	.leek-column .chip, .popup.editor_chips_popup .chip {
		width: 63px;
		cursor: pointer;
	}
	.leek-column .weapon, .popup.editor_weapons_popup .weapon {
		cursor: pointer;
	}
	.leek-column .chip, .leek-column .weapon {
		margin: 0 2px;
	}
	.map-column .map {
		height: 415px;
		width: 800px;
		overflow: hidden;
		margin-top: -20px;
	}
	.map-wrapper {
		transform: scale(1, 0.5) rotate(-45.5deg);
		margin-top: -300px;
		margin-left: -110px;
	}
	.map .line {
		white-space: nowrap;
	}
	.map .cell {
		width: 25px;
		height: 25px;
		display: inline-block;
		border: 1px solid #888;
		margin: 2px;
		cursor: pointer;
		border-radius: 2px;
		background: white;
	}
	.map .cell.disabled {
		border: 1px solid transparent;
		background: transparent;
	}
	.map .cell:not(.disabled).obstacle {
		background: #666;
	}
	.map .cell:not(.disabled).team1 {
		background: blue;
	}
	.map .cell:not(.disabled).team2 {
		background: red;
	}
	.map .cell:not(.disabled):hover {
		background: green;
	}
	.map-column .buttons {
		text-align: right;
		padding-right: 10px;
	}
	.map-column .buttons .button {
		margin: 0 3px;
	}
	.map-column .instructions {
		color: #aaa;
		padding-left: 20px;
		margin-top: -20px;
	}
</style>