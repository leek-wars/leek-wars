<template>
	<div class="page">
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<div class="tabs">
				<div class="tab action content" icon="mdi-history">
					<v-icon>mdi-history</v-icon> Historique
				</div>
			</div>
		</div>

		<panel title="Historique des jugements">
			<template #content>
				<v-data-table-server
					:headers="headers"
					:items="history"
					:items-length="total"
					:items-per-page="25"
					:loading="loading"
					loading-text="Chargement..."
					density="compact"
					class="history-table"
					@update:options="updateOptions">
					<template #item.author="{ item }">
						<rich-tooltip-farmer :id="item.author.id" :bottom="true">
							<router-link :to="'/farmer/' + item.author.id" class="farmer-cell">
								<avatar :farmer="item.author" />
								<span>{{ item.author.name }}</span>
							</router-link>
						</rich-tooltip-farmer>
					</template>
					<template #item.target="{ item }">
						<rich-tooltip-farmer :id="item.target.id" :bottom="true">
							<router-link :to="'/farmer/' + item.target.id" class="farmer-cell">
								<avatar :farmer="item.target" />
								<span>{{ item.target.name }}</span>
							</router-link>
						</rich-tooltip-farmer>
					</template>
					<template #item.reason="{ item }">
						{{ $t('warning.reason_' + item.reason) }}
					</template>
					<template #item.severity="{ item }">
						<span class="severity" :class="'severity-' + Math.min(item.severity, 5)">{{ item.severity }}</span>
					</template>
					<template #item.date="{ item }">
						<span class="date">{{ LeekWars.formatDuration(item.date) }}</span>
					</template>
				</v-data-table-server>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Options({ name: "moderation-history", i18n: {}, components: { Breadcrumb, RichTooltipFarmer } })
	export default class ModerationHistory extends Vue {
		history: any[] = []
		total: number = 0
		loading: boolean = true
		LeekWars = LeekWars
		headers = [
			{ title: 'Modérateur', value: 'author', sortable: false },
			{ title: 'Cible', value: 'target', sortable: false },
			{ title: 'Motif', value: 'reason', sortable: false },
			{ title: 'Gravité', value: 'severity', sortable: false },
			{ title: 'Message', value: 'message', sortable: false },
			{ title: 'Date', value: 'date', sortable: false },
		]

		get breadcrumb_items() {
			return [
				{name: "Modération", link: '/moderation'},
				{name: "Historique", link: '/moderation/history'},
			]
		}

		updateOptions(options: any) {
			this.loading = true
			const page = options.page - 1
			const count = options.itemsPerPage
			LeekWars.get('moderation/get-history/' + page + '/' + count).then((data: any) => {
				this.history = data.history
				this.total = data.total
				this.loading = false
				LeekWars.setTitle("Historique des jugements")
			})
		}
	}
</script>

<style lang="scss" scoped>
	.history-table {
		.farmer-cell {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			white-space: nowrap;
			.avatar {
				width: 25px;
				height: 25px;
			}
		}
	}
	.severity {
		display: inline-block;
		min-width: 24px;
		text-align: center;
		padding: 1px 8px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: bold;
		color: white;
		&.severity-1 { background: #4caf50; }
		&.severity-2 { background: #ff9800; }
		&.severity-3 { background: #f44336; }
		&.severity-4 { background: #d32f2f; }
		&.severity-5 { background: #b71c1c; }
	}
	.date {
		white-space: nowrap;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
</style>
