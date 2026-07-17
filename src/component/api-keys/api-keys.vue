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
								<span v-for="scope in key.scopes" :key="scope" class="scope-chip" :title="t('scope_' + scope.replace(':', '_'))">{{ scope }}</span>
								<span class="last-used">
									<v-icon>mdi-clock-outline</v-icon>
									{{ key.last_used_at ? LeekWars.formatDuration(key.last_used_at) : t('never_used') }}
								</span>
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

	<popup v-model="dialog" :width="620">
		<template #icon><v-icon>{{ editingId ? 'mdi-key-change' : 'mdi-key-plus' }}</v-icon></template>
		<template #title><span>{{ editingId ? t('edit_title') : t('new') }}</span></template>

		<div v-if="!createdSecret" class="create-form">
			<input v-model="newKeyName" type="text" class="key-name-input" :placeholder="t('name')" maxlength="64">
			<h4>{{ t('permissions') }}</h4>
			<div class="permissions">
				<div v-for="scope in API_SCOPES" :key="scope" v-ripple class="permission"
					:class="{ selected: newKeyScopes.includes(scope) }" @click="toggleScope(scope)">
					<v-icon class="check">{{ newKeyScopes.includes(scope) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}</v-icon>
					<v-icon class="scope-icon">{{ SCOPE_ICONS[scope] }}</v-icon>
					<div class="texts">
						<div class="scope-name">
							<code>{{ scope }}</code>
							<span v-if="scopeBadge(scope)" class="scope-badge" :class="scopeBadge(scope)">{{ t('badge_' + scopeBadge(scope)) }}</span>
						</div>
						<div class="scope-desc">{{ t('scope_' + scope.replace(':', '_')) }}</div>
					</div>
				</div>
			</div>
			<div class="hint"><v-icon>mdi-shield-check-outline</v-icon> {{ t('hint_minimal') }}</div>
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

		<template #actions>
			<template v-if="!createdSecret">
				<div v-ripple class="action dismiss" @click="dialog = false">{{ t('cancel') }}</div>
				<div v-ripple class="action green" :class="{ disabled: !newKeyScopes.length || creating }" @click="submit">{{ editingId ? t('save') : t('create') }}</div>
			</template>
			<div v-else v-ripple class="action green" @click="dialog = false">{{ t('close') }}</div>
		</template>
	</popup>
</template>

<script setup lang="ts">
	import { mixins, useNamespacedT } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { ref } from 'vue'

	defineOptions({ name: 'ApiKeys', i18n: {}, mixins: [...mixins] })

	const t = useNamespacedT('api-keys')

	interface ApiKey { id: number; name: string; prefix: string; scopes: string[]; last_used_at: number | null; revoked: boolean }
	const API_SCOPES = ['read', 'ai:read', 'message:read', 'ai:write', 'leek:write', 'fight:start']
	const SCOPE_ICONS: Record<string, string> = {
		'read': 'mdi-book-open-variant',
		'ai:read': 'mdi-file-code-outline',
		'message:read': 'mdi-email-outline',
		'ai:write': 'mdi-pencil',
		'leek:write': 'mdi-leek',
		'fight:start': 'mdi-sword-cross',
	}
	// Lectures sensibles (badge "sensible") vs écritures (badge "action").
	const SENSITIVE_SCOPES = ['ai:read', 'message:read']
	function scopeBadge(scope: string): 'action' | 'sensible' | null {
		if (scope.endsWith(':write') || scope.endsWith(':start')) return 'action'
		if (SENSITIVE_SCOPES.includes(scope)) return 'sensible'
		return null
	}
	const apiKeys = ref<ApiKey[]>([])
	const dialog = ref(false)
	const editingId = ref<number | null>(null)
	const newKeyName = ref('')
	const newKeyScopes = ref<string[]>(['read'])
	const createdSecret = ref<string | null>(null)
	const creating = ref(false)
	const copied = ref(false)

	LeekWars.get('api-key/list').then(data => { apiKeys.value = data.keys ?? [] })

	function openDialog() {
		editingId.value = null
		createdSecret.value = null
		copied.value = false
		newKeyName.value = ''
		newKeyScopes.value = ['read']
		dialog.value = true
	}

	function openEdit(key: ApiKey) {
		editingId.value = key.id
		createdSecret.value = null
		copied.value = false
		newKeyName.value = key.name
		newKeyScopes.value = [...key.scopes]
		dialog.value = true
	}

	function toggleScope(scope: string) {
		if (newKeyScopes.value.includes(scope)) {
			newKeyScopes.value = newKeyScopes.value.filter(s => s !== scope)
		} else {
			newKeyScopes.value = [...newKeyScopes.value, scope]
		}
	}

	function submit() {
		if (editingId.value) updateKey()
		else createKey()
	}

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

	function updateKey() {
		if (!newKeyScopes.value.length || creating.value || editingId.value === null) return
		creating.value = true
		LeekWars.post('api-key/update', { id: editingId.value, name: newKeyName.value, scopes: newKeyScopes.value.join(',') }).then(data => {
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
		background: #5fad1b;
		font-weight: 500;
		border-top-right-radius: 3px;
		.v-icon { font-size: 18px; }
		&:hover { background: #6ec91f !important; }
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
				.label {
					color: var(--text-color-secondary);
					font-size: 11px;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					margin-bottom: 3px;
				}
				code {
					font-size: 13px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					display: block;
				}
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
				&.revoked {
					opacity: 0.45;
					&:hover { border-color: var(--border); }
					.name { text-decoration: line-through; }
				}
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
						.prefix {
							color: var(--text-color-secondary);
							font-size: 11px;
							background: var(--background-secondary);
							padding: 1px 6px;
							border-radius: 3px;
						}
					}
					.key-meta {
						display: flex;
						align-items: center;
						gap: 4px;
						flex-wrap: wrap;
						margin-top: 5px;
						.scope-chip {
							background: var(--background-secondary);
							border: 1px solid var(--border);
							border-radius: 10px;
							padding: 1px 8px;
							font-size: 11px;
							color: var(--text-color-secondary);
						}
						.last-used {
							color: var(--text-color-secondary);
							font-size: 12px;
							margin-left: 8px;
							white-space: nowrap;
							.v-icon { font-size: 14px; vertical-align: -2px; }
						}
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
		.permissions {
			display: flex;
			flex-direction: column;
			gap: 6px;
			.permission {
				display: flex;
				align-items: center;
				gap: 10px;
				border: 1px solid var(--border);
				border-radius: 4px;
				padding: 8px 10px;
				cursor: pointer;
				user-select: none;
				&:hover { border-color: #5fad1b; }
				&.selected {
					border-color: #5fad1b;
					background: var(--background-secondary);
					.check { color: #5fad1b; }
				}
				.check { color: var(--text-color-secondary); }
				.scope-icon { color: var(--text-color-secondary); }
				.texts {
					min-width: 0;
					.scope-name {
						display: flex;
						align-items: center;
						gap: 8px;
						code { font-size: 13px; }
						.scope-badge {
							font-size: 10px;
							text-transform: uppercase;
							letter-spacing: 0.5px;
							border-radius: 3px;
							padding: 1px 5px;
							&.action { background: #f0e0c8; color: #9a6b1f; }
							&.sensible { background: #f5d6d6; color: #a83232; }
						}
					}
					.scope-desc {
						color: var(--text-color-secondary);
						font-size: 12px;
						margin-top: 1px;
					}
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
		.secret-warning {
			font-weight: 500;
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
			.v-icon { color: #e8a33d; }
		}
		.secret-row {
			code {
				display: block;
				word-break: break-all;
				background: var(--background-secondary);
				border: 1px solid #5fad1b;
				padding: 10px 12px;
				border-radius: 4px;
				font-size: 14px;
				user-select: all;
			}
		}
		.center {
			text-align: center;
			margin-top: 14px;
		}
	}
	.action.disabled {
		opacity: 0.5;
		pointer-events: none;
	}
	body.dark .create-form .permissions .permission .scope-badge {
		&.action { background: #4a3a1a; color: #e8bf7a; }
		&.sensible { background: #4a1f1f; color: #e89a9a; }
	}
</style>
