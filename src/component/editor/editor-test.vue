<template>
	<popup :value="value" :width="1024" @input="$emit('input', $event)" :full="true">
		<span slot="title">{{ $t('editor.run_test') }}</span>
		<v-tabs :key="value" class="tabs" grow>
			<v-tabs-slider class="indicator" />
			<v-tab class="tab">{{ $t('editor.test_scenario') }}</v-tab>
			<v-tab class="tab">{{ $t('editor.test_leeks') }}</v-tab>
			<v-tab class="tab">{{ $t('editor.test_map') }}</v-tab>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>Scénarios</h4>
					<div class="items scenarios">
						<div v-for="scenario of allScenarios" :key="scenario.id" :class="{selected: scenario === currentScenario}" class="item scenario" @click="selectScenario(scenario)">
							{{ scenario.name }}
							<span v-if="scenario.base" class="base">base</span>
							<div v-else class="delete" @click.stop="deleteScenario(scenario)"></div>
						</div>
					</div>
					<div class="item add" @click="newScenarioDialog = true">✚ Ajouter</div>
				</div>
				<div v-if="currentScenario" class="column column-scenario">
					<div class="title">Poireaux</div>
					<div class="team team1">
						<div class="leeks">
							<div v-for="leek of currentScenario.data.team1" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" class="delete" @click="deleteLeek(leek, 1)">×</div>
								<div class="card">
									<leek-image :leek="leek" :scale="0.4" />
									<div>{{ leek.name }}</div>
								</div>
								<div class="ai" @click="clickLeekAI(leek)">{{ currentScenario.data.ais[leek.id] ? currentScenario.data.ais[leek.id].name : '?' }}</div>
							</div>
						</div>
						<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.data.team1) < 6" class="add" @click="addLeekTeam = currentScenario.data.team1; leekDialog = true">+</div>
					</div>
					<div class="vs">VS</div>
					<div class="team team2">
						<div class="leeks">
							<div v-for="leek of currentScenario.data.team2" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" class="delete" @click="deleteLeek(leek, 2)">×</div>
								<div class="card">
									<leek-image :leek="leek" :scale="0.4" />
									<div>{{ leek.name }}</div>
								</div>
								<div class="ai" @click="clickLeekAI(leek)">{{ currentScenario.data.ais[leek.id] ? currentScenario.data.ais[leek.id].name : '?' }}</div>
							</div>
						</div>
						<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.data.team2) < 6" class="add" @click="addLeekTeam = currentScenario.data.team2; leekDialog = true">+</div>
					</div>
					<br>
					<div class="title">Map</div>
					<div class="map-container">
						<div v-if="(currentScenario.data.map && currentScenario.data.map !== -1)" class="map card" @click="mapDialog = true">
							<img src="/image/map_icon.png">
							<div class="name">{{ currentScenario.data.map.name }}</div>
						</div>
						<div v-else class="map card" @click="mapDialog = true">
							<img src="/image/map_icon_random.png">
							<div class="name">Random</div>
						</div>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>Poireaux</h4>
					<div class="items leeks">
						<div v-for="leek of leeks" :key="leek.id" :class="{selected: leek === currentLeek}" class="item leek" @click="currentLeek = leek">
							{{ leek.name }}
							<span v-if="leek.bot" class="bot">bot</span>
							<div v-else class="delete"></div>
						</div>
					</div>
					<div class="item add" @click="newLeekDialog = true">✚ Ajouter</div>
				</div>
				<div v-if="currentLeek" class="column leek-column">
					<div class="title name">{{ currentLeek.name }}</div>
					<div class="flex">
						<div class="image card">
							<leek-image :leek="currentLeek" :scale="1" />
						</div>
						<div class="characteristics">
							<div v-for="c in ['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']" :key="c" class="characteristic">
								<img :src="'/image/charac/' + c + '.png'">
								<span :contenteditable="!currentLeek.bot" :class="'color-' + c" @focusout="characteristicFocusout(c, $event)" v-html="currentLeek[c]"></span>
							</div>
						</div>
					</div>
					<div class="title">Puces</div>
					<div class="chips">
						<div class="container">
							<v-tooltip v-for="chip in currentLeek.chips" :key="chip" :open-delay="0" :close-delay="0" bottom>
								<img slot="activator" :src="'/image/chip/small/' + LeekWars.chips[chip].name + '.png'" class="chip" @click="removeLeekChip(chip)">
								<b>{{ $t('chip.' + LeekWars.chips[chip].name) }}</b>
								<br>
								{{ $t('leek.chip_level_n', [LeekWars.chips[chip].level]) }}
								<br>
								<small>{{ 'CHIP_' + LeekWars.chips[chip].name.toUpperCase() }}</small>
							</v-tooltip>
						</div>
						<div v-if="currentLeek.chips.length < 12" class="add" @click="chipsDialog = true">+</div>
					</div>
					<br>
					<div class="title">Armes</div>
					<div class="weapons">
						<div class="container">
							<v-tooltip v-for="weapon of currentLeek.weapons" :key="weapon" :open-delay="0" :close-delay="0" bottom>
								<img slot="activator" :src="'/image/weapon/' + LeekWars.weapons[weapon].name + '.png'" class="weapon" @click="removeLeekWeapon(weapon)">
								<b>{{ $t('weapon.' + LeekWars.weapons[weapon].name) }}</b>
								<br>
								{{ $t('leek.weapon_level_n', [LeekWars.weapons[weapon].level]) }}
								<br>
								<small>{{ 'WEAPON_' + LeekWars.weapons[weapon].name.toUpperCase() }}</small>
							</v-tooltip>
						</div>
						<div v-if="currentLeek.weapons.length < 4" class="add" @click="weaponsDialog = true">+</div>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>Maps</h4>
					<div class="items maps">
						<div v-for="map of maps" :key="map.id" :class="{selected: currentMap === map}" class="item map" @click="selectMap(map)">
							{{ map.name }}
							<div class="delete" @click="deleteMap(map)"></div>
						</div>
					</div>
					<div class="item add" @click="newMapDialog = true">✚ Ajouter</div>
				</div>
				<div v-if="currentMap" class="column map-column">
					<div class="title name"></div>
					<div class="map" oncontextmenu="return false;">
						<div class="map-wrapper">
							<div v-for="(line, l) of map" :key="l" class="line">
								<span v-for="(cell, c) of line" :key="c" :class="{disabled: !cell.enabled, obstacle: cell.cell in currentMap.data.obstacles, team1: currentMap.data.team1.indexOf(cell.cell) !== -1, team2: currentMap.data.team2.indexOf(cell.cell) !== -1}" class="cell" @mousedown="cellMouseDown($event, cell)" @mouseenter="cellMouseEnter($event, cell)" @mouseup="cellMouseUp" @dragstart="cellDragStart"></span>
							</div>
						</div>
					</div>
					<div class="buttons">
						<v-btn @click="clearMap">❌ Clear</v-btn>
						<v-btn @click="randomMap">❓ Random</v-btn>
					</div>
					<div class="instructions">
						<div class="instruction">✔ Clic gauche pour ajouter ou retirer des obstacles</div>
						<div class="instruction">✔ Clic droit pour sélectionner les cellules de départ</div>
					</div>
				</div>
			</v-tab-item>
		</v-tabs>
		<div slot="actions">
			<div @click="$emit('input', false)">
				<i class="material-icons">clear</i>
				<span>{{ $t('editor.test_cancel') }}</span>
			</div>
			<div class="green" @click="launchTest">
				<i class="material-icons">play_arrow</i>
				<span>{{ $t('editor.test_validate') }}</span>
			</div>
		</div>

		<popup v-model="newScenarioDialog" :width="500">
			<span slot="title">Create new scenario</span>
			<div class="padding">
				<input v-model="newScenarioName" type="text" class="input" placeholder="Scenario name">
			</div>
			<div slot="actions">
				<div @click="newScenarioDialog = false">{{ $t('editor.cancel') }}</div>
				<div class="green" @click="createScenario">Create</div>
			</div>
		</popup>

		<popup v-model="newLeekDialog" :width="500">
			<span slot="title">Create new leek</span>
			<div class="padding">
				<input v-model="newLeekName" type="text" class="input" placeholder="Leek name">
			</div>
			<div slot="actions">
				<div @click="newLeekDialog = false">{{ $t('editor.cancel') }}</div>
				<div class="green" @click="createLeek">Create</div>
			</div>
		</popup>

		<popup v-model="newMapDialog" :width="500">
			<span slot="title">Create new map</span>
			<div class="padding">
				<input v-model="newMapName" type="text" class="input" placeholder="Map name">
			</div>
			<div slot="actions">
				<div @click="newMapDialog = false">{{ $t('editor.cancel') }}</div>
				<div class="green" @click="createMap">Create</div>
			</div>
		</popup>

		<popup v-model="mapDialog" :width="700">
			<span slot="title">Select map</span>
			<div class="padding map-dialog">
				<div class="map card" @click="selectScenarioMap(null)">
					<img src="/image/map_icon_random.png">
					<div class="name">Random</div>
				</div>
				<div v-for="map of maps" :key="map.id" class="map card" @click="selectScenarioMap(map)">
					<img src="/image/map_icon.png">
					<div class="name">{{ map.name }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="leekDialog" :width="700">
			<span slot="title">Select a leek</span>
			<div class="leek-dialog padding">
				<div v-for="leek of availableLeeks" :key="leek.id" class="leek card" @click="addScenarioLeek(leek)">
					<leek-image :leek="leek" :scale="0.5" />
					<div class="name">{{ leek.name }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="aiDialog" :width="800">
			<span slot="title">Sélectionnez une IA</span>
			<div class="ai-dialog">
				<div v-for="ai of sortedAis" :key="ai.id" class="ai" @click="clickDialogAI(ai)">
					<div class="image"></div>
					<div class="name">{{ ai.path }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="chipsDialog" :width="767">
			<span slot="title">Select a chip</span>
			<div v-if="currentLeek" class="padding chips-dialog">
				<v-tooltip v-for="chip of LeekWars.chips" v-if="currentLeek.chips.indexOf(chip.id) === -1" :key="chip.id" :open-delay="0" :close-delay="0" bottom>
					<img slot="activator" :src="'/image/chip/small/' + chip.name + '.png'" class="chip" @click="addLeekChip(chip.id)">
					<b>{{ $t('chip.' + LeekWars.chips[chip.id].name) }}</b>
					<br>
					{{ $t('leek.chip_level_n', [LeekWars.chips[chip.id].level]) }}
					<br>
					<small>{{ 'CHIP_' + LeekWars.chips[chip.id].name.toUpperCase() }}</small>
				</v-tooltip>
			</div>
		</popup>

		<popup v-model="weaponsDialog" :width="800">
			<span slot="title">Select a weapon</span>
			<div v-if="currentLeek" class="padding weapons-dialog">
				<v-tooltip v-for="weapon of LeekWars.weapons" v-if="currentLeek.weapons.indexOf(weapon.id) === -1" :key="weapon.id" :open-delay="0" :close-delay="0" bottom>
					<img slot="activator" :src="'/image/weapon/' + weapon.name + '.png'" class="weapon" @click="addLeekWeapon(weapon.id)">
					<b>{{ $t('weapon.' + LeekWars.weapons[weapon.id].name) }}</b>
					<br>
					{{ $t('leek.weapon_level_n', [LeekWars.weapons[weapon.id].level]) }}
					<br>
					<small>{{ 'WEAPON_' + LeekWars.weapons[weapon.id].name.toUpperCase() }}</small>
				</v-tooltip>
			</div>
		</popup>
	</popup>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	class TestScenario {
		id!: any
		data!: any
		base!: boolean
		name!: string
		type!: string
	}
	class TestMap {
		id!: number
		data!: any
	}
	class TestMapCell {
		cell!: number
		team!: number
	}
	@Component({})
	export default class EditorTest extends Vue {
		@Prop() value!: boolean
		@Prop() ais!: {[key: number]: AI}
		@Prop() leekAis!: {[key: number]: number}
		initialized: boolean = false
		scenarios: {[key: string]: TestScenario} = {}
		leeks: {[key: string]: Leek} = {}
		maps: {[key: string]: TestMap} = {}
		currentScenario: TestScenario | null = null
		currentLeek: Leek | null = null
		currentMap: TestMap | null = null
		newScenarioDialog: boolean = false
		newScenarioName: string = ''
		newLeekDialog: boolean = false
		newLeekName: string = ''
		newMapDialog: boolean = false
		newMapName: string = ''
		mapDialog: boolean = false
		leekDialog: boolean = false
		addLeekTeam: any = null
		aiDialog: boolean = false
		aiLeek: Leek | null = null
		chipsDialog: boolean = false
		weaponsDialog: boolean = false
		map: any = []
		map_down = false
		map_add = false
		timeout: number | null = null
		domingo = {id: -1, name: "Domingo", bot: true, level: 150, skin: 1, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: "50 to 1500", wisdom: 0, agility: 0, resistance: 0, science: 0, magic: 0}
		tisma = {id: -2, name: "Tisma", bot: true, level: 150, skin: 2, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: "50 to 1500", agility: 0, resistance: 0, science: 0, magic: 0}
		rioupi = {id: -3, name: "Rioupi", bot: true, level: 150, skin: 3, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: "50 to 1500", resistance: 0, science: 0, magic: 0}
		guj = {id: -4, name: "Guj", bot: true, level: 150, skin: 4, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: "50 to 1500", science: 0, magic: 0}
		hachess = {id: -5, name: "Hachess", bot: true, level: 150, skin: 5, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: 0, science: "50 to 1500", magic: 0}
		betalpha = {id: -6, name: "Betalpha", bot: true, level: 150, skin: 6, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: 0, science: 0, magic: "50 to 1500"}
		bots = [this.domingo, this.tisma, this.rioupi, this.guj, this.hachess, this.betalpha]
		characsLimits: {[key: string]: any} = {
			life: {min: 1, max: 100000},
			strength: {min: 0, max: 3000},
			wisdom: {min: 0, max: 3000},
			agility: {min: 0, max: 3000},
			resistance: {min: 0, max: 3000},
			science: {min: 0, max: 3000},
			magic: {min: 0, max: 3000},
			frequency: {min: 100, max: 3000},
			tp: {min: 0, max: 100},
			mp: {min: 0, max: 50}
		}
		get allScenarios() {
			const all: {[key: string]: TestScenario} = {...this.scenarios}
			if (!this.$store.state.farmer) { return all }
			for (const l in this.$store.state.farmer.leeks) {
				const leek = this.$store.state.farmer.leeks[l] as Leek
				Vue.set(this.$store.state.farmer.leeks[l], 'real', true)
				if (!(leek.id in this.leekAis)) { continue }
				const ai = this.ais[this.leekAis[leek.id]]
				if (!ai) { continue }
				all["solo" + l] = {
					id: "solo" + l,	name: "Solo " + leek.name, base: true, type: 'solo',
					data: {
						map: -1, ais: {[l]: ai}, team1: {[l]: leek}, team2: {"-1": this.domingo}
					}
				}
			}
			const team2 = {} as any
			const leek_count = LeekWars.objectSize(this.$store.state.farmer.leeks)
			for (let i = 0; i < leek_count; ++i) {
				team2[this.bots[i].id] = this.bots[i]
			}
			const ais = {} as any
			for (const l in this.$store.state.farmer.leeks) {
				const leek = this.$store.state.farmer.leeks[l]
				if (!(leek.id in this.leekAis)) { continue }
				const ai = this.ais[this.leekAis[leek.id]]
				if (!ai) { continue }
				ais[l] = {id: ai.id, name: ai.name}
			}
			all.farmer = {
				name: "Éleveur", id: "farmer", base: true, type: 'farmer',
				data: {
					map: -1, team2, ais,
					team1: LeekWars.clone(this.$store.state.farmer.leeks)
				}
			}
			return all
		}

		created() {
			if (this.initialized) { return }
			LeekWars.get('test-scenario/get-all').then(data => {
				this.initialized = true
				this.scenarios = data.scenarios
				this.initScenarios()
				const startScenarioID = localStorage.getItem('editor/scenario')
				if (startScenarioID && startScenarioID in this.scenarios) {
					this.selectScenario(this.scenarios[startScenarioID])
				} else if (LeekWars.objectSize(this.allScenarios)) {
					this.selectScenario(LeekWars.first(this.allScenarios)!)
				}
			}).error(error => {
				LeekWars.toast(error)
			})
			LeekWars.get('test-leek/get-all').then(data => {
				this.leeks = data.leeks
				this.generateBots()
				for (const l in this.leeks) {
					const leek = this.leeks[l]
					if (!leek.chips) { leek.chips = [] }
					if (!leek.weapons) { leek.weapons = [] }
				}
				this.currentLeek = LeekWars.first(this.leeks)
			}).error(error => {
				LeekWars.toast(error)
			})
			LeekWars.get('test-map/get-all').then(data => {
				this.maps = data.maps
				if (!LeekWars.isEmptyObj(this.maps)) {
					this.currentMap = LeekWars.first(this.maps)
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		initScenarios() {
			// Add 'real' attribute on farmer's leeks
			for (const s in this.scenarios) {
				const scenario = this.scenarios[s]
				for (const l in scenario.data.team1) {
					if (scenario.data.team1[l].id in this.$store.state.farmer.leeks) {
						Vue.set(scenario.data.team1[l], 'real', true)
					}
					if (scenario.data.team1[l].id < 0) {
						Vue.set(scenario.data.team1[l], 'bot', true)
					}
				}
				for (const l in scenario.data.team2) {
					if (scenario.data.team2[l].id in this.$store.state.farmer.leeks) {
						Vue.set(scenario.data.team2[l], 'real', true)
					}
					if (scenario.data.team2[l].id < 0) {
						Vue.set(scenario.data.team2[l], 'bot', true)
					}
				}
			}
		}
		mounted() {
			this.initMap()
		}
		generateBots() {
			for (const bot of this.bots) {
				this.leeks[bot.id] = bot as any
			}
		}
		selectScenario(scenario: TestScenario) {
			this.currentScenario = scenario
			localStorage.setItem('editor/scenario', '' + scenario.id)
		}
		deleteLeek(leek: Leek, teamID: number) {
			if (!this.currentScenario) { return }
			const team = teamID === 1 ? this.currentScenario.data.team1 : this.currentScenario.data.team2
			Vue.delete(team, leek.id)
			this.saveScenario()
		}
		saveScenario() {
			if (!this.currentScenario || this.currentScenario.base) { return }
			LeekWars.post('test-scenario/update', {id: this.currentScenario.id, data: JSON.stringify(this.currentScenario.data)})
				.error(error => LeekWars.toast(error))
		}
		saveLeek() {
			if (!this.currentLeek) { return }
			LeekWars.post('test-leek/update', {id: this.currentLeek.id, data: JSON.stringify(this.currentLeek)})
				.error(error => LeekWars.toast(error))
		}
		saveMap() {
			if (!this.currentMap) { return }
			LeekWars.post('test-map/update', {id: this.currentMap.id, data: JSON.stringify(this.currentMap.data)})
				.error(error => LeekWars.toast(error))
		}
		selectMap(map: TestMap) {
			if (this.currentMap && this.timeout) {
				if (this.timeout) {
					window.clearTimeout(this.timeout)
					this.timeout = null
				}
				this.saveMap()
			}
			this.currentMap = map
		}
		initMap() {
			const size = 34
			for (let i = 0; i <= size; ++i) {
				const line = []
				for (let j = 0; j <= size; ++j) {
					const y = i - Math.floor(size / 2)
					const x = j - Math.floor(size / 2)
					const enabled = Math.abs(x) + Math.abs(y) <= size / 2
					const team = j < (size * (5 / 6) - i) ? 1 : (j > (size * (7 / 6) - i) ? 2 : 0)
					const cell = 306 + 18 * y - 17 * x
					line.push({enabled, cell, team})
				}
				this.map.push(line)
			}
		}
		cellRightClick(e: Event, cell: TestMapCell) {
			if (cell.team !== 0 && this.currentMap) {
				const team_array = cell.team === 1 ? this.currentMap.data.team1 : this.currentMap.data.team2
				const index = team_array.indexOf(cell.cell)
				if (index !== -1) {
					team_array.splice(index, 1)
				} else {
					team_array.push(cell.cell)
				}
				this.resetSaveTimeout()
			}
			e.preventDefault()
		}
		cellMouseDown(e: MouseEvent, cell: TestMapCell) {
			if (e.button === 0 && this.currentMap) {
				this.map_down = true
				this.map_add = !(cell.cell in this.currentMap.data.obstacles)
				if (this.map_add) {
					Vue.set(this.currentMap.data.obstacles, cell.cell, true)
				} else {
					Vue.delete(this.currentMap.data.obstacles, cell.cell)
				}
				this.resetSaveTimeout()
			} else if (e.button === 2) {
				this.cellRightClick(e, cell)
			}
		}
		cellMouseEnter(e: Event, cell: TestMapCell) {
			if (this.map_down && this.currentMap) {
				const has_class = cell.cell in this.currentMap.data.obstacles
				if (has_class !== this.map_add) {
					if (this.map_add) {
						Vue.set(this.currentMap.data.obstacles, cell.cell, true)
					} else {
						Vue.delete(this.currentMap.data.obstacles, cell.cell)
					}
					this.resetSaveTimeout()
				}
			}
		}
		cellMouseUp() {
			this.map_down = false
		}
		cellDragStart(e: Event) {
			e.preventDefault()
			return false
		}
		resetSaveTimeout() {
			if (this.timeout) {
				window.clearTimeout(this.timeout)
			}
			this.timeout = window.setTimeout(() => {
				this.timeout = null
				this.saveMap()
			}, 2000)
		}
		deleteMap(map: TestMap) {
			LeekWars.delete('test-map/delete', {id: map.id}).error(error => LeekWars.toast(error))
			Vue.delete(this.$data.maps, map.id)
			if (!LeekWars.isEmptyObj(this.maps)) {
				this.selectMap(LeekWars.first(this.maps)!)
			}
		}
		clearMap() {
			if (!this.currentMap) { return }
			this.currentMap.data.obstacles = {}
			this.resetSaveTimeout()
		}
		randomMap() {
			if (!this.currentMap) { return }
			this.currentMap.data.obstacles = {}
			for (let cell = 0; cell < 612; ++cell) {
				if (Math.random() > 0.8) {
					this.currentMap.data.obstacles[cell] = true
				}
			}
			this.resetSaveTimeout()
		}
		get sortedAis() {
			return Object.values(this.ais).sort((a, b) => a.path.toLowerCase().localeCompare(b.path.toLowerCase()))
		}
		clickLeekAI(leek: Leek) {
			this.aiDialog = true
			this.aiLeek = leek
		}
		clickDialogAI(ai: AI) {
			if (!this.currentScenario || !this.aiLeek) { return }
			if (!this.currentScenario.data.ais) {
				this.currentScenario.data.ais = {}
			}
			this.currentScenario.data.ais[this.aiLeek.id] = {id: ai.id, name: ai.path}
			this.saveScenario()
			this.aiDialog = false
		}
		deleteScenario(scenario: TestScenario) {
			if (scenario.base) { return }
			LeekWars.delete('test-scenario/delete', {id: scenario.id}).error(error => LeekWars.toast(error))
			Vue.delete(this.scenarios, scenario.id)
			this.selectScenario(LeekWars.first(this.allScenarios)!)
		}
		createScenario() {
			LeekWars.post('test-scenario/new', {name: this.newScenarioName}).then(data => {
				Vue.set(this.scenarios, data.id, {name: this.newScenarioName, id: data.id, data: data.data})
				this.newScenarioName = ''
				this.newScenarioDialog = false
				this.selectScenario(this.scenarios[data.id])
			})
			.error(error => LeekWars.toast(error))
		}
		addScenarioLeek(leek: Leek) {
			if (!this.currentScenario || !this.addLeekTeam) { return }
			Vue.set(this.addLeekTeam, leek.id, leek)
			let ai = null
			if (leek.real) {
				const real_ai = this.ais[this.leekAis[leek.id]]
				ai = {id: real_ai.id, name: real_ai.path}
			}
			this.currentScenario.data.ais[leek.id] = ai
			this.saveScenario()
			this.leekDialog = false
		}
		get availableLeeks() {
			if (!this.currentScenario) { return {} }
			const available_leeks: {[key: string]: Leek} = {}
			for (const l in this.leeks) {
				if (l in this.currentScenario.data.team1 || l in this.currentScenario.data.team2) { continue }
				available_leeks[l] = this.leeks[l]
			}
			if (this.$store.state.farmer) {
				for (const l in this.$store.state.farmer.leeks) {
					if (l in this.currentScenario.data.team1 || l in this.currentScenario.data.team2) { continue }
					available_leeks[l] = this.$store.state.farmer.leeks[l]
				}
			}
			return available_leeks
		}
		selectScenarioMap(map: TestMap) {
			if (!this.currentScenario) { return }
			this.currentScenario.data.map = map
			this.saveScenario()
			this.mapDialog = false
		}
		removeLeekChip(chip: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.chips.splice(this.currentLeek.chips.indexOf(chip), 1)
			this.saveLeek()
		}
		removeLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.weapons.splice(this.currentLeek.weapons.indexOf(weapon), 1)
			this.saveLeek()
		}
		addLeekChip(chip: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.chips.push(chip)
			this.chipsDialog = false
			this.saveLeek()
		}
		addLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.weapons.push(weapon)
			this.weaponsDialog = false
			this.saveLeek()
		}
		createLeek() {
			LeekWars.post('test-leek/new', {name: this.newLeekName}).then(data => {
				Vue.set(this.leeks, data.id, {name: this.newLeekName, id: data.id})
				for (const k in data.data) {
					Vue.set(this.leeks[data.id], k, data.data[k])
				}
				this.newLeekDialog = false
				this.newLeekName = ''
				this.currentLeek = this.leeks[data.id]
			})
			.error((error) => LeekWars.toast(error))
		}
		createMap() {
			LeekWars.post('test-map/new', {name: this.newMapName}).then(data => {
				Vue.set(this.maps, data.id, {name: this.newMapName, id: data.id, data: {obstacles: {}, team1: [], team2: []}})
				this.newMapDialog = false
				this.newMapName = ''
				this.selectMap(this.maps[data.id])
			})
			.error(error => LeekWars.toast(error))
		}
		characteristicFocusout(characteristic: string, event: FocusEvent) {
			if (!this.currentLeek || this.currentLeek.bot || !event.target) { return }
			const target = event.target as HTMLElement
			let value = parseInt(target.textContent as string, 10)
			if (isNaN(value)) {
				value = this.characsLimits[characteristic].min
			}
			value = Math.max(value, this.characsLimits[characteristic].min)
			value = Math.min(value, this.characsLimits[characteristic].max)
			// target.innerText
			Vue.set(this.currentLeek, characteristic, value)
			this.saveLeek()
		}
		launchTest() {
			if (!this.currentScenario) { return }
			const scenario = Object.assign({}, this.currentScenario.data)
			for (const i in scenario.ais) {
				scenario.ais[i] = Object.assign({}, scenario.ais[i])
				scenario.ais[i].includes = null
				scenario.ais[i].functions = null
			}
			const scenario_data = JSON.stringify(scenario)
			let v2 = false
			for (const i in this.currentScenario.data.ais) {
				if (i !== '-1' && this.currentScenario.data.ais[i] && this.currentScenario.data.ais[i].id in this.ais && this.ais[this.currentScenario.data.ais[i].id].v2) {
					v2 = true
					break
				}
			}
			const service = v2 ? 'ai/test-v2' : 'ai/test-new'
			LeekWars.post(service, {data: scenario_data}).then(data => {
				localStorage.setItem('editor/last-scenario-data', scenario_data)
				this.$router.push('/fight/' + data.fight)
			})
			.error(error => LeekWars.toast(error))
		}
	}
</script>

<style lang="scss" scoped>
	h4 {
		display: inline-block;
	}
	.indicator {
		background: #5fad1b;
	}
	.v-dialog .content {
		padding: 0;
	}
	.tabs .tab {
		cursor: pointer;
	}
	.leek-column, .column-scenario, .map-column {
		padding: 15px 0;
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
	.tab-content {
		display: flex;
		min-height: 530px;
	}
	.column {
		display: inline-block;
		vertical-align: top;
	}
	.lateral-column {
		width: 180px;
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
		background: #5fad1b;
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
		margin: 0 3px;
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
		background-image: url("/image/ai.png");
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
	.ai-dialog {
		height: 400px;
	}
	.ai-dialog .ai {
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 3px;
	}
	.ai-dialog .ai:hover {
		background: white;
		color: #5fad1b;
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
	.leek-dialog {
		display: flex;
		flex-wrap: wrap;
	}
	.leek-dialog .leek {
		text-align: center;
		padding: 8px;
		margin: 6px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		flex: 1;
	}
	.leek-dialog .leek .name {
		font-size: 20px;
		font-weight: 500;
		padding: 0 5px;
		padding-top: 4px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.column-scenario .map-container {
		text-align: center;
		width: 800px;
	}
	.column-scenario .map, .map-dialog .map {
		display: inline-block;
		text-align: center;
		font-size: 16px;
		cursor: pointer;
		margin: 5px;
		padding: 5px 10px;
	}
	.column-scenario .map img, .map-dialog .map img {
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
	.flex {
		align-items: center;
		padding-bottom: 15px;
	}
	.leek-column .image {
		display: inline-block;
		text-align: center;
		margin-left: 130px;
		padding: 7px;
	}
	.characteristics {
		padding: 15px;
		margin-right: 130px;
		.characteristic {
			width: calc(50% - 40px);
			padding: 5px 20px;
			display: inline-block;
			img {
				vertical-align: top;
				margin-right: 7px;
				width: 25px;
			}
			span {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				margin-top: 3px;
				font-weight: bold;
			}
		}
		.characteristic:nth-child(4n),
		.characteristic:nth-child(3),
		.characteristic:nth-child(7) {
			background: white;
		}
	}
	.leek-column .chips .container, .leek-column .weapons .container {
		display: inline-block;
	}
	.leek-column .chip, .chips-dialog .chip {
		width: 63px;
		cursor: pointer;
		margin: 0 2px;
	}
	.leek-column .weapon, .weapons-dialog .weapon {
		cursor: pointer;
		margin: 5px;
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
		vertical-align: top;
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
	.v-dialog .content.padding {
		padding: 15px;
	}
	.v-dialog input {
		width: calc(100% - 8px);
		padding-top: 3px;
		padding-bottom: 3px;
	}
</style>