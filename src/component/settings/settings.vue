<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div v-if="$store.state.farmer && $store.state.farmer.verified" class="tab action" icon="mdi-power-settings-new" @click="logout">
					<v-icon>mdi-power</v-icon>
					<span>{{ $t('logout') }}</span>
				</div>
			</div>
		</div>
		<panel v-if="$store.state.farmer && !$store.state.farmer.verified" :title="$t('verify')" icon="mdi-account-plus">
			<div class="verify">
				<div>
					<div><b><v-icon>mdi-information-outline</v-icon> Vous n'avez pas ajouté d'adresse email, vous pouvez perdre l'accès à votre compte si vous changer d'appareil, de navigateur.</b></div>
					<br>
					<div>Conseil : garder le cookie qui contient votre identifiant, si vous le perdez vous perdez complètement l'accès au compte.</div>
					<br>
					<div>
						Une fois votre compte vérifié, vous pourrez :
						<ul>
							<li><v-icon>mdi-check</v-icon> Garder l'accès à votre compte</li>
							<li><v-icon>mdi-check</v-icon> Se connecter sur un autre appareil</li>
							<li><v-icon>mdi-check</v-icon> Forum, chats, messages privés</li>
							<li><v-icon>mdi-check</v-icon> Acheter des cristaux</li>
							<li><v-icon>mdi-check</v-icon> Battle Royales</li>
						</ul>
					</div>
				</div>
				<form method="post" @submit="submit">
					<table>
						<tr>
							<td class="align-right">{{ $t('your_farmer_name') }}</td>
							<td class="align-left">
								<input v-model="login" :status="status('login')" name="login" type="text" required>
								<div v-for="e in errors.login" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td class="align-right"><i>{{ $t('godfather') }}</i></td>
							<td class="align-left">
								<input v-model="godfather" :status="status('godfather')" type="text">
								<div v-for="e in errors.godfather" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td><div class="space"></div></td>
						</tr>
						<tr>
							<td colspan="2">
								<v-radio-group v-model="signupMethod" class="radio" :row="true" :dense="true" :hide-details="true">
									<v-radio label="Email / mot de passe" :value="1" />
									<v-radio label="GitHub" :value="2" />
								</v-radio-group>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('your_email') }}</td>
							<td class="align-left">
								<input v-model="email" :status="status('email')" name="email" type="text" required>
								<div v-for="e in errors.email" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('password') }}</td>
							<td class="align-left">
								<input v-model="password1" :status="status('password1')" name="password" type="password" required>
								<div v-for="e in errors.password1" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td><div class="space"></div></td>
						</tr>
						<tr v-if="signupMethod === 2">
							<td><div class="space"></div></td>
						</tr>
					</table>
					<center>
						<v-btn v-if="signupMethod === 1" large color="primary" type="submit">{{ $t('verify') }}</v-btn>
						<v-btn v-else color="black" type="submit" class="gh-button"> <img src="/image/github_black.png"> {{ $t('verify_gh') }}</v-btn>
					</center>
				</form>
			</div>
		</panel>
		<div class="container grid large">
			<panel :title="$t('language')" class="languages" icon="mdi-translate">
				<div v-for="language in LeekWars.languages" :key="language.code" v-ripple :class="{selected: language.code == $i18n.locale}" :lang="language.code" class="language" @click="LeekWars.setLocale(language.code)">
					<img :src="language.flag">
					<br>
					{{ language.name }} ({{ language.code }})
				</div>
			</panel>

			<panel :title="$t('misc_options')" icon="mdi-settings-outline">
				<table class="misc-settings">
					<tr id="sfw-button">
						<td><h4>{{ $t('activate_discrete_mode') }}</h4></td>
						<td><v-switch v-model="sfwMode" hide-details /></td>
					</tr>
					<tr id="notifs-results-button">
						<td><h4>{{ $t('notifs_results') }}</h4></td>
						<td><v-switch v-model="notifsResults" hide-details /></td>
					</tr>
					<tr v-if="LeekWars.mobile">
						<td><h4>{{ $t('chat_first') }}</h4></td>
						<td><v-switch v-model="chatFirst" hide-details /></td>
					</tr>
					<tr v-if="!LeekWars.mobile">
						<td><h4>{{ $t('leek_theme') }}</h4></td>
						<td><v-switch v-model="LeekWars.leekTheme" hide-details /></td>
					</tr>
				</table>
			</panel>

			<panel :title="$t('account')" icon="mdi-account" class="account">
				<div v-if="$store.state.farmer.verified" v-ripple class="list-item card" @click="viewChangePassword = !viewChangePassword">
					<v-icon>mdi-lock-open-outline</v-icon>
					<span class="label">{{ $t('change_password') }}</span>
					<v-icon>{{ viewChangePassword ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
				</div>
				<form v-if="viewChangePassword && $store.state.farmer" class="change-password" @submit="changePassword">
					<h4 v-if="$store.state.farmer.pass">{{ $t('old_password') }}</h4>
					<input v-if="$store.state.farmer.pass" v-model="password" name="password" type="password">
					<br v-if="$store.state.farmer.pass">
					<h4>{{ $t('new_password') }}</h4>
					<input v-model="newPassword1" name="new_password1" type="password" required> <br>
					<h4>{{ $t('confirm_password') }}</h4>
					<input v-model="newPassword2" name="new_password2" type="password" required> <br>
					<center><v-btn type="submit">{{ $t('change') }}</v-btn></center>
				</form>

				<div v-if="$store.state.farmer.verified" v-ripple class="list-item card" @click="viewChangeEmail = !viewChangeEmail">
					<v-icon>mdi-email-outline</v-icon>
					<span class="label">{{ $t('change_email') }}</span>
					<v-icon>{{ viewChangeEmail ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
				</div>
				<v-btn v-if="viewChangeEmail" :disabled="changeEmailSent" @click="sendChangeEmail()">{{ $t('change_email_send') }}</v-btn>

				<!-- <div v-ripple class="list-item card" @click="view2FA = !view2FA">
					<v-icon>mdi-security</v-icon>
					<span class="label">Two factor authentication</span>
					<v-icon>{{ view2FA ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
				</div>
				<two-factor v-if="view2FA" /> -->

				<div v-ripple class="list-item card" @click="viewDeleteAccount = !viewDeleteAccount">
					<v-icon>mdi-delete-forever</v-icon>
					<span class="label">{{ $t('delete_account') }}</span>
					<v-icon>{{ viewDeleteAccount ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
				</div>
				<v-btn v-if="viewDeleteAccount" @click="deleteDialog = true" color="error">{{ $t('delete_account') }}</v-btn>

				<v-switch v-if="$store.state.farmer && $store.state.farmer.verified" v-model="settings.github_login" :disabled="!$store.state.farmer.pass" label="Autoriser la connexion via GitHub" @change="updateGithubLogin" />
			</panel>

			<panel v-if="$store.state.farmer && $store.state.farmer.verified" title="Notifications" icon="mdi-bell-outline">
				<span slot="actions" class="push-notifs-button" @click="updatePushNotifications">
					<span>{{ $t('push_notifications') }}</span>
					<v-switch :input-value="pushNotifications" hide-details />
				</span>
				<div slot="content" class="content notifications">
					<table>
						<template v-for="category in mails">
							<tr :key="category.name + '_t'">
								<td class="category">
									<v-icon>{{ category.icon }}</v-icon>
									{{ $t('notification.category_' + category.id) }}
								</td>
							</tr>
							<tr :key="category.name + '_d'">
								<td class="item">
									{{ $t('notification.category_' + category.id + '_desc') }}
								</td>
								<td class="push">
									<v-checkbox v-model="settings['push_' + category.name]" hide-details label="Push" @change="updateNotif('push_' + category.name, $event)" />
								</td>
								<td class="mail">
									<v-checkbox v-model="settings['mail_' + category.name]" hide-details label="E-mail" @change="updateNotif('mail_' + category.name, $event)" />
								</td>
							</tr>
						</template>
					</table>
					<div class="notif-info">
						<v-icon>mdi-information-outline</v-icon> {{ $t('notification.info') }}
					</div>
				</div>
			</panel>
		</div>

		<center>
			<div class="advanced-button" @click="advanced = !advanced">
				{{ $t('advanced') }}
				<v-icon v-if="advanced">mdi-chevron-up</v-icon>
				<v-icon v-else>mdi-chevron-down</v-icon>
			</div>
		</center>

		<div v-if="advanced" class="container grid large">
			<panel :title="$t('empty_localstorage')" class="last" icon="mdi-eraser">
				<v-btn class="clear-localstorage" @click="clearLocalStorage">{{ $t('empty') }}</v-btn>
			</panel>
		</div>

		<popup v-model="deleteDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_account') }}</span>
			<div v-html="$t('delete_message')"></div>
			<br v-if="$store.state.farmer.verified">
			<v-switch v-if="$store.state.farmer.verified" v-model="deleteForumMessages" :label="$t('delete_forum_messages')" hide-details />
			<div slot="actions">
				<div v-ripple class="action dismiss" @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="action red" @click="deleteAccountConfirm">{{ $t('delete_confirm') }}</div>
			</div>
		</popup>

		<popup v-model="deleteConfirmDialog" :width="600">
			<v-icon slot="icon">mdi-delete</v-icon>
			<span slot="title">{{ $t('delete_confirmation') }}</span>
			{{ $t('delete_confirmation_password') }} : <br><br>
			{{ $t('delete_password') }} : <input v-model="deleteConfirmPassword" type="password">
			<div slot="actions">
				<div v-ripple class="action dismiss" @click="deleteConfirmDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="action red" @click="deleteAccountFinal">{{ $t('delete_finalize') }}</div>
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
			{{ $t(deleteFailedError) }}
		</popup>
	</div>
</template>

<script lang="ts">
	import TwoFactor from '@/component/settings/two-factor.vue'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'settings', i18n: {}, mixins: [...mixins], components: {TwoFactor} })
	export default class Settings extends Vue {
		vapid_key = new Uint8Array([4, 92, 237, 40, 114, 162, 99, 215, 179, 242, 70, 151, 236, 60, 216, 10, 167, 186, 77, 27, 233, 193, 117, 111, 78, 20, 121, 201, 142, 186, 91, 13, 111, 26, 241, 126, 12, 216, 94, 160, 38, 110, 214, 161, 249, 147, 233, 133, 128, 210, 170, 161, 158, 57, 24, 54, 194, 103, 195, 94, 49, 182, 20, 62, 184])
		mails = [
			{ id: 1, icon: 'mdi-star', name: 'general' },
			{ id: 2, icon: 'mdi-gamepad-square', name: 'game' },
			{ id: 3, icon: 'mdi-sword-cross', name: 'fight' },
			{ id: 4, icon: 'mdi-flag', name: 'challenge' },
			{ id: 5, icon: 'mdi-trophy', name: 'tournament' },
			{ id: 6, icon: 'mdi-chat', name: 'social' },
			{ id: 7, icon: 'mdi-android-messages', name: 'private' },
			{ id: 8, icon: 'mdi-account-multiple', name: 'team' },
			{ id: 9, icon: 'mdi-gavel', name: 'moderation' }
		]

		settings: any = null
		sfwMode: boolean = localStorage.getItem('sfw') === 'true'
		notifsResults: boolean = localStorage.getItem('options/notifs-results') === 'true'
		chatFirst: boolean = localStorage.getItem('options/chat-first') === 'true'
		pushNotifications: boolean = localStorage.getItem('options/push-notifs') === 'true'
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
		errors: {[key: string]: string[]} = {}
		login: string = ''
		godfather: string = ''
		signupMethod: number = 1
		email: string = ''
		password1: string = ''

		created() {
			this.settings = {}
			for (const category in this.mails) {
				this.settings['push_' + category] = false
			}
			if (this.$store.state.farmer && this.$store.state.farmer.verified) {
				LeekWars.setActions([
					{icon: 'mdi-power', click: () => this.logout()}
				])
			}

			LeekWars.get('settings/get-settings').then(data => {

				this.settings = data.settings

				if (this.$store.state.farmer) {
					LeekWars.setTitle(this.$t('title'), this.$store.state.farmer.name)
				}

				if (LeekWars.service_worker) {
					// Check the push notifs switch if we have a valid subscription
					LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription | null) => {
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
				LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription | null) => {
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
			if (this.sfwMode) {
				LeekWars.post('trophy/unlock', {trophy_id: 234}) // Trophée On me voit on me voit plus
			}
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
				LeekWars.toast(this.$t('error_not_same_password'))
				return false
			}
			LeekWars.post('farmer/change-password', {password: this.password, new_password: this.newPassword1}).then(data => {
				this.$store.commit('disconnect')
				LeekWars.toast(this.$i18n.t('settings.password_changed'))
				this.$router.push('/login')
			}).error(error => {
				LeekWars.toast(this.$t('error_' + error.error, error.params))
			})
			return false
		}

		deleteAccountConfirm() {
			if (this.$store.state.farmer.verified) {
				this.deleteDialog = false
				this.deleteConfirmDialog = true
			} else {
				LeekWars.post('farmer/unregister-fast').then(data => {
					this.deleteDialog = false
					this.deleteSuccessDialog = true
					setTimeout(() => {
						this.$store.commit('disconnect')
						this.deleteSuccessDialog = false
						this.$router.push('/')
					}, 3000)
				}).error(error => {
					this.deleteDialog = false
					this.deleteFailedDialog = true
					this.deleteFailedError = error
				})
			}
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

		updateGithubLogin() {
			LeekWars.post("settings/update-setting", {setting: 'github_login', value: this.settings.github_login})
		}

		@Watch('LeekWars.leekTheme')
		updateLeekTheme() {
			localStorage.setItem('leek-theme', '' + LeekWars.leekTheme)
		}

		submit(e: Event) {
			e.preventDefault()
			this.errors = {}
			const service = this.signupMethod === 1 ? 'farmer/verify' : 'farmer/verify-github'
			const args = {
				login: this.login,
				godfather: this.godfather,
			} as any
			if (this.signupMethod === 1) {
				args.password = this.password1
				args.email = this.email
			}
			LeekWars.post(service, args).then(data => {
				console.log("post", data, this.signupMethod)
				if (this.signupMethod === 1) {
					this.$router.push('/signup/success/' + this.login)
				} else {
					const redirect_uri = document.location.origin + "/api/farmer/verify-github"
					document.location.href = "https://github.com/login/oauth/authorize?client_id=0253d6b35d4db2a77a3b&scope=user:email&redirect_uri=" + redirect_uri + "&state=" + data.state
				}
			}).error(errors => {
				for (const error of errors) {
					const form = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][error[0]]
					this.addError(form, this.$t('error_' + error[1], error[2]) as string)
				}
			})
			return false
		}

		addError(form: string, error: string) {
			if (!(form in this.errors)) {
				Vue.set(this.$data.errors, form, [])
			}
			this.errors[form].push(error)
		}

		status(form: string) {
			if (form in this.errors) {
				if (Object.keys(this.errors[form]).length > 0) {
					return 'error'
				} else {
					return 'valid'
				}
			} else {
				return null
			}
		}
	}
</script>

<style lang="scss" scoped>
	.languages {
		text-align: center;
		.language {
			display: inline-block;
			padding: 8px;
			text-align: center;
			font-weight: 300;
			margin: 5px;
			cursor: pointer;
			border: 1px solid #ddd;
			border-radius: 2px;
		}
	}
	.languages .language.selected {
		background: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
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
			font-size: 16px;
			.v-icon {
				font-size: 18px;
				vertical-align: top;
			}
		}
		.item {
			color: #777;
			padding-top: 2px;
			padding-bottom: 5px;
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
	.notif-info {
		color: #777;
		font-size: 14px;
		padding-top: 10px;
		.v-icon {
			font-size: 16px;
			vertical-align: top;
		}
	}
	.v-input--switch {
		margin-left: 8px;
	}
	.account {
		text-align: left;
	}
	.v-btn.gh-button {
		height: 40px;
		margin-right: 10px;
		img {
			height: 20px;
			margin-right: 5px;
		}
	}
	.align-right {
		text-align: right;
		padding: 10px;
		width: 50%;
	}
	.align-left {
		text-align: left;
		width: 50%;
	}
	.verify {
		display: flex;
		padding: 10px;
		& > * {
			flex: 1;
		}
		ul {
			margin-bottom: 0;
			i {
				color: #5fad1b;
			}
		}
	}
	.space {
		height: 8px;
	}
	#app.app .verify {
		flex-direction: column;
		padding: 0;
	}
	input[status=error], input[status=error]:focus {
		border: 2px solid red;
	}
	.error-msg {
		color: red;
		font-size: 12px;
		margin: 5px 0;
	}
</style>