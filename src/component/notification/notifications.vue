<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>
		<div class="panel">
			<loader v-if="!notifications" />
			<div v-else id="notifications" class="content">
				<notification v-for="notification in notifications" :key="notification.id" :notification="notification" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import NotificationElement from '@/component/notification/notification.vue'
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Vue } from 'vue-property-decorator'

	@Component({
		name: 'notifications', i18n: {},
		components: { notification: NotificationElement }
	})
	export default class Notifications extends Vue {
		notifications: any = null
		created() {
			LeekWars.get<any>('notification/get-latest/500/' + this.$store.state.token).then((data) => {
				this.notifications = []
				for (const notification of data.data.notifications) {
					this.notifications.push(Notification.build(notification))
				}
				LeekWars.setTitle(this.$t('title'))
				LeekWars.post('notification/read-all')
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