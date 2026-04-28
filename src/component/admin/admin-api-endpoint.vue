<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="crumb" :raw="true" /></h1>
		</div>

		<panel class="first">
			<template #content>
				<div class="header-bar">
					<div class="period-bar">
						<span>Fenêtre :</span>
						<v-btn-toggle v-model="periodHours" mandatory density="compact" @update:modelValue="load">
							<v-btn :value="1" size="small">1h</v-btn>
							<v-btn :value="24" size="small">24h</v-btn>
							<v-btn :value="168" size="small">7j</v-btn>
							<v-btn :value="720" size="small">30j</v-btn>
						</v-btn-toggle>
						<v-btn size="small" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn>
					</div>
					<router-link v-if="data && data.security_count > 0" :to="securityLink()" class="security-link">
						<v-icon size="small">mdi-shield-alert</v-icon>
						{{ data.security_count }} alerte(s) sécurité
					</router-link>
				</div>

				<loader v-if="loading && !data" />

				<div v-if="data" class="summary-bar">
					<KpiCard label="Hits" :value="data.summary.count.toLocaleString()" />
					<KpiCard label="Farmers" :value="data.summary.farmers.toLocaleString()" />
					<KpiCard label="Erreurs" :value="data.summary.errors.toLocaleString()" :value-class="data.summary.errors > 0 ? 'kpi-bad' : ''" />
					<KpiCard label="Moy." :value="data.summary.avg_ms + ' ms'" />
					<KpiCard label="p50" :value="data.summary.p50_ms + ' ms'" />
					<KpiCard label="p95" :value="data.summary.p95_ms + ' ms'" />
					<KpiCard label="p99" :value="data.summary.p99_ms + ' ms'" />
					<KpiCard label="Max" :value="data.summary.max_ms + ' ms'" />
				</div>

				<div v-if="data && timelineChart" class="chart-wrap">
					<Line :data="timelineChart" :options="timelineOptions" />
				</div>
			</template>
		</panel>

		<panel>
			<template #title>Distribution de latence</template>
			<template #content>
				<div v-if="data && histogramChart" class="chart-wrap">
					<Bar :data="histogramChart" :options="histogramOptions" />
				</div>
				<div v-else-if="data" class="empty">Pas de données.</div>
			</template>
		</panel>

		<panel class="last">
			<template #title>Top farmers et codes HTTP</template>
			<template #content>
				<div class="agg-grid">
					<div class="agg-card">
						<h4>Top farmers</h4>
						<table v-if="data && data.top_farmers.length">
							<thead><tr><th>Farmer</th><th>Hits</th><th>Dernier vu</th></tr></thead>
							<tbody>
								<tr v-for="row in data.top_farmers" :key="row.farmer_id">
									<td>
										<router-link :to="'/farmer/' + row.farmer_id" class="farmer-link">
											{{ row.farmer_name || ('#' + row.farmer_id) }}
										</router-link>
									</td>
									<td class="num">{{ row.count.toLocaleString() }}</td>
									<td class="date">{{ formatDate(row.last_seen) }}</td>
								</tr>
							</tbody>
						</table>
						<div v-else class="empty small">Aucun farmer identifié.</div>
					</div>

					<div class="agg-card">
						<h4>Codes HTTP</h4>
						<table v-if="data && data.status_distribution.length">
							<thead><tr><th>Status</th><th>Hits</th></tr></thead>
							<tbody>
								<tr v-for="row in data.status_distribution" :key="row.http_status">
									<td><span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span></td>
									<td class="num">{{ row.count.toLocaleString() }}</td>
								</tr>
							</tbody>
						</table>
						<div v-else class="empty small">Pas de données.</div>
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
	import { useRoute, useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import KpiCard from '@/component/admin/kpi-card.vue'
	import { formatBucket, formatDateMs as formatDate, httpClass } from '@/component/admin/api-stats-utils'
	import { Bar, Line } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'

	const route = useRoute()
	const router = useRouter()

	const moduleName = computed(() => decodeURIComponent(String(route.params.module || '')))
	const fnName = computed(() => decodeURIComponent(String(route.params.function || '')))

	const periodHours = ref(24)
	const loading = ref(false)
	const data = ref<any>(null)

	const crumb = computed(() => [
		{ name: 'Administration', link: '/admin' },
		{ name: 'Stats API', link: '/admin/api-stats' },
		{ name: moduleName.value + '/' + fnName.value, link: '/admin/api-stats/' + encodeURIComponent(moduleName.value) + '/' + encodeURIComponent(fnName.value) },
	])

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Stats API · ' + moduleName.value + '/' + fnName.value)
	load()

	watch([moduleName, fnName], load)

	function load() {
		if (!moduleName.value || !fnName.value) return
		loading.value = true
		LeekWars.post('admin/api-log-endpoint', {
			module: moduleName.value,
			function: fnName.value,
			period_hours: periodHours.value,
		}).then((res: any) => {
			data.value = res
			loading.value = false
		}).catch(() => {
			loading.value = false
		})
	}

	const timelineChart = computed<ChartData<'line'> | null>(() => {
		if (!data.value) return null
		const labels = data.value.timeline.map((p: any) => formatBucket(p.bucket, data.value.bucket_ms))
		return {
			labels,
			datasets: [
				{
					label: 'Requêtes',
					data: data.value.timeline.map((p: any) => p.count),
					borderColor: '#2196f3',
					backgroundColor: 'rgba(33,150,243,0.15)',
					yAxisID: 'y',
					tension: 0.25,
					pointRadius: 0,
					fill: true,
				},
				{
					label: 'Moy. (ms)',
					data: data.value.timeline.map((p: any) => p.avg_ms),
					borderColor: '#ff9800',
					yAxisID: 'y1',
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: 'p95 (ms)',
					data: data.value.timeline.map((p: any) => p.p95_ms),
					borderColor: '#9c27b0',
					yAxisID: 'y1',
					tension: 0.25,
					pointRadius: 0,
				},
				{
					label: 'Erreurs',
					data: data.value.timeline.map((p: any) => p.errors ?? 0),
					borderColor: '#e53935',
					yAxisID: 'y',
					tension: 0.25,
					pointRadius: 0,
				},
			],
		}
	})

	const timelineOptions: ChartOptions<'line'> = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: { intersect: false, mode: 'index' },
		plugins: { legend: { position: 'bottom' } },
		scales: {
			y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Requêtes' } },
			y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'ms' }, grid: { drawOnChartArea: false } },
			x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
		},
	}

	const histogramChart = computed<ChartData<'bar'> | null>(() => {
		if (!data.value || !data.value.histogram.length) return null
		return {
			labels: data.value.histogram.map((b: any) => b.bucket_label),
			datasets: [{
				label: 'Requêtes',
				data: data.value.histogram.map((b: any) => b.count),
				backgroundColor: '#2196f3',
			}],
		}
	})

	const histogramOptions: ChartOptions<'bar'> = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: { legend: { display: false } },
		scales: {
			y: { beginAtZero: true, title: { display: true, text: 'Requêtes' } },
			x: { title: { display: true, text: 'Latence' } },
		},
	}

	function securityLink(): string {
		return '/admin/security?module=' + encodeURIComponent(moduleName.value) + '&function=' + encodeURIComponent(fnName.value)
	}
</script>

<style lang="scss" scoped>
	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px;
		flex-wrap: wrap;
		gap: 10px;
	}
	.period-bar {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.security-link {
		color: #c62828;
		text-decoration: none;
		font-weight: bold;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		background: var(--background-header);
		border-radius: 4px;
		&:hover { background: var(--background-secondary); }
	}
	.summary-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 8px;
		padding: 0 10px 10px;
	}
	.chart-wrap {
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		margin: 10px;
		padding: 8px;
		height: 400px;
	}
	.agg-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: 10px;
		padding: 10px;
	}
	.agg-card {
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 8px;
		h4 { margin: 0 0 6px; font-size: 14px; color: var(--text-color-secondary); }
		table { width: 100%; border-collapse: collapse; font-size: 12px; }
		th, td { padding: 3px 4px; text-align: left; border-bottom: 1px solid var(--border); }
		th { color: var(--text-color-secondary); font-weight: normal; }
		.num { text-align: right; font-variant-numeric: tabular-nums; }
		.date { font-size: 11px; color: var(--text-color-secondary); font-variant-numeric: tabular-nums; }
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
	.empty { padding: 30px; text-align: center; color: var(--text-color-secondary); }
	.empty.small { padding: 12px; font-size: 12px; }
	.status {
		font-family: monospace;
		font-weight: bold;
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 12px;
		min-width: 30px;
		text-align: center;
		display: inline-block;
		&.http-ok { background: #c8e6c9; color: #2e7d32; }
		&.http-4xx { background: #ffe0b2; color: #e65100; }
		&.http-429 { background: #ffcc80; color: #c2410c; }
		&.http-5xx { background: #ffcdd2; color: #b71c1c; }
		&.http-unknown { background: var(--background-header); color: var(--text-color-secondary); }
	}
	body.dark {
		.status {
			&.http-ok { background: #1b3a1f; color: #81c784; }
			&.http-4xx { background: #4a2e0f; color: #ffb74d; }
			&.http-429 { background: #5a2e0a; color: #ffa726; }
			&.http-5xx { background: #4a1717; color: #ef9a9a; }
		}
		.security-link { color: #ef9a9a; }
	}
</style>
