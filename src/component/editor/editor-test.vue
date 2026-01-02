<template>
	<popup :modelValue="modelValue" :width="1060" :full="true" icon="mdi-play" :title="$t('run_test')" @update:modelValue="$emit('update:modelValue', $event)">
		<v-tabs :key="modelValue" v-model="currentTab" class="tabs" grow>
			<v-tab class="tab" value="scenarios">{{ $t('scenarios') }} ({{ LeekWars.objectSize(scenarios) }})</v-tab>
			<v-tab class="tab" value="leeks">{{ $t('test_leeks') }} ({{ LeekWars.objectSize(leeks) }})</v-tab>
			<v-tab class="tab" value="maps">{{ $t('test_maps') }} ({{ LeekWars.objectSize(maps) }})</v-tab>
		</v-tabs>
		<v-window v-model="currentTab" class="tabs-content">
			<v-window-item class="tab-content" value="scenarios">
				<div class="column lateral-column">
					<h4>{{ $t('test_scenario') }}</h4>
					<div class="items scenarios">
						<div v-for="scenario of scenarioList" :key="scenario.id" :class="{selected: scenario === currentScenario}" class="item scenario" @click="selectScenario(scenario)">
							<div class="name">{{ scenario.name }}</div>
							<span v-if="scenario.default" class="base">{{ $t('default') }}</span>
							<v-icon v-else class="delete" @click.stop="deleteScenario(scenario)">mdi-delete-outline</v-icon>
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
					<div class="team">
						<div class="leeks">
							<div v-for="leek of currentScenario.team1" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" v-ripple class="delete" @click="deleteLeek(leek, 0)">×</div>
								<div v-if="leek.id in allLeeks" class="card">
									<leek-image :leek="allLeeks[leek.id]" :ai="leek.ai" :scale="0.4" />
									<div>{{ allLeeks[leek.id].name }}</div>
								</div>
								<ai v-if="leek.id in allLeeks && leek.ai && leek.ai in allAis && (leek.id < 0 || leek.ai !== -1)" v-ripple="!allLeeks[leek.id].ally" :ai="allAis[leek.ai]" :small="true" :library="false" :locked="allLeeks[leek.id].ally" @click.native="clickLeekAI(leek)" />
								<div v-else v-ripple class="ai-placeholder" @click="clickLeekAI(leek)"></div>
							</div>
							<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.team1) < getLimit(currentScenario.type)" class="add" @click="addLeekTeam = currentScenario.team1; leekDialog = true">+</div>
						</div>
					</div>
					<div v-if="currentScenario.type !== FightType.BATTLE_ROYALE" class="vs">VS</div>
					<div v-if="currentScenario.type !== FightType.BATTLE_ROYALE" class="team">
						<div class="leeks">
							<div v-for="leek of currentScenario.team2" :key="leek.id" class="leek">
								<div v-if="!currentScenario.base" v-ripple class="delete" @click="deleteLeek(leek, 1)">×</div>
								<div v-if="leek.id in allLeeks" class="card">
									<leek-image :leek="allLeeks[leek.id]" :ai="leek.ai" :scale="0.4" />
									<div>{{ allLeeks[leek.id].name }}</div>
								</div>
								<ai v-if="leek.id in allLeeks && leek.ai && leek.ai in allAis && (leek.id < 0 || leek.ai !== -1)" v-ripple="!allLeeks[leek.id].ally" :ai="allAis[leek.ai]" :small="true" :library="false" :locked="allLeeks[leek.id].ally" @click.native="clickLeekAI(leek)" />
								<div v-else v-ripple class="ai-placeholder" @click="clickLeekAI(leek)"></div>
							</div>
							<div v-if="!currentScenario.base && LeekWars.objectSize(currentScenario.team2) < getLimit(currentScenario.type)" class="add" @click="addLeekTeam = currentScenario.team2; leekDialog = true">+</div>
						</div>
					</div>
					<br>
					<div class="title">{{ $t('test_map') }}</div>
					<div class="map-container">
						<div v-if="(currentScenario.map && currentScenario.map !== -1)" v-ripple class="map-card card" @click="mapDialog = true">
							<Map :obstacles="maps[currentScenario.map].data.obstacles" class="map-preview"></Map>
							<div v-if="currentScenario.map in maps" class="name">{{ maps[currentScenario.map].name }}</div>
						</div>
						<div v-else v-ripple class="map-card card" @click="mapDialog = true">
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
						<input v-model="currentScenario.seed" type="text" class="seed" :placeholder="$t('main.seed_placeholder')" @keyup.stop @input="updateSeed">
					</div>
				</div>
			</v-window-item>
			<v-window-item class="tab-content" value="leeks">
				<div class="column lateral-column">
					<h4>{{ $t('test_leeks') }}</h4>
					<div class="items leeks">
						<div v-for="leek of leeks" :key="leek.id" :class="{selected: leek === currentLeek}" class="item leek" @click="selectLeek(leek)">
							<div class="name">{{ leek.name }}</div>
							<span v-if="leek.bot" class="bot">bot</span>
							<v-icon v-if="!leek.bot" class="duplicate" @click.stop="duplicateTestLeek(leek)" :title="$t('duplicate')">mdi-content-copy</v-icon>
							<v-icon v-if="!leek.bot" class="delete" @click.stop="deleteTestLeek(leek)">mdi-delete-outline</v-icon>
						</div>
					</div>
					<div v-ripple class="item add" @click="newLeekDialog = true">✚ {{ $t('main.add') }}</div>
				</div>
				<div v-if="currentLeek" class="column leek-column">
					<div class="title name">{{ currentLeek.name }} <v-icon v-if="!currentLeek.bot" @click="changedLeekName = currentLeek.name; changeLeekNameDialog = true">mdi-pencil</v-icon>&nbsp;- {{ $t('main.level_n', [currentLeek.level]) }}</div>
					<div class="flex">
						<div class="image card">
							<leek-image :leek="currentLeek" :scale="1" />
						</div>
						<div class="card characteristics">
							<div v-for="c in LeekWars.characteristics_table" :key="c" class="characteristic" :class="c">
								<characteristic-tooltip v-slot="{ props }" :characteristic="c" :value="currentLeek[c]" :total="currentLeek[c]" :leek="currentLeek" :test="true">
									<img v-bind="props" :src="'/image/charac/' + c + '.png'">
								</characteristic-tooltip>
								<span :contenteditable="!currentLeek.bot" class="stat" :class="'color-' + c" @keyup.stop @focusout="characteristicFocusout(c, $event)" v-html="currentLeek[c]"></span>
							</div>
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
								<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[weapon.item]" :bottom="true" :nodge="true" :leek="currentLeek">
									<img :src="'/image/' + LeekWars.items[weapon.item].name.replace('_', '/') + '.png'" :class="{hidden: !hasWeaponEquipped(weapon.item)}" class="weapon" v-bind="props" @click="removeLeekWeapon(weapon.item)" :width="WeaponsData[LeekWars.items[weapon.item].params].width">
								</rich-tooltip-item>
								<div v-if="currentLeek.weapons.length < MAX_WEAPONS" class="add" @click="weaponsDialog = true">+</div>
							</div>
						</div>
						<br>
						<div class="title">{{ $t('main.chips') }} [{{ currentLeek.chips.length }} / {{ currentLeek.ram }}]</div>
						<div class="chips">
							<div class="container">
								<rich-tooltip-item v-for="(chip, c) of currentLeek.chips" :key="chip" v-slot="{ props }" :item="LeekWars.items[chip]" :nodge="true" :leek="currentLeek">
									<img :src="'/image/chip/' + LeekWars.items[chip].name.replace('chip_', '') + '.png'" :class="{disabled: c >= currentLeek.ram}" class="chip" v-bind="props" @click="removeLeekChip(chip)">
								</rich-tooltip-item>
								<div v-if="currentLeek.chips.length < currentLeek.ram" class="add" @click="chipsDialog = true">+</div>
							</div>
						</div>
					</div>
				</div>
			</v-window-item>
			<v-window-item class="tab-content" value="maps">
				<div class="column lateral-column">
					<h4>{{ $t('test_maps') }}</h4>
					<div class="items maps">
						<div v-for="map of maps" :key="map.id" :class="{selected: currentMap === map}" class="item map" @click="selectMap(map)">
							<div class="name">{{ map.name }}</div>
							<v-icon class="delete" @click.stop="deleteMap(map)">mdi-delete-outline</v-icon>
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
			</v-window-item>
		</v-window>
		<template #actions>
			<div v-ripple @click="$emit('input', false)">
				<v-icon>mdi-close</v-icon>
				<span>{{ $t('main.cancel') }}</span>
			</div>
			<div v-ripple class="green" @click="launchTest">
				<v-icon>mdi-play</v-icon>
				<span>{{ $t('test_validate') }}</span>
			</div>
		</template>

		<popup v-model="newScenarioDialog" :width="800">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_scenario') }}</span>
			<div class="padding">
				<input v-model="newScenarioName" :placeholder="$t('scenario_name')" type="text" class="input" @keyup.stop @keyup.enter="createScenario">
				<br><br>
				<div class="title">{{ $t('templates') }}</div>
				<div class="templates">
					<div v-for="(template, t) of templates" :key="t" v-ripple :class="{selected: selectedTemplate === t}" class="template card" @click="selectedTemplate = t">
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
			<template #actions>
				<div v-ripple @click="newScenarioDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="createScenario">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="newLeekDialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_leek') }}</span>
			<div class="padding">
				<input v-model="newLeekName" :placeholder="$t('leek_name')" type="text" class="input" @keyup.stop @keyup.enter="createLeek">
			</div>
			<template #actions>
				<div v-ripple @click="newLeekDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="createLeek">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="changeLeekNameDialog" :width="500">
			<v-icon slot="icon">mdi-pencil</v-icon>
			<span slot="title">{{ $t('leek_name') }}</span>
			<div class="padding">
				<input v-model="changedLeekName" :placeholder="$t('leek_name')" type="text" class="input" @keyup.stop @keyup.enter="changeLeekName">
			</div>
			<template #actions>
				<div v-ripple @click="changeLeekNameDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="changeLeekName">{{ $t('main.save') }}</div>
			</template>
		</popup>

		<popup v-model="newMapDialog" :width="500">
			<v-icon slot="icon">mdi-plus-circle-outline</v-icon>
			<span slot="title">{{ $t('create_new_map') }}</span>
			<div class="padding">
				<input v-model="newMapName" :placeholder="$t('map_name')" type="text" class="input" @keyup.stop @keyup.enter="createMap">
			</div>
			<template #actions>
				<div @click="newMapDialog = false">{{ $t('main.cancel') }}</div>
				<div class="green" @click="createMap">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="mapDialog" :width="870">
			<v-icon slot="icon">mdi-map</v-icon>
			<span slot="title">{{ $t('select_map') }}</span>
			<div class="padding map-dialog">
				<div v-ripple class="map-card card" @click="selectScenarioMap(null)">
					<img src="/image/map_icon_random.png">
					<div class="name">{{ $t('main.random') }}</div>
				</div>
				<div v-for="map of maps" :key="map.id" v-ripple class="map-card card" @click="selectScenarioMap(map)">
					<Map :obstacles="map.data.obstacles" class="map-preview" />
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
					<ai :ai="ai" :small="false" :library="false" />
					<ul>
						<li v-for="(spec, s) in ai.specs" :key="s">{{ $t(spec) }}</li>
					</ul>
				</div>
			</div>
			<explorer class="explorer" @select="clickDialogAI($event)" />
		</popup>

		<popup v-model="chipsDialog" :width="767">
			<v-icon slot="icon">mdi-chip</v-icon>
			<span slot="title" v-if="currentLeek">{{ $t('select_chips') }} [{{ currentLeek.chips.length }}/{{ currentLeek.ram }}]</span>
			<div v-if="currentLeek" class="padding chips-dialog">
				<rich-tooltip-item v-for="chip of availableChips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[LeekWars.chipTemplates[chip.template].item]" :bottom="true" :nodge="true" :leek="currentLeek">
					<span :class="{disabled: hasChipEquipped(chip.id)}" v-bind="props">
						<img :src="'/image/chip/' + chip.name + '.png'" class="chip" @click="addOrRemoveLeekChip(chip.id)">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>

		<popup v-model="weaponsDialog" :width="800">
			<img slot="icon" src="/image/icon/garden.png">
			<span slot="title" v-if="currentLeek">{{ $t('select_weapons') }} [{{ currentLeek.weapons.length }}/{{ MAX_WEAPONS }}]</span>
			<div v-if="currentLeek" class="padding weapons-dialog">
				<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[weapon.item]" :bottom="true" :nodge="true" :leek="currentLeek">
					<span :class="{disabled: hasWeaponEquipped(weapon.item)}" v-bind="props">
						<img :src="'/image/weapon/' + weapon.name + '.png'" class="weapon" v-bind="props" @click="addOrRemoveLeekWeapon(weapon.item)" :width="WeaponsData[LeekWars.items[weapon.item].params].width">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>
	</popup>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/explorer/explorer.${locale}.i18n`))
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { AI } from '@/model/ai'
	import { ChipTemplate } from '@/model/chip'
	import { FightType } from '@/model/fight'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { WeaponTemplate, WeaponsData } from '@/model/weapon'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import { fileSystem } from '@/model/filesystem'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import AIElement from '@/component/app/ai.vue'
	import { CHIPS } from '@/model/chips'
	import { ORDERED_CHIPS } from "@/model/sorted_chips"
	import Map from "@/component/app/map.vue"
import { emitter } from '@/model/vue'
import { defineAsyncComponent } from 'vue'

	class TestScenarioLeek {
		id!: number
		ai!: number | null
		hat?: number
		skin?: number
		metal?: boolean
		face?: number
	}

	class TestScenario {
		id!: number
		category!: string
		team1!: TestScenarioLeek[]
		team2!: TestScenarioLeek[]
		map!: number | null
		base!: boolean
		name!: string
		type!: number
		seed!: any
		default!: boolean
		ai!: AI | null // AI for default scenario
	}
	class TestMap {
		id!: number
		data!: any
	}
	class TestMapCell {
		cell!: number
		team!: number
	}

	@Options({ components: { CharacteristicTooltip, 'explorer': Explorer, RichTooltipItem, ai: AIElement, Map }, name: 'editor-test', i18n: {}, mixins: [...mixins] })
	export default class EditorTest extends Vue {
		@Prop() modelValue!: boolean
		@Prop() ais!: {[key: number]: AI}
		@Prop() leekAis!: {[key: number]: number}
		@Prop({ required: true }) currentAI!: AI | null

		FightType = FightType
		CHIPS = CHIPS
		WeaponsData = WeaponsData
		initialized: boolean = false
		scenarios: {[key: string]: TestScenario} = {}
		leeks: Leek[] = []
		maps: {[key: number]: TestMap} = {}
		currentScenario: TestScenario | null = null
		currentLeek: Leek | null = null
		currentMap: TestMap | null = null
		newScenarioDialog: boolean = false
		newScenarioName: string = ''
		newLeekDialog: boolean = false
		changeLeekNameDialog: boolean = false
		newLeekName: string = ''
		changedLeekName: string = ''
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
		fileSystem = fileSystem
		currentTab: string = 'scenarios'
		MAX_WEAPONS: number = 4

		domingo = {
			id: -1, name: "Domingo", ai: -1, bot: true, level: 150, skin: 1, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 2500",
			strength: "0 → 600",
			wisdom: "0 → 300",
			agility: "0 → 200",
			resistance: "0 → 300",
			science: 0,
			magic: 0,
			cores: 20,
			ram: 20,
		}
		betalpha = {
			id: -2, name: "Betalpha", ai: -1, bot: true, level: 150, skin: 8, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 2500",
			strength: 0,
			wisdom: "0 → 300",
			agility: "0 → 200",
			resistance: "0 → 300",
			science: 0,
			magic: "0 → 600",
			cores: 20,
			ram: 20,
		}
		tisma = {
			id: -3, name: "Tisma", ai: -1, bot: true, level: 150, skin: 14, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 2500",
			strength: 0,
			wisdom: "0 → 600",
			agility: "0 → 200",
			resistance: "0 → 300",
			science: "0 → 300",
			magic: 0,
			cores: 20,
			ram: 20,
		}
		guj = {
			id: -4, name: "Guj", ai: -1, bot: true, level: 150, skin: 4, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 5000",
			strength: 0,
			wisdom: "0 → 300",
			agility: "0 → 200",
			resistance: "0 → 300",
			science: 0,
			magic: 0,
			cores: 20,
			ram: 20,
		}
		hachess = {
			id: -5, name: "Hachess", ai: -1, bot: true, level: 150, skin: 5, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 2500",
			strength: 0,
			wisdom: "0 → 300",
			agility: "0 → 200",
			resistance: "0 → 600",
			science: 0,
			magic: 0,
			cores: 20,
			ram: 20,
		}
		rex = {
			id: -6, name: "Rex", ai: -1, bot: true, level: 150, skin: 2, hat: null,
			tp: "10 → 21",
			mp: "3 → 8",
			frequency: 100,
			life: "100 → 2500",
			strength: 0,
			wisdom: "0 → 300",
			agility: "0 → 200",
			resistance: "0 → 300",
			science: "0 → 600",
			magic: 0,
			cores: 20,
			ram: 20,
		}

		bots = [
			this.domingo,
			this.betalpha,
			this.tisma,
			this.guj,
			this.hachess,
			this.rex,
		]

		characsLimits: {[key: string]: any} = {
			life: {min: 1, max: 100000},
			strength: {min: 0, max: 9999},
			wisdom: {min: 0, max: 9999},
			agility: {min: 0, max: 9999},
			resistance: {min: 0, max: 9999},
			science: {min: 0, max: 9999},
			magic: {min: 0, max: 9999},
			frequency: {min: 100, max: 9999},
			tp: {min: 0, max: 1000},
			mp: {min: 0, max: 100},
			cores: {min: 1, max: 30},
			ram: {min: 1, max: 40},
		}
		selectedTemplate: number = 0
		compositionTemplates: any[] = []
		allies: {[key: number]: Leek} = {}
		alliesAIs: {[key: number]: AI} = {}
		advanced: boolean = false

		get templates(): TestScenario[] {
			const templates = [
				{id: 0, base: false, name: this.$t('free'), category: "free", team1: [] as TestScenarioLeek[], team2: [] as TestScenarioLeek[], map: null, type: -1}
			] as TestScenario[]
			if (!store.state.farmer) { return templates }

			// Scénarios solo
			for (const l in this.$store.state.farmer.leeks) {
				const leek = this.$store.state.farmer.leeks[l] as Leek
				if (!(leek.id in this.leekAis)) { continue }
				const ai = this.leekAis[leek.id]
				if (!ai) { continue }
				templates.push({
					id: 0, base: false, default: false, ai: null,
					name: "Solo " + leek.name, category: "solo", map: null, type: 0,
					team1: [{id: leek.id, ai}], team2: [{id: -1, ai: -2}], seed: null
				})
			}
			const generate_bots = (count: number) => {
				const result = []
				for (let i = 0; i < count; ++i) {
					result.push({id: -i - 1, ai: -1})
				}
				return result
			}
			const leek_count = LeekWars.objectSize(this.$store.state.farmer.leeks)
			const team2 = generate_bots(leek_count)
			const team1 = [] as TestScenarioLeek[]
			for (const leek in store.state.farmer.leeks) {
				const ai = store.state.farmer.leeks[leek].ai
				team1.push({ id: parseInt(leek, 10), ai: ai ? ai.id : null })
			}
			if (LeekWars.objectSize(store.state.farmer.leeks) > 1) {
				templates.push({
					id: 0, base: false, seed: null, default: false, ai: null,
					name: this.$t('main.farmer') as string, category: "farmer", map: null, team1, team2, type: 1
				})
			}
			templates.push({
				id: 0, base: false, seed: null, default: false, ai: null,
				name: "Battle Royale", category: "br", map: null, team1, team2: [], type: 3
			})
			for (const c in this.compositionTemplates) {
				const compo = this.compositionTemplates[c]
				templates.push({
					id: 0, base: false, seed: null, default: false, ai: null,
					name: compo.name, category: "team", map: null, team1: compo.leeks, team2: generate_bots(compo.leeks.length), type: 2
				})
			}
			return templates
		}

		get allLeeks() {
			const leeks: {[key: number]: Leek} = {}
			for (const leek of this.leeks) {
				leeks[leek.id] = leek
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
			return Object.values(LeekWars.weapons)
		}
		get availableChips() {
			if (!this.currentLeek) { return [] }
			return Object.values(CHIPS)
				.sort((chipA, chipB) => {
					return ORDERED_CHIPS[chipA.id] - ORDERED_CHIPS[chipB.id]
				})
		}

		get scenarioList() {
			return Object.values(this.scenarios).sort((a, b) => a.name.localeCompare(b.name))
		}

		created() {
			if (this.initialized) { return }

			this.advanced = localStorage.getItem("editor/test/advanced") === 'true'
		}

		mounted() {
			this.initMap()
			emitter.on('keyup', this.keyup)
		}

		beforeUnmount() {
			emitter.off('keyup', this.keyup)
		}

		keyup(e: KeyboardEvent) {
			if (this.modelValue && e.key === 'Enter') {
				this.launchTest()
			}
		}

		@Watch('modelValue', {immediate: true})
		update() {
			if (this.modelValue) {
				this.load()
				this.loadCompositions()
				this.updateAI()
			}
		}

		@Watch('currentAI')
		updateAI() {
			if (this.currentAI) {
				let scenario = this.currentAI.scenario
				if (!scenario) {
					for (const entrypoint of this.currentAI.entrypoints) {
						if (entrypoint in this.ais && this.ais[entrypoint].scenario) {
							scenario = this.ais[entrypoint].scenario
							break
						}
					}
				}
				if (scenario && scenario in this.scenarios) {
					this.selectScenario(this.scenarios[scenario])
				} else {
					// Create a default scenario
					this.scenarios[0] = {
						id: 0, base: false, default: true, ai: this.currentAI,
						name: this.currentAI.name, category: "free", map: null, type: 0,
						team1: [{id: LeekWars.first(store.state.farmer!.leeks)!.id, ai: this.currentAI.id}], team2: [{id: -1, ai: -2}], seed: null
					} as TestScenario
					this.selectScenario(this.scenarios[0])
				}
			}
		}

		generateBots() {
			for (const bot of this.bots) {
				this.leeks.push(bot as any)
			}
		}

		selectScenario(scenario: TestScenario) {
			this.currentScenario = scenario
			this.updateScenarioBotsLevels()
		}

		selectLeek(leek: any) {
			this.currentLeek = leek
			localStorage.setItem('editor/leek', '' + leek.id)
		}

		deleteLeek(leek: TestScenarioLeek, teamID: number) {
			if (!this.currentScenario) { return }
			const team = teamID === 0 ? this.currentScenario.team1 : this.currentScenario.team2
			team.splice(team.findIndex(l => l.id === leek.id), 1)
			const scenario = this.currentScenario
			if (scenario.id === 0) {
				LeekWars.post('test-scenario/new', { name: scenario.ai!.name }).then(r => {
					delete this.scenarios[0]
					scenario.id = r.id
					this.scenarios[r.id] = scenario
					scenario.default = false
					scenario!.ai!.scenario = r.id
					const json = { type: 0, ai: scenario.ai!.id }
					LeekWars.post('test-scenario/update', { id: r.id, data: JSON.stringify(json) })
					for (const leek of scenario.team1) {
						LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: leek.id, team: 0, ai: leek.ai ? leek.ai : null})
					}
					for (const leek of scenario.team2) {
						LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: leek.id, team: 1, ai: leek.ai ? leek.ai : null})
					}
				})
			} else {
				LeekWars.delete('test-scenario/delete-leek', {scenario_id: this.currentScenario.id, leek: leek.id})
			}
			this.updateScenarioBotsLevels()
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
					this.currentMap.data.obstacles[cell.cell] = true
				} else {
					delete this.currentMap.data.obstacles[cell.cell]
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
						this.currentMap.data.obstacles[cell.cell] = true
					} else {
						delete this.currentMap.data.obstacles[cell.cell]
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

			delete this.maps[map.id]
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
			if (this.allLeeks[leek.id] && this.allLeeks[leek.id].ally) { return }
			this.aiDialog = true
			this.aiDialogBot = leek.id < 0
			this.aiLeek = leek
		}

		clickDialogAI(ai: AI) {
			if (!this.currentScenario || !this.aiLeek) { return }
			this.aiLeek.ai = ai.id as any
			LeekWars.post('test-scenario/add-leek', {scenario_id: this.currentScenario.id, leek: this.aiLeek.id, team: -1, ai: ai.id})
			this.aiDialog = false
		}

		deleteScenario(scenario: TestScenario) {
			if (scenario.base) { return }
			LeekWars.delete('test-scenario/delete', {id: scenario.id})
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))

			delete this.scenarios[scenario.id]
			if (!LeekWars.isEmptyObj(this.scenarios)) {
				this.selectScenario(LeekWars.first(this.scenarios)!)
			} else {
				this.currentScenario = null
			}
		}

		createScenario() {
			LeekWars.post('test-scenario/new', {name: this.newScenarioName}).then(data => {
				const template = LeekWars.clone(this.templates[this.selectedTemplate]) as TestScenario
				const team1 = template.team1
				const team2 = template.team2
				this.scenarios[data.id] = {
					name: this.newScenarioName,
					id: data.id,
					team1,
					team2,
					map: null,
					type: template.type
				}
				const scenario = this.scenarios[data.id]
				this.updateScenario(scenario, { type: template.type })
				for (const leek of team1) {
					LeekWars.post('test-scenario/add-leek', {scenario_id: data.id, leek: leek.id, team: 0, ai: leek.ai ? leek.ai : null})
				}
				for (const leek of team2) {
					LeekWars.post('test-scenario/add-leek', {scenario_id: data.id, leek: leek.id, team: 1, ai: leek.ai ? leek.ai : null})
				}
				this.newScenarioName = ''
				this.newScenarioDialog = false
				this.selectScenario(scenario)
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		addScenarioLeek(leek: Leek) {
			if (!this.currentScenario || !this.addLeekTeam) { return }
			this.addLeekTeam.push({id: leek.id, ai: leek.ai})
			const teamID = this.addLeekTeam === this.currentScenario.team1 ? 0 : 1
			LeekWars.post('test-scenario/add-leek', {scenario_id: this.currentScenario.id, leek: leek.id, team: teamID, ai: leek.ai ? leek.ai : null})
			this.leekDialog = false
			this.updateScenarioBotsLevels()
		}

		updateScenarioBotsLevels() {
			if (!this.currentScenario) { return }
			let total_level = 0
			let count = 0
			const all_leeks = this.currentScenario!.team1.concat(this.currentScenario!.team2)
			for (const entity of all_leeks) {
				if (entity.id > 0 || entity.id < -6) {
					if (!(entity.id in this.allLeeks)) { continue }
					total_level += this.allLeeks[entity.id].level
					count++
				}
			}
			const average_level = count === 0 ? 1 : Math.round(total_level / count)
			for (const entity of all_leeks) {
				if (entity.id < 0 && entity.id >= -6) {
					if (!(entity.id in this.allLeeks)) { continue }
					this.allLeeks[entity.id].level = average_level
				}
			}
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
			this.updateScenario(this.currentScenario, { map: this.currentScenario.map })
			this.mapDialog = false
		}

		updateLeekLevel(leek: any) {
			leek.level = Math.max(
				leek.weapons.reduce((m: number, e: any) => Math.max(m, LeekWars.items[e].level), 1),
				leek.chips.reduce((m: number, e: any) => Math.max(m, LeekWars.items[e].level), 1)
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
			if (this.currentLeek.chips.length === this.currentLeek.ram) {
				this.chipsDialog = false
			}
			this.updateLeekLevel(this.currentLeek)
			this.saveLeek()
		}

		addLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			this.currentLeek.weapons.push(weapon)
			if (this.currentLeek.weapons.length === this.MAX_WEAPONS) {
				this.weaponsDialog = false
			}
			this.updateLeekLevel(this.currentLeek)
			this.saveLeek()
		}

		addOrRemoveLeekChip(chip: any) {
			if (!this.currentLeek) { return }
			if (!this.hasChipEquipped(chip)) {
				if (this.currentLeek!.chips.length < this.currentLeek.ram) {
					this.addLeekChip(chip)
				}
			} else {
				this.removeLeekChip(chip)
			}
		}

		addOrRemoveLeekWeapon(weapon: any) {
			if (!this.currentLeek) { return }
			if (!this.hasWeaponEquipped(weapon)) {
				if (this.currentLeek!.weapons.length < this.MAX_WEAPONS) {
					this.addLeekWeapon(weapon)
				}
			} else {
				this.removeLeekWeapon(weapon)
			}
		}

		hasChipEquipped(chip: any) {
			if (!this.currentLeek) { return false }
			return (this.currentLeek!.chips as any).indexOf(chip) !== -1
		}

		hasWeaponEquipped(weapon: any) {
			if (!this.currentLeek) { return false }
			return (this.currentLeek!.weapons as any).indexOf(weapon) !== -1
		}

		changeLeekName() {
			if (!this.currentLeek) { return }
			this.currentLeek.name = this.changedLeekName
			this.saveLeek()
			this.changeLeekNameDialog = false
		}

		createLeek() {
			LeekWars.post('test-leek/new', {name: this.newLeekName}).then(data => {
				const leek = {name: this.newLeekName, id: data.id, ai: -1}
				this.leeks.push(leek as any)
				for (const k in data.data) {
					leek[k] = data.data[k]
				}
				this.newLeekDialog = false
				this.newLeekName = ''
				this.currentLeek = leek as any
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		createMap() {
			LeekWars.post('test-map/new', {name: this.newMapName}).then(data => {
				this.maps[data.id] = {name: this.newMapName, id: data.id, data: {obstacles: {}, team1: [], team2: []}}
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
			this.currentLeek[characteristic] = value
			this.saveLeek()
		}

		duplicateTestLeek(leek: Leek) {
			LeekWars.post('test-leek/new', {name: leek.name}).then(data => {
				const newLeek = new Leek({
					...JSON.parse(JSON.stringify(leek)),
					id: data.id
				})
				this.leeks.push(newLeek as any)
				this.currentLeek = newLeek as any
				this.saveLeek()
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		deleteTestLeek(leek: Leek) {
			LeekWars.delete('test-leek/delete', {id: leek.id})
			this.leeks.splice(this.leeks.findIndex(l => l.id === leek.id), 1)
			// Delete in scenarios
			for (const s in this.scenarios) {
				this.scenarios[s].team1 = this.scenarios[s].team1.filter(l => l.id !== leek.id)
				this.scenarios[s].team2 = this.scenarios[s].team2.filter(l => l.id !== leek.id)
			}
			if (this.leeks.length) {
				this.selectLeek(this.leeks[0])
			}
		}

		launchTest() {
			if (!this.currentScenario || !this.currentAI) { return }
			this.currentAI.scenario = this.currentScenario.id
			LeekWars.post('ai/test-scenario', { scenario_id: this.currentScenario.id, ai_id: this.currentAI.id }).then(data => {
				localStorage.setItem('editor/last-scenario', '' + this.currentScenario!.id)
				localStorage.setItem('editor/last-scenario-ai', '' + this.currentAI!.id)
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
						LeekWars.delete('test-scenario/delete-leek', {scenario_id: this.currentScenario.id, leek: this.currentScenario.team1[i].id})
					}
					this.currentScenario.team1.length = limit
				}
				if (this.currentScenario.team2.length > limit) {
					for (let i = limit; i < this.currentScenario.team2.length; ++i) {
						LeekWars.delete('test-scenario/delete-leek', {scenario_id: this.currentScenario.id, leek: this.currentScenario.team2[i].id})
					}
					this.currentScenario.team2.length = limit
				}
			} else {
				// BR, clear team2
				for (const leek of this.currentScenario.team2) {
					LeekWars.delete('test-scenario/delete-leek', {scenario_id: this.currentScenario.id, leek: leek.id})
				}
				this.currentScenario.team2.length = 0
			}
			this.updateScenario(this.currentScenario, { type: this.currentScenario.type })
		}

		updateScenario(scenario: TestScenario, data: any) {
			if (scenario.id === 0) {
				LeekWars.post('test-scenario/new', { name: scenario.ai!.name }).then(r => {
					delete this.scenarios[0]
					scenario.id = r.id
					this.scenarios[r.id] = scenario
					scenario.default = false
					scenario!.ai!.scenario = r.id
					const json = { ...data, type: 0, ai: scenario.ai!.id }
					LeekWars.post('test-scenario/update', { id: r.id, data: JSON.stringify(json) })
					for (const leek of scenario.team1) {
						LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: leek.id, team: 0, ai: leek.ai ? leek.ai : null})
					}
					for (const leek of scenario.team2) {
						LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: leek.id, team: 1, ai: leek.ai ? leek.ai : null})
					}
				})
			} else {
				LeekWars.post('test-scenario/update', { id: scenario.id, data: JSON.stringify(data) })
			}
		}

		getLimit(type: FightType) {
			if (type === FightType.FREE) { return 8 }
			else if (type === FightType.SOLO) { return 1 }
			else if (type === FightType.FARMER) { return 4 }
			else if (type === FightType.TEAM) { return 6 }
			else if (type === FightType.BATTLE_ROYALE) { return 10 }
			return 6
		}

		load() {
			if (!this.initialized) {
				LeekWars.get('test-scenario/get-all').then(data => {
					this.initialized = true
					this.scenarios = data.scenarios
					this.updateAI()

					for (const leek of data.leeks) {
						this.leeks.push(leek)
						if (!leek.cores) {
							leek.cores = 20
							leek.ram = 20
						}
					}
					this.generateBots()
					for (const l in this.leeks) {
						const leek = this.leeks[l]
						if (!leek.chips) { leek.chips = [] }
						if (!leek.weapons) { leek.weapons = [] }
						leek.real = false
						leek.ai = -1 as any
					}
					const startLeekID = parseInt(localStorage.getItem('editor/leek') || '', 10)
					if (startLeekID && startLeekID in this.leeks) {
						this.selectLeek(this.leeks.find(l => l.id === startLeekID))
					} else if (this.leeks.length) {
						this.selectLeek(this.leeks[0])
					}

					this.maps = data.maps
					if (!LeekWars.isEmptyObj(this.maps)) {
						this.currentMap = LeekWars.first(this.maps)
					}
				})
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
			}
		}

		loadCompositions() {
			if (Object.values(this.compositionTemplates).length) { return }
			LeekWars.get('team-composition/get-farmer-compositions').then(compositions => {
				this.compositionTemplates = compositions
				for (const c in compositions) {
					const compo = compositions[c]
					for (const leek of compo.leeks) {
						if (!(leek.ai.id in this.ais)) {
							leek.ai.path = leek.ai.name
							this.alliesAIs[leek.ai.id] = leek.ai
						}
						if (!(leek.id in store.state.farmer!.leeks)) {
							this.allies[leek.id] = leek
							leek.ally = true
						}
						leek.ai = leek.ai ? leek.ai.id : null
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
				if (this.currentScenario.seed) {
					this.currentScenario.seed = parseInt(this.currentScenario.seed)
					if (this.currentScenario.seed > 2147483647) {
						this.currentScenario.seed = 2147483647
					} else if (this.currentScenario.seed < 1) {
						this.currentScenario.seed = 1
					} else if (isNaN(this.currentScenario.seed)) {
						this.currentScenario.seed = null
					}
				}
				this.updateScenario(this.currentScenario, { seed: this.currentScenario.seed || 0 })
			}
		}
	}
</script>

<style lang="scss" scoped>
	h4 {
		display: inline-block;
	}
	.v-dialog .content {
		padding: 0;
	}
	.tabs {
		::v-deep .tab-content {
			min-height: 600px;
		}
	}
	#app.app .tabs ::v-deep .tab-content {
		flex-direction: column;
	}
	.tabs .tab {
		cursor: pointer;
	}
	.leek-column, .column-scenario, .map-column {
		padding: 15px;
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
		max-height: 664px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	#app.app .tabs .column {
		max-height: none;
	}
	.lateral-column {
		flex: 220px 0 0;
		background: #333;
		color: #bbb;
		display: flex;
		flex-direction: column;
	}
	.lateral-column h4 {
		padding: 5px 10px;
		color: white;
		text-transform: uppercase;
		font-size: 16px;
		background: #555;
		display: block;
	}
	.items {
		overflow-y: auto;
		overflow-x: hidden;
	}
	.item {
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
	.lateral-column .item {
		display: flex;
		align-items: center;
		min-width: 0;
		height: 34px;
		flex: 34px 0 0;
		padding: 0 9px;
		gap: 9px;
		.name {
			flex: 1;
		}
		.v-icon {
			font-size: 20px;
			opacity: 0.5;
			color: white;
			&:hover {
				opacity: 1;
			}
		}
	}
	.title {
		font-size: 16px;
		font-weight: bold;
		text-transform: uppercase;
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
	#app.app .tabs .column-scenario .team {
		width: auto;
	}
	.column-scenario .leeks {
		text-align: center;
		display: inline-block;
		margin-top: -15px;
	}
	.column-scenario .add, .leek-column .add {
		background: var(--pure-white);
		font-size: 40px;
		border-radius: 50%;
		font-weight: 300;
		padding: 2px 14px;
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
		background: var(--border);
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
	.column-scenario .leek .ai:not(.locked) {
		cursor: pointer;
	}
	.explorer {
		height: 460px;
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
	#app.app .tabs .column-scenario .map-container {
		width: auto;
	}
	.column-scenario .map-card, .map-dialog .map-card {
		display: inline-block;
		text-align: center;
		font-size: 16px;
		cursor: pointer;
		margin: 5px;
		padding: 5px 10px;
		.name {
			margin-top: 4px;
		}
	}
	.column-scenario .map img, .map-dialog .map img {
		width: 80px;
	}
	.map-card img, .map-preview {
		width: 250px;
		height: 134px;
		object-fit: contain;
		vertical-align: bottom;
	}
	.item.leek .bot, .item.scenario .base {
		background: #777;
		color: white;
		border-radius: 4px;
		padding: 0 4px;
		margin-left: 5px;
		position: absolute;
		right: 7px;
		top: 8px;
	}
	#app.app .leek-column {
		width: auto;
	}
	.flex {
		align-items: center;
		padding-bottom: 15px;
	}
	#app.app .leek-column .flex {
		flex-direction: column;
		gap: 15px;
	}
	.leek-column .image {
		display: inline-block;
		text-align: center;
		margin-left: 130px;
		padding: 7px;
		width: 190px;
	}
	#app.app .leek-column .image {
		margin: 0;
	}
	.characteristics {
		margin-right: 130px;
		margin-left: 15px;
		min-width: 370px;
		.characteristic {
			width: 50%;
			padding: 5px 20px;
			display: inline-flex;
			align-items: center;
			gap: 5px;
			img {
				vertical-align: top;
				width: 25px;
			}
			.stat {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				font-weight: bold;
				padding: 2px 4px;
				border-radius: 4px;
				min-width: 120px;
				margin-right: 10px;
				&[contenteditable="true"] {
					border: 1px solid var(--border);
				&:hover {
					border: 1px solid #777;
				}
				}
			}
		}
		.characteristic:nth-child(4n+3),
		.characteristic:nth-child(4n+4) {
			background: var(--background-secondary);
		}
	}
	#app.app .characteristics {
		min-width: 0;
		margin: 0;
	}
	body.dark .characteristic.frequency {
		img {
			filter: invert(1);
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
		&.disabled {
			opacity: 0.4;
		}
	}
	.chips-dialog .disabled, .weapons-dialog .disabled {
		opacity: 0.4;
	}
	.leek-column .weapon, .weapons-dialog .weapon {
		cursor: pointer;
		margin: 5px;
		&.hidden {
			display: none;
		}
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
		border: 1px solid var(--border);
		margin: 2px;
		cursor: pointer;
		border-radius: 2px;
		background: var(--pure-white);
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
	.ai-placeholder {
		display: inline-flex;
		width: 65px;
		height: 87px;
		border: 2px dashed #777;
		margin-top: 10px;
		margin-left: -30px;
		vertical-align: top;
		background: white;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
