<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<div v-if="fight" class="page-title">
				<page-icon name="fight" fallback="mdi-sword" />
				<div class="page-title-text">
				<h1>{{ fight.title }}</h1>
				<div class="info">{{ $filters.date(fight.date) }}</div>
				</div>
			</div>
			<div class="tabs">
				<!-- Retour au contexte d'ou vient le combat (#4810). Le rapport le proposait
				     deja, mais la page du combat lui-meme etait un cul-de-sac : on ouvrait un
				     combat depuis l'arbre d'un tournoi et il n'y avait plus aucun chemin de
				     retour vers ce tournoi. -->
				<router-link v-if="backLink" :to="backLink.to" class="tab">
					<v-icon>{{ backLink.icon }}</v-icon>
					<span>{{ backLink.label }}</span>
				</router-link>
				<div v-if="fight_id === 'local'" class="tab" @click="reload">
					<v-icon>mdi-refresh</v-icon>
					Recharger
				</div>
			</div>
		</div>

		<panel class="first">
			<template #content>
				<div class="fight" :style="{minWidth: playerWidth + 'px', minHeight: playerHeight + 'px'}">
					<player v-if="fight_id" ref="playerRef" :key="fight_id" :fight-id="fight_id" :required-width="playerWidth" :required-height="playerHeight" :horizontal="playerHorizontal" :start-turn="startTurn" :start-action="startAction" :mobile-panels="mobilePanels" @unlock-trophy="unlockTrophy" @fight="fightLoaded" @resize="resize" />
				</div>
				<!-- Ordre des poireaux et actions, sous le lecteur en mobile (#4860). Le conteneur
				     est ici et non dans le lecteur, dont la racine a une hauteur fixe : rien ne
				     peut se poser dessous depuis l'intérieur. Il est vide, c'est le hud qui y
				     téléporte ses deux blocs, pour que leur logique reste en un seul endroit. -->
				<div v-if="LeekWars.mobile" ref="mobilePanelsRef" class="mobile-panels"></div>
			</template>
		</panel>

		<div v-if="fight" class="fight-info">
			<div v-if="isFlatLayout" class="center">
				<span v-for="(farmer, i) in flatFarmers" :key="farmer.id">
					<span v-if="i !== 0" class="br-versus">VS</span>
					<component :is="farmer.id > 0 ? 'router-link' : 'span'" :to="'/farmer/' + farmer.id">
						<rich-tooltip-farmer :id="farmer.id">
							<div class="farmer">
								<avatar :farmer="farmer" /><br>
								<span class="name">{{ farmer.name }}</span>
							</div>
						</rich-tooltip-farmer>
					</component>
				</span>
			</div>
			<table v-else>
				<tr>
					<td>
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
				<span class="views-counter">{{ $t('n_views', fight.views || 0) }}</span>
			</template>
			<comments :comments="fight.comments" @comment="comment" />
		</panel>

		<div class="page-footer page-bar">
			<div class="tabs">
				<template v-if="$store.state.connected">
					<div class="tab" @click="showReport = true">
						<v-icon>mdi-flag</v-icon>
						<span class="report-button">{{ $t('warning.report') }}</span>
					</div>
					<div v-if="$store.getters.admin" class="tab" @click="toggleLoading">
						<v-icon>mdi-loading</v-icon>
						<span>Loading screen</span>
					</div>
				</template>
			</div>
		</div>
		<report-dialog v-if="fight" v-model="showReport" :leeks="reportLeeks" :reasons="reasons" :fight="fight.id" />
	</div>
</template>

<script lang="ts" setup>
	import { locale } from '@/locale'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { Comment } from '@/model/comment'
	import { Fight, FightContext, FightType } from '@/model/fight'
	import { LeekWars } from '@/model/leekwars'
	import { Warning } from '@/model/moderation'
	import { store } from '@/model/store'
	import { GROUND_PADDING_LEFT, GROUND_PADDING_RIGHT, GROUND_PADDING_TOP } from '../player/game/ground'
	import Comments from '@/component/comment/comments.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
	import { useRoute } from 'vue-router'
	import { emitter } from '@/model/emitter'

	const ReportDialog = defineAsyncComponent(() => import('@/component/moderation/report-dialog.vue'))
	const Player = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/player/player.${locale}.i18n`))

	defineOptions({ name: 'Fight', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('fight')
	const route = useRoute()
	const playerRef = useTemplateRef<{ loaded: boolean }>('playerRef')
	// Cible du Teleport du hud (#4860) : nulle au premier rendu, le hud attend qu'elle existe.
	const mobilePanels = useTemplateRef<HTMLElement>('mobilePanelsRef')

	const fight_id = ref<string | null>(null)
	const fight = ref<Fight | null>(null)
	const playerWidth = ref(0)
	const playerHeight = ref(0)
	const playerHorizontal = ref(false)
	const showReport = ref(false)
	const reasons = [Warning.RUDE_SAY, Warning.INCORRECT_LEEK_NAME, Warning.INCORRECT_FARMER_NAME, Warning.INCORRECT_AVATAR]
	type NotificationData = { id: number, type: number, date: number, parameters: string[], new: boolean }
	const trophyQueue: NotificationData[] = []
	const fightNotificationQueue: NotificationData[] = []

	function toggleLoading() {
		if (playerRef.value) {
			playerRef.value.loaded = !playerRef.value.loaded
		}
	}

	/**
	 * Ou renvoyer le spectateur quand il a fini de regarder (#4810).
	 *
	 * Memes destinations et memes libelles que les boutons du rapport, pour que les deux
	 * pages d'un meme combat repondent pareil. Le tournoi est ouvert a tous, y compris aux
	 * visiteurs : c'est justement de la qu'on arrive sur un combat qu'on n'a pas joue. Le
	 * potager et l'editeur demandent un compte, ils ne s'affichent donc que connecte.
	 */
	const backLink = computed(() => {
		const f = fight.value
		if (!f) return null
		// tournament vaut -1 quand le combat n'appartient a aucun tournoi.
		if (f.context === FightContext.TOURNAMENT && f.tournament && f.tournament > 0) {
			return { to: '/tournament/' + f.tournament, icon: 'mdi-trophy', label: t('back_to_tournament') }
		}
		if (!store.state.connected) return null
		if (f.context === FightContext.GARDEN) return { to: '/garden', icon: 'mdi-undo', label: t('back_to_garden') }
		if (f.context === FightContext.TEST) return { to: '/editor', icon: 'mdi-undo', label: t('back_to_editor') }
		return null
	})

	const isFlatLayout = computed(() => {
		if (!fight.value) return false
		return fight.value.type === FightType.BATTLE_ROYALE || fight.value.type === FightType.CHEST_HUNT
	})

	const flatFarmers = computed(() => {
		if (!fight.value) return []
		return [...Object.values(fight.value.farmers1), ...Object.values(fight.value.farmers2)]
	})

	const reportLeeks = computed(() => {
		if (!fight.value) { return [] }
		const leeks = []
		for (const leek of fight.value.leeks1) {
			leeks.push({...leek, farmer: fight.value.farmers1[leek.farmer as unknown as number]})
		}
		for (const leek of fight.value.leeks2) {
			leeks.push({...leek, farmer: fight.value.farmers2[leek.farmer as unknown as number]})
		}
		return leeks
	})

	const startTurn = computed(() => parseInt('' + route.query.turn, 10) || parseInt('' + route.query.t, 10) || 1)
	const startAction = computed(() => parseInt('' + route.query.action, 10) || parseInt('' + route.query.a, 10) || 0)

	LeekWars.flex = true
	resize()

	watch(() => route.params.id, (id) => {
		fight_id.value = id as string
	}, { immediate: true })

	function horizontalInset(el: Element | null): number {
		if (!el) return 0
		const style = getComputedStyle(el)
		return (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
	}

	function horizontalBorders(el: Element | null): number {
		if (!el) return 0
		const style = getComputedStyle(el)
		return (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0)
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
		// Ce que la colonne retire au lecteur : le retrait de `.app-center` (20 px de
		// chaque côté), celui de `.page-wrapper` (12 px de chaque côté en v2, zéro en
		// v3) et le trait du panneau (v3). C'était `40 + 24` en dur : en v3, où le
		// voile de 12 px n'existe plus, le lecteur restait 24 px plus étroit que la
		// colonne et laissait une bande vide (retour de Pierre, 2026-09-07).
		const offset = horizontalInset(reference) + horizontalInset(document.querySelector('.page-wrapper')) + horizontalBorders(reference.querySelector('.panel.first'))
		const controls = 36
		const padding_bottom = LeekWars.mobile ? 5 : 105
		if (reference) {
			if (LeekWars.mobile) {
				if (window.innerWidth > window.innerHeight) {
					// Landscape
					const height = Math.min(window.innerHeight, Math.round(reference.offsetWidth / 1.5))
					const padding_top = (height - padding_bottom) * GROUND_PADDING_TOP
					playerWidth.value = Math.min(window.innerWidth, Math.round((height - padding_bottom - padding_top) * 2)) + 2 * controls
					playerHeight.value = height
					playerHorizontal.value = true
				} else {
					// Portrait
					const ratio = 1.3
					const width = Math.min(reference.offsetWidth, Math.round((window.innerHeight - 56) * ratio))
					playerWidth.value = width
					playerHeight.value = Math.round(width / ratio)
					playerHorizontal.value = false
				}
			} else {
				// Desktop
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

	onMounted(() => {
		emitter.on('resize', resize)
		emitter.on('trophy', onTrophy)
		emitter.on('fight_notification', onFightNotification)
	})

	onUnmounted(() => {
		emitter.off('resize', resize)
		emitter.off('trophy', onTrophy)
		emitter.off('fight_notification', onFightNotification)

		// Notifications de trophées restants
		for (const message of trophyQueue) {
			store.commit('notification', message)
		}
		for (const message of fightNotificationQueue) {
			store.commit('notification', message)
		}
	})

	function fightLoaded(loadedFight: Fight) {
		fight.value = loadedFight

		loadedFight.title = loadedFight.team1_name + ' vs ' + loadedFight.team2_name
		if (loadedFight.type === FightType.BATTLE_ROYALE) {
			loadedFight.title = t('battle_royale') as string
		} else if (loadedFight.type === FightType.WAR) {
			loadedFight.title = t('war') as string
		} else if (loadedFight.type === FightType.CHEST_HUNT) {
			loadedFight.title = t('chest_hunt') as string
		} else if (loadedFight.type === FightType.COLOSSUS) {
			loadedFight.title = t('colossus') as string
		} else if (loadedFight.type === FightType.BOSS) {
			loadedFight.title = t('entity.' + loadedFight.boss_name) as string
		}
		LeekWars.setTitle(loadedFight.title, LeekWars.formatDate(loadedFight.date))
	}

	function onTrophy(trophy: unknown) {
		trophyQueue.push(trophy as NotificationData)
	}

	function onFightNotification(message: unknown) {
		fightNotificationQueue.push(message as NotificationData)
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

	function comment(comment: Comment) {
		if (fight.value) {
			LeekWars.post('fight/comment', {fight_id: fight.value.id, comment: comment.comment}).then(() => {
				if (fight.value) {
					fight.value.comments.push(comment)
				}
			})
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
	// Accueille l'ordre des poireaux et les actions téléportés par le hud en mobile (#4860).
	// Aucun décor ici : les deux blocs portent le leur, et le conteneur reste donc invisible
	// tant que le combat charge, au lieu d'afficher une bande vide.
	.mobile-panels {
		display: flex;
		flex-direction: column;
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
		color: var(--grey-13);
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
		color: var(--grey-13);
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
	// L'avatar est une enveloppe autour de l'image (cadre biseauté du thème v3) :
	// dimensionner l'<img> ne contraint plus rien, c'est l'enveloppe qui porte la
	// taille. L'emblème d'équipe, lui, est resté une image seule.
	.fight-info .farmer .avatar, .fight-info .farmer .emblem {
		width: 75px;
		height: 75px;
	}
	.fight-info .br-versus {
		line-height: 75px;
		display: inline-block;
		padding-top: 10px;
		vertical-align: top;
		color: var(--grey-13);
	}
	.views-counter {
		color: var(--white);
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
			.avatar, .emblem {
				width: 50px;
				height: 50px;
			}
		}
	}
</style>
