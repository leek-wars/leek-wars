<template lang="html">
	<div>
		<div ref="ai" :class="{modified: ai.modified, selected: ai.selected}" class="item ai" @click="click" @contextmenu.prevent.stop="$root.$emit('editor-menu', ai, true, $event)">
			<div :style="{'padding-left': (level * 15 + 15) + 'px'}" class="label" :class="{error: ai.errors, warning: ai.warnings}" draggable="true" @dragstart="dragstart">
				<v-icon v-if="ai.errors" class="icon error">mdi-close-circle</v-icon>
				<v-icon v-else-if="ai.warnings" class="icon warning">mdi-alert-circle</v-icon>
				<v-icon v-else class="icon valid">mdi-check-bold</v-icon>
				<span class="text">{{ ai.name }}</span>
				<span v-if="ai.errors" class="count error">{{ ai.errors }}</span>
				<span v-if="ai.warnings" class="count warning">{{ ai.warnings }}</span>
				<span v-if="ai.todos" class="count todo">{{ ai.todos }}</span>
				<tooltip v-if="ai.v2">
					<template v-slot:activator="{ on }">
						<span class="v2" v-on="on">V2</span>
					</template>
					{{ $t('editor.v2_beta_message') }}
				</tooltip>
			</div>
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

		get ai() { return this.item.ai }

		dragstart(e: DragEvent) {
			e.dataTransfer!.setData('text/plain', 'drag !!!')
			this.$root.$emit('editor-drag', this.item)
			e.stopPropagation()
		}
		click(e: Event) {
			this.$router.push('/editor/' + this.ai.id)
			e.stopPropagation()
		}
	}
</script>

<style lang="scss" scoped>
	.item {
		cursor: pointer;
		color: #333;
	}
	.item.dragging {
		opacity: 1;
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
	#app.app .item .label {
		padding: 8px 10px;
	}
	.item .label:hover {
		background: white;
	}
	.item.selected > .label {
		background: #ddd;
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