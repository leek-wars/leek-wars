<template lang="html">
	<div>
		<div ref="ai" :class="{modified: ai.modified, selected: ai.selected}" class="item ai" @click="click" @contextmenu.prevent.stop="emitter.emit('editor-menu', { item: ai, ai: true, e: $event })">
			<div :style="{'padding-left': (level * 15 + 15) + 'px'}" class="label" :class="{error: ai.errors, warning: ai.warnings}" :draggable="!inBin" @dragstart="dragstart">
				<v-icon v-if="ai.errors" class="icon error">mdi-close-circle</v-icon>
				<v-icon v-else-if="ai.warnings" class="icon warning">mdi-alert-circle</v-icon>
				<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
				<span class="text" :class="gitStatusClass">{{ ai.name }}</span>
				<span v-if="ai.errors" class="count error">{{ ai.errors }}</span>
				<span v-if="ai.warnings" class="count warning">{{ ai.warnings }}</span>
				<span v-if="ai.todos" class="count todo">{{ ai.todos }}</span>
				<v-tooltip v-if="leeks.length">
					<template #activator="{ props }">
						<span v-if="leeks" v-bind="props" class="count leek">
							<img src="/image/icon/black/leek.png">
							{{ leeks.length }}
						</span>
					</template>
					{{ leeks.join(', ') }}
				</v-tooltip>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { fileSystem } from '@/model/filesystem'
	import { store } from '@/model/store'
	import { Options, Prop, Vue } from 'vue-property-decorator'
	import { AIItem } from './editor-item'
	import { emitter } from '@/model/vue'

	@Options({ name: 'editor-ai' })
	export default class EditorAI extends Vue {
		@Prop({required: true}) item!: AIItem
		@Prop({required: true}) level!: number
		emitter = emitter

		get ai() { return this.item.ai }

		get leeks() {
			const aiKey = this.ai.path
			return Object.entries(fileSystem.leekAIs)
				.filter(entry => entry[1] === aiKey)
				.map(entry => store.state.farmer!.leeks[parseInt(entry[0])].name)
		}

		get inBin() { return fileSystem.isInBin(this.ai.folder) }

		get gitStatusClass(): string {
			if (!this.ai.folderpath) return ''
			const path = this.ai.folderpath + this.ai.name
			const status = fileSystem.gitStatus[path]
			if (!status) return ''
			if (status === 'C') return 'git-conflict'
			if (status === 'M') return 'git-modified'
			if (status === 'A' || status === 'U') return 'git-added'
			if (status === 'D') return 'git-deleted'
			return 'git-modified'
		}

		dragstart(e: DragEvent) {
			if (this.inBin) { e.stopPropagation(); return }
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			emitter.emit('editor-drag', this.item)
			e.stopPropagation()
		}
		click(e: Event) {
			this.$router.push('/editor/' + this.ai.path)
			e.stopPropagation()
		}
	}
</script>

<style lang="scss" scoped>
	.item {
		cursor: pointer;
	}
	.item.dragging {
		opacity: 1;
	}
	.item .label {
		padding: 5px 10px;
		font-size: 14px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		&.warning {
			color: #ff9100;
		}
		&.error {
			color: red;
		}
	}
	#app.app .item .label {
		padding: 8px 10px;
	}
	.item.selected > .label {
		background: var(--background-header);
	}
	.item .label:hover {
		background: var(--pure-white);
	}
	.item.modified .label .text {
		font-style: italic;
	}
	.item .v2 {
		font-weight: bold;
		color: #00aae2;
		padding-left: 5px;
		display: inline-block;
	}
	.icon {
		font-size: 17px;
		margin-right: 4px;
		vertical-align: top;
		&.valid {
			color: #5fad1b;
		}
		&.error {
			color: red;
		}
		&.warning {
			color: #ff9100;
		}
	}
	.count {
		border-radius: 10px;
		padding: 1px 6px;
		font-size: 12px;
		margin-left: 6px;
		font-weight: 500;
		&.error {
			color: red;
			border: 1px solid red;
		}
		&.warning {
			color: #ff9100;
			border: 1px solid #ff9100;
		}
		&.todo {
			color: #0099ff;
			border: 1px solid #0099ff;
		}
		&.leek {
			border: 1px solid var(--text-color);
			img {
				height: 12px;
			}
		}
	}
	.theme-monokai .count.leek img {
		filter: invert(1);
	}
	.git-modified {
		color: #e8a838 !important;
	}
	.git-added {
		color: #73c991 !important;
	}
	.git-deleted {
		color: #e06c75 !important;
		text-decoration: line-through;
	}
	.git-conflict {
		color: #e06c75 !important;
		font-weight: bold;
	}
</style>