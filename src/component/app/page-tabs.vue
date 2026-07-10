<template>
	<div class="tabs">
		<slot name="before"></slot>
		<!-- Collection : uniquement dans le contexte Inventaire / Collection, en 1re position. -->
		<template v-if="active === 'inventory' || active === 'collection'">
			<div v-if="active === 'collection'" class="tab action active">
				<v-icon>mdi-trophy-variant-outline</v-icon>
				<span>{{ $t('main.collection') }}</span>
			</div>
			<router-link v-else to="/collection">
				<div class="tab action">
					<v-icon>mdi-trophy-variant-outline</v-icon>
					<span>{{ $t('main.collection') }}</span>
				</div>
			</router-link>
		</template>
		<a href="https://leek-wars.myspreadshop.fr" target="_blank" rel="noopener">
			<div class="tab action">
				<v-icon>mdi-cart-outline</v-icon>
				<span>{{ $t('main.shop') }}</span>
				<v-icon class="small">mdi-open-in-new</v-icon>
			</div>
		</a>
		<template v-if="active === 'bank' || (env.BANK && $store.state.farmer?.bank_enabled)">
			<div v-if="active === 'bank'" class="tab action active">
				<v-icon>mdi-bank</v-icon>
				<span>{{ $t('main.bank') }}</span>
			</div>
			<router-link v-else :to="'/bank?ref=' + active + '_tab'">
				<div class="tab action">
					<v-icon>mdi-bank</v-icon>
					<span>{{ $t('main.bank') }}</span>
				</div>
			</router-link>
		</template>
		<div v-if="active === 'market'" class="tab action active">
			<img src="/image/icon/black/market.png">
			<span>{{ $t('main.market') }}</span>
		</div>
		<router-link v-else to="/market">
			<div class="tab action">
				<img src="/image/icon/market.png">
				<span>{{ $t('main.market') }}</span>
			</div>
		</router-link>
		<div v-if="active === 'inventory'" class="tab action active">
			<v-icon>mdi-treasure-chest</v-icon>
			<span>{{ $t('main.inventory') }}</span>
		</div>
		<router-link v-else to="/inventory">
			<div class="tab action">
				<v-icon>mdi-treasure-chest</v-icon>
				<span>{{ $t('main.inventory') }}</span>
			</div>
		</router-link>
	</div>
</template>

<script setup lang="ts">
	import { env } from '@/env'

	defineOptions({ name: 'PageTabs' })

	// Onglets de navigation partagés entre banque, marché, inventaire, collection.
	// `active` = page courante (rendue en onglet actif non cliquable). Le slot
	// #before sert aux extras propres à une page (recherche/agrandir du marché).
	defineProps<{ active: 'bank' | 'market' | 'inventory' | 'collection' }>()
</script>
