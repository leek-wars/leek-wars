<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Saisons', link: '/admin/seasons'}]" :raw="true" /></h1>
		</div>

		<panel icon="mdi-party-popper" title="Saisons événementielles">
			<template #content>
				<div class="season-admin">
					<p class="hint">Aperçu des saisons et de leur bonus. Les boutons affichent le dialogue d'annonce (début / fin) sans attendre la vraie date : aperçu <b>local</b> uniquement (rien n'est enregistré, l'état réel est restauré à la fermeture).</p>
					<div class="season-list">
						<div v-for="s in seasons" :key="s.key" class="season-card">
							<span class="emoji">{{ s.emoji }}</span>
							<div class="info">
								<div class="name">{{ s.name }}</div>
								<div class="meta"><v-icon size="15">mdi-calendar</v-icon> {{ s.dates }}</div>
								<div class="meta bonus">{{ s.bonus }}</div>
							</div>
							<div class="actions">
								<v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-play" @click="preview(s.key, true)">Début</v-btn>
								<v-btn size="small" variant="tonal" prepend-icon="mdi-stop" @click="preview(s.key, false)">Fin</v-btn>
							</div>
						</div>
					</div>
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

	// Fenêtres [mois (0-indexé), jour] par saison, pour dater l'aperçu (année courante,
	// UTC comme le serveur). Pâques est variable : approximation raisonnable pour l'aperçu.
	const WINDOWS: { [key: string]: [number, number, number, number] } = {
		solstice:  [5, 21, 6, 21],
		heatwave:  [7, 1, 7, 31],
		halloween: [9, 24, 10, 1],
		easter:    [3, 5, 3, 13],
		christmas: [11, 1, 11, 25],
	}
	function previewDates(key: string): { start: number, end: number } {
		const w = WINDOWS[key]
		if (!w) return { start: 0, end: 0 }
		const y = new Date().getUTCFullYear()
		return {
			start: Math.floor(Date.UTC(y, w[0], w[1], 0, 0, 0) / 1000),
			end: Math.floor(Date.UTC(y, w[2], w[3], 23, 59, 59) / 1000),
		}
	}

	// Aperçu local : on injecte une saison factice puis on ouvre le dialogue (monté
	// globalement dans app.vue). active=true → texte de début, false → texte de fin.
	// dialog=null pour ne PAS déclencher le mark-seen automatique d'app.vue.
	function preview(key: string, active: boolean) {
		const f = store.state.farmer
		if (!f) return
		const { start, end } = previewDates(key)
		f.season = { key, instance: key + '-preview', active, start, end, bonus: 50, dialog: null }
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
	.season-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.season-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--background-secondary);
		.emoji {
			font-size: 30px;
			line-height: 1;
			flex-shrink: 0;
		}
		.info {
			flex: 1;
			min-width: 0;
			.name {
				font-weight: bold;
				font-size: 15px;
			}
			.meta {
				color: var(--text-color-secondary);
				font-size: 13px;
				margin-top: 2px;
				.v-icon {
					vertical-align: -2px;
					margin-right: 2px;
				}
			}
		}
		.actions {
			display: flex;
			gap: 6px;
			flex-shrink: 0;
		}
	}
	@media (max-width: 600px) {
		.season-card {
			flex-wrap: wrap;
			.actions {
				width: 100%;
				margin-top: 4px;
				.v-btn {
					flex: 1;
				}
			}
		}
	}
</style>
