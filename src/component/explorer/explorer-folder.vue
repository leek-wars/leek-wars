<template lang="html">
	<div class="folder">
		<v-icon class="icon">mdi-folder-outline</v-icon>
		<div class="name">
			<v-icon v-if="folder.id === -1">mdi-arrow-left</v-icon>
			{{ folder.name }}
		</div>
	</div>
</template>

<script lang="ts">
	import { fileSystem } from '@/model/filesystem'
	import { LeekWars } from '@/model/leekwars'
	import { Component, Prop, Vue } from 'vue-property-decorator'
	import { Folder } from '../editor/editor-item'

	@Component({ name: 'explorer-folder', i18n: {} })
	export default class ExplorerFolder extends Vue {
		@Prop() folder!: Folder
		fileSystem = fileSystem
	}
</script>

<style lang="scss" scoped>
	.folder {
		text-align: center;
		cursor: pointer;
		padding: 5px;
		height: 135px;
		width: 100%;
		border: 1px solid #ccc;
		border-radius: 4px;
		overflow: hidden;
		&:hover {
			background: white;
			box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
		}
	}
	.icon {
		font-size: 66px;
		padding-top: 12px;
		color: #666;
	}
	.name {
		text-overflow: ellipsis;
		user-select: none;
		overflow: hidden;
		padding: 0 2px;
	}
</style>
