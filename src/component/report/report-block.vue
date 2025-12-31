<template>
	<div>
		<h3><v-icon>{{ icon }}</v-icon> {{ title }}</h3>
		<div class="flags">
			<v-tooltip v-for="flag in flags" :key="flag">
				<template v-slot:activator="{ props }">
					<div class="flag card" v-bind="props">
						<img :src="'/image/fight_flag/flag_' + flag + '.svg'">
					</div>
				</template>
				{{ $t('flag.flag_' + flag) }}
			</v-tooltip>
		</div>

		<table v-if="fight.type === FightType.FARMER" class="report">
			<tr>
				<th>{{ $t('main.farmer') }}</th>
				<th></th>
				<th v-if="fight.context !== FightContext.TEST && fight.context !== FightContext.CHALLENGE" class="gain">{{ $t('main.talent') }}</th>
			</tr>
			<tr v-if="farmer">
				<td class="name">
					<span class="alive">
						<router-link :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id" v-slot="{ props }" :bottom="true">
								<span v-bind="props">{{ farmer.name }}</span>
							</rich-tooltip-farmer>
						</router-link>
					</span>
				</td>
				<td></td>
				<td v-if="fight.context !== FightContext.TEST && fight.context !== FightContext.CHALLENGE" class="talent">
					<img src="/image/talent.png">
					{{ farmer.talent }}
					<span v-if="farmer.talent_gain >= 0">+ {{ farmer.talent_gain }}</span>
					<span v-else>- {{ -farmer.talent_gain }}</span>
				</td>
			</tr>
		</table>

		<div v-else-if="fight.type === FightType.TEAM" class="scroll-x">
			<table class="report">
				<tr>
					<th>{{ $t('main.team') }}</th>
					<th>{{ $t('main.level') }}</th>
					<th>{{ $t('main.xp') }}</th>
					<th v-if="fight.context !== FightContext.TEST && fight.context !== FightContext.CHALLENGE" class="gain">{{ $t('main.talent') }}</th>
				</tr>
				<tr v-if="team">
					<td class="name">
						<span class="alive">
							<router-link :to="'/team/' + team.id">{{ team.name }}</router-link>
						</span>
					</td>
					<td class="level">{{ team.level }}</td>
					<td class="xp">
						<v-tooltip>
							<template v-slot:activator="{ props }">
								<div class="bar" v-bind="props">
									<span :style="{width: currentBar + '%'}" class="current_xp"></span>
									<span :style="{width: newBar + '%'}" class="new_xp team"></span>
								</div>
							</template>
							{{ $filters.number(team.cur_xp) }} / {{ $filters.number(team.next_xp) }}
						</v-tooltip>
						<span>{{ $filters.number(team.xp) }}</span>
					</td>
					<td v-if="fight.context !== FightContext.TEST && fight.context !== FightContext.CHALLENGE" class="talent">
						<img src="/image/talent.png">
						{{ team.talent }}
						<span v-if="team.talent_gain >= 0">+ {{ team.talent_gain }}</span>
						<span v-else>- {{ -team.talent_gain }}</span>
					</td>
				</tr>
			</table>
		</div>

		<div class="scroll-x">
			<table class="report">
				<tr>
					<th>{{ $t('main.leek') }}</th>
					<th>{{ $t('main.level') }}</th>
					<!-- <th v-if="$store.getters.admin">Power</th> -->
					<th>{{ $t('main.xp') }}</th>
					<th class="gain">{{ $t('main.habs') }}</th>
					<th v-if="fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="resources">{{ $t('main.resources') }}</th>
					<th v-if="fight.type === FightType.SOLO && fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="gain">{{ $t('main.talent') }}</th>
					<!-- <th class="gain">Opérations</th> -->
					<!-- <th v-if="$store.getters.admin" class="gain">Time</th> -->
				</tr>
				<report-leek-row v-for="(leek, l) in leeks" :key="l" :leek="leek" :fight="fight" />
				<tr v-if="fight.type !== FightType.SOLO" class="total">
					<td class="name"><span class="alive">{{ $t('main.total') }}</span></td>
					<td class="level">{{ totalLevel }}</td>
					<!-- <td v-if="$store.getters.admin" class="power">{{ $filters.number(totalPower) }}</td> -->
					<td class="xp"><div class="bar"></div>{{ $filters.number(totalXP) }}</td>
					<td class="money">
						<span>{{ $filters.number(totalMoney) }} <span class="hab"></span></span>
					</td>
					<td v-if="fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="resources"></td>
					<!-- <td class="gain">{{ $filters.number(totalOpes) }}</td> -->
					<!-- <td v-if="$store.getters.admin" class="gain">{{ totalTime }} s</td> -->
				</tr>
			</table>
		</div>
	</div>
</template>

<script lang="ts">
	import { Fight, FightContext, FightType, ReportFarmer } from '@/model/fight'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import ReportLeekRow from './report-leek-row.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Options({
		components: { ReportLeekRow, RichTooltipFarmer }
	})
	export default class ReportBlock extends Vue {
		@Prop({required: true}) fight!: Fight
		@Prop({required: true}) icon!: string
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
		get totalPower() {
			return Math.round(this.leeks.reduce((sum: number, leek: any) => sum + Math.pow(leek.level, 4.2), 0))
		}
		get totalMoney() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.money, 0)
		}
		get totalOpes() {
			return this.leeks.reduce((sum: number, leek: any) => sum + leek.opes, 0)
		}
		get totalTime() {
			return Math.round(this.leeks.reduce((sum: number, leek: any) => sum + leek.time, 0) / 1000000) / 1000
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
		background: var(--pure-white);
	}
	th {
		border: 1px solid var(--border);
		padding: 8px;
		background: var(--background-header);
		font-weight: normal;
	}
	.total {
		color: var(--text-color-secondary);
		font-style: italic;
	}
	td {
		border: 1px solid var(--border);
		text-align: center;
		padding: 4px 8px;
		white-space: nowrap;
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
		background: var(--background-disabled);
	}
	.bar {
		width: 70%;
		height: 14px;
		display: inline-block;
		margin-right: 10px;
		margin-bottom: 3px;
		vertical-align: bottom;
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 7px;
	}
	.bar span {
		height: 12px;
		display: inline-block;
		vertical-align: top;
		// border-radius: 7px;
		&:first-child {
			border-top-left-radius: 7px;
			border-bottom-left-radius: 7px;
		}
		&:last-child {
			border-top-right-radius: 7px;
			border-bottom-right-radius: 7px;
		}
	}
	.new_xp.team {
		background-color: #00aaa8;
	}
	.gain {
		width: 110px;
	}
	.resources {
		width: 200px;
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
		background: var(--pure-white);
		border-radius: 50%;
		padding: 7px;
		margin-bottom: 8px;
		margin-right: 6px;
		height: 36px;
		img {
			width: 22px;
			vertical-align: bottom;
		}
	}
	body.dark .flag img {
		filter: invert(1);
	}
</style>
