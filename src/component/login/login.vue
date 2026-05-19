<template lang="html">
	<div class="page">
		<h1>{{ $t('title') }}</h1>
		<panel class="first">
			<div class="container">
				<div class="column">
					<form @submit.prevent="login">
						<br>
						<label class="title" for="login-field">{{ $t('login') }}</label>
						<input id="login-field" v-model="form.login" type="text" name="login" autocapitalize="none" autocorrect="off" autocomplete="username" spellcheck="false">
						<br><br>
						<label class="title" for="password-field">{{ $t('password') }}</label>
						<input id="password-field" v-model="form.password" type="password" name="password" autocapitalize="none" autocorrect="off" autocomplete="current-password" spellcheck="false">
						<br><br>
<template v-if="twoFactor">
							<label class="title" for="code-field">{{ $t('two_factor_code') }}</label>
							<input id="code-field" v-model="form.code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" autocapitalize="none" autocorrect="off" spellcheck="false">
							<br><br>
						</template>
						<v-checkbox v-model="form.keep_connected" :label="$t('keep_connected')" hide-details />
						<br><br>
						<div class="center"><v-btn size="large" color="primary" type="submit" :loading="loading">{{ $t('connection') }}</v-btn></div>
						<br>
						<div v-if="error" class="error">
							<span v-if="error.error">{{ $t('error_' + error.error) }}</span>
							<span v-else>{{ $t('error_server') }}</span>
						</div>
						<br>
						<router-link class="forgot-password" to="/forgot-password">{{ $t('forgot_password') }}</router-link>
					</form>
				</div>
				<div class="divider"></div>
				<div class="column oauth-buttons">
					<v-btn class="gh-button" @click="oauthStart('github')"> <img src="/image/github_black.png"> {{ $t('main.login_gh') }}</v-btn>
					<v-btn class="google-button" @click="oauthStart('google')"> <img src="/image/google.svg"> {{ $t('main.login_google') }}</v-btn>
				</div>
			</div>
		</panel>
	</div>

</template>

<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mixins , useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { getRedirectAfterLogin } from '@/router'

defineOptions({ name: 'Login', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('login')
const route = useRoute()
const router = useRouter()

const error = ref<{ error?: string } | null>(null)
const loading = ref(false)
const twoFactor = ref(false) // #4003 challenge 2FA déclenché par la réponse two_factor_required
const form = ref({
	login: '',
	password: '',
	code: '',
	keep_connected: localStorage.getItem('keep_connected') === 'true'
})

onBeforeMount(() => LeekWars.setTitle(t('title')))

const tokenParam = route.params.token
if (tokenParam) {
	LeekWars.post('farmer/login-comeback', { token: tokenParam }).then(data => {
		const token = LeekWars.DEV ? data.token : '$'
		store.commit('connect', { ...data, token })
		router.push(getRedirectAfterLogin())
	}).catch((err: unknown) => {
		LeekWars.toast((err as { error?: string }).error ?? '')
		router.push('/')
	})
}

function login() {
	loading.value = true
	error.value = null
	const url = LeekWars.DEV ? 'farmer/login-token' : 'farmer/login'
	LeekWars.post(url, form.value).then(data => {
		const token = LeekWars.DEV ? data.token : '$'
		store.commit('connect', { ...data, token })
		router.push(getRedirectAfterLogin())
	}).catch((err: unknown) => {
		loading.value = false
		const e = err as { error?: string }
		if (e && e.error === 'two_factor_required') {
			twoFactor.value = true // 2FA activée : on affiche le champ code et on re-soumet avec
			error.value = null
		} else {
			error.value = e
		}
	})
}

watch(() => form.value.keep_connected, () => {
	localStorage.setItem('keep_connected', form.value.keep_connected ? 'true' : 'false')
})

function oauthStart(provider: 'github' | 'google') {
	localStorage.setItem('login-attempt', 'true')
	document.location.href = LeekWars.API + `farmer/start-${provider}-login`
}
</script>

<style lang="scss" scoped>
	form {
		text-align: left;
		width: 290px;
		margin: 0 auto;
	}
	input[type="text"], input[type="password"] {
		width: 100%;
		margin-top: 5px;
	}
	.error {
		color: red;
		text-align: center;
	}
	.forgot-password {
		color: #0a0;
		text-align: center;
		display: block;
	}
	.forgot-password:hover {
		text-decoration: underline;
	}
	.container {
		display: flex;
		max-width: 680px;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		.column {
			flex: 1;
			text-align: center;
			padding: 30px 0;
		}
	}
	.divider {
		background: var(--border);
		width: 1px;
		height: 300px;
	}
	@media screen and (max-width: 599px) {
		.container {
			flex-direction: column;
		}
		.divider {
			width: 300px;
			height: 1px;
		}
		.oauth-buttons {
			align-self: center;
			margin-top: 0;
		}
	}
	.oauth-buttons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		align-self: flex-start;
		margin-top: 60px;
	}
	.v-btn.gh-button, .v-btn.google-button {
		height: 40px;
		img {
			height: 20px;
			margin-right: 8px;
		}
	}
	body.dark .gh-button img {
		filter: invert(1);
	}
	.title {
		display: block;
		font-size: 16px;
	}
</style>
