<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div class="tab action" icon="power_settings_new" @click="logout">
					<i class="material-icons">power_settings_new</i>
					<span>{{ $t('logout') }}</span>
				</div>
			</div>
		</div>
		<div class="flex-container">
			<div class="column6">
				<panel :title="$t('language')" class="languages">
					<div v-ripple v-for="language in LeekWars.languages" :key="language.code" :class="{selected: language.code == $i18n.locale}" :lang="language.code" class="language" @click="LeekWars.setLocale(language.code)">
						<img :src="language.flag">
						<br>
						{{ language.name }} ({{ language.code }})
					</div>
				</panel>
			</div>
			<div class="column6">
				<panel :title="$t('misc_options')">
					<table class="misc-settings">
						<tr id="sfw-button">
							<td><h4>{{ $t('activate_discrete_mode') }}</h4></td>
							<td><v-switch v-model="sfwMode" hide-details /></td>
						</tr>
						<tr id="notifs-results-button">
							<td><h4>{{ $t('notifs_results') }}</h4></td>
							<td><v-switch v-model="notifsResults" hide-details /></td>
						</tr>
						<tr v-if="LeekWars.mobile" id="chat-first-button">
							<td><h4>{{ $t('chat_first') }}</h4></td>
							<td><v-switch v-model="chatFirst" hide-details /></td>
						</tr>
					</table>
				</panel>
			</div>
			<div class="column6">
				<panel :title="$t('change_password')">
					<form class="change-password" @submit="changePassword">
						<h4>{{ $t('old_password') }}</h4>
						<input v-model="password" name="password" type="password" required> <br>
						<h4>{{ $t('new_password') }}</h4>
						<input v-model="newPassword1" name="new_password1" type="password" required> <br>
						<h4>{{ $t('confirm_password') }}</h4>
						<input v-model="newPassword2" name="new_password2" type="password" required> <br>
						<center><input :value="$t('change')" type="submit" class="button"></center>
					</form>
				</panel>
			</div>
			<div class="column6">
				<panel title="Notifications">
					<span slot="actions" class="push-notifs-button" @click="updatePushNotifications">
						<span>{{ $t('push_notifications') }}</span>
						<v-switch :input-value="pushNotifications" hide-details />
					</span>
					<div slot="content" class="content notifications">
						<table>
							<template v-for="(notifications, category) in mails">
								<tr :key="category + 1">
									<td class="category">
										{{ $t('mail.notif_' + category) }}
									</td>
								</tr>
								<tr v-for="n in notifications" :key="category + n">
									<td class="item">
										{{ $t('mail.notif_' + category + '_' + n) }}
									</td>
									<td class="push">
										<v-checkbox :disabled="!pushNotifications" v-model="settings['push_' + category + '_' + n]" hide-details label="Push" @change="updateNotif('push_' + category + '_' + n, $event)" />
									</td>
									<td class="mail">
										<v-checkbox v-model="settings['mail_' + category + '_' + n]" hide-details label="E-mail" @change="updateNotif('mail_' + category + '_' + n, $event)" />
									</td>
								</tr>
								<tr :key="category + 2" class="separator"></tr>
							</template>
						</table>
					</div>
				</panel>
			</div>
			<div class="column6">
				<panel :title="$t('delete_account')">
					<div class="button" @click="deleteDialog = true">{{ $t('delete_account') }}</div>
				</panel>
			</div>
			<div class="column6">
				<panel title="Two factor authentication">
					<two-factor />
				</panel>
			</div>
		</div>

		<!-- TODO Translation -->
		<center>
			<div class="advanced-button" @click="advanced = !advanced">
				Avancé
				<i v-if="advanced" class="material-icons">expand_less</i>
				<i v-else class="material-icons">expand_more</i>
			</div>
		</center>

		<!-- TODO Translation -->
		<div v-if="advanced" class="flex-container">
			<div class="column6">
				<panel title="Vider le localStorage">
					<div class="clear-localstorage button" @click="clearLocalStorage">Vider</div>
				</panel>
			</div>
			<div class="column6"></div>
		</div>

		<v-dialog v-model="deleteDialog" max-width="600">
			<div class="title">{{ $t('delete_account') }}</div>
			<div class="content">
				<div v-html="$t('delete_message')"></div>
				<br>
				<v-switch v-model="deleteForumMessages" :label="$t('delete_forum_messages')" hide-details />
			</div>
			<div class="actions">
				<div class="action dismiss" @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="action red" @click="deleteAccountConfirm">{{ $t('delete_confirm') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-model="deleteConfirmDialog" max-width="600">
			<div class="title">{{ $t('delete_confirmation') }}</div>
			<div class="content">{{ $t('delete_confirmation_password') }} : <br><br>
				{{ $t('delete_password') }} : <input v-model="deleteConfirmPassword" type="password">
			</div>
			<div class="actions">
				<div class="action dismiss" @click="deleteConfirmDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="action red" @click="deleteAccountFinal">{{ $t('delete_finalize') }}</div>
			</div>
		</v-dialog>

		<v-dialog v-model="deleteSuccessDialog" max-width="600">
			<div class="title">{{ $t('delete_success') }}</div>
			<div class="content">{{ $t('delete_success_message') }}</div>
		</v-dialog>

		<v-dialog v-model="deleteFailedDialog" max-width="600">
			<div class="title">{{ $t('delete_failed') }}</div>
			<div class="content">{{ $t('farmer.' + deleteFailedError) }}</div>
		</v-dialog>
	</div>
</template>

<script lang="ts">
	import TwoFactor from '@/component/settings/two-factor.vue'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'settings', i18n: {}, components: {TwoFactor} })
	export default class Settings extends Vue {
		vapid_key = new Uint8Array([4, 92, 237, 40, 114, 162, 99, 215, 179, 242, 70, 151, 236, 60, 216, 10, 167, 186, 77, 27, 233, 193, 117, 111, 78, 20, 121, 201, 142, 186, 91, 13, 111, 26, 241, 126, 12, 216, 94, 160, 38, 110, 214, 161, 249, 147, 233, 133, 128, 210, 170, 161, 158, 57, 24, 54, 194, 103, 195, 94, 49, 182, 20, 62, 184])
		mails: {[key: string]: string[]} = {
			changelog: ['changelog'],
			fight: ['solo', 'farmer', /* 'team',*/ 'solo_challenge', 'farmer_challenge'],
			tournament: ['solo_round_finished', 'farmer_round_finished'],
			forum: ['response'],
			private_message: ['private_message']
		}
		settings: any = null
		sfwMode: boolean = false
		notifsResults: boolean = false
		chatFirst: boolean = false
		pushNotifications: boolean = false
		deleteDialog: boolean = false
		deleteConfirmDialog: boolean = false
		deleteConfirmPassword: string = ''
		deleteSuccessDialog: boolean = false
		deleteFailedDialog: boolean = false
		deleteFailedError: any = null
		deleteForumMessages: boolean = false
		advanced: boolean = false
		password: string = ''
		newPassword1: string = ''
		newPassword2: string = ''

		created() {
			this.settings = {}
			for (const category in this.mails) {
				for (const mail of this.mails[category]) {
					this.settings['push_' + category + '_' + mail] = false
				}
			}
			this.pushNotifications = localStorage.getItem('options/push-notifs') === 'true'
			LeekWars.setActions([
				{icon: 'power_settings_new', click: () => this.logout()}
			])

			LeekWars.get<any>('settings/get-settings/' + this.$store.state.token).then((data) => {
				this.sfwMode = localStorage.getItem('sfw') === 'true'
				this.notifsResults = localStorage.getItem('options/notifs-results') === 'true'
				this.chatFirst = localStorage.getItem('options/chat-first') === 'true'
				
				this.settings = data.settings

				LeekWars.setTitle(this.$t('title'), this.$store.state.farmer.name)

				// console.log("sw", LeekWars.service_worker)
				if (LeekWars.service_worker) {
					// Check the push notifs switch if we have a valid subscription
					LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription) => {
						if (subscription) {
							// console.log(subscription, data.endpoints)
							for (const e in data.endpoints) {
								if (subscription.endpoint === data.endpoints[e]) {
									this.pushNotifications = true
									break
								}
							}
						}
					})
				}
			})
		}
		updatePushNotifications(e: Event) {
			this.pushNotifications = !this.pushNotifications
			// console.log("sw", LeekWars.service_worker)
			if (!LeekWars.service_worker) { return }
			
			if (this.pushNotifications) {
				LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription) => {
					if (subscription) {
						subscription.unsubscribe()
					}
				})
			} else {
				LeekWars.service_worker.pushManager.subscribe({
					applicationServerKey: this.vapid_key,
					userVisibleOnly: true
				}).then((subscription: PushSubscription) => {
					LeekWars.post('push-endpoint/register', {subscription: JSON.stringify(subscription)})
				})
			}
		}
		logout() {
			this.$store.commit('disconnect')
			this.$router.push('/')
		}
		clearLocalStorage() {
			localStorage.clear()
			LeekWars.toast("localstorage cleared!")
			setTimeout(() => location.reload(), 800)
		}
		@Watch('sfwMode')
		updateSfwMode() {
			localStorage.setItem('sfw', '' + this.sfwMode)
			this.sfwMode ? LeekWars.sfwOn() : LeekWars.sfwOff()
		}
		@Watch('notifsResults')
		updateNotifsResults() {
			localStorage.setItem('options/notifs-results', '' + this.notifsResults)
			LeekWars.notifsResults = this.notifsResults
		}
		@Watch('chatFirst')
		updateChatFirst() {
			localStorage.setItem('options/chat-first', '' + this.chatFirst)
		}

		updateNotif(setting: string, value: boolean) {
			LeekWars.post('settings/update-setting', {setting, value})
		}

		changePassword(e: Event) {
			e.preventDefault()
			if (this.newPassword1 !== this.newPassword2) {
				LeekWars.toast(this.$i18n.t('farmer.error_not_same_password'))
				return false
			}
			LeekWars.post('farmer/change-password', {password: this.password, new_password: this.newPassword1}).then((data) => {
				if (data.success) {
					this.$store.commit('disconnect')
					LeekWars.toast(this.$i18n.t('settings.password_changed'))
					this.$router.push('/login')
				} else {
					LeekWars.toast(this.$i18n.t('farmer.error_' + data.error, data.params))
				}
			})
			return false
		}

		deleteAccountConfirm() {
			this.deleteDialog = false
			this.deleteConfirmDialog = true
		}
		deleteAccountFinal() {
			LeekWars.post('farmer/unregister', {password: this.deleteConfirmPassword, delete_forum_messages: this.deleteForumMessages}).then((data) => {
				this.deleteConfirmDialog = false
				if (data.success) {
					this.deleteSuccessDialog = true
					setTimeout(() => {
						this.$store.commit('disconnect')
						this.deleteSuccessDialog = false
						this.$router.push('/')
					}, 3000)
				} else {
					this.deleteFailedDialog = true
					this.deleteFailedError = data.error
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.languages .language {
		display: inline-block;
		padding: 8px;
		text-align: center;
		font-weight: 300;
		margin: 5px;
		cursor: pointer;
		border: 1px solid #ddd;
		border-radius: 2px;
	}
	.languages .language.selected {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.panel {
		text-align: center;
	}
	.misc-settings {
		width: 100%;
		td {
			text-align: left;
			padding: 2px;
		}
	}
	.change-password {
		text-align: left;
		display: inline-block;
		.title {
			font-size: 18px;
			font-weight: bold;
			color: #777;
		}
		input {
			margin-top: 3px;
			margin-bottom: 8px;
		}
	}
	.advanced-button {
		color: white;
		background: rgba(150, 150, 150, 0.2);
		padding: 2px 12px;
		display: inline-block;
		margin: 15px 0;
		line-height: 26px;
		cursor: pointer;
		i {
			vertical-align: bottom;
		}
	}
	.push-notifs-button {
		display: inline-block;
		margin-top: 8px;
		cursor: pointer;
		> span {
			vertical-align: bottom;
			padding-bottom: 5px;
			display: inline-block;
			color: white;
		}
	}
	.notifications.content {
		text-align: left;
		table {
			width: 100%;
		}
		.category {
			color: #888;
			font-size: 16px;
		}
		.item {
			padding-left: 18px;
		}
		.mail {
			width: 80px;
		}
		.push label, .mail label {
			cursor: pointer;
		}
		.push {
			padding-right: 5px;
			padding-left: 5px;
		}
		.separator {
			height: 7px;
		}
		.category.off {
			opacity: 0.6;
		}
	}
	.v-input--switch {
		margin-left: 8px;
	}
</style>