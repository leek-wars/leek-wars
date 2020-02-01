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
					<div slot="activator" class="tab" @click="updateOpened">
						<span>{{ $t('opened') }}</span>
						<v-switch v-model="team.opened" hide-details />
					</div>
					{{ $t('recrutment_mode') }}
				</tooltip>
			</div>
		</div>

		<div class="flex-container">
			<div class="column4">
				<panel class="team-emblem first">
					<div v-if="team" slot="content" class="content">
						<template v-if="member">
							<tooltip>
								<div slot="activator" class="emblem-input">
									<input ref="emblemInput" type="file" @change="changeEmblem">
									<emblem ref="emblem" :team="team" @click.native="$refs.emblemInput.click()" />
								</div>
								{{ $t('change_emblem') }}
							</tooltip>
						</template>
						<emblem v-else :team="team" />
						<div class="description">
							<span class="guillemet">«</span>
							<span v-if="owner" ref="descriptionElement" :class="{empty: !team.description && !editingDescription}" class="team-status text" contenteditable @click="startEditingDescription" @blur="saveDescription" @keydown.enter.prevent="saveDescription">{{ team.description }}</span>
							<span v-else class="text team-status">{{ team.description }}</span>
							<span class="guillemet">»</span>
							<span class="edit-pen"></span>
						</div>
					</div>
				</panel>
			</div>
			
			<div class="column4">
				<panel>
					<h4 class="team-level">{{ $t('level_n', [team ? team.level : '...']) }}</h4>
					<tooltip v-if="team">
						<div slot="activator" class="bar">
							<span :class="{blue: max_level}" :style="{width: xp_bar_width + '%'}" class="xp-bar striked"></span>
						</div>
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
							<talent slot="activator" :talent="team ? team.talent : '...'" />
							{{ $t('talent') }}
						</tooltip>
					</center>

					<br>
					<tooltip v-if="team">
						<table slot="activator" class="fights">
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
						{{ $t('ratio', [team.ratio]) }}
					</tooltip>

					<center v-if="$store.state.farmer && !member && $store.state.farmer.team == null">
						<br>
						<v-btn v-if="team.candidacy" @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
						<v-btn v-if="team.opened && !team.candidacy" @click="sendCandidacy">{{ $t('join_team') }}</v-btn>
						<i v-else-if="!team.opened">{{ $t('closed_team') }}</i>
					</center>
				</panel>
			</div>
				
			<div class="column4">
				<panel class="description">
					<div v-if="team" slot="content" class="turret-wrapper">
						<div class="turret">
							<turret-image :level="team.level" :skin="1" :scale="0.32" @click.native="turretDialog = true" />

							<div class="infos">
								<h4>{{ $t('fight.turret') }}</h4>
								<div class="level">{{ $t('level_n', [team.level]) }}</div>

								<ai v-if="team.turret_ai" :ai="team.turret_ai" :class="{active: member}" @click.native="turretAiDialog = true" />
								<div v-else-if="member" class="no-ai" @click="turretAiDialog = true">{{ $t('no_ai') }}</div>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>

		<panel v-if="member" :title="$t('chat')" toggle="team/chat">
			<div slot="actions">
				<div v-if="!LeekWars.mobile" class="button flat" @click="LeekWars.addChat('team', ChatType.TEAM, team.name)">
					<i class="material-icons">picture_in_picture_alt</i>
				</div>
			</div>
			<chat slot="content" channel="team" />
		</panel>

		<panel v-if="team && member && team.candidacies && team.candidacies.length > 0">
			<h2 slot="title">{{ $t('candidacies') }} ({{ team.candidacies.length }})</h2>
			<div slot="content" class="content candidacies">
				<div v-for="candidacy in team.candidacies" :key="candidacy.id" class="farmer">
					<rich-tooltip-farmer :id="candidacy.farmer.id">
						<router-link :to="'/farmer/' + candidacy.farmer.id">
							<avatar :farmer="candidacy.farmer" />
							<div class="name">{{ candidacy.farmer.name }}</div>
						</router-link>
					</rich-tooltip-farmer>
					<span class="accept" @click="acceptCandidacy(candidacy)">{{ $t('candidacy_accept') }}</span>
					<span class="reject" @click="rejectCandidacy(candidacy)">{{ $t('candidacy_refuse') }}</span>
				</div>
			</div>
		</panel>

		<panel>
			<h2 slot="title"><span v-if="team">{{ $t('farmers', [team.member_count]) }}</span></h2>
			<loader v-if="!team" slot="content" />
			<div v-else slot="content" class="members">
				<div v-for="member in team.members" :key="member.id" class="farmer">
					<rich-tooltip-farmer :id="member.id">
						<router-link :to="'/farmer/' + member.id">
							<avatar :farmer="member" />
							<div class="name">
								<tooltip v-if="member.grade == 'owner'">
									<span slot="activator">★</span>
									{{ $t('owner') }}
								</tooltip>
								<tooltip v-else-if="member.grade == 'captain'">
									<span slot="activator">☆</span>
									{{ $t('captain') }}
								</tooltip>
								{{ member.name }}
								<img v-if="member.connected" class="status" src="/image/connected.png">
								<img v-else class="status" src="/image/disconnected.png">
							</div>
						</router-link>
					</rich-tooltip-farmer>
					<template v-if="owner">
						<i v-if="member.grade == 'owner'">{{ $t('owner') }}</i>
						<select v-else v-model="member.grade" class="level" @change="changeLevel(member, $event)">
							<option value="captain">{{ $t('captain') }}</option>
							<option value="member">{{ $t('member') }}</option>
						</select>
						<br>
						<v-btn class="ban" small @click="banMemberStart(member)">{{ $t('ban') }}</v-btn>
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
				<h2 slot="title">{{ composition.name }}</h2>
				<template slot="actions">
					<div class="level-talent">
						<span class="level">{{ $t('level_n', [composition.total_level]) }}</span>
						<talent :talent="composition.talent" />
					</div>
					<router-link v-if="composition.tournament.current" :to="'/tournament/' + composition.tournament.current" class="view-tournament button flat">{{ $t('see_tournament') }}</router-link>
					<tooltip v-if="captain">
						<template v-slot:activator="{ on }">
							<div class="button flat" v-on="on" @click="registerTournament(composition)">
								<img src="/image/icon/trophy.png">
								<span v-if="!composition.tournament.registered" class="register-tournament">{{ $t('register_tournament') }}</span>
								<span v-else class="unregister-tournament">{{ $t('unregister') }}</span>
							</div>
						</template>
						{{ $t('tournament_time') }}
					</tooltip>
					<div v-if="captain" class="delete-compo button flat" @click="compositionToDelete = composition; deleteCompoDialog = true">
						<i class="material-icons">clear</i>
					</div>
				</template>
				<div slot="content" :class="{dashed: draggedLeek != null && canDrop(composition)}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(composition, $event)">

					<div v-if="composition.leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

					<rich-tooltip-leek v-for="leek in composition.leeks" :id="leek.id" :key="leek.id">
						<div :class="{dragging: leek.dragging}" class="leek" draggable="true" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(composition, leek, $event)" @dragend="leeksDragend(leek, $event)">
							<leek-image :leek="leek" :scale="0.6" />
							<br>
							<div class="name">{{ leek.name }} ({{ leek.level }})</div><br>
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

				<rich-tooltip-leek v-for="leek in team.unengaged_leeks" :id="leek.id" :key="leek.id">
					<div :class="{dragging: leek.dragging}" class="leek" draggable="true" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(null, leek, $event)" @dragend="leeksDragend(leek, $event)">
						<leek-image :leek="leek" :scale="0.6" />
						<br>
						<div class="name">{{ leek.name }} ({{ leek.level }})</div><br>
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
				<rich-tooltip-leek v-for="leek in team.leeks" :id="leek.id" :key="leek.id">
					<router-link :to="'/leek/' + leek.id" :leek="leek.id" class="leek">
						<leek-image :leek="leek" :scale="0.6" />
						<br>
						<div class="name">{{ leek.name }}</div>
						<div>{{ $t('main.level_n', [leek.level]) }}</div>
					</router-link>
				</rich-tooltip-leek>
			</div>
		</panel>

		<div>
			<div class="column6">
				<panel v-if="team && team.fights.length > 0" :title="$t('history')">
					<fights-history v-if="team" slot="content" :fights="team.fights" />
				</panel>
			</div>
			<div class="column6">
				<panel v-if="team && team.tournaments.length > 0" :title="$t('tournaments')">
					<tournaments-history v-if="team" slot="content" :tournaments="team.tournaments" />
				</panel>
			</div>
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
			<span slot="title">{{ $t('create_composition') }}</span>
			<h4>{{ $t('compo_name') }}</h4>
			<input v-model="createCompoName" type="text" @keyup.enter="createComposition">
			<div slot="actions">
				<div @click="createCompoDialog = false">{{ $t('compo_cancel') }}</div>
				<div class="green" @click="createComposition">{{ $t('compo_create') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="deleteCompoDialog" :width="600">
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
			<span slot="title">{{ $t('quit_team_confirm_title', [team.name]) }}</span>
			{{ $t('quit_team_confirm') }}
			<div slot="actions">
				<div @click="quitTeamDialog = false">{{ $t('quit_cancel') }}</div>
				<div class="red" @click="quitTeam">{{ $t('quit_confirm') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="dissolveDialog" :width="500">
			<span slot="title">{{ $t('disolve_confirm_title', [team.name]) }}</span>
			{{ $t('disolve_confirm') }}
			<div slot="actions">
				<div @click="dissolveDialog = false">{{ $t('disolve_cancel') }}</div>
				<div class="red" @click="dissolveTeam">{{ $t('disolve_disolve') }}</div>
			</div>
		</popup>

		<popup v-if="banMemberTarget" v-model="banDialog" :width="500">
			<span slot="title">{{ $t('ban_confirm_title', [banMemberTarget.name]) }}</span>
			{{ $t('ban_confirm', [banMemberTarget.name]) }}
			<div slot="actions">
				<div @click="banDialog = false">{{ $t('ban_cancel') }}</div>
				<div class="red" @click="banMember">{{ $t('ban_ban') }}</div>
			</div>
		</popup>

		<popup v-if="team" v-model="changeOwnerDialog" :width="650">
			<span slot="title">{{ $t('change_owner_confirm_title') }}</span>
			<div class="change_owner_popup">
				{{ $t('change_owner_select') }}
				<br>
				<rich-tooltip-farmer v-for="member in team.members" :id="member.id" :key="member.id">
					<div :class="{selected: member === changeOwnerSelected}" class="farmer" @click="changeOwnerSelected = member">
						<avatar :farmer="member" />
						<div class="name">
							<tooltip v-if="member.grade === 'owner'">
								<span slot="activator">★</span>
								{{ $t('owner') }}
							</tooltip>
							<tooltip v-else-if="member.grade === 'captain'">
								<span slot="activator">☆</span>
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
			<span slot="title">{{ $t('fight.turret') }} [{{ $t('level_n', [team.level]) }}]</span>
			<div class="turret-dialog">
				<turret-image :level="team.level" :skin="1" :scale="0.32" />
				<div class="infos">
					<h4>{{ $t('leek.characteristics') }}</h4>
					<div class="card characteristics">
						<div v-for="c in ['life', 'science', 'strength', 'magic', 'wisdom', 'frequency', 'agility', 'mp', 'resistance', 'tp']" :key="c" class="characteristic">
							<characteristic-tooltip :characteristic="c" :value="turret[c]" :leek="turret" :test="true">
								<img :src="'/image/charac/' + c + '.png'">
								<span class="stat" :class="'color-' + c">{{ turret[c] }}</span>
							</characteristic-tooltip>
						</div>
					</div>
					<br>

					<h4>{{ $t('leek.chips') }}</h4>
					<div class="chips">
						<tooltip v-for="chip of [4, 23, 20, 1, 15, 92, 97, 100]" :key="chip">
							<span slot="activator">
								<img :src="'/image/chip/small/' + LeekWars.chips[chip].name + '.png'" class="chip">
							</span>
							<b>{{ $t('chip.' + LeekWars.chips[chip].name) }}</b>
							<br>
							{{ $t('leek.chip_level_n', [LeekWars.chips[chip].level]) }}
							<br>
							<small>{{ 'CHIP_' + LeekWars.chips[chip].name.toUpperCase() }}</small>
						</tooltip>
					</div>
				</div>
			</div>
		</popup>

		<popup v-if="team && member" v-model="turretAiDialog" :width="870">
			<span slot="title">{{ $t('fight.turret') }} [{{ $t('level_n', [team.level]) }}]</span>
			<div class="turret-ai-dialog">
				<div class="farmer-ais">
					<ai v-for="ai in $store.state.farmer.ais" v-if="!team.turret_ai || ai.id !== team.turret_ai.id" :key="ai.id" :ai="ai" @click.native="selectAI(ai)" />
				</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import CharacteristicTooltip from '@/component/leek/characteristic-tooltip.vue'
	import { ChatType } from '@/model/chat'
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { SocketMessage } from '@/model/socket'
	import { Composition, Team, TeamMember } from '@/model/team'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'team', i18n: {}, components: { CharacteristicTooltip }})
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

		get id() { return 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : (this.$store.state.farmer && this.$store.state.farmer.team !== null ? this.$store.state.farmer.team.id : null) }
		get max_level() { return this.team && this.team.level === 100 }
		get xp_bar_width() { return this.team ? this.team.level === 100 ? 100 : Math.floor(100 * (this.team.xp - this.team.down_xp) / (this.team.up_xp - this.team.down_xp)) : 0 }
		get member() { return !this.$route.params.id || (this.team && this.$store.state.farmer && this.$store.state.farmer.team !== null && this.team.id === this.$store.state.farmer.team.id) }
		
		get turret() {
			if (!this.team) { return {} }
			const team_ratio = 1 + (this.team.level / 100)
			const max_life = Math.round(10000 * team_ratio)
			const characteristics_base_1000 = Math.round(1000 * team_ratio)
			const characteristics_base_2000 = Math.round(2000 * team_ratio)
			const characteristics_base_500 = Math.round(500 * team_ratio)
			return {
				life: 0 + " à " + max_life,
				strength: 0 + " à " + characteristics_base_2000,
				agility: 0 + " à " + characteristics_base_500,
				resistance: 0 + " à " + characteristics_base_500,
				science: 0 + " à " + characteristics_base_500,
				wisdom: 0 + " à " + characteristics_base_1000,
				magic: 0 + " à " + characteristics_base_1000,
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
				LeekWars.setSubTitle(this.$t('ranking.n_farmers', [team.members.length]) + " • " + this.$t('ranking.n_leeks', [team.leek_count]))
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

			LeekWars.toast(this.$t('team.uploading_emblem') as string)

			LeekWars.post('team/set-emblem', formdata).then(data => {
				if (this.team) {
					LeekWars.toast(this.$t('team.upload_success') as string)
					this.team.emblem_changed = LeekWars.time
					this.$store.commit('update-emblem')
				}
			}).error(error => {
				LeekWars.toast(this.$t('team.upload_failed', [error.error]) as string)
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
			}).error(error => {
				LeekWars.toast(error)
			})
		}

		deleteComposition(composition: Composition) {
			LeekWars.delete('team/delete-composition', {composition_id: composition.id}).then(data => {
				if (this.team) {
					LeekWars.toast(this.$i18n.t('team.compo_deleted', composition.name))
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
				LeekWars.toast(this.$i18n.t('team.cant_quit_owner'))
			} else {
				this.quitTeamDialog = true
			}
		}

		quitTeam () {
			LeekWars.post('team/quit').then(data => {
				this.quitTeamDialog = false
				LeekWars.toast(this.$i18n.t('team.you_left_team'))
				this.$router.push('/farmer')
			}).error(error => {
				this.quitTeamDialog = false
				LeekWars.toast(error)
			})
		}

		dissolveTeam() {
			LeekWars.post('team/dissolve').then(data => {
				this.dissolveDialog = false
				LeekWars.toast(this.$i18n.t('team.team_have_been_disolved'))
				this.$store.commit('dissolve-team')
				this.$router.push('/farmer')
			}).error(error => {
				LeekWars.toast(this.$i18n.t('team.' + error.error))
			})
		}

		registerTournament(composition: Composition) {
			if (composition.tournament.registered) {
				LeekWars.post('team/unregister-tournament', {composition_id: composition.id})
				composition.tournament.registered = false
			} else {
				if (composition.leeks.length < 4) {
					LeekWars.toast(this.$i18n.t('team.compo_must_contain_4_leeks'))
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
				LeekWars.toast(this.$i18n.t('team.farmer_banned'))
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
				(this.$refs.descriptionElement as HTMLElement).innerText = this.$i18n.t('team.no_description') as string
			}
		}

		acceptCandidacy(candidacy: any) {
			LeekWars.post('team/accept-candidacy', {candidacy_id: candidacy.id}).then(data => {
				LeekWars.toast(this.$i18n.t('team.farmer_accepted'))
				this.update()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		rejectCandidacy(candidacy: any) {
			LeekWars.post('team/reject-candidacy', {candidacy_id: candidacy.id}).then(data => {
				LeekWars.toast(this.$i18n.t('team.farmer_refused'))
				this.update()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		sendCandidacy() {
			if (!this.team) { return }
			LeekWars.post('team/send-candidacy', {team_id: this.team.id}).then(data => {
				if (this.team) {
					LeekWars.toast(this.$i18n.t('team.candidacy_sent'))
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
					LeekWars.toast(this.$i18n.t('team.candidacy_cancelled'))
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
				LeekWars.toast(this.$i18n.t('team.owner_has_been_changed'))
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
		font-weight: 300;
		font-size: 17px;
		text-align: center;
		color: #555;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 114px;
	}
	.farmer .status {
		width: 15px;
		vertical-align: middle;
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
		width: 100%;
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
			.characteristic:nth-child(4n),
			.characteristic:nth-child(3),
			.characteristic:nth-child(7) {
				background: #eee;
			}
		}
	}
	.turret-ai-dialog .farmer-ais {
		min-height: 80px;
		max-height: 400px;
		.ai {
			cursor: pointer;
		}
	}
</style>
