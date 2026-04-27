<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Tournois & BR', link: '/admin/tournaments'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<loader v-if="!data" />
			<div v-else>
				<v-tabs v-model="tab" class="tabs" grow>
					<v-tab value="leeks" class="tab">Solo ({{ data.leeks.length }})</v-tab>
					<v-tab value="farmers" class="tab">Éleveur ({{ data.farmers.length }})</v-tab>
					<v-tab value="compositions" class="tab">Équipe ({{ data.compositions.length }})</v-tab>
					<v-tab value="br" class="tab">BR auto ({{ data.br.length }})</v-tab>
				</v-tabs>
				<v-tabs-window v-model="tab">
					<v-tabs-window-item value="leeks">
						<v-data-table
							:headers="leekHeaders"
							:items="data.leeks"
							:items-per-page="50"
							density="compact"
							class="elevation-1">
							<template #item.name="{ item }">
								<router-link :to="'/leek/' + item.id">{{ item.name }}</router-link>
							</template>
							<template #item.farmer_name="{ item }">
								<rich-tooltip-farmer :id="item.farmer_id" v-slot="{ props }" :bottom="true">
									<router-link :to="'/farmer/' + item.farmer_id" class="farmer-cell" v-bind="props">
										<avatar :farmer="{id: item.farmer_id, avatar_changed: item.avatar_changed}" />
										{{ item.farmer_name }}
									</router-link>
								</rich-tooltip-farmer>
							</template>
							<template #item.time="{ item }">
								{{ LeekWars.formatDateTime(item.time) }}
							</template>
						</v-data-table>
					</v-tabs-window-item>
					<v-tabs-window-item value="farmers">
						<v-data-table
							:headers="farmerHeaders"
							:items="data.farmers"
							:items-per-page="50"
							density="compact"
							class="elevation-1">
							<template #item.name="{ item }">
								<rich-tooltip-farmer :id="item.id" v-slot="{ props }" :bottom="true">
									<router-link :to="'/farmer/' + item.id" class="farmer-cell" v-bind="props">
										<avatar :farmer="{id: item.id, avatar_changed: item.avatar_changed}" />
										{{ item.name }}
									</router-link>
								</rich-tooltip-farmer>
							</template>
							<template #item.time="{ item }">
								{{ LeekWars.formatDateTime(item.time) }}
							</template>
						</v-data-table>
					</v-tabs-window-item>
					<v-tabs-window-item value="compositions">
						<v-data-table
							:headers="compoHeaders"
							:items="data.compositions"
							:items-per-page="50"
							density="compact"
							class="elevation-1">
							<template #item.team_name="{ item }">
								<rich-tooltip-team :id="item.team_id" v-slot="{ props }" :bottom="true">
									<router-link :to="'/team/' + item.team_id" class="farmer-cell" v-bind="props">
										<emblem :team="{id: item.team_id, emblem_changed: item.emblem_changed}" />
										{{ item.team_name }}
									</router-link>
								</rich-tooltip-team>
							</template>
							<template #item.composition_name="{ item }">
								<rich-tooltip-composition :id="item.id" v-slot="{ props }" :bottom="true">
									<span v-bind="props">{{ item.composition_name }}</span>
								</rich-tooltip-composition>
							</template>
							<template #item.time="{ item }">
								{{ LeekWars.formatDateTime(item.time) }}
							</template>
						</v-data-table>
					</v-tabs-window-item>
					<v-tabs-window-item value="br">
						<v-data-table
							:headers="leekHeaders"
							:items="data.br"
							:items-per-page="50"
							density="compact"
							class="elevation-1">
							<template #item.name="{ item }">
								<router-link :to="'/leek/' + item.id">{{ item.name }}</router-link>
							</template>
							<template #item.farmer_name="{ item }">
								<rich-tooltip-farmer :id="item.farmer_id" v-slot="{ props }" :bottom="true">
									<router-link :to="'/farmer/' + item.farmer_id" class="farmer-cell" v-bind="props">
										<avatar :farmer="{id: item.farmer_id, avatar_changed: item.avatar_changed}" />
										{{ item.farmer_name }}
									</router-link>
								</rich-tooltip-farmer>
							</template>
							<template #item.time="{ item }">
								{{ LeekWars.formatDateTime(item.time) }}
							</template>
						</v-data-table>
					</v-tabs-window-item>
				</v-tabs-window>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ref } from 'vue'
	import { useRouter } from 'vue-router'
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipComposition from '@/component/rich-tooltip/rich-tooltip-composition.vue'

	const router = useRouter()
	const data = ref<any>(null)
	const tab = ref('leeks')

	const leekHeaders = [
		{ title: 'Poireau', value: 'name', sortable: true },
		{ title: 'Niveau', value: 'level', sortable: true },
		{ title: 'Talent', value: 'talent', sortable: true },
		{ title: 'Éleveur', value: 'farmer_name', sortable: true },
		{ title: 'Inscrit le', value: 'time', sortable: true },
	]
	const farmerHeaders = [
		{ title: 'Éleveur', value: 'name', sortable: true },
		{ title: 'Poireaux', value: 'leek_count', sortable: true },
		{ title: 'Niveau total', value: 'level', sortable: true },
		{ title: 'Talent', value: 'talent', sortable: true },
		{ title: 'Inscrit le', value: 'time', sortable: true },
	]
	const compoHeaders = [
		{ title: 'Équipe', value: 'team_name', sortable: true },
		{ title: 'Composition', value: 'composition_name', sortable: true },
		{ title: 'Niveau total', value: 'level', sortable: true },
		{ title: 'Talent', value: 'talent', sortable: true },
		{ title: 'Inscrit le', value: 'time', sortable: true },
	]

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Tournois & BR")
	LeekWars.get('tournament/get-registered').then(d => data.value = d)
</script>

<style lang="scss" scoped>
	.farmer-cell {
		display: flex;
		align-items: center;
		gap: 6px;
		.avatar, .emblem {
			width: 26px;
			height: 26px;
		}
	}
</style>
