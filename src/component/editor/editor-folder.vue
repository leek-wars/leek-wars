<template lang="html">
	<div :class="{root: folder.id === 0}" @click="click" @contextmenu.prevent.stop="$root.$emit('editor-menu', folder, false, $event)">
		<div :class="{empty: !folder.items.length, 'dragover': dragOver > 0, expanded: folder.expanded, root: level === 0, selected: folder.selected}" :draggable="level > 0 && folder.id !== -1" class="item folder" @dragenter="dragenter" @dragleave="dragleave" @dragover="dragover" @drop="drop" @dragstart="dragstart" @dragend="dragend">
			<div v-if="folder.id != 0" :style="{'padding-left': ((level - 1) * 15 + 10) + 'px'}" class="label" :class="{error: folder.errors, warning: folder.warnings, closed: folder.closed}" @click="toggle(folder)">
				<div class="triangle"></div>
				<!-- <v-icon v-if="folder.id === -1" class="icon">mdi-delete-outline</v-icon> -->
				<v-icon class="icon" v-if="folder.closed">mdi-folder-lock-outline</v-icon>
				<v-icon class="icon" v-else="folder.closed">mdi-folder-outline</v-icon>
				<span v-if="folder.id === -1" ref="name" class="text">{{ $parent.$t(folder.name) }}
					<span v-if="folder.id === -1">({{ folder.items.length }})</span>
				</span>
				<span v-else ref="name" class="text">{{ folder.name }}</span>
				<span v-if="folder.errors" class="count error">{{ folder.errors }}</span>
				<span v-if="folder.warnings" class="count warning">{{ folder.warnings }}</span>
				<span v-if="folder.todos" class="count todo">{{ folder.todos }}</span>
			</div>
			<div v-if="folder.expanded" :class="{dragging: dragging}" class="content">
				<template v-for="(item, i) in folder.items">
					<editor-folder v-if="item.folder" :key="i" :folder="item" :level="level + 1" />
					<editor-ai v-else :key="i" :item="item" :level="level" />
				</template>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { AI } from '@/model/ai'
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Options, Prop, Vue, Watch } from 'vue-property-decorator'
	import EditorAI from './editor-ai.vue'
	import { AIItem, Folder } from './editor-item'
	import { explorer } from './explorer'

	@Options({ name: 'editor-folder', components: { 'editor-ai': EditorAI } })
	export default class EditorFolder extends Vue {
		@Prop() folder!: Folder
		@Prop() level!: number
		dragOver: number = 0
		dragging: boolean = false

		toggle(folder: Folder) {
			if (!folder.closed) {
				explorer.setExpanded(folder, !folder.expanded)
			}
		}
		drop(e: DragEvent) {
			if (this.folder.id === -1) { return }
			emitter.emit('editor-drop', this.folder)
			e.preventDefault()
			e.stopPropagation()
			this.dragOver = 0
			this.dragging = false
			return false
		}
		dragenter(e: DragEvent) {
			if (this.folder.id === -1) { return }
			this.dragOver++
			e.stopPropagation()
		}
		dragleave(e: DragEvent) {
			this.dragOver--
			e.stopPropagation()
		}
		dragover(e: DragEvent) {
			e.preventDefault()
			e.stopPropagation()
		}
		dragstart(e: DragEvent) {
			if (this.folder.id === -1) { return }
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.dragging = true
			emitter.emit('editor-drag', this.folder)
			e.stopPropagation()
		}
		dragend() {
			this.dragging = false
		}
		click(e: Event) {
			if (this.$router.currentRoute.path !== '/editor/' + this.folder.id) {
				this.$router.push('/editor/' + this.folder.id)
			}
			e.stopPropagation()
		}
	}
</script>

<style lang="scss" scoped>
	.item {
		cursor: pointer;
		display: block;
	}
	.root {
		flex: 1;
		.item {
			height: 100%;
		}
	}
	.item .label {
		padding: 7px 10px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		&.warning {
			color: #ff9100;
		}
		&.error {
			color: red;
		}
		&.closed {
			opacity: 0.5;
			.triangle {
				opacity: 0;
			}
		}
	}
	.item.selected > .label {
		background: var(--background-header);
	}
	#app.app .item .label {
		padding: 8px 10px;
	}
	.item.ai .label:before {
		content: "✔";
		font-weight: bold;
		color: #5fad1b;
		padding-right: 5px;
	}
	.item .label:hover {
		background: var(--pure-white);
	}
	.v-icon {
		color: var(--text-color);
	}
	.triangle {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-left: 6px solid var(--text-color);
		display: inline-block;
		margin-left: -5px;
		margin-right: 5px;
		margin-top: 1px;
	}
	.folder.expanded > .label > .triangle {
		transform: rotate(90deg);
	}
	.dragging {
		pointer-events: none;
	}
	.folder.dragover {
		border: 1px dashed #777;
		background: #ddd;
	}
	.folder.dragover > .label {
		margin-top: -1px;
		font-weight: bold;
		margin-left: -1px;
		margin-right: -1px;
	}
	.folder.expanded.dragover > .content {
		margin-bottom: -1px;
	}
	.folder.root.dragover > .content {
		margin-top: -1px;
	}
	.folder:not(.expanded).dragover > .label {
		margin-bottom: -1px;
	}
	.folder.dragover > .content {
		margin-left: -1px;
		margin-right: 1px;
	}
	.folder.empty .triangle {
		opacity: 0;
	}
	.icon {
		font-size: 17px;
		margin-right: 4px;
		vertical-align: top;
	}
	.count {
		border-radius: 10px;
		color: #333;
		padding: 1px 4px;
		font-size: 13px;
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
	}
</style>