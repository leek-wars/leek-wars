<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Sources</h1>

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
							<!-- <div class="level">{{ $t('main.level_n', [farmer.total_level]) }}</div> -->
							<div class="ip">
								{{ farmer.register_ip }}
							</div>
							<div class="stats" :class="{empty: farmer.fights + farmer.test_fights + farmer.trophies === 0}">
								<v-icon>mdi-sword-cross</v-icon> {{ farmer.fights }}
								<v-icon>mdi-settings-outline</v-icon> {{ farmer.test_fights }}
								<v-icon>mdi-trophy-outline</v-icon> {{ farmer.trophies }}
							</div>
							<a class="source" :href="farmer.referer" target="_blank" :title="farmer.referer">
								<img v-if="!farmer.pass && farmer.verified" src="/image/github_black.png"> {{ format(farmer.referer || '∅') }}
							</a>
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
						<a v-if="source.name" class="name" :href="source.name" target="_blank">{{ format(source.name) }}</a>
						<div v-else class="name">∅</div>
						<div class="stats">
							<div class="count">{{ $filters.number(source.count) }}</div>
							<div class="other" :class="{empty: source.fights + source.test_fights + source.trophies === 0}">
								<v-icon>mdi-sword-cross</v-icon> {{ source.fights }}
								<v-icon>mdi-settings-outline</v-icon> {{ source.test_fights }}
								<v-icon>mdi-trophy-outline</v-icon> {{ source.trophies }}
								<v-icon>mdi-flash-outline</v-icon> {{ (source.trophies / source.count).toFixed(1) }}
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

	@Options({ components: { RichTooltipFarmer } })
	export default class AdminSources extends Vue {
		data: any = null
		sources: any = null
		last: any = null
		loading: boolean = false
		timer: any = null
		last_farmers_by_day: any = {}

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle("Admin Sources")
			this.refresh()
			this.timer = setInterval(this.refresh, 5_000)
		}

		beforeUnmount() {
			if (this.timer) {
				clearInterval(this.timer)
			}
		}

		refresh() {
			this.loading = true
			LeekWars.get('source/all').then(data => {
				this.loading = false
				this.data = data
				this.sources = data.all
				this.last = data.last

				// Group by day
				this.last_farmers_by_day = {}
				for (const farmer of this.last) {
					const day = LeekWars.formatDate(farmer.register_time)
					if (!this.last_farmers_by_day[day]) this.last_farmers_by_day[day] = []
					this.last_farmers_by_day[day].push(farmer)
				}
			})
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
}
.sources {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
	display: flex;
	gap: 8px;
	padding: 4px;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	overflow: hidden;
	a {
		flex-shrink: 0;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		div {
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
	.flag {
		max-height: 24px;
		max-width: 24px;
		flex-basis: 24px;
		flex-shrink: 0;
	}
	.avatar {
		height: 22px;
		flex-basis: 22px;
		flex-shrink: 0;
	}
	.status {
		width: 15px;
		flex-shrink: 0;
	}
	.date {
		display: flex;
		align-items: center;
		font-size: 13px;
		white-space: nowrap;
		gap: 6px;
		flex-basis: 60px;
	}
	.level, .stats, .source, .ip {
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 5px;
		flex: 1;
		text-overflow: ellipsis;
		max-width: 200px;
		.v-icon {
			font-size: 18px;
		}
		img {
			height: 18px;
		}
		&.empty {
			opacity: 0.3;
		}
	}
	.level {
		flex-basis: 80px;
		flex-grow: 0;
	}
	.ip {
		font-size: 13px;
	}
}
#app.app .farmer {
	gap: 6px;
	.name {
		flex: 1;
	}
	.ip {
		flex-basis: 80px;
		flex: 0;
	}
}
</style>