<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>{{ $t('title') }}</h1>
			</div>
			<div class="tabs">
				<router-link to="/moderation/thugs">
					<div class="tab action content" icon="mdi-emoticon-devil-outline">
						<v-icon>mdi-emoticon-devil-outline</v-icon> Voyous
					</div>
				</router-link>
			</div>
		</div>
		<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column7 split-list">
			<panel>
				<template slot="title">Derniers signalements ({{ faults ? faults.length : '...' }})</template>
				<div slot="content" class="faults">
					<loader v-if="!faults" />
					<div v-else>
						<div v-if="faults.length == 0" class="empty">
							<v-icon>mdi-check-outline</v-icon>
							<div>Aucun signalement, noice !</div>
						</div>
						<router-link v-for="fault in faults" :key="fault.id" v-ripple :to="'/moderation/fault/' + fault.id" class="fault">

							<avatar :farmer="fault.target" />

							<div class="target-name">{{ fault.target.name }}</div>
							<div>Motif : <b class="reason">{{ $t('warning.reason_' + fault.reason_text) }}</b></div>

							<div class="reporting-count"><b>{{ fault.reportings.length }}</b> rapports</div>

							<div v-for="reporting in fault.reportings" :key="reporting.id" class="reporting">
								<div class="reporter">● Signalé par <router-link :to="'/farmer/' + reporting.farmer_id">{{ reporting.farmer_name }}</router-link>
									{{ LeekWars.formatDuration(reporting.date) }}
								</div>
								<div v-if="reporting.message.length > 0" class="message">&nbsp; « {{ reporting.message }} »</div>
							</div>
						</router-link>
					</div>
				</div>
			</panel>
		</div>
		<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column5 split-content">
			<panel v-if="selectedFault" title="Donner un avertissement">
				<div class="card farmer">
					<div class="title">Éleveur ciblé</div>
					<div class="flex">
						<rich-tooltip-farmer :id="selectedFault.target.id" v-slot="{ on }" :instant="true">
							<avatar :farmer="selectedFault.target" :on="on" />
						</rich-tooltip-farmer>
						<div class="infos">
							<router-link :to="'/farmer/' + selectedFault.target.id">
								<div class="name">{{ selectedFault.target.name }}</div>
							</router-link>
							<div class="info"><v-icon>mdi-account-plus</v-icon> Inscrit le <b>{{ selectedFault.target.register_time | date }}</b></div>
							<div class="info"><v-icon>mdi-power</v-icon> Connecté <b>{{ selectedFault.target.last_time | duration }}</b></div>
							<div class="info"><v-icon>mdi-sword</v-icon> Niveau total : {{ selectedFault.target.total_level }}</div>
							<div class="info"><img src="/image/icon/black/trophy.png"> {{ selectedFault.target.trophies }} trophées</div>
							<div v-if="selectedFault.target.messages" class="info">
								<router-link :to="'/search?farmer=' + selectedFault.target.name + '&order=date'">
									<v-icon>mdi-forum</v-icon> {{ selectedFault.target.messages }} messages
								</router-link>
							</div>
						</div>
					</div>
				</div>
				<div class="card warning">
					<div class="title">Motif</div>
					<div class="reason">Motif d'origine : <b>{{ $t('warning.reason_' + selectedFault.reason_text) }}</b></div>
					<div v-if="selectedFault.fight" class="details">Combat : <router-link :to="'/fight/' + selectedFault.fight">{{ selectedFault.fight }}</router-link></div>
					<v-select v-model="finalReason" :items="reasons" class="select" label="Changer de motif" item-value="id" item-text="t" hide-details :eager="true" dense outlined>
						<template v-slot:selection>
							{{ $t('warning.reason_' + finalReason) }}
						</template>
						<template slot="item" slot-scope="data">
							<v-list-item-content>
								<v-list-item-title class="select-item">
									<div class="name">{{ $t('warning.reason_' + data.item) }}</div>
									<div v-if="$root.$te('warning.reason_' + data.item + '_action', 'fr')" class="desc">{{ $t('warning.reason_' + data.item + '_action') }}</div>
								</v-list-item-title>
							</v-list-item-content>
						</template>
					</v-select>
					<div class="details">
						<div v-if="selectedFault.reason === finalReason">
							<div v-if="selectedFault.reason === Warning.INCORRECT_LEEK_NAME">
								Poireau :
								<rich-tooltip-leek :id="selectedFault.parameter" v-slot="{ on }" :instant="true">
									<router-link :to="'/leek/' + selectedFault.parameter">
										<span v-on="on">{{ selectedFault.data }}</span>
									</router-link>
								</rich-tooltip-leek>
							</div>
							<div v-else-if="selectedFault.reason === Warning.INCORRECT_AI_NAME">
								IA #{{ selectedFault.parameter }} : <b>{{ selectedFault.data }}</b>
							</div>
							<div v-else-if="selectedFault.reason === Warning.FLOOD_CHAT || selectedFault.reason === Warning.RUDE_CHAT">
								Message : {{ selectedFault.parameter }}
							</div>
							<div v-else-if="selectedFault.reason === Warning.RUDE_SAY && selectedFault.fight">
								Says de <b>{{ selectedFault.target.name }}</b> dans ce combat
								<div class="says">
									<div v-for="(say, s) in selectedFault.data" :key="s">{{ say[0] }} : « <i>{{ say[1] }}</i> »</div>
								</div>
							</div>
						</div>
					</div>
					<div v-if="$root.$te('warning.reason_' + finalReason + '_action')" class="warn-action">Action prise : <span class="text">{{ $t('warning.reason_' + finalReason + '_action') }}</span></div>
				</div>
				<div class="card warning">
					<div class="title">Gravité</div>
					<input v-model="severity" type="number" min="1" max="10" value="1"> (entre 1 et 10)
				</div>
				<div class="card warning">
					<div class="title">Message (facultatif)</div>
					<textarea v-model="message" class="warning-message" placeholder="Précisions sur l'avertissement, contexte etc."></textarea>
				</div>
				<center class="buttons">
					<v-btn color="primary" @click="archiveReporting"><v-icon>mdi-thumb-up-outline</v-icon> Archiver</v-btn>
					<v-btn color="error" @click="warningConfirmDialog = true"><v-icon>mdi-gavel</v-icon> Sanctionner</v-btn>
				</center>
			</panel>
		</div>

		<popup v-if="selectedFault" v-model="warningConfirmDialog" :width="600">
			<v-icon slot="icon">mdi-gavel</v-icon>
			<span slot="title">Envoyer un avertissement</span>
			<h4>Confirmez l'envoi de l'avertissement :</h4>
			<br>
			Éleveur : <b>{{ selectedFault.target.name }}</b> <br>
			Motif : <b>{{ $t('warning.reason_' + finalReason) }}</b> <br>
			Gravité : <b>{{ severity }}</b> <br>
			<span v-if="message">Message : "{{ message }}"</span>
			<div v-if="$root.$te('warning.reason_' + finalReason + '_action')" class="warn-action">Action prise : <span class="text">{{ $t('warning.reason_' + finalReason + '_action') }}</span></div>
			<div slot="actions">
				<div class="dismiss" @click="warningConfirmDialog = false">Annuler</div>
				<div class="red" @click="sendWarning"><v-icon>mdi-gavel</v-icon> Sanctionner</div>
			</div>
		</popup>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Fault, Warning } from '@/model/moderation'
	import router from '@/router'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	class ModerationRequest {
		faults!: Fault[]
		thugs!: Farmer[]
	}

	@Component({ name: "moderation", i18n: {} })
	export default class Moderation extends Vue {
		faults: Fault[] | null = null
		faultsById: {[key: number]: Fault} = {}
		thugs: any = null
		selectedFault: Fault | null = null
		warningConfirmDialog: boolean = false
		Warning = Warning
		message: string = ''
		severity: number = 0
		finalReason: number = 0
		actions = [{icon: 'mdi-emoticon-devil-outline', click: () => router.push("/moderation/thugs")}]

		get reasons() {
			const reasons = [
				Warning.INCORRECT_FARMER_NAME,
				Warning.RUDE_SAY,
				Warning.RUDE_FORUM,
				Warning.RUDE_CHAT,
				Warning.INSULT_MODERATOR,
				Warning.INSULT_ADMIN,
				Warning.CHEAT,
				Warning.FLOOD_FORUM,
				Warning.FLOOD_CHAT,
				Warning.PROMO_CHAT,
				Warning.PROMO_FORUM,
				Warning.INCORRECT_AVATAR,
				Warning.REPORTING_ABUSE,
				Warning.SERVER_ATTACK,
				Warning.BUG_EXPLOITATION,
				Warning.BOT_OR_SCRIPT_USE
			]
			if (this.selectedFault && reasons.indexOf(this.selectedFault.reason) === -1) {
				reasons.unshift(this.selectedFault.reason)
			}
			return reasons
		}

		created() {
			LeekWars.setActions(this.actions)
			LeekWars.get<ModerationRequest>('moderation/get-reportings').then(data => {
				this.faults = data.faults
				this.thugs = data.thugs
				for (const fault of this.faults) {
					this.faultsById[fault.id] = fault
				}
				LeekWars.setTitle(this.$t('title'), data.faults.length + ' signalements')
				this.update()
			})
			this.$root.$on('back', () => {
				this.$router.push('/moderation')
			})
		}

		@Watch('$route.params')
		update() {
			const faultID = parseInt(this.$route.params.id, 10)
			if (faultID in this.faultsById) {
				this.selectedFault = this.faultsById[faultID]
				this.finalReason = this.selectedFault.reason
				this.message = ''
				this.severity = 1
				LeekWars.splitShowContent()
			} else if (!LeekWars.mobile && this.faults && this.faults.length) {
				this.$router.push('/moderation/fault/' + this.faults[0].id)
			} else {
				LeekWars.splitShowList()
			}
		}
		ban(farmer: Farmer) {
			LeekWars.post('moderation/ban', {target: farmer.id}).then(data => {
				LeekWars.toast("Éleveur banni")
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		giveWarning() {
			this.warningConfirmDialog = true
		}
		archiveReporting() {
			if (!this.selectedFault) { return }
			const fault = this.selectedFault
			LeekWars.post('moderation/archive', {target: fault.target.id, reason: fault.reason, parameter: fault.parameter}).then(data => {
				LeekWars.toast(this.$t('moderation.reporting_deleted') as string)
				this.faults!.splice(this.faults!.indexOf(fault), 1)
				Vue.delete(this.faultsById, '' + fault.id)
				this.$router.push('/moderation')
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		sendWarning() {
			if (!this.selectedFault) { return }
			const fault = this.selectedFault
			LeekWars.post('moderation/warn', {target: fault.target.id, reason: fault.reason, new_reason: this.finalReason, message: this.message, severity: this.severity, parameter: this.selectedFault.parameter}).then(data => {
				LeekWars.toast(i18n.t('moderation.warning_sent') as string)
				this.faults!.splice(this.faults!.indexOf(fault), 1)
				Vue.delete(this.faultsById, '' + fault.id)
				this.warningConfirmDialog = false
				this.$router.push('/moderation')
			}).error(error => {
				LeekWars.toast(error)
			})
		}
	}
</script>

<style lang="scss" scoped>
	.column5 {
		position: sticky;
		top: 15px;
	}
	#app.app .panel.first .header {
		display: none;
	}
	.empty {
		text-align: center;
		padding: 20px;
		i {
			font-size: 100px;
			color: #ccc;
		}
	}
	.faults {
		padding: 10px;
	}
	.fault {
		display: block;
		padding: 8px;
		padding-bottom: 4px;
		border: 1px solid #ddd;
		border-radius: 2px;
		margin-bottom: 10px;
	}
	.fault.router-link-active {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	#app.app .faults .fault {
		margin: 0;
		margin-bottom: 10px;
	}
	.faults .fault.selected {
		border: 2px solid #ddd;
		opacity: 1;
	}
	.faults .fault img {
		width: 80px;
		float: left;
		margin-right: 10px;
		margin-bottom: 4px;
	}
	.faults .fault .target-name {
		font-weight: 300;
		font-size: 20px;
		margin-bottom: 5px;
	}
	.faults .fault .reporting-count {
		margin-bottom: 9px;
	}
	.faults .fault .reporting {
		margin-bottom: 5px;
		.message {
			padding: 3px 0;
		}
	}
	.faults .fault .reporter {
		color: #666;
		font-size: 14px;
	}
	.title {
		display: block;
		text-align: left;
		text-transform: uppercase;
		margin-top: -2px;
		font-size: 14px;
		color: #555;
		margin-bottom: 8px;
	}
	.warning {
		margin-bottom: 10px;
		padding: 10px;
	}
	.select {
		margin: 10px 0;
		::v-deep input {
			border: none;
		}
		::v-deep legend {
			margin-left: 17px;
		}
		::v-deep label.v-label {
			z-index: 2;
			left: -6px;
		}
	}
	.select-item {
		max-width: 500px;
	}
	.desc {
		font-weight: normal;
		color: #555;
		white-space: normal;
	}
	.details {
		margin-top: 5px;
		a {
			color: #5fad1b;
			font-weight: bold;
		}
	}
	.says {
		max-height: 150px;
		overflow-y: auto;
		border: 1px solid #ddd;
		padding: 4px;
		margin: 4px 0;
	}
	.farmer {
		padding: 10px;
		text-align: center;
		margin-bottom: 10px;
		.avatar {
			flex: 0 0 140px;
			width: 140px;
			height: 140px;
		}
		.infos {
			flex: 1;
			text-align: left;
			padding: 0 12px;
			.info {
				padding: 2px 0;
			}
			img {
				width: 16px;
				vertical-align: bottom;
			}
			i {
				font-size: 16px;
			}
			.name {
				margin-bottom: 5px;
				font-size: 22px;
			}
		}
	}
	.warn-action {
		margin-top: 6px;
		text-align: justify;
		.text {
			color: #555;
		}
	}
	.warning-message {
		width: 100%;
		max-width: 100%;
		min-height: 50px;
		padding: 3px 6px;
	}
	.thugs {
		padding: 10px;
	}
	.thugs .thug {
		margin: 3px;
		display: flex;
		align-items: center;
	}
	.thugs .thug a, .thugs {
		vertical-align: top;
	}
	.thug .button {
		vertical-align: top;
		margin: 0;
		margin-top: -3px;
		float: right;
	}
	.thugs .thug img {
		margin-right: 5px;
		width: 25px;
		height: 25px;
	}
	.thug .text {
		flex: 1;
	}
	.buttons {
		display: flex;
		margin-top: 10px;
	}
	.buttons button {
		flex: 1;
		white-space: nowrap;
		margin: 0;
		&:first-child {
			margin-right: 5px;
		}
		i {
			margin-right: 5px;
		}
	}
</style>