<template>
	<div>
		<h1>{{ $t('title') }}</h1>
		<div class="panel">
			<div class="content">
				<img src="/image/leek/leek1_front_green.png">
				<br>
				<br>
				<template v-if="leekCount < 4">
					{{ $t('name') }} <input v-model="leekName" type="text">
					<br>
					<br>
					{{ $t('price') }} : {{ LeekWars.formatNumber(price) }} <span class="hab"></span>
					<br><br>
					<div v-if="error" class="error">{{ error }}</div>
					<div class="button green" @click="createLeek">{{ $t('create') }}</div>  
				</template>
				<template v-else>
					<h2>{{ $t('4_leeks_only') }}</h2>
				</template>
			</div>
		</div>
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
		created() {
			LeekWars.get<any>('leek/get-next-price/' + this.$store.state.token).then((data) => {
				this.price = data.data.price
				this.leekCount = LeekWars.objectSize(this.$store.state.farmer.leeks)
				LeekWars.setTitle(this.$t('title'))
			})
		}
		createLeek() {
			LeekWars.post('leek/create', {name: this.leekName}).then((data) => {
				if (data.data.success) {
					this.$router.push('/leek/' + data.data.id)
				} else {
					this.error = this.$t('error_' + data.data.error, data.data.params) as string
				}
			})
		}
	}
</script>

<style lang="scss" scoped>
	.error {
		color: red;
		padding: 15px;
	}
	.content {
		text-align: center;
	}
</style>