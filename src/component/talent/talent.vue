<template lang="html">
	<div>
		<div class="page-bar page-header">
			<div>
				<h1>Talents moyens</h1>
				<div class="info">
					<v-icon>mdi-information-outline</v-icon> Mise à jour toutes les heures
				</div>
			</div>
		</div>
		<panel class="first">
			<template #content>
				<div class="levels">

					<h4>Talent solo</h4>
				<div v-if="leekData">Level 301 = {{ leekMax }}</div>
				<Line v-if="leekData" :data="leekData" :options="leekOptions" class="talent-chart" />
				<h4>Talent éleveur</h4>
				<div v-if="farmerData">Level 1204 = {{ farmerMax }}</div>
				<Line v-if="farmerData" :data="farmerData" :options="farmerOptions" class="talent-chart" />

				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import { Line } from 'vue-chartjs'

	@Options({ name: 'talent', i18n: {}, components: { Line } })
	export default class TalentPage extends Vue {

		leekData: any = null
		leekOptions: any = null
		leekMax: number = 0
		farmerData: any = null
		farmerOptions: any = null
		farmerMax: number = 0

		created() {
			LeekWars.setTitle("Talent")

			LeekWars.get("talent/farmer").then(talents => {
				this.farmerMax = talents[talents.length - 1]
				this.farmerData = {
					labels: [...Array(talents.length)].map((_, i) => 50 + i),
					datasets: [{
						data: talents,
						tension: 0.2,
						borderColor: '#5fad1b',
						borderWidth: 2,
						pointRadius: 0,
						pointHitRadius: 5,
						fill: {
							target: 'origin',
							above: '#5fad1b30',
						},
					}]
				}
				this.farmerOptions = {
					aspectRatio: 2.5,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								title: (items: any) => this.$t('main.level_n', [items[0].label]),
							}
						}
					},
					scales: {
						x: {
							ticks: {
								callback: (value: any, index: any) => index % 25 === 0 ? 50 + index : null,
								maxRotation: 0,
							},
							grid: { color: 'rgba(128,128,128,0.15)' },
						},
						y: {
							min: 50,
							grid: { color: 'rgba(128,128,128,0.15)' },
						}
					},
				}
			})
			LeekWars.get("talent/leek").then(talents => {
				this.leekMax = talents[talents.length - 1]
				this.leekData = {
					labels: [...Array(talents.length)].map((_, i) => i + 1),
					datasets: [{
						data: talents,
						tension: 0.2,
						borderColor: '#5fad1b',
						borderWidth: 2,
						pointRadius: 0,
						pointHitRadius: 5,
						fill: {
							target: 'origin',
							above: '#5fad1b30',
						},
					}]
				}
				this.leekOptions = {
					aspectRatio: 2.5,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								title: (items: any) => this.$t('main.level_n', [items[0].label]),
							}
						}
					},
					scales: {
						x: {
							ticks: {
								callback: (value: any, index: any) => index === 0 ? 1 : (index % 10 === 0 ? index + 1 : null),
								maxRotation: 0,
							},
							grid: { color: 'rgba(128,128,128,0.15)' },
						},
						y: {
							min: 0,
							grid: { color: 'rgba(128,128,128,0.15)' },
						}
					},
				}
			})
		}
		mounted() {
			LeekWars.large = true
		}
		beforeUnmount() {
			LeekWars.large = false
		}
	}
</script>

<style lang="scss" scoped>
.page-bar i {
	font-size: 20px;
	vertical-align: middle;
	margin-bottom: 2px;
}
.levels {
	padding: 10px;
}
.talent-chart {
	margin-top: 5px;
	margin-bottom: 20px;
}
</style>
