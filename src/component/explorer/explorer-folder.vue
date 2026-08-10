<template lang="html">
	<div class="folder">
		<v-icon class="icon">mdi-folder-outline</v-icon>
		<div class="name">
			<v-icon v-if="folder.id === -1">mdi-arrow-left</v-icon>
			{{ folder.name }}
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Folder } from '../editor/editor-item'
import { mixins } from '@/model/i18n'

defineOptions({ name: 'ExplorerFolder', i18n: {}, mixins: [...mixins] })

defineProps<{
	folder: Folder
}>()
</script>

<style lang="scss" scoped>
	.folder {
		text-align: center;
		cursor: pointer;
		padding: 5px;
		height: 135px;
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		&:hover {
			background: var(--pure-white);
			box-shadow: var(--elevation-1);
		}
	}
	.icon {
		font-size: 66px;
		padding-top: 12px;
		color: var(--grey-5);
	}
	.name {
		text-overflow: ellipsis;
		user-select: none;
		overflow: hidden;
		padding: 0 2px;
	}
</style>
