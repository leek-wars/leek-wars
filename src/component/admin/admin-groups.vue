<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Groupes', link: '/admin/groups'}]" :raw="true" /></h1>
		</div>
		<panel class="first">
			<loader v-if="!groups" />
			<div v-else class="groups">
				<v-data-table
					:headers="headers"
					:items="groups"
					hide-default-footer
    				:items-per-page="100"
					density="comfortable"
					class="elevation-1 members">
					<template #item.id="{ item }">
						<router-link v-ripple :to="'/group/' + item.id" class="flex">
							{{ item.id }}
						</router-link>
					</template>
					<template #item.name="{ item }">
						<router-link v-ripple :to="'/group/' + item.id" class="flex">
							{{ item.name }}
						</router-link>
					</template>
					<template #item.supervisor="{ item }">
						<router-link :to="'/farmer/' + item.supervisor.id">
							<rich-tooltip-farmer :id="item.supervisor.id" :bottom="true">
								<div v-ripple class="flex name">
									<avatar :farmer="item.supervisor" />
									<span>{{ item.supervisor.name }}</span>
									<img v-if="item.supervisor.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</template>
					<template #item.creation_date="{ item }">
						{{ $filters.date(item.creation_date) }}
					</template>
					<template #item.archived="{ item }">
						<v-checkbox v-model="item.archived" :hide-details="true" />
					</template>
					<template #item.demo="{ item }">
						<div v-if="isDemo(item)" class="demo-cell">
							<span class="demo-badge">Démo</span>
							<v-btn size="small" color="primary" variant="tonal" @click="convertDemo(item)">Convertir</v-btn>
						</div>
						<span v-else>—</span>
					</template>
				</v-data-table>
			</div>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ref } from 'vue'
	import { useRouter } from 'vue-router'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	import Breadcrumb from '@/component/forum/breadcrumb.vue'

	const router = useRouter()
	const groups = ref<{ id: number, name: string, supervisor: { id: number, name: string, connected?: boolean, avatar_changed?: number }, creation_date: number, archived: boolean, member_count: number, [key: string]: unknown }[] | null>(null)
	const headers = [
		{ title: 'ID', value: 'id' },
		{ title: 'Nom', value: 'name' },
		{ title: 'Supervisor', value: 'supervisor' },
		{ title: 'Membres', value: 'members' },
		{ title: 'Date de création', value: 'creation_date' },
		{ title: 'Archivé', value: 'archived' },
		{ title: 'Démo', value: 'demo' },
	//   { text: 'Combats restants', value: 'day_fight' },
	//   { text: 'Combats', value: 'fights' },
	//   { text: 'Victoires', value: 'wins' },
	//   { text: 'Nuls', value: 'draws' },
	//   { text: 'Défaites', value: 'defeats' },
	//   { text: 'Ratio', value: 'ratio' },
	//   { text: 'Combats de test', value: 'test_fights' },
	//   { text: 'Trophées', value: 'trophies' },
	]

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Admin Groupes")
	LeekWars.get('groupe/get-all').then(g => {
		groups.value = g
	})

	// Booléen pg renvoyé brut par get-all (true / 't' / 1)
	function isDemo(item: { demo?: unknown }): boolean {
		return item.demo === true || item.demo === 't' || item.demo === 1
	}

	// Convertit une démo en groupe payant (set-demo false) → étape "converted" du funnel
	function convertDemo(item: { id: number, demo?: unknown }) {
		if (!confirm('Convertir cette démo en groupe payant ? Le superviseur garde tout son contenu.')) return
		LeekWars.put('groupe/set-demo', { group_id: item.id, enabled: false }).then(() => {
			item.demo = false
			LeekWars.toast('Groupe converti')
		}).error((e: { error?: string }) => LeekWars.toast(e.error ?? 'Erreur'))
	}
</script>

<style lang="scss" scoped>
.avatar {
	width: 36px;
	height: 36px;
}
.flex {
	// height: 47px;
	align-items: center;
}
.name {
	display: flex;
	align-items: center;
	gap: 6px;
	justify-content: flex-start;
}
.status {
	width: 15px;
}
.demo-cell {
	display: flex;
	align-items: center;
	gap: 8px;
}
.demo-badge {
	background: var(--primary);
	color: var(--pure-white);
	font-size: 11px;
	font-weight: bold;
	padding: 2px 8px;
	border-radius: 10px;
}
</style>