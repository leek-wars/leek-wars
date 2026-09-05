<template>
	<div class="rare-trophies-widget">
		<loader v-if="!loaded" />
		<div v-else-if="rarest.length" ref="linesEl" class="lines">
			<rich-tooltip-trophy v-for="trophy in visibleRarest" :key="trophy.code" v-slot="{ props }" :trophy="trophy" :bottom="true" :instant="true">
				<router-link :to="'/trophies/' + farmerId" class="trophy-line" v-bind="props">
					<trophy-icon :code="trophy.code" class="trophy" />
					<div class="info">
						<!-- L'API ne renvoie plus de nom traduit, seulement le code -->
						<span class="name">{{ $t('trophy.' + trophy.code) }}</span>
						<span class="rarity">{{ rarityText(trophy.rarity) }}</span>
					</div>
					<!-- Les 5 derniers éleveurs à l'avoir débloqué (demande de Pierre), du
					     plus récent au plus ancien. Pas de lien par avatar : la ligne EST
					     déjà un lien, le nom vit dans le title. -->
					<div v-if="unlockers[trophy.id] && unlockers[trophy.id].length" class="unlockers">
						<img v-for="f in unlockers[trophy.id]" :key="f.id" class="avatar" :src="LeekWars.getAvatar(f.id, f.avatar_changed)" :title="f.name">
					</div>
				</router-link>
			</rich-tooltip-trophy>
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

	const RARE_TROPHIES = 10

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type Trophy = any
	type Unlockers = { [id: number]: { id: number, name: string, avatar_changed: number }[] }

	// Charge utile de la requête groupée de l'accueil (cf. home.vue) : `undefined`
	// tant qu'elle est en vol, `null` si ce widget n'en a rien tiré.
	const props = defineProps<{ data?: { trophies: Trophy[], unlockers: Unlockers } | null }>()

	const t = useNamespacedT('home')
	const { locale } = useI18n()

	const farmerId = computed(() => store.state.farmer?.id ?? 0)
	const loaded = ref(false)
	const rarest = ref<Trophy[]>([])

	// Autant de lignes que la hauteur du panel le permet, jamais coupées.
	const linesEl = ref<HTMLElement | null>(null)
	const lineCount = useFitCount(linesEl, '.trophy-line', 10, 4)
	const visibleRarest = computed(() => rarest.value.slice(0, lineCount.value))

	// Rareté lisible : arrondie selon l'ordre de grandeur, pas de queue de décimales.
	function rarityText(rarity: number): string {
		if (rarity >= 1) return Math.round(rarity) + '%'
		if (rarity >= 0.1) return rarity.toFixed(1) + '%'
		if (rarity >= 0.01) return rarity.toFixed(2) + '%'
		return '< 0.01%'
	}

	// Les derniers éleveurs à avoir débloqué chaque trophée affiché. Service
	// nouveau : sur un serveur plus ancien l'appel échoue et les lignes restent
	// simplement sans avatars.
	const unlockers = ref<Unlockers>({})

	// Repli quand la requête groupée n'a rien pour ce widget : les deux appels
	// d'origine, le service complet puis les débloqueurs.
	function load() {
		if (!store.state.farmer) { loaded.value = true; return }
		LeekWars.get('trophy/get-farmer-trophies/' + store.state.farmer.id + '/' + locale.value).then(data => {
			const all: Trophy[] = Object.values(data.trophies)
			rarest.value = all
				.filter(tr => tr.unlocked && !tr.bonus)
				.sort((a, b) => a.rarity - b.rarity)
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
		gap: 4px;
	}
	.trophy-line {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 6px;
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text-color);
	}
	.trophy-line:hover {
		background: var(--background-secondary);
	}
	.trophy {
		width: 36px;
		height: 36px;
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rarity {
		font-size: 12px;
		color: var(--text-color-secondary);
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
		width: 24px;
		height: 24px;
		object-fit: cover;
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
