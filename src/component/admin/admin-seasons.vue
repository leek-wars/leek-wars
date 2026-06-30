<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Saisons', link: '/admin/seasons'}]" :raw="true" /></h1>
		</div>

		<panel icon="mdi-party-popper" title="Prévisualisation des dialogues de saison">
			<template #content>
				<p class="hint">Affiche le dialogue d'annonce d'une saison (début ou fin) sans attendre la vraie date. Aperçu <b>local</b> uniquement : rien n'est enregistré, l'état réel est restauré à la fermeture du dialogue.</p>
				<table class="seasons">
					<tr v-for="s in seasons" :key="s.key">
						<td class="emoji">{{ s.display.emoji }}</td>
						<td class="name">{{ s.name }}</td>
						<td><v-btn color="primary" variant="flat" prepend-icon="mdi-play" @click="preview(s.key, true)">Dialogue de début</v-btn></td>
						<td><v-btn variant="tonal" prepend-icon="mdi-stop" @click="preview(s.key, false)">Dialogue de fin</v-btn></td>
					</tr>
				</table>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { i18n, mixins } from '@/model/i18n'
	import { SEASON_DISPLAY, seasonDisplay, SeasonState } from '@/model/season'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import router from '@/router'
	import { watch } from 'vue'

	defineOptions({ name: 'AdminSeasons', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Saisons")

	const seasons = Object.keys(SEASON_DISPLAY).map(key => ({
		key,
		display: seasonDisplay(key),
		name: i18n.t('main.season_name_' + key) as string,
	}))

	// État réel de la saison, restauré quand l'aperçu se ferme (l'injection ci-dessous
	// écrase temporairement farmer.season, ce qui afficherait aussi la bannière du potager).
	const originalSeason: SeasonState | null = store.state.farmer?.season ?? null

	// Aperçu local : on injecte une saison factice puis on ouvre le dialogue (monté
	// globalement dans app.vue). active=true → texte de début, false → texte de fin.
	// dialog=null pour ne PAS déclencher le mark-seen automatique d'app.vue.
	function preview(key: string, active: boolean) {
		const f = store.state.farmer
		if (!f) return
		f.season = { key, instance: key + '-preview', active, start: 0, end: 0, bonus: 50, dialog: null }
		LeekWars.seasonDialog = true
	}

	watch(() => LeekWars.seasonDialog, (open) => {
		if (!open && store.state.farmer) store.state.farmer.season = originalSeason
	})
</script>

<style lang="scss" scoped>
	.hint {
		color: var(--text-color-secondary);
		margin: 0 0 16px;
	}
	.seasons {
		border-collapse: collapse;
		td {
			padding: 6px 12px 6px 0;
			vertical-align: middle;
		}
		.emoji {
			font-size: 26px;
		}
		.name {
			font-weight: bold;
			min-width: 110px;
		}
	}
</style>
