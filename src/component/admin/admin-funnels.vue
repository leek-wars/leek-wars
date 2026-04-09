<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Funnels', link: '/admin/funnels'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<v-tabs v-model="selectedFunnel" @update:model-value="load">
				<v-tab v-for="f in funnelItems" :key="f.key" :value="f.key">{{ f.label }}</v-tab>
			</v-tabs>
			<div class="controls">
				<v-btn size="small" variant="text" @click="setPeriod('today')">Today</v-btn>
				<v-btn size="small" variant="text" @click="setPeriod('24h')">24h</v-btn>
				<v-btn size="small" variant="text" @click="setPeriod('week')">1 week</v-btn>
				<v-btn size="small" variant="text" @click="setPeriod('month')">1 month</v-btn>
				<input v-model="dateFrom" type="date">
				<input v-model="dateTo" type="date">
				<v-btn variant="tonal" @click="load">Charger</v-btn>
			</div>

			<loader v-if="loading" />

			<div v-else-if="funnelData" class="funnel">
				<div class="funnel-header">
					<span class="funnel-label">{{ funnelData.label }}</span>
				</div>
				<div class="flow-container" :style="{ height: flowHeight }">
					<VueFlow ref="flow" :nodes="flowNodes" :edges="flowEdges" :default-viewport="flowViewport" :min-zoom="0.3" :max-zoom="2" :auto-pan-on-node-drag="false" :zoom-on-scroll="false" :nodes-draggable="!mobile" :pan-on-drag="!mobile" @nodes-initialized="applyViewport">
						<template #node-funnel="{ data }">
							<Handle v-if="!data.isRoot" type="target" :position="data.tgtPos" />
							<div class="flow-node" :class="{ root: data.isRoot }" :style="{ borderColor: data.color }">
								<div class="node-bar" :style="{ width: data.percentNum + '%', background: data.color }"></div>
								<div class="node-top">
									<svg v-if="data.percentNum !== null" class="node-ring" width="40" height="40" viewBox="0 0 40 40">
										<circle cx="20" cy="20" r="16" fill="none" stroke="#eee" stroke-width="4" />
										<circle cx="20" cy="20" r="16" fill="none" :stroke="data.color" stroke-width="4"
											stroke-linecap="round" :stroke-dasharray="100.5" :stroke-dashoffset="100.5 - 100.5 * data.percentNum / 100"
											transform="rotate(-90 20 20)" />
										<text x="20" y="21" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="currentColor">{{ Math.round(data.percentNum) }}%</text>
									</svg>
									<div class="node-info">
										<div class="node-name">{{ data.label }}</div>
										<div class="node-stats">{{ data.sessions }} sessions<br>{{ data.count }} events</div>
										<div v-if="data.duration" class="node-duration"><v-icon size="12">mdi-clock-outline</v-icon> {{ data.duration }}</div>
									</div>
								</div>
							</div>
							<Handle v-if="data.hasChildren" type="source" :position="data.srcPos" />
						</template>
					</VueFlow>
				</div>
			</div>

			<div v-else class="empty">Aucune donnée</div>
		</panel>

		<!-- Evolution temporelle -->
		<panel v-if="chartData">
			<div class="chart-header">
				<h2 class="section-title">Evolution</h2>
				<v-tabs v-model="granularity" @update:model-value="onGranularityChange">
					<v-tab value="day">Jour</v-tab>
					<v-tab value="hour">Heure</v-tab>
				</v-tabs>
			</div>
			<Line :key="chartKey" :data="chartData" :options="chartOptions" class="evolution-chart" />
		</panel>

		<!-- Metadata breakdown -->
		<panel v-if="funnelData && Object.keys(metaBreakdown).length" class="last">
			<h2 class="section-title">Détail metadata</h2>
			<div v-for="name in funnelData.nodes" :key="'meta-' + name">
				<template v-if="metaBreakdown[name]">
					<h3 class="meta-step-title">{{ name }}</h3>
					<div class="meta-grid">
						<div v-for="(row, r) in parsedMeta(name)" :key="r" class="meta-row">
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
	import { VueFlow, Handle } from '@vue-flow/core'
	import dagre from 'dagre'
	import '@vue-flow/core/dist/style.css'
	import '@vue-flow/core/dist/theme-default.css'

	interface StepData { name: string, count: number, sessions: number }
	interface DailyRow { step: string, period: string, count: number, sessions: number }
	interface FunnelData { label: string, nodes: string[], edges: [string, string][], ranks: string[][], dataMap: Record<string, StepData>, durations: Record<string, number> }

	const STEP_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#795548', '#e91e63', '#009688', '#ff5722']

	@Options({ components: { Breadcrumb, Line, VueFlow, Handle } })
	export default class AdminFunnels extends Vue {
		mobile = window.innerWidth < 600
		flowHeight = '300px'
		funnelItems: { key: string, label: string }[] = []
		selectedFunnel = ''
		dateFrom = ''
		dateTo = ''
		loading = false
		funnelData: FunnelData | null = null
		flowNodes: any[] = []
		flowEdges: any[] = []
		flowViewport = { x: 5, y: 5, zoom: 1 }
		graphWidth = 0
		graphHeight = 0
		dailyData: DailyRow[] = []
		metaBreakdown: Record<string, { metadata: string, count: number }[]> = {}
		granularity = localStorage.getItem('funnel_granularity') || 'day'
		chartKey = 0
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

		setPeriod(period: string) {
			const pad = (n: number) => String(n).padStart(2, '0')
			const now = new Date()
			this.dateTo = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
			let from: Date
			if (period === 'today') {
				from = new Date(now)
			} else if (period === '24h') {
				from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			} else if (period === 'week') {
				from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
			} else {
				from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
			}
			this.dateFrom = from.getFullYear() + '-' + pad(from.getMonth() + 1) + '-' + pad(from.getDate())
			this.load()
		}

		onGranularityChange() {
			localStorage.setItem('funnel_granularity', this.granularity)
			this.load()
		}

		formatDuration(seconds: number): string {
			if (seconds < 60) return seconds + 's'
			if (seconds < 3600) return Math.round(seconds / 60) + 'min'
			if (seconds < 86400) return Math.round(seconds / 3600) + 'h'
			return Math.round(seconds / 86400) + 'j'
		}

		applyViewport() {
			const flow = this.$refs.flow as any
			if (!flow?.$el || !flow.fitView) return
			flow.fitView({ padding: 0.01, maxZoom: 1 })
		}

		buildFlow() {
			if (!this.funnelData) return

			const { nodes, edges, dataMap } = this.funnelData

			// Find parents and children for each node
			const parents: Record<string, string> = {}
			const hasChildren = new Set<string>()
			for (const [from, to] of edges) {
				if (!parents[to]) parents[to] = from
				hasChildren.add(from)
			}

			// Layout with dagre
			const mobile = window.innerWidth < 600
			const g = new dagre.graphlib.Graph()
			g.setGraph({ rankdir: mobile ? 'TB' : 'LR', ranksep: mobile ? 60 : 30, nodesep: mobile ? 60 : 30, edgesep: 5 })
			g.setDefaultEdgeLabel(() => ({}))

			const nodeW = mobile ? 160 : 220
			const nodeH = mobile ? 60 : 70
			for (const name of nodes) {
				g.setNode(name, { width: nodeW, height: nodeH })
			}

			// Build rank groups lookup
			const rankOf: Record<string, string> = {}
			for (const group of this.funnelData.ranks) {
				for (const name of group) rankOf[name] = group[0]
			}

			// For dagre layout: replace edges involving ranked nodes so they get same rank
			// Ranked nodes should have the same edges as their group leader
			for (const [from, to] of edges) {
				const layoutFrom = rankOf[from] || from
				const layoutTo = rankOf[to] || to
				if (layoutFrom !== layoutTo) {
					g.setEdge(layoutFrom, layoutTo)
				}
			}

			dagre.layout(g)

			// Position ranked nodes relative to their group leader
			const movedNodes = new Set<string>()
			for (const group of this.funnelData.ranks) {
				const ref = g.node(group[0])
				for (let i = 1; i < group.length; i++) {
					const node = g.node(group[i])
					if (mobile) {
						node.x = ref.x + (nodeW + 10) * i
						node.y = ref.y
					} else {
						node.x = ref.x
						node.y = ref.y + (nodeH + 10) * i
					}
					movedNodes.add(group[i])
				}
			}

			// Propagate Y alignment: children of moved nodes with a single parent get aligned
			const crossAxis = mobile ? 'x' : 'y'
			const childrenOf: Record<string, string[]> = {}
			const parentCount: Record<string, number> = {}
			for (const [from, to] of edges) {
				if (!childrenOf[from]) childrenOf[from] = []
				childrenOf[from].push(to)
				parentCount[to] = (parentCount[to] || 0) + 1
			}
			const propagate = (name: string) => {
				for (const child of (childrenOf[name] || [])) {
					if (parentCount[child] === 1) {
						g.node(child)[crossAxis] = g.node(name)[crossAxis]
						propagate(child)
					}
				}
			}
			for (const name of movedNodes) {
				propagate(name)
			}

			// Uniformize rank spacing
			const axis = mobile ? 'y' : 'x'
			const spacing = mobile ? (nodeH + 60) : (nodeW + 50)

			// Read final positions and group into ranks (nodes within nodeW/3 of each other = same rank)
			const threshold = nodeW / 3
			const sortedNodes = [...nodes].sort((a, b) => g.node(a)[axis] - g.node(b)[axis])
			const ranks: string[][] = []
			for (const name of sortedNodes) {
				const pos = g.node(name)[axis]
				if (ranks.length && Math.abs(pos - g.node(ranks[ranks.length - 1][0])[axis]) < threshold) {
					ranks[ranks.length - 1].push(name)
				} else {
					ranks.push([name])
				}
			}

			// Redistribute each rank evenly
			for (let i = 0; i < ranks.length; i++) {
				const newPos = i * spacing + spacing / 2
				for (const name of ranks[i]) {
					g.node(name)[axis] = newPos
				}
			}

			// Normalize positions to start at 0 and compute container size
			let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0
			for (const name of nodes) {
				const n = g.node(name)
				minX = Math.min(minX, n.x - nodeW / 2)
				minY = Math.min(minY, n.y - nodeH / 2)
			}
			for (const name of nodes) {
				const n = g.node(name)
				n.x -= minX
				n.y -= minY
				maxX = Math.max(maxX, n.x + nodeW / 2)
				maxY = Math.max(maxY, n.y + nodeH / 2)
			}
			this.graphWidth = maxX
			this.graphHeight = maxY
			const estimatedContainerW = window.innerWidth - 40
			const zoom = Math.min(1, estimatedContainerW / maxX)
			this.flowHeight = Math.ceil((maxY + 20) * zoom) + 'px'

			const srcPos = mobile ? 'bottom' : 'right'
			const tgtPos = mobile ? 'top' : 'left'

			// Build Vue Flow nodes
			this.flowNodes = nodes.map((name, i) => {
				const pos = g.node(name)
				const data = dataMap[name]
				const sessions = data?.sessions || 0
				const parentName = parents[name]
				const parentSessions = parentName ? (dataMap[parentName]?.sessions || 0) : 0
				const isRoot = !parentName
				let percentNum: number
				if (isRoot) {
					percentNum = 100
				} else if (parentSessions > 0) {
					percentNum = (sessions / parentSessions) * 100
				} else {
					percentNum = 0
				}
				return {
					id: name,
					type: 'funnel',
					position: { x: pos.x - nodeW / 2, y: pos.y - nodeH / 2 },
					sourcePosition: srcPos,
					targetPosition: tgtPos,
					data: {
						label: name, sessions, count: data?.count || 0, percentNum, isRoot,
						hasChildren: hasChildren.has(name), color: STEP_COLORS[i % STEP_COLORS.length],
						srcPos, tgtPos,
						duration: this.funnelData!.durations[name] ? this.formatDuration(this.funnelData!.durations[name]) : null
					},
				}
			})

			// Count parents per node for edge labels
			const parentCountMap: Record<string, number> = {}
			for (const [, to] of edges) {
				parentCountMap[to] = (parentCountMap[to] || 0) + 1
			}

			// Build Vue Flow edges
			this.flowEdges = edges.map(([from, to]) => {
				const fromSessions = dataMap[from]?.sessions || 0
				const toSessions = dataMap[to]?.sessions || 0
				const hasMultipleParents = (parentCountMap[to] || 0) > 1
				const label = hasMultipleParents && fromSessions > 0
					? ((toSessions / fromSessions) * 100).toFixed(0) + '%'
					: undefined
				return {
					id: from + '-' + to,
					source: from,
					target: to,
					label,
					animated: true,
					style: { stroke: '#999' },
					labelStyle: { fontSize: '11px', fontWeight: '600', fill: '#1976d2' },
					labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
					labelBgPadding: [4, 2] as [number, number],
				}
			})
		}

		buildChart() {
			if (!this.funnelData || !this.dailyData.length) {
				this.chartData = null
				return
			}
			this.chartOptions = { ...this.chartOptions, aspectRatio: window.innerWidth < 600 ? 1.2 : 2.5 }
			this.chartKey++

			// Generate all periods between dateFrom and dateTo (fill gaps)
			const periods: string[] = []
			const start = new Date(this.dateFrom)
			const end = new Date(this.dateTo)
			if (this.granularity === 'hour') {
				for (const d = new Date(start); d <= end; d.setHours(d.getHours() + 1)) {
					const pad = (n: number) => String(n).padStart(2, '0')
					periods.push(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':00')
				}
			} else {
				for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
					const pad = (n: number) => String(n).padStart(2, '0')
					periods.push(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()))
				}
			}
			const lookup: Record<string, Record<string, number>> = {}
			for (const row of this.dailyData) {
				if (!lookup[row.step]) lookup[row.step] = {}
				lookup[row.step][row.period] = Number(row.sessions)
			}
			this.chartData = {
				labels: periods.map(d => this.granularity === 'hour' ? d.slice(5) : d.slice(5, 10)),
				datasets: this.funnelData.nodes.map((name, i) => ({
					label: name,
					data: periods.map(d => lookup[name]?.[d] || 0),
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

		resizeHandler: (() => void) | null = null

		created() {
			LeekWars.setTitle("Funnels")
			const now = new Date()
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
			const pad = (n: number) => String(n).padStart(2, '0')
			this.dateTo = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
			this.dateFrom = yesterday.getFullYear() + '-' + pad(yesterday.getMonth() + 1) + '-' + pad(yesterday.getDate())

			let timeout: any
			this.resizeHandler = () => {
				clearTimeout(timeout)
				timeout = setTimeout(() => {
					if (this.funnelData) this.buildChart()
				}, 300)
			}
			window.addEventListener('resize', this.resizeHandler)

			if (this.$store.state.farmer) {
				this.init()
			} else {
				const unwatch = this.$store.watch((s: any) => s.farmer, (farmer: any) => {
					if (farmer) { unwatch(); this.init() }
				})
			}
		}

		beforeUnmount() {
			if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler)
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
					nodes: data.nodes,
					edges: data.edges,
					ranks: data.ranks || [],
					durations: data.durations || {},
					dataMap
				}
				this.buildFlow()
				this.dailyData = data.daily || []
				this.metaBreakdown = data.meta_breakdown || {}
				this.buildChart()
				this.loading = false
			}).error(() => {
				this.funnelData = null
				this.flowNodes = []
				this.flowEdges = []
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
		padding: 5px 0;
	}
	.funnel-header {
		margin-bottom: 10px;
		.funnel-label {
			font-size: 18px;
			font-weight: 600;
		}
	}
	.flow-container {
		border: 1px solid #eee;
		border-radius: 8px;
		overflow: hidden;
	}
	body.dark .flow-container {
		border-color: #444;
	}
	.flow-node {
		background: white;
		border: 2px solid #4caf50;
		border-radius: 8px;
		padding: 8px 12px;
		width: 220px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
		.node-bar {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			opacity: 0.4;
			border-radius: 6px 0 0 6px;
		}
		&.root {
			border-color: #1976d2;
			background: #e3f2fd;
		}
		.node-top {
			display: flex;
			align-items: center;
			gap: 10px;
			position: relative;
		}
		.node-ring {
			flex-shrink: 0;
		}
		.node-info {
			text-align: left;
		}
		.node-name {
			font-weight: 600;
			font-size: 13px;
			margin-bottom: 2px;
		}
		.node-stats {
			font-size: 13px;
			color: #666;
			white-space: nowrap;
		}
		.node-duration {
			font-size: 13px;
			color: #666;
			display: flex;
			align-items: center;
			gap: 2px;
			margin-top: 2px;
		}
	}
	body.dark .flow-node {
		background: #2a2a2a;
		color: #eee;
		&.root {
			background: #1a3a5c;
		}
		.node-stats { color: #aaa; }
		.node-ring circle:first-child { stroke: #444; }
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
	@media (max-width: 599px) {
		.evolution-chart {
			min-height: 300px;
		}
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
