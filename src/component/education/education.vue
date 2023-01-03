<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1 v-if="group">{{ group.name }}</h1>
			<h1 v-else>{{ $t('main.education') }}</h1>

			<div v-if="group && group.is_supervisor" class="tabs">
				<div class="tab action" icon="question_answer" @click="settingsDialog = true">
					<v-icon>mdi-settings-outline</v-icon>
					<span>{{ $t('settings') }}</span>
				</div>
			</div>
		</div>
		<panel class="first">
			<loader v-if="!group" />
			<div v-else>

				<h4>{{ $t('supervisor') }}</h4>
				<router-link class="card member" :to="'/farmer/' + group.owner.id" v-ripple>
					<avatar :farmer="group.owner" />
					<div class="info">
						<div class="name">
							<b>{{ group.owner.name }}</b>
							<img v-if="group.owner.connected" class="status" src="/image/connected.png">
							<img v-else class="status" src="/image/disconnected.png">
						</div>
						<div class="level">{{ $t('main.level_n', [group.owner.total_level]) }}</div>
					</div>
					<!-- <div class="actions">
						<v-icon @click.stop="sendMessage(group.owner)">mdi-email-outline</v-icon>
					</div> -->
				</router-link>

				<div v-if="group && group.is_supervisor">
					<br>
					<v-btn @click="startBattleRoyale"><v-icon>mdi-sword-cross</v-icon>&nbsp; Lancer une Battle Royale</v-btn>
				</div>
			</div>
		</panel>

		<panel v-if="group && group.setting_chat" :title="$t('main.chat')" toggle="group/chat" icon="mdi-chat-outline">
			<div slot="actions">
				<div v-if="!LeekWars.mobile && group && $store.state.chat[group.chat]" class="button flat" @click="LeekWars.addChat($store.state.chat[group.chat])">
					<v-icon>mdi-picture-in-picture-bottom-right</v-icon>
				</div>
			</div>
			<chat :id="group.chat" slot="content" />
		</panel>

		<panel v-if="group" toggle="group/students">
			<template slot="title">{{ $t('students') }} ({{ group.students.length }})</template>
			<div slot="content" class="content members">
				<v-data-table
					:headers="headers"
					:items="group.students"
					hide-default-footer
    				:items-per-page="100"
					class="elevation-1 students">
					<template v-slot:item.name="{ item }">
						<!-- <router-link class="flex name" :to="'/farmer/' + item.id" v-ripple>
							<avatar :farmer="item" />
							<div>{{ item.name }}</div>
						</router-link> -->
						<router-link :to="'/farmer/' + item.id">
							<rich-tooltip-farmer :id="item.id" v-slot="{ on }" :bottom="true">
								<div class="flex name" v-on="on" v-ripple>
									<avatar :farmer="item" />
									<span>{{ item.name }}</span>
									<img v-if="item.connected" class="status" src="/image/connected.png">
									<img v-else class="status" src="/image/disconnected.png">
								</div>
							</rich-tooltip-farmer>
						</router-link>
					</template>
					<template v-slot:item.team="{ item }">
						<router-link v-if="item.team"  :to="'/team/' + item.team.id">
							<rich-tooltip-team :id="item.team.id" v-slot="{ on }" :bottom="true">
								<div class="flex name" v-on="on" v-ripple>
									<emblem :team="item.team" />
									<span>{{ item.team.name }}</span>
								</div>
							</rich-tooltip-team>
						</router-link>
					</template>
					<template v-slot:item.message="{ item }">
						<v-icon @click="sendMessage(item)">mdi-email-outline</v-icon>
					</template>
				</v-data-table>
			</div>
		</panel>

		<popup v-if="group" v-model="settingsDialog" :width="500">
			<v-icon slot="icon">mdi-settings-outline</v-icon>
			<span slot="title">{{ $t('settings') }}</span>
			<h4>{{ $t('group_name') }}</h4>
			{{ group.name }}
			<!--
			<input v-model="renameGroupName" type="text" @keyup.enter="renameGroup">
			<v-btn small>{{ $t('main.rename') }}</v-btn>
			-->
			<br><br>
			<h4>{{ $t('main_options') }}</h4>
			<v-checkbox v-model="group.setting_chat" :label="$t('setting_chat')" hide-details />
			<br>

			<h4>{{ $t('student_options') }}</h4>
			<!-- <v-checkbox v-model="group.setting_trophies" :label="$t('setting_trophies')" hide-details /> -->
			<v-checkbox v-model="group.setting_public_chat" :label="$t('setting_public_chat')" hide-details @change="updateSettingPublicChat" />
			<v-checkbox v-model="group.setting_buy_fights" :label="$t('setting_buy_fights')" hide-details @change="updateSettingBuyFights" />
			<v-checkbox v-model="group.setting_bank" :label="$t('setting_bank')" hide-details @change="updateSettingBank" />
			<v-checkbox v-model="group.setting_tournaments" :label="$t('setting_tournaments')" hide-details @change="updateSettingTournaments" />
			<v-checkbox v-model="group.setting_br" :label="$t('setting_br')" hide-details @change="updateSettingBr" />
		</popup>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'
	import { Group } from '@/model/group'
	import { Farmer } from '@/model/farmer'
	import { store } from '@/model/store'
	const ChatElement = () => import(/* webpackChunkName: "chat" */ `@/component/chat/chat.vue`)
	import RichTooltipTeam from '@/component/rich-tooltip/rich-tooltip-team.vue'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'

	@Component({ name: 'education', i18n: {}, mixins: [...mixins], components: {
		chat: ChatElement, RichTooltipTeam, RichTooltipFarmer
	}})
	export default class Education extends Vue {

		group: Group | null = null
		settingsDialog: boolean = false
		renameGroupName: string = ''

		headers = [
          { text: 'Étudiant', value: 'name' },
          { text: 'Équipe', value: 'team' },
          { text: 'Niveau', value: 'total_level' },
          { text: 'Combats restants', value: 'day_fight' },
          { text: 'Combats', value: 'fights' },
          { text: 'Victoires', value: 'wins' },
          { text: 'Nuls', value: 'draws' },
          { text: 'Défaites', value: 'defeats' },
          { text: 'Combats de test', value: 'test_fights' },
          { text: 'Trophées', value: 'trophies' },
          { text: 'Message', value: 'message', sortable: false },
        //   { text: 'Fat (g)', value: 'fat' },
        //   { text: 'Carbs (g)', value: 'carbs' },
        //   { text: 'Protein (g)', value: 'protein' },
        //   { text: 'Iron (%)', value: 'iron' },
        ]

		get group_id() {
			return this.$route.params.id
		}

		created() {
			LeekWars.get('groupe/get/' + this.group_id).then(group => {
				this.group = group
				this.renameGroupName = group.name
				LeekWars.setTitle(group.name)
			})
		}

		sendMessage(farmer: Farmer) {
			LeekWars.get('message/find-conversation/' + farmer.id).then(conversation => {
				store.commit('new-conversation', conversation)
				this.$router.push('/chat/' + conversation.id)
			}).error(() => {
				this.$router.push('/chat/new/' + farmer.id + '/' + farmer.name + '/' + farmer.avatar_changed)
			})
		}

		renameGroup() {

		}

		startBattleRoyale() {
			LeekWars.post('groupe/start-battle-royale').then(data => {
				this.$router.push('/fight/' + data.fight)
			}).error(error => LeekWars.toast(this.$t(error)))
		}

		updateSettingChat() {
			if (this.group) {
				LeekWars.put('groupe/setting-chat', { enabled: this.group.setting_chat })
			}
		}

		updateSettingBank() {
			if (this.group) {
				LeekWars.put('groupe/setting-bank', { enabled: this.group.setting_bank })
			}
		}

		updateSettingPublicChat() {
			if (this.group) {
				LeekWars.put('groupe/setting-public-chat', { enabled: this.group.setting_public_chat })
			}
		}

		updateSettingBuyFights() {
			if (this.group) {
				LeekWars.put('groupe/setting-buy-fights', { enabled: this.group.setting_buy_fights })
			}
		}

		updateSettingTournaments() {
			if (this.group) {
				LeekWars.put('groupe/setting-tournaments', { enabled: this.group.setting_tournaments })
			}
		}

		updateSettingBr() {
			if (this.group) {
				LeekWars.put('groupe/setting-br', { enabled: this.group.setting_br })
			}
		}
	}
</script>

<style lang="scss" scoped>
h4 {
	margin-bottom: 10px;
}
.member {
	padding: 5px;
	padding-right: 15px;
	display: flex;
	gap: 10px;
	align-items: center;
	.avatar {
		width: 50px;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}
	.info {
		flex: 1;
	}
}
.chat {
	height: 300px;
}
.members {
	display: flex;
	flex-direction: column;
	gap: 10px;
}
input[type="text"] {
	height: 28px;
	vertical-align: bottom;
	margin-right: 5px;
}
.students {
	&::v-deep th {
		text-align: left;
	}
	&::v-deep td {
		padding: 0 10px !important;
	}
	.name {
		justify-content: flex-start;
		gap: 6px;
		align-items: center;
		white-space: nowrap;
		span {
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
			max-width: 95px;
		}
	}
	.avatar, .emblem {
		width: 40px;
	}
}
.status {
	width: 15px;
}
</style>