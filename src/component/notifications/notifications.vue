<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<panel class="first">
			<loader v-if="!notifications" slot="content" />
			<div v-else slot="content" class="content">
				<notification v-for="notification in notifications" :key="notification.id" :notification="notification" />
			</div>
		</panel>
	</div>
</template>

<script lang="ts">
	import NotificationElement from '@/component/notifications/notification.vue'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({
		name: 'notifications', i18n: {}, mixins: [...mixins],
		components: { notification: NotificationElement }
	})
	export default class Notifications extends Vue {
		notifications: any = null
		created() {
			LeekWars.get('notification/get-latest/500').then(data => {
				this.notifications = []
				for (const notification of data.notifications) {
					const notif = Notification.build(notification)
					notif.read = true
					this.notifications.push(notif)
				}
				LeekWars.setTitle(this.$t('title'))
				this.$store.commit('read-notifications')
			})
		}
	}
</script>

<style lang="scss" scoped>
	#app.app .content {
		padding: 0;
	}
</style>