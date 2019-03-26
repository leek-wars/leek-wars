<template lang="html">
	<not-found v-if="error" :title="$t('not_found')" :message="$t('not_found_id', [id])" />
	<div v-else>
		<div class="page-header page-bar">
			<h1 v-if="leek">{{ leek.name }}</h1>
			<h1 v-else>...</h1>
			<div class="tabs">
				<template v-if="leek && my_leek">
					<template v-if="leek.tournament && leek.tournament.current">
						<router-link :to="'/tournament/' + leek.tournament.current">
							<div class="tab green">{{ $t('see_tournament') }}</div>
						</router-link>
					</template>
					<v-tooltip v-if="leek.tournament" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" class="tab" @click="registerTournament">
							<img src="/image/icon/trophy.png">
							<span v-if="!leek.tournament.registered" class="register">{{ $t('register_to_tournament') }}</span>
							<span v-else class="unregister">{{ $t('unregister') }}</span>
						</div>
						{{ $t('tournament_time') }}
					</v-tooltip>

					<v-tooltip :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" class="tab" @click="updateGarden">
							<span>{{ $t('garden') }}</span>
							<v-switch :input-value="leek.in_garden" hide-details />
						</div>
						{{ $t('authorize_agressions') }}
					</v-tooltip>
				</template>
				<template v-else-if="$store.state.connected">
					<router-link v-if="leek" :to="'/garden/challenge/leek/' + leek.id">
						<div :link="'/garden/challenge/' + leek.id" class="tab action">
							<img src="/image/icon/garden.png"><span>{{ $t('challenge') }}</span>
						</div>
					</router-link>
				</template>
			</div>
		</div>

		<div class="flex-container">
			<div class="column4">
				<panel>
					<i18n slot="title" path="farmed_by" tag="h2">
						<router-link :to="'/farmer/' + (leek ? leek.farmer.id : 0)" place="farmer">{{ leek ? leek.farmer.name : '...' }}</router-link>
					</i18n>
					<template v-if="my_leek" slot="actions">
						<div class="button flat hat-button" @click="hat">
							<img src="/image/icon/hat.png">
						</div>
					</template>
					<div slot="content" class="content leek-image">
						<leek-image v-if="leek" :scale="1.05" :leek="leek" />
						<loader v-else />
					</div>
				</panel>
			</div>
			<div class="column4">
				<panel :title="$t('statistics')">
					<h4 class="level">{{ $t('level_n', [leek ? leek.level : '...']) }}</h4>

					<v-tooltip bottom open-delay="0" close-delay="0">
						<div slot="activator" class="bar">
							<span :class="{ blue: blue_xp_bar }" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
						</div>
						<template v-if="leek && leek.isMaxLevel">
							<b>{{ $t('max_level') }}</b> <br>
							{{ $t('xp', [LeekWars.formatNumber(leek.xp)]) }}
						</template>
						<template v-else-if="leek">
							<b>{{ $t('remaining_xp', [LeekWars.formatNumber(leek.remaining_xp)]) }}</b>
							<br>
							{{ $t('xp', [LeekWars.formatNumber(leek.xp) + " / " + LeekWars.formatNumber(leek.up_xp)]) }}
						</template>
					</v-tooltip>

					<div class="talent-wrapper">
						<v-tooltip bottom open-delay="0" close-delay="0">
							<talent slot="activator" :talent="leek ? leek.talent : '...'" />
							<div>{{ $t('talent') }}</div>
						</v-tooltip>
						<v-tooltip v-if="leek" bottom open-delay="0" close-delay="0">
							<div slot="activator" class="talent-more">({{ leek.talent_more >= 0 ? '+' + leek.talent_more : leek.talent_more }})</div>
							<template v-if="leek.talent_more > 0">
								<span v-html="$t('report.talent_difference', [leek.name, leek.talent_more, leek.talentGains + '%'])"></span>
							</template>
							<template v-else>
								<span v-html="$t('report.talent_difference_no_gains', [leek.name])"></span>
							</template>
						</v-tooltip>
					</div>

					<v-tooltip :disabled="!leek" bottom open-delay="0" close-delay="0">
						<table slot="activator" class="fights">
							<tr>
								<td class="big">{{ (leek ? leek.victories : '...') | number }}</td>
								<td class="big">{{ (leek ? leek.draws : '...') | number }}</td>
								<td class="big">{{ (leek ? leek.defeats : '...') | number }}</td>
							</tr>
							<tr>
								<td class="grey">{{ $t('victories') }}</td>
								<td class="grey">{{ $t('draws') }}</td>
								<td class="grey">{{ $t('defeats') }}</td>
							</tr>
						</table>
						{{ $t('ratio', [leek ? leek.ratio : 0]) }}
					</v-tooltip>

					<template v-if="leek && leek.level >= 100">
						<chartist ref="chart" :data="chartData" :options="chartOptions" :events="chartEvents" ratio="ct-major-eleventh" class="talent-history" type="Line" />
						<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top">{{ chartTooltipValue }}</div>
					</template>
				</panel>
			</div>
			
			<div class="column4">
				<panel :title="$t('characteristics')">
					<div slot="content" class="characteristics">
						<div v-for="c in ['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']" :key="c" class="characteristic">
							<v-tooltip bottom open-delay="0" close-delay="0">
								<div slot="activator">
									<img :src="'/image/charac/' + c + '.png'">
									<span :class="'color-' + c">{{ leek ? leek[c] : '...' }}</span>
								</div>
								<div v-if="leek" class="tooltip">
									<b>{{ $t(c) }}</b>
									<br>
									{{ $t(c + '_description') }}
									<template v-if="leek[c] > 0 && (c != 'frequency' || leek[c] > 100)">
										<br>
										<template v-if="c == 'life'">
											<b v-if="c == 'life'" class="effect">{{ $t('base_life') }} : <span class="amount">{{ leek.baseLife }}</span></b>
											<br>
											<b v-if="c == 'life'" class="effect">{{ $t('added_life') }} : <span class="amount">{{ leek.life - leek.baseLife }}</span></b>
											<br>
										</template>
										<b class="capital">{{ $t('invested_capital') }} : <span class="amount">{{ capitalSpent(c, leek[c], leek.level) }}</span></b>
									
										<template v-if="c == 'strength'">
											<br><b class="effect">{{ $t('damage_effect') }} : × <span class="damage">{{ 1 + leek[c] / 100 }}</span></b>
										</template>
										<template v-else-if="c == 'agility'">
											<br>
											<b class="effect">{{ $t('return_damage_effect') }} : × <span class="damage-return">{{ 1 + leek.agility / 100 }}</span></b>
											<br>
											<b class="effect">{{ $t('critical_effect') }} : <span class="critical">{{ leek.agility / 10 }}%</span></b>
										</template>
										<template v-else-if="c == 'science'">
											<br><b class="effect">{{ $t('boost_effect') }} : × <span class="damage">{{ 1 + leek[c] / 100 }}</span></b>
										</template>
										<template v-else-if="c == 'wisdom'">
											<br>
											<b class="effect">{{ $t('heal_effect') }} : × <span class="heal">{{ 1 + leek.wisdom / 100 }}</span></b>
											<br>
											<b class="effect">{{ $t('life_steal_effect') }} : <span class="life-steal">{{ Math.round(leek.wisdom / 10) }}%</span></b>
										</template>
										<template v-else-if="c == 'magic'">
											<br><b class="effect">{{ $t('shackle_poison_effect') }} : × <span class="damage">{{ 1 + leek.magic / 100 }}</span></b>
										</template>
										<template v-else-if="c == 'resistance'">
											<br><b class="effect">{{ $t('shield_effect') }} : × <span class="damage">{{ 1 + leek.resistance / 100 }}</span></b>
										</template>
									</template>
								</div>
							</v-tooltip>
						</div>
						<center v-if="leek && my_leek">
							<br>
							<v-btn v-if="leek.capital > 0" color="primary" @click="capitalDialog = true">{{ $t('n_capital', [leek.capital]) }}</v-btn>&nbsp;
							<v-btn @click="potionDialog = true">{{ $t('potions') }}</v-btn>
						</center>
					</div>
				</panel>
			</div>

			<div class="column4">
				<panel>
					<h2 slot="title">{{ $t('weapons') }} <span v-if="leek && leek.weapons" class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span></h2>
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="weaponsDialog = true">
							<i class="material-icons">edit</i>
						</div>
					</template>
					<div slot="content" class="content center">
						<loader v-if="!leek" />
						<template v-else>
							<v-tooltip v-for="weapon in leek.orderedWeapons" :key="weapon.id" :open-delay="0" :close-delay="0" bottom>
								<div slot="activator" class="weapon">
									<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'">
								</div>
								<b>{{ $t('weapon.' + LeekWars.weapons[weapon.template].name) }}</b>
								<br>
								{{ $t('weapon_level_n', [LeekWars.weapons[weapon.template].level]) }}
								<br>
								<small>{{ 'WEAPON_' + LeekWars.weapons[weapon.template].name.toUpperCase() }}</small>
							</v-tooltip>
						</template>
					</div>
				</panel>
			</div>
		
			<div class="column4">
				<panel>
					<h2 slot="title">{{ $t('chips') }} <span v-if="leek && leek.chips" class="chip-count">[{{ leek.chips.length }}/{{ leek.max_chips }}]</span></h2>
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="chipsDialog = true">
							<i class="material-icons">edit</i>
						</div>
					</template>
					<div slot="content" class="chips">
						<loader v-if="!leek" />
						<template v-else>
							<v-tooltip v-for="chip in leek.orderedChips" :key="chip.id" :open-delay="0" :close-delay="0" bottom>
								<div slot="activator" class="chip">
									<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'">
								</div>
								<b>{{ $t('chip.' + LeekWars.chips[chip.template].name) }}</b>
								<br>
								{{ $t('chip_level_n', [LeekWars.chips[chip.template].level]) }}
								<br>
								<small>{{ 'CHIP_' + LeekWars.chips[chip.template].name.toUpperCase() }}</small>
							</v-tooltip>
						</template>
					</div>
				</panel>
			</div>
			
			<div class="column4">
				<panel :title="$t('ai')">
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="aiDialog = true">
							<i class="material-icons">edit</i>
						</div>
					</template>
					<div slot="content" class="leek-ai">
						<loader v-if="!leek" />
						<template v-else>
							<template v-if="leek.ai">
								<router-link v-if="my_leek" :to="'/editor/' + leek.ai.id">
									<ai :ai="leek.ai" />
								</router-link>
								<ai v-else :ai="leek.ai" />
							</template>
							<span v-else>{{ $t('no_ai') }}</span>
						</template>
					</div>
				</panel>
			</div>
		</div>

		<div class="flex-container">
			<div class="column6">
				<panel v-if="leek && leek.fights && leek.fights.length > 0" :title="$t('fights')">
					<template v-if="leek" slot="actions">
						<router-link :to="'/leek/' + leek.id + '/history'" class="button flat">
							<i class="material-icons">history</i>
							<span>{{ $t('history') }}</span>
						</router-link>
					</template>
					<fights-history slot="content" :fights="leek.fights" />
				</panel>
			</div>
			<div class="column6">
				<panel v-if="leek && leek.tournaments && leek.tournaments.length > 0" :title="$t('tournaments')">
					<tournaments-history slot="content" :tournaments="leek.tournaments" />
				</panel>
			</div>
		</div>

		<panel v-if="leek && my_leek && leek.registers && leek.registers.length > 0" toggle="leek/registers">
			<h2 slot="title">{{ $t('registers') }} <span class="register-count">[{{ leek.registers.length }}/100]</span></h2>
			<table class="registers">
				<tr>
					<th>{{ $t('register_key') }}</th>
					<th>{{ $t('register_value') }}</th>
					<th></th>
				</tr>
				<tr v-for="register in leek.registers" :key="register.key" class="register">
					<td class="key">{{ register.key }}</td>
					<td class="value" contenteditable @focusout="registerFocusout(register, $event)"><div>{{ register.value }}</div></td>
					<td class="delete" @click="registerDelete(register)"><i class="material-icons">clear</i></td>
				</tr>
			</table>
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<template v-if="$store.state.connected && !my_leek">
					<div class="tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span class="report-button">{{ $t('report') }}</span>
					</div>
				</template>
				<template v-if="my_leek">
					<div class="tab" @click="renameDialog = true">{{ $t('rename_leek') }}</div>
				</template>
			</div>
		</div>

		<v-dialog v-if="leek" v-model="weaponsDialog" max-width="800">
			<div class="title">
				{{ $t('weapons_of', [leek.name]) }}
				<span class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span>
			</div>
			<div class="content weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<v-tooltip v-for="(weapon, i) in leek.orderedWeapons" :key="i" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
							<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'" draggable="false">
						</div>
						<b>{{ $t("weapon." + LeekWars.weapons[weapon.template].name) }}</b><br>
						{{ $t('level_n', [LeekWars.weapons[weapon.template].level]) }}
					</v-tooltip>
				</div>
				<br>
				<h2>{{ $t('all_my_weapons') }}</h2>
				<br>
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'leek'}" class="farmer-weapons" @dragover="dragOver" @drop="weaponsDrop('farmer', $event)">
					<v-tooltip v-for="(weapon, i) in farmer_weapons" :key="i" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" :quantity="weapon.quantity" :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'farmer', locked: LeekWars.weapons[weapon.template].level > leek.level}" :draggable="LeekWars.weapons[weapon.template].level <= leek.level" class="weapon" @dragstart="weaponDragStart('farmer', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="addWeapon(weapon)">
							<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'" draggable="false">
						</div>
						<b>{{ $t('weapon.' + LeekWars.weapons[weapon.template].name) }}</b><br>
						{{ $t('level_n', [LeekWars.weapons[weapon.template].level]) }}
					</v-tooltip>
				</div>
			</div>
		</v-dialog>

		<v-dialog v-if="leek" v-model="renameDialog" max-width="600">
			<div class="title">{{ $t('rename_leek') }}</div>
			<div class="content">
				{{ $t('rename_description') }}
				<br>
				<br>
				{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
				<br>
				<br>
				<center>
					<v-btn @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ rename_price_habs }}</b> &nbsp;<img src="/image/hab.png"></v-btn>
					&nbsp;
					<v-btn @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ rename_price_crystals }}</b> &nbsp;<img src="/image/crystal.png"></v-btn>
				</center>
			</div>
			<div class="actions">
				<div class="action" @click="renameDialog = false">{{ $t('cancel') }}</div>
			</div>
		</v-dialog>

		<v-snackbar v-model="renameSuccess" :timeout="2000" color="success">{{ $t('rename_done') }}</v-snackbar>
		<v-snackbar v-if="renameError" v-model="renameFailed" :timeout="5000" color="error">{{ $t(renameError.error, renameError.error_params) }}</v-snackbar>

		<v-dialog v-if="leek && my_leek" v-model="potionDialog" max-width="750">
			<div class="title">{{ $t("use_a_potion", [leek.name]) }}</div>
			<div class="content farmer-potions">
				<v-tooltip v-for="(potion, id) in $store.state.farmer.potions" :key="id" :open-delay="0" :close-delay="0" bottom>
					<div slot="activator" :quantity="potion.quantity" class="potion" @click="usePotion(potion)">
						<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
					</div>
					<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
					<br>
					{{ $t('level_n', [LeekWars.potions[potion.template].level]) }}
				</v-tooltip>
				<br><br>
				<center>({{ $t('click_to_use') }})</center>
			</div>
			<div class="actions">
				<div class="action" @click="potionDialog = false">{{ $t('cancel') }}</div>
			</div>
		</v-dialog>

		<report-dialog v-if="leek" v-model="reportDialog" :name="leek.farmer.name" :target="leek.farmer.id" :reasons="reasons" :parameter="leek.id" />

		<v-dialog v-model="hatDialog" :max-width="700">
			<div class="title">{{ $t('select_a_hat') }}</div>

			<div class="content hat-dialog">
				<v-tooltip :open-delay="0" :close-delay="0" bottom>
					<div slot="activator" :quantity="1" class="hat" @click="selectHat(null)">
						<img src="/image/hat/no_hat.png">
					</div>
					<b>{{ $t('no_hat') }}</b>
				</v-tooltip>
				<v-tooltip v-for="hat in farmer_hats" :key="hat.id" :open-delay="0" :close-delay="0" bottom>
					<div slot="activator" :quantity="hat.quantity" class="hat" @click="selectHat(hat)">
						<img :src="'/image/hat/' + hat.name + '.png'">
					</div>
					<b>{{ $t('hat.' + hat.name) }}</b>
					<br>
					{{ $t('level_n', [hat.level]) }}
				</v-tooltip>
				<br><br>
				<center>({{ $t('click_to_put_hat') }})</center>
			</div>
			<div class="actions">
				<div class="action" @click="hatDialog = false">{{ $t('cancel') }}</div>
			</div>
		</v-dialog>

		<level-dialog v-if="leek && levelPopupData" v-model="levelPopup" :leek="leek" :data="levelPopupData" />

		<v-dialog v-if="leek && my_leek" v-model="aiDialog" :max-width="870">
			<div class="title">{{ $t('ai_of', [leek.name]) }}</div>
			<div class="content ai_popup">
				<div :class="{dashed: draggedAI && (!leek.ai || draggedAI.id !== leek.ai.id)}" class="leek-ai" @dragover="dragOver" @drop="aiDrop('leek', $event)">
					<ai v-if="leek.ai" :ai="leek.ai" @click.native="removeAI()" @dragstart.native="aiDragStart(leek.ai, $event)" @dragend.native="aiDragEnd(leek.ai, $event)" />
				</div>
				<br><br>
				<h2>{{ $t('all_my_ais') }}</h2>
				<br>
				<div :class="{dashed: draggedAI && leek.ai && draggedAI.id === leek.ai.id}" class="farmer-ais" @dragover="dragOver" @drop="aiDrop('farmer', $event)">
					<ai v-for="ai in $store.state.farmer.ais" v-if="!leek.ai || ai.id !== leek.ai.id" :key="ai.id" :ai="ai" @click.native="selectAI(ai)" @dragstart.native="aiDragStart(ai, $event)" @dragend.native="aiDragEnd(ai, $event)" />
				</div>
			</div>
		</v-dialog>

		<v-dialog v-if="leek && my_leek" v-model="chipsDialog" :max-width="800">
			<div class="title">{{ $t('chips_of', [leek.name]) }} <span class="chip-count">[{{ leek.chips.length }}/{{ leek.max_chips }}]</span></div>
			<div class="content chips-dialog">
				<div :class="{dashed: draggedChip && draggedChipLocation === 'farmer'}" class="leek-chips" @dragover="dragOver" @drop="chipsDrop('leek', $event)">
					<v-tooltip v-for="chip in leek.orderedChips" :key="chip.id" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'leek'}" class="chip" draggable="true" @dragstart="chipDragStart('leek', chip, $event)" @dragend="chipDragEnd(chip)" @click="removeChip(chip)">
							<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'" draggable="false">
						</div>
						<b>{{ $t("chip." + LeekWars.chips[chip.template].name) }}</b><br>
						{{ $t('level_n', [LeekWars.chips[chip.template].level]) }}
					</v-tooltip>
				</div>
				<br>
				<h2>{{ $t('all_my_chips') }}</h2>
				<br>
				<div :class="{dashed: draggedChip && draggedChipLocation === 'leek'}" class="farmer-chips" @dragover="dragOver" @drop="chipsDrop('farmer', $event)">
					<v-tooltip v-for="chip in farmer_chips" :key="chip.id" :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" :quantity="chip.quantity" :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'farmer', locked: LeekWars.chips[chip.template].level > leek.level}" :draggable="LeekWars.chips[chip.template].level <= leek.level" class="chip" @dragstart="chipDragStart('farmer', chip, $event)" @dragend="chipDragEnd(chip)" @click="addChip(chip)">
							<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'" draggable="false">
						</div>
						<b>{{ $t('chip.' + LeekWars.chips[chip.template].name) }}</b><br>
						{{ $t('level_n', [LeekWars.chips[chip.template].level]) }}
					</v-tooltip>
				</div>
			</div>
		</v-dialog>
		<capital-dialog v-if="leek" v-model="capitalDialog" :leek="leek" />
	</div>
</template>
	
<script lang="ts">
	import { AI } from '@/model/ai'
	import { Chip } from '@/model/chip'
	import { Hat } from '@/model/hat'
	import { ItemType } from '@/model/item'
	import { Leek, Register } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Potion } from '@/model/potion'
	import { store } from '@/model/store'
	import { Weapon } from '@/model/weapon'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import CapitalDialog from './capital-dialog.vue'
	import LevelDialog from './level-dialog.vue'

	@Component({ name: "leek", i18n: {}, components: { CapitalDialog, LevelDialog } })
	export default class LeekPage extends Vue {
		leek: Leek | null = null
		error: boolean = false
		weaponsDialog: boolean = false
		draggedWeapon: Weapon | null = null
		draggedWeaponLocation: string | null = null
		xp_bar: number = 0
		renameDialog: boolean = false
		rename_price_habs: number = 2000000
		rename_price_crystals: number = 200
		renameName: string = ''
		renameSuccess: boolean = false
		renameFailed: boolean = false
		renameError: any = null
		potionDialog: boolean = false
		hatDialog: boolean = false
		chartData: any = null
		chartOptions: any = null
		chartTooltipValue: any = null
		chartTooltipX: number = 0
		chartTooltipY: number = 0
		chartEvents: any = null
		reportDialog: boolean = false
		reasons = [Warning.INCORRECT_LEEK_NAME, Warning.INCORRECT_AI_NAME]
		levelPopup: boolean = false
		levelPopupData: any = null
		aiDialog: boolean = false
		draggedAI: AI | null = null
		chipsDialog: boolean = false
		draggedChip: Chip | null = null
		draggedChipLocation: string | null = null
		capitalDialog: boolean = false
		
		get id(): number {
			return parseInt(this.$route.params.id, 10) || (this.$store.state.farmer && LeekWars.first(this.$store.state.farmer.leeks).id)
		}
		get my_leek(): boolean {
			if (!this.$route.params.id) { return true }
			if (this.$store.state.farmer) {
				for (const id in this.$store.state.farmer.leeks) {
					if (parseInt(id, 10) === this.id) { return true }
				}
			}
			return false
		}
		get xp_bar_width() {
			if (!this.leek) {
				return this.xp_bar
			}
			return this.xp_bar = this.leek.level === 301 ? 100 : Math.floor(100 * (this.leek.xp - this.leek.down_xp) / (this.leek.up_xp - this.leek.down_xp))
		}
		get blue_xp_bar() {
			if (!this.leek) {
				return false
			}
			return this.leek.level === 301
		}
		get farmer_weapons() {
			const groupedFarmerWeapons: {[key: number]: any} = {}
			if (store.state.farmer) {
				for (const weapon of store.state.farmer.weapons) {
					if (groupedFarmerWeapons[weapon.template] === undefined) {
						groupedFarmerWeapons[weapon.template] = LeekWars.clone(weapon)
						groupedFarmerWeapons[weapon.template].quantity = 0
					}
					groupedFarmerWeapons[weapon.template].quantity++
				}
			}
			const weapons = []
			for (const w in groupedFarmerWeapons) {
				weapons.push(groupedFarmerWeapons[w])
			}
			return weapons.sort((weaponA, weaponB) => {
				return LeekWars.weapons[weaponA.template].level - LeekWars.weapons[weaponB.template].level
			})
		}
		get farmer_chips() {
			const groupedFarmerChips: {[key: number]: any} = {}
			for (const chip of this.$store.state.farmer.chips) {
				if (groupedFarmerChips[chip.template] === undefined) {
					groupedFarmerChips[chip.template] = LeekWars.clone(chip)
					groupedFarmerChips[chip.template].quantity = 0
				}
				groupedFarmerChips[chip.template].quantity++
			}
			const chips = []
			for (const c in groupedFarmerChips) {
				chips.push(groupedFarmerChips[c])
			}
			return chips.sort((chipA, chipB) => {
				return LeekWars.orderedChips[chipA.template] - LeekWars.orderedChips[chipB.template]
			})
		}
		get farmer_hats() {
			const groupedFarmerHats: {[key: number]: any} = {}
			if (store.state.farmer) {
				for (const hat of store.state.farmer.hats) {
					if (groupedFarmerHats[hat.hat_template] === undefined) {
						groupedFarmerHats[hat.hat_template] = LeekWars.clone(hat)
						groupedFarmerHats[hat.hat_template].quantity = 0
					}
					groupedFarmerHats[hat.hat_template].quantity++
				}
			}
			return groupedFarmerHats
		}

		@Watch('id', {immediate: true})
		update() {
			this.leek = null
			this.error = false
			if (!this.id) { return }
			const method = this.my_leek ? 'leek/get-private/' + this.id : 'leek/get/' + this.id
			LeekWars.get(method).then((data: any) => {
				if (data.success) {
					this.$data.leek = new Leek(data.leek)
					if (this.leek) {
						LeekWars.setTitle(this.leek.name, this.$t('level_n', [this.leek.level]))
						if (this.my_leek) {
							LeekWars.setActions([
								{image: 'icon/hat.png', click: () => this.hat()},
								{image: 'icon/potion.png', click: () => this.potion()},
							])
						} else {
							LeekWars.setActions([
								{image: 'icon/garden.png', click: () => this.$router.push('/garden/challenge/leek/' + this.id)}
							])
						}
						this.renameName = this.leek.name
						this.chart()
						if (this.leek.level_seen < this.leek.level) {
							this.showLevelPopup()
						}
						if (this.$store.state.farmer) {
							for (const ai of this.$store.state.farmer.ais) {
								Vue.set(ai, 'dragging', false)
							}
						}
						if (this.my_leek) {
							this.$store.commit('update-capital', {leek: this.leek.id, capital: this.leek.capital})
						}
						this.$root.$emit('loaded')
					}
				} else {
					this.error = true
				}
			})
		}
		capitalSpent(characteristic: string, amount: number, level: number) {
			switch (characteristic) {
			case 'life':
				return Math.min(amount - (100 + (level - 1) * 3), 1000) * 1 / 4 + Math.min(Math.max(0, amount - (1100 + (level - 1) * 3)), 999) * 1 / 3 + Math.max(0, amount - (2100 + (level - 1) * 3)) * 1 / 2
			case 'tp': {
				const added = amount - 10
				const progression = added <= 14 ? added : 14
				const leftover = added > 14 ? added - 14 : 0
				return added > 0 ? 25 * progression + progression * (progression + 1) * 5 / 2 + leftover * 100 : 0
			}
			case 'mp': {
				const added = amount - 3
				const progression = added <= 8 ? added : 8
				const leftover = added > 8 ? added - 8 : 0
				return added > 0 ? 10 * progression + progression * (progression + 1) * 10 / 2 + leftover * 100 : 0
			}
			case 'frequency':
				return amount - 100
			default:
				return Math.min(amount, 200) / 2 + Math.min(Math.max(0, amount - 200), 200) + Math.min(Math.max(0, amount - 400), 200) * 2 + Math.max(0, amount - 600) * 3
			}
		}
		rename(currency: string) {
			if (!this.leek) { return }
			const method = currency === 'habs' ? 'leek/rename-habs' : 'leek/rename-crystals'
			LeekWars.post(method, {leek_id: this.leek.id, new_name: this.renameName}).then((data) => {
				if (data.success) {
					if (this.leek) {
						this.leek.name = this.renameName
						store.commit('rename-leek', {leek: this.leek.id, name: this.renameName})
						if (currency === 'habs') {
							store.commit('update-habs', -this.rename_price_habs)
						} else {
							store.commit('update-crystals', -this.rename_price_crystals)
						}
						this.renameDialog = false
						this.renameSuccess = true
					}
				} else {
					this.renameFailed = true
					this.renameError = data
				}
			})
		}
		usePotion(potion: Potion) {
			const template = LeekWars.potions[potion.template]
			if (this.leek) {
				let update = false
				for (const effect of template.effects) {
					if (effect.type === 1) { // Restat
						update = true
					} else if (effect.type === 2) { // Skin
						const skin = effect.params[0]
						this.leek.skin = skin
						store.commit('change-skin', {leek: this.leek.id, skin})
					}
				}
				this.potionDialog = false
				LeekWars.post('leek/use-potion', {leek_id: this.leek.id, potion_id: potion.id}).then((data) => {
					if (data.success) {
						if (template.consumable) {
							this.$store.commit('remove-inventory', {type: ItemType.POTION, item_template: potion.template})
						}
						if (update) { this.update() }
					}
				})
			}
		}
		registerTournament() {
			if (this.leek) {
				if (this.leek.tournament.registered) {
					this.leek.tournament.registered = false
					LeekWars.post('leek/unregister-tournament', {leek_id: this.leek.id})
				} else {
					this.leek.tournament.registered = true
					LeekWars.post('leek/register-tournament', {leek_id: this.leek.id})
				}
			}
		}
		updateGarden() {
			if (this.leek) {
				this.leek.in_garden = !this.leek.in_garden
				LeekWars.post('leek/set-in-garden', {leek_id: this.leek.id, in_garden: this.leek.in_garden})
			}
		}
		chart() {
			if (!this.leek || this.leek.level < 100) { return }
			const labels = []
			const time = LeekWars.time
			for (let i = 1; i < 7; ++i) {
				labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
			}
			this.chartData = {
				labels: labels.reverse(),
				series: [this.leek.talent_history]
			}
			this.chartOptions = {showArea: true, fullWidth: true, fullHeight: true}
			this.chartEvents = [{
				event: 'created', fn: () => {
					const chartElement = this.$refs.chart
					if (!chartElement) { return }
					const chartTooltip = this.$refs.chartTooltip as HTMLElement
					;(chartElement as any).$el.querySelectorAll('.ct-point').forEach((point: any) => {
						point.addEventListener('mouseenter', (e: Event) => {
							this.chartTooltipValue = (e.target as any).getAttribute('ct:value')
						})
						point.addEventListener('mouseleave', (e: Event) => {
							this.chartTooltipValue = null
						})
						point.addEventListener('mousemove', (e: MouseEvent) => {
							this.chartTooltipX = e.pageX - chartTooltip.offsetWidth / 2,
							this.chartTooltipY = e.pageY - chartTooltip.offsetHeight - 15
						})
					})
				}
			}]
		}
		hat() {
			this.hatDialog = true
		}
		selectHat(hat: Hat) {
			if (!this.leek) { return }
			this.hatDialog = false
			if (hat === null) {
				this.leek.hat = null
				LeekWars.post('leek/remove-hat', {leek_id: this.leek.id}).then((data) => {
					if (data.success && this.leek) {
						store.commit('change-hat', {leek: this.leek.id, hat: null})
					} else {
						LeekWars.toast(data.error)
					}
				})
			} else {
				if (this.leek.hat === hat.hat_template) {
					this.hatDialog = false
					return
				}
				this.leek.hat = hat.hat_template
				LeekWars.post('leek/set-hat', {leek_id: this.leek.id, hat_id: hat.template}).then((data) => {
					if (data.success && this.leek) {
						store.commit('change-hat', {leek: this.leek.id, hat: hat.hat_template})
					} else {
						LeekWars.toast(data.error)
					}
				})
			}
		}
		potion() {
			this.potionDialog = true
		}

		showLevelPopup() {
			if (!this.leek) { return }
			LeekWars.get<any>('leek/get-level-popup/' + this.leek.id).then((data) => {
				this.levelPopup = true
				this.levelPopupData = data.popup
			})
		}

		removeAI() {
			if (!this.leek) { return }
			this.leek.ai = null
			LeekWars.post('leek/remove-ai', {leek_id: this.leek.id})
		}
		selectAI(ai: AI) {
			if (!this.leek) { return }
			this.leek.ai = ai
			LeekWars.post('leek/set-ai', {leek_id: this.leek.id, ai_id: ai.id})
		}
		aiDragStart(ai: AI, e: DragEvent) {
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.draggedAI = ai
			ai.dragging = true
			return true
		}
		aiDragEnd(ai: AI, e: DragEvent) {
			if (ai) {
				ai.dragging = false
			}
			this.draggedAI = null
			e.preventDefault()
			return false
		}
		aiDrop(area: string, e: DragEvent) {
			if (!this.draggedAI || !this.leek) { return }
			if (this.leek.ai && this.draggedAI.id === this.leek.ai.id && area === 'farmer') {
				this.removeAI()
			} else if (area === 'leek') {
				this.selectAI(this.draggedAI)
			}
			this.draggedAI = null
			e.preventDefault()
			return false
		}
		dragOver(e: DragEvent) {
			e.preventDefault()
		}
		
		registerFocusout(register: Register, e: Event) {
			if (!this.leek) { return }
			const value = (e.target as HTMLElement).textContent || ''
			if (register.value !== value) {
				register.value = value
				LeekWars.post('leek/set-register', {leek_id: this.leek.id, key: register.key, value}).then((data) => {
					if (data.success) {
						LeekWars.toast("Register saved")
					}
				})
			}
		}
		registerDelete(register: Register) {
			if (!this.leek) { return }
			this.leek.registers.splice(this.leek.registers.indexOf(register), 1)
			LeekWars.post('leek/delete-register', {leek_id: this.leek.id, key: register.key}).then((data) => {
				if (data.success) {
					LeekWars.toast("Register deleted")
				}
			})
		}

		weaponDragStart(location: string, weapon: Weapon, e: DragEvent) {
			if (this.leek && LeekWars.weapons[weapon.template].level > this.leek.level) { return }
			this.draggedWeapon = weapon
			this.draggedWeaponLocation = location
		}
		weaponDragEnd(weapon: Weapon) {
			this.draggedWeapon = null
		}
		addWeapon(weapon: Weapon) {
			if (!this.leek) { return }
			const template = LeekWars.weapons[weapon.template]
			if (this.leek.weapons.length >= this.leek.max_weapons) {
				return LeekWars.toast(this.$i18n.t('leek.error_max_weapon', [this.leek.name]))
			}
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('leek.error_under_required_level_weapon', [this.leek.name]))
			}
			if (this.leek.weapons.some((w) => w.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('leek.error_weapon_already_equipped', [this.leek.name]))
			}
			LeekWars.post('leek/add-weapon', {leek_id: this.leek.id, weapon_id: weapon.id}).then((data) => {
				if (data.success && this.leek) {
					this.leek.weapons.push({id: data.id, template: weapon.template})
					this.$store.commit('remove-weapon', weapon)
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		removeWeapon(weapon: Weapon) {
			if (!this.leek) { return }
			this.leek.weapons.splice(this.leek.weapons.indexOf(weapon), 1)
			this.$store.commit('add-weapon', weapon)
			LeekWars.post('leek/remove-weapon', {weapon_id: weapon.id}).then((data) => {
				if (!data.success) {
					LeekWars.toast(data.error)
				}
			})
		}
		weaponsDrop(location: string, e: DragEvent) {
			if (!this.draggedWeapon) { return }
			if (location === 'farmer' && this.draggedWeaponLocation === 'leek') {
				this.removeWeapon(this.draggedWeapon)
			} else if (location === 'leek' && this.draggedWeaponLocation === 'farmer') {
				this.addWeapon(this.draggedWeapon)
			}
			this.draggedWeapon = null
			e.preventDefault()
			return false
		}

		chipDragStart(location: string, chip: Chip, e: DragEvent) {
			if (this.leek && LeekWars.chips[chip.template].level > this.leek.level) { return }
			this.draggedChip = chip
			this.draggedChipLocation = location
		}
		chipDragEnd(chip: Chip) {
			this.draggedChip = null
		}
		addChip(chip: Chip) {
			if (!this.leek) { return }
			const template = LeekWars.chips[chip.template]
			if (this.leek.chips.length >= this.leek.max_chips) {
				return LeekWars.toast(this.$i18n.t('leek.error_max_chip', [this.leek.name]))
			}
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('leek.error_under_required_level_chip', [this.leek.name]))
			}
			if (this.leek.chips.some((c) => c.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('leek.error_chip_already_equipped', [this.leek.name]))
			}
			LeekWars.post('leek/add-chip', {leek_id: this.leek.id, chip_id: chip.id}).then((data) => {
				if (data.success && this.leek) {
					this.leek.chips.push({id: data.id, template: chip.template})
					this.$store.commit('remove-chip', chip)
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		removeChip(chip: Chip) {
			if (!this.leek) { return }
			this.leek.chips.splice(this.leek.chips.indexOf(chip), 1)
			this.$store.commit('add-chip', chip)
			LeekWars.post('leek/remove-chip', {chip_id: chip.id}).then((data) => {
				if (!data.success) {
					LeekWars.toast(data.error)
				}
			})
		}
		chipsDrop(location: string, e: DragEvent) {
			if (!this.draggedChip) { return }
			if (location === 'farmer' && this.draggedChipLocation === 'leek') {
				this.removeChip(this.draggedChip)
			} else if (location === 'leek' && this.draggedChipLocation === 'farmer') {
				this.addChip(this.draggedChip)
			}
			this.draggedChip = null
			e.preventDefault()
			return false
		}
	}
</script>

<style lang="scss" scoped>
	.leek-image {
		display: flex;
		justify-content: center;
		align-items: center;
		height: calc(100% - 66px);
	}
	.characteristics {
		padding: 15px 0;
		.characteristic {
			width: calc(50% - 60px);
			padding: 5px 30px;
			display: inline-block;
			img {
				vertical-align: top;
				margin-right: 7px;
				width: 25px;
			}
			div > span {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				margin-top: 5px;
				font-weight: bold;
			}
		}
		.characteristic:nth-child(4n),
		.characteristic:nth-child(3),
		.characteristic:nth-child(7) {
			background: white;
		}
	}
	.tooltip .effect, .tooltip .capital, .tooltip .base-life, .tooltip .added-life {
		font-size: 13px;
	}
	h4.level {
		font-size: 20px;
	}
	.bar {
		width: 100%;
		height: 10px;
		margin-top: 5px;
		background: white;
		border: 1px solid #ddd;
		position: relative;
		border-radius: 5px;
	}
	.xp-bar {
		height: 10px;
		background: #30bb00;
		display: inline-block;
		vertical-align: top;
		position: absolute;
		border-radius: 5px;
		transition: all ease 0.3s;
	}
	.xp-bar.blue {
		background: #008fbb;
	}
	.talent-more {
		font-size: 18px;
		margin-left: 5px;
		color: #888;
	}
	.fights {
		margin-top: 10px;
		width: 100%;
		border-collapse: collapse;
		text-align: center;
		.big {
			font-size: 21px;
			font-weight: 300;
			color: #555;
		}
		.grey {
			color: #999;
		}
	}
	.talent-wrapper {
		padding-top: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.talent-history {
		margin-top: 3px;
		margin-left: -10px;
		margin-right: -4px;
		margin-bottom: -16px;
		position: relative;
		/deep/ .ct-line {
			stroke: rgba(95, 173, 27, 0.7);
			stroke-width: 2px;
		}
		/deep/ .ct-point {
			stroke: #5fad1b;
		}
		/deep/ .ct-area {
			fill: rgba(95, 173, 27, 1);
			fill-opacity: 0.2;
		}
		/deep/ .ct-label.ct-horizontal {
			text-align: center;
			display: block;
		}
	}
	.chart-tooltip {
		position: absolute;
	}
	.edit-button {
		float: right;
		cursor: pointer;
		color: #aaa;
		margin: 10px 0;
	}
	.edit-button:hover {
		color: black;
	}
	.dashed {
		border: 3px dashed #999;
		margin: -3px;
	}
	.dragging {
		opacity: 0.2;
	}
	.leek-weapons, .farmer-weapons {
		min-height: 80px;
	}
	.weapon {
		vertical-align: bottom;
		margin: 2px;
	}
	.weapons-popup .weapon {
		cursor: move;
		width: 180px;
		border: 1px solid #ddd;
		vertical-align: bottom;
		height: 66px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 5px;
	}
	.weapons-popup .weapon img {
		max-width: 170px;
		max-height: 60px;
	}
	.locked {
		opacity: 0.3;
		cursor: default;
	}
	.panel .chips {
		text-align: center;
		padding: 20px 0;
	}
	.chip {
		display: inline-block;
		vertical-align: bottom;
		margin: 2px;
		img {
			width: 62px;
			vertical-align: bottom;
		}
	}
	.chips-dialog .chip {
		display: inline-block;
		margin: 5px;
		cursor: move;
	}
	.chips-dialog .chip img {
		width: 60px;
		vertical-align: bottom;
	}
	.chips-dialog .leek-chips, .chips-dialog .farmer-chips {
		min-height: 80px;
	}
	.leek-ai {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 10px;
	}
	.ai_popup .leek-ai {
		text-align: center;
	}
	.ai_popup .leek-ai,
	.ai_popup .farmer-ais {
		min-height: 80px;
		max-height: 400px;
	}
	.ai_popup .ai {
		cursor: pointer;
	}
	.farmer-potions {
		.potion {
			display: inline-block;
			cursor: pointer;
			position: relative;
			img {
				width: 80px;
			}
			&::after {
				position: absolute;
				bottom: 0;
				right: 0;
				padding-top: 1px;
				height: 19px;
				padding-left: 4px;
				padding-right: 4px;
				content: attr(quantity);
				text-align: center;
				color: #eee;
				border-radius: 20px;
				font-weight: bold;
				background-color: #777;
			}
		}
	}
	.hat-dialog .hat {
		display: inline-block;
		vertical-align: top;
		cursor: pointer;
		text-align: center;
		margin: 3px;
		width: 125px;
		height: 90px;
	}
	.hat-dialog .hat img {
		max-height: 90px;
		max-width: 125px;
	}
	#app.app .hat-button {
		display: none;
	}
	#app.app .hat-dialog {
		text-align: center;
	}
	#app.app .hat-dialog .hat {
		width: 100px;
		height: 70px;
		margin: 6px;
	}
	#app.app .hat-dialog .hat img {
		max-height: 70px;
		max-width: 100px;
	}
	.registers {
		border: 1px solid #ccc;
		width: 100%;
		.register {
			font-family: monospace;
		}
		th {
			background: white;
			font-size: 17px;
			font-weight: bold;
		}
		td {
			background: #f8f8f8;
		}
		td, th {
			vertical-align: top;
			padding: 4px 8px;
			border: 1px solid #ccc;
		}
		.key {
			color: #555;
			font-style: italic;
		}
		.value {
			width: 100%;
		}
		.delete {
			padding: 0 20px;
			cursor: pointer;
			color: #555;
		}
	}
	.farmer-weapons .weapon, .farmer-chips .chip, .hat-dialog .hat {
		position: relative;
	}
	.farmer-weapons .weapon:not([quantity="1"])::before,
	.farmer-chips .chip:not([quantity="1"])::before,
	.hat-dialog .hat:not([quantity="1"])::before {
		position: absolute;
		bottom: -5px;
		right: -5px;
		width: 20px;
		height: 20px;
		content: attr(quantity);
		text-align: center;
		color: #eee;
		border-radius: 20px;
		background-color: #0a0;
		font-weight: bold;
		padding-left: 4px;
		padding-right: 4px;
		padding-top: 1px;
	}
	.v-input--switch {
		margin-left: 8px;
	}
</style>
