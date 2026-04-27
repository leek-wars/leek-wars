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
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
	}) as any)
})

onMounted(() => {
	LeekWars.large = true
})
onBeforeUnmount(() => {
	LeekWars.large = false
})

function up(component: ComponentTemplate, i: number) {
	// [component.stats[i], component.stats[i - 1]] = [component.stats[i - 1], component.stats[i]] marche pas :(
	const stat = component.stats[i]
	component.stats.splice(i, 1, component.stats[i - 1])
	component.stats[i - 1] = stat
	updateComponent(component)
}

function updateComponent(component: ComponentTemplate) {
	const stats = component.stats.map((stat: any) => [stat[0] as any, parseInt(stat[1] as any)])
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
	:deep(.item) {
		flex: 60px 0 0;
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