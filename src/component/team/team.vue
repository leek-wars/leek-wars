<template>
	<div>
		<div class="page-header page-bar">

			<h1>{{ team ? team.name : '...' }}</h1>

			<div v-if="member && team" class="tabs">
				<router-link :to="'/forum/category-' + team.forum">
					<div :link="'/forum/category-' + team.forum" class="tab action" icon="question_answer">
						<img src="/image/icon/forum.png">
						<span>{{ $t('forum') }}</span>
					</div>
				</router-link>
				<tooltip>
					<template v-slot:activator="{ on }">
						<div class="tab" @click="updateOpened" v-on="on">
							<span>{{ $t('opened') }}</span>
							<v-switch v-model="team.opened" hide-details />
						</div>
					</template>
					{{ $t('recrutment_mode') }}
				</tooltip>
			</div>
		</div>

		<div class="grid container">
			<panel class="team-emblem first">
				<div v-if="team" slot="content" class="content">
					<template v-if="member">
						<tooltip>
							<template v-slot:activator="{ on }">
								<div class="emblem-input" v-on="on">
									<input ref="emblemInput" type="file" @change="changeEmblem">
									<emblem ref="emblem" :team="team" @click.native="$refs.emblemInput.click()" />
								</div>
							</template>
							{{ $t('change_emblem') }}
						</tooltip>
					</template>
					<emblem v-else :team="team" />
					<div v-if="team.description || member" class="description">
						<span class="guillemet">«</span>
						<span v-if="owner" ref="descriptionElement" :class="{empty: !team.description && !editingDescription}" class="team-status text" contenteditable @click="startEditingDescription" @blur="saveDescription" @keydown.enter.prevent="saveDescription">{{ team.description }}</span>
						<span v-else class="text team-status">{{ team.description }}</span>
						<span class="guillemet">»</span>
						<span class="edit-pen"></span>
					</div>
				</div>
			</panel>

			<panel>
				<h4 class="team-level">{{ $t('level_n', [team ? team.level : '...']) }}</h4>
				<tooltip v-if="team">
					<template v-slot:activator="{ on }">
						<div class="bar" v-on="on">
							<span :class="{blue: max_level}" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
						</div>
					</template>
					<template v-if="max_level">
						<b>{{ $t('max_level') }}</b>
						<br>
						{{ $t('xp', [LeekWars.formatNumber(team.xp)]) }}
					</template>
					<template v-else>
						<b>{{ $t('remaining_xp', [LeekWars.formatNumber(team.remaining_xp)]) }}</b>
						<br>
						{{ $t('xp', [LeekWars.formatNumber(team.xp) + " / " + LeekWars.formatNumber(team.up_xp)]) }}
					</template>
				</tooltip>

				<center>
					<br>
					<tooltip>
						<template v-slot:activator="{ on }">
							<talent :id="team ? team.id : ''" :talent="team ? team.talent : '...'" category="team" :on="on" />
						</template>
						{{ $t('talent') }}
					</tooltip>
				</center>

				<br>
				<tooltip v-if="team">
					<template v-slot:activator="{ on }">
						<table class="fights" v-on="on">
							<tr>
								<td class="big">{{ team.victories | number }}</td>
								<td class="big">{{ team.draws | number }}</td>
								<td class="big">{{ team.defeats | number }}</td>
							</tr>
							<tr>
								<td class="grey">{{ $t('victories') }}</td>
								<td class="grey">{{ $t('draws') }}</td>
								<td class="grey">{{ $t('defeats') }}</td>
							</tr>
						</table>
					</template>
					{{ $t('ratio', [team.ratio]) }}
				</tooltip>

				<center v-if="$store.state.farmer && !member && $store.state.farmer.team == null">
					<br>
					<v-btn v-if="team.candidacy" @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
					<v-btn v-if="team.opened && !team.candidacy" @click="sendCandidacy">{{ $t('join_team') }}</v-btn>
					<i v-else-if="!team.opened">{{ $t('closed_team') }}</i>
				</center>
			</panel>

			<panel class="description">
				<div v-if="team" slot="content" class="turret-wrapper">
					<div class="turret">
						<turret-image :level="team.level" :skin="1" :scale="0.32" @click.native="turretDialog = true" />

						<div class="infos">
							<h4>{{ $t('turret') }}</h4>
							<div class="level">{{ $t('level_n', [team.level]) }}</div>

							<ai v-if="team.turret_ai" :ai="team.turret_ai" :library="false" :class="{active: member}" @click.native="turretAiDialog = true" />
							<div v-else-if="member" class="no-ai" @click="turretAiDialog = true">{{ $t('no_ai') }}</div>
						</div>
					</div>
				</div>
			</panel>
		</div>

		<panel v-if="member" :title="$t('chat')" toggle="team/chat" icon="mdi-chat-outline">
			<div slot="actions">
				<div v-if="!LeekWars.mobile" class="button flat" @click="LeekWars.addChat('team', ChatType.TEAM, team.name)">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
			</div>
			<chat slot="content" channel="team" />
		</panel>

		<panel v-if="team && member && team.candidacies && team.candidacies.length > 0">
			<template slot="title">{{ $t('candidacies') }} ({{ team.candidacies.length }})</template>
			<div slot="content" class="content candidacies">
				<div v-for="candidacy in team.candidacies" :key="candidacy.id" class="farmer">
					<rich-tooltip-farmer :id="candidacy.farmer.id" v-slot="{ on }">
						<router-link :to="'/farmer/' + candidacy.farmer.id">
							<div v-on="on">
								<avatar :farmer="candidacy.farmer" />
								<div class="name">{{ candidacy.farmer.name }}</div>
							</div>
						</router-link>
					</rich-tooltip-farmer>
					<span class="accept" @click="acceptCandidacy(candidacy)">{{ $t('candidacy_accept') }}</span>
					<span class="reject" @click="rejectCandidacy(candidacy)">{{ $t('candidacy_refuse') }}</span>
				</div>
			</div>
		</panel>

		<panel v-if="team" icon="mdi-account-supervisor" :title="$t('farmers', [ team.member_count])">
			<template slot="actions">
				<div v-if="owner && !editMembers" class="button flat" @click="editMembers = true">
					<v-icon>mdi-pencil</v-icon>
				</div>
				<div v-if="owner && editMembers" class="button flat" @click="editMembers = false">
					<v-icon>mdi-check</v-icon>
				</div>
			</template>
			<loader v-if="!team" slot="content" />
			<div v-else slot="content" class="members">
				<div v-for="member in team.members" :key="member.id" class="farmer">
					<router-link :to="'/farmer/' + member.id">
						<rich-tooltip-farmer :id="member.id" v-slot="{ on }">
							<div v-on="on">
								<avatar :farmer="member" />
								<div class="name">
									<img v-if="member.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
									<tooltip v-if="member.grade == 'owner'">
										<template v-slot:activator="{ on }">
											<span v-on="on">★</span>
										</template>
										<div class="grade">{{ $t('owner') }}</div>
									</tooltip>
									<tooltip v-else-if="member.grade == 'captain'">
										<template v-slot:activator="{ on }">
											<span v-on="on">☆</span>
										</template>
										<div class="grade">{{ $t('captain') }}</div>
									</tooltip>
									<span :title="member.name">{{ member.name }}</span>
								</div>
								<talent :id="member.id" :talent="member.talent" category="farmer" />
							</div>
						</rich-tooltip-farmer>
					</router-link>
					<template v-if="member">
						<div class="logs" :class="{hidden: member.logs_level === 0, me: member.id === $store.state.farmer.id}" @click="logsDialog = (member.id === $store.state.farmer.id)">
							<v-icon v-if="member.logs_level > 0" class="activated">mdi-playlist-check</v-icon>
							<v-icon v-else>mdi-playlist-remove</v-icon>
							<span :title="$t('log_level_' + member.logs_level) + ' : ' + $t('log_level_' + member.logs_level + '_desc')"> {{ $t('log_level_' + member.logs_level) }} </span>
							<v-icon v-if="member.id === $store.state.farmer.id" class="edit">mdi-pencil</v-icon>
						</div>
					</template>
					<template v-if="owner && editMembers">
						<i v-if="member.grade == 'owner'" class="grade">{{ $t('owner') }}</i>
						<select v-else v-model="member.grade" class="level" @change="changeLevel(member, $event)">
							<option value="captain">{{ $t('captain') }}</option>
							<option value="member">{{ $t('member') }}</option>
						</select>
						<v-btn v-if="member.id !== $store.state.farmer.id" class="ban" small @click="banMemberStart(member)">
							<v-icon>mdi-hand-pointing-right</v-icon>
							{{ $t('ban') }}
						</v-btn>
					</template>
				</div>
			</div>
		</panel>

		<panel v-if="member" :title="$t('compositions')">
			<template v-if="captain" slot="actions">
				<div class="button flat" @click="createCompoDialog = true">{{ $t('create_composition') }}</div>
			</template>
			<div slot="content"></div>
		</panel>

		<div v-if="member && team && team.compositions && team.compositions.length == 0" class="no-compos">{{ $t('no_compositions') }}</div>

		<div v-if="member && team && team.compositions" class="compos">
			<panel v-for="composition in team.compositions" :key="composition.id" :class="{'in-tournament': composition.tournament.registered}" class="compo">
				<template slot="title">{{ composition.name }}</template>
				<template slot="actions">
					<div class="level-talent">
						<span class="level">{{ $t('level_n', [composition.total_level]) }}</span>
						<talent :id="team.id" :talent="composition.talent" category="team" />
					</div>
					<router-link v-if="composition.tournament.current" :to="'/tournament/' + composition.tournament.current" class="view-tournament button flat">{{ $t('see_tournament') }}</router-link>
					<tooltip v-if="captain">
						<template v-slot:activator="{ on }">
							<div class="button flat" v-on="on" @click="registerTournament(composition)">
								<v-icon>mdi-trophy</v-icon>
								<span v-if="!composition.tournament.registered" class="register-tournament">{{ $t('register_tournament') }}</span>
								<span v-else class="unregister-tournament">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
					</tooltip>
					<div v-if="captain" class="delete-compo button flat" @click="compositionToDelete = composition; deleteCompoDialog = true">
						<v-icon>mdi-close</v-icon>
					</div>
				</template>
				<div slot="content" :class="{dashed: draggedLeek != null && canDrop(composition)}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(composition, $event)">

					<div v-if="composition.leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

					<rich-tooltip-leek v-for="leek in composition.leeks" :id="leek.id" :key="leek.id" v-slot="{ on }">
						<div :class="{dragging: leek.dragging}" class="leek" draggable="true" v-on="on" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(composition, leek, $event)" @dragend="leeksDragend(leek, $event)">
							<leek-image :leek="leek" :scale="0.6" />
							<br>
							<div class="name">{{ leek.name }}</div>
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<div>{{ $t('main.level_n', [leek.level]) }}</div>
							<div class="fights">
								<img src="/image/icon/grey/garden.png">
								<span>{{ leek.team_fights }}</span>
							</div>
						</div>
					</rich-tooltip-leek>
				</div>
			</panel>
		</div>

		<panel v-if="member && team && team.unengaged_leeks" class="compo">
			<h2 slot="title" class="compo-title">{{ $t('unsorted_leeks') }}</h2>

			<div slot="content" :class="{dashed: draggedLeek != null}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(null, $event)">
				<div v-if="team.unengaged_leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

				<rich-tooltip-leek v-for="leek in team.unengaged_leeks" :id="leek.id" :key="leek.id" v-slot="{ on }">
					<div :class="{dragging: leek.dragging}" class="leek" draggable="true" v-on="on" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(null, leek, $event)" @dragend="leeksDragend(leek, $event)">
						<leek-image :leek="leek" :scale="0.6" />
						<br>
						<div class="name">{{ leek.name }} ({{ leek.level }})</div>
						<talent :id="leek.id" :talent="leek.talent" category="leek" />
						<div class="fights">
							<img src="/image/icon/grey/garden.png">
							<span>{{ leek.team_fights }}</span>
						</div>
					</div>
				</rich-tooltip-leek>
			</div>
		</panel>
		<panel v-else>
			<h2 v-if="team" slot="title">{{ $t('leeks', [team.leek_count]) }}</h2>
			<loader v-if="!team" slot="content" />
			<div v-else slot="content" class="leeks">
				<rich-tooltip-leek v-for="leek in team.leeks" :id="leek.id" :key="leek.id" v-slot="{ on }">
					<router-link :to="'/leek/' + leek.id" :leek="leek.id" class="leek">
						<div v-on="on">
							<leek-image :leek="leek" :scale="0.6" />
							<br>
							<div class="name">{{ leek.name }}</div>
							<talent :id="leek.id" :talent="leek.talent" category="leek" />
							<div>{{ $t('main.level_n', [leek.level]) }}</div>
						</div>
					</router-link>
				</rich-tooltip-leek>
			</div>
		</panel>

		<div class="container grid large">
			<panel v-if="team && team.fights.length > 0" :title="$t('history')" icon="mdi-sword-cross">
				<template slot="actions">
					<router-link :to="'/team/' + id + '/history'" class="button flat">
						<v-icon class="list-icon">mdi-history</v-icon>
						<span>{{ $t('history') }}</span>
					</router-link>
				</template>
				<fights-history v-if="team" slot="content" :fights="team.fights" />
			</panel>

			<panel v-if="team && team.tournaments.length > 0" :title="$t('main.tournaments')" icon="mdi-trophy">
				<tournaments-history v-if="team" slot="content" :tournaments="team.tournaments" />
			</panel>
		</div>

		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="member" class="tab" @click="quitTeamStart">{{ $t('quit_team') }}</div>
				<div v-if="owner" class="tab" @click="changeOwnerStart">{{ $t('change_owner') }}</div>
				<div v-if="owner" class="tab" @click="dissolveDialog = true">{{ $t('disolve_team') }}</div>
				<div v-if="!member && $store.state.connected">
					<div class="report-button tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span>{{ $t('report') }}</span>
					</div>
				</div>
			</div>
		</div>

		<report-dialog v-if="team" v-model="reportDialog" :team="team" :reasons="reasons" :parameter="team.id" />

		<popup v-model="createCompoDialog" :width="500">
			<v-icon slot="icon">mdi-plus</v-icon>
			<span slot="title">{{ $t('create_composition') }}</span>
			<h4>{{ $t('compo_name') }}</h4>
			<input v-model="createCompoName" type="text" @keyup.enter="createComposition">
			<div slot="actions">
				<div @click="createCompoDialog = false">{{ $t('compo_cancel') }}</div>
				<div class="green" @click="createComposition">{{ $t('compo_create') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="deleteCompoDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span v-if="compositionToDelete" slot="title">{{ $t('delete_compo_confirm_title', [compositionToDelete.name]) }}</span>
			<div v-if="compositionToDelete">
				{{ $t('delete_compo_confirm', [compositionToDelete.name]) }}
			</div>
			<div slot="actions">
				<div @click="deleteCompoDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="red" @click="deleteComposition(compositionToDelete)">{{ $t('delete_confirm') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="quitTeamDialog" :width="500">
			<v-icon slot="icon">mdi-exit</v-icon>
			<span slot="title">{{ $t('quit_team_confirm_title', [team.name]) }}</span>
			{{ $t('quit_team_confirm') }}
			<div slot="actions">
				<div @click="quitTeamDialog = false">{{ $t('quit_cancel') }}</div>
				<div class="red" @click="quitTeam">{{ $t('quit_confirm') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="dissolveDialog" :width="500">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('disolve_confirm_title', [team.name]) }}</span>
			{{ $t('disolve_confirm') }}
			<div slot="actions">
				<div @click="dissolveDialog = false">{{ $t('disolve_cancel') }}</div>
				<div class="red" @click="dissolveTeam">{{ $t('disolve_disolve') }}</div>
			</div>
		</popup>

		<popup v-if="banMemberTarget" v-model="banDialog" :width="500">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('ban_confirm_title', [banMemberTarget.name]) }}</span>
			{{ $t('ban_confirm', [banMemberTarget.name]) }}
			<div slot="actions">
				<div @click="banDialog = false">{{ $t('ban_cancel') }}</div>
				<div class="red" @click="banMember"><v-icon>mdi-hand-pointing-right</v-icon>{{ $t('ban_ban') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="changeOwnerDialog" :width="650">
			<v-icon slot="icon">mdi-account-switch</v-icon>
			<span slot="title">{{ $t('change_owner_confirm_title') }}</span>
			<div class="change_owner_popup">
				{{ $t('change_owner_select') }}
				<br>
				<rich-tooltip-farmer v-for="member in team.members" :id="member.id" :key="member.id" v-slot="{ on }">
					<div :class="{selected: member === changeOwnerSelected}" class="farmer" v-on="on" @click="changeOwnerSelected = member">
						<avatar :farmer="member" />
						<div class="name">
							<tooltip v-if="member.grade === 'owner'">
								<template v-slot:activator="{ on }">
									<span v-on="on">★</span>
								</template>
								{{ $t('owner') }}
							</tooltip>
							<tooltip v-else-if="member.grade === 'captain'">
								<template v-slot:activator="{ on }">
									<span v-on="on">☆</span>
								</template>
								{{ $t('captain') }}
							</tooltip>
							{{ member.name }}
						</div>
					</div>
				</rich-tooltip-farmer>
			</div>
			<div slot="actions">
				<div @click="changeOwnerDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div class="green" @click="changeOwnerSelect(changeOwnerSelected)">{{ $t('change_owner_change') }}</div>
			</div>
		</popup>

		<popup v-if="changeOwnerSelected" v-model="changeOwnerConfirmDialog" :width="500">
			<v-icon slot="icon">mdi-account-switch</v-icon>
			<span slot="title">{{ $t('change_owner_confirm_title') }}</span>
			<i18n path="change_owner_confirm">
				<b slot="farmer">{{ changeOwnerSelected.name }}</b>
			</i18n>
			<br><br>
			{{ $t('enter_password_to_confirm') }}
			<br><br>
			<input v-model="changeOwnerPassword" type="password">
			<div slot="actions">
				<div @click="changeOwnerConfirmDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div class="green" @click="changeOwner">{{ $t('change_owner_change') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="turretDialog" :width="600">
			<v-icon slot="icon">mdi-information-outline</v-icon>
			<span slot="title">{{ $t('turret') }} [{{ $t('level_n', [team.level]) }}]</span>
			<div class="turret-dialog">
				<turret-image :level="team.level" :skin="1" :scale="0.32" />
				<div class="infos">
					<h4>{{ $t('characteristic.characteristics') }}</h4>
					<div class="card characteristics">
						<characteristic-tooltip v-for="c in LeekWars.characteristics_table" :key="c" v-slot="{ on }" :characteristic="c" :value="turret[c]" :leek="turret" :test="true">
							<div class="characteristic" v-on="on">
								<img :src="'/image/charac/' + c + '.png'">
								<span class="stat" :class="'color-' + c">{{ turret[c] }}</span>
							</div>
						</characteristic-tooltip>
					</div>
					<br>

					<h4>{{ $t('main.chips') }}</h4>
					<div class="chips">
						<rich-tooltip-chip v-for="chip in [4, 23, 20, 1, 15, 92, 97, 100]" :key="chip" v-slot="{ on }" :chip="LeekWars.chips[chip]" :bottom="true" :instant="true">
							<img :src="'/image/chip/small/' + LeekWars.chips[chip].name + '.png'" class="chip" v-on="on">
						</rich-tooltip-chip>
					</div>
				</div>
			</div>
		</popup>

		<popup v-if="team && member" v-model="turretAiDialog" :width="870">
			<v-icon slot="icon">mdi-code-braces</v-icon>
			<span slot="title">{{ $t('fight.turret') }} [{{ $t('level_n', [team.level]) }}]</span>
			<div class="turret-ai-dialog">
				<div class="farmer-ais">
					<ai v-for="ai in $store.state.farmer.ais" v-if="!team.turret_ai || ai.id !== team.turret_ai.id" :key="ai.id" :ai="ai" :library="true" @click.native="selectAI(ai)" />
				</div>
			</div>
		</popup>

		<popup v-if="team && member" v-model="logsDialog" :width="600">
			<v-icon slot="icon">mdi-playlist-check</v-icon>
			<span slot="title">{{ $t('log_change') }}</span>
			<div>{{ $t('log_change_text') }}</div>
			<br>
			<v-radio-group v-model="my_member.logs_level" hide-details>
				<v-radio :label="$t('log_level_0') + ' : ' + $t('log_level_0_desc')" />
				<v-radio :label="$t('log_level_1') + ' : ' + $t('log_level_1_desc')" />
				<v-radio :label="$t('log_level_2') + ' : ' + $t('log_level_2_desc')" />
			</v-radio-group>
		</popup>
	</div>
</template>

<script lang="ts">
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { SocketMessage } from '@/model/socket'
	import { Composition, Team, TeamMember } from '@/model/team'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'team', i18n: {}, mixins, components: { CharacteristicTooltip }})
	export default class TeamPage extends Vue {
		ChatType = ChatType
		team: Team | null = null
		captain: boolean = false
		owner: boolean = false
		reportDialog: boolean = false
		reasons = [Warning.INCORRECT_EMBLEM, Warning.INCORRECT_TEAM_NAME, Warning.INCORRECT_TEAM_DESCRIPTION]
		createCompoDialog: boolean = false
		createCompoName: string = ''
		deleteCompoDialog: boolean = false
		compositionToDelete: Composition | null = null
		banDialog: boolean = false
		banMemberTarget: Farmer | null = null
		quitTeamDialog: boolean = false
		dissolveDialog: boolean = false
		changeOwnerDialog: boolean = false
		changeOwnerConfirmDialog: boolean = false
		changeOwnerSelected: TeamMember | null = null
		changeOwnerPassword: string = ''
		editingDescription: boolean = false
		draggedLeek: Leek | null = null
		draggedLeekComposition: Composition | null = null
		turretDialog: boolean = false
		turretAiDialog: boolean = false
		logsDialog: boolean = false
		editMembers: boolean = false
		logsLevel: number = 0

		get id() { return 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : (this.$store.state.farmer && this.$store.state.farmer.team !== null ? this.$store.state.farmer.team.id : null) }
		get max_level() { return this.team && this.team.level === 100 }
		get xp_bar_width() { return this.team ? this.team.level === 100 ? 100 : Math.floor(100 * (this.team.xp - this.team.down_xp) / (this.team.up_xp - this.team.down_xp)) : 0 }
		get member() { return !this.$route.params.id || (this.team && this.$store.state.farmer && this.$store.state.farmer.team !== null && this.team.id === this.$store.state.farmer.team.id) }
		get my_member() { return this.member ? this.team!.membersById[this.$store.state.farmer.id] : null }

		get turret() {
			if (!this.team) { return {} }
			const team_ratio = 1 + (this.team.level / 100)
			const max_life = 1000 + Math.round((6000 - 500) * team_ratio)
			const characteristics_base_1000 = 100 + Math.round(950 * team_ratio)
			const characteristics_base_2000 = 200 + Math.round(1900 * team_ratio)
			const characteristics_base_500 = 50 + Math.round(475 * team_ratio)
			return {
				life: 1000 + " à " + max_life,
				strength: 200 + " à " + characteristics_base_2000,
				agility: 50 + " à " + characteristics_base_500,
				resistance: 50 + " à " + characteristics_base_500,
				science: 50 + " à " + characteristics_base_500,
				wisdom: 100 + " à " + characteristics_base_1000,
				magic: 100 + " à " + characteristics_base_1000,
				frequency: 111,
				tp: Math.floor(12 * team_ratio),
				mp: 0
			}
		}

		@Watch('id', {immediate: true})
		update() {
			if (this.id === null) { return }
			let request = 'team/get/' + this.id
			if (this.$store.state.farmer) {
				if (this.$store.state.farmer.team !== null && this.$store.state.farmer.team.id === this.id) {
					request = 'team/get-private/' + this.id
				} else {
					request = 'team/get-connected/' + this.id
				}
			}
			LeekWars.get(request).then(team => {
				this.team = team
				if (!this.team) {
					return
				}
				this.team.membersById = {}
				for (const member of this.team.members) {
					this.team.membersById[member.id] = member
				}
				const teamCaptain = this.member && ['captain', 'owner'].indexOf(this.team.membersById[this.$store.state.farmer.id].grade) !== -1
				this.captain = teamCaptain
				this.owner = this.member && this.team.membersById[this.$store.state.farmer.id].grade === 'owner'

				this.team.compositionsById = {}
				if (this.team.compositions) {
					for (const composition of this.team.compositions) {
						this.team.compositionsById[composition.id] = composition
						for (const leek of composition.leeks) {
							Vue.set(leek, 'dragging', false)
						}
					}
					for (const leek of this.team.unengaged_leeks) {
						Vue.set(leek, 'dragging', false)
					}
				}
				this.captain = teamCaptain
				LeekWars.setTitle(this.team.name)
				LeekWars.setSubTitle(this.$t('main.n_farmers', [team.members.length]) + " • " + this.$t('main.n_leeks', [team.leek_count]))
				if (this.member) {
					this.logsLevel = this.my_member!.logs_level
					LeekWars.setActions([
						{icon: 'mdi-chat-outline', click: () => this.$router.push('/forum/category-' + team.forum)}
					])
				}
				this.$root.$emit('loaded')
			})
		}

		changeEmblem(e: Event) {
			if (!e || !e.target || !this.team) { return }
			const input = e.target as HTMLInputElement
			if (!input || !input.files) { return }
			const file = input.files[0]

			if (!LeekWars.uploadCheck(file)) { return }

			LeekWars.fileToImage(file, (this.$refs.emblem as Vue).$el as Element)

			const formdata = new FormData()
			formdata.append('team_id', '' + this.team.id)
			formdata.append('emblem', file)

			LeekWars.toast(this.$t('uploading_emblem') as string)

			LeekWars.post('team/set-emblem', formdata).then(data => {
				if (this.team) {
					LeekWars.toast(this.$t('upload_success') as string)
					this.team.emblem_changed = LeekWars.time
					this.$store.commit('update-emblem')
				}
			}).error(error => {
				LeekWars.toast(this.$t('upload_failed', [error.error]) as string)
			})
		}

		createComposition() {
			LeekWars.post('team/create-composition', {composition_name: this.createCompoName}).then(data => {
				if (this.team) {
					if (!data.id) {
						data.id = Math.floor(Math.random() * 100000)
					}
					const compo = {
						id: data.id,
						name: this.createCompoName,
						leeks: [],
						talent: 1000,
						total_level: 0,
						tournament: {current: null, registered: false},
						captain: this.captain,
						fights: 10
					} as Composition
					this.team.compositions.push(compo)
					this.team.compositionsById[compo.id] = compo
					this.createCompoDialog = false
				}
			})
			.error(error => LeekWars.toast(this.$t('error_' + error.error, error.params)))
		}

		deleteComposition(composition: Composition) {
			LeekWars.delete('team/delete-composition', {composition_id: composition.id}).then(data => {
				if (this.team) {
					LeekWars.toast(this.$i18n.t('compo_deleted', [composition.name]))
					// On transfère tous les leeks dans les leeks non engagés
					for (const leek of composition.leeks) {
						this.team.unengaged_leeks.push(leek)
					}
					this.team.compositions.splice(this.team.compositions.indexOf(composition))
					this.deleteCompoDialog = false
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		quitTeamStart() {
			if (this.owner) {
				LeekWars.toast(this.$i18n.t('cant_quit_owner'))
			} else {
				this.quitTeamDialog = true
			}
		}

		quitTeam () {
			LeekWars.post('team/quit').then(data => {
				this.quitTeamDialog = false
				LeekWars.toast(this.$i18n.t('you_left_team'))
				this.$router.push('/farmer')
			}).error(error => {
				this.quitTeamDialog = false
				LeekWars.toast(error)
			})
		}

		dissolveTeam() {
			LeekWars.post('team/dissolve').then(data => {
				this.dissolveDialog = false
				LeekWars.toast(this.$i18n.t('team_have_been_disolved'))
				this.$store.commit('dissolve-team')
				this.$router.push('/farmer')
			}).error(error => {
				LeekWars.toast(this.$i18n.t(error.error))
			})
		}

		registerTournament(composition: Composition) {
			if (composition.tournament.registered) {
				LeekWars.post('team/unregister-tournament', {composition_id: composition.id})
				composition.tournament.registered = false
			} else {
				if (composition.leeks.length < 4) {
					LeekWars.toast(this.$i18n.t('compo_must_contain_4_leeks'))
					return
				}
				LeekWars.post('team/register-tournament', {composition_id: composition.id})
				composition.tournament.registered = true
			}
		}

		banMemberStart(member: Farmer) {
			this.banMemberTarget = member
			this.banDialog = true
		}
		banMember() {
			if (this.banMemberTarget == null) { return }
			LeekWars.post('team/ban', {farmer_id: this.banMemberTarget.id}).then(data => {
				LeekWars.toast(this.$i18n.t('farmer_banned'))
				this.banDialog = false
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		updateOpened() {
			if (this.team) {
				this.team.opened = !this.team.opened
				LeekWars.post('team/set-opened', {opened: this.team.opened})
			}
		}

		startEditingDescription() {
			if (!this.team) { return }
			this.editingDescription = true
			if (!this.team.description) {
				(this.$refs.descriptionElement as HTMLElement).innerText = ''
			}
		}

		saveDescription() {
			if (!this.team) { return }
			this.editingDescription = false
			;(this.$refs.descriptionElement as HTMLElement).blur()
			this.team.description = '' + (this.$refs.descriptionElement as HTMLElement).textContent
			LeekWars.put('team/change-description', {team_id: this.team.id, description: this.team.description})
			if (!this.team.description) {
				(this.$refs.descriptionElement as HTMLElement).innerText = ''
			}
		}

		acceptCandidacy(candidacy: any) {
			LeekWars.post('team/accept-candidacy', {candidacy_id: candidacy.id}).then(data => {
				LeekWars.toast(this.$i18n.t('farmer_accepted'))
				this.update()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		rejectCandidacy(candidacy: any) {
			LeekWars.post('team/reject-candidacy', {candidacy_id: candidacy.id}).then(data => {
				LeekWars.toast(this.$i18n.t('farmer_refused'))
				this.update()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		sendCandidacy() {
			if (!this.team) { return }
			LeekWars.post('team/send-candidacy', {team_id: this.team.id}).then(data => {
				if (this.team) {
					LeekWars.toast(this.$i18n.t('candidacy_sent'))
					this.team.candidacy = true
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		cancelCandidacy() {
			if (!this.team) { return }
			LeekWars.post('team/cancel-candidacy-for-team', {team_id: this.team.id}).then(data => {
				if (this.team) {
					LeekWars.toast(this.$i18n.t('candidacy_cancelled'))
					this.team.candidacy = false
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		changeLevel(member: TeamMember) {
			if (!this.team) { return }
			LeekWars.post('team/change-member-grade', {member_id: member.id, new_grade: member.grade})
		}
		changeOwnerStart() {
			if (!this.team) { return }
			this.changeOwnerDialog = true
			this.changeOwnerSelected = this.team.members.find((m) => m.grade === 'owner') as TeamMember
		}
		changeOwnerSelect() {
			if (!this.team) { return }
			this.changeOwnerConfirmDialog = true
		}
		changeOwner() {
			if (!this.team || !this.changeOwnerSelected) { return }
			LeekWars.post('team/change-owner', {new_owner: this.changeOwnerSelected.id, password: this.changeOwnerPassword}).then(data => {
				LeekWars.toast(this.$i18n.t('owner_has_been_changed'))
				this.changeOwnerConfirmDialog = false
				this.changeOwnerDialog = false
				this.update()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		moveLeek(leek: Leek, oldCompo: Composition | null, newCompo: Composition) {
			if (!this.team || (newCompo && !this.canDrop(newCompo))) { return }
			if (oldCompo) {
				oldCompo.leeks.splice(oldCompo.leeks.indexOf(leek), 1)
			} else {
				this.team.unengaged_leeks.splice(this.team.unengaged_leeks.indexOf(leek), 1)
			}
			if (newCompo) {
				newCompo.leeks.push(leek)
			} else {
				this.team.unengaged_leeks.push(leek)
			}
			const newCompositionID = newCompo ? newCompo.id : -1
			LeekWars.post('team/move-leek', {leek_id: leek.id, to: newCompositionID}).error(error => LeekWars.toast(error))
		}
		leeksDragstart(composition: Composition, leek: Leek, e: DragEvent) {
			if (composition && composition.tournament.registered) { return false }
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.draggedLeek = leek
			this.draggedLeekComposition = composition
			leek.dragging = true
			return true
		}
		leeksDragend(leek: Leek, e: Event) {
			leek.dragging = false
			this.draggedLeek = null
			e.preventDefault()
			return false
		}
		leeksDrop(composition: Composition, e: Event) {
			if (this.draggedLeek) {
				this.moveLeek(this.draggedLeek, this.draggedLeekComposition, composition)
				this.draggedLeek.dragging = false
				this.draggedLeek = null
			}
			e.preventDefault()
			return false
		}
		leeksDragover(e: Event) {
			e.preventDefault()
			e.stopPropagation()
			return false
		}
		canDrop(composition: Composition) {
			return !composition.tournament.registered && composition.leeks.length < 6 && this.draggedLeekComposition !== composition
		}
		selectAI(ai: any) {
			LeekWars.post('team/set-turret-ai', {ai: ai.id}).then(r => {
				this.team!.turret_ai = ai
			}).error(error => LeekWars.toast(error))
			this.turretAiDialog = false
		}
	}
</script>

<style lang="scss" scoped>
	.team-level {
		font-size: 20px;
	}
	.v-input--switch {
		margin-left: 8px;
	}
	.team-emblem {
		text-align: center;
	}
	.emblem {
		width: 200px;
		height: 200px;
	}
	.emblem-input {
		cursor: pointer;
		input {
			display: none;
		}
	}
	.description {
		vertical-align: bottom;
		padding-top: 8px;
		.text {
			font-size: 20px;
			color: #555;
			font-weight: 300;
		}
	}
	.guillemet {
		font-size: 34px;
		line-height: 22px;
		vertical-align: top;
		color: #bbb;
		font-weight: 300;
	}
	.team-status {
		padding: 0 5px;
	}
	.team-status.empty {
		font-style: italic;
		color: #999;
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
	}
	.xp-bar.blue {
		background: #008fbb;
	}
	.fights {
		width: 100%;
		border-collapse: collapse;
		text-align: center;
		.big {
			font-size: 22px;
			font-weight: 300;
			color: #555;
		}
		.grey {
			color: #999;
		}
		tr > td:nth-child(n+2) {
			border-left: 2px solid #ddd;
		}
	}
	.candidacies .farmer {
		text-align: center;
		display: inline-block;
		.avatar {
			width: 100px;
			height: 100px;
		}
		.accept {
			color: green;
			cursor: pointer;
			margin: 5px;
		}
		.reject {
			color: red;
			cursor: pointer;
			margin: 5px;
		}
	}
	.members {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
		grid-gap: 10px;
		padding: 10px;
		.grade {
			margin: 4px 0;
			display: block;
		}
		.level {
			margin: 4px 0;
		}
		.logs {
			font-size: 14px;
			margin-top: 3px;
			padding-top: 2px;
			border-radius: 3px;
			&.me {
				cursor: pointer;
				&:hover {
					background: #ddd;
				}
			}
			&.hidden {
				color: #777;
			}
			.v-icon {
				font-size: 22px;
			}
			.activated {
				color: green;
			}
			.edit {
				font-size: 18px;
				vertical-align: top;
			}
		}
	}
	.chat {
		height: 250px;
	}
	.farmer, .popup.change_owner_popup .farmer {
		display: inline-block;
		text-align: center;
		vertical-align: top;
	}
	.farmer .avatar, .popup.change_owner_popup .farmer .avatar {
		width: 100px;
		height: 100px;
		margin-left: 6px;
		margin-right: 6px;
	}
	.farmer .name, .popup.change_owner_popup .farmer .name {
		font-size: 17px;
		text-align: center;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 114px;
		margin: 2px 0;
		span {
			padding-left: 2px;
		}
	}
	.farmer .status {
		width: 15px;
		vertical-align: bottom;
		margin-bottom: 2px;
	}
	.change_owner_popup .farmer {
		padding: 4px;
		padding-top: 10px;
		border-radius: 4px;
		cursor: pointer;
	}
	.change_owner_popup .farmer.selected {
		background: #5fad1b;
	}
	.change_owner_popup .farmer.selected .name {
		color: white;
	}
	.no-compos {
		color: #aaa;
		font-size: 18px;
		margin: 20px;
		text-align: center;
	}
	.compo-title {
		display: inline-block;
	}
	.level-talent {
		display: inline-block;
		vertical-align: top;
		padding-top: 1px;
	}
	.level-talent .level {
		color: white;
		line-height: 32px;
		margin-left: 30px;
		margin-right: 10px;
		vertical-align: bottom;
	}
	.leeks {
		min-height: 80px;
		position: relative;
		border: 4px solid transparent;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		grid-gap: 10px;
		padding: 5px;
		align-items: baseline;
	}
	.leek {
		text-align: center;
		transition: transform 0.4s;
		transform: scale(1);
		cursor: pointer;
		.name {
			font-size: 16px;
			text-align: center;
			color: #555;
			display: inline-block;
			text-overflow: ellipsis;
			overflow: hidden;
			width: 100%;
		}
		.fights {
			display: inline-block;
			margin-top: 3px;
			img {
				width: 18px;
				height: 18px;
				margin-right: 2px;
				vertical-align: top;
			}
			span {
				vertical-align: top;
				font-size: 17px;
			}
		}
	}
	.leek.dragging {
		opacity: 0.2;
	}
	.leek.moving {
		transform: scale(0.5);
	}
	.compo.in-tournament .leeks {
		background: #bbb;
	}
	.compo .empty {
		position: absolute;
		left: 0; right: 0;
		text-align: center;
		top: 50%; bottom: 50%;
		margin-top: -9px;
		font-weight: 300;
		color: #aaa;
		font-size: 18px;
	}
	.compo-tournament {
		float: right;
	}
	.compo-tournament img {
		vertical-align: middle;
		margin-right: 8px;
		margin-bottom: 3px;
		font-size: 18px;
		color: #444;
	}
	.tournament-info {
		font-size: 18px;
		color: #444;
	}
	.compo:not(.in-tournament) .leek {
		cursor: move;
	}
	.compo .leeks.dashed {
		border: 4px dashed #aaa;
	}
	.panel ::v-deep .turret-wrapper {
		display: flex;
		align-items: flex-end;
		height: 100%;
		.turret {
			display: flex;
			justify-content: center;
			padding: 15px;
			width: 100%;
			svg {
				padding-right: 20px;
				align-self: flex-end;
				cursor: pointer;
			}
			.infos {
				padding-right: 20px;
			}
			.level {
				font-weight: 300;
				color: #555;
				padding-bottom: 5px;
			}
			.ai {
				margin-left: -5px;
				&.active {
					cursor: pointer;
				}
			}
			.no-ai {
				color: #5fad1b;
				font-weight: bold;
				text-decoration: underline;
				cursor: pointer;
			}
		}
	}
	.turret-dialog {
		display: flex;
		align-items: center;
		svg {
			padding-left: 10px;
			padding-right: 30px;
			flex: 0 0 120px;
		}
		.infos {
			max-width: 440px;
		}
		.chips {
			padding-top: 5px;
		}
		.chip {
			width: 50px;
			padding-right: 4px;
			padding-bottom: 4px;
		}
		.characteristics {
			margin-top: 8px;
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
	}
	#app.app .turret-dialog {
		.characteristic {
			width: 100%;
		}
	}
	.turret-ai-dialog .farmer-ais {
		min-height: 80px;
		max-height: 600px;
		.ai {
			cursor: pointer;
		}
	}
</style>
