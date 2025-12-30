<template lang="html">
	<error v-if="error" :title="$t('not_found')" :message="$t('not_found_id', [id])" />
	<div v-else class="page">
		<div class="page-header page-bar">
			<rich-tooltip-leek v-if="leek" :id="leek.id" v-slot="{ props }" :bottom="true">
				<h1 v-bind="props">{{ leek.name }}</h1>
			</rich-tooltip-leek>
			<h1 v-else>...</h1>
			<div class="tabs">
				<template v-if="leek && my_leek">
					<template v-if="leek.tournament && leek.tournament.current">
						<router-link :to="'/tournament/' + leek.tournament.current">
							<div class="tab green">{{ $t('see_tournament') }}</div>
						</router-link>
					</template>
					<v-tooltip v-if="$store.state.farmer.tournaments_enabled && leek.tournament" content-class="fluid" @input="loadTournamentRange">
						<template v-slot:activator="{ props }">
							<div class="tab" @click="registerTournament" v-bind="props">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="!leek.tournament.registered" class="register">{{ $t('register_to_tournament') }}</span>
								<span v-else class="unregister">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
						<i18n-t v-if="tournamentRange" tag="div" keypath="main.level_x_to_y">
							<b slot="min">{{ tournamentRange.min }}</b>
							<b slot="max">{{ tournamentRange.max }}</b>
						</i18n-t>
					</v-tooltip>
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<div class="tab" @click="updateGarden" v-bind="props">
								<span>{{ $t('garden') }}</span>
								<v-switch :input-value="leek.in_garden" hide-details />
							</div>
						</template>
						{{ $t('authorize_agressions') }}
					</v-tooltip>
				</template>
				<template v-else-if="$store.state.connected">
					<router-link v-if="leek" :to="'/garden/challenge/leek/' + leek.id">
						<div :link="'/garden/challenge/' + leek.id" class="tab action">
							<v-icon>mdi-flag-outline</v-icon>
							<span>{{ $t('challenge') }}</span>
						</div>
					</router-link>
				</template>
			</div>
		</div>

		<div class="container">
			<panel>
				<template #title>
					<i18n-t keypath="farmed_by">
						<template #farmer>
							<router-link :to="'/farmer/' + (leek ? leek.farmer.id : 0)">
								<rich-tooltip-farmer :id="(leek ? leek.farmer.id : 0)" v-slot="{ props }" :bottom="true">
									<span v-bind="props">{{ leek ? leek.farmer.name : '...' }}</span>
								</rich-tooltip-farmer>
							</router-link>
						</template>
					</i18n-t>
				</template>
				<template v-if="my_leek" #actions>
					<div class="button flat hat-button" @click="customizeDialog = true">
						<v-icon>mdi-auto-fix</v-icon>
					</div>
				</template>
				<template #content>
					<div class="leek-image">
						<leek-image v-if="leek" :scale="0.95" :leek="leek" />
						<loader v-else />
						<lw-title v-if="leek && leek.title.length" :title="leek.title" :class="{pointer: my_leek}" @click.native="titleDialog = my_leek" />
					</div>
				</template>
			</panel>

			<panel :title="$t('statistics')">
				<h4 class="level">{{ $t('main.level_n', [leek ? leek.level : '...']) }} <v-tooltip v-if="leek?.xp_blocked">
					<template v-slot:activator="{ props }">
						<v-icon v-bind="props">mdi-lock</v-icon>
					</template>
					{{ $t('main.xp_blocked') }}
				</v-tooltip></h4>

				<v-tooltip>
					<template v-slot:activator="{ props }">
						<div class="bar" v-bind="props">
							<span :class="{ blue: blue_xp_bar }" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
						</div>
					</template>
					<template v-if="leek && leek.isMaxLevel">
						<b>{{ $t('max_level') }}</b> <br>
						{{ $t('xp', [LeekWars.formatNumber(leek.xp)]) }}
					</template>
					<template v-else-if="leek">
						<b>{{ $t('remaining_xp', [LeekWars.formatNumber(remaining_xp)]) }} ({{ Math.round(100 * (leek.xp - leek.down_xp) / (leek.up_xp - leek.down_xp)) }}%)</b>
						<br>
						{{ $t('xp', [LeekWars.formatNumber(leek.xp) + " / " + LeekWars.formatNumber(leek.up_xp)]) }}
					</template>
				</v-tooltip>

				<div class="talent-wrapper">
					<talent :id="leek ? leek.id : 0" :talent="leek ? leek.talent : '...'" category="leek" :v-tooltip="$t('talent')" />
					<v-tooltip v-if="leek">
						<template v-slot:activator="{ props }">
							<div class="talent-more" v-bind="props">({{ leek.talent_more >= 0 ? '+' + leek.talent_more : leek.talent_more }})</div>
						</template>
						<template v-if="leek.talent_more > 0">
							<span v-html="$t('main.talent_difference', [leek.name, leek.talent_more, leek.talentGains + '%'])"></span>
						</template>
						<template v-else>
							<span v-html="$t('main.talent_difference_no_gains', [leek.name])"></span>
						</template>
					</v-tooltip>
					<ranking-badge v-if="leek && leek.ranking && leek.ranking <= 1000 && leek.in_garden" :id="leek.id" :ranking="leek.ranking" category="leek" />
				</div>

				<v-tooltip v-if="leek">
					<template v-slot:activator="{ props }">
						<table class="fights" v-bind="props">
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
					</template>
					{{ $t('ratio', [leek ? leek.ratio : 0]) }}
				</v-tooltip>

				<template v-if="leek && leek.level >= 100">
					<chartist ref="chart" :data="chartData" :options="chartOptions" :events="chartEvents" ratio="ct-major-eleventh" class="talent-history" type="Line" />
					<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top">{{ chartTooltipValue }}</div>
				</template>
			</panel>

			<panel :title="$t('characteristic.characteristics')">
				<template v-if="leek && my_leek && leek.capital == 0 && $store.state.farmer.equipment_enabled" #actions>
					<div class="button flat" @click="capitalDialog = true">
						<v-icon>mdi-star-outline</v-icon>
					</div>
				</template>
				<template #content>
					<div class="characteristics">
						<characteristic-tooltip v-for="c in LeekWars.characteristics_table" :key="c" v-slot="{ props }" :characteristic="c" :value="leek ? leek[c] : 0" :total="leek ? leek['total_' + c] : 0" :leek="leek" :test="false">
							<div class="characteristic" :class="c" v-bind="props">
								<img :src="'/image/charac/' + c + '.png'">
								<span :class="'color-' + c">{{ leek ? leek['total_' + c] : '...' }}</span>
							</div>
						</characteristic-tooltip>
						<div class="center" v-if="leek && my_leek">
							<span class="dida-element">
								<v-btn v-if="(leek.capital > 0 || LeekWars.didactitial_step === 1) && $store.state.farmer.equipment_enabled" color="primary" @click="capitalDialog = true" :class="{bouncing: !capitalDialog && LeekWars.didactitial_step === 1}">{{ $t('main.n_capital', [leek.capital]) }}</v-btn>
								<span v-if="LeekWars.didactitial_step === 1" class="dida-hint">
									<i18n-t v-if="LeekWars.didactitial_step === 1" class="bubble" keypath="main.dida_2">
										<img height=18 src="/image/charac/life.png" slot="life">
										<img height=18 src="/image/charac/strength.png" slot="strength">
									</i18n-t>
									<span class="arrow"></span>
								</span>
							</span>
							&nbsp;
							<v-btn class="potions-button" @click="potionDialog = true">
								<img src="/image/icon/black/potion.png">
								{{ $t('potions') }}
							</v-btn>
						</div>
					</div>
				</template>
			</panel>

			<panel icon="mdi-sword">
				<template #title>{{ $t('weapons') }} <span v-if="leek && leek.weapons" class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span></template>
				<template v-if="leek && my_leek" #actions>
					<div v-if="$store.state.farmer.equipment_enabled" class="button flat" @click="weaponsDialog = true">
						<v-icon>mdi-pencil</v-icon>
					</div>
				</template>
				<div slot="content" class="weapons-wrapper center">
					<loader v-if="!leek" />
					<div v-else-if="leek.weapons.length === 0" class="empty">{{ $t('no_weapons') }}</div>
					<template v-else>
						<rich-tooltip-item v-for="weapon in orderedWeapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :leek="leek">
							<div class="weapon" v-bind="props">
								<img :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'" @click="setWeapon(weapon.template)" :width="WeaponsData[LeekWars.items[weapon.template].params].width">
							</div>
						</rich-tooltip-item>
					</template>
				</div>
			</panel>

			<panel icon="mdi-chip">
				<template #title>{{ $t('main.chips') }} <span v-if="leek && leek.chips" class="chip-count">[{{ leek.chips.length }}/{{ leek.total_ram }}]</span></template>
				<template v-if="leek && my_leek && (leek.chips.length + farmer_chips.length) > 0" #actions>
					<div v-if="$store.state.farmer.equipment_enabled" class="button flat" @click="chipsDialog = true">
						<v-icon>mdi-pencil</v-icon>
					</div>
				</template>
				<template #content>
					<div class="chips-wrapper center">
						<loader v-if="!leek" />
						<div v-else-if="leek.chips.length === 0" class="empty">{{ $t('no_chips') }}</div>
						<div v-else class="chips">
							<rich-tooltip-item v-for="(chip, i) in orderedChips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[chip.template]" :bottom="true" :leek="leek">
								<div class="chip" :class="{disabled: i >= leek.total_ram}" v-bind="props">
									<img :src="'/image/chip/' + CHIPS[chip.template].name + '.png'">
								</div>
							</rich-tooltip-item>
						</div>
					</div>
				</template>
			</panel>

			<panel :title="$t('ai_and_components') + (leek ? ' [' + leek.components.filter(c => !!c).length + '/' + max_components + ']' : '...')" icon="mdi-code-braces">
				<template v-if="leek && my_leek" #actions>
					<div class="button flat" @click="aiDialog = true">
						<v-icon>mdi-pencil</v-icon>
					</div>
				</template>
				<div slot="content" class="leek-ai-components">
					<loader v-if="!leek" />
					<template v-else>
						<div class="components-grid">
							<template v-for="(c, i) of 8">
								<div v-if="leek.components[i]" class="component" :class="{disabled: i >= max_components}">
									<rich-tooltip-item v-slot="{ props }" :item="LeekWars.items[leek.components[i].template]" :bottom="true" :key="c">
										<div v-bind="props">
											<img :src="'/image/component/' + LeekWars.items[leek.components[i].template].name + '.png'">
										</div>
									</rich-tooltip-item>
								</div>
								<div v-else class="component" :key="c"></div>
							</template>
							<template v-if="leek.ai">
								<router-link v-if="my_leek" :to="'/editor/' + leek.ai.id">
									<ai :ai="leek.ai" :library="false" :small="false" />
								</router-link>
								<a v-else-if="$store.getters.admin" :href="LeekWars.API + 'ai/download/' + leek.ai.id" target="_blank">
									<ai :ai="leek.ai" :library="false" :small="false" />
								</a>
								<ai v-else :ai="leek.ai" :library="false" :small="false" />
							</template>
							<span v-else class="empty">{{ $t('no_ai') }}</span>
						</div>
					</template>
				</div>
			</panel>
		</div>

		<div class="center" v-if="leek && my_leek && leek.fights && leek.fights.length === 0">
			<br>
			<router-link to="/garden">
				<v-btn color="primary">
					<v-icon>mdi-sword-cross</v-icon>&nbsp;
					{{ $t('start_a_fight') }}
				</v-btn>
			</router-link>
			<br><br>
		</div>

		<div class="container large">
			<panel v-if="leek && leek.fights && leek.fights.length > 0" :title="$t('fights')" icon="mdi-sword-cross">
				<template v-if="leek" #actions>
					<router-link :to="'/leek/' + leek.id + '/history'" class="button flat">
						<v-icon>mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template>
				<fights-history slot="content" :fights="leek.fights" />
			</panel>
			<panel v-if="leek && leek.tournaments && leek.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<tournaments-history slot="content" :tournaments="leek.tournaments" />
			</panel>
		</div>

		<panel v-if="leek && my_leek && leek.registers && leek.registers.length > 0" toggle="leek/registers" icon="mdi-database">
			<template #title>{{ $t('registers') }} <span class="register-count">[{{ leek.registers.length }}/100]</span></template>
			<table class="registers">
				<tr>
					<th>{{ $t('register_key') }}</th>
					<th>{{ $t('register_value') }}</th>
					<th></th>
				</tr>
				<tr v-for="register in leek.registers" :key="register.key" class="register">
					<td class="key">{{ register.key }}</td>
					<td class="value" contenteditable @focusout="registerFocusout(register, $event)"><div>{{ register.value }}</div></td>
					<td class="delete" @click="registerDelete(register)"><v-icon>mdi-close</v-icon></td>
				</tr>
			</table>
		</panel>

		<div class="spacer"></div>

		<div class="page-footer page-bar">
			<div class="tabs">
				<template v-if="$store.state.connected && !my_leek">
					<div class="tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span class="report-button">{{ $t('report') }}</span>
					</div>
				</template>
				<template v-if="my_leek">
					<div class="tab" @click="renameDialog = true">
						<v-icon>mdi-pencil-outline</v-icon>
						{{ $t('rename_leek') }}
					</div>
				</template>
				<v-tooltip v-if="leek && my_leek && leek.level >= 20 && $store.state.farmer?.br_enabled" @input="loadBRRange">
					<template v-slot:activator="{ props }">
						<div class="tab" @click="registerAutoBr" v-bind="props">
							<v-icon>mdi-trophy</v-icon>
							<span v-if="!leek.auto_br" class="register">{{ $t('register_to_br') }}</span>
							<span v-else class="unregister">{{ $t('unregister') }}</span>
						</div>
					</template>
					{{ $t('br_time') }}
					<i18n-t v-if="brRange" tag="div" keypath="main.level_x_to_y">
						<b slot="min">{{ brRange.min }}</b>
						<b slot="max">{{ brRange.max }}</b>
					</i18n-t>
				</v-tooltip>
				<template v-if="leek && leek.level > 1 && $store.state.connected">
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<div class="tab" @click="copyAsTest()" v-bind="props" icon="play_arrow">
								<v-icon class="list-icon">mdi-content-copy</v-icon><span>{{ $t('test') }}</span>
							</div>
						</template>
						{{ $t('copy_as_test', [leek.name]) }}
					</v-tooltip>
				</template>
				<v-tooltip v-if="leek && my_leek && (!$store.state.farmer.group || $store.state.farmer.group.supervisor === $store.state.farmer.id)">
					<template v-slot:activator="{ props }">
						<div class="tab" @click="updateXpBlocked" v-bind="props">
							<span>{{ $t('main.xp_blocked') }}</span>
							<v-switch :input-value="leek.xp_blocked" hide-details />
						</div>
					</template>
					{{ $t('xp_blocked_desc') }}
				</v-tooltip>
			</div>
		</div>

		<popup v-if="leek" v-model="weaponsDialog" :width="800">
			<img slot="icon" src="/image/icon/garden.png">
			<template #title>
				{{ $t('weapons_of', [leek.name]) }}
				<span class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span>
			</template>
			<div class="weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<rich-tooltip-item v-for="(weapon, i) in orderedWeapons" :key="i" v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :nodge="true" :leek="leek">
						<div :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" v-bind="props" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('all_my_weapons') }} ({{ farmer_weapons.length }})</h4>
				<div v-if="farmer_weapons.length" class="info">{{ $t('equip_item') }}</div>
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'leek'}" class="farmer-weapons" @dragover="dragOver" @drop="weaponsDrop('farmer', $event)">
					<rich-tooltip-item v-for="(weapon, i) in farmer_weapons" :key="i" v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :nodge="true">
						<div :quantity="weapon.quantity" :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'farmer', locked: LeekWars.items[weapon.template].level > leek.level || (LeekWars.weapons[LeekWars.items[weapon.template].params].forgotten && hasForgottenWeapon) || leek.weapons.find(w => w.template === weapon.template) }" :draggable="LeekWars.items[weapon.template].level <= leek.level" class="weapon" v-bind="props" @dragstart="weaponDragStart('farmer', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="addWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
				<i18n-t v-if="$store.state.farmer" class="buy-hint" tag="div" keypath="buy_hint">
					<span slot="hab"><b>{{ $store.state.farmer.habs | number }}</b> <span class="hab"></span></span>
					<router-link slot="market" to="/market">{{ $t('main.market') }}</router-link>
				</i18n-t>
			</div>
		</popup>

		<popup v-if="leek" v-model="renameDialog" :width="600">
			<v-icon slot="icon">mdi-pencil-outline</v-icon>
			<template #title>{{ $t('rename_leek') }}</template>
			{{ $t('rename_description') }}
			<br>
			<br>
			{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
			<br>
			<br>
			<div class="center">
				<v-btn class="rename-button" @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ rename_price_habs | number }}</b><img src="/image/hab.png"></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ rename_price_crystals }}</b><span class="crystal"></span></v-btn>
			</div>
		</popup>

		<v-snackbar v-model="renameSuccess" :timeout="2000" color="success">{{ $t('rename_done') }}</v-snackbar>
		<v-snackbar v-if="renameError" v-model="renameFailed" :timeout="5000" color="error">{{ $t(renameError.error, renameError.error_params) }}</v-snackbar>

		<popup v-if="leek && my_leek" v-model="potionDialog" :width="750">
			<img slot="icon" src="/image/icon/potion.png">
			<span slot="title">{{ $t("use_a_potion", [leek.name]) }}</span>
			<div class="farmer-potions">
				<div class="potions-grid">
					<v-tooltip v-for="(potion, id) in $store.state.farmer.potions" :key="id">
						<template v-slot:activator="{ props }">
							<div :quantity="potion.quantity" class="potion" @click="usePotion(potion)" v-bind="props">
								<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
							</div>
						</template>
						<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
						<br>
						{{ $t('main.level_n', [LeekWars.potions[potion.template].level]) }}
						<div v-if="!LeekWars.potions[potion.template].consumable">
							<v-icon>mdi-autorenew</v-icon> {{ $t('main.reusable') }}
						</div>
					</v-tooltip>
				</div>
				<div class="center">({{ $t('click_to_use') }})</div>
			</div>
		</popup>

		<popup v-if="leek && my_leek" v-model="skinPotionDialog" :width="750">
			<img slot="icon" src="/image/icon/potion.png">
			<span slot="title">{{ $t("select_skin") }}</span>
			<div class="farmer-potions">
				<div class="potions-grid">
					<v-tooltip v-for="(potion, id) in skinPotions" :key="id">
						<template v-slot:activator="{ props }">
							<div :quantity="potion.quantity" class="potion" @click="usePotion(potion)" v-bind="props">
								<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
							</div>
						</template>
						<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
						<br>
						{{ $t('main.level_n', [LeekWars.potions[potion.template].level]) }}
						<div v-if="!LeekWars.potions[potion.template].consumable">
							<v-icon>mdi-autorenew</v-icon> {{ $t('main.reusable') }}
						</div>
					</v-tooltip>
				</div>
			</div>
		</popup>

		<report-dialog v-if="leek" v-model="reportDialog" :name="leek.farmer.name" :target="leek.farmer" :leek="leek" :reasons="reasons" :parameter="leek.id" />

		<popup v-model="hatDialog" :width="750">
			<v-icon slot="icon">mdi-hat-fedora</v-icon>
			<span slot="title">{{ $t('select_a_hat') }}</span>
			<div class="hat-dialog">
				<div class="hats">
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<div v-ripple :quantity="1" class="hat" @click="selectHat(null)" v-bind="props">
								<img src="/image/hat/no_hat.png">
							</div>
						</template>
						<b>{{ $t('no_hat') }}</b>
					</v-tooltip>
					<v-tooltip v-for="hat in farmer_hats" :key="hat.id">
						<template v-slot:activator="{ props }">
							<div v-ripple :quantity="hat.quantity" class="hat" @click="selectHat(hat)" v-bind="props">
								<img :src="'/image/hat/' + hat.name + '.png'">
							</div>
						</template>
						<b>{{ $t('hat.' + hat.name) }}</b>
						<br>
						{{ $t('main.level_n', [hat.level]) }}
					</v-tooltip>
				</div>
				<br>
				<div class="center">({{ $t('click_to_put_hat') }})</div>
			</div>
		</popup>

		<popup v-model="skinWeaponDialog" :width="650">
			<img slot="icon" src="/image/icon/garden.png">
			<span slot="title">{{ $t('select_a_weapon') }}</span>
			<div v-if="leek" class="weapons-popup">
				<div class="leek-weapons">
					<v-tooltip>
						<template v-slot:activator="{ props }">
							<div v-ripple :quantity="1" class="weapon" @click="setWeapon(0)" v-bind="props">
								<img src="/image/weapon/no_weapon.png">
							</div>
						</template>
						<b>{{ $t('no_weapon') }}</b>
					</v-tooltip>
					<rich-tooltip-item v-for="(weapon, i) in orderedWeapons" :key="i" v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :nodge="true" :leek="leek">
						<div class="weapon" v-bind="props" @click="setWeapon(weapon.template)">
							<img :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</popup>

		<popup v-model="customizeDialog" :width="700">
			<v-icon slot="icon">mdi-auto-fix</v-icon>
			<span slot="title">{{ $t('customize') }}</span>
			<div v-if="leek" class="customize-dialog">
				<div class="center">
					<leek-image ref="leekImage" :leek="leek" :scale="1" />
					<br>
					<lw-title v-if="leek.title.length" :title="leek.title" />
				</div>

				<div class="customize-grid">
					<div v-ripple class="item card" @click="skinPotionDialog = true">
						<div class="title">{{ $t('skin') }}</div>
						<img v-if="leek.skin" class="image" :src="'/image/potion/' + LeekWars.potionsBySkin[leek.skin].name + '.png'">
						<img v-else class="image" src="/image/potion/skin_green.png">
						<div class="name">{{ $t('potion.' + LeekWars.potionsBySkin[leek.skin].name) }}</div>
					</div>
					<div v-ripple class="item card" @click="hatDialog = true">
						<div class="title">{{ $t('main.hat') }}</div>
						<img v-if="leek.hat" class="image" :src="'/image/hat/' + LeekWars.hats[LeekWars.items[leek.hat.template].params].name + '.png'">
						<img v-else class="image" src="/image/hat/no_hat.png">
						<div v-if="leek.hat" class="name">{{ $t('hat.' + LeekWars.hats[LeekWars.items[leek.hat.template].params].name) }}</div>
					</div>
					<div v-ripple class="item card" :class="{disabled: !holdWeaponEnabled}" @click="skinWeaponDialog = true">
						<div class="title">
							<v-tooltip v-if="holdWeaponEnabled">
								<template v-slot:activator="{ props }">
									<img src="/image/pomp/hold_weapon.png" v-bind="props">
								</template>
								{{ $t('pomp.hold_weapon') }}
							</v-tooltip>
							{{ $t('weapon') }}
						</div>
						<template v-if="holdWeaponEnabled">
							<img v-if="leek.weapon" class="image" :src="'/image/' + LeekWars.items[leek.weapon].name.replace('_', '/') + '.png'">
							<img v-else class="image" src="/image/weapon/no_weapon.png">
							<div v-if="leek.weapon" class="name">{{ $t('weapon.' + LeekWars.weapons[LeekWars.items[leek.weapon].params].name) }}</div>
						</template>
						<template v-else>
							<img class="image" src="/image/pomp/hold_weapon.png">
							<div class="name"><v-icon>mdi-lock</v-icon> {{ $t('pomp.hold_weapon') }}</div>
						</template>
					</div>
					<div v-ripple class="item card" :class="{disabled: !leekTitleEnabled}" @click="titleDialog = true">
						<div class="title">
							<v-tooltip v-if="leekTitleEnabled">
								<template v-slot:activator="{ props }">
									<img src="/image/pomp/leek_title.png" v-bind="props">
								</template>
								{{ $t('pomp.leek_title') }}
							</v-tooltip>
							{{ $t('title') }}
						</div>
						<template v-if="leekTitleEnabled">
							<span class="large-icon image">«<v-icon>mdi-format-font</v-icon>»</span>
							<div v-if="leek.title.length" class="name">{{ $t('title') }}</div>
						</template>
						<template v-else>
							<img class="image" src="/image/pomp/leek_title.png">
							<div class="name"><v-icon>mdi-lock</v-icon> {{ $t('pomp.leek_title') }}</div>
						</template>
					</div>
				</div>
				<br>
				<div class="container">
					<div class="column6">
						<div v-if="$store.state.farmer" class="pomp">
							<v-switch :input-value="$store.state.farmer.show_ai_lines" hide-details :label="$t('pomp.ai_lines')" :disabled="!showAiLinesEnabled" @change="changeShowAiLines" />
							<v-tooltip :disabled="showAiLinesEnabled">
								<template v-slot:activator="{ props }">
									<img v-bind="props" src="/image/pomp/ai_lines.png">
								</template>
								<v-icon>mdi-lock</v-icon> {{ $t('pomp.ai_lines') }}
							</v-tooltip>
						</div>
						<div v-if="leek" class="pomp">
							<v-switch :input-value="leek.metal" hide-details :label="$t('pomp.metal')" :disabled="!metalEnabled" @change="changeMetal" />
							<v-tooltip :disabled="metalEnabled">
								<template v-slot:activator="{ props }">
									<img v-bind="props" src="/image/pomp/metal.png">
								</template>
								<v-icon>mdi-lock</v-icon> {{ $t('pomp.metal') }}
							</v-tooltip>
						</div>
					</div>
					<div v-if="leek" class="pomp column6">
						<v-radio-group v-model="leek.face" @change="changeFace" hide-details>
							<v-radio :value="0">
								<template v-slot:label>
          							{{ $t('neutral') }}
								</template>
							</v-radio>
							<v-radio :value="1" :disabled="!happyEnabled">
								<template v-slot:label>
          							{{ $t('happy') }}
									<v-tooltip :disabled="happyEnabled">
										<template v-slot:activator="{ props }">
											<img v-bind="props" src="/image/pomp/happy.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.happy') }}
									</v-tooltip>
								</template>
							</v-radio>
							<v-radio :value="2" :disabled="!angryEnabled">
								<template v-slot:label>
									{{ $t('angry') }}
									<v-tooltip :disabled="angryEnabled">
										<template v-slot:activator="{ props }">
											<img v-bind="props" src="/image/pomp/angry.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.angry') }}
									</v-tooltip>
								</template>
							</v-radio>
						</v-radio-group>
					</div>
				</div>
				<v-btn small @click="downloadLeekImage">{{ $t('download_leek_image') }}</v-btn>
			</div>
		</popup>

		<popup v-if="leek" v-model="titleDialog" :width="550">
			<v-icon slot="icon">mdi-medal-outline</v-icon>
			<span slot="title">{{ $t('main.select_title') }}</span>
			<div class="title-dialog">
				<title-picker ref="picker" :title="leek.title" />
			</div>
			<template #actions>
				<div v-ripple @click="titleDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="pickTitle($refs.picker.getTitle())">{{ $t('validate') }}</div>
			</template>
		</popup>

		<level-dialog v-if="leek" v-model="levelPopup" :leek="leek" :level-data="levelPopupData" />

		<popup v-if="leek && my_leek" v-model="aiDialog" :width="1050">
			<v-icon slot="icon">mdi-code-braces</v-icon>
			<span slot="title">{{ $t('ai_of', [leek.name]) }}</span>
			<div class="ai-popup">
				<div class="leek-ai-components components-grid">
					<div v-for="(c, i) of 8" :key="i" class="component" :class="{dashed: draggedComponent, disabled: i >= max_components}" @dragover="dragOver" @drop="componentsDrop('leek', $event, i)">
						<rich-tooltip-item v-if="leek.components[i]" v-slot="{ props }" :item="LeekWars.items[leek.components[i].template]" :key="i" :bottom="true" ref="componentTooltips">
							<div :class="{dragging: draggedComponent && draggedComponent.template === leek.components[i].template && draggedComponentLocation === 'leek'}" draggable="true" v-bind="props" @dragstart="componentDragStart('leek', leek.components[i], $event)" @dragend="componentDragEnd(leek.components[0])" @click="removeComponent(leek.components[i])">
								<img :src="'/image/component/' + LeekWars.items[leek.components[i].template].name + '.png'">
							</div>
						</rich-tooltip-item>
						<div v-else><v-icon>mdi-sd</v-icon></div>
					</div>
					<div :class="{dashed: draggedAI && (!leek.ai || draggedAI.id !== leek.ai.id)}" class="leek-ai" @dragover="dragOver" @drop="aiDrop('leek', $event)">
						<ai v-if="leek.ai" :ai="leek.ai" :library="true" :small="false" @click.native="removeAI()" @dragstart.native="aiDragStart(leek.ai, $event)" @dragend.native="aiDragEnd(leek.ai, $event)" />
					</div>
				</div>
				<div class="flex">
					<explorer class="explorer" @select="selectAI($event)" />
					<div>
						<div class="title">
							<v-icon>mdi-sd</v-icon>
							{{ $t('all_my_components') }} ({{ farmer_components.length }})
						</div>
						<div class="farmer-components" :class="{dashed: draggedComponent && draggedComponentLocation === 'leek'}" @dragover="dragOver" @drop="componentsDrop('farmer', $event)">
							<rich-tooltip-item v-for="component in farmer_components" :key="component.id" v-slot="{ props }" :item="LeekWars.items[component.template]" :bottom="true" :nodge="true" ref="componentTooltips">
								<div :quantity="component.quantity" :class="{dragging: draggedComponent && draggedComponent.template === component.template && draggedComponentLocation === 'farmer', locked: LeekWars.items[component.template].level > leek.level || leek.components.find(c => c && c.template === component.template) }" :draggable="LeekWars.items[component.template].level <= leek.level" class="component" v-bind="props" @dragstart="componentDragStart('farmer', component, $event)" @dragend="componentDragEnd(component)" @click="addComponent(component)">
									<img :src="'/image/component/' + LeekWars.items[component.template].name + '.png'" draggable="false">
								</div>
							</rich-tooltip-item>
						</div>
						<div class="center">
							<router-link to="/inventory">
								<v-btn><v-icon left>mdi-treasure-chest</v-icon> {{ $t('main.inventory') }}</v-btn>
							</router-link>
						</div>
					</div>
				</div>
			</div>
		</popup>

		<popup v-if="leek && my_leek" v-model="chipsDialog" :width="816">
			<v-icon slot="icon">mdi-chip</v-icon>
			<template #title>{{ $t('chips_of', [leek.name]) }} <span class="chip-count">[{{ leek.chips.length }}/{{ leek.total_ram }}]</span></template>
			<div class="chips-dialog">
				<div :class="{dashed: draggedChip && draggedChipLocation === 'farmer'}" class="leek-chips" @dragover="dragOver" @drop="chipsDrop('leek', $event)">
					<rich-tooltip-item v-for="chip in orderedChips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[chip.template]" :bottom="true" :nodge="true" :leek="leek">
						<div :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'leek'}" class="chip" draggable="true" v-bind="props" @dragstart="chipDragStart('leek', chip, $event)" @dragend="chipDragEnd(chip)" @click="removeChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('all_my_chips') }} ({{ farmer_chips.length }})</h4>
				<div v-if="farmer_chips.length" class="info">{{ $t('equip_item') }}</div>
				<div :class="{dashed: draggedChip && draggedChipLocation === 'leek'}" class="farmer-chips" @dragover="dragOver" @drop="chipsDrop('farmer', $event)">
					<rich-tooltip-item v-for="chip in farmer_chips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[chip.template]" :bottom="true" :nodge="true">
						<div :quantity="chip.quantity" :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'farmer', locked: CHIPS[chip.template].level > leek.level || leek.chips.find(c => c.template === chip.template) }" :draggable="CHIPS[chip.template].level <= leek.level" class="chip" v-bind="props" @dragstart="chipDragStart('farmer', chip, $event)" @dragend="chipDragEnd(chip)" @click="addChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
				<i18n-t v-if="$store.state.farmer" class="buy-hint" tag="div" keypath="buy_hint">
					<span slot="hab"><b>{{ $store.state.farmer.habs | number }}</b> <span class="hab"></span></span>
					<router-link slot="market" to="/market">{{ $t('main.market') }}</router-link>
				</i18n-t>
			</div>
		</popup>

		<capital-dialog v-if="leek && my_leek" v-model="capitalDialog" :leek="leek" :total-capital="leek.capital" />
	</div>
</template>

<script lang="ts">
	import { locale } from '@/locale'
	import { AI } from '@/model/ai'
	import { Chip } from '@/model/chip'
	import { Component } from '@/model/component'
	import { Hat } from '@/model/hat'
	import { mixins } from '@/model/i18n'
	import { ItemType } from '@/model/item'
	import { Leek, Register } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Potion, PotionEffect } from '@/model/potion'
	import { store } from '@/model/store'
	import { Weapon, WeaponsData } from '@/model/weapon'
	import { Component as VueComponent, Vue, Watch } from 'vue-property-decorator'
	import CapitalDialog from './capital-dialog.vue'
	import CharacteristicTooltip from './characteristic-tooltip.vue'
	const LevelDialog = () => import(/* webpackChunkName: "[request]" */ `@/component/leek/level-dialog.${locale}.i18n`)
	import(/* webpackChunkName: "chartist" */ /* webpackMode: "eager" */ "@/chartist-wrapper")
	const Explorer = () => import(/* webpackChunkName: "[request]" */ `@/component/explorer/explorer.${locale}.i18n`)
	import { fileSystem } from '@/model/filesystem'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import FightsHistory from '@/component/history/fights-history.vue'
	import TournamentsHistory from '@/component/history/tournaments-history.vue'
	import TitlePicker from '@/component/title/title-picker.vue'
	import ReportDialog from '@/component/moderation/report-dialog.vue'
	import AIElement from '@/component/app/ai.vue'
	import LWTitle from '@/component/title/title.vue'
	import { COMPONENTS } from '@/model/components'
	import { CHIPS } from '@/model/chips'
	import { ORDERED_CHIPS } from '@/model/sorted_chips'
	import LeekImage from '../leek-image.vue'
	import LeekComponent from './leek-component.vue'

	@VueComponent({ name: "leek", i18n: {}, mixins: [...mixins], components: {
		CapitalDialog,
		LevelDialog,
		CharacteristicTooltip,
		Explorer,
		RichTooltipItem,
		RichTooltipFarmer,
		RichTooltipLeek,
		FightsHistory,
		TournamentsHistory,
		TitlePicker,
		ReportDialog,
		ai: AIElement,
		'lw-title': LWTitle,
		LeekComponent,
	} })
	export default class LeekPage extends Vue {
		CHIPS = CHIPS
		COMPONENTS = COMPONENTS
		WeaponsData = WeaponsData
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
		draggedComponent: Component | null = null
		draggedComponentLocation: string | null = null
		capitalDialog: boolean = false
		customizeDialog: boolean = false
		skinWeaponDialog: boolean = false
		titleDialog: boolean = false
		skinPotionDialog: boolean = false
		tournamentRangeLoading: boolean = false
		tournamentRange: any = null
		brRangeLoading: boolean = false
		brRange: any = null
		request: any = null
		MAX_COMPONENTS = 8

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
			return this.xp_bar = this.leek.level === 301 ? 100 : Math.min(100, Math.floor(100 * (this.leek.xp - this.leek.down_xp) / (this.leek.up_xp - this.leek.down_xp)))
		}
		get blue_xp_bar() {
			if (!this.leek) {
				return false
			}
			return this.leek.level === 301
		}
		get farmer_weapons() {
			if (store.state.farmer) {
				return store.state.farmer.weapons.sort((weaponA, weaponB) => {
					return LeekWars.items[weaponA.template].level - LeekWars.items[weaponB.template].level
				})
			}
			return []
		}
		get farmer_chips() {
			if (store.state.farmer) {
				return store.state.farmer.chips.sort((chipA, chipB) => {
					return ORDERED_CHIPS[chipA.template] - ORDERED_CHIPS[chipB.template]
				})
			}
			return []
		}
		get orderedChips() {
			if (!this.leek) return []
			return [...this.leek.chips].sort((chipA, chipB) => {
				return ORDERED_CHIPS[chipA.template] - ORDERED_CHIPS[chipB.template]
			})
		}
		get orderedWeapons() {
			if (!this.leek) return []
			return [...this.leek.weapons].sort((weaponA, weaponB) => {
				return LeekWars.items[weaponA.template].level - LeekWars.items[weaponB.template].level
			})
		}
		get farmer_hats() {
			return store.state.farmer ? store.state.farmer!.hats : []
		}
		get farmer_components() {
			if (store.state.farmer) {
				return store.state.farmer.components
				// .sort((chipA, chipB) => {
				// 	return ORDERED_CHIPS[chipA.template] - ORDERED_CHIPS[chipB.template]
				// })
			}
			return []
		}
		get hasForgottenWeapon() {
			if (!this.leek) { return false }
			for (const weapon of this.leek.weapons) {
				if (LeekWars.weapons[LeekWars.items[weapon.template].params].forgotten) { return true }
			}
			return false
		}
		get holdWeaponEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 123) !== null
		}
		get leekTitleEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 125) !== null
		}
		get showAiLinesEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 124) !== null
		}
		get metalEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 242) !== null
		}
		get skinPotions() {
			return store.state.farmer!.potions.filter(p => LeekWars.potions[p.template].effects.some(e => e.type === PotionEffect.CHANGE_SKIN))
		}
		get angryEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 240) !== null
		}
		get happyEnabled() {
			return this.$store.state.farmer && LeekWars.selectWhere(this.$store.state.farmer.pomps, 'template', 241) !== null
		}
		get max_components() {
			let n = 8
			if (this.leek) {
				for (const component of this.leek.components) {
					if (component) {
						if (component.template === 406 || component.template === 407) n -= 2
					}
				}
			}
			return n
		}
		get remaining_xp() {
			return this.leek ? this.leek.up_xp - this.leek.xp : 0
		}

		mounted() {
			this.$root.$on('update-leek-talent', (message: any) => {
				if (this.leek && message.leek === this.leek.id) {
					this.leek.talent += message.talent
				}
			})
			this.$root.$on('update-leek-xp', (message: any) => {
				if (this.leek && message.leek === this.leek.id) {
					this.leek.xp += message.xp
				}
			})
		}

		@Watch('id', {immediate: true})
		update() {
			this.leek = null
			this.tournamentRange = null
			this.tournamentRangeLoading = false
			this.brRange = null
			this.brRangeLoading = false
			this.error = false
			if (!this.id) { return }
			const method = this.my_leek ? 'leek/get-private/' + this.id : 'leek/get/' + this.id
			this.request = LeekWars.get<Leek>(method)
			this.request.then((leek: Leek) => {
				this.leek = new Leek(leek)
				if (this.leek) {
					LeekWars.setTitle(this.leek.name, this.$t('main.level_n', [this.leek.level]))
					if (this.my_leek) {
						LeekWars.setActions([
							{icon: 'mdi-auto-fix', click: () => this.customize()},
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
			}).error((error: any) => {
				this.error = true
			})
		}

		beforeDestroy() {
			this.$root.$off('update-leek-talent')
			this.$root.$off('update-leek-xp')
			if (this.request) { this.request.abort() }
		}

		rename(currency: string) {
			if (!this.leek) { return }
			const method = currency === 'habs' ? 'leek/rename-habs' : 'leek/rename-crystals'
			LeekWars.post(method, {leek_id: this.leek.id, new_name: this.renameName}).then(data => {
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
			}).error(error => {
				this.renameFailed = true
				this.renameError = error
			})
		}

		usePotion(potion: Potion) {
			const template = LeekWars.potions[potion.template]
			if (this.leek) {
				let update = false
				for (const effect of template.effects) {
					if (effect.type === 1) { // Restat
						update = true
					} else if (effect.type === 2) { // Skin
						const skin = effect.params[0]
						this.leek.skin = skin
						store.commit('change-skin', {leek: this.leek.id, skin})
					} else if (effect.type === 3) {
						// this.leek.fish = !this.leek.fish
						// store.commit('change-fish', {leek: this.leek.id, fish: this.leek.fish})
					}
				}
				this.potionDialog = false
				this.skinPotionDialog = false
				LeekWars.post('leek/use-potion', {leek_id: this.leek.id, potion_id: potion.id}).then(data => {
					if (template.consumable && template.id !== 176) {
						this.$store.commit('remove-inventory', {type: ItemType.POTION, item_template: potion.template})
					}
					if (update) { this.update() }
				})
			}
		}

		registerTournament() {
			if (this.leek) {
				if (this.leek.tournament.registered) {
					this.leek.tournament.registered = false
					LeekWars.post('leek/unregister-tournament', {leek_id: this.leek.id})
				} else {
					this.leek.tournament.registered = true
					LeekWars.post('leek/register-tournament', {leek_id: this.leek.id})
				}
			}
		}

		registerAutoBr() {
			if (this.leek) {
				if (this.leek.auto_br) {
					this.leek.auto_br = false
					LeekWars.post('leek/unregister-auto-br', {leek_id: this.leek.id})
				} else {
					this.leek.auto_br = true
					LeekWars.post('leek/register-auto-br', {leek_id: this.leek.id})
				}
			}
		}

		updateGarden() {
			if (this.leek) {
				this.leek.in_garden = !this.leek.in_garden
				LeekWars.post('leek/set-in-garden', {leek_id: this.leek.id, in_garden: this.leek.in_garden})
			}
		}
		updateXpBlocked() {
			if (this.leek) {
				this.leek.xp_blocked = !this.leek.xp_blocked
				LeekWars.put('leek/set-xp-blocked', {leek_id: this.leek.id, xp_blocked: this.leek.xp_blocked})
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
				LeekWars.delete('leek/remove-hat', {leek_id: this.leek.id}).then(data => {
					if (this.leek) {
						store.commit('change-hat', {leek: this.leek.id, hat: null})
					}
				}).error(error => {
					LeekWars.toast(error)
				})
			} else {
				if (this.leek.hat && this.leek.hat.template === hat.template) {
					this.hatDialog = false
					return
				}
				this.leek.hat = hat
				LeekWars.post('leek/set-hat', {leek_id: this.leek.id, hat_id: hat.template}).then(data => {
					if (this.leek) {
						store.commit('change-hat', { leek: this.leek.id, hat })
					}
				}).error(error => {
					LeekWars.toast(error)
				})
			}
		}

		potion() {
			this.potionDialog = true
		}

		customize() {
			this.customizeDialog = true
		}

		showLevelPopup() {
			if (!this.leek) { return }
			LeekWars.get('leek/get-level-popup/' + this.leek.id).then(data => {
				this.levelPopupData = data.popup
				nextTick(() => this.levelPopup = true)
			})
		}

		removeAI() {
			if (!this.leek) { return }
			this.leek.ai = null
			LeekWars.delete('leek/remove-ai', {leek_id: this.leek.id})
		}

		selectAI(ai: AI) {
			if (!this.leek) { return }
			this.leek.ai = ai
			LeekWars.post('leek/set-ai', {leek_id: this.leek.id, ai_id: ai.id})
			// this.aiDialog = false
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
				LeekWars.post('leek/set-register', {leek_id: this.leek.id, key: register.key, value}).then(data => {
					LeekWars.toast(this.$i18n.t('register_saved'))
				})
			}
		}

		registerDelete(register: Register) {
			if (!this.leek) { return }
			this.leek.registers.splice(this.leek.registers.indexOf(register), 1)
			LeekWars.delete('leek/delete-register', {leek_id: this.leek.id, key: register.key}).then(data => {
				LeekWars.toast(this.$i18n.t('register_deleted'))
			})
		}

		weaponDragStart(location: string, weapon: Weapon, e: DragEvent) {
			if (this.leek && LeekWars.items[weapon.template].level > this.leek.level) { return }
			const forgotten = LeekWars.weapons[LeekWars.items[weapon.template].params].forgotten
			if (location === 'farmer' && this.hasForgottenWeapon && forgotten) { return }
			this.draggedWeapon = weapon
			this.draggedWeaponLocation = location
		}

		weaponDragEnd(weapon: Weapon) {
			this.draggedWeapon = null
		}

		addWeapon(weapon: Weapon) {
			if (!this.leek) { return }
			const template = LeekWars.items[weapon.template]
			if (this.leek.weapons.length >= this.leek.max_weapons) {
				return LeekWars.toast(this.$i18n.t('error_max_weapon', [this.leek.name]))
			}
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_weapon', [this.leek.name]))
			}
			if (this.leek.weapons.some((w) => w.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_weapon_already_equipped', [this.leek.name]))
			}
			if (this.hasForgottenWeapon && LeekWars.weapons[LeekWars.items[weapon.template].params].forgotten) {
				return LeekWars.toast(this.$i18n.t('error_weapon_two_forgotten', [this.leek.name]))
			}
			LeekWars.post('leek/add-weapon', {leek_id: this.leek.id, weapon_id: weapon.id}).then(data => {
				if (this.leek) {
					this.leek.weapons.push({id: data.id, template: weapon.template, quantity: 1})
					this.$store.commit('remove-weapon', weapon)
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		removeWeapon(weapon: Weapon) {
			if (!this.leek) { return }
			this.leek.weapons.splice(this.leek.weapons.indexOf(weapon), 1)
			this.$store.commit('add-weapon', weapon)
			LeekWars.delete('leek/remove-weapon', {weapon_id: weapon.id}).error((error) => LeekWars.toast(error))
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
			if (this.leek && CHIPS[chip.template].level > this.leek.level) { return }
			this.draggedChip = chip
			this.draggedChipLocation = location
		}

		chipDragEnd(chip: Chip) {
			this.draggedChip = null
		}

		addChip(chip: Chip) {
			if (!this.leek) { return }
			const template = CHIPS[chip.template]
			if (this.leek.chips.length >= this.leek.total_ram) {
				return LeekWars.toast(this.$i18n.t('error_max_chip', [this.leek.name]))
			}
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_chip', [this.leek.name]))
			}
			if (this.leek.chips.some((c) => c.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_chip_already_equipped', [this.leek.name]))
			}
			LeekWars.post('leek/add-chip', {leek_id: this.leek.id, chip_id: chip.id}).then(data => {
				if (this.leek) {
					this.leek.chips.push({id: data.id, template: chip.template, quantity: 1})
					this.$store.commit('remove-chip', chip)
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		removeChip(chip: Chip) {
			if (!this.leek) { return }
			this.leek.chips.splice(this.leek.chips.indexOf(chip), 1)
			this.$store.commit('add-chip', chip)
			LeekWars.delete('leek/remove-chip', {chip_id: chip.id}).error((error) => LeekWars.toast(error))
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

		componentDragStart(location: string, component: Component, e: DragEvent) {
			console.log("componentDragStart", component)
			if (this.leek && LeekWars.items[component.template].level > this.leek.level) { return }
			this.draggedComponent = component
			this.draggedComponentLocation = location
			for (const tooltip of this.$refs.componentTooltips as RichTooltipItem[]) {
				tooltip.value = false
				tooltip.disabled = true
			}
		}

		componentDragEnd(component: Component) {
			console.log("componentDragEnd")
			this.draggedComponent = null
			this.enableComponentsTooltips()
		}

		get leek_components() {
			return this.leek ? this.leek.components.reduce((s, c) => s + (c ? 1 : 0), 0) : 0
		}

		addComponent(component: Component, index: number = -1) {
			if (!this.leek) { return }
			const template = LeekWars.items[component.template]
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_component', [this.leek.name]))
			}
			if (this.leek.components.some((c) => c && c.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_component_already_equipped', [this.leek.name]))
			}
			if (index === -1) {
				for (let i = 0; i < 8; i++) { if (this.leek.components[i] === null) { index = i; break; } }
			}
			if (index === -1) {
				return LeekWars.toast(this.$i18n.t('error_max_component', [this.leek.name]))
			}

			LeekWars.post('leek/add-component', { leek_id: this.leek.id, component_id: component.id, index }).then(data => {
				if (this.leek) {
					// On enlève le précédent
					const old = this.leek.components[index]
					if (old) {
						this.$store.commit('add-component', old)
					}
					Vue.set(this.leek.components, index, {id: data.id, template: component.template, quantity: 1})
					this.$store.commit('remove-inventory', { ...component, item_template: component.template, quantity: 1, type: ItemType.COMPONENT })
					this.refreshTotalCharacteristics()
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		moveComponent(component: Component, index: number) {
			if (!this.leek) { return }

			const old = this.leek.components[index]
			const old_index = this.leek.components.indexOf(component)
			Vue.set(this.leek.components, index, component)
			Vue.set(this.leek.components, old_index, old)

			LeekWars.post('leek/move-component', { component_id: component.id, index })
			.error(error => {
				LeekWars.toast(error)
			})
			this.refreshTotalCharacteristics()
		}

		removeComponent(component: Component) {
			if (!this.leek) { return }
			const index = this.leek.components.indexOf(component)
			Vue.set(this.leek.components, index, null)
			this.$store.commit('add-component', component)
			LeekWars.delete('leek/remove-component', {component_id: component.id}).error((error) => LeekWars.toast(error))
			this.refreshTotalCharacteristics()
		}

		componentsDrop(location: string, e: DragEvent, index: number) {
			if (!this.draggedComponent) { return }
			if (location === 'farmer' && this.draggedComponentLocation === 'leek') {
				this.removeComponent(this.draggedComponent)
			} else if (location === 'leek' && this.draggedComponentLocation === 'farmer') {
				this.addComponent(this.draggedComponent, index)
			} else if (location === 'leek' && this.draggedComponentLocation === 'leek') {
				this.moveComponent(this.draggedComponent, index)
			}
			this.draggedComponent = null
			this.enableComponentsTooltips()
			e.preventDefault()
			return false
		}

		enableComponentsTooltips() {
			for (const tooltip of this.$refs.componentTooltips as RichTooltipItem[]) {
				tooltip.disabled = false
			}
		}

		refreshTotalCharacteristics() {
			if (!this.leek) return
			const all = {} as {[key: string]: number}
			for (const charac of LeekWars.characteristics) {
				(this.leek as any)['total_' + charac] = (this.leek as any)[charac]
			}
			if (this.leek) {
				for (let c = 0; c < 8; ++c) {
					const component = this.leek.components[c]
					if (component && c < this.max_components) {
						for (const charac of LeekWars.components[LeekWars.items[component.template].params].stats) {
							(this.leek as any)['total_' + charac[0]] += charac[1]
						}
					}
				}
			}
			return all
		}

		setWeapon(weapon: number) {
			this.skinWeaponDialog = false
			if (!this.leek || !this.my_leek) { return }
			if (this.holdWeaponEnabled) {
				LeekWars.put('leek/set-weapon', {leek_id: this.leek.id, weapon})
				this.leek.weapon = weapon
				store.commit('set-leek-weapon', {leek: this.leek.id, weapon})
			}
		}

		pickTitle(title: number[]) {
			this.leek!.title = title
			this.titleDialog = false
			LeekWars.put('leek/set-title', {leek_id: this.leek!.id, icon: title[0] || 0, noun: title[1] || 0, gender: title[2] || 0, adjective: title[3] || 0})
			this.$store.commit('set-leek-title', {leek: this.leek!.id, title})
		}

		changeShowAiLines() {
			store.commit('toggle-show-ai-lines')
			LeekWars.put('farmer/set-show-ai-lines', {show_ai_lines: store.state.farmer!.show_ai_lines})
		}

		changeMetal() {
			if (this.leek) {
				this.leek.metal = !this.leek.metal
				store.commit('toggle-metal', this.leek.id)
				LeekWars.put('leek/set-metal', {leek_id: this.leek.id, metal: this.leek.metal})
			}
		}

		changeFace(face: number) {
			if (this.leek) {
				this.leek.face = face
				store.commit('set-face', {leek: this.leek.id, face})
				LeekWars.put('leek/set-face', {leek_id: this.leek.id, face})
			}
		}

		loadTournamentRange() {
			if (!this.leek || this.tournamentRange || this.tournamentRangeLoading) { return }
			this.tournamentRangeLoading = true
			LeekWars.get('tournament/range-leek/' + this.leek.level).then(d => this.tournamentRange = d)
		}

		loadBRRange() {
			if (!this.leek || this.brRange || this.brRangeLoading) { return }
			this.brRangeLoading = true
			LeekWars.get('tournament/range-br/' + this.leek.level).then(d => this.brRange = d)
		}

		copyAsTest() {
			if (!this.leek) { return }

			LeekWars.post('test-leek/new', {name: this.leek.name}).then(data => {
				if (!this.leek) { return }
				const newLeek = new Leek({
					id: data.id,
					name: this.leek.name,
					level: this.leek.level,
					weapons: this.leek.weapons.map(w => w.template),
					chips: this.leek.chips.map(c => c.template)
				})
				for (const charac of LeekWars.characteristics) {
					(newLeek as any)[charac] = (this.leek as any)['total_' + charac]
				}
				LeekWars.post('test-leek/update', {id: newLeek.id, data: JSON.stringify(newLeek)})
				.then(_ => this.$router.push('/editor#leek-' + newLeek.id))
				.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		downloadLeekImage() {
			let leekImage = this.$refs.leekImage! as LeekImage
			const canvas = leekImage.drawOnCanvas()
			if (canvas) {
				let png = canvas.toDataURL()
				var link = document.createElement('a')
				link.download = this.leek!.name + ".png"
				link.style.opacity = "0"
				link.href = png
				link.click()
			}
		}
	}
</script>

<style lang="scss" scoped>
	.page {
		display: flex;
		flex-direction: column;
	}
	.leek-image {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
		padding: 10px;
		.title {
			margin-top: 3px;
		}
	}
	.characteristics {
		padding: 15px 0;
		.characteristic {
			width: 50%;
			padding: 3px 30px;
			display: inline-block;
			img {
				margin-right: 7px;
				width: 22px;
				margin-top: 2px;
			}
			span {
				font-size: 17px;
				vertical-align: top;
				display: inline-block;
				margin-top: 3px;
				font-weight: bold;
			}
		}
		.characteristic:nth-child(8n+6),
		.characteristic:nth-child(8n+8) {
			background: var(--background-secondary);
		}
	}
	body.dark .characteristic.frequency img {
		filter: invert(1);
	}
	.tooltip .effect, .tooltip .capital, .tooltip .base-life, .tooltip .added-life {
		font-size: 13px;
	}
	h4.level {
		font-size: 20px;
		.v-icon {
			font-size: 17px;
			margin-bottom: 3px;
		}
	}
	.bar {
		width: 100%;
		height: 12px;
		margin-top: 5px;
		background: var(--pure-white);
		border: 1px solid var(--border);
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
		color: var(--text-color-secondary);
	}
	.fights {
		margin-top: 10px;
		width: 100%;
		border-collapse: collapse;
		text-align: center;
		.big {
			font-size: 21px;
			font-weight: 300;
			color: var(--text-color-secondary);
		}
		.grey {
			color: #999;
		}
		tr > td:nth-child(n+2) {
			border-left: 2px solid var(--border);
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
		::v-deep .ct-line {
			stroke: rgba(95, 173, 27, 0.7);
			stroke-width: 2px;
		}
		::v-deep .ct-point {
			stroke: #5fad1b;
		}
		::v-deep .ct-area {
			fill: rgba(95, 173, 27, 1);
			fill-opacity: 0.2;
		}
		::v-deep .ct-label.ct-horizontal {
			text-align: center;
			display: block;
		}
		::v-deep &:before {
			float: none;
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
	.dragging {
		opacity: 0.2;
	}
	.leek-weapons, .farmer-weapons {
		min-height: 80px;
		display: grid;
		grid-gap: 5px;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		border: 3px solid transparent;
		padding: 5px;
	}
	#app.app .leek-weapons, #app.app .farmer-weapons {
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	}
	.weapon {
		vertical-align: bottom;
		margin: 2px;
	}
	.weapons-popup .weapon {
		cursor: pointer;
		border: 1px solid var(--border);
		vertical-align: bottom;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 3px 0;
	}
	.weapons-popup .weapon[draggable] {
		cursor: move;
	}
	.weapons-popup .weapon img {
		max-width: calc(100% - 20px);
		max-height: 60px;
	}
	.locked {
		opacity: 0.3;
		cursor: default;
	}
	.chips-wrapper {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		.loader {
			margin: 20px;
		}
	}
	.panel .chips {
		text-align: center;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
		grid-gap: 3px;
		margin: 8px;
		flex: 1;
	}
	.chip {
		display: inline-block;
		vertical-align: bottom;
		img {
			width: 100%;
			vertical-align: bottom;
		}
		&.disabled {
			opacity: 0.4;
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
		border: 3px solid transparent;
		padding: 5px;
	}
	.leek-ai-components {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: stretch;
		padding: 5px;
		.center {
			display: flex;
			justify-content: center;
		}
	}
	.component {
		display: inline-block;
		width: 70px;
		height: 60px;
		img, .v-icon {
			width: 60px;
			height: 60px;
			object-fit: scale-down;
			vertical-align: bottom;
			margin: 0px 5px;
		}
		.v-icon {
			color: var(--border);
		}
		&.disabled {
			opacity: 0.4;
		}
	}
	.ai-popup {
		display: flex;
		flex-direction: column;
		.leek-ai-components {
			width: 360px;
			margin-bottom: 30px;
			align-self: center;
			.component {
				border: 3px solid transparent;
				cursor: pointer;
				width: 76px;
				height: 66px;
			}
		}
		.leek-ai {
			text-align: center;
		}
		.flex {
			gap: 20px;
			& > * {
				flex: 1;
			}
		}
		.leek-ai, .farmer-ais {
			min-height: 80px;
			max-height: 400px;
		}
		.ai {
			cursor: pointer;
		}
		.title {
			font-size: 16px;
			font-weight: bold;
			text-transform: uppercase;
			color: var(--text-color-secondary);
			margin-bottom: 10px;
			display: flex;
			align-items: center;
			.v-icon {
				padding-right: 4px;
			}
		}
		.farmer-components {
			border: 3px solid transparent;
			padding: 5px;
			min-height: 160px;
			.component {
				cursor: move;
				img {
					margin: 5px;
				}
			}
		}
	}

	.potions-button {
		margin-top: 12px;
		img {
			height: 22px;
			margin-right: 4px;
			opacity: 0.7;
		}
	}
	body.dark .potions-button img {
		filter: invert(1);
	}
	.farmer-potions {
		.potions-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
			grid-gap: 10px;
			margin-bottom: 15px;
		}
		.potion {
			display: inline-block;
			cursor: pointer;
			position: relative;
			border: 1px solid var(--border);
			padding: 5px 0;
			img {
				width: 100%;
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
	#app.app .farmer-potions .potions-grid {
		grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
	}
	.hat-dialog .hats {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		grid-auto-rows: 1fr;
		grid-gap: 8px;
		.hat {
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			padding: 2px;
			height: 74px;
			border: 1px solid var(--border);
		}
		.hat img {
			max-height: 70px;
			max-width: 96px;
		}
	}
	#app.app .hat-button {
		display: none;
	}
	.registers {
		border: 1px solid var(--border);
		width: 100%;
		.register {
			font-family: monospace;
			div {
				word-break: break-all;
			}
		}
		th {
			background: var(--pure-white);
			font-size: 17px;
			font-weight: bold;
		}
		td {
			background: var(--pure-white);
		}
		td, th {
			vertical-align: top;
			padding: 4px 8px;
			border: 1px solid var(--border);
		}
		.key {
			color: var(--text-color-secondary);
			font-style: italic;
		}
		.value {
			width: 100%;
		}
		.delete {
			padding: 0 20px;
			cursor: pointer;
			color: var(--text-color-secondary);
		}
	}
	.weapons-wrapper {
		padding: 6px 0;
		height: 100%;
		justify-content: center;
		display: flex;
		flex-direction: column;
		.weapon img {
			vertical-align: bottom;
			max-width: 100%;
		}
	}
	.farmer-weapons .weapon, .farmer-chips .chip, .hat-dialog .hat, .farmer-components .component {
		position: relative;
	}
	.farmer-weapons .weapon:not([quantity="1"])::before,
	.farmer-chips .chip:not([quantity="1"])::before,
	.farmer-components .component:not([quantity="1"])::before,
	.hat-dialog .hat:not([quantity="1"])::before {
		position: absolute;
		bottom: -5px;
		right: -5px;
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
	.customize-dialog {
		.customize-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			grid-gap: 10px;
			margin-top: 20px;
			.item {
				text-align: center;
				padding: 6px;
				cursor: pointer;
				.image {
					height: 70px;
					max-width: 100%;
					object-fit: contain;
					margin: 6px 0;
				}
				.title {
					text-align: left;
					color: #777;
					display: flex;
					text-align: center;
					img {
						width: 20px;
						margin-right: 4px;
					}
				}
				.name {
					.v-icon {
						font-size: 20px;
						vertical-align: bottom;
					}
				}
				.large-icon {
					font-size: 50px;
					color: #777;
					display: block;
					.v-icon {
						font-size: 50px;
					}
				}
				&.disabled {
					background: transparent;
					pointer-events: none;
					.image {
						opacity: 0.5;
					}
					.name {
						color: #555;
						.v-icon {
							color: #999;
						}
					}
				}
			}
		}
		.pomp {
			margin-bottom: 8px;
			img {
				width: 20px;
				margin-left: 4px;
			}
		}
		.v-radio.v-radio--is-disabled {
			opacity: 0.7;
			pointer-events: auto;
		}
	}
	.rename-button {
		b {
			padding-right: 4px;
		}
		img {
			width: 20px;
		}
	}
	.empty {
		color: #999;
	}
	.explorer {
		height: 460px;
	}
	.weapon-count, .chip-count, .register-count {
		padding-left: 5px;
	}
	.info {
		margin: 8px 0;
		color: #777;
	}
	.buy-hint {
		margin-top: 15px;
		a {
			color: #4caf50;
			font-weight: 500;
		}
	}
	.components-grid {
		display: grid;
		justify-content: center;
		text-align: center;
		gap: 4px;
		grid-template:
			". a b ."
			"c i i d"
			"e i i f"
			". g h .";
		:nth-child(1) { grid-area: a }
		:nth-child(2) { grid-area: b }
		:nth-child(3) { grid-area: c }
		:nth-child(4) { grid-area: d }
		:nth-child(5) { grid-area: e }
		:nth-child(6) { grid-area: f }
		:nth-child(7) { grid-area: g }
		:nth-child(8) { grid-area: h }
		:nth-child(9) {	grid-area: i }
	}
	.dashed {
		border: 3px dashed var(--text-color-secondary) !important;
	}
</style>
