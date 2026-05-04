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

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { Line } from 'vue-chartjs'
import { mixins, useNamespacedT } from '@/model/i18n'

defineOptions({ name: 'talent', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('talent')

const leekData = ref<any>(null)
const leekOptions = ref<any>(null)
const leekMax = ref(0)
const farmerData = ref<any>(null)
const farmerOptions = ref<any>(null)
const farmerMax = ref(0)

LeekWars.setTitle('Talent')

LeekWars.get('talent/farmer').then(talents => {
	farmerMax.value = talents[talents.length - 1]
	farmerData.value = {
		labels: [...Array(talents.length)].map((_, i) => 50 + i),
		datasets: [{
			data: talents,
			tension: 0.2,
			borderColor: '#5fad1b',
			borderWidth: 2,
			pointRadius: 0,
			pointHitRadius: 5,
			fill: { target: 'origin', above: '#5fad1b30' },
		}]
	}
	farmerOptions.value = {
		aspectRatio: 2.5,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					title: (items: any) => t('main.level_n', [items[0].label]),
				}
			}
		},
		scales: {
			x: {
				ticks: {
					callback: (_value: any, index: any) => index % 25 === 0 ? 50 + index : null,
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

LeekWars.get('talent/leek').then(talents => {
	leekMax.value = talents[talents.length - 1]
	leekData.value = {
		labels: [...Array(talents.length)].map((_, i) => i + 1),
		datasets: [{
			data: talents,
			tension: 0.2,
			borderColor: '#5fad1b',
			borderWidth: 2,
			pointRadius: 0,
			pointHitRadius: 5,
			fill: { target: 'origin', above: '#5fad1b30' },
		}]
	}
	leekOptions.value = {
		aspectRatio: 2.5,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					title: (items: any) => t('main.level_n', [items[0].label]),
				}
			}
		},
		scales: {
			x: {
				ticks: {
					callback: (_value: any, index: any) => index === 0 ? 1 : (index % 10 === 0 ? index + 1 : null),
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

onMounted(() => { LeekWars.large = true })
onBeforeUnmount(() => { LeekWars.large = false })
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
