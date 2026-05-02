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
					<loader v-if="!initialized" />
					<template v-else>
						<div class="items scenarios">
							<div v-for="scenario of scenarioList" :key="scenario.id" :class="{selected: scenario === currentScenario}" class="item scenario" @click="selectScenario(scenario)">
								<div class="name">{{ scenario.name }}</div>
								<span v-if="scenario.default" class="base">{{ $t('default') }}</span>
								<v-icon v-else class="delete" @click.stop="deleteScenario(scenario)">mdi-delete-outline</v-icon>
							</div>
						</div>
						<div v-ripple class="item add" @click="newScenarioDialog = true">✚ {{ $t('main.add') }}</div>
					</template>
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
							<div v-if="currentScenario.type === FightType.TEAM" class="leek turret">
								<div class="card">
									<turret-image :level="100" :skin="0" :scale="0.4" />
									<div>{{ $t('main.turret') }}</div>
								</div>
								<ai v-if="turretAI1" v-ripple :ai="turretAI1" :small="true" :library="false" @click="clickTurretAI(1)" />
								<div v-else v-ripple class="ai-placeholder" @click="clickTurretAI(1)"></div>
							</div>
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
							<div v-if="currentScenario.type === FightType.TEAM" class="leek turret">
								<div class="card">
									<turret-image :level="100" :skin="1" :scale="0.4" />
									<div>{{ $t('main.turret') }}</div>
								</div>
								<ai v-if="turretAI2" v-ripple :ai="turretAI2" :small="true" :library="false" @click="clickTurretAI(2)" />
								<div v-else v-ripple class="ai-placeholder" @click="clickTurretAI(2)"></div>
							</div>
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
					<div v-if="advanced" class="advanced-options">
						<div>
							<div>
								<span class="title"><v-icon>mdi-seed</v-icon> {{ $t('main.seed') }}</span>
								<span class="desc">{{ $t('main.seed_desc') }}</span>
							</div>
							<input v-model="currentScenario.seed" type="text" class="seed" :placeholder="$t('main.seed_placeholder')" @keyup.stop @update:model-value="updateSeed">
						</div>
						<div>
							<div>
								<span class="title"><v-icon>mdi-timer-sand</v-icon> {{ $t('max_turns') }}</span>
								<span class="desc">{{ $t('max_turns_desc') }}</span>
							</div>
							<input v-model="currentScenario.max_turns" type="number" min="1" max="64" class="seed" :placeholder="$t('max_turns_placeholder')" @keyup.stop @update:model-value="updateMaxTurns">
						</div>
					</div>
				</div>
			</v-window-item>
			<v-window-item class="tab-content" value="leeks">
				<div class="column lateral-column">
					<h4>{{ $t('test_leeks') }}</h4>
					<loader v-if="!initialized" />
					<template v-else>
						<div class="items leeks">
							<div v-for="leek of leeks" :key="leek.id" :class="{selected: leek === currentLeek}" class="item leek" @click="selectLeek(leek)">
								<div class="name">{{ leek.name }}</div>
								<span v-if="leek.bot" class="bot">bot</span>
								<v-icon v-if="!leek.bot" class="duplicate" @click.stop="duplicateTestLeek(leek)" :title="$t('duplicate')">mdi-content-copy</v-icon>
								<v-icon v-if="!leek.bot" class="delete" @click.stop="deleteTestLeek(leek)">mdi-delete-outline</v-icon>
							</div>
						</div>
						<div v-ripple class="item add" @click="newLeekDialog = true">✚ {{ $t('main.add') }}</div>
					</template>
				</div>
				<div v-if="currentLeek" class="column leek-column">
					<div class="title name">{{ currentLeek.name }} <v-icon v-if="!currentLeek.bot" @click="changedLeekName = currentLeek.name; changeLeekNameDialog = true">mdi-pencil</v-icon>&nbsp;- {{ $t('main.level_n', [currentLeek.level]) }}</div>
					<div class="flex">
						<div class="image card">
							<leek-image :leek="currentLeek" :scale="1" />
							<div v-if="!currentLeek.bot" v-ripple class="skin-button" :title="$t('select_skin')" @click="skinPotionDialog = true">
								<img v-if="currentLeek.skin && LeekWars.potionsBySkin[currentLeek.skin]" :src="'/image/potion/' + LeekWars.potionsBySkin[currentLeek.skin].name + '.png'">
								<img v-else src="/image/potion/skin_green.png">
							</div>
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
					<loader v-if="!initialized" />
					<template v-else>
						<div class="items maps">
							<div v-for="map of maps" :key="map.id" :class="{selected: currentMap === map}" class="item map" @click="selectMap(map)">
								<div class="name">{{ map.name }}</div>
								<v-icon class="delete" @click.stop="deleteMap(map)">mdi-delete-outline</v-icon>
							</div>
						</div>
						<div v-ripple class="item add" @click="newMapDialog = true">✚ {{ $t('main.add') }}</div>
					</template>
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
			<div v-ripple @click="$emit('update:modelValue', false)">
				<v-icon>mdi-close</v-icon>
				<span>{{ $t('main.cancel') }}</span>
			</div>
			<div v-ripple class="green" @click="launchTest">
				<v-icon>mdi-play</v-icon>
				<span>{{ $t('test_validate') }}</span>
			</div>
		</template>

		<popup v-model="newScenarioDialog" :width="800" icon="mdi-plus-circle-outline">
			<template #title>{{ $t('create_new_scenario') }}</template>
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

		<popup v-model="newLeekDialog" :width="500" icon="mdi-plus-circle-outline" :title="$t('create_new_leek')">
			<div class="padding">
				<input v-model="newLeekName" :placeholder="$t('leek_name')" type="text" class="input" @keyup.stop @keyup.enter="createLeek">
			</div>
			<template #actions>
				<div v-ripple @click="newLeekDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="createLeek">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="changeLeekNameDialog" :width="500" icon="mdi-pencil" :title="$t('leek_name')">
			<div class="padding">
				<input v-model="changedLeekName" :placeholder="$t('leek_name')" type="text" class="input" @keyup.stop @keyup.enter="changeLeekName">
			</div>
			<template #actions>
				<div v-ripple @click="changeLeekNameDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="changeLeekName">{{ $t('main.save') }}</div>
			</template>
		</popup>

		<popup v-model="newMapDialog" :width="500" icon="mdi-plus-circle-outline" :title="$t('create_new_map')">
			<div class="padding">
				<input v-model="newMapName" :placeholder="$t('map_name')" type="text" class="input" @keyup.stop @keyup.enter="createMap">
			</div>
			<template #actions>
				<div @click="newMapDialog = false">{{ $t('main.cancel') }}</div>
				<div class="green" @click="createMap">{{ $t('main.create') }}</div>
			</template>
		</popup>

		<popup v-model="mapDialog" :width="870" icon="mdi-map" :title="$t('select_map')">
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

		<popup v-model="leekDialog" :width="700" icon="mdi-person" :title="$t('select_leek')">
			<div class="leek-dialog padding">
				<div v-for="leek of availableLeeks" :key="leek.id" v-ripple class="leek card" @click="addScenarioLeek(leek)">
					<leek-image :leek="leek" :scale="0.5" />
					<div class="name">{{ leek.name }}</div>
				</div>
			</div>
		</popup>

		<popup v-model="aiDialog" :width="800" icon="mdi-code-braces" :title="$t('select_ai')">
			<div v-if="aiDialogBot" class="title"><v-icon>mdi-file</v-icon> {{ $t('bot_ais') }}</div>
			<div v-if="aiDialogBot" class="bot-ai">
				<div v-for="ai in fileSystem.botAIs" :key="ai.path" v-ripple class="ai" @click="clickDialogAI(ai)">
					<ai :ai="ai" :small="false" :library="false" />
					<ul>
						<li v-for="(spec, s) in ai.specs" :key="s">{{ $t(spec) }}</li>
					</ul>
				</div>
			</div>
			<explorer class="explorer" @select="clickDialogAI($event)" />
		</popup>

		<popup v-model="chipsDialog" :width="767" icon="mdi-chip">
			<template #title v-if="currentLeek">{{ $t('select_chips') }} [{{ currentLeek.chips.length }}/{{ currentLeek.ram }}]</template>
			<div v-if="currentLeek" class="padding chips-dialog">
				<rich-tooltip-item v-for="chip of availableChips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[LeekWars.chipTemplates[chip.template].item]" :bottom="true" :nodge="true" :leek="currentLeek">
					<span :class="{disabled: hasChipEquipped(chip.id)}" v-bind="props">
						<img :src="'/image/chip/' + chip.name + '.png'" class="chip" @click="addOrRemoveLeekChip(chip.id)">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>

		<popup v-model="weaponsDialog" :width="800">
			<template #icon>
				<img src="/image/icon/garden.png">
			</template>
			<template #title>
				<span v-if="currentLeek">{{ $t('select_weapons') }} [{{ currentLeek.weapons.length }}/{{ MAX_WEAPONS }}]</span>
			</template>
			<div v-if="currentLeek" class="padding weapons-dialog">
				<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[weapon.item]" :bottom="true" :nodge="true" :leek="currentLeek">
					<span :class="{disabled: hasWeaponEquipped(weapon.item)}" v-bind="props">
						<img :src="'/image/weapon/' + weapon.name + '.png'" class="weapon" v-bind="props" @click="addOrRemoveLeekWeapon(weapon.item)" :width="WeaponsData[LeekWars.items[weapon.item].params].width">
					</span>
				</rich-tooltip-item>
			</div>
		</popup>

		<popup v-if="currentLeek" v-model="skinPotionDialog" :width="750">
			<template #icon>
				<img src="/image/icon/potion.png">
			</template>
			<template #title>
				{{ $t("select_skin") }}
			</template>
			<div class="padding farmer-potions">
				<div class="potions-grid">
					<v-tooltip v-for="(potion, id) in skinPotions" :key="id">
						<template #activator="{ props }">
							<div class="potion" @click="changeSkin(potion)" v-bind="props">
								<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
							</div>
						</template>
						<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
					</v-tooltip>
				</div>
			</div>
		</popup>
	</popup>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { AI } from '@/model/ai'
	import { FightType } from '@/model/fight'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Potion, PotionEffect } from '@/model/potion'
	import { store } from '@/model/store'
	import { WeaponsData } from '@/model/weapon'
	import { fileSystem } from '@/model/filesystem'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import AIElement from '@/component/app/ai.vue'
	import { CHIPS } from '@/model/chips'
	import { ORDERED_CHIPS } from '@/model/sorted_chips'
	import TurretImage from '@/component/turret-image.vue'
	import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'

	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/explorer/explorer.${locale}.i18n`))

	defineOptions({ name: 'editor-test', i18n: {}, mixins: [...mixins], components: { CharacteristicTooltip, RichTooltipItem, ai: AIElement, TurretImage } })

	const props = defineProps<{
		modelValue?: boolean
		ais?: {[key: string]: AI}
		leekAis?: {[key: number]: string}
		currentAI: AI | null
	}>()

	const { t } = useI18n()
	const router = useRouter()

	class TestScenarioLeek {
		id!: number
		ai!: string | null
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
		max_turns?: any
		default!: boolean
		ai!: AI | null
		turret_ai_team1?: number | null
		turret_ai_team2?: number | null
	}
	class TestMap {
		id!: number
		data!: any
	}
	class TestMapCell {
		cell!: number
		team!: number
	}

	const initialized = ref(false)
	const scenarios = reactive<{[key: string]: TestScenario}>({})
	const leeks = ref<Leek[]>([])
	const maps = reactive<{[key: number]: TestMap}>({})
	const currentScenario = ref<TestScenario | null>(null)
	const currentLeek = ref<Leek | null>(null)
	const currentMap = ref<TestMap | null>(null)
	const newScenarioDialog = ref(false)
	const newScenarioName = ref('')
	const newLeekDialog = ref(false)
	const changeLeekNameDialog = ref(false)
	const newLeekName = ref('')
	const changedLeekName = ref('')
	const newMapDialog = ref(false)
	const newMapName = ref('')
	const mapDialog = ref(false)
	const leekDialog = ref(false)
	const addLeekTeam = ref<any>(null)
	const aiDialog = ref(false)
	const aiDialogBot = ref(false)
	const aiLeek = ref<Leek | null>(null)
	const turretTeam = ref(0)
	const chipsDialog = ref(false)
	const weaponsDialog = ref(false)
	const skinPotionDialog = ref(false)
	const map = reactive<any[]>([])
	let map_down = false
	let map_add = false
	let timeout: number | null = null
	const currentTab = ref('scenarios')
	const MAX_WEAPONS = 4

	const domingo = { id: -1, name: "Domingo", ai: -1, bot: true, level: 150, skin: 1, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 2500", strength: "0 → 600", wisdom: "0 → 300", agility: "0 → 200", resistance: "0 → 300", science: 0, magic: 0, cores: 20, ram: 20 }
	const betalpha = { id: -2, name: "Betalpha", ai: -1, bot: true, level: 150, skin: 8, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 2500", strength: 0, wisdom: "0 → 300", agility: "0 → 200", resistance: "0 → 300", science: 0, magic: "0 → 600", cores: 20, ram: 20 }
	const tisma = { id: -3, name: "Tisma", ai: -1, bot: true, level: 150, skin: 14, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 2500", strength: 0, wisdom: "0 → 600", agility: "0 → 200", resistance: "0 → 300", science: "0 → 300", magic: 0, cores: 20, ram: 20 }
	const guj = { id: -4, name: "Guj", ai: -1, bot: true, level: 150, skin: 4, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 5000", strength: 0, wisdom: "0 → 300", agility: "0 → 200", resistance: "0 → 300", science: 0, magic: 0, cores: 20, ram: 20 }
	const hachess = { id: -5, name: "Hachess", ai: -1, bot: true, level: 150, skin: 5, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 2500", strength: 0, wisdom: "0 → 300", agility: "0 → 200", resistance: "0 → 600", science: 0, magic: 0, cores: 20, ram: 20 }
	const rex = { id: -6, name: "Rex", ai: -1, bot: true, level: 150, skin: 2, hat: null, tp: "10 → 21", mp: "3 → 8", frequency: 100, life: "100 → 2500", strength: 0, wisdom: "0 → 300", agility: "0 → 200", resistance: "0 → 300", science: "0 → 600", magic: 0, cores: 20, ram: 20 }

	const bots = [domingo, betalpha, tisma, guj, hachess, rex]

	const characsLimits: {[key: string]: any} = {
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

	const selectedTemplate = ref(0)
	const compositionTemplates = ref<any[]>([])
	const allies = reactive<{[key: number]: Leek}>({})
	const alliesAIs = reactive<{[key: number]: AI}>({})
	const teamTurretAI = ref<AI | null>(null)
	const advanced = ref(false)

	const templates = computed<TestScenario[]>(() => {
		const tmpl = [
			{id: 0, base: false, name: t('free'), category: "free", team1: [] as TestScenarioLeek[], team2: [] as TestScenarioLeek[], map: null, type: -1}
		] as TestScenario[]
		if (!store.state.farmer) return tmpl

		for (const l in store.state.farmer.leeks) {
			const leek = store.state.farmer.leeks[l] as Leek
			if (!props.leekAis || !(leek.id in props.leekAis)) continue
			const ai = props.leekAis[leek.id]
			if (!ai) continue
			tmpl.push({
				id: 0, base: false, default: false, ai: null,
				name: "Solo " + leek.name, category: "solo", map: null, type: 0,
				team1: [{id: leek.id, ai}], team2: [{id: -1, ai: '/normal'}], seed: null
			} as TestScenario)
		}
		const generate_bots = (count: number): TestScenarioLeek[] => {
			const result: TestScenarioLeek[] = []
			for (let i = 0; i < count; ++i) {
				result.push({id: -i - 1, ai: '/lambda'})
			}
			return result
		}
		const leek_count = LeekWars.objectSize(store.state.farmer.leeks)
		const team2 = generate_bots(leek_count)
		const team1 = [] as TestScenarioLeek[]
		for (const leek in store.state.farmer.leeks) {
			team1.push({ id: parseInt(leek, 10), ai: store.state.farmer.leeks[leek].ai_path || null })
		}
		if (LeekWars.objectSize(store.state.farmer.leeks) > 1) {
			tmpl.push({
				id: 0, base: false, seed: null, default: false, ai: null,
				name: t('main.farmer') as string, category: "farmer", map: null, team1, team2, type: 1
			} as TestScenario)
		}
		tmpl.push({
			id: 0, base: false, seed: null, default: false, ai: null,
			name: "Battle Royale", category: "br", map: null, team1, team2: [], type: 3
		} as TestScenario)
		for (const c in compositionTemplates.value) {
			const compo = compositionTemplates.value[c]
			tmpl.push({
				id: 0, base: false, seed: null, default: false, ai: null,
				name: compo.name, category: "team", map: null, team1: compo.leeks, team2: generate_bots(compo.leeks.length), type: 2
			} as TestScenario)
		}
		return tmpl
	})

	const allLeeks = computed(() => {
		const all: {[key: number]: Leek} = {}
		for (const leek of leeks.value) {
			all[leek.id] = leek
		}
		if (store.state.farmer) {
			for (const l in store.state.farmer.leeks) {
				all[+l] = store.state.farmer.leeks[+l]
			}
		}
		for (const l in allies) {
			all[+l] = allies[+l]
		}
		return all
	})

	const allAis = computed(() => {
		const result = {...(props.ais || {})} as {[key: string]: AI}
		for (const ai in alliesAIs) {
			result[ai] = alliesAIs[+ai]
		}
		return result
	})

	const turretAI1 = computed<AI | null>(() => {
		if (currentScenario.value?.turret_ai_team1 && currentScenario.value.turret_ai_team1 in allAis.value) {
			return allAis.value[currentScenario.value.turret_ai_team1]
		}
		return teamTurretAI.value
	})

	const turretAI2 = computed<AI | null>(() => {
		if (currentScenario.value?.turret_ai_team2 && currentScenario.value.turret_ai_team2 in allAis.value) {
			return allAis.value[currentScenario.value.turret_ai_team2]
		}
		return teamTurretAI.value
	})

	const availableWeapons = computed(() => {
		if (!currentLeek.value) return []
		return Object.values(LeekWars.weapons)
	})

	const availableChips = computed(() => {
		if (!currentLeek.value) return []
		return Object.values(CHIPS).sort((a, b) => ORDERED_CHIPS[a.id] - ORDERED_CHIPS[b.id])
	})

	const scenarioList = computed(() => Object.values(scenarios).sort((a, b) => a.name.localeCompare(b.name)))

	if (!initialized.value) {
		advanced.value = localStorage.getItem("editor/test/advanced") === 'true'
	}

	onMounted(() => {
		initMap()
		emitter.on('keyup', keyup)
	})

	onBeforeUnmount(() => {
		emitter.off('keyup', keyup)
	})

	function keyup(e: KeyboardEvent) {
		if (props.modelValue && e.key === 'Enter') {
			launchTest()
		}
	}

	watch(() => props.modelValue, () => {
		if (props.modelValue) {
			load()
			loadCompositions()
			updateAI()
		}
	}, { immediate: true })

	watch(() => props.currentAI, () => updateAI())

	function updateAI() {
		if (props.currentAI) {
			let scenario = props.currentAI.scenario
			if (!scenario) {
				for (const entrypoint of props.currentAI.entrypoints) {
					if (props.ais && entrypoint in props.ais && props.ais[entrypoint].scenario) {
						scenario = props.ais[entrypoint].scenario
						break
					}
				}
			}
			if (scenario && scenario in scenarios) {
				selectScenario(scenarios[scenario])
			} else {
				scenarios[0] = {
					id: 0, base: false, default: true, ai: props.currentAI,
					name: props.currentAI.name, category: "free", map: null, type: 0,
					team1: [{id: LeekWars.first(store.state.farmer!.leeks)!.id, ai: props.currentAI.path}], team2: [{id: -1, ai: '/lambda'}], seed: null
				} as TestScenario
				selectScenario(scenarios[0])
			}
		}
	}

	function generateBots() {
		for (const bot of bots) {
			leeks.value.push(bot as any)
		}
	}

	function selectScenario(scenario: TestScenario) {
		currentScenario.value = scenario
		updateScenarioBotsLevels()
	}

	function selectLeek(leek: any) {
		currentLeek.value = leek
		localStorage.setItem('editor/leek', '' + leek.id)
	}

	function deleteLeek(leek: TestScenarioLeek, teamID: number) {
		if (!currentScenario.value) return
		const team = teamID === 0 ? currentScenario.value.team1 : currentScenario.value.team2
		team.splice(team.findIndex(l => l.id === leek.id), 1)
		const scenario = currentScenario.value
		if (scenario.id === 0) {
			LeekWars.post('test-scenario/new', { name: scenario.ai!.name }).then(r => {
				delete scenarios[0]
				scenario.id = r.id
				scenarios[r.id] = scenario
				scenario.default = false
				scenario.ai!.scenario = r.id
				const json = { type: 0, ai: scenario.ai!.id }
				LeekWars.post('test-scenario/update', { id: r.id, data: JSON.stringify(json) })
				for (const l of scenario.team1) {
					LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: l.id, team: 0, ai: l.ai ? l.ai : null})
				}
				for (const l of scenario.team2) {
					LeekWars.post('test-scenario/add-leek', {scenario_id: r.id, leek: l.id, team: 1, ai: l.ai ? l.ai : null})
				}
			})
		} else {
			LeekWars.delete('test-scenario/delete-leek', {scenario_id: currentScenario.value.id, leek: leek.id})
		}
		updateScenarioBotsLevels()
	}

	function saveLeek() {
		if (!currentLeek.value) return
		LeekWars.post('test-leek/update', {id: currentLeek.value.id, data: JSON.stringify(currentLeek.value)})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	const skinPotions = computed(() => {
		if (!store.state.farmer) return []
		return store.state.farmer.potions.filter(p => LeekWars.potions[p.template].effects.some((e: any) => e.type === PotionEffect.CHANGE_SKIN))
	})

	function changeSkin(potion: Potion) {
		if (!currentLeek.value) return
		const effect = LeekWars.potions[potion.template].effects.find((e: any) => e.type === PotionEffect.CHANGE_SKIN)
		if (!effect) return
		currentLeek.value.skin = effect.params[0]
		skinPotionDialog.value = false
		saveLeek()
	}

	function saveMap() {
		if (!currentMap.value) return
		LeekWars.post('test-map/update', {id: currentMap.value.id, data: JSON.stringify(currentMap.value.data)})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function selectMap(m: TestMap) {
		if (currentMap.value && timeout) {
			window.clearTimeout(timeout)
			timeout = null
			saveMap()
		}
		currentMap.value = m
	}

	function initMap() {
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
			map.push(line)
		}
	}

	function cellRightClick(e: Event, cell: TestMapCell) {
		if (cell.team !== 0 && currentMap.value) {
			const team_array = cell.team === 1 ? currentMap.value.data.team1 : currentMap.value.data.team2
			const index = team_array.indexOf(cell.cell)
			if (index !== -1) {
				team_array.splice(index, 1)
			} else {
				team_array.push(cell.cell)
			}
			resetSaveTimeout()
		}
		e.preventDefault()
	}

	function cellMouseDown(e: MouseEvent, cell: TestMapCell) {
		if (e.button === 0 && currentMap.value) {
			map_down = true
			map_add = !(cell.cell in currentMap.value.data.obstacles)
			if (map_add) {
				currentMap.value.data.obstacles[cell.cell] = true
			} else {
				delete currentMap.value.data.obstacles[cell.cell]
			}
			resetSaveTimeout()
		} else if (e.button === 2) {
			cellRightClick(e, cell)
		}
	}

	function cellMouseEnter(_e: Event, cell: TestMapCell) {
		if (map_down && currentMap.value) {
			const has_class = cell.cell in currentMap.value.data.obstacles
			if (has_class !== map_add) {
				if (map_add) {
					currentMap.value.data.obstacles[cell.cell] = true
				} else {
					delete currentMap.value.data.obstacles[cell.cell]
				}
				resetSaveTimeout()
			}
		}
	}

	function cellMouseUp() {
		map_down = false
	}

	function cellDragStart(e: Event) {
		e.preventDefault()
		return false
	}

	function resetSaveTimeout() {
		if (timeout) window.clearTimeout(timeout)
		timeout = window.setTimeout(() => {
			timeout = null
			saveMap()
		}, 2000)
	}

	function deleteMap(m: TestMap) {
		LeekWars.delete('test-map/delete', {id: m.id})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))

		delete maps[m.id]
		for (const s in scenarios) {
			if (scenarios[s].map === m.id) scenarios[s].map = null
		}
		if (!LeekWars.isEmptyObj(maps)) {
			selectMap(LeekWars.first(maps)!)
		}
	}

	function clearMap() {
		if (!currentMap.value) return
		currentMap.value.data.obstacles = {}
		resetSaveTimeout()
	}

	function randomMap() {
		if (!currentMap.value) return
		currentMap.value.data.obstacles = {}
		for (let cell = 0; cell < 612; ++cell) {
			if (Math.random() > 0.8) {
				currentMap.value.data.obstacles[cell] = true
			}
		}
		resetSaveTimeout()
	}

	const sortedAis = computed(() => {
		if (!props.ais) return []
		return Object.values(props.ais).sort((a, b) => a.path.toLowerCase().localeCompare(b.path.toLowerCase()))
	})

	function clickLeekAI(leek: any) {
		if (allLeeks.value[leek.id] && (allLeeks.value[leek.id] as any).ally) return
		turretTeam.value = 0
		aiDialog.value = true
		aiDialogBot.value = leek.id < 0
		aiLeek.value = leek
	}

	function clickTurretAI(team: number) {
		turretTeam.value = team
		aiLeek.value = null
		aiDialog.value = true
		aiDialogBot.value = false
	}

	function clickDialogAI(ai: AI) {
		if (!currentScenario.value) return
		if (turretTeam.value > 0) {
			if (turretTeam.value === 1) {
				currentScenario.value.turret_ai_team1 = ai.path as any
				updateScenario(currentScenario.value, { turret_ai_team1: ai.path })
			} else {
				currentScenario.value.turret_ai_team2 = ai.path as any
				updateScenario(currentScenario.value, { turret_ai_team2: ai.path })
			}
			turretTeam.value = 0
			aiDialog.value = false
			return
		}
		if (!aiLeek.value) return
		;(aiLeek.value as any).ai = ai.path as any
		LeekWars.post('test-scenario/add-leek', {scenario_id: currentScenario.value.id, leek: aiLeek.value.id, team: -1, ai: ai.path})
		aiDialog.value = false
	}

	function deleteScenario(scenario: TestScenario) {
		if (scenario.base) return
		LeekWars.delete('test-scenario/delete', {id: scenario.id})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))

		delete scenarios[scenario.id]
		if (!LeekWars.isEmptyObj(scenarios)) {
			selectScenario(LeekWars.first(scenarios)!)
		} else {
			currentScenario.value = null
		}
	}

	function createScenario() {
		LeekWars.post('test-scenario/new', {name: newScenarioName.value}).then(data => {
			const template = LeekWars.clone(templates.value[selectedTemplate.value]) as TestScenario
			const team1 = template.team1
			const team2 = template.team2
			scenarios[data.id] = {
				name: newScenarioName.value,
				id: data.id,
				team1, team2,
				map: null,
				type: template.type
			} as TestScenario
			const scenario = scenarios[data.id]
			updateScenario(scenario, { type: template.type })
			for (const leek of team1) {
				LeekWars.post('test-scenario/add-leek', {scenario_id: data.id, leek: leek.id, team: 0, ai: leek.ai ? leek.ai : null})
			}
			for (const leek of team2) {
				LeekWars.post('test-scenario/add-leek', {scenario_id: data.id, leek: leek.id, team: 1, ai: leek.ai ? leek.ai : null})
			}
			newScenarioName.value = ''
			newScenarioDialog.value = false
			selectScenario(scenario)
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function addScenarioLeek(leek: Leek) {
		if (!currentScenario.value || !addLeekTeam.value) return
		addLeekTeam.value.push({id: leek.id, ai: leek.ai})
		const teamID = addLeekTeam.value === currentScenario.value.team1 ? 0 : 1
		LeekWars.post('test-scenario/add-leek', {scenario_id: currentScenario.value.id, leek: leek.id, team: teamID, ai: leek.ai ? leek.ai : null})
		leekDialog.value = false
		updateScenarioBotsLevels()
	}

	function updateScenarioBotsLevels() {
		if (!currentScenario.value) return
		let total_level = 0
		let count = 0
		const all_leeks = currentScenario.value.team1.concat(currentScenario.value.team2)
		for (const entity of all_leeks) {
			if (entity.id > 0 || entity.id < -6) {
				if (!(entity.id in allLeeks.value)) continue
				total_level += allLeeks.value[entity.id].level
				count++
			}
		}
		const average_level = count === 0 ? 1 : Math.round(total_level / count)
		for (const entity of all_leeks) {
			if (entity.id < 0 && entity.id >= -6) {
				if (!(entity.id in allLeeks.value)) continue
				allLeeks.value[entity.id].level = average_level
			}
		}
	}

	const availableLeeks = computed(() => {
		if (!currentScenario.value) return {}
		const al: {[key: string]: Leek} = {}
		for (const l in allLeeks.value) {
			const li = parseInt(l, 10)
			if (currentScenario.value.team1.find(le => le.id === li) || currentScenario.value.team2.find(le => le.id === li)) continue
			al[l] = allLeeks.value[+l]
		}
		return al
	})

	function selectScenarioMap(m: TestMap) {
		if (!currentScenario.value) return
		currentScenario.value.map = m ? m.id : null
		updateScenario(currentScenario.value, { map: currentScenario.value.map })
		mapDialog.value = false
	}

	function updateLeekLevel(leek: any) {
		leek.level = Math.max(
			leek.weapons.reduce((m: number, e: any) => Math.max(m, LeekWars.items[e].level), 1),
			leek.chips.reduce((m: number, e: any) => Math.max(m, LeekWars.items[e].level), 1)
		)
	}

	function removeLeekChip(chip: any) {
		if (!currentLeek.value) return
		currentLeek.value.chips.splice(currentLeek.value.chips.indexOf(chip), 1)
		updateLeekLevel(currentLeek.value)
		saveLeek()
	}

	function removeLeekWeapon(weapon: any) {
		if (!currentLeek.value) return
		currentLeek.value.weapons.splice(currentLeek.value.weapons.indexOf(weapon), 1)
		updateLeekLevel(currentLeek.value)
		saveLeek()
	}

	function addLeekChip(chip: any) {
		if (!currentLeek.value) return
		currentLeek.value.chips.push(chip)
		if (currentLeek.value.chips.length === currentLeek.value.ram) chipsDialog.value = false
		updateLeekLevel(currentLeek.value)
		saveLeek()
	}

	function addLeekWeapon(weapon: any) {
		if (!currentLeek.value) return
		currentLeek.value.weapons.push(weapon)
		if (currentLeek.value.weapons.length === MAX_WEAPONS) weaponsDialog.value = false
		updateLeekLevel(currentLeek.value)
		saveLeek()
	}

	function addOrRemoveLeekChip(chip: any) {
		if (!currentLeek.value) return
		if (!hasChipEquipped(chip)) {
			if (currentLeek.value.chips.length < currentLeek.value.ram) addLeekChip(chip)
		} else {
			removeLeekChip(chip)
		}
	}

	function addOrRemoveLeekWeapon(weapon: any) {
		if (!currentLeek.value) return
		if (!hasWeaponEquipped(weapon)) {
			if (currentLeek.value.weapons.length < MAX_WEAPONS) addLeekWeapon(weapon)
		} else {
			removeLeekWeapon(weapon)
		}
	}

	function hasChipEquipped(chip: any) {
		if (!currentLeek.value) return false
		return (currentLeek.value.chips as any).indexOf(chip) !== -1
	}

	function hasWeaponEquipped(weapon: any) {
		if (!currentLeek.value) return false
		return (currentLeek.value.weapons as any).indexOf(weapon) !== -1
	}

	function changeLeekName() {
		if (!currentLeek.value) return
		currentLeek.value.name = changedLeekName.value
		saveLeek()
		changeLeekNameDialog.value = false
	}

	function createLeek() {
		LeekWars.post('test-leek/new', {name: newLeekName.value}).then(data => {
			const leek: any = {name: newLeekName.value, id: data.id, ai: -1}
			leeks.value.push(leek)
			for (const k in data.data) {
				leek[k] = data.data[k]
			}
			newLeekDialog.value = false
			newLeekName.value = ''
			currentLeek.value = leek
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function createMap() {
		LeekWars.post('test-map/new', {name: newMapName.value}).then(data => {
			maps[data.id] = {name: newMapName.value, id: data.id, data: {obstacles: {}, team1: [], team2: []}} as any
			newMapDialog.value = false
			newMapName.value = ''
			selectMap(maps[data.id])
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function characteristicFocusout(characteristic: string, event: FocusEvent) {
		if (!currentLeek.value || (currentLeek.value as any).bot || !event.target) return
		const target = event.target as HTMLElement
		let value = parseInt(target.textContent as string, 10)
		if (isNaN(value)) value = characsLimits[characteristic].min
		value = Math.max(value, characsLimits[characteristic].min)
		value = Math.min(value, characsLimits[characteristic].max)
		;(currentLeek.value as any)[characteristic] = value
		saveLeek()
	}

	function duplicateTestLeek(leek: Leek) {
		LeekWars.post('test-leek/new', {name: leek.name}).then(data => {
			const newLeek = new Leek({
				...JSON.parse(JSON.stringify(leek)),
				id: data.id
			})
			leeks.value.push(newLeek as any)
			currentLeek.value = newLeek as any
			saveLeek()
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function deleteTestLeek(leek: Leek) {
		LeekWars.delete('test-leek/delete', {id: leek.id})
		leeks.value.splice(leeks.value.findIndex(l => l.id === leek.id), 1)
		for (const s in scenarios) {
			scenarios[s].team1 = scenarios[s].team1.filter(l => l.id !== leek.id)
			scenarios[s].team2 = scenarios[s].team2.filter(l => l.id !== leek.id)
		}
		if (leeks.value.length) {
			selectLeek(leeks.value[0])
		}
	}

	function launchTest() {
		if (!currentScenario.value || !props.currentAI) return
		props.currentAI.scenario = currentScenario.value.id
		LeekWars.post('ai/test-scenario', { scenario_id: currentScenario.value.id, ai_id: props.currentAI.path }).then(data => {
			localStorage.setItem('editor/last-scenario', '' + currentScenario.value!.id)
			localStorage.setItem('editor/last-scenario-ai', '' + props.currentAI!.path)
			router.push('/fight/' + data.fight)
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function onAIDeleted(path: string) {
		for (const s in scenarios) {
			for (const leek of scenarios[s].team1) {
				if (leek.ai === path) leek.ai = null
			}
			for (const leek of scenarios[s].team2) {
				if (leek.ai === path) leek.ai = null
			}
		}
	}

	function changeType() {
		if (!currentScenario.value) return
		if (currentScenario.value.type === FightType.FREE || currentScenario.value.type === FightType.SOLO || currentScenario.value.type === FightType.FARMER || currentScenario.value.type === FightType.TEAM) {
			const limit = getLimit(currentScenario.value.type)
			if (currentScenario.value.team1.length > limit) {
				for (let i = limit; i < currentScenario.value.team1.length; ++i) {
					LeekWars.delete('test-scenario/delete-leek', {scenario_id: currentScenario.value.id, leek: currentScenario.value.team1[i].id})
				}
				currentScenario.value.team1.length = limit
			}
			if (currentScenario.value.team2.length > limit) {
				for (let i = limit; i < currentScenario.value.team2.length; ++i) {
					LeekWars.delete('test-scenario/delete-leek', {scenario_id: currentScenario.value.id, leek: currentScenario.value.team2[i].id})
				}
				currentScenario.value.team2.length = limit
			}
		} else {
			for (const leek of currentScenario.value.team2) {
				LeekWars.delete('test-scenario/delete-leek', {scenario_id: currentScenario.value.id, leek: leek.id})
			}
			currentScenario.value.team2.length = 0
		}
		if (currentScenario.value.type === FightType.TEAM && teamTurretAI.value) {
			if (!currentScenario.value.turret_ai_team1) {
				currentScenario.value.turret_ai_team1 = teamTurretAI.value.id
				updateScenario(currentScenario.value, { type: currentScenario.value.type, turret_ai_team1: teamTurretAI.value.id })
				return
			}
		}
		updateScenario(currentScenario.value, { type: currentScenario.value.type })
	}

	function updateScenario(scenario: TestScenario, data: any) {
		if (scenario.id === 0) {
			LeekWars.post('test-scenario/new', { name: scenario.ai!.name }).then(r => {
				delete scenarios[0]
				scenario.id = r.id
				scenarios[r.id] = scenario
				scenario.default = false
				scenario.ai!.scenario = r.id
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

	function getLimit(type: FightType) {
		if (type === FightType.FREE) return 8
		if (type === FightType.SOLO) return 1
		if (type === FightType.FARMER) return 4
		if (type === FightType.TEAM) return 6
		if (type === FightType.BATTLE_ROYALE) return 10
		return 6
	}

	function load() {
		if (!initialized.value) {
			LeekWars.get('test-scenario/get-all').then(data => {
				initialized.value = true
				Object.assign(scenarios, data.scenarios)
				if (data.turret_ai) {
					teamTurretAI.value = data.turret_ai
					data.turret_ai.path = data.turret_ai.file_path || data.turret_ai.name
					alliesAIs[data.turret_ai.path] = data.turret_ai
				}

				for (const leek of data.leeks) {
					leeks.value.push(leek)
					if (!leek.cores) {
						leek.cores = 20
						leek.ram = 20
					}
				}
				generateBots()
				updateAI()

				for (const l in leeks.value) {
					const leek = leeks.value[l]
					if (!leek.chips) leek.chips = []
					if (!leek.weapons) leek.weapons = []
					;(leek as any).real = false
					;(leek as any).ai = -1
				}
				const startLeekID = parseInt(localStorage.getItem('editor/leek') || '', 10)
				if (startLeekID && startLeekID in leeks.value) {
					const found = leeks.value.find(l => l.id === startLeekID)
					if (found) selectLeek(found)
				} else if (leeks.value.length) {
					selectLeek(leeks.value[0])
				}

				Object.assign(maps, data.maps)
				if (!LeekWars.isEmptyObj(maps)) {
					currentMap.value = LeekWars.first(maps) as TestMap
				}
			})
			.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
		}
	}

	function loadCompositions() {
		if (Object.values(compositionTemplates.value).length) return
		LeekWars.get('team-composition/get-farmer-compositions').then(compositions => {
			compositionTemplates.value = compositions
			for (const c in compositions) {
				const compo = compositions[c]
				for (const leek of compo.leeks) {
					const aiPath = leek.ai.file_path || leek.ai.name
					if (!props.ais || !(aiPath in props.ais)) {
						leek.ai.path = aiPath
						alliesAIs[aiPath] = leek.ai
					}
					if (!(leek.id in store.state.farmer!.leeks)) {
						allies[leek.id] = leek
						leek.ally = true
					}
					leek.ai = leek.ai ? (leek.ai.path || leek.ai.file_path || leek.ai.name) : null
				}
			}
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	watch(advanced, () => {
		localStorage.setItem("editor/test/advanced", '' + advanced.value)
	})

	function updateSeed(_event: InputEvent) {
		if (currentScenario.value) {
			if (currentScenario.value.seed) {
				currentScenario.value.seed = parseInt(currentScenario.value.seed)
				if (currentScenario.value.seed > 2147483647) {
					currentScenario.value.seed = 2147483647
				} else if (currentScenario.value.seed < 1) {
					currentScenario.value.seed = 1
				} else if (isNaN(currentScenario.value.seed)) {
					currentScenario.value.seed = null
				}
			}
			updateScenario(currentScenario.value, { seed: currentScenario.value.seed || 0 })
		}
	}

	function updateMaxTurns(_event: InputEvent) {
		if (currentScenario.value) {
			if (currentScenario.value.max_turns) {
				currentScenario.value.max_turns = parseInt(currentScenario.value.max_turns)
				if (currentScenario.value.max_turns > 64) {
					currentScenario.value.max_turns = 64
				} else if (currentScenario.value.max_turns < 1) {
					currentScenario.value.max_turns = 1
				} else if (isNaN(currentScenario.value.max_turns)) {
					currentScenario.value.max_turns = null
				}
			}
			updateScenario(currentScenario.value, { max_turns: currentScenario.value.max_turns || 0 })
		}
	}

	defineExpose({ onAIDeleted })
</script>


<style lang="scss" scoped>
	h4 {
		display: inline-block;
	}
	.v-dialog .content {
		padding: 0;
	}
	.tabs {
		:deep(.tab-content) {
			min-height: 600px;
		}
	}
	.popup.mobile .tab-content {
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
	.popup.mobile .column {
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
	.advanced-options {
		display: flex;
		gap: 10px;
		& > * {
			flex: 1;
		}
	}
	.popup.mobile .advanced-options {
		flex-direction: column;
	}
	.desc {
		padding-left: 6px;
		color: #777;
	}
	.column-scenario .team {
		width: 810px;
		text-align: center;
	}
	.popup.mobile .column-scenario .team {
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
	.popup.mobile .column-scenario .add {
		margin-left: 10px;
		margin-right: 10px;
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
	.popup.mobile .leek-dialog {
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
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
	.popup.mobile .column-scenario .map-container {
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
	.popup.mobile .leek-column {
		width: auto;
	}
	.flex {
		align-items: center;
		padding-bottom: 15px;
	}
	.popup.mobile .leek-column .flex {
		flex-direction: column;
		gap: 15px;
	}
	.leek-column .image {
		display: inline-block;
		text-align: center;
		margin-left: 130px;
		padding: 7px;
		width: 190px;
		position: relative;
	}
	.leek-column .image .skin-button {
		position: absolute;
		bottom: 8px;
		left: 8px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-secondary, #f5f5f5);
		border: 1px solid var(--border);
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.1s;
	}
	.leek-column .image .skin-button:hover {
		transform: scale(1.1);
	}
	.leek-column .image .skin-button img {
		width: 26px;
		height: 26px;
	}
	.farmer-potions .potions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
		grid-gap: 10px;
	}
	.farmer-potions .potion {
		display: inline-block;
		cursor: pointer;
		border: 1px solid var(--border);
		padding: 5px 0;
	}
	.farmer-potions .potion img {
		width: 100%;
	}
	.popup.mobile .leek-column .image {
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
	.popup.mobile .characteristics {
		min-width: 0;
		margin: 0;
	}
	.popup.mobile .characteristics .characteristic {
		padding: 5px 8px;
		.stat {
			min-width: 0;
		}
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
	.popup.mobile .map-column .map {
		zoom: 0.45;
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
	.popup.mobile .map-column .instructions {
		margin-top: 20px;
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
	.popup.mobile .templates {
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
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
			background: var(--background-secondary);
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
				background: var(--pure-white);
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
	.popup.mobile .flex-title .type-select {
		flex: 0 1 170px;
		min-width: 0;
	}
	input.seed {
		margin-top: 4px;
		padding: 0 6px;
		font-size: 16px;
	}
	.popup.mobile .bot-ai {
		flex-direction: column;
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
		background: var(--pure-white);
		border-radius: 4px;
		cursor: pointer;
	}
</style>
