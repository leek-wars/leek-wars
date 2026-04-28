<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<div v-if="fight">
				<h1>{{ fight.title }}</h1>
				<div class="info">{{ $filters.date(fight.date) }}</div>
			</div>
			<div class="tabs">
				<div v-if="fight_id === 'local'" class="tab" @click="reload">
					<v-icon>mdi-refresh</v-icon>
					Recharger
				</div>
			</div>
		</div>

		<panel class="first">
			<template #content>
				<div class="fight" :style="{minWidth: playerWidth + 'px', minHeight: playerHeight + 'px'}">
					<player ref="player" v-if="fight_id" :key="fight_id" :fight-id="fight_id" :required-width="playerWidth" :required-height="playerHeight" :horizontal="playerHorizontal" :start-turn="startTurn" :start-action="startAction" @unlock-trophy="unlockTrophy" @fight="fightLoaded" @resize="resize" />
				</div>
			</template>
		</panel>

		<div v-if="fight" class="fight-info">
			<div class="center" v-if="fight.type === FightType.BATTLE_ROYALE">
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
			</div>
			<table v-else>
				<tr>
					<td :class="{'arena-many-players': fight.type === FightType.CHEST_HUNT || fight.type === FightType.COLOSSUS}">
						<router-link v-for="farmer in fight.farmers1" :key="farmer.id" :disabled="farmer.id > 0" :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id">
								<div class="farmer">
									<avatar :farmer="farmer" /><br>
									<span class="name">
										<v-tooltip>
											<template #activator="{ props }">
												<span v-if="farmer.id === fight.starter" class="arrow" v-bind="props">▶</span>
											</template>
											{{ $t('starter') }}
										</v-tooltip>
										{{ farmer.name }}
									</span>
								</div>
							</rich-tooltip-farmer>
						</router-link>
						<router-link v-if="fight.type === FightType.TEAM && fight.team1" :to="'/team/' + fight.team1.id">
							<rich-tooltip-team :id="fight.team1.id">
								<div class="farmer">
									<emblem :team="fight.team1" /><br>
									<span class="name">
										{{ fight.team1.name }}
									</span>
								</div>
							</rich-tooltip-team>
						</router-link>
					</td>
					<td class="versus">VS</td>
					<td>
						<router-link v-if="fight.team2 && fight.type === FightType.TEAM" :to="'/team/' + fight.team2.id">
							<rich-tooltip-team :id="fight.team2.id">
								<div class="farmer">
									<emblem :team="fight.team2" /><br>
									<span class="name">
										{{ fight.team2.name }}
									</span>
								</div>
							</rich-tooltip-team>
						</router-link>
						<router-link v-for="farmer in fight.farmers2" :key="farmer.id" :event="farmer.id > 0 ? 'click' : ''" :to="'/farmer/' + farmer.id">
							<rich-tooltip-farmer :id="farmer.id">
								<div class="farmer">
									<avatar :farmer="farmer" /><br>
									<span class="name">
										<v-tooltip>
											<template #activator="{ props }">
												<span v-if="farmer.id === fight.starter" class="arrow" v-bind="props">▶</span>
											</template>
											{{ $t('starter') }}
										</v-tooltip>
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
			<template #actions>
				<span class="views-counter">{{ $tc('n_views', fight.views || 0) }}</span>
			</template>
			<comments :comments="fight.comments" @comment="comment" />
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<template v-if="$store.state.connected">
					<div class="tab" @click="reportDialog = true">
						<img src="/image/icon/flag.png">
						<span class="report-button">{{ $t('warning.report') }}</span>
					</div>
					<div v-if="$store.getters.admin" class="tab" @click="toggleLoading">
						<v-icon>mdi-loading</v-icon>
						<span>Loading screen</span>
					</div>
				</template>
			</div>
		</div>
		<report-dialog v-if="fight" v-model="reportDialog" :leeks="reportLeeks" :reasons="reasons" :fight="fight.id" />
	</div>
</template>

<script lang="ts">
import { defineAsyncComponent } from 'vue'
import { locale } from '@/locale'
import { mixins } from '@/model/i18n'
const Player = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/player/player.${locale}.i18n`))
export default {
	name: 'fight',
	i18n: {},
	mixins: [...mixins],
	components: { 'player': Player }
}
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import type { Comment } from '@/model/comment'
import { type Fight, FightType } from '@/model/fight'
import type { Leek } from '@/model/leek'
import { LeekWars } from '@/model/leekwars'
import { Warning } from '@/model/moderation'
import { store } from '@/model/store'
import { GROUND_PADDING_LEFT, GROUND_PADDING_RIGHT, GROUND_PADDING_TOP } from '../player/game/ground'
import Comments from '@/component/comment/comments.vue'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
import ReportDialog from '@/component/moderation/report-dialog.vue'
import { emitter } from '@/model/vue'

const { t } = useI18n()
const route = useRoute()

const fight_id = ref<string | null>(null)
const fight = ref<Fight | null>(null)
const playerWidth = ref(0)
const playerHeight = ref(0)
const playerHorizontal = ref(false)
const reportDialog = ref(false)
const reasons = [Warning.RUDE_SAY, Warning.INCORRECT_LEEK_NAME, Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR]
const trophyQueue: any[] = []
const fightNotificationQueue: any[] = []
const player = useTemplateRef<any>('player')

const reportLeeks = computed(() => {
	if (!fight.value) return []
	const leeks: any[] = []
	for (const leek of fight.value.leeks1) {
		leeks.push({ ...leek, farmer: fight.value.farmers1[leek.farmer] })
	}
	for (const leek of fight.value.leeks2) {
		leeks.push({ ...leek, farmer: fight.value.farmers2[leek.farmer] })
	}
	return leeks
})

const startTurn = computed(() => parseInt('' + route.query.turn, 10) || parseInt('' + route.query.t, 10) || 1)
const startAction = computed(() => parseInt('' + route.query.action, 10) || parseInt('' + route.query.a, 10) || 0)

function toggleLoading() {
	if (player.value) player.value.loaded = !player.value.loaded
}

function reload() {
	fight_id.value = null
	nextTick(() => {
		fight_id.value = route.params.id as string
	})
}

function resize() {
	LeekWars.lightBar = window.innerWidth / window.innerHeight > 1

	const reference = document.querySelector('.app-center') as HTMLElement
	const offset = 40 + 24
	const controls = 36
	const padding_bottom = LeekWars.mobile ? 5 : 105
	if (reference) {
		if (LeekWars.mobile) {
			if (window.innerWidth > window.innerHeight) {
				const height = Math.min(window.innerHeight, Math.round(reference.offsetWidth / 1.5))
				const padding_top = (height - padding_bottom) * GROUND_PADDING_TOP
				playerWidth.value = Math.min(window.innerWidth, Math.round((height - padding_bottom - padding_top) * 2)) + 2 * controls
				playerHeight.value = height
				playerHorizontal.value = true
			} else {
				const ratio = 1.3
				const width = Math.min(reference.offsetWidth, Math.round((window.innerHeight - 56) * ratio))
				playerWidth.value = width
				playerHeight.value = Math.round(width / ratio)
				playerHorizontal.value = false
			}
		} else {
			const maxWidth = reference.offsetWidth - offset
			const theoricalHeight1 = (maxWidth - GROUND_PADDING_RIGHT - GROUND_PADDING_LEFT) / 2
			const padding_top = theoricalHeight1 / (1 - GROUND_PADDING_TOP) - theoricalHeight1
			const theoricalHeight = Math.round(theoricalHeight1 + padding_bottom + padding_top + controls)
			const height = Math.min(window.innerHeight - 128, theoricalHeight)
			playerWidth.value = maxWidth
			playerHeight.value = height
			playerHorizontal.value = false
		}
	}
}

function fightLoaded(f: Fight) {
	fight.value = f

	f.title = f.team1_name + ' vs ' + f.team2_name
	if (f.type === FightType.BATTLE_ROYALE) f.title = t('battle_royale') as string
	else if (f.type === FightType.WAR) f.title = t('war') as string
	else if (f.type === FightType.CHEST_HUNT) f.title = t('chest_hunt') as string
	else if (f.type === FightType.COLOSSUS) f.title = t('colossus') as string
	else if (f.type === FightType.BOSS) f.title = t('entity.' + f.boss_name) as string
	LeekWars.setTitle(f.title, LeekWars.formatDate(f.date))

	const leeks: {[key: number]: Leek} = {}
	for (const leek of f.leeks1) leeks[leek.id] = leek
	for (const leek of f.leeks2) leeks[leek.id] = leek
}

function onTrophy(trophy: any) {
	trophyQueue.push(trophy)
}

function onFightNotification(message: any) {
	fightNotificationQueue.push(message)
}

function unlockTrophy(trophy: number) {
	for (let m = 0; m < trophyQueue.length; ++m) {
		const message = trophyQueue[m]
		if (parseInt(message.parameters[0], 10) === trophy) {
			store.commit('notification', message)
			trophyQueue.splice(m, 1)
			m--
		}
	}
}

function comment(c: Comment) {
	if (fight.value) {
		LeekWars.post('fight/comment', { fight_id: fight.value.id, comment: c.comment }).then(() => {
			if (fight.value) fight.value.comments.push(c)
		})
	}
}

watch(() => route.params.id, () => {
	fight_id.value = route.params.id as string
}, { immediate: true })

LeekWars.flex = true
resize()

onMounted(() => {
	emitter.on('resize', resize)
	emitter.on('trophy', onTrophy)
	emitter.on('fight_notification', onFightNotification)
})

onUnmounted(() => {
	LeekWars.flex = false
	LeekWars.lightBar = false
	emitter.off('resize', resize)
	emitter.off('trophy', onTrophy)
	emitter.off('fight_notification', onFightNotification)

	for (const message of trophyQueue) store.commit('notification', message)
	for (const message of fightNotificationQueue) store.commit('notification', message)
})
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
		cursor: pointer;
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
	.fight-info .arena-many-players {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		max-width: 250px;
	}
	.fight-info .arena-many-players .farmer {
		display: inline-block;
		width: 50px;
		img { width: 32px; height: 32px; }
		.name { font-size: 9px; }
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
	#app.app {
		.br-versus {
			padding: 0;
		}
		.fight-info .farmer {
			.name {
				font-size: 11px;
			}
			img {
				width: 50px;
				height: 50px;
			}
		}
	}
</style>
