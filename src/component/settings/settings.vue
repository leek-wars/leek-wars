<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="settings" fallback="mdi-cog" />
				<div class="page-title-text">
					<h1>{{ $t('title') }}</h1>
				</div>
			</div>
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
								<input v-model="login" :status="status('login')" :aria-label="$t('your_farmer_name')" name="login" type="text" autocomplete="username" required>
								<div v-for="e in errors.login" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td class="align-right"><i>{{ $t('godfather') }}</i></td>
							<td class="align-left">
								<input v-model="godfather" :status="status('godfather')" :aria-label="$t('godfather')" type="text">
								<div v-for="e in errors.godfather" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr>
							<td><div class="space"></div></td>
						</tr>
						<tr>
							<td colspan="2">
								<lw-radio-group v-model="signupMethod" class="radio" :inline="true">
									<lw-radio label="Email / mot de passe" :value="1" />
									<lw-radio label="GitHub" :value="2" />
									<lw-radio label="Google" :value="3" />
								</lw-radio-group>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('your_email') }}</td>
							<td class="align-left">
								<input v-model="email" :status="status('email')" :aria-label="$t('your_email')" name="email" type="text" autocomplete="email" required>
								<div v-for="e in errors.email" :key="e" class="error-msg">{{ e }}</div>
							</td>
						</tr>
						<tr v-if="signupMethod === 1">
							<td class="align-right">{{ $t('password') }}</td>
							<td class="align-left">
								<input v-model="password1" :status="status('password1')" :aria-label="$t('password')" name="password" type="password" autocomplete="new-password" required>
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
						<v-btn v-if="signupMethod === 1" size="large" color="primary" type="submit" :disabled="submittingVerify" :loading="submittingVerify">{{ $t('verify') }}</v-btn>
						<v-btn v-else-if="signupMethod === 2" color="black" type="submit" class="gh-button" :disabled="submittingVerify" :loading="submittingVerify"> <v-icon>mdi-github</v-icon> {{ $t('verify_gh') }}</v-btn>
						<v-btn v-else type="submit" class="google-button" :disabled="submittingVerify" :loading="submittingVerify"> <img src="/image/google.svg"> {{ $t('verify_google') }}</v-btn>
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
					<div id="dark-button" class="setting">
						<div>{{ $t('theme') }}</div>
						<div width="100">
							<lw-radio-group v-model="LeekWars.themeSetting" inline>
								<lw-radio :label="$t('auto')" value="auto"></lw-radio>
								<lw-radio :label="$t('light')" value="light"></lw-radio>
								<lw-radio :label="$t('dark')" value="dark"></lw-radio>
							</lw-radio-group>
						</div>
					</div>
					<!-- Interrupteur AVANT le libellé (demande de Pierre, 2026-08-31) : la
					     prop label de lw-switch fait ça toute seule, et la ligne entière
					     reste cliquable. -->
					<lw-switch id="sfw-button" v-model="sfwMode" class="setting" :label="$t('activate_discrete_mode')" />
					<lw-switch id="notifs-popups-button" v-model="notifsPopups" class="setting" :label="$t('notifs_popups')" />
					<lw-switch id="notifs-results-button" v-model="notifsResults" class="setting" :label="$t('notifs_results')" />
					<lw-switch id="notifs-open-report-button" v-model="notifsOpenReport" class="setting" :label="$t('notifs_open_report')" />
					<lw-switch v-if="LeekWars.mobile" v-model="chatFirst" class="setting" :label="$t('chat_first')" />
					<lw-switch v-model="homeDashboard" class="setting" :label="$t('home_dashboard')" />
					<!-- « Ancien design » masqué le 2026-09-10 à la demande de Pierre : la
					     bascule reviendra, mais pas dans cette màj. Le réglage lui-même
					     est intact (clé `design` du localStorage, `LeekWars.legacyTheme`),
					     seule la case disparaît de la page — un joueur déjà en v2 y
					     reste, et une ligne suffit à la remettre. -->
					<lw-switch v-if="false" v-model="LeekWars.legacyTheme" class="setting" :label="$t('legacy_theme')" />
					<lw-switch v-model="modernTheme" class="setting" :label="$t('modern_theme')" />
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
					<input v-if="$store.state.farmer.pass" v-model="password" :aria-label="$t('old_password')" name="password" type="password" autocomplete="current-password">
					<br v-if="$store.state.farmer.pass">
					<h4>{{ $t('new_password') }}</h4>
					<input v-model="newPassword1" :aria-label="$t('new_password')" name="new_password1" type="password" autocomplete="new-password" required> <br>
					<h4>{{ $t('confirm_password') }}</h4>
					<input v-model="newPassword2" :aria-label="$t('confirm_password')" name="new_password2" type="password" autocomplete="new-password" required> <br>
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

				<div v-ripple class="list-item card" @click="exportData">
					<v-icon>mdi-download</v-icon>
					<span class="label">{{ $t('export_data') }}</span>
					<v-icon v-if="exporting">mdi-loading</v-icon>
				</div>

				<div v-ripple class="list-item card" @click="viewDeleteAccount = !viewDeleteAccount">
					<v-icon>mdi-delete-forever</v-icon>
					<span class="label">{{ $t('delete_account') }}</span>
					<v-icon>{{ viewDeleteAccount ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
				</div>
				<div v-if="viewDeleteAccount">
					<v-btn color="error" @click="deleteDialog = true">{{ $t('delete_account') }}</v-btn>
					<br><br>
				</div>

				<router-link to="/bank/history" class="list-item card">
					<v-icon>mdi-history</v-icon>
					<span class="label">{{ $t('purchase_history') }}</span>
					<v-icon>mdi-chevron-right</v-icon>
				</router-link>

				<lw-switch v-if="settings && $store.state.farmer?.verified" v-model="settings.github_login" :disabled="!$store.state.farmer.pass && !settings.google_login" :label="$t('allow_github')" @change="updateGithubLogin" />
				<lw-switch v-if="settings && $store.state.farmer?.verified" v-model="settings.google_login" :disabled="!$store.state.farmer.pass && !settings.github_login" :label="$t('allow_google')" @change="updateGoogleLogin" />
			</panel>

			<!-- Abonnement LW+ (#3303). lwplus_until fait partie du bloc privé du farmer
			     connecté : ce récap ne coûte donc aucune requête. Le détail (renouvellement
			     ou non) et les actions vivent sur /lwplus, seul endroit qui interroge Stripe. -->
			<panel :title="$t('lwplus')" icon="mdi-star-four-points" class="lwplus">
				<div class="lwplus-status">
					<v-icon v-if="lwplusActive" class="ok">mdi-check-decagram</v-icon>
					<span>{{ lwplusActive ? $t('lwplus_active_until', [formatDate(lwplusUntil)]) : $t('lwplus_inactive') }}</span>
				</div>
				<router-link to="/lwplus" class="list-item card">
					<v-icon>mdi-star-four-points</v-icon>
					<span class="label">{{ lwplusActive ? $t('lwplus_manage') : $t('lwplus_discover') }}</span>
					<v-icon>mdi-chevron-right</v-icon>
				</router-link>
			</panel>

			<panel v-if="$store.state.farmer?.verified" :title="$t('main.notifications')" icon="mdi-bell-outline">
				<template #actions>
					<v-tooltip :disabled="!pushHint" location="bottom">
						<template #activator="{ props }">
							<span class="push-notifs-button" v-bind="props" @click="updatePushNotifications">
								<v-icon v-if="pushHint" class="push-warning">mdi-alert-circle-outline</v-icon>
								<span>{{ $t('push_notifications') }}</span>
								<lw-switch :model-value="pushNotifications" />
							</span>
						</template>
						{{ pushHint }}
					</v-tooltip>
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
									<td v-if="settings" class="push">
										<lw-checkbox v-model="settings['push_' + category.name]" label="Push" @update:model-value="updateNotif('push_' + category.name, settings['push_' + category.name])" />
									</td>
									<td v-if="settings" class="mail">
										<lw-checkbox v-model="settings['mail_' + category.name]" label="E-mail" @update:model-value="updateNotif('mail_' + category.name, settings['mail_' + category.name])" />
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

			<accounts v-if="$store.state.farmer && $store.state.farmer.verified" />

			<api-keys v-if="$store.state.farmer && $store.state.farmer.verified" />
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
			<div v-if="teamOwner" class="team-warning">
				<v-icon>mdi-alert</v-icon>
				<span v-if="teamOwnerAlone">{{ $t('delete_team_dissolve', [teamName]) }}</span>
				<span v-else>{{ $t('delete_team_transfer', [teamName]) }}</span>
			</div>
			<br v-if="$store.state.farmer?.verified">
			<lw-switch v-if="$store.state.farmer?.verified" v-model="deleteForumMessages" :label="$t('delete_forum_messages')" />
			<template #actions>
				<div v-ripple class="action dismiss" @click="deleteDialog = false">{{ $t('delete_cancel') }}</div>
				<div v-ripple class="action red" @click="deleteAccountConfirm">{{ $t('delete_confirm') }}</div>
			</template>
		</popup>

		<popup v-model="deleteConfirmDialog" :width="600">
			<template #icon><v-icon>mdi-delete</v-icon></template>
			<template #title><span>{{ $t('delete_confirmation') }}</span></template>
			{{ $t('delete_confirmation_password') }} : <br><br>
			{{ $t('delete_password') }} : <input v-model="deleteConfirmPassword" :aria-label="$t('delete_password')" type="password" autocomplete="current-password">
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
			{{ $t('error_' + deleteFailedError) }}
		</popup>
	</div>
</template>

<script setup lang="ts">
	import TwoFactor from '@/component/settings/two-factor.vue'
	import { apiErrorKey, apiFieldMessages } from '@/model/api-error'
	import { locale, mixins, t as gt , useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { TeamMemberLevel } from '@/model/team'
	import { usePushNotifications } from '@/model/use-push-notifications'
	import { computed, defineAsyncComponent, ref, watch } from 'vue'
	import { useRouter } from 'vue-router'

	// Composant async : utilisable directement dans le template (script setup),
	// NE PAS le référencer dans defineOptions (variable locale, hoisting interdit).
	const ApiKeys = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/api-keys/api-keys.${locale}.i18n`))
	const Accounts = defineAsyncComponent(() => import(/* webpackChunkName: "[request]" */ `@/component/accounts/accounts.${locale}.i18n`))

	defineOptions({ name: 'Settings', i18n: {}, mixins: [...mixins], components: { TwoFactor } })

	const t = useNamespacedT('settings')
	const router = useRouter()

	const mails = [
		{ id: 1, icon: 'mdi-star', name: 'general' },
		{ id: 2, icon: 'mdi-gamepad-square', name: 'game' },
		{ id: 3, icon: 'mdi-sword-cross', name: 'fight' },
		{ id: 4, icon: 'mdi-flag-outline', name: 'challenge' },
		{ id: 5, icon: 'mdi-tournament', name: 'tournament' },
		{ id: 6, icon: 'mdi-chat', name: 'social' },
		{ id: 7, icon: 'mdi-message-text-outline', name: 'private' },
		{ id: 8, icon: 'mdi-account-multiple', name: 'team' },
		{ id: 9, icon: 'mdi-gavel', name: 'moderation' }
	]

	const settings = ref<Record<string, boolean> | null>(null)
	const sfwMode = ref(localStorage.getItem('sfw') === 'true')
	const notifsPopups = ref(localStorage.getItem('options/notifs-popups') !== 'false')
	const notifsResults = ref(localStorage.getItem('options/notifs-results') === 'true')
	const notifsOpenReport = ref(localStorage.getItem('options/notifs-open-report') === 'true')
	const chatFirst = ref(localStorage.getItem('options/chat-first') === 'true')
	const homeDashboard = ref(localStorage.getItem('options/home-dashboard') !== 'false')
	const modernTheme = ref(localStorage.getItem('theme') === 'xp')
	const { pushSupported, pushNotifications, pushHint, reconcilePushToggle, updatePushNotifications } = usePushNotifications(t)
	const deleteDialog = ref(false)
	const deleteConfirmDialog = ref(false)
	const deleteConfirmPassword = ref('')
	const deleteSuccessDialog = ref(false)
	const deleteFailedDialog = ref(false)
	const deleteFailedError = ref<string>('unknown')
	const deleteForumMessages = ref(false)
	const exporting = ref(false)
	const advanced = ref(false)
	const password = ref('')
	const newPassword1 = ref('')
	const newPassword2 = ref('')
	const viewChangePassword = ref(false)
	const viewChangeEmail = ref(false)
	const viewDeleteAccount = ref(false)
	const changeEmailSent = ref(false)
	const errors = ref<{[key: string]: string[]}>({})
	const login = ref('')
	const godfather = ref('')
	const signupMethod = ref(1)
	const email = ref('')
	const password1 = ref('')
	const submittingVerify = ref(false)

	// Créateur d'une équipe : elle sera transmise au membre le plus ancien
	// à la suppression du compte, ou dissoute s'il est le seul membre
	// Abonnement LW+ (#3303) : lu depuis le farmer du store, pas d'appel réseau.
	const formatDate = LeekWars.formatDate
	const lwplusUntil = computed(() => store.state.farmer?.lwplus_until ?? 0)
	const lwplusActive = computed(() => lwplusUntil.value * 1000 > Date.now())

	const teamOwner = computed(() => !!store.state.farmer?.team && store.state.farmer.team.member_level === TeamMemberLevel.OWNER)
	const teamOwnerAlone = computed(() => store.state.farmer?.team?.member_count === 1)
	const teamName = computed(() => store.state.farmer?.team?.name || '')

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
		// La page Réglages a la liste serveur des endpoints : on exige que l'endpoint local y figure.
		reconcilePushToggle(data.push_endpoints)
	})

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
		if (sfwMode.value) { LeekWars.sfwOn() } else { LeekWars.sfwOff() }
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

	watch(() => LeekWars.legacyTheme, () => {
		localStorage.setItem('design', LeekWars.legacyTheme ? 'v2' : 'v3')
	})

	watch(notifsPopups, () => {
		localStorage.setItem('options/notifs-popups', '' + notifsPopups.value)
		LeekWars.notifsPopups = notifsPopups.value
	})

	watch(notifsResults, () => {
		localStorage.setItem('options/notifs-results', '' + notifsResults.value)
		LeekWars.notifsResults = notifsResults.value
	})

	watch(notifsOpenReport, () => {
		localStorage.setItem('options/notifs-open-report', '' + notifsOpenReport.value)
		LeekWars.notifsOpenReport = notifsOpenReport.value
	})

	watch(chatFirst, () => {
		localStorage.setItem('options/chat-first', '' + chatFirst.value)
	})

	watch(homeDashboard, () => {
		localStorage.setItem('options/home-dashboard', '' + homeDashboard.value)
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

	function exportData() {
		if (exporting.value) return
		exporting.value = true
		LeekWars.get('farmer/export-data').then(data => {
			const json = JSON.stringify(data.export, null, '\t')
			const blob = new Blob([json], {type: 'application/json'})
			const url = URL.createObjectURL(blob)
			const playerName = (store.state.farmer?.name || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')
			const link = document.createElement('a')
			link.href = url
			link.download = 'leekwars-data-' + playerName + '.json'
			link.click()
			URL.revokeObjectURL(url)
			exporting.value = false
		}).error(error => {
			LeekWars.toast(t('error_' + error.error, error.params))
			exporting.value = false
		})
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
				deleteFailedError.value = typeof error?.error === 'string' ? error.error : 'unknown'
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
			deleteFailedError.value = typeof error?.error === 'string' ? error.error : 'unknown'
		})
	}

	function sendChangeEmail() {
		LeekWars.post('farmer/change-email1').then(() => {
			LeekWars.toast(gt('change_email_sent'))
		})
		changeEmailSent.value = true
	}

	function updateGithubLogin() {
		if (!settings.value) return
		LeekWars.post("settings/update-setting", {setting: 'github_login', value: settings.value.github_login})
	}

	function updateGoogleLogin() {
		if (!settings.value) return
		LeekWars.post("settings/update-setting", {setting: 'google_login', value: settings.value.google_login})
	}

	function submit(e: Event) {
		e.preventDefault()
		if (submittingVerify.value) return false
		submittingVerify.value = true
		errors.value = {}
		const provider = signupMethod.value === 2 ? 'github' : signupMethod.value === 3 ? 'google' : null
		const service = provider ? `farmer/verify-${provider}` : 'farmer/verify'
		const args: Record<string, unknown> = {
			login: login.value,
			godfather: godfather.value,
			source: 'settings',
		}
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
		}).error(error => {
			submittingVerify.value = false
			if (error.fields) {
				for (const [field, message] of apiFieldMessages(error, t)) addError(field, message)
			} else {
				LeekWars.toast(t(apiErrorKey(error), error.params ?? []))
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
	.team-warning {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
		padding: 8px 12px;
		border-radius: var(--radius);
		background: #fff3e0;
		color: #a04000;
		.v-icon {
			color: #e67e22;
		}
	}
	body.dark .team-warning {
		background: #4a3520;
		color: #ffcc80;
	}
	.languages {
		text-align: center;
		.language {
			display: inline-block;
			padding: 7px;
			text-align: center;
			margin: 5px;
			cursor: pointer;
			border: 1px solid var(--border);
			border-radius: var(--radius-tiny);
			position: relative;
			.beta {
				position: absolute;
				top: -5px;
				right: -5px;
				background: var(--pure-white);
				padding: 2px 4px;
				border: 1px solid var(--grey-9);
				border-radius: var(--radius);
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
		box-shadow: var(--elevation-1);
	}
	// v3 : une grille régulière (Pierre, 2026-09-08 : « mettre les langues en
	// grille plus propre ») — cases de même taille, drapeau, nom et l'étiquette
	// « bêta » DANS la case, plus de pastille qui déborde du coin. Même jeu
	// d'états que les onglets : trait à l'encre au survol, vert pressé, et la
	// langue courante en trait et encre verts.
	body:not(.v2) .languages :deep(.content) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
		gap: 6px;
		padding: 8px;
	}
	body:not(.v2) .languages .language {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		margin: 0;
		padding: 7px 4px 6px;
		min-height: 66px;
		border: 1px solid var(--border-strong);
		border-radius: 0;
		background: var(--background-input);
		font-size: 12px;
		transition: border-color .12s ease, color .12s ease;
		br {
			display: none;
		}
		.flag {
			height: 18px;
			margin: 0;
		}
		.beta {
			position: static;
			padding: 0 4px;
			font-family: var(--font-display);
			font-size: 8px;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--text-color-secondary);
			background: none;
			border: 1px solid var(--border);
			border-radius: 0;
		}
		&:hover {
			border-color: var(--text-color);
		}
		&:active {
			border-color: var(--primary);
			color: var(--primary);
		}
	}
	body:not(.v2) .languages .language.selected {
		background: var(--background-header);
		border-color: var(--primary);
		color: var(--primary);
		box-shadow: none;
	}
	.misc-settings {
		width: 100%;
		font-size: 15px;
		// Une colonne de lignes aérées, contrôle à gauche (demande de Pierre) :
		// plus de libellé à un bord et d'interrupteur à l'autre.
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		.setting {
			display: flex;
			align-items: center;
			gap: 10px;
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
		color: var(--text-color);
		text-decoration: none;
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
			color: var(--text-color-secondary);
		}
		input {
			margin-top: 3px;
			margin-bottom: 8px;
		}
	}
	.advanced-button {
		// Posé sur le fond d'app derrière un voile gris : l'encre suit la barre
		// de page, --white supposait une coquille sombre (v2 seulement).
		color: var(--page-bar-color);
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
			color: var(--white);
		}
		.push-warning {
			color: #ffca28;
			font-size: 20px;
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
			color: var(--text-color-secondary);
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
		color: var(--text-color-secondary);
		font-size: 14px;
		padding-top: 10px;
		.v-icon {
			font-size: 16px;
			vertical-align: top;
		}
	}
	// Les lignes d'« Options diverses » (.setting) sont calées à gauche, sans retrait.
	.lw-switch:not(.setting) {
		margin-left: 8px;
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
				color: var(--primary);
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
	// Or du système en encre (--rank-first), comme la page /lwplus et les lots de
	// mois : le jeton s'inverse seul en sombre, un hex en dur non.
	.lwplus-status {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 12px 12px;
		.ok {
			color: var(--rank-first);
			font-size: 26px;
		}
	}
</style>
