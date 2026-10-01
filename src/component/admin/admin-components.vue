<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="admin" fallback="mdi-security" />
				<div class="page-title-text">
					<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Composants (' + (components ? components.length : '...') + ')', link: '/admin/components'}]" :raw="true" /></h1>
				</div>
			</div>
			<v-btn-toggle v-model="mode" mandatory density="compact" variant="outlined">
				<v-btn value="cards" size="small"><v-icon>mdi-view-grid</v-icon></v-btn>
				<v-btn value="table" size="small"><v-icon>mdi-table</v-icon></v-btn>
			</v-btn-toggle>
		</div>
		<panel class="first">
			<template #content>
				<div class="content">

					<!-- Barème de charge en vigueur, lu dans les game data : c'est le serveur qui le
					     fixe, la page ne fait que l'afficher. Ses 13 colonnes font ~620 px : sur
					     mobile il défile dans son cadre, sinon il élargit toute la page et le site
					     bascule dans sa mise en page bureau. -->
					<div v-if="costs.length" class="costs-scroll">
						<table class="costs">
							<tr>
								<th></th>
								<th v-for="c in costs" :key="c.carac" :title="$t('characteristic.' + c.carac)">
									<img :src="'/image/charac/' + c.carac + '.png'">
								</th>
							</tr>
							<tr>
								<td class="label" title="Charge consommée par point de la carac : c'est le poids de la carac dans la puissance d'une pièce">Charge / point</td>
								<td v-for="c in costs" :key="c.carac">{{ c.weight }}</td>
							</tr>
							<tr>
								<td class="label" title="Points gagnés par une altération de la même famille que la pièce (efficacité x1)">Gain / altération</td>
								<td v-for="c in costs" :key="c.carac">+{{ c.gain }}</td>
							</tr>
							<tr>
								<td class="label" title="Charge consommée par une altération de la même famille : gain x charge par point">Charge / altération</td>
								<td v-for="c in costs" :key="c.carac" class="strong">{{ c.charge }}</td>
							</tr>
						</table>
					</div>

					<v-data-table v-if="components && mode === 'table'"
						:headers="headers"
						:items="rows"
						:items-per-page="-1"
						density="compact"
						class="table">
						<template #item.icon="{ item }">
							<div class="icon"><item :item="LeekWars.items[item.component.template]" /></div>
						</template>
						<template #item.family="{ item }">
							<span v-if="item.family" class="family">
								<v-icon size="16">{{ COMPONENT_FAMILY_ICONS[item.family] }}</v-icon>
								{{ FAMILY_LABELS[item.family] }}
							</span>
							<span v-else class="tag" title="Aucune famille d'altération : le serveur refuse toute tentative (not_alterable)">—</span>
						</template>
						<template #item.stats="{ item }">
							<div class="row-stats">
								<span v-for="(stat, s) in item.component.stats" :key="s" class="row-stat">
									<img :src="'/image/charac/' + stat[0] + '.png'">
									<input v-model="stat[1]" type="text" :class="{positive: stat[1] > 0, negative: stat[1] < 0}" @keyup="updateComponent(item.component)">
								</span>
							</div>
						</template>
						<template #item.perLevel="{ item }">
							<span v-if="item.perLevel !== null">{{ item.perLevel.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}</span>
						</template>
						<template #item.capacity="{ item }">
							<span v-if="item.capacity">{{ item.capacity }}</span>
							<span v-else class="tag" title="Aucune famille d'altération : le serveur refuse toute tentative (not_alterable)">—</span>
						</template>
						<template #item.margin="{ item }">
							<span v-if="item.margin !== null">{{ item.margin }} %</span>
						</template>
						<template #bottom />
					</v-data-table>

					<div v-if="components && mode === 'cards'" class="components">

						<div v-for="(component, s) in components" :key="s" class="component">
							<item class="item" :item="LeekWars.items[component.template]" />
							<div class="stats">
								<div class="title">[{{ LeekWars.items[component.template].level }}]
								{{ $t('component.' + component.name) }}</div>
								<!-- Capacité d'altération, recalculée EN DIRECT à partir des stats éditées :
								     c'est l'effet le moins visible d'un changement de stat, alors que le
								     puits suit la puissance et conditionne tout le reste. -->
								<div class="capacity">
									<span title="Somme des valeurs x poids de la carac, malus déduits. La capacité, elle, se calcule sur les valeurs absolues">charge {{ chargeOf(component) }}</span>
									<span v-if="alterable(component)"> · capacité {{ capacityOf(component) }}</span>
									<span v-else class="tag" title="Aucune famille d'altération : le serveur refuse toute tentative (not_alterable)">inaltérable</span>
								</div>
								<div v-for="(stat, s) in component.stats" :key="s" class="stat">
									<img :src="'/image/charac/' + stat[0] + '.png'">
									<input v-model="stat[0]" type="text" @keyup="updateComponent(component)">
									<input v-model="stat[1]" type="text" :class="{positive: stat[1] > 0, negative: stat[1] < 0}" @keyup="updateComponent(component)">
									<v-btn :disabled="s === 0" size="small" @click="up(component, s)"><v-icon>mdi-arrow-up</v-icon></v-btn>
									<v-btn size="small" @click="component.stats.splice(s, 1); updateComponent(component)"><v-icon>mdi-close</v-icon></v-btn>
								</div>
								<v-btn class="add" size="small" @click="component.stats.push(['', 0]); updateComponent(component)">Ajouter</v-btn>
							</div>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">

import { ComponentTemplate } from '@/model/component'
import { capacity, COMPONENT_FAMILY_ICONS, ComponentFamily } from '@/model/alteration'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { i18n } from '@/model/i18n'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ItemView from '../item.vue'

import Breadcrumb from '@/component/forum/breadcrumb.vue'

defineOptions({ components: { item: ItemView, Breadcrumb } })

const router = useRouter()
const components = ref<ComponentTemplate[] | null>(null)
// Le mode survit au rechargement : on compare des composants entre eux en éditant, et
// repasser en cartes à chaque F5 se voyait tout de suite.
const mode = ref(localStorage.getItem('admin/components/mode') === 'table' ? 'table' : 'cards')
watch(mode, m => localStorage.setItem('admin/components/mode', m))

if (!store.getters.admin) router.replace('/')
LeekWars.setTitle("Admin Composants")

/**
 * Capacités surchargées, par composant.
 *
 * La capacité reçue ne dit pas si elle sort de la formule ou d'une surcharge. On la
 * reconnaît en rejouant la formule sur les stats d'origine, AVANT toute édition : un écart
 * ne peut venir que d'une surcharge, qui doit survivre à l'édition des stats.
 */
const overrides: { [id: number]: number } = {}

LeekWars.get<{[key: number]: ComponentTemplate}>("component/get-all/dfgdfgzegktyrtytm").then(comps => {
	components.value = Object.values(comps)
		.sort((a, b) => LeekWars.items[a.template].level - LeekWars.items[b.template].level)
	components.value.forEach(component => component.stats = component.stats.map(stat => {
		return stat instanceof Object ? Object.values(stat) : stat
	}) as unknown as [string, number][])
	const weights = LeekWars.alterations?.weights
	if (!weights) return
	for (const component of components.value) {
		const level = LeekWars.items[component.template].level
		const stats = component.stats.map(s => [s[0], parseInt(String(s[1])) || 0] as [string, number])
		if (component.capacity && component.capacity !== capacity(stats, level, weights, null, LeekWars.alterations?.well_coefficient)) {
			overrides[component.id] = component.capacity
		}
	}
})

onMounted(() => {
	LeekWars.large = true
})

/**
 * Le composant est-il altérable ?
 *
 * C'est la FAMILLE qui décide, pas la capacité : un composant sans famille d'altération
 * n'est pas altérable, quelle que soit sa capacité.
 */
function alterable(component: ComponentTemplate): boolean {
	return LeekWars.alterations?.component_families?.[component.id] !== undefined
}

/** Stats du composant telles qu'affichées, les valeurs des champs étant des chaînes. */
function statsOf(component: ComponentTemplate): [string, number][] {
	return component.stats.map(s => [s[0], parseInt(String(s[1])) || 0] as [string, number])
}

/**
 * Charge des stats de base, SIGNÉE : somme des valeurs pondérées par le poids de chaque carac,
 * malus déduits. C'est ce que la pièce rapporte ; une pièce à gros malus ne doit pas avoir l'air
 * forte. La capacité, elle, reste calculée sur les valeurs absolues (cf. capacity()).
 */
function chargeOf(component: ComponentTemplate): number {
	const weights = LeekWars.alterations?.weights
	if (!weights) return 0
	let total = 0
	for (const [carac, value] of statsOf(component)) total += value * (weights[carac] || 0)
	return total
}

/**
 * Capacité d'altération du composant.
 *
 * Recalculée depuis les stats affichées plutôt que lue dans `component.capacity` : sur cette
 * page les stats sont en cours d'édition, et voir le puits bouger en même temps qu'elles est
 * tout l'intérêt. Une capacité surchargée, elle, prime sur la formule.
 */
function capacityOf(component: ComponentTemplate): number {
	const weights = LeekWars.alterations?.weights
	if (!weights) return 0
	const level = LeekWars.items[component.template].level
	return capacity(statsOf(component), level, weights, overrides[component.id], LeekWars.alterations?.well_coefficient)
}

/**
 * Barème de charge, une entrée par carac, dans l'ordre du registre serveur : ce qu'un point
 * coûte (le poids), ce qu'une altération de même famille rapporte, et donc ce qu'elle
 * consomme. Les indivisibles (PT, PM, cœurs, RAM) gagnent +1, leur charge vaut leur poids.
 */
const costs = computed(() => {
	const data = LeekWars.alterations
	if (!data?.weights || !data.gains) return []
	return Object.entries(data.weights).map(([carac, weight]) => {
		const gain = data.gains[carac]?.[0] ?? 0
		return { carac, weight, gain, charge: gain * weight }
	})
})

const FAMILY_LABELS: { [family: number]: string } = {
	[ComponentFamily.FRUIT]: 'Fruit',
	[ComponentFamily.PHYSICAL]: 'Physique',
	[ComponentFamily.ELECTRONIC]: 'Électronique',
}

const headers = [
	{ title: '', key: 'icon', sortable: false, width: '40px' },
	{ title: 'Niv.', key: 'level', align: 'end' as const },
	{ title: 'Nom', key: 'name' },
	{ title: 'Catégorie', key: 'family' },
	{ title: 'Stats', key: 'stats', sortable: false },
	{ title: 'Charge', key: 'charge', align: 'end' as const },
	{ title: 'Charge / niv.', key: 'perLevel', align: 'end' as const },
	{ title: 'Capacité', key: 'capacity', align: 'end' as const },
	{ title: 'Marge', key: 'margin', align: 'end' as const },
]

/**
 * Lignes du tableau, valeurs à plat pour que le tri de v-data-table porte sur des NOMBRES :
 * une colonne calculée dans le template se trierait sur la chaîne rendue, donc 100 avant 52.
 *
 * `perLevel` = charge / niveau : ce qu'une pièce pèse pour son rang. C'est l'échelle commune
 * qui fait ressortir, au tri, les pièces trop faibles ou trop fortes pour leur niveau.
 *
 * `margin` = capacité / charge : de combien la pièce peut grossir, en proportion de ce
 * qu'elle pèse déjà. C'est le sens utile — l'inverse grandit avec la taille de la pièce et
 * ne se compare pas d'une ligne à l'autre.
 *
 * `family` = famille d'altération, 0 pour une pièce inaltérable : le tri regroupe alors les
 * fruits, les pièces physiques et l'électronique, dans l'ordre des familles.
 */
const rows = computed(() => (components.value ?? []).map(component => {
	const charge = chargeOf(component)
	const capacity = alterable(component) ? capacityOf(component) : 0
	const level = LeekWars.items[component.template].level
	return {
		component,
		icon: component.template,
		level,
		name: i18n.t('component.' + component.name) as string,
		family: LeekWars.alterations?.component_families?.[component.id] ?? 0,
		charge,
		perLevel: level ? charge / level : null,
		capacity,
		margin: capacity && charge ? Math.round(100 * capacity / charge) : null,
	}
}))

function up(component: ComponentTemplate, i: number) {
	// [component.stats[i], component.stats[i - 1]] = [component.stats[i - 1], component.stats[i]] marche pas :(
	const stat = component.stats[i]
	component.stats.splice(i, 1, component.stats[i - 1])
	component.stats[i - 1] = stat
	updateComponent(component)
}

function updateComponent(component: ComponentTemplate) {
	const stats = component.stats.map((stat: [string, number]) => [stat[0], parseInt(String(stat[1]))])
	LeekWars.put("component/set-stats", { component_id: component.id, stats: JSON.stringify(stats) })
}
</script>

<style lang="scss" scoped>
// Sur mobile, « Administration › Composants (52) » ne tient pas à côté de la bascule
// cartes/tableau : le fil d'Ariane est un inline-flex sans retour, et il élargissait toute
// la page. Le couper sur deux lignes ne va pas non plus, l'en-tête a une hauteur fixe et la
// seconde ligne recouvrait le barème. Le titre se tronque donc au bord, sur une ligne, et la
// bascule reste à droite. Règles locales à cette page.
.page-header {
	flex-wrap: nowrap;
}
.page-title {
	flex: 1;
	min-width: 0;
	overflow: hidden;
}
.costs-scroll {
	overflow-x: auto;
	margin-bottom: 15px;
}
.costs {
	border-collapse: collapse;
	th, td {
		padding: 3px 8px;
		text-align: center;
		border-bottom: 1px solid var(--border);
	}
	img {
		width: 20px;
		height: 20px;
		vertical-align: middle;
	}
	.label {
		text-align: left;
		white-space: nowrap;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.strong {
		font-weight: bold;
	}
}
.table {
	background: transparent;
	:deep(td), :deep(th) {
		padding: 2px 8px !important;
	}
	// La vignette est le .item INTERNE d'item.vue, dont la racine est le rich-tooltip :
	// une classe posee sur <item> atterrit sur le tooltip, pas sur l'image (comme en mode
	// cartes, qui cible deja le descendant).
	.icon {
		width: 32px;
		:deep(.item) {
			width: 32px;
			height: 32px;
		}
	}
	.row-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
	}
	.row-stat {
		display: flex;
		align-items: center;
		img {
			width: 16px;
			height: 16px;
			margin-right: 4px;
		}
		input {
			width: 50px;
			text-align: right;
			&.positive {
				background: rgba(0, 255, 0, 0.2);
			}
			&.negative {
				background: rgba(255, 0, 0, 0.2);
			}
		}
	}
	.tag {
		color: var(--text-color-secondary);
	}
	.family {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		vertical-align: middle;
	}
}
.components {
	display: grid;
	gap: 20px;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
.component {
	display: flex;
	gap: 10px;
	// L'image ne s'etire plus a la hauteur de la carte : les composants n'ont pas tous le
	// meme nombre de stats, donc les vignettes prenaient des tailles differentes.
	align-items: flex-start;
	:deep(.item) {
		flex: 60px 0 0;
		width: 60px;
		height: 60px;
	}
	.stats {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.title {
		margin-bottom: 5px;
	}
	.capacity {
		font-size: 12px;
		color: var(--text-color-secondary);
		margin-bottom: 5px;
		.tag {
			background: var(--background-secondary);
			border-radius: var(--radius-small);
			padding: 1px 5px;
		}
	}
	.stat {
		display: flex;
		min-width: 0;
		align-items: center;
		img {
			width: 18px;
			height: 18px;
			margin-right: 6px;
		}
		input {
			flex: 1;
			min-width: 0;
			&.positive {
				background: rgba(0, 255, 0, 0.2);
			}
			&.negative {
				background: rgba(255, 0, 0, 0.2);
			}
		}
	}
	.add {
		margin-top: 5px;
	}
	.v-btn {
		padding: 0 3px;
		min-width: 0;
		// align-self: flex-end;
		.v-icon {
			font-size: 16px;
		}
	}
}
</style>