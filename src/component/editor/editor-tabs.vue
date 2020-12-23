<template lang="html">
	<div v-show="tabs.length" class="tabs-wrapper">
		<div ref="list" class="list" @wheel.prevent="mousewheel">
			<div v-for="(ai, i) in tabs" ref="tabs" :key="ai.id" :class="{selected: ai.selected, modified: ai.modified}" :title="ai.path" class="tab" @click="click($event, ai)" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(ai)">
				<div class="name">
					<v-icon v-if="ai.errors" class="icon error">mdi-close-circle</v-icon>
					<v-icon v-else-if="ai.warnings" class="icon warning">mdi-alert-circle</v-icon>
					<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
					{{ ai.name }}
				</div>
				<span @click.stop="close(ai)">
					<v-icon class="modified">mdi-record</v-icon>
					<v-icon class="close" :class="{hidden: tabs.length === 1}">mdi-close</v-icon>
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
		loaded: boolean = false
		tabs: AI[] = []
		menu: boolean = false
		activator: any = null
		currentI: number = 0
		currentAI: AI | null = null

		@Watch('ais', {immediate: true})
		updateAis() {
			if (this.loaded) { return }
			this.loaded = true
			const tabs = JSON.parse(localStorage.getItem('editor/tabs') || '[]')
			for (const t of tabs) {
				if (t in this.ais) {
					const ai_id = parseInt(t, 10)
					if (ai_id > 0) {
						this.tabs.push(this.ais[t])
					}
				}
			}
			if (tabs.length === 0) {
				if (this.$route.params.id in this.ais) {
					const ai_id = parseInt(this.$route.params.id, 10)
					if (ai_id > 0) {
						this.tabs.push(this.ais[ai_id])
					}
				}
			}
			this.update()
		}

		@Watch('$route.params')
		update() {
			Vue.nextTick(() => {
				const list = (this.$refs.list as HTMLElement)
				for (let i = 0; i < this.tabs.length; ++i) {
					if (this.tabs[i].selected) {
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
			if (this.tabs.findIndex(t => t === ai) !== -1) {
				return
			}
			this.tabs.push(ai)
			this.save()
		}

		click(e: MouseEvent, ai: AI) {
			if (this.$route.path !== '/editor/' + ai.id) {
				this.$router.push('/editor/' + ai.id)
			}
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

		close(ai: AI, confirm: boolean = true) {
			if (this.tabs.length === 1) { return }
			const i = this.tabs.indexOf(ai)
			if (confirm && ai.modified) {
				if (!window.confirm(this.$i18n.t('confirm_close', [1]) as string)) {
					return
				}
			}
			this.tabs.splice(i, 1)
			this.save()
			if (ai.selected) {
				this.openOther(i)
			}
			this.currentI = -1
			this.$emit('close', ai)
		}

		closeOthers(ai: AI) {
			this.tabs = []
			this.$emit('close-all')
			this.tabs.push(ai)
			this.save()
			if (this.$route.path !== '/editor/' + ai.id) {
				this.$router.push('/editor/' + ai.id)
			}
		}

		openOther(i: number) {
			const ai = this.tabs[Math.max(0, i - 1)]
			if (this.$route.path !== '/editor/' + ai.id) {
				this.$router.push('/editor/' + ai.id)
			}
		}

		save() {
			localStorage.setItem('editor/tabs', JSON.stringify(this.tabs.map(ai => ai.id)))
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
		.v-icon {
			font-size: 14px;
			vertical-align: baseline;
			margin-right: 2px;
			transition: none;
		}
		.v-icon {
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