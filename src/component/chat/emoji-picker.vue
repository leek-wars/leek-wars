<template>
	<v-menu ref="menu" v-model="shown" :close-on-content-click="false" :width="width" location="top" offset-y>
		<template #activator="{ props }">
			<div v-ripple class="chat-input-emoji" v-bind="props">
				<div :class="{'emoji-font': !LeekWars.nativeEmojis}"><slot></slot></div>
			</div>
		</template>
		<v-card>
			<v-tabs v-model="activeTab" :key="categories.length" class="tabs" grow :show-arrows="false">
				<v-tab v-for="(category, c) in categories" :key="c" :value="'tab-' + c" class="tab">
					<span v-emojis>{{ category.icon }}</span>
				</v-tab>
			</v-tabs>
			<v-tabs-window v-model="activeTab">
				<v-tabs-window-item v-for="(category, c) in categories" :key="c" v-autostopscroll :value="'tab-' + c" class="content">
					<div class="grid">
						<template v-for="(emoji, e) in category.emojis">
							<template v-if="c == 0 && e < 30">
								<img v-if="classic !== false" :key="e" :src="'/image/emoji/' + Emojis.custom[emoji] + '.png'" :title="emoji" class="emoji classic" @click="pick(emoji)">
							</template>
							<div v-else :key="e" :class="{'emoji-font': !LeekWars.nativeEmojis}" class="emoji" @click="pick(emoji)">{{ emoji }}</div>
						</template>
					</div>
				</v-tabs-window-item>
			</v-tabs-window>
		</v-card>
	</v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Emojis } from '@/model/emojis'

const props = withDefaults(defineProps<{
	closeOnSelected?: boolean
	classic?: boolean
	left?: boolean
}>(), { left: true })

const emit = defineEmits<{
	pick: [emoji: string]
}>()

const width = 352
const categories = Emojis.categories
const shown = ref(false)
const activeTab = ref('tab-0')

function pick(emoji: string) {
	emit('pick', emoji.replace('&lt;', '<'))
	if (props.closeOnSelected) shown.value = false
}
</script>

<style lang="scss" scoped>
	.chat-input-emoji {
		width: 40px;
		height: 40px;
		padding: 8px;
		cursor: pointer;
		div {
			font-size: 20px;
		}
	}
	.tab :deep(.emoji) {
		font-size: 20px;
	}
	.indicator {
		background: #5fad1b;
	}
	.tabs {
		// height: 264px;
	}
	.tabs :deep(.v-slide-group) {
		height: 38px;
	}
	.tabs :deep(.v-tabs__items) {
		background: #f5f5f5;
	}
	.tab {
		font-size: 20px;
	}
	.tabs :deep(.v-tab) {
		min-width: 20px !important;
		width: 20px;
	}
	.content {
		overflow: auto;
		background: var(--background);
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