<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Saisons', link: '/admin/seasons'}]" :raw="true" /></h1>
		</div>

		<panel icon="mdi-party-popper" title="Saisons événementielles">
			<template #content>
				<div class="season-admin">
					<p class="hint">Aperçu des saisons et de leur bonus. Les boutons affichent le dialogue d'annonce (début / fin) sans attendre la vraie date : aperçu <b>local</b> uniquement (rien n'est enregistré, l'état réel est restauré à la fermeture).</p>
					<table class="seasons">
						<thead>
							<tr>
								<th colspan="2">Saison</th>
								<th>Dates</th>
								<th>Bonus (type de combat boosté)</th>
								<th>Aperçu du dialogue</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="s in seasons" :key="s.key">
								<td class="emoji">{{ s.emoji }}</td>
								<td class="name">{{ s.name }}</td>
								<td class="dates">{{ s.dates }}</td>
								<td class="bonus">{{ s.bonus }}</td>
								<td class="actions">
									<v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-play" @click="preview(s.key, true)">Début</v-btn>
									<v-btn size="small" variant="tonal" prepend-icon="mdi-stop" @click="preview(s.key, false)">Fin</v-btn>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
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

	// Fenêtres affichées pour référence (source de vérité = Season.class.php côté serveur).
	const DATES: { [key: string]: string } = {
		solstice: "21 juin → 21 juillet",
		heatwave: "1er → 31 août",
		halloween: "24 octobre → 1er novembre",
		easter: "≈ 1 semaine autour de Pâques (date variable)",
		christmas: "1er → 25 décembre",
	}

	const seasons = Object.keys(SEASON_DISPLAY).map(key => ({
		key,
		emoji: seasonDisplay(key).emoji,
		name: i18n.t('main.season_name_' + key) as string,
		dates: DATES[key] ?? '',
		bonus: i18n.t('main.season_bonus_' + key, { bonus: 50 }) as string,
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
	.season-admin {
		padding: 16px;
	}
	.hint {
		color: var(--text-color-secondary);
		margin: 0 0 16px;
	}
	.seasons {
		border-collapse: collapse;
		width: 100%;
		th {
			text-align: left;
			padding: 6px 16px 8px 0;
			color: var(--text-color-secondary);
			font-weight: 500;
			border-bottom: 1px solid var(--border);
		}
		td {
			padding: 8px 16px 8px 0;
			vertical-align: middle;
			border-bottom: 1px solid var(--border);
		}
		.emoji {
			font-size: 26px;
			padding-right: 8px;
		}
		.name {
			font-weight: bold;
			white-space: nowrap;
		}
		.dates {
			white-space: nowrap;
			color: var(--text-color-secondary);
		}
		.actions {
			white-space: nowrap;
			.v-btn {
				margin-right: 6px;
			}
		}
	}
</style>
