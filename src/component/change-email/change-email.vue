<template lang="html">
	<div>
		<h1>{{ $t('title') }}</h1>
		<panel class="first last">
			<template v-if="state == 1">
				<div>
					{{ $t('enter_a_new_email') }}
				</div>
				<form @submit.prevent="submit">
					<br>
					<h4>{{ $t('new_email') }}</h4>
					<input v-model="email" name="email" type="email">
					<br><br>
					<h4>{{ $t('confirm') }}</h4>
					<input v-model="email2" name="email2" type="email">
					
					<br>
					<br>
					<center>
						<v-btn type="submit">{{ $t('send_confirmation') }}</v-btn>
					</center>
					<br>
					<div class="error">{{ error }}</div>
				</form>
			</template>

			<template v-else-if="state == 2">
				<loader v-if="!error" />
				<center v-else>
					<img src="/image/notgood.png">
					<br><br>
					<div class="error">{{ error }}</div>
				</center>
			</template>

			<template v-else-if="state == 3">
				<center>
					<img src="/image/map/nexus_block.png">
					<br>
					<br>
					<i18n path="email_sent">
						<b slot="email">{{ email }}</b>
					</i18n>
					<br>
					<br>
				</center>
			</template>

			<template v-else-if="state == 4">
				<center>
					<img src="/image/map/nexus_block.png">
					<br>
					<br>
					{{ $t('email_changed_success') }}
					<br>
					<br>
					<v-btn color="primary">{{ $t('back_home') }}</v-btn>
				</center>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	
	@Component({ name: 'change_email', i18n: {} })
	export default class ChangeEmail extends Vue {
		state: number = 0
		email: string = ''
		email2: string = ''
		error: string | null = null

		created() {
			this.state = parseInt(this.$route.params.state, 10)

			if (this.state === 2) {
				LeekWars.post('farmer/change-email3', {token: this.$route.params.token}).then(data => {
					LeekWars.toast(this.$i18n.t('email_changed'))
					this.state = 4
				}).error(error => {
					this.error = error
					LeekWars.toast(error)
				})
				return false
			}
		}

		submit() {
			if (this.email !== this.email2) {
				LeekWars.toast(this.$i18n.t('error_not_same_email'))
				return false
			}
			LeekWars.post('farmer/change-email2', {email: this.email, token: this.$route.params.token}).then(data => {
				LeekWars.toast(this.$i18n.t('email_sent', {email: this.email}))
				this.state = 3
			}).error(error => {
				this.error = error
				LeekWars.toast(error)
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
	form input[type="text"], form input[type="email"] {
		width: 100%;
		margin-top: 5px;
	}
	.error {
		color: red;
		text-align: center;
	}
</style>