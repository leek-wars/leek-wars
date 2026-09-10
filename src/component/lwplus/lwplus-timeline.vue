<template>
	<panel :title="$t('title')" icon="mdi-medal-outline" class="lwplus-timeline">
		<loader v-if="loading" />
		<template v-else>
			<div class="pitch">{{ $t('pitch') }}</div>

			<!-- Où en est le joueur. Le compteur fait autorité sur la barre : celle-ci
			     ne mesure QUE la portion en cours entre deux paliers, pas le chemin
			     total — sinon les trois premiers mois paraissent insignifiants. -->
			<div class="summary">
				<div class="total">{{ totalLabel }}</div>
				<template v-if="nextIn !== null">
					<div class="bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
					<div class="next">{{ tier > 0 || seconds > 0 ? $t('next_in', [daysLabel(nextIn)]) : $t('not_started') }}</div>
				</template>
				<div v-else class="next done">{{ $t('all_done') }}</div>
			</div>

			<div class="rail">
				<div
					v-for="step in ladder"
					:key="step.tier"
					class="step"
					:class="{ unlocked: step.tier <= tier, next: step.tier === tier + 1 }">
					<div class="node">
						<v-icon v-if="step.tier <= tier">mdi-check</v-icon>
						<span v-else>{{ step.months }}</span>
					</div>
					<div class="body">
						<div class="head">
							<span class="name">{{ $t('tier_' + step.key) }}</span>
							<span class="months">{{ monthsLabel(step.months) }}</span>
						</div>
						<div class="rewards">
							<span v-for="(reward, r) in step.rewards" :key="r" class="reward" :class="{ pending: reward.pending }">
								<v-icon>{{ REWARD_ICON[reward.display] }}</v-icon>
								<span>{{ rewardLabel(reward) }}</span>
								<!-- Récompense décidée mais pas encore produite (chapeau à
								     modéliser, skin à dessiner). Elle sera remise
								     rétroactivement, donc on l'annonce au lieu de la cacher. -->
								<em v-if="reward.pending">{{ $t('soon') }}</em>
							</span>
						</div>
					</div>
				</div>
			</div>
		</template>
	</panel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'

defineOptions({ name: 'LwplusTimeline', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('lwplus-timeline')

interface Reward { type: string, display: string, level: string | null, pending: boolean }
interface Step { tier: number, key: string, seconds: number, months: number, rewards: Reward[] }
interface Loyalty {
	seconds: number
	tier: number
	// null quand l'échelle est terminée : plus aucun palier à viser.
	next_in: number | null
	palier_seconds: number
	ladder: Step[]
}

// Un genre de récompense = un glyphe, le même partout (ICONS.md). Écrits en toutes
// lettres pour que scripts/generate-mdi-icons.mjs les trouve au scan.
const REWARD_ICON: Record<string, string> = {
	trophy: 'mdi-trophy',
	hat: 'mdi-hat-fedora',
	skin: 'mdi-palette',
	potion: 'mdi-flask',
	// Même glyphe que la ligne « Badge de profil » du comparatif LW+.
	badge: 'mdi-shield-star',
	nickname: 'mdi-format-color-text',
}

const loading = ref(true)
const seconds = ref(0)
const tier = ref(0)
const nextIn = ref<number | null>(null)
const palierSeconds = ref(90 * 86400)
const ladder = ref<Step[]>([])

// Pluriel à la main, comme lwplus-packs : deux formes suffisent, et ça évite
// d'imposer une règle de pluriel à 17 fichiers de langue.
function monthsLabel(n: number) {
	return n === 1 ? t('months_one', [n]) : t('months_other', [n])
}
function daysLabel(remaining: number) {
	// Arrondi vers le haut : à 12 h du palier, il reste « 1 jour », pas « 0 ».
	const days = Math.max(1, Math.ceil(remaining / 86400))
	return days === 1 ? t('days_one', [days]) : t('days_other', [days])
}

// Le compteur du serveur est en secondes ; on l'affiche en mois de 30 jours pour
// coller aux paliers (90 jours = 3 mois), pas au calendrier.
const totalMonths = computed(() => Math.floor(seconds.value / (30 * 86400)))
const totalLabel = computed(() => {
	const n = totalMonths.value
	return n === 1 ? t('total_one', [n]) : t('total_other', [n])
})

// Avancement DANS le palier en cours, en pourcentage.
const progress = computed(() => {
	if (nextIn.value === null) { return 100 }
	const done = palierSeconds.value - nextIn.value
	return Math.max(0, Math.min(100, Math.round(done / palierSeconds.value * 100)))
})

function rewardLabel(reward: Reward) {
	if (reward.display === 'badge' && reward.level) { return t('reward_badge_' + reward.level) }
	return t('reward_' + reward.display)
}

onMounted(() => {
	LeekWars.get('subscription/get-loyalty').then((data: Loyalty) => {
		seconds.value = data.seconds
		tier.value = data.tier
		nextIn.value = data.next_in
		palierSeconds.value = data.palier_seconds
		ladder.value = data.ladder
		loading.value = false
	}).error(() => {
		// La chronologie est un bonus d'affichage : si l'appel échoue, la page LW+ et
		// la banque doivent rester utilisables. On retire le panneau, sans message.
		ladder.value = []
		loading.value = false
	})
})
</script>

<style lang="scss" scoped>
	// Même or que le reste de LW+ : les jetons --gold-bright / --rank-first du
	// système, jamais une couleur en dur — ils s'inversent seuls en sombre.
	.pitch {
		padding: 14px 14px 0;
		color: var(--text-color-secondary);
		font-size: 14px;
	}
	.summary {
		padding: 12px 14px 14px;
		.total {
			font-size: 22px;
			font-weight: 700;
			color: var(--rank-first);
		}
		.bar {
			margin-top: 8px;
			height: 6px;
			border-radius: var(--radius-pill);
			background: var(--background-secondary);
			overflow: hidden;
		}
		.fill {
			height: 100%;
			background: var(--gold-bright);
			transition: width 300ms ease;
		}
		.next {
			margin-top: 6px;
			font-size: 13px;
			color: var(--text-color-secondary);
			&.done {
				color: var(--rank-first);
			}
		}
	}
	.rail {
		padding: 0 14px 12px;
	}
	.step {
		display: flex;
		gap: 12px;
		// Le trait qui relie les paliers est porté par l'ÉTAPE, pas par la pastille :
		// accroché à la pastille, `calc(100% - 30px)` se mesurait sur ses 30 px de
		// haut et donnait un trait de hauteur nulle. Ici il descend jusqu'au bas de
		// l'étape, qui suit la hauteur réelle du bloc de récompenses.
		position: relative;
		&::before {
			content: '';
			position: absolute;
			top: 30px;
			left: 15px; // centre de la pastille (30 px de côté)
			bottom: 0;
			width: 1px;
			background: var(--border);
		}
		&:last-child::before {
			display: none;
		}
		.node {
			position: relative;
			flex-shrink: 0;
			width: 30px;
			height: 30px;
			border-radius: var(--radius-pill);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 12px;
			font-weight: 700;
			background: var(--background-secondary);
			color: var(--text-color-secondary);
			border: 1px solid var(--border);
			:deep(svg) {
				width: 16px;
				height: 16px;
			}
		}
		.body {
			flex: 1;
			min-width: 0;
			padding-bottom: 16px;
		}
		.head {
			display: flex;
			align-items: baseline;
			gap: 8px;
			flex-wrap: wrap;
			.name {
				font-weight: 600;
				color: var(--text-color-secondary);
			}
			.months {
				font-size: 12px;
				color: var(--text-color-secondary);
				opacity: 0.75;
			}
		}
		.rewards {
			margin-top: 4px;
			display: flex;
			flex-wrap: wrap;
			gap: 4px 10px;
		}
		.reward {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			color: var(--text-color-secondary);
			.v-icon {
				font-size: 16px;
				:deep(svg) {
					width: 16px;
					height: 16px;
				}
			}
			em {
				font-style: normal;
				font-size: 11px;
				opacity: 0.7;
			}
			&.pending {
				opacity: 0.7;
			}
		}
		// Palier acquis : la pastille passe en or plein, et le texte reprend l'encre
		// normale — c'est le contraste avec les paliers gris qui fait la progression.
		&.unlocked {
			.node {
				background: var(--gold-bright);
				color: var(--gold-text);
				border-color: var(--gold-bright);
			}
			// Le segment SOUS un palier acquis est doré : c'est le chemin parcouru
			// qui se colore, et il s'arrête net au premier palier non atteint.
			&::before {
				background: var(--gold-bright);
			}
			.head .name, .reward {
				color: var(--text-color);
			}
		}
		// Le palier visé : cerclé d'or, mais pas rempli.
		&.next .node {
			border-color: var(--gold-bright);
			color: var(--rank-first);
		}
	}
</style>
