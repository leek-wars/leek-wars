<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="panel">
			<div class="content">
				<br>
				<div>{{ $t('accept_1') }}</div>
				<br>
				<i18n path="accept_2" tag="div">
					<router-link place="cgu" to="/conditions">{{ $t('cgu') }}</router-link>
				</i18n>
				<div class="button green" @click="accept">{{ $t('i_accept') }}</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'accept_conditions', i18n: {} })
	export default class AcceptConditions extends Vue {
		accept() {
			LeekWars.post('farmer/accept-terms', {}).then((data: any) => {
				if (data.success) {
					this.$router.push('/')
				} else {
					LeekWars.toast("Error: " + data.error)
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		text-align: center;
	}
	a {
		color: green;
	}
	.button {
		margin-top: 30px;
	}
</style>