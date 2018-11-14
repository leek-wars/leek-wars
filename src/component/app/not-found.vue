<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ _title }}</h1>
		</div>
		<panel class="first center">
			<img src="/image/notgood.png">
			<br><br>
			{{ _message }}
			<br><br>
			<router-link to="/">
				<div class="button green large">{{ $t('main.back_to_home') }}</div>
			</router-link>
		</panel>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "not_found" })
	export default class NotFound extends Vue {
		@Prop() title!: string
		@Prop() message!: string
		get _title() {
			return this.title || '404'
		}
		get _message() {
			return this.message || this.$t('main.page_not_found')
		}
	}
</script>