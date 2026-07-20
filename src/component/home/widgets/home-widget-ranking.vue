<template>
	<div class="remarkable-widget">
		<loader v-if="!loaded" />
		<template v-else>
			<router-link v-for="p in players" :key="p.id" v-ripple :to="'/farmer/' + p.id" class="player">
				<img :src="LeekWars.getAvatar(p.id, p.avatar_changed)" class="avatar" loading="lazy">
				<div class="info">
					<div class="name-line">
						<span class="name">{{ p.name }}</span>
						<flag v-if="p.country" :code="p.country" :clickable="false" class="flag" />
					</div>
					<span class="reason">{{ reasonText(p.reason) }}</span>
				</div>
			</router-link>
			<div v-if="!players.length" class="none">{{ t('nobody') }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { LeekWars } from '@/model/leekwars'
	import { useNamespacedT } from '@/model/i18n'

	defineOptions({ name: 'HomeWidgetRanking' })

	const t = useNamespacedT('home')

	interface Reason { type: string, value: number, rank: number }
	interface Player { id: number, name: string, avatar_changed: number, country: string | null, reason: Reason }

	const loaded = ref(false)
	const players = ref<Player[]>([])

	function reasonText(r: Reason): string {
		switch (r.type) {
			case 'top_talent': return t('reason_top_talent', [r.rank])
			case 'forum_messages': return t('reason_forum_messages', [r.value])
			case 'trophies': return t('reason_trophies', [r.value])
			case 'likes': return t('reason_likes', [r.value])
			default: return ''
		}
	}

	LeekWars.get<{ players: Player[] }>('farmer/get-remarkable').then((data) => {
		players.value = data.players ?? []
		loaded.value = true
	}).error(() => { loaded.value = true })
</script>

<style lang="scss" scoped>
	.remarkable-widget {
		display: flex;
		flex-direction: column;
	}
	.player {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 4px;
		text-decoration: none;
		color: var(--text-color);
	}
	.player:hover {
		background: var(--background-secondary);
	}
	.avatar {
		width: 34px;
		height: 34px;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name-line {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.name {
		font-weight: bold;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.player:deep(.flag) {
		height: 13px;
		flex-shrink: 0;
	}
	.reason {
		font-size: 12px;
		color: var(--text-color-secondary);
	}
	.none {
		color: var(--text-color-secondary);
		font-style: italic;
		padding: 8px;
	}
</style>
