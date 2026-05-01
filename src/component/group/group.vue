<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1 v-if="group">{{ group.name }}</h1>
			<h1 v-else>{{ $t('main.group') }}</h1>

			<!-- <div v-if="group && group.is_supervisor" class="tabs">
				<div class="tab action" icon="question_answer" @click="settingsDialog = true">
					<v-icon>mdi-cog-outline</v-icon>
					<span>{{ $t('settings') }}</span>
				</div>
			</div> -->
		</div>
		<panel class="first">
			<loader v-if="!group" />
			<div v-else>

				<h4>{{ $t('supervisor') }}</h4>
				<rich-tooltip-farmer :id="group.owner.id" v-slot="{ props }" :bottom="true">
					<!-- <div class="flex name" v-bind="props" v-ripple>
						<avatar :farmer="item" />
						<span>{{ item.name }}</span>
						<img v-if="item.connected" class="status" src="/image/connected.png">
						<img v-else class="status" src="/image/disconnected.png">
					</div> -->
					<router-link :to="'/farmer/' + group.owner.id">
						<div class="card member" v-bind="props" v-ripple>
							<avatar :farmer="group.owner" />
							<div class="info">
								<div class="name">
									<b>{{ group.owner.name }}</b>
									<img v-if="group.owner.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
								<div class="level">{{ $t('main.level_n', [group.owner.total_level]) }}</div>
							</div>
							<!-- <div class="actions">
								<v-icon @click.stop="sendMessage(group.owner)">mdi-email-outline</v-icon>
							</div> -->
						</div>
					</router-link>
				</rich-tooltip-farmer>

				<div v-if="group && group.is_supervisor">
					<br>
					<v-tooltip :disabled="group.members.length >= 3">
						<template #activator="{ props }">
							<span v-bind="props">
								<v-btn :disabled="group.members.length < 3" @click="startBattleRoyale"><v-icon>mdi-sword-cross</v-icon>&nbsp;{{ $t('start_br') }}</v-btn>
							</span>
						</template>
						{{ $t('3_members_min') }}
					</v-tooltip>
					<router-link v-if="group.tournament" :to="'/tournament/' + group.tournament">
						<v-btn color="primary"><v-icon>mdi-trophy</v-icon>&nbsp;{{ $t('see_tournament') }}</v-btn>
					</router-link>
					<v-tooltip v-else :disabled="group.members.length >= 4">
						<template #activator="{ props }">
							<span v-bind="props">
								<v-btn :disabled="group.members.length < 4" @click="startTournament"><v-icon>mdi-trophy</v-icon>&nbsp;{{ $t('start_tournament') }}</v-btn>
							</span>
						</template>
						{{ $t('4_members_min') }}
					</v-tooltip>

					<v-tooltip v-if="!group.tournament" :disabled="group.members.length >= 4">
						<template #activator="{ props }">
							<span v-bind="props">
								<v-btn :disabled="group.members.length < 4" @click="startTeamTournament"><v-icon>mdi-trophy</v-icon>&nbsp;{{ $t('start_team_tournament') }}</v-btn>
							</span>
						</template>
						{{ $t('4_members_min') }}
					</v-tooltip>
				</div>
			</div>
		</panel>

		<panel v-if="group && group.setting_chat" :title="$t('main.chat')" toggle="group/chat" icon="mdi-chat-outline">
			<template #actions>
				<div v-if="!LeekWars.mobile && group && $store.state.chat[group.chat]" class="button flat" @click="LeekWars.addChat($store.state.chat[group.chat])">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
			</template>
			<template #content>
				<chat :id="group.chat" />
			</template>
		</panel>


		<panel v-if="group" toggle="group/members" icon="mdi-account-group">
			<template #title>{{ $t('members') }} ({{ group.members.length }})</template>
			<template #actions>
				<div v-if="group.is_supervisor" class="button" @click="giveMoneyDialog = true; giveMoneyTarget = null">
					<v-icon>mdi-hand-coin-outline</v-icon>
				</div>
				<div v-if="group.is_supervisor" class="button" @click="membersDialog = true">
					<v-icon>mdi-pencil</v-icon>
				</div>
			</template>
			<template #content>
				<div class="content members">
					<v-data-table
						:headers="group.is_supervisor ? headersSupervisor : headers"
						:items="group.members"
						hide-default-footer
						:items-per-page="100"
						class="elevation-1 members">
						<template #no-data class="no-member">
							<span>{{ $t('no_member') }}</span>
							<v-btn @click="membersDialog = true"><v-icon>mdi-plus</v-icon>&nbsp;{{ $t('add_member') }}</v-btn>
						</template>
						<template #item.name="{ item }">
							<!-- <router-link class="flex name" :to="'/farmer/' + item.id" v-ripple>
								<avatar :farmer="item" />
								<div>{{ item.name }}</div>
							</router-link> -->
							<router-link :to="'/farmer/' + item.id">
								<rich-tooltip-farmer :id="item.id" v-slot="{ props }" :bottom="true">
									<div class="flex name" v-bind="props" v-ripple>
										<avatar :farmer="item" />
										<span>{{ item.name }}</span>
										<img v-if="item.connected" class="status" src="/image/connected.png">
										<img v-else class="status" src="/image/disconnected.png">
									</div>
								</rich-tooltip-farmer>
							</router-link>
						</template>
						<template #item.team="{ item }">
							<router-link v-if="item.team"  :to="'/team/' + item.team.id">
								<rich-tooltip-team :id="item.team.id" v-slot="{ props }" :bottom="true">
									<div class="flex name" v-bind="props" v-ripple>
										<emblem :team="item.team" />
										<span>{{ item.team.name }}</span>
									</div>
								</rich-tooltip-team>
							</router-link>
						</template>
						<template #item.message="{ item }">
							<v-icon @click="sendMessage(item)">mdi-email-outline</v-icon>
						</template>
						<template #item.give="{ item }">
							<div class="flex">
								<v-icon @click="giveItem(item)">mdi-gift-outline</v-icon>
								<v-icon @click="giveMoney(item)">mdi-hand-coin-outline</v-icon>
							</div>
						</template>
					</v-data-table>
				</div>
			</template>
		</panel>

		<panel v-if="group" :title="$t('equipment')" icon="mdi-sword" toggle="group/equipment">
			<template #actions>
				<div v-if="equipmentEditing" class="button green" @click="saveEquipment">
					<v-icon>mdi-check</v-icon> {{ $t('main.save') }}
				</div>
				<div v-if="group.is_supervisor && !equipmentEditing" class="button green" @click="applyEquipment">
					<v-icon>mdi-upload</v-icon> {{ $t('main.apply') }}
					<loader class="small-loader" v-if="applyingEquipment" size="30" />
				</div>
				<div v-if="equipmentEditing" class="button" @click="equipmentEditing = false">
					<v-icon>mdi-close</v-icon> {{ $t('main.cancel') }}
				</div>
				<div v-else-if="group.is_supervisor" class="button" @click="equipmentEditing = true">
					<v-icon>mdi-pencil</v-icon>
				</div>
			</template>
			<div class="equipment">
				<div class="section">
					<div class="title">
						<h4>{{ $t('characteristic.characteristics') }}</h4>
						<v-icon v-if="equipmentEditing" @click="capitalDialogOpened = true">mdi-pencil</v-icon>
					</div>

					<div class="level" v-if="equipmentEditing">
						<b>{{ $t('main.level') }}</b>
						<input type="number" v-model="group.level" @update:model-value="changeLevel" :min="1" :max="301" /> (1 - 301)
						<div class="spacer"></div>
						<!-- <b :style="{color: $refs.capitalDialog.capital < 0 ? 'red' : 'green'}">{{ $refs.capitalDialog.capital }} capital</b> -->
						<v-icon v-if="$refs.capitalDialog.capital < 0" class="card alert">mdi-alert-circle</v-icon>
					</div>
					<b v-else class="level">{{ $t('main.level_n', [group.level]) }}</b>
					<div class="card characteristics">
						<div v-for="c in LeekWars.characteristics_table" :key="c" class="characteristic" :class="c">
							<characteristic-tooltip  v-slot="{ props }" :characteristic="c" :value="characteristics[c]" :total="characteristics[c]" :leek="characteristics" :test="true">
								<img v-bind="props" :src="'/image/charac/' + c + '.png'">
							</characteristic-tooltip>
							<span class="stat" :class="'color-' + c" v-html="characteristics[c]"></span>
						</div>
					</div>
				</div>
				<div class="section">
					<div class="title">
						<h4>{{ $t('main.weapons') }} ({{ group.weapons.length }}/{{ max_weapons }})
							<v-tooltip v-if="group.weapons.length > max_weapons">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_much_weapons') }}
							</v-tooltip>
						</h4>
						<v-icon v-if="equipmentEditing" @click="weaponsDialog = true">mdi-pencil</v-icon>
					</div>

					<rich-tooltip-item v-for="weapon in group.weapons" :key="weapon" v-slot="{ props }" :item="LeekWars.items[weapon]" :bottom="true">
						<div class="weapon" v-bind="props">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" @click="setWeapon(weapon)" :width="WeaponsData[LeekWars.items[weapon].params].width">
							<v-tooltip v-if="LeekWars.items[weapon].level > group.level">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[weapon].level]) }}
							</v-tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<div class="section">
					<div class="title">
						<h4>{{ $t('main.chips') }} ({{ group.chips.length }}/{{ group.ram }})
							<v-tooltip v-if="group.chips.length > group.ram">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_much_chips') }}
							</v-tooltip>
						</h4>
						<v-icon v-if="equipmentEditing" @click="chipsDialog = true">mdi-pencil</v-icon>
					</div>

					<rich-tooltip-item v-for="chip in group.chips" :key="chip" v-slot="{ props }" :item="LeekWars.items[chip]" :bottom="true">
						<div class="chip" v-bind="props">
							<img :src="'/image/' + LeekWars.items[chip].name.replace('_', '/') + '.png'">
							<v-tooltip v-if="LeekWars.items[chip].level > group.level">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[chip].level]) }}
							</v-tooltip>
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</panel>

		<div class="container large">
			<panel v-if="group && group.fights && group.fights.length > 0" :title="$t('main.fights')" icon="mdi-sword-cross">
				<!-- <template v-if="group" #actions>
					<router-link :to="'/leek/' + group.id + '/history'" class="button flat">
						<v-icon>mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template> -->
				<template #content>
					<fights-history :fights="group.fights" />
				</template>
			</panel>
			<panel v-if="group && group.tournaments && group.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<template #content>
					<tournaments-history :tournaments="group.tournaments" :show-time="true" />
				</template>
			</panel>
		</div>

		<div v-if="group && group.is_supervisor" class="container last">
			<panel :title="$t('settings')" icon="mdi-cog-outline">
				<v-switch v-model="group.setting_chat" :label="$t('setting_chat')" hide-details @change="updateSettingChat" />
			</panel>
			<panel :title="$t('member_options')" icon="mdi-cog-outline">
				<v-switch v-model="group.setting_public_chat" :label="$t('setting_public_chat')" hide-details @change="updateSettingPublicChat" />
				<v-switch v-model="group.setting_buy_fights" :label="$t('setting_buy_fights')" hide-details @change="updateSettingBuyFights" />
				<v-switch v-model="group.setting_bank" :label="$t('setting_bank')" hide-details @change="updateSettingBank" />
				<v-switch v-model="group.setting_tournaments" :label="$t('setting_tournaments')" hide-details @change="updateSettingTournaments" />
				<v-switch v-model="group.setting_br" :label="$t('setting_br')" hide-details @change="updateSettingBr" />
				<v-switch v-model="group.setting_new_leek" hide-details :label="$t('new_leek')" @change="updateNewLeek" />
				<v-switch v-model="group.setting_xp_blocked" hide-details :label="$t('main.xp_blocked')" @change="updateXpBlocked" />
				<v-switch v-model="group.setting_equipment_blocked" hide-details :label="$t('equipment_blocked')" @change="updateEquipmentBlocked" />
			</panel>
		</div>

		<popup v-if="group" v-model="membersDialog" :width="1000" :full="true" icon="mdi-account-group">
			<template #title>
				{{ $t('members') }} ({{ group.members.length }})
			</template>
			<v-data-table
				:headers="headersDialog"
				:items="group.members"
				hide-default-footer
				:items-per-page="100"
				:no-data-text="$t('no_member')"
				class="elevation-1 members">
				<template #item.name="{ item }">
					<div class="flex name">
						<avatar :farmer="item" />
						<div>
							<input type="text" v-model="item.name" :class="{error: item.name_error}" @focusout="updateMemberName(item)">
							<div v-if="item.name_error" class="error">{{ $t('error_' + item.name_error.error, item.name_error.params) }}</div>
						</div>
					</div>
				</template>
				<template #item.leek="{ item }">
					<input type="text" v-model="item.leek" :class="{error: item.leek_error}" @focusout="updateMemberLeekName(item)">
					<div v-if="item.leek_error" class="error">{{ $t('error_' + item.leek_error.error, item.leek_error.params) }}</div>
				</template>
				<template #item.team="{ item }">
					<rich-tooltip-team :id="item.team.id" v-slot="{ props }" :bottom="true">
						<div class="flex name" v-bind="props">
							<emblem :team="item.team" />
							<span>{{ item.team.name }}</span>
						</div>
					</rich-tooltip-team>
				</template>
				<template #item.mail="{ item }">
					<input type="email" v-model="item.mail" :class="{error: item.mail_error}" @focusout="updateMemberEmail(item)">
					<div v-if="item.mail_error" class="error">{{ $t('error_' + item.mail_error.error, item.mail_error.params) }}</div>
				</template>
				<template #item.password="{ item }">
					<input type="text" v-model="item.password" :class="{error: item.password_error}" @focusout="updateMemberPassword(item)">
					<div v-if="item.password_error" class="error">{{ $t('error_' + item.password_error.error, item.password_error.params) }}</div>
				</template>
				<template #item.actions="{ item }">
					<div class="flex actions">
						<v-tooltip v-if="!group.use_passwords">
							<template #activator="{ props }">
								<div v-bind="props">
									<v-icon :disabled="!item.mail" @click="sendInvite(item)">mdi-email-outline</v-icon>
								</div>
							</template>
							{{ $t('send_invite') }}
						</v-tooltip>
						<v-tooltip>
							<template #activator="{ props }">
								<div v-bind="props">
									<v-icon @click="memberToDelete = item; deleteMemberDialog = true">mdi-delete-outline</v-icon>
								</div>
							</template>
							{{ $t('remove_member') }}
						</v-tooltip>
					</div>
				</template>
			</v-data-table>
			<div class="add-member" @click="addMember()" v-ripple>
				<v-icon>mdi-plus</v-icon> {{ $t('add_member') }}
			</div>
		</popup>

		<popup v-if="group" v-model="settingsDialog" :width="500" icon="mdi-cog-outline">
			<template #title>
				<span>{{ $t('settings') }}</span>
			</template>
			<!-- <h4>{{ $t('group_name') }}</h4>
			{{ group.name }} -->
			<!--
			<input v-model="renameGroupName" type="text" @keyup.enter="renameGroup">
			<v-btn small>{{ $t('main.rename') }}</v-btn>
			-->
			<!-- <br><br> -->
			<h4>{{ $t('main_options') }}</h4>
			<v-checkbox v-model="group.setting_chat" :label="$t('setting_chat')" hide-details />
			<br>

			<h4>{{ $t('member_options') }}</h4>
			<!-- <v-checkbox v-model="group.setting_trophies" :label="$t('setting_trophies')" hide-details /> -->
			<v-checkbox v-model="group.setting_public_chat" :label="$t('setting_public_chat')" hide-details @change="updateSettingPublicChat" />
			<v-checkbox v-model="group.setting_buy_fights" :label="$t('setting_buy_fights')" hide-details @change="updateSettingBuyFights" />
			<v-checkbox v-model="group.setting_bank" :label="$t('setting_bank')" hide-details @change="updateSettingBank" />
			<v-checkbox v-model="group.setting_tournaments" :label="$t('setting_tournaments')" hide-details @change="updateSettingTournaments" />
			<v-checkbox v-model="group.setting_br" :label="$t('setting_br')" hide-details @change="updateSettingBr" />
		</popup>

		<popup v-if="group" v-model="weaponsDialog" :width="800">
			<template #icon>
				<img src="/image/icon/garden.png">
			</template>
			<template #title>
				{{ $t('weapons_of', [group.name]) }}
				<span class="weapon-count">[{{ group.weapons.length }}/{{ max_weapons }}]</span>
			</template>
			<div class="weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<rich-tooltip-item v-for="(weapon, i) in orderedWeapons" :key="i" v-slot="{ props }" :item="LeekWars.items[weapon]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" v-bind="props" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" draggable="false">
							<v-tooltip v-if="LeekWars.items[weapon].level > group.level">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[weapon].level]) }}
							</v-tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('main.weapons') }} ({{ farmer_weapons.length }})</h4>
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'leek'}" class="farmer-weapons" @dragover="dragOver" @drop="weaponsDrop('farmer', $event)">
					<rich-tooltip-item v-for="(weapon, i) in farmer_weapons" :key="i" v-slot="{ props }" :item="LeekWars.items[weapon]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedWeapon && draggedWeapon === weapon && draggedWeaponLocation === 'farmer', locked: LeekWars.items[weapon].level > group.level || (LeekWars.weapons[LeekWars.items[weapon].params].forgotten && hasForgottenWeapon) || group.weapons.find(w => w === weapon) }" :draggable="LeekWars.items[weapon].level <= group.level" class="weapon" v-bind="props" @dragstart="weaponDragStart('farmer', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="addWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</popup>

		<popup v-if="group" v-model="chipsDialog" :width="800">
			<template #icon>
				<v-icon>mdi-chip</v-icon>
			</template>
			<template #title>{{ $t('chips_of', [group.name]) }} <span class="chip-count">[{{ group.chips.length }}/{{ group.ram }}]</span></template>
			<div class="chips-dialog">
				<div :class="{dashed: draggedChip && draggedChipLocation === 'farmer'}" class="leek-chips" @dragover="dragOver" @drop="chipsDrop('leek', $event)">
					<rich-tooltip-item v-for="chip in orderedChips" :key="chip" v-slot="{ props }" :item="LeekWars.items[chip]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedChip && draggedChip === chip && draggedChipLocation === 'leek'}" class="chip" draggable="true" v-bind="props" @dragstart="chipDragStart('leek', chip, $event)" @dragend="chipDragEnd(chip)" @click="removeChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" draggable="false">
							<v-tooltip v-if="LeekWars.items[chip].level > group.level">
								<template #activator="{ props }">
									<v-icon v-bind="props" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[chip].level]) }}
							</v-tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('main.chips') }} ({{ farmer_chips.length }})</h4>
				<div :class="{dashed: draggedChip && draggedChipLocation === 'leek'}" class="farmer-chips" @dragover="dragOver" @drop="chipsDrop('farmer', $event)">
					<rich-tooltip-item v-for="chip in farmer_chips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[chip]" :bottom="true" :nodge="true">
						<div :quantity="chip.quantity" :class="{dragging: draggedChip && draggedChip === chip && draggedChipLocation === 'farmer', locked: CHIPS[chip].level > group.level || group.chips.find(c => c === chip) }" :draggable="CHIPS[chip].level <= group.level" class="chip" v-bind="props" @dragstart="chipDragStart('farmer', chip, $event)" @dragend="chipDragEnd(chip)" @click="addChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</popup>

		<popup v-if="group" v-model="deleteMemberDialog" :width="600">
			<template #icon>
				<v-icon>mdi-delete</v-icon>
			</template>
			<template #title>
				<span v-if="memberToDelete">{{ $t('delete_member_confirm_title', [memberToDelete.name]) }}</span>
			</template>
			<div v-if="memberToDelete">
				{{ $t('delete_member_confirm', [memberToDelete.name]) }}
			</div>
			<template #actions>
				<div v-ripple @click="deleteMemberDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="red" @click="removeMember()">{{ $t('main.delete') }}</div>
			</template>
		</popup>

		<capital-dialog ref="capitalDialog" v-model="capitalDialogOpened" :leek="characteristics" :total-capital="totalCapital" :restat="true" />

		<popup v-if="group" v-model="giveItemDialog" :width="800" class="give-item-dialog">
			<template #icon>
				<v-icon>mdi-gift-outline</v-icon>
			</template>
			<template #title>
				<div>{{ $t('give_item') }}</div>
			</template>

			<v-tabs v-model="giveItemTab" :key="itemCategories.length" class="tabs" grow :show-arrows="false">
				<v-tab v-for="(category, c) in itemCategories" :key="c" :value="'tab-' + c" class="tab">
					<v-icon>{{ category.icon }}</v-icon>&nbsp;
					{{ $t('main.' + category.name) }}
				</v-tab>
			</v-tabs>
			<v-window v-model="giveItemTab">
				<v-window-item :value="'tab-' + 0" class="content grid farmer-weapons weapons-popup">
					<rich-tooltip-item v-for="weapon of availableWeapons" :key="weapon.id" v-slot="{ props }" :item="LeekWars.items[LeekWars.weapons[weapon.id].item]" :bottom="true" :instant="true" :nodge="true">
						<div class="weapon" @click="giveItemConfirm(weapon.item)">
							<img :src="'/image/weapon/' + weapon.name + '.png'" v-bind="props">
						</div>
					</rich-tooltip-item>
				</v-window-item>
				<v-window-item :value="'tab-' + 1" class="content grid chips-popup farmer-chips">
					<rich-tooltip-item v-for="chip of availableChips" :key="chip.id" v-slot="{ props }" :item="LeekWars.items[LeekWars.chipTemplates[chip.template].item]" :bottom="true" :instant="true" :nodge="true">
						<div class="chip" @click="giveItemConfirm(chip.id)">
							<img :src="'/image/chip/' + chip.name + '.png'" v-bind="props">
						</div>
					</rich-tooltip-item>
				</v-window-item>
				<!-- <v-window-item :value="'tab-' + 2" class="content grid farmer-chips">

				</v-window-item> -->
			</v-window>

			<template #actions>
				<div v-ripple @click="giveItemDialog = false">{{ $t('main.cancel') }}</div>
			</template>
		</popup>

		<popup v-if="group" v-model="giveItemConfirmDialog" :width="600">
			<template #icon>
				<v-icon>mdi-gift-outline</v-icon>
			</template>
			<template #title>
				<div>{{ $t('give_item') }}</div>
			</template>
			<div class="give-item-confirm" v-if="itemToGive && giveItemTarget">
				<div class="item">
					<item :item="itemToGive" />
				</div>
				<i18n-t keypath="confirm_give_item">
					<template #member>
						<b>{{ giveItemTarget.name }}</b>
					</template>
				</i18n-t>
			</div>
			<template #actions>
				<div v-ripple @click="giveItemConfirmDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="giveItemFinal()">{{ $t('give_item') }}</div>
			</template>
		</popup>

		<popup v-if="group" v-model="giveMoneyDialog" :width="500" class="give-item-dialog">
			<template #icon>
				<v-icon>mdi-gift-outline</v-icon>
			</template>
			<template #title>
				<div>{{ $t('give_money', { member: giveMoneyTarget?.name || $t('everybody') }) }}</div>
			</template>

			<div class="flex" style="gap: 10px">
				<div class="column" style="flex: 1">
					<h4>Habs</h4>
					<div class="flex" style="justify-content: flex-start; gap: 6px; align-items: center;">
						<input type="number" v-model="giveMoneyAmount" placeholder="1000000" :min="0" :max="10000000" style="padding: 8px; flex: 1" />
						<span class="hab"></span>
					</div>
				</div>
				<div class="column" style="flex: 1">
					<h4>Combats</h4>
					<div class="flex" style="justify-content: flex-start; gap: 6px; align-items: center;">
						<input type="number" v-model="giveFightsAmount" placeholder="100" :min="0" :max="100" style="padding: 8px; flex: 1" />
						<v-icon>mdi-sword-cross</v-icon>
					</div>
				</div>
			</div>

			<template #actions>
				<div v-ripple @click="giveMoneyDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="green" @click="giveMoneyConfirm()">{{ $t('main.send') }}</div>
			</template>
		</popup>
	</div>
</template>

<script setup lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Member } from '@/model/farmer'
	import { Group } from '@/model/group'
	import { store } from '@/model/store'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import { Weapon, WeaponsData } from '@/model/weapon'
	import { ORDERED_CHIPS } from '@/model/sorted_chips'
	import { CHIPS } from '@/model/chips'
	import CapitalDialog from '../leek/capital-dialog.vue'
	import FightsHistory from '@/component/history/fights-history.vue'
	import TournamentsHistory from '@/component/history/tournaments-history.vue'
	import Item from '@/component/item.vue'
	import { computed, defineAsyncComponent, reactive, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRoute, useRouter } from 'vue-router'
	import { emitter } from '@/model/vue'

	const Chat = defineAsyncComponent(() => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`))

	defineOptions({ name: 'group', i18n: {}, mixins: [...mixins], components: { RichTooltipTeam, RichTooltipFarmer, CharacteristicTooltip, RichTooltipItem, CapitalDialog, FightsHistory, TournamentsHistory, Item } })

	const { t } = useI18n()
	const route = useRoute()
	const router = useRouter()

	const group = ref<Group | null>(null)
	const settingsDialog = ref(false)
	const renameGroupName = ref('')
	const equipmentEditing = ref(false)
	const weaponsDialog = ref(false)
	const draggedWeapon = ref<number | null>(null)
	const draggedWeaponLocation = ref<string | null>(null)
	const chipsDialog = ref(false)
	const draggedChip = ref<number | null>(null)
	const draggedChipLocation = ref<string | null>(null)
	const capitalDialogOpened = ref(false)
	const applyingEquipment = ref(false)
	const membersDialog = ref(false)
	const characteristics = reactive<{[key: string]: number}>({})
	const deleteMemberDialog = ref(false)
	const memberToDelete = ref<Member | null>(null)
	const giveItemDialog = ref(false)
	const giveItemTab = ref('tab-0')
	const giveItemConfirmDialog = ref(false)
	const itemToGive = ref<any>(null)
	const giveItemTarget = ref<Member | null>(null)
	const giveMoneyDialog = ref(false)
	const giveMoneyTarget = ref<Member | null>(null)
	const giveMoneyAmount = ref(0)
	const giveFightsAmount = ref(0)

	const headers = [
		{ title: 'Membre', value: 'name' },
		{ title: 'Équipe', value: 'team' },
		{ title: 'Niveau', value: 'total_level' },
		{ title: 'Combats', value: 'fights' },
		{ title: 'Restants', value: 'day_fight' },
		{ title: 'Victoires', value: 'wins' },
		{ title: 'Nuls', value: 'draws' },
		{ title: 'Défaites', value: 'defeats' },
		{ title: 'Talent', value: 'talent' },
		{ title: 'Combats test', value: 'test_fights' },
		{ title: 'Trophées', value: 'trophies' },
	]
	const headersSupervisor = [
		{ title: 'Membre', value: 'name' },
		{ title: 'Équipe', value: 'team' },
		{ title: 'Niveau', value: 'total_level' },
		{ title: 'Combats', value: 'fights' },
		{ title: 'Restants', value: 'day_fight' },
		{ title: 'Victoires', value: 'wins' },
		{ title: 'Nuls', value: 'draws' },
		{ title: 'Défaites', value: 'defeats' },
		{ title: 'Talent', value: 'talent' },
		{ title: 'Tests', value: 'test_fights' },
		{ title: 'Trophées', value: 'trophies' },
		{ title: 'Actions', value: 'give' },
	]

	const headersDialog = ref<any[]>([])
	const headersDialogEmails = [
		{ text: 'Membre', value: 'name' },
		{ text: 'Poireau', value: 'leek' },
		{ text: 'Email', value: 'mail' },
		{ text: 'Actions', value: 'actions', sortable: false },
	]

	const headersDialogPassword = [
		{ text: 'Membre', value: 'name' },
		{ text: 'Poireau', value: 'leek' },
		{ text: 'Mot de passe', value: 'password' },
		{ text: 'Actions', value: 'actions', sortable: false },
	]

	const itemCategories = [
		{name: 'weapons', icon: 'mdi-pistol'},
		{name: 'chips', icon: 'mdi-chip'},
	]

	const group_id = computed(() => route.params.id)
	const availableWeapons = computed(() => Object.values(LeekWars.weapons).filter(w => LeekWars.items[w.item].market))
	const availableChips = computed(() => Object.values(CHIPS).sort((a, b) => a.level - b.level).filter(w => LeekWars.items[w.id].market))

	LeekWars.get('groupe/get/' + group_id.value).then(g => {
		group.value = g
		headersDialog.value = g.use_passwords ? headersDialogPassword : headersDialogEmails
		characteristics['level'] = g.level
		characteristics['baseLife'] = 100 + (g.level - 1) * 3
		for (const charac of LeekWars.characteristics) {
			characteristics[charac] = g[charac]
		}
		for (const member of g.members) {
			member.give = {}
		}
		renameGroupName.value = g.name
		LeekWars.setTitle(g.name)
		emitter.emit('loaded')
	})

	function sendMessage(farmer: Member) {
		LeekWars.get('message/find-conversation/' + farmer.id).then(conversation => {
			store.commit('new-conversation', conversation)
			router.push('/chat/' + conversation.id)
		}).error(() => {
			router.push('/chat/new/' + farmer.id + '/' + farmer.name + '/' + farmer.avatar_changed)
		})
	}

	function renameGroup() {}

	function startBattleRoyale() {
		if (!group.value) { return }
		LeekWars.post('groupe/start-battle-royale', { group_id: group.value.id }).then(data => {
			router.push('/fight/' + data.fight)
		}).error(error => LeekWars.toast(t(error.error)))
	}

	function startTournament() {
		if (!group.value) { return }
		LeekWars.post('groupe/start-solo-tournament', { group_id: group.value.id }).then(data => {
			router.push('/tournament/' + data.tournament)
		}).error(error => LeekWars.toast(t(error.error)))
	}

	function startTeamTournament() {
		if (!group.value) { return }
		LeekWars.post('groupe/start-team-tournament', { group_id: group.value.id }).then(data => {
			router.push('/tournament/' + data.tournament)
		}).error(error => LeekWars.toast(t(error.error)))
	}

	function settingPut(setting: string, enabled: boolean) {
		if (!group.value) return
		LeekWars.put('groupe/setting-' + setting, { group_id: group.value.id, enabled })
	}

	function updateSettingChat() { settingPut('chat', group.value!.setting_chat) }
	function updateSettingBank() { settingPut('bank', group.value!.setting_bank) }
	function updateSettingPublicChat() { settingPut('public-chat', group.value!.setting_public_chat) }
	function updateSettingBuyFights() { settingPut('buy-fights', group.value!.setting_buy_fights) }
	function updateSettingTournaments() { settingPut('tournaments', group.value!.setting_tournaments) }
	function updateSettingBr() { settingPut('br', group.value!.setting_br) }
	function updateXpBlocked() { settingPut('xp-blocked', group.value!.setting_xp_blocked) }
	function updateEquipmentBlocked() { settingPut('equipment-blocked', group.value!.setting_equipment_blocked) }
	function updateNewLeek() { settingPut('new-leek', group.value!.setting_new_leek) }

	function dragOver(e: DragEvent) {
		e.preventDefault()
	}

	const orderedWeapons = computed(() => {
		if (!group.value) return []
		return [...group.value.weapons].sort((weaponA, weaponB) => {
			return LeekWars.items[weaponA].level - LeekWars.items[weaponB].level
		})
	})

	const farmer_weapons = computed(() => {
		return Object.values(LeekWars.weapons).sort((weaponA, weaponB) => {
			return LeekWars.items[weaponA.item].level - LeekWars.items[weaponB.item].level
		}).map(weapon => weapon.item)
	})

	const hasForgottenWeapon = computed(() => {
		if (!group.value) { return false }
		for (const weapon of group.value.weapons) {
			if (LeekWars.weapons[LeekWars.items[weapon].params].forgotten) { return true }
		}
		return false
	})

	function weaponDragStart(location: string, weapon: number, _e: DragEvent) {
		if (group.value && LeekWars.items[weapon].level > group.value.level) { return }
		const forgotten = LeekWars.weapons[LeekWars.items[weapon].params].forgotten
		if (location === 'farmer' && hasForgottenWeapon.value && forgotten) { return }
		draggedWeapon.value = weapon
		draggedWeaponLocation.value = location
	}

	function weaponDragEnd(_weapon: Weapon) {
		draggedWeapon.value = null
	}

	function addWeapon(weapon: number) {
		if (!group.value) { return }
		const template = LeekWars.items[weapon]
		if (group.value.weapons.length >= max_weapons.value) {
			return LeekWars.toast(t('error_max_weapon', [group.value.name]))
		}
		if (template.level > group.value.level) {
			return LeekWars.toast(t('error_under_required_level_weapon', [group.value.name]))
		}
		if (group.value.weapons.some((w) => w === template.id)) {
			return LeekWars.toast(t('error_weapon_already_equipped', [group.value.name]))
		}
		if (hasForgottenWeapon.value && LeekWars.weapons[LeekWars.items[weapon].params].forgotten) {
			return LeekWars.toast(t('error_weapon_two_forgotten', [group.value.name]))
		}
		group.value.weapons.push(weapon)
	}

	function removeWeapon(weapon: number) {
		if (!group.value) { return }
		group.value.weapons.splice(group.value.weapons.indexOf(weapon), 1)
	}

	function weaponsDrop(location: string, e: DragEvent) {
		if (!draggedWeapon.value) { return }
		if (location === 'farmer' && draggedWeaponLocation.value === 'leek') {
			removeWeapon(draggedWeapon.value)
		} else if (location === 'leek' && draggedWeaponLocation.value === 'farmer') {
			addWeapon(draggedWeapon.value)
		}
		draggedWeapon.value = null
		e.preventDefault()
		return false
	}

	const farmer_chips = computed(() => {
		return Object.values(LeekWars.chipTemplates).sort((a, b) => {
			return LeekWars.items[a.item].level - LeekWars.items[b.item].level
		}).map(chip => chip.item)
	})

	const orderedChips = computed(() => {
		if (!group.value) return []
		return [...group.value.chips].sort((chipA, chipB) => {
			return ORDERED_CHIPS[chipA] - ORDERED_CHIPS[chipB]
		})
	})

	function chipDragStart(location: string, chip: number, _e: DragEvent) {
		if (group.value && CHIPS[chip].level > group.value.level) { return }
		draggedChip.value = chip
		draggedChipLocation.value = location
	}

	function chipDragEnd(_chip: number) {
		draggedChip.value = null
	}

	function addChip(chip: number) {
		if (!group.value) { return }
		const template = CHIPS[chip]
		if (group.value.chips.length >= group.value.ram) {
			return LeekWars.toast(t('error_max_chip', [group.value.name]))
		}
		if (template.level > group.value.level) {
			return LeekWars.toast(t('error_under_required_level_chip', [group.value.name]))
		}
		if (group.value.chips.some((c) => c === template.id)) {
			return LeekWars.toast(t('error_chip_already_equipped', [group.value.name]))
		}
		group.value.chips.push(chip)
	}

	function removeChip(chip: number) {
		if (!group.value) { return }
		group.value.chips.splice(group.value.chips.indexOf(chip), 1)
	}

	function chipsDrop(location: string, e: DragEvent) {
		if (!draggedChip.value) { return }
		if (location === 'farmer' && draggedChipLocation.value === 'leek') {
			removeChip(draggedChip.value)
		} else if (location === 'leek' && draggedChipLocation.value === 'farmer') {
			addChip(draggedChip.value)
		}
		draggedChip.value = null
		e.preventDefault()
		return false
	}

	const totalCapital = computed(() => group.value ? 50 + (group.value.level - 1) * 5 + Math.floor(group.value.level / 100) * 45 + (group.value.level === 301 ? 95 : 0) : 0)

	function changeLevel(e: any) {
		if (group.value) {
			group.value.level = parseInt(e.target!.value)
			if (group.value.level < 1) group.value.level = 1
			if (group.value.level > 301) group.value.level = 301
			characteristics['level'] = group.value.level
			characteristics['baseLife'] = 100 + (group.value.level - 1) * 3
			if (characteristics.life < characteristics.baseLife) {
				characteristics['life'] = characteristics.baseLife
			}
		}
	}

	function saveEquipment() {
		if (group.value) {
			LeekWars.put('groupe/equipment', {
				group_id: group.value.id,
				level: group.value.level,
				characteristics: JSON.stringify(characteristics),
				weapons: JSON.stringify(group.value.weapons),
				chips: JSON.stringify(group.value.chips)
			}).then(() => {
				equipmentEditing.value = false
				LeekWars.toast(t('saved'))
			}).error(error => {
				LeekWars.toast(t(error.error, error.params))
			})
		}
	}

	const max_weapons = computed(() => {
		if (!group.value) { return 1 }
		if (group.value.level < 100) return 2
		if (group.value.level < 200) return 3
		return 4
	})

	function applyEquipment() {
		if (group.value && !applyingEquipment.value) {
			applyingEquipment.value = true
			LeekWars.post('groupe/apply-equipment', { group_id: group.value.id }).then(() => {
				applyingEquipment.value = false
				LeekWars.toast(t('applied'))
			}).error(error => {
				applyingEquipment.value = false
				LeekWars.toast(t(error.error))
			})
		}
	}

	function addMember() {
		if (!group.value) { return }
		LeekWars.post('groupe/create-member', { group_id: group.value.id }).then(member => {
			if (group.value) {
				group.value.members.push(member)
			}
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function removeMember() {
		if (!group.value || !memberToDelete.value) { return }
		LeekWars.delete('groupe/remove-member', { group_id: group.value.id, member_id: memberToDelete.value.id }).then(() => {
			if (group.value && memberToDelete.value) {
				group.value.members.splice(group.value.members.indexOf(memberToDelete.value), 1)
				deleteMemberDialog.value = false
			}
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function sendInvite(member: Member) {
		if (!group.value) { return }
		LeekWars.post('groupe/send-invite', { group_id: group.value.id, member_id: member.id }).then(() => {
			LeekWars.toast(t('invite_sent'))
		}).error(error => {
			LeekWars.toast(t(error.error))
		})
	}

	function updateMemberName(member: Member) {
		if (!group.value) { return }
		LeekWars.put('groupe/member-name', {
			group_id: group.value.id,
			member_id: member.id,
			name: member.name,
		}).then(() => {
			delete (member as any).name_error
		}).error(error => {
			delete (member as any).name_error
			;(member as any).name_error = error
		})
	}

	function updateMemberLeekName(member: Member) {
		if (!group.value) { return }
		LeekWars.put('groupe/member-leek-name', {
			group_id: group.value.id,
			member_id: member.id,
			leek_name: (member as any).leek,
		}).then(() => {
			delete (member as any).leek_error
		}).error(error => {
			delete (member as any).leek_error
			;(member as any).leek_error = error
		})
	}

	function updateMemberEmail(member: Member) {
		if (!group.value || !member.mail) { return }
		LeekWars.put('groupe/member-email', {
			group_id: group.value.id,
			member_id: member.id,
			email: member.mail
		}).then(() => {
			delete (member as any).mail_error
		}).error(error => {
			delete (member as any).mail_error
			;(member as any).mail_error = error
		})
	}

	function updateMemberPassword(member: Member) {
		if (!group.value || !(member as any).password) { return }
		LeekWars.put('groupe/member-password', {
			group_id: group.value.id,
			member_id: member.id,
			password: (member as any).password
		}).then(() => {
			delete (member as any).password_error
		}).error(error => {
			delete (member as any).password_error
			;(member as any).password_error = error
		})
	}

	function giveItem(member: Member) {
		giveItemDialog.value = true
		giveItemTarget.value = member
	}

	function giveItemConfirm(itemID: number) {
		itemToGive.value = LeekWars.items[itemID]
		giveItemConfirmDialog.value = true
	}

	function giveItemFinal() {
		if (!group.value || !giveItemTarget.value) { return }
		LeekWars.post('groupe/give-item', {
			group_id: group.value.id,
			member_id: giveItemTarget.value.id,
			item_id: itemToGive.value.id
		})
		giveItemConfirmDialog.value = false
		giveItemDialog.value = false
	}

	function giveMoney(member: Member) {
		giveMoneyDialog.value = true
		giveMoneyTarget.value = member
	}

	function giveMoneyConfirm() {
		if (!group.value) { return }
		if (giveMoneyTarget.value) {
			LeekWars.post('groupe/give-money-fights', {
				group_id: group.value.id,
				member_id: giveMoneyTarget.value!.id,
				amount: giveMoneyAmount.value,
				fights: giveFightsAmount.value,
			})
		} else {
			LeekWars.post('groupe/give-money-fights-all', {
				group_id: group.value.id,
				amount: giveMoneyAmount.value,
				fights: giveFightsAmount.value,
			})
		}
		giveMoneyDialog.value = false
		giveMoneyTarget.value = null
	}
</script>


<style lang="scss" scoped>
h4 {
	margin-bottom: 10px;
}
.member {
	padding: 5px;
	padding-right: 15px;
	display: inline-flex;
	gap: 10px;
	align-items: center;
	.avatar {
		width: 50px;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}
	.info {
		flex: 1;
	}
}
.chat {
	height: 300px;
}
input[type="text"], input[type="email"] {
	height: 28px;
	vertical-align: bottom;
	margin-right: 5px;
	&.error {
		border: 2px solid red;
	}
}
.members {
	display: flex;
	flex-direction: column;
	gap: 10px;
	.v-icon {
		opacity: 0.7;
		&:hover {
			opacity: 1;
		}
	}
	&:deep(th) {
		text-align: left;
	}
	&:deep(td), &:deep(th) {
		padding: 0 6px !important;
		height: 36px !important;
	}
	.name {
		justify-content: flex-start;
		gap: 6px;
		align-items: center;
		white-space: nowrap;
		span {
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
			max-width: 95px;
		}
	}
	.avatar, .emblem {
		width: 34px;
	}
}
.status {
	width: 15px;
}
.characteristics {
	max-width: 370px;
	.characteristic {
		width: 50%;
		padding: 5px 8px;
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
			border: 1px solid #0000;
		}
	}
	.characteristic:nth-child(4n+3),
	.characteristic:nth-child(4n+4) {
		background: var(--background-secondary);
	}
}
body.dark .characteristic.frequency img {
	filter: invert(1);
}
.equipment {
	gap: 15px;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	.section {
		flex: 1;
		h4 {
			margin-bottom: 0;
		}
		.title {
			display: flex;
			justify-content: space-between;
			margin-bottom: 10px;
			button {
				font-size: 20px;
				color: #555;
			}
		}
		.level {
			margin-bottom: 6px;
			display: flex;
			align-items: center;
			height: 26px;
			gap: 4px;
		}
	}
}
.weapon {
	text-align: center;
	position: relative;
}
.chip {
	display: inline-block;
	margin: 2px;
	position: relative;
	img {
		width: 47px;
		vertical-align: top;
	}
}
.weapon .alert, .chip .alert {
	position: absolute;
	bottom: -5px;
	right: -5px;
}
.button i {
	padding-right: 4px;
}
.controls {
	text-align: right;
	margin-top: 15px;
}
.v-input--switch {
	margin: 3px 0;
}
.leek-chips, .farmer-chips {
	min-height: 80px;
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
}
.chips-popup .chip {
	cursor: pointer;
	border: 1px solid var(--border);
	vertical-align: bottom;
	height: 52px;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 3px 0;
}
.leek-weapons, .farmer-weapons {
	min-height: 80px;
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
.alert {
	color: red;
	background: white;
	border-radius: 50%;
	padding: 1px;
	z-index: 1;
	font-size: 18px;
	vertical-align: bottom;
}
.small-loader {
	padding: 0;
}
.add-member {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	padding: 8px;
	gap: 5px;
	user-select: none;
}
.no-member {
	padding: 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
}
.actions.flex {
	gap: 15px;
}
div.error {
	color: red;
	font-size: 13px;
}
.give-item-confirm {
	display: flex;
	gap: 20px;
	align-items: center;
	.item {
		width: 100px;
		height: 100px;
		display: flex;
	}
}
.column {
	display: flex;
	flex-direction: column;
}

</style>