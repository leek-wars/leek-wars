<template>
	<div class="trophies-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<div class="summary">
				<div class="stat">
					<div class="value">{{ $filters.number(count) }} <span class="total">/ {{ $filters.number(total) }}</span></div>
					<div class="label">{{ t('trophies_unlocked') }}</div>
				</div>
				<div class="stat">
					<div class="value">{{ $filters.number(points) }}</div>
					<div class="label">{{ t('points') }}</div>
				</div>
			</div>
			<!-- Récap par rareté : les six paliers du jeu (`difficulty`), avec leurs
			     icônes et leurs clés existantes — la page des trophées compte déjà
			     de cette façon. Les paliers vides sautent. -->
			<div v-if="anyTrophies" class="rarities">
				<v-tooltip v-for="r in rarityCounts" :key="r.difficulty">
					<template #activator="{ props }">
						<span class="rarity-count" v-bind="props">
							<img :src="'/image/icon/trophy/' + r.difficulty + '.svg'" alt="">
							<span class="n">{{ $filters.number(r.count) }}</span>
						</span>
					</template>
					{{ $t('main.difficulty_' + r.difficulty) }}
				</v-tooltip>
			</div>
			<div ref="sectionsEl" class="sections">
				<div v-for="s in visibleSections" :key="s.key" class="section-block">
					<h4 class="section">{{ t(s.key) }}</h4>
					<div class="trophy-row">
						<rich-tooltip-trophy v-for="trophy in s.list" :key="trophy.code" v-slot="{ props }" :trophy="trophy" :bottom="true" :instant="true">
							<router-link :to="'/trophies/' + farmerId" v-bind="props">
								<trophy-icon :code="trophy.code" class="trophy" />
							</router-link>
						</rich-tooltip-trophy>
					</div>
				</div>
			</div>
			<div v-if="!anyTrophies" class="none">{{ t('no_trophy') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'
	import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'

	defineOptions({ name: 'HomeWidgetTrophies' })

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const farmerId = computed(() => store.state.farmer?.id ?? 0)
	const loaded = ref(false)
	const count = ref(0)
	const total = ref(0)
	const points = ref(0)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const best = ref<any[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const rarest = ref<any[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const latest = ref<any[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const unlocked = ref<any[]>([])

	const sections = computed(() => [
		{ key: 'best_trophies', icon: 'mdi-trophy-outline', list: best.value },
		{ key: 'rarest_trophies', icon: 'mdi-star-outline', list: rarest.value },
		{ key: 'latest_trophies', icon: 'mdi-history', list: latest.value },
	].filter(s => s.list.length))
	const anyTrophies = computed(() => best.value.length > 0)

	// Nombre de trophées débloqués par palier de rareté, paliers vides exclus.
	// `unlocked` est déjà filtré des trophées de catégorie 0, comme les points.
	const rarityCounts = computed(() => {
		const counts = [0, 0, 0, 0, 0, 0]
		for (const trophy of unlocked.value) counts[trophy.difficulty]++
		return counts.map((count, difficulty) => ({ difficulty, count })).filter(r => r.count > 0)
	})

	// Autant de sections que la hauteur du panel le permet, jamais coupées.
	const sectionsEl = ref<HTMLElement | null>(null)
	const sectionCount = useFitCount(sectionsEl, '.section-block', 3, 8)
	const visibleSections = computed(() => sections.value.slice(0, sectionCount.value))

	if (store.state.farmer) {
		LeekWars.get('trophy/get-farmer-trophies/' + store.state.farmer.id + '/' + locale.value).then(data => {
			count.value = data.count
			total.value = data.total
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const all: any[] = Object.values(data.trophies)
			let pts = 0
			for (const trophy of all) {
				if (trophy.unlocked && trophy.category !== 0) pts += trophy.points
			}
			points.value = pts
			const list = all.filter(tr => tr.unlocked && tr.category !== 0)
			unlocked.value = list
			best.value = [...list].sort((a, b) => b.points - a.points).slice(0, 18)
			rarest.value = [...list].sort((a, b) => a.rarity - b.rarity).slice(0, 18)
			latest.value = [...list].sort((a, b) => b.date - a.date).slice(0, 18)
			loaded.value = true
		})
	}
</script>

<style lang="scss" scoped>
	.trophies-widget {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}
	// Les sections occupent la hauteur restante ; on n'affiche que celles
	// qui tiennent entièrement (useFitCount), overflow hidden en filet.
	.sections {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.section-block {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.summary {
		display: flex;
		gap: 12px;
	}
	.stat {
		flex: 1;
		text-align: center;
		background: var(--background-secondary);
		border-radius: var(--radius);
		padding: 10px;
	}
	// `--background-secondary` EST la surface du panneau en v3 : les deux cases
	// n'y avaient donc aucun fond visible. Même piège qu'au lot 12 sur le widget
	// « Mes poireaux ». Elles prennent la surface de rangée, faite pour ça ; le
	// v2, dont les deux valeurs diffèrent, garde la sienne.
	body:not(.v2) .stat {
		background: var(--background-row);
	}

	// Récap par rareté : une rangée de compteurs, l'icône du palier et son
	// nombre. Le nom du palier est dans l'infobulle — l'écrire tiendrait six
	// libellés sur une ligne de widget.
	.rarities {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.rarity-count {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		img {
			width: 16px;
			height: 16px;
		}
		.n {
			// Monospace comme les autres compteurs : la police d'affichage
			// confond les chiffres à cette taille.
			font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', monospace;
			font-size: 13px;
			color: var(--text-color);
		}
	}
	body:not(.v2) .rarity-count {
		background: var(--background-row);
	}
	.stat .value {
		font-size: 24px;
		font-weight: bold;
		color: var(--primary);
	}
	.stat .value .total {
		font-size: 15px;
		color: var(--text-color-secondary);
		font-weight: normal;
	}
	.stat .label {
		font-size: 13px;
		color: var(--text-color-secondary);
	}
	.section {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-color-secondary);
		margin-top: 4px;
	}
	// Intitulé de section du v3 : la typo d'affichage en capitales espacées et
	// petit corps, comme les en-têtes du panneau social — et non un h4 de corps
	// de texte, qui pesait autant que les trophées qu'il annonce. L'icône saute :
	// elle doublait le titre sans rien apprendre.
	body:not(.v2) .section {
		font-family: var(--font-display);
		font-size: 11px;
		font-weight: normal;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin: 2px 0 0;
	}
	.trophy-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		// Une seule rangée : les icônes rétrécissent pour que la série tienne en
		// largeur plutôt que d'en masquer. Overflow hidden en dernier filet.
		max-height: 40px;
		overflow: hidden;
	}
	.trophy-row .trophy {
		width: clamp(24px, calc((100cqw - 66px) / 12), 40px);
		height: clamp(24px, calc((100cqw - 66px) / 12), 40px);
	}
	// Des trophées plus petits et plus nombreux (retour de Pierre : « les images
	// sont trop grosses »). Le plafond passe de 40 à 26 px, et la série de 12 à
	// 18 : à taille égale la rangée montrait moins de choses pour plus de place.
	body:not(.v2) .trophy-row {
		max-height: 26px;
		gap: 4px;
	}
	body:not(.v2) .trophy-row .trophy {
		width: clamp(18px, calc((100cqw - 100px) / 18), 26px);
		height: clamp(18px, calc((100cqw - 100px) / 18), 26px);
	}
	// Panel bas : résumé compact pour laisser la place aux sections.
	@container (max-height: 260px) {
		.stat {
			padding: 5px;
		}
		.stat .value {
			font-size: 18px;
		}
		.stat .value .total {
			font-size: 13px;
		}
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
	}
</style>
