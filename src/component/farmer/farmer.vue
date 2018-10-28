<template lang="html">
	<div>
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
					<v-tooltip :open-delay="0" :close-delay="0" bottom>
						<div slot="activator" class="tab">
							<img src="/image/icon/trophy.png">
							<span v-if="farmer.tournament && !farmer.tournament.registered" class="register" @click="registerTournament">{{ $t('register_to_tournament') }}</span>
							<span v-else class="unregister" @click="registerTournament">{{ $t('unregister') }}</span>
						</div>
						{{ $t('tournament_time') }}
					</v-tooltip>
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
					<router-link v-if="$store.getters.connected" :to="'/messages/new/' + farmer.id + '/' + farmer.name + '/' + farmer.avatar_changed">
						<div :link="'/messages/new/' + farmer.id + '/' + farmer.name + '/' + farmer.avatar_changed" class="tab action">
							<i class="material-icons">email</i>
							<span>{{ $t('send_private_message') }}</span>
						</div>
					</router-link>
					<router-link v-if="$store.getters.connected" :to="'/garden/challenge/farmer/' + farmer.id">
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
				<div class="panel">
					<div v-if="farmer" class="content avatar-td">
						<div v-if="myFarmer">
							<v-tooltip :open-delay="0" :close-delay="0" bottom>
								<div slot="activator" class="avatar-input">
									<input ref="avatarInput" type="file" @change="changeAvatar">
									<avatar ref="avatar" :farmer="farmer" @click.native="$refs.avatarInput.click()" />
								</div>
								{{ $t('click_to_change_avatar') }}
							</v-tooltip>
						</div>
						<div v-else>
							<avatar :farmer="farmer" />
						</div>
						<div class="infos">
							<router-link v-if="farmer.forum_messages" :to="'/search/-/' + farmer.name">
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
								<img src="/image/website.png"><a :href="farmer.website" target="_blank"><span class="text label">{{ farmer.website }}</span></a>
								<span v-if="myFarmer" class="edit" @click="websiteDialog = true"></span>
							</div>
							<div v-else-if="myFarmer" class="add add-website" @click="websiteDialog = true">{{ $t('add_website') }}</div>
							<div v-if="farmer.github" class="info github">
								<img src="/image/github.png"><a :href="'https://github.com/' + farmer.github" target="_blank"><span class="text label">{{ farmer.github }}</span></a>
								<span v-if="myFarmer" class="edit" @click="githubDialog = true"></span>
							</div>
							<div v-else-if="myFarmer" class="add add-github" @click="githubDialog = true">{{ $t('add_github') }}</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="column4">
				<div class="panel">
					<div v-if="farmer" class="content stats">
						<div class="talent-wrapper">
							<v-tooltip bottom open-delay="0" close-delay="0">
								<talent slot="activator" :talent="farmer.talent" />
								<div>{{ $t('talent') }}</div>
							</v-tooltip>
							<v-tooltip bottom open-delay="0" close-delay="0">
								<div slot="activator" class="talent-more">({{ farmer.talent_more >= 0 ? '+' + farmer.talent_more : farmer.talent_more }})</div>
								<template v-if="farmer.talent_more > 0">
									<span v-html="$t('report.talent_difference_farmer', [farmer.name, farmer.talent_more, talent_gains + '%'])"></span>
								</template>
								<div v-else v-html="$t('report.talent_difference_farmer_no_gains', [farmer.name])"></div>
							</v-tooltip>
						</div>
						
						<v-tooltip bottom open-delay="0" close-delay="0">
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
						</v-tooltip>
		
						<table v-if="farmer.won_solo_tournaments + farmer.won_farmer_tournaments + farmer.won_team_tournaments > 0" class="tournaments">
							<tr>
								<td class="grey">Tournois</td>
								<td width="25%"><span class="big">{{ farmer.won_solo_tournaments }}</span><br><span class="small grey">solo</span></td>
								<td width="25%"><span class="big">{{ farmer.won_farmer_tournaments }}</span><br><span class="small grey">éleveur</span></td>
								<td width="25%"><span class="big">{{ farmer.won_team_tournaments }}</span><br><span class="small grey">équipe</span></td>
							</tr>
						</table>
		
						<div class="log-time grey">
							<span v-if="$store.getters.connected && $store.state.farmer.moderator">{{ $t('registered_the', [LeekWars.formatDateTime(farmer.register_date)]) }}</span>
							<span v-else>{{ $t('registered_the', [LeekWars.formatDate(farmer.register_date)]) }}</span>
							<br>
							<span v-if="farmer.connected">{{ $t('connected') }}</span>
							<span v-else>{{ $t('last_connection', [LeekWars.formatDuration(farmer.last_connection)]) }}</span>
						</div>
						<div class="grades">
							<div v-if="farmer.admin" class="grade admin">{{ $t('admin') }}</div>
							<div v-else-if="farmer.moderator" class="grade moderator">{{ $t('moderator') }}</div>
							<div v-else-if="farmer.contributor" class="grade contributor">{{ $t('contributor') }}</div>
						</div>
						<div class="godfather grey">
							<div v-if="farmer.godfather">
								<i18n path="godson_of" tag="div">
									<router-link :to="'/farmer/' + farmer.godfather.id" place="farmer">{{ farmer.godfather.name }}</router-link>
								</i18n>
							</div>
							<div v-if="farmer.godsons.length">
								<i18n path="godfather_of" tag="div">
									<span place="farmers">
										<span v-for="(godson, i) in farmer.godsons" :key="i">
											<router-link :to="'/farmer/' + godson.id">{{ godson.name }}</router-link><span v-if="i < farmer.godsons.length - 1">, </span>
										</span> 
									</span>
								</i18n>
							</div>
							<div v-if="myFarmer" class="godfather-link" @click="openGodfatherDialog"><br>{{ $t('godfather_link') }}</div>
						</div>
					</div>
				</div>
			</div>
			<div class="column4">
				<div class="panel">
					<div v-if="farmer" class="content team center">
						<div v-if="farmer.team">
							<router-link :to="'/team/' + farmer.team.id">
								<emblem :team="farmer.team" />
								<br>
								<h2>{{ farmer.team.name }}</h2>
								{{ $t('leek_level_n', [farmer.team.level]) }}
							</router-link>
						</div>
						<div v-else>
							<div v-if="myFarmer">
								<div class="button" @click="createTeamDialog = true">{{ $t('create_team') }}</div>
								<div v-if="farmer.candidacy">
									<br><br><br>
									<a>{{ $t('candidacy_for_team', [farmer.candidacy.team_id, farmer.candidacy.team_name]) }}</a>
									<br><br>
									<div class="button" @click="cancelCandidacy">{{ $t('cancel_candidacy') }}</div>
								</div>
							</div>
							<div v-else>
								<span class="grey">{{ $t('no_team') }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="column12">
			<div v-if="farmer" class="panel">
				<div v-if="farmer" class="header">
					<h2>{{ $t('trophies') }} ({{ farmer.trophies }})</h2>
					<div class="right">
						<router-link :to="'/trophies/' + farmer.id">
							<div class="button flat">
								<img src="/image/icon/trophy.png"> {{ $t('see_all_trophies') }}
							</div>
						</router-link>
						<img :src="'/image/' + (trophiesMode === 'grid' ? 'list' : 'grid') + '.png'" class="trophies-mode-button" @click="trophiesModeButton">
					</div>
				</div>
				<div class="content trophies">
					<loader v-if="!trophies_list" />
					<div v-if="farmer.trophies > 0 && trophies_list && trophies_grid">
						<div v-show="trophiesMode == 'list'" class="list trophies-container">
							<v-tooltip v-for="(trophy, t) in trophies_list" v-if="trophy != null" :key="t" :open-delay="0" :close-delay="0" bottom>
								<div slot="activator" class="trophy">
									<img :src="'/image/trophy/' + trophy.code + '.png'">
								</div>
								<b>{{ trophy.name }}</b>
								<span v-if="myFarmer">
									<br>{{ trophy.description }}
								</span>
								<br><span class="trophy-date">{{ LeekWars.formatDuration(trophy.date) }}</span>
							</v-tooltip>
						</div>
						<div v-show="trophiesMode == 'grid'" class="grid trophies-container">
							<v-tooltip v-for="(trophy, t) in trophies_grid" :key="t" :open-delay="0" :close-delay="0" :disabled="!trophy" bottom>
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
									<br><span class="date">{{ LeekWars.formatDuration(trophy.date) }}</span>
								</span>
							</v-tooltip>
						</div>
						<div v-if="bonus_trophies && bonus_trophies.length > 0">
							<h4 class="trophies-bonus">{{ $t('bonus_trophies') }}</h4>
							<div class="trophies-container">
								<v-tooltip v-for="trophy in bonus_trophies" :key="trophy.id" :open-delay="0" :close-delay="0" bottom>
									<div slot="activator" :class="{card: trophiesMode == 'grid'}" class="trophy">
										<img :src="'/image/trophy/' + trophy.code + '.png'">
									</div>
									<b>{{ trophy.name }}</b>
									<span v-if="myFarmer">
										<br>{{ trophy.description }}
									</span>
									<br><span class="date">{{ LeekWars.formatDuration(trophy.date) }}</span>
								</v-tooltip>
							</div>
						</div>
					</div>
					<div v-else-if="farmer.trophies == 0" class="grey">{{ $t('no_trophies_yet') }}</div>
				</div>
			</div>
		</div>
		<div class="column12">
			<div class="panel">
				<div class="header">
					<h2>{{ $t('leeks') }}</h2>
				</div>
				<div v-if="farmer" class="content">
					<router-link v-for="leek in farmer.leeks" :key="leek.id" :to="'/leek/' + leek.id" class="leek">
						<leek-image :leek="leek" :scale="0.9" />
						<br>
						<div class="name">{{ leek.name }}</div>
						<talent :talent="leek.talent" />
						<br>
						<span class="level">{{ $t('leek_level_n', [leek.level]) }}</span>
					</router-link>
				</div>
			</div>
		</div>
		<div v-if="farmer" class="flex-container">
			<div class="column6">
				<div v-if="farmer && farmer.fight_history.length > 0" class="panel">
					<div class="header">
						<h2>{{ $t('fights') }}</h2>
						<div class="right">
							<router-link :to="'/farmer/' + farmer.id + '/history'">
								<div class="button flat">{{ $t('history') }}</div>
							</router-link>
						</div>
					</div>
					<fights-history :fights="farmer.fight_history" />
				</div>
			</div>
			<div class="column6">
				<div v-if="farmer.tournaments.length > 0" class="panel">
					<div class="header">
						<h2>{{ $t('tournaments') }}</h2>
					</div>
					<tournaments-history :tournaments="farmer.tournaments" />
				</div>
			</div>
		</div>
		<div v-if="farmer && farmer.warnings && farmer.warnings.length" class="panel">
			<div class="header">
				<h2>{{ $t('warnings') }}</h2>
			</div>
			<div class="content warnings">
				<h4 v-if="myFarmer" class="warning-title">{{ $tc('you_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<h4 v-else class="warning-title">{{ $tc('farmer_have_n_warnings', farmer.warnings.length, [farmer.warnings.length]) }}</h4>
				<div v-for="(warning, w) in farmer.warnings" :key="w" class="warning card">
					<div class="reason">{{ $t('moderation.reason_' + warning.reason) }} ({{ $t('warning_severity_s', [ warning.severity]) }})</div>
					<div class="message">&nbsp;<i>{{ warning.message }}</i></div>
					<i18n v-if="$store.state.moderator" class="date" path="moderation.given_by_x_the_d">
						<router-link :to="'/farmer/' + warning.author_id" place="farmer">{{ warning.author_name }}</router-link>
						<span place="date">{{ warning.date | date }}</span>
					</i18n>
					<div v-else class="date">{{ warning.date | date }}</div>
				</div>
			</div>
		</div>
		
		<div class="page-footer page-bar">
			<div class="tabs">
				<div v-if="farmer && $store.getters.connected && !myFarmer && !farmer.admin">
					<div class="report-button tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span>{{ $t('report') }}</span>
					</div>
				</div>
			</div>
		</div>

		<v-dialog v-model="createTeamDialog" max-width="500">
			<div class="title">{{ $t('create_team') }}</div>
			<div class="content">
				{{ $t('team_name') }} <input v-model="createTeamName" type="text">
			</div>
			<div class="actions">
				<div class="dismiss">{{ $t('cancel') }}</div>
				<div @click="createTeam">{{ $t('create') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="farmer" v-model="godfatherDialog" max-width="600">
			<div class="title">{{ $t('godfather_link') }}</div>
			<div class="content">
				{{ $t('godfather_link_description') }} :
				<br>
				<br>
				<div ref="godfatherLink" class="godfather-url">https://leekwars.com/godfather/{{ farmer.name }}</div>
			</div>
			<div class="actions">
				<div @click="godfatherDialog = false">{{ $t('godfather_link_ok') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-if="farmer" v-model="countryDialog" max-width="800">
			<div class="title">{{ $t('country_selection') }}</div>
			<div class="content country-dialog">
				<div class="country" code="null" @click="selectCountry(null)">
					<img src="/image/flag/_.png">
					<h4>{{ $t('no_country') }}</h4>
				</div>
				<div v-for="country in LeekWars.countries" :key="country.code" class="country" @click="selectCountry(country.code)">
					<img :src="'/image/flag/' + country.code + '.png'">
					<h4>{{ $t('country.' + country.code) }}</h4>
				</div>
			</div>
		</v-dialog>
		
		<report-dialog v-if="farmer" v-model="reportDialog" :name="farmer.name" :target="farmer.id" :reasons="reasons" />
		
		<v-dialog v-if="farmer" v-model="websiteDialog" max-width="500">
			<div class="title">{{ $t('add_website') }}</div>
			<div class="content website-dialog">
				<input v-model="newWebsite" type="text" class="input">
			</div>
			<div class="actions">
				<div @click="websiteDialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="changeWebsite">{{ $t('validate') }}</div>
			</div>
		</v-dialog>
		
		<v-dialog v-if="farmer" v-model="githubDialog" max-width="500">
			<div class="title">{{ $t('add_github') }}</div>
			<div class="content github-dialog">
				<input v-model="newGitHub" type="text" class="input">
			</div>
			<div class="actions">
				<div @click="githubDialog = false">{{ $t('cancel') }}</div>
				<div class="green" @click="changeGithub">{{ $t('validate') }}</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "farmer", i18n: {} })
	export default class FarmerPage extends Vue {
		farmer: Farmer | null = null
		trophies_list: any[] | null = null
		trophies_grid: any[] | null = null
		bonus_trophies: any[] | null = null
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
		get myFarmer() {
			return this.$store.getters.connected && this.farmer && this.farmer.id === this.$store.state.farmer.id
		}
		get talent_gains() {
			return this.farmer ? Math.round(this.farmer.talent_more / 3) : 0
		}
		@Watch('$route.params', {immediate: true})
		update() {
			const id = this.$route.params.id
			if (this.farmer) {
				this.farmer = null
			}
			if (this.$store.getters.connected && (!id || id === this.$store.state.farmer.id)) {
				this.init(this.$store.state.farmer)
			} else {
				LeekWars.get<any>('farmer/get/' + id).then((data) => {
					if (data.data.success) {
						this.init(data.data.farmer)
					} else {
						// LeekWars.error('Unknown farmer!')
						return
					}
				})
			}
		}
		init(farmer: Farmer) {
			this.farmer = farmer
			if (this.farmer.banned) {
				// LeekWars.error(_.lang.get('farmer', 'banned'), _.lang.get('farmer', 'banned_message'))
				return
			}
			if (this.farmer.deleted) {
				// LeekWars.error(_.lang.get('farmer', 'deleted'), _.lang.get('farmer', 'deleted_message'))
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
			this.trophies()
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
		trophies() {
			if (!this.farmer) {
				return
			}
			if (!('farmer/trophies-mode' in localStorage)) {
				localStorage.setItem('farmer/trophies-mode', 'list')
			}
			this.trophiesMode = localStorage.getItem('farmer/trophies-mode') || 'list'

			LeekWars.get<any>('trophy/get-farmer-trophies/' + this.farmer.id + '/' + this.$i18n.locale + '/' + this.$store.state.token).then((data) => {
				const list: any[] = []
				const bonus: any[] = []
				for (const t in data.data.trophies) {
					if (data.data.trophies[t] != null && data.data.trophies[t].unlocked) {
						if (data.data.trophies[t].category === 6) {
							bonus.push(data.data.trophies[t])
							data.data.trophies[t] = null
						} else {
							list.push(data.data.trophies[t])
						}
					} else {
						data.data.trophies[t] = null
					}
				}
				list.sort((t1, t2) => t1.date - t2.date)
				this.trophies_list = list
				this.trophies_grid = data.data.trophies
				this.bonus_trophies = bonus
			})
		}
		registerTournament() {
			if (this.farmer) {
				if (this.farmer.tournament.registered) {
					this.farmer.tournament.registered = false
					LeekWars.post('farmer/unregister-tournament', {})
				} else {
					this.farmer.tournament.registered = true
					LeekWars.post('farmer/register-tournament', {})
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

			LeekWars.post('farmer/set-avatar', formdata).then((data) => {
				if (data.data.success) {
					if (this.farmer) {
						LeekWars.toast(this.$t('farmer.upload_success') as string)
						this.farmer.avatar_changed = data.data.avatar_changed
					}
				} else {
					LeekWars.toast(this.$t('farmer.upload_failed', [data.data.error]) as string)
				}
			})
		}
		warnings() {
			if (!this.farmer) { return }
			LeekWars.get<any>('moderation/get-warnings/' + this.farmer.id + '/' + store.state.token).then((data) => {
				if (data.data.success && this.farmer) {
					this.farmer.warnings = data.data.warnings
				}
			})
		}
		createTeam() {
			LeekWars.post('team/create', {team_name: this.createTeamName}).then((data) => {
				if (data.data.success) {
					LeekWars.toast(this.$i18n.t('farmer.team_created'))
					// TODO reload
					this.createTeamDialog = false
				} else {
					LeekWars.toast(this.$i18n.t('farmer.' + data.data.error))
				}
			})
		}
		cancelCandidacy() {
			LeekWars.post('team/cancel-candidacy', {}).then((data) => {
				if (data.data.success) {
					if (this.farmer) {
						LeekWars.toast(this.$i18n.t('farmer.candidacy_canceled'))
						this.farmer.candidacy = null
					}
				} else {
					LeekWars.toast(data.data.error)
				}
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
	.trophies {
		text-align: left;
	}
	.trophies-mode-button {
		padding: 8px 10px;
		cursor: pointer;
	}
	.trophies-container {
		display: inline-block;
	}
	#app.app .trophies-container {
		text-align: center;
	}
	.trophy {
		display: inline-block;
		margin: 2.1px;
		padding: 4px;
		border: 1px solid transparent;
		vertical-align: bottom;
	}
	#app.app .trophy {
		padding: 2px;
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
		margin: 5px 0;
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
</style>
