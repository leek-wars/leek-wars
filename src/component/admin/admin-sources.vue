<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Sources', link: '/admin/sources'}]" :raw="true" /></h1>

			<div v-if="!LeekWars.mobile" class="tabs">
				<div class="tab" @click="refresh">
					<v-icon>mdi-refresh</v-icon>
					Rafraîchir
				</div>
			</div>
		</div>

		<panel class="first">
			<template #content>
				<div class="content">
					<div class="title">
						<h3>Statistiques</h3>
						<div class="period-controls">
							<v-btn size="small" variant="text" :class="{active: days === 7}" @click="setDays(7)">7j</v-btn>
							<v-btn size="small" variant="text" :class="{active: days === 30}" @click="setDays(30)">30j</v-btn>
							<v-btn size="small" variant="text" :class="{active: days === 90}" @click="setDays(90)">90j</v-btn>
							<v-btn size="small" variant="text" :class="{active: days === 365}" @click="setDays(365)">1 an</v-btn>
						</div>
						<loader v-if="stats_loading" :size="32" />
					</div>

					<div v-if="retention" class="retention">
						<div class="retention-card">
							<div class="retention-label">Rétention J+1</div>
							<div class="retention-value">{{ formatPercent(retention.d1) }}</div>
						</div>
						<div class="retention-card">
							<div class="retention-label">Rétention J+7</div>
							<div class="retention-value">{{ formatPercent(retention.d7) }}</div>
						</div>
						<div class="retention-card">
							<div class="retention-label">Rétention J+30</div>
							<div class="retention-value">{{ formatPercent(retention.d30) }}</div>
						</div>
					</div>

					<div v-if="registrationsChart" class="chart-wrapper">
						<h4>Inscriptions par jour</h4>
						<Bar :key="'reg-' + chartKey" :data="registrationsChart" :options="barChartOptions" class="stats-chart" />
					</div>

					<div v-if="tutoChart" class="chart-wrapper">
						<h4>Progression didactitiel</h4>
						<Line :key="'tuto-' + chartKey" :data="tutoChart" :options="lineChartOptions" class="stats-chart" />
					</div>

					<div v-if="trophiesChart" class="chart-wrapper">
						<h4>Trophées moyens par cohorte d'inscription</h4>
						<Line :key="'tro-' + chartKey" :data="trophiesChart" :options="lineChartOptions" class="stats-chart" />
					</div>

					<div v-if="countries.length" class="chart-wrapper">
						<h4>Top pays</h4>
						<div class="countries">
							<div v-for="c of countries.slice(0, 20)" :key="c.country" class="country card">
								<flag :code="c.country" :clickable="false" />
								<span class="code">{{ c.country.toUpperCase() }}</span>
								<span class="count">{{ $filters.number(c.count) }}</span>
							</div>
						</div>
					</div>
					<div v-else-if="!stats_loading && !country_available" class="country-warning">
						Données pays indisponibles.
					</div>
				</div>
			</template>
		</panel>

		<panel>
			<template #content>
				<div class="content">
					<div class="title">
						<h3>Derniers éleveurs</h3>
						<loader v-if="loading" :size="40" />
					</div>

					<div class="last-farmers">
						<div v-for="(day, d) of last_farmers_by_day" :key="d" class="farmers">
							<b class="date">{{ d }} ({{ day.length }})</b>
							<div v-for="farmer of day" :key="farmer.id" class="card farmer">
								<div class="date">
									<img v-if="farmer.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
									{{ $filters.time(farmer.register_time) }}
								</div>
								<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }" :bottom="true">
									<router-link :to="'/farmer/' + farmer.id" class="name" v-bind="props" v-ripple>
										<avatar :farmer="farmer" />
										<flag :code="LeekWars.languages[farmer.language].country" :clickable="false" />
										<div>{{ farmer.name }}</div>
									</router-link>
								</rich-tooltip-farmer>

								<div class="register-type" :title="regLabel(farmer.reg_type)">
									<v-icon v-if="farmer.reg_type === 'github'">mdi-github</v-icon>
									<v-icon v-else-if="farmer.reg_type === 'classic'">mdi-email-outline</v-icon>
									<v-icon v-else>mdi-flash-outline</v-icon>
									<v-icon v-if="farmer.verified" class="verified" title="Vérifié">mdi-check-decagram</v-icon>
									<v-icon v-else class="unverified" title="Non vérifié">mdi-help-circle-outline</v-icon>
								</div>

								<div class="tuto" :title="tutoTitle(farmer)">
									<v-icon v-if="farmer.didactitiel_seen" class="done">mdi-school</v-icon>
									<v-icon v-else class="pending">mdi-school-outline</v-icon>
									<span v-if="farmer.tutorial_progress > 0">{{ farmer.tutorial_progress }}</span>
								</div>

								<div class="last-connection" :title="'Dernière connexion: ' + $filters.date(farmer.last_time)">
									<v-icon>mdi-clock-outline</v-icon>
									{{ $filters.duration(farmer.last_time) }}
								</div>

								<div class="playtime" :title="farmer.playtime > 60 ? 'Temps total: ' + LeekWars.formatLongDuration(farmer.playtime) : ''">
									<template v-if="farmer.playtime > 60">
										<v-icon>mdi-timer-sand</v-icon>
										{{ shortDuration(farmer.playtime) }}
									</template>
								</div>

								<div class="team-cell">
									<router-link v-if="farmer.team_id" :to="'/team/' + farmer.team_id" class="team" :title="'Équipe: ' + farmer.team_name">
										<v-icon>mdi-shield-outline</v-icon>
										<span>{{ farmer.team_name }}</span>
									</router-link>
								</div>

								<div class="ai-count" :title="farmer.ai_count + ' IA'">
									<v-icon>mdi-file-document-outline</v-icon>
									{{ farmer.ai_count }}
								</div>

								<div class="ip" :title="farmer.country ? farmer.country.toUpperCase() + ' — ' + farmer.register_ip : farmer.register_ip">
									<flag v-if="farmer.country" :code="farmer.country" :clickable="false" />
									{{ farmer.register_ip }}
								</div>
								<div class="stats" :class="{empty: farmer.fights + farmer.test_fights + farmer.trophies === 0}">
									<v-icon>mdi-sword-cross</v-icon> {{ farmer.fights }}
									<v-icon>mdi-cog-outline</v-icon> {{ farmer.test_fights }}
									<v-icon>mdi-trophy-outline</v-icon> {{ farmer.trophies }}
								</div>
								<component :is="LeekWars.safeUrl(farmer.referer) ? 'a' : 'span'" class="source" :href="LeekWars.safeUrl(farmer.referer)" target="_blank" :title="farmer.referer">
									{{ format(farmer.referer || '∅') }}
								</component>
							</div>
						</div>
					</div>

					<br>

					<div class="title">
						<h3>Sources</h3>
						<loader v-if="loading" :size="40" />
					</div>

					<div class="sources">
						<div v-for="source of sources" :key="source.name" class="source card">
							<component v-if="source.name" :is="LeekWars.safeUrl(source.name) ? 'a' : 'span'" class="name" :href="LeekWars.safeUrl(source.name)" target="_blank">{{ format(source.name) }}</component>
							<div v-else class="name">∅</div>
							<div class="stats">
								<div class="count">{{ $filters.number(source.count) }}</div>
								<div class="other" :class="{empty: source.fights + source.test_fights + source.trophies === 0}">
									<v-icon>mdi-sword-cross</v-icon> {{ source.fights }}
									<v-icon>mdi-cog-outline</v-icon> {{ source.test_fights }}
									<v-icon>mdi-trophy-outline</v-icon> {{ source.trophies }}
									<v-icon>mdi-flash-outline</v-icon> {{ (source.trophies / source.count).toFixed(1) }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { Line, Bar } from 'vue-chartjs'
	import { ChartData, ChartOptions } from 'chart.js'

	const STORAGE_KEY_DAYS = 'admin_sources_days'
	const REG_TYPES: Record<string, { label: string, title: string, color: string }> = {
		classic: { label: 'Classique', title: 'Inscription classique', color: '#2196f3' },
		github:  { label: 'GitHub',    title: 'Inscription GitHub',    color: '#424242' },
		fast:    { label: 'Rapide',    title: 'Inscription rapide',    color: '#ff9800' },
	}
	const GRID = { color: 'rgba(128,128,128,0.15)' }
	const makeChartOptions = (stacked: boolean): ChartOptions<any> => ({
		responsive: true,
		aspectRatio: 3,
		plugins: { legend: { position: 'bottom' } },
		scales: {
			y: { beginAtZero: true, stacked, grid: GRID },
			x: { stacked, ticks: { maxRotation: 45 }, grid: GRID },
		}
	})

	@Options({ components: { RichTooltipFarmer, Breadcrumb, Line, Bar } })
	export default class AdminSources extends Vue {
		data: any = null
		sources: any = null
		last: any = null
		loading: boolean = false
		timer: any = null
		last_farmers_by_day: any = {}

		days: number = parseInt(localStorage.getItem(STORAGE_KEY_DAYS) || '30')
		stats_loading: boolean = false
		countries: any[] = []
		country_available: boolean = true
		retention: any = null
		chartKey: number = 0
		registrationsChart: ChartData<'bar'> | null = null
		tutoChart: ChartData<'line'> | null = null
		trophiesChart: ChartData<'line'> | null = null

		barChartOptions = makeChartOptions(true) as ChartOptions<'bar'>
		lineChartOptions = makeChartOptions(false) as ChartOptions<'line'>

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle("Admin Sources")
			this.refresh()
			this.loadStats()
			this.timer = setInterval(this.refresh, 5_000)
		}

		mounted() {
			LeekWars.large = true
		}

		beforeUnmount() {
			LeekWars.large = false
			if (this.timer) {
				clearInterval(this.timer)
			}
		}

		setDays(d: number) {
			this.days = d
			localStorage.setItem(STORAGE_KEY_DAYS, String(d))
			this.loadStats()
		}

		refresh() {
			this.loading = true
			LeekWars.get('source/all').then(data => {
				this.loading = false
				this.data = data
				this.sources = data.all
				this.last = data.last

				this.last_farmers_by_day = {}
				for (const farmer of this.last) {
					farmer.reg_type = farmer.github ? 'github' : (farmer.pass ? 'classic' : 'fast')
					const day = LeekWars.formatDate(farmer.register_time)
					if (!this.last_farmers_by_day[day]) this.last_farmers_by_day[day] = []
					this.last_farmers_by_day[day].push(farmer)
				}
			})
		}

		loadStats() {
			this.stats_loading = true
			LeekWars.get('source/stats/' + this.days).then(data => {
				this.stats_loading = false
				this.retention = data.retention || null
				this.countries = data.countries || []
				this.country_available = data.country_available !== false
				this.buildCharts(data.registrations || [], data.trophies || [])
			})
		}

		buildCharts(registrations: any[], trophies: any[]) {
			const labels = registrations.map(r => r.day)

			this.registrationsChart = {
				labels,
				datasets: [
					{ label: REG_TYPES.classic.label, data: registrations.map(r => +r.classic), backgroundColor: REG_TYPES.classic.color, stack: 'reg' },
					{ label: REG_TYPES.github.label, data: registrations.map(r => +r.github), backgroundColor: REG_TYPES.github.color, stack: 'reg' },
					{ label: REG_TYPES.fast.label, data: registrations.map(r => +r.fast), backgroundColor: REG_TYPES.fast.color, stack: 'reg' },
				]
			}

			this.tutoChart = {
				labels,
				datasets: [
					{ label: 'Didactitiel terminé', data: registrations.map(r => +r.tuto_done), borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.2)', fill: false, tension: 0.2 },
					{ label: 'Étape moyenne', data: registrations.map(r => +r.avg_tuto_step), borderColor: '#9c27b0', backgroundColor: 'rgba(156,39,176,0.2)', fill: false, tension: 0.2 },
					{ label: 'Vérifiés', data: registrations.map(r => +r.verified), borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.2)', fill: false, tension: 0.2 },
				]
			}

			this.trophiesChart = {
				labels: trophies.map(r => r.day),
				datasets: [
					{ label: 'Trophées moyens', data: trophies.map(r => +r.avg_trophies), borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.2)', fill: true, tension: 0.2 },
				]
			}

			this.chartKey++
		}

		regLabel(type: string): string {
			return REG_TYPES[type]?.title ?? ''
		}

		tutoTitle(farmer: any): string {
			const state = farmer.didactitiel_seen ? 'terminé' : 'en cours'
			return 'Didactitiel ' + state + ' (étape ' + farmer.tutorial_progress + ')'
		}

		shortDuration(seconds: number): string {
			if (seconds < 3600) return Math.floor(seconds / 60) + 'm'
			if (seconds < 86400) return Math.floor(seconds / 3600) + 'h'
			if (seconds < 30 * 86400) return Math.floor(seconds / 86400) + 'j'
			if (seconds < 365 * 86400) return Math.floor(seconds / (30 * 86400)) + 'mo'
			return Math.floor(seconds / (365 * 86400)) + 'a'
		}

		formatPercent(v: number | null): string {
			if (v == null) return '—'
			return (v * 100).toFixed(1) + '%'
		}

		format(name: string) {
			name = name.replace('https://', '')
			if (name.endsWith('/')) name = name.substring(0, name.length - 1)
			return name
		}
	}
</script>

<style lang="scss" scoped>
#app.app .panel .content {
	padding: 10px;
}
.title {
	display: flex;
	align-items: center;
	gap: 25px;
	.loader {
		margin: 0;
		padding: 0;
	}
	.period-controls {
		display: flex;
		gap: 4px;
		.v-btn.active {
			background: rgba(33, 150, 243, 0.2);
			font-weight: bold;
		}
	}
}
.retention {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 10px;
	margin: 10px 0 20px;
	.retention-card {
		background: var(--panel-bg, #f7f7f7);
		border: 1px solid rgba(0,0,0,0.05);
		border-radius: 6px;
		padding: 10px 15px;
		text-align: center;
		.retention-label {
			font-size: 13px;
			color: #777;
		}
		.retention-value {
			font-size: 24px;
			font-weight: 600;
			color: #2196f3;
		}
	}
}
.chart-wrapper {
	margin: 20px 0;
	h4 {
		margin: 0 0 5px;
		font-size: 15px;
	}
	.stats-chart {
		max-height: 280px;
	}
}
.countries {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
	gap: 6px;
	.country {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 8px;
		.flag {
			max-height: 18px;
			max-width: 24px;
		}
		.code {
			font-weight: 500;
			font-size: 13px;
			color: #555;
		}
		.count {
			margin-left: auto;
			font-weight: 600;
		}
	}
}
.country-warning {
	margin: 20px 0;
	padding: 10px 15px;
	background: rgba(255, 152, 0, 0.1);
	border-left: 3px solid #ff9800;
	font-size: 13px;
}
.sources {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
	gap: 10px;
	.source {
		padding: 6px 8px;
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		gap: 5px;
		.name {
			word-break: break-all;
			font-weight: 500;
			color: #555;
			&:hover {
				color: #000;
			}
		}
		.count {
			text-align: center;
			font-size: 24px;
		}
		.stats {
			display: flex;
			align-items: center;
			gap: 10px;
			.v-icon {
				font-size: 16px;
			}
			.other {
				display: flex;
				align-items: center;
				gap: 3px;
				font-size: 14px;
				&.empty {
					opacity: 0.3;
				}
			}
		}
	}
}

.farmers {
	display: flex;
	flex-direction: column;
	gap: 2px;
	> .date {
		padding-bottom: 6px;
	}
	&:not(:first-child) > .date {
		padding-top: 15px;
	}
}
.farmer {
	display: grid;
	grid-template-columns:
		/* date   */ 80px
		/* name   */ minmax(180px, 1.5fr)
		/* reg    */ 50px
		/* tuto   */ 55px
		/* last   */ 120px
		/* play   */ 70px
		/* team   */ 130px
		/* ai     */ 45px
		/* ip     */ 170px
		/* stats  */ 140px
		/* source */ minmax(120px, 1fr);
	column-gap: 8px;
	padding: 4px 6px;
	align-items: center;
	overflow: hidden;
	> * {
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 5px;
		.v-icon {
			font-size: 18px;
		}
	}
	.name {
		min-width: 0;
		> div {
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	.flag {
		max-height: 18px;
		max-width: 24px;
		flex-shrink: 0;
	}
	.avatar {
		height: 22px;
		flex-shrink: 0;
	}
	.status {
		width: 14px;
		flex-shrink: 0;
	}
	.date {
		font-size: 12px;
	}
	.stats {
		&.empty {
			opacity: 0.3;
		}
	}
	.ip {
		.flag {
			max-height: 14px;
			max-width: 20px;
		}
	}
	.register-type {
		.verified {
			color: #4caf50;
		}
		.unverified {
			color: #bbb;
		}
	}
	.tuto {
		.done {
			color: #4caf50;
		}
		.pending {
			color: #bbb;
		}
		span {
			font-weight: 600;
		}
	}
	.last-connection, .playtime, .ai-count {
		color: #666;
	}
	.team-cell {
		.team {
			color: #555;
			text-decoration: none;
			overflow: hidden;
			display: flex;
			align-items: center;
			gap: 5px;
			span {
				overflow: hidden;
				text-overflow: ellipsis;
			}
			&:hover {
				color: #000;
			}
			.v-icon {
				font-size: 18px;
			}
		}
	}
	.source {
		color: #555;
		&:hover {
			color: #000;
		}
	}
}
#app.app .farmer {
	grid-template-columns: 70px minmax(140px, 1.5fr) 44px 50px 100px 60px 110px 40px 150px 120px minmax(100px, 1fr);
	column-gap: 5px;
	font-size: 12px;
}
</style>
