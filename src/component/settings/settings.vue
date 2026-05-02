<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<div class="tabs">
				<div v-if="$store.state.farmer && $store.state.farmer.verified" class="tab action" icon="mdi-power" @click="logout">
					<v-icon>mdi-power</v-icon>
					<span>{{ $t('logout') }}</span>
				</div>
			</div>
		</div>
		<panel v-if="$store.state.farmer && !$store.state.farmer.verified" :title="$t('verify')" icon="mdi-account-plus">
			<div class="verify">
				<div>
					<div><b><v-icon>mdi-information-outline</v-icon> {{ $t('verify_message') }}</b></div>
					<br>
					<div>{{ $t('verify_tip') }}</div>
					<br>
					<div>
						{{ $t('verify_pros') }}
						<ul>
							<li><v-icon>mdi-check</v-icon> {{ $t('verify_pro1') }}</li>
							<li><v-icon>mdi-check</v-icon> {{ $t('verify_pro2') }}</li>
							<li><v-icon>mdi-check</v-icon> {{ $t('verify_pro3') }}</li>
							<li><v-icon>mdi-check</v-icon> {{ $t('verify_pro4') }}</li>
							<li><v-icon>mdi-check</v-icon> {{ $t('verify_pro5') }}</li>
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
								<v-radio-group v-model="signupMethod" class="radio" :inline="true" :dense="true" :hide-details="true">
									<v-radio label="Email / mot de passe" :value="1" />
									<v-radio label="GitHub" :value="2" />
									<v-radio label="Google" :value="3" />
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
						<tr v-if="signupMethod === 2 || signupMethod === 3">
							<td><div class="space"></div></td>
						</tr>
					</table>
					<div class="center">
						<v-btn v-if="signupMethod === 1" size="large" color="primary" type="submit">{{ $t('verify') }}</v-btn>
						<v-btn v-else-if="signupMethod === 2" color="black" type="submit" class="gh-button"> <img src="/image/github_white.png"> {{ $t('verify_gh') }}</v-btn>
						<v-btn v-else type="submit" class="google-button"> <img src="/image/google.svg"> {{ $t('verify_google') }}</v-btn>
					</div>
				</form>
			</div>
		</panel>
		<div class="container grid large">
			<panel :title="$t('language')" class="languages" icon="mdi-translate">
				<div v-for="language in LeekWars.languages" :key="language.code" v-ripple :class="{selected: language.code == $i18n.locale}" :lang="language.code" class="language" @click="LeekWars.setLocale(language.code)">
					<flag :code="language.country" :clickable="false" />
					<br>
					{{ language.name }}
					<!-- ({{ language.code }}) -->
					<span v-if="language.beta" class="beta">bêta</span>
				</div>
			</panel>

			<panel :title="$t('misc_options')" icon="mdi-cog-outline">
				<div class="misc-settings">
					<div class="setting" id="dark-button">
						<div>{{ $t('theme') }}</div>
						<div width="100">
							<v-radio-group v-model="LeekWars.themeSetting" hide-details inline>
								<v-radio :label="$t('auto')" value="auto"></v-radio>
								<v-radio :label="$t('light')" value="light"></v-radio>
								<v-radio :label="$t('dark')" value="dark"></v-radio>
							</v-radio-group>
						</div>
					</div>
					<div class="setting" id="sfw-button">
						<div>{{ $t('activate_discrete_mode') }}</div>
						<div><v-switch v-model="sfwMode" hide-details /></div>
					</div>
					<div class="setting" id="notifs-popups-button">
						<div>{{ $t('notifs_popups') }}</div>
						<div><v-switch v-model="notifsPopups" hide-details /></div>
					</div>
					<div class="setting" id="notifs-results-button">
						<div>{{ $t('notifs_results') }}</div>
						<div><v-switch v-model="notifsResults" hide-details /></div>
					</div>
					<div class="setting" v-if="LeekWars.mobile">
						<div>{{ $t('chat_first') }}</div>
						<div><v-switch v-model="chatFirst" hide-details /></div>
					</div>
					<div class="setting" v-if="!LeekWars.mobile">
						<div>{{ $t('leek_theme') }}</div>
						<div><v-switch v-model="LeekWars.leekTheme" hide-details /></div>
					</div>
					<div class="setting">
						<div>{{ $t('modern_theme') }}</div>
						<div><v-switch v-model="modernTheme" hide-details /></div>
					</div>
				</div>
			</panel>

			<panel :title="$t('account')" icon="mdi-account" class="account">
				<div v-if="$store.state.farmer?.verified" v-ripple class="list-item card" @click="viewChangePassword = !viewChangePassword">
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
					<div class="center"><v-btn type="submit">{{ $t('change') }}</v-btn></div>
				</form>

				<div v-if="$store.state.farmer?.verified" v-ripple class="list-item card" @click="viewChangeEmail = !viewChangeEmail">
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
				<div v-if="viewDeleteAccount">
					<v-btn @click="deleteDialog = true" color="error">{{ $t('delete_account') }}</v-btn>
					<br><br>
				</div>

				<v-switch v-if="$store.state.farmer?.verified" v-model="settings.github_login" :disabled="!$store.state.farmer.pass && !settings.google_login" :label="$t('allow_github')" @change="updateGithubLogin" hide-details />
				<v-switch v-if="$store.state.farmer?.verified" v-model="settings.google_login" :disabled="!$store.state.farmer.pass && !settings.github_login" :label="$t('allow_google')" @change="updateGoogleLogin" hide-details />
			</panel>

			<panel v-if="$store.state.farmer?.verified" :title="$t('main.notifications')" icon="mdi-bell-outline">
				<template #actions>
					<span class="push-notifs-button" @click="updatePushNotifications">
						<span>{{ $t('push_notifications') }}</span>
						<v-switch :model-value="pushNotifications" hide-details />
					</span>
				</template>
				<template #content>
					<div class="content notifications">
						<table>
							<template v-for="category in mails" :key="category.name">
								<tr>
									<td class="category">
										<v-icon>{{ category.icon }}</v-icon>
										{{ $t('notification.category_' + category.id) }}
									</td>
								</tr>
								<tr>
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
				</template>
			</panel>
		</div>

		<div class="center">
			<div class="advanced-button" @click="advanced = !advanced">
				{{ $t('advanced') }}
				<v-icon v-if="advanced">mdi-chevron-up</v-icon>
				<v-icon v-else>mdi-chevron-down</v-icon>
			</div>
		</div>

		<div v-if="advanced" class="container grid large">
			<panel :title="$t('empty_localstorage')" class="last" icon="mdi-eraser">
				<v-btn class="clear-localstorage" @click="clearLocalStorage">{{ $t('empty') }}</v-btn>
			</panel>
		</div>

		<popup v-model="deleteDialog" :width="600">
			<template #icon><v-icon>mdi-delete</v-icon></template>
			<template #title><span>{{ $t('delete_account') }}</span></template>
			<div v-html="$t('delete_message')"></div>
			<br v-if="$store.state.farmer?.verified">
			<v-switch v-if="$store.state.farmer?.verified" v-model="deleteForumMessages" :label="$t('delete_forum_messages')" hide-details />
			<template #actions>
				<div v-ripple class="action dismiss" @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="action red" @click="deleteAccountConfirm">{{ $t('delete_confirm') }}</div>
			</template>
		</popup>

		<popup v-model="deleteConfirmDialog" :width="600">
			<template #icon><v-icon>mdi-delete</v-icon></template>
			<template #title><span>{{ $t('delete_confirmation') }}</span></template>
			{{ $t('delete_confirmation_password') }} : <br><br>
			{{ $t('delete_password') }} : <input v-model="deleteConfirmPassword" type="password">
			<template #actions>
				<div v-ripple class="action dismiss" @click="deleteConfirmDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="action red" @click="deleteAccountFinal">{{ $t('delete_finalize') }}</div>
			</template>
		</popup>

		<popup v-model="deleteSuccessDialog" :width="600">
			<template #icon><v-icon>mdi-delete</v-icon></template>
			<template #title><span>{{ $t('delete_success') }}</span></template>
			{{ $t('delete_success_message') }}
		</popup>

		<popup v-model="deleteFailedDialog" :width="600">
			<template #icon><v-icon>mdi-delete</v-icon></template>
			<template #title><span>{{ $t('delete_failed') }}</span></template>
			{{ $t(deleteFailedError) }}
		</popup>
	</div>
</template>

<script setup lang="ts">
	import TwoFactor from '@/component/settings/two-factor.vue'
	import { mixins, t as gt } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useRouter } from 'vue-router'

	defineOptions({ name: 'settings', i18n: {}, mixins: [...mixins], components: { TwoFactor } })

	const { t } = useI18n()
	const router = useRouter()

	const vapid_key = new Uint8Array([4, 92, 237, 40, 114, 162, 99, 215, 179, 242, 70, 151, 236, 60, 216, 10, 167, 186, 77, 27, 233, 193, 117, 111, 78, 20, 121, 201, 142, 186, 91, 13, 111, 26, 241, 126, 12, 216, 94, 160, 38, 110, 214, 161, 249, 147, 233, 133, 128, 210, 170, 161, 158, 57, 24, 54, 194, 103, 195, 94, 49, 182, 20, 62, 184])
	const mails = [
		{ id: 1, icon: 'mdi-star', name: 'general' },
		{ id: 2, icon: 'mdi-gamepad-square', name: 'game' },
		{ id: 3, icon: 'mdi-sword-cross', name: 'fight' },
		{ id: 4, icon: 'mdi-flag', name: 'challenge' },
		{ id: 5, icon: 'mdi-trophy', name: 'tournament' },
		{ id: 6, icon: 'mdi-chat', name: 'social' },
		{ id: 7, icon: 'mdi-message-text-outline', name: 'private' },
		{ id: 8, icon: 'mdi-account-multiple', name: 'team' },
		{ id: 9, icon: 'mdi-gavel', name: 'moderation' }
	]

	const settings = ref<any>(null)
	const sfwMode = ref(localStorage.getItem('sfw') === 'true')
	const notifsPopups = ref(localStorage.getItem('options/notifs-popups') !== 'false')
	const notifsResults = ref(localStorage.getItem('options/notifs-results') === 'true')
	const chatFirst = ref(localStorage.getItem('options/chat-first') === 'true')
	const modernTheme = ref(localStorage.getItem('theme') === 'xp')
	const pushNotifications = ref(localStorage.getItem('options/push-notifs') === 'true')
	const deleteDialog = ref(false)
	const deleteConfirmDialog = ref(false)
	const deleteConfirmPassword = ref('')
	const deleteSuccessDialog = ref(false)
	const deleteFailedDialog = ref(false)
	const deleteFailedError = ref<any>(null)
	const deleteForumMessages = ref(false)
	const advanced = ref(false)
	const password = ref('')
	const newPassword1 = ref('')
	const newPassword2 = ref('')
	const viewChangePassword = ref(false)
	const viewChangeEmail = ref(false)
	const viewDeleteAccount = ref(false)
	const view2FA = ref(false)
	const changeEmailSent = ref(false)
	const errors = ref<{[key: string]: string[]}>({})
	const login = ref('')
	const godfather = ref('')
	const signupMethod = ref(1)
	const email = ref('')
	const password1 = ref('')

	settings.value = {}
	for (const category in mails) {
		settings.value['push_' + category] = false
	}
	if (store.state.farmer && store.state.farmer.verified) {
		LeekWars.setActions([
			{icon: 'mdi-power', click: () => logout()}
		])
	}

	LeekWars.get('settings/get-settings').then(data => {
		settings.value = data.settings
		if (store.state.farmer) {
			LeekWars.setTitle(t('title'), store.state.farmer.name)
		}
		if (LeekWars.service_worker) {
			LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription | null) => {
				if (subscription) {
					for (const endpoint of data.push_endpoints) {
						if (subscription.endpoint === endpoint) {
							pushNotifications.value = true
							break
						}
					}
				}
			})
		}
	})

	function updatePushNotifications(_e: Event) {
		if (!LeekWars.service_worker) { return }
		if (pushNotifications.value) {
			LeekWars.service_worker.pushManager.getSubscription().then((subscription: PushSubscription | null) => {
				if (subscription) {
					subscription.unsubscribe()
				}
			})
		} else {
			LeekWars.service_worker.pushManager.subscribe({
				applicationServerKey: vapid_key,
				userVisibleOnly: true
			}).then((subscription: PushSubscription) => {
				LeekWars.post('push-endpoint/register', {subscription: JSON.stringify(subscription)})
			})
		}
		pushNotifications.value = !pushNotifications.value
	}

	function logout() {
		LeekWars.logoutDialog = true
	}

	function clearLocalStorage() {
		localStorage.clear()
		LeekWars.toast("localstorage cleared!")
		setTimeout(() => location.reload(), 800)
	}

	watch(sfwMode, () => {
		localStorage.setItem('sfw', '' + sfwMode.value)
		sfwMode.value ? LeekWars.sfwOn() : LeekWars.sfwOff()
		if (sfwMode.value) {
			LeekWars.post('trophy/unlock', {trophy_id: 234})
		}
	})

	watch(() => LeekWars.themeSetting, () => {
		localStorage.setItem('theme', '' + LeekWars.themeSetting)
		LeekWars.xpTheme = LeekWars.themeSetting === 'xp'
		modernTheme.value = LeekWars.themeSetting === 'xp'
		localStorage.setItem('xp-theme', '' + LeekWars.xpTheme)
		if (LeekWars.themeSetting === 'xp') {
			import('@/xp.scss')
			LeekWars.xpCursorsInit()
			LeekWars.darkMode = false
			if (LeekWars.aprilFools) {
				LeekWars.post('trophy/unlock', {trophy_id: 280})
			}
		} else {
			document.querySelectorAll<HTMLElement>('[style*="pointer.png"]').forEach(el => { el.style.cursor = '' })
			LeekWars.darkMode = LeekWars.themeSetting !== 'auto' ? LeekWars.themeSetting === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
		}
	})

	watch(modernTheme, () => {
		LeekWars.themeSetting = modernTheme.value ? 'xp' : 'auto'
	})

	watch(notifsPopups, () => {
		localStorage.setItem('options/notifs-popups', '' + notifsPopups.value)
		LeekWars.notifsPopups = notifsPopups.value
	})

	watch(notifsResults, () => {
		localStorage.setItem('options/notifs-results', '' + notifsResults.value)
		LeekWars.notifsResults = notifsResults.value
	})

	watch(chatFirst, () => {
		localStorage.setItem('options/chat-first', '' + chatFirst.value)
	})

	function updateNotif(setting: string, value: boolean) {
		LeekWars.post('settings/update-setting', {setting, value})
	}

	function changePassword(e: Event) {
		e.preventDefault()
		if (newPassword1.value !== newPassword2.value) {
			LeekWars.toast(t('error_not_same_password'))
			return false
		}
		LeekWars.post('farmer/change-password', {password: password.value, new_password: newPassword1.value}).then(() => {
			store.commit('disconnect')
			LeekWars.toast(gt('settings.password_changed'))
			router.push('/login')
		}).error(error => {
			LeekWars.toast(t('error_' + error.error, error.params))
		})
		return false
	}

	function deleteAccountConfirm() {
		if (store.state.farmer!.verified) {
			deleteDialog.value = false
			deleteConfirmDialog.value = true
		} else {
			LeekWars.post('farmer/unregister-fast').then(() => {
				deleteDialog.value = false
				deleteSuccessDialog.value = true
				setTimeout(() => {
					store.commit('disconnect')
					deleteSuccessDialog.value = false
					router.push('/')
				}, 3000)
			}).error(error => {
				deleteDialog.value = false
				deleteFailedDialog.value = true
				deleteFailedError.value = error.error
			})
		}
	}

	function deleteAccountFinal() {
		LeekWars.post('farmer/unregister', {password: deleteConfirmPassword.value, delete_forum_messages: deleteForumMessages.value}).then(() => {
			deleteConfirmDialog.value = false
			deleteSuccessDialog.value = true
			setTimeout(() => {
				store.commit('disconnect')
				deleteSuccessDialog.value = false
				router.push('/')
			}, 3000)
		}).error(error => {
			deleteConfirmDialog.value = false
			deleteFailedDialog.value = true
			deleteFailedError.value = error.error
		})
	}

	function sendChangeEmail() {
		LeekWars.post('farmer/change-email1').then(() => {
			LeekWars.toast(gt('change_email_sent'))
		})
		changeEmailSent.value = true
	}

	function updateGithubLogin() {
		LeekWars.post("settings/update-setting", {setting: 'github_login', value: settings.value.github_login})
	}

	function updateGoogleLogin() {
		LeekWars.post("settings/update-setting", {setting: 'google_login', value: settings.value.google_login})
	}

	watch(() => LeekWars.leekTheme, () => {
		localStorage.setItem('leek-theme', '' + LeekWars.leekTheme)
		// Cookie miroir pour que le serveur puisse injecter le bon preload du big-leek dans le HTML.
		document.cookie = 'leek_theme=' + (LeekWars.leekTheme ? '1' : '0') + '; path=/; max-age=31536000; SameSite=Lax'
	})

	function submit(e: Event) {
		e.preventDefault()
		errors.value = {}
		const provider = signupMethod.value === 2 ? 'github' : signupMethod.value === 3 ? 'google' : null
		const service = provider ? `farmer/verify-${provider}` : 'farmer/verify'
		const args = {
			login: login.value,
			godfather: godfather.value,
		} as any
		if (signupMethod.value === 1) {
			args.password = password1.value
			args.email = email.value
		}
		LeekWars.post(service, args).then(() => {
			if (provider) {
				document.location.href = LeekWars.API + `farmer/start-${provider}-login`
			} else {
				router.push('/signup/success/' + login.value)
			}
		}).error(errs => {
			for (const error of errs) {
				const form = ['login', 'leek', 'email', 'password1', 'password2', 'godfather'][error[0]]
				addError(form, t('error_' + error[1], error[2]) as string)
			}
		})
		return false
	}

	function addError(form: string, error: string) {
		if (!(form in errors.value)) {
			errors.value[form] = []
		}
		errors.value[form].push(error)
	}

	function status(form: string) {
		if (form in errors.value) {
			if (Object.keys(errors.value[form]).length > 0) {
				return 'error'
			} else {
				return 'valid'
			}
		} else {
			return null
		}
	}
</script>

<style lang="scss" scoped>
	.languages {
		text-align: center;
		.language {
			display: inline-block;
			padding: 7px;
			text-align: center;
			margin: 5px;
			cursor: pointer;
			border: 1px solid var(--border);
			border-radius: 2px;
			position: relative;
			.beta {
				position: absolute;
				top: -5px;
				right: -5px;
				background: var(--pure-white);
				padding: 2px 4px;
				border: 1px solid #aaa;
				border-radius: 4px;
				font-size: 12px;
			}
			.flag {
				height: 22px;
				margin-bottom: 10px;
			}
		}
	}
	.languages .language.selected {
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
	}
	.misc-settings {
		width: 100%;
		font-size: 15px;
		.setting {
			display: flex;
			justify-content: space-between;
			align-items: center;
			.v-input--radio-group--row :deep(.v-input--radio-group__input) {
				flex-wrap: nowrap;
			}
			.v-radio {
				margin-right: 8px;
				&:last-child {
					margin-right: 0;
				}
			}
		}
		.flex {
			gap: 8px;
		}
		td {
			text-align: left;
			padding: 2px;
			&:last-child {
				text-align: right;
			}
		}
	}
	.list-item {
		text-align: left;
		padding: 8px;
		cursor: pointer;
		background: var(--pure-white);
		font-size: 16px;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
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
		display: flex;
		cursor: pointer;
		align-items: center;
		gap: 8px;
		padding: 0 8px;
		> span {
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
	:deep(.v-switch .v-selection-control) {
		min-height: unset;
	}
	.account {
		text-align: left;
	}
	.v-btn.gh-button, .v-btn.google-button {
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
