<template lang="html">
	<div>
		<div class="page-header page-bar">
			<div v-if="fight">
				<h1>{{ fight.title }}</h1>
				<div class="info">{{ fight.date | date }}</div>
			</div>
		</div>

		<panel class="first">
			<div slot="content" class="fight">
				<player :key="fight_id" :fight-id="fight_id" :required-width="playerWidth" :required-height="playerHeight" @fight="fightLoaded" @resize="resize" />
			</div>
		</panel>

		<div v-if="fight" class="fight-info">
			<center v-if="fight.type === FightType.BATTLE_ROYALE">
				<span v-for="(farmer, f, i) in fight.farmers1" :key="f">
					<span v-if="i !== 0" class="br-versus">VS</span>
					<router-link :to="'/farmer/' + farmer.id">
						<rich-tooltip-farmer :id="farmer.id">
							<div class="farmer">
								<avatar :farmer="farmer" /><br>
								<span class="name">{{ farmer.name }}</span>
							</div>
						</rich-tooltip-farmer>
					</router-link>
				</span>
			</center>
			<table v-else>
				<tr>
					<td>
						<router-link v-for="farmer in fight.farmers1" :key="farmer.id" :disabled="farmer.id > 0" :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id" v-slot="{ on: rich }">
								<div class="farmer" v-on="rich">
									<avatar :farmer="farmer" /><br>
									<span class="name">
										<tooltip>
											<template v-slot:activator="{ on }">
												<span v-if="farmer.id === fight.starter" class="arrow" v-on="on">▶</span>
											</template>
											{{ $t('starter') }}
										</tooltip>
										{{ farmer.name }}
									</span>
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</td>
					<td class="versus">VS</td>
					<td>
						<router-link v-for="farmer in fight.farmers2" :key="farmer.id" :event="farmer.id > 0 ? 'click' : ''" :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id" v-slot="{ on: rich }">
								<div class="farmer" v-on="rich">
									<avatar :farmer="farmer" /><br>
									<span class="name">
										<tooltip>
											<template v-slot:activator="{ on }">
												<span v-if="farmer.id === fight.starter" class="arrow" v-on="on">▶</span>
											</template>
											{{ $t('starter') }}
										</tooltip>
										{{ farmer.name }}
									</span>
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</td>
				</tr>
			</table>
		</div>

		<panel v-if="fight" :title="$t('comments') + ' (' + fight.comments.length + ')'" icon="mdi-comment-multiple-outline">
			<div slot="actions" class="views-counter">
				{{ $tc('n_views', fight.views) }}
			</div>
			<comments :comments="fight.comments" @comment="comment" />
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<template v-if="$store.state.connected">
					<div class="tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span class="report-button">{{ $t('warning.report') }}</span>
					</div>
				</template>
			</div>
		</div>
		<report-dialog v-if="fight" v-model="reportDialog" :leeks="reportLeeks" :reasons="reasons" :fight="fight.id" />
	</div>
</template>

<script lang="ts">
	import { Comment } from '@/model/comment'
	import { Farmer } from '@/model/farmer'
	import { Fight, FightType, Report } from '@/model/fight'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: "fight", i18n: {} })
	export default class FightPage extends Vue {
		fight_id: string | null = null
		fight: Fight | null = null
		loaded: boolean = false
		first_farmer!: number
		getDelay: any
		error: any
		queue: any
		playerWidth: number = 0
		playerHeight: number = 0
		FightType = FightType
		large: boolean = false
		reportDialog: boolean = false
		reasons = [Warning.RUDE_SAY, Warning.INCORRECT_LEEK_NAME, Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR]

		get reportLeeks() {
			if (!this.fight) { return [] }
			const leeks = []
			for (const leek of this.fight.leeks1) {
				leeks.push({...leek, farmer: this.fight.farmers1[leek.farmer]})
			}
			for (const leek of this.fight.leeks2) {
				leeks.push({...leek, farmer: this.fight.farmers2[leek.farmer]})
			}
			return leeks
		}

		created() {
			this.update()
			this.$root.$on('resize', () => this.resize())
			setTimeout(() => this.resize(), 50)
		}

		@Watch('$route.params.id')
		update() {
			this.fight_id = this.$route.params.id
			if (localStorage.getItem('fight/large') === null) { localStorage.setItem('fight/large', 'true') }
			LeekWars.flex = localStorage.getItem('fight/large') === 'true'
		}

		resize() {
			Vue.nextTick(() => {
				const RATIO = 1.7
				const reference = document.querySelector(LeekWars.flex ? '.app-center' : '.app-wrapper') as HTMLElement
				const offset = LeekWars.flex ? 40 + 24 : 24
				if (reference) {
					if (!LeekWars.mobile) {
						const height = Math.min(window.innerHeight - 128, Math.round((reference.offsetWidth - offset) / RATIO))
						this.playerWidth = Math.round(height * RATIO)
						this.playerHeight = height
					} else {
						this.playerWidth = window.innerWidth
						this.playerHeight = this.playerWidth / RATIO + 60
					}
				}
			})
		}

		destroyed() {
			LeekWars.flex = false
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
				LeekWars.post('fight/comment', {fight_id: this.fight.id, comment: comment.comment}).then(data => {
					if (this.fight) {
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
	#app.app .page-bar .info {
		display: none;
	}
	.game:fullscreen {
		max-height: 100%;
	}
	.fight-info {
		margin-right: 12px;
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
		white-space: nowrap;
	}
	.fight-info .farmer .arrow {
		display: inline-block;
		margin-top: -1px;
		vertical-align: top;
		margin-right: 2px;
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
