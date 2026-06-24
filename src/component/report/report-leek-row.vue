<template>
	<tr :class="{ mine: isMyLeek }">
		<td class="name">
			<span v-if="leek.dead" class="dead"></span>
			<span v-else class="alive"></span>
			<router-link v-if="leek.id != -1" :to="'/leek/' + leek.id">
				<rich-tooltip-leek :id="leek.id" v-slot="{ props }" :bottom="true">
					<span v-bind="props">{{ leek.name }}</span>
				</rich-tooltip-leek>
			</router-link>
			<span v-else-if="leek.mob">{{ $t('entity.' + leek.name) }}</span>
			<span v-else>{{ leek.name }}</span>
		</td>
		<td class="level">{{ leek.level }}</td>
		<!-- <td v-if="$store.getters.admin" class="power">{{ $filters.number(Math.round(Math.pow(leek.level, 4.2))) }}</td> -->
		<td class="xp">
			<div class="xp-wrapper">
				<v-tooltip v-if="!leek.mob">
					<template #activator="{ props }">
						<div class="bar" v-bind="props">
							<span :style="{width: currentBar + '%'}" class="current_xp"></span>
							<span :style="{width: newBar + '%'}" class="new_xp"></span>
						</div>
					</template>
					{{ $filters.number(leek.cur_xp) }} / {{ $filters.number(leek.next_xp) }}
				</v-tooltip>
				<div v-else class="bar"></div>
				<span>{{ $filters.number(leek.xp || 0) }}</span>
				<span v-if="fight.report.bonus > 1" class="bonus">x{{ fight.report.bonus }}</span>
				<v-tooltip v-if="leek.xp_locked">
					<template #activator="{ props }">
						<v-icon v-bind="props" class="xp-blocked">mdi-lock</v-icon>
					</template>
					{{ $t('main.xp_blocked') }}
				</v-tooltip>
			</div>
		</td>
		<td class="money">
			<span>{{ $filters.number(leek.money || 0) }} <span class="hab"></span></span>
		</td>
		<td v-if="fight.context != FightContext.TEST && fight.context != FightContext.CHALLENGE" class="resources">
			<fight-resources :resources="leek.resources" />
		</td>
		<td v-if="fight.context !== FightContext.CHALLENGE && leek.talent !== undefined && leek.talent_gain !== undefined" class="talent">
			<img src="/image/talent.png">
			{{ leek.talent }}
			<span v-if="leek.talent_gain >= 0">+{{ leek.talent_gain }}</span>
			<span v-else>-{{ -leek.talent_gain }}</span>
		</td>
		<!-- <td class="gain">
			{{ $filters.number(leek.opes) }}
		</td> -->
		<!-- <td v-if="$store.getters.admin" class="gain">
			{{ $filters.number(leek.time / 1000) }}&nbsp;s
		</td> -->
	</tr>
</template>

<script setup lang="ts">
	import { Fight, FightContext, FightType, ReportLeek } from '@/model/fight'
	import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
	import FightResources from './fight-resources.vue'
	import { computed } from 'vue'
	import { store } from '@/model/store'

	const props = defineProps<{
		leek: ReportLeek
		fight: Fight
	}>()

	const currentBar = computed(() => {
		const totalXP = props.leek.next_xp - props.leek.prev_xp
		const newLevel = props.leek.cur_xp - props.leek.xp < props.leek.prev_xp
		const oldXP = newLevel ? 0 : props.leek.cur_xp - (props.leek.xp || 0) - props.leek.prev_xp
		return Math.floor(100 * oldXP / totalXP)
	})

	const newBar = computed(() => {
		const totalXP = props.leek.next_xp - props.leek.prev_xp
		const newLevel = props.leek.cur_xp - props.leek.xp < props.leek.prev_xp
		const newXPInCurrentLevel = newLevel ? props.leek.cur_xp - props.leek.prev_xp : props.leek.xp
		return Math.floor(100 * newXPInCurrentLevel / totalXP)
	})

	const isMyLeek = computed(() => {
		if (!store.state.farmer) { return false }
		return props.leek.id in store.state.farmer.leeks
	})
</script>

<style lang="scss" scoped>
	tr.mine td {
		background: var(--background);
		font-weight: bold;
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
	.level {
		width: 80px;
	}
	.power {
		width: 40px;
		text-align: right;
	}
	.talent img {
		width: 18px;
		vertical-align: top;
	}
	.bar {
		flex: 1;
		display: flex;
		height: 14px;
		background: var(--pure-white);
		border: 1px solid var(--border);
		border-radius: 7px;
	}
	.bar span {
		height: 12px;
		vertical-align: top;
		&:first-child {
			border-top-left-radius: 7px;
			border-bottom-left-radius: 7px;
		}
		&:last-child {
			border-top-right-radius: 7px;
			border-bottom-right-radius: 7px;
		}
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
	body.dark .dead {
		filter: invert(1);
	}
	.xp {
		min-width: 180px;
		.xp-wrapper {
			display: flex;
			align-items: center;
			gap: 10px;
		}
	}
	.money {
		min-width: 100px;
	}
	.current_xp {
		background: var(--background-disabled);
	}
	.new_xp {
		background-color: #5fad1b;
	}
	.bonus {
		background-color: #0075df;
		color: white;
		font-weight: bold;
		padding: 0 4px;
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
	.resources {
		padding: 0 5px;
		text-align: left;
		height: 29px;
	}
	.xp-blocked {
		font-size: 16px;
		color: #666;
	}
</style>