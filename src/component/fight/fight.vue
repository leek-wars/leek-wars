<template lang="html">
	<div id="fight-page">
		<div class="page-header page-bar">
			<div v-if="fight">
				<h1>{{ fight.title }}</h1>
				<div class="info">{{ fight.date | date }}</div>
			</div>
			<div class="tabs">
				<div class="tab action" icon="volume_up" @click="toggleSound">
					<i class="material-icons">volume_up</i>
					<span>{{ $t('sound_activated') }}</span>
				</div>
			</div>
		</div>
	
		<div class="panel">
			<div id="fight" class="content">
				<player :fight-id="fight_id" :required-width="playerWidth" :required-height="playerHeight" @fight="fightLoaded" />
			</div>
		</div>
	
		<div v-if="fight" id="fight-info">
			<center v-if="fight.type === FightType.BATTLE_ROYALE">
				<span v-for="(farmer, f, i) in fight.farmers1" :key="f">
					<span v-if="i !== 0" class="br-versus">VS</span>
					<router-link :to="'/farmer/' + farmer.id">
						<div class="farmer">
							<avatar :farmer="farmer" /><br>
							<span class="name">{{ farmer.name }}</span>
						</div>
					</router-link>
				</span>
			</center>
			<table v-else>
				<tr>
					<td>
						<router-link v-for="farmer in fight.farmers1" :key="farmer.id" :to="'/farmer/' + farmer.id">
							<div class="farmer">
								<avatar :farmer="farmer" /><br>
								<span class="name">{{ farmer.name }}</span>
							</div>
						</router-link>
					</td>
					<td id="versus">VS</td>
					<td>
						<router-link v-for="farmer in fight.farmers2" :key="farmer.id" :to="'/farmer/' + farmer.id">
							<div class="farmer">
								<avatar :farmer="farmer" /><br>
								<span class="name">{{ farmer.name }}</span>
							</div>
						</router-link>
					</td>
				</tr>
			</table>
		</div>
	
		<div v-if="fight" class="panel">
			<div class="header">
				<h2>{{ $t('comments') }}</h2>
				<div class="right">
					<div id="views-counter">
						{{ $t('n_views', [fight.views]) }}
					</div>
				</div>
			</div>
			<div class="content">
				<comments :comments="fight.comments" @comment="comment" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Comment } from '@/model/comment'
	import { Fight, FightType } from '@/model/fight'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "fight", i18n: {} })
	export default class FightPage extends Vue {
		fight_id: number | null = null
		fight: Fight | null = null
		loaded: boolean = false
		first_farmer!: number
		getDelay: any
		error: any
		queue: any
		playerWidth: number = 0
		playerHeight: number = 0
		FightType = FightType

		created() {
			this.update()
			this.$root.$on('resize', () => this.resize())
			setTimeout(() => this.resize(), 50)
		}

		@Watch('$route.params.id')
		update() {
			console.log("update", this.$route.params.id)
			const id = this.$route.params.id
			this.fight_id = parseInt(id, 10)

			// if (id == 'local') {
			// 	var local_fight = {
			// 		context: 3,
			// 		date: 0,
			// 		farmers1: {1: {id: 1}},	farmers2: {1: {id: 1}},
			// 		id: 0,
			// 		leeks1: [],	leeks2: [],
			// 		report: null,
			// 		status: 1,
			// 		team1_name: "A", team2_name: "B",
			// 		tournament: 0,
			// 		type: 0,
			// 		winner: 1,
			// 		year: 2016,
			// 		// data: window['__FIGHT_DATA']
			// 	}
			// 	console.log("Local fight: ", local_fight)
			// 	callback({success: true, fight: local_fight})
			// } else {
			// 	LeekWars.get('fight/get/' + id).then(data => callback(data.data))
			// }
		}

		resize() {
			const RATIO = 1.7
			const fight = document.getElementById('fight')
			if (fight) {
				console.log(fight.offsetWidth)
				this.playerWidth = Math.round(fight.offsetWidth)
				this.playerHeight = Math.round(this.playerWidth / RATIO)
			}
		}

		fightLoaded(fight: Fight) {
			this.fight = fight

			this.fight.title = this.fight.team1_name + ' vs ' + this.fight.team2_name
			if (this.fight.type === FightType.BATTLE_ROYALE) {
				this.fight.title = this.$t('battle_royale') as string
			}
			LeekWars.setTitle(this.fight.title, LeekWars.formatDate(this.fight.date))

			const leeks: {[key: number]: Leek} = {}
			for (const leek of this.fight.leeks1) {
				leeks[leek.id] = leek
			}
			for (const leek of this.fight.leeks2) {
				leeks[leek.id] = leek
			}
		}
		toggleSound() {
			console.log("toggle sound")
		}
		comment(comment: Comment) {
			if (this.fight) {
				LeekWars.post('fight/comment', {fight_id: this.fight.id, comment: comment.comment}).then((data) => {
					if (data.data.success && this.fight) {
						this.fight.comments.push(comment)
					}
				})
			}
		}
		
		fileInput() {
			// $('#fight-page #file-input').on('change', function() {
			// 	var file = this.files[0]
			// 	if (file) {
			// 		var reader = new FileReader()
			// 		reader.readAsText(file, "UTF-8")
			// 		reader.onload = function (evt) {
			// 			var json = evt.target.result
			// 			_.log(json)
			// 			game.init({data: JSON.parse(json)})
			// 		}
			// 		reader.onerror = function (evt) {
			// 			_.log("error reading file")
			// 		}
			// 	}
			// })
		}
	}
</script>

<style lang="scss" scoped>
	#fight {
		padding: 0;
	}
	#app.app #fight-page .page-bar .info {
		display: none;
	}
	#fight-page #loading table {
		width: 100%;
		height: 400px;
	}
	#fight-page #loading table td {
		text-align: center;
	}
	@keyframes rotation {
		from {transform: rotate(0deg);}
		to   {transform: rotate(359deg);}
	}
	#fight-page #error, #fight-page #error-client {
		display: none;
		padding-top: 70px;
		text-align: center;
	}
	#fight-page #error-client-message {
		color: red;
	}
	#fight-page #browser {
		display: none;
		padding-top: 70px;
		text-align: center;
		padding-bottom: 30px;
	}
	#fight-page #browser-list {
		padding: 20px;
	}
	#fight-page #browser .browser {
		width: 160px;
		display: inline-block;
		text-align: center;
	}
	#fight-page .team-td {
		width: 470px;
	}
	#fight-page .leek {
		display: inline-block;
		margin: 6px;
		width: 140px;
	}
	#fight-page .leek img {
		max-width: 90%;
	}
	#fight-page .vs {
		font-size: 30px;
	}
	#fight-page .leek .name {
		font-size: 18px;
	}
	#fight-page .level {
		color: #555;
	}
	
	#fight-page #logs-wrapper {
		position: absolute;
		bottom: 0;
		right: 150px; width: 500px;
		overflow: hidden;
		height: 100px;
	}
	#fight-page #logs-wrapper2 {
		position: relative;
		text-align: right;
		width: 100%;
		height: 100%;
	}
	#fight-page #logs {
		position: absolute;
		bottom: 0;
		right: 0;
		text-align: right;
		overflow: hidden;
	}
	#fight-page #logs .log {
		display: inline-block;
		font-family: monospace;
		padding: 0 6px;
		text-align: left;
		font-size: 12px;
	}
	#fight-page #logs:hover .log {
		background-color: rgba(255,255,255, 0.5);
	}
	#fight-page #debug {
		position: absolute;
		top: 0;	left: 150px;
		text-align: left;
		display: none;
	}
	#game:full-screen {
		max-height: 100%;
	}
	#top-part-wrapper {
		background-color: #d1d1d1;
		position: absolute;
		top: -8px;
		left: 50%;
		right: 50%;
		width: 170px;
		margin-left: -85px;
	}
	#top-part {
		position: relative;
		height: 25px;
	}
	#top-part:before {
		position: absolute;
		right: -25px;
		top: 0;
		content: "";
		width: 0;
		height: 0;
		border-bottom: 25px solid transparent;
		border-left: 25px solid #D1D1D1;
	}
	#top-part:after {
		position: absolute;
		left: -25px;
		top: 0;
		content: "";
		width: 0;
		height: 0;
		border-bottom: 25px solid transparent;
		border-right: 25px solid #D1D1D1;
	}
	#turn {
		font-size: 18px;
		color: #555;
	}

	#left-part {
		position: absolute;
		top: 0; left: 0; bottom: 0;
		text-align: left;
		overflow: hidden;
	}

	#team1-rect {
		display: inline-block;
		width: 20px;
		height: 20px;
		background-color: #0000AB;
	}
	#right-part {
		position: absolute;
		top: 20px; right: 0;
		text-align: right;
	}
	#team2-rect {
		display: inline-block;
		width: 20px;
		height: 20px;
		background-color: #DC0000;
	}
	#team1-leeks, #team2-leeks {
		padding-top: 10px;
		width: 135px;
	}
	#team2-leeks {
		text-align: right;
	}
	.leek-info {
		width: 130px;
		position: relative;
		display: inline-block;
		margin-bottom: 10px;
		overflow: hidden;
		height: 60px;
	}
	.leek-info[summon='true'] {
		width: 110px;
		margin-top: -5px;
	}
	.leek-info.left[summon='true'] {
		margin-left: 20px;
	}
	.leek-info.right[summon='true'] {
		margin-right: 20px;
	}
	.leek-info.left .background {
		position: absolute;
		width: 300%;
		height: 300%;
		top: -50px;
		right: -65px;
		content: "";
		transform: rotate(-45deg);
		background: rgba(209, 209, 209, 0.6);
	}
	.leek-info.right .background {
		position: absolute;
		width: 300%;
		height: 300%;
		top: -50px;
		left: -65px;
		content: "";
		transform: rotate(45deg);
		background: rgba(209, 209, 209, 0.6);
	}
	.leek-info.current {
		width: 135px;
	}
	.leek-info[summon='true'].current {
		width: 110px;
	}
	.leek-info.left.current .background {
		right: -60px;
	}
	.leek-info.right.current .background {
		left: -60px;
	}
	.leek-info.current .background {
		background: rgba(209, 209, 209, 1);
		border: 5px solid #0a0;
	}
	.leek-info.dead {
		opacity: 0.4;
	}
	.leek-info.left .infos {
		padding-left: 8px;
	}
	.leek-info.right .infos {
		padding-right: 8px;
	}
	.leek-info .infos {
		z-index: 10;
		position: absolute;
		top: 0; right: 0; left: 0;
	}
	.leek-info[summon='true'] .name {
		font-size: 13px;
		padding: 2px 0;
	}
	.leek-info img {
		width: 16px;
	}
	.leek-info .life {
		color: red;
		vertical-align: bottom;
		margin-bottom: 3px;
		display: inline-block;
	}
	.leek-info .total-life {
		color: red;
		font-size: 12px;
		vertical-align: bottom;
		margin-bottom: 5px;
		display: inline-block;
	}
	.leek-info.left .life {
		margin-left: 4px;
	}
	.leek-info.right .total-life {
		margin-right: 4px;
	}
	.leek-info .tp {
		color: #FF7F01;
		vertical-align: bottom;
		margin-bottom: 3px;
		display: inline-block;
	}
	.leek-info.left .tp {
		margin-left: 4px;
		margin-right: 10px;
	}
	.leek-info.right .tp {
		margin-right: 4px;
		margin-left: 10px;
	}
	.leek-info .mp {
		color: green;
		vertical-align: bottom;
		margin-bottom: 3px;
		display: inline-block;
	}
	.leek-info.left .mp {
		margin-left: 4px;
	}
	.leek-info.right .mp {
		margin-right: 4px;
	}
	#details {
		position: absolute;
		bottom: 100px;
		left: 0;
		right: 0;
		z-index: 100;
		pointer-events: none;
	}
	
	#fight-info table {
		width: 100%;
	}
	#versus {
		width: 80px;
		font-size: 20px;
		text-align: center;
		color: #eee;
	}
	#fight-info td:nth-child(1) {
		text-align: right;
	}
	#fight-info td:nth-child(1), #fight-info td:nth-child(3) {
		width: 46%;
	}
	#fight-info .farmer {
		display: inline-block;
		text-align: center;
		color: #eee;
		margin-top: 8px;
		margin-bottom: 16px;
		margin-left: 5px;
		margin-right: 5px;
		font-size: 13px;
	}
	#fight-info .farmer .name {
		max-width: 75px;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 12px;
	}
	#fight-info .farmer img {
		width: 75px;
		height: 75px;
	}
	#fight-info .br-versus {
		line-height: 75px;
		display: inline-block;
		padding-top: 10px;
		vertical-align: top;
		color: #eee;
	}
	#fight-settings {
		position: absolute;
		max-width: 300px;
		display: none;
	}
	#fight-settings .fight-setting label {
		display: block;
		padding: 6px;
		cursor: pointer;
	}
	#fight-settings .fight-setting:hover {
		background: black;
	}
	#progress-bar-wrapper {
		height: 20px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
	}
	#progress-bar-turn {
		position: absolute;
		display: inline-block;
		margin-top: -30px;
	}
	#progress-bar {
		height: 6px;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
		cursor: pointer;
		background: #eee;
		transition: all 0.2s;
		white-space: nowrap;
	}
	#progress-bar-wrapper:hover #progress-bar {
		height: 12px;
	}
	#progress-bar .bar {
		height: 100%;
		background-color: #5FAD1B;
		transition: all 0.3s;
		display: inline-block;
		vertical-align: top;
	}
	#progress-bar .circle {
		width: 8px;
		height: 8px;
		margin-top: -4px;
		margin-left: -7px;
		display: inline-block;
		border-radius: 50%;
		background: #ccc;
		vertical-align: top;
		border: 4px solid #f2f2f2;
		transition: all 0.2s;
	}
	#progress-bar-wrapper:hover .circle {
		width: 14px;
		height: 14px;
	}
	@media screen and (max-width: 799px) {
		#timeline {
			display: none;
		}
		#life-bar {
			display: none;
		}
		#left-part {
			display: none;
		}
	}
	#views-counter {
		color: white;
		font-size: 20px;
		padding: 6px 12px;
	}
</style>
