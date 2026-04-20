<template>
	<popup v-model="show" :width="550" icon="mdi-cloud-cog" :title="$t('title')">
		<!-- Remotes -->
		<div class="section-title">{{ $t('remotes') }}</div>
		<div v-if="remotes.length === 0 && !remotesLoading" class="empty">{{ $t('no_remotes') }}</div>
		<div v-for="remote in remotes" :key="remote.name" class="remote-item" :class="providerFromUrl(remote.url)">
			<v-icon class="remote-provider-icon">{{ providerIcon(providerFromUrl(remote.url)) }}</v-icon>
			<span class="remote-name">{{ remote.name }}</span>
			<span class="remote-url" :title="remote.url">{{ remote.url }}</span>
			<v-icon class="remote-delete" @click="removeRemote(remote.name)">mdi-delete</v-icon>
		</div>
		<div class="add-remote">
			<input v-model="newRemoteName" :placeholder="$t('remote_name')" class="input" />
			<select v-if="availableRepos.length > 0" v-model="newRemoteUrl" class="input url repo-select">
				<option value="">{{ $t('select_repo') }}</option>
				<option v-for="r in availableRepos" :key="r.clone_url" :value="r.clone_url">{{ r.full_name }}{{ r.private ? ' 🔒' : '' }}</option>
			</select>
			<input v-else v-model="newRemoteUrl" :placeholder="$t('remote_url')" class="input url" />
			<button type="button" class="add-btn" :disabled="!newRemoteName || !newRemoteUrl" @click="addRemote">{{ $t('add') }}</button>
		</div>

		<!-- Authentification -->
		<div class="section-title auth-title">{{ $t('authentication') }}</div>
		<div v-for="cred in credentials" :key="cred.provider + ':' + (cred.instance_url || '')" class="credential-info" :class="cred.provider">
			<v-icon class="provider-icon">{{ providerIcon(cred.provider) }}</v-icon>
			<span class="auth-type">{{ cred.auth_type === 'app' ? $t('github_app') : 'PAT' }}</span>
			<span class="credential-user">
				<span v-if="cred.username">{{ cred.username }}</span>
				<span v-else class="anonymous">{{ $t('connected_anonymous') }}</span>
				<span v-if="cred.instance_url" class="credential-instance">@ {{ cred.instance_url }}</span>
			</span>
			<v-icon class="credential-delete" @click="deleteCredential(cred)">mdi-delete</v-icon>
		</div>
		<div class="auth-section">
			<div v-if="!hasCredential('github')" class="oauth-btn github" @click="startInstall">
				<v-icon>mdi-github</v-icon> {{ $t('install_github_app') }}
			</div>
			<div v-if="!hasCredential('github')" class="auth-hint">{{ $t('install_hint') }}</div>
			<div class="pat-section">
				<div class="pat-label">{{ $t('or_pat') }}</div>
				<div class="provider-tiles">
					<div v-for="p in providers" :key="p.id" class="provider-tile" :class="[p.id, { active: patProvider === p.id }]" @click="patProvider = p.id">
						<v-icon>{{ p.icon }}</v-icon>
						<span>{{ p.label }}</span>
					</div>
				</div>
				<input v-if="patProvider === 'forgejo'" v-model="patInstanceUrl" :placeholder="$t('instance_placeholder')" class="input instance-input" />
				<div class="pat-input">
					<input v-model="patToken" type="password" :placeholder="$t('pat_placeholder')" class="input" @keyup.enter="savePat" />
					<div class="pat-save" :class="{ disabled: !canSavePat }" @click="savePat">{{ $t('save') }}</div>
				</div>
			</div>
		</div>

		<!-- Erreur -->
		<div v-if="error" class="error-msg">{{ error }}</div>
	</popup>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { mixins } from '@/model/i18n'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import Popup from '@/component/popup.vue'
	import { gitCall } from './git-log'

	@Options({ name: 'git-remote-dialog', i18n: {}, components: { Popup }, mixins: [...mixins], emits: ['update:modelValue'] })
	export default class GitRemoteDialog extends Vue {
		@Prop() modelValue!: boolean
		@Prop() folder!: string

		remotes: { name: string, url: string }[] = []
		credentials: { provider: string, auth_type: string, username: string, instance_url: string | null }[] = []
		availableRepos: { full_name: string, clone_url: string, private: boolean }[] = []
		remotesLoading: boolean = false
		newRemoteName: string = 'origin'
		newRemoteUrl: string = ''
		patProvider: 'github' | 'gitlab' | 'bitbucket' | 'forgejo' = 'github'
		patInstanceUrl: string = ''
		patToken: string = ''
		error: string = ''
		providers = [
			{ id: 'github', label: 'GitHub', icon: 'mdi-github' },
			{ id: 'gitlab', label: 'GitLab', icon: 'mdi-gitlab' },
			{ id: 'bitbucket', label: 'Bitbucket', icon: 'mdi-bitbucket' },
			{ id: 'forgejo', label: 'Forgejo', icon: 'mdi-git' }
		]

		get canSavePat(): boolean {
			if (!this.patToken) return false
			if (this.patProvider === 'forgejo' && !this.patInstanceUrl.trim()) return false
			return true
		}

		hasCredential(provider: string): boolean {
			return this.credentials.some(c => c.provider === provider)
		}

		providerIcon(provider: string): string {
			if (provider === 'github') return 'mdi-github'
			if (provider === 'gitlab') return 'mdi-gitlab'
			if (provider === 'bitbucket') return 'mdi-bitbucket'
			return 'mdi-git'
		}

		providerFromUrl(url: string): string {
			if (!url) return 'forgejo'
			if (url.indexOf('github.com') !== -1) return 'github'
			if (url.indexOf('gitlab.com') !== -1) return 'gitlab'
			if (url.indexOf('bitbucket.org') !== -1) return 'bitbucket'
			return 'forgejo'
		}

		get show() { return this.modelValue }
		set show(v: boolean) { this.$emit('update:modelValue', v) }

		@Watch('modelValue')
		onOpen(val: boolean) {
			if (val) {
				this.error = ''
				this.loadRemotes()
				this.loadCredentials()
			}
		}

		async loadRemotes() {
			if (!this.folder) return
			this.remotesLoading = true
			try {
				const data = await gitCall('git/remotes', { folder: this.folder })
				this.remotes = data.remotes || []
			} catch (e) {
				this.remotes = []
			} finally {
				this.remotesLoading = false
			}
		}

		async loadCredentials() {
			try {
				const data = await gitCall('git-credential/get')
				this.credentials = data.credentials || []
				if (this.credentials.some(c => c.provider === 'github' && c.auth_type === 'app')) {
					this.loadAvailableRepos()
				} else {
					this.availableRepos = []
				}
			} catch (e) {
				this.credentials = []
				this.availableRepos = []
			}
		}

		async loadAvailableRepos() {
			try {
				const data = await gitCall('git-credential/repos')
				this.availableRepos = data.repos || []
			} catch (e) {
				this.availableRepos = []
			}
		}

		async addRemote() {
			if (!this.newRemoteName || !this.newRemoteUrl) return
			this.error = ''
			try {
				await gitCall('git/remote-add', { folder: this.folder, name: this.newRemoteName, url: this.newRemoteUrl })
				this.newRemoteName = 'origin'
				this.newRemoteUrl = ''
				this.loadRemotes()
			} catch (e: any) {
				this.error = e.details || e.error || 'Error'
			}
		}

		async removeRemote(name: string) {
			this.error = ''
			try {
				await gitCall('git/remote-remove', { folder: this.folder, name })
				this.loadRemotes()
			} catch (e: any) {
				this.error = e.details || e.error || 'Error'
			}
		}

		startInstall() {
			window.location.href = LeekWars.API + 'git-credential/start-install'
		}

		async savePat() {
			if (!this.canSavePat) return
			this.error = ''
			const instance = this.patProvider === 'forgejo' ? this.patInstanceUrl.trim() : ''
			try {
				await gitCall('git-credential/save-pat', { provider: this.patProvider, token: this.patToken, instance_url: instance })
				this.patToken = ''
				this.patInstanceUrl = ''
				this.loadCredentials()
			} catch (e: any) {
				const key = e?.error === 'invalid_instance_url' ? 'invalid_instance_url' : 'invalid_token'
				let msg = this.$t(key) as string
				if (e?.details?.http_code) msg += ` (HTTP ${e.details.http_code})`
				if (e?.details?.curl_error) msg += `: ${e.details.curl_error}`
				this.error = msg
			}
		}

		async deleteCredential(cred: { provider: string, instance_url: string | null }) {
			this.error = ''
			try {
				await gitCall('git-credential/delete', { provider: cred.provider, instance_url: cred.instance_url || '' })
				this.loadCredentials()
			} catch (e: any) {
				this.error = e.details || e.error || 'Error'
			}
		}
	}
</script>

<style lang="scss" scoped>
.section-title {
	font-weight: bold;
	font-size: 14px;
	margin-bottom: 8px;
	&.auth-title {
		margin-top: 16px;
	}
}
.empty {
	color: #888;
	font-size: 13px;
	margin-bottom: 8px;
}
.remote-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	margin-bottom: 4px;
	border: 1px solid rgba(0,0,0,0.08);
	border-radius: 6px;
	background: rgba(0,0,0,0.02);
	font-size: 13px;
	transition: background 0.15s ease, border-color 0.15s ease;
	&:hover {
		background: rgba(0,0,0,0.04);
		border-color: rgba(0,0,0,0.15);
		.remote-delete { opacity: 1; }
	}
	.remote-provider-icon { font-size: 22px; }
	&.github .remote-provider-icon    { color: #24292e; }
	&.gitlab .remote-provider-icon    { color: #fc6d26; }
	&.bitbucket .remote-provider-icon { color: #2684ff; }
	&.forgejo .remote-provider-icon   { color: #629324; }
	.remote-name {
		font-weight: 600;
		padding: 2px 8px;
		background: rgba(0,0,0,0.06);
		border-radius: 4px;
		font-size: 12px;
	}
	.remote-url {
		flex: 1;
		min-width: 0;
		color: #888;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: monospace;
		font-size: 12px;
	}
	.remote-delete {
		cursor: pointer;
		font-size: 18px;
		opacity: 0.4;
		transition: opacity 0.15s ease, color 0.15s ease;
		&:hover { opacity: 1; color: #c00; }
	}
}
body.dark .remote-item {
	border-color: rgba(255,255,255,0.1);
	background: rgba(255,255,255,0.03);
	&:hover {
		background: rgba(255,255,255,0.06);
		border-color: rgba(255,255,255,0.2);
	}
	.remote-name { background: rgba(255,255,255,0.1); }
	&.github .remote-provider-icon    { color: #e6edf3; }
	&.bitbucket .remote-provider-icon { color: #579dff; }
	&.forgejo .remote-provider-icon   { color: #8ab84a; }
}
.add-remote {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 8px;
	.input {
		background: rgba(0,0,0,0.1);
		border: 1px solid rgba(0,0,0,0.15);
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 13px;
		color: inherit;
		&.url { flex: 1; }
		&.repo-select { min-width: 0; }
	}
	.add-btn {
		cursor: pointer;
		padding: 4px 14px;
		background: #5fad1b;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		&:hover { background: #73d120; }
		&:disabled { opacity: 0.3; cursor: default; background: #5fad1b; }
	}
}
body.dark .add-remote .input {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.15);
}
.credential-info {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 10px;
	margin-bottom: 4px;
	border: 1px solid rgba(0,0,0,0.08);
	border-radius: 6px;
	background: rgba(0,0,0,0.02);
	font-size: 13px;
	transition: background 0.15s ease, border-color 0.15s ease;
	&:hover {
		background: rgba(0,0,0,0.04);
		border-color: rgba(0,0,0,0.15);
		.credential-delete { opacity: 1; }
	}
	.provider-icon { font-size: 22px; }
	&.github .provider-icon    { color: #24292e; }
	&.gitlab .provider-icon    { color: #fc6d26; }
	&.bitbucket .provider-icon { color: #2684ff; }
	&.forgejo .provider-icon   { color: #629324; }
	.auth-type {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		background: rgba(0,0,0,0.06);
		border-radius: 4px;
		color: #666;
	}
	.credential-user {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		.anonymous { color: #888; font-style: italic; }
		.credential-instance {
			color: #888;
			font-size: 12px;
			font-family: monospace;
			margin-left: 4px;
		}
	}
	.credential-delete {
		cursor: pointer;
		font-size: 18px;
		opacity: 0.4;
		transition: opacity 0.15s ease, color 0.15s ease;
		margin-left: 0;
		&:hover { opacity: 1; color: #c00; }
	}
}
body.dark .credential-info {
	border-color: rgba(255,255,255,0.1);
	background: rgba(255,255,255,0.03);
	&:hover {
		background: rgba(255,255,255,0.06);
		border-color: rgba(255,255,255,0.2);
	}
	.auth-type { background: rgba(255,255,255,0.1); color: #ccc; }
	&.github .provider-icon    { color: #e6edf3; }
	&.bitbucket .provider-icon { color: #579dff; }
	&.forgejo .provider-icon   { color: #8ab84a; }
}
.auth-hint {
	font-size: 11px;
	color: #888;
	margin-top: 4px;
}
.auth-section {
	.oauth-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
		font-weight: bold;
		color: white;
		&.github { background: #24292e; }
		&.github:hover { background: #3a3f44; }
	}
	.pat-section {
		margin-top: 12px;
		.pat-label {
			font-size: 12px;
			color: #888;
			margin-bottom: 6px;
		}
		.provider-tiles {
			display: flex;
			gap: 8px;
			margin-bottom: 8px;
			.provider-tile {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 4px;
				padding: 10px 6px;
				border: 1px solid rgba(0,0,0,0.12);
				border-radius: 6px;
				cursor: pointer;
				font-size: 12px;
				font-weight: 500;
				color: #555;
				background: rgba(0,0,0,0.02);
				transition: all 0.15s ease;
				.v-icon {
					font-size: 28px;
					color: #888;
					transition: color 0.15s ease;
				}
				&:hover {
					border-color: rgba(0,0,0,0.25);
					background: rgba(0,0,0,0.05);
					transform: translateY(-1px);
					box-shadow: 0 2px 6px rgba(0,0,0,0.08);
				}
				&.active {
					color: white;
					border-color: transparent;
					transform: translateY(-1px);
					box-shadow: 0 2px 8px rgba(0,0,0,0.15);
					.v-icon { color: white; }
				}
				&.github.active    { background: #24292e; &:hover { background: #3a3f44; } }
				&.gitlab.active    { background: #fc6d26; &:hover { background: #e24329; } }
				&.bitbucket.active { background: #2684ff; &:hover { background: #0052cc; } }
				&.forgejo.active   { background: #629324; &:hover { background: #4d7a1c; } }
				&.github:not(.active)    .v-icon { color: #24292e; }
				&.gitlab:not(.active)    .v-icon { color: #fc6d26; }
				&.bitbucket:not(.active) .v-icon { color: #2684ff; }
				&.forgejo:not(.active)   .v-icon { color: #629324; }
			}
		}
		.instance-input {
			display: block;
			width: 100%;
			box-sizing: border-box;
			background: rgba(0,0,0,0.1);
			border: 1px solid rgba(0,0,0,0.15);
			border-radius: 4px;
			padding: 4px 8px;
			font-size: 13px;
			color: inherit;
			margin-bottom: 6px;
		}
		.pat-input {
			display: flex;
			gap: 6px;
			align-items: center;
			.input {
				flex: 1;
				background: rgba(0,0,0,0.1);
				border: 1px solid rgba(0,0,0,0.15);
				border-radius: 4px;
				padding: 4px 8px;
				font-size: 13px;
				color: inherit;
			}
			.pat-save {
				padding: 4px 12px;
				background: #5fad1b;
				color: white;
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
				&:hover { background: #73d120; }
				&.disabled { opacity: 0.3; pointer-events: none; }
			}
		}
	}
}
body.dark .pat-section .provider-tile {
	border-color: rgba(255,255,255,0.15);
	background: rgba(255,255,255,0.04);
	color: #bbb;
	&:hover {
		border-color: rgba(255,255,255,0.3);
		background: rgba(255,255,255,0.08);
	}
	.v-icon { color: #aaa; }
	&.github:not(.active)   .v-icon { color: #e6edf3; }
	&.gitlab:not(.active)   .v-icon { color: #fc6d26; }
	&.bitbucket:not(.active) .v-icon { color: #579dff; }
	&.forgejo:not(.active)  .v-icon { color: #8ab84a; }
}
body.dark .pat-input .input,
body.dark .pat-section .instance-input {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.15);
}
.error-msg {
	margin-top: 10px;
	color: #c00;
	font-size: 13px;
}
</style>
