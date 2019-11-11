<template>
	<v-menu :close-on-content-click="false" :nudge-width="width" :left="true" :nudge-top="0" :min-width="width" :max-width="width" top offset-y lazy>
		<div v-ripple slot="activator" class="chat-input-emoji">
			<img src="https://twemoji.maxcdn.com/2/svg/1f603.svg">
		</div>
		<v-tabs :key="categories.length" class="tabs" centered>
			<v-tabs-slider class="indicator" />
			<v-tab v-for="(category, c) in categories" :key="c" :href="'#tab-' + c" class="tab">
				<span v-emojis>{{ category.icon }}</span>
			</v-tab>
			<v-tab-item v-autostopscroll v-for="(category, c) in categories" :value="'tab-' + c" :key="c" class="content">
				<div class="grid">
					<template v-for="(emoji, e) in category.emojis">
						<img v-if="c == 0 && e < 11" :key="e" :src="'/image/emoji/' + Emojis.custom[emoji] + '.png'" :title="emoji" class="emoji classic" @click="$emit('pick', emoji)">
						<div v-else :key="e" class="emoji" :class="{'emoji-font': !LeekWars.nativeEmojis}" @click="$emit('pick', emoji)">{{ emoji }}</div>
					</template>
				</div>
			</v-tab-item>
		</v-tabs>
	</v-menu>
</template>

<script lang="ts">
	import { Emojis } from '@/model/emojis'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	
	@Component({})
	export default class EmojiPicker extends Vue {
		width: number = 352
		categories = Emojis.categories
		Emojis = Emojis
	}
</script>

<style lang="scss" scoped>
	.chat-input-emoji {
		position: absolute;
		width: 24px;
		height: 24px;
		padding: 8px;
		right: 0;
		top: 0;
		cursor: pointer;
	}
	.tab /deep/ .emoji {
		font-size: 20px;
	}
	.indicator {
		background: #5fad1b;
	}
	.tabs {
		height: 264px;
	}
	.tabs /deep/ .tabs__container {
		height: 38px;
	}
	.tabs /deep/ .v-tabs__items {
		background: #f5f5f5;
	}
	.tab {
		font-size: 20px;
	}
	.tab /deep/ .v-tabs__item {
		width: 20px;
	}
	.content {
		overflow: auto;
		background: #f5f5f5;
	}
	.grid {
		padding: 8px;
		height: 200px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
		grid-auto-rows: minmax(min-content, max-content);
	}
	.v-menu--inline {
		display: block;
	}
	.emoji {
		border-radius: 2px;
		cursor: pointer;
		padding: 2px;
		vertical-align: middle;
		font-size: 22px;
		line-height: 28px;
		text-align: center;
	}
	.emoji.classic {
		width: 24px;
		height: 24px;
		padding: 4px;
	}
	.emoji:hover {
		background: #ccc;
	}
</style>