<template lang="html">
	<div :class="{generating: fight.status == 0, win: fight.result == 'win', defeat: fight.result == 'defeat'}" class="fight">
		<div v-if="fight.type == FightType.BATTLE_ROYALE" class="fighters">
			<div class="center">
				<router-link :to="'/fight/' + id">
					<img v-if="fight.status == 0" src="/image/icon/gearing.png">
					<img v-else src="/image/icon/garden.png">
				</router-link>
			</div>
			<div class="fighter">Battle royale</div>
		</div>
		<div class="fighters">
			<router-link v-if="fight.type == FightType.SOLO" :to="'/leek/' + fight.leeks1[0].id">
				<div class="fighter">{{ fight.leeks1[0].name }}</div>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer1">
				<div class="fighter">({{ fight.farmer1_name }})</div>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team1">
				<div class="fighter">[{{ fight.team1_name }}]</div>
			</router-link>
			<div class="center">
				<router-link :to="'/fight/' + fight.id">
					<img v-if="fight.status == 0" src="/image/icon/gearing.png">
					<img v-else-if="fight.context == FightContext.CHALLENGE" src="/image/icon/flag.png">
					<img v-else src="/image/icon/garden.png">
				</router-link>
			</div>
			<router-link v-if="fight.type == FightType.SOLO" :to="'/leek/' + fight.leeks2[0].id">
				<div class="fighter">{{ fight.leeks2[0].name }}</div>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer2">
				<div class="fighter">({{ fight.farmer2_name }})</div>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team2">
				<div class="fighter">[{{ fight.team2_name }}]</div>
			</router-link>
		</div>
		<div class="fight-time">{{ LeekWars.formatDuration(fight.date) }}</div>
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