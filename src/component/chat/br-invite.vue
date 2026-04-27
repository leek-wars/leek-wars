<template>
	<span class="br-invite-card">
		⚔️ {{ label || 'Arène' }}
		<span v-if="arenaCount >= 0" class="progress">{{ arenaCount }}&nbsp;/&nbsp;20</span>
		<span v-if="arenaCountdown >= 0" class="countdown">{{ arenaCountdown }}s</span>
		<span v-if="eligibleLeek && !inArena" class="btn" @click="joinArena">Rejoindre</span>
		<span v-else-if="needsModeChange" class="btn btn-change" @click="changeMode">Changer mode</span>
		<span v-else-if="modeAlreadySelected" class="mode-selected">✓ Mode sélectionné</span>
	</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'

const props = defineProps<{
	level?: number
	label?: string
	mode?: number
}>()

const arenaCount = computed(() => store.state.arenaCount || 0)
const arenaCountdown = computed(() => store.state.arenaCountdown)
const inArena = computed(() => store.state.arenaEnabled)

const eligibleLeek = computed<number | null>(() => {
	const farmer = store.state.farmer
	if (!farmer) return null
	for (const key of ['arena-leek', 'garden/leek']) {
		const id = parseInt(localStorage.getItem(key) || '', 10)
		if (id && farmer.leeks[id] && farmer.leeks[id].level >= 20) return id
	}
	for (const id in farmer.leeks) {
		if (farmer.leeks[id].level >= 20) return farmer.leeks[id].id
	}
	return null
})

const needsModeChange = computed(() => {
	if (!inArena.value || props.mode === undefined) return false
	return store.state.arenaPreference !== props.mode
})

const modeAlreadySelected = computed(() => {
	if (!inArena.value || props.mode === undefined) return false
	return store.state.arenaPreference === props.mode
})

function joinArena() {
	const leek = eligibleLeek.value
	if (leek) {
		const preference = props.mode !== undefined
			? props.mode
			: parseInt(localStorage.getItem('arena/preference') || '-1', 10)
		LeekWars.arena.register(leek, preference)
	}
}

function changeMode() {
	const leek = parseInt(localStorage.getItem('arena-leek') || '', 10) || eligibleLeek.value
	if (leek && props.mode !== undefined) {
		const wantsColossus = localStorage.getItem('arena-colossus') === '1'
		LeekWars.arena.register(leek, props.mode, wantsColossus)
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
		.mode-selected {
			color: #5fad1b;
			font-weight: 600;
			font-size: 12px;
			padding: 1px 8px;
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
