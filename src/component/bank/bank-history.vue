<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>
				<breadcrumb :items="breadcrumb_items" :raw="true" />
			</h1>
		</div>
		<panel class="first" :title="$t('history_title')" icon="mdi-history">
			<loader v-if="!payments" />
			<div v-else-if="payments.length === 0" class="empty">
				<v-icon>mdi-cart-off</v-icon>
				<span>{{ $t('history_no_purchases') }}</span>
				<router-link to="/bank" class="buy-first">
					<v-icon>mdi-cart-outline</v-icon> {{ $t('history_buy_first') }}
				</router-link>
			</div>
			<table v-else class="history">
				<thead>
					<tr>
						<th class="date sortable" @click="sortBy('date')">{{ $t('history_date') }} <v-icon v-if="sortColumn === 'date'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
						<th class="crystals sortable" @click="sortBy('crystals')">{{ $t('history_crystals') }} <v-icon v-if="sortColumn === 'crystals'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
						<th class="price sortable" @click="sortBy('price')">{{ $t('history_price') }} <v-icon v-if="sortColumn === 'price'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(payment, p) in sortedPayments" :key="p">
						<td class="date">{{ $filters.datetime(payment.date) }}</td>
						<td class="crystals">{{ $filters.number(payment.crystals) }}&nbsp;<span class="crystal"></span></td>
						<td class="price">{{ formatPrice(payment) }}</td>
					</tr>
				</tbody>
			</table>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import Breadcrumb from '@/component/forum/breadcrumb.vue'

interface Payment { date: number; crystals: number; pack: number; offer: number; price: number | null; currency: string | null }
type SortColumn = 'date' | 'crystals' | 'price'

defineOptions({ name: 'BankHistory', i18n: {}, mixins: [...mixins] })

// Les sous-pages de la banque (buy, validate, history) partagent le namespace
// i18n 'bank' (cf. normalizeComponentName) et le fichier bank.<locale>.i18n.
const t = useNamespacedT('bank')
const router = useRouter()

const breadcrumb_items = computed(() => [
	{ name: t('title'), link: '/bank' },
	{ name: t('history_title'), link: '/bank/history' },
])

const payments = ref<Payment[] | null>(null)

// Tri des colonnes : clic sur un entête, re-clic inverse le sens. Par défaut on
// affiche les achats les plus récents en premier (date décroissante).
const sortColumn = ref<SortColumn>('date')
const sortAscending = ref(false)

function sortBy(column: SortColumn) {
	if (sortColumn.value === column) {
		sortAscending.value = !sortAscending.value
	} else {
		sortColumn.value = column
		sortAscending.value = false
	}
}

function sortValue(payment: Payment, column: SortColumn): number {
	if (column === 'date') return payment.date
	if (column === 'crystals') return payment.crystals
	return payment.price === null || payment.price === undefined ? -1 : Number(payment.price)
}

const sortedPayments = computed(() => {
	if (!payments.value) return []
	const dir = sortAscending.value ? 1 : -1
	return [...payments.value].sort((a, b) => (sortValue(a, sortColumn.value) - sortValue(b, sortColumn.value)) * dir)
})

// Montant réel payé, formaté avec la devise du paiement (même logique que le
// computed suggestionPrice de bank.vue). Les vieux paiements sans price/currency
// (antérieurs à la migration payment_price_currency) affichent un tiret.
function formatPrice(payment: Payment): string {
	if (payment.price === null || payment.price === undefined || !payment.currency) return '—'
	const cur = LeekWars.currencies[payment.currency]
	const price = Number(payment.price)
	const formatted = Number.isInteger(price) ? String(price) : price.toFixed(2)
	if (!cur) return formatted + ' ' + payment.currency
	return cur.prefix ? cur.symbol + formatted : formatted + ' ' + cur.symbol
}

LeekWars.setActions([
	{ icon: 'mdi-bank', click: () => router.push('/bank') },
])
// setTitle réactif : les messages du namespace 'bank' sont chargés en asynchrone
// pour cette sous-page importée en .vue (cf. bank-buy), donc t() renvoie d'abord
// la clé brute. watchEffect réémet le titre dès que les traductions arrivent.
watchEffect(() => LeekWars.setTitle(t('history_title')))
LeekWars.get('bank/get-history').then(data => {
	payments.value = data.payments
})
</script>

<style lang="scss" scoped>
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 30px;
	color: var(--text-color-secondary);
	> .v-icon {
		font-size: 40px;
	}
	.buy-first {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		color: white;
		background: #4caf50;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 600;
		&:hover {
			background: #43a047;
		}
	}
}
.history {
	width: 100%;
	border-collapse: collapse;
	th, td {
		padding: 8px 12px;
		text-align: left;
	}
	th {
		font-weight: 600;
		color: var(--text-color-secondary);
		border-bottom: 1px solid var(--border);
	}
	th.sortable {
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		&:hover {
			color: var(--text-color);
		}
		.sort-arrow {
			font-size: 18px;
			vertical-align: -3px;
		}
	}
	tbody tr:not(:last-child) td {
		border-bottom: 1px solid var(--border);
	}
	.crystals, .price {
		white-space: nowrap;
	}
	.price {
		text-align: right;
	}
	th.price {
		text-align: right;
	}
	:deep(.crystal) {
		vertical-align: -4px;
	}
}
</style>
