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

<script lang="ts">
	import NotificationElement from '@/component/notifications/notification.vue'
	import { mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { NotificationBuilder } from '@/model/notification-builder'
	import { Options, Vue } from 'vue-property-decorator'

	@Options({
		name: 'notifications', i18n: {}, mixins: [...mixins],
		components: { notification: NotificationElement }
	})
	export default class Notifications extends Vue {
		notifications: any = null
		created() {
			LeekWars.get('notification/get-latest/500').then(data => {
				this.notifications = []
				for (const notification of data.notifications) {
					const notif = NotificationBuilder.build(notification)
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