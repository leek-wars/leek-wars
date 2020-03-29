<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<h2>{{ $t('host') }}</h2>
			<p>
				<b>OVH</b>
				<br>
				SAS au capital de 10 000 000 € <br>
				RCS Roubaix – Tourcoing 424 761 419 00045 <br>
				Code APE 6202A <br>
				N° TVA : FR 22 424 761 419 <br>
				Siège social : 2 rue Kellermann - 59100 Roubaix - France
			</p>
			<br><br>
			<h2>{{ $t('editor') }}</h2>
			<div v-html="$t('editor_message')"></div>
			<i18n path="contact">
				<a slot="email" href="mailto:contact@leekwars.com">contact@leekwars.com</a>
			</i18n>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'legal', i18n: {} })
	export default class Legal extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
	a {
		color: #5fad1b;
	}
	h2 {
		margin-bottom: 20px;
	}
</style>