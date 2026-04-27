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
									<v-icon v-else-if="farmer.reg_type === 'google'">mdi-google</v-icon>
									<v-icon v-else-if="farmer.reg_type === 'classic'">mdi-email-outline</v-icon>
									<v-icon v-else>mdi-flash-outline</v-icon>
									<v-icon v-if="farmer.verified" class="verified" title="Vérifié">mdi-check-decagram</v-icon>
									<v-icon v-else class="unverified" title="Non vérifié">mdi-help-circle-outline</v-icon>
								</div>

								<div class="tuto" :title="tutoTitle(farmer)">
									<v-icon v-if="farmer.didactitiel_seen" class="done" title="Didactitiel terminé">mdi-school</v-icon>
									<v-icon v-else class="pending" title="Didactitiel non terminé">mdi-school-outline</v-icon>
									<span v-if="farmer.tutorial_progress > 0" class="progress" :class="{complete: farmer.tutorial_progress >= 10}">{{ farmer.tutorial_progress }}/10</span>
								</div>

								<div class="last-connection" :title="'Dernière connexion: ' + $filters.date(farmer.last_time)">
									<v-icon>mdi-clock-outline</v-icon>
									{{ $filters.duration(farmer.last_time) }}
								</div>

								<div class="playtime" :title="farmer.playtime > 0 ? 'Temps total : ' + LeekWars.formatLongDuration(farmer.playtime) : ''">
									<template v-if="farmer.playtime > 0">
										<v-icon>mdi-timer-sand</v-icon>
										{{ LeekWars.formatLongDuration(farmer.playtime) }}
									</template>
								</div>

								<div class="team-cell">
									<router-link v-if="farmer.team_id" :to="'/team/' + farmer.team_id" class="team" :title="farmer.team_name">
										<v-icon>mdi-shield-outline</v-icon>
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

<script lang="ts" setup>
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { onBeforeUnmount, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { Line, Bar } from 'vue-chartjs'
	import type { ChartData, ChartOptions } from 'chart.js'

	const STORAGE_KEY_DAYS = 'admin_sources_days'
	const REG_TYPES: Record<string, { label: string, title: string, color: string }> = {
		classic: { label: 'Classique', title: 'Inscription classique', color: '#2196f3' },
		github:  { label: 'GitHub',    title: 'Inscription GitHub',    color: '#424242' },
		google:  { label: 'Google',    title: 'Inscription Google',    color: '#db4437' },
		fast:    { label: 'Rapide',    title: 'Inscription rapide',    color: '#ff9800' },
	}
	const GRID = { color: 'rgba(128,128,128,0.15)' }
	const makeChartOptions = (stacked: boolean): ChartOptions<any> => ({
		responsive: true,
		maintainAspectRatio: false,
		plugins: { legend: { position: 'bottom' } },
		scales: {
			y: { beginAtZero: true, stacked, grid: GRID },
			x: { stacked, ticks: { maxRotation: 45 }, grid: GRID },
		}
	})

	const router = useRouter()

	const data = ref<any>(null)
	const sources = ref<any>(null)
	const last = ref<any>(null)
	const loading = ref(false)
	let timer: any = null
	const last_farmers_by_day = ref<any>({})

	const days = ref(parseInt(localStorage.getItem(STORAGE_KEY_DAYS) || '30'))
	const stats_loading = ref(false)
	const countries = ref<any[]>([])
	const country_available = ref(true)
	const retention = ref<any>(null)
	const chartKey = ref(0)
	const registrationsChart = ref<ChartData<'bar'> | null>(null)
	const tutoChart = ref<ChartData<'line'> | null>(null)
	const trophiesChart = ref<ChartData<'line'> | null>(null)

	const barChartOptions = makeChartOptions(true) as ChartOptions<'bar'>
	const lineChartOptions = makeChartOptions(false) as ChartOptions<'line'>

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Sources")
	refresh()
	loadStats()
	timer = setInterval(refresh, 5_000)

	onMounted(() => {
		LeekWars.large = true
	})

	onBeforeUnmount(() => {
		LeekWars.large = false
		if (timer) {
			clearInterval(timer)
		}
	})

	function setDays(d: number) {
		days.value = d
		localStorage.setItem(STORAGE_KEY_DAYS, String(d))
		loadStats()
	}

	function refresh() {
		loading.value = true
		LeekWars.get('source/all').then(d => {
			loading.value = false
			data.value = d
			sources.value = d.all
			last.value = d.last

			last_farmers_by_day.value = {}
			for (const farmer of last.value) {
				farmer.reg_type = farmer.github ? 'github' : (farmer.google ? 'google' : (farmer.pass ? 'classic' : 'fast'))
				const day = LeekWars.formatDate(farmer.register_time)
				if (!last_farmers_by_day.value[day]) last_farmers_by_day.value[day] = []
				last_farmers_by_day.value[day].push(farmer)
			}
		})
	}

	function loadStats() {
		stats_loading.value = true
		LeekWars.get('source/stats/' + days.value).then(data => {
			stats_loading.value = false
			retention.value = data.retention || null
			countries.value = data.countries || []
			country_available.value = data.country_available !== false
			buildCharts(data.registrations || [], data.trophies || [])
		})
	}

	function buildCharts(registrations: any[], trophies: any[]) {
		const labels = registrations.map(r => r.day)

		registrationsChart.value = {
			labels,
			datasets: [
				{ label: REG_TYPES.classic.label, data: registrations.map(r => +r.classic), backgroundColor: REG_TYPES.classic.color, stack: 'reg' },
				{ label: REG_TYPES.github.label, data: registrations.map(r => +r.github), backgroundColor: REG_TYPES.github.color, stack: 'reg' },
				{ label: REG_TYPES.fast.label, data: registrations.map(r => +r.fast), backgroundColor: REG_TYPES.fast.color, stack: 'reg' },
			]
		}

		tutoChart.value = {
			labels,
			datasets: [
				{ label: 'Didactitiel terminé', data: registrations.map(r => +r.tuto_done), borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.2)', fill: false, tension: 0.2 },
				{ label: 'Étape moyenne', data: registrations.map(r => +r.avg_tuto_step), borderColor: '#9c27b0', backgroundColor: 'rgba(156,39,176,0.2)', fill: false, tension: 0.2 },
				{ label: 'Vérifiés', data: registrations.map(r => +r.verified), borderColor: '#00bcd4', backgroundColor: 'rgba(0,188,212,0.2)', fill: false, tension: 0.2 },
			]
		}

		trophiesChart.value = {
			labels: trophies.map(r => r.day),
			datasets: [
				{ label: 'Trophées moyens', data: trophies.map(r => +r.avg_trophies), borderColor: '#ff9800', backgroundColor: 'rgba(255,152,0,0.2)', fill: true, tension: 0.2 },
			]
		}

		chartKey.value++
	}

	function regLabel(type: string): string {
		return REG_TYPES[type]?.title ?? ''
	}

	function tutoTitle(farmer: any): string {
		const didactitiel = farmer.didactitiel_seen ? 'Didactitiel terminé' : 'Didactitiel non terminé'
		const tuto = 'Tutoriel ' + farmer.tutorial_progress + '/10'
		return didactitiel + ' · ' + tuto
	}

	function formatPercent(v: number | null): string {
		if (v == null) return '—'
		return (v * 100).toFixed(1) + '%'
	}

	function format(name: string) {
		name = name.replace('https://', '')
		if (name.endsWith('/')) name = name.substring(0, name.length - 1)
		return name
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
		height: 300px;
		max-height: 300px;
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
		/* date   */ 70px
		/* name   */ minmax(120px, 1.4fr)
		/* reg    */ 46px
		/* tuto   */ 70px
		/* last   */ minmax(80px, 1fr)
		/* play   */ minmax(90px, 1fr)
		/* team   */ 28px
		/* ai     */ 34px
		/* ip     */ minmax(120px, 1.1fr)
		/* stats  */ minmax(100px, 1fr)
		/* source */ minmax(80px, 1.3fr);
	column-gap: 6px;
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
		gap: 4px;
		.v-icon {
			font-size: 18px;
		}
	}
	.name {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 6px;
		min-width: 0;
		text-decoration: none;
		color: inherit;
		.avatar, .flag {
			flex-shrink: 0;
		}
		> div {
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
	.flag {
		max-height: 18px;
		max-width: 24px;
		flex-shrink: 0;
	}
	.avatar {
		height: 22px;
		width: 22px;
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
		.progress {
			font-weight: 600;
			font-size: 11px;
			color: #777;
			&.complete {
				color: #4caf50;
			}
		}
	}
	.last-connection, .playtime, .ai-count {
		color: #666;
	}
	.team-cell {
		.team {
			color: #555;
			text-decoration: none;
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
#app.app .last-farmers {
	overflow-x: auto;
	.farmer, .farmers > .date {
		min-width: 1200px;
	}
}
#app.app .farmer {
	grid-template-columns: 60px minmax(100px, 1.3fr) 40px 60px minmax(70px, 1fr) minmax(80px, 1fr) 26px 30px minmax(110px, 1fr) minmax(90px, 1fr) minmax(70px, 1.1fr);
	column-gap: 4px;
	font-size: 12px;
}
</style>
