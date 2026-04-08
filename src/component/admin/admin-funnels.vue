<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Funnels', link: '/admin/funnels'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<div class="controls">
				<v-select v-model="selectedFunnel" :items="funnelItems" item-title="label" item-value="key" hide-details density="compact" variant="solo" @update:model-value="load" />
				<input v-model="dateFrom" type="date">
				<input v-model="dateTo" type="date">
				<v-btn variant="tonal" @click="load">Charger</v-btn>
			</div>

			<loader v-if="loading" />

			<div v-else-if="funnelData" class="funnel">
				<div class="funnel-header">
					<span class="funnel-label">{{ funnelData.label }}</span>
					<span class="funnel-total">{{ rootSessions }} sessions</span>
				</div>
				<template v-for="node in flatNodes" :key="node.name">
					<div class="funnel-node" :style="{ 'margin-left': node.depth * 24 + 'px' }">
						<div class="step-info">
							<span class="step-name">
								<span class="tree-prefix">{{ node.depth > 0 ? (node.lastChild ? '└' : '├') : '' }}</span>
								{{ node.name }}
							</span>
							<span class="step-count">{{ node.count }} events · {{ node.sessions }} sessions</span>
						</div>
						<div class="bar-row">
							<div class="bar-container">
								<div class="bar" :style="{ width: nodeBarWidth(node) }">
									<span class="bar-label">{{ nodePercent(node) }}</span>
								</div>
							</div>
							<span class="percent-label">{{ nodePercent(node) }}</span>
						</div>
					</div>
				</template>
			</div>

			<div v-else class="empty">Aucune donnée</div>
		</panel>

		<!-- Evolution temporelle -->
		<panel v-if="chartData">
			<div class="chart-header">
				<h2 class="section-title">Evolution</h2>
				<v-btn-toggle v-model="granularity" mandatory density="compact" @update:model-value="load">
					<v-btn value="day" size="small">Jour</v-btn>
					<v-btn value="hour" size="small">Heure</v-btn>
				</v-btn-toggle>
			</div>
			<Line :data="chartData" :options="chartOptions" class="evolution-chart" />
		</panel>

		<!-- Metadata breakdown -->
		<panel v-if="funnelData && Object.keys(metaBreakdown).length" class="last">
			<h2 class="section-title">Détail metadata</h2>
			<div v-for="node in flatNodes" :key="'meta-' + node.name">
				<template v-if="metaBreakdown[node.name]">
					<h3 class="meta-step-title">{{ node.name }}</h3>
					<div class="meta-grid">
						<div v-for="(row, r) in parsedMeta(node.name)" :key="r" class="meta-row">
							<span class="meta-keys">
								<span v-for="(val, key) in row.data" :key="key" class="meta-tag">{{ key }}: {{ val }}</span>
							</span>
							<span class="meta-count">{{ row.count }}</span>
						</div>
					</div>
				</template>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { Line } from 'vue-chartjs'
	import { ChartData, ChartOptions } from 'chart.js'

	interface StepData { name: string, count: number, sessions: number }
	interface DailyRow { step: string, period: string, count: number, sessions: number }
	interface TreeDef { [key: string]: TreeDef }
	interface FlatNode { name: string, depth: number, parentName: string | null, parentSessions: number, count: number, sessions: number, lastChild: boolean }
	interface FunnelData { label: string, tree: TreeDef, dataMap: Record<string, StepData> }

	const STEP_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#795548', '#e91e63', '#009688', '#ff5722']

	@Options({ components: { Breadcrumb, Line } })
	export default class AdminFunnels extends Vue {
		funnelItems: { key: string, label: string }[] = []
		selectedFunnel = ''
		dateFrom = ''
		dateTo = ''
		loading = false
		funnelData: FunnelData | null = null
		flatNodes: FlatNode[] = []
		dailyData: DailyRow[] = []
		metaBreakdown: Record<string, { metadata: string, count: number }[]> = {}
		granularity = 'day'
		chartData: ChartData<'line'> | null = null
		chartOptions: ChartOptions<'line'> = {
			responsive: true,
			aspectRatio: 2.5,
			plugins: {
				legend: { position: 'bottom' },
				tooltip: {
					callbacks: {
						label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y + ' sessions'
					}
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: { color: 'rgba(128,128,128,0.15)' },
				},
				x: {
					ticks: { maxRotation: 45 },
					grid: { color: 'rgba(128,128,128,0.15)' },
				}
			}
		}

		get rootSessions(): number {
			return this.flatNodes.length ? this.flatNodes[0].sessions : 0
		}

		flattenTree(tree: TreeDef, depth: number, parentName: string | null, parentSessions: number): FlatNode[] {
			const entries = Object.entries(tree)
			const result: FlatNode[] = []
			entries.forEach(([name, children], i) => {
				const data = this.funnelData?.dataMap[name]
				const sessions = data?.sessions || 0
				const count = data?.count || 0
				result.push({ name, depth, parentName, parentSessions, count, sessions, lastChild: i === entries.length - 1 })
				result.push(...this.flattenTree(children, depth + 1, name, sessions))
			})
			return result
		}

		nodeBarWidth(node: FlatNode): string {
			const ref = node.parentSessions || this.rootSessions
			if (!ref) return '0%'
			return Math.max(2, (node.sessions / ref) * 100) + '%'
		}

		nodePercent(node: FlatNode): string {
			const ref = node.parentSessions || node.sessions
			if (!ref) return '0%'
			return ((node.sessions / ref) * 100).toFixed(1) + '%'
		}

		stepColor(name: string): string {
			const i = this.flatNodes.findIndex(n => n.name === name)
			return STEP_COLORS[(i >= 0 ? i : 0) % STEP_COLORS.length]
		}

		buildChart() {
			if (!this.funnelData || !this.dailyData.length) {
				this.chartData = null
				return
			}
			const periods = [...new Set(this.dailyData.map(r => r.period))].sort()
			const lookup: Record<string, Record<string, number>> = {}
			for (const row of this.dailyData) {
				if (!lookup[row.step]) lookup[row.step] = {}
				lookup[row.step][row.period] = Number(row.sessions)
			}
			this.chartData = {
				labels: periods.map(d => this.granularity === 'hour' ? d.slice(5) : d.slice(5, 10)),
				datasets: this.flatNodes.map((node, i) => ({
					label: node.name,
					data: periods.map(d => lookup[node.name]?.[d] || 0),
					borderColor: STEP_COLORS[i % STEP_COLORS.length],
					backgroundColor: STEP_COLORS[i % STEP_COLORS.length] + '20',
					tension: 0.3,
					borderWidth: 2,
					pointRadius: 2,
					pointHitRadius: 8,
					fill: false,
				}))
			}
		}

		parsedMeta(step: string): { data: Record<string, string>, count: number }[] {
			const rows = this.metaBreakdown[step]
			if (!rows) return []
			return rows.map(r => ({
				data: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
				count: r.count
			}))
		}

		created() {
			LeekWars.setTitle("Funnels")
			const now = new Date()
			const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
			this.dateTo = now.toISOString().slice(0, 10)
			this.dateFrom = thirtyDaysAgo.toISOString().slice(0, 10)

			if (this.$store.state.farmer) {
				this.init()
			} else {
				const unwatch = this.$store.watch((s: any) => s.farmer, (farmer: any) => {
					if (farmer) { unwatch(); this.init() }
				})
			}
		}

		init() {
			if (!this.$store.getters.admin) { this.$router.replace('/'); return }
			LeekWars.get('funnel/get-funnels').then(data => {
				this.funnelItems = data.funnels
				if (this.funnelItems.length) {
					const fromUrl = this.$route.params.funnel as string
					this.selectedFunnel = (fromUrl && this.funnelItems.find(f => f.key === fromUrl)) ? fromUrl : this.funnelItems[0].key
					this.load()
				}
			})
		}

		load() {
			if (!this.selectedFunnel) return
			if (this.$route.params.funnel !== this.selectedFunnel) {
				this.$router.replace('/admin/funnels/' + this.selectedFunnel)
			}
			this.loading = true
			const from = Math.floor(new Date(this.dateFrom).getTime() / 1000)
			const to = Math.floor(new Date(this.dateTo + 'T23:59:59').getTime() / 1000)
			LeekWars.get('funnel/get-data/' + this.selectedFunnel + '/' + from + '/' + to + '/' + this.granularity).then(data => {
				const dataMap: Record<string, StepData> = {}
				for (const row of data.data) {
					dataMap[row.step] = { name: row.step, count: parseInt(row.count), sessions: parseInt(row.sessions) }
				}
				this.funnelData = {
					label: data.label,
					tree: data.tree,
					dataMap
				}
				this.flatNodes = this.flattenTree(data.tree, 0, null, 0)
				this.dailyData = data.daily || []
				this.metaBreakdown = data.meta_breakdown || {}
				this.buildChart()
				this.loading = false
			}).error(() => {
				this.funnelData = null
				this.flatNodes = []
				this.dailyData = []
				this.metaBreakdown = {}
				this.chartData = null
				this.loading = false
			})
		}
	}
</script>

<style lang="scss" scoped>
	.controls {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px 0;
		flex-wrap: wrap;
		input[type="date"] {
			padding: 8px 12px;
			border: 1px solid #ccc;
			border-radius: 4px;
			font-size: 14px;
		}
		.v-select {
			max-width: 200px;
		}
	}
	.section-title {
		font-size: 16px;
		font-weight: 600;
		padding: 10px 0;
	}
	.funnel {
		padding: 15px 0;
	}
	.funnel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		.funnel-label {
			font-size: 18px;
			font-weight: 600;
		}
		.funnel-total {
			color: #888;
		}
	}
	.funnel-node {
		margin: 6px 0;
		.step-info {
			display: flex;
			justify-content: space-between;
			margin-bottom: 4px;
		}
		.step-name {
			font-weight: 500;
			font-size: 14px;
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.tree-prefix {
			color: #999;
			font-family: monospace;
			width: 12px;
			display: inline-block;
		}
		.step-count {
			color: #888;
			font-size: 13px;
		}
	}
	.bar-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.bar-container {
		background: #f0f0f0;
		border-radius: 4px;
		height: 28px;
		overflow: hidden;
		flex: 1;
	}
	body.dark .bar-container {
		background: #333;
	}
	.bar {
		height: 100%;
		background: #4caf50;
		border-radius: 4px;
		display: flex;
		align-items: center;
		padding: 0 10px;
		min-width: 40px;
		transition: width 0.3s;
	}
	.bar-label {
		color: white;
		font-weight: 600;
		font-size: 12px;
		white-space: nowrap;
	}
	.percent-label {
		font-size: 13px;
		font-weight: 600;
		color: #1976d2;
		min-width: 50px;
		text-align: right;
	}
	.empty {
		padding: 40px;
		text-align: center;
		color: #888;
	}

	// Line chart
	.chart-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.evolution-chart {
		padding: 10px 0;
	}

	// Metadata breakdown
	.meta-step-title {
		font-weight: 500;
	}
	.meta-grid {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 10px;
	}
	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 8px;
		background: #f5f5f5;
		border-radius: 3px;
		font-size: 13px;
	}
	body.dark .meta-row {
		background: #2a2a2a;
	}
	.meta-keys {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.meta-tag {
		background: #e0e0e0;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 12px;
		font-family: monospace;
	}
	body.dark .meta-tag {
		background: #3a3a3a;
	}
	.meta-count {
		font-weight: 600;
		color: #1976d2;
		margin-left: 10px;
		white-space: nowrap;
	}
</style>
