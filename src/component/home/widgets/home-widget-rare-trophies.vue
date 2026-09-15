<template>
	<div class="rare-trophies-widget">
		<loader v-if="!loaded" />
		<div v-else-if="rarest.length" ref="linesEl" class="lines" :style="{ '--row-height': ROW_HEIGHT + 'px' }">
			<router-link v-for="{ trophy, category } in visibleRarest" :key="trophy.code" :to="'/trophy/' + trophy.code" class="trophy-line">
				<!-- L'infobulle riche ne s'ouvre que sur l'icône (demande de Pierre) :
				     posée sur la ligne entière, elle recouvrait les lignes voisines
				     dès qu'on passait sur les avatars. -->
				<span class="trophy-tooltip">
					<rich-tooltip-trophy :trophy="trophy" :bottom="true" :instant="true">
						<!-- Le palmarès est celui du JEU : la plupart des lignes sont
						     des trophées que le lecteur n'a pas. Il les reconnaît à
						     l'icône atténuée, la même convention que la page des
						     trophées (trophy.vue). -->
						<trophy-icon :code="trophy.code" class="trophy" :class="{locked: !trophy.unlocked}" />
					</rich-tooltip-trophy>
				</span>
				<div class="info">
					<!-- L'API ne renvoie plus de nom traduit, seulement le code -->
					<span class="name">{{ $t('trophy.' + trophy.code) }}</span>
					<!-- Catégorie (demande de Pierre) puis rareté sur la même ligne : le
					     glyphe et l'intitulé sont ceux de la page du trophée. -->
					<span class="meta">
						<template v-if="category">
							<v-icon class="category-icon">{{ category.icon }}</v-icon>
							<span class="category">{{ $t('trophy.category_' + category.name) }}</span>
							<span class="separator">·</span>
						</template>
						<span class="rarity">{{ rarityText(trophy.rarity) }}</span>
					</span>
				</div>
				<!-- Les 5 derniers éleveurs à l'avoir débloqué (demande de Pierre), du
				     plus récent au plus ancien. Pas de lien par avatar : la ligne EST
				     déjà un lien, le nom vit dans le title. -->
				<div v-if="unlockers[trophy.id] && unlockers[trophy.id].length" class="unlockers">
					<img v-for="f in unlockers[trophy.id]" :key="f.id" class="avatar" :src="LeekWars.getAvatar(f.id, f.avatar_changed)" :title="f.name">
				</div>
			</router-link>
		</div>
		<div v-else class="none">{{ t('no_trophy') }}</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { useNamespacedT } from '@/model/i18n'
	import { useFitCount } from '@/component/home/widgets/use-fit-count'
	import RichTooltipTrophy from '@/component/rich-tooltip/rich-tooltip-trophy.vue'

	defineOptions({ name: 'HomeWidgetRareTrophies' })

	const RARE_TROPHIES = 15
	// Hauteur naturelle d'une ligne, connue du script et posée dans le style par
	// la variable : les lignes s'étirent ensuite pour remplir le panel, mais
	// c'est celle-là qui décide combien il en tient (cf. le widget Classement).
	const ROW_HEIGHT = 32

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type Trophy = any
	type Unlockers = { [id: number]: { id: number, name: string, avatar_changed: number }[] }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { trophies: Trophy[], unlockers: Unlockers } | null }>()

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const loaded = ref(false)
	const rarest = ref<Trophy[]>([])

	// Autant de lignes que la hauteur du panel le permet, jamais coupées. Les
	// lignes s'étirant pour remplir le panel, leur hauteur mesurée dépendrait du
	// nombre affiché : on donne donc leur hauteur naturelle (cf. useFitCount).
	const linesEl = ref<HTMLElement | null>(null)
	const lineCount = useFitCount(linesEl, '.trophy-line', RARE_TROPHIES, 2, ROW_HEIGHT)

	// Catégorie du trophée (Combat, Code, Boss…), avec le glyphe de la page des
	// trophées. `trophyCategoriesById` est indexée par position, d'où le -1 —
	// comme dans trophy.vue. Une catégorie inconnue du client (ajoutée côté
	// serveur, données pas encore rechargées) laisse simplement la rareté seule.
	function categoryOf(trophy: Trophy) {
		const category = LeekWars.trophyCategoriesById[trophy.category - 1]
		if (!category) return null
		return { name: category.name, icon: LeekWars.trophyCategoriesIcons[trophy.category - 1] }
	}
	const visibleRarest = computed(() => rarest.value.slice(0, lineCount.value).map(trophy => ({ trophy, category: categoryOf(trophy) })))

	// Rareté lisible. `rarity` est une FRACTION (possesseurs / éleveurs), comme
	// partout ailleurs dans le client (cf. trophies/trophy.vue) : elle passe donc
	// en pourcentage ici — sans ça la ligne affichait cent fois moins.
	// Sous 1 %, on donne le chiffre exact à deux chiffres significatifs, le même
	// que l'infobulle : un « < 0.01 % » rendait identiques tous les trophées du
	// haut de la liste, qui sont justement ceux qu'on vient regarder (demande de
	// Pierre). `Number()` retire les zéros de queue de `toPrecision` (0.50 → 0.5).
	function rarityText(rarity: number): string {
		const percent = rarity * 100
		if (percent >= 10) return Math.round(percent) + '%'
		if (percent >= 1) return percent.toFixed(1) + '%'
		if (percent > 0) return Number(percent.toPrecision(2)) + '%'
		return '0%'
	}

	// Les derniers éleveurs à avoir débloqué chaque trophée affiché. Service
	// nouveau : sur un serveur plus ancien l'appel échoue et les lignes restent
	// simplement sans avatars.
	const unlockers = ref<Unlockers>({})

	// Repli quand la requête groupée n'a rien pour ce widget : les deux appels
	// d'origine, le service complet puis les débloqueurs. Le service renvoie TOUS
	// les trophées du jeu, débloqués ou non : on y applique les mêmes exclusions
	// que le serveur (bonus, uniques, et ceux que personne n'a débloqués, dont la
	// rareté vaut 0 et passerait devant tout le monde).
	function load() {
		if (!store.state.farmer) { loaded.value = true; return }
		LeekWars.get('trophy/get-farmer-trophies/' + store.state.farmer.id + '/' + locale.value).then(data => {
			const all: Trophy[] = Object.values(data.trophies)
			rarest.value = all
				.filter(tr => !tr.bonus && !tr.unik && tr.total > 0)
				.sort((a, b) => a.rarity - b.rarity || a.id - b.id)
				.slice(0, RARE_TROPHIES)
			loaded.value = true
			if (rarest.value.length) {
				LeekWars.get<{ unlockers: Unlockers }>('trophy/last-unlockers/' + rarest.value.map(tr => tr.id).join(',')).then(d => {
					unlockers.value = d.unlockers
				}).error(() => {})
			}
		}).error(() => { loaded.value = true })
	}

	watch(() => props.data, (data) => {
		if (data === undefined) return
		if (data === null) { load(); return }
		rarest.value = data.trophies
		unlockers.value = data.unlockers ?? {}
		loaded.value = true
	}, { immediate: true })
</script>

<style lang="scss" scoped>
	.rare-trophies-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	// La liste occupe toute la hauteur ; on n'affiche que les lignes
	// qui tiennent entièrement (useFitCount), overflow hidden en filet.
	.lines {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	// Les lignes retenues se partagent TOUTE la hauteur du panel : plus de blanc
	// résiduel en bas (demande de Pierre), et elles restent serrées — c'est
	// `--row-height`, leur hauteur naturelle, qui décide combien il en tient.
	.trophy-line {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1 1 auto;
		min-height: var(--row-height);
		padding: 2px 6px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.trophy-line:hover {
		background: var(--background-secondary);
	}
	.trophy {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
	}
	.trophy.locked {
		opacity: 0.8;
	}
	// L'activateur de l'infobulle (un <span> rendu par rich-tooltip-trophy, d'où
	// le :deep) devient le porteur de l'icône dans la ligne : il doit se
	// comporter comme elle, sinon l'inline ajoute un décalage de ligne de base.
	.trophy-tooltip, .trophy-tooltip :deep(span) {
		display: flex;
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
	}
	.name {
		font-weight: bold;
		font-size: 13px;
		line-height: 1.25;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	// Catégorie et rareté sur une seule ligne secondaire : deux lignes de plus
	// sous le nom auraient annulé le resserrement.
	.meta {
		display: flex;
		align-items: center;
		gap: 4px;
		min-width: 0;
		font-size: 11px;
		line-height: 1.25;
		color: var(--text-color-secondary);
	}
	.category {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.category-icon {
		font-size: 13px;
		width: 13px;
		height: 13px;
		flex-shrink: 0;
		color: inherit;
	}
	.separator {
		opacity: 0.6;
	}
	.rarity {
		flex-shrink: 0;
	}
	// Avatars des derniers débloqueurs, poussés en bout de ligne. La classe
	// .avatar donne le carré biseauté du thème ; object-fit au cas où l'image
	// n'est pas carrée.
	.unlockers {
		margin-left: auto;
		display: flex;
		gap: 3px;
		flex-shrink: 0;
	}
	.unlockers .avatar {
		width: 22px;
		height: 22px;
		object-fit: cover;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
