<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div v-if="fight">
				<h1>{{ fight.title }}</h1>
				<div class="info">{{ fight.date | date }}</div>
			</div>
		</div>
	
		<div class="panel">
			<div class="fight content">
				<player :fight-id="fight_id" :required-width="playerWidth" :required-height="playerHeight" @fight="fightLoaded" @resize="resize" />
			</div>
		</div>
	
		<div v-if="fight" class="fight-info">
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
					<td class="versus">VS</td>
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
					<div class="views-counter">
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
			Vue.nextTick(() => {
				const RATIO = 1.7
				const fight = document.querySelector('.fight') as HTMLElement
				if (fight) {
					this.playerWidth = Math.round(fight.offsetWidth)
					this.playerHeight = Math.round(this.playerWidth / RATIO)
				}
			})
		}

		destroyed() {
			LeekWars.large = false
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
			// $('#file-input').on('change', function() {
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
	.fight.content {
		padding: 0;
	}
	#app.app .page-bar .info {
		display: none;
	}
	.game:fullscreen {
		max-height: 100%;
	}
	.fight-info table {
		width: 100%;
	}
	.versus {
		width: 80px;
		font-size: 20px;
		text-align: center;
		color: #eee;
	}
	.fight-info td:nth-child(1) {
		text-align: right;
	}
	.fight-info td:nth-child(1), .fight-info td:nth-child(3) {
		width: 46%;
	}
	.fight-info .farmer {
		display: inline-block;
		text-align: center;
		color: #eee;
		margin-top: 8px;
		margin-bottom: 16px;
		margin-left: 5px;
		margin-right: 5px;
		font-size: 13px;
	}
	.fight-info .farmer .name {
		max-width: 75px;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 12px;
	}
	.fight-info .farmer img {
		width: 75px;
		height: 75px;
	}
	.fight-info .br-versus {
		line-height: 75px;
		display: inline-block;
		padding-top: 10px;
		vertical-align: top;
		color: #eee;
	}
	.views-counter {
		color: white;
		font-size: 20px;
		padding: 6px 12px;
	}
</style>
