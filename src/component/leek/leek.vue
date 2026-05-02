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
					<v-tooltip v-if="$store.state.farmer.tournaments_enabled && leek.tournament" content-class="fluid" @update:model-value="loadTournamentRange">
						<template #activator="{ props }">
							<div class="tab" @click="registerTournament" v-bind="props">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="!leek.tournament.registered" class="register">{{ $t('register_to_tournament') }}</span>
								<span v-else class="unregister">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
						<i18n-t v-if="tournamentRange" tag="div" keypath="main.level_x_to_y">
							<template #min>
								<b>{{ tournamentRange.min }}</b>
							</template>
							<template #max>
								<b>{{ tournamentRange.max }}</b>
							</template>
						</i18n-t>
					</v-tooltip>
					<v-tooltip>
						<template #activator="{ props }">
							<div class="tab" @click="updateGarden" v-bind="props">
								<span>{{ $t('garden') }}</span>
								<v-switch :model-value="leek.in_garden" hide-details />
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
					<i18n-t keypath="farmed_by" tag="span">
						<template #farmer>
							<router-link :to="'/farmer/' + (leek ? leek.farmer.id : 0)">
								<rich-tooltip-farmer :id="(leek ? leek.farmer.id : 0)" :bottom="true">
									{{ leek ? leek.farmer.name : '...' }}
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
					<template #activator="{ props }">
						<v-icon v-bind="props">mdi-lock</v-icon>
					</template>
					{{ $t('main.xp_blocked') }}
				</v-tooltip></h4>

				<v-tooltip>
					<template #activator="{ props }">
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
					<talent :id="leek ? leek.id : 0" :talent="leek ? leek.talent : '...'" :max_talent="leek?.max_talent" :label="$t('talent')" category="leek" />
					<v-tooltip v-if="leek">
						<template #activator="{ props }">
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
					<template #activator="{ props }">
						<table class="fights" v-bind="props">
							<tr>
								<td class="big">{{ $filters.number(leek ? leek.victories : '...') }}</td>
								<td class="big">{{ $filters.number(leek ? leek.draws : '...') }}</td>
								<td class="big">{{ $filters.number(leek ? leek.defeats : '...') }}</td>
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
					<Line v-if="chartData" :data="chartData" :options="chartOptions" ratio="ct-major-eleventh" class="talent-history" />
				</template>
			</panel>

			<panel :title="$t('characteristic.characteristics')">
				<template v-if="leek && my_leek && $store.state.farmer.equipment_enabled" #actions>
					<div class="button flat" @click="showLoadout = true">
						<v-icon>mdi-package-variant-closed</v-icon>
					</div>
					<div v-if="leek.capital == 0" class="button flat" @click="capitalDialog = true">
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
									<i18n-t v-if="LeekWars.didactitial_step === 1" tag="div" class="bubble" keypath="main.dida_2">
										<template #life><img height=18 src="/image/charac/life.png"></template>
										<template #strength><img height=18 src="/image/charac/strength.png"></template>
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
				<template #content>
					<div class="weapons-wrapper center">
						<loader v-if="!leek" />
						<div v-else-if="leek.weapons.length === 0" class="empty">{{ $t('no_weapons') }}</div>
						<template v-else>
							<div class="weapon" v-for="weapon in orderedWeapons" :key="weapon.id">
								<rich-tooltip-item  v-slot="{ props }" :item="LeekWars.items[weapon.template]" :bottom="true" :leek="leek">
									<img v-bind="props" :src="'/image/' + LeekWars.items[weapon.template].name.replace('_', '/') + '.png'" @click="setWeapon(weapon.template)" :width="WeaponsData[LeekWars.items[weapon.template].params].width">
								</rich-tooltip-item>
							</div>
						</template>
					</div>
				</template>
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
				<template #content>
					<div class="leek-ai-components">
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
									<router-link v-if="my_leek" :to="'/editor/' + (leek.ai.path || leek.ai.name)">
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
				</template>
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
				<template #content>
					<fights-history :fights="leek.fights" />
				</template>
			</panel>
			<panel v-if="leek && leek.tournaments && leek.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<template #content>
					<tournaments-history :tournaments="leek.tournaments" />
				</template>
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
					<div class="tab" @click="showReport = true">
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
				<v-tooltip v-if="leek && my_leek && leek.level >= 20 && $store.state.farmer?.br_enabled">
					<template #activator="{ props }">
						<div class="tab" @click="registerAutoArena" v-bind="props">
							<v-icon>mdi-trophy</v-icon>
							<span v-if="!leek.auto_br" class="register">{{ $t('register_to_arena') }}</span>
							<span v-else class="unregister">{{ $t('unregister') }}</span>
						</div>
					</template>
					{{ $t('arena_time') }}
				</v-tooltip>
				<template v-if="leek && leek.level > 1 && $store.state.connected">
					<v-tooltip>
						<template #activator="{ props }">
							<div class="tab" @click="copyAsTest()" v-bind="props" icon="play_arrow">
								<v-icon class="list-icon">mdi-content-copy</v-icon><span>{{ $t('test') }}</span>
							</div>
						</template>
						{{ $t('copy_as_test', [leek.name]) }}
					</v-tooltip>
				</template>
				<v-tooltip v-if="leek && my_leek && (!$store.state.farmer.group || $store.state.farmer.group.supervisor === $store.state.farmer.id)">
					<template #activator="{ props }">
						<div class="tab" @click="updateXpBlocked" v-bind="props">
							<span>{{ $t('main.xp_blocked') }}</span>
							<v-switch :model-value="leek.xp_blocked" hide-details />
						</div>
					</template>
					{{ $t('xp_blocked_desc') }}
				</v-tooltip>
			</div>
		</div>

		<popup v-if="leek" v-model="weaponsDialog" :width="800">
			<template #icon>
				<img src="/image/icon/garden.png">
			</template>
			<template #title>
				{{ $t('weapons_of', [leek.name]) }}
				<span class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span>
			</template>
			<template v-if="my_leek && $store.state.farmer.equipment_enabled" #options>
				<div class="option" @click="weaponsDialog = false; showLoadout = true">
					<v-icon>mdi-package-variant-closed</v-icon>
				</div>
				<div class="option" @click="weaponsDialog = false">
					<v-icon>mdi-close</v-icon>
				</div>
			</template>
			<div class="weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<rich-tooltip-item v-for="(weapon, i) in orderedWeapons" :key="i" :item="LeekWars.items[weapon.template]" :bottom="true" :nodge="true" :leek="leek">
						<div :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
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
					<template #hab><span><b>{{ $filters.number($store.state.farmer.habs) }}</b> <span class="hab"></span></span></template>
					<template #market>
						<router-link to="/market">{{ $t('main.market') }}</router-link>
					</template>
				</i18n-t>
			</div>
		</popup>

		<popup v-if="leek" v-model="renameDialog" :width="600">
			<template #icon><v-icon>mdi-pencil-outline</v-icon></template>
			<template #title>{{ $t('rename_leek') }}</template>
			{{ $t('rename_description') }}
			<br>
			<br>
			{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
			<br>
			<br>
			<div class="center">
				<v-btn class="rename-button" @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ $filters.number(rename_price_habs) }}</b><img src="/image/hab.png"></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ $filters.number(rename_price_crystals) }}</b><span class="crystal"></span></v-btn>
			</div>
		</popup>

		<v-snackbar v-model="renameSuccess" :timeout="2000" color="success">{{ $t('rename_done') }}</v-snackbar>
		<v-snackbar v-if="renameError" v-model="renameFailed" :timeout="5000" color="error">{{ $t(renameError.error, renameError.error_params) }}</v-snackbar>

		<popup v-if="leek && my_leek" v-model="potionDialog" :width="750">
			<template #icon>
				<img src="/image/icon/potion.png">
			</template>
			<template #title>
				{{ $t("use_a_potion", [leek.name]) }}
			</template>
			<div class="farmer-potions">
				<div class="potions-grid">
					<v-tooltip v-for="(potion, id) in $store.state.farmer.potions" :key="id">
						<template #activator="{ props }">
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
			<template #icon>
				<img src="/image/icon/potion.png">
			</template>
			<template #title>
				{{ $t("select_skin") }}
			</template>
			<div class="farmer-potions">
				<div class="potions-grid">
					<v-tooltip v-for="(potion, id) in skinPotions" :key="id">
						<template #activator="{ props }">
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

		<report-dialog v-if="leek" v-model="showReport" :name="leek.farmer.name" :target="leek.farmer" :leek="leek" :reasons="reasons" :parameter="leek.id" />

		<popup v-model="hatDialog" :width="750">
			<template #icon><v-icon>mdi-hat-fedora</v-icon></template>
			<template #title><span>{{ $t('select_a_hat') }}</span></template>
			<div class="hat-dialog">
				<div class="hats">
					<v-tooltip>
						<template #activator="{ props }">
							<div v-ripple :quantity="1" class="hat" @click="selectHat(null)" v-bind="props">
								<img src="/image/hat/no_hat.png">
							</div>
						</template>
						<b>{{ $t('no_hat') }}</b>
					</v-tooltip>
					<v-tooltip v-for="hat in farmer_hats" :key="hat.id">
						<template #activator="{ props }">
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
			<template #icon><img src="/image/icon/garden.png"></template>
			<template #title><span>{{ $t('select_a_weapon') }}</span></template>
			<div v-if="leek" class="weapons-popup">
				<div class="leek-weapons">
					<v-tooltip>
						<template #activator="{ props }">
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

		<popup v-model="customizeDialog" :width="700" icon="mdi-auto-fix" :title="$t('customize')">
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
								<template #activator="{ props }">
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
								<template #activator="{ props }">
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
							<v-switch :model-value="$store.state.farmer.show_ai_lines" hide-details :disabled="!showAiLinesEnabled" @change="changeShowAiLines">
								<template #label>
									<span>{{ $t('pomp.ai_lines') }}</span>
									<v-tooltip :disabled="showAiLinesEnabled">
										<template #activator="{ props }">
											<img v-bind="props" src="/image/pomp/ai_lines.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.ai_lines') }}
									</v-tooltip>
								</template>
							</v-switch>
						</div>
						<div v-if="leek" class="pomp">
							<v-switch :model-value="leek.metal" hide-details :disabled="!metalEnabled" @change="changeMetal">
								<template #label>
									<span>{{ $t('pomp.metal') }}</span>
									<v-tooltip :disabled="metalEnabled">
										<template #activator="{ props }">
											<img v-bind="props" src="/image/pomp/metal.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.metal') }}
									</v-tooltip>
								</template>
							</v-switch>
						</div>
					</div>
					<div v-if="leek" class="pomp column6">
						<v-radio-group v-model="leek.face" @update:model-value="changeFace" hide-details>
							<v-radio :value="0">
								<template #label>
          							{{ $t('neutral') }}
								</template>
							</v-radio>
							<v-radio :value="1" :disabled="!happyEnabled">
								<template #label>
          							{{ $t('happy') }}
									<v-tooltip :disabled="happyEnabled">
										<template #activator="{ props }">
											<img v-bind="props" src="/image/pomp/happy.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.happy') }}
									</v-tooltip>
								</template>
							</v-radio>
							<v-radio :value="2" :disabled="!angryEnabled">
								<template #label>
									{{ $t('angry') }}
									<v-tooltip :disabled="angryEnabled">
										<template #activator="{ props }">
											<img v-bind="props" src="/image/pomp/angry.png">
										</template>
										<v-icon>mdi-lock</v-icon> {{ $t('pomp.angry') }}
									</v-tooltip>
								</template>
							</v-radio>
						</v-radio-group>
					</div>
				</div>
				<v-btn size="small" @click="downloadLeekImage">{{ $t('download_leek_image') }}</v-btn>
			</div>
		</popup>

		<popup v-if="leek" v-model="titleDialog" :width="600">
			<template #icon><v-icon>mdi-medal-outline</v-icon></template>
			<template #title><span>{{ $t('main.select_title') }}</span></template>
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
			<template #icon>
				<v-icon>mdi-code-braces</v-icon>
			</template>
			<template #title>
				{{ $t('ai_of', [leek.name]) }}
			</template>
			<template v-if="$store.state.farmer.equipment_enabled" #options>
				<div class="option" @click="aiDialog = false; showLoadout = true">
					<v-icon>mdi-package-variant-closed</v-icon>
				</div>
				<div class="option" @click="aiDialog = false">
					<v-icon>mdi-close</v-icon>
				</div>
			</template>
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
					<div :class="{dashed: draggedAI && (!leek.ai || draggedAI.path !== leek.ai.path)}" class="leek-ai" @dragover="dragOver" @drop="aiDrop('leek', $event)">
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
								<v-btn prepend-icon="mdi-treasure-chest">{{ $t('main.inventory') }}</v-btn>
							</router-link>
						</div>
					</div>
				</div>
			</div>
		</popup>

		<popup v-if="leek && my_leek" v-model="chipsDialog" :width="816" icon="mdi-chip">
			<template #title>{{ $t('chips_of', [leek.name]) }} <span class="chip-count">[{{ leek.chips.length }}/{{ leek.total_ram }}]</span></template>
			<template v-if="$store.state.farmer.equipment_enabled" #options>
				<div class="option" @click="chipsDialog = false; showLoadout = true">
					<v-icon>mdi-package-variant-closed</v-icon>
				</div>
				<div class="option" @click="chipsDialog = false">
					<v-icon>mdi-close</v-icon>
				</div>
			</template>
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
					<template #hab><span><b>{{ $filters.number($store.state.farmer.habs) }}</b> <span class="hab"></span></span></template>
					<template #market><router-link to="/market">{{ $t('main.market') }}</router-link></template>
				</i18n-t>
			</div>
		</popup>

		<capital-dialog v-if="leek && my_leek" v-model="capitalDialog" :leek="leek" :total-capital="leek.capital" />
		<loadout-dialog v-if="leek && my_leek" v-model="showLoadout" :leek="leek" @applied="refreshTotalCharacteristics" />
	</div>
</template>

<script setup lang="ts">
	import { locale } from '@/locale'
	import { AI } from '@/model/ai'
	import { Chip } from '@/model/chip'
	import { Hat } from '@/model/hat'
	import { mixins } from '@/model/i18n'
	import { ItemType } from '@/model/item'
	import { Leek, Register } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Potion, PotionEffect } from '@/model/potion'
	import { store } from '@/model/store'
	import { Weapon, WeaponsData } from '@/model/weapon'
	import CharacteristicTooltip from './characteristic-tooltip.vue'
	import { fileSystem } from '@/model/filesystem'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import TitlePicker from '@/component/title/title-picker.vue'
	import AIElement from '@/component/app/ai.vue'
	import LwTitle from '@/component/title/title.vue'
	import { COMPONENTS } from '@/model/components'
	import { CHIPS } from '@/model/chips'
	import { ORDERED_CHIPS } from '@/model/sorted_chips'
	import LeekImage from '../leek-image.vue'
	import LeekComponent from './leek-component.vue'
	import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'

	const CapitalDialog = defineAsyncComponent(() => import('./capital-dialog.vue'))
	const LoadoutDialog = defineAsyncComponent(() => import('./loadout-dialog.vue'))
	const ReportDialog = defineAsyncComponent(() => import('@/component/moderation/report-dialog.vue'))
	const FightsHistory = defineAsyncComponent(() => import('@/component/history/fights-history.vue'))
	const TournamentsHistory = defineAsyncComponent(() => import('@/component/history/tournaments-history.vue'))
	const LevelDialog = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/leek/level-dialog.${locale}.i18n`))
	const Explorer = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/explorer/explorer.${locale}.i18n`))

	defineOptions({ name: 'leek', i18n: {}, mixins: [...mixins], components: {
		CharacteristicTooltip, RichTooltipItem, RichTooltipFarmer, RichTooltipLeek, TitlePicker, ai: AIElement, 'lw-title': LwTitle, LeekComponent, Line,
	} })

	const { t } = useI18n()
	const route = useRoute()
	const router = useRouter()
	const componentTooltipsRef = useTemplateRef<any[]>('componentTooltips')
	const leekImageRef = useTemplateRef<any>('leekImage')

	const leek = ref<Leek | null>(null)
	const error = ref(false)
	const weaponsDialog = ref(false)
	const draggedWeapon = ref<Weapon | null>(null)
	const draggedWeaponLocation = ref<string | null>(null)
	const renameDialog = ref(false)
	const rename_price_habs = 10000000
	const rename_price_crystals = 200
	const renameName = ref('')
	const renameSuccess = ref(false)
	const renameFailed = ref(false)
	const renameError = ref<any>(null)
	const potionDialog = ref(false)
	const hatDialog = ref(false)
	const chartData = ref<ChartData | null>(null)
	const chartOptions = ref<ChartOptions | null>(null)
	const showReport = ref(false)
	const reasons = [Warning.INCORRECT_LEEK_NAME, Warning.INCORRECT_AI_NAME]
	const levelPopup = ref(false)
	const levelPopupData = ref<any>(null)
	const aiDialog = ref(false)
	const draggedAI = ref<AI | null>(null)
	const chipsDialog = ref(false)
	const draggedChip = ref<Chip | null>(null)
	const draggedChipLocation = ref<string | null>(null)
	const draggedComponent = ref<any>(null)
	const draggedComponentLocation = ref<string | null>(null)
	const capitalDialog = ref(false)
	const showLoadout = ref(false)
	const customizeDialog = ref(false)
	const skinWeaponDialog = ref(false)
	const titleDialog = ref(false)
	const skinPotionDialog = ref(false)
	const tournamentRangeLoading = ref(false)
	const tournamentRange = ref<any>(null)
	let request: any = null
	const MAX_COMPONENTS = 8
	type DragArea = 'farmer' | 'leek'

	const id = computed<number>(() => parseInt(route.params.id as string, 10) || (store.state.farmer ? LeekWars.first(store.state.farmer.leeks)!.id : 0))

	const my_leek = computed(() => {
		if (!route.params.id) return true
		if (store.state.farmer) {
			for (const k in store.state.farmer.leeks) {
				if (parseInt(k, 10) === id.value) return true
			}
		}
		return false
	})

	const xp_bar_width = computed(() => {
		if (!leek.value) return 0
		return leek.value.level === 301 ? 100 : Math.min(100, Math.floor(100 * (leek.value.xp - leek.value.down_xp) / (leek.value.up_xp - leek.value.down_xp)))
	})

	const blue_xp_bar = computed(() => leek.value ? leek.value.level === 301 : false)

	const farmer_weapons = computed(() => {
		if (store.state.farmer) {
			return store.state.farmer.weapons.sort((a, b) => LeekWars.items[a.template].level - LeekWars.items[b.template].level)
		}
		return []
	})

	const farmer_chips = computed(() => {
		if (store.state.farmer) {
			return store.state.farmer.chips.sort((a, b) => ORDERED_CHIPS[a.template] - ORDERED_CHIPS[b.template])
		}
		return []
	})

	const orderedChips = computed(() => {
		if (!leek.value) return []
		return [...leek.value.chips].sort((a, b) => ORDERED_CHIPS[a.template] - ORDERED_CHIPS[b.template])
	})

	const orderedWeapons = computed(() => {
		if (!leek.value) return []
		return [...leek.value.weapons].sort((a, b) => LeekWars.items[a.template].level - LeekWars.items[b.template].level)
	})

	const farmer_hats = computed(() => store.state.farmer ? store.state.farmer.hats : [])
	const farmer_components = computed(() => store.state.farmer ? store.state.farmer.components : [])

	const hasForgottenWeapon = computed(() => {
		if (!leek.value) return false
		for (const w of leek.value.weapons) {
			if (LeekWars.weapons[LeekWars.items[w.template].params].forgotten) return true
		}
		return false
	})

	const holdWeaponEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 123) !== null)
	const leekTitleEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 125) !== null)
	const showAiLinesEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 124) !== null)
	const metalEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 242) !== null)
	const skinPotions = computed(() => store.state.farmer!.potions.filter(p => LeekWars.potions[p.template].effects.some((e: PotionEffect) => e.type === PotionEffect.CHANGE_SKIN)))
	const angryEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 240) !== null)
	const happyEnabled = computed(() => store.state.farmer && LeekWars.selectWhere(store.state.farmer.pomps, 'template', 241) !== null)

	const max_components = computed(() => {
		let n = 8
		if (leek.value) {
			for (const c of leek.value.components) {
				if (c) {
					if (c.template === 406 || c.template === 407) n -= 2
				}
			}
		}
		return n
	})

	const remaining_xp = computed(() => leek.value ? leek.value.up_xp - leek.value.xp : 0)

	const leek_components = computed(() => leek.value ? leek.value.components.reduce((s, c) => s + (c ? 1 : 0), 0) : 0)

	const onUpdateLeekTalent = (message: any) => {
		if (leek.value && message.leek === leek.value.id) {
			leek.value.talent += message.talent
		}
	}
	const onUpdateLeekXp = (message: any) => {
		if (leek.value && message.leek === leek.value.id) {
			leek.value.xp += message.xp
		}
	}

	onMounted(() => {
		emitter.on('update-leek-talent', onUpdateLeekTalent)
		emitter.on('update-leek-xp', onUpdateLeekXp)
	})

	watch(id, () => update(), { immediate: true })

	function update() {
		leek.value = null
		tournamentRange.value = null
		tournamentRangeLoading.value = false
		error.value = false
		if (!id.value) return
		const method = my_leek.value ? 'leek/get-private/' + id.value : 'leek/get/' + id.value
		request = LeekWars.get<Leek>(method)
		request.then((l: Leek) => {
			leek.value = new Leek(l)
			if (leek.value) {
				LeekWars.setTitle(leek.value.name, t('main.level_n', [leek.value.level]))
				if (my_leek.value) {
					LeekWars.setActions([
						{icon: 'mdi-auto-fix', click: () => customize()},
						{image: 'icon/potion.png', click: () => potion()},
					])
				} else {
					LeekWars.setActions([
						{image: 'icon/garden.png', click: () => router.push('/garden/challenge/leek/' + id.value)}
					])
				}
				renameName.value = leek.value.name
				chart()
				if (leek.value.level_seen < leek.value.level) {
					showLevelPopup()
				}
				for (const path in fileSystem.ais) {
					const ai = fileSystem.ais[path]
					if (ai.dragging) ai.dragging = false
				}
				if (my_leek.value) {
					store.commit('update-capital', {leek: leek.value.id, capital: leek.value.capital})
				}
				emitter.emit('loaded')
			}
		}).error(() => {
			error.value = true
		})
	}

	onBeforeUnmount(() => {
		emitter.off('update-leek-talent', onUpdateLeekTalent)
		emitter.off('update-leek-xp', onUpdateLeekXp)
		if (request) request.abort()
	})

	function rename(currency: string) {
		if (!leek.value) return
		const method = currency === 'habs' ? 'leek/rename-habs' : 'leek/rename-crystals'
		LeekWars.post(method, {leek_id: leek.value.id, new_name: renameName.value}).then(() => {
			if (leek.value) {
				leek.value.name = renameName.value
				store.commit('rename-leek', {leek: leek.value.id, name: renameName.value})
				if (currency === 'habs') {
					store.commit('update-habs', -rename_price_habs)
				} else {
					store.commit('update-crystals', -rename_price_crystals)
				}
				renameDialog.value = false
				renameSuccess.value = true
			}
		}).error(err => {
			renameFailed.value = true
			renameError.value = err
		})
	}

	function usePotion(p: Potion) {
		const template = LeekWars.potions[p.template]
		if (leek.value) {
			let up = false
			for (const effect of template.effects) {
				if (effect.type === PotionEffect.RESTAT) {
					up = true
				} else if (effect.type === PotionEffect.CHANGE_SKIN) {
					const skin = effect.params[0]
					leek.value.skin = skin
					store.commit('change-skin', {leek: leek.value.id, skin})
				}
			}
			potionDialog.value = false
			skinPotionDialog.value = false
			LeekWars.post('leek/use-potion', {leek_id: leek.value.id, potion_id: p.id}).then(() => {
				if (template.consumable && template.id !== 176) {
					store.commit('remove-inventory', {type: ItemType.POTION, item_template: p.template})
				}
				if (up) update()
			})
		}
	}

	function registerTournament() {
		if (leek.value) {
			if (leek.value.tournament.registered) {
				leek.value.tournament.registered = false
				LeekWars.post('leek/unregister-tournament', {leek_id: leek.value.id})
			} else {
				leek.value.tournament.registered = true
				LeekWars.post('leek/register-tournament', {leek_id: leek.value.id})
			}
		}
	}

	function registerAutoArena() {
		if (leek.value) {
			if (leek.value.auto_br) {
				leek.value.auto_br = false
				LeekWars.post('leek/unregister-auto-br', {leek_id: leek.value.id})
			} else {
				leek.value.auto_br = true
				LeekWars.post('leek/register-auto-br', {leek_id: leek.value.id})
			}
		}
	}

	function updateGarden() {
		if (leek.value) {
			leek.value.in_garden = !leek.value.in_garden
			LeekWars.post('leek/set-in-garden', {leek_id: leek.value.id, in_garden: leek.value.in_garden})
		}
	}

	function updateXpBlocked() {
		if (leek.value) {
			leek.value.xp_blocked = !leek.value.xp_blocked
			LeekWars.put('leek/set-xp-blocked', {leek_id: leek.value.id, xp_blocked: leek.value.xp_blocked})
		}
	}

	function chart() {
		if (!leek.value || leek.value.level < 100) return
		const labels = []
		const time = LeekWars.time
		for (let i = 1; i <= 7; ++i) {
			labels.push(LeekWars.formatDayMonthShort(time - i * 24 * 3600))
		}
		chartData.value = {
			labels: labels.reverse(),
			datasets: [{
				tension: 0.2,
				data: leek.value.talent_history,
				borderColor: '#5fad1b',
				pointBackgroundColor: '#5fad1b',
				borderWidth: 2,
				fill: { target: 'origin', above: '#5fad1b30' },
			}]
		} as any
		chartOptions.value = {
			aspectRatio: 2.5,
			plugins: { legend: { display: false } },
			elements: { point: { radius: 4, hoverRadius: 6 } },
		}
	}

	function hat() { hatDialog.value = true }

	function selectHat(h: Hat) {
		if (!leek.value) return
		hatDialog.value = false
		if (h === null) {
			leek.value.hat = null
			LeekWars.delete('leek/remove-hat', {leek_id: leek.value.id}).then(() => {
				if (leek.value) {
					store.commit('change-hat', {leek: leek.value.id, hat: null})
				}
			}).error(err => LeekWars.toast(err))
		} else {
			if (leek.value.hat && leek.value.hat.template === h.template) {
				hatDialog.value = false
				return
			}
			leek.value.hat = h
			LeekWars.post('leek/set-hat', {leek_id: leek.value.id, hat_id: h.template}).then(() => {
				if (leek.value) {
					store.commit('change-hat', { leek: leek.value.id, hat: h })
				}
			}).error(err => LeekWars.toast(err))
		}
	}

	function potion() { potionDialog.value = true }
	function customize() { customizeDialog.value = true }

	function showLevelPopup() {
		if (!leek.value) return
		LeekWars.get('leek/get-level-popup/' + leek.value.id).then(data => {
			levelPopupData.value = data.popup
			nextTick(() => levelPopup.value = true)
		})
	}

	function removeAI() {
		if (!leek.value) return
		leek.value.ai = null
		LeekWars.delete('leek/remove-ai', {leek_id: leek.value.id})
	}

	function selectAI(ai: AI) {
		if (!leek.value) return
		leek.value.ai = ai
		LeekWars.post('leek/set-ai', {leek_id: leek.value.id, ai_path: ai.path})
	}

	function aiDragStart(ai: AI, e: DragEvent) {
		e.dataTransfer!.setData('text/plain', 'drag !!!')
		draggedAI.value = ai
		ai.dragging = true
		return true
	}

	function aiDragEnd(ai: AI, e: DragEvent) {
		if (ai) ai.dragging = false
		draggedAI.value = null
		e.preventDefault()
		return false
	}

	function aiDrop(area: string, e: DragEvent) {
		if (!draggedAI.value || !leek.value) return
		if (leek.value.ai && draggedAI.value.path === leek.value.ai.path && area === 'farmer') {
			removeAI()
		} else if (area === 'leek') {
			selectAI(draggedAI.value)
		}
		draggedAI.value = null
		e.preventDefault()
		return false
	}

	function dragOver(e: DragEvent) { e.preventDefault() }

	function registerFocusout(reg: Register, e: Event) {
		if (!leek.value) return
		const value = (e.target as HTMLElement).textContent || ''
		if (reg.value !== value) {
			reg.value = value
			LeekWars.post('leek/set-register', {leek_id: leek.value.id, key: reg.key, value}).then(() => {
				LeekWars.toast(t('register_saved'))
			})
		}
	}

	function registerDelete(reg: Register) {
		if (!leek.value) return
		leek.value.registers.splice(leek.value.registers.indexOf(reg), 1)
		LeekWars.delete('leek/delete-register', {leek_id: leek.value.id, key: reg.key}).then(() => {
			LeekWars.toast(t('register_deleted'))
		})
	}

	function weaponDragStart(location: DragArea, w: Weapon, _e: DragEvent) {
		if (leek.value && LeekWars.items[w.template].level > leek.value.level) return
		const forgotten = LeekWars.weapons[LeekWars.items[w.template].params].forgotten
		if (location === 'farmer' && hasForgottenWeapon.value && forgotten) return
		draggedWeapon.value = w
		draggedWeaponLocation.value = location
	}

	function weaponDragEnd(_w: Weapon) { draggedWeapon.value = null }

	function addWeapon(w: Weapon) {
		if (!leek.value) return
		const template = LeekWars.items[w.template]
		if (leek.value.weapons.length >= leek.value.max_weapons) {
			return LeekWars.toast(t('error_max_weapon', [leek.value.name]))
		}
		if (template.level > leek.value.level) {
			return LeekWars.toast(t('error_under_required_level_weapon', [leek.value.name]))
		}
		if (leek.value.weapons.some(x => x.template === template.id)) {
			return LeekWars.toast(t('error_weapon_already_equipped', [leek.value.name]))
		}
		if (hasForgottenWeapon.value && LeekWars.weapons[LeekWars.items[w.template].params].forgotten) {
			return LeekWars.toast(t('error_weapon_two_forgotten', [leek.value.name]))
		}
		LeekWars.post('leek/add-weapon', {leek_id: leek.value.id, weapon_id: w.id}).then(data => {
			if (leek.value) {
				leek.value.weapons.push({id: data.id, template: w.template, quantity: 1} as any)
				store.commit('remove-weapon', w)
			}
		}).error(err => LeekWars.toast(err))
	}

	function removeWeapon(w: Weapon) {
		if (!leek.value) return
		leek.value.weapons.splice(leek.value.weapons.indexOf(w), 1)
		store.commit('add-weapon', w)
		LeekWars.delete('leek/remove-weapon', {weapon_id: w.id}).error(err => LeekWars.toast(err))
	}

	function weaponsDrop(location: DragArea, e: DragEvent) {
		if (!draggedWeapon.value) return
		if (location === 'farmer' && draggedWeaponLocation.value === 'leek') {
			removeWeapon(draggedWeapon.value)
		} else if (location === 'leek' && draggedWeaponLocation.value === 'farmer') {
			addWeapon(draggedWeapon.value)
		}
		draggedWeapon.value = null
		e.preventDefault()
		return false
	}

	function chipDragStart(location: DragArea, c: Chip, _e: DragEvent) {
		if (leek.value && CHIPS[c.template].level > leek.value.level) return
		draggedChip.value = c
		draggedChipLocation.value = location
	}

	function chipDragEnd(_c: Chip) { draggedChip.value = null }

	function addChip(c: Chip) {
		if (!leek.value) return
		const template = CHIPS[c.template]
		if (leek.value.chips.length >= leek.value.total_ram) {
			return LeekWars.toast(t('error_max_chip', [leek.value.name]))
		}
		if (template.level > leek.value.level) {
			return LeekWars.toast(t('error_under_required_level_chip', [leek.value.name]))
		}
		if (leek.value.chips.some(x => x.template === template.id)) {
			return LeekWars.toast(t('error_chip_already_equipped', [leek.value.name]))
		}
		LeekWars.post('leek/add-chip', {leek_id: leek.value.id, chip_id: c.id}).then(data => {
			if (leek.value) {
				leek.value.chips.push({id: data.id, template: c.template, quantity: 1} as any)
				store.commit('remove-chip', c)
			}
		}).error(err => LeekWars.toast(err))
	}

	function removeChip(c: Chip) {
		if (!leek.value) return
		leek.value.chips.splice(leek.value.chips.indexOf(c), 1)
		store.commit('add-chip', c)
		LeekWars.delete('leek/remove-chip', {chip_id: c.id}).error(err => LeekWars.toast(err))
	}

	function chipsDrop(location: DragArea, e: DragEvent) {
		if (!draggedChip.value) return
		if (location === 'farmer' && draggedChipLocation.value === 'leek') {
			removeChip(draggedChip.value)
		} else if (location === 'leek' && draggedChipLocation.value === 'farmer') {
			addChip(draggedChip.value)
		}
		draggedChip.value = null
		e.preventDefault()
		return false
	}

	function componentDragStart(location: DragArea, c: any, _e: DragEvent) {
		if (leek.value && LeekWars.items[c.template].level > leek.value.level) return
		draggedComponent.value = c
		draggedComponentLocation.value = location
		const tooltips = componentTooltipsRef.value
		if (tooltips) {
			for (const tooltip of tooltips) {
				tooltip.value = false
				tooltip.disabled = true
			}
		}
	}

	function componentDragEnd(_c: any) {
		draggedComponent.value = null
		enableComponentsTooltips()
	}

	function addComponent(c: any, index: number = -1) {
		if (!leek.value) return
		const template = LeekWars.items[c.template]
		if (template.level > leek.value.level) {
			return LeekWars.toast(t('error_under_required_level_component', [leek.value.name]))
		}
		if (leek.value.components.some(x => x && x.template === template.id)) {
			return LeekWars.toast(t('error_component_already_equipped', [leek.value.name]))
		}
		if (index === -1) {
			for (let i = 0; i < 8; i++) { if (leek.value.components[i] === null) { index = i; break } }
		}
		if (index === -1) {
			return LeekWars.toast(t('error_max_component', [leek.value.name]))
		}

		LeekWars.post('leek/add-component', { leek_id: leek.value.id, component_id: c.id, index }).then(data => {
			if (leek.value) {
				const old = leek.value.components[index]
				if (old) store.commit('add-component', old)
				leek.value.components[index] = {id: data.id, template: c.template, quantity: 1} as any
				store.commit('remove-inventory', { ...c, item_template: c.template, quantity: 1, type: ItemType.COMPONENT })
				refreshTotalCharacteristics()
			}
		}).error(err => LeekWars.toast(err))
	}

	function moveComponent(c: any, index: number) {
		if (!leek.value) return
		const old = leek.value.components[index]
		const old_index = leek.value.components.indexOf(c)
		leek.value.components[index] = c
		leek.value.components[old_index] = old
		LeekWars.post('leek/move-component', { component_id: c.id, index }).error(err => LeekWars.toast(err))
		refreshTotalCharacteristics()
	}

	function removeComponent(c: any) {
		if (!leek.value) return
		const index = leek.value.components.indexOf(c)
		leek.value.components[index] = null as any
		store.commit('add-component', c)
		LeekWars.delete('leek/remove-component', {component_id: c.id}).error(err => LeekWars.toast(err))
		refreshTotalCharacteristics()
	}

	function componentsDrop(location: DragArea, e: DragEvent, index: number) {
		if (!draggedComponent.value) return
		if (location === 'farmer' && draggedComponentLocation.value === 'leek') {
			removeComponent(draggedComponent.value)
		} else if (location === 'leek' && draggedComponentLocation.value === 'farmer') {
			addComponent(draggedComponent.value, index)
		} else if (location === 'leek' && draggedComponentLocation.value === 'leek') {
			moveComponent(draggedComponent.value, index)
		}
		draggedComponent.value = null
		enableComponentsTooltips()
		e.preventDefault()
		return false
	}

	function enableComponentsTooltips() {
		const tooltips = componentTooltipsRef.value
		if (tooltips) {
			for (const tooltip of tooltips) tooltip.disabled = false
		}
	}

	function refreshTotalCharacteristics() {
		if (!leek.value) return
		for (const charac of LeekWars.characteristics) {
			(leek.value as any)['total_' + charac] = (leek.value as any)[charac]
		}
		if (leek.value) {
			for (let c = 0; c < 8; ++c) {
				const component = leek.value.components[c]
				if (component && c < max_components.value) {
					for (const charac of LeekWars.components[LeekWars.items[component.template].params].stats) {
						(leek.value as any)['total_' + charac[0]] += charac[1]
					}
				}
			}
		}
	}

	function setWeapon(w: number) {
		skinWeaponDialog.value = false
		if (!leek.value || !my_leek.value) return
		if (holdWeaponEnabled.value) {
			LeekWars.put('leek/set-weapon', {leek_id: leek.value.id, weapon: w})
			leek.value.weapon = w
			store.commit('set-leek-weapon', {leek: leek.value.id, weapon: w})
		}
	}

	function pickTitle(title: number[]) {
		leek.value!.title = title
		titleDialog.value = false
		LeekWars.put('leek/set-title', {leek_id: leek.value!.id, icon: title[0] || 0, noun: title[1] || 0, gender: title[2] || 0, adjective: title[3] || 0})
		store.commit('set-leek-title', {leek: leek.value!.id, title})
	}

	function changeShowAiLines() {
		store.commit('toggle-show-ai-lines')
		LeekWars.put('farmer/set-show-ai-lines', {show_ai_lines: store.state.farmer!.show_ai_lines})
	}

	function changeMetal() {
		if (leek.value) {
			leek.value.metal = !leek.value.metal
			store.commit('toggle-metal', leek.value.id)
			LeekWars.put('leek/set-metal', {leek_id: leek.value.id, metal: leek.value.metal})
		}
	}

	function changeFace(face: number) {
		if (leek.value) {
			leek.value.face = face
			store.commit('set-face', {leek: leek.value.id, face})
			LeekWars.put('leek/set-face', {leek_id: leek.value.id, face})
		}
	}

	function loadTournamentRange() {
		if (!leek.value || tournamentRange.value || tournamentRangeLoading.value) return
		tournamentRangeLoading.value = true
		LeekWars.get('tournament/range-leek/' + leek.value.level).then(d => tournamentRange.value = d)
	}

	function copyAsTest() {
		if (!leek.value) return
		LeekWars.post('test-leek/new', {name: leek.value.name}).then(data => {
			if (!leek.value) return
			const newLeek = new Leek({
				id: data.id,
				name: leek.value.name,
				level: leek.value.level,
				weapons: leek.value.weapons.map(w => w.template),
				chips: leek.value.chips.map(c => c.template),
				skin: leek.value.skin
			} as any)
			for (const charac of LeekWars.characteristics) {
				(newLeek as any)[charac] = (leek.value as any)['total_' + charac]
			}
			LeekWars.post('test-leek/update', {id: newLeek.id, data: JSON.stringify(newLeek)})
				.then(() => router.push('/editor#leek-' + newLeek.id))
				.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
		})
		.error(err => LeekWars.toast(t('error_' + err.error, err.params)))
	}

	function downloadLeekImage() {
		const li = leekImageRef.value
		if (!li) return
		const canvas = li.drawOnCanvas()
		if (canvas) {
			const png = canvas.toDataURL()
			const link = document.createElement('a')
			link.download = leek.value!.name + ".png"
			link.style.opacity = "0"
			link.href = png
			link.click()
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
		// margin-left: -10px;
		// margin-right: -4px;
		// margin-bottom: -16px;
		position: relative;
		:deep(.ct-line) {
			stroke: rgba(95, 173, 27, 0.7);
			stroke-width: 2px;
		}
		:deep(.ct-point) {
			stroke: #5fad1b;
		}
		:deep(.ct-area) {
			fill: rgba(95, 173, 27, 1);
			fill-opacity: 0.2;
		}
		:deep(.ct-label.ct-horizontal) {
			text-align: center;
			display: block;
		}
		:deep(&:before) {
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
		width: 60px;
		height: 60px;
		cursor: move;
	}
	.chips-dialog .chip img {
		width: 60px;
		height: 60px;
		vertical-align: bottom;
	}
	.chips-dialog .leek-chips, .chips-dialog .farmer-chips {
		min-height: 80px;
		border: 3px solid transparent;
		padding: 5px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
		gap: 6px;
		justify-items: center;
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
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
			gap: 6px;
			justify-items: center;
			.component {
				cursor: move;
				width: 60px;
				height: 60px;
				img {
					width: 60px;
					height: 60px;
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
