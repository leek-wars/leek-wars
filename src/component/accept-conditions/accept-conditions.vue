<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div>{{ $t('accept_1') }}</div>
			<br>
			<i18n path="accept_2" tag="div">
				<router-link slot="cgu" to="/conditions">{{ $t('cgu') }}</router-link>
			</i18n>
			<v-btn color="primary" @click="accept">{{ $t('i_accept') }}</v-btn>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'accept_conditions', i18n: {} })
	export default class AcceptConditions extends Vue {
		accept() {
			LeekWars.post('farmer/accept-terms')
				.then(() => this.$router.push('/'))
				.error(error => LeekWars.toast("Error: " + error))
		}
	}
</script>

<style lang="scss" scoped>
	.panel {
		text-align: center;
		padding-top: 15px;
	}
	a {
		color: green;
	}
	button {
		margin-top: 30px;
	}
</style>