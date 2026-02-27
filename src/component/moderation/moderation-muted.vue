<template>
	<div>
		<div class="page-header page-bar">
			<div>
				<h1>
					<breadcrumb :items="breadcrumb_items" :raw="true" />
				</h1>
			</div>
			<div class="tabs">
				<div class="tab action content" icon="mdi-volume-off">
					<v-icon>mdi-volume-off</v-icon> Mutés
				</div>
			</div>
		</div>

		<panel title="Joueurs mutés">
			<template #content>
				<div class="muted-list">
					<loader v-if="!muted" />
					<div v-else-if="muted.length === 0" class="empty">
						<v-icon>mdi-check-outline</v-icon>
						<div>Aucun joueur muté</div>
					</div>
					<div v-else>
						<div v-for="farmer in muted" :key="farmer.id" class="muted-farmer">
							<avatar :farmer="farmer" />
							<router-link :to="'/farmer/' + farmer.id" class="text">{{ farmer.name }}</router-link>
							<div class="badges">
								<span v-if="farmer.chat_muted > now" class="badge chat">
									<v-icon small>mdi-chat-remove</v-icon> Chat ({{ formatExpiry(farmer.chat_muted) }})
								</span>
								<span v-if="farmer.ai_muted === -1" class="badge ai">
									<v-icon small>mdi-robot-off</v-icon> AI Say (permanent)
								</span>
								<span v-else-if="farmer.ai_muted > now" class="badge ai">
									<v-icon small>mdi-robot-off</v-icon> AI Say ({{ formatExpiry(farmer.ai_muted) }})
								</span>
							</div>
							<v-btn @click="unmute(farmer)">Démuter</v-btn>
						</div>
					</div>
				</div>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'
	import Breadcrumb from '../forum/breadcrumb.vue'

	@Options({ name: "moderation-muted", i18n: {}, components: { Breadcrumb } })
	export default class ModerationMuted extends Vue {
		muted: any[] | null = null
		now: number = Math.floor(Date.now() / 1000)

		get breadcrumb_items() {
			return [
				{name: "Modération", link: '/moderation'},
				{name: "Mutés", link: '/moderation/muted'},
			]
		}

		created() {
			LeekWars.get('moderation/get-muted').then((data: any) => {
				this.muted = data.muted
				LeekWars.setTitle("Mutés")
			})
		}

		formatExpiry(timestamp: number) {
			return LeekWars.formatDuration(timestamp)
		}

		unmute(farmer: any) {
			LeekWars.post('moderation/unmute', {target_id: farmer.id, type: 'all'}).then(() => {
				LeekWars.toast("Joueur démuté")
				this.muted = this.muted!.filter(f => f.id !== farmer.id)
			}).error((error: any) => {
				LeekWars.toast(error)
			})
		}
	}
</script>

<style lang="scss" scoped>
	.empty {
		text-align: center;
		padding: 20px;
		i {
			font-size: 100px;
			color: #ccc;
		}
	}
	.muted-list {
		padding: 10px;
	}
	.muted-farmer {
		margin: 3px;
		display: flex;
		align-items: center;
		img {
			margin-right: 5px;
			width: 25px;
			height: 25px;
		}
		.text {
			flex: 1;
		}
	}
	.badges {
		display: flex;
		gap: 6px;
		margin-right: 10px;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 12px;
		color: white;
		&.chat {
			background: #e67e22;
		}
		&.ai {
			background: #e74c3c;
		}
		i {
			font-size: 14px;
		}
	}
</style>
