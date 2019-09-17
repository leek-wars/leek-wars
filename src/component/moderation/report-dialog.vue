<template>
	<popup :value="value" :width="500" @input="$emit('input', $event)">
		<span slot="title">{{ title }}</span>
		<div class="report-popup">
			<h3>{{ message }}</h3>
			<br>
			<v-radio-group v-model="selectedReason" :mandatory="false">
				<v-radio v-for="reason in reasons" :key="reason" :label="$t('moderation.reason_' + reason)" :value="reason" />
			</v-radio-group>
			<h3>{{ $t('moderation.report_informations') }}</h3>
			<br>
			<textarea v-model="additionalMessage" class="report-message"></textarea>
		</div>
		<div slot="actions">
			<div class="dismiss" @click="close">{{ $t('moderation.cancel') }}</div>
			<div class="report-validate red" @click="report">{{ $t('moderation.report') }}</div>
		</div>
	</popup>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({})
	export default class ReportDialog extends Vue {
		@Prop() reasons!: Warning[]
		@Prop() target!: number | ((r: Warning) => number)
		@Prop() value!: boolean
		@Prop() name!: string
		@Prop() parameter!: any
		additionalMessage: string = ''
		selectedReason: Warning | null = null
		get title() {
			return this.$t('moderation.report_farmer', [this.name])
		}
		get message() {
			return this.$t('moderation.report_farmer_for_reason', [this.name])
		}
		report() {
			if (!this.selectedReason) {
				LeekWars.toast(i18n.t('moderation.you_must_choose_reason') as string)
				return
			}
			const target = (this.target instanceof Function) ? this.target(this.selectedReason) : this.target
			const parameter = this.parameter || ''
			LeekWars.post('moderation/report', {target, reason: this.selectedReason, message: this.additionalMessage, parameter}).then(data => {
				LeekWars.toast(i18n.t('moderation.thank_you_for_reporting') as string)
				this.close()
			}).error(error => {
				LeekWars.toast(error)
			})
		}
		close() {
			this.$emit('input', false)
		}
	}
</script>

<style lang="scss" scoped>
	.v-input--radio-group {
		margin-bottom: -15px;
	}
	h3 {
		margin-top: 0;
	}
	.report-popup .report-message {
		width: calc(100% - 10px);
		max-width: calc(100% - 10px);
		margin-top: 6px;
		min-height: 70px;
	}
</style>