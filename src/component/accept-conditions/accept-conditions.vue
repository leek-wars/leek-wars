<template lang="html">
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<div>{{ $t('accept_1') }}</div>
			<br>
			<i18n-t keypath="accept_2" tag="div">
				<template #cgu>
					<router-link to="/conditions">{{ $t('cgu') }}</router-link>
				</template>
			</i18n-t>
			<v-btn color="primary" @click="accept">{{ $t('i_accept') }}</v-btn>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LeekWars } from '@/model/leekwars'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'accept_conditions', i18n: {}, mixins: [...mixins] })

const router = useRouter()

function accept() {
	LeekWars.post('farmer/accept-terms')
		.then(() => { router.push('/') })
		.catch((error: any) => LeekWars.toast('Error: ' + error))
}
</script>

<style lang="scss" scoped>
	.panel {
		text-align: center;
		padding-top: 15px;
	}
	a {
		color: green;
	}
	button {
		margin-top: 30px;
	}
</style>