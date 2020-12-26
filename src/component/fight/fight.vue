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
						<rich-tooltip-farmer :id="farmer.id" v-slot="{ on: rich }">
							<div class="farmer" v-on="rich">
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

		<panel v-if="fight" :title="$t('main.comments') + ' (' + fight.comments.length + ')'" icon="mdi-comment-multiple-outline">
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
	import { locale } from '@/locale'
	import { Comment } from '@/model/comment'
	import { Farmer } from '@/model/farmer'
	import { Fight, FightType, Report } from '@/model/fight'
	import { Leek } from '@/model/leek'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { GROUND_PADDING_BOTTOM, GROUND_PADDING_LEFT, GROUND_PADDING_RIGHT, GROUND_PADDING_TOP } from '../player/game/ground'
	const Player = () => import(/* webpackChunkName: "[request]" */ `@/component/player/player.${locale}.i18n`)

	@Component({ name: "fight", components: {
		Player
	}})
	export default class FightPage extends Vue {
		fight_id: string | null = null
		fight: Fight | null = null
		loaded: boolean = false
		first_farmer!: number
		getDelay: any
		error: any
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

		mounted() {
			LeekWars.flex = true
			this.$root.$on('resize', this.resize)
			setTimeout(() => this.resize(), 50)
		}

		@Watch('$route.params.id', {immediate: true})
		update() {
			this.fight_id = this.$route.params.id
		}

		resize() {
			Vue.nextTick(() => {
				const reference = document.querySelector('.app-center') as HTMLElement
				const offset = 40 + 24
				const controls = 36
				if (reference) {
					if (LeekWars.mobile) {
						if (window.innerWidth > window.innerHeight) {
							// Landscape
							const height = Math.min(window.innerHeight - 56, Math.round(reference.offsetWidth / 2))
							const padding_top = (height - controls - GROUND_PADDING_BOTTOM) * GROUND_PADDING_TOP
							this.playerWidth = Math.round((height - controls - GROUND_PADDING_BOTTOM - padding_top) * 2)
							this.playerHeight = height
						} else {
							// Portrait
							const ratio = 1.3
							const width = Math.min(reference.offsetWidth, Math.round((window.innerHeight - 56) * ratio))
							this.playerWidth = width
							this.playerHeight = Math.round(width / ratio)
						}
					} else {
						// Desktop
						const maxWidth = reference.offsetWidth - offset
						const theoricalHeight1 = (maxWidth - GROUND_PADDING_RIGHT - GROUND_PADDING_LEFT) / 2
						const padding_top = theoricalHeight1 / (1 - GROUND_PADDING_TOP) - theoricalHeight1
						const theoricalHeight = Math.round(theoricalHeight1 + GROUND_PADDING_BOTTOM + padding_top + controls)
						const height = Math.min(window.innerHeight - 128, theoricalHeight)
						this.playerWidth = maxWidth
						this.playerHeight = height
					}
				}
			})
		}

		destroyed() {
			LeekWars.flex = false
			this.$root.$off('resize', this.resize)
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
		margin-bottom: 10px;
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
