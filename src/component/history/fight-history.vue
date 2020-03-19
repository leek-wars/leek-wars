<template lang="html">
	<div :class="{generating: fight.status == 0, win: fight.result == 'win', defeat: fight.result == 'defeat', draw: fight.result == 'draw'}" class="fight">
		<div v-if="fight.type == FightType.BATTLE_ROYALE" class="fighters">
			<div class="center">
				<router-link :to="'/fight/' + fight.id">
					<img v-if="fight.status == 0" src="/image/icon/gearing.png">
					<img v-else src="/image/icon/garden.png">
				</router-link>
			</div>
			<div class="fighter">Battle royale</div>
		</div>
		<div v-else class="fighters">
			<router-link v-if="fight.type == FightType.SOLO" :to="'/leek/' + fight.leeks1[0].id">
				<rich-tooltip-leek :id="fight.leeks1[0].id" v-slot="{ on }">
					<div class="fighter" v-on="on">{{ fight.leeks1[0].name }}</div>
				</rich-tooltip-leek>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer1">
				<rich-tooltip-farmer :id="fight.farmer1" v-slot="{ on }">
					<div class="fighter" v-on="on">({{ fight.farmer1_name }})</div>
				</rich-tooltip-farmer>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team1">
				<div class="fighter">[{{ fight.team1_name }}]</div>
			</router-link>
			<div class="center">
				<router-link :to="'/fight/' + fight.id">
					<v-icon v-if="fight.status == 0">mdi-timer-sand-empty</v-icon>
					<img v-else-if="fight.context == FightContext.CHALLENGE" src="/image/icon/flag.png">
					<img v-else-if="fight.context == FightContext.TOURNAMENT" src="/image/icon/trophy.png">
					<img v-else src="/image/icon/garden.png">
				</router-link>
			</div>
			<router-link v-if="fight.type == FightType.SOLO" :to="'/leek/' + fight.leeks2[0].id">
				<rich-tooltip-leek :id="fight.leeks2[0].id" v-slot="{ on }">
					<div class="fighter" v-on="on">{{ fight.leeks2[0].name }}</div>
				</rich-tooltip-leek>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer2">
				<rich-tooltip-farmer :id="fight.farmer2" v-slot="{ on }">
					<div class="fighter" v-on="on">({{ fight.farmer2_name }})</div>
				</rich-tooltip-farmer>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team2">
				<div class="fighter">[{{ fight.team2_name }}]</div>
			</router-link>
		</div>
		<div class="time">{{ LeekWars.formatDuration(fight.date) }}</div>
	</div>
</template>

<script lang="ts">
	import { Fight, FightContext, FightType } from '@/model/fight'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: 'fight-history' })
	export default class FightHistory extends Vue {
		@Prop() fight!: Fight
		FightType = FightType
		FightContext = FightContext
	}
</script>

<style lang="scss" scoped>
	.fight {
		margin: 5px;
		color: #333;
		text-align: center;
		border-radius: 3px;
		font-size: 15px;
		height: 42px;
		white-space: nowrap;
		background: white;
		.center {
			display: inline-block;
			background: #555;
			width: 36px;
			height: 42px;
			margin-left: -4px;
			img {
				width: 22px;
				height: 22px;
				margin: 10px 6px;
			}
			i {
				color: white;
				line-height: 42px;
				animation: rotate 2s linear infinite;
			}
		}
		.fighters {
			height: 42px;
			margin: 0 auto;
		}
		.fighter {
			padding: 4px 6px;
			width: 109px;
			vertical-align: top;
			display: inline-block;
			overflow: hidden;
			text-overflow: ellipsis;
			height: 30px;
			line-height: 30px;
		}
		.fighter:last-child {
			margin-left: -4px;
		}
		.time {
			color: #888;
			font-size: 11px;
			margin-right: 5px;
			text-align: right;
			margin-top: -15px;
		}
	}
	.win {
		background-color: #b6f182;
	}
	.draw {
		background-color: #dcdcdc;
	}
	.defeat {
		background-color: #ffb3ae;
	}
	.generating {
		background-color: white;
	}
	@keyframes rotate {
		0% { transform: rotate(0); }
		20% { transform: rotate(180deg); }
		100% { transform: rotate(180deg); }
	}
</style>