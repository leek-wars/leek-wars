<template>
	<div v-if="faults">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div v-show="!LeekWars.mobile || !LeekWars.splitBack" class="column7 split-list">
			<div class="panel">
				<div class="header">
					<h2>Derniers signalements ({{ faults.length }})</h2>
				</div>
				<div class="faults content">
					<div v-if="faults.length == 0">Aucun signalement !</div>
					<router-link v-for="fault in faults" :key="fault.id" :to="'/moderation/fault/' + fault.id" class="fault" target="{fault.target.id}" reason="{fault.reason}" parameter="{fault.parameter}" data="{fault.data}">

						<avatar :farmer="fault.target" />

						<div class="target-name">{{ fault.target.name }}</div>
						<div>Motif : <span class="reason">{{ $t('reason_' + fault.reason_text) }}</span></div>

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
		</div>
		<div v-show="!LeekWars.mobile || LeekWars.splitBack" class="column5 split-content">
			<div v-if="selectedFault" class="panel">
				<div class="header">
					<h2>Donner un avertissement</h2>
				</div>
				<div class="content">
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
					<input type="number" min="1" max="10" value="1"> (entre 1 et 10)<br>
					<h4>Message (facultatif)</h4>
					<textarea class="warning-message"></textarea>
					<br><br>
					<center>
						<div class="button green">Supprimer le signalement</div>
						<div class="button red">Donner avertissement</div>
					</center>
				</div>
			</div>
			<div class="panel">
				<div class="header">
					<h2>Top Voyous</h2>
				</div>
				<div class="thugs content">
					<div v-for="thug in thugs" :key="thug.id" class="thug">
						<avatar :farmer="thug" />
						<router-link :to="'/farmer/' + thug.id">{{ thug.name }}</router-link> ({{ thug.warnings }})
						<div :target="thug.id" class="button ban">Bannir</div>
					</div>
				</div>
			</div>
		</div>

		<v-dialog v-model="warningConfirmDialog" :max-width="800">
			<div class="title">Envoyer un avertissement</div>
			<div class="content">
				<h2>Confirmez l'envoi de l'avertissement :</h2>
				<br>
				Éleveur : <b><span class="target"></span></b> <br>
				Motif : <b><span class="reason"></span></b> <br>
				Gravité : <b><span class="severity"></span></b> <br>
				Message : " <span class="message"></span> " <br>
			</div>
			<div class="actions">
				<div class="dismiss">Annuler</div>
				<div class="red">Envoyer</div>
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
		faults: Fault[] | null = null
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
			if (!faultID) {
				if (!LeekWars.mobile && this.faults) {
					this.$router.push('/moderation/fault/' + this.faults[0].id)
				} else {
					LeekWars.splitShowList()
				}
			} else if (faultID in this.faultsById) {
				this.selectedFault = this.faultsById[faultID]
				LeekWars.splitShowContent()
			}
		}

		// $('.ban').click(function() {
		// 	_.post('moderation/ban', {target: $(this).attr('target')}, function(data) {
		// 		if (data.success) {
		// 			_.toast("Éleveur banni")
		// 		} else {
		// 			_.toast(data.error)
		// 		}
		// 	})
		// })

		giveWarning() {
			this.warningConfirmDialog = true
		}
		archiveReporting() {
			if (!this.selectedFault) { return }
			LeekWars.post('moderation/archive', {target: this.selectedFault.target, reason: this.selectedFault.reason, parameter: this.selectedFault.parameter}).then((data) => {
				if (data.success) {
					LeekWars.toast(this.$t('moderation.reporting_deleted') as string)
				} else {
					LeekWars.toast(data.error)
				}
			})
		}
		sendWarning() {
			if (!this.selectedFault) { return }
			// var severity = parseInt($('#warning-severity').val())
			// var message = $('#warning-message').val()
			LeekWars.post('moderation/warn', {target: this.selectedFault.target, reason: this.selectedFault.reason, message: this.message, severity: this.severity, parameter: this.selectedFault.parameter}).then((data) => {
				if (data.success) {
					LeekWars.toast(i18n.t('moderation.warning_sent') as string)
					// $('.fault.selected').remove()
					// $('.fault').first().click()
					// popup.dismiss()
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
		border-radius: 2px;
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
		width: 100%;
		max-width: 100%;
	}
	.thugs {
		padding: 10px;
	}
	.thugs .thug {
		margin: 3px;
		vertical-align: top;
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
	.thug .thug .ban {
		float: right;
	}
</style>