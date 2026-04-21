<template>
	<span class="br-invite-card">
		⚔️ {{ label || 'Arène' }}
		<span v-if="arenaCount >= 0" class="progress">{{ arenaCount }}&nbsp;/&nbsp;20</span>
		<span v-if="arenaCountdown >= 0" class="countdown">{{ arenaCountdown }}s</span>
		<span v-if="eligibleLeek && !inArena" class="btn" @click="joinArena">Rejoindre</span>
		<span v-else-if="needsModeChange" class="btn btn-change" @click="changeMode">Changer mode</span>
	</span>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class BrInvite extends Vue {
		@Prop() level!: number
		@Prop() label!: string
		@Prop() mode!: number

		get arenaCount() {
			return this.$store.state.arenaCount || 0
		}

		get arenaCountdown() {
			return this.$store.state.arenaCountdown
		}

		get inArena() {
			return this.$store.state.arenaEnabled
		}

		get eligibleLeek() {
			const farmer = this.$store.state.farmer
			if (!farmer) { return null }
			// Priorité : leek arène actuel > dernier leek potager > premier éligible (level >= 20)
			for (const key of ['arena-leek', 'garden/leek']) {
				const id = parseInt(localStorage.getItem(key) || '', 10)
				if (id && farmer.leeks[id] && farmer.leeks[id].level >= 20) {
					return id
				}
			}
			for (const id in farmer.leeks) {
				if (farmer.leeks[id].level >= 20) {
					return farmer.leeks[id].id
				}
			}
			return null
		}

		get needsModeChange() {
			if (!this.inArena || this.mode === undefined) { return false }
			return this.$store.state.arenaPreference !== this.mode
		}

		joinArena() {
			const leek = this.eligibleLeek
			if (leek) {
				const preference = this.mode !== undefined
					? this.mode
					: parseInt(localStorage.getItem('arena/preference') || '-1', 10)
				LeekWars.arena.register(leek, preference)
			}
		}

		changeMode() {
			const leek = parseInt(localStorage.getItem('arena-leek') || '', 10) || this.eligibleLeek
			if (leek && this.mode !== undefined) {
				const wantsColossus = localStorage.getItem('arena-colossus') === '1'
				LeekWars.arena.register(leek, this.mode, wantsColossus)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.br-invite-card {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 8px;
		font-size: 14px;
		.progress {
			color: #5fad1b;
			font-weight: 700;
		}
		.countdown {
			color: #e67e22;
			font-weight: 700;
		}
		.btn {
			background: #5fad1b;
			color: white;
			padding: 1px 8px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			&:hover {
				background: #4e9216;
			}
			&.btn-change {
				background: #e67e22;
				&:hover {
					background: #c86a18;
				}
			}
		}
	}
</style>
