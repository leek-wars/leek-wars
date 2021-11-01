<template lang="html">
	<div>
		<div class="page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first">

			<div class="summary">
				<div class="periods">
					<div v-ripple :class="{selected: period === 'today'}" class="period card" @click="select_period('today')">{{ $t('today') }}</div>
					<div v-ripple :class="{selected: period === '24h'}" class="period card" @click="select_period('24h')">{{ $t('24h') }}</div>
					<div v-ripple :class="{selected: period === '2days'}" class="period card" @click="select_period('2days')">{{ $t('2days') }}</div>
					<div v-ripple :class="{selected: period === '1week'}" class="period card" @click="select_period('1week')">{{ $t('1week') }}</div>
				</div>
			</div>

			<loader v-if="!entity" />
			<div v-else>
				<div class="summary">

					<div v-if="type === 'farmer'" class="image">
						<avatar :farmer="entity" />
					</div>
					<div v-if="type === 'leek'" class="image">
						<leek-image :leek="entity" :scale="0.8" />
					</div>
					<div v-if="type === 'team'" class="image">
						<emblem :team="entity" />
					</div>

					<div class="stats">
						<center>
							<talent :id="entity.id" :talent="entity.talent" :category="type" />
							<div v-if="type === 'leek' || type === 'farmer'" class="talent-more">
								({{ entity.talent_more >= 0 ? '+' + entity.talent_more : entity.talent_more }})
							</div>
						</center>
						<table>
							<tr>
								<td class="big">{{ victories }}</td>
								<td class="big">{{ draws }}</td>
								<td class="big">{{ defeats }}</td>
								<td class="big">{{ ratio }}</td>
							</tr>
							<tr>
								<td class="grey">{{ $t('victories') }}</td>
								<td class="grey">{{ $t('draws') }}</td>
								<td class="grey">{{ $t('defeats') }}</td>
								<td class="grey">{{ $t('ratio') }}</td>
							</tr>
						</table>
					</div>
				</div>
				<br>
				<div class="n-fights">{{ $t('n_fights', [filteredFights.length]) }}</div>

				<div class="history-options">
					<div class="fight-context">
						<span class="category">
							{{ $t('fight_context') }}
						</span>
						<v-checkbox v-if="type !== 'team'" v-model="displayContexts.challenge" hide-details class="option-checkbox" :label="$t('challenge')" />
						<v-checkbox v-model="displayContexts.garden" hide-details class="option-checkbox" :label="$t('garden')" />
						<v-checkbox v-model="displayContexts.tournament" hide-details class="option-checkbox" :label="$t('tournament')" />
					</div>
					<div v-if="type !== 'team'" class="fight-type">
						<span class="category">
							{{ $t('fight_type') }}
						</span>
						<v-checkbox v-model="displayTypes.solo" hide-details class="option-checkbox" :label="$t('solo')" />
						<v-checkbox v-model="displayTypes.farmer" hide-details class="option-checkbox" :label="$t('farmer')" />
						<v-checkbox v-model="displayTypes.team" hide-details class="option-checkbox" :label="$t('team')" />
						<v-checkbox v-model="displayTypes.battleRoyale" hide-details class="option-checkbox" :label="$t('battle_royale')" />
					</div>
				</div>

				<fights-history :fights="filteredFights" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Farmer } from '@/model/farmer'
	import { Fight, FightContext, FightType } from '@/model/fight'
	import { mixins } from '@/model/i18n'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Component({ name: 'history', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })
	export default class History extends Vue {
		@Prop({required: true}) type!: string
		fights!: Fight[]
		entity: Farmer | Leek | null = null
		period: string = '1week'
		start_date: number = 0
		displayContexts = { challenge: true, garden: true, tournament: true }
		displayTypes = { solo: true, farmer: true, team: true, battleRoyale: true }

		get breadcrumb_items() {
			return [
				{name: (this.entity ? this.entity.name : '...'), link: '/' + this.type + '/' + (this.entity ? this.entity.id : '')},
				{name: this.$t('title_html', [this.entity ? this.entity.name : '...']), link: '/' + this.type + '/' + (this.entity ? this.entity.id : '') + '/history'}
			]
		}
		get filteredFights() {
			return this.fights.filter((fight) => {
				return fight.date >= this.start_date && (
						(this.displayContexts.challenge && fight.context === FightContext.CHALLENGE) ||
						(this.displayContexts.garden && fight.context === FightContext.GARDEN) ||
						(this.displayContexts.tournament && fight.context === FightContext.TOURNAMENT) ||
						(this.displayContexts.garden && this.displayTypes.battleRoyale && fight.context === FightContext.BATTLE_ROYALE) // TODO temporary, BR context is removed
					) && (
						(this.displayTypes.solo && fight.type === FightType.SOLO) ||
						(this.displayTypes.farmer && fight.type === FightType.FARMER) ||
						(this.displayTypes.team && fight.type === FightType.TEAM) ||
						(this.displayTypes.battleRoyale && fight.type === FightType.BATTLE_ROYALE) ||
                        this.type === 'team'
					)
			})
		}
		get victories() {
			return this.filteredFights.filter(f => f.result === "win").length
		}
		get defeats() {
			return this.filteredFights.filter(f => f.result === "defeat").length
		}
		get draws() {
			return this.filteredFights.filter(f => f.result === "draw").length
		}
		get ratio() {
			return this.defeats === 0 ? '∞' : LeekWars.numberPrecision(this.victories / this.defeats, 3)
		}

		created() {
			const id = this.$route.params.id
			const period = localStorage.getItem('options/history-period') || '1week'
			this.displayContexts = JSON.parse(localStorage.getItem('options/history-contexts') || '{"challenge": true, "garden": true, "tournament": true }')
			this.displayTypes = JSON.parse(localStorage.getItem('options/history-types') || '{"solo": true, "farmer": true, "team": true, "battleRoyale": true }')
			this.select_period(period)
			LeekWars.get('history/get-' + this.type + '-history/' + id).then(data => {
				this.fights = data.fights
				this.entity = data.entity
				LeekWars.setTitle(this.$t('title', [data.entity.name]))
				this.select_period(period)
			})
		}

		select_period(period: string) {
			this.period = period
			const now = Date.now() / 1000
			const midnignt = new Date()
			midnignt.setHours(0, 0, 0, 0)
			const day = 24 * 3600
			this.start_date = (() => {
				if (period === '24h') { return now - day }
				if (period === 'today') { return midnignt.getTime() / 1000 }
				if (period === '2days') { return now - 2 * day }
				return now - 7 * day
			})()
			localStorage.setItem('options/history-period', period)
		}

		@Watch('displayContexts', { deep: true })
		updateContexts() {
			localStorage.setItem('options/history-contexts', JSON.stringify(this.displayContexts))
		}

		@Watch('displayTypes', { deep: true })
		updateTypes() {
			localStorage.setItem('options/history-types', JSON.stringify(this.displayTypes))
		}
	}
</script>

<style lang="scss" scoped>
	.summary {
		position: relative;
		text-align: center;
	}
	.image {
		display: inline-block;
		padding: 10px;
	}
	.periods {
		user-select: none;
		vertical-align: top;
	}
	.period {
		display: inline-block;
		padding: 10px;
		background: white;
		cursor: pointer;
		font-size: 16px;
		color: #555;
		width: 150px;
		text-align: center;
		margin: 2px;
	}
	.period:hover {
		background: #eee;
	}
	.period.selected {
		background: #eee;
		font-weight: bold;
	}
	.n-fights {
		padding-left: 10px;
		font-size: 18px;
		font-weight: bold;
		color: #777;
	}
	.stats {
		display: inline-block;
		vertical-align: top;
		text-align: center;
		width: 100%;
	}
	.stats table {
		margin: 10px auto;
	}
	.talent-more {
		display: inline-block;
		font-weight: 300;
		font-size: 20px;
		margin-left: 5px;
		margin-top: 6px;
		vertical-align: top;
		color: #888;
	}
	.stats tr > td:nth-child(n+2) {
		border-left: 2px solid #ddd;
	}
	.stats td {
		padding: 0px 15px;
	}
	.stats .big {
		font-size: 22px;
		font-weight: 300;
		color: #555;
	}
	.history {
		text-align: center;
	}
	.grey {
		color: #aaa;
	}
	.category {
		vertical-align: top;
		font-size: 16px
	}
	.history-options {
		margin: 10px;
	}
	.option-checkbox {
		display: inline-block;
		padding-right: 5px;
		padding-left: 5px;
	}
</style>