<template>
	<panel :title="t('title')" icon="mdi-key-variant" class="api-keys-panel">
		<template #actions>
			<div v-ripple class="button green new-key-button" @click="openDialog">
				<v-icon>mdi-plus</v-icon>
				<span>{{ t('new') }}</span>
			</div>
		</template>
		<template #content>
			<div class="content api-keys-content">
				<p class="api-keys-desc">{{ t('desc') }}</p>

				<div class="quickstart">
					<div class="quickstart-item">
						<div class="label">{{ t('auth_header') }}</div>
						<code>Authorization: Bearer lwk_…</code>
					</div>
					<div class="quickstart-item">
						<div class="label">{{ t('base_url') }}</div>
						<code>https://leekwars.com/api/</code>
					</div>
					<div class="quickstart-item">
						<div class="label">{{ t('rate_limit') }}</div>
						<code>{{ t('rate_limit_value') }}</code>
					</div>
				</div>

				<div v-if="apiKeys.length" class="keys-list">
					<div v-for="key in apiKeys" :key="key.id" class="key-card" :class="{ revoked: key.revoked }">
						<v-icon class="key-icon">{{ key.revoked ? 'mdi-key-remove' : 'mdi-key' }}</v-icon>
						<div class="key-infos">
							<div class="key-header">
								<span class="name">{{ key.name }}</span>
								<code class="prefix">{{ key.prefix }}…</code>
							</div>
							<div class="key-meta">
								<span v-for="scope in key.scopes" :key="scope" class="role-chip" :class="scope">{{ scope }}</span>
								<span class="last-used">
									<v-icon>mdi-clock-outline</v-icon>
									{{ key.last_used_at ? LeekWars.formatDuration(key.last_used_at) : t('never_used') }}
								</span>
								<svg v-if="key.usage && usageMax(key) > 0" class="sparkline" :viewBox="`0 0 ${key.usage.length * 4 - 1} 16`" :title="t('usage_last_days', [key.usage.length])">
									<rect v-for="(v, i) in key.usage" :key="i" :x="i * 4" :y="16 - barHeight(v, key)" width="3" :height="barHeight(v, key)" rx="0.5" />
								</svg>
							</div>
						</div>
						<template v-if="!key.revoked">
							<v-btn size="small" variant="text" icon="mdi-pencil" :title="t('edit')" @click="openEdit(key)"></v-btn>
							<v-btn size="small" variant="text" color="error" @click="revokeKey(key.id)">{{ t('revoke') }}</v-btn>
						</template>
						<span v-else class="revoked-label">{{ t('revoked') }}</span>
					</div>
				</div>
				<div v-else class="api-keys-none">
					<v-icon>mdi-key-outline</v-icon>
					{{ t('none') }}
				</div>
			</div>
		</template>
	</panel>

	<popup v-model="dialog" :width="640">
		<template #icon><v-icon>{{ editingId ? 'mdi-key-change' : 'mdi-key-plus' }}</v-icon></template>
		<template #title><span>{{ editingId ? t('edit_title') : t('new') }}</span></template>

		<div v-if="!createdSecret" class="create-form">
			<input v-model="newKeyName" type="text" class="key-name-input" :placeholder="t('name')" maxlength="64">
			<h4>{{ t('role') }}</h4>
			<div class="roles">
				<div v-for="role in ROLES" :key="role.id" v-ripple class="role"
					:class="{ selected: newKeyRole === role.id }" @click="newKeyRole = role.id">
					<v-icon class="check">{{ newKeyRole === role.id ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank' }}</v-icon>
					<v-icon class="role-icon">{{ role.icon }}</v-icon>
					<div class="texts">
						<div class="role-name">
							<code>{{ role.id }}</code>
							<span v-if="role.id === 'account'" class="scope-badge sensible">{{ t('badge_sensible') }}</span>
						</div>
						<div class="role-desc">{{ t('role_' + role.id + '_desc') }}</div>
					</div>
					<v-menu :close-on-content-click="false" location="bottom end">
						<template #activator="{ props }">
							<span class="endpoints-link" v-bind="props" @click.stop>
								{{ endpointsFor(role.id).length }} {{ t('endpoints_label') }}
								<v-icon>mdi-chevron-down</v-icon>
							</span>
						</template>
						<div class="endpoints-menu">
							<div class="endpoints-menu-header">{{ t('endpoints_of', [role.id]) }}</div>
							<div class="endpoints-scroll">
								<template v-for="group in endpointsGrouped(role.id)" :key="group.module">
									<div class="ep-module">{{ group.module }}</div>
									<div v-for="ep in group.functions" :key="ep.function" class="ep-row">
										<span class="ep-method" :class="ep.method.toLowerCase()">{{ ep.method }}</span>
										<span class="ep-fn">{{ ep.function }}</span>
									</div>
								</template>
							</div>
						</div>
					</v-menu>
				</div>
			</div>
			<div class="hint"><v-icon>mdi-shield-check-outline</v-icon> {{ t('hint_cumulative') }}</div>
		</div>

		<div v-else class="secret-step">
			<div class="secret-warning"><v-icon>mdi-alert</v-icon> {{ t('copy_now') }}</div>
			<div class="secret-row">
				<code>{{ createdSecret }}</code>
			</div>
			<div class="center">
				<v-btn color="primary" :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'" @click="copySecret">{{ copied ? t('copied') : t('copy') }}</v-btn>
			</div>
		</div>

		<template v-if="!createdSecret" #actions>
			<div v-ripple class="action dismiss" @click="dialog = false">{{ t('cancel') }}</div>
			<div v-ripple class="action green" :class="{ disabled: !newKeyRole || creating }" @click="submit">{{ editingId ? t('save') : t('create') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { computed, ref } from 'vue'

	defineOptions({ name: 'ApiKeys', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('api-keys')

	interface ApiKey { id: number; name: string; prefix: string; scopes: string[]; last_used_at: number | null; revoked: boolean; usage?: number[] }
	interface Service { module: string; function: string; method: string; scope: string }

	// Rôles cumulatifs : base < player < account.
	const ROLES = [
		{ id: 'base', icon: 'mdi-earth', rank: 1 },
		{ id: 'player', icon: 'mdi-controller', rank: 2 },
		{ id: 'account', icon: 'mdi-account-cog', rank: 3 },
	]
	const TIER_RANK: Record<string, number> = { base: 1, player: 2, account: 3 }

	const apiKeys = ref<ApiKey[]>([])
	const services = ref<Service[]>([])
	const dialog = ref(false)
	const editingId = ref<number | null>(null)
	const newKeyName = ref('')
	const newKeyRole = ref('player')
	const createdSecret = ref<string | null>(null)
	const creating = ref(false)
	const copied = ref(false)

	LeekWars.get('api-key/list').then(data => { apiKeys.value = data.keys ?? [] })
	LeekWars.get<Service[]>('service/get-all').then(data => { services.value = data ?? [] })

	// Endpoints AJOUTÉS par un rôle (par rapport au rôle précédent) : scope exact.
	// (Les rôles sont cumulatifs ; on n'affiche que le delta pour rester lisible.)
	function endpointsFor(roleId: string): Service[] {
		return services.value.filter(s => s.scope === roleId)
	}
	function endpointsGrouped(roleId: string): { module: string; functions: Service[] }[] {
		const byModule: Record<string, Service[]> = {}
		for (const s of endpointsFor(roleId)) (byModule[s.module] ??= []).push(s)
		return Object.keys(byModule).sort().map(module => ({ module, functions: byModule[module] }))
	}

	// Sparkline : hauteur de barre (sur 16px) proportionnelle au pic de la clé.
	function usageMax(key: ApiKey): number {
		return Math.max(0, ...(key.usage ?? []))
	}
	function barHeight(v: number, key: ApiKey): number {
		const max = usageMax(key)
		if (!max || !v) return 0
		return Math.max(2, Math.round((v / max) * 16))
	}

	function openDialog() {
		editingId.value = null
		createdSecret.value = null
		copied.value = false
		newKeyName.value = ''
		newKeyRole.value = 'player'
		dialog.value = true
	}

	function openEdit(key: ApiKey) {
		editingId.value = key.id
		createdSecret.value = null
		copied.value = false
		newKeyName.value = key.name
		// une clé porte un rôle ; on prend le plus élevé qu'elle contient.
		newKeyRole.value = [...key.scopes].sort((a, b) => (TIER_RANK[b] ?? 0) - (TIER_RANK[a] ?? 0))[0] ?? 'player'
		dialog.value = true
	}

	function submit() {
		if (editingId.value) updateKey()
		else createKey()
	}

	function createKey() {
		if (!newKeyRole.value || creating.value) return
		creating.value = true
		LeekWars.post('api-key/create', { name: newKeyName.value, scopes: newKeyRole.value }).then(data => {
			createdSecret.value = data.secret
			copied.value = false
			apiKeys.value = data.keys ?? apiKeys.value
			newKeyName.value = ''
		}).finally(() => { creating.value = false })
	}

	function updateKey() {
		if (!newKeyRole.value || creating.value || editingId.value === null) return
		creating.value = true
		LeekWars.post('api-key/update', { id: editingId.value, name: newKeyName.value, scopes: newKeyRole.value }).then(data => {
			apiKeys.value = data.keys ?? apiKeys.value
			dialog.value = false
		}).finally(() => { creating.value = false })
	}

	function revokeKey(id: number) {
		LeekWars.delete('api-key/revoke', { id }).then(data => {
			apiKeys.value = data.keys ?? apiKeys.value.map(k => k.id === id ? { ...k, revoked: true } : k)
		})
	}

	function copySecret() {
		if (createdSecret.value) {
			navigator.clipboard?.writeText(createdSecret.value)
			copied.value = true
		}
	}
</script>

<style lang="scss" scoped>
	.new-key-button {
		display: flex;
		align-items: center;
		gap: 4px;
		.v-icon { font-size: 18px; }
	}
	.api-keys-content {
		padding: 12px 15px 15px;
		.api-keys-desc {
			color: var(--text-color-secondary);
			margin: 0 0 14px;
		}
		.quickstart {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 16px;
			.quickstart-item {
				flex: 1 1 200px;
				background: var(--background-secondary);
				border-radius: 4px;
				padding: 8px 12px;
				min-width: 0;
				.label { color: var(--text-color-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
				code { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
			}
		}
		.keys-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
			.key-card {
				display: flex;
				align-items: center;
				gap: 12px;
				border: 1px solid var(--border);
				border-radius: 4px;
				padding: 10px 12px;
				background: var(--background);
				&:hover { border-color: #5fad1b; }
				&.revoked { opacity: 0.45; &:hover { border-color: var(--border); } .name { text-decoration: line-through; } }
				.key-icon { color: var(--text-color-secondary); }
				.key-infos {
					flex: 1;
					min-width: 0;
					.key-header {
						display: flex;
						align-items: baseline;
						gap: 8px;
						flex-wrap: wrap;
						.name { font-weight: 500; }
						.prefix { color: var(--text-color-secondary); font-size: 11px; background: var(--background-secondary); padding: 1px 6px; border-radius: 3px; }
					}
					.key-meta {
						display: flex;
						align-items: center;
						gap: 6px;
						flex-wrap: wrap;
						margin-top: 5px;
						.last-used { color: var(--text-color-secondary); font-size: 12px; margin-left: 4px; white-space: nowrap; .v-icon { font-size: 14px; vertical-align: -2px; } }
						.sparkline { height: 16px; width: 55px; margin-left: 4px; rect { fill: #5fad1b; } }
					}
				}
				.revoked-label { color: var(--text-color-secondary); font-size: 12px; font-style: italic; }
			}
		}
		.api-keys-none {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			color: var(--text-color-secondary);
			background: var(--background-secondary);
			border: 1px dashed var(--border);
			border-radius: 4px;
			padding: 18px;
		}
	}
	.role-chip {
		border-radius: 10px;
		padding: 1px 8px;
		font-size: 11px;
		font-weight: 500;
		&.base { background: #e0e6ec; color: #55606b; }
		&.player { background: #d9ecc4; color: #4a7018; }
		&.account { background: #f5d6d6; color: #a83232; }
	}
	body.dark .role-chip {
		&.base { background: #333b44; color: #b3bec8; }
		&.player { background: #33481a; color: #b6dd88; }
		&.account { background: #542626; color: #f3aaaa; }
	}
	.create-form {
		.key-name-input {
			width: 100%;
			background: var(--background);
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 8px 10px;
			color: var(--text-color);
			margin-bottom: 14px;
			&:focus { outline: none; border-color: #5fad1b; }
			&::placeholder { color: var(--text-color-secondary); }
		}
		h4 { margin: 0 0 8px; }
		.roles {
			display: flex;
			flex-direction: column;
			gap: 6px;
			.role {
				display: flex;
				align-items: center;
				gap: 10px;
				border: 1px solid var(--border);
				border-radius: 4px;
				padding: 10px;
				cursor: pointer;
				user-select: none;
				&:hover { border-color: #5fad1b; }
				&.selected { border-color: #5fad1b; background: var(--background-secondary); .check { color: #5fad1b; } }
				.check { color: var(--text-color-secondary); }
				.role-icon { color: var(--text-color-secondary); }
				.texts {
					flex: 1;
					min-width: 0;
					.role-name {
						display: flex;
						align-items: center;
						gap: 8px;
						code { font-size: 14px; font-weight: 500; }
						.scope-badge { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 3px; padding: 1px 5px; font-weight: 600; &.sensible { background: #f5d6d6; color: #a83232; } }
					}
					.role-desc { color: var(--text-color-secondary); font-size: 12px; margin-top: 2px; }
				}
				.endpoints-link {
					flex-shrink: 0;
					color: var(--text-color-secondary);
					font-size: 12px;
					white-space: nowrap;
					padding: 2px 6px;
					border-radius: 3px;
					&:hover { color: var(--text-color); background: var(--background); }
					.v-icon { font-size: 14px; vertical-align: -2px; }
				}
			}
		}
		.hint {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text-color-secondary);
			font-size: 12px;
			margin-top: 12px;
			.v-icon { font-size: 16px; }
		}
	}
	.secret-step {
		.secret-warning { font-weight: 500; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; .v-icon { color: #e8a33d; } }
		.secret-row code { display: block; word-break: break-all; background: var(--background-secondary); border: 1px solid #5fad1b; padding: 10px 12px; border-radius: 4px; font-size: 14px; user-select: all; }
		.center { text-align: center; margin-top: 14px; }
	}
	.action.disabled { opacity: 0.5; pointer-events: none; }
	body.dark .create-form .roles .role .texts .role-name .scope-badge.sensible { background: #542626; color: #f3aaaa; }
</style>

<style lang="scss">
	// Menu des endpoints (non scoped : rendu en teleport hors du composant)
	.endpoints-menu {
		background: var(--background);
		border: 1px solid var(--border);
		border-radius: 4px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
		width: 300px;
		.endpoints-menu-header {
			padding: 8px 12px;
			font-size: 12px;
			color: var(--text-color-secondary);
			border-bottom: 1px solid var(--border);
			position: sticky;
			top: 0;
			background: var(--background);
		}
		.endpoints-scroll {
			max-height: 340px;
			overflow-y: auto;
			padding: 4px 0 6px;
			.ep-module {
				padding: 6px 12px 2px;
				font-size: 11px;
				text-transform: uppercase;
				letter-spacing: 0.5px;
				color: var(--text-color-secondary);
				font-weight: 600;
			}
			.ep-row {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 2px 12px;
				font-size: 13px;
				.ep-method {
					font-size: 10px;
					font-weight: 600;
					border-radius: 3px;
					padding: 0 4px;
					min-width: 42px;
					text-align: center;
					background: var(--background-secondary);
					color: var(--text-color-secondary);
					&.post { color: #4a7018; }
					&.delete { color: #a83232; }
					&.put { color: #9a6b1f; }
				}
				.ep-fn { font-family: monospace; }
			}
		}
	}
</style>
