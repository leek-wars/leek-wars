<template lang="html">
	<div :class="{error: !ai.valid, modified: ai.modified, selected: selected}" class="item ai" @click="click">
		<div :style="{'padding-left': (level * 20 + 17) + 'px'}" class="label" draggable="true" @dragstart="dragstart">
			<span ref="name" :contenteditable="editing" class="text" @keydown.enter="enter" @blur="blur">{{ ai.name }}</span>
			<tooltip v-if="ai.v2">
				<template v-slot:activator="{ on }">
					<span class="v2" v-on="on">V2</span>
				</template>
				{{ $t('editor.v2_beta_message') }}
			</tooltip>
			<div class="edit" @click="edit"></div>
		</div>
	</div>
</template>

<script lang="ts">
	import { i18n } from '@/model/i18n'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import { AIItem, Folder } from './editor-item'

	@Component({ name: 'editor-ai' })
	export default class EditorAI extends Vue {
		@Prop({required: true}) item!: AIItem
		@Prop({required: true}) level!: number
		editing: boolean = false
		initialName: string = ''
		selected: boolean = false
		get ai() { return this.item.ai }

		edit(e: Event) {
			this.editing = true
			this.initialName = this.ai.name
			setTimeout(() => {
				(this.$refs.name as HTMLElement).focus()
				LeekWars.set_cursor_position(this.$refs.name, this.ai.name.length)
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
			if (name !== this.ai.name) {
				LeekWars.post('ai/rename', {ai_id: this.ai.id, new_name: name}).then(data => {
					LeekWars.toast(i18n.t('ai_renamed', [name]) as string)
					this.ai.name = name
				}).error(error => {
					(this.$refs.name as HTMLElement).textContent = this.initialName
					LeekWars.toast(error)
				})
			}
		}
		dragstart(e: DragEvent) {
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.$root.$emit('editor-drag', this.item)
			e.stopPropagation()
		}
		click(e: Event) {
			this.$router.push('/editor/' + this.ai.id)
			this.$root.$emit('editor-select', this)
			this.selected = true
			e.stopPropagation()
		}
	}
</script>

<style lang="scss" scoped>
	.item {
		cursor: pointer;
		color: #555;
	}
	.item.dragging {
		opacity: 1;
	}
	.item .label {
		padding: 5px 10px;
		white-space: nowrap;
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
	.item .label:hover {
		background: white;
		color: black;
	}
	.label:hover .edit {
		display: inline-block;
	}
	.item .text[contenteditable="true"] {
		background: white;
		color: black;
		padding: 0 5px;
	}
	.item.selected > .label {
		background: #cacaca;
		color: black;
	}
	.item.modified .label {
		color: red;
	}
	.item.error .label:before {
		content: "✘";
		font-weight: bold;
		color: red;
		padding-right: 5px;
	}
	.item .v2 {
		font-weight: bold;
		color: #00aae2;
		padding-left: 5px;
		display: inline-block;
	}
</style>