<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ t('title') }}</h1>
			<div class="tabs">
				<router-link to="/settings" class="tab action">
					<v-icon>mdi-cog-outline</v-icon>
					<span>{{ t('manage') }}</span>
				</router-link>
			</div>
		</div>

		<div class="container grid large">
			<panel :title="t('title')" icon="mdi-view-dashboard-outline">
				<template #actions>
					<div v-if="accounts.length" v-ripple class="button" :class="{ disabled: busy }" @click="registerTournaments">
						<v-icon>mdi-tournament</v-icon>
						<span>{{ t('register_all') }}</span>
					</div>
					<div v-if="accounts.length" v-ripple class="button" :class="{ disabled: busy }" @click="setGarden(!allInGarden)">
						<v-icon>{{ allInGarden ? 'mdi-logout' : 'mdi-sprout' }}</v-icon>
						<span>{{ allInGarden ? t('exit_all') : t('enter_all') }}</span>
					</div>
				</template>
				<template #content>
					<div class="content">
						<div v-if="loading" class="loading"><loader /></div>

						<div v-else-if="!accounts.length" class="empty">
							<v-icon>mdi-account-multiple-outline</v-icon>
							<span>{{ t('empty') }}</span>
							<router-link to="/settings">{{ t('empty_link') }}</router-link>
						</div>

						<table v-else class="accounts-table">
							<thead>
								<tr>
									<th></th>
									<th class="left">{{ t('account') }}</th>
									<th>{{ t('talent') }}</th>
									<th>{{ t('fights') }}</th>
									<th>{{ t('garden') }}</th>
									<th class="left">{{ t('tournament') }}</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="account in accounts" :key="account.id">
									<td><img :src="avatarUrl(account)" class="avatar"></td>
									<td class="left">
										<router-link :to="'/farmer/' + account.id" class="name">{{ account.name }}</router-link>
										<span v-if="account.main" class="main">{{ t('main') }}</span>
									</td>
									<td>{{ account.talent }}</td>
									<!-- Le nerf de la guerre : c'est pour ça qu'un multi se reconnecte
									     sur chaque compte tous les jours. -->
									<td :class="{ zero: account.fights === 0 }">{{ account.fights }}</td>
									<td>
										<v-icon v-if="account.in_garden" class="yes">mdi-check</v-icon>
										<v-icon v-else class="no">mdi-close</v-icon>
									</td>
									<td class="left leeks">
										<span v-for="leek in account.leeks" :key="leek.id" class="leek" :class="{ registered: leek.registered }">
											{{ leek.name }}
										</span>
										<span v-if="!account.leeks.length" class="none">—</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</template>
			</panel>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { ApiError } from '@/model/api-error'
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'AccountsConsole', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('accounts-console')

	interface ConsoleLeek { id: number, name: string, level: number, registered: boolean }
	interface ConsoleAccount {
		id: number, name: string, avatar_changed: number, talent: number,
		fights: number, in_garden: boolean, main: boolean,
		leeks: ConsoleLeek[], farmer_registered: boolean
	}

	const accounts = ref<ConsoleAccount[]>([])
	const loading = ref(true)
	const busy = ref(false)

	// Un compte solo n'a pas de joueur : le serveur répond no_player, ce n'est pas
	// une erreur mais l'état normal de la très grande majorité des comptes.
	function load() {
		LeekWars.get('player/dashboard')
			.then((data: { accounts: ConsoleAccount[] }) => { accounts.value = data.accounts ?? []; loading.value = false; busy.value = false })
			.error(() => { accounts.value = []; loading.value = false; busy.value = false })
	}
	load()
	LeekWars.setTitle(t('title'))

	const allInGarden = computed(() => accounts.value.length > 0 && accounts.value.every(a => a.in_garden))

	function avatarUrl(account: { id: number, avatar_changed: number }) {
		if (account.avatar_changed > 0) {
			return LeekWars.AVATAR + 'avatar/' + account.id + '.png?' + account.avatar_changed
		}
		return '/image/no_avatar.png'
	}

	function setGarden(inGarden: boolean) {
		if (busy.value) { return }
		busy.value = true
		LeekWars.post('player/set-garden', { in_garden: inGarden })
			.then(load)
			.error((error: ApiError) => { busy.value = false; LeekWars.toast(t('error_' + error.error)) })
	}

	function registerTournaments() {
		if (busy.value) { return }
		busy.value = true
		LeekWars.post('player/register-tournaments')
			.then((data: { registered: number }) => {
				LeekWars.toast(t('registered_n', [data.registered]))
				load()
			})
			.error((error: ApiError) => { busy.value = false; LeekWars.toast(t('error_' + error.error)) })
	}
</script>

<style lang="scss" scoped>
	.loading, .empty {
		text-align: center;
		padding: 20px;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		color: var(--text-color-secondary);
	}
	.accounts-table {
		width: 100%;
		border-collapse: collapse;
		th, td {
			padding: 6px 8px;
			text-align: center;
			border-bottom: 1px solid var(--border);
		}
		th {
			color: var(--text-color-secondary);
			font-weight: normal;
		}
		.left {
			text-align: left;
		}
	}
	.avatar {
		width: 36px;
		height: 36px;
		display: block;
	}
	.name {
		font-weight: bold;
		color: var(--text-color);
	}
	.main {
		color: var(--text-color-secondary);
		font-size: 12px;
		margin-left: 6px;
	}
	// Zéro combat restant = rien à faire sur ce compte aujourd'hui : c'est
	// l'information qu'on vient chercher, elle doit sauter aux yeux.
	.zero {
		color: var(--text-color-secondary);
	}
	.yes {
		color: #4caf50;
	}
	.no {
		color: #b0b0b0;
	}
	.leek {
		display: inline-block;
		padding: 1px 6px;
		margin: 1px 3px 1px 0;
		border: 1px solid var(--border);
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.leek.registered {
		border-color: var(--primary);
		color: var(--primary);
	}
	.none {
		color: var(--text-color-secondary);
	}
	.button.disabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
