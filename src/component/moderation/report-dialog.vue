<template>
	<popup :model-value="modelValue" :width="500" icon="mdi-flag" @update:modelValue="$emit('update:modelValue', $event)">
		<template #title>
			<span :class="{pointer: leeks}" @click="leeks ? back : null">{{ title }}</span><span v-if="subtitle" class="subtitle"><v-icon>mdi-chevron-right</v-icon>{{ subtitle }}</span>
		</template>
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
		<template v-if="!leeks || selectedTarget" #actions>
			<div v-if="leeks" v-ripple class="dismiss" @click="back">◄ {{ $t('main.back') }}</div>
			<div v-else v-ripple class="dismiss" @click="close">{{ $t('main.cancel') }}</div>
			<div v-ripple class="report-validate red" @click="report"><v-icon>mdi-flag</v-icon> {{ $t('warning.report') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Team } from '@/model/team'
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'

	const props = defineProps<{
		reasons?: Warning[]
		target?: Farmer | null
		team?: Team | null
		modelValue?: boolean
		parameter?: any
		leeks?: Leek[] | null
		fight?: number
		leek?: Leek | null
	}>()
	const emit = defineEmits<{
		'update:modelValue': [value: boolean]
	}>()

	const { t } = useI18n()

	const additionalMessage = ref('')
	const selectedReason = ref<Warning | null>(null)
	const selectedTarget = ref<Farmer | null>(null)
	const selectedLeek = ref<Leek | null>(null)

	const name = computed(() => selectedTarget.value ? selectedTarget.value.name : (props.team ? props.team.name : '?'))
	const title = computed(() => t('warning.report'))
	const subtitle = computed(() => !selectedTarget.value && props.leeks ? t('warning.select_leek') : name.value)
	const message = computed(() => t('warning.report_farmer_for_reason', [name.value]))
	const selectedFarmer = computed(() => props.target || selectedTarget.value)
	void selectedFarmer

	watch(() => props.target, () => {
		selectedTarget.value = props.target ?? null
	}, { immediate: true })
	watch(() => props.leek, () => {
		selectedLeek.value = props.leek ?? null
	}, { immediate: true })

	function report() {
		if (!selectedReason.value) {
			LeekWars.toast(t('warning.you_must_choose_reason') as string)
			return
		}
		const target = selectedTarget.value?.id || 0
		let parameter = props.parameter || ''
		if (selectedReason.value === Warning.INCORRECT_LEEK_NAME) {
			parameter = selectedLeek.value!.id
		}
		const fight = props.fight ? props.fight : 0
		LeekWars.post('moderation/report', {target_id: target, reason: selectedReason.value, message: additionalMessage.value, parameter, fight}).then(data => {
			LeekWars.toast(t('warning.thank_you_for_reporting') as string)
			close()
		}).error(error => {
			LeekWars.toast(error)
		})
	}
	function close() {
		emit('update:modelValue', false)
	}
	function selectLeek(leek: Leek) {
		selectedTarget.value = leek.farmer
		selectedLeek.value = leek
	}
	function back() {
		selectedTarget.value = null
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