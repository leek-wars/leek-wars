<template lang="html">
	<div v-show="tabs.length > 1" class="tabs-wrapper">
		<div class="tabs">
			<div v-for="(ai, i) in tabs" ref="tabs" :key="ai.id" :class="{selected: current == ai.id, modified: ai.modified}" :title="ai.path" class="tab" @click="click($event, ai)" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(i)">
				<div class="name">
					{{ ai.name }}
				</div>
				<i class="material-icons" @click.stop="close(i)">
					<span class="modified">fiber_manual_record</span>
					<span class="close">close</span>
				</i>
			</div>
		</div>
		<v-menu ref="menu" :activator="activator" v-model="menu" offset-y lazy @input="menuChange()">
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
	import { AI } from '@/model/ai'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'editor-tabs' })
	export default class EditorTabs extends Vue {
		@Prop({required: true}) current!: number
		tabs: AI[] = []
		menu: boolean = false
		activator: any = null
		currentI: number = 0
		currentAI: AI | null = null
		mounted() {
			const tabs = JSON.parse(localStorage.getItem('editor/tabs') || '[]')
			for (const t of tabs) {
				this.tabs.push(t)
			}
		}
		add(ai: AI) {
			if (this.tabs.findIndex(t => t.id === ai.id) !== -1) {
				return
			}
			this.tabs.push(ai)
			this.save()
		}
		click(e: MouseEvent, ai: AI) {
			this.$router.push('/editor/' + ai.id)
		}
		openMenu(i: number) {
			this.currentI = i
			this.currentAI = this.tabs[i]
			this.$nextTick(() => {
				this.activator = (this.$refs.tabs as Vue[])[i]
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
			this.save()
			this.openOther(i)
		}
		closeOthers(ai: AI) {
			this.tabs = []
			this.tabs.push(ai)
			this.save()
		}
		openOther(i: number) {
			const ai = this.tabs[Math.max(0, i - 1)]
			this.$router.push('/editor/' + ai.id)
		}
		save() {
			localStorage.setItem('editor/tabs', JSON.stringify(this.tabs.map(ai => ({id: ai.id, name: ai.name}))))
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
		flex-basis: 150px;
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
		margin-left: 10px;
		margin-right: 3px;
		width: 100%;
	}
	.tab.selected .name {
		color: black;
	}
	.tab i {
		font-size: 20px;
		margin-right: 6px;
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