<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Sécurité', link: '/admin/security'}]" :raw="true" /></h1>
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
						<span v-if="aggregates" class="total">{{ aggregates.total.toLocaleString() }} événements</span>
						<v-btn size="small" @click="loadAggregates" :loading="aggLoading"><v-icon>mdi-refresh</v-icon></v-btn>
					</div>

					<loader v-if="aggLoading && !aggregates" />

					<div v-if="aggregates" class="agg-grid">
						<div class="agg-card">
							<h3>Top IPs</h3>
							<table>
								<thead><tr><th>IP</th><th>Hits</th><th>Codes</th><th>👤</th></tr></thead>
								<tbody>
									<tr v-for="row in aggregates.top_ips" :key="row.ip" class="clickable" @click="openIpDetail(row.ip)">
										<td class="mono">{{ row.ip }}</td>
										<td class="num">{{ row.count }}</td>
										<td class="num">{{ row.error_codes }}</td>
										<td class="num">{{ row.farmers || '' }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<h3>Top endpoints</h3>
							<table>
								<thead><tr><th>Endpoint</th><th>Erreur</th><th>Hits</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_endpoints" :key="i" class="clickable" @click="filterByEndpoint(row.module, row.function)">
										<td class="mono">{{ row.module }}/{{ row.function }}</td>
										<td><span class="code-badge" :class="codeSeverity(row.error_code)">{{ row.error_code }}</span></td>
										<td class="num">{{ row.count }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<h3>Top User-Agents</h3>
							<table>
								<thead><tr><th>UA</th><th>Hits</th><th>IPs</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_user_agents" :key="i" class="clickable" @click="filterByQuery(row.user_agent)">
										<td class="mono ua">{{ row.user_agent }}</td>
										<td class="num">{{ row.count }}</td>
										<td class="num">{{ row.ips }}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div class="agg-card">
							<h3>Top codes d'erreur</h3>
							<table>
								<thead><tr><th>Code</th><th>HTTP</th><th>Hits</th></tr></thead>
								<tbody>
									<tr v-for="(row, i) in aggregates.top_errors" :key="i" class="clickable" @click="filterByErrorCode(row.error_code)">
										<td><span class="code-badge" :class="codeSeverity(row.error_code)">{{ row.error_code }}</span></td>
										<td class="num">{{ row.http_status }}</td>
										<td class="num">{{ row.count }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</template>
		</panel>

		<panel class="last">
			<template #content>
				<div class="filters">
					<input v-model="filters.ip" placeholder="IP" @keyup.enter="searchLogs" class="filter-input" />
					<input v-model="filters.error_code" placeholder="error_code" @keyup.enter="searchLogs" class="filter-input" />
					<input v-model="filters.module" placeholder="module" @keyup.enter="searchLogs" class="filter-input" />
					<input v-model="filters.function" placeholder="function" @keyup.enter="searchLogs" class="filter-input" />
					<input v-model="filters.farmer_id" placeholder="farmer_id" @keyup.enter="searchLogs" type="number" class="filter-input" />
					<input v-model="filters.http_status" placeholder="HTTP" @keyup.enter="searchLogs" type="number" class="filter-input small" />
					<input v-model="filters.query" placeholder="cherche dans URI / UA" @keyup.enter="searchLogs" class="filter-input grow" />
					<v-btn size="small" color="primary" @click="searchLogs" :loading="logsLoading">Filtrer</v-btn>
					<v-btn size="small" @click="resetFilters">Reset</v-btn>
				</div>

				<loader v-if="logsLoading && !logs" />
				<div v-else-if="logs && logs.length === 0" class="empty">Aucun événement.</div>
				<div v-else-if="logs" class="log-list">
					<div class="log-summary">{{ total.toLocaleString() }} résultat(s) — page {{ page }} / {{ totalPages }}</div>
					<div v-for="row in logs" :key="row.id" class="log-row" @click="toggleExpand(row.id)" :class="{ expanded: expanded[row.id] }">
						<div class="log-line">
							<span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span>
							<span class="code-badge" :class="codeSeverity(row.error_code)">{{ row.error_code }}</span>
							<span class="method">{{ row.method }}</span>
							<span class="uri" :title="row.uri">{{ row.uri }}</span>
							<span class="spacer"></span>
							<router-link v-if="row.farmer_id" :to="'/farmer/' + row.farmer_id" class="farmer-badge" @click.stop>
								{{ row.farmer_name || ('#' + row.farmer_id) }}
							</router-link>
							<span class="ip clickable" @click.stop="openIpDetail(row.ip)">{{ row.ip }}</span>
							<span v-if="row.user_agent" class="ua-short" :title="row.user_agent">{{ formatUA(row.user_agent) }}</span>
							<span class="date">{{ formatDate(row.date) }}</span>
						</div>
						<div v-if="expanded[row.id]" class="log-detail">
							<div v-if="row.user_agent"><b>UA :</b> <span class="mono">{{ row.user_agent }}</span></div>
							<div v-if="row.referer"><b>Referer :</b> <span class="mono">{{ row.referer }}</span></div>
							<div v-if="row.params"><b>Params :</b> <pre>{{ JSON.stringify(row.params, null, 2) }}</pre></div>
							<div v-if="row.extra"><b>Extra :</b> <pre>{{ JSON.stringify(row.extra, null, 2) }}</pre></div>
						</div>
					</div>

					<div class="pagination" v-if="totalPages > 1">
						<v-btn size="small" :disabled="page <= 1" @click="goToPage(page - 1)">Précédent</v-btn>
						<span>Page {{ page }} / {{ totalPages }}</span>
						<v-btn size="small" :disabled="page >= totalPages" @click="goToPage(page + 1)">Suivant</v-btn>
					</div>
				</div>
			</template>
		</panel>

		<v-dialog v-model="ipDialogOpen" max-width="900">
			<div class="ip-dialog">
				<div class="ip-dialog-header">
					<h2>{{ ipDialogIp }}</h2>
					<v-btn icon @click="ipDialogOpen = false"><v-icon>mdi-close</v-icon></v-btn>
				</div>
				<loader v-if="ipDialogLoading" />
				<div v-else-if="ipDialogData">
					<div class="ip-stats">
						<div><b>{{ ipDialogData.total }}</b> événements</div>
						<div v-if="ipDialogData.farmers && ipDialogData.farmers.length">
							<b>Joueurs liés :</b>
							<router-link v-for="f in ipDialogData.farmers" :key="f.id" :to="'/farmer/' + f.id" class="farmer-link">{{ f.name }}</router-link>
						</div>
					</div>
					<div class="ip-logs">
						<div v-for="row in ipDialogData.logs" :key="row.id" class="log-row compact">
							<span class="status" :class="httpClass(row.http_status)">{{ row.http_status }}</span>
							<span class="code-badge" :class="codeSeverity(row.error_code)">{{ row.error_code }}</span>
							<span class="method">{{ row.method }}</span>
							<span class="uri">{{ row.uri }}</span>
							<span class="date">{{ formatDate(row.date) }}</span>
						</div>
					</div>
				</div>
			</div>
		</v-dialog>
	</div>
</template>

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { computed, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	interface Filters {
		ip: string
		error_code: string
		module: string
		function: string
		farmer_id: string
		http_status: string
		query: string
	}

	function emptyFilters(): Filters {
		return { ip: '', error_code: '', module: '', function: '', farmer_id: '', http_status: '', query: '' }
	}

	const router = useRouter()

	const periodHours = ref(24)
	const aggregates = ref<any>(null)
	const aggLoading = ref(false)

	const filters = ref<Filters>(emptyFilters())
	const logs = ref<any[] | null>(null)
	const total = ref(0)
	const page = ref(1)
	const pageSize = ref(50)
	const logsLoading = ref(false)
	const expanded = ref<Record<number, boolean>>({})

	const ipDialogOpen = ref(false)
	const ipDialogIp = ref('')
	const ipDialogData = ref<any>(null)
	const ipDialogLoading = ref(false)

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle('Sécurité')
	loadAggregates()
	searchLogs()

	const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

	function loadAggregates() {
		aggLoading.value = true
		LeekWars.post('admin/security-log-aggregates', { period_hours: periodHours.value }).then((data: any) => {
			aggregates.value = data
			aggLoading.value = false
		}).catch(() => {
			aggLoading.value = false
		})
	}

	function searchLogs() {
		logsLoading.value = true
		const f: any = {}
		for (const key of Object.keys(filters.value) as (keyof Filters)[]) {
			const v = filters.value[key]
			if (v !== '' && v !== null && v !== undefined) {
				f[key] = (key === 'farmer_id' || key === 'http_status') ? parseInt(v, 10) : v
			}
		}
		LeekWars.post('admin/security-log', { filters: f, page: page.value, page_size: pageSize.value }).then((data: any) => {
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

	function filterByErrorCode(code: string) {
		filters.value = { ...emptyFilters(), error_code: code }
		page.value = 1
		searchLogs()
	}

	function filterByEndpoint(module: string, fn: string) {
		filters.value = { ...emptyFilters(), module, function: fn }
		page.value = 1
		searchLogs()
	}

	function filterByQuery(q: string) {
		filters.value = { ...emptyFilters(), query: q }
		page.value = 1
		searchLogs()
	}

	function toggleExpand(id: number) {
		expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
	}

	function openIpDetail(ip: string) {
		ipDialogIp.value = ip
		ipDialogOpen.value = true
		ipDialogLoading.value = true
		ipDialogData.value = null
		LeekWars.get('admin/security-log-ip/' + encodeURIComponent(ip)).then((data: any) => {
			ipDialogData.value = data
			ipDialogLoading.value = false
		}).catch(() => {
			ipDialogLoading.value = false
		})
	}

	function formatDate(ms: number): string {
		return LeekWars.formatDateTime(Math.floor(ms / 1000))
	}

	function formatUA(ua: string): string {
		return LeekWars.parseUserAgent(ua)
	}

	function httpClass(status: number): string {
		if (status >= 500) return 'http-5xx'
		if (status === 429) return 'http-429'
		if (status >= 400) return 'http-4xx'
		return 'http-ok'
	}

	function codeSeverity(code: string): string {
		if (!code) return 'sev-low'
		if (code.includes('admin') || code.includes('moderator')) return 'sev-high'
		if (code === 'rate_limit' || code === 'wrong_token_invalid') return 'sev-mid'
		if (code === 'no_such_service') return 'sev-mid'
		return 'sev-low'
	}
</script>

<style lang="scss" scoped>
	.aggregates {
		padding: 10px;
	}
	.period-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		.total {
			font-weight: bold;
			color: #555;
		}
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
		h3 {
			margin: 0 0 6px;
			font-size: 14px;
			color: #555;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-size: 12px;
		}
		th, td {
			padding: 3px 4px;
			text-align: left;
			border-bottom: 1px solid #f0f0f0;
		}
		th {
			color: #888;
			font-weight: normal;
		}
		.num { text-align: right; font-variant-numeric: tabular-nums; }
		.mono { font-family: monospace; }
		.ua { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.clickable { cursor: pointer; }
		.clickable:hover { background: #f5f9ff; }
	}

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
		flex: 0 0 auto;
		width: 130px;
		&.small { width: 70px; }
		&.grow { flex: 1 1 200px; min-width: 180px; }
	}

	.empty {
		padding: 30px;
		text-align: center;
		color: #888;
	}
	.log-list {
		padding: 8px 10px;
	}
	.log-summary {
		font-size: 12px;
		color: #888;
		margin-bottom: 6px;
	}
	.log-row {
		border-bottom: 1px solid #f0f0f0;
		padding: 6px 4px;
		cursor: pointer;
		font-size: 13px;
		&:hover { background: #fafafa; }
		&.expanded { background: #f5f9ff; }
		&.compact {
			cursor: default;
			&:hover { background: transparent; }
		}
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
		&.http-ok { background: #c8e6c9; color: #2e7d32; }
		&.http-4xx { background: #ffe0b2; color: #e65100; }
		&.http-429 { background: #ffcc80; color: #c2410c; }
		&.http-5xx { background: #ffcdd2; color: #b71c1c; }
	}
	.code-badge {
		font-family: monospace;
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 3px;
		&.sev-low { background: #eceff1; color: #455a64; }
		&.sev-mid { background: #fff3e0; color: #e65100; }
		&.sev-high { background: #ffcdd2; color: #b71c1c; font-weight: bold; }
	}
	.method {
		font-family: monospace;
		font-size: 11px;
		color: #666;
		min-width: 40px;
	}
	.uri {
		font-family: monospace;
		font-size: 12px;
		max-width: 380px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
	.ua-short {
		font-family: monospace;
		font-size: 11px;
		color: #888;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ip {
		font-family: monospace;
		font-size: 12px;
		color: #555;
		cursor: pointer;
		&:hover { text-decoration: underline; }
	}
	.date {
		font-size: 11px;
		color: #888;
		font-variant-numeric: tabular-nums;
	}
	.log-detail {
		padding: 8px 10px;
		background: white;
		border-left: 3px solid #2196f3;
		margin-top: 4px;
		font-size: 12px;
		div { margin-bottom: 4px; }
		pre {
			background: #f5f5f5;
			padding: 6px;
			border-radius: 3px;
			max-height: 300px;
			overflow: auto;
			margin: 4px 0;
			font-size: 11px;
		}
		.mono { font-family: monospace; word-break: break-all; }
	}
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		padding: 12px;
	}
	.ip-dialog {
		background: white;
		padding: 16px;
		border-radius: 6px;
	}
	.ip-dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		h2 { margin: 0; font-family: monospace; }
	}
	.ip-stats {
		margin-bottom: 12px;
		padding: 8px;
		background: #f5f5f5;
		border-radius: 4px;
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
	}
	.farmer-link {
		display: inline-block;
		margin: 0 4px;
		padding: 2px 6px;
		background: #e3f2fd;
		border-radius: 3px;
		text-decoration: none;
		font-weight: bold;
	}
	.ip-logs {
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
