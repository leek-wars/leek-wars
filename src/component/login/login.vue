<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<div class="panel">
			<div class="content">
				<form @submit.prevent="login">
					<br>
					<h2>{{ $t('login') }}</h2>
					<input v-model="form.login" type="text" name="login">
					<br><br>
					<h2>{{ $t('password') }}</h2>
					<input v-model="form.password" type="password" name="password">
					<br><br>
					<v-checkbox v-model="form.keep_connected" :label="$t('keep_connected')" hide-details />
					<br><br>
					<center><input :value="$t('connection')" type="submit" class="button green large"></center>
					<br>
					<div v-if="error" class="error">{{ $t('incorrect_login') }}</div>
					<br>
					<router-link class="forgot-password" to="/forgot-password">{{ $t('forgot_password') }}</router-link>
				</form>
			</div>
		</div>
	</div>
	
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'login', i18n: {} })
	export default class Login extends Vue {
		error: boolean = false
		form = {
			login: '',
			password: '',
			keep_connected: false
		}
		login() {
			const url = this.$store.state.dev ? 'farmer/login-token' : 'farmer/login'
			LeekWars.post(url, this.form).then((data: any) => {
				if (data.data.success) {
					this.$store.commit('connect', data.data)
					this.$router.push('/')
				} else {
					this.error = true
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	form {
		text-align: left;
		width: 200px;
		margin: 0 auto;
	}
	input[type='text'], input[type='password'] {
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
</style>
