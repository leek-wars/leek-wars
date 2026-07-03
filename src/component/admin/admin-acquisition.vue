<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Acquisition', link: '/admin/acquisition'}]" :raw="true" /></h1>
			<div v-if="!LeekWars.mobile" class="tabs">
				<div class="tab" @click="load">
					<v-icon>mdi-refresh</v-icon>
					Rafraîchir
				</div>
			</div>
		</div>

		<!-- Période + filtres -->
		<panel class="first">
			<template #content>
				<div class="content controls">
					<div class="period-controls">
						<v-btn v-for="p of PERIODS" :key="p.key" size="small" variant="text" :class="{active: period === p.key}" @click="setPeriod(p.key)">{{ p.label }}</v-btn>
					</div>

					<div class="filters">
						<select v-model="filters.country" class="filter-input">
							<option value="">Tous les pays</option>
							<option v-for="c of countryOptions" :key="c.country" :value="c.country">{{ countryLabel(c.country) }} ({{ c.n }})</option>
						</select>
						<select v-model="filters.language" class="filter-input">
							<option value="">Toutes les langues</option>
							<option v-for="l of languageOptions" :key="l.code" :value="l.code">{{ l.name }}</option>
						</select>
						<select v-model="filters.login_mode" class="filter-input">
							<option value="">Toute inscription</option>
							<option v-for="m of LOGIN_MODE_LIST" :key="m" :value="m">{{ LOGIN_MODES[m].label }}</option>
						</select>
						<select v-model="filters.godfather" class="filter-input">
							<option value="">Toute source</option>
							<option value="referred">Parrainé</option>
							<option value="organic">Organique</option>
						</select>
						<select v-model="filters.verified" class="filter-input">
							<option value="">Vérifié : tous</option>
							<option value="true">Vérifié</option>
							<option value="false">Non vérifié</option>
						</select>
						<v-btn v-if="hasFilters" size="small" variant="text" @click="resetFilters">
							<v-icon>mdi-filter-remove-outline</v-icon> Réinitialiser
						</v-btn>
					</div>

					<div class="cohort">
						<loader v-if="loading" :size="28" />
						<template v-else><b>{{ $filters.number(cohort_size) }}</b> joueur{{ cohort_size > 1 ? 's' : '' }} dans la cohorte</template>
					</div>
				</div>
			</template>
		</panel>

		<!-- Statistiques de la cohorte -->
		<panel>
			<template #content>
				<div class="content">
					<div class="title">
						<h3>Statistiques de la cohorte</h3>
						<loader v-if="loading" :size="28" />
					</div>

					<div class="kpi-grid">
						<kpi-card label="Cohorte" :value="$filters.number(cohort_size)" />
						<kpi-card label="Activation (a combattu)" :value="pct(agg.activation_rate)" />
						<kpi-card label="Email vérifié" :value="pct(agg.verified_rate)" />
						<kpi-card label="Didactitiel vu" :value="pct(agg.didactitiel_rate)" />
						<kpi-card label="Tuto terminé" :value="pct(agg.tuto_done_rate)" />
						<kpi-card label="Étape tuto moy." :value="agg.tuto_progress_avg === null ? '—' : num1(agg.tuto_progress_avg) + ' / 10'" />
					</div>

					<h4>Moyenne &amp; médiane</h4>
					<div class="dual-grid">
						<div v-for="m of dualMetrics" :key="m.label" class="dual card">
							<div class="dual-icon"><v-icon>{{ m.icon }}</v-icon></div>
							<div class="dual-body">
								<div class="dual-label">{{ m.label }}</div>
								<div class="dual-values">
									<div class="dv"><span class="k">Moy.</span> <span class="v">{{ m.avg }}</span></div>
									<div class="dv"><span class="k">Méd.</span> <span class="v">{{ m.median }}</span></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<!-- Ventilations par langue et par pays : mêmes colonnes triables (clic sur l'en-tête) -->
		<panel v-for="b of breakdowns" :key="b.kind">
			<template #content>
				<div class="content">
					<h3>{{ b.title }}</h3>
					<v-data-table
						:headers="b.headers"
						:items="b.items"
						:items-per-page="-1"
						:sort-by="[{ key: 'n', order: 'desc' }]"
						density="compact"
						hide-default-footer
						class="breakdown-table">
						<template #item.label="{ item }">
							<div class="label-cell">
								<flag v-if="item.flag" :code="item.flag" :clickable="false" />
								<v-icon v-else-if="item.isUnknown" class="unknown-flag">mdi-help-circle-outline</v-icon>
								<span>{{ item.label }}</span>
							</div>
						</template>
						<template #item.n="{ item }">
							<div class="inscrits">
								<span>{{ $filters.number(item.n) }}</span>
								<div class="ibar"><div class="fill" :style="{ width: item.bar }"></div></div>
							</div>
						</template>
						<template #item.share_pct="{ item }">{{ pct1(item.share_pct) }}</template>
						<template #item.activation_pct="{ item }">{{ pct1(item.activation_pct) }}</template>
						<template #item.engagement_pct="{ item }">{{ pct1(item.engagement_pct) }}</template>
						<template #item.verified_pct="{ item }">{{ pct1(item.verified_pct) }}</template>
						<template #item.didactitiel_pct="{ item }">{{ pct1(item.didactitiel_pct) }}</template>
						<template #item.tuto_done_pct="{ item }">{{ pct1(item.tuto_done_pct) }}</template>
						<template #item.retention_d7_pct="{ item }">{{ pct1(item.retention_d7_pct) }}</template>
						<template #item.trophy_points_avg="{ item }">{{ num0(item.trophy_points_avg) }}</template>
						<template #no-data><div class="empty">Aucune donnée</div></template>
					</v-data-table>
				</div>
			</template>
		</panel>

		<!-- Par mode d'inscription + parrainage -->
		<panel class="last">
			<template #content>
				<div class="content split">
					<div class="split-col">
						<h3>Par mode d'inscription</h3>
						<table class="breakdown">
							<thead>
								<tr><th>Mode</th><th class="num">Inscrits</th><th class="bar-col">Part</th></tr>
							</thead>
							<tbody>
								<tr v-for="row of by_login_mode" :key="row.login_mode">
									<td class="label-cell">
										<v-icon :style="{ color: loginMode(row.login_mode).color }">{{ loginMode(row.login_mode).icon }}</v-icon>
										<span>{{ loginMode(row.login_mode).label }}</span>
									</td>
									<td class="num">{{ $filters.number(row.n) }}</td>
									<td class="bar-col"><div class="ibar"><div class="fill" :style="{ width: barWidth(row.n, cohort_size) }"></div></div></td>
								</tr>
								<tr v-if="!by_login_mode.length"><td colspan="3" class="empty">Aucune donnée</td></tr>
							</tbody>
						</table>
					</div>

					<div class="split-col">
						<h3>Par source</h3>
						<div class="godfather-cards">
							<div v-for="g of by_godfather" :key="g.source" class="gf card">
								<div class="gf-head">
									<v-icon>{{ g.source === 'referred' ? 'mdi-account-multiple-check' : 'mdi-earth' }}</v-icon>
									{{ g.source === 'referred' ? 'Parrainé' : 'Organique' }}
								</div>
								<div class="gf-n">{{ $filters.number(g.n) }}</div>
								<div class="gf-stats">
									<span>Activation <b>{{ pct1(g.activation_pct) }}</b></span>
									<span>Vérifié <b>{{ pct1(g.verified_pct) }}</b></span>
								</div>
							</div>
							<div v-if="!by_godfather.length" class="empty">Aucune donnée</div>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, onMounted, reactive, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import KpiCard from '@/component/admin/kpi-card.vue'

	type PeriodKey = '24h' | '1w' | '1m' | '1y' | 'all'
	const PERIODS: { key: PeriodKey, label: string }[] = [
		{ key: '24h', label: '24h' },
		{ key: '1w', label: '1 sem.' },
		{ key: '1m', label: '1 mois' },
		{ key: '1y', label: '1 an' },
		{ key: 'all', label: 'Tout' },
	]
	type LoginMode = 'classic' | 'github' | 'google' | 'fast' | 'fast_verified' | 'unknown'
	const LOGIN_MODES: Record<LoginMode, { label: string, color: string, icon: string }> = {
		classic:       { label: 'Classique',     color: '#2196f3', icon: 'mdi-email-outline' },
		github:        { label: 'GitHub',        color: '#9e9e9e', icon: 'mdi-github' },
		google:        { label: 'Google',        color: '#db4437', icon: 'mdi-google' },
		fast:          { label: 'Rapide',        color: '#ff9800', icon: 'mdi-flash-outline' },
		fast_verified: { label: 'Rapide validé', color: '#ffc107', icon: 'mdi-flash-outline' },
		unknown:       { label: 'Inconnu',       color: '#9e9e9e', icon: 'mdi-help-circle-outline' },
	}
	const LOGIN_MODE_LIST: LoginMode[] = ['classic', 'github', 'google', 'fast', 'fast_verified']

	interface Aggregates {
		verified_rate: number | null
		activation_rate: number | null
		didactitiel_rate: number | null
		tuto_done_rate: number | null
		tuto_progress_avg: number | null
		trophy_points_avg: number | null
		trophy_points_median: number | null
		trophy_count_avg: number | null
		trophy_count_median: number | null
		account_age_avg: number | null
		account_age_median: number | null
		active_hours_avg: number | null
		active_hours_median: number | null
	}
	// Une ligne de ventilation, par langue OU par pays (mêmes colonnes de comparaison).
	interface BreakdownRow {
		language?: string
		country?: string
		n: number
		share_pct: number | null
		activation_pct: number | null
		engagement_pct: number | null
		verified_pct: number | null
		didactitiel_pct: number | null
		tuto_done_pct: number | null
		retention_d7_pct: number | null
		trophy_points_avg: number | null
	}
	interface LoginModeRow { login_mode: string, n: number }
	interface GodfatherRow { source: string, n: number, verified_pct: number | null, activation_pct: number | null }
	interface CountryOption { country: string, n: number }
	interface AcquisitionData {
		period: string
		cohort_size: number
		aggregates: Aggregates
		by_language: BreakdownRow[]
		by_country: BreakdownRow[]
		by_login_mode: LoginModeRow[]
		by_godfather: GodfatherRow[]
		country_options: CountryOption[]
	}

	const EMPTY_AGG: Aggregates = {
		verified_rate: null, activation_rate: null, didactitiel_rate: null, tuto_done_rate: null,
		tuto_progress_avg: null, trophy_points_avg: null, trophy_points_median: null,
		trophy_count_avg: null, trophy_count_median: null, account_age_avg: null, account_age_median: null,
		active_hours_avg: null, active_hours_median: null,
	}

	const router = useRouter()
	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Admin Acquisition')

	const STORAGE_KEY_PERIOD = 'admin_acquisition_period'
	const period = ref<PeriodKey>((localStorage.getItem(STORAGE_KEY_PERIOD) as PeriodKey) || '1m')
	const filters = reactive({ country: '', language: '', login_mode: '', godfather: '', verified: '' })

	const loading = ref(false)
	const cohort_size = ref(0)
	const agg = ref<Aggregates>({ ...EMPTY_AGG })
	const by_language = ref<BreakdownRow[]>([])
	const by_country = ref<BreakdownRow[]>([])
	const by_login_mode = ref<LoginModeRow[]>([])
	const by_godfather = ref<GodfatherRow[]>([])
	const countryOptions = ref<CountryOption[]>([])

	const languageOptions = computed(() => Object.values(LeekWars.languages).map(l => ({ code: l.code, name: l.name })))
	const hasFilters = computed(() => Object.values(filters).some(v => v !== ''))

	// Colonnes triables partagées par les deux tables (clic sur l'en-tête).
	// Le tri opère sur la valeur brute de l'item (n, *_pct…), pas sur l'affichage.
	function breakdownHeaders(labelTitle: string): any[] {
		return [
			{ title: labelTitle, key: 'label', align: 'start', sortable: true },
			{ title: 'Inscrits', key: 'n', align: 'end', sortable: true },
			{ title: 'Part', key: 'share_pct', align: 'end', sortable: true },
			{ title: 'Activ.', key: 'activation_pct', align: 'end', sortable: true },
			{ title: 'Engagé', key: 'engagement_pct', align: 'end', sortable: true },
			{ title: 'Vérifié', key: 'verified_pct', align: 'end', sortable: true },
			{ title: 'Didact.', key: 'didactitiel_pct', align: 'end', sortable: true },
			{ title: 'Tuto', key: 'tuto_done_pct', align: 'end', sortable: true },
			{ title: 'J+7', key: 'retention_d7_pct', align: 'end', sortable: true },
			{ title: 'Trophées', key: 'trophy_points_avg', align: 'end', sortable: true },
		]
	}
	function buildBreakdown(kind: 'language' | 'country', title: string, labelTitle: string, rows: BreakdownRow[]) {
		const max = rows.reduce((m, r) => Math.max(m, r.n), 0)
		const items = rows.map(r => ({
			...r,
			label: kind === 'language' ? languageName(r.language) : countryLabel(r.country),
			flag: kind === 'language' ? languageFlag(r.language) : (r.country && r.country !== '(null)' ? r.country : null),
			isUnknown: kind === 'country' && r.country === '(null)',
			bar: max ? Math.round((r.n / max) * 100) + '%' : '0%',
		}))
		return { kind, title, items, headers: breakdownHeaders(labelTitle) }
	}
	const breakdowns = computed(() => [
		buildBreakdown('language', 'Par langue', 'Langue', by_language.value),
		buildBreakdown('country', 'Par pays', 'Pays', by_country.value),
	])

	const dualMetrics = computed(() => [
		{ label: 'Ancienneté du compte', icon: 'mdi-calendar-clock', avg: duration(agg.value.account_age_avg), median: duration(agg.value.account_age_median) },
		{ label: 'Heures actives', icon: 'mdi-timer-sand', avg: hours(agg.value.active_hours_avg), median: hours(agg.value.active_hours_median) },
		{ label: 'Trophées (points)', icon: 'mdi-flash-outline', avg: num0(agg.value.trophy_points_avg), median: num0(agg.value.trophy_points_median) },
		{ label: 'Trophées (nombre)', icon: 'mdi-trophy-outline', avg: num1(agg.value.trophy_count_avg), median: num1(agg.value.trophy_count_median) },
	])

	function setPeriod(p: PeriodKey) {
		period.value = p
		localStorage.setItem(STORAGE_KEY_PERIOD, p)
	}
	function resetFilters() {
		filters.country = ''
		filters.language = ''
		filters.login_mode = ''
		filters.godfather = ''
		filters.verified = ''
	}

	function load() {
		loading.value = true
		const f: Record<string, string> = {}
		for (const [key, value] of Object.entries(filters)) {
			if (value !== '') f[key] = value
		}
		LeekWars.post<AcquisitionData>('source/acquisition', { period: period.value, filters: f }).then(data => {
			loading.value = false
			cohort_size.value = data.cohort_size
			agg.value = data.aggregates || { ...EMPTY_AGG }
			by_language.value = data.by_language || []
			by_country.value = data.by_country || []
			by_login_mode.value = data.by_login_mode || []
			by_godfather.value = data.by_godfather || []
			// Le serveur calcule les options de pays sur la période seule (sans les
			// autres filtres), donc la liste reste stable quand on filtre la cohorte.
			if (data.country_options) countryOptions.value = data.country_options
		}).error(() => {
			loading.value = false
		})
	}

	// Recharge sur changement de période ou de filtre (les <select> mutent `filters`).
	watch([period, filters], load, { deep: true })

	onMounted(() => {
		LeekWars.large = true
		load()
	})

	// --- Formatage --------------------------------------------------------------
	function pct(v: number | null): string {
		return v === null ? '—' : (v * 100).toFixed(1) + ' %'
	}
	function pct1(v: number | null): string {
		return v === null ? '—' : v.toFixed(1) + ' %'
	}
	function num0(v: number | null): string {
		return v === null ? '—' : LeekWars.formatNumber(Math.round(v))
	}
	function num1(v: number | null): string {
		return v === null ? '—' : v.toFixed(1)
	}
	function duration(seconds: number | null): string {
		return seconds === null ? '—' : LeekWars.formatLongDuration(Math.round(seconds))
	}
	function hours(v: number | null): string {
		return v === null ? '—' : v.toFixed(1) + ' h'
	}
	function barWidth(n: number, max: number): string {
		if (!max) return '0%'
		return Math.round((n / max) * 100) + '%'
	}

	// --- Libellés ---------------------------------------------------------------
	function languageName(code?: string): string {
		return (code && LeekWars.languages[code]?.name) || code || ''
	}
	function languageFlag(code?: string): string | null {
		return (code && LeekWars.languages[code]?.country) || null
	}
	function countryLabel(code?: string): string {
		if (!code) return ''
		return code === '(null)' ? 'Inconnu' : code.toUpperCase()
	}
	function loginMode(mode: string): { label: string, color: string, icon: string } {
		return LOGIN_MODES[(mode as LoginMode)] || LOGIN_MODES.unknown
	}
</script>

<style lang="scss" scoped>
#app.app .panel .content {
	padding: 12px;
}
.title {
	display: flex;
	align-items: center;
	gap: 20px;
	.loader { margin: 0; padding: 0; }
}
h3 {
	margin: 0 0 10px;
}
h4 {
	margin: 18px 0 8px;
	font-size: 14px;
	color: var(--text-color-secondary);
}
.controls {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.period-controls {
	display: flex;
	gap: 4px;
	flex-wrap: wrap;
	.v-btn.active {
		background: rgba(33, 150, 243, 0.2);
		font-weight: bold;
	}
}
.filters {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}
.filter-input {
	padding: 4px 8px;
	border: 1px solid var(--border);
	border-radius: 3px;
	font-size: 13px;
	background: var(--pure-white);
	color: var(--text-color);
}
.cohort {
	font-size: 14px;
	color: var(--text-color-secondary);
	min-height: 28px;
	display: flex;
	align-items: center;
	b { color: var(--text-color); font-size: 18px; margin-right: 4px; }
}
.kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 8px;
}
.dual-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 8px;
}
.dual {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
	background: var(--pure-white);
	border: 1px solid var(--border);
	border-radius: 4px;
	.dual-icon .v-icon {
		font-size: 28px;
		color: var(--text-color-secondary);
	}
	.dual-body { flex: 1; min-width: 0; }
	.dual-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-color-secondary);
	}
	.dual-values {
		display: flex;
		gap: 18px;
		margin-top: 2px;
		.dv {
			.k { font-size: 11px; color: var(--text-color-secondary); }
			.v { font-size: 18px; font-weight: bold; font-variant-numeric: tabular-nums; }
		}
	}
}
// Tables triables (langue / pays) : Vuetify v-data-table, fond transparent pour
// s'intégrer au panel + couleurs via les variables CSS du site (dark inclus).
.breakdown-table {
	background: transparent;
	font-size: 13px;
	:deep(.v-table__wrapper) { overflow-x: auto; }
	:deep(.v-data-table__th) {
		color: var(--text-color-secondary) !important;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
	}
	:deep(.v-data-table__td) {
		font-variant-numeric: tabular-nums;
	}
	:deep(.v-data-table__td),
	:deep(.v-data-table__th) {
		padding: 0 10px !important;
	}
}
// Table simple (mode d'inscription).
.breakdown {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
	white-space: nowrap;
	th {
		text-align: right;
		font-weight: 600;
		color: var(--text-color-secondary);
		font-size: 12px;
		padding: 4px 8px;
		border-bottom: 1px solid var(--border);
		&:first-child { text-align: left; }
	}
	td {
		padding: 5px 8px;
		border-bottom: 1px solid var(--border);
	}
	.num { text-align: right; font-variant-numeric: tabular-nums; }
	.bar-col { width: 30%; }
	.empty { text-align: center; color: var(--text-color-secondary); padding: 20px; }
}
// Cellules partagées par les deux types de table.
.label-cell {
	display: flex;
	align-items: center;
	gap: 8px;
	.flag { max-height: 16px; max-width: 22px; }
	.unknown-flag { font-size: 18px; color: var(--text-color-secondary); }
	.v-icon { font-size: 18px; }
}
.inscrits {
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	span { line-height: 1.2; }
	.ibar { width: 54px; margin-top: 2px; }
}
.ibar {
	height: 5px;
	background: var(--background-disabled, #e0e0e0);
	border-radius: 3px;
	overflow: hidden;
	.fill {
		height: 100%;
		background: #2196f3;
		border-radius: 3px;
	}
}
.empty { text-align: center; color: var(--text-color-secondary); padding: 20px; }
.split {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
	@media (max-width: 799px) {
		grid-template-columns: 1fr;
	}
}
.godfather-cards {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	.gf {
		padding: 10px 14px;
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		.gf-head {
			display: flex;
			align-items: center;
			gap: 6px;
			font-weight: 600;
			.v-icon { font-size: 18px; }
		}
		.gf-n { font-size: 22px; font-weight: bold; font-variant-numeric: tabular-nums; margin: 4px 0; }
		.gf-stats {
			display: flex;
			flex-direction: column;
			gap: 2px;
			font-size: 12px;
			color: var(--text-color-secondary);
			b { color: var(--text-color); }
		}
	}
}
.empty { text-align: center; color: var(--text-color-secondary); padding: 20px; }
</style>
