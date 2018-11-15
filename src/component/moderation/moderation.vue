<template>
	<div v-if="faults">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column7 split-list">
			<panel>
				<h2 slot="title">Derniers signalements ({{ faults.length }})</h2> 
				<div slot="content" class="faults">
					<div v-if="faults.length == 0">Aucun signalement !</div>
					<router-link v-for="fault in faults" :key="fault.id" :to="'/moderation/fault/' + fault.id" class="fault">

						<avatar :farmer="fault.target" />

						<div class="target-name">{{ fault.target.name }}</div>
						<div>Motif : <b class="reason">{{ $t('reason_' + fault.reason_text) }}</b></div>

						<div class="reporting-count"><b>{{ fault.reportings.length }}</b> rapports</div>

						<div v-for="reporting in fault.reportings" :key="reporting.id" class="reporting">
							<div class="reporter">● Signalé par <router-link :to="'/farmer/' + reporting.farmer_id">{{ reporting.farmer_name }}</router-link>
								{{ LeekWars.formatDuration(reporting.date) }}
							</div>
							<div v-if="reporting.message.length > 0" class="message">&nbsp; « {{ reporting.message }} »</div>
						</div>
					</router-link>
				</div>
			</panel>
		</div>
		<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column5 split-content">
			<panel v-if="selectedFault" title="Donner un avertissement">
				<div class="warning">
					<router-link :to="'/farmer/' + selectedFault.target.id">
						<avatar :farmer="selectedFault.target" class="warning-avatar" />
						<h2>{{ selectedFault.target.name }}</h2>
					</router-link>
					<h4 class="reason">Motif : {{ $t('reason_' + selectedFault.reason_text) }}</h4>
					<div class="details">
						<div v-if="selectedFault.reason === Warning.INCORRECT_LEEK_NAME">
							Poireau : <router-link :to="'/leek/' + selectedFault.parameter">{{ selectedFault.data }}</router-link>
						</div>
						<div v-else-if="selectedFault.reason === Warning.INCORRECT_AI_NAME">
							AI : {{ selectedFault.parameter }} : {{ selectedFault.data }}
						</div>
						<div v-else-if="selectedFault.reason === Warning.FLOOD_CHAT || selectedFault.reason === Warning.RUDE_CHAT">
							Message : {{ selectedFault.parameter }}
						</div>
					</div>
				</div>
				<h4>Gravité</h4>
				<input type="number" min="1" max="10" value="1" v-model="severity"> (entre 1 et 10)<br><br>
				<h4>Message (facultatif)</h4>
				<textarea class="warning-message" v-model="message"></textarea>
				<br><br>
				<center class="buttons">
					<div class="button green" @click="archiveReporting">Archiver</div>
					<div class="button red" @click="warningConfirmDialog = true">Donner avertissement</div>
				</center>
			</panel>
			<panel title="Top Voyous">
				<div slot="content" class="thugs">
					<div v-for="thug in thugs" :key="thug.id" class="thug">
						<avatar :farmer="thug" />
						<router-link :to="'/farmer/' + thug.id" class="text">{{ thug.name }} ({{ thug.warnings }})</router-link> 
						<div class="button" @click="ban(thug)">Bannir</div>
					</div>
				</div>
			</panel>
		</div>

		<v-dialog v-if="selectedFault" v-model="warningConfirmDialog" :max-width="700">
			<div class="title">Envoyer un avertissement</div>
			<div class="content">
				<h2>Confirmez l'envoi de l'avertissement :</h2>
				<br>
				Éleveur : <b>{{ selectedFault.target.name }}</b> <br>
				Motif : <b>{{ $t('reason_' + selectedFault.reason_text) }}</b> <br>
				Gravité : <b>{{ severity }}</b> <br>
				<span v-if="message">Message : "{{ message }}"</span>
			</div>
			<div class="actions">
				<div class="dismiss" @click="warningConfirmDialog = false">Annuler</div>
				<div class="red" @click="sendWarning">Envoyer</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Fault, Warning } from '@/model/moderation'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	class ModerationRequest {
		faults!: Fault[]
		thugs!: Farmer[]
	}

	@Component({ name: "moderation", i18n: {} })
	export default class Moderation extends Vue {
		faults: Fault[] = []
		faultsById: {[key: number]: Fault} = {}
		thugs: any = null
		selectedFault: Fault | null = null
		warningConfirmDialog: boolean = false
		Warning = Warning
		message: string = ''
		severity: number = 0

		created() {
			LeekWars.get<ModerationRequest>('moderation/get-reportings/' + this.$store.state.token).then((data) => {
				this.faults = data.faults
				this.thugs = data.thugs
				for (const fault of this.faults) {
					this.faultsById[fault.id] = fault
				}
				LeekWars.setTitle(this.$t('moderation.title'), data.faults.length + ' signalements')
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
				this.message = ''
				this.severity = 1
				LeekWars.splitShowContent()
			} else if (!LeekWars.mobile && this.faults.length) {
				this.$router.push('/moderation/fault/' + this.faults[0].id)
			} else {
				LeekWars.splitShowList()
			}
		}
		ban(farmer: Farmer) {
			LeekWars.post('moderation/ban', {target: farmer.id}).then((data) => {
				if (data.success) {
					LeekWars.toast("Éleveur banni")
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		giveWarning() {
			this.warningConfirmDialog = true
		}
		archiveReporting() {
			if (!this.selectedFault) { return }
			const fault = this.selectedFault
			LeekWars.post('moderation/archive', {target: fault.target.id, reason: fault.reason, parameter: fault.parameter}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$t('moderation.reporting_deleted') as string)
					this.faults.splice(this.faults.indexOf(fault), 1)
					Vue.delete(this.faultsById, '' + fault.id)
					this.$router.push('/moderation')
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		sendWarning() {
			if (!this.selectedFault) { return }
			const fault = this.selectedFault
			LeekWars.post('moderation/warn', {target: fault.target.id, reason: fault.reason, message: this.message, severity: this.severity, parameter: this.selectedFault.parameter}).then((data) => {
				if (data.success) {
					LeekWars.toast(i18n.t('moderation.warning_sent') as string)
					this.faults.splice(this.faults.indexOf(fault), 1)
					Vue.delete(this.faultsById, '' + fault.id)
					this.warningConfirmDialog = false
					this.$router.push('/moderation')
				} else {
					LeekWars.toast(data.error)
				}
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
	}
	.faults .fault .reporter {
		color: #666;
		font-size: 14px;
	}
	.warning-avatar {
		width: 140px;
		height: 140px;
	}
	.warning {
		text-align: center;
		padding: 10px;
	}
	.warning .details a {
		color: #5fad1b;
	}
	.warning-message {
		width: calc(100% - 14px);
		max-width: calc(100% - 14px);
		margin: 2px 0;
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
	}
	.buttons .button {
		flex: 1;
		white-space: nowrap;
	}
</style>