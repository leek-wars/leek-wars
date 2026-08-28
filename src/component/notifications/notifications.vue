<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
			<v-tooltip :disabled="!pushHint" location="bottom">
				<template #activator="{ props }">
					<span class="push-notifs-button" v-bind="props" @click="updatePushNotifications">
						<v-icon v-if="pushHint" class="push-warning">mdi-alert-circle-outline</v-icon>
						<v-icon v-else>mdi-bell-ring-outline</v-icon>
						<span>{{ $t('push_notifications') }}</span>
						<lw-switch :model-value="pushNotifications" />
					</span>
				</template>
				{{ pushHint }}
			</v-tooltip>
		</div>
		<panel class="first last">
			<template #content>
				<loader v-if="!notifications" />
				<div v-else class="content">
					<notification v-for="notification in notifications" :key="notification.id" :notification="notification" />
				</div>
			</template>
		</panel>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { mixins , useNamespacedT } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { NotificationBuilder } from '@/model/notification-builder'
import { store } from '@/model/store'
import { usePushNotifications } from '@/model/use-push-notifications'

defineOptions({ name: 'Notifications', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('notifications')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notifications = ref<any[] | null>(null)

const { pushNotifications, pushHint, reconcilePushToggle, updatePushNotifications } = usePushNotifications(t)
// Pas de liste serveur ici : tout abonnement local du navigateur suffit à afficher le toggle ON.
reconcilePushToggle()

LeekWars.get('notification/get-latest/500').then(data => {
	notifications.value = []
	for (const notification of data.notifications) {
		const notif = NotificationBuilder.build(notification)
		notif.read = true
		notifications.value.push(notif)
	}
	LeekWars.setTitle(t('title'))
	store.commit('read-notifications')
})
</script>

<style lang="scss" scoped>
	#app.app .content {
		padding: 0;
	}
	.push-notifs-button {
		display: flex;
		cursor: pointer;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		padding: 0 8px;
		// Le bouton vit dans la barre d'en-tête : il en prend l'encre. --grey-13
		// (« presque blanc ») supposait une barre sombre, ce que le v3 en clair
		// n'est plus — 1,01 mesuré, l'icône disparaissait complètement.
		color: var(--page-bar-color);
		.push-warning {
			color: #ffca28;
		}
	}
</style>
