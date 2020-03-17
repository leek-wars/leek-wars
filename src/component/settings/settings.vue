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
					<div v-for="language in LeekWars.languages" :key="language.code" v-ripple :class="{selected: language.code == $i18n.locale}" :lang="language.code" class="language" @click="LeekWars.setLocale(language.code)">
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
				<panel :title="$t('account')">
					<div v-ripple class="list-item card" @click="viewChangePassword = !viewChangePassword">
						<i class="material-icons">lock_open</i>
						<span class="label">{{ $t('change_password') }}</span>
						<i class="material-icons">{{ viewChangePassword ? 'arrow_drop_down' : 'arrow_right' }}</i>
					</div>
					<form v-if="viewChangePassword" class="change-password" @submit="changePassword">
						<h4>{{ $t('old_password') }}</h4>
						<input v-model="password" name="password" type="password" required> <br>
						<h4>{{ $t('new_password') }}</h4>
						<input v-model="newPassword1" name="new_password1" type="password" required> <br>
						<h4>{{ $t('confirm_password') }}</h4>
						<input v-model="newPassword2" name="new_password2" type="password" required> <br>
						<center><v-btn type="submit">{{ $t('change') }}</v-btn></center>
					</form>

					<div v-ripple class="list-item card" @click="viewChangeEmail = !viewChangeEmail">
						<i class="material-icons">email</i>
						<span class="label">{{ $t('change_email') }}</span>
						<i class="material-icons">{{ viewChangeEmail ? 'arrow_drop_down' : 'arrow_right' }}</i>
					</div>
					<v-btn v-if="viewChangeEmail" :disabled="changeEmailSent" @click="sendChangeEmail()">{{ $t('change_email_send') }}</v-btn>

					<div v-ripple class="list-item card" @click="view2FA = !view2FA">
						<i class="material-icons">security</i>
						<span class="label">Two factor authentication</span>
						<i class="material-icons">{{ view2FA ? 'arrow_drop_down' : 'arrow_right' }}</i>
					</div>
					<two-factor v-if="view2FA" />

					<div v-ripple class="list-item card" @click="viewDeleteAccount = !viewDeleteAccount">
						<i class="material-icons">delete_forever</i>
						<span class="label">{{ $t('delete_account') }}</span>
						<i class="material-icons">{{ viewDeleteAccount ? 'arrow_drop_down' : 'arrow_right' }}</i>
					</div>
					<v-btn v-if="viewDeleteAccount" @click="deleteDialog = true">{{ $t('delete_account') }}</v-btn>
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
										<v-checkbox v-model="settings['push_' + category + '_' + n]" :disabled="!pushNotifications" hide-details label="Push" @change="updateNotif('push_' + category + '_' + n, $event)" />
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
				<panel title="Vider le localStorage" class="last">
					<v-btn class="clear-localstorage" @click="clearLocalStorage">Vider</v-btn>
				</panel>
			</div>
			<div class="column6"></div>
		</div>

		<popup v-model="deleteDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_account') }}</span>
			<div v-html="$t('delete_message')"></div>
			<br>
			<v-switch v-model="deleteForumMessages" :label="$t('delete_forum_messages')" hide-details />
			<div slot="actions">
				<div class="action dismiss" @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="action red" @click="deleteAccountConfirm">{{ $t('delete_confirm') }}</div>
			</div>
		</popup>

		<popup v-model="deleteConfirmDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_confirmation') }}</span>
			{{ $t('delete_confirmation_password') }} : <br><br>
			{{ $t('delete_password') }} : <input v-model="deleteConfirmPassword" type="password">
			<div slot="actions">
				<div class="action dismiss" @click="deleteConfirmDialog = false">{{ $t('delete_cancel') }}</div>
				<div class="action red" @click="deleteAccountFinal">{{ $t('delete_finalize') }}</div>
			</div>
		</popup>

		<popup v-model="deleteSuccessDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_success') }}</span>
			{{ $t('delete_success_message') }}
		</popup>

		<popup v-model="deleteFailedDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_failed') }}</span>
			{{ $t('farmer.' + deleteFailedError) }}
		</popup>
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
		viewChangePassword: boolean = false
		viewChangeEmail: boolean = false
		viewDeleteAccount: boolean = false
		view2FA: boolean = false
		changeEmailSent: boolean = false

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

			LeekWars.get('settings/get-settings').then(data => {
				this.sfwMode = localStorage.getItem('sfw') === 'true'
				this.notifsResults = localStorage.getItem('options/notifs-results') === 'true'
				this.chatFirst = localStorage.getItem('options/chat-first') === 'true'
				
				this.settings = data.settings

				LeekWars.setTitle(this.$t('title'), this.$store.state.farmer.name)

				if (LeekWars.service_worker) {
					// Check the push notifs switch if we have a valid subscription
					LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription) => {
						if (subscription) {
							for (const endpoint of data.push_endpoints) {
								if (subscription.endpoint === endpoint) {
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
			this.pushNotifications = !this.pushNotifications
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
			LeekWars.post('farmer/change-password', {password: this.password, new_password: this.newPassword1}).then(data => {
				this.$store.commit('disconnect')
				LeekWars.toast(this.$i18n.t('settings.password_changed'))
				this.$router.push('/login')
			}).error(error => {
				LeekWars.toast(this.$i18n.t('farmer.error_' + error.error, error.params))
			})
			return false
		}

		deleteAccountConfirm() {
			this.deleteDialog = false
			this.deleteConfirmDialog = true
		}
		deleteAccountFinal() {
			LeekWars.post('farmer/unregister', {password: this.deleteConfirmPassword, delete_forum_messages: this.deleteForumMessages}).then(data => {
				this.deleteConfirmDialog = false
				this.deleteSuccessDialog = true
				setTimeout(() => {
					this.$store.commit('disconnect')
					this.deleteSuccessDialog = false
					this.$router.push('/')
				}, 3000)
			}).error(error => {
				this.deleteConfirmDialog = false
				this.deleteFailedDialog = true
				this.deleteFailedError = error
			})
		}
		sendChangeEmail() {
			LeekWars.post('farmer/change-email1').then(data => {
				LeekWars.toast(this.$i18n.t('change_email_sent'))
			})
			this.changeEmailSent = true
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
	.list-item {
		text-align: left;
		padding: 8px;
		cursor: pointer;
		background: white;
		font-size: 16px;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		color: #555;
		user-select: none;
	}
	.list-item:not(:first-child) {
		margin-top: 10px;
	}
	.list-item:last-child {
		margin-bottom: 0;
	}
	.list-item .label {
		flex: 1;
	}
	.list-item i:first-child {
		margin-right: 5px;
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