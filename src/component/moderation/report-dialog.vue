<template>
	<popup :value="value" :width="500" @input="$emit('input', $event)">
		<v-icon slot="icon">mdi-flag</v-icon>
		<span slot="title">
			<span :class="{pointer: leeks}" @click="leeks ? back : null">{{ title }}</span><span v-if="subtitle" class="subtitle"><v-icon>mdi-chevron-right</v-icon>{{ subtitle }}</span>
		</span>
		<div class="report-popup">
			<div v-if="selectedTarget || !leeks">
				<div class="targets">
					<emblem v-if="team" :team="team" />
					<avatar v-else :farmer="selectedTarget" />
					<div v-if="selectedLeek" class="image">
						<leek-image :leek="selectedLeek" :scale="1" />
						<span>{{ selectedLeek.name }}</span>
					</div>
				</div>
				<h4>{{ message }}</h4>
				<v-radio-group v-model="selectedReason" :mandatory="false" class="radio">
					<v-radio v-for="reason in reasons" :key="reason" :label="$t('warning.reason_' + reason)" :value="reason" />
				</v-radio-group>
				<h4>{{ $t('warning.report_informations') }}</h4>
				<textarea v-model="additionalMessage" class="report-message"></textarea>
			</div>
			<div v-else class="leeks">
				<div v-for="leek of leeks" :key="leek.id" v-ripple class="leek" @click="selectLeek(leek)">
					<leek-image :leek="leek" :scale="0.5" />
					<div class="ellipsis">{{ leek.name }}</div>
					<div class="farmer">
						<avatar :farmer="leek.farmer" />
						<div class="ellipsis">{{ leek.farmer ? leek.farmer.name : '?' }}</div>
					</div>
				</div>
			</div>
		</div>
		<div v-if="!leeks || selectedTarget" slot="actions">
			<div v-if="leeks" class="dismiss" @click="back">◄ {{ $t('main.back') }}</div>
			<div v-else class="dismiss" @click="close">{{ $t('main.cancel') }}</div>
			<div class="report-validate red" @click="report"><v-icon slot="icon">mdi-flag</v-icon> {{ $t('warning.report') }}</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { i18n } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Team } from '@/model/team'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({})
	export default class ReportDialog extends Vue {
		@Prop() reasons!: Warning[]
		@Prop() target!: Farmer | null
		@Prop() team!: Team | null
		@Prop() value!: boolean
		@Prop() parameter!: any
		@Prop() leeks!: Leek[] | null
		@Prop() fight!: number
		@Prop() leek!: Leek | null
		additionalMessage: string = ''
		selectedReason: Warning | null = null
		selectedTarget: Farmer | null = null
		selectedLeek: Leek | null = null
		get title() {
			return this.$t('warning.report')
		}
		get subtitle() {
			return !this.selectedTarget && this.leeks ? this.$t('warning.select_leek') : this.name
		}
		get message() {
			return this.$t('warning.report_farmer_for_reason', [this.name])
		}
		get name() {
			return this.selectedTarget ? this.selectedTarget.name : (this.team ? this.team.name : '?')
		}
		get selectedFarmer() {
			return this.target || this.selectedTarget
		}
		@Watch('target', {immediate: true})
		updateTarget() {
			this.selectedTarget = this.target
		}
		@Watch('leek', {immediate: true})
		updateLeek() {
			this.selectedLeek = this.leek
		}
		report() {
			if (!this.selectedReason) {
				LeekWars.toast(i18n.t('warning.you_must_choose_reason') as string)
				return
			}
			const target = this.selectedTarget!.id
			let parameter = this.parameter || ''
			if (this.selectedReason === Warning.INCORRECT_LEEK_NAME) {
				parameter = this.selectedLeek!.id
			}
			const fight = this.fight ? this.fight : 0
			LeekWars.post('moderation/report', {target, reason: this.selectedReason, message: this.additionalMessage, parameter, fight}).then(data => {
				LeekWars.toast(i18n.t('warning.thank_you_for_reporting') as string)
				this.close()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		close() {
			this.$emit('input', false)
		}
		selectLeek(leek: Leek) {
			this.selectedTarget = leek.farmer
			this.selectedLeek = leek
		}
		back() {
			this.selectedTarget = null
		}
	}
</script>

<style lang="scss" scoped>
	.v-input--radio-group {
		margin-bottom: -15px;
	}
	.subtitle {
		padding-left: 8px;
	}
	h4 {
		margin-top: 0;
		margin-bottom: 0;
	}
	.v-input.radio {
		margin-top: 15px;
		margin-bottom: -5px;
	}
	.report-popup .report-message {
		width: 100%;
		max-width: 100%;
		margin-top: 6px;
		min-height: 70px;
	}
	.targets {
		margin-bottom: 10px;
		.avatar, .emblem {
			width: 120px;
		}
		.image {
			width: 100px;
			display: inline-block;
			text-align: center;
		}
		svg {
			height: 100px;
			width: 100px;
		}
	}
	.leeks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		align-items: flex-end;
	}
	.leek {
		text-align: center;
		width: 100%;
		padding: 5px;
		cursor: pointer;
		border: 1px solid #ddd;
		border-radius: 2px;
		&:hover {
			background: white;
		}
		.farmer {
			display: inline-flex;
			align-items: center;
			max-width: 100%;
			margin-top: 4px;
			.avatar {
				width: 30px;
				flex: 0 0 30px;
				margin-right: 4px;
			}
		}
	}
</style>