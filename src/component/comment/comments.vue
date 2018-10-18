<template>
	<div class="wrapper">
		<loader v-if="!comments" />
		<div v-else class="comments">
			<div v-for="(comment, c) in comments" :key="c" class="comment">
				<router-link :to="'/farmer/' + comment.farmer.id">
					<avatar :farmer="comment.farmer" />
				</router-link>
				<div class="content">
					<div class="author">
						<router-link :to="'/farmer/' + comment.farmer.id"><b>{{ comment.farmer.name }}</b></router-link>
					</div>
					<div v-emojis class="text">{{ comment.comment }}</div>
					<div class="date">{{ comment.date | date }}</div>
				</div>
			</div>
		</div>
		<chat-input @message="send" />
	</div>
</template>

<script lang="ts">
	import ChatInput from '@/component/chat/chat-input.vue'
	import { Comment } from '@/model/comment'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ 
		name: 'comments', 
		components: { 'chat-input': ChatInput } 
	})
	export default class Comments extends Vue {
		@Prop({required: true}) comments!: Comment[]
		send(message: string) {
			const farmer = store.state.farmer
			if (farmer) {
				const comment = new Comment
				comment.comment = message
				comment.farmer = {name: farmer.name, avatar_changed: farmer.avatar_changed} as Farmer
				comment.date = LeekWars.time
				this.$emit('comment', comment)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.wrapper {
		margin: 0 auto;
		padding: 15px;
		max-width: 700px;
	}
	.comments {
		padding: 3px;
	}
	.comment {
		margin-bottom: 10px;
	}
	.comment .avatar {
		width: 50px;
		height: 50px;
	}
	.comment .content {
		display: inline-block;
		vertical-align: top;
		padding-left: 5px;
	}
	.comment .author a {
		color: #5fad1b;
	}
	.comment .date {
		font-size: 12px;
		color: #aaa;
	}
</style>