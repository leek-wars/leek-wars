<template>
	<div class="wrapper">
		<loader v-if="!comments" />
		<div v-else class="comments">
			<div v-for="(comment, c) in comments" :key="c" class="comment">
				<router-link :to="'/farmer/' + comment.farmer.id">
					<rich-tooltip-farmer :id="comment.farmer.id" v-slot="{ on }">
						<avatar :farmer="comment.farmer" :on="on" />
					</rich-tooltip-farmer>
				</router-link>
				<div class="content">
					<div class="author">
						<rich-tooltip-farmer :id="comment.farmer.id" v-slot="{ on }">
							<router-link :to="'/farmer/' + comment.farmer.id"><b v-on="on">{{ comment.farmer.name }}</b></router-link>
						</rich-tooltip-farmer>
					</div>
					<div v-emojis class="text" v-text="comment.comment"></div>
					<div class="date">{{ comment.date | date }}</div>
				</div>
			</div>
		</div>
		<chat-input @message="send" :chat="0" />
	</div>
</template>

<script lang="ts">
	import ChatInput from '@/component/chat/chat-input.vue'
	import { Comment } from '@/model/comment'
	import { Farmer } from '@/model/farmer'
	import { LeekWars } from '@/model/leekwars'
	import { store } from '@/model/store'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import RichTooltipFarmer from '@/component/rich-tooltip/rich-tooltip-farmer.vue'
	import '@/model/emojis'

	@Component({
		name: 'comments',
		components: { 'chat-input': ChatInput, RichTooltipFarmer }
	})
	export default class Comments extends Vue {
		@Prop({required: true}) comments!: Comment[]
		send(message: string) {
			const farmer = store.state.farmer
			if (farmer) {
				const comment = new Comment
				comment.comment = message
				comment.farmer = {id: farmer.id, name: farmer.name, avatar_changed: farmer.avatar_changed} as Farmer
				comment.date = LeekWars.time
				this.$emit('comment', comment)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.wrapper {
		margin: 0 auto;
		max-width: 700px;
		width: 100%;
	}
	.comments {
		padding: 3px;
	}
	.comment {
		margin-bottom: 10px;
		display: flex;
	}
	.comment .avatar {
		width: 50px;
		height: 50px;
	}
	.comment .content {
		display: inline-block;
		vertical-align: top;
		padding-left: 10px;
	}
	.comment .date {
		font-size: 12px;
		color: #aaa;
	}
</style>