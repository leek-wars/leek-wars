<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1 v-if="success">{{ $t('validated') }}</h1>
		</div>
		<panel class="first center">
			<img src="/image/map/nexus_block_small.png">
			<br><br>
			<i18n tag="h2" class="signup-message" path="validated_message">
				<b slot="farmer">{{ farmer }}</b>
			</i18n>
			<br><br>
			<slot name="button">
				<router-link to="/">
					<v-btn large color="primary">{{ $t('main.back_to_home') }}</v-btn>
				</router-link>
			</slot>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "signup-result" })
	export default class SignupResult extends Vue {
		@Prop() result!: string

		get success() {
			return this.result === 'success'
		}
		get farmer() {
			return this.$route.params.farmer
		}
	}
</script>

<style lang="scss" scoped>
	h2 {
		font-size: 18px;
		color: #333;
	}
</style>