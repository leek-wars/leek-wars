<template>
	<router-link v-if="notification" v-ripple :to="link" :notif="notification.id" :type="notification.type" :class="{unread: !notification.read}" class="notification" @click.native="click">
		<img :src="'/image/notif/' + notification.image + '.png'" class="avatar">
		<div class="title" v-html="$t('notification.title_' + notification.type, notification.title)"></div>
		<div class="message">{{ $t('notification.message_' + notification.type, notification.message) }}</div>
		<span class="date">{{ LeekWars.formatDuration(notification.date) }}</span>
		<span v-if="resultIcon && LeekWars.notifsResults" class="result">
			<v-icon :class="resultIcon">{{ resultIcon }}</v-icon>
		</span>
	</router-link>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Notification } from '@/model/notification'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'notification' })
	export default class NotificationElement extends Vue {
		@Prop({ required: true }) notification!: Notification
		get link() { return this.notification.link ? this.notification.link : '' }
		get resultIcon() {
			return this.notification.result === null ? '' : this.notification.result === 1 ? 'mdi-check' : this.notification.result === 0 ? 'mdi-equal' : 'mdi-close'
		}
		click() {
			LeekWars.post('notification/read', {notification_id: this.notification.id})
			this.$store.commit('read-notification', this.notification.id)
		}
	}
</script>

<style lang="scss" scoped>
	.notification {
		height: 50px;
		position: relative;
		display: block;
		&.unread {
			background-color: rgba(95, 173, 27, 0.15);
		}
		margin-bottom: 1px;
	}
	.notification:hover {
		background-color: white;
		box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		&.unread {
			background-color: rgba(95, 173, 27, 0.2);
		}
	}
	.title {
		font-size: 14px;
		padding-top: 6px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
	.result {
		position: absolute;
		background: white;
		height: 24px;
		width: 24px;
		border-radius: 50%;
		text-align: center;
		border-bottom: 2px solid #ccc;
		border-right: 2px solid #ccc;
		left: 2px;
		top: 2px;
	}
	.result i {
		font-size: 20px;
		padding-top: 2px;
		padding-left: 2px;
		font-weight: bold;
	}
	.result .mdi-check {
		color: green;
	}
	.result .mdi-close {
		color: red;
	}
	.message {
		color: #555;
		font-size: 12px;
		margin-top: 5px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
	.date {
		float: right;
		color: #555;
		font-size: 12px;
		margin-top: -16px;
		padding-right: 8px;
	}
	img {
		height: 50px;
		width: 50px;
		float: left;
		padding: 10px;
	}
</style>