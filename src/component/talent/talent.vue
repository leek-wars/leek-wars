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
			<div slot="content" class="levels">

				<h4>Talent solo</h4>
				<div v-if="leekData">Level 301 = {{ leekData.series[0][300] }}</div>
				<chartist ref="leekChart" :data="leekData" :options="leekOptions" ratio="ct-major-twelfth" class="talent" type="Line" />
				<h4>Talent éleveur</h4>
				<div v-if="farmerData">Level 1204 = {{ farmerData.series[0][1204 - 50] }}</div>
				<chartist ref="farmerChart" :data="farmerData" :options="farmerOptions" ratio="ct-major-twelfth" class="talent" type="Line" />

			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import Chartist from 'vue-chartist'
	import { Component, Vue } from 'vue-property-decorator'
	import(/* webpackChunkName: "chartist" */ /* webpackMode: "eager" */ "@/chartist-wrapper")

	@Component({ name: 'talent', i18n: {} })
	export default class TalentPage extends Vue {

		leekData: any = null
		leekOptions: any = null
		farmerData: any = null
		farmerOptions: any = null

		created() {
			LeekWars.setTitle("Talent")

			LeekWars.get("talent/farmer").then(talents => {
				this.farmerData = {
					labels: [...Array(talents.length)].map((_, i) => 50 + i),
					series: [talents]
				}
				this.farmerOptions = {
					showArea: true, fullWidth: true, fullHeight: true, low: 50,
					axisX: { labelInterpolationFnc: (value: any, index: any) => index % 25 === 0 ? value : null }
				}
			})
			LeekWars.get("talent/leek").then(talents => {
				this.leekData = {
					labels: [...Array(talents.length)].map((_, i) => i),
					series: [talents]
				}
				this.leekOptions = {
					showArea: true, fullWidth: true, fullHeight: true, low: 0,
					axisX: { labelInterpolationFnc: (value: any, index: any) => index === 0 ? 1 : (index % 10 === 0 ? value : null) }
				}
			})
		}
		mounted() {
			LeekWars.large = true
			this.$root.$on('resize', this.resize)
		}
		beforeDestroy() {
			LeekWars.large = false
			this.$root.$off('resize', this.resize)
		}
		resize() {
			Vue.nextTick(() => {
				(this.$refs.leekChart as any).redraw()
				(this.$refs.farmerChart as any).redraw()
			})
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
.talent {
	::v-deep .ct-line {
		stroke: rgba(95, 173, 27, 0.7);
		stroke-width: 2px;
	}
	::v-deep .ct-point {
		stroke: #5fad1b;
		stroke-width: 4px;
	}
	::v-deep .ct-area {
		fill: rgba(95, 173, 27, 1);
		fill-opacity: 0.2;
	}
}
</style>