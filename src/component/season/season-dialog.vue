<template lang="html">
	<popup v-if="season" :model-value="modelValue" :width="500" @update:model-value="$emit('update:modelValue', $event)">
		<template #icon><span class="season-dialog-emoji">{{ display.emoji }}</span></template>
		<template #title>{{ title }}</template>

		<div class="season-dialog-body">
			<p class="season-dialog-text">{{ text }}</p>
			<div v-if="season.active" class="season-dialog-bonus" :style="bonusStyle">
				<span class="big-emoji">{{ display.emoji }}</span>
				<span>{{ $t('main.season_bonus_' + season.key, { bonus: season.bonus }) }}</span>
			</div>
		</div>

		<template #actions>
			<div class="green" @click="$emit('update:modelValue', false)">{{ $t('main.season_close') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { store } from '@/model/store'
	import { i18n } from '@/model/i18n'
	import { seasonDisplay } from '@/model/season'
	import Popup from '@/component/popup.vue'

	defineOptions({ name: 'SeasonDialog' })
	defineProps<{ modelValue: boolean }>()
	defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

	const season = computed(() => store.state.farmer?.season ?? null)
	const display = computed(() => seasonDisplay(season.value?.key ?? ''))

	// La phase affichée (accueil / clôture) découle de l'état de la saison : active =>
	// message d'accueil + bonus ; terminée (délai de grâce) => message de clôture.
	const name = computed(() => i18n.t('main.season_name_' + (season.value?.key ?? '')) as string)
	const title = computed(() => (season.value?.active
		? i18n.t('main.season_start_title', { season: name.value })
		: i18n.t('main.season_end_title', { season: name.value })) as string)
	const text = computed(() => (season.value?.active
		? i18n.t('main.season_start_text', { season: name.value, bonus: season.value?.bonus })
		: i18n.t('main.season_end_text', { season: name.value })) as string)

	const bonusStyle = computed(() => ({
		background: `linear-gradient(100deg, ${display.value.gradient[0]}, ${display.value.gradient[1]})`,
	}))
</script>

<style lang="scss" scoped>
.season-dialog-emoji {
	font-size: 22px;
	line-height: 28px;
	margin-right: 6px;
}
.season-dialog-body {
	text-align: center;
}
.season-dialog-text {
	font-size: 15px;
	line-height: 1.5;
	margin: 4px 0 0;
}
.season-dialog-bonus {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	margin-top: 16px;
	padding: 14px;
	border-radius: 4px;
	color: white;
	font-weight: bold;
	font-size: 16px;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	.big-emoji {
		font-size: 30px;
	}
}
</style>
