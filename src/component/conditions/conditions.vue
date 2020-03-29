<template lang="html">
	<div>
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<center>
				<h4>{{ $t('version_n', [LeekWars.cgu_version]) }}</h4>
				<br>
			</center>
			<p>{{ $t('intro') }}</p>

			<h2>{{ $t('acceptation') }}</h2>
			<p v-html="$t('acceptation_content')"></p>

			<h2>{{ $t('access') }}</h2>
			<p v-html="$t('access_content')"></p>

			<h2>{{ $t('account_creation') }}</h2>
			<p v-html="$t('account_creation_content')"></p>

			<h2>{{ $t('private_life_and_cookies') }}</h2>
			<p v-html="$t('private_life_and_cookies_content')"></p>

			<h2>{{ $t('responsability_and_security') }}</h2>
			<p v-html="$t('responsability_and_security_content')"></p>

			<h2>{{ $t('game') }}</h2>
			<p v-html="$t('game_content')"></p>

			<h2>{{ $t('intellectual_property') }}</h2>
			<p v-html="$t('intellectual_property_content')"></p>

			<h2>{{ $t('sanctions') }}</h2>
			<p v-html="$t('sanctions_content')"></p>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	@Component({ name: "conditions", i18n: {} })
	export default class Conditions extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
	h2 {
		margin-top: 20px;
		margin-bottom: 15px;
		margin-left: 20px;
	}
	#app.app h2 {
		margin-left: 0;
	}
	::v-deep p {
		margin-bottom: 10px;
		margin-left: 20px;
		margin-right: 20px;
		text-align: justify;
		height: 100%;
	}
	#app.app p {
		margin-left: 0;
		margin-right: 0;
	}
</style>