<template lang="html">
	<div>
		<h1>404</h1>
		<div class="panel">
			<div class="content center">
				<img src="/image/notgood.png">
				<br><br>
				{{ $t('main.page_not_found') }}
				<br><br>
				<router-link to="/">
					<div class="button green large">{{ $t('main.back_to_home') }}</div>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator'
	@Component({ name: "not_found" })
	export default class NotFound extends Vue {}
</script>