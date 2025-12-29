<template lang="html">
	<div class="tabs-wrapper" :class="{active}">
		<div ref="list" class="list" @wheel.prevent="mousewheel">
			<div v-for="(ai, i) in tabs" ref="tabs" :key="ai" :class="{selected: ai === current, modified: fileSystem.ais[ai]?.modified}" :title="fileSystem.ais[ai]?.path" class="tab" @click="click($event, fileSystem.ais[ai])" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(ai)">
				<div class="name">
					<v-icon v-if="fileSystem.ais[ai]?.errors" class="icon error">mdi-close-circle</v-icon>
					<v-icon v-else-if="fileSystem.ais[ai]?.warnings" class="icon warning">mdi-alert-circle</v-icon>
					<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
					{{ fileSystem.ais[ai]?.name || ai }}
				</div>
				<span @click.stop="close(ai)">
					<v-icon class="modified">mdi-record</v-icon>
					<v-icon class="close" :class="{hidden: group === 'tabs' && tabs.length === 1}">mdi-close</v-icon>
				</span>
			</div>
		</div>
		<v-menu ref="menu" :key="currentI" v-model="menu" :activator="activator" offset-y @input="menuChange">
			<v-list class="menu" :dense="true">
				<v-list-item v-ripple @click="close(tabs[currentI])">
					<v-icon>mdi-close-box-outline</v-icon>
					<v-list-item-content>
						<v-list-item-title>{{ $t('close') }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
				<v-list-item v-ripple @click="closeOthers(currentAI)">
					<v-icon>mdi-close-box-multiple-outline</v-icon>
					<v-list-item-content>
						<v-list-item-title>{{ $t('close_others') }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
				<v-list-item v-if="!splitted" v-ripple @click="split()">
					<v-icon>mdi-dock-right</v-icon>
					<v-list-item-content>
						<v-list-item-title>{{ $t('split') }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { mixins } from '@/model/i18n'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { fileSystem } from '@/model/filesystem'

	class Tab {
		public id!: number
		public ai!: AI
	}

	@Component({ name: 'editor-tabs', i18n: {}, mixins: [...mixins] })
	export default class EditorTabs extends Vue {

		@Prop({required: true}) ais!: AI[]
		@Prop({required: true}) history2!: AI[]
		@Prop({required: true}) group!: string
		@Prop({required: true}) current!: number
		@Prop({required: true}) active!: boolean
		@Prop({required: true}) splitted!: boolean

		fileSystem = fileSystem
		loaded: boolean = false
		tabs: number[] = []
		menu: boolean = false
		activator: any = null
		currentI: number = 0
		currentAI: AI | null = null

		@Watch('ais', {immediate: true})
		updateAis() {
			if (this.loaded) { return }
			this.loaded = true
			const tabs = JSON.parse(localStorage.getItem('editor/' + this.group) || '[]')
			// console.log("update tabs", tabs, Object.values(this.ais).length)
			for (const t of tabs) {
				this.tabs.push(parseInt(t))
			}
			if (tabs.length === 0 && this.current) {
				this.tabs.push(this.current)
			}
			this.update()
		}

		@Watch('$route.params')
		update() {
			Vue.nextTick(() => {
				const list = (this.$refs.list as HTMLElement)
				for (let i = 0; i < this.tabs.length; ++i) {
					if (this.tabs[i] === this.current) {
						const tab = (this.$refs.tabs as HTMLElement[])[i]
						if (tab && tab.offsetLeft < list.scrollLeft) {
							list.scrollLeft = tab.offsetLeft
						} else if (tab && tab.offsetLeft + tab.clientWidth - list.scrollLeft > list.clientWidth) {
							list.scrollLeft = tab.offsetLeft + tab.clientWidth - list.clientWidth
						}
						return
					}
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

		add(ai: number) {
			if (this.tabs.findIndex(t => t === ai) !== -1) {
				return
			}
			this.tabs.push(ai)
			this.save()
		}

		click(e: MouseEvent, ai: AI) {
			if (!ai) return // AI was deleted
			if (this.group === 'tabs') {
				if (this.$route.path !== '/editor/' + ai.id) {
					this.$router.push('/editor/' + ai.id)
				}
			}
			this.$emit('open', ai.id)
		}

		openMenu(i: number) {
			this.currentI = i
			this.currentAI = fileSystem.ais[this.tabs[i]]
			this.$nextTick(() => {
				this.activator = (this.$refs.tabs as Vue[])[i]
				this.$nextTick(() => {
					this.menu = true
				})
			})
		}

		menuChange() {
			this.currentI = -1
			this.activator = null
			this.menu = false
		}

		close(id: number, confirm: boolean = true) {
			if (this.group === 'tabs' && this.tabs.length === 1) {
				return
			}
			const i = this.tabs.indexOf(id)
			if (confirm && fileSystem.ais[id]?.modified) {
				if (!window.confirm(this.$i18n.t('confirm_close', [1]) as string)) {
					return
				}
			}
			this.tabs.splice(i, 1)
			this.save()
			if (fileSystem.ais[id]?.selected) {
				this.openLast()
			}
			this.currentI = -1
			this.$emit('close', id)
			if (this.tabs.length === 0) {
				this.$emit('close-panel')
			}
		}

		closeOthers(ai: AI) {
			this.tabs = []
			this.$emit('close-all')
			this.tabs.push(ai.id)
			this.save()
			if (this.$route.path !== '/editor/' + ai.id) {
				this.$router.push('/editor/' + ai.id)
			}
		}

		openLast() {
			if (this.history2.length >= 2) {
				const ai = this.history2[1]
				this.$router.push('/editor/' + ai.id)
			} else if (this.history2.length) {
				const ai = this.history2[0]
				this.$router.push('/editor/' + ai.id)
			}
		}

		save() {
			localStorage.setItem('editor/' + this.group, JSON.stringify(this.tabs))
		}

		split() {
			this.$emit('split', this.currentAI)
		}
	}
</script>

<style lang="scss" scoped>
	.tabs-wrapper {
		// flex: 36px 1 0;
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
		line-height: 35px;
		height: 36px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		max-width: 200px;
		background: rgba(0, 0, 0, 0.2);
		min-width: 0;
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
	.menu .v-icon {
		margin-right: 8px;
	}
</style>