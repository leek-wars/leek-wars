<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Composants (' + (components ? components.length : '...') + ')', link: '/admin/components'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<template #content>
				<div class="content">

					<div v-if="components" class="components">

						<div v-for="(component, s) in components" :key="s" class="component">
							<item class="item" :item="LeekWars.items[component.template]" />
							<div class="stats">
								<div class="title">[{{ LeekWars.items[component.template].level }}]
								{{ $t('component.' + component.name) }}</div>
								<!-- Capacité d'altération, recalculée EN DIRECT à partir des stats éditées :
								     c'est l'effet le moins visible d'un changement de stat, alors que le
								     puits vaut 0,2 × la puissance et conditionne tout le reste (#622). -->
								<div class="capacity" :class="{ none: capacityOf(component) === 0 }">
									{{ capacityOf(component) === 0 ? 'non altérable' : 'capacité ' + capacityOf(component) }}
									<span v-if="component.capacity" class="override" title="Capacité forcée en base (component_template.capacity)">forcée</span>
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
import { power, well } from '@/model/alteration'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ItemView from '../item.vue'

import Breadcrumb from '@/component/forum/breadcrumb.vue'

defineOptions({ components: { item: ItemView, Breadcrumb } })

const router = useRouter()
const components = ref<ComponentTemplate[] | null>(null)

if (!store.getters.admin) router.replace('/')
LeekWars.setTitle("Admin Composants")

LeekWars.get<{[key: number]: ComponentTemplate}>("component/get-all/dfgdfgzegktyrtytm").then(comps => {
	components.value = Object.values(comps)
		.sort((a, b) => LeekWars.items[a.template].level - LeekWars.items[b.template].level)
	components.value.forEach(component => component.stats = component.stats.map(stat => {
		return stat instanceof Object ? Object.values(stat) : stat
	}) as unknown as [string, number][])
})

onMounted(() => {
	LeekWars.large = true
})

/**
 * Capacité d'altération du composant, telle que le serveur la calculera.
 *
 * Recalculée depuis les stats affichées plutôt que lue dans `component.capacity` : sur cette
 * page les stats sont en cours d'édition, et voir le puits bouger en même temps qu'elles est
 * tout l'intérêt. La colonne en base ne sert que de surcharge (le RGB), et prime alors.
 *
 * 0 = pas de puits, donc composant non altérable (les pièces de récupération).
 */
function capacityOf(component: ComponentTemplate): number {
	if (component.capacity) return component.capacity
	const weights = LeekWars.alterations?.weights
	if (!weights) return 0
	const stats = component.stats.map(s => [s[0], parseInt(String(s[1])) || 0] as [string, number])
	return well(power(stats, weights))
}

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
		&.none {
			font-style: italic;
		}
		.override {
			background: var(--background-secondary);
			border-radius: 3px;
			padding: 0 4px;
			margin-left: 4px;
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