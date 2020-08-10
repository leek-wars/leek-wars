<template lang="html">
	<div v-show="tabs.length" class="tabs-wrapper">
		<div ref="list" class="list" @wheel.prevent="mousewheel">
			<div v-for="(ai, i) in tabs" ref="tabs" :key="ai.id" :class="{selected: ai.id in ais && ais[ai.id].selected, modified: ai.id in ais && ais[ai.id].modified, single: tabs.length === 1}" :title="ai.path" class="tab" @click="click($event, ai)" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(ai)">
				<div v-if="ai.id in ais" class="name" :class="{error: ais[ai.id].errors, warning: ais[ai.id].warnings}">
					{{ ais[ai.id].name }}
				</div>
				<span v-if="tabs.length > 1" @click.stop="close(ai)">
					<v-icon class="modified">mdi-record</v-icon>
					<v-icon class="close">mdi-close</v-icon>
				</span>
			</div>
		</div>
		<v-menu ref="menu" :key="currentI" v-model="menu" :activator="activator" offset-y @input="menuChange()">
			<v-list class="menu" :dense="true">
				<v-list-item v-ripple @click="close(currentAI)">
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
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { i18n, mixins } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

	@Component({ name: 'editor-tabs', i18n: {}, mixins })
	export default class EditorTabs extends Vue {
		@Prop({required: true}) ais!: AI[]
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

		@Watch('$route.params')
		update() {
			Vue.nextTick(() => {
				const list = (this.$refs.list as HTMLElement)
				for (let i = 0; i < this.tabs.length; ++i) {
					if (this.ais[this.tabs[i].id].selected) {
						const tab = (this.$refs.tabs as HTMLElement[])[i]
						if (tab.offsetLeft < list.scrollLeft) {
							list.scrollLeft = tab.offsetLeft
						} else if (tab.offsetLeft + tab.clientWidth - list.scrollLeft > list.clientWidth) {
							list.scrollLeft = tab.offsetLeft + tab.clientWidth - list.clientWidth
						}
						return
					}
				}
			})
		}

		mousewheel(event: MouseWheelEvent) {
			const target = this.$refs.list as HTMLElement
			const delta = event.deltaY || event.deltaX
			const toLeft  = delta < 0 && target.scrollLeft > 0
			const toRight = delta > 0 && target.scrollLeft < target.scrollWidth - target.clientWidth
			if (toLeft || toRight) {
				target.scrollLeft += delta
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
			this.currentI = -1
			this.activator = null
			this.menu = false
		}

		close(ai: AI) {
			const i = this.tabs.indexOf(ai)
			const realAI = this.ais[ai.id]
			if (realAI.modified) {
				if (!window.confirm(this.$i18n.t('confirm_close', [1]) as string)) {
					return
				}
			}
			this.tabs.splice(i, 1)
			this.save()
			if (realAI.selected) {
				this.openOther(i)
			}
			this.currentI = -1
		}

		closeOthers(ai: AI) {
			this.tabs = []
			this.tabs.push(ai)
			this.save()
			this.$router.push('/editor/' + ai.id)
		}

		closeById(id: number) {
			this.tabs = this.tabs.filter(ai => ai.id !== id)
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
		flex: 36px 1 0;
		user-select: none;
		overflow: hidden;
		display: flex;
		justify-content: flex-end;
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
		background: rgba(0, 0, 0, 0.3);
		min-width: 0;
		min-width: 100px;
		flex-shrink: 0;
		overflow: hidden;
		color: #eee;
	}
	.tab:not(:last-child) {
		margin-right: 1px;
	}
	.tab.selected {
		background: white;
		color: #333;
	}
	.tab .name {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		margin-left: 10px;
		margin-right: 4px;
		width: 100%;
		&.error {
			color: red
		}
		&.warning {
			color: #ff6600;
		}
	}
	.tab.single .name {
		margin-left: 15px;
		margin-right: 15px;
	}
	.tab.selected .name:not(.error):not(.warning) {
		color: black;
	}
	.tab .v-icon {
		font-size: 20px;
		margin-right: 6px;
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