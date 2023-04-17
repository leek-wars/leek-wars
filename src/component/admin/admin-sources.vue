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

			<div class="title">
				<h3>Derniers éleveurs</h3>
				<loader v-if="loading" :size="40" />
			</div>

			<div class="farmers">
				<div v-for="farmer of last" :key="farmer.id" class="card farmer">
					<rich-tooltip-farmer :id="farmer.id" v-slot="{ on }" :bottom="true">
						<router-link :to="'/farmer/' + farmer.id" class="name" v-on="on" v-ripple>
							<avatar :farmer="farmer" />
							<flag :code="LeekWars.languages[farmer.language].country" :clickable="false" />
							<div>{{ farmer.name }}</div>
						</router-link>
					</rich-tooltip-farmer>
					<div class="date">
						<img v-if="farmer.connected" class="status" src="/image/connected.png">
						<img v-else class="status" src="/image/disconnected.png">
						{{ farmer.register_time | datetime }}
					</div>
					<div class="level">{{ $t('main.level_n', [farmer.total_level]) }}</div>
					<div class="level" :class="{empty: farmer.fights + farmer.test_fights + farmer.trophies === 0}">
						<v-icon>mdi-sword-cross</v-icon> {{ farmer.fights }}
						<v-icon>mdi-settings-outline</v-icon> {{ farmer.test_fights }}
						<v-icon>mdi-trophy-outline</v-icon> {{ farmer.trophies }}
					</div>
					<a class="level" :href="farmer.referer" target="_blank">
						<img v-if="!farmer.pass && farmer.verified" src="/image/github_black.png"> {{ format(farmer.referer || '∅') }}
					</a>
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
						<div class="count">{{ source.count | number }}</div>
						<div class="other" :class="{empty: source.fights + source.test_fights + source.trophies === 0}">
							<v-icon>mdi-sword-cross</v-icon> {{ source.fights }}
							<v-icon>mdi-settings-outline</v-icon> {{ source.test_fights }}
							<v-icon>mdi-trophy-outline</v-icon> {{ source.trophies }}
							<v-icon>mdi-flash-outline</v-icon> {{ (source.trophies / source.count).toFixed(1) }}
						</div>
					</div>
				</div>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({ components: { RichTooltipFarmer } })
	export default class AdminSources extends Vue {
		data: any = null
		sources: any = null
		last: any = null
		loading: boolean = false
		timer: any = null

		created() {
			LeekWars.setTitle("Admin Sources")
			this.refresh()
			this.timer = setInterval(this.refresh, 5_000)
		}

		beforeDestroy() {
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
}
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
.farmers {
	display: flex;
	flex-direction: column;
	gap: 5px;
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
		flex-shrink: 0;
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
		height: 24px;
		flex-basis: 24px;
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
		flex: 1;
	}
	.level {
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 5px;
		flex: 1;
		max-width: 200px;
		// min-width: 0;
		text-overflow: ellipsis;
		// overflow: hidden;
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
}
</style>