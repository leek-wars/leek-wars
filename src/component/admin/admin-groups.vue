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
					class="elevation-1 members">
					<template v-slot:item.id="{ item }">
						<router-link :to="'/group/' + item.id" class="flex" v-ripple>
							{{ item.id }}
						</router-link>
					</template>
					<template v-slot:item.name="{ item }">
						<router-link :to="'/group/' + item.id" class="flex" v-ripple>
							{{ item.name }}
						</router-link>
					</template>
					<template v-slot:item.supervisor="{ item }">
						<router-link :to="'/farmer/' + item.supervisor.id">
							<rich-tooltip-farmer :id="item.supervisor.id" v-slot="{ on }" :bottom="true">
								<div class="flex name" v-on="on" v-ripple>
									<avatar :farmer="item.supervisor" />
									<span>{{ item.supervisor.name }}</span>
									<img v-if="item.supervisor.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</template>
					<template v-slot:item.creation_date="{ item }">
						{{ item.creation_date | date }}
					</template>
				</v-data-table>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({ components: { RichTooltipFarmer } })
	export default class AdminTrophies extends Vue {
		groups: any = null
		headers = [
          { text: 'ID', value: 'id' },
          { text: 'Nom', value: 'name' },
          { text: 'Supervisor', value: 'supervisor' },
          { text: 'Membres', value: 'members' },
          { text: 'Date de création', value: 'creation_date' },
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
	width: 40px;
	height: 40px;
}
.flex {
	height: 47px;
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