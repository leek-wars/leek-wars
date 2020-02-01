<template>
	<div>
		<h3>{{ title }}</h3>
		<div class="flags">
			<tooltip v-for="flag in flags" :key="flag">
				<div slot="activator" class="flag card">
					<img slot="activator" :src="'/image/fight_flag/' + flag + '.png'">
				</div>
				{{ $t('fight.flag_' + flag) }}
			</tooltip>
		</div>

		<table v-if="fight.type === FightType.FARMER" class="report">
			<tr>
				<th>{{ $t('report.farmer') }}</th>
				<th></th>
				<th v-if="fight.context !== FightContext.CHALLENGE" class="gain">{{ $t('report.talent') }}</th>
			</tr>
			<tr>
				<td class="name">
					<span class="alive">
						<router-link :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id">
								{{ farmer.name }}
							</rich-tooltip-farmer>
						</router-link>
					</span>
				</td>
				<td></td>
				<td v-if="fight.context !== FightContext.CHALLENGE" class="talent">
					<img src="/image/talent.png">
					{{ farmer.talent }}
					<span v-if="farmer.talent_gain >= 0">+ {{ farmer.talent_gain }}</span>
					<span v-else>- {{ -farmer.talent_gain }}</span>
				</td>
			</tr>
		</table>

		<table v-else-if="fight.type === FightType.TEAM" class="report">
			<tr>
				<th>{{ $t('report.team') }}</th>
				<th>{{ $t('report.level') }}</th>
				<th>{{ $t('report.xp') }}</th>
				<th v-if="fight.context !== FightContext.CHALLENGE" class="gain">{{ $t('report.talent') }}</th>
			</tr>
			<tr>
				<td class="name">
					<span class="alive">
						<router-link :to="'/team/' + team.id">{{ team.name }}</router-link>
					</span>
				</td>
				<td class="level">{{ team.level }}</td>
				<td class="xp">
					<tooltip>
						<div slot="activator" class="bar">
							<span :style="{width: currentBar + '%'}" class="current_xp"></span>
							<span :style="{width: newBar + '%'}" class="new_xp team"></span>
						</div>
						{{ team.cur_xp | number }} / {{ team.next_xp | number }}
					</tooltip>
					<span>{{ team.xp | number }}</span>
				</td>
				<td v-if="fight.context !== FightContext.CHALLENGE" class="talent">
					<img src="/image/talent.png">
					{{ team.talent }}
					<span v-if="team.talent_gain >= 0">+ {{ team.talent_gain }}</span>
					<span v-else>- {{ -team.talent_gain }}</span>
				</td>
			</tr>
		</table>

		<div class="scroll-x">
			<table class="report">
				<tr>
					<th>{{ $t('report.leek') }}</th>
					<th>{{ $t('report.level') }}</th>
					<th>{{ $t('report.xp') }}</th>
					<th class="gain">{{ $t('report.money') }}</th>
					<th v-if="fight.type === FightType.SOLO && fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="gain">{{ $t('report.talent') }}</th>
					<th v-if="$store.getters.admin" class="gain">Time</th>
				</tr>
				<report-leek-row v-for="leek in leeks" :key="leek.id" :leek="leek" :fight="fight" />
				<tr v-if="fight.type !== FightType.SOLO" class="total">
					<td class="name"><span class="alive">{{ $t('report.total') }}</span></td>
					<td class="level">{{ totalLevel }}</td>
					<td class="xp"><div class="bar"></div>{{ totalXP | number }}</td>
					<td class="money">
						<span>{{ totalMoney | number }} <span class="hab"></span></span>
					</td>
					<td v-if="$store.getters.admin" class="money">
						<span>{{ totalTime }}&nbsp;ms</span>
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
	import { Fight, FightContext, FightType, ReportFarmer } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import ReportLeekRow from './report-leek-row.vue'

	@Component({
		components: {ReportLeekRow}
	})
	export default class ReportBlock extends Vue {
		@Prop({required: true}) fight!: Fight
		@Prop({required: true}) title!: string
		@Prop({required: true}) leeks!: any
		@Prop({required: true}) farmer!: any
		@Prop({required: true}) team!: any
		@Prop({required: true}) flags!: any
		FightType = FightType
		FightContext = FightContext

		get totalLevel() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.level, 0)
		}
		get totalXP() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.xp, 0)
		}
		get totalMoney() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.money, 0)
		}
		get totalTime() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.aiTime, 0).toFixed(3)
		}
		get currentBar() {
			const totalXP = this.team.next_xp - this.team.prev_xp
			const newLevel = this.team.cur_xp - this.team.xp < this.team.prev_xp
			const oldXP = newLevel ? 0 : this.team.cur_xp - this.team.xp - this.team.prev_xp
			return Math.floor(100 * oldXP / totalXP)
		}
		get newBar() {
			const totalXP = this.team.next_xp - this.team.prev_xp
			const newLevel = this.team.cur_xp - this.team.xp < this.team.prev_xp
			const newXPInCurrentLevel = newLevel ? this.team.cur_xp - this.team.prev_xp : this.team.xp
			return Math.floor(100 * newXPInCurrentLevel / totalXP)
		}
	}
</script>

<style lang="scss" scoped>
	.report {
		width: 100%;
		margin-bottom: 10px;
		background: #f8f8f8;
	}
	th {
		border: 1px solid #ddd;
		padding: 8px;
		background: white;
		font-weight: normal;
		color: #777;
	}
	.total {
		color: #888;
		font-style: italic;
	}
	td {
		border: 1px solid #ddd;
		text-align: center;
		padding: 4px 8px;
	}
	.name {
		text-align: left;
		width: 180px;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.talent img {
		height: 20px;
		vertical-align: bottom;
	}
	.xp {
		text-align: left;
		min-width: 180px;
	}
	.current_xp {
		background-color: #bdbdbd;
	}
	.bar {
		width: 60%;
		height: 14px;
		display: inline-block;
		background: #ddd;
		margin-right: 10px;
		margin-bottom: 3px;
		vertical-align: bottom;
	}
	.bar span {
		height: 14px;
		display: inline-block;
		vertical-align: top;
	}
	.new_xp.team {
		background-color: #00aaa8;
	}
	.gain {
		width: 110px;
	}
	.alive {
		margin-left: 27px;
	}
	.flags {
		display: inline-block;
		padding-left: 15px;
	}
	.flag {
		display: inline-block;
		background: white;
		border-radius: 50%;
		padding: 7px;
		margin-bottom: 8px;
		margin-right: 6px;
		height: 22px;
		img {
			width: 22px;
			vertical-align: bottom;
		}
	}
</style>