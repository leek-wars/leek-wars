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
	@Component({ name: "error" })
	export default class Error extends Vue {
		@Prop() title!: string
		@Prop() message!: string
		get _title() {
			const t = 'main.' + this.$route.params.title
			if (this.$te(t)) { return this.$t(t) }
			return this.title || this.$t('main.error')
		}
		get _message() {
			if (this.$route.params.message) { return this.$t('main.' + this.$route.params.message) }
			return this.message || this.$t('main.page_not_found')
		}
	}
</script>