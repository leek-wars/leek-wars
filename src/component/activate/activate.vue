<template>
	<div>
		<h1 v-if="success">{{ $t('signup.signup_done') }}</h1>
		<h1 v-else>Error</h1>
		<div class="panel">
			<div class="content">
				<center>
					<template v-if="success">
						<img src="/image/leek/leek1_front_green.png">
						<h2 class="signup-message">{{ $t('signup.signup_done_message') }}</h2>
						<router-link to="/login">
							<div class="button">{{ $t('signup.login') }}</div>
						</router-link>
					</template>
					<template v-else>
						<img src="/image/notgood.png">
						<br><br>
						<h2>{{ error }}</h2>
					</template>
				</center>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	@Component
	export default class Activate extends Vue {
		success: any = null
		error: any = null
		created() {
			LeekWars.post('farmer/activate', {farmer_id: this.$route.params.id, code: this.$route.params.code}).then((data) => {
				this.success = data.success
				this.error = data.error
			})
		}
	}
</script>