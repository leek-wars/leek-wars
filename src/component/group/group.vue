<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1 v-if="group">{{ group.name }}</h1>
			<h1 v-else>{{ $t('main.group') }}</h1>

			<!-- <div v-if="group && group.is_supervisor" class="tabs">
				<div class="tab action" icon="question_answer" @click="settingsDialog = true">
					<v-icon>mdi-settings-outline</v-icon>
					<span>{{ $t('settings') }}</span>
				</div>
			</div> -->
		</div>
		<panel class="first">
			<loader v-if="!group" />
			<div v-else>

				<h4>{{ $t('supervisor') }}</h4>
				<rich-tooltip-farmer :id="group.owner.id" v-slot="{ on }" :bottom="true">
					<!-- <div class="flex name" v-on="on" v-ripple>
						<avatar :farmer="item" />
						<span>{{ item.name }}</span>
						<img v-if="item.connected" class="status" src="/image/connected.png">
						<img v-else class="status" src="/image/disconnected.png">
					</div> -->
					<router-link :to="'/farmer/' + group.owner.id">
						<div class="card member" v-on="on" v-ripple>
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
					<tooltip :disabled="group.members.length >= 3">
						<template v-slot:activator="{ on }">
							<span v-on="on">
								<v-btn :disabled="group.members.length < 3" @click="startBattleRoyale"><v-icon>mdi-sword-cross</v-icon>&nbsp;{{ $t('start_br') }}</v-btn>
							</span>
						</template>
						{{ $t('3_members_min') }}
					</tooltip>
					<router-link v-if="group.tournament" :to="'/tournament/' + group.tournament">
						<v-btn color="primary"><v-icon>mdi-trophy</v-icon>&nbsp;{{ $t('see_tournament') }}</v-btn>
					</router-link>
					<tooltip v-else :disabled="group.members.length >= 4">
						<template v-slot:activator="{ on }">
							<span v-on="on">
								<v-btn :disabled="group.members.length < 4" @click="startTournament"><v-icon>mdi-trophy</v-icon>&nbsp;{{ $t('start_tournament') }}</v-btn>
							</span>
						</template>
						{{ $t('4_members_min') }}
					</tooltip>
				</div>
			</div>
		</panel>

		<panel v-if="group && group.setting_chat" :title="$t('main.chat')" toggle="group/chat" icon="mdi-chat-outline">
			<div slot="actions">
				<div v-if="!LeekWars.mobile && group && $store.state.chat[group.chat]" class="button flat" @click="LeekWars.addChat($store.state.chat[group.chat])">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
			</div>
			<chat :id="group.chat" slot="content" />
		</panel>


		<panel v-if="group" toggle="group/members" icon="mdi-account-group">
			<template slot="title">{{ $t('members') }} ({{ group.members.length }})</template>
			<div slot="actions">
				<div v-if="group.is_supervisor" class="button" @click="membersDialog = true">
					<v-icon>mdi-pencil</v-icon>
				</div>
			</div>
			<div slot="content" class="content members">
				<v-data-table
					:headers="headers"
					:items="group.members"
					hide-default-footer
    				:items-per-page="100"
					class="elevation-1 members">
					<div slot="no-data" class="no-member">
						<span>{{ $t('no_member') }}</span>
						<v-btn @click="membersDialog = true"><v-icon>mdi-plus</v-icon>&nbsp;{{ $t('add_member') }}</v-btn>
					</div>
					<template v-slot:item.name="{ item }">
						<!-- <router-link class="flex name" :to="'/farmer/' + item.id" v-ripple>
							<avatar :farmer="item" />
							<div>{{ item.name }}</div>
						</router-link> -->
						<router-link :to="'/farmer/' + item.id">
							<rich-tooltip-farmer :id="item.id" v-slot="{ on }" :bottom="true">
								<div class="flex name" v-on="on" v-ripple>
									<avatar :farmer="item" />
									<span>{{ item.name }}</span>
									<img v-if="item.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</template>
					<template v-slot:item.team="{ item }">
						<router-link v-if="item.team"  :to="'/team/' + item.team.id">
							<rich-tooltip-team :id="item.team.id" v-slot="{ on }" :bottom="true">
								<div class="flex name" v-on="on" v-ripple>
									<emblem :team="item.team" />
									<span>{{ item.team.name }}</span>
								</div>
							</rich-tooltip-team>
						</router-link>
					</template>
					<template v-slot:item.message="{ item }">
						<v-icon @click="sendMessage(item)">mdi-email-outline</v-icon>
					</template>
				</v-data-table>
			</div>
		</panel>

		<panel v-if="group" :title="$t('equipment')" icon="mdi-sword" toggle="group/equipment">
			<div slot="actions">
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
			</div>
			<div class="equipment">
				<div class="section">
					<div class="title">
						<h4>{{ $t('characteristic.characteristics') }}</h4>
						<v-icon v-if="equipmentEditing" @click="capitalDialog = true">mdi-pencil</v-icon>
					</div>

					<div class="level" v-if="equipmentEditing">
						<b>{{ $t('main.level') }}</b>
						<input type="number" v-model="group.level" @input="changeLevel" :min="1" :max="301" /> (1 - 301)
						<div class="spacer"></div>
						<b :style="{color: $refs.capitalDialog.capital < 0 ? 'red' : 'green'}">{{ $refs.capitalDialog.capital }} capital</b>
						<v-icon v-if="$refs.capitalDialog.capital < 0" class="card alert">mdi-alert-circle</v-icon>
					</div>
					<b v-else class="level">{{ $t('main.level_n', [group.level]) }}</b>
					<div class="card characteristics">
						<div v-for="c in LeekWars.characteristics_table" :key="c" class="characteristic">
							<characteristic-tooltip  v-slot="{ on }" :characteristic="c" :value="characteristics[c]" :leek="characteristics" :test="true">
								<img v-on="on" :src="'/image/charac/' + c + '.png'">
							</characteristic-tooltip>
							<span class="stat" :class="'color-' + c" v-html="characteristics[c]"></span>
						</div>
					</div>
				</div>
				<div class="section">
					<div class="title">
						<h4>{{ $t('main.weapons') }} ({{ group.weapons.length }}/{{ max_weapons }})
							<tooltip v-if="group.weapons.length > max_weapons">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_much_weapons') }}
							</tooltip>
						</h4>
						<v-icon v-if="equipmentEditing" @click="weaponsDialog = true">mdi-pencil</v-icon>
					</div>

					<rich-tooltip-item v-for="weapon in group.weapons" :key="weapon" v-slot="{ on }" :item="LeekWars.items[weapon]" :bottom="true">
						<div class="weapon" v-on="on">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" @click="setWeapon(weapon)">
							<tooltip v-if="LeekWars.items[weapon].level > group.level">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[weapon].level]) }}
							</tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<div class="section">
					<div class="title">
						<h4>{{ $t('main.chips') }} ({{ group.chips.length }}/{{ max_chips }})
							<tooltip v-if="group.chips.length > max_chips">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_much_chips') }}
							</tooltip>
						</h4>
						<v-icon v-if="equipmentEditing" @click="chipsDialog = true">mdi-pencil</v-icon>
					</div>

					<rich-tooltip-item v-for="chip in group.chips" :key="chip" v-slot="{ on }" :item="LeekWars.items[chip]" :bottom="true">
						<div class="chip" v-on="on">
							<img :src="'/image/' + LeekWars.items[chip].name.replace('_', '/') + '.png'">
							<tooltip v-if="LeekWars.items[chip].level > group.level">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[chip].level]) }}
							</tooltip>
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</panel>

		<div class="container large">
			<panel v-if="group && group.fights && group.fights.length > 0" :title="$t('main.fights')" icon="mdi-sword-cross">
				<!-- <template v-if="group" slot="actions">
					<router-link :to="'/leek/' + group.id + '/history'" class="button flat">
						<v-icon>mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template> -->
				<fights-history slot="content" :fights="group.fights" />
			</panel>
			<panel v-if="group && group.tournaments && group.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<tournaments-history slot="content" :tournaments="group.tournaments" :show-time="true" />
			</panel>
		</div>

		<div v-if="group && group.is_supervisor" class="container last">
			<panel :title="$t('settings')" icon="mdi-settings-outline">
				<v-switch v-model="group.setting_chat" :label="$t('setting_chat')" hide-details @change="updateSettingChat" />
			</panel>
			<panel :title="$t('member_options')" icon="mdi-settings-outline">
				<v-switch v-model="group.setting_public_chat" :label="$t('setting_public_chat')" hide-details @change="updateSettingPublicChat" /><br>
				<v-switch v-model="group.setting_buy_fights" :label="$t('setting_buy_fights')" hide-details @change="updateSettingBuyFights" /><br>
				<v-switch v-model="group.setting_bank" :label="$t('setting_bank')" hide-details @change="updateSettingBank" /><br>
				<v-switch v-model="group.setting_tournaments" :label="$t('setting_tournaments')" hide-details @change="updateSettingTournaments" /><br>
				<v-switch v-model="group.setting_br" :label="$t('setting_br')" hide-details @change="updateSettingBr" /><br>
				<v-switch v-model="group.setting_new_leek" hide-details :label="$t('new_leek')" @change="updateNewLeek" /><br>
				<v-switch v-model="group.setting_xp_blocked" hide-details :label="$t('xp_blocked')" @change="updateXpBlocked" /><br>
				<v-switch v-model="group.setting_equipment_blocked" hide-details :label="$t('equipment_blocked')" @change="updateEquipmentBlocked" /><br>
			</panel>
		</div>

		<popup v-if="group" v-model="membersDialog" :width="1000" :full="true">
			<v-icon slot="icon">mdi-account-group</v-icon>
			<template slot="title">
				{{ $t('members') }} ({{ group.members.length }})
			</template>
			<v-data-table
				:headers="headersDialog"
				:items="group.members"
				hide-default-footer
				:items-per-page="100"
				:no-data-text="$t('no_member')"
				class="elevation-1 members">
				<template v-slot:item.name="{ item }">
					<div class="flex name">
						<avatar :farmer="item" />
						<div>
							<input type="text" v-model="item.name" :class="{error: item.name_error}" @focusout="updateMemberName(item)">
							<div v-if="item.name_error" class="error">{{ $t('error_' + item.name_error.error, item.name_error.params) }}</div>
						</div>
					</div>
				</template>
				<template v-slot:item.leek="{ item }">
					<input type="text" v-model="item.leek" :class="{error: item.leek_error}" @focusout="updateMemberLeekName(item)">
					<div v-if="item.leek_error" class="error">{{ $t('error_' + item.leek_error.error, item.leek_error.params) }}</div>
				</template>
				<template v-slot:item.team="{ item }">
					<rich-tooltip-team :id="item.team.id" v-slot="{ on }" :bottom="true">
						<div class="flex name" v-on="on">
							<emblem :team="item.team" />
							<span>{{ item.team.name }}</span>
						</div>
					</rich-tooltip-team>
				</template>
				<template v-slot:item.mail="{ item }">
					<input type="email" v-model="item.mail" :class="{error: item.mail_error}" @focusout="updateMemberEmail(item)">
					<div v-if="item.mail_error" class="error">{{ $t('error_' + item.mail_error.error, item.mail_error.params) }}</div>
				</template>
				<template v-slot:item.actions="{ item }">
					<div class="flex actions">
						<tooltip>
							<template v-slot:activator="{ on }">
								<div v-on="on">
									<v-icon :disabled="!item.mail" @click="sendInvite(item)">mdi-email-outline</v-icon>
								</div>
							</template>
							{{ $t('send_invite') }}
						</tooltip>
						<tooltip>
							<template v-slot:activator="{ on }">
								<div v-on="on">
									<v-icon @click="memberToDelete = item; deleteMemberDialog = true">mdi-delete-outline</v-icon>
								</div>
							</template>
							{{ $t('remove_member') }}
						</tooltip>
					</div>
				</template>
			</v-data-table>
			<div class="add-member" @click="addMember()" v-ripple>
				<v-icon>mdi-plus</v-icon> {{ $t('add_member') }}
			</div>
		</popup>

		<popup v-if="group" v-model="settingsDialog" :width="500">
			<v-icon slot="icon">mdi-settings-outline</v-icon>
			<span slot="title">{{ $t('settings') }}</span>
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
			<img slot="icon" src="/image/icon/garden.png">
			<template slot="title">
				{{ $t('weapons_of', [group.name]) }}
				<span class="weapon-count">[{{ group.weapons.length }}/{{ group.max_weapons }}]</span>
			</template>
			<div class="weapons-popup">
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'farmer'}" class="leek-weapons" @dragover="dragOver" @drop="weaponsDrop('leek', $event)">
					<rich-tooltip-item v-for="(weapon, i) in orderedWeapons" :key="i" v-slot="{ on }" :item="LeekWars.items[weapon]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedWeapon && draggedWeapon.template === weapon.template && draggedWeaponLocation === 'leek'}" class="weapon" draggable="true" v-on="on" @dragstart="weaponDragStart('leek', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="removeWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" draggable="false">
							<tooltip v-if="LeekWars.items[weapon].level > group.level">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[weapon].level]) }}
							</tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('main.weapons') }} ({{ farmer_weapons.length }})</h4>
				<div :class="{dashed: draggedWeapon && draggedWeaponLocation === 'leek'}" class="farmer-weapons" @dragover="dragOver" @drop="weaponsDrop('farmer', $event)">
					<rich-tooltip-item v-for="(weapon, i) in farmer_weapons" :key="i" v-slot="{ on }" :item="LeekWars.items[weapon]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedWeapon && draggedWeapon === weapon && draggedWeaponLocation === 'farmer', locked: LeekWars.items[weapon].level > group.level || (LeekWars.weapons[LeekWars.items[weapon].params].forgotten && hasForgottenWeapon) || group.weapons.find(w => w === weapon) }" :draggable="LeekWars.items[weapon].level <= group.level" class="weapon" v-on="on" @dragstart="weaponDragStart('farmer', weapon, $event)" @dragend="weaponDragEnd(weapon)" @click="addWeapon(weapon)">
							<img :src="'/image/' + LeekWars.items[weapon].name.replace('_', '/') + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</popup>

		<popup v-if="group" v-model="chipsDialog" :width="800">
			<v-icon slot="icon">mdi-chip</v-icon>
			<template slot="title">{{ $t('chips_of', [group.name]) }} <span class="chip-count">[{{ group.chips.length }}/{{ group.max_chips }}]</span></template>
			<div class="chips-dialog">
				<div :class="{dashed: draggedChip && draggedChipLocation === 'farmer'}" class="leek-chips" @dragover="dragOver" @drop="chipsDrop('leek', $event)">
					<rich-tooltip-item v-for="chip in orderedChips" :key="chip" v-slot="{ on }" :item="LeekWars.items[chip]" :bottom="true" :nodge="true">
						<div :class="{dragging: draggedChip && draggedChip === chip && draggedChipLocation === 'leek'}" class="chip" draggable="true" v-on="on" @dragstart="chipDragStart('leek', chip, $event)" @dragend="chipDragEnd(chip)" @click="removeChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" draggable="false">
							<tooltip v-if="LeekWars.items[chip].level > group.level">
								<template v-slot:activator="{ on }">
									<v-icon v-on="on" class="card alert">mdi-alert-circle</v-icon>
								</template>
								{{ $t('too_high_level', [LeekWars.items[chip].level]) }}
							</tooltip>
						</div>
					</rich-tooltip-item>
				</div>
				<br>
				<h4>{{ $t('main.chips') }} ({{ farmer_chips.length }})</h4>
				<div :class="{dashed: draggedChip && draggedChipLocation === 'leek'}" class="farmer-chips" @dragover="dragOver" @drop="chipsDrop('farmer', $event)">
					<rich-tooltip-item v-for="chip in farmer_chips" :key="chip.id" v-slot="{ on }" :item="LeekWars.items[chip]" :bottom="true" :nodge="true">
						<div :quantity="chip.quantity" :class="{dragging: draggedChip && draggedChip === chip && draggedChipLocation === 'farmer', locked: CHIPS[chip].level > group.level || group.chips.find(c => c === chip) }" :draggable="CHIPS[chip].level <= group.level" class="chip" v-on="on" @dragstart="chipDragStart('farmer', chip, $event)" @dragend="chipDragEnd(chip)" @click="addChip(chip)">
							<img :src="'/image/chip/' + CHIPS[chip].name + '.png'" draggable="false">
						</div>
					</rich-tooltip-item>
				</div>
			</div>
		</popup>

		<popup v-if="group" v-model="deleteMemberDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span v-if="memberToDelete" slot="title">{{ $t('delete_member_confirm_title', [memberToDelete.name]) }}</span>
			<div v-if="memberToDelete">
				{{ $t('delete_member_confirm', [memberToDelete.name]) }}
			</div>
			<div slot="actions">
				<div v-ripple @click="deleteMemberDialog = false">{{ $t('main.cancel') }}</div>
				<div v-ripple class="red" @click="removeMember()">{{ $t('main.delete') }}</div>
			</div>
		</popup>

		<capital-dialog ref="capitalDialog" v-model="capitalDialog" :leek="characteristics" :total-capital="totalCapital" :restat="true" />
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Group } from '@/model/group'
	import { Farmer, Member } from '@/model/farmer'
	import { store } from '@/model/store'
	const ChatElement = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`)
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
	import { Weapon } from '@/model/weapon'
	import { ORDERED_CHIPS } from '@/model/sorted_chips'
	import { CHIPS } from '@/model/chips'
	import CapitalDialog from '../leek/capital-dialog.vue'
	import FightsHistory from '@/component/history/fights-history.vue'
	import TournamentsHistory from '@/component/history/tournaments-history.vue'

	@Component({ name: 'group', i18n: {}, mixins: [...mixins], components: {
		chat: ChatElement, RichTooltipTeam, RichTooltipFarmer, CharacteristicTooltip, RichTooltipItem, CapitalDialog, FightsHistory, TournamentsHistory
	}})
	export default class GroupPage extends Vue {

		group: Group | null = null
		settingsDialog: boolean = false
		renameGroupName: string = ''
		equipmentEditing: boolean = false
		weaponsDialog: boolean = false
		draggedWeapon: number | null = null
		draggedWeaponLocation: string | null = null
		chipsDialog: boolean = false
		draggedChip: number | null = null
		draggedChipLocation: string | null = null
		CHIPS = CHIPS
		capitalDialog: boolean = false
		applyingEquipment: boolean = false
		membersDialog: boolean = false
		characteristics: {[key: string]: number} = {}
		deleteMemberDialog: boolean = false
		memberToDelete: Member | null = null

		headers = [
          { text: 'Membre', value: 'name' },
          { text: 'Équipe', value: 'team' },
          { text: 'Niveau', value: 'total_level' },
          { text: 'Combats restants', value: 'day_fight' },
          { text: 'Combats', value: 'fights' },
          { text: 'Victoires', value: 'wins' },
          { text: 'Nuls', value: 'draws' },
          { text: 'Défaites', value: 'defeats' },
          { text: 'Ratio', value: 'ratio' },
          { text: 'Combats de test', value: 'test_fights' },
          { text: 'Trophées', value: 'trophies' },
        ]

		headersDialog = [
          { text: 'Membre', value: 'name' },
          { text: 'Poireau', value: 'leek' },
        //   { text: 'Équipe', value: 'team' },
		  { text: 'Email', value: 'mail' },
		  { text: 'Actions', value: 'actions', sortable: false },
        ]

		get group_id() {
			return this.$route.params.id
		}

		created() {
			LeekWars.get('groupe/get/' + this.group_id).then(group => {
				this.group = group
				Vue.set(this.characteristics, 'level', group.level)
				Vue.set(this.characteristics, 'baseLife', 100 + (group.level - 1) * 3)
				for (const charac of LeekWars.characteristics) {
					Vue.set(this.characteristics, charac, group[charac])
				}
				this.renameGroupName = group.name
				LeekWars.setTitle(group.name)
				this.$root.$emit('loaded')
			})
		}

		sendMessage(farmer: Member) {
			LeekWars.get('message/find-conversation/' + farmer.id).then(conversation => {
				store.commit('new-conversation', conversation)
				this.$router.push('/chat/' + conversation.id)
			}).error(() => {
				this.$router.push('/chat/new/' + farmer.id + '/' + farmer.name + '/' + farmer.avatar_changed)
			})
		}

		renameGroup() {

		}

		startBattleRoyale() {
			if (!this.group) { return }
			LeekWars.post('groupe/start-battle-royale', { group_id: this.group.id }).then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error.error)))
		}

		startTournament() {
			if (!this.group) { return }
			LeekWars.post('groupe/start-solo-tournament', { group_id: this.group.id }).then(data => {
				this.$router.push('/tournament/' + data.tournament)
			}).error(error => LeekWars.toast(this.$t(error.error)))
		}

		updateSettingChat() {
			if (this.group) {
				LeekWars.put('groupe/setting-chat', { group_id: this.group.id, enabled: this.group.setting_chat })
			}
		}

		updateSettingBank() {
			if (this.group) {
				LeekWars.put('groupe/setting-bank', { group_id: this.group.id, enabled: this.group.setting_bank })
			}
		}

		updateSettingPublicChat() {
			if (this.group) {
				LeekWars.put('groupe/setting-public-chat', { group_id: this.group.id, enabled: this.group.setting_public_chat })
			}
		}

		updateSettingBuyFights() {
			if (this.group) {
				LeekWars.put('groupe/setting-buy-fights', { group_id: this.group.id, enabled: this.group.setting_buy_fights })
			}
		}

		updateSettingTournaments() {
			if (this.group) {
				LeekWars.put('groupe/setting-tournaments', { group_id: this.group.id, enabled: this.group.setting_tournaments })
			}
		}

		updateSettingBr() {
			if (this.group) {
				LeekWars.put('groupe/setting-br', { group_id: this.group.id, enabled: this.group.setting_br })
			}
		}

		updateXpBlocked() {
			if (this.group) {
				LeekWars.put('groupe/setting-xp-blocked', { group_id: this.group.id, enabled: this.group.setting_xp_blocked })
			}
		}

		updateEquipmentBlocked() {
			if (this.group) {
				LeekWars.put('groupe/setting-equipment-blocked', { group_id: this.group.id, enabled: this.group.setting_equipment_blocked })
			}
		}

		updateNewLeek() {
			if (this.group) {
				LeekWars.put('groupe/setting-new-leek', { group_id: this.group.id, enabled: this.group.setting_new_leek })
			}
		}

		dragOver(e: DragEvent) {
			e.preventDefault()
		}

		get orderedWeapons() {
			if (!this.group) return []
			return [...this.group.weapons].sort((weaponA, weaponB) => {
				return LeekWars.items[weaponA].level - LeekWars.items[weaponB].level
			})
		}

		get farmer_weapons() {
			return Object.values(LeekWars.weapons).sort((weaponA, weaponB) => {
				return LeekWars.items[weaponA.item].level - LeekWars.items[weaponB.item].level
			}).map(weapon => weapon.item)
		}

		get hasForgottenWeapon() {
			if (!this.group) { return false }
			for (const weapon of this.group.weapons) {
				if (LeekWars.weapons[LeekWars.items[weapon].params].forgotten) { return true }
			}
			return false
		}

		weaponDragStart(location: string, weapon: number, e: DragEvent) {
			if (this.group && LeekWars.items[weapon].level > this.group.level) { return }
			const forgotten = LeekWars.weapons[LeekWars.items[weapon].params].forgotten
			if (location === 'farmer' && this.hasForgottenWeapon && forgotten) { return }
			this.draggedWeapon = weapon
			this.draggedWeaponLocation = location
		}

		weaponDragEnd(weapon: Weapon) {
			this.draggedWeapon = null
		}

		addWeapon(weapon: number) {
			if (!this.group) { return }
			const template = LeekWars.items[weapon]
			if (this.group.weapons.length >= this.group.max_weapons) {
				return LeekWars.toast(this.$i18n.t('error_max_weapon', [this.group.name]))
			}
			if (template.level > this.group.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_weapon', [this.group.name]))
			}
			if (this.group.weapons.some((w) => w === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_weapon_already_equipped', [this.group.name]))
			}
			if (this.hasForgottenWeapon && LeekWars.weapons[LeekWars.items[weapon].params].forgotten) {
				return LeekWars.toast(this.$i18n.t('error_weapon_two_forgotten', [this.group.name]))
			}
			this.group.weapons.push(weapon)
		}

		removeWeapon(weapon: number) {
			if (!this.group) { return }
			this.group.weapons.splice(this.group.weapons.indexOf(weapon), 1)
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

		get farmer_chips() {
			return Object.values(LeekWars.chipTemplates).sort((a, b) => {
				return LeekWars.items[a.item].level - LeekWars.items[b.item].level
			}).map(chip => chip.item)
		}

		get orderedChips() {
			if (!this.group) return []
			return [...this.group.chips].sort((chipA, chipB) => {
				return ORDERED_CHIPS[chipA] - ORDERED_CHIPS[chipB]
			})
		}

		chipDragStart(location: string, chip: number, e: DragEvent) {
			if (this.group && CHIPS[chip].level > this.group.level) { return }
			this.draggedChip = chip
			this.draggedChipLocation = location
		}

		chipDragEnd(chip: number) {
			this.draggedChip = null
		}

		addChip(chip: number) {
			if (!this.group) { return }
			const template = CHIPS[chip]
			if (this.group.chips.length >= this.group.max_chips) {
				return LeekWars.toast(this.$i18n.t('error_max_chip', [this.group.name]))
			}
			if (template.level > this.group.level) {
				return LeekWars.toast(this.$i18n.t('error_under_required_level_chip', [this.group.name]))
			}
			if (this.group.chips.some((c) => c === template.id)) {
				return LeekWars.toast(this.$i18n.t('error_chip_already_equipped', [this.group.name]))
			}
			this.group.chips.push(chip)
		}

		removeChip(chip: number) {
			if (!this.group) { return }
			this.group.chips.splice(this.group.chips.indexOf(chip), 1)
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

		get totalCapital() {
			return this.group ? 50 + (this.group.level - 1) * 5 + Math.floor(this.group.level / 100) * 45 + (this.group.level === 301 ? 95 : 0) : 0
		}

		changeLevel(e: any) {
			if (this.group) {
				this.group.level = parseInt(e.target!.value)
				if (this.group.level < 1) this.group.level = 1
				if (this.group.level > 301) this.group.level = 301
				Vue.set(this.characteristics, 'level', this.group.level)
				Vue.set(this.characteristics, 'baseLife', 100 + (this.group.level - 1) * 3)
				if (this.characteristics.life < this.characteristics.baseLife) {
					Vue.set(this.characteristics, 'life', this.characteristics.baseLife)
				}
			}
		}

		saveEquipment() {
			if (this.group) {
				LeekWars.put('groupe/equipment', {
					group_id: this.group.id,
					level: this.group.level,
					characteristics: JSON.stringify(this.characteristics),
					weapons: JSON.stringify(this.group.weapons),
					chips: JSON.stringify(this.group.chips)
				}).then(d => {
					this.equipmentEditing = false
					LeekWars.toast(this.$t('saved'))
				}).error(error => {
					LeekWars.toast(this.$t(error.error, error.params))
				})
			}
		}

		get max_weapons() {
			if (!this.group) { return 1 }
			if (this.group.level < 100) return 2;
			if (this.group.level < 200) return 3;
			return 4;
		}

		get max_chips() {
			if (!this.group) { return 1 }
			if (this.group.level < 50) return 12;
			if (this.group.level < 75) return 13;
			if (this.group.level < 100) return 14;
			if (this.group.level < 125) return 15;
			if (this.group.level < 150) return 16;
			if (this.group.level < 200) return 17;
			if (this.group.level < 250) return 18;
			if (this.group.level < 300) return 19;
			return 20;
		}

		applyEquipment() {
			if (this.group && !this.applyingEquipment) {
				this.applyingEquipment = true
				LeekWars.post('groupe/apply-equipment', { group_id: this.group.id }).then(d => {
					this.applyingEquipment = false
					LeekWars.toast(this.$t('applied'))
				}).error(error => {
					this.applyingEquipment = false
					LeekWars.toast(this.$t(error.error))
				})
			}
		}

		addMember() {
			if (!this.group) { return }
			LeekWars.post('groupe/create-member', { group_id: this.group.id }).then(member => {
				if (this.group) {
					this.group.members.push(member)
				}
			}).error(error => {
				LeekWars.toast(this.$t(error.error))
			})
		}

		removeMember() {
			if (!this.group || !this.memberToDelete) { return }
			LeekWars.delete('groupe/remove-member', { group_id: this.group.id, member_id: this.memberToDelete.id }).then(member => {
				if (this.group && this.memberToDelete) {
					this.group.members.splice(this.group.members.indexOf(this.memberToDelete), 1)
					this.deleteMemberDialog = false
				}
			}).error(error => {
				LeekWars.toast(this.$t(error.error))
			})
		}

		sendInvite(member: Member) {
			if (!this.group) { return }
			LeekWars.post('groupe/send-invite', { group_id: this.group.id, member_id: member.id }).then(member => {
				LeekWars.toast(this.$t('invite_sent'))
			}).error(error => {
				LeekWars.toast(this.$t(error.error))
			})
		}

		updateMemberName(member: Member) {
			if (!this.group) { return }
			LeekWars.put('groupe/member-name', {
				group_id: this.group.id,
				member_id: member.id,
				name: member.name,
			}).then(result => {
				Vue.delete(member, 'name_error')
			}).error(error => {
				Vue.delete(member, 'name_error')
				Vue.set(member, 'name_error', error)
			})
		}

		updateMemberLeekName(member: Member) {
			if (!this.group) { return }
			LeekWars.put('groupe/member-leek-name', {
				group_id: this.group.id,
				member_id: member.id,
				leek_name: member.leek,
			}).then(result => {
				Vue.delete(member, 'leek_error')
			}).error(error => {
				Vue.delete(member, 'leek_error')
				Vue.set(member, 'leek_error', error)
			})
		}

		updateMemberEmail(member: Member) {
			if (!this.group || !member.mail) { return }
			LeekWars.put('groupe/member-email', {
				group_id: this.group.id,
				member_id: member.id,
				email: member.mail
			}).then(result => {
				Vue.delete(member, 'mail_error')
			}).error(error => {
				Vue.delete(member, 'mail_error')
				Vue.set(member, 'mail_error', error)
			})
		}
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
.members {
	display: flex;
	flex-direction: column;
	gap: 10px;
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
	&::v-deep th {
		text-align: left;
	}
	&::v-deep td {
		padding: 0 10px !important;
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
		background: #eee;
	}
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
.leek-weapons, .farmer-weapons {
	min-height: 80px;
	display: grid;
	grid-gap: 5px;
	grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
</style>