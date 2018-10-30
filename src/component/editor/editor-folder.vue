<template lang="html">
	<router-link :to="'/editor/' + folder.id">
		<div :class="{empty: !folder.items.length, 'dragover': dragOver > 0, expanded: folder.expanded, root: level === 0}" class="item folder" draggable="true" @dragenter="dragenter" @dragleave="dragleave" @dragover="dragover" @drop="drop" @dragstart="dragstart">
			<div v-if="level != 0" :style="{'padding-left': ((level - 1) * 20 + 10) + 'px'}" class="label" @click="toggle(folder)">
				<div class="triangle"></div>
				<span class="icon"></span>
				<span ref="name" :contenteditable="editing" class="text" @keydown.enter="enter" @blur="blur">{{ folder.name }}</span>
				<div class="edit" @click="edit"></div>
			</div>
			<div v-if="folder.expanded" class="content">
				<template v-for="(item, i) in folder.items">
					<editor-folder v-if="item.folder" :key="i" :folder="item" :level="level + 1" />
					<editor-ai v-else :item="item" :key="i" :level="level" />
				</template>
			</div>
		</div>
	</router-link>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import EditorAI from './editor-ai.vue'
	import { Folder } from './editor-item'

	@Component({ name: 'editor-folder', components: { 'editor-ai': EditorAI } })
	export default class EditorFolder extends Vue {
		@Prop() folder!: Folder
		@Prop() level!: number
		editing: boolean = false
		initialName: string = ''
		dragOver: number = 0

		toggle(folder: Folder) {
			folder.expanded = !folder.expanded
			localStorage.setItem('editor/folder/' + folder.id, '' + folder.expanded)
		}
		edit(e: Event) {
			this.editing = true
			this.initialName = this.folder.name
			setTimeout(() => {
				(this.$refs.name as HTMLElement).focus()
				LeekWars.set_cursor_position(this.$refs.name, this.folder.name.length)
			})
			e.preventDefault()
		}
		enter(e: Event) {
			(this.$refs.name as HTMLElement).blur()
			e.preventDefault()
		}
		blur() {
			this.save()
		}
		save() {
			this.editing = false
			const name = (this.$refs.name as HTMLElement).textContent || ''
			if (name !== this.folder.name) {
				LeekWars.post('ai-folder/rename', {folder_id: this.folder.id, new_name: name}).then((data) => {
					if (data.data.success) {
						LeekWars.toast(i18n.t('editor.ai_renamed', [name]) as string)
						this.folder.name = name
					} else {
						(this.$refs.name as HTMLElement).textContent = this.initialName
						LeekWars.toast(data.data.error)
					}
				})
			}
		}
		drop(e: DragEvent) {
			this.$root.$emit('editor-drop', this.folder)
			e.preventDefault()
			e.stopPropagation()
			this.dragOver = 0
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
			e.dataTransfer.setData('text/plain', 'drag !!!')
			this.$root.$emit('editor-drag', this.folder)
			e.stopPropagation()
		}
	}
</script>

<style lang="scss" scoped>
	.item {
		cursor: pointer;
		color: #555;
		display: block;
	}
	.root {
		height: calc(100% - 2px);
	}
	.item .label {
		padding: 5px 10px;
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
	.item .edit {
		background-image: url("/image/edit_pen.png");
		background-size: cover;
		width: 12px;
		height: 12px;
		margin-left: 5px;
		display: none;
	}
	.item.folder .icon {
		display: inline-block;
		background-image: url("/image/folder.png");
		background-size: cover;
		width: 13px;
		height: 10px;
		margin-right: 5px;
	}
	.router-link-active > .item > .label > .icon {
		background-image: url("/image/folder_white.png");
	}
	.label:hover .edit {
		display: inline-block;
	}
	.item .text[contenteditable="true"] {
		background: white;
		color: black;
		padding: 0 5px;
	}
	.router-link-active > .item > .label:before {
		color: white;
	}
	.triangle {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-left: 6px solid #aaa;
		display: inline-block;
		margin-left: -5px;
		margin-right: 5px;
		margin-top: 1px;
	}
	.router-link-active > .item > .label > .triangle {
		border-left: 6px solid white;
	}
	.folder.expanded > .label > .triangle {
		transform: rotate(90deg);
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
</style>