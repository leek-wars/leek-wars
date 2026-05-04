<template>
	<div class="page">
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
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
import { mixins } from '@/model/i18n'
import { LeekWars } from '@/model/leekwars'
import { NotificationBuilder } from '@/model/notification-builder'
import { store } from '@/model/store'

defineOptions({ name: 'notifications', i18n: {}, mixins: [...mixins] })

const t = useNamespacedT('notifications')
const notifications = ref<any>(null)

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
</style>