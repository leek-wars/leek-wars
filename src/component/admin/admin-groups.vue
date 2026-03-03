<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1><router-link to="/admin">Administration</router-link> > Groupes</h1>
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
						<router-link :to="'/group/' + item.id" class="flex" v-ripple>
							{{ item.id }}
						</router-link>
					</template>
					<template #item.name="{ item }">
						<router-link :to="'/group/' + item.id" class="flex" v-ripple>
							{{ item.name }}
						</router-link>
					</template>
					<template #item.supervisor="{ item }">
						<router-link :to="'/farmer/' + item.supervisor.id">
							<rich-tooltip-farmer :id="item.supervisor.id" :bottom="true">
								<div class="flex name" v-ripple>
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
				</v-data-table>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Options({ components: { RichTooltipFarmer } })
	export default class AdminTrophies extends Vue {
		groups: any = null
		headers = [
          { title: 'ID', value: 'id' },
          { title: 'Nom', value: 'name' },
          { title: 'Supervisor', value: 'supervisor' },
          { title: 'Membres', value: 'members' },
          { title: 'Date de création', value: 'creation_date' },
          { title: 'Archivé', value: 'archived' },
        //   { text: 'Combats restants', value: 'day_fight' },
        //   { text: 'Combats', value: 'fights' },
        //   { text: 'Victoires', value: 'wins' },
        //   { text: 'Nuls', value: 'draws' },
        //   { text: 'Défaites', value: 'defeats' },
        //   { text: 'Ratio', value: 'ratio' },
        //   { text: 'Combats de test', value: 'test_fights' },
        //   { text: 'Trophées', value: 'trophies' },
        ]

		created() {
			if (!this.$store.getters.admin) this.$router.replace('/')
			LeekWars.setTitle("Admin Groupes")
			LeekWars.get('groupe/get-all').then(groups => {
				this.groups = groups
			})
		}

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
</style>