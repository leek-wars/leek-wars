<template lang="html">
	<div class="tabs-wrapper" v-show="tabs.length > 1">
		<div class="tabs">
			<div v-for="(ai, i) in tabs" ref="tabs" class="tab" :class="{selected: current == ai.id, modified: ai.modified}" @click="click($event, ai)" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(i)" :title="ai.path" v-ripple>
				<div class="name">
					{{ ai.name }}
				</div>
				<!-- <i @click.stop="close(i)" class="material-icons">
					<span class="modified">fiber_manual_record</span>
					<span class="close">close</span>
				</i> -->
			</div>
		</div>
		<v-menu ref="menu" :activator="activator" v-model="menu" offset-y @input="menuChange()">
			<v-list :dense="true">
				<v-list-tile v-ripple @click="close(currentI)">
					<i class="material-icons">close</i>
					<v-list-tile-content>
						<v-list-tile-title>{{ $t('editor.close') }}</v-list-tile-title>
					</v-list-tile-content>
				</v-list-tile>
				<v-list-tile v-ripple @click="closeOthers(currentAI)">
					<i class="material-icons">close</i>
					<v-list-tile-content>
						<v-list-tile-title>{{ $t('editor.close_others') }}</v-list-tile-title>
					</v-list-tile-content>
				</v-list-tile>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { AI } from '@/model/ai'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'editor-tabs' })
	export default class EditorTabs extends Vue {
		@Prop({required: true}) current!: number
		tabs: AI[] = []
		menu: boolean = false
		activator: any = null
		currentI: number = 0
		currentAI: AI = null

		add(ai: AI) {
			if (this.tabs.indexOf(ai) != -1) {
				return
			}
			this.tabs.push(ai)
		}
		click(e: MouseEvent, ai: AI) {
			this.$router.push('/editor/' + ai.id)
		}
		openMenu(i: number) {
			this.currentI = i
			this.currentAI = this.tabs[i]
			this.$nextTick(() => {
				this.activator = this.$refs.tabs[i]
				this.$nextTick(() => {
					this.menu = true
				})
			})
		}
		menuChange(e: any) {
			this.activator = null
		}
		close(i: number) {
			this.tabs.splice(i, 1)
		}
		closeOthers(ai: AI) {
			this.tabs = []
			this.tabs.push(ai)
		}
	}
</script>

<style lang="scss" scoped>
	.tabs-wrapper {
		flex: 30px 0 0;
		user-select: none;
	}
	.tabs {
		height: 30px;
		display: flex;
		background: #444;
	}
	.tab {
		line-height: 30px;
		cursor: pointer;
		display: flex;
		align-items: center;
		max-width: 200px;
		background: #ddd;
		min-width: 0;
	}
	.tab:not(:last-child) {
		margin-right: 1px;
	}
	.tab:first-child {
		border-top-left-radius: 4px;
	}
	.tab:last-child {
		border-top-right-radius: 4px;
	}
	.tab.selected {
		background: white;
	}
	.tab .name {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin: 0 8px;
	}
	.tab.selected .name {
		color: black;
	}
	.tab i {
		font-size: 20px;
	}
	.tab .close {
		opacity: 0;
	}
	.tab:hover .close {
		opacity: 1;
		display: block;
	}
	.tab .modified {
		display: none;
	}
	.tab.modified {
		.modified {
			display: block;
		}
		.close {
			display: none;
		}
	}
	.tab.modified:hover {
		.modified {
			display: none;
		}
	}
	.tab.modified:hover .close {
		display: block;
	}
</style>