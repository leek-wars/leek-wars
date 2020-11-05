<template>
	<popup :value="value" :width="1024" :full="true" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-play</v-icon>
		<span slot="title">{{ $t('run_test') }}</span>
		<v-tabs :key="value" class="tabs" grow>
			<v-tabs-slider class="indicator" />
			<v-tab class="tab">{{ $t('scenarios') }} ({{ LeekWars.objectSize(scenarios) }})</v-tab>
			<v-tab class="tab">{{ $t('test_leeks') }} ({{ LeekWars.objectSize(leeks) }})</v-tab>
			<v-tab class="tab">{{ $t('test_maps') }} ({{ LeekWars.objectSize(maps) }})</v-tab>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>{{ $t('test_scenario') }}</h4>
					<div class="items scenarios">
						<div v-for="scenario of scenarios" :key="scenario.id" :class="{selected: scenario === currentScenario}" class="item scenario" @click="selectScenario(scenario)">
							{{ scenario.name }}
							<span v-if="scenario.base" class="base">{{ $t('base') }}</span>
							<div v-else class="delete" @click.stop="deleteScenario(scenario)"></div>
						</div>
					</div>
					<div v-ripple class="item add" @click="newScenarioDialog = true">✚ {{ $t('main.add') }}</div>
				</div>
				<div v-if="currentScenario" class="column column-scenario">
					<div class="title flex-title">
						{{ $t('test_leeks') }}
						<div class="spacer"></div>
						<select v-model="currentScenario.type" class="type-select" @change="changeType">
							<option :value="-1">{{ $t('type_free') }}</option>
							<option :value="0">{{ $t('type_solo') }} - {{ $t('limit', [1]) }}</option>
							<option :value="1">{{ $t('type_farmer') }} - {{ $t('limit', [4]) }}</option>
							<option :value="2">{{ $t('type_team') }} - {{ $t('limit', [6]) }}</option>
							<option :value="3">{{ $t('main.battle_royale') }} - {{ $t('limit', [10]) }}</option>
						</select>
					</div>
					<br>
					<div class="team team1">
						<div class="leeks">
							<div v-for="leek of currentScenario.team1" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" v-ripple class="delete" @click="deleteLeek(leek, 0)">×</div>
								<div v-if="leek.id in allLeeks" class="card">
									<leek-image :leek="allLeeks[leek.id]" :scale="0.4" />
									<div>{{ allLeeks[leek.id].name }}</div>
								</div>
								<ai v-if="leek.ai && leek.ai in allAis" v-ripple :ai="allAis[leek.ai]" :small="true" @click.native="clickLeekAI(leek)" />
							</div>
							<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.team1) < getLimit(currentScenario.type)" class="add" @click="addLeekTeam = currentScenario.team1; leekDialog = true">+</div>
						</div>
					</div>
					<div v-if="currentScenario.type !== FightType.BATTLE_ROYALE" class="vs">VS</div>
					<div v-if="currentScenario.type !== FightType.BATTLE_ROYALE" class="team team2">
						<div class="leeks">
							<div v-for="leek of currentScenario.team2" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" v-ripple class="delete" @click="deleteLeek(leek, 1)">×</div>
								<div v-if="leek.id in allLeeks" class="card">
									<leek-image :leek="allLeeks[leek.id]" :scale="0.4" />
									<div>{{ allLeeks[leek.id].name }}</div>
								</div>
								<ai v-if="leek.ai && leek.ai in allAis" v-ripple :ai="allAis[leek.ai]" :small="true" @click.native="clickLeekAI(leek)" />
							</div>
							<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.team2) < getLimit(currentScenario.type)" class="add" @click="addLeekTeam = currentScenario.team2; leekDialog = true">+</div>
						</div>
					</div>
					<br>
					<div class="title">{{ $t('test_map') }}</div>
					<div class="map-container">
						<div v-if="(currentScenario.map && currentScenario.map !== -1)" v-ripple class="map card" @click="mapDialog = true">
							<img src="/image/map_icon.png">
							<div v-if="currentScenario.map in maps" class="name">{{ maps[currentScenario.map].name }}</div>
						</div>
						<div v-else v-ripple class="map card" @click="mapDialog = true">
							<img src="/image/map_icon_random.png">
							<div class="name">{{ $t('main.random') }}</div>
						</div>
					</div>
					<br>
					<div class="title advanced" @click="advanced = !advanced">
						{{ $t('advanced') }}
						<v-icon v-if="advanced">mdi-chevron-up</v-icon>
						<v-icon v-else>mdi-chevron-down</v-icon>
					</div>
					<div v-if="advanced">
						<div>
							<span class="title"><v-icon>mdi-seed</v-icon> {{ $t('main.seed') }}</span>
							<span class="desc">{{ $t('main.seed_desc') }}</span>
						</div>
						<input v-model="currentScenario.seed" type="number" class="seed" min="1" max="2147483647" :placeholder="$t('main.seed_placeholder')" @input="updateSeed">
					</div>
				</div>
			</v-tab-item>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>{{ $t('test_leeks') }}</h4>
					<div class="items leeks">
						<div v-for="leek of leeks" :key="leek.id" :class="{selected: leek === currentLeek}" class="item leek" @click="selectLeek(leek)">
							{{ leek.name }}
							<span v-if="leek.bot" class="bot">bot</span>
							<div v-else class="delete" @click.stop="deleteTestLeek(leek)"></div>
						</div>
					</div>
					<div v-ripple class="item add" @click="newLeekDialog = true">✚ {{ $t('main.add') }}</div>
				</div>
				<div v-if="currentLeek" class="column leek-column">
					<div class="title name">{{ currentLeek.name }} - {{ $t('main.level_n', [currentLeek.level]) }}</div>
					<div class="flex">
						<div class="image card">
							<leek-image :leek="currentLeek" :scale="1" />
						</div>
						<div class="card characteristics">
							<characteristic-tooltip v-for="c in LeekWars.characteristics_table" :key="c" v-slot="{ on }" :characteristic="c" :value="currentLeek[c]" :leek="currentLeek" :test="true">
								<div class="characteristic" v-on="on">
									<img :src="'/image/charac/' + c + '.png'">
									<span :contenteditable="!currentLeek.bot" class="stat" :class="'color-' + c" @focusout="characteristicFocusout(c, $event)" v-html="currentLeek[c]"></span>
								</div>
							</characteristic-tooltip>
						</div>
					</div>
					<div v-if="currentLeek.bot">
						<div class="title">
							{{ $t('main.weapons') }} & {{ $t('main.chips') }}
						</div>
						<div>{{ $t('auto_items') }}</div>
					</div>
					<div v-else>
						<div class="title">{{ $t('main.weapons') }} [{{ currentLeek.weapons.length }}]</div>
						<div class="weapons">
							<div class="container">
								<rich-tooltip-weapon v-for="weapon of currentLeek.weapons" :key="weapon" v-slot="{ on }" :weapon="LeekWars.weapons[LeekWars.items[weapon].params]" :instant="true">
									<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" class="weapon" v-on="on" @click="removeLeekWeapon(weapon)">
								</rich-tooltip-weapon>
								<div v-if="currentLeek.weapons.length < 4" class="add" @click="weaponsDialog = true">+</div>
							</div>
						</div>
						<br>
						<div class="title">{{ $t('main.chips') }} [{{ currentLeek.chips.length }}]</div>
						<div class="chips">
							<div class="container">
								<rich-tooltip-chip v-for="chip in currentLeek.chips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip]" :instant="true">
									<img :src="'/image/chip/' + LeekWars.chips[chip].name + '.png'" class="chip" v-on="on" @click="removeLeekChip(chip)">
								</rich-tooltip-chip>
								<div v-if="currentLeek.chips.length < 20" class="add" @click="chipsDialog = true">+</div>
							</div>
						</div>
					</div>
				</div>
			</v-tab-item>
			<v-tab-item class="tab-content">
				<div class="column lateral-column">
					<h4>{{ $t('test_maps') }}</h4>
					<div class="items maps">
						<div v-for="map of maps" :key="map.id" :class="{selected: currentMap === map}" class="item map" @click="selectMap(map)">
							{{ map.name }}
							<div class="delete" @click.stop="deleteMap(map)"></div>
						</div>
					</div>
					<div v-ripple class="item add" @click="newMapDialog = true">✚ {{ $t('main.add') }}</div>
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
						<v-btn @click="clearMap">❌ {{ $t('main.clear') }}</v-btn>
						<v-btn @click="randomMap">❓ {{ $t('main.random') }}</v-btn>
					</div>
					<div class="instructions">
						<div class="instruction">✔ {{ $t('map_click_left') }}</div>
						<div class="instruction">✔ {{ $t('map_click_right') }}</div>
					</div>
				</div>
			</v-tab-item>
		</v-tabs>
		<div slot="actions">
			<div @click="$emit('input', false)">
				<v-icon>mdi-close</v-icon>
				<span>{{ $t('main.cancel') }}</span>
			</div>
			<div class="green" @click="launchTest">
				<v-icon>mdi-play</v-icon>
				<span>{{ $t('test_validate') }}</span>
			</div>
		</div>

		<popup v-model="newScenarioDialog" :width="800">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_scenario') }}</span>
			<div class="padding">
				<input v-model="newScenarioName" :placeholder="$t('scenario_name')" type="text" class="input" @keyup.enter="createScenario">
				<br><br>
				<div class="title">{{ $t('templates') }}</div>
				<div class="templates">
					<div v-for="(template, t) of templates" :key="t" v-ripple :class="{selected: selectedTemplate === t}" class="template card" @click="selectedTemplate = t; newScenarioName = template.name">
						<div v-if="template.category == 'free'">
							<v-icon>mdi-wrench</v-icon>
						</div>
						<div v-else-if="template.category == 'solo'">
							<leek-image :leek="allLeeks[template.team1[0].id]" :scale="0.27" />
						</div>
						<div v-else-if="template.category == 'farmer'">
							<leek-image v-for="leek of template.team1" :key="leek.id" :leek="allLeeks[leek.id]" :scale="0.23" />
						</div>
						<div v-else-if="template.category == 'team'">
							<leek-image v-for="leek of template.team1" :key="leek.id" :leek="leek" :scale="0.18" />
						</div>
						<div v-else-if="template.category == 'br'">
							<img src="/image/footer_leek.png">
							<span class="count">10</span>
						</div>
						<div class="name">{{ template.name }}</div>
					</div>
				</div>
			</div>
			<div slot="actions">
				<div @click="newScenarioDialog = false">{{ $t('main.cancel') }}</div>
				<div class="green" @click="createScenario">{{ $t('main.create') }}</div>
			</div>
		</popup>

		<popup v-model="newLeekDialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_leek') }}</span>
			<div class="padding">
				<input v-model="newLeekName" :placeholder="$t('leek_name')" type="text" class="input" @keyup.enter="createLeek">
			</div>
			<div slot="actions">
				<div @click="newLeekDialog = false">{{ $t('main.cancel') }}</div>
				<div class="green" @click="createLeek">{{ $t('main.create') }}</div>
			</div>
		</popup>

		<popup v-model="newMapDialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_map') }}</span>
			<div class="padding">
				<input v-model="newMapName" :placeholder="$t('map_name')" type="text" class="input" @keyup.enter="createMap">
			</div>
			<div slot="actions">
				<div @click="newMapDialog = false">{{ $t('main.cancel') }}</div>
				<div class="green" @click="createMap">{{ $t('main.create') }}</div>
			</div>
		</popup>

		<popup v-model="mapDialog" :width="700">
			<v-icon slot="icon">mdi-map</v-icon>
			<span slot="title">{{ $t('select_map') }}</span>
			<div class="padding map-dialog">
				<div v-ripple class="map card" @click="selectScenarioMap(null)">
					<img src="/image/map_icon_random.png">
					<div class="name">{{ $t('main.random') }}</div>
				</div>
				<div v-for="map of maps" :key="map.id" v-ripple class="map card" @click="selectScenarioMap(map)">
					<img src="/image/map_icon.png">
					<div class="name">{{ map.name }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="leekDialog" :width="700">
			<v-icon slot="icon">mdi-person</v-icon>
			<span slot="title">{{ $t('select_leek') }}</span>
			<div class="leek-dialog padding">
				<div v-for="leek of availableLeeks" :key="leek.id" v-ripple class="leek card" @click="addScenarioLeek(leek)">
					<leek-image :leek="leek" :scale="0.5" />
					<div class="name">{{ leek.name }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="aiDialog" :width="800">
			<v-icon slot="icon">mdi-code-braces</v-icon>
			<span slot="title">{{ $t('select_ai') }}</span>
			<div v-if="aiDialogBot" class="title"><v-icon>mdi-file</v-icon> {{ $t('bot_ais') }}</div>
			<div v-if="aiDialogBot" class="bot-ai">
				<div v-for="ai in fileSystem.botAIs" :key="ai.id" v-ripple class="ai" @click="clickDialogAI(ai)">
					<ai :ai="ai" />
					<ul>
						<li v-for="(spec, s) in ai.specs" :key="s">{{ $t(spec) }}</li>
					</ul>
				</div>
			</div>
			<div v-if="aiDialogBot" class="title"><v-icon>mdi-file-outline</v-icon> {{ $t('my_ais') }}</div>
			<div class="ai-dialog">
				<div v-for="ai of sortedAis" :key="ai.id" class="ai" @click="clickDialogAI(ai)">
					<div class="image"></div>
					<div class="name">{{ ai.path }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="chipsDialog" :width="767">
			<v-icon slot="icon">mdi-chip</v-icon>
			<span slot="title">{{ $t('select_chip') }}</span>
			<div v-if="currentLeek" class="padding chips-dialog">
				<rich-tooltip-chip v-for="chip of availableChips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip.id]" :bottom="true" :instant="true">
					<img :src="'/image/chip/' + chip.name + '.png'" class="chip" v-on="on" @click="addLeekChip(chip.id)">
				</rich-tooltip-chip>
			</div>
		</popup>

		<popup v-model="weaponsDialog" :width="800">
			<img slot="icon" src="/image/icon/garden.png">
			<span slot="title">{{ $t('select_weapon') }}</span>
			<div v-if="currentLeek" class="padding weapons-dialog">
				<rich-tooltip-weapon v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ on }" :weapon="LeekWars.weapons[LeekWars.items[weapon.id].params]" :bottom="true" :instant="true">
					<img :src="'/image/weapon/' + weapon.name + '.png'" class="weapon" v-on="on" @click="addLeekWeapon(weapon.item)">
				</rich-tooltip-weapon>
			</div>
		</popup>
	</popup>
</template>

<script lang="ts">
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { AI } from '@/model/ai'
	import { ChipTemplate } from '@/model/chip'
	import { FightType } from '@/model/fight'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { WeaponTemplate } from '@/model/weapon'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	class TestScenario {
		id!: any
		team1!: any[]
		team2!: any[]
		map!: number | null
		base!: boolean
		name!: string
		type!: number
		br!: boolean
		seed!: number | null
	}
	class TestMap {
		id!: number
		data!: any
	}
	class TestMapCell {
		cell!: number
		team!: number
	}
	@Component({ components: { CharacteristicTooltip }, i18n: {}, mixins })
	export default class EditorTest extends Vue {
		@Prop() value!: boolean
		@Prop() ais!: {[key: number]: AI}
		@Prop() leekAis!: {[key: number]: number}
		FightType = FightType
		initialized: boolean = false
		scenarios: {[key: string]: TestScenario} = {}
		leeks: {[key: number]: Leek} = {}
		maps: {[key: number]: TestMap} = {}
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
		aiDialogBot: boolean = false
		aiLeek: Leek | null = null
		chipsDialog: boolean = false
		weaponsDialog: boolean = false
		map: any = []
		map_down = false
		map_add = false
		timeout: number | null = null
		domingo = {id: -1, name: "Domingo", ai: -1, bot: true, level: 150, skin: 1, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: "50 to 1500", wisdom: 0, agility: 0, resistance: 0, science: 0, magic: 0}
		tisma = {id: -2, name: "Tisma", ai: -1, bot: true, level: 150, skin: 2, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: "50 to 1500", agility: 0, resistance: 0, science: 0, magic: 0}
		rioupi = {id: -3, name: "Rioupi", ai: -1, bot: true, level: 150, skin: 3, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: "50 to 1500", resistance: 0, science: 0, magic: 0}
		guj = {id: -4, name: "Guj", ai: -1, bot: true, level: 150, skin: 4, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: "50 to 1500", science: 0, magic: 0}
		hachess = {id: -5, name: "Hachess", ai: -1, bot: true, level: 150, skin: 5, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: 0, science: "50 to 1500", magic: 0}
		betalpha = {id: -6, name: "Betalpha", ai: -1, bot: true, level: 150, skin: 6, hat: null, tp: "10 to 20", mp: "3 to 8", frequency: 100, life: "100 to 3000", strength: 0, wisdom: 0, agility: 0, resistance: 0, science: 0, magic: "50 to 1500"}
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
		selectedTemplate: number = 0
		compositionTemplates: any[] = []
		allies: {[key: number]: Leek} = {}
		alliesAIs: {[key: number]: AI} = {}
		advanced: boolean = false

		get templates() {
			const templates = [
				{name: "Libre", category: "free", team1: [], team2: [], map: null, type: -1}
			] as any[]
			if (!store.state.farmer) { return templates }

			// Scénarios solo
			for (const l in this.$store.state.farmer.leeks) {
				const leek = this.$store.state.farmer.leeks[l] as Leek
				if (!(leek.id in this.leekAis)) { continue }
				const ai = this.leekAis[leek.id]
				if (!ai) { continue }
				templates.push({
					name: "Solo " + leek.name, category: "solo", map: null, type: 0,
					team1: [{id: leek.id, ai}], team2: [{id: -1, ai: null}]
				})
			}
			const generate_bots = (count: number) => {
				const result = []
				for (let i = 0; i < count; ++i) {
					result.push({id: -i - 1, ai: null})
				}
				return result
			}
			const leek_count = LeekWars.objectSize(this.$store.state.farmer.leeks)
			const team2 = generate_bots(leek_count)
			const team1 = []
			for (const leek in store.state.farmer.leeks) {
				team1.push({id: leek, ai: store.state.farmer.leeks[leek].ai})
			}
			if (LeekWars.objectSize(store.state.farmer.leeks) > 1) {
				templates.push({
					name: "Éleveur", category: "farmer", map: null, team1, team2, type: 1
				})
			}
			templates.push({
				name: "Battle Royale", category: "br", map: null, team1, team2: [], type: 3
			})
			for (const c in this.compositionTemplates) {
				const compo = this.compositionTemplates[c]
				templates.push({
					name: compo.name, category: "team", map: null, team1: compo.leeks, team2: generate_bots(compo.leeks.length), type: 2
				})
			}
			return templates
		}
		get allLeeks() {
			const leeks: {[key: number]: Leek} = {}
			for (const l in this.leeks) {
				leeks[l] = this.leeks[l]
			}
			if (store.state.farmer) {
				for (const l in store.state.farmer.leeks) {
					leeks[l] = store.state.farmer.leeks[l]
				}
			}
			for (const l in this.allies) {
				leeks[l] = this.allies[l]
			}
			return leeks
		}
		get allAis() {
			const ais = {...this.ais}
			for (const ai in this.alliesAIs) {
				ais[ai] = this.alliesAIs[ai]
			}
			return ais
		}
		get availableWeapons() {
			if (!this.currentLeek) { return [] }
			return Object.values(LeekWars.weapons).filter((w: WeaponTemplate) => (this.currentLeek!.weapons as any).indexOf(w.item) === -1)
		}
		get availableChips() {
			if (!this.currentLeek) { return [] }
			return Object.values(LeekWars.chips).filter((c: ChipTemplate) => (this.currentLeek!.chips as any).indexOf(c.id) === -1)
		}

		created() {
			if (this.initialized) { return }

			this.advanced = localStorage.getItem("editor/test/advanced") === 'true'

			LeekWars.get('test-scenario/get-all').then(data => {
				this.initialized = true
				this.scenarios = data.scenarios
				const startScenarioID = localStorage.getItem('editor/scenario')
				if (startScenarioID && startScenarioID in this.scenarios) {
					this.selectScenario(this.scenarios[startScenarioID])
				} else if (LeekWars.objectSize(this.scenarios)) {
					this.selectScenario(LeekWars.first(this.scenarios)!)
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))

			LeekWars.get('test-leek/get-all').then(data => {
				this.leeks = data.leeks
				this.generateBots()
				for (const l in this.leeks) {
					const leek = this.leeks[l]
					if (!leek.chips) { leek.chips = [] }
					if (!leek.weapons) { leek.weapons = [] }
				}
				const startLeekID = parseInt(localStorage.getItem('editor/leek') || '', 10)
				if (startLeekID && startLeekID in this.leeks) {
					this.selectLeek(this.leeks[startLeekID])
				} else if (LeekWars.objectSize(this.leeks)) {
					this.selectLeek(LeekWars.first(this.leeks)!)
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))

			LeekWars.get('test-map/get-all').then(data => {
				this.maps = data.maps
				if (!LeekWars.isEmptyObj(this.maps)) {
					this.currentMap = LeekWars.first(this.maps)
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}
		mounted() {
			this.initMap()
		}
		@Watch('value')
		update() {
			this.loadCompositions()
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
		selectLeek(leek: any) {
			this.currentLeek = leek
			localStorage.setItem('editor/leek', '' + leek.id)
		}
		deleteLeek(leek: Leek, teamID: number) {
			if (!this.currentScenario) { return }
			const team = teamID === 0 ? this.currentScenario.team1 : this.currentScenario.team2
			team.splice(team.findIndex(l => l.id === leek.id), 1)
			LeekWars.post('test-scenario/delete-leek', {scenario: this.currentScenario.id, leek: leek.id})
		}
		saveLeek() {
			if (!this.currentLeek) { return }
			LeekWars.post('test-leek/update', {id: this.currentLeek.id, data: JSON.stringify(this.currentLeek)})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}
		saveMap() {
			if (!this.currentMap) { return }
			LeekWars.post('test-map/update', {id: this.currentMap.id, data: JSON.stringify(this.currentMap.data)})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
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
			LeekWars.delete('test-map/delete', {id: map.id})
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))

			Vue.delete(this.$data.maps, map.id)
			// Delete from scenarios
			for (const s in this.scenarios) {
				if (this.scenarios[s].map === map.id) { this.scenarios[s].map = null }
			}
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
		clickLeekAI(leek: any) {
			this.aiDialog = true
			this.aiDialogBot = this.allLeeks[leek.id].bot
			this.aiLeek = leek
		}
		clickDialogAI(ai: AI) {
			if (!this.currentScenario || !this.aiLeek) { return }
			this.aiLeek.ai = ai.id as any
			LeekWars.post('test-scenario/add-leek', {scenario: this.currentScenario.id, leek: this.aiLeek.id, team: -1, ai: ai.id})
			this.aiDialog = false
		}
		deleteScenario(scenario: TestScenario) {
			if (scenario.base) { return }
			LeekWars.delete('test-scenario/delete', {id: scenario.id})
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))

			Vue.delete(this.scenarios, scenario.id)
			this.selectScenario(LeekWars.first(this.scenarios)!)
		}
		createScenario() {
			LeekWars.post('test-scenario/new', {name: this.newScenarioName}).then(data => {
				const template = LeekWars.clone(this.templates[this.selectedTemplate])
				const team1 = template.team1
				const team2 = template.team2
				Vue.set(this.scenarios, data.id, {
					name: this.newScenarioName,
					id: data.id,
					team1,
					team2,
					map: null,
					type: template.type
				})
				LeekWars.post('test-scenario/update', {id: data.id, data: JSON.stringify({type: template.type})})
				for (const leek of team1) {
					LeekWars.post('test-scenario/add-leek', {scenario: data.id, leek: leek.id, team: 0, ai: leek.ai ? leek.ai : null})
				}
				for (const leek of team2) {
					LeekWars.post('test-scenario/add-leek', {scenario: data.id, leek: leek.id, team: 1, ai: leek.ai ? leek.ai : null})
				}
				this.newScenarioName = ''
				this.newScenarioDialog = false
				this.selectScenario(this.scenarios[data.id])
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}
		addScenarioLeek(leek: Leek) {
			if (!this.currentScenario || !this.addLeekTeam) { return }
			this.addLeekTeam.push({id: leek.id, ai: leek.ai})
			const teamID = this.addLeekTeam === this.currentScenario.team1 ? 0 : 1
			LeekWars.post('test-scenario/add-leek', {scenario: this.currentScenario.id, leek: leek.id, team: teamID, ai: leek.ai ? leek.ai : null})
			this.leekDialog = false
		}
		get availableLeeks() {
			if (!this.currentScenario) { return {} }
			const available_leeks: {[key: string]: Leek} = {}
			for (const l in this.allLeeks) {
				const li = parseInt(l, 10)
				if (this.currentScenario.team1.find(le => le.id === li) || this.currentScenario.team2.find(le => le.id === li)) { continue }
				available_leeks[l] = this.allLeeks[l]
			}
			return available_leeks
		}
		selectScenarioMap(map: TestMap) {
			if (!this.currentScenario) { return }
			this.currentScenario.map = map ? map.id : null
			LeekWars.post('test-scenario/update', {id: this.currentScenario.id, data: JSON.stringify({map: this.currentScenario.map})})
			this.mapDialog = false
		}
		updateLeekLevel(leek: any) {
			leek.level = Math.max(
				leek.weapons.reduce((m: number, e: any) => Math.max(m, LeekWars.weapons[e].level), 1),
				leek.chips.reduce((m: number, e: any) => Math.max(m, LeekWars.chips[e].level), 1)
			)
		}
		removeLeekChip(chip: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.chips.splice(this.currentLeek.chips.indexOf(chip), 1)
			this.updateLeekLevel(this.currentLeek)
			this.saveLeek()
		}
		removeLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.weapons.splice(this.currentLeek.weapons.indexOf(weapon), 1)
			this.updateLeekLevel(this.currentLeek)
			this.saveLeek()
		}
		addLeekChip(chip: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.chips.push(chip)
			this.chipsDialog = false
			this.updateLeekLevel(this.currentLeek)
			this.saveLeek()
		}
		addLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.weapons.push(weapon)
			this.weaponsDialog = false
			this.updateLeekLevel(this.currentLeek)
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
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}
		createMap() {
			LeekWars.post('test-map/new', {name: this.newMapName}).then(data => {
				Vue.set(this.maps, data.id, {name: this.newMapName, id: data.id, data: {obstacles: {}, team1: [], team2: []}})
				this.newMapDialog = false
				this.newMapName = ''
				this.selectMap(this.maps[data.id])
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
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
		deleteTestLeek(leek: Leek) {
			LeekWars.post('test-leek/delete', {id: leek.id})
			Vue.delete(this.$data.leeks, leek.id)
			// Delete in scenarios
			for (const s in this.scenarios) {
				this.scenarios[s].team1 = this.scenarios[s].team1.filter(l => l.id !== leek.id)
				this.scenarios[s].team2 = this.scenarios[s].team2.filter(l => l.id !== leek.id)
			}
			if (!LeekWars.isEmptyObj(this.leeks)) {
				this.selectLeek(LeekWars.first(this.leeks)!)
			}
		}
		launchTest() {
			if (!this.currentScenario) { return }
			LeekWars.post('ai/test-scenario', {scenario_id: this.currentScenario.id}).then(data => {
				localStorage.setItem('editor/last-scenario', this.currentScenario!.id)
				this.$router.push('/fight/' + data.fight)
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}
		onAIDeleted(id: number) {
			for (const s in this.scenarios) {
				for (const leek of this.scenarios[s].team1) {
					if (leek.ai === id) { leek.ai = null }
				}
				for (const leek of this.scenarios[s].team2) {
					if (leek.ai === id) { leek.ai = null }
				}
			}
		}
		changeType() {
			if (!this.currentScenario) { return }
			if (this.currentScenario.type === FightType.FREE || this.currentScenario.type === FightType.SOLO || this.currentScenario.type === FightType.FARMER || this.currentScenario.type === FightType.TEAM) {
				const limit = this.getLimit(this.currentScenario.type)
				if (this.currentScenario.team1.length > limit) {
					for (let i = limit; i < this.currentScenario.team1.length; ++i) {
						LeekWars.post('test-scenario/delete-leek', {scenario: this.currentScenario.id, leek: this.currentScenario.team1[i].id})
					}
					this.currentScenario.team1.length = limit
				}
				if (this.currentScenario.team2.length > limit) {
					for (let i = limit; i < this.currentScenario.team2.length; ++i) {
						LeekWars.post('test-scenario/delete-leek', {scenario: this.currentScenario.id, leek: this.currentScenario.team2[i].id})
					}
					this.currentScenario.team2.length = limit
				}
			} else {
				// BR, clear team2
				for (const leek of this.currentScenario.team2) {
					LeekWars.post('test-scenario/delete-leek', {scenario: this.currentScenario.id, leek: leek.id})
				}
				this.currentScenario.team2.length = 0
			}
			LeekWars.post('test-scenario/update', {id: this.currentScenario.id, data: JSON.stringify({type: this.currentScenario.type})})
		}
		getLimit(type: FightType) {
			if (type === FightType.FREE) { return 6 }
			else if (type === FightType.SOLO) { return 1 }
			else if (type === FightType.FARMER) { return 4 }
			else if (type === FightType.TEAM) { return 6 }
			else if (type === FightType.BATTLE_ROYALE) { return 10 }
			return 6
		}
		loadCompositions() {
			if (this.compositionTemplates.length) { return }
			LeekWars.get('team-composition/get-farmer-compositions').then(compositions => {
				this.compositionTemplates = compositions
				for (const c in compositions) {
					const compo = compositions[c]
					for (const leek of compo.leeks) {
						if (!(leek.id in store.state.farmer!.leeks)) {
							Vue.set(this.allies, leek.id, leek)
						}
						if (!(leek.ai in this.ais)) {
							Vue.set(this.alliesAIs, leek.ai, {
								id: leek.ai,
								name: leek.ai_name,
								path: leek.ai_name
							})
						}
					}
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		@Watch('advanced')
		updateAdvanced() {
			localStorage.setItem("editor/test/advanced", '' + this.advanced)
		}

		updateSeed(event: InputEvent) {
			if (this.currentScenario) {
				if (event.data === '') {
					this.currentScenario.seed = null
				} else {
					const seed = parseInt(event.data!, 10)
					if (seed > 2147483647) {
						this.currentScenario.seed = 2147483647
					} else if (seed < 1) {
						this.currentScenario.seed = 1
					}
				}
				LeekWars.post('test-scenario/update', {id: this.currentScenario.id, data: JSON.stringify({ seed: this.currentScenario.seed || 0 })})
			}
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
	.tabs {
		::v-deep .tab-content {
			min-height: 600px;
		}
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
	.title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
		color: #555;
		padding-bottom: 8px;
		.v-icon {
			vertical-align: middle;
    		margin-bottom: 3px;
		}
		&.advanced {
			cursor: pointer;
			user-select: none;
		}
	}
	.desc {
		padding-left: 6px;
		color: #777;
	}
	.column-scenario .team {
		width: 810px;
		text-align: center;
	}
	.column-scenario .leeks {
		text-align: center;
		display: inline-block;
		margin-top: -15px;
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
		margin-left: 7px;
		margin-right: 7px;
		margin-top: 5px;
	}
	.column-scenario .add {
		margin-top: 46px;
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
		padding: 10px 30px;
		text-align: center;
	}
	.column-scenario .leek {
		display: inline-block;
		margin: 0 3px;
		font-size: 16px;
		position: relative;
		margin-top: 15px;
	}
	.column-scenario .leek .card {
		display: inline-block;
		text-align: center;
		padding: 5px;
	}
	.column-scenario .leek .ai {
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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
		width: 190px;
	}
	.characteristics {
		margin-right: 130px;
		margin-left: 15px;
		.characteristic {
			width: 50%;
			padding: 5px 20px;
			display: inline-block;
			img {
				vertical-align: top;
				margin-right: 7px;
				width: 25px;
			}
			.stat {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				margin-top: 3px;
				font-weight: bold;
			}
		}
		.characteristic:nth-child(8n+6),
		.characteristic:nth-child(8n+8) {
			background: #eee;
		}
	}
	.leek-column .chips .container, .leek-column .weapons .container {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
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
		margin: 2px;
	}
	.map-column .map {
		height: 430px;
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
		width: 27px;
		height: 27px;
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
		width: 100%;
		padding-top: 3px;
		padding-bottom: 3px;
		height: 34px;
	}
	.templates {
		display: grid;
		grid-gap: 10px;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		.template {
			padding: 10px 4px;
			cursor: pointer;
			text-align: center;
			border: 3px solid transparent;
			background: #f7f7f7;
			font-size: 17px;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			min-height: 80px;
			.name {
				padding-top: 3px;
			}
			img {
				width: 30px;
				padding: 3px;
			}
			.count {
				font-size: 20px;
				color: #555;
				vertical-align: top;
				padding-top: 10px;
				display: inline-block;
				font-weight: bold;
			}
			i {
				color: #555;
				font-size: 42px;
			}
			&.selected {
				border: 3px solid #5fad1b;
				background: white;
			}
		}
	}
	.flex-title {
		display: flex;
		align-items: center;
		.spacer {
			flex: 1;
		}
		.type-select {
			flex: 0 0 170px;
			height: 30px;
		}
	}
	input.seed {
		margin-top: 4px;
		padding: 0 6px;
		font-size: 18px;
	}
	.bot-ai {
		width: 100%;
		display: flex;
		gap: 10px;
		margin-top: 5px;
		margin-bottom: 20px;
		& > .ai {
			padding: 6px;
			cursor: pointer;
			border-radius: 4px;
			border: 1px solid #ccc;
			&:hover {
				background: white;
				box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
			}
		}
		& > * {
			flex: 1;
		}
		ul {
			margin: 3px 0;
			padding-left: 23px;
			font-size: 14px;
		}
	}
</style>