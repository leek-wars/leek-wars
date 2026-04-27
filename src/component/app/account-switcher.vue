<template lang="html">
	<v-list :dense="true" class="account-switcher-menu">
		<v-list-item v-for="account in $store.state.accounts" :key="account.id" :class="{ active: isActive(account), disconnected: !account.connected && !isActive(account) }" @click="switchAccount(account)">
			<template #prepend>
				<div class="account-avatar-wrapper">
					<img :src="avatarUrl(account)" class="account-avatar">
					<v-progress-circular v-if="switchingId === account.id" indeterminate size="32" width="2" color="primary" class="account-avatar-loader" />
				</div>
			</template>
			<v-list-item-title class="account-name">{{ account.name }}</v-list-item-title>
			<v-list-item-subtitle>
				<span v-if="isActive(account)" class="status-active">{{ $t('main.account_active') }}</span>
				<span v-else-if="account.connected" class="status-connected">{{ $t('main.account_connected') }}</span>
				<span v-else class="status-expired">{{ $t('main.account_expired') }}</span>
			</v-list-item-subtitle>
			<template #append>
				<v-btn v-if="account.connected" icon size="small" variant="text" class="account-action" :title="$t('main.account_disconnect')" :loading="loadingId === account.id && loadingAction === 'disconnect'" @click.stop="disconnectAccount(account)">
					<v-icon>mdi-logout</v-icon>
				</v-btn>
				<v-btn icon size="small" variant="text" class="account-action" :title="$t('main.account_remove')" :loading="loadingId === account.id && loadingAction === 'remove'" @click.stop="removeAccount(account)">
					<v-icon>mdi-close</v-icon>
				</v-btn>
			</template>
			<v-menu v-if="!account.connected && !isActive(account)" :model-value="loginMenuId === account.id" @update:model-value="loginMenuId = $event ? account.id : null" activator="parent" location="end" :close-on-content-click="false" :open-on-click="true">
				<v-card class="login-submenu">
					<form @submit.prevent="loginNewAccount">
						<input v-model="loginForm.password" type="password" :placeholder="$t('main.account_password')" class="login-input" @click.stop>
						<div v-if="loginError" class="login-error">{{ loginError }}</div>
						<v-btn size="small" color="primary" type="submit" block :loading="loginLoading">{{ $t('main.connection') }}</v-btn>
					</form>
				</v-card>
			</v-menu>
		</v-list-item>
		<v-divider />
		<v-list-item link :ripple="true">
			<template #prepend>
				<v-icon>mdi-plus</v-icon>
			</template>
			<v-list-item-title>{{ $t('main.account_add') }}</v-list-item-title>
			<v-menu v-model="addMenuOpen" activator="parent" location="end" :close-on-content-click="false">
				<v-card class="login-submenu">
					<form @submit.prevent="loginNewAccount">
						<input v-model="loginForm.login" type="text" :placeholder="$t('main.account_login')" class="login-input" @click.stop>
						<input v-model="loginForm.password" type="password" :placeholder="$t('main.account_password')" class="login-input" @click.stop>
						<div v-if="loginError" class="login-error">{{ loginError }}</div>
						<v-btn size="small" color="primary" type="submit" block :loading="loginLoading">{{ $t('main.connection') }}</v-btn>
					</form>
				</v-card>
			</v-menu>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { LeekWars } from '@/model/leekwars'
import { AccountInfo, store } from '@/model/store'
import router from '@/router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'account-switcher' })

const emit = defineEmits<{
	'close': []
}>()

const { t } = useI18n()

const loginLoading = ref(false)
const loginError = ref('')
const loginForm = ref({ login: '', password: '' })
const loginMenuId = ref<number | null>(null)
const addMenuOpen = ref(false)
const switchingId = ref<number | null>(null)
const loadingId = ref<number | null>(null)
const loadingAction = ref<string | null>(null)

function isActive(account: AccountInfo) {
	return account.id === store.state.farmer?.id
}

function avatarUrl(account: AccountInfo) {
	if (account.avatar_changed > 0) {
		return LeekWars.AVATAR + 'avatar/' + account.id + '.png?' + account.avatar_changed
	}
	return '/image/no_avatar.png'
}

function switchAccount(account: AccountInfo) {
	if (account.id === store.state.farmer?.id) {
		emit('close')
		return
	}
	if (!account.connected) {
		loginForm.value.login = account.name
		loginForm.value.password = ''
		loginError.value = ''
		return
	}

	switchingId.value = account.id
	;(LeekWars.post('farmer/switch', { farmer_id: account.id }).then((data: any) => {
		const token = LeekWars.DEV ? data.token : '$'
		store.commit('connect', { ...data, token })
		switchingId.value = null
		emit('close')
		router.push('/')
	}) as any).error(() => {
		switchingId.value = null
		loginForm.value.login = account.name
	})
}

function loginNewAccount() {
	loginLoading.value = true
	loginError.value = ''
	const url = LeekWars.DEV ? 'farmer/login-token' : 'farmer/login'
	;(LeekWars.post(url, { ...loginForm.value, keep_connected: true }).then((data: any) => {
		const token = LeekWars.DEV ? data.token : '$'
		store.commit('connect', { ...data, token })
		loginForm.value = { login: '', password: '' }
		loginLoading.value = false
		loginMenuId.value = null
		addMenuOpen.value = false
	}) as any).error((error: any) => {
		const code = error?.error || 'server'
		loginError.value = t('main.account_error_' + code) as string
		loginLoading.value = false
	})
}

function disconnectAccount(account: AccountInfo) {
	accountAction(account, 'disconnect', 'farmer/disconnect-account')
}

function removeAccount(account: AccountInfo) {
	accountAction(account, 'remove', 'farmer/remove-account')
}

function accountAction(account: AccountInfo, action: string, endpoint: string) {
	loadingId.value = account.id
	loadingAction.value = action
	LeekWars.post(endpoint, { farmer_id: account.id }).then((data: any) => {
		loadingId.value = null
		loadingAction.value = null
		if (data.switched) {
			const token = LeekWars.DEV ? data.token : '$'
			store.commit('connect', { ...data, token })
			router.push('/')
		} else if (data.accounts) {
			store.commit('update-accounts', data.accounts)
		} else {
			store.commit('disconnect')
			router.push('/login')
		}
	})
}
</script>

<style lang="scss" scoped>
	.account-switcher-menu {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}
	.active {
		background: rgba(95, 173, 27, 0.1);
	}
	.account-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		background: var(--pure-white);
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2);
	}
	.account-avatar-wrapper {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		margin-right: 12px;
	}
	.account-avatar-loader {
		position: absolute;
		top: 0;
		left: 0;
	}
	.account-action {
		opacity: 0.7;
		&:hover {
			opacity: 1;
		}
	}
	.v-list-item-subtitle {
		font-size: 11px !important;
		opacity: 1 !important;
	}
	.status-active {
		color: #5fad1b;
	}
	.status-connected {
		color: #4fc3f7;
	}
	.status-expired {
		color: #777;
	}
	.login-submenu {
		padding: 12px;
		border-radius: 4px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		width: 220px;
		form {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.v-btn {
			margin: 0;
		}
	}
	.login-input {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 13px;
	}
	.login-error {
		color: #e57373;
		font-size: 12px;
	}
</style>
