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
				<v-tooltip :open-delay="0" :close-delay="0" bottom>
					<div slot="activator" class="tab" @click="updateOpened">
						<span>{{ $t('opened') }}</span>
						<v-switch v-model="team.opened" hide-details />
					</div>
					{{ $t('recrutment_mode') }}
				</v-tooltip>
			</div>
		</div>

		<div class="flex-container">
			<div class="column4">
				<panel class="team-emblem first">
					<div v-if="team" slot="content" class="content">
						<template v-if="member">
							<v-tooltip :open-delay="0" :close-delay="0" bottom>
								<div slot="activator" class="emblem-input">
									<input ref="emblemInput" type="file" @change="changeEmblem">
									<emblem ref="emblem" :team="team" @click.native="$refs.emblemInput.click()" />
								</div>
								{{ $t('change_emblem') }}
							</v-tooltip>
						</template>
						<emblem v-else :team="team" />
					</div>
				</panel>
			</div>
			
			<div class="column4">
				<panel class="description">
					<div v-if="team" slot="content" class="content">
						<div>
							<span class="guillemet">«</span>
							<span v-if="owner" ref="descriptionElement" :class="{empty: !team.description && !editingDescription}" class="team-status text" contenteditable @click="startEditingDescription" @blur="saveDescription" @keydown.enter.prevent="saveDescription">{{ team.description }}</span>
							<span v-else class="text team-status">{{ team.description }}</span>
							<span class="guillemet">»</span>
							<span class="edit-pen"></span>
						</div>
						<center v-if="$store.state.farmer && !member && $store.state.farmer.team == null">
							<br>
							<v-btn v-if="team.candidacy" @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
							<v-btn v-if="team.opened && !team.candidacy" @click="sendCandidacy">{{ $t('join_team') }}</v-btn>
							<i v-else-if="!team.opened">{{ $t('closed_team') }}</i>
						</center>
					</div>
				</panel>
			</div>
			
			<div class="column4">
				<panel>
					<h4 class="team-level">{{ $t('level_n', [team ? team.level : '...']) }}</h4>
					<v-tooltip v-if="team" :open-delay="0" :close-delay="0" bottom>
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
					</v-tooltip>

					<center>
						<br>
						<v-tooltip :open-delay="0" :close-delay="0" bottom>
							<talent slot="activator" :talent="team ? team.talent : '...'" />
							{{ $t('talent') }}
						</v-tooltip>
					</center>

					<br>
					<v-tooltip v-if="team" :open-delay="0" :close-delay="0" bottom>
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
					</v-tooltip>
				</panel>
			</div>
		</div>

		<panel v-if="member" :title="$t('chat')" toggle="team/chat">
			<chat slot="content" channel="team" />
		</panel>

		<panel v-if="team && member && team.candidacies && team.candidacies.length > 0">
			<h2 slot="title">{{ $t('candidacies') }} ({{ team.candidacies.length }})</h2>
			<div slot="content" class="content candidacies">
				<div v-for="candidacy in team.candidacies" :key="candidacy.id" class="farmer">
					<router-link :to="'/farmer/' + candidacy.farmer.id">
						<avatar :farmer="candidacy.farmer" />
						<div class="name">{{ candidacy.farmer.name }}</div>
					</router-link>
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
					<router-link :to="'/farmer/' + member.id">
						<avatar :farmer="member" />
						<div class="name">
							<v-tooltip v-if="member.grade == 'owner'" :open-delay="0" :close-delay="0" bottom>
								<span slot="activator">★</span>
								{{ $t('owner') }}
							</v-tooltip>
							<v-tooltip v-else-if="member.grade == 'captain'" :open-delay="0" :close-delay="0" bottom>
								<span slot="activator">☆</span>
								{{ $t('captain') }}
							</v-tooltip>
							{{ member.name }}
							<img v-if="member.connected" class="status" src="/image/connected.png">
							<img v-else class="status" src="/image/disconnected.png">
						</div>
					</router-link>
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
					<v-tooltip v-if="captain" :open-delay="0" :close-delay="0" bottom class="button flat">
						<div slot="activator" @click="registerTournament(composition)">
							<img src="/image/icon/trophy.png">
							<span v-if="!composition.tournament.registered" class="register-tournament">{{ $t('register_tournament') }}</span>
							<span v-else class="unregister-tournament">{{ $t('unregister') }}</span>
						</div>
						{{ $t('tournament_time') }}
					</v-tooltip>
					<div v-if="captain" class="delete-compo button flat" @click="compositionToDelete = composition; deleteCompoDialog = true">
						<i class="material-icons">clear</i>
					</div>
				</template>
				<div slot="content" :class="{dashed: draggedLeek != null && canDrop(composition)}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(composition, $event)">

					<div v-if="composition.leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

					<div v-for="leek in composition.leeks" :key="leek.id" :class="{dragging: leek.dragging}" class="leek" draggable="true" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(composition, leek, $event)" @dragend="leeksDragend(leek, $event)">
						<leek-image :leek="leek" :scale="0.6" />
						<br>
						<div class="name">{{ leek.name }} ({{ leek.level }})</div><br>
						<div class="fights">
							<img src="/image/icon/grey/garden.png">
							<span>{{ leek.team_fights }}</span>
						</div>
					</div>
				</div>
			</panel>
		</div>

		<panel v-if="member && team && team.unengaged_leeks" class="compo">
			<h2 slot="title" class="compo-title">{{ $t('unsorted_leeks') }}</h2>

			<div slot="content" :class="{dashed: draggedLeek != null}" class="leeks" @dragover="leeksDragover" @drop="leeksDrop(null, $event)">
				<div v-if="team.unengaged_leeks.length == 0" class="empty">{{ $t('empty_compo') }}</div>

				<div v-for="leek in team.unengaged_leeks" :key="leek.id" :class="{dragging: leek.dragging}" class="leek" draggable="true" @click="$router.push('/leek/' + leek.id)" @dragstart="leeksDragstart(null, leek, $event)" @dragend="leeksDragend(leek, $event)">
					<leek-image :leek="leek" :scale="0.6" />
					<br>
					<div class="name">{{ leek.name }} ({{ leek.level }})</div><br>
					<div class="fights">
						<img src="/image/icon/grey/garden.png">
						<span>{{ leek.team_fights }}</span>
					</div>
				</div>
			</div>
		</panel>
		<panel v-else>
			<h2 v-if="team" slot="title">{{ $t('leeks', [team.leek_count]) }}</h2>
			<loader v-if="!team" slot="content" />
			<div v-else slot="content" class="leeks">
				<router-link v-for="leek in team.leeks" :key="leek.id" :to="'/leek/' + leek.id" :leek="leek.id" class="leek">
					<leek-image :leek="leek" :scale="0.6" />
					<br>
					<div class="name">{{ leek.name }}</div>
					<div>{{ $t('main.level_n', [leek.level]) }}</div>
				</router-link>
			</div>
		</panel>

		<div class="container">
			<div class="column6">
				<panel :title="$t('history')">
					<fights-history v-if="team" slot="content" :fights="team.fights" />
				</panel>
			</div>
			<div class="column6">
				<panel :title="$t('tournaments')">
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

		<report-dialog v-if="team" v-model="reportDialog" :name="team.name" :target="0" :reasons="reasons" :parameter="team.id" />

		<v-dialog v-model="createCompoDialog" :max-width="500">
			<div class="title">{{ $t('create_composition') }}</div>
			<div class="content">
				<h4>{{ $t('compo_name') }}</h4>
				<input v-model="createCompoName" type="text" @keyup.enter="createComposition">
			</div>
			<div class="actions">
				<div @click="createCompoDialog = false">{{ $t('compo_cancel') }}</div>
				<div class="green" @click="createComposition">{{ $t('compo_create') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="team" v-model="deleteCompoDialog" :max-width="600">
			<div v-if="compositionToDelete" class="title">{{ $t('delete_compo_confirm_title', [compositionToDelete.name]) }}</div>
			<div v-if="compositionToDelete" class="content">
				{{ $t('delete_compo_confirm', [compositionToDelete.name]) }}
			</div>
			<div class="actions">
				<div @click="deleteCompoDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="red" @click="deleteComposition(compositionToDelete)">{{ $t('delete_confirm') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="team" v-model="quitTeamDialog" :max-width="500">
			<div class="title">{{ $t('quit_team_confirm_title', [team.name]) }}</div>
			<div class="content">
				{{ $t('quit_team_confirm') }}
			</div>
			<div class="actions">
				<div @click="quitTeamDialog = false">{{ $t('quit_cancel') }}</div>
				<div class="red" @click="quitTeam">{{ $t('quit_confirm') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="team" v-model="dissolveDialog" :max-width="500">
			<div class="title">{{ $t('disolve_confirm_title', [team.name]) }}</div>
			<div class="content">
				{{ $t('disolve_confirm') }}
			</div>
			<div class="actions">
				<div @click="dissolveDialog = false">{{ $t('disolve_cancel') }}</div>
				<div class="red" @click="dissolveTeam">{{ $t('disolve_disolve') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="banMemberTarget" v-model="banDialog" :max-width="500">
			<div class="title">{{ $t('ban_confirm_title', [banMemberTarget.name]) }}</div>
			<div class="content">
				{{ $t('ban_confirm', [banMemberTarget.name]) }}
			</div>
			<div class="actions">
				<div @click="banDialog = false">{{ $t('ban_cancel') }}</div>
				<div class="red" @click="banMember">{{ $t('ban_ban') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="team" v-model="changeOwnerDialog" :max-width="650">
			<div class="title">{{ $t('change_owner_confirm_title') }}</div>
			<div class="content change_owner_popup">
				{{ $t('change_owner_select') }}
				<br>
				<div v-for="member in team.members" :key="member.id" :class="{selected: member === changeOwnerSelected}" class="farmer" @click="changeOwnerSelected = member">
					<avatar :farmer="member" />
					<div class="name">
						<v-tooltip v-if="member.grade === 'owner'" :open-delay="0" :close-delay="0" bottom>
							<span slot="activator">★</span>
							{{ $t('owner') }}
						</v-tooltip>
						<v-tooltip v-else-if="member.grade === 'captain'" :open-delay="0" :close-delay="0" bottom>
							<span slot="activator">☆</span>
							{{ $t('captain') }}
						</v-tooltip>
						{{ member.name }}
					</div>
				</div>
			</div>
			<div class="actions">
				<div @click="changeOwnerDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div class="green" @click="changeOwnerSelect(changeOwnerSelected)">{{ $t('change_owner_change') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="changeOwnerSelected" v-model="changeOwnerConfirmDialog" :max-width="500">
			<div class="title">{{ $t('change_owner_confirm_title') }}</div>
			<div class="content">
				<i18n path="change_owner_confirm">
					<b place="farmer">{{ changeOwnerSelected.name }}</b>
				</i18n>
				<br><br>
				{{ $t('enter_password_to_confirm') }}
				<br><br>
				<input v-model="changeOwnerPassword" type="password">
			</div>
			<div class="actions">
				<div @click="changeOwnerConfirmDialog = false">{{ $t('change_owner_cancel') }}</div>
				<div class="green" @click="changeOwner">{{ $t('change_owner_change') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { SocketMessage } from '@/model/socket'
	import { Composition, Team, TeamMember } from '@/model/team'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'team', i18n: {} })
	export default class TeamPage extends Vue {
		team: Team | null = null
		captain: boolean = false
		owner: boolean = false
		reportDialog: boolean = false
		reasons = [Warning.INCORRECT_EMBLEM, Warning.INCORRECT_TEAM_NAME]
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

		get id() { return 'id' in this.$route.params ? parseInt(this.$route.params.id, 10) : (this.$store.state.farmer && this.$store.state.farmer.team !== null ? this.$store.state.farmer.team.id : null) }
		get max_level() { return this.team && this.team.level === 100 }
		get xp_bar_width() { return this.team ? this.team.level === 100 ? 100 : Math.floor(100 * (this.team.xp - this.team.down_xp) / (this.team.up_xp - this.team.down_xp)) : 0 }
		get member() { return !this.$route.params.id || (this.team && this.$store.state.farmer && this.$store.state.farmer.team !== null && this.team.id === this.$store.state.farmer.team.id) }
		
		@Watch('id', {immediate: true})
		update() {
			if (this.id === null) { return }
			let request = 'team/get/' + this.id
			if (this.$store.state.farmer) {
				if (this.$store.state.farmer.team !== null && this.$store.state.farmer.team.id === this.id) {
					request = 'team/get-private/' + this.id + '/' + this.$store.state.token
				} else {
					request = 'team/get-connected/' + this.id + '/' + this.$store.state.token
				}
			}
			LeekWars.get<any>(request).then((data) => {
				if (!data.success) {
					// TODO
					// LW.error('Pas de team', 'Team introuvable !')
					return
				}
				this.team = data.team
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

				if (this.member && !this.$store.state.chat.team) {
					this.$store.commit('init-team-chat')
					LeekWars.socket.send([SocketMessage.TEAM_CHAT_ENABLE])
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

			LeekWars.toast(this.$t('team.uploading_emblem') as string)

			LeekWars.post('team/set-emblem', formdata).then((data) => {
				if (data.success) {
					if (this.team) {
						LeekWars.toast(this.$t('team.upload_success') as string)
						this.team.emblem_changed = LeekWars.time
					}
				} else {
					LeekWars.toast(this.$t('team.upload_failed', [data.error]) as string)
				}
			})
		}

		createComposition() {
			LeekWars.post('team/create-composition', {composition_name: this.createCompoName}).then((data) => {
				if (data.success && this.team) {
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
				} else {
					LeekWars.toast(data.error)
				}
			})
		}

		deleteComposition(composition: Composition) {
			LeekWars.post('team/delete-composition', {composition_id: composition.id}).then((data) => {
				if (data.success && this.team) {
					LeekWars.toast(this.$i18n.t('team.compo_deleted', composition.name))
					// On transfère tous les leeks dans les leeks non engagés
					for (const leek of composition.leeks) {
						this.team.unengaged_leeks.push(leek)
					}
					this.team.compositions.splice(this.team.compositions.indexOf(composition))
					this.deleteCompoDialog = false
				} else {
					LeekWars.toast(data.error)
				}
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
			LeekWars.post('team/quit').then((data) => {
				if (data.success) {
					LeekWars.toast(this.$i18n.t('team.you_left_team'))
					this.$router.push('/farmer')
				} else {
					LeekWars.toast(data.error)
				}
				this.quitTeamDialog = false
			})
		}

		dissolveTeam() {
			LeekWars.post('team/dissolve').then((data) => {
				if (data.success) {
					this.dissolveDialog = false
					LeekWars.toast(this.$i18n.t('team.team_have_been_disolved'))
					this.$store.commit('dissolve-team')
					this.$router.push('/farmer')
				} else {
					LeekWars.toast(this.$i18n.t('team.' + data.error))
				}
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
			LeekWars.post('team/ban', {farmer_id: this.banMemberTarget.id}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$i18n.t('team.farmer_banned'))
					this.banDialog = false
				} else {
					LeekWars.toast(data.error)
				}
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
			LeekWars.post('team/change-description', {team_id: this.team.id, description: this.team.description})
			if (!this.team.description) {
				(this.$refs.descriptionElement as HTMLElement).innerText = this.$i18n.t('team.no_description') as string
			}
		}

		acceptCandidacy(candidacy: any) {
			LeekWars.post('team/accept-candidacy', {candidacy_id: candidacy.id}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$i18n.t('team.farmer_accepted'))
					this.update()
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		rejectCandidacy(candidacy: any) {
			LeekWars.post('team/reject-candidacy', {candidacy_id: candidacy.id}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$i18n.t('team.farmer_refused'))
					this.update()
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		sendCandidacy() {
			if (!this.team) { return }
			LeekWars.post('team/send-candidacy', {team_id: this.team.id}).then((data) => {
				if (data.success && this.team) {
					LeekWars.toast(this.$i18n.t('team.candidacy_sent'))
					this.team.candidacy = true
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		cancelCandidacy() {
			if (!this.team) { return }
			LeekWars.post('team/cancel-candidacy-for-team', {team_id: this.team.id}).then((data) => {
				if (data.success && this.team) {
					LeekWars.toast(this.$i18n.t('team.candidacy_cancelled'))
					this.team.candidacy = false
				} else {
					LeekWars.toast(data.error)
				}
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
			LeekWars.post('team/change-owner', {new_owner: this.changeOwnerSelected.id, password: this.changeOwnerPassword}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$i18n.t('team.owner_has_been_changed'))
					this.changeOwnerConfirmDialog = false
					this.changeOwnerDialog = false
					this.update()
				} else {
					LeekWars.toast(data.error)
				}
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
			LeekWars.post('team/move-leek', {leek_id: leek.id, to: newCompositionID}).then((data) => {
				if (!data.success) {
					LeekWars.toast(data.error)
				}
			})
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
</style>
