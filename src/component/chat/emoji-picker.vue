<template>
	<v-menu :close-on-content-click="false" :nudge-width="width" :left="true" :nudge-top="0" :min-width="width" :max-width="width" top offset-y>
		<template v-slot:activator="{ on }">
			<div v-ripple class="chat-input-emoji" v-on="on">
				<div :class="{'emoji-font': !LeekWars.nativeEmojis}">😀</div>
			</div>
		</template>
		<v-tabs :key="categories.length" class="tabs" grow :show-arrows="false">
			<v-tabs-slider class="indicator" />
			<v-tab v-for="(category, c) in categories" :key="c" :href="'#tab-' + c" class="tab">
				<span v-emojis>{{ category.icon }}</span>
			</v-tab>
			<v-tab-item v-for="(category, c) in categories" :key="c" v-autostopscroll :value="'tab-' + c" class="content">
				<div class="grid">
					<template v-for="(emoji, e) in category.emojis">
						<img v-if="c == 0 && e < 11" :key="e" :src="'/image/emoji/' + Emojis.custom[emoji] + '.png'" :title="emoji" class="emoji classic" @click="$emit('pick', emoji)">
						<div v-else :key="e" :class="{'emoji-font': !LeekWars.nativeEmojis}" class="emoji" @click="$emit('pick', emoji)">{{ emoji }}</div>
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
		width: 40px;
		height: 40px;
		padding: 8px;
		right: 0;
		top: 0;
		cursor: pointer;
		div {
			font-size: 20px;
		}
	}
	.tab ::v-deep .emoji {
		font-size: 20px;
	}
	.indicator {
		background: #5fad1b;
	}
	.tabs {
		height: 264px;
	}
	.tabs ::v-deep .v-slide-group {
		height: 38px;
	}
	.tabs ::v-deep .v-tabs__items {
		background: #f5f5f5;
	}
	.tab {
		font-size: 20px;
	}
	.tabs ::v-deep .v-tab {
		min-width: 20px;
		width: 20px;
	}
	.content {
		overflow: auto;
		background: #f5f5f5;
	}
	.grid {
		padding: 8px;
		height: 226px;
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
		width: 32px;
		height: 32px;
		padding: 4px;
	}
	.emoji:hover {
		background: #ccc;
	}
</style>