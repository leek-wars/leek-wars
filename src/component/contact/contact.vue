<template lang="html">
	<div class="page">
		<div class="page-bar page-header">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div class="center">
				<div class="text">{{ $t('intro') }}</div>

				<a href="mailto:contact@leekwars.com" target="_blank">
					<div class="card" v-ripple>
						<i18n-t keypath="email">
							<template #email>contact@leekwars.com</template>
						</i18n-t>
					</div>
				</a>
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import { mixins } from '@/model/i18n';
	import { LeekWars } from '@/model/leekwars'
	import { Options, Vue } from 'vue-property-decorator'

	@Options({ name: 'contact', i18n: {}, mixins: [...mixins] })
	export default class Contact extends Vue {
		created() {
			LeekWars.setTitle(this.$t('title'))
		}
	}
</script>

<style lang="scss" scoped>
.text {
	font-size: 20px;
	padding: 30px 0;
}
a {
	color: var(--pure-black);
	font-weight: 500;
}
h2 {
	margin-bottom: 20px;
}
h4 {
	margin-bottom: 10px;
}
.card {
	padding: 20px 30px;
	display: inline-block;
	line-height: 1.5;
	margin-bottom: 30px;
}
</style>