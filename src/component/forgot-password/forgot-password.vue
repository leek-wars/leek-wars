<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<panel class="first last">
			<template v-if="state == 'change_password'">
				<div>
					{{ $t('enter_a_new_password') }}
				</div>
				<form @submit.prevent="submitResetForm">
					<br>
					<h4>{{ $t('new_password') }}</h4>
					<input v-model="password" name="password" type="password">
					
					<h4>{{ $t('confirm') }}</h4>
					<input v-model="password2" name="password2" type="password">
					
					<br>
					<br>
					<center>
						<v-btn type="submit">{{ $t('change_password') }}</v-btn>
					</center>
					<br>
					<div class="error"></div>
				</form>
			</template>

			<template v-else-if="state == 'email_sent'">
				<center>
					<img src="/image/map/nexus_block.png">
					<br>
					<br>
					<i18n path="mail_sent">
						<b slot="email">{{ $route.params.email }}</b>
					</i18n>
					<br>
					<br>
				</center>
			</template>

			<template v-else>
				<div>{{ $t('email_will_be_sent') }}</div>
				<form @submit.prevent="submitForm">
					<br>
					<h2>{{ $t('email_address') }}</h2>
					<input v-model="email" type="text" name="email">
					<br><br>
					<center>
						<v-btn type="submit">{{ $t('ask_new_password') }}</v-btn>
					</center>
					<br>
					<div class="error"></div>
				</form>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'forgot_password', i18n: {} })
	export default class ForgotPassword extends Vue {
		@Prop() state!: string
		email: string = ''
		password: string = ''
		password2: string = ''

		submitForm() {
			LeekWars.post('farmer/forgot-password', {email: this.email}).then(data => {
				LeekWars.toast(this.$i18n.t('forgot_password.mail_sent', {email: this.email}))
				this.$router.push('/forgot-password/email-sent/' + this.email)
			}).error(error => {
				LeekWars.toast(error)
			})
			return false
		}

		submitResetForm() {
			if (this.password !== this.password2) {
				LeekWars.toast(this.$i18n.t('farmer', 'error_not_same_password'))
				return false
			}
			LeekWars.post('farmer/forgot-password-change', {farmer_id: this.$route.params.id, new_password: this.password, code: this.$route.params.code}).then(data => {
				LeekWars.toast(this.$i18n.t('forgot_password.password_changed'))
				this.$router.push('/login')
			})
			return false
		}
	}
</script>

<style lang="scss" scoped>
	form {
		text-align: left;
		width: 300px;
		margin: 0 auto;
	}
	form input[type="text"], form input[type="password"] {
		width: 100%;
		margin-top: 5px;
	}
	.error {
		color: red;
		text-align: center;
	}
</style>