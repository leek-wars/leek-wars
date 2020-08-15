<template lang="html">
	<div :class="{root: level === 0}" @click="click" @contextmenu.prevent.stop="$root.$emit('editor-menu', folder, false, $event)">
		<div :class="{empty: !folder.items.length, 'dragover': dragOver > 0, expanded: folder.expanded, root: level === 0, selected: folder.selected}" :draggable="level > 0" class="item folder" @dragenter="dragenter" @dragleave="dragleave" @dragover="dragover" @drop="drop" @dragstart="dragstart" @dragend="dragend">
			<div v-if="level != 0" :style="{'padding-left': ((level - 1) * 15 + 10) + 'px'}" class="label" :class="{error: folder.errors, warning: folder.warnings}" @click="toggle(folder)">
				<div class="triangle"></div>
				<v-icon class="icon">mdi-folder-outline</v-icon>
				<span ref="name" class="text">{{ folder.name }}</span>
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
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import EditorAI from './editor-ai.vue'
	import { AIItem, Folder } from './editor-item'
	import { explorer } from './explorer'

	@Component({ name: 'editor-folder', components: { 'editor-ai': EditorAI } })
	export default class EditorFolder extends Vue {
		@Prop() folder!: Folder
		@Prop() level!: number
		dragOver: number = 0
		dragging: boolean = false

		toggle(folder: Folder) {
			explorer.setExpanded(folder, !folder.expanded)
		}
		drop(e: DragEvent) {
			this.$root.$emit('editor-drop', this.folder)
			e.preventDefault()
			e.stopPropagation()
			this.dragOver = 0
			this.dragging = false
			return false
		}
		dragenter(e: DragEvent) {
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
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.dragging = true
			this.$root.$emit('editor-drag', this.folder)
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
		color: #333;
		display: block;
	}
	.root {
		height: calc(100% - 2px);
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
	}
	.item.selected > .label {
		background: #ddd;
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
		background: white;
	}
	.item.selected > .label:before {
		color: white;
	}
	.triangle {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-left: 6px solid #666;
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