<template lang="html">
	<div v-if="season && season.active" class="season-banner" :style="bannerStyle" @click="openDialog">
		<span class="season-emoji">{{ display.emoji }}</span>
		<div class="season-text">
			<span class="season-title">{{ $t('main.season_banner', { season: $t('main.season_name_' + season.key) }) }}</span>
			<span class="season-bonus">{{ $t('main.season_bonus_' + season.key, { bonus: season.bonus }) }}</span>
		</div>
		<span class="season-dates">{{ $t('main.season_dates', { start: LeekWars.formatDayMonthShortUTC(season.start), end: LeekWars.formatDayMonthShortUTC(season.end) }) }}</span>
		<v-icon class="season-info">mdi-information-outline</v-icon>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { store } from '@/model/store'
	import { LeekWars } from '@/model/leekwars'
	import { seasonDisplay } from '@/model/season'

	defineOptions({ name: 'SeasonBanner' })

	const season = computed(() => store.state.farmer?.season ?? null)
	const display = computed(() => seasonDisplay(season.value?.key ?? ''))
	const bannerStyle = computed(() => ({
		background: `linear-gradient(100deg, ${display.value.gradient[0]}, ${display.value.gradient[1]})`,
	}))

	// Le bandeau rouvre le dialogue de saison (cf. issue #4383 : « la tooltip de bonus
	// au clic peut réafficher le dialogue »). Le dialogue est monté globalement dans app.vue.
	function openDialog() {
		LeekWars.seasonDialog = true
	}
</script>

<style lang="scss" scoped>
.season-banner {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	// Coins bas carrés + collé aux panneaux du potager en dessous.
	border-radius: 4px 4px 0 0;
	margin-bottom: 0;
	color: white;
	cursor: pointer;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	user-select: none;
}
.season-emoji {
	font-size: 28px;
	line-height: 1;
}
.season-text {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-width: 0;
}
.season-title {
	font-weight: bold;
	font-size: 16px;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.season-bonus {
	font-size: 13px;
	opacity: 0.95;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.season-dates {
	font-size: 13px;
	font-weight: 500;
	white-space: nowrap;
	opacity: 0.95;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.season-info {
	color: white;
	opacity: 0.85;
}
@media (max-width: 640px) {
	.season-dates {
		display: none;
	}
}
</style>
