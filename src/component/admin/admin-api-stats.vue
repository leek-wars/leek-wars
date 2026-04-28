<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Stats API', link: '/admin/api-stats'}]" :raw="true" /></h1>
		</div>

		<panel class="first">
			<template #content>
				<div class="aggregates">
					<div class="period-bar">
						<span>Fenêtre :</span>
						<v-btn-toggle v-model="periodHours" mandatory density="compact" @update:modelValue="loadAggregates">
							<v-btn :value="1" size="small">1h</v-btn>
							<v-btn :value="24" size="small">24h</v-btn>
							<v-btn :value="168" size="small">7j</v-btn>
							<v-btn :value="720" size="small">30j</v-btn>
						</v-btn-toggle>
						<span v-if="aggregates" class="total">{{ aggregates.total.toLocaleString() }} requêtes</span>
						<span v-if="aggregates" class="total">moy. {{ aggregates.avg_ms }} ms</span>
						<v-btn size="small" :loading="aggLoading" @click="loadAggregates"><v-icon>mdi-refresh</v-icon></v-btn>
					</div>

					<loader v-if="aggLoading && !aggregates" />

					<div v-if="aggregates && chartData" class="chart-wrap">
						<Line :data="chartData" :options="chartOptions" />
					</div>

					<div v-if="aggregates" class="agg-grid">
						<div class="agg-card wide">
							<h3>Top endpoints</h3>
							<table>
								<thead><tr><th>Endpoint</th><th>Hits</th><th>Moy.</th><th>p95</th><th>Max</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_endpoints" :key="i" class="clickable" @click="filterByEndpoint(row.module, row.function)">
										<td class="mono">{{ row.module }}/{{ row.function }}</td>
										<td class="num">{{ row.count.toLocaleString() }}</td>
										<td class="num">{{ formatMs(row.avg_ms) }}</td>
										<td class="num" :class="latencyClass(row.p95_ms)">{{ formatMs(row.p95_ms) }}</td>
										<td class="num" :class="latencyClass(row.max_ms)">{{ formatMs(row.max_ms) }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<h3>Top farmers actifs</h3>
							<table>
								<thead><tr><th>Farmer</th><th>Hits</th><th>Endpoints</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_farmers" :key="i" class="clickable" @click="loadFarmerJourney(row.farmer_id)">
										<td>
											<router-link :to="'/farmer/' + row.farmer_id" class="farmer-link" @click.stop>
												{{ row.farmer_name || ('#' + row.farmer_id) }}
											</router-link>
										</td>
										<td class="num">{{ row.count.toLocaleString() }}</td>
										<td class="num">{{ row.endpoints }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<h3>Codes HTTP</h3>
							<table>
								<thead><tr><th>Status</th><th>Hits</th></tr></thead>
								<tbody>
									<tr v-for="row in aggregates.status_distribution" :key="row.http_status">
										<td><span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span></td>
										<td class="num">{{ row.count.toLocaleString() }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card wide">
							<h3>Top requêtes lentes</h3>
							<table>
								<thead><tr><th>Endpoint</th><th>Durée</th><th>Status</th><th>Farmer</th><th>Date</th></tr></thead>
								<tbody>
									<tr v-for="row in aggregates.top_slow" :key="row.id" class="clickable" @click="filterByEndpoint(row.module, row.function)">
										<td class="mono">{{ row.module }}/{{ row.function }}</td>
										<td class="num" :class="latencyClass(row.duration_ms)">{{ formatMs(row.duration_ms) }}</td>
										<td><span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span></td>
										<td>
											<router-link v-if="row.farmer_id" :to="'/farmer/' + row.farmer_id" class="farmer-link" @click.stop>
												{{ row.farmer_name || ('#' + row.farmer_id) }}
											</router-link>
										</td>
										<td class="date">{{ formatDate(row.date) }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel v-if="journeyData || journeyLoading">
			<template #title>
				<span v-if="journeyData">
					Parcours de
					<router-link v-if="journeyData.farmer_id" :to="'/farmer/' + journeyData.farmer_id" class="farmer-link">
						{{ journeyData.farmer_name || ('#' + journeyData.farmer_id) }}
					</router-link>
					<span class="muted">— {{ journeyData.total }} requête(s) sur {{ journeyData.hours }}h</span>
				</span>
				<span v-else>Chargement du parcours…</span>
				<v-btn size="small" icon class="close-btn" @click="journeyData = null"><v-icon>mdi-close</v-icon></v-btn>
			</template>
			<template #content>
				<div class="journey">
					<loader v-if="journeyLoading && !journeyData" />
					<div v-else-if="journeyData && journeyData.logs.length === 0" class="empty">Aucune requête sur cette fenêtre.</div>
					<div v-else class="log-list">
						<div v-for="row in journeyRows" :key="row.id" class="log-row">
							<div class="log-line">
								<span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span>
								<span class="method">{{ row.method }}</span>
								<span class="endpoint mono">{{ row.module }}/{{ row.function }}</span>
								<span class="spacer"></span>
								<span class="duration" :class="latencyClass(row.duration_ms)">{{ formatMs(row.duration_ms) }}</span>
								<span v-if="row.gapLabel" class="gap" :title="row.gapTitle">{{ row.gapLabel }}</span>
								<span class="date">{{ formatDate(row.date) }}</span>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel class="last">
			<template #title>Logs bruts</template>
			<template #content>
				<div ref="logsPanel" class="filters">
					<input v-model="filters.module" placeholder="module" class="filter-input" @keyup.enter="searchLogs" />
					<input v-model="filters.function" placeholder="function" class="filter-input" @keyup.enter="searchLogs" />
					<input v-model.number="filters.farmer_id" placeholder="farmer_id" type="number" class="filter-input" @keyup.enter="searchLogs" />
					<input v-model="filters.ip" placeholder="IP" class="filter-input" @keyup.enter="searchLogs" />
					<input v-model="filters.method" placeholder="method" class="filter-input small" @keyup.enter="searchLogs" />
					<input v-model.number="filters.http_status" placeholder="HTTP" type="number" class="filter-input small" @keyup.enter="searchLogs" />
					<input v-model.number="filters.min_duration_ms" placeholder="min ms" type="number" class="filter-input small" @keyup.enter="searchLogs" />
					<v-btn size="small" color="primary" :loading="logsLoading" @click="searchLogs">Filtrer</v-btn>
					<v-btn size="small" @click="resetFilters">Reset</v-btn>
				</div>

				<loader v-if="logsLoading && !logs" />
				<div v-else-if="logs && logs.length === 0" class="empty">Aucun log.</div>
				<div v-else-if="logs" class="log-list">
					<div class="log-summary">{{ total.toLocaleString() }} résultat(s) — page {{ page }} / {{ totalPages }}</div>
					<div v-for="row in logs" :key="row.id" class="log-row">
						<div class="log-line">
							<span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span>
							<span class="method">{{ row.method }}</span>
							<span class="endpoint mono">{{ row.module }}/{{ row.function }}</span>
							<span class="spacer"></span>
							<span class="duration" :class="latencyClass(row.duration_ms)">{{ formatMs(row.duration_ms) }}</span>
							<router-link v-if="row.farmer_id" :to="'/farmer/' + row.farmer_id" class="farmer-badge" @click.stop>
								{{ row.farmer_name || ('#' + row.farmer_id) }}
							</router-link>
							<span class="ip">{{ row.ip }}</span>
							<span class="date">{{ formatDate(row.date) }}</span>
						</div>
					</div>

					<div v-if="totalPages > 1" class="pagination">
						<v-btn size="small" :disabled="page <= 1" @click="goToPage(page - 1)">Précédent</v-btn>
						<span>Page {{ page }} / {{ totalPages }}</span>
						<v-btn size="small" :disabled="page >= totalPages" @click="goToPage(page + 1)">Suivant</v-btn>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'

	interface Filters {
		module: string
		function: string
		farmer_id: number | null
		ip: string
		method: string
		http_status: number | null
		min_duration_ms: number | null
	}

	function emptyFilters(): Filters {
		return { module: '', function: '', farmer_id: null, ip: '', method: '', http_status: null, min_duration_ms: null }
	}

	const router = useRouter()
	const logsPanel = ref<HTMLElement | null>(null)

	const periodHours = ref(24)
	const aggregates = ref<any>(null)
	const aggLoading = ref(false)
	const chartData = ref<ChartData<'line'> | null>(null)

	const filters = ref<Filters>(emptyFilters())
	const logs = ref<any[] | null>(null)
	const total = ref(0)
	const page = ref(1)
	const pageSize = ref(50)
	const logsLoading = ref(false)

	const journeyData = ref<any>(null)
	const journeyLoading = ref(false)

	const chartOptions: ChartOptions<'line'> = {
		responsive: true,
		aspectRatio: 4,
		interaction: { intersect: false, mode: 'index' },
		plugins: {
			legend: { position: 'bottom' },
		},
		scales: {
			y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Requêtes' } },
			y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'ms' }, grid: { drawOnChartArea: false } },
			x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
		},
	}

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Stats API')
	loadAggregates()
	searchLogs()

	const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

	// Annote chaque row du parcours avec l'écart par rapport à la requête
	// suivante (= la précédente dans le temps, vu que les rows sont en DESC).
	const journeyRows = computed(() => {
		const rows = journeyData.value?.logs ?? []
		return rows.map((row: any, i: number) => {
			const next = rows[i + 1]
			const gapMs = next ? row.date - next.date : 0
			return { ...row, gapLabel: formatGap(gapMs), gapTitle: gapMs ? 'Gap depuis la requête précédente : ' + Math.round(gapMs / 1000) + 's' : '' }
		})
	})

	function loadAggregates() {
		aggLoading.value = true
		LeekWars.post('admin/api-log-aggregates', { period_hours: periodHours.value }).then((data: any) => {
			aggregates.value = data
			chartData.value = buildChartData(data)
			aggLoading.value = false
		}).catch(() => {
			aggLoading.value = false
		})
	}

	function buildChartData(data: any): ChartData<'line'> {
		const labels = data.timeline.map((p: any) => formatBucket(p.bucket, data.bucket_ms))
		return {
			labels,
			datasets: [
				{
					label: 'Requêtes',
					data: data.timeline.map((p: any) => p.count),
					borderColor: '#2196f3',
					backgroundColor: 'rgba(33,150,243,0.15)',
					yAxisID: 'y',
					tension: 0.25,
					pointRadius: 0,
					fill: true,
				},
				{
					label: 'Latence moyenne (ms)',
					data: data.timeline.map((p: any) => p.avg_ms),
					borderColor: '#ff9800',
					backgroundColor: 'rgba(255,152,0,0.15)',
					yAxisID: 'y1',
					tension: 0.25,
					pointRadius: 0,
				},
			],
		}
	}

	function formatBucket(bucketMs: number, sizeMs: number): string {
		const d = new Date(bucketMs)
		const pad = (n: number) => String(n).padStart(2, '0')
		if (sizeMs >= 24 * 3600 * 1000) {
			return pad(d.getDate()) + '/' + pad(d.getMonth() + 1)
		}
		if (sizeMs >= 3600 * 1000) {
			return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + 'h'
		}
		return pad(d.getHours()) + ':' + pad(d.getMinutes())
	}

	function searchLogs() {
		logsLoading.value = true
		const f: any = {}
		for (const [key, value] of Object.entries(filters.value)) {
			if (value !== '' && value !== null && value !== undefined) f[key] = value
		}
		LeekWars.post('admin/api-log', { filters: f, page: page.value, page_size: pageSize.value }).then((data: any) => {
			logs.value = data.logs
			total.value = data.total
			logsLoading.value = false
		}).catch(() => {
			logsLoading.value = false
		})
	}

	function goToPage(p: number) {
		page.value = p
		searchLogs()
	}

	function resetFilters() {
		filters.value = emptyFilters()
		page.value = 1
		searchLogs()
	}

	function filterByEndpoint(module: string, fn: string) {
		filters.value = { ...emptyFilters(), module, function: fn }
		page.value = 1
		searchLogs()
		logsPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	function loadFarmerJourney(farmerId: number) {
		journeyLoading.value = true
		LeekWars.get('admin/api-log-farmer/' + farmerId + '/' + periodHours.value).then((data: any) => {
			journeyData.value = data
			journeyLoading.value = false
		}).catch(() => {
			journeyLoading.value = false
		})
	}

	watch(periodHours, () => {
		if (journeyData.value) loadFarmerJourney(journeyData.value.farmer_id)
	})

	function formatDate(ms: number): string {
		return LeekWars.formatDateTime(Math.floor(ms / 1000))
	}

	function formatMs(ms: number): string {
		if (ms === null || ms === undefined) return '—'
		const v = Math.round(ms)
		if (v >= 1000) return (v / 1000).toFixed(2) + ' s'
		return v + ' ms'
	}

	function formatGap(gapMs: number): string {
		if (gapMs < 1000) return ''
		if (gapMs < 60000) return '+' + Math.round(gapMs / 1000) + 's'
		if (gapMs < 3600000) return '+' + Math.round(gapMs / 60000) + 'min'
		return '+' + Math.round(gapMs / 3600000) + 'h'
	}

	function httpClass(status: number | null): string {
		if (status === null || status === undefined) return 'http-unknown'
		if (status >= 500) return 'http-5xx'
		if (status === 429) return 'http-429'
		if (status >= 400) return 'http-4xx'
		return 'http-ok'
	}

	function latencyClass(ms: number): string {
		if (ms === null || ms === undefined) return ''
		if (ms >= 2000) return 'lat-bad'
		if (ms >= 500) return 'lat-warn'
		if (ms >= 100) return 'lat-mid'
		return 'lat-ok'
	}
</script>

<style lang="scss" scoped>
	.aggregates { padding: 10px; }
	.period-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		flex-wrap: wrap;
		.total { font-weight: bold; color: #555; }
	}
	.chart-wrap {
		background: var(--pure-white, white);
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 8px;
		margin-bottom: 10px;
	}
	.agg-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 10px;
	}
	.agg-card {
		background: var(--pure-white, white);
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 8px;
		&.wide { grid-column: span 2; }
		@media (max-width: 800px) { &.wide { grid-column: auto; } }
		h3 { margin: 0 0 6px; font-size: 14px; color: #555; }
		table { width: 100%; border-collapse: collapse; font-size: 12px; }
		th, td { padding: 3px 4px; text-align: left; border-bottom: 1px solid #f0f0f0; }
		th { color: #888; font-weight: normal; }
		.num { text-align: right; font-variant-numeric: tabular-nums; }
		.mono { font-family: monospace; }
		.clickable { cursor: pointer; }
		.clickable:hover { background: #f5f9ff; }
		.date { font-size: 11px; color: #888; font-variant-numeric: tabular-nums; }
	}
	.farmer-link {
		display: inline-block;
		padding: 1px 6px;
		background: #e3f2fd;
		color: #0277bd;
		border-radius: 3px;
		text-decoration: none;
		font-weight: bold;
		font-size: 11px;
		&:hover { background: #bbdefb; }
	}
	.muted { color: #888; font-weight: normal; font-size: 13px; margin-left: 6px; }
	.close-btn { float: right; }
	.journey { padding: 4px 10px; }

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 10px;
		background: #fafafa;
		border-bottom: 1px solid #eee;
	}
	.filter-input {
		padding: 4px 8px;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 13px;
		width: 130px;
		&.small { width: 80px; }
	}
	.empty { padding: 30px; text-align: center; color: #888; }

	.log-list { padding: 8px 10px; }
	.log-summary { font-size: 12px; color: #888; margin-bottom: 6px; }
	.log-row {
		border-bottom: 1px solid #f0f0f0;
		padding: 4px;
		font-size: 13px;
		&:hover { background: #fafafa; }
	}
	.log-line {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.spacer { flex: 1; }
	.status {
		font-family: monospace;
		font-weight: bold;
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 12px;
		min-width: 30px;
		text-align: center;
		&.http-ok { background: #c8e6c9; color: #2e7d32; }
		&.http-4xx { background: #ffe0b2; color: #e65100; }
		&.http-429 { background: #ffcc80; color: #c2410c; }
		&.http-5xx { background: #ffcdd2; color: #b71c1c; }
		&.http-unknown { background: #eceff1; color: #555; }
	}
	.method {
		font-family: monospace;
		font-size: 11px;
		color: #666;
		min-width: 40px;
	}
	.endpoint {
		font-family: monospace;
		font-size: 12px;
		max-width: 380px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.duration {
		font-family: monospace;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		min-width: 70px;
		text-align: right;
	}
	.lat-ok { color: #2e7d32; }
	.lat-mid { color: #455a64; }
	.lat-warn { color: #e65100; font-weight: bold; }
	.lat-bad { color: #b71c1c; font-weight: bold; }
	.duration.lat-bad { background: #ffcdd2; padding: 1px 6px; border-radius: 3px; }
	.gap {
		font-family: monospace;
		font-size: 11px;
		color: #999;
		min-width: 50px;
		text-align: right;
	}
	.farmer-badge {
		background: #e3f2fd;
		color: #0277bd;
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 11px;
		font-weight: bold;
		text-decoration: none;
		&:hover { background: #bbdefb; }
	}
	.ip {
		font-family: monospace;
		font-size: 12px;
		color: #555;
	}
	.date {
		font-size: 11px;
		color: #888;
		font-variant-numeric: tabular-nums;
	}
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		padding: 12px;
	}
</style>
