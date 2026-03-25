<template>
	<span class="br-invite-card">
		⚔️ {{ label || 'BR' }}
		<span v-if="range" class="range">{{ range.min }}-{{ range.max }}</span>
		<span v-if="rangeCount >= 0" class="progress">{{ rangeCount }}&nbsp;/&nbsp;10</span>
		<span v-if="eligibleLeek && !inSameRange" class="btn" @click="joinBR">Rejoindre</span>
	</span>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { BattleRoyale } from '@/model/battle-royale'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class BrInvite extends Vue {
		@Prop() level!: number
		@Prop() label!: string

		get rangeIndex() {
			return BattleRoyale.getRangeIndex(this.level)
		}

		get range() {
			return BattleRoyale.getRange(this.level)
		}

		get rangeCount() {
			const idx = this.rangeIndex
			if (idx < 0) { return -1 }
			return this.$store.state.brCounts[idx] || 0
		}

		get inSameRange() {
			if (!LeekWars.battleRoyale.enabled || !this.range) { return false }
			const brLeekId = parseInt(localStorage.getItem('battle-royale-leek') || '', 10)
			const farmer = this.$store.state.farmer
			if (!brLeekId || !farmer || !farmer.leeks[brLeekId]) { return false }
			const lvl = farmer.leeks[brLeekId].level
			return lvl >= this.range.min && lvl <= this.range.max
		}

		get eligibleLeek() {
			const farmer = this.$store.state.farmer
			if (!farmer || !this.range) { return null }
			// Priorité : leek BR actuel > dernier leek potager > premier éligible
			for (const key of ['battle-royale-leek', 'garden/leek']) {
				const id = parseInt(localStorage.getItem(key) || '', 10)
				if (id && farmer.leeks[id]) {
					const lvl = farmer.leeks[id].level
					if (lvl >= this.range.min && lvl <= this.range.max) {
						return id
					}
				}
			}
			for (const id in farmer.leeks) {
				const lvl = farmer.leeks[id].level
				if (lvl >= this.range.min && lvl <= this.range.max) {
					return farmer.leeks[id].id
				}
			}
			return null
		}

		findEligibleLeek() {
			const farmer = this.$store.state.farmer
			if (!farmer || !this.range) { return null }
			for (const key of ['battle-royale-leek', 'garden/leek']) {
				const id = parseInt(localStorage.getItem(key) || '', 10)
				if (id && farmer.leeks[id]) {
					const lvl = farmer.leeks[id].level
					if (lvl >= this.range!.min && lvl <= this.range!.max) {
						return id
					}
				}
			}
			for (const id in farmer.leeks) {
				const lvl = farmer.leeks[id].level
				if (lvl >= this.range!.min && lvl <= this.range!.max) {
					return farmer.leeks[id].id
				}
			}
			return null
		}

		joinBR() {
			const leek = this.findEligibleLeek()
			if (leek) {
				LeekWars.battleRoyale.register(leek)
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
		.range {
			color: var(--text-color-secondary);
		}
		.progress {
			color: #5fad1b;
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
