<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Stats API', link: '/admin/api-stats'}]" :raw="true" /></h1>
		</div>

		<panel class="first">
			<template #content>
				<div class="padded">
					<div class="period-bar">
						<span>Fenêtre :</span>
						<v-btn-toggle v-model="periodHours" mandatory density="compact" :disabled="useCustomRange" @update:modelValue="onPeriodChange">
							<v-btn :value="1" size="small">1h</v-btn>
							<v-btn :value="24" size="small">24h</v-btn>
							<v-btn :value="168" size="small">7j</v-btn>
							<v-btn :value="720" size="small">30j</v-btn>
						</v-btn-toggle>
						<v-btn size="small" :variant="useCustomRange ? 'flat' : 'outlined'" @click="toggleCustomRange">
							<v-icon size="small">mdi-calendar-range</v-icon>
							Custom
						</v-btn>
						<template v-if="useCustomRange">
							<input v-model="dateFrom" type="datetime-local" class="date-input" />
							<span>→</span>
							<input v-model="dateTo" type="datetime-local" class="date-input" />
							<v-btn size="small" color="primary" @click="loadAll">Appliquer</v-btn>
						</template>
						<v-checkbox v-model="compare" density="compact" hide-details label="Comparer" @update:modelValue="loadAggregates" />
						<v-checkbox v-model="autoRefresh" density="compact" hide-details label="Auto-refresh" @update:modelValue="onAutoRefreshChange" />
						<select v-if="autoRefresh" v-model.number="refreshInterval" class="interval-select" @change="onAutoRefreshChange">
							<option :value="10">10s</option>
							<option :value="30">30s</option>
							<option :value="60">1min</option>
							<option :value="300">5min</option>
						</select>
						<span class="spacer"></span>
						<v-btn size="small" :loading="aggLoading" @click="loadAll"><v-icon>mdi-refresh</v-icon></v-btn>
					</div>

					<div v-if="aggregates" class="summary-bar">
						<KpiCard label="Requêtes" :value="aggregates.total.toLocaleString()" :delta="deltas.total" />
						<KpiCard label="Latence moy." :value="aggregates.avg_ms + ' ms'" :delta="deltas.avg_ms" lower-is-better />
						<KpiCard label="p95" :value="aggregates.p95_ms + ' ms'" :delta="deltas.p95_ms" lower-is-better />
						<KpiCard label="Farmers uniques" :value="aggregates.farmers.toLocaleString()" :delta="deltas.farmers" />
					</div>

					<loader v-if="aggLoading && !aggregates" />

					<div v-if="aggregates && chartData" class="chart-wrap">
						<Line :data="chartData" :options="chartOptions" />
					</div>

					<div v-if="aggregates" class="agg-grid">
						<div class="agg-card wide">
							<h4>Top endpoints</h4>
							<table>
								<thead><tr><th>Endpoint</th><th>Hits</th><th>Moy.</th><th>p95</th><th>Max</th><th></th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_endpoints" :key="i" class="clickable" @click="filterByEndpoint(row.module, row.function)">
										<td class="mono">{{ row.module }}/{{ row.function }}</td>
										<td class="num">{{ row.count.toLocaleString() }}</td>
										<td class="num">{{ formatMs(row.avg_ms) }}</td>
										<td class="num" :class="latencyClass(row.p95_ms)">{{ formatMs(row.p95_ms) }}</td>
										<td class="num" :class="latencyClass(row.max_ms)">{{ formatMs(row.max_ms) }}</td>
										<td class="actions">
											<router-link :to="endpointDetailLink(row.module, row.function)" class="action-icon" title="Détail" @click.stop>
												<v-icon size="14">mdi-chart-line</v-icon>
											</router-link>
											<router-link v-if="row.security_count > 0" :to="securityLink(row.module, row.function)" class="action-icon sec" :title="row.security_count + ' alertes sécurité'" @click.stop>
												<v-icon size="14">mdi-shield-alert</v-icon>
												<span class="sec-count">{{ row.security_count }}</span>
											</router-link>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<div class="card-header">
								<h4>Top farmers actifs</h4>
								<label class="inline-toggle">
									<input v-model="newFarmersOnly" type="checkbox" @change="loadAggregates" />
									Nouveaux
								</label>
								<select v-if="newFarmersOnly" v-model.number="newFarmerDays" class="interval-select" @change="loadAggregates">
									<option :value="1">1j</option>
									<option :value="7">7j</option>
									<option :value="30">30j</option>
								</select>
							</div>
							<table>
								<thead><tr><th>Farmer</th><th>Hits</th><th>Endpoints</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_farmers" :key="i" class="clickable" @click="loadFarmerJourney(row.farmer_id)">
										<td>
											<router-link :to="'/farmer/' + row.farmer_id" class="farmer-link" @click.stop>
												{{ row.farmer_name || ('#' + row.farmer_id) }}
											</router-link>
											<span v-if="row.register_time" class="register-age" :title="'Inscrit ' + formatDate(row.register_time * 1000)">{{ daysAgo(row.register_time) }}</span>
										</td>
										<td class="num">{{ row.count.toLocaleString() }}</td>
										<td class="num">{{ row.endpoints }}</td>
									</tr>
								</tbody>
							</table>
							<div v-if="aggregates.top_farmers.length === 0" class="empty small">Aucun.</div>
						</div>

						<div class="agg-card">
							<h4>Codes HTTP</h4>
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
							<h4>Top requêtes lentes</h4>
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

		<panel>
			<template #title>
				Heatmap endpoint × temps
				<select v-model="heatmapMetric" class="interval-select header-select" @change="loadHeatmap">
					<option value="count">Volume</option>
					<option value="errors">Erreurs</option>
					<option value="avg_ms">Latence moy.</option>
				</select>
			</template>
			<template #content>
				<loader v-if="heatmapLoading && !heatmap" />
				<div v-else-if="heatmap && heatmap.matrix.length === 0" class="empty">Pas de données.</div>
				<div v-else-if="heatmap" class="heatmap-wrap">
					<table class="heatmap">
						<thead>
							<tr>
								<th class="endpoint-col"></th>
								<th v-for="(b, i) in heatmap.buckets" :key="b" class="bucket-col">{{ bucketLabel(i, b) }}</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="row in heatmap.matrix" :key="row.module + '/' + row.function">
								<td class="endpoint-col mono clickable" @click="filterByEndpoint(row.module, row.function)">
									{{ row.module }}/{{ row.function }}
								</td>
								<td v-for="(cell, j) in row.cells" :key="j" class="cell" :style="cellStyle(cell)" :title="cellTitle(row, cell, heatmap.buckets[j])"></td>
							</tr>
						</tbody>
					</table>
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
					<span v-if="filters.from || filters.to" class="range-info">
						{{ filters.from ? formatDate(filters.from) : '…' }} → {{ filters.to ? formatDate(filters.to) : '…' }}
					</span>
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
	import { computed, onUnmounted, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import KpiCard from '@/component/admin/kpi-card.vue'
	import { formatBucket, formatDateMs as formatDate, formatMs, httpClass, latencyClass } from '@/component/admin/api-stats-utils'
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
		from: number | null
		to: number | null
	}

	function emptyFilters(): Filters {
		return { module: '', function: '', farmer_id: null, ip: '', method: '', http_status: null, min_duration_ms: null, from: null, to: null }
	}

	const router = useRouter()
	const logsPanel = ref<HTMLElement | null>(null)

	const periodHours = ref(24)
	const useCustomRange = ref(false)
	const dateFrom = ref('')
	const dateTo = ref('')
	const compare = ref(false)
	const newFarmersOnly = ref(false)
	const newFarmerDays = ref(7)
	const autoRefresh = ref(false)
	const refreshInterval = ref(30)
	let refreshTimer: number | null = null

	const aggregates = ref<any>(null)
	const aggLoading = ref(false)
	const chartData = ref<ChartData<'line'> | null>(null)

	const heatmap = ref<any>(null)
	const heatmapLoading = ref(false)
	const heatmapMetric = ref<'count' | 'errors' | 'avg_ms'>('count')

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
		maintainAspectRatio: false,
		interaction: { intersect: false, mode: 'index' },
		plugins: {
			legend: { position: 'bottom' },
		},
		scales: {
			y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Requêtes' } },
			y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'ms' }, grid: { drawOnChartArea: false } },
			x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
		},
		onClick: (_event, elements) => {
			if (!elements.length || !aggregates.value) return
			const i = elements[0].index
			const point = aggregates.value.timeline[i]
			if (!point) return
			drillDown(point.bucket, point.bucket + aggregates.value.bucket_ms)
		},
	}

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Stats API')
	loadAll()

	onUnmounted(() => {
		if (refreshTimer !== null) clearInterval(refreshTimer)
	})

	const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

	const bucketLabelStep = computed(() => {
		if (!heatmap.value) return 1
		return Math.max(1, Math.ceil(heatmap.value.buckets.length / 12))
	})

	function bucketLabel(i: number | string, bucket: number): string {
		if (!heatmap.value) return ''
		const idx = typeof i === 'number' ? i : parseInt(i, 10)
		return idx % bucketLabelStep.value === 0 ? formatBucket(bucket, heatmap.value.bucket_ms) : ''
	}

	const journeyRows = computed(() => {
		const rows = journeyData.value?.logs ?? []
		return rows.map((row: any, i: number) => {
			const next = rows[i + 1]
			const gapMs = next ? row.date - next.date : 0
			return { ...row, gapLabel: formatGap(gapMs), gapTitle: gapMs ? 'Gap depuis la requête précédente : ' + Math.round(gapMs / 1000) + 's' : '' }
		})
	})

	function windowPayload() {
		if (useCustomRange.value && dateFrom.value && dateTo.value) {
			return { from: new Date(dateFrom.value).getTime(), to: new Date(dateTo.value).getTime(), period_hours: 0 }
		}
		return { from: 0, to: 0, period_hours: periodHours.value }
	}

	function loadAll() {
		loadAggregates()
		loadHeatmap()
		searchLogs()
	}

	function loadAggregates() {
		aggLoading.value = true
		const payload = { ...windowPayload(), compare: compare.value, new_farmer_days: newFarmersOnly.value ? newFarmerDays.value : 0 }
		LeekWars.post('admin/api-log-aggregates', payload).then((data: any) => {
			aggregates.value = data
			chartData.value = buildChartData(data)
			aggLoading.value = false
		}).catch(() => {
			aggLoading.value = false
		})
	}

	function loadHeatmap() {
		heatmapLoading.value = true
		const payload = { ...windowPayload(), metric: heatmapMetric.value }
		LeekWars.post('admin/api-log-heatmap', payload).then((data: any) => {
			heatmap.value = data
			heatmapLoading.value = false
		}).catch(() => {
			heatmapLoading.value = false
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
				{
					label: 'Erreurs',
					data: data.timeline.map((p: any) => p.errors ?? 0),
					borderColor: '#e53935',
					backgroundColor: 'rgba(229,57,53,0.1)',
					yAxisID: 'y',
					tension: 0.25,
					pointRadius: 0,
				},
			],
		}
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

	function drillDown(from: number, to: number) {
		filters.value = { ...emptyFilters(), from, to }
		page.value = 1
		searchLogs()
		logsPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}

	function loadFarmerJourney(farmerId: number) {
		journeyLoading.value = true
		LeekWars.get('admin/api-log-farmer/' + farmerId + '/' + (periodHours.value || 24)).then((data: any) => {
			journeyData.value = data
			journeyLoading.value = false
		}).catch(() => {
			journeyLoading.value = false
		})
	}

	function onPeriodChange() {
		loadAll()
	}

	function toggleCustomRange() {
		useCustomRange.value = !useCustomRange.value
		if (useCustomRange.value && !dateFrom.value) {
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 3600 * 1000)
			dateTo.value = toLocalIso(now)
			dateFrom.value = toLocalIso(yesterday)
		}
	}

	function toLocalIso(d: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0')
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes())
	}

	function onAutoRefreshChange() {
		if (refreshTimer !== null) {
			clearInterval(refreshTimer)
			refreshTimer = null
		}
		if (autoRefresh.value) {
			refreshTimer = window.setInterval(() => {
				// Skip si une requête précédente n'a pas fini : évite l'empilement sous DB lente.
				if (aggLoading.value || heatmapLoading.value) return
				loadAggregates()
				loadHeatmap()
			}, refreshInterval.value * 1000)
		}
	}

	watch(periodHours, () => {
		if (journeyData.value) loadFarmerJourney(journeyData.value.farmer_id)
	})

	function endpointDetailLink(module: string, fn: string): string {
		return '/admin/api-stats/' + encodeURIComponent(module) + '/' + encodeURIComponent(fn)
	}

	function securityLink(module: string, fn: string): string {
		return '/admin/security?module=' + encodeURIComponent(module) + '&function=' + encodeURIComponent(fn)
	}

	const deltas = computed(() => {
		const prev = aggregates.value?.previous
		const cur = aggregates.value
		const compute = (key: string): number | null => {
			if (!prev || !cur || !prev[key]) return null
			return ((cur[key] - prev[key]) / prev[key]) * 100
		}
		return {
			total: compute('total'),
			avg_ms: compute('avg_ms'),
			p95_ms: compute('p95_ms'),
			farmers: compute('farmers'),
		}
	})

	function formatGap(gapMs: number): string {
		if (gapMs < 1000) return ''
		if (gapMs < 60000) return '+' + Math.round(gapMs / 1000) + 's'
		if (gapMs < 3600000) return '+' + Math.round(gapMs / 60000) + 'min'
		return '+' + Math.round(gapMs / 3600000) + 'h'
	}

	function daysAgo(epochSec: number): string {
		const days = Math.floor((Date.now() / 1000 - epochSec) / 86400)
		if (days <= 0) return 'aujourd’hui'
		if (days === 1) return '1j'
		return days + 'j'
	}

	const HEATMAP_COLORS: Record<'count' | 'errors' | 'avg_ms', string> = {
		count: '33,150,243',
		errors: '229,57,53',
		avg_ms: '255,152,0',
	}

	const cellMaxValue = computed(() => {
		if (!heatmap.value) return 1
		let max = 0
		for (const row of heatmap.value.matrix) {
			for (const cell of row.cells) {
				if (!cell) continue
				const v = cell[heatmapMetric.value]
				if (v > max) max = v
			}
		}
		return max || 1
	})

	function cellStyle(cell: any): Record<string, string> {
		if (!cell) return { background: 'transparent' }
		const v = cell[heatmapMetric.value]
		if (!v) return { background: 'transparent' }
		const intensity = 0.15 + 0.75 * Math.min(1, v / cellMaxValue.value)
		return { background: `rgba(${HEATMAP_COLORS[heatmapMetric.value]},${intensity})` }
	}

	function cellTitle(row: any, cell: any, bucket: number): string {
		const ts = formatBucket(bucket, heatmap.value.bucket_ms)
		if (!cell) return `${row.module}/${row.function} @ ${ts}\nAucune requête`
		return `${row.module}/${row.function} @ ${ts}\n${cell.count} req · ${cell.errors} err · ${cell.avg_ms}ms moy.`
	}
</script>

<style lang="scss" scoped>
	.padded { padding: 10px; }
	.period-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}
	.spacer { flex: 1; }
	.date-input, .interval-select {
		padding: 4px 6px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--pure-white);
		color: var(--text-color);
		font-size: 13px;
	}
	.header-select {
		margin-left: 10px;
	}

	.summary-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
		margin-bottom: 12px;
	}

	.chart-wrap {
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 8px;
		margin-bottom: 10px;
		height: 400px;
	}
	.agg-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 10px;
	}
	.agg-card {
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 8px;
		&.wide { grid-column: span 2; }
		@media (max-width: 800px) { &.wide { grid-column: auto; } }
		h4 { margin: 0 0 6px; font-size: 14px; color: var(--text-color-secondary); }
		.card-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 6px;
			h4 { margin: 0; flex: 1; }
		}
		table { width: 100%; border-collapse: collapse; font-size: 12px; }
		th, td { padding: 3px 4px; text-align: left; border-bottom: 1px solid var(--border); }
		th { color: var(--text-color-secondary); font-weight: normal; }
		.num { text-align: right; font-variant-numeric: tabular-nums; }
		.mono { font-family: monospace; }
		.clickable { cursor: pointer; }
		.clickable:hover { background: var(--background-secondary); }
		.date { font-size: 11px; color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
		.actions {
			display: flex;
			gap: 4px;
			justify-content: flex-end;
		}
		.action-icon {
			color: var(--text-color-secondary);
			text-decoration: none;
			padding: 2px 4px;
			border-radius: 3px;
			display: inline-flex;
			align-items: center;
			gap: 2px;
			&:hover { background: var(--background-secondary); color: var(--link-color); }
			&.sec { color: #c62828; }
			.sec-count { font-size: 10px; font-weight: bold; }
		}
		.empty.small { padding: 12px; font-size: 12px; }
	}
	.inline-toggle {
		font-size: 12px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		input { margin: 0; }
	}
	.register-age {
		display: inline-block;
		margin-left: 4px;
		padding: 0 4px;
		background: var(--background-header);
		color: var(--text-color-secondary);
		font-size: 10px;
		border-radius: 2px;
	}
	.farmer-link {
		display: inline-block;
		padding: 1px 6px;
		background: var(--background-header);
		color: var(--link-color);
		border-radius: 3px;
		text-decoration: none;
		font-weight: bold;
		font-size: 11px;
		&:hover { background: var(--background-secondary); }
	}
	.muted { color: var(--text-color-secondary); font-weight: normal; font-size: 13px; margin-left: 6px; }
	.close-btn { float: right; }
	.journey { padding: 4px 10px; }

	.heatmap-wrap {
		padding: 8px;
		overflow-x: auto;
	}
	.heatmap {
		border-collapse: collapse;
		font-size: 11px;
		width: 100%;
		min-width: 600px;
		.endpoint-col {
			padding: 2px 6px;
			border-right: 1px solid var(--border);
			min-width: 200px;
			max-width: 280px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			background: var(--pure-white);
			position: sticky;
			left: 0;
			z-index: 1;
		}
		.endpoint-col.clickable { cursor: pointer; }
		.endpoint-col.clickable:hover { background: var(--background-secondary); }
		.bucket-col {
			padding: 2px 0;
			text-align: center;
			color: var(--text-color-secondary);
			font-weight: normal;
			min-width: 12px;
			font-size: 10px;
		}
		.cell {
			height: 20px;
			min-width: 12px;
			border: 1px solid var(--border);
		}
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 10px;
		background: var(--background-secondary);
		border-bottom: 1px solid var(--border);
		align-items: center;
	}
	.filter-input {
		padding: 4px 8px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--pure-white);
		color: var(--text-color);
		font-size: 13px;
		width: 130px;
		&.small { width: 80px; }
	}
	.range-info {
		font-size: 11px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
	}
	.empty { padding: 30px; text-align: center; color: var(--text-color-secondary); }

	.log-list { padding: 8px 10px; }
	.log-summary { font-size: 12px; color: var(--text-color-secondary); margin-bottom: 6px; }
	.log-row {
		border-bottom: 1px solid var(--border);
		padding: 4px;
		font-size: 13px;
		&:hover { background: var(--background-secondary); }
	}
	.log-line {
		display: flex;
		align-items: center;
		gap: 8px;
	}
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
		&.http-unknown { background: var(--background-header); color: var(--text-color-secondary); }
	}
	.method {
		font-family: monospace;
		font-size: 11px;
		color: var(--text-color-secondary);
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
	.lat-mid { color: var(--text-color-secondary); }
	.lat-warn { color: #e65100; font-weight: bold; }
	.lat-bad { color: #b71c1c; font-weight: bold; }
	.duration.lat-bad { background: #ffcdd2; padding: 1px 6px; border-radius: 3px; }
	.gap {
		font-family: monospace;
		font-size: 11px;
		color: var(--text-color-secondary);
		min-width: 50px;
		text-align: right;
	}
	.farmer-badge {
		background: var(--background-header);
		color: var(--link-color);
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 11px;
		font-weight: bold;
		text-decoration: none;
		&:hover { background: var(--background-secondary); }
	}
	.ip {
		font-family: monospace;
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.date {
		font-size: 11px;
		color: var(--text-color-secondary);
		font-variant-numeric: tabular-nums;
	}
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		padding: 12px;
	}

	body.dark {
		.status {
			&.http-ok { background: #1b3a1f; color: #81c784; }
			&.http-4xx { background: #4a2e0f; color: #ffb74d; }
			&.http-429 { background: #5a2e0a; color: #ffa726; }
			&.http-5xx { background: #4a1717; color: #ef9a9a; }
		}
		.lat-ok { color: #81c784; }
		.lat-warn { color: #ffb74d; }
		.lat-bad { color: #ef9a9a; }
		.duration.lat-bad { background: #4a1717; }
		.action-icon.sec { color: #ef9a9a; }
	}
</style>
