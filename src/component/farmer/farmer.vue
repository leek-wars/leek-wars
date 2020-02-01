<template lang="html">
	<not-found v-if="notfound" title="Unknown farmer" />
	<not-found v-else-if="farmer && farmer.banned" :title="$t('banned')" :message="$t('banned_message')" />
	<not-found v-else-if="farmer && farmer.deleted" :title="$t('deleted')" :message="$t('deleted_message')" />
	<div v-else>
		<div class="page-header page-bar">
			<div>
				<h1>{{ farmer ? farmer.name : '...' }}</h1>
				<div class="info state">
					<span v-if="farmer && farmer.connected"><img src="/image/connected.png">{{ $t('connected') }}</span>
					<span v-else><img src="/image/disconnected.png">{{ $t('disconnected') }}</span>
				</div>
			</div>
			<div v-if="farmer" class="tabs">
				<div v-if="myFarmer">
					<template v-if="farmer.tournament && farmer.tournament.current">
						<router-link :to="'/tournament/' + farmer.tournament.current">
							<div class="tab green">{{ $t('see_tournament') }}</div>
						</router-link>
					</template>
					<tooltip>
						<div slot="activator" class="tab">
							<img src="/image/icon/trophy.png">
							<span v-if="farmer.tournament && !farmer.tournament.registered" class="register" @click="registerTournament">{{ $t('register_to_tournament') }}</span>
							<span v-else class="unregister" @click="registerTournament">{{ $t('unregister') }}</span>
						</div>
						{{ $t('tournament_time') }}
					</tooltip>
					<div class="tab" @click="updateGarden">
						<span>{{ $t('garden') }}</span>
						<v-switch :input-value="farmer.in_garden" hide-details />
					</div>
					<div class="tab action" icon="power_settings_new" @click="logout">
						<i class="material-icons">power_settings_new</i>
						<span>{{ $t('logout') }}</span>
					</div>
				</div>
				<div v-else>
					<div v-if="env.SOCIAL" class="tab action" @click="sendMessage">
						<i class="material-icons">email</i>
						<span>{{ $t('send_private_message') }}</span>
					</div>
					<router-link v-if="$store.state.connected" :to="'/garden/challenge/farmer/' + farmer.id">
						<div :link="'/garden/challenge/farmer/' + farmer.id" class="tab action">
							<img src="/image/icon/garden.png">
							<span>{{ $t('challenge') }}</span>
						</div>
					</router-link>
					<div class="action" icon="question_answer" link="/messages/new/{farmer.id}/{farmer.name}/{farmer.avatar_changed}"></div>
				</div>
			</div>
		</div>
		<div class="flex-container">
			<div class="column4">
				<panel class="first">
					<div slot="content" class="content avatar-td">
						<div v-if="myFarmer">
							<tooltip>
								<div slot="activator" class="avatar-input">
									<input ref="avatarInput" type="file" @change="changeAvatar">
									<avatar ref="avatar" :farmer="farmer" @click.native="$refs.avatarInput.click()" />
								</div>
								{{ $t('click_to_change_avatar') }}
							</tooltip>
						</div>
						<div v-else>
							<avatar :farmer="farmer" />
						</div>
						<div v-if="farmer" class="infos">
							<router-link v-if="farmer.forum_messages" :to="'/search?farmer=' + farmer.name + '&order=date'">
								<div class="info">
									<img class="flag" src="/image/forum.png"><span class="label">{{ $t('forum_messages', [farmer.forum_messages]) }}</span>
								</div>
							</router-link>
							<div class="info country">
								<span v-if="farmer.country">
									<img :src="'/image/flag/' + farmer.country + '.png'" class="flag"><span class="country label">{{ $t('country.' + farmer.country) }}</span>
								</span>
								<span v-else>
									<img class="flag" src="/image/flag/_.png"><span class="country no label">{{ $t('no_country') }}</span>
								</span>
								<span v-if="myFarmer" class="edit" @click="countryDialog = true"></span>
							</div>
							<div v-if="farmer.website" class="info website">
								<img src="/image/website.png"><a :href="farmer.website" target="_blank" rel="noopener"><span class="text label">{{ farmer.website }}</span></a>
								<span v-if="myFarmer" class="edit" @click="websiteDialog = true"></span>
							</div>
							<div v-else-if="myFarmer" class="add add-website" @click="websiteDialog = true">{{ $t('add_website') }}</div>
							<div v-if="farmer.github" class="info github">
								<img src="/image/github.png"><a :href="'https://github.com/' + farmer.github" target="_blank" rel="noopener"><span class="text label">{{ farmer.github }}</span></a>
								<span v-if="myFarmer" class="edit" @click="githubDialog = true"></span>
							</div>
							<div v-else-if="myFarmer" class="add add-github" @click="githubDialog = true">{{ $t('add_github') }}</div>
						</div>
					</div>
				</panel>
			</div>
			
			<div class="column4">
				<panel>
					<div slot="content" class="content stats">
						<div class="talent-wrapper">
							<tooltip>
								<talent slot="activator" :talent="farmer ? farmer.talent : '...'" />
								<div>{{ $t('talent') }}</div>
							</tooltip>
							<tooltip v-if="farmer">
								<div slot="activator" class="talent-more">({{ farmer.talent_more >= 0 ? '+' + farmer.talent_more : farmer.talent_more }})</div>
								<template v-if="farmer.talent_more > 0">
									<span v-html="$t('report.talent_difference_farmer', [farmer.name, farmer.talent_more, talent_gains + '%'])"></span>
								</template>
								<div v-else v-html="$t('report.talent_difference_farmer_no_gains', [farmer.name])"></div>
							</tooltip>
						</div>
						<tooltip v-if="farmer">
							<table slot="activator">
								<tr>
									<td class="big">{{ farmer.victories | number }}</td>
									<td class="big">{{ farmer.draws | number }}</td>
									<td class="big">{{ farmer.defeats | number }}</td>
								</tr>
								<tr>
									<td class="grey">{{ $t('victories') }}</td>
									<td class="grey">{{ $t('draws') }}</td>
									<td class="grey">{{ $t('defeats') }}</td>
								</tr>
							</table>
							{{ $t('ratio') }} : {{ farmer.ratio }}
						</tooltip>
		
						<table v-if="farmer && farmer.won_solo_tournaments + farmer.won_farmer_tournaments + farmer.won_team_tournaments > 0" class="tournaments">
							<tr>
								<td class="grey">Tournois</td>
								<td width="25%"><span class="big">{{ farmer.won_solo_tournaments }}</span><br><span class="small grey">solo</span></td>
								<td width="25%"><span class="big">{{ farmer.won_farmer_tournaments }}</span><br><span class="small grey">éleveur</span></td>
								<td width="25%"><span class="big">{{ farmer.won_team_tournaments }}</span><br><span class="small grey">équipe</span></td>
							</tr>
						</table>
		
						<div v-if="farmer" class="log-time grey">
							<span v-if="$store.getters.moderator">{{ $t('registered_the', [LeekWars.formatDateTime(farmer.register_date)]) }}</span>
							<span v-else>{{ $t('registered_the', [LeekWars.formatDate(farmer.register_date)]) }}</span>
							<br>
							<span v-if="farmer.connected">{{ $t('connected') }}</span>
							<span v-else>{{ $t('last_connection', [LeekWars.formatDuration(farmer.last_connection)]) }}</span>
						</div>
						<div v-if="farmer" class="grades">
							<div v-if="farmer.admin" class="grade admin">{{ $t('admin') }}</div>
							<div v-else-if="farmer.moderator" class="grade moderator">{{ $t('moderator') }}</div>
							<div v-if="farmer.contributor" class="grade contributor">{{ $t('contributor') }}</div>
						</div>
						<div v-if="farmer" class="godfather grey">
							<div v-if="farmer.godfather">
								<i18n path="godson_of" tag="div">
									<router-link slot="farmer" :to="'/farmer/' + farmer.godfather.id">
										<rich-tooltip-farmer :id="farmer.godfather.id">
											{{ farmer.godfather.name }}
										</rich-tooltip-farmer>
									</router-link>
								</i18n>
							</div>
							<div v-if="farmer.godsons.length">
								<i18n path="godfather_of" tag="div">
									<span slot="farmers">
										<span v-for="(godson, i) in farmer.godsons" :key="i">
											<router-link :to="'/farmer/' + godson.id">
												<rich-tooltip-farmer :id="godson.id">
													{{ godson.name }}
												</rich-tooltip-farmer>
											</router-link>
											<span v-if="i < farmer.godsons.length - 1">, </span>
										</span> 
									</span>
								</i18n>
							</div>
							<div v-if="myFarmer" class="godfather-link" @click="openGodfatherDialog"><br>{{ $t('godfather_link') }}</div>
						</div>
					</div>
				</panel>
			</div>
			<div class="column4">
				<panel>
					<div slot="content" class="content team center">
						<loader v-if="!farmer" />
						<div v-else-if="farmer.team">
							<router-link :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" />
								<br>
								<h2>{{ farmer.team.name }}</h2>
								{{ $t('leek_level_n', [farmer.team.level]) }}
							</router-link>
						</div>
						<div v-else>
							<div v-if="myFarmer">
								<v-btn @click="createTeamDialog = true">{{ $t('create_team') }}</v-btn>
								<div v-if="farmer.candidacy">
									<br><br><br>
									<i18n path="candidacy_for_team" class="candidacy">
										<a slot="team" :href="'/team/' + farmer.candidacy.team_id">{{ farmer.candidacy.team_name }}</a>
									</i18n>
									<br><br>
									<v-btn @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</v-btn>
								</div>
							</div>
							<div v-else>
								<span class="grey">{{ $t('no_team') }}</span>
							</div>
						</div>
					</div>
				</panel>
			</div>
		</div>
		<div class="column12">
			<panel>
				<h2 slot="title">{{ $t('trophies') }} <span v-if="farmer">({{ farmer.trophies }})</span></h2>
				<template slot="actions">
					<router-link :to="'/trophies/' + id" class="button flat">
						<img src="/image/icon/trophy.png">
						<span>{{ $t('see_all_trophies') }}</span>
					</router-link>
					<div class="button flat" @click="trophiesModeButton">
						<i class="material-icons">{{ (trophiesMode === 'grid' ? 'list' : 'view_module') }}</i>
					</div>
				</template>
				<div slot="content" class="trophies">
					<loader v-if="!farmer || !trophies" />
					<template v-else-if="farmer.trophies > 0 && trophies_list && trophies_grid">
						<div v-show="trophiesMode == 'list'" class="list trophies-container">
							<tooltip v-for="(trophy, t) in trophies_list" v-if="trophy != null" :key="t">
								<div slot="activator" class="trophy">
									<img :src="'/image/trophy/' + trophy.code + '.png'">
								</div>
								<b>{{ trophy.name }}</b>
								<span v-if="myFarmer">
									<br>{{ trophy.description }}
								</span>
								<br><span class="trophy-date">{{ LeekWars.formatDuration(trophy.date) }}</span>
							</tooltip>
						</div>
						<div v-show="trophiesMode == 'grid'" class="grid trophies-container">
							<tooltip v-for="(trophy, t) in trophies_grid" :key="t" :disabled="!trophy">
								<span slot="activator">
									<div v-if="trophy != null" class="trophy card">
										<img :src="'/image/trophy/' + trophy.code + '.png'">
									</div>
									<div v-else class="trophy locked">
										<img src="/image/unknown.png">
									</div>
								</span>
								<span v-if="trophy">
									<b>{{ trophy.name }}</b>
									<span v-if="trophy.description">
										<br>{{ trophy.description }}
									</span>
									<br>
									<i18n tag="span" class="trophy-date" path="unlocked_the">
										<span slot="date">{{ trophy.date | date }}</span>
									</i18n>
								</span>
							</tooltip>
						</div>
						<div v-if="bonus_trophies && bonus_trophies.length > 0">
							<h4 class="trophies-bonus">{{ $t('bonus_trophies') }}</h4>
							<div class="trophies-container">
								<tooltip v-for="trophy in bonus_trophies" :key="trophy.id">
									<div slot="activator" :class="{card: trophiesMode == 'grid'}" class="trophy">
										<img :src="'/image/trophy/' + trophy.code + '.png'">
									</div>
									<b>{{ trophy.name }}</b>
									<span v-if="myFarmer">
										<br>{{ trophy.description }}
									</span>
									<br><span class="date">{{ LeekWars.formatDuration(trophy.date) }}</span>
								</tooltip>
							</div>
						</div>
					</template>
					<div v-else-if="farmer.trophies == 0" class="grey">{{ $t('no_trophies_yet') }}</div>
				</div>
			</panel>
		</div>
		<div class="column12">
			<panel :title="$t('leeks')">
				<loader v-if="!farmer" />
				<div v-else>
					<rich-tooltip-leek v-for="leek in farmer.leeks" :id="leek.id" :key="leek.id">
						<router-link v-ripple :to="'/leek/' + leek.id" class="leek">
							<leek-image :leek="leek" :scale="0.9" />
							<br>
							<div class="name">{{ leek.name }}</div>
							<talent :talent="leek.talent" />
							<br>
							<span class="level">{{ $t('leek_level_n', [leek.level]) }}</span>
						</router-link>
					</rich-tooltip-leek>
				</div>
			</panel>
		</div>
		<div class="flex-container">
			<div class="column6">
				<panel v-if="!farmer || farmer.fight_history.length > 0" :title="$t('fights')">
					<template slot="actions">
						<router-link :to="'/farmer/' + id + '/history'" class="button flat">
							<i class="material-icons">history</i>
							<span>{{ $t('history') }}</span>
						</router-link>
					</template>
					<loader v-if="!farmer" />
					<fights-history v-else slot="content" :fights="farmer.fight_history" />
				</panel>
			</div>
			<div class="column6">
				<panel v-if="!farmer || farmer.tournaments.length > 0" :title="$t('tournaments')">
					<loader v-if="!farmer" />
					<tournaments-history v-else slot="content" :tournaments="farmer.tournaments" />
				</panel>
			</div>
		</div>
		<panel v-if="farmer && farmer.warnings && farmer.warnings.length" :title="$t('warnings')">
			<div slot="content" class="content warnings">
				<h4 v-if="myFarmer" class="warning-title">{{ $tc('you_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<h4 v-else class="warning-title">{{ $tc('farmer_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<div v-for="(warning, w) in farmer.warnings" :key="w" class="warning card">
					<div class="reason">{{ $t('moderation.reason_' + warning.reason) }} ({{ $t('warning_severity_s', [ warning.severity]) }})</div>
					<div class="message"><i>{{ warning.message }}</i></div>
					<i18n v-if="$store.getters.moderator" class="date" path="moderation.given_by_x_the_d">
						<router-link slot="farmer" :to="'/farmer/' + warning.author_id">{{ warning.author_name }}</router-link>
						<span slot="date">{{ warning.date | date }}</span>
					</i18n>
					<div v-else class="date">{{ warning.date | date }}</div>
				</div>
			</div>
		</panel>
		
		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="farmer && $store.state.connected && !myFarmer && !farmer.admin">
					<div class="report-button tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span>{{ $t('report') }}</span>
					</div>
				</div>
			</div>
		</div>

		<popup v-model="createTeamDialog" :width="500">
			<span slot="title">{{ $t('create_team') }}</span>
			{{ $t('team_name') }} <input v-model="createTeamName" type="text">
			<div slot="actions">
				<div class="dismiss">{{ $t('cancel') }}</div>
				<div @click="createTeam">{{ $t('create') }}</div>
			</div>
		</popup>

		<popup v-if="farmer" v-model="godfatherDialog" :width="600">
			<span slot="title">{{ $t('godfather_link') }}</span>
			{{ $t('godfather_link_description') }} :
			<br>
			<br>
			<div ref="godfatherLink" class="godfather-url">https://leekwars.com/godfather/{{ farmer.name }}</div>
		</popup>

		<popup v-if="farmer" v-model="countryDialog" :width="800">
			<span slot="title">{{ $t('country_selection') }}</span>
			<div class="country-dialog">
				<div class="country" code="null" @click="selectCountry(null)">
					<img src="/image/flag/_.png">
					<h4>{{ $t('no_country') }}</h4>
				</div>
				<div v-for="country in LeekWars.countries" :key="country.code" class="country" @click="selectCountry(country.code)">
					<img :src="'/image/flag/' + country.code + '.png'">
					<h4>{{ $t('country.' + country.code) }}</h4>
				</div>
			</div>
		</popup>
		
		<report-dialog v-if="farmer" v-model="reportDialog" :name="farmer.name" :target="farmer.id" :reasons="reasons" />
		
		<popup v-if="farmer" v-model="websiteDialog" :width="500">
			<span slot="title">{{ $t('add_website') }}</span>
			<div class="website-dialog">
				<input v-model="newWebsite" type="text" class="input">
			</div>
			<div slot="actions">
				<div @click="websiteDialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="changeWebsite">{{ $t('validate') }}</div>
			</div>
		</popup>
		
		<popup v-if="farmer" v-model="githubDialog" :width="500">
			<span slot="title">{{ $t('add_github') }}</span>
			<div class="github-dialog">
				<input v-model="newGitHub" type="text" class="input">
			</div>
			<div slot="actions">
				<div @click="githubDialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="changeGithub">{{ $t('validate') }}</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { Team } from '@/model/team'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "farmer", i18n: {} })
	export default class FarmerPage extends Vue {
		farmer: Farmer | null = null
		trophies: any = null
		trophiesMode: string = 'list'
		godfatherDialog: boolean = false
		countryDialog: boolean = false
		createTeamDialog: boolean = false
		createTeamName: string = ''
		reportDialog: boolean = false
		reasons = [Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR]
		websiteDialog: boolean = false
		newWebsite: string = ''
		githubDialog: boolean = false
		newGitHub: string = ''
		notfound: boolean = false

		get id(): any {
			return this.$route.params.id ? parseInt(this.$route.params.id, 10) : (this.$store.state.farmer ? this.$store.state.farmer.id : null)
		}
		get myFarmer() {
			return this.$store.state.farmer && this.id === this.$store.state.farmer.id
		}
		get talent_gains() {
			return this.farmer ? Math.round(this.farmer.talent_more / 3) : 0
		}
		get trophies_list() {
			const list: any[] = []
			for (const t in this.trophies) {
				if (this.trophies[t].unlocked && this.trophies[t].category !== 6) {
					list.push(this.trophies[t])
				}
			}
			list.sort((t1, t2) => t1.date - t2.date)
			return list
		}
		get trophies_grid() {
			const grid: {[key: string]: any} = {}
			for (const t in this.trophies) {
				if (this.trophies[t].category !== 6) {
					grid[t] = this.trophies[t].unlocked ? this.trophies[t] : null
				}
			}
			return grid
		}
		get bonus_trophies() {
			const bonus: any[] = []
			for (const t in this.trophies) {
				if (this.trophies[t].unlocked && this.trophies[t].category === 6) {
					bonus.push(this.trophies[t])
				}
			}
			return bonus
		}

		@Watch('id', {immediate: true})
		update() {
			this.farmer = null
			this.trophies = null
			this.notfound = false
			if (this.id === null) { return }
			if (this.myFarmer) {
				this.init(store.state.farmer!)
			} else {
				LeekWars.get('farmer/get/' + this.id).then(data => {
					this.init(data.farmer)
				}).error(error => {
					this.notfound = true
				})
			}
		}
		init(farmer: Farmer) {
			this.farmer = farmer
			if (this.farmer.banned || this.farmer.deleted) {
				return
			}
			LeekWars.setTitle(farmer.name, this.$t('farmer.n_trophies', [farmer.trophies]) as string)
			if (this.myFarmer) {
				LeekWars.setActions([
					{icon: 'power_settings_new', click: () => this.logout()}
				])
			} else {
				LeekWars.setActions([
					{image: 'icon/garden.png', click: () => this.$router.push('/garden/challenge/farmer/' + farmer.id)},
					{icon: 'question_answer', click: () => this.$router.push('/messages/new/' + farmer.id + '/' + farmer.name + '/'+ farmer.avatar_changed)}
				])
			}
			this.getTrophies()
			this.warnings()
			this.newWebsite = this.farmer.website
			this.newGitHub = this.farmer.github
			this.$root.$emit('loaded')
		}
		logout() {
			this.$store.commit('disconnect')
			this.$router.push('/')
		}
		trophiesModeButton() {
			if (this.trophiesMode === 'list') {
				this.trophiesMode = 'grid'
				localStorage.setItem('farmer/trophies-mode', 'grid')
			} else {
				this.trophiesMode = 'list'
				localStorage.setItem('farmer/trophies-mode', 'list')
			}
		}
		getTrophies() {
			if (!this.farmer) {	return }
			if (!('farmer/trophies-mode' in localStorage)) {
				localStorage.setItem('farmer/trophies-mode', 'list')
			}
			this.trophiesMode = localStorage.getItem('farmer/trophies-mode') || 'list'
			LeekWars.get('trophy/get-farmer-trophies/' + this.farmer.id + '/' + this.$i18n.locale).then(data => {
				this.trophies = data.trophies
			})
		}
		registerTournament() {
			if (this.farmer) {
				if (this.farmer.tournament.registered) {
					this.farmer.tournament.registered = false
					LeekWars.post('farmer/unregister-tournament')
				} else {
					this.farmer.tournament.registered = true
					LeekWars.post('farmer/register-tournament')
				}
			}
		}
		updateGarden() {
			if (this.farmer) {
				this.farmer.in_garden = !this.farmer.in_garden
				LeekWars.post('farmer/set-in-garden', {leek_id: this.farmer.id, in_garden: this.farmer.in_garden})
			}
		}
		openGodfatherDialog() {
			this.godfatherDialog = true
			LeekWars.selectText(this.$refs.godfatherLink)
		}
		selectCountry(code: string) {
			if (this.farmer) {
				this.farmer.country = code
				this.countryDialog = false
				LeekWars.post('farmer/change-country', {country_code: code})
			}
		}
		changeAvatar(e: Event) {
			if (!e || !e.target) { return }
			const input = e.target as HTMLInputElement
			if (!input || !input.files) { return }
			const file = input.files[0]

			if (!LeekWars.uploadCheck(file)) { return }

			LeekWars.fileToImage(file, (this.$refs.avatar as Vue).$el as Element)

			const formdata = new FormData()
			formdata.append('avatar', file)

			LeekWars.toast(this.$t('farmer.uploading_avatar') as string)

			LeekWars.post('farmer/set-avatar', formdata).then(data => {
				if (this.farmer) {
					LeekWars.toast(this.$t('farmer.upload_success') as string)
					this.farmer.avatar_changed = data.avatar_changed
				}
			}).error(error => {
				LeekWars.toast(this.$t('farmer.upload_failed', [error]) as string)
			})
		}
		warnings() {
			if (!this.farmer) { return }
			LeekWars.get('moderation/get-warnings/' + this.farmer.id).then(data => {
				if (this.farmer) {
					this.farmer.warnings = data.warnings
				}
			})
		}
		createTeam() {
			LeekWars.post('team/create', {team_name: this.createTeamName}).then(data => {
				LeekWars.toast(this.$i18n.t('farmer.team_created'))
				this.createTeamDialog = false
				const team = new Team()
				team.id = data.id
				team.name = this.createTeamName
				team.level = 1
				team.talent = 1000
				team.opened = true
				store.commit('create-team', team)
			}).error(error => {
				LeekWars.toast(this.$i18n.t('farmer.' + error))
			})
		}
		cancelCandidacy() {
			LeekWars.post('team/cancel-candidacy').then(data => {
				if (this.farmer) {
					LeekWars.toast(this.$i18n.t('farmer.candidacy_canceled'))
					this.farmer.candidacy = null
				}
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		changeWebsite() {
			if (!this.farmer) { return }
			this.farmer.website = this.newWebsite
			LeekWars.post('farmer/set-website', {website: this.newWebsite})
			this.websiteDialog = false
		}
		changeGithub() {
			if (!this.farmer) { return }
			this.farmer.github = this.newGitHub
			LeekWars.post('farmer/set-github', {github: this.newGitHub})
			this.githubDialog = false
		}
		sendMessage() {
			if (!this.farmer) { return }
			LeekWars.get('message/find-conversation/' + this.farmer.id).then(conversation => {
				store.commit('new-conversation', conversation)
				this.$router.push('/messages/conversation/' + conversation.id)
			}).error(() => {
				if (!this.farmer) { return }
				this.$router.push('/messages/new/' + this.farmer.id + '/' + this.farmer.name + '/' + this.farmer.avatar_changed)
			})
		}
	}
</script>

<style lang="scss" scoped>
	.state img {
		margin-right: 6px;
		width: 20px;
		margin-bottom: -3.5px;
	}
	.v-input--switch {
		margin-left: 8px;
		margin-right: -12px;
	}
	#app.app .panel.first .content {
		padding-top: 0;
	}
	.avatar-td {
		text-align: center;
		vertical-align: top;
	}
	.avatar {
		width: 200px;
		height: 200px;
	}
	.avatar-input {
		cursor: pointer;
		text-align: center;
		input {
			display: none;
		}
	}
	.country.no {
		font-style: italic;
	}
	.country-dialog .country {
		display: inline-block;
		text-align: center;
		width: 141px;
		margin: 1px;
		padding: 4px;
		cursor: pointer;
		vertical-align: top;
	}
	.country-dialog .country img {
		width: 32px;
	}
	.country-dialog .country:hover {
		background: white;
	}
	.country-dialog .country h4 {
		font-size: 14px;
		font-weight: normal;
	}
	.infos {
		text-align: left;
		width: 200px;
		margin: 0 auto;
		margin-top: 6px;
	}
	.infos .add {
		font-size: 13px;
		color: #999;
		cursor: pointer;
		margin: 3px 0;
	}
	.infos .info {
		padding: 1px;
		color: #888;
		font-size: 14px;
		word-break: break-all;
	}
	.infos .info a {
		color: #888;
	}
	.infos .info img {
		width: 20px;
	}
	.infos .info .label {
		line-height: 22px;
		vertical-align: top;
		margin-left: 5px;
		font-weight: bold;
	}
	.infos .info .edit {
		background-image: url("/image/edit_pen.png");
		background-size: cover;
		cursor: pointer;
		width: 12px;
		height: 12px;
		margin-left: 5px;
		display: none;
		margin-bottom: 2px;
	}
	.infos .info:hover .edit {
		display: inline-block;
	}
	.website-dialog input, .github-dialog input {
		width: calc(100% - 10px);
	}
	.team {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.team img {
		width: 150px;
		height: 150px;
		border-radius: 2px;
	}
	.talent-wrapper {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20px;
	}
	.talent-more {
		font-size: 18px;
		margin-left: 5px;
		color: #888;
	}
	.stats {
		vertical-align: top;
		.tournaments td {
			padding: 0 10px;
		}
		.small {
			font-size: 13px;
			vertical-align: top;
		}
		table {
			margin: 10px auto;
		}
		tr > td:nth-child(n+2) {
			border-left: 2px solid #ddd;
		}
		td {
			padding: 0 20px;
			text-align: center;
		}
		.big {
			font-size: 22px;
			font-weight: 300;
			color: #555;
		}
		.grey {
			color: #999;
		}
		.log-time, .godfather {
			margin-top: 10px;
			padding: 0 20px;
			font-size: 13px;
		}
		.log-time {
			margin-top: 20px;
		}
		.grades {
			margin-left: 20px;
		}
		.grade {
			border-radius: 5px;
			color: white;
			display: inline-block;
			padding: 3px 6px;
			margin-top: 5px;
			font-weight: normal;
			font-size: 14px;
			margin-right: 5px;
		}
		.grade.admin {
			background: #ff3333;
		}
		.grade.moderator {
			background: #ffa900;
		}
		.grade.contributor {
			background: #009c1d;
		}
	}
	.leek {
		text-align: center;
		display: inline-block;
		padding: 5px;
		.name {
			font-size: 20px;
			font-weight: 500;
			padding: 0 5px;
			padding-top: 4px;
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
		}
		.talent {
			margin: 5px 0;
		}
		.level {
			font-size: 17px;
			color: #555;
			font-weight: 500;
		}
		img {
			margin-bottom: 5px;
		}
	}
	.leek:hover {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.trophies-mode-button {
		padding: 8px 10px;
		cursor: pointer;
	}
	.trophies-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		grid-gap: 5px;
		padding: 5px;
	}
	.trophy {
		padding: 4px;
		border: 1px solid transparent;
		text-align: center;
	}
	.trophy img {
		width: 38px;
		height: 38px;
		vertical-align: bottom;
	}
	.trophy-date {
		padding-top: 4px;
		font-size: 13px;
		font-style: italic;
		color: #ddd;
	}
	.trophies.grid .trophy {
		background: white;
		border: 1px solid #ddd;
	}
	.trophies-bonus {
		margin: 5px;
	}
	.trophies .grey {
		color: #777;
		text-align: center;
		padding: 15px;
	}
	.warnings {
		text-align: center;
		padding-bottom: 20px;
		.warning-title {
			color: red;
			margin-bottom: 15px;
		}
		.warning {
			padding: 5px;
			background: white;
			border-radius: 2px;
			width: 250px;
			display: inline-block;
			margin: 6px;
			vertical-align: top;
			.reason {
				font-size: 15px;
			}
			.date {
				font-size: 12px;
				color: #666;
			}
			.author {
				font-size: 12px;
				color: #666;
			}
		}
	}
	.godfather-link {
		cursor: pointer;
	}
	.godfather-url {
		font-size: 20px;
		font-family: monospace;
		text-align: center;
		word-break: break-all;
	}
	.candidacy {
		color: #999;
	}
</style>
