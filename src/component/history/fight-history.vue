<template lang="html">
	<div :class="{generating: fight.status == 0, win: fight.result == 'win', defeat: fight.result == 'defeat', draw: fight.result == 'draw'}" class="fight">
		<div v-if="fight.type == FightType.BATTLE_ROYALE || fight.type == FightType.WAR || fight.type == FightType.CHEST_HUNT || fight.type == FightType.COLOSSUS" class="fighters">
			<div class="fighter left"><div>{{ arenaLabel[0] }}</div></div>
			<rich-tooltip-fight :id="fight.id" v-slot="{ props: tooltipProps }">
				<router-link v-bind="tooltipProps" :to="'/fight/' + fight.id" class="center">
					<v-icon v-if="fight.status == 0" class="timersand">mdi-timer-sand-empty</v-icon>
					<v-icon v-else>mdi-sword-cross</v-icon>
				</router-link>
			</rich-tooltip-fight>
			<div class="fighter right"><div>{{ arenaLabel[1] }}</div></div>
		</div>
		<div v-else class="fighters">
			<router-link v-if="fight.type == FightType.SOLO && fight.leeks1[0]" :to="'/leek/' + fight.leeks1[0].id" class="fighter">
				<rich-tooltip-leek :id="fight.leeks1[0].id" v-slot="{ props }">
					<div v-bind="props">{{ fight.leeks1[0].name }}</div>
				</rich-tooltip-leek>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer1" class="fighter">
				<rich-tooltip-farmer :id="fight.farmer1" v-slot="{ props }">
					<div v-bind="props">({{ fight.farmer1_name }})</div>
				</rich-tooltip-farmer>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team1" class="fighter">
				<rich-tooltip-composition :id="fight.composition1 || 0" v-slot="{ props }">
					<div v-bind="props">[{{ fight.team1_name }}]</div>
				</rich-tooltip-composition>
			</router-link>
			<div v-else-if="fight.type == FightType.BOSS" class="fighter">
				<div>{{ $t('main.n_leeks', [fight.leeks1.length]) }}</div>
			</div>
			<rich-tooltip-fight :id="fight.id" v-slot="{ props: tooltipProps }">
				<router-link v-bind="tooltipProps" :to="'/fight/' + fight.id" class="center">
					<v-icon v-if="fight.status == 0" class="timersand">mdi-timer-sand-empty</v-icon>
					<v-icon v-else-if="fight.context == FightContext.CHALLENGE">mdi-flag-outline</v-icon>
					<v-icon v-else-if="fight.type == FightType.BOSS">mdi-crown</v-icon>
					<v-icon v-else-if="fight.context == FightContext.TOURNAMENT">mdi-trophy-outline</v-icon>
					<img v-else src="/image/icon/black/garden.png">
				</router-link>
			</rich-tooltip-fight>
			<router-link v-if="fight.type == FightType.SOLO && fight.leeks2[0]" :to="'/leek/' + fight.leeks2[0].id" class="fighter">
				<rich-tooltip-leek :id="fight.leeks2[0].id" v-slot="{ props }">
					<div v-bind="props">{{ fight.leeks2[0].name }}</div>
				</rich-tooltip-leek>
			</router-link>
			<router-link v-else-if="fight.type == FightType.FARMER" :to="'/farmer/' + fight.farmer2" class="fighter">
				<rich-tooltip-farmer :id="fight.farmer2" v-slot="{ props }">
					<div v-bind="props">({{ fight.farmer2_name }})</div>
				</rich-tooltip-farmer>
			</router-link>
			<router-link v-else-if="fight.type == FightType.TEAM" :to="'/team/' + fight.team2" class="fighter">
				<rich-tooltip-composition :id="fight.composition2 || 0" v-slot="{ props }">
					<div v-bind="props">[{{ fight.team2_name }}]</div>
				</rich-tooltip-composition>
			</router-link>
			<div v-else-if="fight.type == FightType.BOSS" class="fighter">
				<div>{{ $t('entity.' + fight.boss_name) }}</div>
			</div>
		</div>
		<div v-if="fight.status == 0" class="progress-bar" :title="(progress || 0) + '%'">
			<div class="progress-bar-fill" :style="{ width: (progress || 0) + '%' }"></div>
		</div>
		<div class="time">{{ LeekWars.formatDuration(fight.date) }}</div>
		<div class="info">
			<span v-if="fight.levelups"><v-icon >mdi-arrow-up-thick</v-icon>{{ fight.levelups }}</span>
			<span v-if="fight.trophies"><v-icon >mdi-trophy</v-icon>{{ fight.trophies }}</span>
			<span v-if="fight.comments"><v-icon >mdi-chat</v-icon>{{ fight.comments }}</span>
			<span v-if="fight.chests"><v-icon >mdi-treasure-chest</v-icon>{{ fight.chests }}</span>
			<span v-if="fight.rareloot"><v-icon >mdi-leaf</v-icon>{{ fight.rareloot }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Fight, FightContext, FightType } from '@/model/fight'
import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
import RichTooltipLeek from '@/component/rich-tooltip/rich-tooltip-leek.vue'
import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'
import RichTooltipFight from '@/component/rich-tooltip/rich-tooltip-fight.vue'

defineOptions({ name: 'FightHistory' })

const props = defineProps<{
	fight: Fight
	progress?: number
}>()

const { t } = useI18n()

const arenaLabel = computed<[string, string]>(() => {
	switch (props.fight.type) {
		case FightType.WAR: return [t('main.n_leeks', [props.fight.leeks1?.length || 0]) as string, t('main.n_leeks', [props.fight.leeks2?.length || 0]) as string]
		case FightType.CHEST_HUNT: return [t('main.n_leeks', [props.fight.leeks1?.length || 0]) as string, t('main.n_chests', [props.fight.leeks2?.length || 0]) as string]
		case FightType.COLOSSUS: {
			const colossusName = props.fight.leeks2?.[0]?.name || 'Colosse'
			return [t('main.n_leeks', [props.fight.leeks1?.length || 0]) as string, colossusName]
		}
		default: return ['Battle', 'Royale']
	}
})
</script>

<style lang="scss" scoped>
	.fight {
		margin: 5px;
		// color: #333;
		text-align: center;
		border-radius: var(--radius-small);
		font-size: 15px;
		height: 42px;
		white-space: nowrap;
		background: var(--white);
		position: relative;
		.center {
			background: rgba(255, 255, 255, 0.3);
			&:hover {
				background: rgba(255, 255, 255, 0.75);
			}
			flex: 42px 0 0;
			height: 42px;
			img {
				width: 22px;
				height: 22px;
				margin: 10px 6px;
				opacity: 0.8;
			}
			i {
				color: var(--grey-2);
				line-height: 42px;
				font-size: 26px;
				margin: 8px;
				&.timersand {
					animation: rotate 2s linear infinite;
				}
			}
		}
		.fighters {
			height: 42px;
			display: flex;
		}
		.fighter {
			padding: 4px 0;
			height: 30px;
			line-height: 30px;
			flex: 1;
			overflow: hidden;
			&.left {
				text-align: right;
			}
			&.right {
				text-align: left;
			}
			div {
				padding: 0 6px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
		.time {
			position: absolute;
			bottom: 2px;
			right: 8px;
			color: var(--text-color-secondary);
			font-size: 11px;
			text-align: right;
		}
		.info {
			position: absolute;
			bottom: 1px;
			left: 5px;
			font-size: 11px;
			display: flex;
			gap: 3px;
			.v-icon {
				font-size: 14px;
			}
			span {
				display: flex;
				align-items: center;
				gap: 2px;
			}
		}
	}
	/* ====== Peau v2 : les aplats pastel historiques, au pixel près ====== */
	body.v2 {
		.win {
			background-color: #b6f182;
		}
		.draw {
			background: #dcdcdc;
		}
		.defeat {
			background-color: #ffb3ae;
		}
		.generating {
			background: var(--pure-white);
		}
		&.dark {
			.win {
				background-color: #3c651b;
			}
			.draw {
				background: var(--grey-3);
			}
			.defeat {
				background-color: #76342f;
			}
		}
	}

	/* ====== v3 : rangée neutre, liseré de résultat ======
	   Même langue que la vue tableau du même historique (fights-history-table) :
	   la couleur du résultat tient dans un liseré de 4 px et une teinte légère
	   de la rangée, pas dans un aplat plein. L'aplat venait du v2 ; posé sur les
	   surfaces sombres du thème il donnait des pastilles délavées, et sa version
	   sombre (#3c651b, #76342f) ne descend d'aucun jeton — les deux vues d'un
	   même historique se coloraient donc différemment. Les jetons --result-*
	   existent dans les deux thèmes et portent déjà le tableau. */
	body:not(.v2) {
		.fight {
			--result: var(--text-color-faint);
			background: var(--background-row);
			border: 1px solid var(--border-strong);
			box-shadow: inset 4px 0 0 var(--result);
			/* Cartes plus hautes en v3 (demande de Pierre, 2026-08-31) : 52 px
			   au lieu de 42, le v2 garde sa hauteur au pixel. Les noms gagnent
			   du rembourrage pour rester au centre optique, l'heure garde son
			   coin bas. */
			height: 52px;
			.center {
				flex-basis: 52px;
				height: 52px;
				img {
					margin: 15px 6px;
				}
				i {
					line-height: 52px;
				}
			}
			.fighters {
				height: 52px;
			}
			.fighter {
				padding: 9px 0;
			}
		}
		.win {
			--result: var(--result-win);
			background: color-mix(in srgb, var(--result-win) 14%, var(--background-row));
		}
		.draw {
			--result: var(--result-draw);
			background: color-mix(in srgb, var(--result-draw) 10%, var(--background-row));
		}
		.defeat {
			--result: var(--result-defeat);
			background: color-mix(in srgb, var(--result-defeat) 14%, var(--background-row));
		}
		/* En génération : liseré éteint, la barre de progression porte l'info. */
		.generating {
			--result: var(--text-color-faint);
			background: var(--background-row);
		}
		/* Le bouton central se détache par le trait, pas par un voile blanc
		   (invisible en clair, éclaircissant en sombre). */
		.fight .center {
			background: none;
			border-left: 1px solid var(--border);
			border-right: 1px solid var(--border);
			&:hover {
				background: color-mix(in srgb, var(--text-color) 10%, transparent);
			}
			i {
				color: var(--text-color-secondary);
			}
		}
	}
	/* L'icône du potager est une encre noire : invisible sur la rangée sombre.
	   Même remède que les onglets de la barre de page (leekwars-shell-v3). */
	body.dark:not(.v2) .fight .center img {
		filter: invert(1);
	}
	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--background-disabled);
		border-bottom-left-radius: var(--radius-small);
		border-bottom-right-radius: var(--radius-small);
		overflow: hidden;
	}
	.progress-bar-fill {
		height: 100%;
		background: var(--primary-surface);
		transition: width 0.4s ease;
	}
	@keyframes rotate {
		0% { transform: rotate(0); }
		20% { transform: rotate(180deg); }
		100% { transform: rotate(180deg); }
	}
</style>