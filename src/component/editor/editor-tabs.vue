<template lang="html">
	<div v-show="tabs.length > 1" class="tabs-wrapper">
		<div class="tabs">
			<div v-for="(ai, i) in tabs" ref="tabs" :key="ai.id" :class="{selected: ai.id in ais && ais[ai.id].selected, modified: ai.modified}" :title="ai.path" class="tab" @click="click($event, ai)" @contextmenu.prevent="openMenu(i)" @mouseup.middle="close(ai)">
				<div v-if="ai.id in ais" class="name">
					{{ ais[ai.id].name }}
				</div>
				<span @click.stop="close(ai)">
					<v-icon class="modified">mdi-record</v-icon>
					<v-icon class="close">mdi-close</v-icon>
				</span>
			</div>
		</div>
		<v-menu ref="menu" :key="activator" v-model="menu" :activator="activator" offset-y @input="menuChange()">
			<v-list class="menu" :dense="true">
				<v-list-item v-ripple @click="close(currentAI)">
					<v-icon>mdi-close-circle-outline</v-icon>
					<v-list-item-content>
						<v-list-item-title>{{ $t('close') }}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
				<v-list-item v-ripple @click="closeOthers(currentAI)">
					<v-icon>mdi-close-circle-outline</v-icon>
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
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'editor-tabs' })
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
			this.menu = false
		}

		close(ai: AI) {
			const i = this.tabs.indexOf(ai)
			this.tabs.splice(i, 1)
			this.save()
			if (this.ais[ai.id].selected) {
				this.openOther(i)
			}
		}

		closeOthers(ai: AI) {
			this.tabs = []
			this.tabs.push(ai)
			this.save()
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
		flex: 35px 0 0;
		user-select: none;
	}
	.tabs {
		height: 35px;
		display: flex;
	}
	.tab {
		line-height: 35px;
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