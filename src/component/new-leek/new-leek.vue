<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<img src="/image/leek/leek1_front_green.png">
			<br>
			<br>
			<loader v-if="loading" />
			<template v-else>
				<template v-if="(leekCount || 0) < 4">
					{{ $t('name') }} <input v-model="leekName" type="text">
					<br><br>
					{{ $t('price') }} : {{ LeekWars.formatNumber(price || 0) }} <span class="hab"></span>
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

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'new_leek', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('new_leek')
const router = useRouter()

const price = ref<number | null>(null)
const leekCount = ref<number | null>(null)
const leekName = ref('')
const error = ref<string | null>(null)
const loading = ref(true)

LeekWars.get('leek/get-next-price').then(data => {
	price.value = data.price
	leekCount.value = LeekWars.objectSize(store.state.farmer!.leeks)
	LeekWars.setTitle(t('title'))
	loading.value = false
})

function createLeek() {
	LeekWars.post('leek/create', { name: leekName.value }).then(leek => {
		store.commit('new-leek', leek)
		router.push('/leek/' + leek.id)
	}).catch((err: any) => {
		error.value = t('error_' + err.error, err.params) as string
	})
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