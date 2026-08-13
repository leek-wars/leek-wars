<template>
	<panel :title="t('title')" icon="mdi-account-multiple" class="accounts-panel">
		<template #actions>
			<router-link v-if="accounts.length > 1" to="/accounts" class="button">
				<v-icon>mdi-view-dashboard-outline</v-icon>
				<span>{{ t('console') }}</span>
			</router-link>
			<span class="counter" :class="{ full: accounts.length >= max }">{{ accounts.length }} / {{ max }}</span>
		</template>
		<template #content>
			<div class="content accounts-content">
				<p class="desc">{{ t('desc') }}</p>

				<div v-if="loading" class="loading"><loader /></div>

				<template v-else>
					<div v-for="account in accounts" :key="account.id" class="account-card">
						<img :src="avatarUrl(account)" class="avatar">
						<div class="infos">
							<div class="name-line">
								<router-link :to="'/farmer/' + account.id" class="name">{{ account.name }}</router-link>
								<span v-if="isMain(account)" class="chip main">{{ t('main_account') }}</span>
								<span v-if="account.lwplus" class="chip lwplus">LW+</span>
							</div>
							<div class="meta">
								<v-icon>mdi-podium</v-icon>
								<span>{{ account.talent }}</span>
							</div>
						</div>
						<v-btn v-if="!isMain(account)" size="small" variant="text" :title="t('set_main')" :disabled="busy" @click="setMain(account)">
							<v-icon>mdi-star-outline</v-icon>
						</v-btn>
						<v-btn size="small" variant="text" color="error" :title="t('unlink')" :disabled="busy" @click="askUnlink(account)">
							<v-icon>mdi-link-variant-off</v-icon>
						</v-btn>
					</div>

					<!-- Déclarer un compte, uniquement parmi ceux connectés dans le switcher :
					     le serveur exige cette preuve de possession (le mot de passe a dû être
					     saisi pour qu'un compte y apparaisse comme connecté). -->
					<div v-if="accounts.length >= max" class="hint full">
						<v-icon>mdi-information-outline</v-icon>
						<span v-if="max >= maxLwplus">{{ t('cap_reached', [max]) }}</span>
						<span v-else>
							{{ t('cap_reached_upsell', [max, maxLwplus]) }}
							<router-link to="/lwplus">LW+</router-link>
						</span>
					</div>
					<template v-else>
						<div v-for="account in linkable" :key="account.id" v-ripple class="list-item card linkable" @click="link(account)">
							<img :src="avatarUrl(account)" class="avatar small">
							<span class="label">{{ account.name }}</span>
							<v-icon>mdi-link-variant-plus</v-icon>
						</div>
						<div v-if="!linkable.length" class="hint">
							<v-icon>mdi-information-outline</v-icon>
							<span>{{ t('no_linkable') }}</span>
						</div>
					</template>
				</template>
			</div>
		</template>

		<popup v-model="unlinkDialog" :width="560">
			<template #icon><v-icon>mdi-link-variant-off</v-icon></template>
			<template #title><span>{{ t('unlink') }}</span></template>
			<div v-if="unlinkTarget">{{ t('unlink_message', [unlinkTarget.name]) }}</div>
			<div class="cooldown-warning">
				<v-icon>mdi-clock-alert-outline</v-icon>
				<span>{{ t('unlink_cooldown_warning') }}</span>
			</div>
			<template #actions>
				<div v-ripple class="action dismiss" @click="unlinkDialog = false">{{ t('cancel') }}</div>
				<div v-ripple class="action red" @click="unlink">{{ t('unlink') }}</div>
			</template>
		</popup>
	</panel>
</template>

<script setup lang="ts">
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import type { ApiError } from '@/model/api-error'
	import { store, type AccountInfo } from '@/model/store'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'Accounts', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('accounts')

	interface LinkedAccount { id: number, name: string, avatar_changed: number, talent: number, lwplus: boolean }
	interface PlayerResponse { player: { id: number, main: number | null } | null, accounts: LinkedAccount[], max: number, max_free: number, max_lwplus: number }

	const accounts = ref<LinkedAccount[]>([])
	const main = ref<number | null>(null)
	const max = ref(3)
	const maxLwplus = ref(10)
	const loading = ref(true)
	const busy = ref(false)
	const unlinkDialog = ref(false)
	const unlinkTarget = ref<LinkedAccount | null>(null)

	function apply(data: PlayerResponse) {
		accounts.value = data.accounts ?? []
		main.value = data.player ? data.player.main : null
		max.value = data.max ?? 3
		maxLwplus.value = data.max_lwplus ?? 10
		loading.value = false
		busy.value = false
	}

	LeekWars.get('player/get').then(apply).error(() => { loading.value = false })

	/**
	 * Comptes déclarables : ceux du switcher qui sont connectés (mot de passe saisi,
	 * donc possession prouvée) et pas déjà liés. Le compte courant est exclu — il est
	 * toujours du lot par construction.
	 */
	const linkable = computed(() => {
		const linked = new Set(accounts.value.map(a => a.id))
		return (store.state.accounts ?? []).filter((a: AccountInfo) => a.connected && !linked.has(a.id) && a.id !== store.state.farmer?.id)
	})

	function isMain(account: LinkedAccount) {
		return main.value === account.id
	}

	function avatarUrl(account: { id: number, avatar_changed: number }) {
		if (account.avatar_changed > 0) {
			return LeekWars.AVATAR + 'avatar/' + account.id + '.png?' + account.avatar_changed
		}
		return '/image/no_avatar.png'
	}

	function link(account: { id: number }) {
		busy.value = true
		LeekWars.post('player/link', { farmer_id: account.id })
			.then(apply)
			.error((error: ApiError) => { busy.value = false; LeekWars.toast(t('error_' + error.error)) })
	}

	function askUnlink(account: LinkedAccount) {
		unlinkTarget.value = account
		unlinkDialog.value = true
	}

	function unlink() {
		if (!unlinkTarget.value) { return }
		busy.value = true
		unlinkDialog.value = false
		LeekWars.post('player/unlink', { farmer_id: unlinkTarget.value.id })
			.then(apply)
			.error((error: ApiError) => { busy.value = false; LeekWars.toast(t('error_' + error.error)) })
	}

	function setMain(account: LinkedAccount) {
		busy.value = true
		LeekWars.post('player/set-main', { farmer_id: account.id })
			.then(apply)
			.error((error: ApiError) => { busy.value = false; LeekWars.toast(t('error_' + error.error)) })
	}
</script>

<style lang="scss" scoped>
	.desc {
		margin: 0 0 12px;
		color: var(--text-color-secondary);
	}
	.counter {
		color: var(--text-color-secondary);
		padding: 0 8px;
	}
	// Pas de variable sémantique d'erreur en v2 (`--error` n'existe qu'en v3) :
	// teinte claire ici, override sombre plus bas, cf. CLAUDE.md.
	.counter.full {
		color: #c0392b;
	}
	body.dark .counter.full {
		color: #e57373;
	}
	.loading {
		text-align: center;
		padding: 16px;
	}
	.account-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		border: 1px solid var(--border);
		background: var(--background);
		margin-bottom: 6px;
	}
	.avatar {
		width: 48px;
		height: 48px;
		&.small {
			width: 28px;
			height: 28px;
		}
	}
	.infos {
		flex: 1;
		min-width: 0;
	}
	.name-line {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.name {
		font-weight: bold;
		color: var(--text-color);
	}
	.chip {
		font-size: 11px;
		padding: 1px 6px;
		border: 1px solid var(--border);
		color: var(--text-color-secondary);
		&.main {
			border-color: var(--primary);
			color: var(--primary);
		}
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--text-color-secondary);
		font-size: 13px;
	}
	.linkable {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.hint {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-color-secondary);
		padding: 8px 4px;
		font-size: 13px;
	}
	.cooldown-warning {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 12px;
		color: var(--text-color-secondary);
	}
</style>
