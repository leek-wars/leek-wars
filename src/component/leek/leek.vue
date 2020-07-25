<template lang="html">
	<not-found v-if="error" :title="$t('not_found')" :message="$t('not_found_id', [id])" />
	<div v-else>
		<div class="page-header page-bar">
			<rich-tooltip-leek v-if="leek" :id="leek.id" v-slot="{ on }" :bottom="true">
				<h1 v-on="on">{{ leek.name }}</h1>
			</rich-tooltip-leek>
			<h1 v-else>...</h1>
			<div class="tabs">
				<template v-if="leek && my_leek">
					<template v-if="leek.tournament && leek.tournament.current">
						<router-link :to="'/tournament/' + leek.tournament.current">
							<div class="tab green">{{ $t('see_tournament') }}</div>
						</router-link>
					</template>
					<tooltip v-if="leek.tournament">
						<template v-slot:activator="{ on }">
							<div class="tab" @click="registerTournament" v-on="on">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="!leek.tournament.registered" class="register">{{ $t('register_to_tournament') }}</span>
								<span v-else class="unregister">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
					</tooltip>
					<tooltip>
						<template v-slot:activator="{ on }">
							<div class="tab" @click="updateGarden" v-on="on">
								<span>{{ $t('garden') }}</span>
								<v-switch v-model="leek.in_garden" hide-details />
							</div>
						</template>
						{{ $t('authorize_agressions') }}
					</tooltip>
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
					<i18n slot="title" path="farmed_by">
						<router-link slot="farmer" :to="'/farmer/' + (leek ? leek.farmer.id : 0)">
							<rich-tooltip-farmer :id="(leek ? leek.farmer.id : 0)" v-slot="{ on }" :bottom="true">
								<span v-on="on">{{ leek ? leek.farmer.name : '...' }}</span>
							</rich-tooltip-farmer>
						</router-link>
					</i18n>
					<template v-if="my_leek" slot="actions">
						<div class="button flat hat-button" @click="customizeDialog = true">
							<v-icon>mdi-auto-fix</v-icon>
						</div>
					</template>
					<div slot="content" class="leek-image">
						<leek-image v-if="leek" :scale="0.95" :leek="leek" />
						<loader v-else />
						<lw-title v-if="leek && leek.title.length" :title="leek.title" :class="{pointer: my_leek}" @click.native="titleDialog = true" />
					</div>
				</panel>
			</div>
			<div class="column4">
				<panel :title="$t('statistics')">
					<h4 class="level">{{ $t('main.level_n', [leek ? leek.level : '...']) }}</h4>

					<tooltip>
						<template v-slot:activator="{ on }">
							<div class="bar" v-on="on">
								<span :class="{ blue: blue_xp_bar }" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
							</div>
						</template>
						<template v-if="leek && leek.isMaxLevel">
							<b>{{ $t('max_level') }}</b> <br>
							{{ $t('xp', [LeekWars.formatNumber(leek.xp)]) }}
						</template>
						<template v-else-if="leek">
							<b>{{ $t('remaining_xp', [LeekWars.formatNumber(leek.remaining_xp)]) }}</b>
							<br>
							{{ $t('xp', [LeekWars.formatNumber(leek.xp) + " / " + LeekWars.formatNumber(leek.up_xp)]) }}
						</template>
					</tooltip>

					<div class="talent-wrapper">
						<tooltip>
							<template v-slot:activator="{ on }">
								<talent :talent="leek ? leek.talent : '...'" :on="on" />
							</template>
							<div>{{ $t('talent') }}</div>
						</tooltip>
						<tooltip v-if="leek">
							<template v-slot:activator="{ on }">
								<div class="talent-more" v-on="on">({{ leek.talent_more >= 0 ? '+' + leek.talent_more : leek.talent_more }})</div>
							</template>
							<template v-if="leek.talent_more > 0">
								<span v-html="$t('main.talent_difference', [leek.name, leek.talent_more, leek.talentGains + '%'])"></span>
							</template>
							<template v-else>
								<span v-html="$t('main.talent_difference_no_gains', [leek.name])"></span>
							</template>
						</tooltip>
					</div>

					<tooltip v-if="leek">
						<template v-slot:activator="{ on }">
							<table class="fights" v-on="on">
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
					</tooltip>

					<template v-if="leek && leek.level >= 100">
						<chartist ref="chart" :data="chartData" :options="chartOptions" :events="chartEvents" ratio="ct-major-eleventh" class="talent-history" type="Line" />
						<div v-show="chartTooltipValue" ref="chartTooltip" :style="{top: chartTooltipY + 'px', left: chartTooltipX + 'px'}" class="chart-tooltip v-tooltip__content top">{{ chartTooltipValue }}</div>
					</template>
				</panel>
			</div>

			<div class="column4">
				<panel :title="$t('characteristic.characteristics')">
					<template v-if="leek && my_leek && leek.capital == 0" slot="actions">
						<div class="button flat" @click="capitalDialog = true">
							<v-icon>mdi-star-outline</v-icon>
						</div>
					</template>
					<div slot="content" class="characteristics">
						<characteristic-tooltip v-for="c in LeekWars.characteristics_table" :key="c" v-slot="{ on }" :characteristic="c" :value="leek ? leek[c] : 0" :leek="leek" :test="false">
							<div class="characteristic" v-on="on">
								<img :src="'/image/charac/' + c + '.png'">
								<span :class="'color-' + c">{{ leek ? leek[c] : '...' }}</span>
							</div>
						</characteristic-tooltip>
						<center v-if="leek && my_leek">
							<br>
							<v-btn v-if="leek.capital > 0" color="primary" @click="capitalDialog = true">{{ $t('main.n_capital', [leek.capital]) }}</v-btn>&nbsp;
							<v-btn class="potions-button" @click="potionDialog = true">
								<img src="/image/icon/black/potion.png">
								{{ $t('potions') }}
							</v-btn>
						</center>
					</div>
				</panel>
			</div>

			<div class="column4">
				<panel>
					<template slot="title">{{ $t('weapons') }} <span v-if="leek && leek.weapons" class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span></template>
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="weaponsDialog = true">
							<v-icon>mdi-pencil</v-icon>
						</div>
					</template>
					<div slot="content" class="weapons-wrapper center">
						<loader v-if="!leek" />
						<div v-else-if="leek.weapons.length === 0" class="empty">{{ $t('no_weapons') }}</div>
						<template v-else>
							<rich-tooltip-weapon v-for="weapon in leek.orderedWeapons" :key="weapon.id" v-slot="{ on }" :instant="true" :weapon="LeekWars.weapons[weapon.template]" :bottom="true">
								<div class="weapon" v-on="on">
									<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'" @click="setWeapon(weapon.template)">
								</div>
							</rich-tooltip-weapon>
						</template>
					</div>
				</panel>
			</div>

			<div class="column4">
				<panel icon="mdi-chip">
					<template slot="title">{{ $t('main.chips') }} <span v-if="leek && leek.chips" class="chip-count">[{{ leek.chips.length }}/{{ leek.max_chips }}]</span></template>
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="chipsDialog = true">
							<v-icon>mdi-pencil</v-icon>
						</div>
					</template>
					<div slot="content" class="chips-wrapper center">
						<loader v-if="!leek" />
						<div v-else-if="leek.chips.length === 0" class="empty">{{ $t('no_chips') }}</div>
						<div v-else class="chips">
							<rich-tooltip-chip v-for="chip in leek.orderedChips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip.template]" :bottom="true" :instant="true">
								<div class="chip" v-on="on">
									<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'">
								</div>
							</rich-tooltip-chip>
						</div>
					</div>
				</panel>
			</div>

			<div class="column4">
				<panel :title="$t('ai')" icon="mdi-code-braces">
					<template v-if="leek && my_leek" slot="actions">
						<div class="button flat" @click="aiDialog = true">
							<v-icon>mdi-pencil</v-icon>
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
							<span v-else class="empty">{{ $t('no_ai') }}</span>
						</template>
					</div>
				</panel>
			</div>
		</div>

		<div class="flex-container">
			<div class="column6">
				<panel v-if="leek && leek.fights && leek.fights.length > 0" :title="$t('fights')" icon="mdi-sword-cross">
					<template v-if="leek" slot="actions">
						<router-link :to="'/leek/' + leek.id + '/history'" class="button flat">
							<v-icon>mdi-history</v-icon>
							<span>{{ $t('history') }}</span>
						</router-link>
					</template>
					<fights-history slot="content" :fights="leek.fights" />
				</panel>
			</div>
			<div class="column6">
				<panel v-if="leek && leek.tournaments && leek.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
					<tournaments-history slot="content" :tournaments="leek.tournaments" />
				</panel>
			</div>
		</div>

		<panel v-if="leek && my_leek && leek.registers && leek.registers.length > 0" toggle="leek/registers" icon="mdi-database">
			<template slot="title">{{ $t('registers') }} <span class="register-count">[{{ leek.registers.length }}/100]</span></template>
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
			</div>
		</div>

		<popup v-if="leek" v-model="weaponsDialog" :width="800">
			<img slot="icon" src="/image/icon/garden.png">
			<template slot="title">
				{{ $t('weapons_of', [leek.name]) }}
				<span class="weapon-count">[{{ leek.weapons.length }}/{{ leek.max_weapons }}]</span>
			</template>
			<div class="weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<rich-tooltip-weapon v-for="(weapon, i) in leek.orderedWeapons" :key="i" v-slot="{ on }" :instant="true" :weapon="LeekWars.weapons[weapon.template]" :bottom="true">
						<div :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" v-on="on" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
							<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-weapon>
				</div>
				<br>
				<h2>{{ $t('all_my_weapons') }}</h2>
				<br>
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'leek'}" class="farmer-weapons" @dragover="dragOver" @drop="weaponsDrop('farmer', $event)">
					<rich-tooltip-weapon v-for="(weapon, i) in farmer_weapons" :key="i" v-slot="{ on }" :instant="true" :weapon="LeekWars.weapons[weapon.template]" :bottom="true">
						<div :quantity="weapon.quantity" :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'farmer', locked: LeekWars.weapons[weapon.template].level > leek.level || (LeekWars.weapons[weapon.template].forgotten && hasForgottenWeapon) }" :draggable="LeekWars.weapons[weapon.template].level <= leek.level" class="weapon" v-on="on" @dragstart="weaponDragStart('farmer', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="addWeapon(weapon)">
							<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-weapon>
				</div>
			</div>
		</popup>

		<popup v-if="leek" v-model="renameDialog" :width="600">
			<v-icon slot="icon">mdi-pencil-outline</v-icon>
			<template slot="title">{{ $t('rename_leek') }}</template>
			{{ $t('rename_description') }}
			<br>
			<br>
			{{ $t('rename_new_name') }} : <input v-model="renameName" type="text">
			<br>
			<br>
			<center>
				<v-btn class="rename-button" @click="rename('habs')">{{ $t('rename_pay_habs') }} :&nbsp;<b>{{ rename_price_habs }}</b>&nbsp;<img src="/image/hab.png"></v-btn>
				&nbsp;
				<v-btn class="rename-button" @click="rename('crystals')">{{ $t('rename_pay_crystals') }} :&nbsp;<b>{{ rename_price_crystals }}</b> &nbsp;<span class="crystal"></span></v-btn>
			</center>
		</popup>

		<v-snackbar v-model="renameSuccess" :timeout="2000" color="success">{{ $t('rename_done') }}</v-snackbar>
		<v-snackbar v-if="renameError" v-model="renameFailed" :timeout="5000" color="error">{{ $t(renameError.error, renameError.error_params) }}</v-snackbar>

		<popup v-if="leek && my_leek" v-model="potionDialog" :width="750">
			<img slot="icon" src="/image/icon/potion.png">
			<span slot="title">{{ $t("use_a_potion", [leek.name]) }}</span>
			<div class="farmer-potions">
				<div class="potions-grid">
					<tooltip v-for="(potion, id) in $store.state.farmer.potions" :key="id">
						<template v-slot:activator="{ on }">
							<div :quantity="potion.quantity" class="potion" @click="usePotion(potion)" v-on="on">
								<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
							</div>
						</template>
						<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
						<br>
						{{ $t('main.level_n', [LeekWars.potions[potion.template].level]) }}
					</tooltip>
				</div>
				<center>({{ $t('click_to_use') }})</center>
			</div>
		</popup>

		<popup v-if="leek && my_leek" v-model="skinPotionDialog" :width="750">
			<img slot="icon" src="/image/icon/potion.png">
			<span slot="title">{{ $t("select_skin") }}</span>
			<div class="farmer-potions">
				<div class="potions-grid">
					<tooltip v-for="(potion, id) in skinPotions" :key="id">
						<template v-slot:activator="{ on }">
							<div :quantity="potion.quantity" class="potion" @click="usePotion(potion)" v-on="on">
								<img :src="'/image/potion/' + LeekWars.potions[potion.template].name + '.png'">
							</div>
						</template>
						<b>{{ $t('potion.' + LeekWars.potions[potion.template].name) }}</b>
						<br>
						{{ $t('main.level_n', [LeekWars.potions[potion.template].level]) }}
					</tooltip>
				</div>
			</div>
		</popup>

		<report-dialog v-if="leek" v-model="reportDialog" :name="leek.farmer.name" :target="leek.farmer" :leek="leek" :reasons="reasons" :parameter="leek.id" />

		<popup v-model="hatDialog" :width="750">
			<v-icon slot="icon">mdi-hat-fedora</v-icon>
			<span slot="title">{{ $t('select_a_hat') }}</span>
			<div class="hat-dialog">
				<div class="hats">
					<tooltip>
						<template v-slot:activator="{ on }">
							<div v-ripple :quantity="1" class="hat" @click="selectHat(null)" v-on="on">
								<img src="/image/hat/no_hat.png">
							</div>
						</template>
						<b>{{ $t('no_hat') }}</b>
					</tooltip>
					<tooltip v-for="hat in farmer_hats" :key="hat.id">
						<template v-slot:activator="{ on }">
							<div v-ripple :quantity="hat.quantity" class="hat" @click="selectHat(hat)" v-on="on">
								<img :src="'/image/hat/' + hat.name + '.png'">
							</div>
						</template>
						<b>{{ $t('hat.' + hat.name) }}</b>
						<br>
						{{ $t('main.level_n', [hat.level]) }}
					</tooltip>
				</div>
				<br>
				<center>({{ $t('click_to_put_hat') }})</center>
			</div>
		</popup>

		<popup v-model="skinWeaponDialog" :width="650">
			<img slot="icon" src="/image/icon/garden.png">
			<span slot="title">{{ $t('select_a_weapon') }}</span>
			<div v-if="leek" class="weapons-popup">
				<div class="leek-weapons">
					<tooltip>
						<template v-slot:activator="{ on }">
							<div v-ripple :quantity="1" class="weapon" @click="setWeapon(0)" v-on="on">
								<img src="/image/weapon/no_weapon.png">
							</div>
						</template>
						<b>{{ $t('no_weapon') }}</b>
					</tooltip>
					<rich-tooltip-weapon v-for="(weapon, i) in leek.orderedWeapons" :key="i" v-slot="{ on }" :instant="true" :weapon="LeekWars.weapons[weapon.template]" :bottom="true">
						<div class="weapon" v-on="on" @click="setWeapon(weapon.template)">
							<img :src="'/image/weapon/' + LeekWars.weapons[weapon.template].name + '.png'">
						</div>
					</rich-tooltip-weapon>
				</div>
			</div>
		</popup>

		<popup v-model="customizeDialog" :width="700">
			<v-icon slot="icon">mdi-auto-fix</v-icon>
			<span slot="title">{{ $t('customize') }}</span>
			<div v-if="leek" class="customize-dialog">
				<center>
					<leek-image :leek="leek" :scale="1" />
					<br>
					<lw-title v-if="leek.title.length" :title="leek.title" />
				</center>

				<div class="customize-grid">
					<div v-ripple class="item card" @click="skinPotionDialog = true">
						<div class="title">{{ $t('skin') }}</div>
						<img v-if="leek.skin" class="image" :src="'/image/potion/' + LeekWars.potionsBySkin[leek.skin].name + '.png'">
						<img v-else class="image" src="/image/potion/skin_green.png">
						<div class="name">{{ $t('potion.' + LeekWars.potionsBySkin[leek.skin].name) }}</div>
					</div>
					<div v-ripple class="item card" @click="hatDialog = true">
						<div class="title">{{ $t('hat') }}</div>
						<img v-if="leek.hat" class="image" :src="'/image/hat/' + LeekWars.hats[LeekWars.hatTemplates[leek.hat].item].name + '.png'">
						<img v-else class="image" src="/image/hat/no_hat.png">
						<div v-if="leek.hat" class="name">{{ $t('hat.' + LeekWars.hats[LeekWars.hatTemplates[leek.hat].item].name) }}</div>
					</div>
					<div v-ripple class="item card" :class="{disabled: !holdWeaponEnabled}" @click="skinWeaponDialog = true">
						<div class="title">
							<tooltip v-if="holdWeaponEnabled">
								<template v-slot:activator="{ on }">
									<img src="/image/pomp/hold_weapon.png" v-on="on">
								</template>
								{{ $t('pomp.hold_weapon') }}
							</tooltip>
							{{ $t('weapon') }}
						</div>
						<template v-if="holdWeaponEnabled">
							<img v-if="leek.weapon" class="image" :src="'/image/weapon/' + LeekWars.weapons[leek.weapon].name + '.png'">
							<img v-else class="image" src="/image/weapon/no_weapon.png">
							<div v-if="leek.weapon" class="name">{{ $t('weapon.' + LeekWars.weapons[leek.weapon].name) }}</div>
						</template>
						<template v-else>
							<img class="image" src="/image/pomp/hold_weapon.png">
							<div class="name"><v-icon>mdi-lock</v-icon> {{ $t('pomp.hold_weapon') }}</div>
						</template>
					</div>
					<div v-ripple class="item card" :class="{disabled: !leekTitleEnabled}" @click="titleDialog = true">
						<div class="title">
							<tooltip v-if="leekTitleEnabled">
								<template v-slot:activator="{ on }">
									<img src="/image/pomp/leek_title.png" v-on="on">
								</template>
								{{ $t('pomp.leek_title') }}
							</tooltip>
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
				<tooltip :disabled="showAiLinesEnabled">
					<template v-slot:activator="{ on }">
						<span v-if="$store.state.farmer" class="ai-lines" v-on="on">
							<v-switch :input-value="$store.state.farmer.show_ai_lines" hide-details :label="$t('pomp.ai_lines')" :disabled="!showAiLinesEnabled" @change="changeShowAiLines" />
							<img src="/image/pomp/ai_lines.png">
						</span>
					</template>
					<v-icon>mdi-lock</v-icon> {{ $t('pomp.ai_lines') }}
				</tooltip>
			</div>
		</popup>

		<popup v-if="leek" v-model="titleDialog" :width="550">
			<v-icon slot="icon">mdi-medal-outline</v-icon>
			<span slot="title">{{ $t('main.select_title') }}</span>
			<div class="title-dialog">
				<title-picker ref="picker" :title="leek.title" />
			</div>
			<div slot="actions">
				<div @click="titleDialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="pickTitle($refs.picker.getTitle())">{{ $t('validate') }}</div>
			</div>
		</popup>

		<level-dialog v-if="leek && levelPopupData" v-model="levelPopup" :leek="leek" :data="levelPopupData" />

		<popup v-if="leek && my_leek" v-model="aiDialog" :width="870">
			<v-icon slot="icon">mdi-code-braces</v-icon>
			<span slot="title">{{ $t('ai_of', [leek.name]) }}</span>
			<div class="ai_popup">
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
		</popup>

		<popup v-if="leek && my_leek" v-model="chipsDialog" :width="800">
			<v-icon slot="icon">mdi-chip</v-icon>
			<template slot="title">{{ $t('chips_of', [leek.name]) }} <span class="chip-count">[{{ leek.chips.length }}/{{ leek.max_chips }}]</span></template>
			<div class="chips-dialog">
				<div :class="{dashed: draggedChip && draggedChipLocation === 'farmer'}" class="leek-chips" @dragover="dragOver" @drop="chipsDrop('leek', $event)">
					<rich-tooltip-chip v-for="chip in leek.orderedChips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip.template]" :bottom="true" :instant="true">
						<div :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'leek'}" class="chip" draggable="true" v-on="on" @dragstart="chipDragStart('leek', chip, $event)" @dragend="chipDragEnd(chip)" @click="removeChip(chip)">
							<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-chip>
				</div>
				<br>
				<h2>{{ $t('all_my_chips') }}</h2>
				<br>
				<div :class="{dashed: draggedChip && draggedChipLocation === 'leek'}" class="farmer-chips" @dragover="dragOver" @drop="chipsDrop('farmer', $event)">
					<rich-tooltip-chip v-for="chip in farmer_chips" :key="chip.id" v-slot="{ on }" :chip="LeekWars.chips[chip.template]" :bottom="true" :instant="true">
						<div :quantity="chip.quantity" :class="{dragging: draggedChip && draggedChip.template === chip.template && draggedChipLocation === 'farmer', locked: LeekWars.chips[chip.template].level > leek.level}" :draggable="LeekWars.chips[chip.template].level <= leek.level" class="chip" v-on="on" @dragstart="chipDragStart('farmer', chip, $event)" @dragend="chipDragEnd(chip)" @click="addChip(chip)">
							<img :src="'/image/chip/small/' + LeekWars.chips[chip.template].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-chip>
				</div>
			</div>
		</popup>
		<capital-dialog v-if="leek && my_leek" v-model="capitalDialog" :leek="leek" :total-capital="leek.capital" />
	</div>
</template>

<script lang="ts">
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
	import { Weapon } from '@/model/weapon'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import CapitalDialog from './capital-dialog.vue'
	import CharacteristicTooltip from './characteristic-tooltip.vue'
	const LevelDialog = () => import(/* webpackChunkName: "[request]" */ `@/component/leek/level-dialog.${locale}.i18n`)
	import(/* webpackChunkName: "chartist" */ "@/chartist-wrapper")

	@Component({ name: "leek", i18n: {}, mixins, components: { CapitalDialog, LevelDialog, CharacteristicTooltip } })
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
		customizeDialog: boolean = false
		skinWeaponDialog: boolean = false
		titleDialog: boolean = false
		skinPotionDialog: boolean = false

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
		get hasForgottenWeapon() {
			if (!this.leek) { return false }
			for (const weapon of this.leek.weapons) {
				if (LeekWars.weapons[weapon.template].forgotten) { return true }
			}
			return false
		}
		get holdWeaponEnabled() {
			return this.$store.state.farmer && this.$store.state.farmer.pomps.indexOf(123) !== -1
		}
		get leekTitleEnabled() {
			return this.$store.state.farmer && this.$store.state.farmer.pomps.indexOf(125) !== -1
		}
		get showAiLinesEnabled() {
			return this.$store.state.farmer && this.$store.state.farmer.pomps.indexOf(124) !== -1
		}
		get skinPotions() {
			return store.state.farmer!.potions.filter(p => LeekWars.potions[p.template].effects.some(e => e.type === PotionEffect.CHANGE_SKIN))
		}

		@Watch('id', {immediate: true})
		update() {
			this.leek = null
			this.error = false
			if (!this.id) { return }
			const method = this.my_leek ? 'leek/get-private/' + this.id : 'leek/get/' + this.id
			LeekWars.get(method).then(leek => {
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
			}).error(error => {
				this.error = true
			})
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
					} else if (effect.type === 2) { // Skin
						const skin = effect.params[0]
						this.leek.skin = skin
						store.commit('change-skin', {leek: this.leek.id, skin})
					}
				}
				this.potionDialog = false
				this.skinPotionDialog = false
				LeekWars.post('leek/use-potion', {leek_id: this.leek.id, potion_id: potion.id}).then(data => {
					if (template.consumable) {
						this.$store.commit('remove-inventory', {type: ItemType.POTION, item_template: potion.template})
					}
					if (update) { this.update() }
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
				LeekWars.delete('leek/remove-hat', {leek_id: this.leek.id}).then(data => {
					if (this.leek) {
						store.commit('change-hat', {leek: this.leek.id, hat: null})
					}
				}).error(error => {
					LeekWars.toast(error)
				})
			} else {
				if (this.leek.hat === hat.hat_template) {
					this.hatDialog = false
					return
				}
				this.leek.hat = hat.hat_template
				LeekWars.post('leek/set-hat', {leek_id: this.leek.id, hat_id: hat.template}).then(data => {
					if (this.leek) {
						store.commit('change-hat', {leek: this.leek.id, hat: hat.hat_template})
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
				this.levelPopup = true
				this.levelPopupData = data.popup
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
					LeekWars.toast("Register saved")
				})
			}
		}
		registerDelete(register: Register) {
			if (!this.leek) { return }
			this.leek.registers.splice(this.leek.registers.indexOf(register), 1)
			LeekWars.delete('leek/delete-register', {leek_id: this.leek.id, key: register.key}).then(data => {
				LeekWars.toast("Register deleted")
			})
		}

		weaponDragStart(location: string, weapon: Weapon, e: DragEvent) {
			if (this.leek && LeekWars.weapons[weapon.template].level > this.leek.level) { return }
			if (location === 'farmer' && this.hasForgottenWeapon && LeekWars.weapons[weapon.template].forgotten) { return }
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
				return LeekWars.toast(this.$i18n.t('error_max_weapon', [this.leek.name]))
			}
			if (template.level > this.leek.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_weapon', [this.leek.name]))
			}
			if (this.leek.weapons.some((w) => w.template === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_weapon_already_equipped', [this.leek.name]))
			}
			if (this.hasForgottenWeapon && LeekWars.weapons[weapon.template].forgotten) {
				return LeekWars.toast(this.$i18n.t('error_weapon_two_forgotten', [this.leek.name]))
			}
			LeekWars.post('leek/add-weapon', {leek_id: this.leek.id, weapon_id: weapon.id}).then(data => {
				if (this.leek) {
					this.leek.weapons.push({id: data.id, template: weapon.template})
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
					this.leek.chips.push({id: data.id, template: chip.template})
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
		setWeapon(weapon: number) {
			this.skinWeaponDialog = false
			if (!this.leek || !this.my_leek) { return }
			if (this.holdWeaponEnabled) {
				LeekWars.put('leek/set-weapon', {leek: this.leek.id, weapon})
				this.leek.weapon = weapon
				store.commit('set-leek-weapon', {leek: this.leek.id, weapon})
			}
		}
		pickTitle(title: number[]) {
			this.leek!.title = title
			this.titleDialog = false
			LeekWars.put('leek/set-title', {leek: this.leek!.id, icon: title[0] || 0, noun: title[1] || 0, gender: title[2] || 0, adjective: title[3] || 0})
			this.$store.commit('set-leek-title', {leek: this.leek!.id, title})
		}
		changeShowAiLines() {
			store.commit('toggle-show-ai-lines')
			LeekWars.put('farmer/set-show-ai-lines', {show_ai_lines: store.state.farmer!.show_ai_lines})
		}
	}
</script>

<style lang="scss" scoped>
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
			padding: 4px 30px;
			display: inline-block;
			img {
				margin-right: 7px;
				width: 23px;
				margin-top: 3px;
			}
			span {
				font-size: 18px;
				vertical-align: top;
				display: inline-block;
				margin-top: 5px;
				font-weight: bold;
			}
		}
		.characteristic:nth-child(8n+6),
		.characteristic:nth-child(8n+8) {
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
		height: 12px;
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
	.dashed {
		border: 3px dashed #999;
		margin: -3px;
	}
	.dragging {
		opacity: 0.2;
	}
	.leek-weapons, .farmer-weapons {
		min-height: 80px;
		display: grid;
		grid-gap: 5px;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
		border: 1px solid #ddd;
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
	.potions-button img {
		height: 22px;
		margin-right: 4px;
		opacity: 0.7;
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
			border: 1px solid#ddd;
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
			border: 1px solid #ddd;
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
		border: 1px solid #ccc;
		width: 100%;
		.register {
			font-family: monospace;
			div {
				word-break: break-all;
			}
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
	.weapons-wrapper {
		padding: 6px 0;
		height: 100%;
		justify-content: center;
		display: flex;
		flex-direction: column;
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
		.ai-lines {
			img {
				width: 20px;
				margin-left: 4px;
			}
		}
	}
	.rename-button {
		b {
			padding-right: 4px;
		}
	}
	.empty {
		color: #999;
	}
</style>
