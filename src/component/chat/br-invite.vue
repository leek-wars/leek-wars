<template>
	<span v-if="expired">/br</span>
	<span v-else class="br-invite-card">
		⚔️ BR
		<span v-if="range" class="range">{{ range.min }}-{{ range.max }}</span>
		<span v-if="rangeCount >= 0" class="progress">{{ rangeCount }}&nbsp;/&nbsp;10</span>
		<span v-if="eligibleLeek && !inSameRange" class="btn" @click="joinBR">Rejoindre</span>
	</span>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { emitter } from '@/model/emitter'
	import { Options, Prop, Vue } from 'vue-property-decorator'

	@Options({})
	export default class BrInvite extends Vue {
		@Prop() level!: number
		range: { min: number, max: number } | null = null
		expired: boolean = false

		static readonly RANGES = [20, 100, 200, 300]

		get rangeIndex() {
			if (!this.range) { return -1 }
			for (let i = BrInvite.RANGES.length - 1; i >= 0; i--) {
				if (this.range.min >= BrInvite.RANGES[i]) { return i }
			}
			return -1
		}

		get rangeCount() {
			const idx = this.rangeIndex
			if (idx < 0) { return -1 }
			return this.$store.state.brCounts[idx] || 0
		}

		get inSameRange() {
			if (!LeekWars.battleRoyale.enabled || !this.range) { return false }
			const brLeekId = parseInt(localStorage.getItem('battle-royale') || '', 10)
			const farmer = this.$store.state.farmer
			if (!brLeekId || !farmer || !farmer.leeks[brLeekId]) { return false }
			const lvl = farmer.leeks[brLeekId].level
			return lvl >= this.range.min && lvl <= this.range.max
		}

		get eligibleLeek() {
			const farmer = this.$store.state.farmer
			if (!farmer || !this.range) { return null }
			const lastLeek = parseInt(localStorage.getItem('garden/leek') || '', 10)
			if (lastLeek && farmer.leeks[lastLeek]) {
				const lvl = farmer.leeks[lastLeek].level
				if (lvl >= this.range.min && lvl <= this.range.max) {
					return lastLeek
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

		mounted() {
			if (this.level) {
				LeekWars.get('tournament/range-br/' + this.level).then((d: any) => {
					this.range = d
				})
			}
			emitter.on('br-started', this.onBrStarted)
		}

		beforeUnmount() {
			emitter.off('br-started', this.onBrStarted)
		}

		onBrStarted(rangeIdx: number) {
			if (this.rangeIndex === rangeIdx) {
				this.expired = true
			}
		}

		joinBR() {
			if (this.eligibleLeek) {
				LeekWars.battleRoyale.register(this.eligibleLeek)
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
