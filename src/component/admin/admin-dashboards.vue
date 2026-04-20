<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Dashboards', link: '/admin/dashboards'}]" :raw="true" /></h1>
		</div>
		<panel class="first last">
			<loader v-if="!dashboards" />
			<div v-else>
				<v-tabs v-model="selectedDashboard" class="tabs" grow>
					<v-tab v-for="d in dashboards" :key="d.id" :value="d.id" class="tab">
						<v-icon start>{{ d.icon }}</v-icon>
						{{ d.name }}
					</v-tab>
				</v-tabs>
				<v-tabs-window v-model="selectedDashboard">
					<v-tabs-window-item v-for="d in dashboards" :key="d.id" :value="d.id">
						<loader v-if="!data[d.id]" />
						<div v-else>
							<div class="dashboard-summary">
								{{ data[d.id].rows.length }} résultats
							</div>
							<v-data-table
								:headers="getHeaders(d.id)"
								:items="data[d.id].rows"
								:items-per-page="50"
								density="compact"
								class="elevation-1">
								<template v-for="col in data[d.id].columns" :key="col.key" #[cellSlot(col.key)]="{ item }">
									<!-- Lien vers un profil éleveur -->
									<template v-if="col.type === 'farmer_link'">
										<rich-tooltip-farmer :id="col.id_key ? item[col.id_key] : item.id" v-slot="{ props }" :bottom="true">
											<router-link :to="'/farmer/' + (col.id_key ? item[col.id_key] : item.id)" v-bind="props">{{ item[col.key] }}</router-link>
										</rich-tooltip-farmer>
									</template>
									<!-- "il y a X minutes" -->
									<template v-else-if="col.type === 'duration'">
										{{ LeekWars.formatDuration(item[col.key]) }}
									</template>
									<!-- timestamp → "Xj" depuis maintenant -->
									<template v-else-if="col.type === 'days_since'">
										{{ daysSince(item[col.key]) }}j
									</template>
									<!-- float de jours → "X.Xj" ou "-" -->
									<template v-else-if="col.type === 'days_ago'">
										{{ item[col.key] >= 0 ? item[col.key].toFixed(1) + 'j' : '-' }}
									</template>
									<!-- timestamp → date et heure (wrap autorisé uniquement entre date et heure) -->
									<template v-else-if="col.type === 'datetime'">
										<span class="nowrap">{{ LeekWars.formatDate(item[col.key]) }}</span> <span class="nowrap">{{ LeekWars.formatTime(item[col.key]) }}</span>
									</template>
									<!-- true/false → icône -->
									<template v-else-if="col.type === 'boolean'">
										<v-icon :color="item[col.key] ? 'green' : 'red'" size="small">{{ item[col.key] ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
									</template>
									<!-- nombre + "%" -->
									<template v-else-if="col.type === 'percent'">
										{{ item[col.key] }}%
									</template>
									<!-- barre de proportion -->
									<template v-else-if="col.type === 'size_bar'">
										<div class="size-cell">
											<div class="size-bar" :style="{ width: sizePercent(d.id, item, col) + '%' }"></div>
											<span>{{ item[col.key] }}</span>
										</div>
									</template>
									<!-- nombre formaté -->
									<template v-else-if="col.type === 'number'">
										{{ $filters.number(item[col.key]) }}
									</template>
									<!-- texte brut (défaut) -->
									<template v-else>
										{{ item[col.key] }}
									</template>
								</template>
							</v-data-table>
						</div>
					</v-tabs-window-item>
				</v-tabs-window>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Options({ components: { Breadcrumb, RichTooltipFarmer } })
	export default class AdminDashboards extends Vue {
		dashboards: any[] | null = null
		selectedDashboard: string = ''
		data: { [key: string]: any } = {}
		LeekWars = LeekWars

		created() {
			LeekWars.setTitle("Admin Dashboards")
			LeekWars.large = true
			this.checkAdmin()
			LeekWars.get('dashboard/get-all').then((data: any) => {
				this.dashboards = data
				if (data.length) {
					this.selectedDashboard = data[0].id
					this.loadDashboard(data[0].id)
				}
			})
		}

		unmounted() {
			LeekWars.large = false
		}

		// Sur refresh, state.farmer est null le temps de recharger la session.
		// On ne redirige donc qu'une fois le farmer chargé.
		checkAdmin() {
			if (this.$store.state.farmer && !this.$store.state.farmer.admin) {
				this.$router.replace('/')
			}
		}

		@Watch('$store.state.farmer')
		onFarmerLoaded() {
			this.checkAdmin()
		}

		@Watch('selectedDashboard')
		onDashboardChange(id: string) {
			this.loadDashboard(id)
		}

		loadDashboard(id: string) {
			if (!id || this.data[id]) return
			LeekWars.get('dashboard/get-data/' + id).then((result: any) => {
				this.data[id] = result
			})
		}

		getHeaders(id: string) {
			const d = this.data[id]
			if (!d) return []
			return d.columns.map((col: any) => {
				const header: any = { title: col.title, value: col.key, sortable: true }
				if (col.sort_key) {
					header.sort = (a: any, b: any, itemA: any, itemB: any) => itemA[col.sort_key] - itemB[col.sort_key]
				}
				return header
			})
		}

		cellSlot(key: string) {
			return 'item.' + key
		}

		daysSince(timestamp: number) {
			return Math.floor((LeekWars.time - timestamp) / 86400)
		}

		sizePercent(dashboardId: string, item: any, col: any) {
			if (!col.sort_key) return 0
			const rows = this.data[dashboardId]?.rows
			if (!rows || !rows.length) return 0
			const max = rows[0][col.sort_key] || 1
			return Math.max(1, (item[col.sort_key] / max) * 100)
		}
	}
</script>

<style lang="scss" scoped>
	.dashboard-summary {
		padding: 12px 16px;
		font-size: 15px;
		color: var(--text-color-secondary);
		border-bottom: 1px solid var(--border);
	}
	:deep(.v-data-table__td),
	:deep(.v-data-table__th) {
		padding: 0 8px !important;
	}
	:deep(.v-data-table__td:first-child),
	:deep(.v-data-table__th:first-child) {
		padding-left: 12px !important;
	}
	:deep(.v-data-table__td:last-child),
	:deep(.v-data-table__th:last-child) {
		padding-right: 12px !important;
	}
	.nowrap {
		white-space: nowrap;
	}
	.size-cell {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 150px;
		span {
			position: relative;
			z-index: 1;
			white-space: nowrap;
		}
	}
	.size-bar {
		position: absolute;
		left: 0;
		top: 2px;
		bottom: 2px;
		background: rgba(95, 173, 27, 0.15);
		border-radius: 3px;
	}
</style>
