<template>
	<panel :title="$t('title')" icon="mdi-medal-outline" class="lwplus-timeline">
		<loader v-if="loading" />
		<!-- Le résumé à gauche, la frise à droite (demande de Pierre, 11/09/2026) ;
		     l'un sous l'autre quand la place manque, comme dans la colonne de la banque. -->
		<div v-else class="layout">
			<!-- Où en est le joueur. Le compteur fait autorité sur la barre : celle-ci
			     ne mesure QUE la portion en cours entre deux paliers, pas le chemin
			     total — sinon les trois premiers mois paraissent insignifiants. -->
			<div class="summary">
				<div class="total">{{ totalLabel }}</div>
				<!-- Pas encore de palier = jamais abonné (le premier tombe dès le premier
				     jour) : pas de barre, elle n'aurait rien à mesurer. -->
				<div v-if="tier === 0" class="next">{{ $t('not_started') }}</div>
				<template v-else-if="nextIn !== null">
					<div class="bar"><div class="fill" :style="{ width: progress + '%' }"></div></div>
					<div class="next">{{ $t('next_in', [daysLabel(nextIn)]) }}</div>
				</template>
				<div v-else class="next done">{{ $t('all_done') }}</div>
			</div>

			<!-- Une page de paliers à la fois : 10 au plus, moins si la place manque, et
			     des flèches pour les précédents et les suivants. -->
			<div ref="pager" class="pager" :class="{ compact }">
				<v-btn v-if="paginated" class="arrow" icon variant="text" size="small" :disabled="start === 0" @click="anchor = start - perPage">
					<v-icon>mdi-chevron-left</v-icon>
				</v-btn>
				<div class="rail">
					<div
						v-for="step in visible"
						:key="step.tier"
						class="step"
						:class="{ unlocked: step.tier <= tier, next: step.tier === tier + 1, end: step.tier === ladder.length, pending: step.reward.pending }"
							:style="{ flexBasis: 100 / perPage + '%' }">
						<div class="node">
							<v-icon v-if="step.tier <= tier">mdi-check</v-icon>
							<!-- Le palier d'accueil n'a pas de durée à afficher : une pousse. -->
							<v-icon v-else-if="step.months === 0">mdi-sprout</v-icon>
							<span v-else>{{ nodeLabel(step.months) }}</span>
						</div>
						<!-- Un palier = une vignette carrée de sa récompense (retour de Pierre,
						     11/09/2026) : l'objet débloqué, l'icône du trophée, ou un emplacement
						     en pointillés pour ce qui n'est pas encore dessiné. Le nom en petit
						     dessous (retour de Pierre), la durée est déjà dans la pastille. -->
						<!-- Objet existant : la fiche complète de l'item, comme partout ailleurs. -->
						<!-- Vers le haut (sens par défaut) : vers le bas, elle recouvrait le pied de
						     page (retour de Pierre, 11/09/2026). -->
						<!-- Lot de ressources : la fiche de la ressource, avec sa quantité et, grâce à
						     `inventory`, sa valeur estimée et celle du lot (un lot n'en
						     porte qu'une ; s'il en portait plusieurs, la première fait la vignette). -->
						<rich-tooltip-item v-if="step.reward.items" v-slot="{ props: tip }" :item="LeekWars.items[step.reward.items[0][0]]" :quantity="step.reward.items[0][1]" :inventory="true">
							<div v-bind="tip" class="tile bundle">
								<img :src="templateImage(step.reward.items[0][0])" :alt="rewardLabel(step.reward)">
								<span v-if="bundleCount(step.reward) > 1" class="count">×{{ bundleCount(step.reward) }}</span>
							</div>
						</rich-tooltip-item>
						<rich-tooltip-item v-else-if="rewardItem(step.reward)" v-slot="{ props: tip }" :item="rewardItem(step.reward)">
							<div v-bind="tip" class="tile">
								<img :src="rewardImage(step.reward)!" :alt="rewardLabel(step.reward)">
							</div>
						</rich-tooltip-item>
						<rich-tooltip-trophy v-else-if="rewardTrophy(step.reward)" v-slot="{ props: tip }" :trophy="rewardTrophy(step.reward)!">
							<div v-bind="tip" class="tile">
								<trophy-icon class="trophy" :code="rewardTrophy(step.reward)!.code" />
							</div>
						</rich-tooltip-trophy>
						<v-tooltip v-else location="top">
							<template #activator="{ props: tip }">
								<div v-bind="tip" class="tile" :class="{ placeholder: !step.reward.icon && step.reward.pending }">
									<trophy-icon v-if="step.reward.icon" class="trophy" :code="step.reward.icon" />
									<v-icon v-else>{{ REWARD_ICON[step.reward.display] }}</v-icon>
								</div>
							</template>
							{{ rewardLabel(step.reward) }}
						</v-tooltip>
						<div class="label">{{ rewardName(step.reward) }}</div>
					</div>
				</div>
				<v-btn v-if="paginated" class="arrow" icon variant="text" size="small" :disabled="start + perPage >= ladder.length" @click="anchor = start + perPage">
					<v-icon>mdi-chevron-right</v-icon>
				</v-btn>
			</div>
		</div>
	</panel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { mixins, useNamespacedT } from '@/model/i18n'
import { useI18n } from 'vue-i18n'
import { itemImageUrl, itemTranslationKey } from '@/model/item'
import TrophyIcon from '@/component/trophy-icon.vue'
import RichTooltipItem from '@/component/rich-tooltip/rich-tooltip-item.vue'
import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'

defineOptions({ name: 'LwplusTimeline', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('lwplus-timeline')
const { t: tGlobal } = useI18n({ useScope: 'global' })

// `template` : id de template d'item quand l'objet existe ; `icon` : icône du trophée.
// `items` : lot de ressources, [[template, quantité], …].
interface Reward { type: string, display: string, level: string | null, pending: boolean, template: number | null, icon: string | null, items: [number, number][] | null }
interface Step { tier: number, seconds: number, months: number, reward: Reward }
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
	// Même glyphe que les apparats du marché (ITEM_TYPE_ICONS).
	pomp: 'mdi-auto-fix',
	resources: 'mdi-treasure-chest',
	surprise: 'mdi-gift',
}

// Pagination : au plus 10 paliers par page, et jamais un palier plus étroit que
// STEP_MIN_WIDTH (en dessous, le libellé de la récompense ne tient plus). Les
// flèches sont décomptées même quand elles sont masquées : le nombre de paliers
// par page ne doit pas dépendre de leur présence, sinon il oscille.
// Sous COMPACT_WIDTH (mobile), la frise se resserre — vignette et flèches plus
// petites — pour montrer trois paliers au lieu de deux (retour de Pierre,
// 12/09/2026) : deux, c'est trop peu pour lire une progression.
const MAX_PER_PAGE = 10
const STEP_MIN_WIDTH = 110
const COMPACT_STEP_MIN_WIDTH = 84
const COMPACT_WIDTH = 560
const ARROW_WIDTH = 40
const COMPACT_ARROW_WIDTH = 28

const loading = ref(true)
const seconds = ref(0)
const tier = ref(0)
const nextIn = ref<number | null>(null)
const palierSeconds = ref(90 * 86400)
const ladder = ref<Step[]>([])
const pager = ref<HTMLElement | null>(null)
const perPage = ref(MAX_PER_PAGE)
const compact = ref(false)
// Le palier qu'on veut voir, pas le début de page : quand la largeur change, la
// page se recale autour de lui au lieu de le perdre.
const anchor = ref(0)

const start = computed(() => Math.floor(Math.max(0, anchor.value) / perPage.value) * perPage.value)
const visible = computed(() => ladder.value.slice(start.value, start.value + perPage.value))
const paginated = computed(() => ladder.value.length > perPage.value)

const observer = new ResizeObserver(entries => {
	const full = entries[0].contentRect.width
	compact.value = full < COMPACT_WIDTH
	const width = full - 2 * (compact.value ? COMPACT_ARROW_WIDTH : ARROW_WIDTH)
	const step = compact.value ? COMPACT_STEP_MIN_WIDTH : STEP_MIN_WIDTH
	perPage.value = Math.max(1, Math.min(MAX_PER_PAGE, Math.floor(width / step)))
})
watch(pager, (element, previous) => {
	if (previous) { observer.unobserve(previous) }
	if (element) { observer.observe(element) }
})
onBeforeUnmount(() => observer.disconnect())

// Pluriel à la main, comme lwplus-packs : deux formes suffisent, et ça évite
// d'imposer une règle de pluriel à 17 fichiers de langue.
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
	return t('reward_' + reward.display)
}

// Pastille : les anniversaires en années (« 1 an », « 2 ans »), le reste en mois.
function nodeLabel(months: number) {
	if (months % 12 !== 0) { return String(months) }
	const years = months / 12
	return years === 1 ? t('years_one', [years]) : t('years_other', [years])
}

// Image de l'objet débloqué, retrouvée dans les game data par son template. null
// tant que l'objet n'existe pas (chapeau, skin à dessiner) : place au placeholder.
function rewardItem(reward: Reward) {
	return reward.type === 'item' && !reward.items && reward.template ? LeekWars.items[reward.template] ?? null : null
}
// Trophée déclaré, cherché par son id : la liste des trophées n'est pas indexée par id.
function rewardTrophy(reward: Reward) {
	return reward.type === 'trophy' && reward.template ? LeekWars.trophies.find(trophy => trophy.id === reward.template) ?? null : null
}
function templateImage(template: number): string {
	const item = LeekWars.items[template]
	return item ? itemImageUrl(item) : ''
}
function bundleCount(reward: Reward): number {
	return (reward.items ?? []).reduce((total, entry) => total + entry[1], 0)
}
function rewardImage(reward: Reward): string | null {
	const item = rewardItem(reward)
	return item ? itemImageUrl(item) : null
}

// Nom sous la vignette : le vrai nom de l'objet ou du trophée quand il existe
// (« Couronne bronze LW+ », « Leek Wars + — an I »), sinon le genre (« Chapeau »…).
function rewardName(reward: Reward): string {
	// Lot de ressources : « Aragonite x200 » (retour de Pierre) ; sans « x1 » pour une seule.
	if (reward.items) {
		return reward.items.map(([template, quantity]) => {
			const item = LeekWars.items[template]
			const name = item ? tGlobal(itemTranslationKey(item)) : ''
			return quantity > 1 ? name + ' x' + quantity : name
		}).join(', ')
	}
	const item = rewardItem(reward)
	if (item) { return tGlobal(itemTranslationKey(item)) }
	const trophy = rewardTrophy(reward)
	// « Trophée Leek Wars + an I » : le genre devant le nom, ordre propre à chaque langue.
	return trophy ? t('trophy_named', [tGlobal('trophy.' + trophy.code)]) : rewardLabel(reward)
}

onMounted(() => {
	LeekWars.get('subscription/get-loyalty').then((data: Loyalty) => {
		seconds.value = data.seconds
		tier.value = data.tier
		nextIn.value = data.next_in
		palierSeconds.value = data.palier_seconds
		ladder.value = data.ladder
		// On ouvre sur la page du palier visé (index `tier`, les paliers comptant
		// depuis 1), ou sur la dernière si l'échelle est terminée : un abonné de
		// longue date ne doit pas tomber sur des paliers déjà acquis.
		anchor.value = Math.min(data.tier, data.ladder.length - 1)
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

	// Le panneau précédent (offre, mois à l'unité) est le dernier de son bloc et
	// perd donc sa marge basse : c'est à celui-ci de reprendre l'écart.
	.lwplus-timeline {
		margin-top: 12px;
	}
	// Pas de double marge (retour de Pierre) : le contenu du panneau n'en a aucune,
	// le résumé et la frise portent chacun la leur.
	.lwplus-timeline > :deep(.content) {
		padding: 0;
	}
	.layout {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
	}
	.summary {
		// Largeur fixe à côté de la frise : c'est elle, pas le résumé, qui prend la place.
		flex: 0 1 240px;
		min-width: 0;
		padding: 12px;
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
	.pager {
		// En dessous de 400 px à côté du résumé, la frise passe à la ligne et prend
		// toute la largeur.
		flex: 1 1 400px;
		min-width: 0;
		display: flex;
		align-items: flex-start;
		padding: 12px 0;
		.arrow {
			flex-shrink: 0;
			// Centrée sur les pastilles (30 px) plutôt que sur toute la hauteur.
			margin-top: -5px;
		}
	}
	// Paliers de gauche à droite, à parts égales sur la largeur de la page.
	.rail {
		flex: 1;
		min-width: 0;
		display: flex;
		padding: 0 8px;
	}
	.step {
		// Largeur fixée par le nombre de paliers d'une page PLEINE (style en ligne) : la
		// dernière page, plus courte, garde la même grille au lieu de s'étirer.
		flex: 0 0 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding-right: 12px;
		// Le trait part du bord droit de la pastille et court jusqu'au bord de
		// l'étape, où commence la pastille suivante. Il déborde de la page vers la
		// flèche quand d'autres paliers suivent : c'est lui qui dit « la suite ».
		position: relative;
		&::before {
			content: '';
			position: absolute;
			top: 15px; // milieu de la pastille (30 px de côté)
			left: 30px;
			right: 0;
			height: 1px;
			background: var(--border);
		}
		&.end::before {
			display: none;
		}
		.node {
			position: relative;
			flex-shrink: 0;
			// 30 px de haut ; s'élargit pour « 2 ans ». Posée par-dessus le trait.
			min-width: 30px;
			padding: 0 6px;
			height: 30px;
			margin-bottom: 8px;
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
		.tile {
			width: 64px;
			height: 64px;
			border-radius: var(--radius);
			border: 1px solid var(--border);
			background: var(--background-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			img {
				max-width: 80%;
				max-height: 80%;
				object-fit: contain;
			}
			.trophy {
				width: 40px;
				height: 40px;
			}
			&.bundle {
				position: relative;
			}
			.count {
				position: absolute;
				right: 4px;
				bottom: 2px;
				font-size: 11px;
				font-weight: 700;
				color: var(--text-color);
			}
			.v-icon {
				font-size: 32px;
				color: var(--text-color-secondary);
				:deep(svg) {
					width: 32px;
					height: 32px;
				}
			}
			// Pas encore dessiné : un emplacement, pas une récompense.
			&.placeholder {
				border-style: dashed;
				background: transparent;
				.v-icon {
					opacity: 0.35;
				}
			}
		}
		.label {
			margin-top: 4px;
			max-width: 100%;
			font-size: 11px;
			line-height: 1.25;
			color: var(--text-color-secondary);
			// Deux lignes au plus : « Couronne bronze LW+ » tient, un nom plus long se coupe.
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
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
			.tile {
				border-color: var(--gold-bright);
			}
		}
		// Le palier visé : cerclé d'or, mais pas rempli.
		&.next .node {
			border-color: var(--gold-bright);
			color: var(--rank-first);
		}
	}
	// Mobile : tout rétrécit d'un cran — flèches, vignettes, libellés — pour que
	// trois paliers tiennent. Les largeurs suivent COMPACT_ARROW_WIDTH et
	// COMPACT_STEP_MIN_WIDTH : les changer ici sans les changer là-bas fait
	// déborder la frise.
	.pager.compact {
		.arrow {
			width: 28px;
			min-width: 28px;
			margin-top: -3px;
		}
		.rail {
			padding: 0 4px;
		}
		.step {
			padding-right: 8px;
			&::before {
				top: 13px; // milieu de la pastille (26 px de côté)
				left: 26px;
			}
			.node {
				min-width: 26px;
				height: 26px;
				padding: 0 5px;
				margin-bottom: 6px;
				font-size: 11px;
			}
			.tile {
				width: 52px;
				height: 52px;
				.trophy {
					width: 34px;
					height: 34px;
				}
				.v-icon {
					font-size: 26px;
					:deep(svg) {
						width: 26px;
						height: 26px;
					}
				}
			}
			.label {
				font-size: 10px;
			}
		}
	}
</style>
