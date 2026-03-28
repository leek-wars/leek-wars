<template lang="html">
	<div class="tabs-wrapper" :class="{active}">
		<div ref="list" class="list" @wheel.prevent="mousewheel">
			<div v-for="(tab, i) in allTabs" ref="tabsEl" :key="tabKey(tab)" class="tab" :class="tabClass(tab, i)" :title="tabTitle(tab)" @click="clickTab(tab)" @contextmenu.prevent="openMenu($event, tab, i)" @mouseup.middle="closeTab(tab)">
				<div class="name">
					<template v-if="tab.type === 'file'">
						<v-icon v-if="fileSystem.ais[tab.id]?.errors" class="icon error">mdi-close-circle</v-icon>
						<v-icon v-else-if="fileSystem.ais[tab.id]?.warnings" class="icon warning">mdi-alert-circle</v-icon>
						<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
						{{ fileSystem.ais[tab.id]?.name || tab.id }}
					</template>
					<template v-else>
						<v-icon class="icon git">{{ tab.type === 'commit' ? 'mdi-source-commit' : 'mdi-source-branch' }}</v-icon>
						{{ tab.file.split('/').pop() }}
						<span v-if="tab.hash" class="commit-hash">{{ tab.hash.substring(0, 7) }}</span>
					</template>
				</div>
				<span @click.stop="closeTab(tab)">
					<v-icon v-if="tab.type === 'file'" class="modified">mdi-record</v-icon>
					<v-icon class="close" :class="{hidden: group === 'tabs' && allTabs.length === 1 && tab.type === 'file'}">mdi-close</v-icon>
				</span>
			</div>
		</div>
		<v-menu v-model="menuOpened" :target="menuTarget" :theme="isDark ? 'dark' : 'light'" @update:model-value="menuChange">
			<v-list class="menu" :dense="true">
				<v-list-item v-ripple @click="closeTab(menuTab)" prepend-icon="mdi-close-box-outline">
					<v-list-item-title>{{ $t('close') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="menuTab" v-ripple @click="closeOthers(menuTab)" prepend-icon="mdi-close-box-multiple-outline">
					<v-list-item-title>{{ $t('close_others') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="menuTab && menuTab.type !== 'file'" v-ripple @click="$emit('open-file', menuTab)" prepend-icon="mdi-file-outline">
					<v-list-item-title>{{ $t('open_file') }}</v-list-item-title>
				</v-list-item>
				<v-list-item v-if="menuTab && menuTab.type === 'file' && !splitted" v-ripple @click="split()" prepend-icon="mdi-dock-right">
					<v-list-item-title>{{ $t('split') }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { mixins } from '@/model/i18n'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import { fileSystem } from '@/model/filesystem'
	import { nextTick } from 'vue'

	export interface FileTab {
		type: 'file'
		id: string
	}
	export interface DiffTab {
		type: 'diff' | 'commit'
		id: string
		folder: string
		file: string
		staged?: boolean
		hash?: string
		original: string
		modified: string
		ready: boolean
	}
	export type EditorTab = FileTab | DiffTab

	@Options({ name: 'editor-tabs', i18n: {}, mixins: [...mixins], emits: ['select', 'close-tab', 'close-all', 'split', 'close-panel', 'open-file'] })
	export default class EditorTabs extends Vue {

		@Prop({required: true}) ais!: AI[]
		@Prop({required: true}) history2!: AI[]
		@Prop({required: true}) group!: string
		@Prop({required: true}) current!: EditorTab | null
		@Prop({required: true}) active!: boolean
		@Prop({required: true}) splitted!: boolean
		@Prop({default: () => []}) allTabs!: EditorTab[]
		@Prop({default: 'leek-wars'}) theme!: string

		get isDark(): boolean {
			return ['monokai', 'vs-dark', 'hc-black'].includes(this.theme)
		}

		fileSystem = fileSystem
		menuOpened: boolean = false
		menuTarget: [number, number] = [0, 0]
		menuTab: EditorTab | null = null

		@Watch('current')
		scrollToCurrent() {
			nextTick(() => {
				if (!this.current) return
				const i = this.allTabs.findIndex(t => this.tabsMatch(t, this.current!))
				if (i !== -1) {
					const tab = (this.$refs.tabsEl as HTMLElement[])?.[i]
					tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
				}
			})
		}

		mousewheel(event: WheelEvent) {
			const target = this.$refs.list as HTMLElement
			const delta = event.deltaY || event.deltaX
			const toLeft  = delta < 0 && target.scrollLeft > 0
			const toRight = delta > 0 && target.scrollLeft < target.scrollWidth - target.clientWidth
			if (toLeft || toRight) {
				target.scrollLeft += delta
			}
		}

		tabKey(tab: EditorTab): string {
			if (tab.type === 'file') return 'f-' + tab.id
			return 'd-' + tab.file + '-' + (tab.hash || (tab.staged ? 's' : 'w'))
		}

		tabClass(tab: EditorTab, i: number): any {
			const selected = this.current && this.tabsMatch(tab, this.current)
			if (tab.type === 'file') {
				return { selected, modified: fileSystem.ais[tab.id]?.modified }
			}
			return { selected, 'diff-tab': true, 'commit-tab': tab.type === 'commit' }
		}

		tabTitle(tab: EditorTab): string {
			if (tab.type === 'file') return fileSystem.ais[tab.id]?.path || ''
			if (tab.hash) return tab.file + ' @ ' + tab.hash.substring(0, 7)
			return tab.file
		}

		tabsMatch(a: EditorTab, b: EditorTab): boolean {
			if (a.type === 'file' && b.type === 'file') return a.id === b.id
			if (a.type !== 'file' && b.type !== 'file') {
				return a.file === b.file && a.folder === b.folder && a.staged === b.staged && a.hash === b.hash
			}
			return false
		}

		clickTab(tab: EditorTab) {
			this.$emit('select', tab)
		}

		openMenu(event: MouseEvent, tab: EditorTab, i: number) {
			this.menuTab = tab
			this.menuTarget = [event.clientX, event.clientY]
			nextTick(() => {
				this.menuOpened = true
			})
		}

		menuChange() {
			this.menuTab = null
			this.menuOpened = false
		}

		closeTab(tab: EditorTab) {
			if (tab.type === 'file' && this.group === 'tabs') {
				const fileTabs = this.allTabs.filter(t => t.type === 'file')
				if (fileTabs.length === 1) return
			}
			if (tab.type === 'file' && fileSystem.ais[tab.id]?.modified) {
				if (!window.confirm(this.$i18n.t('confirm_close', [1]) as string)) {
					return
				}
			}
			this.$emit('close-tab', tab)
		}

		closeOthers(tab: EditorTab) {
			this.$emit('close-all', tab)
		}

		split() {
			this.$emit('split', this.menuTab)
		}
	}
</script>

<style lang="scss" scoped>
	.tabs-wrapper {
		user-select: none;
		overflow: hidden;
		display: flex;
		justify-content: flex-end;
		opacity: 0.75;
		&.active {
			opacity: 1;
		}
	}
	.list {
		height: 36px;
		overflow-y: hidden;
		white-space: nowrap;
		position: relative;
		border-top-left-radius: 4px;
		border-top-right-radius: 4px;
	}
	#app:not(.app) .list {
		&::-webkit-scrollbar {
			width: 0px;
			height: 0px;
		}
	}
	.tab {
		height: 36px;
		border-top: 2px solid transparent;
		box-sizing: border-box;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		max-width: 200px;
		background: rgba(0, 0, 0, 0.2);
		min-width: 120px;
		flex-shrink: 0;
		overflow: hidden;
		color: #f2f2f2;
	}
	.tab:not(:last-child) {
		margin-right: 1px;
	}
	.tab.selected {
		color: var(--text-color);
		background: var(--pure-white);
		.v-icon {
			color: var(--text-color);
		}
	}
	.tab .name {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin-left: 10px;
		margin-right: 4px;
		width: 100%;
		.v-icon {
			font-size: 14px;
			vertical-align: baseline;
			margin-right: 2px;
			transition: none;
			color: #5fad1b;
			&.error {
				color: red
			}
			&.warning {
				color: #ff9100;
			}
		}
	}
	.tab .v-icon {
		color: #eee;
		font-size: 20px;
		margin-right: 6px;
		&.hidden::before {
			opacity: 0;
		}
	}
	.tab:not(.selected) .close {
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
	.tab.diff-tab {
		border-top-color: #e8a838;
		.name .v-icon.icon.git {
			color: #e8a838 !important;
		}
		.commit-hash {
			font-family: monospace;
			font-size: 10px;
			opacity: 0.6;
			margin-left: 4px;
		}
	}
	.tab.diff-tab.commit-tab {
		border-top-color: #7c8eda;
		.name .v-icon.icon.git {
			color: #7c8eda !important;
		}
	}
	.menu .v-icon {
		margin-right: 8px;
	}
</style>
