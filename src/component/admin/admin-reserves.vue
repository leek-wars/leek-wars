<template>
	<div class="page">
		<div class="page-header page-bar">
			<div class="page-title">
				<page-icon name="admin" fallback="mdi-security" />
				<div class="page-title-text">
					<h1><breadcrumb :items="[{name: 'Administration', link: '/admin'}, {name: 'Réserves', link: '/admin/reserves'}]" :raw="true" /></h1>
				</div>
			</div>
		</div>

		<panel icon="mdi-gift-outline" title="Confier une réserve">
			<template #content>
				<div class="form">
					<p class="hint">Un organisateur d'événements (soirées BR…) distribue sa réserve lui-même depuis <router-link to="/reserve">/reserve</router-link>. La réserve n'entre pas dans son inventaire. Quantité négative = retrait.</p>
					<div class="row">
						<v-text-field v-model="farmer" label="Pseudo de l'organisateur" variant="outlined" density="compact" hide-details />
						<v-select v-model="template" :items="resources" item-title="name" item-value="id" label="Ressource" variant="outlined" density="compact" hide-details />
						<v-text-field v-model.number="quantity" type="number" label="Quantité" variant="outlined" density="compact" hide-details class="quantity" />
						<v-btn color="primary" :disabled="!farmer || !template || !quantity" :loading="saving" @click="add">Valider</v-btn>
					</div>
					<div v-if="error" class="error">{{ error }}</div>
				</div>
			</template>
		</panel>

		<panel icon="mdi-account-group" title="Réserves">
			<template #content>
				<loader v-if="!loaded" />
				<table v-else-if="reserves.length" class="table">
					<tr><th>Organisateur</th><th>Ressource</th><th>Reste</th><th>Distribué</th></tr>
					<tr v-for="r in reserves" :key="r.farmer + '-' + r.template">
						<td><router-link :to="'/farmer/' + r.farmer">{{ r.name }}</router-link></td>
						<td>{{ itemName(r.template) }}</td>
						<td>{{ r.quantity }}</td>
						<td>{{ r.given }}</td>
					</tr>
				</table>
				<div v-else class="hint empty">Aucune réserve.</div>
			</template>
		</panel>

		<panel icon="mdi-history" title="Journal">
			<template #content>
				<table v-if="ledger.length" class="table">
					<tr><th>Date</th><th>Mouvement</th><th>De</th><th>À</th><th>Ressource</th><th>Qté</th><th>Mot</th></tr>
					<tr v-for="(l, i) in ledger" :key="i">
						<td>{{ LeekWars.formatDateTime(l.date) }}</td>
						<td>{{ l.kind === 1 ? 'Dotation' : l.kind === 2 ? 'Reste gardé' : 'Don' }}</td>
						<td><router-link :to="'/farmer/' + l.giver">{{ l.giver_name }}</router-link></td>
						<td><router-link :to="'/farmer/' + l.farmer">{{ l.name }}</router-link></td>
						<td>{{ itemName(l.template) }}</td>
						<td>{{ l.quantity }}</td>
						<td class="message">{{ l.message }}</td>
					</tr>
				</table>
				<div v-else class="hint empty">Aucun mouvement.</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
	import Breadcrumb from '@/component/forum/breadcrumb.vue'
	import { i18n, mixins } from '@/model/i18n'
	import { ItemType, itemTranslationKey } from '@/model/item'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import router from '@/router'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'AdminReserves', i18n: {}, mixins: [...mixins], components: { Breadcrumb } })

	if (!store.getters.admin) router.replace('/')
	LeekWars.setTitle("Réserves")

	interface Reserve { farmer: number, name: string, template: number, quantity: number, given: number }
	interface Movement { kind: number, giver: number, giver_name: string, farmer: number, name: string, template: number, quantity: number, message: string, date: number }

	const MOONSTONE = 606

	const loaded = ref(false)
	const reserves = ref<Reserve[]>([])
	const ledger = ref<Movement[]>([])
	const farmer = ref('')
	const template = ref<number>(MOONSTONE)
	const quantity = ref<number>(1000)
	const saving = ref(false)
	const error = ref('')

	function itemName(id: number) {
		const item = LeekWars.items[id]
		return item ? i18n.t(itemTranslationKey(item)) as string : '#' + id
	}

	const resources = computed(() => Object.values(LeekWars.items)
		.filter(item => item.type === ItemType.RESOURCE)
		.map(item => ({ id: item.id, name: itemName(item.id) }))
		.sort((a, b) => a.name.localeCompare(b.name)))

	function load() {
		LeekWars.get<{ reserves: Reserve[], ledger: Movement[] }>('resource-reserve/get-all').then(data => {
			reserves.value = data.reserves
			ledger.value = data.ledger
			loaded.value = true
		})
	}
	load()

	function add() {
		saving.value = true
		error.value = ''
		LeekWars.post<{ quantity: number }>('resource-reserve/add', { farmer: farmer.value, template: template.value, quantity: quantity.value }).then(data => {
			LeekWars.toast("Réserve de " + farmer.value + " : " + data.quantity)
			load()
		}).error((e: { error: string, available?: number }) => {
			error.value = e.error + (e.available !== undefined ? ' (disponible : ' + e.available + ')' : '')
		}).finally(() => { saving.value = false })
	}
</script>

<style lang="scss" scoped>
	.form {
		padding: 10px;
	}
	.hint {
		color: var(--text-color-secondary);
		margin-top: 0;
	}
	.empty {
		padding: 15px;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		& > * {
			min-width: 180px;
		}
		.quantity {
			max-width: 140px;
		}
	}
	.error {
		color: var(--error, #d32f2f);
		margin-top: 10px;
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		th, td {
			text-align: left;
			padding: 6px 10px;
			border-bottom: 1px solid var(--border);
		}
		.message {
			color: var(--text-color-secondary);
			font-style: italic;
		}
	}
</style>
