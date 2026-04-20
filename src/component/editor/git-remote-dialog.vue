<template>
	<popup v-model="show" :width="550" icon="mdi-cog" :title="$t('title')">
		<!-- Remotes -->
		<div class="section-title">{{ $t('remotes') }}</div>
		<div v-if="remotes.length === 0 && !remotesLoading" class="empty">{{ $t('no_remotes') }}</div>
		<div v-for="remote in remotes" :key="remote.name" class="remote-item">
			<span class="remote-name">{{ remote.name }}</span>
			<span class="remote-url">{{ remote.url }}</span>
			<v-icon class="remote-delete" @click="removeRemote(remote.name)">mdi-delete</v-icon>
		</div>
		<div class="add-remote">
			<input v-model="newRemoteName" :placeholder="$t('remote_name')" class="input" />
			<select v-if="availableRepos.length > 0" v-model="newRemoteUrl" class="input url repo-select">
				<option value="">{{ $t('select_repo') }}</option>
				<option v-for="r in availableRepos" :key="r.clone_url" :value="r.clone_url">{{ r.full_name }}{{ r.private ? ' 🔒' : '' }}</option>
			</select>
			<input v-else v-model="newRemoteUrl" :placeholder="$t('remote_url')" class="input url" />
			<button type="button" class="add-btn" :disabled="!newRemoteName || !newRemoteUrl" @click="addRemote">
				<v-icon>mdi-plus</v-icon>
			</button>
		</div>

		<!-- Authentification -->
		<div class="section-title auth-title">{{ $t('authentication') }}</div>
		<div v-for="cred in credentials" :key="cred.provider + ':' + (cred.instance_url || '')" class="credential-info">
			<v-icon class="provider-icon">{{ providerIcon(cred.provider) }}</v-icon>
			<span>{{ $t('connected_as', [cred.username]) }}</span>
			<span v-if="cred.instance_url" class="instance">@ {{ cred.instance_url }}</span>
			<span class="auth-type">({{ cred.auth_type === 'app' ? $t('github_app') : 'PAT' }})</span>
			<v-icon class="credential-delete" @click="deleteCredential(cred)">mdi-delete</v-icon>
		</div>
		<div class="auth-section">
			<div v-if="!hasCredential('github')" class="oauth-btn github" @click="startInstall">
				<v-icon>mdi-github</v-icon> {{ $t('install_github_app') }}
			</div>
			<div v-if="!hasCredential('github')" class="auth-hint">{{ $t('install_hint') }}</div>
			<div class="pat-section">
				<div class="pat-label">{{ $t('or_pat') }}</div>
				<div class="pat-row">
					<select v-model="patProvider" class="input provider-select">
						<option value="github">GitHub</option>
						<option value="gitlab">GitLab</option>
						<option value="forgejo">Forgejo</option>
					</select>
					<input v-if="patProvider === 'forgejo'" v-model="patInstanceUrl" :placeholder="$t('instance_placeholder')" class="input instance-input" />
				</div>
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
		patProvider: 'github' | 'gitlab' | 'forgejo' = 'github'
		patInstanceUrl: string = ''
		patToken: string = ''
		error: string = ''

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
			return 'mdi-git'
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
			} catch {
				this.error = this.$t('invalid_token') as string
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
	gap: 8px;
	padding: 4px 0;
	font-size: 13px;
	.remote-name {
		font-weight: bold;
		min-width: 60px;
	}
	.remote-url {
		flex: 1;
		color: #888;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.remote-delete {
		cursor: pointer;
		font-size: 18px;
		opacity: 0.5;
		&:hover { opacity: 1; }
	}
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
		font-size: 22px;
		background: transparent;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: inherit;
		&:disabled { opacity: 0.3; cursor: default; }
	}
}
body.dark .add-remote .input {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.15);
}
.credential-info {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	padding: 2px 0;
	.provider-icon { font-size: 20px; }
	.auth-type { color: #888; }
	.instance { color: #888; font-size: 12px; }
	.credential-delete {
		cursor: pointer;
		font-size: 18px;
		opacity: 0.5;
		margin-left: auto;
		&:hover { opacity: 1; }
	}
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
			margin-bottom: 4px;
		}
		.pat-row {
			display: flex;
			gap: 6px;
			margin-bottom: 6px;
			.input {
				background: rgba(0,0,0,0.1);
				border: 1px solid rgba(0,0,0,0.15);
				border-radius: 4px;
				padding: 4px 8px;
				font-size: 13px;
				color: inherit;
			}
			.provider-select { min-width: 110px; }
			.instance-input { flex: 1; }
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
body.dark .pat-input .input,
body.dark .pat-row .input {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.15);
}
.error-msg {
	margin-top: 10px;
	color: #c00;
	font-size: 13px;
}
</style>
