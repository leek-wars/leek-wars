<template>
	<panel :title="t('title')" icon="mdi-key-variant" class="api-keys-panel">
		<template #content>
			<div class="content api-keys-content">
				<p class="api-keys-desc">{{ t('desc') }}</p>

				<div class="quickstart">
					<div class="quickstart-item">
						<span class="label">{{ t('auth_header') }}</span>
						<code>Authorization: Bearer lwk_…</code>
					</div>
					<div class="quickstart-item">
						<span class="label">{{ t('base_url') }}</span>
						<code>https://leekwars.com/api/</code>
					</div>
					<div class="quickstart-item">
						<span class="label">{{ t('rate_limit') }}</span>
						<span>{{ t('rate_limit_value') }}</span>
					</div>
				</div>

				<div v-if="createdSecret" class="created-secret">
					<div class="secret-warning"><v-icon>mdi-alert</v-icon> {{ t('copy_now') }}</div>
					<div class="secret-row">
						<code>{{ createdSecret }}</code>
						<v-btn size="small" @click="copySecret">{{ copied ? t('copied') : t('copy') }}</v-btn>
					</div>
				</div>

				<table v-if="apiKeys.length" class="keys-table">
					<tr v-for="key in apiKeys" :key="key.id" :class="{ revoked: key.revoked }">
						<td class="key-name">
							<span class="name">{{ key.name }}</span>
							<span class="prefix">{{ key.prefix }}…</span>
						</td>
						<td class="key-scopes">
							<span v-for="scope in key.scopes" :key="scope" class="scope-chip">{{ scope }}</span>
						</td>
						<td class="key-used">
							{{ key.last_used_at ? LeekWars.formatDuration(key.last_used_at) : t('never_used') }}
						</td>
						<td class="key-action">
							<v-btn v-if="!key.revoked" size="small" variant="text" color="error" @click="revokeKey(key.id)">{{ t('revoke') }}</v-btn>
							<span v-else class="revoked-label">{{ t('revoked') }}</span>
						</td>
					</tr>
				</table>
				<p v-else class="api-keys-none">{{ t('none') }}</p>

				<div class="new-key">
					<h4>{{ t('new') }}</h4>
					<div class="new-key-form">
						<v-text-field v-model="newKeyName" :placeholder="t('name')" hide-details density="compact" maxlength="64" />
						<div class="scopes">
							<v-checkbox v-for="scope in API_SCOPES" :key="scope" v-model="newKeyScopes" :value="scope" :label="scope" hide-details density="compact" />
						</div>
						<v-btn :disabled="!newKeyScopes.length || creating" color="primary" @click="createKey">{{ t('create') }}</v-btn>
					</div>
				</div>

				<div class="mcp-note">
					<v-icon>mdi-robot-outline</v-icon>
					<span>{{ t('mcp_note') }}</span>
				</div>
			</div>
		</template>
	</panel>
</template>

<script setup lang="ts">
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { ref } from 'vue'

	defineOptions({ name: 'ApiKeys', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('api-keys')

	interface ApiKey { id: number; name: string; prefix: string; scopes: string[]; last_used_at: number | null; revoked: boolean }
	const API_SCOPES = ['farmer:read', 'ai:read', 'ai:write', 'fight:read', 'fight:start']
	const apiKeys = ref<ApiKey[]>([])
	const newKeyName = ref('')
	const newKeyScopes = ref<string[]>(['farmer:read', 'ai:read', 'fight:read'])
	const createdSecret = ref<string | null>(null)
	const creating = ref(false)
	const copied = ref(false)

	LeekWars.get('api-key/list').then(data => { apiKeys.value = data.keys ?? [] })

	function createKey() {
		if (!newKeyScopes.value.length || creating.value) return
		creating.value = true
		LeekWars.post('api-key/create', { name: newKeyName.value, scopes: newKeyScopes.value.join(',') }).then(data => {
			createdSecret.value = data.secret
			copied.value = false
			apiKeys.value = data.keys ?? apiKeys.value
			newKeyName.value = ''
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
	.api-keys-content {
		padding: 10px 15px 15px;
		.api-keys-desc {
			color: var(--text-color-secondary);
			margin: 0 0 12px;
		}
		.quickstart {
			display: flex;
			flex-wrap: wrap;
			gap: 6px 24px;
			margin-bottom: 15px;
			.quickstart-item {
				display: flex;
				align-items: center;
				gap: 8px;
				.label { color: var(--text-color-secondary); font-size: 13px; }
				code {
					background: var(--background-secondary);
					padding: 2px 8px;
					border-radius: 4px;
					font-size: 13px;
				}
			}
		}
		.created-secret {
			background: var(--background-secondary);
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 10px;
			margin-bottom: 15px;
			.secret-warning {
				font-weight: 500;
				margin-bottom: 6px;
				display: flex;
				align-items: center;
				gap: 6px;
			}
			.secret-row {
				display: flex;
				align-items: center;
				gap: 10px;
				code {
					flex: 1;
					word-break: break-all;
					background: var(--background);
					padding: 6px 8px;
					border-radius: 4px;
					font-size: 13px;
				}
			}
		}
		.keys-table {
			width: 100%;
			border-collapse: collapse;
			td { padding: 8px 6px; border-bottom: 1px solid var(--border); vertical-align: middle; }
			tr.revoked { opacity: 0.45; }
			.key-name {
				.name { font-weight: 500; }
				.prefix { color: var(--text-color-secondary); font-family: monospace; font-size: 12px; margin-left: 8px; }
			}
			.scope-chip {
				display: inline-block;
				background: var(--background-secondary);
				border-radius: 3px;
				padding: 1px 6px;
				margin: 2px 3px 2px 0;
				font-size: 11px;
			}
			.key-used { color: var(--text-color-secondary); font-size: 12px; }
			.key-action { text-align: right; }
			.revoked-label { color: var(--text-color-secondary); font-size: 12px; font-style: italic; }
		}
		.api-keys-none { color: var(--text-color-secondary); }
		.new-key {
			margin-top: 18px;
			h4 { margin: 0 0 8px; }
			.new-key-form {
				display: flex;
				flex-direction: column;
				gap: 10px;
				.scopes { display: flex; flex-wrap: wrap; gap: 4px 16px; }
			}
		}
		.mcp-note {
			margin-top: 15px;
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text-color-secondary);
			font-size: 13px;
		}
	}
</style>
