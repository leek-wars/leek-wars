<template>
	<tr>
		<td class="name">
			<span v-if="leek.dead" class="dead"></span>
			<span v-else class="alive"></span>
			<router-link v-if="leek.id != -1" :to="'/leek/' + leek.id">{{ leek.name }}</router-link>
			<span v-else>{{ leek.name }}</span>
		</td>
		<td class="level">{{ leek.level }}</td>
		<td class="xp">
			<v-tooltip :open-delay="0" :close-delay="0" bottom>
				<div slot="activator" class="bar">
					<span :style="{width: currentBar + '%'}" class="current_xp"></span>
					<span :style="{width: newBar + '%'}" class="new_xp"></span>
				</div>
				{{ leek.cur_xp | number }} / {{ leek.next_xp | number }}
			</v-tooltip>
			<span>{{ leek.xp | number }}</span>
			<span v-if="leek.bonus > 1" class="bonus">x{{ leek.bonus }}</span>
		</td>
		<td class="money">
			<span>{{ leek.money | number }} <span class="hab"></span></span>
		</td>
		<td v-if="leek.talent" class="talent">
			<img src="/image/talent.png">
			{{ leek.talent }}
			<span v-if="leek.talent_gain >= 0">+{{ leek.talent_gain }}</span>
			<span v-else>-{{ -leek.talent_gain }}</span>
		</td>
		<td v-if="$store.state.farmer.admin" class="gain">
			{{ leek.aiTime | number }} ms
		</td>
	</tr>
</template>

<script lang="ts">
	import { ReportLeek } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({})
	export default class ReportLeekRow extends Vue {
		@Prop({required: true}) leek!: ReportLeek

		get currentBar() {
			const totalXP = this.leek.next_xp - this.leek.prev_xp
			const newLevel = this.leek.cur_xp - this.leek.xp < this.leek.prev_xp
			const oldXP = newLevel ? 0 : this.leek.cur_xp - this.leek.xp - this.leek.prev_xp
			return Math.floor(100 * oldXP / totalXP)
		}
		get newBar() {
			const totalXP = this.leek.next_xp - this.leek.prev_xp
			const newLevel = this.leek.cur_xp - this.leek.xp < this.leek.prev_xp
			const newXPInCurrentLevel = newLevel ? this.leek.cur_xp - this.leek.prev_xp : this.leek.xp
			return Math.floor(100 * newXPInCurrentLevel / totalXP)
		}
	}
</script>

<style lang="scss" scoped>
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
	.level {
		width: 80px;
	}
	.talent img {
		width: 18px;
		vertical-align: top;
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
	.gain {
		width: 110px;
	}
	.alive {
		margin-left: 27px;
	}
	.dead {
		background-image: url("/image/cross.png");
		width: 15px;
		height: 20px;
		display: inline-block;
		margin-right: 12px;
		vertical-align: bottom;
	}
	.xp {
		text-align: left;
		min-width: 180px;
	}
	.money {
		min-width: 100px;
	}
	.current_xp {
		background-color: #bdbdbd;
	}
	.new_xp {
		background-color: #5fad1b;
	}
	.bonus {
		background-color: #0075df;
		color: white;
		font-weight: bold;
		padding: 0 4px;
		margin-left: 10px;
		border-radius: 3px;
	}
	.talent-bonus {
		background-color: #888;
		color: white;
		font-weight: bold;
		padding: 0 4px;
		margin-left: 10px;
		border-radius: 3px;
	}
</style>