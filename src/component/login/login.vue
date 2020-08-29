<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<panel class="first last">
			<div class="container">
				<div class="column">
					<form @submit.prevent="login">
						<br>
						<h4>{{ $t('login') }}</h4>
						<input v-model="form.login" type="text" name="login">
						<br><br>
						<h4>{{ $t('password') }}</h4>
						<input v-model="form.password" type="password" name="password">
						<br><br>
						<v-checkbox v-model="form.keep_connected" :label="$t('keep_connected')" hide-details />
						<br><br>
						<center><v-btn large color="primary" type="submit">{{ $t('connection') }}</v-btn></center>
						<br>
						<div v-if="error" class="error">{{ $t('incorrect_login') }}</div>
						<br>
						<router-link class="forgot-password" to="/forgot-password">{{ $t('forgot_password') }}</router-link>
					</form>
				</div>
				<div class="divider"></div>
				<div class="column">
					<v-btn color="black" class="gh-button" @click="githubStart()"> <img src="/image/github_black.png"> {{ $t('main.login_gh') }}</v-btn>
				</div>
			</div>
		</panel>
	</div>

</template>

<script lang="ts">
	import { env } from '@/env'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'login', i18n: {} })
	export default class Login extends Vue {
		error: boolean = false
		form = {
			login: '',
			password: '',
			keep_connected: false
		}

		created() {
			LeekWars.setTitle(this.$t('title'))
			this.form.keep_connected = localStorage.getItem("keep_connected") === 'true'
		}

		login() {
			const url = env.DEV ? 'farmer/login-token' : 'farmer/login'
			LeekWars.post(url, this.form).then(data => {
				const token = env.DEV ? data.token : '$'
				this.$store.commit('connect', {farmer: data.farmer, farmers: data.farmers, token})
				this.$router.push('/')
			}).error(error => {
				this.error = true
			})
		}

		@Watch('form.keep_connected')
		changeKeepConnected() {
			localStorage.setItem("keep_connected", this.form.keep_connected ? "true" : "false")
		}

		githubStart() {
			localStorage.setItem('login-attempt', 'true')
			localStorage.setItem('token', '$')
			document.location.href = env.API + "farmer/start-github-login"
		}
	}
</script>

<style lang="scss" scoped>
	form {
		text-align: left;
		width: 200px;
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
		max-width: 600px;
		align-items: center;
		.column {
			flex: 1;
			text-align: center;
			padding: 30px 0;
		}
	}
	.divider {
		background: #bbb;
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
	}
	.v-btn.gh-button {
		height: 40px;
		margin-right: 10px;
		img {
			height: 20px;
			margin-right: 5px;
		}
	}
</style>
