<template lang="html">
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<page-tabs active="bank" />
		</div>
		<panel class="first" :title="$t('title')" icon="mdi-history">
			<loader v-if="!payments" />
			<div v-else-if="payments.length === 0" class="empty">
				<v-icon>mdi-cart-off</v-icon>
				<span>{{ $t('no_purchases') }}</span>
			</div>
			<table v-else class="history">
				<thead>
					<tr>
						<th class="date sortable" @click="sortBy('date')">{{ $t('column_date') }} <v-icon v-if="sortColumn === 'date'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
						<th class="crystals sortable" @click="sortBy('crystals')">{{ $t('column_crystals') }} <v-icon v-if="sortColumn === 'crystals'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
						<th class="price sortable" @click="sortBy('price')">{{ $t('column_price') }} <v-icon v-if="sortColumn === 'price'" class="sort-arrow">{{ sortAscending ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon></th>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mixins, useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import PageTabs from '@/component/app/page-tabs.vue'

interface Payment { date: number; crystals: number; pack: number; offer: number; price: number | null; currency: string | null }
type SortColumn = 'date' | 'crystals' | 'price'

defineOptions({ name: 'BankHistory', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('bank-history')
const router = useRouter()

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
LeekWars.setTitle(t('title'))
LeekWars.get('bank/get-history').then(data => {
	payments.value = data.payments
})
</script>

<style lang="scss" scoped>
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 30px;
	color: var(--text-color-secondary);
	.v-icon {
		font-size: 40px;
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
