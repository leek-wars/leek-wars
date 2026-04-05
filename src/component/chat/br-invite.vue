<template>
	<span class="br-invite-card">
		⚔️ {{ label || 'Arène' }}
		<span v-if="arenaCount >= 0" class="progress">{{ arenaCount }}&nbsp;/&nbsp;20</span>
		<span v-if="arenaCountdown >= 0" class="countdown">{{ arenaCountdown }}s</span>
		<span v-if="eligibleLeek && !inArena" class="btn" @click="joinArena">Rejoindre</span>
	</span>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class BrInvite extends Vue {
		@Prop() level!: number
		@Prop() label!: string

		get arenaCount() {
			return this.$store.state.arenaCount || 0
		}

		get arenaCountdown() {
			return this.$store.state.arenaCountdown
		}

		get inArena() {
			return LeekWars.arena.enabled
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

		joinArena() {
			const leek = this.eligibleLeek
			if (leek) {
				const preference = parseInt(localStorage.getItem('arena/preference') || '-1', 10)
				LeekWars.arena.register(leek, preference)
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
		}
	}
</style>
