<template>
	<v-menu :close-on-content-click="false" :nudge-width="width" :left="true" :nudge-top="0" :min-width="width" :max-width="width" top offset-y @input="open">
		<div v-ripple slot="activator" class="chat-input-emoji">
			<img src="https://twemoji.maxcdn.com/2/svg/1f603.svg">
		</div>
		<v-tabs :key="categories.length" class="tabs" centered>
			<v-tabs-slider class="indicator" />
			<v-tab v-for="(category, c) in categories" :key="c" :href="'#tab-' + c" class="tab">
				<img :src="category.icon">
			</v-tab>
			<v-tab-item v-for="(category, c) in categories" :id="'tab-' + c" :key="c" class="content">
				<template v-for="(emoji, e) in category.emojis">
					<img v-if="!LeekWars.mobile || emoji.classic" :key="e" :src="emoji.image" :title="emoji.text" class="emoji" @click="$emit('pick', emoji.emoji)">
					<div v-else :key="e" class="emoji" @click="$emit('pick', emoji.emoji)">{{ emoji.emoji }}</div>
				</template>
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
		categories = []
		open(opened: boolean) {
			if (opened && !this.categories.length) {
				this.categories = Emojis.categories_formatted
			}
		}
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
	.tab img {
		width: 20px;
		height: 20px;
	}
	.indicator {
		background: #5fad1b;
	}
	.tabs {
		height: 268px;
	}
	.tabs /deep/ .tabs__container {
		height: 38px;
	}
	.tabs /deep/ .v-tabs__items {
		background: #f5f5f5;
	}
	.content {
		background: #f5f5f5;
		padding: 10px;
		height: 200px;
		overflow: auto;
	}
	.v-menu--inline {
		display: block;
	}
	.emoji {
		display: inline-block;
		border-radius: 2px;
		cursor: pointer;
		width: 25px;
		height: 25px;
		padding: 4px;
		vertical-align: middle;
		font-size: 22px;
		line-height: 25px;
	}
	.emoji:hover {
		background: #ccc;
	}
</style>