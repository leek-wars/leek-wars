<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first last">
			<img src="/image/leek/leek1_front_green.png">
			<br>
			<br>
			<loader v-if="loading" />
			<template v-else>
				<template v-if="leekCount < 4">
					{{ $t('name') }} <input v-model="leekName" type="text">
					<br><br>
					{{ $t('price') }} : {{ LeekWars.formatNumber(price) }} <span class="hab"></span>
					<br>
					<br v-if="error">
					<div v-if="error" class="error">{{ error }}</div>
					<br>
					<v-btn color="primary" @click="createLeek">{{ $t('create') }}</v-btn>
				</template>
				<template v-else>
					<h2>{{ $t('4_leeks_only') }}</h2>
				</template>
			</template>
		</panel>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({ name: 'new_leek', i18n: {} })
	export default class NewLeek extends Vue {
		price: number | null = null
		leekCount: number | null = null
		leekName: string = ''
		error: string | null = null
		loading: boolean = true
		created() {
			LeekWars.get('leek/get-next-price').then(data => {
				this.price = data.price
				this.leekCount = LeekWars.objectSize(this.$store.state.farmer.leeks)
				LeekWars.setTitle(this.$t('title'))
				this.loading = false
			})
		}
		createLeek() {
			LeekWars.post('leek/create', {name: this.leekName}).then(data => {
				this.$router.push('/leek/' + data.id)
			}).error(error => {
				this.error = this.$t('error_' + error.error, error.params) as string
			})
		}
	}
</script>

<style lang="scss" scoped>
	.error {
		color: red;
	}
	.panel {
		text-align: center;
	}
</style>